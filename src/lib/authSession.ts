import { getAccessToken, supabase } from './supabaseClient';
import { isDemoSessionActive } from './demoSession';

export async function getFrontendAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const storedToken = String(localStorage.getItem('session_token') || '').trim();
  if (isDemoSessionActive()) {
    return storedToken;
  }

  const supabaseToken = (await getAccessToken()) || '';
  if (supabaseToken) {
    if (storedToken !== supabaseToken) {
      localStorage.setItem('session_token', supabaseToken);
    }
    return supabaseToken;
  }

  return storedToken;
}

export async function getFrontendAuthContext() {
  if (typeof window === 'undefined') {
    return {
      token: '',
      userId: '',
      tenantId: '',
      isDemoSession: false
    };
  }

  const isDemoSession = isDemoSessionActive();
  let userId = String(localStorage.getItem('user_id') || '').trim();

  if (!userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
        localStorage.setItem('user_id', user.id);
      }
    } catch {
      // Ignore - auth context will fall back to existing storage values.
    }
  }

  return {
    token: await getFrontendAuthToken(),
    userId,
    tenantId: String(localStorage.getItem('active_tenant_id') || '').trim(),
    isDemoSession
  };
}
