import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const requireMatch = (source, expression, description) => {
  if (!expression.test(source)) {
    throw new Error(`Account/sign-out contract failed: ${description}`);
  }
};

const sessionContext = read('src/contexts/SessionContext.tsx');
const signOutDialog = read('src/components/routes/SignOutDialog.tsx');
const navbar = read('src/components/layout/Navbar.tsx');
const sidebar = read('src/components/layout/Sidebar.tsx');
const appAccessGate = read('src/components/routes/AppAccessGate.tsx');

requireMatch(sessionContext, /useClerk/, 'SessionContext must use the Clerk provider.');
requireMatch(sessionContext, /await clerkSignOut\(\)/, 'Sign Out must await Clerk termination.');
requireMatch(sessionContext, /throw new Error\('Margin is still verifying this browser session/, 'Sign Out must fail rather than claim success while Clerk authority is unresolved.');
requireMatch(sessionContext, /Margin could not sign this browser out/, 'A Clerk termination failure must be surfaced to the seller.');
requireMatch(sessionContext, /localStorage\.removeItem\(key\)[\s\S]*sessionStorage\.removeItem\(key\)/, 'Compatibility auth and tenant state must be cleared from both browser stores after successful termination.');
requireMatch(sessionContext, /Promise\.allSettled\([\s\S]*supabase\.auth\.signOut[\s\S]*api\.logout\(\)/, 'Compatibility cleanup must occur only after Clerk termination and cannot create fake logout success.');

requireMatch(signOutDialog, /await signOut\(\)/, 'Dialog must await the shared Clerk-backed session operation.');
requireMatch(signOutDialog, /window\.location\.replace\('\/'\)/, 'Successful Sign Out must exit to the public landing page without preserving protected history.');
requireMatch(signOutDialog, /setError\(/, 'Dialog must display a bounded failure state.');
requireMatch(signOutDialog, /protected access will require you to sign in again/i, 'Dialog copy must explain re-authentication truthfully.');

requireMatch(navbar, /Account &amp; Settings/, 'Account menu must expose Settings.');
requireMatch(navbar, /Help &amp; Support/, 'Account menu must expose Help.');
requireMatch(navbar, /Amazon Seller Central/, 'Account menu must present the safe Amazon operating context.');
requireMatch(navbar, /Connect Amazon/, 'Disconnected Amazon context must provide the real connection action.');
requireMatch(navbar, /<SignOutDialog open=\{signOutOpen\}/, 'Account menu must use the shared secure Sign Out dialog.');
requireMatch(sidebar, /<SignOutDialog open=\{signOutOpen\}/, 'Sidebar Sign Out must use the same secure dialog.');
requireMatch(appAccessGate, /Navigate to=\{`\/login\?next=\$\{encodeURIComponent\(next\)\}`\} replace/, 'Protected routes must fail closed to Login with their original next path.');

console.log('Account and Sign Out contract checks passed.');
