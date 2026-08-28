import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const api = read('src/lib/api.ts');
const login = read('src/pages/Login.tsx');
const audit = read('src/pages/audit.tsx');
const oauthCallback = read('src/pages/OAuthCallback.tsx');
const oauthCallbackRedirect = read('src/pages/OAuthCallbackRedirect.tsx');
const dashboard = read('src/components/layout/Dashboard.tsx');
const integrationsHub = read('src/pages/IntegrationsHub.tsx');
const app = read('src/App.tsx');
const safeRedirect = read('src/lib/safeInternalRedirect.ts');
const oauthCallbackConfirmation = read('src/lib/oauthCallbackConfirmation.ts');
const connectAmazonAccountPath = path.join(root, 'src/pages/ConnectAmazonAccount.tsx');

function requireMatch(source, expression, description) {
  if (!expression.test(source)) {
    throw new Error(`Seller lifecycle contract failed: ${description}`);
  }
}

function requireAbsent(source, expression, description) {
  if (expression.test(source)) {
    throw new Error(`Seller lifecycle contract failed: ${description}`);
  }
}

requireMatch(
  api,
  /export interface SellerLifecycleResponse[\s\S]*?continuation:[\s\S]*?destination: string;[\s\S]*?amazon:[\s\S]*?needs_reconnect: boolean;/,
  'the frontend API client must declare the narrow typed seller lifecycle response.',
);
requireMatch(
  api,
  /getSellerLifecycle: \(auditIntentId\?: string \| null\)[\s\S]*?\/api\/seller-lifecycle/,
  'the frontend API client must request the server-owned lifecycle endpoint.',
);
requireMatch(
  api,
  /connectAmazon\([\s\S]*?continuation\?: \{ auditId\?: string \| null; auditIntentId\?: string \| null \}[\s\S]*?auditRunId: continuation\.auditId[\s\S]*?auditIntentId: continuation\.auditIntentId/,
  'Amazon OAuth initiation must preserve available Audit and Audit-intent continuation identifiers.',
);
requireMatch(
  login,
  /const buildPostAuthTargetPath = async[\s\S]*?if \(intentRecord\?\.return_path\)[\s\S]*?if \(nextPath !== '\/app' \|\| next === '\/app'\)[\s\S]*?await api\.getSellerLifecycle\(\)[\s\S]*?return '\/audit';/,
  'Login must preserve intent and safe explicit-next precedence before lifecycle authority with an Audit fallback.',
);
requireMatch(
  login,
  /auth_mode: 'recovery'[\s\S]*?resolveTenantSlugForAuthenticatedUser[\s\S]*?buildPostAuthTargetPath\(bootstrapResult\.intent, bootstrapResult\.resolvedTenantSlug\)[\s\S]*?routeWithCapacityGate\(targetPath\)/,
  'password recovery must use the shared lifecycle-aware post-auth target builder.',
);
requireAbsent(
  login,
  /routeWithCapacityGate\(`\/app\/\$\{[^}]+\}\/connect-amazon`\)/,
  'Login must not retain a hard-coded post-auth connection destination.',
);
requireMatch(
  login,
  /const safePath = getSafeInternalNavigationPath\(value\);[\s\S]*?safePath && !safePath\.startsWith\('\/login'\)/,
  'Login must exclude auth routes after canonical internal-path validation.',
);
requireMatch(
  audit,
  /const connection = mapAuthoritativeAmazonStatus\(await api\.getIntegrationsStatus\(activeTenantSlug\)\)[\s\S]*?if \(!connection\)[\s\S]*?return;[\s\S]*?const response = await api\.startAudit\(freshToken\)/,
  'Audit must establish authoritative Amazon truth and fail closed when status is unavailable before creating an Audit.',
);
requireMatch(
  audit,
  /if \(!response\.data\.amazonConnected \|\| response\.data\.audit\.status === 'amazon_connection_required'\) \{[\s\S]*?await connectAmazonForAudit\(response\.data\.audit, response\.data\.tenant\.slug\);/,
  'A server-confirmed disconnected Audit must use the existing Audit-owned contextual Amazon connection path.',
);
requireMatch(
  audit,
  /getAuditExperienceDecision\([\s\S]*?isManualAudit: isManualUploadAudit,[\s\S]*?secondaryAction === 'upload_reports'/,
  'Audit must keep contextual connection guidance alongside the independent manual-report rail through the seller decision policy.',
);
requireMatch(
  audit,
  /api\.connectAmazon\(undefined, false, targetTenantSlug, \{[\s\S]*?auditId: targetAudit\.id,[\s\S]*?auditIntentId,/,
  'contextual Amazon connection must carry existing Audit and Audit-intent identifiers.',
);
requireAbsent(
  app,
  /OAuthSuccess/,
  'no registered route may import the legacy OAuthSuccess page with URL-derived provider success behavior.',
);
requireMatch(
  app,
  /<Route path="\/auth\/success" element=\{<OAuthCallback \/>\} \/>[\s\S]*?<Route path="\/app\/:tenantSlug\/auth\/success" element=\{appRoute\(<FoundingActivationGate><OAuthCallback \/><\/FoundingActivationGate>\)\} \/>/,
  'registered OAuth success aliases must use the confirmation-aware callback for every provider.',
);
requireMatch(
  oauthCallback,
  /function buildAuditContinuationPath[\s\S]*?\['auditId', 'auditIntentId'[\s\S]*?if \(confirmedAmazon\) preserved\.set\('amazon_connected', '1'\);/,
  'the shared callback must preserve Audit context and append the Amazon marker only after confirmation.',
);
requireMatch(
  oauthCallback,
  /isSupportedOAuthProvider\(nextProvider\)[\s\S]*?unsupported_provider[\s\S]*?hasAuthoritativeCallbackConfirmation\(provider, response\.data\)/,
  'OAuth callback must reject unknown providers and use provider-specific authoritative status before confirmation.',
);
requireAbsent(
  oauthCallback,
  /query\.get\('success'\)|query\.get\('code'\)|docs_connected/,
  'OAuth callback must not treat callback URL success fields or another provider aggregate state as confirmation.',
);
requireMatch(
  oauthCallbackConfirmation,
  /SUPPORTED_OAUTH_PROVIDERS[\s\S]*?getProviderConnectionContext[\s\S]*?hasAuthoritativeCallbackConfirmation[\s\S]*?provider === 'amazon'[\s\S]*?status\.amazon_connected === true[\s\S]*?status\.providers\?\.\[provider\][\s\S]*?providerStatus\?\.connected[\s\S]*?providerStatus\.auth_valid[\s\S]*?!providerStatus\.needs_reconnect[\s\S]*?resolveProviderConnectionContext/,
  'the shared policy must parse context only and require the same provider to be connected, valid, and not reconnect-required.',
);
requireMatch(
  oauthCallback,
  /const \[providerConfirmed, setProviderConfirmed\] = useState\(false\);[\s\S]*?isAmazon && providerConfirmed[\s\S]*?hasAuthoritativeCallbackConfirmation\(provider, response\.data\)[\s\S]*?setProviderConfirmed\(true\)/,
  'Amazon polling must retain authoritative confirmation before changing connected state.',
);
requireAbsent(
  oauthCallback,
  /query\.get\('status'\) === 'ok'[\s\S]{0,180}setProviderConfirmed\(true\)|query\.get\('amazon_connected'\) === '1'[\s\S]{0,180}setProviderConfirmed\(true\)/,
  'the shared callback must not trust caller-supplied Amazon success markers.',
);
requireAbsent(
  oauthCallback,
  /auth\/success\?status=ok&provider=amazon&amazon_connected=true/,
  'the shared callback must not fabricate an Amazon success URL.',
);
requireAbsent(
  oauthCallback,
  /navigate\('\/audit\?amazon_connected=1'\)/,
  'the shared callback must not automatically navigate Amazon sellers as connected.',
);
requireMatch(
  oauthCallbackRedirect,
  /const redirectPath = '\/auth\/callback';[\s\S]*?navigate\(redirectUrl, \{ replace: true \}\)/,
  'every redirect-shim callback must use the confirmation-aware callback and preserve only context.',
);
requireAbsent(
  oauthCallbackRedirect,
  /auth\/success/,
  'no redirect shim may send a provider callback to a URL-derived success page.',
);
requireMatch(
  read('src/components/layout/Navbar.tsx'),
  /const amazonActionPath = userProfile\?\.amazon_connected \? '\/integrations-hub' : '\/audit';[\s\S]*?userProfile\?\.amazon_connected \? tenantRoute\(activeTenantSlug, amazonActionPath\) : amazonActionPath/,
  'the Navbar Connect Amazon action must enter Audit while connected sellers retain integrations management.',
);
requireAbsent(
  dashboard,
  /Amazon Connected Successfully|amazon_connected=true/,
  'Dashboard must not manufacture or propagate Amazon connection success from a query marker.',
);
requireAbsent(
  app,
  /path="\/analyzing"|pages\/AnalyzingScreen|path="\/app\/:tenantSlug\/test\/agent1"|pages\/Agent1Test|amazon-sandbox|OAuthProviderSandbox/,
  'registered legacy analyzing, sandbox, and agent test routes must not bypass the controlled lifecycle.',
);
requireMatch(
  app,
  /<Route path="\/connect-amazon" element=\{<Navigate to="\/audit" replace \/>\} \/>[\s\S]*?<Route path="\/app\/:tenantSlug\/connect-amazon" element=\{appRoute\(<Navigate to="\/audit" replace \/>\)\} \/>[\s\S]*?<Route path="\/connect-amazon-account" element=\{<Navigate to="\/audit" replace \/>\} \/>/,
  'every former standalone seller Amazon route must resolve into the Audit decision surface.',
);
requireAbsent(
  app,
  /ConnectAmazonAccount|ReconnectProvider/,
  'the active application route graph must not import or render retired standalone Amazon connection or reconnect pages.',
);
requireMatch(
  app,
  /<Route path="\/app\/:tenantSlug\/reconnect-amazon" element=\{appRoute\(<Navigate to="\/audit" replace \/>\)\} \/>[\s\S]*?<Route path="\/app\/:tenantSlug\/integrations\/reconnect\/amazon" element=\{appRoute\(<Navigate to="\/audit" replace \/>\)\} \/>[\s\S]*?<Route path="\/reconnect-amazon" element=\{<Navigate to="\/audit" replace \/>\} \/>/,
  'registered generic Amazon reconnect aliases must resolve into the Audit decision surface.',
);
requireMatch(
  integrationsHub,
  /onClick=\{\(\) => navigate\('\/audit'\)\}[\s\S]*?>\s*Connect Amazon\s*<\//,
  'the integrations-hub Connect Amazon action must enter Audit rather than initiate standalone OAuth.',
);
if (fs.existsSync(connectAmazonAccountPath)) {
  throw new Error('Seller lifecycle contract failed: the retired standalone ConnectAmazonAccount page must not remain available.');
}
requireMatch(
  integrationsHub,
  /getProviderConnectionContext\(location\.search\)[\s\S]*?api\.getIntegrationsStatus\(activeSlug\)[\s\S]*?resolveProviderConnectionContext\([\s\S]*?if \(!resolution\.confirmed \|\| !resolution\.provider\) \{[\s\S]*?return;/,
  'Integrations Hub callback context must be confirmed by exact-provider tenant-scoped status before success UI.',
);
requireAbsent(
  integrationsHub,
  /searchParams\.get\('\w+_connected'\)|searchParams\.get\('connected'\)|Connected Successfully|securely linked and is ready to use|has been connected successfully/,
  'Integrations Hub must not consume browser connected markers or claim provider success before confirmation.',
);
requireAbsent(
  audit,
  /amazon_connected[\s\S]{0,500}runAuditForAudit|runAuditForAudit[\s\S]{0,500}amazon_connected/,
  'the Audit page must not auto-run from an Amazon query marker.',
);
requireMatch(
  safeRedirect,
  /decodePathForValidation[\s\S]*?decoded\.startsWith\('\/\/'\)[\s\S]*?\/%\(\?:2f\|5c\)\/i[\s\S]*?parsed\.origin !== INTERNAL_ORIGIN[\s\S]*?parsed\.hash/,
  'Login redirect safety must use a decoded canonical internal-path policy.',
);

console.log('Seller lifecycle frontend contract checks passed.');
