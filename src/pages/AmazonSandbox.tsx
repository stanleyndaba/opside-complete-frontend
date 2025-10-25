import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function AmazonSandboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = searchParams.get('state');
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Establish sandbox session/tenant on backend
        const res = await api.completeAmazonSandboxAuth(state || 'demo');
        if (res.ok) {
          console.log('Sandbox auth successful');
        } else {
          console.warn('Sandbox auth failed:', res.error);
        }
      } catch (e: any) {
        console.warn('Sandbox auth error:', e?.message || e);
      }
      if (!cancelled) {
        // Small pause for UX, then continue to analysis
        setTimeout(() => navigate('/auth/analyzing?source=amazon'), 800);
      }
    })();
    return () => { cancelled = true; };
  }, [state, navigate, toast]);

  return (
    <PageLayout title="Connecting to Amazon" hideNavbar hideSidebar>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-transparent min-h-screen text-gray-300 flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          {/* remove extra overlays that cause haze */}

          <div className="relative max-w-md w-full mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-gray-100">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg font-medium">Connecting to Amazon...</span>
            </div>
            {/* Center logo removed per request */}
            <p className="text-gray-400">
              Simulating Amazon Seller Central authentication...
            </p>
            {/* Step indicators removed for minimal appearance */}

            {/* Security box removed for minimal appearance */}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
