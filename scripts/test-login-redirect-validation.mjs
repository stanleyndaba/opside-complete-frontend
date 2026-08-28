import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src/lib/safeInternalRedirect.ts');
const compiler = path.join(root, 'node_modules/.bin/tsc');
const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'margin-safe-redirect-'));

try {
  execFileSync(compiler, [
    source,
    '--target', 'ES2022',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--outDir', outputDir,
    '--skipLibCheck',
  ], { stdio: 'inherit' });

  const compiled = path.join(outputDir, 'safeInternalRedirect.js');
  const { getSafeInternalNavigationPath } = await import(pathToFileURL(compiled).href);

  const accepted = new Map([
    ['/audit', '/audit'],
    ['/audit?auditId=123', '/audit?auditId=123'],
    ['/data-upload', '/data-upload'],
    ['/app', '/app'],
    ['/app/workspace/dashboard?tab=overview', '/app/workspace/dashboard?tab=overview'],
  ]);

  for (const [input, expected] of accepted) {
    assert.equal(getSafeInternalNavigationPath(input), expected, `expected safe internal path: ${input}`);
  }

  const rejected = [
    '//evil.example',
    '\\evil.example',
    '/\\evil.example',
    '/%2Fevil.example',
    '/%5Cevil.example',
    '/%252Fevil.example',
    '/javascript:alert(1)',
    '/http://evil.example',
    '/audit#fragment',
    '/audit%23fragment',
    '/audit%ZZ',
    'https://evil.example',
    ' /audit',
    '/audit ',
  ];

  for (const input of rejected) {
    assert.equal(getSafeInternalNavigationPath(input), null, `expected rejected redirect: ${input}`);
  }

  console.log('Login redirect validation checks passed.');
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
