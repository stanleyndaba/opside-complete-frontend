import React from 'react';
import { ArrowRight, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { DEMO_SESSION_TOKEN, isDemoSessionActive, isDemoWorkspacePath } from '@/lib/demoSession';

type AppAccessGateProps = {
  children: React.ReactNode;
};

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

function AppAccessGateway() {
  const location = useLocation();
  const nextPath = `${location.pathname}${location.search}${location.hash}`;
  const loginPath = `/login?next=${encodeURIComponent(nextPath)}`;

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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE0EA] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-normal text-[#0B74DE] shadow-[0_12px_30px_rgba(37,49,58,0.06)]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Private workspace
              </div>
              <h1 className="mt-7 max-w-3xl text-[42px] font-semibold leading-[0.98] tracking-normal text-[#182026] sm:text-[58px] lg:text-[74px]">
                Margin workspaces are protected during Early Access.
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-7 text-[#5F6D77] sm:text-[18px] sm:leading-8">
                The recovery workspace is available through approved reviewer credentials or founder-led onboarding. This keeps seller workflows, evidence logic, and account data out of anonymous access.
              </p>

              <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="h-12 rounded-[5px] bg-[#0B74DE] px-6 text-sm font-bold text-white hover:bg-[#0869C9]">
                  <Link to="/early-access">
                    Join Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-[5px] border-[#CFE0EA] bg-white px-6 text-sm font-bold text-[#182026] hover:bg-[#F4F8FB]">
                  <Link to={loginPath}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in
                  </Link>
                </Button>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#6B7883]">
                Paystack and partner reviewers should use the test credentials supplied by Margin.
              </p>
            </div>

            <aside className="border-y border-[#D8E3E8] py-6 lg:border-y-0 lg:border-l lg:py-2 lg:pl-8">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#12825F]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold tracking-normal text-[#182026]">
                    Access stays intentional
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#66737F]">
                    Public pages remain open. Full app routes now require a real session, reviewer login, or an explicitly seeded demo session.
                  </p>
                  <Link to="/sales" className="mt-5 inline-flex items-center text-sm font-bold text-[#0B74DE] hover:text-[#0869C9]">
                    Request a founder-led demo
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
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
  const { authToken, isAuthReady, isSessionValid } = useSession();
  const hasDemoSession = isDemoSessionActive();
  const hasAuthenticatedSession = isSessionValid && Boolean(authToken) && authToken !== DEMO_SESSION_TOKEN;
  const isDemoWorkspaceRoute = isDemoWorkspacePath(location.pathname);

  if (!isAuthReady) {
    return <AppAccessLoader />;
  }

  if (isDemoWorkspaceRoute && !hasDemoSession) {
    return <AppAccessGateway />;
  }

  if (hasDemoSession || hasAuthenticatedSession) {
    return <>{children}</>;
  }

  return <AppAccessGateway />;
}

export default AppAccessGate;
