import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';

const source = await readFile(new URL('../src/lib/authSession.ts', import.meta.url), 'utf8');

assert.match(
  source,
  /const token = await clerk\.session\.getToken\(\)\.catch\(\(\) => null\);/,
  'normal API requests must use Clerk token caching'
);
assert.doesNotMatch(
  source,
  /clerk\.session\.getToken\(\{\s*skipCache:\s*true\s*\}\)/,
  'normal API auth resolution must not force a Clerk session refresh per request'
);

console.log('PASS: shared API auth resolution uses Clerk cached session tokens');
