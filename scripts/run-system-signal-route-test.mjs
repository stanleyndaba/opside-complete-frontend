import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const source = readFileSync(new URL('../src/lib/systemSignalRoutes.ts', import.meta.url), 'utf8');
const transformed = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2020' }).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;
const { getSystemSignalActionLabel, resolveSystemSignalHref } = await import(moduleUrl);

const approvalSignal = {
  system_signal_id: '00000000-0000-0000-0000-000000000001',
  signal_event_type: 'case.approval_required',
  signal_severity: 'action_required',
  signal_state: 'open',
  action_state: 'pending',
  signal_action_type: 'approve_filing',
  signal_action_route: {
    target: 'case', objectType: 'dispute_case', objectId: 'case-42', action: 'approve_filing', fallbackTarget: 'notifications'
  }
};
assert.equal(resolveSystemSignalHref(approvalSignal, 'trusted-workspace'), '/app/trusted-workspace/cases/case-42');
assert.equal(getSystemSignalActionLabel(approvalSignal), 'Review approval');

const deadlineSignal = {
  system_signal_id: '00000000-0000-0000-0000-000000000003',
  signal_event_type: 'deadline.critical',
  signal_severity: 'critical',
  signal_state: 'open',
  action_state: 'pending',
  signal_action_type: 'review_deadline',
  signal_action_route: {
    target: 'recovery', objectType: 'detection_result', objectId: 'finding-42', action: 'review_deadline', fallbackTarget: 'notifications'
  }
};
assert.equal(resolveSystemSignalHref(deadlineSignal, 'trusted-workspace'), '/app/trusted-workspace/resolve/finding-42');
assert.equal(getSystemSignalActionLabel(deadlineSignal), 'Review deadline');

const resolvedSignal = { ...approvalSignal, signal_state: 'resolved', action_state: 'completed' };
assert.equal(resolveSystemSignalHref(resolvedSignal, 'trusted-workspace'), '/app/trusted-workspace/notifications');
assert.equal(getSystemSignalActionLabel(resolvedSignal), null);

const unsafeSignal = {
  ...approvalSignal,
  signal_action_route: {
    target: 'case', objectType: 'dispute_case', objectId: 'case-42', action: 'approve_filing', fallbackTarget: 'not-a-valid-fallback', href: 'https://untrusted.example/redirect'
  }
};
assert.equal(resolveSystemSignalHref(unsafeSignal, 'trusted-workspace'), '/app/trusted-workspace/notifications');

const amazonReconnect = {
  system_signal_id: '00000000-0000-0000-0000-000000000002',
  signal_event_type: 'integration.amazon.authentication_invalid',
  signal_severity: 'critical',
  signal_state: 'open',
  action_state: 'pending',
  signal_action_type: 'reconnect_amazon',
  signal_action_route: {
    target: 'integration', objectType: 'integration_connection', objectId: 'amazon', action: 'reconnect_amazon', fallbackTarget: 'notifications'
  }
};
assert.equal(resolveSystemSignalHref(amazonReconnect, 'trusted-workspace'), '/app/trusted-workspace/integrations/reconnect/amazon');
assert.equal(getSystemSignalActionLabel(amazonReconnect), 'Reconnect Amazon');

console.log('System Signal route resolver checks passed.');
