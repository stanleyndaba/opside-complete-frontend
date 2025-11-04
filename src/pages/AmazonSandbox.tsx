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
        // Mark that we're in sandbox mode for this session
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('amazon_sandbox_mode', 'true');
          localStorage.setItem('amazon_sandbox_mode', 'true');
        }
        
        console.log('[Sandbox] Starting sandbox auth with state:', state || 'demo');
        console.log('[Sandbox] Backend URL:', api.buildApiUrl('/api/v1/integrations/amazon/sandbox/callback'));
        
        // Establish sandbox session/tenant on backend
        const res = await api.completeAmazonSandboxAuth(state || 'demo');
        
        console.log('[Sandbox] Response received:', {
          ok: res.ok,
          status: res.status,
          data: res.data,
          error: res.error
        });
        
        if (res.ok) {
          console.log('[Sandbox] Sandbox auth successful:', res.data);
          toast({
            title: 'Amazon Connected',
            description: 'Sandbox authentication successful. Analyzing your account...',
          });
        } else {
          console.error('[Sandbox] Sandbox auth failed:', {
            status: res.status,
            error: res.error,
            fullResponse: res
          });
          toast({
            title: 'Sandbox Connection Failed',
            description: res.error || 'Failed to connect to Amazon sandbox. Please try again.',
            variant: 'destructive'
          });
          // Still navigate but with error state
          if (!cancelled) {
            setTimeout(() => navigate('/auth/analyzing?source=amazon&error=sandbox_failed'), 1000);
          }
          return;
        }
      } catch (e: any) {
        console.error('[Sandbox] Sandbox auth exception:', {
          message: e?.message,
          error: e,
          stack: e?.stack
        });
        toast({
          title: 'Connection Error',
          description: e?.message || 'An unexpected error occurred during sandbox authentication.',
          variant: 'destructive'
        });
        if (!cancelled) {
          setTimeout(() => navigate('/auth/analyzing?source=amazon&error=exception'), 1000);
        }
        return;
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
