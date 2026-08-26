import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const login = fs.readFileSync(path.join(root, 'src/pages/Login.tsx'), 'utf8');

const requireMatch = (expression, description) => {
  if (!expression.test(login)) {
    throw new Error(`Login session parse contract failed: ${description}`);
  }
};

requireMatch(
  /const getReadableSupabaseSession = async \(\) => \{[\s\S]*?await supabase\.auth\.getSession\(\)[\s\S]*?catch \{[\s\S]*?await supabase\.auth\.signOut\(\{ scope: 'local' \}\)\.catch\(\(\) => undefined\)[\s\S]*?return null;/,
  'malformed persisted Supabase auth must be treated as no local session and cleared locally.'
);

requireMatch(
  /const loadActiveSession = async \(\) => \{[\s\S]*?const session = await getReadableSupabaseSession\(\);/,
  'initial login session hydration must use the guarded reader.'
);

requireMatch(
  /const handleRetryWorkspaceRouting = async \(\) => \{[\s\S]*?const session = await getReadableSupabaseSession\(\);/,
  'workspace retry routing must use the guarded reader.'
);

console.log('Login malformed-session parse contract checks passed.');
