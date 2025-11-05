import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function AmazonSandboxPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[AmazonSandbox] Starting OAuth flow...');
        
        // ✅ CORRECT: Start OAuth flow
        // Step 1: Call /auth/start to get OAuth URL
        const response = await api.connectAmazon();
        
        if (!response.ok) {
          console.error('[AmazonSandbox] Failed to get OAuth URL:', response.error);
          
          // Check if backend returned authUrl in error response (backwards compatibility)
          const errorData = typeof response.error === 'object' ? response.error : {};
          const authUrl = errorData.authUrl || errorData.auth_url || errorData.redirectTo;
          
          if (authUrl) {
            console.log('[AmazonSandbox] Backend returned authUrl in error, redirecting:', authUrl);
            window.location.href = authUrl;
            return;
          }
          
          toast({
            title: 'Connection Failed',
            description: response.error || 'Failed to start Amazon authentication. Please try again.',
            variant: 'destructive'
          });
          if (!cancelled) {
            setTimeout(() => navigate('/dashboard'), 2000);
          }
          return;
        }

        // Handle both auth_url and authUrl (backend may return either)
        const authUrl = response.data?.auth_url || response.data?.authUrl;
        
        if (authUrl) {
          console.log('[AmazonSandbox] Redirecting to Amazon OAuth:', authUrl);
          
          // Step 2: Redirect user to Amazon (DO NOT call callback directly!)
          window.location.href = authUrl;
          // Step 3: Amazon will automatically redirect to /auth/callback?code=...
          // (This happens automatically - frontend shouldn't call this)
        } else {
          console.error('[AmazonSandbox] No auth URL received from backend');
          toast({
            title: 'Connection Failed',
            description: 'No authorization URL received from backend. Please try again.',
            variant: 'destructive'
          });
          if (!cancelled) {
            setTimeout(() => navigate('/dashboard'), 2000);
          }
        }
      } catch (e: any) {
        console.error('[AmazonSandbox] OAuth flow exception:', {
          message: e?.message,
          error: e,
          stack: e?.stack
        });
        toast({
          title: 'Connection Error',
          description: e?.message || 'An unexpected error occurred during authentication.',
          variant: 'destructive'
        });
        if (!cancelled) {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, toast]);

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
