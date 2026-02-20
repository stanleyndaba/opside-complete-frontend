import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { tenantRoute } from '@/lib/routes';

// Provider display config — icons match IntegrationsHub
const PROVIDER_CONFIG: Record<string, { label: string; icon: string; redirect: string }> = {
  amazon: {
    label: 'Amazon Store',
    icon: '/AMZN.png',
    redirect: '/sync'
  },
  gmail: {
    label: 'Gmail',
    icon: '/gmailicon.png',
    redirect: '/integrations-hub'
  },
  outlook: {
    label: 'Outlook',
    icon: '/outlookicon.webp',
    redirect: '/integrations-hub'
  },
  gdrive: {
    label: 'Google Drive',
    icon: '/gd.png',
    redirect: '/integrations-hub'
  },
  dropbox: {
    label: 'Dropbox',
    icon: '/Dropbox_Icon.svg.png',
    redirect: '/integrations-hub'
  },
  stripe: {
    label: 'Stripe',
    icon: '/stripe-icon.png',
    redirect: '/settings'
  }
};

// Platform emerald green
const BRAND_COLOR = '#10B981';
const BRAND_COLOR_DIM = 'rgba(16,185,129,0.3)';

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [countdown, setCountdown] = useState(4);
  const [animPhase, setAnimPhase] = useState(0);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const provider = params.get('provider') || 'amazon';
  const email = params.get('email') ? decodeURIComponent(params.get('email')!) : null;
  const status = params.get('status') || 'ok';
  const isError = status === 'error';
  const resolvedSlug = tenantSlug || params.get('tenant_slug') || params.get('tenant') || 'beta';

  const config = PROVIDER_CONFIG[provider] || {
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
    icon: '',
    redirect: '/integrations-hub'
  };

  // Animation sequence
  useEffect(() => {
    if (isError) return;
    const t1 = setTimeout(() => setAnimPhase(1), 400);
    const t2 = setTimeout(() => setAnimPhase(2), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isError]);

  // Countdown + auto-redirect
  useEffect(() => {
    if (isError) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const dest = config.redirect;
          navigate(tenantRoute(resolvedSlug, `${dest}?connected=${provider}`));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isError, navigate, resolvedSlug, config.redirect, provider]);

  // Error state
  if (isError) {
    const errorMsg = params.get('error') || 'Connection failed. Please try again.';
    return (
      <PageLayout title="Connection Failed" hideNavbar hideSidebar midnight hideLogo>
        <div className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-2xl px-10 py-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-merriweather font-bold text-white">Connection Failed</h1>
              <p className="text-white/40 font-montserrat text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate(tenantRoute(resolvedSlug, '/integrations-hub'))}
              className="bg-white hover:bg-white/90 text-black px-10 h-11 text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Connected Successfully" hideNavbar hideSidebar midnight hideLogo>
      <style>{`
        @keyframes drawCircle {
          0% { stroke-dashoffset: 283; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 50; opacity: 0; }
          30% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .circle-draw {
          stroke-dasharray: 283;
          stroke-dashoffset: 283;
          animation: drawCircle 0.6s ease-out forwards;
        }
        .check-draw {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: drawCheck 0.5s ease-out 0.4s forwards;
        }
        .pulse-ring {
          animation: pulseRing 1.5s ease-out 0.8s forwards;
        }
        .slide-up-1 { animation: slideUp 0.5s ease-out 0.6s both; }
        .slide-up-2 { animation: slideUp 0.5s ease-out 0.8s both; }
        .slide-up-3 { animation: slideUp 0.5s ease-out 1.0s both; }
        .slide-up-4 { animation: slideUp 0.5s ease-out 1.2s both; }
        .fade-in-slow { animation: fadeIn 0.8s ease-out 1.4s both; }
        .countdown-ring {
          stroke-dasharray: 126;
          stroke-dashoffset: 0;
          transition: stroke-dashoffset 1s linear;
        }
      `}</style>

      <div className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden pt-16 pb-8">
        {/* Background glow in brand green */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: 'rgba(16,185,129,0.06)' }}
        />

        {/* Main Card — compact rectangular shape */}
        <div className="relative z-10 w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-2xl px-10 py-7 text-center space-y-4">

          {/* Animated Checkmark — brand green */}
          <div className="flex justify-center">
            <div className="relative w-14 h-14">
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-full pulse-ring"
                style={{ border: `2px solid ${BRAND_COLOR_DIM}` }}
              />
              {/* SVG Circle + Check */}
              <svg className="w-14 h-14" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={BRAND_COLOR}
                  strokeWidth="2"
                  className="circle-draw"
                  style={{ opacity: 0.25 }}
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={BRAND_COLOR}
                  strokeWidth="2.5"
                  className="circle-draw"
                />
                {animPhase >= 1 && (
                  <polyline
                    points="30,52 44,66 70,38"
                    fill="none"
                    stroke={BRAND_COLOR}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="check-draw"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* CONNECTED badge */}
          <div className="slide-up-1">
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8" style={{ backgroundColor: BRAND_COLOR_DIM }} />
              <span
                className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase"
                style={{ color: BRAND_COLOR }}
              >
                CONNECTED
              </span>
              <div className="h-[1px] w-8" style={{ backgroundColor: BRAND_COLOR_DIM }} />
            </div>
          </div>

          {/* Provider Icon + "Connected Successfully" */}
          <div className="space-y-3 slide-up-2">
            {/* Provider icon from IntegrationsHub assets */}
            {config.icon && (
              <div className="flex justify-center mb-2">
                <img
                  src={config.icon}
                  alt={config.label}
                  className="h-10 w-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl font-merriweather font-bold tracking-tight text-white leading-tight">
              Connected Successfully
            </h1>
            {email && (
              <p className="text-white/50 font-mono text-xs tracking-wide">
                {email}
              </p>
            )}
            <p className="text-white/30 font-montserrat text-sm leading-relaxed">
              {provider === 'amazon'
                ? 'Your Amazon Store is now securely linked to your dashboard.'
                : `Your ${config.label} account is now securely linked. Evidence documents will be automatically ingested.`
              }
            </p>
          </div>

          {/* Auto-redirect countdown */}
          <div className="pt-2 slide-up-3">
            <div className="flex items-center justify-center gap-3">
              <div className="relative w-7 h-7">
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle
                    cx="22" cy="22" r="20"
                    fill="none"
                    stroke={BRAND_COLOR}
                    strokeWidth="2"
                    className="countdown-ring"
                    style={{ strokeDashoffset: ((4 - countdown) / 4) * 126 }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/60">
                  {countdown}
                </span>
              </div>
              <span className="text-white/30 text-xs font-montserrat">
                Redirecting to {provider === 'amazon' ? 'Sync' : 'Integrations Hub'}...
              </span>
            </div>
          </div>

          {/* Manual button */}
          <div className="slide-up-4">
            <button
              onClick={() => navigate(tenantRoute(resolvedSlug, `${config.redirect}?connected=${provider}`))}
              className="bg-white hover:bg-white/90 text-black px-12 h-12 rounded-lg text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
            >
              {provider === 'amazon' ? 'See Findings' : 'Go to Integrations'}
            </button>
          </div>
        </div>

        {/* Security footer */}
        <div className="relative z-10 mt-10 fade-in-slow">
          <div className="flex items-center gap-2 text-white/15 text-[10px] font-mono tracking-wider">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-BIT TLS · OAuth 2.0 · Enterprise Grade</span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
