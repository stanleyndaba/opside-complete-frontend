import { getAccessToken } from './supabaseClient';

export async function getFrontendAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const storedToken = String(localStorage.getItem('session_token') || '').trim();
  if (storedToken) {
    return storedToken;
  }

  const supabaseToken = (await getAccessToken()) || '';
  if (supabaseToken) {
    localStorage.setItem('session_token', supabaseToken);
  }

  return supabaseToken;
}

export async function getFrontendAuthContext() {
  if (typeof window === 'undefined') {
    return {
      token: '',
      userId: '',
      tenantId: ''
    };
  }

  return {
    token: await getFrontendAuthToken(),
    userId: String(localStorage.getItem('user_id') || '').trim(),
    tenantId: String(localStorage.getItem('active_tenant_id') || '').trim()
  };
}
