import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AmazonConnectProps {
  onConnectionStart?: () => void;
  onConnectionComplete?: (data: any) => void;
  className?: string;
  showUseExisting?: boolean;
}

export function AmazonConnect({ onConnectionStart, onConnectionComplete, className, showUseExisting = true }: AmazonConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [usingExisting, setUsingExisting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setConnecting(true);
      if (showUseExisting) {
        setUsingExisting(false);
      }
      onConnectionStart?.();

      // ✅ CORRECT: Start OAuth flow
      // Step 1: Call /auth/start to get OAuth URL
      const response = await api.connectAmazon();

      if (!response.ok) {
        console.error('[AmazonConnect] Failed to get OAuth URL:', response.error);

        // Check if backend returned authUrl in error response (backwards compatibility)
        const errorData = typeof response.error === 'object' ? response.error : {};
        const authUrl = errorData.authUrl || errorData.auth_url || errorData.redirectTo;

        if (authUrl) {
          console.log('[AmazonConnect] Backend returned authUrl in error, redirecting:', authUrl);
          window.location.href = authUrl;
          return;
        }

        toast({
          title: 'Connection Failed',
          description: response.error || 'Failed to start Amazon authentication. Please try again.',
          variant: 'destructive'
        });
        setConnecting(false);
        return;
      }

      // Handle both auth_url and authUrl (backend may return either)
      const authUrl = response.data?.auth_url || response.data?.authUrl;
      const stateParam = response.data?.state;

      if (stateParam) {
        try {
          sessionStorage.setItem('amazon_sandbox_state', stateParam);
          localStorage.setItem('amazon_sandbox_state', stateParam);
        } catch {}
      }

      if (authUrl && authUrl.includes('/auth/amazon-sandbox')) {
        try {
          sessionStorage.setItem('amazon_sandbox_mode', 'true');
          localStorage.setItem('amazon_sandbox_mode', 'true');
        } catch {}
      }

      if (authUrl) {
        // Track the connection attempt
        await api.trackEvent('amazon_connect_initiated', {
          timestamp: new Date().toISOString(),
          source: 'zero_friction_onboarding'
        });

        // Step 2: Redirect user to Amazon (DO NOT call callback directly!)
        window.location.href = authUrl;
        // Step 3: Amazon will automatically redirect to /auth/callback?code=...
        // (This happens automatically - frontend shouldn't call this)
      } else {
        // No auth URL received
        console.error('[AmazonConnect] No auth URL received from backend');
        toast({
          title: 'Connection Failed',
          description: 'No authorization URL received from backend. Please try again.',
          variant: 'destructive'
        });
        setConnecting(false);
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Connection failed:', error);
      toast({
        title: 'Connection Error',
        description: error?.message || 'An unexpected error occurred during authentication.',
        variant: 'destructive'
      });
      setConnecting(false);
    }
  };

  const handleUseExisting = async () => {
    if (!showUseExisting) return;
    try {
      setConnecting(true);
      setUsingExisting(true);
      onConnectionStart?.();

      // OPTIMIZATION: Check connection status first (lightweight endpoint)
      // This avoids calling the slow bypass endpoint if Amazon is already connected.
      // The bypass endpoint can be slow because:
      // 1. Backend might be sleeping (Render free tier takes 30-60s to wake up)
      // 2. It validates/refreshes tokens (involves API calls to Amazon)
      // 3. It might trigger automatic syncs
      // By checking status first, we can skip all of that if already connected.
      try {
        console.log('[AmazonConnect] Checking connection status...');
        const statusResponse = await api.getIntegrationsStatus();
        console.log('[AmazonConnect] Connection status response:', statusResponse);
        if (statusResponse.ok && statusResponse.data?.amazon_connected) {
          // Amazon is already connected! Just redirect to sync status
          console.log('[AmazonConnect] ✅ Amazon already connected');
          setConnecting(false);
          setUsingExisting(false);
          window.location.href = '/sync-status';
          return;
        } else {
          console.log('[AmazonConnect] ⚠️ Amazon not connected yet, attempting bypass...');
        }
      } catch (statusError) {
        // If status check fails, continue with bypass endpoint (might be first time)
        console.log('[AmazonConnect] Status check failed, trying bypass endpoint:', statusError);
      }

      // If not connected, try the bypass endpoint with a shorter timeout
      // Use a promise race to timeout faster if backend is slow
      const bypassPromise = api.useExistingAmazonConnection();
      const timeoutPromise = new Promise<Awaited<typeof bypassPromise>>((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timed out. The backend may be sleeping. Please try again in a moment.')), 15000); // 15s timeout instead of 45s
      });

      console.log('[AmazonConnect] Attempting bypass connection...');
      const response = await Promise.race([bypassPromise, timeoutPromise]);
      console.log('[AmazonConnect] Bypass response:', response);

      if (response.ok) {
        if (response.data?.bypassed && response.data?.redirectUrl) {
          console.log('[AmazonConnect] ✅ Bypass successful! Backend found refresh token and validated it.');
          console.log('[AmazonConnect] Redirect URL:', response.data.redirectUrl);
          
          // Handle bypass response according to Phase 1 requirements
          const data = response.data;
          if (data.sandboxMode && !data.connectionVerified) {
            // In sandbox mode with mock data
            toast({
              title: 'Connected!',
              description: 'Using test data.',
              duration: 3000,
            });
          } else {
            toast({
              title: 'Amazon connected successfully!',
              description: 'Your account is now connected.',
              duration: 3000,
            });
          }
          
          // Redirect to sync status page (per FRONTEND_AMAZON_OAUTH_SYNC_STATUS.md)
          // Use provided redirectUrl if it's a sync-status page, otherwise default to sync-status
          if (data.redirectUrl && data.redirectUrl.includes('/sync-status')) {
            window.location.href = data.redirectUrl;
          } else {
            window.location.href = '/sync-status';
          }
          return;
        }

        // If no refresh token found, still go to sync-status page
        // The sync-status page will handle showing the connection prompt
        console.log('[AmazonConnect] ⚠️ No refresh token found, redirecting to sync-status');
        toast({
          title: 'No Existing Connection',
          description: 'Please connect your Amazon account first.',
          duration: 3000,
        });
        window.location.href = '/sync-status';
        return;

        console.log('[AmazonConnect] ❌ Bypass failed: No redirect URL or OAuth URL returned');
        toast({
          title: 'Existing Connection Unavailable',
          description: 'No saved connection found. Please use the main connect option.',
          variant: 'destructive'
        });
      } else {
        console.log('[AmazonConnect] ❌ Bypass failed:', response.error);
        toast({
          title: 'Connection Failed',
          description: response.error || 'Could not reuse the existing connection. Please try the main connect button.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Use existing failed:', error);
      
      // Provide more helpful error messages
      if (error?.message?.includes('timed out') || error?.message?.includes('sleeping')) {
        toast({
          title: 'Backend Slow to Respond',
          description: 'The backend is taking longer than expected. This usually means it\'s waking up from sleep. Please wait 30-60 seconds and try again, or use the main "Connect Amazon Account" button.',
          variant: 'destructive',
          duration: 8000,
        });
      } else {
        toast({
          title: 'Connection Error',
          description: error?.message || 'An unexpected error occurred. Please try the main connect button instead.',
          variant: 'destructive'
        });
      }
    } finally {
      setConnecting(false);
      setUsingExisting(false);
    }
  };

  // Check if className includes w-full to make buttons full width
  const isFullWidth = className?.includes('w-full');
  
  return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className={cn(
            isFullWidth ? 'w-full' : 'w-auto',
            'justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg transition-colors px-8',
            connecting && (!showUseExisting || !usingExisting) && 'opacity-80',
            className
          )}
          size="lg"
        >
          {connecting && (!showUseExisting || !usingExisting) ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Amazon Account'
          )}
        </Button>
          {showUseExisting && (
            <Button
              onClick={handleUseExisting}
              disabled={connecting}
              variant="outline"
              className={cn(
                isFullWidth ? 'w-full' : 'w-auto',
                'justify-center bg-white text-emerald-500 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors px-8',
                connecting && usingExisting && 'opacity-80'
              )}
              size="lg"
            >
              {connecting && usingExisting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                'Use Existing Connection (Skip OAuth)'
              )}
            </Button>
          )}
      </div>
  );
}