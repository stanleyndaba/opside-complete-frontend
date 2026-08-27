import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const api = readFileSync(resolve(root, 'src/lib/api.ts'), 'utf8');
const audit = readFileSync(resolve(root, 'src/pages/audit.tsx'), 'utf8');
const upload = readFileSync(resolve(root, 'src/pages/DataUpload.tsx'), 'utf8');

const requiredApiMarkers = [
  'export type ManualInputIssue',
  "'empty' | 'malformed' | 'ambiguous' | 'unsupported' | 'missing_required' | 'invalid_value' | 'prohibited'",
  'export interface ManualReportFileProcessing',
  'inputIssue?: ManualInputIssue;',
  'errorSummary?: string;',
  'export interface ManualReportProcessingSummary',
  'export type ManualCoverageStatus',
  'export interface ManualCoverageArea',
  'export interface ManualCoverageAssessment',
  "overallStatus: 'complete' | 'partial' | 'no_data';",
  "monetaryConclusion: 'within_covered_evidence' | 'unknown_outside_coverage';",
  'manualReport?: ManualReportProcessingSummary;',
  'manualCoverage?: ManualCoverageAssessment;',
  "export type CsvSubmissionDisposition = 'new' | 'mixed' | 'duplicate_reused';",
  'submissionDisposition?: CsvSubmissionDisposition;',
  'export interface ManualFileTemporalEvidence',
  "status: 'available' | 'partial' | 'unavailable';",
  "continuity: 'unknown';",
  'temporalEvidence?: ManualFileTemporalEvidence;',
  'export interface ManualTemporalCoverageAssessment',
  "overallStatus: 'partial' | 'no_usable_temporal_evidence';",
  "requestedPeriod: 'not_recorded';",
  'temporal: ManualTemporalCoverageAssessment;',
];

const requiredAuditMarkers = [
  'function hasManualReportCoverage',
  'function manualReportCoverageCopy',
  'function monetaryScopeCopy',
  'Training-only result. $0 is a noncommercial boundary, not a seller recovery conclusion.',
  'review-only item',
  'No qualifying monetary condition was detected in the available evidence; this does not establish that no recoveries exist.',
  "return audit?.source_type === 'csv_upload' || teaser.manualReport?.source === 'manual_upload';",
  'const isManualUploadAudit = hasManualReportCoverage(audit, teaser);',
  "selectedAuditParams.set('auditId', selectedAudit.id);",
  'savePendingAudit({',
  'Uploaded file processing',
  'isManualUploadAudit ? manualReportCoverageCopy(teaser)',
  'item.manualReport ? `${item.manualReport.filesProcessed.toLocaleString()} uploaded file',
  "Review the file-level processing details, correct rejected report rows or add missing report families, then run a new uploaded-report audit.",
  "Uploaded-report processing details were not recorded for this audit.",
  'SYNTHETIC TRAINING ONLY',
  'Evaluation coverage',
  'This valid partial report set supports only the areas shown below; unavailable or partial areas do not mean no finding exists.',
  'No usable uploaded rows were available. Areas below remain unknown rather than cleared.',
  'No monetary scope is established within the supplied evidence; conditions outside coverage remain unknown.',
  '$0 is not a recovery conclusion.',
  'No usable uploaded rows were available. Areas below remain unknown rather than cleared.',
  'No qualifying monetary condition was detected in the available evidence; this does not establish that no recoveries exist.',
  "teaser.manualCoverage.areas.map((area)",
  "area.status === 'supported' ? 'Evaluated' : area.status === 'partial' ? 'Limited' : 'Unavailable'",
  'function manualInputIssueLabel',
  'Malformed structure',
  'Ambiguous structure',
  'Unsupported structure',
  'Missing required evidence',
  'Invalid critical value',
  'Transfer evidence not accepted',
  "case 'prohibited'",
  'Margin did not use this file as evidence.',
  'Temporal evidence',
  'Accepted source dates span',
  'This records the supplied date span, not a continuous covered period.',
  'No usable dated evidence was available to establish coverage for this period.',
  'A requested audit period is not recorded for this upload, so conditions outside the represented dates remain unknown.',
  'Some supplied file date ranges overlap. Overlap is recorded; it does not itself create duplicate evidence, recovery scope, or continuous coverage.',
  'Date evidence:',
  'Continuous coverage is not inferred from event dates alone.',
  'teaser.manualCoverage?.temporal',
];


const requiredUploadMarkers = [
  'const safeInputIssueMessage',
  'const safeFileResultMessage',
  'The file structure could not be safely interpreted.',
  'The file contains conflicting or ambiguous evidence, so Margin did not choose a mapping.',
  'The file structure does not match a supported report family.',
  'A required header or critical field was missing.',
  'A critical value could not be safely interpreted.',
  'Transfer evidence, which Margin cannot accept while Transfer is OFF. It was not used for this audit.',
  "case 'prohibited'",
  "'Inventory', 'Financial events', 'Fees',",
  'Margin could not safely process this uploaded file.',
  'error: safeFileResultMessage(result) || undefined',
  'const isDuplicateFileResult',
  "status: 'pending' | 'uploading' | 'success' | 'duplicate' | 'error';",
  "isDuplicate ? 'Already processed'",
  'This file was already processed. Margin reused the existing evidence and did not create a second result.',
  "ingestion?.submissionDisposition === 'duplicate_reused'",
  'Reports already processed',
  'Margin reused the existing evidence and did not create a second audit result.',
];

for (const marker of requiredApiMarkers) {
  if (!api.includes(marker)) throw new Error(`Missing manual-report API contract marker: ${marker}`);
}
for (const marker of requiredAuditMarkers) {
  if (!audit.includes(marker)) throw new Error(`Missing audit read-model contract marker: ${marker}`);
}
for (const marker of requiredUploadMarkers) {
  if (!upload.includes(marker)) throw new Error(`Missing upload S3 source-contract marker: ${marker}`);
}
console.log('PASS audit read-model and S3/S4/S5/S6 upload source contract');
