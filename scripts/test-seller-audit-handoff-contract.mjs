import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const consent = read('src/pages/ReviewConsent.tsx');
const handoff = read('src/pages/SellerAuditHandoff.tsx');
const api = read('src/lib/api.ts');

function requireMatch(source, expression, description) {
  if (!expression.test(source)) throw new Error(`Seller audit handoff contract failed: ${description}`);
}

function requireAbsent(source, expression, description) {
  if (expression.test(source)) throw new Error(`Seller audit handoff contract failed: ${description}`);
}

requireMatch(consent, /Amazon records you provide[\s\S]*?read-only Amazon SP-API access/, 'consent must describe seller-provided records and scoped read-only SP-API access');
requireMatch(consent, /Accounting software access is not assumed or required/, 'consent must not assume accounting-software access');
requireMatch(consent, /No recovery claim will be submitted without your approval/, 'consent must preserve seller approval authority');
requireMatch(consent, /disabled=\{!understood\}[\s\S]*?navigate\('\/audit-start'\)/, 'consent must be required before continuing');

requireMatch(handoff, /response\.ok && response\.data\?\.lead_id && response\.data\?\.handoff_token/, 'Dropbox handoff must require a successful intake lead and handoff token');
requireMatch(handoff, /Dropbox will remain unavailable until the intake is recorded/, 'intake failure must block Dropbox and explain why');
requireMatch(handoff, /Retry intake/, 'intake failure must provide a retry action');
requireAbsent(handoff, /You can still upload your files/, 'intake failure must not offer an unrecorded Dropbox fallback');
requireMatch(handoff, /within <strong>48 hours of verified receipt, including weekends<\/strong>/, 'completion copy must start the response clock at verified receipt');
requireMatch(handoff, /does not yet confirm that Margin has received or verified your files/, 'seller confirmation must remain distinct from verified receipt');
requireMatch(handoff, /No recovery claims will be submitted and no further paid work will begin without your approval/, 'completion copy must preserve approval boundaries');
requireAbsent(handoff, /files_received_verified/, 'public seller flow must not mark manual receipt verification itself');

requireMatch(api, /status: 'upload_opened' \| 'upload_confirmed' \| 'files_received_verified'/, 'API client must know all intake statuses');
requireMatch(api, /verifySellerAuditReceipt[\s\S]*?status: 'files_received_verified'/, 'authorized operator API must be able to record verified receipt');

console.log('Seller audit handoff contract checks passed.');
