import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSync } from 'esbuild';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sourcePath = path.join(projectRoot, 'src/lib/systemSignalRoutes.ts');
const outputPath = path.join(os.tmpdir(), `margin-system-signal-routes-${process.pid}.mjs`);

const openSignal = ({ actionType, actionRoute }) => ({
  system_signal_id: 'signal-test',
  signal_event_type: 'test.event',
  signal_state: 'open',
  action_state: 'pending',
  signal_action_type: actionType,
  signal_action_route: actionRoute,
});

try {
  buildSync({
    entryPoints: [sourcePath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: outputPath,
    logLevel: 'silent',
  });

  const { getSystemSignalActionLabel, resolveSystemSignalHref } = await import(pathToFileURL(outputPath).href);
  const tenantSlug = 'margin-test';

  const audit = openSignal({
    actionType: 'review_audit',
    actionRoute: { target: 'audit', objectType: 'audit_run', objectId: 'audit-123', action: 'review_audit', fallbackTarget: 'notifications' },
  });
  assert.equal(resolveSystemSignalHref(audit, tenantSlug), '/audit?auditId=audit-123', 'audit signal must use its controlled audit-ID deep link');
  assert.equal(getSystemSignalActionLabel(audit), 'Review audit', 'audit signal must expose a seller-readable action label');

  const evidenceRequest = openSignal({
    actionType: 'review_evidence',
    actionRoute: { target: 'case', objectType: 'dispute_case', objectId: 'case-123', action: 'review_evidence', fallbackTarget: 'notifications' },
  });
  assert.equal(resolveSystemSignalHref(evidenceRequest, tenantSlug), '/app/margin-test/cases/case-123', 'evidence request must route to its exact case');
  assert.equal(getSystemSignalActionLabel(evidenceRequest), 'Review case', 'evidence request must expose a clear case-review action label');

  const unsafe = openSignal({
    actionType: 'review_audit',
    actionRoute: { target: 'audit', objectType: 'dispute_case', objectId: 'case-123', action: 'review_audit', fallbackTarget: 'notifications' },
  });
  assert.equal(resolveSystemSignalHref(unsafe, tenantSlug), '/app/margin-test/notifications', 'unsupported route descriptors must fall back to the notification hub');

  console.log('SYSTEM_SIGNAL_ROUTE_RESOLVER_TEST_PASS');
} finally {
  fs.rmSync(outputPath, { force: true });
}
