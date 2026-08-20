import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const auditSource = readFileSync(new URL('../src/pages/audit.tsx', import.meta.url), 'utf8');
const helperMatch = auditSource.match(/function formatDuration\([\s\S]*?\n}\n\nfunction getErrorMessage/);

assert.ok(helperMatch, 'audit.tsx must define the local formatDuration helper before getErrorMessage.');
assert.match(
  auditSource,
  /formatDuration\(audit\?\.completed_at, audit\?\.started_at\)/,
  'completed Audit duration must use the fail-safe formatter.'
);
assert.match(auditSource, /Activate Workspace/, 'completed eligible Audit must retain the Workspace activation control.');
assert.match(auditSource, /Continue to Secure Checkout/, 'completed eligible Audit must retain the secure-checkout control.');

const helperSource = helperMatch[0].replace(/\n\nfunction getErrorMessage$/, '');
const transformed = transformSync(`${helperSource}\nexport { formatDuration };`, {
  loader: 'ts',
  format: 'esm',
  target: 'es2020',
}).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;
const { formatDuration } = await import(moduleUrl);

assert.equal(
  formatDuration('2026-08-20T00:58:28.821Z', '2026-08-20T00:58:20.101Z'),
  '8s',
  'valid completed Audit timestamps must render a duration.'
);
assert.equal(formatDuration('not-a-date', '2026-08-20T00:58:20.101Z'), '—');
assert.equal(formatDuration(undefined, '2026-08-20T00:58:20.101Z'), '—');
assert.equal(formatDuration('2026-08-20T00:58:20.101Z', '2026-08-20T00:58:20.101Z'), '—');
assert.equal(formatDuration('2026-08-20T00:58:20.000Z', '2026-08-20T00:58:21.000Z'), '—');
assert.equal(formatDuration('2026-08-20T01:00:20.000Z', '2026-08-20T00:00:20.000Z'), '1h');

console.log('Completed Audit duration formatting regression checks passed.');
