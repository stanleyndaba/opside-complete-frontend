import { supabase } from '@/lib/supabaseClient';

export const SESSION_RECOVERY_EVENT = 'margin:session-recovery-required';

export interface SessionRecoveryDetail {
  status?: number;
  source?: string;
  message?: string;
}

let refreshPromise: Promise<boolean> | null = null;
let lastDispatchAt = 0;

export function dispatchSessionRecovery(detail: SessionRecoveryDetail = {}) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastDispatchAt < 1000) return;
  lastDispatchAt = now;

  window.dispatchEvent(new CustomEvent<SessionRecoveryDetail>(SESSION_RECOVERY_EVENT, { detail }));
}

export async function attemptSilentSessionRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      const session = data.session;

      if (error || !session?.access_token) {
        return false;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('session_token', session.access_token);

        if (session.user?.id) {
          localStorage.setItem('user_id', session.user.id);
        }

        if (session.user?.email) {
          localStorage.setItem('user_email', session.user.email);
        }
      }

      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
