import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/lib/auditExperienceDecision.ts');
const auditPageSource = fs.readFileSync(path.join(root, 'src/pages/audit.tsx'), 'utf8');
const compiler = path.join(root, 'node_modules/.bin/tsc');
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'margin-audit-experience-'));

const base = {
  isAuthenticationResolving: false,
  isAuthenticated: true,
  step: 'ready',
  hasAudit: false,
  isManualAudit: false,
  amazon: null,
  isConnectionChecking: false,
  resultsUnavailable: false,
};

const connectedAmazon = {
  connected: true,
  needs_reconnect: false,
  status: 'connected',
};

const disconnectedAmazon = {
  connected: false,
  needs_reconnect: false,
  status: 'connection_required',
};

const reconnectAmazon = {
  connected: false,
  needs_reconnect: true,
  status: 'reconnect_required',
};

try {
  execFileSync(compiler, [
    source,
    '--target', 'ES2022',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--outDir', outputDir,
    '--skipLibCheck',
  ], { stdio: 'inherit' });

  const compiled = path.join(outputDir, 'auditExperienceDecision.js');
  const { getAuditExperienceDecision, getAuditScheduleDecision } = await import(pathToFileURL(compiled).href);
  let assertions = 0;
  const expect = (condition, message) => {
    assertions += 1;
    assert.equal(condition, true, message);
  };
  const decision = (overrides = {}) => getAuditExperienceDecision({ ...base, ...overrides });

  const resolvingDecision = decision({ isAuthenticationResolving: true, isAuthenticated: false });
  expect(resolvingDecision.primaryAction === 'wait_for_auth', 'Clerk loading does not enter the public account-start path');
  expect(resolvingDecision.primaryLabel === 'Checking your secure session', 'Clerk loading has an explicit seller-readable session state');
  expect(resolvingDecision.primaryLabel !== 'Start free audit', 'Clerk loading never exposes the public Audit CTA');

  const publicDecision = decision({ isAuthenticated: false });
  expect(publicDecision.primaryAction === 'start_account', 'genuinely unauthenticated sellers start an account-backed audit journey after session resolution');
  expect(publicDecision.secondaryAction === 'upload_reports', 'unauthenticated sellers retain the independent manual-report option');

  const checkingDecision = decision({ isConnectionChecking: true });
  expect(checkingDecision.primaryAction === 'check_connection', 'loading state does not assume Amazon connection truth');
  expect(checkingDecision.primaryLabel === 'Checking Amazon connection', 'loading state is seller-readable and specific');

  const unavailableDecision = decision();
  expect(unavailableDecision.primaryAction === 'check_connection', 'unavailable connection state offers a safe status refresh');
  expect(unavailableDecision.title.includes('cannot verify Amazon access'), 'unavailable connection state explains why no audit starts');

  const disconnectedDecision = decision({ amazon: disconnectedAmazon });
  expect(disconnectedDecision.primaryAction === 'connect_amazon', 'disconnected Amazon produces a contextual connect action');
  expect(disconnectedDecision.secondaryAction === 'upload_reports', 'disconnected Amazon preserves the manual report rail');
  expect(disconnectedDecision.description.includes('read-only access'), 'disconnected copy explains the actual access required');

  const connectedDecision = decision({ amazon: connectedAmazon });
  expect(connectedDecision.primaryAction === 'start_audit', 'connected first-time seller starts an Audit rather than OAuth');
  expect(connectedDecision.primaryLabel === 'Start audit', 'connected first-time CTA is unambiguous');

  const reconnectDecision = decision({ amazon: reconnectAmazon });
  expect(reconnectDecision.primaryAction === 'connect_amazon', 'reconnect-required state uses the existing contextual connection action');
  expect(reconnectDecision.primaryLabel === 'Reconnect Amazon', 'reconnect CTA is truthful');

  const returnedAmazonDecision = decision({ step: 'connect', hasAudit: true, amazon: connectedAmazon });
  expect(returnedAmazonDecision.primaryAction === 'continue_audit', 'authoritatively confirmed Amazon return continues the existing Audit');
  expect(returnedAmazonDecision.primaryLabel === 'Continue audit', 'authoritatively confirmed Amazon return does not restart or reconnect');

  const existingDisconnectedDecision = decision({ step: 'connect', hasAudit: true, amazon: disconnectedAmazon });
  expect(existingDisconnectedDecision.primaryAction === 'connect_amazon', 'an existing Audit requiring Amazon keeps a contextual reconnect action');

  const existingReadyDecision = decision({ hasAudit: true, amazon: connectedAmazon });
  expect(existingReadyDecision.primaryAction === 'continue_audit', 'existing ready Audit is continued rather than restarted');
  expect(existingReadyDecision.primaryLabel === 'Continue audit', 'existing ready Audit CTA preserves continuity');

  const activeDecision = decision({ step: 'syncing', hasAudit: true, amazon: connectedAmazon });
  expect(activeDecision.primaryAction === 'check_progress', 'active sync does not expose an OAuth or restart CTA');
  expect(activeDecision.primaryLabel === 'Check audit progress', 'active sync has an inspectable progress action');

  const detectingDecision = decision({ step: 'detecting', hasAudit: true, amazon: connectedAmazon });
  expect(detectingDecision.primaryAction === 'check_progress', 'active analysis retains progress-only action');

  const completedDecision = decision({ step: 'completed', hasAudit: true, amazon: connectedAmazon });
  expect(completedDecision.primaryAction === 'review_results', 'completed Audit directs the seller to recorded results');
  expect(completedDecision.primaryLabel === 'Review results', 'completed Audit CTA does not imply rerunning work');

  const resultUnavailableDecision = decision({ step: 'completed', hasAudit: true, amazon: connectedAmazon, resultsUnavailable: true });
  expect(resultUnavailableDecision.primaryAction === 'reload_result', 'unavailable completed result fails closed with a reload action');
  expect(resultUnavailableDecision.description.includes('cannot show a recommendation'), 'unavailable result does not expose a commercial recommendation');

  const failedDecision = decision({ step: 'failed', hasAudit: true, amazon: connectedAmazon });
  expect(failedDecision.primaryAction === 'retry_audit', 'failed Audit uses an existing-record retry action');
  expect(failedDecision.secondaryAction === 'upload_reports', 'failed SP-API Audit offers the independent report option');

  const manualActiveDecision = decision({ step: 'detecting', hasAudit: true, isManualAudit: true, amazon: null });
  expect(manualActiveDecision.primaryAction === 'check_progress', 'manual Audit progress does not require Amazon truth');
  expect(!manualActiveDecision.secondaryAction, 'manual Audit in progress does not prompt OAuth or redundant upload');

  const manualFailedDecision = decision({ step: 'failed', hasAudit: true, isManualAudit: true, amazon: null });
  expect(manualFailedDecision.primaryAction === 'upload_reports', 'manual failed Audit directs seller to report intake, not Amazon OAuth');
  expect(manualFailedDecision.primaryWhy.includes('Amazon authorization is not required'), 'manual failed state explicitly preserves independent rail');

  const manualCompletedDecision = decision({ step: 'completed', hasAudit: true, isManualAudit: true, amazon: null });
  expect(manualCompletedDecision.primaryAction === 'review_results', 'manual completed Audit directs seller to report results');

  const manualScheduleActive = getAuditScheduleDecision({ isManualAudit: true, step: 'detecting', amazonConnected: false });
  expect(manualScheduleActive.action === 'check_progress', 'manual Audit plus disconnected Amazon keeps the schedule action on recorded report progress');
  expect(manualScheduleActive.action !== 'connect_amazon', 'manual Audit plus disconnected Amazon cannot request OAuth from Schedule');
  expect(manualScheduleActive.connectionLabel.startsWith('Manual report audit:'), 'manual Schedule state does not claim Amazon connection is required');

  const manualScheduleFailed = getAuditScheduleDecision({ isManualAudit: true, step: 'failed', amazonConnected: false });
  expect(manualScheduleFailed.action === 'upload_reports', 'failed manual Audit keeps Schedule on the report workflow');

  const manualScheduleCompleted = getAuditScheduleDecision({ isManualAudit: true, step: 'completed', amazonConnected: false });
  expect(manualScheduleCompleted.action === 'review_results', 'completed manual Audit keeps Schedule on recorded results');

  const spApiScheduleDisconnected = getAuditScheduleDecision({ isManualAudit: false, step: 'ready', amazonConnected: false });
  expect(spApiScheduleDisconnected.action === 'connect_amazon', 'SP-API Audit plus disconnected Amazon retains intentional Schedule connection behavior');
  expect(spApiScheduleDisconnected.actionLabel === 'Connect Amazon', 'SP-API Schedule CTA remains explicit about the required connection');

  expect(!auditPageSource.includes("get('amazon_connected')") && !auditPageSource.includes('get("amazon_connected")'), 'forged Amazon connection URL markers cannot establish Audit connection state');
  expect(auditPageSource.includes("await connectAmazonForAudit(response.data.audit, response.data.tenant.slug);") && auditPageSource.includes("case 'connect_amazon':"), 'disconnected first visit receives an Audit-owned contextual connection path');
  expect(auditPageSource.includes("case 'check_connection':") && auditPageSource.includes('setConnectionRevision((value) => value + 1)'), 'unavailable connection state has a safe authoritative retry rather than a query-driven assumption');
  expect(!auditPageSource.includes("'/connect-amazon'"), 'no Audit-page interaction starts a standalone Amazon connection route');
  expect(auditPageSource.includes('isAuthenticationResolving') && auditPageSource.includes("case 'wait_for_auth':") && auditPageSource.includes("primaryAction === 'wait_for_auth'"), 'Audit renders and disables an explicit session-resolution state before public account actions');
  expect(auditPageSource.includes('getAuditScheduleDecision({') && auditPageSource.includes('const handleScheduleDecision = () =>') && auditPageSource.includes("case 'check_progress':\n        reloadRecordedResult();") && auditPageSource.includes("case 'connect_amazon':\n        void connectAmazon();"), 'Schedule dispatches the shared manual-safe action policy into established Audit behaviors');

  console.log(`PASS ${assertions} assertions — Audit experience decision policy`);
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
