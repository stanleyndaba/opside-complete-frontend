import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, DollarSign, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

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
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Connect Your Amazon Account</CardTitle>
        <CardDescription className="text-lg">
          One click to unlock your FBA recovery potential
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-sm font-medium">Instant Setup</div>
            <div className="text-xs text-muted-foreground">60 seconds</div>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-sm font-medium">Find Money</div>
            <div className="text-xs text-muted-foreground">Automatic scan</div>
          </div>
          <div className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-sm font-medium">Secure</div>
            <div className="text-xs text-muted-foreground">Read-only access</div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 text-lg"
            size="lg"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to Amazon...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Connect Amazon Account
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              Secure OAuth 2.0
            </Badge>
            <span>•</span>
            <Badge variant="secondary" className="text-xs">
              Read-only permissions
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="text-sm font-medium mb-2">What happens next:</div>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Secure redirect to Amazon Seller Central</li>
            <li>2. Grant read-only access (1 click approval)</li>
            <li>3. Automatic data sync begins</li>
            <li>4. Recovery opportunities detected</li>
          </ol>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          By connecting, you agree to our secure data handling practices. 
          We never modify your Amazon data or make changes to your account.
        </div>
      </CardContent>
    </Card>
  );
}