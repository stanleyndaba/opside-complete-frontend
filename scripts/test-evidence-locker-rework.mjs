import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const apiSource = read('src/lib/api.ts');
const lockerSource = read('src/pages/EvidenceLocker.tsx');
const caseDetailSource = read('src/pages/CaseDetail.tsx');
const inspectionSource = read('src/components/evidence/ParsingStatus.tsx');

const assertions = [];
const check = (condition, description) => {
  assert.ok(condition, description);
  assertions.push(description);
};

check(apiSource.includes('uploadDocuments: (files: File[], tenantSlug?: string)'), 'manual upload is exposed through the typed frontend API client');
check(apiSource.includes('/api/documents/upload?tenantSlug=${encodeURIComponent(tenantSlug)}'), 'upload is tenant-scoped and uses the verified document route');
check(apiSource.includes('archiveDocument: (documentId: string, reason: string, tenantSlug?: string)'), 'archive is exposed through the frontend API client');
check(apiSource.includes('supersedeDocument: (documentId: string, replacementDocumentId: string, tenantSlug?: string)'), 'replacement lineage is exposed through the frontend API client');

check(lockerSource.includes('api.uploadDocuments(files, activeSlug)'), 'Evidence Locker uses the restored upload contract');
check(lockerSource.includes('api.archiveDocument(selectedDoc.id'), 'Evidence Locker archives rather than hard-deletes artifacts');
check(lockerSource.includes('api.supersedeDocument(replacementFor.id'), 'Evidence Locker records replacement lineage after storing a replacement artifact');
check(lockerSource.includes('Full inspection'), 'Evidence Locker connects to the existing richer document inspection path');
check(lockerSource.includes('Reconstructed from recorded events'), 'audit history is bounded as reconstructed recorded history');
check(lockerSource.includes('What this does not establish'), 'artifact inspection explicitly declares the truth boundary');
check(lockerSource.includes('A parsed artifact, a recorded recovery relationship, and case-level proof are different states.'), 'parsed, linked, and proof states remain distinct');
check(lockerSource.includes('total: documents.length'), 'displayed document metric is calculated from the rendered document dataset');
check(lockerSource.includes('linked: documents.filter((doc) => doc.linked_case_count > 0).length'), 'displayed linked metric is calculated from the rendered document dataset');
check(!lockerSource.includes('DEMO_DOCUMENT_ROWS'), 'fixture rows are not merged into the authenticated Evidence Locker dataset');
check(!lockerSource.includes('Verified for Amazon Support'), 'unsupported verified-for-support language is absent');
check(!lockerSource.includes('Ready for reimbursement support'), 'unsupported reimbursement-readiness language is absent');
check(!lockerSource.includes('Directly supports this recovery'), 'unqualified direct-support language is absent');
check(!lockerSource.includes('api.deleteDocument('), 'the page cannot invoke a destructive document delete client');
check(inspectionSource.includes('Artifact processing'), 'full inspection presents a seller-facing artifact-processing surface');
check(inspectionSource.includes('confidence in recorded artifact details only.'), 'inspection bounds extraction confidence away from proof and recovery conclusions');
check(inspectionSource.includes('It does not establish proof, relationship strength, reimbursement eligibility, payment, a financial conclusion, or closure.'), 'inspection explicitly retains the Evidence Locker truth boundary');
check(inspectionSource.includes('The original artifact and its recorded provenance remain available.'), 'inspection preserves provenance language when details are unavailable');
check(!inspectionSource.includes('>FULL_PARSE_COMPLETE<'), 'inspection does not render internal full-parse status codes');
check(!inspectionSource.includes('>PARTIAL_PARSE_READY<'), 'inspection does not render internal partial-parse status codes');
check(!inspectionSource.includes('>EXTRACTION_ACTIVE<'), 'inspection does not render internal extraction status codes');
check(!inspectionSource.includes('>FAILED_DURABLE<'), 'inspection does not render internal durable-failure status codes');
check(!inspectionSource.includes('>QUEUE_LOCKED<'), 'inspection does not render internal queue status codes');
check(!inspectionSource.includes('>NODE_OVERVIEW<'), 'inspection does not render internal node-console terminology');
check(!inspectionSource.includes('neural intelligence engine'), 'inspection does not expose internal intelligence-engine terminology');
check(!caseDetailSource.includes('Evidence Locker rework'), 'Case Detail remains outside the Evidence Locker implementation scope');

console.log(`Evidence Locker rework contract passed: ${assertions.length} assertions.`);
for (const description of assertions) console.log(`✓ ${description}`);
