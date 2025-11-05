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
}

export function AmazonConnect({ onConnectionStart, onConnectionComplete, className }: AmazonConnectProps) {
  const [connecting, setConnecting] = useState(false);
  const [usingExisting, setUsingExisting] = useState(false);
  const { toast } = useToast();

  // Check if we should use sandbox mode
  const isSandboxMode = () => {
    if (typeof window === 'undefined') return false;
    
    // Check environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_SANDBOX === 'true') return true;
      if (import.meta.env.MODE === 'development') return true;
    }
    
    // Check if already in sandbox mode from previous session
    if (sessionStorage.getItem('amazon_sandbox_mode') === 'true') return true;
    if (localStorage.getItem('amazon_sandbox_mode') === 'true') return true;
    
    // Check if on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return true;
    }
    
    return false;
  };

  const handleUseExisting = async () => {
    try {
      setConnecting(true);
      setUsingExisting(true);
      onConnectionStart?.();

      // Use existing refresh token (bypass OAuth)
      const response = await api.useExistingAmazonConnection();
      
      if (response.ok) {
        // Check if bypass was successful
        if (response.data?.bypassed && response.data?.redirectUrl) {
          toast({
            title: 'Using Existing Connection',
            description: 'Connected with existing Amazon credentials!',
          });
          
          // Navigate to dashboard
          window.location.href = response.data.redirectUrl;
        } else {
          // Bypass didn't work, fall back to OAuth
          const authUrl = response.data?.auth_url || response.data?.authUrl;
          if (authUrl) {
            toast({
              title: 'OAuth Required',
              description: 'Redirecting to Amazon for authorization...',
            });
            window.location.href = authUrl;
          } else {
            toast({
              title: 'Connection Failed',
              description: 'No existing connection found. Please use OAuth.',
              variant: 'destructive'
            });
            setConnecting(false);
            setUsingExisting(false);
          }
        }
      } else {
        toast({
          title: 'Connection Failed',
          description: response.error || 'Could not use existing connection. Please try OAuth.',
          variant: 'destructive'
        });
        setConnecting(false);
        setUsingExisting(false);
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Use existing failed:', error);
      toast({
        title: 'Connection Error',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
      setConnecting(false);
      setUsingExisting(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setUsingExisting(false);
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
          connecting && !usingExisting && 'opacity-80',
          className
        )}
        size="lg"
      >
        {connecting && !usingExisting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect Amazon Account'
        )}
      </Button>
      
      {/* Use Existing Connection Button (for sandbox with refresh token) */}
      <Button
        onClick={handleUseExisting}
        disabled={connecting}
        variant="outline"
        className={cn(
          isFullWidth ? 'w-full' : 'w-auto',
          'justify-center border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors px-8',
          connecting && usingExisting && 'opacity-80',
          className
        )}
        size="lg"
      >
        {connecting && usingExisting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Using Existing Connection...
          </>
        ) : (
          'Use Existing Connection (Skip OAuth)'
        )}
      </Button>
    </div>
  );
}