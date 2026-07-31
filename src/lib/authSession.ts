import { getAccessToken, supabase } from './supabaseClient';
import { isDemoSessionActive } from './demoSession';

type ClerkBrowserSession = {
  getToken?: (options?: { skipCache?: boolean }) => Promise<string | null>;
};

type ClerkBrowserUser = {
  id?: string | null;
};

type ClerkBrowser = {
  session?: ClerkBrowserSession | null;
  user?: ClerkBrowserUser | null;
};

async function getClerkBrowserToken(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const clerk = (window as typeof window & { Clerk?: ClerkBrowser }).Clerk;
  if (typeof clerk?.session?.getToken !== 'function') {
    return '';
  }

  const token = await clerk.session.getToken({ skipCache: true }).catch(() => null);
  return String(token || '').trim();
}

function getClerkBrowserUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const clerk = (window as typeof window & { Clerk?: ClerkBrowser }).Clerk;
  return String(clerk?.user?.id || '').trim();
}

export async function getFrontendAuthToken(): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  const storedToken = String(localStorage.getItem('session_token') || '').trim();
  if (isDemoSessionActive()) {
    return storedToken;
  }

  const clerkToken = await getClerkBrowserToken();
  if (clerkToken) {
    if (storedToken !== clerkToken) {
      localStorage.setItem('session_token', clerkToken);
    }
    return clerkToken;
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

  const clerkUserId = getClerkBrowserUserId();
  if (!isDemoSession && clerkUserId && userId !== clerkUserId) {
    userId = clerkUserId;
    localStorage.setItem('user_id', clerkUserId);
  }

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
