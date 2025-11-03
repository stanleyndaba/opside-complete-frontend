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

  const handleConnect = async () => {
    try {
      setConnecting(true);
      onConnectionStart?.();

      // Step 1: Get Amazon OAuth URL
      const response = await api.connectAmazon();
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to initiate Amazon connection');
      }

      if (response.data?.auth_url) {
        // Track the connection attempt
        await api.trackEvent('amazon_connect_initiated', { 
          timestamp: new Date().toISOString(),
          source: 'zero_friction_onboarding'
        });

        // Redirect to Amazon OAuth
        window.location.href = response.data.auth_url;
      } else {
        throw new Error('No authorization URL received from backend');
      }
    } catch (error: any) {
      console.error('Amazon connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Unable to connect to Amazon. Please try again.',
        variant: 'destructive'
      });
      setConnecting(false);
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