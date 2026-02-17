import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { tenantRoute } from '@/lib/routes';

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p;
  }, [location.search]);

  const provider = params.get('provider') || 'amazon';
  const resolvedSlug = tenantSlug || params.get('tenant_slug') || params.get('tenant') || 'beta';

  useEffect(() => {
    api.trackEvent && (api as any).trackEvent('oauth_success_view', { provider, status: 'ok', tenant_slug: resolvedSlug });
  }, [provider, resolvedSlug]);

  const handleStartSync = async () => {
    setLoading(true);
    navigate(tenantRoute(resolvedSlug, '/sync'));
  };

  return (
    <PageLayout title="Authorised Successfully" hideNavbar hideSidebar midnight hideLogo>
      <div className="min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 relative overflow-hidden">
        {/* Background Mesh Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Main Success Container - Premium Obsidian / Glassmorphism */}
        <div className="relative z-10 w-full max-w-lg bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-none p-12 text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex justify-center">
            <img
              src="/logoimagetwo.png"
              alt="Margin"
              className="h-6 w-auto object-contain invert brightness-0"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-[1px] w-8 bg-emerald-500/20" />
              <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-[0.3em] uppercase">
                HANDSHAKE_OK
              </span>
              <div className="h-[1px] w-8 bg-emerald-500/20" />
            </div>

            <h1 className="text-3xl font-merriweather font-bold tracking-tight text-white leading-tight">
              Store Connected <br />Successfully
            </h1>
            <p className="text-white/40 font-montserrat leading-relaxed text-sm">
              Your {provider === 'amazon' ? 'Amazon Store' : provider} is now securely linked <br className="hidden sm:block" /> to your institutional dashboard.
            </p>
          </div>

          <div className="pt-6">
            <Button
              onClick={handleStartSync}
              disabled={loading}
              className="bg-white hover:bg-white/90 text-black px-12 h-14 rounded-none text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 shadow-2xl active:scale-95"
            >
              {loading ? "Initializing..." : "See Findings"}
            </Button>
          </div>
        </div>

        {/* Legal Footer - Minimalist */}
        <div className="relative z-10 mt-16 flex flex-wrap justify-center gap-x-10 gap-y-3 px-6 text-center">
          <Link to="/privacy" className="text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest font-mono">Privacy Policy</Link>
          <Link to="/terms" className="text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest font-mono">Terms of Service</Link>
          <Link to="/docs" className="text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest font-mono">Acceptable Use</Link>
          <Link to="/refund-policy" className="text-[10px] font-bold text-white/20 hover:text-white transition-all uppercase tracking-widest font-mono">Refund Policy</Link>
        </div>
      </div>
    </PageLayout>
  );
}



