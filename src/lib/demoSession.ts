import { normalizeTenantSlug } from './routes';

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-0000000000d0';
export const DEMO_TENANT_SLUG = 'demo-workspace';
export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_EMAIL = 'demo@margin.local';
export const DEMO_SESSION_TOKEN = 'demo-session-local';
export const DEMO_SESSION_EVENT = 'margin:demo-session-updated';

export const DEMO_TENANT = {
  id: DEMO_TENANT_ID,
  name: 'Demo Workspace',
  slug: DEMO_TENANT_SLUG,
  plan: 'professional' as const,
  status: 'active' as const,
  role: 'viewer' as const,
};

const DEMO_SESSION_FLAG = 'demo_session_active';

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

export function isDemoSessionActive() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_SESSION_FLAG) === 'true' &&
    localStorage.getItem('session_token') === DEMO_SESSION_TOKEN &&
    normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) === DEMO_TENANT_SLUG;
}

export function seedDemoSession() {
  if (typeof window === 'undefined') return;

  localStorage.setItem(DEMO_SESSION_FLAG, 'true');
  localStorage.setItem('session_token', DEMO_SESSION_TOKEN);
  localStorage.setItem('user_id', DEMO_USER_ID);
  localStorage.setItem('user_email', DEMO_USER_EMAIL);
  localStorage.setItem('active_tenant_id', DEMO_TENANT_ID);
  localStorage.setItem('active_tenant_slug', DEMO_TENANT_SLUG);
  window.dispatchEvent(new CustomEvent(DEMO_SESSION_EVENT));
}

export function clearDemoSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_SESSION_FLAG);
  window.dispatchEvent(new CustomEvent(DEMO_SESSION_EVENT));
}
