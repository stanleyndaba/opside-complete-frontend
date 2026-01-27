import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p;
  }, [location.search]);

  const provider = params.get('provider') || 'amazon';
  const tenant_slug = params.get('tenant_slug') || params.get('tenant') || '';

  useEffect(() => {
    api.trackEvent && (api as any).trackEvent('oauth_success_view', { provider, status: 'ok', tenant_slug });
  }, [provider, tenant_slug]);

  const handleStartSync = async () => {
    setLoading(true);
    if (tenant_slug) {
      navigate(`/app/${tenant_slug}/sync`);
    } else {
      navigate('/sync');
    }
  };

  return (
    <PageLayout title="Authorised Successfully" hideNavbar hideSidebar midnight>
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        {/* Main Success Container - Clean White / Glassmorphism */}
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-sm p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <img
              src="/logoimagetwo.png"
              alt="Margin"
              className="h-6 w-auto object-contain"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Store Connected Successfully
            </h1>
            <p className="text-gray-500 leading-relaxed">
              Your {provider === 'amazon' ? 'Amazon Store' : provider} is now securely linked to your dashboard.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleStartSync}
              disabled={loading}
              className="bg-[#0B1220] hover:bg-[#1a2536] text-white px-10 py-6 rounded-sm text-sm font-semibold transition-all duration-200 active:scale-95"
            >
              See findings
            </Button>
          </div>
        </div>

        {/* Legal Footer - Minimalist */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 px-6 text-center">
          <Link to="/privacy" className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/docs" className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Acceptable Use Policy</Link>
          <Link to="/refund-policy" className="text-xs font-medium text-gray-500 hover:text-white transition-colors">Refund Policy</Link>
        </div>
      </div>
    </PageLayout>
  );
}



