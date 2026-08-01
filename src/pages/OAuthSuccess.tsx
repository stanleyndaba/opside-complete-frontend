import { useEffect, useMemo, useState } from 'react';
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

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [countdown, setCountdown] = useState(3);

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
