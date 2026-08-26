#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const frontendAudit = fs.readFileSync(path.join(root, 'src/pages/audit.tsx'), 'utf8');
const frontendApi = fs.readFileSync(path.join(root, 'src/lib/api.ts'), 'utf8');
const dataUpload = fs.readFileSync(path.join(root, 'src/pages/DataUpload.tsx'), 'utf8');
const notificationHub = fs.readFileSync(path.join(root, 'src/pages/NotificationHub.tsx'), 'utf8');
const backendAudit = fs.readFileSync('/home/ubuntu/Clario-Complete-Backend/Integrations-backend/src/services/auditRunService.ts', 'utf8');
const auditTopbar = frontendAudit.slice(frontendAudit.indexOf('<div className="sticky top-0'), frontendAudit.indexOf('<section className="flex-1'));
const auditPdfExport = frontendAudit.slice(frontendAudit.indexOf('const exportExecutiveSummary'), frontendAudit.indexOf('const loadAuditHistory'));

let assertions = 0;
function expect(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`Assertion ${assertions} failed: ${message}`);
}

expect(frontendAudit.includes('selectedAuditIsLatest ? \'Latest audit\' : \'Selected audit from history\''), 'selected and latest audit identity is explicit');
expect(frontendAudit.includes('max-w-6xl') && frontendAudit.includes('font-lora text-[38px]') && frontendAudit.includes('font-lora text-[26px]'), 'Audit uses a contextual operational workspace with Lora reserved for principal review headings');
expect(!auditTopbar.includes('setSidebarOpen(true)') && !auditTopbar.includes('openAuditLog') && !auditTopbar.includes('openScheduleDialog') && auditTopbar.includes('Use Amazon reports') && auditTopbar.includes('Export summary'), 'Audit context row contains only orientation, report intake, and export; the rail owns navigation actions');
expect(dataUpload.includes('title="Margin home"') && dataUpload.includes('/logoimagetwo.png') && dataUpload.includes('font-merriweather') && dataUpload.includes('Back to Audit'), 'Data Upload header uses the Margin logo and Merriweather wordmark with the return action on the opposite side');
expect(!dataUpload.includes('Manual report intake') && !dataUpload.includes('Operational reports') && !dataUpload.includes('>Evidence Records</span>'), 'Data Upload header removes the centered intake label and header-level Evidence Records control');
expect(dataUpload.includes('xl:grid-cols-[minmax(0,1fr)_300px]') && dataUpload.includes('Report intake') && dataUpload.includes('Intake context'), 'Data Upload separates the bounded intake surface from its responsive operational context panel');
expect(dataUpload.includes('font-lora text-[30px]') && !dataUpload.includes('absolute left-1/2 -translate-x-1/2'), 'Data Upload restores the Margin Lora display title without returning to the isolated centered-header treatment');
expect(frontendAudit.includes('title={selectedAuditSelectorLabel}') && frontendAudit.includes('overflow-hidden whitespace-nowrap') && frontendAudit.includes('<span className="min-w-0 flex-1 truncate">{selectedAuditSelectorLabel}</span>'), 'sidebar audit selector keeps long labels contained on one line while retaining the full label on hover');
expect(frontendAudit.includes('setIsScopeDialogOpen(true)'), 'View Audit scope opens the dedicated Scope panel');
expect(frontendAudit.includes('What Margin examined'), 'scope panel explains what the selected audit examined');
expect(frontendAudit.includes('It does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter.'), 'scope panel preserves the truth boundary');
expect(frontendAudit.includes('scheduleOperating') && frontendAudit.includes('Last automatic audit completed'), 'schedule renders durable operating state');
expect(frontendAudit.includes('Amazon connection:') && frontendAudit.includes('Connect Amazon') && frontendAudit.includes('Notifications'), 'schedule identifies connection dependency, repair path, and in-app notification destination');
expect(frontendAudit.includes("['All', 'Audit', 'Coverage', 'Analysis', 'Result']"), 'activity uses seller lifecycle filters');
expect(frontendAudit.includes('browser-generated record for') && frontendAudit.includes('Margin does not retain a copy or send it by email'), 'export preserves browser-only delivery and record purpose');
expect(frontendAudit.includes("new jsPDF({ unit: 'mm', format: 'a4' })") && auditPdfExport.includes('AUDIT RESULTS') && auditPdfExport.includes('drawDocumentHeader'), 'export uses a controlled A4 audit-results document hierarchy');
expect(auditPdfExport.includes("loadPdfAsset('/logoimagetwo.png')") && auditPdfExport.includes("loadPdfAsset('/fonts/Merriweather-Regular.ttf')") && auditPdfExport.includes("doc.text('Margin'"), 'export embeds the Margin logo and Merriweather wordmark');
expect(!auditPdfExport.includes('11, 116, 222') && !auditPdfExport.includes('255, 251, 235') && !auditPdfExport.includes('184, 134, 11'), 'export uses no blue or amber accents');
expect(frontendAudit.includes('Potential opportunity scope') && frontendAudit.includes('Potential opportunity summaries') && frontendAudit.includes('REVIEW BOUNDARY'), 'export distinguishes potential scope, recorded findings, and the non-conclusive review boundary');
expect(frontendAudit.includes('pageCount = doc.getNumberOfPages()') && frontendAudit.includes('AUDIT ${audit.id.slice(0, 8).toUpperCase()}'), 'export includes auditable page footer and pagination context');
expect(frontendAudit.includes('Potential recovery scope') && frontendAudit.includes('Potential opportunities'), 'result labels do not overstate recovery certainty');
expect(frontendApi.includes('export interface AuditScheduleOperatingState'), 'frontend API has operating-state type');
expect(frontendApi.includes('operating: AuditScheduleOperatingState') && frontendApi.includes('amazon: { connected: boolean }'), 'schedule API contract includes operating state and connection readiness');
expect(!dataUpload.includes('const [dateRange, setDateRange]'), 'manual report flow no longer presents an unpersisted audit-period selector');
expect(!dataUpload.includes('Evidence belongs elsewhere') && dataUpload.includes('Evidence documents stay in'), 'manual report flow removes the redundant Evidence card while retaining the evidence boundary');
expect(dataUpload.includes('getEvidenceRecordsHref') && dataUpload.includes('/evidence-locker') && dataUpload.includes('Evidence documents stay in') && dataUpload.includes('Evidence Records'), 'manual report flow offers a tenant-scoped route to the correct Evidence Records destination without an oversized side card');
expect(dataUpload.includes('CSV or TXT only') && dataUpload.includes('Up to 10 reports') && !dataUpload.includes('50MB each'), 'manual report intake states only the current file-format and report-count constraints');
expect(dataUpload.includes('Derived from accepted report content. There is no separate date-range selector.') && dataUpload.includes('Report family recognized automatically'), 'manual report intake preserves the audit-coverage and report-recognition truth boundary');
expect(dataUpload.includes('aria-live="polite"') && dataUpload.includes('aria-label={`Remove ${file.file.name}`}') && dataUpload.includes('Needs review'), 'manual report file review exposes accessible status and named removal controls');
expect(backendAudit.includes('private async getScheduleOperatingState'), 'backend derives schedule operating state from persisted data');
expect(backendAudit.includes("state: 'awaiting_first_run'") && backendAudit.includes("state: 'blocked'"), 'schedule read model distinguishes initial and blocked lifecycle states');
expect(backendAudit.includes("category: 'Audit'") && backendAudit.includes("category: 'Coverage'") && backendAudit.includes("category: 'Analysis'") && backendAudit.includes("category: 'Result'"), 'backend activity projection uses seller lifecycle categories');
expect(backendAudit.includes('const amazon = { connected: Boolean(await this.getAmazonConnection(userId, tenantId)) };') && backendAudit.includes('operating, amazon'), 'schedule response exposes tenant-bound connection readiness');
expect(frontendAudit.includes('auditHistoryError') && frontendAudit.includes('Retry history') && frontendAudit.includes('The audit shown on this page has not changed.'), 'history does not falsely present a failed read as an empty record and provides an in-context retry');
expect(frontendAudit.includes('auditLogError') && frontendAudit.includes('Retry lifecycle'), 'activity failures remain visible in context with a retry action');
expect(frontendAudit.includes('scheduleLoadError') && frontendAudit.includes('Retry schedule status') && frontendAudit.includes('No schedule change can be made until it is available.'), 'schedule failures prevent ambiguous or stale editing until workspace state is loaded');
expect(frontendAudit.includes('Understanding your audit') && frontendAudit.includes('Amazon account data') && frontendAudit.includes('Evidence records') && frontendAudit.includes('Reconciliation checks'), 'pre-result audit explanation uses seller-understandable terminology');
expect(!frontendAudit.includes('SP-API Node') && !frontendAudit.includes('Proof Synthesis') && !frontendAudit.includes('Financial Integrity') && !frontendAudit.includes('seven recovery detectors'), 'pre-result Audit UI does not expose internal or overreaching terms');
expect(notificationHub.includes('Audit completed — opportunities available for review') && notificationHub.includes('Audit needs additional data') && notificationHub.includes('formatSellerEventLabel'), 'audit notifications use seller-readable outcome and action labels');
expect(notificationHub.includes(".replace(/[._]+/g, ' ')") && !notificationHub.includes("eventType.replace(/\\./g, ' ')"), 'notification metadata does not expose internal dot or underscore separators');

expect(frontendAudit.includes('Audit history') && frontendAudit.includes('Audit activity') && frontendAudit.includes('Automatic audit schedule') && frontendAudit.includes('Export summary'), 'Audit provides complete, named history, activity, schedule, and export surfaces');
expect(frontendAudit.includes('Recorded audit review') && frontendAudit.includes('Recovery choices') && !frontendAudit.includes('Continuous Intelligence') && !frontendAudit.includes('Choose how Margin should help.'), 'Audit result review replaces the rejected inline commercial block with a bounded recorded-result decision surface');
expect(frontendAudit.includes('Continue from the audit record—not from an assumption.') && frontendAudit.includes('Seller authority') && frontendAudit.includes('Nothing is filed with Amazon without seller approval.'), 'Recovery Workspace drawer starts from recorded audit context and states seller authority explicitly');
expect(frontendAudit.includes('not a live event stream') && frontendAudit.includes('This preference does not guarantee a completed audit') && frontendAudit.includes('Margin does not retain a copy or send it by email'), 'activity, schedule, and export retain their operating boundaries after the redesign');

console.log(`PASS ${assertions} assertions — Audit experience product contract`);
