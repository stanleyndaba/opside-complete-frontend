import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [sessionSource, gateSource, tenantSource, settingsSource, appSource] = await Promise.all([
  readFile(new URL('../src/contexts/SessionContext.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/routes/AppAccessGate.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/contexts/TenantContext.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/Settings.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
]);

// A–C: the protected route must wait for Clerk hydration and resolve a live Clerk session before Settings renders.
assert.match(sessionSource, /import \{ useAuth, useUser \} from '@clerk\/react';/, 'SessionContext must consume Clerk hydration state.');
assert.match(sessionSource, /if \(!isClerkLoaded\) \{\s*setIsAuthReady\(false\);\s*return;/, 'Unresolved Clerk hydration must remain an intentional auth-loading state.');
assert.match(sessionSource, /const token = await getClerkToken\(\)\.catch\(\(\) => null\);/, 'A signed-in Clerk browser must resolve its Clerk token before protected access is granted.');
assert.match(sessionSource, /setIsSessionValid\(true\);\s*setAuthToken\(token\);\s*setUserId\(clerkUserId\);/, 'A resolved Clerk token must establish the authenticated session context.');
assert.doesNotMatch(sessionSource, /applyStoredSession|MARGIN_SESSION_UPDATED_EVENT/, 'Local storage must not independently restore protected-route authentication authority.');
assert.match(gateSource, /if \(!isAuthReady\) \{\s*return <AppAccessLoader \/>;\s*\}/, 'AppAccessGate must show the restoration loader while authentication is unresolved.');
assert.doesNotMatch(gateSource, /getFrontendAuthContext|hasRecoveredBrowserSession/, 'AppAccessGate must not grant access from its previous browser-storage fallback.');
assert.match(gateSource, /return <Navigate to=\{`\/login\?next=\$\{encodeURIComponent\(next\)\}`\} replace \/>;/, 'Confirmed logged-out users must still redirect to login with the original path preserved.');
assert.match(appSource, /<Route path="\/app\/:tenantSlug\/settings" element=\{appRoute\(<Settings \/>\)\} \/>/, 'Settings must remain wrapped by the protected app route.');

// D–E: tenant authorization must remain server-owned after authentication resolves.
assert.match(tenantSource, /const url = tenantSlug \? `\/api\/tenant\/current\?tenantSlug=\$\{tenantSlug\}` : '\/api\/tenant\/current';/, 'Tenant context must still ask the backend to resolve the requested workspace.');
assert.match(tenantSource, /setError\('Workspace not found or access denied'\);/, 'An inaccessible tenant route must continue to fail closed.');

// F: remove legacy PayPal Settings presentation while preserving the certified server-derived Settings truths.
assert.doesNotMatch(settingsSource, /paypal/i, 'Settings must not render or map legacy PayPal content.');
assert.match(settingsSource, /Amazon Seller Central/, 'Amazon connectivity must remain in Settings.');
assert.match(settingsSource, /Last Ingest/, 'Ingest truth must remain in Settings.');
assert.match(settingsSource, /Linked Marketplaces/, 'Marketplace truth must remain in Settings.');
assert.match(settingsSource, /api\.getAutoFilePreference\(activeTenantSlug\)/, 'Auto-File must remain server-derived.');
assert.match(settingsSource, /SUPPORT_TIER_COPY\[tenant\.plan\]/, 'Support tier must remain derived from the active tenant plan.');

console.log('PASS: Settings final remediation source contracts are intact.');
