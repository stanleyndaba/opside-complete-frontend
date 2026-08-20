import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8');

assert.match(
  source,
  /const preferredTenantSlug = normalizeTenantSlug\(localStorage\.getItem\('active_tenant_slug'\)\);\s*clearStoredTenantContext\(\);/,
  'Existing-session bootstrap must preserve the authorized tenant slug before clearing stale tenant storage.'
);
assert.match(
  source,
  /body: JSON\.stringify\(\{\s*workspaceName,\s*preferredTenantSlug,/,
  'Protected workspace bootstrap must receive the preserved tenant slug.'
);
assert.doesNotMatch(
  source,
  /clearStoredTenantContext\(\);[\s\S]{0,300}preferredTenantSlug:\s*normalizeTenantSlug\(localStorage\.getItem\('active_tenant_slug'\)\)/,
  'Bootstrap must not read the tenant slug only after clearing it.'
);

console.log('Existing-session workspace-restoration regression checks passed.');
