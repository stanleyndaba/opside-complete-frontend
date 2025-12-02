import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Mail, CheckCircle2, XCircle, RefreshCw, LogOut } from 'lucide-react';

interface GmailConnectionStatusProps {
  onStatusChange?: (connected: boolean) => void;
  showActions?: boolean;
}

export function GmailConnectionStatus({ onStatusChange, showActions = true }: GmailConnectionStatusProps) {
  const [status, setStatus] = useState<{
    connected: boolean;
    lastSync?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      setLoading(true);
      
      // Try getGmailStatus first (specific endpoint)
      let gmailRes = await api.getGmailStatus();
      
      // Also check getIntegrationsStatus as fallback (more comprehensive)
      const integrationsRes = await api.getIntegrationsStatus();
      
      // Helper function to determine if Gmail is connected - only return true when explicitly verified
      const isGmailConnected = (): boolean => {
        // Check specific Gmail status endpoint first - must explicitly be true
        if (gmailRes?.ok && gmailRes.data?.connected === true) return true;
        
        // Check integrations status providerIngest - must explicitly be true
        if (integrationsRes?.ok && integrationsRes.data) {
          const data = integrationsRes.data;
          // Check providerIngest with lowercase - must be explicitly true
          if (data.providerIngest?.['gmail']?.connected === true) return true;
          // Check providerIngest with capitalized - must be explicitly true
          if (data.providerIngest?.['Gmail']?.connected === true) return true;
          // Check top-level gmail_connected field - must be explicitly true
          if ((data as any).gmail_connected === true) return true;
        }
        
        // Only return true if explicitly verified - don't assume connected
        return false;
      };
      
      const connected = isGmailConnected();
      
      // Get email from either endpoint
      const email = gmailRes?.ok && gmailRes.data?.email 
        ? gmailRes.data.email 
        : integrationsRes?.ok && integrationsRes.data?.providerIngest?.['gmail']?.email
        ? integrationsRes.data.providerIngest['gmail'].email
        : integrationsRes?.ok && integrationsRes.data?.providerIngest?.['Gmail']?.email
        ? integrationsRes.data.providerIngest['Gmail'].email
        : undefined;
      
      // Get lastSync from either endpoint
      const lastSync = gmailRes?.ok && gmailRes.data?.lastSync
        ? gmailRes.data.lastSync
        : integrationsRes?.ok && integrationsRes.data?.providerIngest?.['gmail']?.lastIngest
        ? integrationsRes.data.providerIngest['gmail'].lastIngest
        : integrationsRes?.ok && integrationsRes.data?.providerIngest?.['Gmail']?.lastIngest
        ? integrationsRes.data.providerIngest['Gmail'].lastIngest
        : undefined;
      
      setStatus({
        connected,
        email,
        lastSync,
      });
      onStatusChange?.(connected);
    } catch (error) {
      console.error('Failed to fetch Gmail status:', error);
      setStatus({ connected: false });
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop automatic evidence collection.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const res = await api.disconnectGmail();
      if (res.ok) {
        setStatus({ connected: false });
        onStatusChange?.(false);
        toast({
          title: 'Gmail Disconnected',
          description: 'Gmail integration has been disconnected successfully.',
        });
      } else {
        toast({
          title: 'Disconnect Failed',
          description: res.error || 'Failed to disconnect Gmail. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
      toast({
        title: 'Disconnect Failed',
        description: 'An error occurred while disconnecting Gmail.',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading Gmail status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#36454F] font-medium">
          <img src="/G.png" alt="Gmail" className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription className="text-gray-400">
          Connect Gmail to automatically ingest evidence documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.connected ? (
              <>
                <Badge className="bg-blue-500 text-white border-blue-500 font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
                {status.email && (
                  <span className="text-sm text-gray-300">{status.email}</span>
                )}
              </>
            ) : (
              <Badge className="bg-blue-500 text-white border-blue-500">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          {showActions && status?.connected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-transparent border-0 text-red-400 hover:bg-red-500/10"
            >
              {disconnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          )}
        </div>

        {status?.connected && status.lastSync && (
          <div className="text-sm text-gray-400">
            Last sync: {new Date(status.lastSync).toLocaleString()}
          </div>
        )}

        {!status?.connected && showActions && (
          <div className="text-sm text-gray-400">
            Connect Gmail to start automatically collecting evidence documents from your emails.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

