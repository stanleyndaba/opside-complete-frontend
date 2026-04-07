import { supabase } from '@/lib/supabaseClient';

export const SESSION_RECOVERY_EVENT = 'margin:session-recovery-required';

export interface SessionRecoveryDetail {
  status?: number;
  source?: string;
  message?: string;
}

const SESSION_RECOVERY_SUPPRESSED_KEY = 'margin:session-recovery-suppressed';
const SESSION_RECOVERY_PENDING_KEY = 'margin:session-recovery-pending';

let refreshPromise: Promise<boolean> | null = null;
let lastDispatchAt = 0;
let sessionRecoverySuppressed = false;
let sessionRecoveryPending = false;

function readSuppressedFlag() {
  if (typeof window === 'undefined') return sessionRecoverySuppressed;
  return sessionRecoverySuppressed || window.sessionStorage.getItem(SESSION_RECOVERY_SUPPRESSED_KEY) === '1';
}

export function isSessionRecoveryPending() {
  if (typeof window === 'undefined') return sessionRecoveryPending;
  return sessionRecoveryPending || window.sessionStorage.getItem(SESSION_RECOVERY_PENDING_KEY) === '1';
}

export function clearSessionRecoveryPending() {
  sessionRecoveryPending = false;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_RECOVERY_PENDING_KEY);
  }
}

export function suppressSessionRecovery() {
  sessionRecoverySuppressed = true;
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_RECOVERY_SUPPRESSED_KEY, '1');
  }
}

export function clearSessionRecoverySuppression() {
  sessionRecoverySuppressed = false;
  lastDispatchAt = 0;
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_RECOVERY_SUPPRESSED_KEY);
  }
}

export function dispatchSessionRecovery(detail: SessionRecoveryDetail = {}) {
  if (typeof window === 'undefined') return;
  if (readSuppressedFlag()) return;

  const now = Date.now();
  if (now - lastDispatchAt < 1000) return;
  lastDispatchAt = now;
  sessionRecoveryPending = true;
  window.sessionStorage.setItem(SESSION_RECOVERY_PENDING_KEY, '1');

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
