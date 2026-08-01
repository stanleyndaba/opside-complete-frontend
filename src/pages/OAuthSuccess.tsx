import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PROVIDER_CONFIG: Record<string, { label: string; icon: string; redirect: string }> = {
  amazon: {
    label: 'Amazon Store',
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

type StatusTone = 'success' | 'error';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-slate-500">
      {children}
    </p>
  );
}

function StatusBlock({
  tone,
  title,
  description,
  icon,
}: {
  tone: StatusTone;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const toneClasses = tone === 'success'
    ? 'border-blue-200 bg-blue-50 text-slate-950'
    : 'border-amber-200 bg-amber-50 text-slate-950';

  return (
    <div className={`rounded-2xl border px-5 py-4 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-1.5">
          <SectionLabel>{tone === 'success' ? 'Connection Status' : 'Connection Error'}</SectionLabel>
          <p className="text-base font-medium tracking-tight text-slate-950">{title}</p>
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

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

function getSafeErrorMessage(rawError: string, provider: string) {
  const normalized = rawError.toLowerCase();

  if (
    normalized.includes('duplicate key') ||
    normalized.includes('unique constraint') ||
    normalized.includes('already linked') ||
    normalized.includes('failed to bind')
  ) {
    return provider === 'amazon'
      ? 'This Amazon account was already connected to Margin. We are preparing the audit workspace so you can continue safely.'
      : 'This connection is already associated with a Margin workspace. Please return and continue from the workspace.';
  }

  if (provider === 'amazon') {
    return 'Amazon returned to Margin, but the workspace could not finish the connection automatically. Return to the audit and try again.';
  }

  return 'The provider returned to Margin, but the connection could not finish automatically. Please return and try again.';
}

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [countdown, setCountdown] = useState(4);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const provider = params.get('provider') || 'amazon';
  const email = params.get('email') ? decodeURIComponent(params.get('email')!) : null;
  const status = params.get('status') || 'ok';
  const isError = status === 'error';
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

  useEffect(() => {
    if (isError) {
      return;
    }

    if (provider === 'amazon' && hasPendingAmazonAudit()) {
      const timer = window.setTimeout(() => {
        navigate('/audit?amazon_connected=1', { replace: true });
      }, 900);

      return () => window.clearTimeout(timer);
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(provider === 'amazon' ? '/audit?amazon_connected=1' : tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.redirect, isError, navigate, provider, resolvedSlug]);

  const rawErrorMessage = params.get('error') || 'Connection failed. Please try again.';
  const errorMessage = getSafeErrorMessage(rawErrorMessage, provider);
  const destinationLabel = provider === 'amazon' ? 'Audit' : 'Integrations Hub';
  const successDescription = provider === 'amazon'
    ? 'Your Amazon Store is now securely linked. Margin can continue the free recovery audit from here.'
    : `Your ${config.label} account is now securely linked and ready for evidence collection.`;

  return (
    <PageLayout title={isError ? 'Connection Needs Attention' : 'Connected Successfully'} noPadding hideNavbar hideSidebar hideLogo>
      <div className="min-h-screen bg-white text-slate-950 relative">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(14,165,233,0.1),transparent_30%)]" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
          <div className="mb-8 flex flex-col gap-6 border-b border-slate-200 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                  {config.icon ? (
                    <img src={config.icon} alt={config.label} className="h-5 w-5 object-contain" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-slate-700" />
                  )}
                </div>
                <h1 className="text-2xl font-sans font-semibold tracking-tight">
                  {isError ? 'Connection needs attention' : 'Amazon connection received'}
                </h1>
                <Badge
                  variant="outline"
                  className={`ml-1 border text-[10px] font-sans font-bold uppercase tracking-tight ${
                    isError
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {config.label}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {isError
                  ? 'Margin received the Amazon authorization response. Return to the audit workspace and continue from there.'
                  : 'Margin received the Amazon authorization response and can continue the free recovery audit.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isError && (
                <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <SectionLabel>Redirect</SectionLabel>
                  <p className="mt-1 text-sm font-medium tracking-tight text-slate-900">
                    Going to {destinationLabel} in {countdown}s
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <StatusBlock
                tone={isError ? 'error' : 'success'}
                title={isError ? 'Return to your audit workspace' : 'Connection recorded successfully'}
                description={isError ? errorMessage : successDescription}
                icon={isError ? <AlertCircle className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-blue-600" />}
              />

              <div className="border-t border-slate-200 pt-6">
                <SectionLabel>Provider Details</SectionLabel>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-slate-500">Provider</p>
                    <p className="mt-2 text-lg font-medium tracking-tight text-slate-950">{config.label}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-slate-500">
                      {email ? 'Connected Account' : 'Connection State'}
                    </p>
                    <p className="mt-2 text-lg font-medium tracking-tight text-slate-950">
                      {email || (isError ? 'Needs audit retry' : 'Authorized connection active')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <SectionLabel>Next Step</SectionLabel>
                <div className="mt-4 rounded-md border border-slate-200 bg-white px-5 py-5 shadow-sm">
                  <p className="text-base font-medium tracking-tight text-slate-950">
                    {isError
                      ? 'Return to the audit workspace and run the audit again.'
                      : provider === 'amazon'
                        ? 'Continue the audit to review findings and ingestion progress.'
                        : 'Return to Integrations Hub to continue managing connected evidence sources.'}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {isError
                      ? 'No seller data was changed by this screen. Margin will resume from the audit workspace.'
                      : 'Seller approval remains required before any recovery action moves forward.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-t border-slate-200 pt-6 lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-8 lg:pt-0">
                <SectionLabel>Actions</SectionLabel>
                <div className="mt-4 flex flex-col gap-3">
                  <Button
                    onClick={() => navigate(provider === 'amazon' ? '/audit?amazon_connected=1' : tenantRoute(resolvedSlug, isError ? '/integrations-hub' : `${config.redirect}?connected=${provider}`))}
                    className="h-11 justify-between rounded-md bg-blue-600 px-4 text-white shadow-lg shadow-blue-600/15 hover:bg-blue-700"
                  >
                    <span className="font-sans font-medium tracking-tight">
                      {provider === 'amazon' ? 'Return to Audit' : isError ? 'Return to Integrations' : 'Go to Integrations'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {!isError && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(provider === 'amazon' ? '/audit?amazon_connected=1' : tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`))}
                      className="h-11 rounded-md border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    >
                      Open now
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 lg:border-l lg:border-slate-200 lg:pl-8">
                <SectionLabel>Security</SectionLabel>
                <div className="mt-4 rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-sm font-medium tracking-tight text-slate-950">OAuth 2.0 authorization</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    Margin uses the Amazon authorization response to continue the audit. It does not file or change seller account settings from this screen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
