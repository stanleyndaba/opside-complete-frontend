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

  const handleConnect = async () => {
    try {
      setConnecting(true);
      onConnectionStart?.();

      // If sandbox mode is enabled, go directly to sandbox flow
      if (isSandboxMode()) {
        console.log('[AmazonConnect] Sandbox mode detected - redirecting to sandbox flow');
        const state = `demo_${Date.now()}`;
        window.location.href = `/auth/amazon-sandbox?state=${encodeURIComponent(state)}`;
        return;
      }

      // Step 1: Call /auth/start to get OAuth URL
      const response = await api.connectAmazon();
      
      if (!response.ok) {
        console.warn('[AmazonConnect] Real OAuth failed, falling back to sandbox:', response.error);
        // Fallback to sandbox mode if real OAuth fails
        toast({
          title: 'Using Sandbox Mode',
          description: 'Real Amazon OAuth unavailable. Using sandbox mode for testing.',
        });
        const state = `demo_${Date.now()}`;
        window.location.href = `/auth/amazon-sandbox?state=${encodeURIComponent(state)}`;
        return;
      }

      // Handle both auth_url and authUrl (backend may return either)
      const authUrl = response.data?.auth_url || response.data?.authUrl;
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
        // No auth URL received, fallback to sandbox
        console.warn('[AmazonConnect] No auth URL received, falling back to sandbox');
        toast({
          title: 'Using Sandbox Mode',
          description: 'No authorization URL received. Using sandbox mode for testing.',
        });
        const state = `demo_${Date.now()}`;
        window.location.href = `/auth/amazon-sandbox?state=${encodeURIComponent(state)}`;
      }
    } catch (error: any) {
      console.error('[AmazonConnect] Connection failed, falling back to sandbox:', error);
      toast({
        title: 'Using Sandbox Mode',
        description: 'Connection failed. Using sandbox mode for testing.',
      });
      const state = `demo_${Date.now()}`;
      window.location.href = `/auth/amazon-sandbox?state=${encodeURIComponent(state)}`;
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className={cn(
        'w-auto justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg transition-colors px-8',
        connecting && 'opacity-80',
        className
      )}
      size="lg"
    >
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Amazon Account'
      )}
    </Button>
  );
}