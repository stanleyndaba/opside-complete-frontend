import assert from 'node:assert/strict';
import fs from 'node:fs';

const loginSource = fs.readFileSync(new URL('../src/pages/Login.tsx', import.meta.url), 'utf8');

assert.match(loginSource, /const \[emailStepComplete, setEmailStepComplete\] = useState\(false\);/);
assert.match(loginSource, /const showPasswordStep = mode === 'recovery' \|\| emailStepComplete \|\| Boolean\(clerkVerificationStep\);/);
assert.match(loginSource, /const handleEmailContinue = \(\) => \{/);
assert.match(loginSource, /Enter your email address to continue\./);
assert.match(loginSource, /\(mode === 'login' \|\| mode === 'signup'\) && !showPasswordStep/);
assert.match(loginSource, /onClick=\{handleEmailContinue\}/);
assert.match(loginSource, /\{showPasswordStep \? \(/);
assert.match(loginSource, /type="submit"/);
assert.match(loginSource, /type="button"/);

console.log('Login social-step hierarchy contract checks passed.');

export {};

