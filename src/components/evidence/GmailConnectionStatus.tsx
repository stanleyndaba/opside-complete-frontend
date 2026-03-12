import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
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
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug || 'beta';

  useEffect(() => {
    if (isReady) {
      fetchGmailStatus();
    }
  }, [isReady, activeSlug]);

  const fetchGmailStatus = async () => {
    try {
      setLoading(true);

      // Try getGmailStatus first (specific endpoint)
      let gmailRes = await api.getGmailStatus(activeSlug);

      // Also get integrations status and evidence sources for robust checking
      const [integrationsRes, sourcesRes] = await Promise.all([
        api.getIntegrationsStatus(activeSlug),
        api.getEvidenceSources(activeSlug)
      ]);

      // Helper function to determine if Gmail is connected robustly
      const isGmailConnected = (): boolean => {
        let isConnected = false;
        
        // 1. Check specific Gmail status endpoint
        if (gmailRes?.ok && gmailRes.data?.connected === true) {
          isConnected = true;
        }

        // 2. Check integrations status
        if (!isConnected && integrationsRes?.ok && integrationsRes.data) {
          const statusObj = integrationsRes.data as any;
          if (statusObj?.providerIngest?.['gmail']?.connected === true) isConnected = true;
          if (!isConnected && statusObj?.providerIngest?.['Gmail']?.connected === true) isConnected = true;
          if (!isConnected && statusObj?.providers?.['gmail'] === true) isConnected = true;
          if (!isConnected && statusObj?.providers?.['Gmail'] === true) isConnected = true;
          if (!isConnected && statusObj?.gmail_connected === true) isConnected = true;
        }

        // 3. Check evidence sources array
        if (!isConnected && sourcesRes?.ok && sourcesRes.data?.sources) {
          const sources = sourcesRes.data.sources;
          if (sources.some((s: any) => s.provider?.toLowerCase() === 'gmail' && s.status === 'connected')) {
            isConnected = true;
          }
        }

        return isConnected;
      };

      const connected = isGmailConnected();

      // Get email from either endpoint
      const email = gmailRes?.ok && gmailRes.data?.email
        ? gmailRes.data.email
        : undefined;

      // Get lastSync from either endpoint — backend returns lastSync not last_sync_at
      const lastSync = gmailRes?.ok && (gmailRes.data as any)?.lastSync
        ? (gmailRes.data as any).lastSync
        : gmailRes?.ok && gmailRes.data?.last_sync_at
          ? gmailRes.data.last_sync_at
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
      <div className="flex items-center gap-4 py-4">
        <div className="relative flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500/40"></span>
        </div>
        <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Connecting...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl group-hover:border-emerald-500/30 transition-colors">
            <img src="/G.png" alt="Gmail" className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans font-bold text-emerald-500/50 uppercase tracking-tight">Data Source</span>
            <h3 className="text-sm font-sans font-bold text-white tracking-tight uppercase">Gmail Connection</h3>
          </div>
        </div>

        {status?.connected ? (
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-sans font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </div>
        ) : (
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] font-sans font-bold text-amber-500 uppercase tracking-tight flex items-center gap-1.5 rounded-sm">
            <XCircle className="w-3 h-3" />
            Disconnected
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight block">Connected Email</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold text-white/60 tracking-tight">
                {status?.email || 'Not authorized'}
              </span>
            </div>
          </div>

          {showActions && status?.connected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="h-9 px-4 text-[10px] font-sans font-bold text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 transition-all uppercase tracking-tight rounded-lg"
            >
              {disconnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Disconnect Gmail
                </>
              )}
            </Button>
          )}

          {!status?.connected && showActions && (
            <Link to="/integrations-hub">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 text-[10px] font-sans font-bold text-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all uppercase tracking-tight rounded-lg"
              >
                Connect Gmail
              </Button>
            </Link>
          )}
        </div>

        {status?.connected && status.lastSync && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <RefreshCw className="h-3 w-3 text-white/20" />
            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">
              Last Sync: <span className="text-white/40">{new Date(status.lastSync).toLocaleString().toUpperCase()}</span>
            </span>
          </div>
        )}

        {!status?.connected && (
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-lg">
            <p className="text-[10px] font-sans font-bold text-white/20 leading-relaxed uppercase tracking-tight">
              Please connect your Gmail to allow the system to automatically scan for invoice attachments and evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
