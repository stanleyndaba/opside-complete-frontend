import { normalizeTenantSlug } from './routes';

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-0000000000d0';
export const DEMO_TENANT_SLUG = 'demo-workspace';
export const DEMO_TENANT_ALIASES = ['acme-corp'] as const;
export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_EMAIL = 'demo@margin.local';
export const DEMO_SESSION_TOKEN = 'demo-session-local';
export const DEMO_SESSION_EVENT = 'margin:demo-session-updated';

export const DEMO_TENANT = {
  id: DEMO_TENANT_ID,
  name: 'Acme Operations',
  slug: DEMO_TENANT_SLUG,
  plan: 'professional' as const,
  status: 'active' as const,
  role: 'viewer' as const,
};

const DEMO_SESSION_FLAG = 'demo_session_active';
const DEMO_SESSION_SOURCE = 'demo_session_source';
const DEMO_SESSION_EXPLICIT_SOURCE = 'explicit';

type DemoSessionOptions = {
  userEmail?: string | null;
};

function isEnvDemoBypassEnabled() {
  return import.meta.env.VITE_ENABLE_DEMO_BYPASS === 'true';
}

function isDevQueryDemoEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export function isDemoBypassAvailable() {
  return isEnvDemoBypassEnabled() || isDevQueryDemoEnabled();
}

export function isDemoWorkspacePath(pathname: string) {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return [DEMO_TENANT_SLUG, ...DEMO_TENANT_ALIASES].some((slug) => {
    const demoRoot = `/app/${slug}`;
    return path === demoRoot || path.startsWith(`${demoRoot}/`);
  });
}

export function isReservedDemoTenantSlug(tenantSlug?: string | null) {
  const slug = normalizeTenantSlug(tenantSlug);
  return slug === DEMO_TENANT_SLUG || DEMO_TENANT_ALIASES.some((alias) => alias === slug);
}

export function isDemoWorkspaceRequested() {
  if (typeof window === 'undefined') return false;

  if (isDemoWorkspacePath(window.location.pathname)) {
    return true;
  }

  const nextPath = new URLSearchParams(window.location.search).get('next');
  return !!nextPath && isDemoWorkspacePath(nextPath);
}

export function isDemoSessionActive() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_SESSION_FLAG) === 'true' &&
    localStorage.getItem(DEMO_SESSION_SOURCE) === DEMO_SESSION_EXPLICIT_SOURCE &&
    localStorage.getItem('session_token') === DEMO_SESSION_TOKEN &&
    normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) === DEMO_TENANT_SLUG;
}

export function seedDemoSession(options: DemoSessionOptions = {}) {
  if (typeof window === 'undefined') return;

  const userEmail = String(options.userEmail || DEMO_USER_EMAIL).trim() || DEMO_USER_EMAIL;

  localStorage.setItem(DEMO_SESSION_FLAG, 'true');
  localStorage.setItem(DEMO_SESSION_SOURCE, DEMO_SESSION_EXPLICIT_SOURCE);
  localStorage.setItem('session_token', DEMO_SESSION_TOKEN);
  localStorage.setItem('user_id', DEMO_USER_ID);
  localStorage.setItem('user_email', userEmail);
  localStorage.setItem('active_tenant_id', DEMO_TENANT_ID);
  localStorage.setItem('active_tenant_slug', DEMO_TENANT_SLUG);
  window.dispatchEvent(new CustomEvent(DEMO_SESSION_EVENT));
}

export function ensureDemoSessionForDemoWorkspace() {
  if (!isDemoWorkspaceRequested()) return false;
  return isDemoSessionActive();
}

export function clearDemoSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_SESSION_FLAG);
  localStorage.removeItem(DEMO_SESSION_SOURCE);
  window.dispatchEvent(new CustomEvent(DEMO_SESSION_EVENT));
}
