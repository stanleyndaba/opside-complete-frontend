#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const frontendAudit = fs.readFileSync(path.join(root, 'src/pages/audit.tsx'), 'utf8');
const frontendApi = fs.readFileSync(path.join(root, 'src/lib/api.ts'), 'utf8');
const dataUpload = fs.readFileSync(path.join(root, 'src/pages/DataUpload.tsx'), 'utf8');
const notificationHub = fs.readFileSync(path.join(root, 'src/pages/NotificationHub.tsx'), 'utf8');
const backendAudit = fs.readFileSync('/home/ubuntu/Clario-Complete-Backend/Integrations-backend/src/services/auditRunService.ts', 'utf8');
const auditTopbar = frontendAudit.slice(frontendAudit.indexOf('{/* Persistent audit context */}'), frontendAudit.indexOf('{/* Content area */}'));

let assertions = 0;
function expect(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`Assertion ${assertions} failed: ${message}`);
}

expect(frontendAudit.includes('selectedAuditIsLatest ? \'Latest audit\' : \'Selected audit from history\''), 'selected and latest audit identity is explicit');
expect(!auditTopbar.includes('setSidebarOpen(true)') && !auditTopbar.includes('openAuditLog'), 'Audit top bar does not duplicate the sidebar control or Activity action');
expect(dataUpload.includes('Back to Audit') && dataUpload.includes('Manual report audit') && dataUpload.includes('Operational reports') && dataUpload.includes('Connect Amazon from Audit'), 'Data Upload uses a balanced workflow header with return, context, and connection action');
expect(!dataUpload.includes('absolute left-1/2 -translate-x-1/2'), 'Data Upload header avoids the isolated absolute-centered brand layout');
expect(frontendAudit.includes('title={selectedAuditSelectorLabel}') && frontendAudit.includes('overflow-hidden whitespace-nowrap') && frontendAudit.includes('<span className="min-w-0 flex-1 truncate">{selectedAuditSelectorLabel}</span>'), 'sidebar audit selector keeps long labels contained on one line while retaining the full label on hover');
expect(frontendAudit.includes('setIsScopeDialogOpen(true)'), 'View Audit scope opens the dedicated Scope panel');
expect(frontendAudit.includes('What Margin examined'), 'scope panel explains what the selected audit examined');
expect(frontendAudit.includes('It does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter.'), 'scope panel preserves the truth boundary');
expect(frontendAudit.includes('scheduleOperating') && frontendAudit.includes('Last automatic audit completed'), 'schedule renders durable operating state');
expect(frontendAudit.includes('Amazon connection:') && frontendAudit.includes('Connect Amazon') && frontendAudit.includes('Notifications'), 'schedule identifies connection dependency, repair path, and in-app notification destination');
expect(frontendAudit.includes("['All', 'Audit', 'Coverage', 'Analysis', 'Result']"), 'activity uses seller lifecycle filters');
expect(frontendAudit.includes('browser-generated record for') && frontendAudit.includes('Margin does not retain a copy or send it by email'), 'export preserves browser-only delivery and record purpose');
expect(frontendAudit.includes("new jsPDF({ unit: 'mm', format: 'a4' })") && frontendAudit.includes('AUDIT REVIEW BRIEF') && frontendAudit.includes('drawDocumentHeader'), 'export uses a controlled A4 audit-review document hierarchy');
expect(frontendAudit.includes('Potential opportunity scope') && frontendAudit.includes('Potential opportunity summaries') && frontendAudit.includes('REVIEW BOUNDARY'), 'export distinguishes potential scope, recorded findings, and the non-conclusive review boundary');
expect(frontendAudit.includes('pageCount = doc.getNumberOfPages()') && frontendAudit.includes('AUDIT ${audit.id.slice(0, 8).toUpperCase()}'), 'export includes auditable page footer and pagination context');
expect(frontendAudit.includes('Potential recovery scope') && frontendAudit.includes('Potential opportunities'), 'result labels do not overstate recovery certainty');
expect(frontendApi.includes('export interface AuditScheduleOperatingState'), 'frontend API has operating-state type');
expect(frontendApi.includes('operating: AuditScheduleOperatingState') && frontendApi.includes('amazon: { connected: boolean }'), 'schedule API contract includes operating state and connection readiness');
expect(!dataUpload.includes('const [dateRange, setDateRange]'), 'manual report flow no longer presents an unpersisted audit-period selector');
expect(dataUpload.includes('Manual report audit') && dataUpload.includes('Evidence Records—not this operational report flow'), 'manual report flow distinguishes operational reports from evidence documents');
expect(dataUpload.includes('getEvidenceRecordsHref') && dataUpload.includes('/evidence-locker') && dataUpload.includes('Go to Evidence Records'), 'manual report flow offers a tenant-scoped route to the correct Evidence Records destination');
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

console.log(`PASS ${assertions} assertions — Audit experience product contract`);
