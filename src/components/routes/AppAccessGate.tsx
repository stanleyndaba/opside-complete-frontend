import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgePercent } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { useSession } from '@/contexts/SessionContext';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';
import { DEMO_SESSION_TOKEN, isDemoSessionActive, isDemoWorkspacePath, isInternalDemoAccessEmail, seedDemoSession } from '@/lib/demoSession';

type AppAccessGateProps = {
  children: React.ReactNode;
};

const CLERK_HYDRATION_RECOVERY_KEY = 'margin:clerk-hydration-recovery-attempt';
const CLERK_HYDRATION_RECOVERY_DELAY_MS = 8000;

function AppAccessLoader() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#FAFAF7] px-5 text-[#182026]">
      <div className="inline-flex max-w-full items-center justify-center gap-2.5 sm:gap-3">
        <img src="/logoimagetwo.png" alt="Margin" className="h-6 w-auto shrink-0 object-contain sm:h-7" />
        <span className="route-loading-brand-text brand-wordmark font-merriweather text-xl tracking-normal text-[#182026] sm:text-2xl">
          Margin
        </span>
      </div>
    </div>
  );
}

function AppAccessRecovery({ next }: { next: string }) {
  const loginPath = `/login?next=${encodeURIComponent(next)}`;

  const retryRestoration = () => {
    try {
      sessionStorage.removeItem(CLERK_HYDRATION_RECOVERY_KEY);
    } catch {
      // Storage is only a one-reload loop guard; a manual retry remains safe without it.
    }
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-6 text-[#182026] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
        <section className="w-full border-y border-[#DCE8EE] py-8 sm:py-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#DCE8EE] bg-white text-[#0B74DE]">
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="mt-6 text-[12px] font-medium tracking-tight text-[#66737F]">Session restoration</p>
          <h1 className="mt-2 font-lora text-[32px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[40px]">
            Margin could not restore this browser session.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#5F6D77]">
            Your workspace has not been opened. Reload to try restoring the existing session again, or sign in to continue securely.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={retryRestoration}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white transition-colors hover:bg-[#075EA8]"
            >
              Reload Margin
            </button>
            <Link
              to={loginPath}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#DCE8EE] bg-white px-4 text-[13px] font-medium tracking-tight text-[#182026] transition-colors hover:bg-[#F7FAFC]"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function AppAccessGateway() {
  const location = useLocation();
  const isDemoWorkspaceRoute = isDemoWorkspacePath(location.pathname);
  const trackedViewRef = useRef(false);

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;

    trackEvent(ANALYTICS_EVENTS.appGateViewed, {
      attempted_path_type: isDemoWorkspaceRoute ? 'reserved_demo_workspace' : 'private_app_route',
      is_demo_workspace_route: isDemoWorkspaceRoute,
    });

    if (isDemoWorkspaceRoute) {
      trackEvent(ANALYTICS_EVENTS.reservedDemoSlugBlocked, {
        attempted_path_type: 'reserved_demo_workspace',
      });
      trackEvent(ANALYTICS_EVENTS.blockedDemoAttempt, {
        attempted_path_type: 'reserved_demo_workspace',
      });
    }
  }, [isDemoWorkspaceRoute]);

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-6 text-[#182026] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <Link to="/" aria-label="Margin home" className="inline-flex w-fit items-center gap-2.5">
          <img src="/logoimagetwo.png" alt="" className="h-7 w-auto object-contain" />
          <span className="brand-wordmark font-merriweather text-[22px] font-semibold tracking-normal text-[#182026]">
            Margin
          </span>
        </Link>

        <section className="flex flex-1 items-center py-12 sm:py-16">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-[2px] border border-[#CFE0EA] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-[#0B74DE] shadow-[0_12px_30px_rgba(37,49,58,0.06)]">
                Margin workspace
              </div>
              <h1 className="mt-7 font-serif-headline max-w-[960px] text-[34px] font-bold leading-[1.02] tracking-[-0.045em] text-[#182026] min-[390px]:text-[40px] sm:text-[52px] sm:tracking-[-0.055em] md:text-[64px] lg:text-[80px]">
                <span className="block">Recover your Amazon refunds.</span>
                <span className="block">Bulletproof evidence. Seller-approved. Defensible claims.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-7 text-[#5F6D77] sm:text-[18px] sm:leading-8">
                Run a free recovery audit first. Margin will create your account,
                connect Amazon securely, and keep the audit moving from sync to
                findings without making you start over.
              </p>

              <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  to="/audit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-[5px] bg-[#182026] px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,49,58,0.14)] transition-colors hover:bg-[#25313A] sm:w-auto"
                >
                  Run Free Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#6B7883]">
                Already approved or reviewing Margin? Use the login details
                supplied to you.
              </p>
            </div>

            <aside className="border-y border-[#D8E3E8] py-6 lg:border-y-0 lg:border-l lg:py-2 lg:pl-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#CDD7DE] bg-[#F9F9FB] text-[#25313A] shadow-[0_0_0_3px_rgba(24,32,38,0.04)]">
                  <BadgePercent className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-normal text-[#182026]">
                    Free audit is open
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#66737F]">
                    If this is your first visit, Margin starts with account
                    creation, then Amazon authorization, then a recovery audit
                    result you can come back to.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export function AppAccessGate({ children }: AppAccessGateProps) {
  const location = useLocation();
  const { authToken, isAuthReady, isSessionValid, userEmail } = useSession();
  const hasDemoSession = isDemoSessionActive();
  const hasAuthenticatedSession = isSessionValid && Boolean(authToken) && authToken !== DEMO_SESSION_TOKEN;
  const [hydrationRecoveryRequired, setHydrationRecoveryRequired] = useState(false);
  const isDemoWorkspaceRoute = isDemoWorkspacePath(location.pathname);
  const canOpenInternalDemoWorkspace = hasAuthenticatedSession && isInternalDemoAccessEmail(userEmail);

  useEffect(() => {
    if (isDemoWorkspaceRoute && canOpenInternalDemoWorkspace && !hasDemoSession) {
      seedDemoSession({ userEmail });
    }
  }, [canOpenInternalDemoWorkspace, hasDemoSession, isDemoWorkspaceRoute, userEmail]);

  useEffect(() => {
    if (isAuthReady || typeof window === 'undefined') {
      if (isAuthReady) {
        try {
          sessionStorage.removeItem(CLERK_HYDRATION_RECOVERY_KEY);
        } catch {
          // The gate remains fail-closed even when storage is unavailable.
        }
      }
      setHydrationRecoveryRequired(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const alreadyRetried = sessionStorage.getItem(CLERK_HYDRATION_RECOVERY_KEY) === 'true';
        if (!alreadyRetried) {
          sessionStorage.setItem(CLERK_HYDRATION_RECOVERY_KEY, 'true');
          window.location.reload();
          return;
        }
      } catch {
        // A storage failure must never admit a protected route. Show recovery instead.
      }
      setHydrationRecoveryRequired(true);
    }, CLERK_HYDRATION_RECOVERY_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthReady]);

  // SessionContext remains unresolved until Clerk has conclusively restored or rejected browser authentication.
  if (!isAuthReady) {
    if (hydrationRecoveryRequired) {
      const next = `${location.pathname}${location.search}${location.hash}`;
      return <AppAccessRecovery next={next} />;
    }
    return <AppAccessLoader />;
  }

  if (isDemoWorkspaceRoute && canOpenInternalDemoWorkspace && !hasDemoSession) {
    return <AppAccessLoader />;
  }

  if (isDemoWorkspaceRoute && !hasDemoSession) {
    return <AppAccessGateway />;
  }

  if (hasDemoSession || hasAuthenticatedSession) {
    return <>{children}</>;
  }

  const next = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
}

export default AppAccessGate;
