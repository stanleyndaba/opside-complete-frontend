import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { tenantRoute } from '@/lib/routes';

// Provider display config
const PROVIDER_CONFIG: Record<string, { label: string; color: string; icon: string; redirect: string }> = {
  amazon: {
    label: 'Amazon Store',
    color: '#FF9900',
    icon: '📦',
    redirect: '/sync'
  },
  gmail: {
    label: 'Gmail',
    color: '#EA4335',
    icon: '✉️',
    redirect: '/integrations-hub'
  },
  outlook: {
    label: 'Outlook',
    color: '#0078D4',
    icon: '📧',
    redirect: '/integrations-hub'
  },
  gdrive: {
    label: 'Google Drive',
    color: '#4285F4',
    icon: '📁',
    redirect: '/integrations-hub'
  },
  dropbox: {
    label: 'Dropbox',
    color: '#0061FF',
    icon: '💧',
    redirect: '/integrations-hub'
  },
  stripe: {
    label: 'Stripe',
    color: '#635BFF',
    icon: '💳',
    redirect: '/settings'
  }
};

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [countdown, setCountdown] = useState(4);
  const [animPhase, setAnimPhase] = useState(0); // 0=circle, 1=check, 2=expand

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const provider = params.get('provider') || 'amazon';
  const email = params.get('email') ? decodeURIComponent(params.get('email')!) : null;
  const status = params.get('status') || 'ok';
  const isError = status === 'error';
  const resolvedSlug = tenantSlug || params.get('tenant_slug') || params.get('tenant') || 'beta';

  const config = PROVIDER_CONFIG[provider] || {
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
    color: '#10B981',
    icon: '🔗',
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
          // Redirect to the provider's destination with a connection toast param
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
          <div className="relative z-10 w-full max-w-lg bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-none p-12 text-center space-y-8 animate-in fade-in zoom-in duration-700">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border-2 border-red-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-merriweather font-bold text-white">Connection Failed</h1>
              <p className="text-white/40 font-montserrat text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate(tenantRoute(resolvedSlug, '/integrations-hub'))}
              className="bg-white hover:bg-white/90 text-black px-10 h-12 text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300"
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
          0% { opacity: 0; transform: translateY(20px); }
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

      <div className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow in provider color */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"
          style={{ backgroundColor: `${config.color}08` }}
        />

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-lg bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-none p-12 text-center space-y-8">

          {/* Animated Checkmark */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-full pulse-ring"
                style={{ border: `2px solid ${config.color}40` }}
              />
              {/* SVG Circle + Check */}
              <svg className="w-24 h-24" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={animPhase >= 0 ? config.color : 'transparent'}
                  strokeWidth="2"
                  className="circle-draw"
                  style={{ opacity: 0.3 }}
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={config.color}
                  strokeWidth="2.5"
                  className="circle-draw"
                />
                {animPhase >= 1 && (
                  <polyline
                    points="30,52 44,66 70,38"
                    fill="none"
                    stroke={config.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="check-draw"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Status badge */}
          <div className="slide-up-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-[1px] w-8" style={{ backgroundColor: `${config.color}30` }} />
              <span
                className="text-[10px] font-bold font-mono tracking-[0.3em] uppercase"
                style={{ color: config.color }}
              >
                CONNECTED
              </span>
              <div className="h-[1px] w-8" style={{ backgroundColor: `${config.color}30` }} />
            </div>
          </div>

          {/* Provider + Title */}
          <div className="space-y-4 slide-up-2">
            <h1 className="text-3xl font-merriweather font-bold tracking-tight text-white leading-tight">
              {config.icon} {config.label}<br />
              <span className="text-white/70">Connected Successfully</span>
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
          <div className="pt-4 slide-up-3">
            <div className="flex items-center justify-center gap-3">
              {/* Mini countdown circle */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle
                    cx="22" cy="22" r="20"
                    fill="none"
                    stroke={config.color}
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
              className="bg-white hover:bg-white/90 text-black px-12 h-14 rounded-none text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer"
            >
              {provider === 'amazon' ? 'See Findings' : 'Go to Integrations'}
            </button>
          </div>
        </div>

        {/* Security footer */}
        <div className="relative z-10 mt-12 fade-in-slow">
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
