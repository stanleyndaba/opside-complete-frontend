#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const frontendAudit = fs.readFileSync(path.join(root, 'src/pages/audit.tsx'), 'utf8');
const frontendApi = fs.readFileSync(path.join(root, 'src/lib/api.ts'), 'utf8');
const dataUpload = fs.readFileSync(path.join(root, 'src/pages/DataUpload.tsx'), 'utf8');
const backendAudit = fs.readFileSync('/home/ubuntu/Clario-Complete-Backend/Integrations-backend/src/services/auditRunService.ts', 'utf8');

let assertions = 0;
function expect(condition, message) {
  assertions += 1;
  if (!condition) throw new Error(`Assertion ${assertions} failed: ${message}`);
}

expect(frontendAudit.includes('selectedAuditIsLatest ? \'Latest audit\' : \'Selected audit from history\''), 'selected and latest audit identity is explicit');
expect(frontendAudit.includes('setIsScopeDialogOpen(true)'), 'View Audit scope opens the dedicated Scope panel');
expect(frontendAudit.includes('What Margin examined'), 'scope panel explains what the selected audit examined');
expect(frontendAudit.includes('It does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter.'), 'scope panel preserves the truth boundary');
expect(frontendAudit.includes('scheduleOperating') && frontendAudit.includes('Last automatic audit completed'), 'schedule renders durable operating state');
expect(frontendAudit.includes('Amazon connection:') && frontendAudit.includes('Connect Amazon') && frontendAudit.includes('Notifications'), 'schedule identifies connection dependency, repair path, and in-app notification destination');
expect(frontendAudit.includes("['All', 'Audit', 'Coverage', 'Analysis', 'Result']"), 'activity uses seller lifecycle filters');
expect(frontendAudit.includes('browser-generated record for') && frontendAudit.includes('Margin does not retain a copy or send it by email'), 'export preserves browser-only delivery and record purpose');
expect(frontendAudit.includes('Potential recovery scope') && frontendAudit.includes('Potential opportunities'), 'result labels do not overstate recovery certainty');
expect(frontendApi.includes('export interface AuditScheduleOperatingState'), 'frontend API has operating-state type');
expect(frontendApi.includes('operating: AuditScheduleOperatingState') && frontendApi.includes('amazon: { connected: boolean }'), 'schedule API contract includes operating state and connection readiness');
expect(!dataUpload.includes('const [dateRange, setDateRange]'), 'manual report flow no longer presents an unpersisted audit-period selector');
expect(dataUpload.includes('Manual report audit') && dataUpload.includes('Evidence Records—not this operational report flow'), 'manual report flow distinguishes operational reports from evidence documents');
expect(backendAudit.includes('private async getScheduleOperatingState'), 'backend derives schedule operating state from persisted data');
expect(backendAudit.includes("state: 'awaiting_first_run'") && backendAudit.includes("state: 'blocked'"), 'schedule read model distinguishes initial and blocked lifecycle states');
expect(backendAudit.includes("category: 'Audit'") && backendAudit.includes("category: 'Coverage'") && backendAudit.includes("category: 'Analysis'") && backendAudit.includes("category: 'Result'"), 'backend activity projection uses seller lifecycle categories');
expect(backendAudit.includes('const amazon = { connected: Boolean(await this.getAmazonConnection(userId, tenantId)) };') && backendAudit.includes('operating, amazon'), 'schedule response exposes tenant-bound connection readiness');

console.log(`PASS ${assertions} assertions — Audit experience product contract`);
