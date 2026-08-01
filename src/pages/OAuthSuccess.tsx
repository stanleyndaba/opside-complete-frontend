import { useEffect, useMemo, useState } from 'react';
import { useClerk } from '@clerk/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';

const PROVIDER_CONFIG: Record<string, { label: string; icon: string; redirect: string }> = {
  amazon: {
    label: 'Amazon',
    icon: '/AMZN.png',
    redirect: '/audit',
  },
  gmail: {
    label: 'Gmail',
    icon: '/gmailicon.png',
    redirect: '/integrations-hub',
  },
  outlook: {
    label: 'Outlook',
    icon: '/outlookicon.webp',
    redirect: '/integrations-hub',
  },
  gdrive: {
    label: 'Google Drive',
    icon: '/gd.png',
    redirect: '/integrations-hub',
  },
  dropbox: {
    label: 'Dropbox',
    icon: '/Dropbox_Icon.svg.png',
    redirect: '/integrations-hub',
  },
  stripe: {
    label: 'Stripe',
    icon: '/stripe-icon.png',
    redirect: '/settings',
  },
};

function hasPendingAmazonAudit() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('margin_pending_audit');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { auditId?: string; tenantSlug?: string; phase?: string };
    return Boolean(parsed.auditId && parsed.tenantSlug && parsed.phase === 'amazon_oauth_started');
  } catch {
    return false;
  }
}

function getSafeFailureCopy(rawError: string, provider: string) {
  const normalized = rawError.toLowerCase();

  if (
    normalized.includes('duplicate key') ||
    normalized.includes('unique constraint') ||
    normalized.includes('failed to bind') ||
    normalized.includes('already linked')
  ) {
    return provider === 'amazon'
      ? 'This Amazon account has already been recognized by Margin. Return to the audit workspace and continue from there.'
      : 'This account has already been recognized by Margin. Return to the workspace and continue from there.';
  }

  if (provider === 'amazon') {
    return 'Amazon returned to Margin, but the audit workspace could not finish the handoff automatically. Return to the audit and try again.';
  }

  return 'The provider returned to Margin, but the connection could not finish automatically. Return to the workspace and try again.';
}

type AmazonErrorKind = 'connected_elsewhere' | 'expired_session' | 'generic_failure';

type AmazonConnectionState = {
  kind: AmazonErrorKind;
  heading: string;
  body: string;
  eyebrow: string;
  primaryLabel: string;
  showSecondary: boolean;
  showSupport: boolean;
};

function mapAmazonConnectionState(params: URLSearchParams): AmazonConnectionState {
  const errorCode = (params.get('error_code') || '').toLowerCase();
  const rawSignal = `${params.get('error') || ''} ${params.get('error_description') || ''}`.toLowerCase();

  if (errorCode === 'amazon_seller_connected_elsewhere') {
    return {
      kind: 'connected_elsewhere',
      eyebrow: 'Amazon connection',
      heading: 'This Amazon account is already connected',
      body: 'This Amazon seller account belongs to another Margin workspace. Sign in with the Margin account that originally connected it, or contact support if the connection needs to be reviewed.',
      primaryLabel: 'Sign in to another account',
      showSecondary: true,
      showSupport: true,
    };
  }

  if (
    errorCode.includes('expired') ||
    errorCode.includes('state') ||
    rawSignal.includes('expired') ||
    rawSignal.includes('state') ||
    rawSignal.includes('session')
  ) {
    return {
      kind: 'expired_session',
      eyebrow: 'Amazon connection',
      heading: 'Your Amazon connection session expired',
      body: 'Return to your audit and connect Amazon again.',
      primaryLabel: 'Return to Audit',
      showSecondary: false,
      showSupport: false,
    };
  }

  return {
    kind: 'generic_failure',
    eyebrow: 'Amazon connection',
    heading: 'Amazon could not be connected',
    body: 'Your Margin account is safe. Return to the audit and try the connection again.',
    primaryLabel: 'Return to Audit',
    showSecondary: false,
    showSupport: true,
  };
}

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const clerk = useClerk();
  const [countdown, setCountdown] = useState(3);
  const [amazonConnectionState] = useState<AmazonConnectionState | null>(() => {
    if (typeof window === 'undefined') return null;
    const initialParams = new URLSearchParams(window.location.search);
    const isAmazonError = (initialParams.get('provider') || 'amazon') === 'amazon'
      && initialParams.get('status') === 'error';
    return isAmazonError ? mapAmazonConnectionState(initialParams) : null;
  });

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const provider = params.get('provider') || 'amazon';
  const status = params.get('status') || 'ok';
  const isError = status === 'error';
  const rawError = params.get('error') || '';
  const storedSlug = typeof window !== 'undefined'
    ? normalizeTenantSlug(localStorage.getItem('active_tenant_slug'))
    : null;
  const resolvedSlug = normalizeTenantSlug(tenantSlug)
    || normalizeTenantSlug(params.get('tenant_slug'))
    || normalizeTenantSlug(params.get('tenant'))
    || storedSlug
    || 'beta';

  const config = PROVIDER_CONFIG[provider] || {
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
    icon: '',
    redirect: '/integrations-hub',
  };

  const targetPath = provider === 'amazon'
    ? '/audit?amazon_connected=1'
    : tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`);

  useEffect(() => {
    if (!amazonConnectionState || !location.search) return;
    navigate(location.pathname, { replace: true });
  }, [amazonConnectionState, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (isError) return;

    const delay = provider === 'amazon' && hasPendingAmazonAudit() ? 900 : 1000;
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          navigate(targetPath, { replace: true });
          return 0;
        }
        return current - 1;
      });
    }, delay);

    return () => window.clearInterval(timer);
  }, [isError, navigate, provider, targetPath]);

  const signInToAnotherAccount = async () => {
    try {
      await clerk.signOut();
    } catch {
      // The route still clears local app session and moves to login if Clerk sign-out is already settled.
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('active_tenant_id');
      localStorage.removeItem('active_tenant_slug');
    }

    navigate('/login?next=%2Faudit', { replace: true });
  };

  if (amazonConnectionState) {
    const isConflict = amazonConnectionState.kind === 'connected_elsewhere';

    return (
      <PageLayout title={amazonConnectionState.heading} noPadding hideNavbar hideSidebar hideLogo>
        <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6">
          <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center justify-center">
            <div
              role="status"
              aria-live="polite"
              className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-tight text-blue-600">
                    {amazonConnectionState.eyebrow}
                  </p>
                  <h1 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-[30px]">
                    {amazonConnectionState.heading}
                  </h1>
                  <p className="mt-3 text-[14px] leading-6 text-slate-600 sm:text-[15px]">
                    {amazonConnectionState.body}
                  </p>
                  {isConflict ? (
                    <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-[13px] leading-5 text-slate-500">
                      For security, one Amazon seller account can only belong to one Margin workspace at a time.
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={isConflict ? signInToAnotherAccount : () => navigate('/audit', { replace: true })}
                      className="h-11 justify-between rounded-md bg-blue-600 px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(37,99,235,0.18)] hover:bg-blue-700 sm:min-w-56"
                    >
                      <span>{amazonConnectionState.primaryLabel}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>

                    {amazonConnectionState.showSecondary ? (
                      <Button
                        variant="outline"
                        onClick={() => navigate('/audit', { replace: true })}
                        className="h-11 rounded-md border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Return to Audit
                      </Button>
                    ) : null}
                  </div>

                  {amazonConnectionState.showSupport ? (
                    <a
                      href="mailto:support@margin-finance.com?subject=Amazon%20account%20connection%20review"
                      className="mt-5 inline-flex text-[13px] font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Contact Margin Support
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </main>
      </PageLayout>
    );
  }

  const heading = isError
    ? `${config.label} connection needs attention`
    : `${config.label} connection received`;
  const description = isError
    ? getSafeFailureCopy(rawError, provider)
    : provider === 'amazon'
      ? 'Amazon authorized the handoff. Margin can now return to the audit workspace and continue the recovery check.'
      : `${config.label} authorized the handoff. Margin can now return to the workspace.`;
  const eyebrow = isError ? 'Authorization handoff' : 'Authorization complete';

  return (
    <PageLayout title={heading} noPadding hideNavbar hideSidebar hideLogo>
      <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_90%_30%,rgba(14,165,233,0.08),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />

        <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/90 px-7 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur md:px-10 md:py-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
                {config.icon ? (
                  <img src={config.icon} alt={config.label} className="h-6 w-6 object-contain" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-tight text-blue-600">{eyebrow}</p>
                <p className="text-sm text-slate-500">Margin secure connection bridge</p>
              </div>
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isError ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {isError ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                  {heading}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  {description}
                </p>

                {!isError && (
                  <p className="mt-4 text-sm text-slate-500">
                    Returning automatically in {countdown}s.
                  </p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => navigate(targetPath, { replace: true })}
                    className="h-12 justify-between rounded-md bg-blue-600 px-5 text-white shadow-lg shadow-blue-600/15 hover:bg-blue-700 sm:min-w-56"
                  >
                    <span>{provider === 'amazon' ? 'Return to Audit' : 'Return to Workspace'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {isError && (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/audit', { replace: true })}
                      className="h-12 rounded-md border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
                    >
                      Restart audit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  );
}
