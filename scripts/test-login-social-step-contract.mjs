import assert from 'node:assert/strict';
import fs from 'node:fs';

const loginSource = fs.readFileSync(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8');
const emailIndex = loginSource.indexOf('htmlFor="email"');
const continueIndex = loginSource.indexOf('onClick={handleEmailContinue}');
const googleIndex = loginSource.indexOf("startSocialOAuth('google')");
const linkedinIndex = loginSource.indexOf("startSocialOAuth('linkedin')");

assert.match(loginSource, /const \[emailStepComplete, setEmailStepComplete\] = useState\(false\);/);
assert.match(loginSource, /const showPasswordStep = mode === 'recovery' \|\| emailStepComplete \|\| Boolean\(clerkVerificationStep\);/);
assert.match(loginSource, /const handleEmailContinue = \(\) => \{/);
assert.match(loginSource, /Enter your email address to continue\./);
assert.match(loginSource, /\(mode === 'login' \|\| mode === 'signup'\) && !showPasswordStep/);
assert.match(loginSource, /onClick=\{handleEmailContinue\}/);
assert.match(loginSource, /\{showPasswordStep \? \(/);
assert.match(loginSource, /type="submit"/);
assert.match(loginSource, /type="button"/);
assert.ok(emailIndex >= 0 && emailIndex < continueIndex, 'Email must render before the first-step Continue action.');
assert.ok(continueIndex >= 0 && continueIndex < googleIndex, 'The email Continue action must render before social buttons.');
assert.ok(googleIndex >= 0 && googleIndex < linkedinIndex, 'Visible social buttons must retain Google before LinkedIn.');
assert.equal(loginSource.includes("startSocialOAuth('apple')"), false, 'Apple must remain hidden from the visible social-button list.');

console.log('Login social-step hierarchy contract checks passed.');

export {};

