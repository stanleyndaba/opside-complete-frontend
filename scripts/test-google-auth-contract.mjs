import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loginSource = fs.readFileSync(path.join(root, 'src/pages/Login.tsx'), 'utf8');
const callbackSource = fs.readFileSync(path.join(root, 'src/pages/ClerkOAuthCallback.tsx'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const publicNavbarSource = fs.readFileSync(path.join(root, 'src/components/layout/PublicNavbar.tsx'), 'utf8');
const googleMarkSource = fs.readFileSync(path.join(root, 'src/components/GoogleMark.tsx'), 'utf8');
const appleMarkSource = fs.readFileSync(path.join(root, 'src/components/AppleMark.tsx'), 'utf8');
const linkedInMarkSource = fs.readFileSync(path.join(root, 'src/components/LinkedInMark.tsx'), 'utf8');

assert.match(loginSource, /Continue with Google/);
assert.match(loginSource, /oauth_google/);
assert.match(loginSource, /signIn\.sso\(oauthParams\)/);
assert.match(loginSource, /signUp\.sso\(oauthParams\)/);
assert.match(loginSource, /oauth_apple/);
assert.match(loginSource, /oauth_linkedin_oidc/);
assert.match(loginSource, /startSocialOAuth\('linkedin'\)/);
assert.match(loginSource, /<LinkedInMark className="mr-2 h-4 w-4 text-\[#0A66C2\]" \/>/);
assert.match(loginSource, /startSocialOAuth\('apple'\)/);
assert.match(loginSource, /<AppleMark className="mr-2 h-4 w-4" \/>/);
assert.match(loginSource, /\/auth\/clerk\/callback/);
assert.match(loginSource, /isSocialOAuthReturn/);
assert.match(loginSource, /socialOAuthProvider === 'linkedin'/);
assert.match(loginSource, /routeExistingSession\(\)/);
assert.match(loginSource, /Google, Apple, and LinkedIn Login only create your Margin account/);
assert.match(loginSource, /sign-in is not enabled for this Margin environment yet/);
assert.match(loginSource, /<GoogleMark className="mr-2 h-4 w-4" \/>/);
assert.match(publicNavbarSource, /<GoogleMark className="h-3\.5 w-3\.5" \/>/);
assert.match(publicNavbarSource, /Sign up/);
assert.match(googleMarkSource, /viewBox="0 0 24 24"/);
assert.match(appleMarkSource, /viewBox="0 0 24 24"/);
assert.match(linkedInMarkSource, /viewBox="0 0 24 24"/);

assert.match(callbackSource, /signIn\.finalize/);
assert.match(callbackSource, /signUp\.finalize/);
assert.match(callbackSource, /signUp\.isTransferable/);
assert.match(callbackSource, /provider === 'apple'/);
assert.match(callbackSource, /provider === 'linkedin'/);
assert.match(callbackSource, /buildLoginPath\(next, message, provider\)/);
assert.match(callbackSource, /signIn\.isTransferable/);
assert.match(callbackSource, /buildLoginPath/);

assert.match(appSource, /path="\/auth\/clerk\/callback"/);
assert.match(loginSource, /You’re already signed in/);
assert.match(loginSource, /Continue to Margin/);
assert.match(loginSource, /Use a different account/);
assert.doesNotMatch(loginSource, /Active Session Detected/);
assert.doesNotMatch(loginSource, /GOOGLE_CLIENT_SECRET|CLERK_SECRET_KEY|GOOGLE_ACCESS_TOKEN/);
assert.doesNotMatch(callbackSource, /GOOGLE_CLIENT_SECRET|CLERK_SECRET_KEY|GOOGLE_ACCESS_TOKEN/);

console.log('Google Auth contract checks passed.');
