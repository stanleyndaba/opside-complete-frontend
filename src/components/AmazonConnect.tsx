import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { tenantRoute } from '@/lib/routes';
import { useTenant } from '@/contexts/TenantContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AMAZON_MARKETPLACES } from '@/lib/amazonMarketplaces';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

interface AmazonConnectProps {
  onConnectionStart?: () => void;
  onConnectionComplete?: (data: any) => void;
  className?: string;
  showUseExisting?: boolean;
  label?: string;
}

export function AmazonConnect({ onConnectionStart, onConnectionComplete, className, showUseExisting = true, label = "Connect Account" }: AmazonConnectProps) {
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const currentTenantSlug = tenantSlug || tenant?.slug || 'beta';
  const { isFull, capacity } = useOnboardingCapacity();

  const [connecting, setConnecting] = useState(false);
  const [usingExisting, setUsingExisting] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>(''); // No default to show placeholder
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setConnecting(true);
      if (showUseExisting) {
        setUsingExisting(false);
      }
      onConnectionStart?.();

      if (!selectedMarketplace) {
        toast({
          title: 'Marketplace Required',
          description: 'Please select an Amazon Marketplace to continue.',
          variant: 'destructive'
        });
        setConnecting(false);
        return;
      }

      // ✅ CORRECT: Start OAuth flow with selected marketplace
      const response = await api.connectAmazon(selectedMarketplace, false, currentTenantSlug);

      if (!response.ok) {
        console.error('[AmazonConnect] Failed to get OAuth URL:', response.error);

        // Check if backend returned authUrl in error response (backwards compatibility)
        const errorData = (typeof response.error === 'object' ? response.error : {}) as any;
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
      const data = response.data as any;
      const authUrl = data?.auth_url || data?.authUrl;
      const stateParam = data?.state;

      if (stateParam) {
        try {
          sessionStorage.setItem('amazon_sandbox_state', stateParam);
          localStorage.setItem('amazon_sandbox_state', stateParam);
        } catch { }
      }

      if (authUrl && authUrl.includes('/auth/amazon-sandbox')) {
        try {
          sessionStorage.setItem('amazon_sandbox_mode', 'true');
          localStorage.setItem('amazon_sandbox_mode', 'true');
        } catch { }
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
        const statusResponse = await api.getIntegrationsStatus(currentTenantSlug);
        console.log('[AmazonConnect] Connection status response:', statusResponse);
        if (statusResponse.ok && statusResponse.data?.amazon_connected) {
          // Amazon is already connected! Redirect to sync page to start syncing with dialogue logs
          console.log('[AmazonConnect] ✅ Amazon already connected, starting sync...');
          setConnecting(false);
          setUsingExisting(false);
          navigate(tenantRoute(currentTenantSlug, '/sync'));
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
      const bypassPromise = api.useExistingAmazonConnection(undefined, currentTenantSlug);
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
          const data = response.data as any;
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

          // Redirect to sync page to show the live dialogue logs
          navigate(tenantRoute(currentTenantSlug, '/sync'));
          return;
        }

        // If no refresh token found, go to sync page which will show the connection prompt
        console.log('[AmazonConnect] ⚠️ No refresh token found, redirecting to sync');
        toast({
          title: 'No Existing Connection',
          description: 'Please connect your Amazon account first.',
          duration: 3000,
        });
        navigate(tenantRoute(currentTenantSlug, '/sync'));
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

  // Filter out layout-specific classes that should only apply to the container
  const buttonClassName = className?.split(' ')
    .filter(c => !c.startsWith('h-') && !c.startsWith('w-') && !c.startsWith('min-w-') && !c.startsWith('px-') && !c.startsWith('py-') && !c.startsWith('rounded-'))
    .join(' ');

  if (isFull) {
    return (
      <div className={cn(
        "w-full",
        isFullWidth ? "max-w-[310px] sm:max-w-none" : "max-w-[310px] sm:w-auto sm:min-w-[280px]",
        className
      )}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
          <div className="text-[11px] font-semibold tracking-tight text-white">
            We’re onboarding a small batch of sellers right now.
          </div>
          <div className="mt-1 text-[10px] text-white/60">
            Next batch opens in {capacity?.nextBatchHours ?? 24} hours.
          </div>
          <Button
            onClick={() => navigate('/waitlist?reason=capacity')}
            className="mt-3 h-9 w-full rounded-full border border-white/10 bg-white text-[10px] font-semibold uppercase tracking-tight text-black hover:bg-white/90"
          >
            Join Waitlist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-row items-center bg-white rounded-full p-0.5 sm:p-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden",
      isFullWidth ? "w-full max-w-[310px] sm:max-w-none" : "w-full max-w-[310px] sm:w-auto sm:min-w-[280px]",
      // Apply original layout classes ONLY to the container
      className?.split(' ').filter(c => c.startsWith('w-') || c.startsWith('min-w-') || c.startsWith('mt-') || c.startsWith('mb-')).join(' ')
    )}>
      {/* Marketplace Selector - Transparent Background */}
      <div className="flex-[1] min-w-[70px] sm:min-w-[140px]">
        <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace} disabled={connecting}>
          <SelectTrigger
            className={cn(
              "w-full bg-transparent border-none text-black font-semibold focus:ring-0 transition-all px-2 sm:px-4 h-9 sm:h-11 text-[9px] sm:text-xs tracking-tight",
              buttonClassName
            )}>
            <div className="flex items-center justify-between w-full gap-1 sm:gap-2 px-0.5 sm:px-1">
              <SelectValue placeholder="Marketplace" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-100 shadow-2xl rounded-xl text-black min-w-[200px]">
            {AMAZON_MARKETPLACES.map((mp) => (
              <SelectItem key={mp.id} value={mp.id} className="text-sm font-normal py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                {mp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connect Button - Inset In Black */}
      <Button
        onClick={handleConnect}
        disabled={connecting || !selectedMarketplace}
        className={cn(
          "w-auto flex-[1.4] min-w-[110px] sm:min-w-[0]",
          "justify-center font-bold transition-all active:scale-95 px-3 sm:px-8 shrink-0 items-center rounded-full h-9 sm:h-auto py-2 sm:py-3 text-[9px] sm:text-xs",
          "bg-black text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40 disabled:text-white/55",
          connecting && 'opacity-80',
          buttonClassName
        )}>
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            <span className="hidden sm:inline">Waiting...</span>
            <span className="sm:hidden">Wait</span>
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}
