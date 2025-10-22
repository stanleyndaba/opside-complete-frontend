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
        // Establish sandbox session/tenant on backend; ignore errors to keep UX flowing
        const res = await api.completeAmazonSandboxAuth(state || 'demo');
        if ((res as any)?.ok) {
          toast({ title: 'Connected to Amazon (Sandbox)', description: 'Redirecting to analysis…' });
        } else {
          toast({ title: 'Sandbox connect failed', description: (res as any)?.error || 'Continuing to analysis…' });
        }
      } catch (e: any) {
        toast({ title: 'Sandbox connect failed', description: e?.message || 'Continuing to analysis…' });
      }
      if (!cancelled) {
        // Small pause for UX, then continue
        setTimeout(() => navigate('/auth/analyzing?source=amazon'), 800);
      }
    })();
    return () => { cancelled = true; };
  }, [state, navigate]);

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
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl animate-pulse" />
                <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_10px_30px_rgba(0,0,0,0.35)]">
                  <img src="/logo-abstract.svg" alt="Clario cube" className="h-8 w-8 opacity-90" />
                </div>
              </div>
            </div>
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
