import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const sourcePath = new URL('../src/lib/runtimeErrorRecovery.ts', import.meta.url);
const source = readFileSync(sourcePath, 'utf8');
const transformed = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;

const storage = new Map();
let replacedUrl = null;

globalThis.window = {
  location: {
    pathname: '/app/demo-workspace/recoveries',
    search: '?preserve=this',
    href: 'https://margin-finance.com/app/demo-workspace/recoveries?preserve=this',
    replace: (url) => { replacedUrl = url; },
  },
  sessionStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
};

const {
  isChunkLoadError,
  reloadForChunkError,
  shouldAutoReloadForChunkError,
} = await import(moduleUrl);

let assertions = 0;
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) throw new Error(message);
};

const deploymentError = new TypeError('Failed to fetch dynamically imported module: https://margin-finance.com/assets/Recoveries-old.js');
assert(isChunkLoadError(deploymentError), 'Dynamic module fetch failures must be recognised as chunk-load errors.');
assert(!isChunkLoadError(new Error('ordinary route error')), 'Non-chunk errors must not trigger a deployment recovery reload.');
assert(shouldAutoReloadForChunkError('route', deploymentError), 'The first chunk failure for a route must trigger recovery.');
assert(!shouldAutoReloadForChunkError('route', deploymentError), 'A repeated chunk failure on the same route must not create a reload loop.');

reloadForChunkError('route');
const recoveryUrl = new URL(replacedUrl);
assert(recoveryUrl.pathname === '/app/demo-workspace/recoveries', 'Recovery must retain the current route.');
assert(recoveryUrl.searchParams.get('preserve') === 'this', 'Recovery must retain non-recovery query context.');
assert(recoveryUrl.searchParams.has('__margin_chunk_recovery'), 'Recovery must add a cache-busting deployment nonce.');

replacedUrl = null;
reloadForChunkError('route', { allowAnotherAttempt: true });
assert(replacedUrl !== null, 'Manual recovery must navigate to a fresh document.');
assert(shouldAutoReloadForChunkError('route', deploymentError), 'Manual recovery must reset the one-time guard for a newly requested recovery attempt.');

console.log(`Runtime error recovery contract passed (${assertions} assertions).`);
