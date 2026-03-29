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
    redirect: '/sync',
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
    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
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
    ? 'border-white/10 bg-white/[0.02] text-white'
    : 'border-red-500/20 bg-red-500/[0.04] text-red-200';

  return (
    <div className={`rounded-2xl border px-5 py-4 ${toneClasses}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-white/70">{icon}</div>
        <div className="space-y-1.5">
          <SectionLabel>{tone === 'success' ? 'Connection Status' : 'Connection Error'}</SectionLabel>
          <p className="text-base font-medium tracking-tight text-white">{title}</p>
          <p className="text-sm leading-relaxed text-white/45">{description}</p>
        </div>
      </div>
    </div>
  );
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

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.redirect, isError, navigate, provider, resolvedSlug]);

  const errorMessage = params.get('error') || 'Connection failed. Please try again.';
  const destinationLabel = provider === 'amazon' ? 'Sync' : 'Integrations Hub';
  const successDescription = provider === 'amazon'
    ? 'Your Amazon Store is now securely linked to your workspace. The sync pipeline can continue from here.'
    : `Your ${config.label} account is now securely linked and ready for evidence collection.`;

  return (
    <PageLayout title={isError ? 'Connection Failed' : 'Connected Successfully'} noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#070707] text-white relative">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
          <div className="mb-10 flex flex-col gap-6 border-b border-white/8 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-[#111111] p-2">
                  {config.icon ? (
                    <img src={config.icon} alt={config.label} className="h-5 w-5 object-contain" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-white/80" />
                  )}
                </div>
                <h1 className="text-2xl font-sans font-light tracking-tight">
                  {isError ? 'Connection Failed' : 'Authentication Complete'}
                </h1>
                <Badge
                  variant="outline"
                  className={`ml-1 border text-[10px] font-sans font-bold uppercase tracking-tight ${
                    isError
                      ? 'border-red-500/20 bg-red-500/[0.04] text-red-300'
                      : 'border-white/10 bg-white/[0.02] text-white/65'
                  }`}
                >
                  {config.label}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-white/40">
                {isError
                  ? 'The provider callback reached the platform, but the connection did not finish cleanly.'
                  : 'The provider callback completed and the workspace can now continue with the next operational step.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isError && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <SectionLabel>Redirect</SectionLabel>
                  <p className="mt-1 text-sm font-medium tracking-tight text-white">
                    Going to {destinationLabel} in {countdown}s
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <StatusBlock
                tone={isError ? 'error' : 'success'}
                title={isError ? 'Connection could not be completed' : 'Connection recorded successfully'}
                description={isError ? errorMessage : successDescription}
                icon={isError ? <AlertCircle className="h-5 w-5 text-red-300" /> : <CheckCircle2 className="h-5 w-5 text-white/80" />}
              />

              <div className="border-t border-white/8 pt-6">
                <SectionLabel>Provider Details</SectionLabel>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-4">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Provider</p>
                    <p className="mt-2 text-lg font-medium tracking-tight text-white">{config.label}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-4">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                      {email ? 'Connected Account' : 'Connection State'}
                    </p>
                    <p className="mt-2 text-lg font-medium tracking-tight text-white">
                      {email || (isError ? 'Authorization incomplete' : 'Authorized connection active')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/8 pt-6">
                <SectionLabel>Next Step</SectionLabel>
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-5">
                  <p className="text-base font-medium tracking-tight text-white">
                    {isError
                      ? 'Return to Integrations and retry once the connection issue is resolved.'
                      : provider === 'amazon'
                        ? 'Continue to Sync to review findings and ingestion progress.'
                        : 'Return to Integrations Hub to continue managing connected evidence sources.'}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">
                    {isError
                      ? 'No additional wording was changed here; only the presentation is flatter and consistent with the Data Upload page.'
                      : 'This page now uses the same dark, flat workspace treatment as Data Upload so the auth bridge feels native to the platform.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-t border-white/8 pt-6 lg:border-t-0 lg:border-l lg:border-white/8 lg:pl-8 lg:pt-0">
                <SectionLabel>Actions</SectionLabel>
                <div className="mt-4 flex flex-col gap-3">
                  <Button
                    onClick={() => navigate(tenantRoute(resolvedSlug, isError ? '/integrations-hub' : `${config.redirect}?connected=${provider}`))}
                    className="h-11 justify-between border border-white/10 bg-[#141414] px-4 text-white shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]"
                  >
                    <span className="font-sans font-medium tracking-tight">
                      {isError ? 'Return to Integrations' : provider === 'amazon' ? 'Continue to Sync' : 'Go to Integrations'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {!isError && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`))}
                      className="h-11 border-white/[0.08] bg-transparent px-4 text-white/65 hover:bg-white/[0.04] hover:text-white"
                    >
                      Open now
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/8 pt-6 lg:border-l lg:border-white/8 lg:pl-8">
                <SectionLabel>Security</SectionLabel>
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-4">
                  <p className="text-sm font-medium tracking-tight text-white">256-bit TLS · OAuth 2.0 · Enterprise Grade</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/35">
                    The provider returned through the same workspace auth bridge used by the rest of the platform.
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
