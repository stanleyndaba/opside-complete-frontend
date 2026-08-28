#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

const api = source('src/lib/api.ts');
const upload = source('src/pages/DataUpload.tsx');
const audit = source('src/pages/audit.tsx');

const normalUpload = api.match(/ingestCsvReports:\s*\(files:[\s\S]*?\n\s*},\n\s*ingestSyntheticTrainingReports:/);
assert.ok(normalUpload, 'The normal CSV upload helper must be independently identifiable.');
assert.match(normalUpload[0], /requestJson<CsvIngestionResponse>\('\/api\/csv-upload\/ingest'/);
assert.doesNotMatch(
  normalUpload[0],
  /x-margin-execution-provenance|SYNTHETIC_TRAINING_ONLY|synthetic-training/,
  'The normal CSV upload helper must not carry synthetic provenance or use the synthetic endpoint.'
);

const syntheticUpload = api.match(/ingestSyntheticTrainingReports:\s*\(files:[\s\S]*?\n\s*},\n\s*getUserProfile:/);
assert.ok(syntheticUpload, 'The synthetic CSV upload helper must be independently identifiable.');
assert.match(syntheticUpload[0], /requestJson<CsvIngestionResponse>\('\/api\/csv-upload\/synthetic-training\/ingest'/);
assert.match(syntheticUpload[0], /'x-margin-execution-provenance':\s*'SYNTHETIC_TRAINING_ONLY'/);
assert.match(api, /executionProvenance\?:\s*'SYNTHETIC_TRAINING_ONLY'/);
assert.match(api, /trainingLabel\?:\s*'SYNTHETIC TRAINING ONLY'/);
assert.match(api, /commercialSuppressed\?:\s*boolean/);
assert.match(api, /const isSyntheticTrainingUpload\s*=\s*path\s*===\s*'\/api\/csv-upload\/synthetic-training\/ingest'/);
assert.match(api, /const safeAuthorizationCode\s*=\s*typeof data\?\.code\s*===\s*'string'/);
assert.match(api, /isSyntheticTrainingUpload && errorMsg/);
assert.match(api, /safeAuthorizationCode \? `\$\{safeAuthorizationCode\}: ` : ''/);
assert.match(api, /const \{ headers: _callerHeaders, \.\.\.requestOptions \} = options \|\| \{\}/);
assert.match(api, /fetch\(url, \{\s*\.\.\.requestOptions,[\s\S]*?headers: \{\s*\.\.\.baseHeaders,\s*\.\.\.callerHeaders,/);
assert.match(upload, /SYNTHETIC_S1_TRAINING_TENANT_SLUG\s*=\s*'margin-finance-3'/);
assert.match(upload, /UX visibility only\. The backend independently requires durable provenance/);
assert.match(upload, /isSyntheticTrainingWorkspace\s*=\s*isSignedIn\s*&&\s*getActiveTenantSlug\(\)\s*===\s*SYNTHETIC_S1_TRAINING_TENANT_SLUG/);
assert.match(upload, /const startManualAudit[\s\S]*?api\.ingestCsvReports\(selectedFiles\.map\(\(item\) => item\.file\)\)/);
assert.match(upload, /const startSyntheticS1[\s\S]*?if \(!isSyntheticTrainingWorkspace \|\| !tenantSlug\)[\s\S]*?api\.ingestSyntheticTrainingReports\(selectedFiles\.map\(\(item\) => item\.file\)\)/);
assert.match(upload, /type="file"/);
assert.match(upload, /Synthetic training only/);
assert.match(upload, /Run S1 synthetic audit/);

const manualSubmission = upload.match(/const startManualAudit[\s\S]*?const startSyntheticS1/);
assert.ok(manualSubmission, 'The normal manual-audit submission flow must remain independently identifiable.');
assert.match(manualSubmission[0], /ingestion\?\.manualAudit && continueManualAudit\(ingestion\.manualAudit, tenantSlug\)/);
assert.match(manualSubmission[0], /ingestion\?\.syncId[\s\S]*?restoreLatestManualAudit\(\)/);
assert.doesNotMatch(
  upload,
  /useEffect\([\s\S]*?restoreLatestManualAudit/,
  'Opening Data Upload must not automatically resume a historical CSV audit and redirect away from report selection.'
);

assert.match(audit, /teaser\.syntheticTraining \? \(/);
assert.match(audit, /aria-label="Synthetic training boundary"/);
assert.match(audit, /teaser\.trainingLabel \|\| 'SYNTHETIC TRAINING ONLY'/);
assert.match(audit, /Findings and values are not seller, provider, recovery, claim, payment, or commercial truth\./);
assert.match(audit, /Commercial, claim, notification, and financial effects are suppressed\./);

console.log('Synthetic-training frontend UI contract: PASS');
