import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/PaymentSuccess.tsx', import.meta.url), 'utf8');

assert.match(source, /import \{ useAuth \} from '@clerk\/react';/, 'PaymentSuccess must use Clerk readiness.');
assert.match(source, /const \{ isLoaded: isClerkLoaded, isSignedIn, getToken, userId \} = useAuth\(\);/, 'PaymentSuccess must read loaded, signed-in, token, and user context.');
assert.match(source, /if \(!isClerkLoaded\)[\s\S]*?Restoring your secure session before verifying payment\./, 'Verification must defer while Clerk is loading.');
assert.match(source, /if \(!isSignedIn \|\| !userId\)[\s\S]*?Sign in to the original Margin workspace to verify this payment securely\./, 'Missing authentication must fail closed without verification.');
assert.match(source, /const token = await getToken\(\{ skipCache: true \}\)/, 'Verification must obtain a fresh Clerk token before calling the protected API.');
assert.match(source, /api\.get<TenantBootstrapResponse>\(`\/api\/tenant\/current\$\{tenantQuery\}`\)/, 'The return page must restore tenant context through the existing protected tenant endpoint.');
assert.match(source, /if \(!resolvedTenantId \|\| !resolvedTenantSlug\)[\s\S]*?could not restore the authorized workspace/, 'Verification must fail closed if the tenant cannot be resolved.');
assert.match(source, /if \(verificationStartedRef\.current\) return;[\s\S]*?verificationStartedRef\.current = true;/, 'Verification must be single-shot after prerequisites are met.');
assert.match(source, /api\.verifyPaystackPayment\(reference, resolvedTenantSlug\)/, 'The protected verification call must use the server-resolved tenant slug.');
assert.doesNotMatch(source, /router\.get\('\/verify\/:reference'/, 'The frontend must not introduce backend-route changes.');

console.log('Payment return authentication-context regression checks passed.');
