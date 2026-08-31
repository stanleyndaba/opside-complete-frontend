import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loginSource = fs.readFileSync(path.join(root, 'src/pages/Login.tsx'), 'utf8');
const callbackSource = fs.readFileSync(path.join(root, 'src/pages/ClerkOAuthCallback.tsx'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');

assert.match(loginSource, /Continue with Google/);
assert.match(loginSource, /strategy:\s*'oauth_google'/);
assert.match(loginSource, /signIn\.sso\(oauthParams\)/);
assert.match(loginSource, /signUp\.sso\(oauthParams\)/);
assert.match(loginSource, /\/auth\/clerk\/callback/);
assert.match(loginSource, /isGoogleOAuthReturn/);
assert.match(loginSource, /routeExistingSession\(\)/);
assert.match(loginSource, /Google Login only creates your Margin account/);

assert.match(callbackSource, /signIn\.finalize/);
assert.match(callbackSource, /signUp\.finalize/);
assert.match(callbackSource, /signUp\.isTransferable/);
assert.match(callbackSource, /signIn\.isTransferable/);
assert.match(callbackSource, /buildLoginPath/);

assert.match(appSource, /path="\/auth\/clerk\/callback"/);
assert.doesNotMatch(loginSource, /GOOGLE_CLIENT_SECRET|CLERK_SECRET_KEY|GOOGLE_ACCESS_TOKEN/);
assert.doesNotMatch(callbackSource, /GOOGLE_CLIENT_SECRET|CLERK_SECRET_KEY|GOOGLE_ACCESS_TOKEN/);

console.log('Google Auth contract checks passed.');
