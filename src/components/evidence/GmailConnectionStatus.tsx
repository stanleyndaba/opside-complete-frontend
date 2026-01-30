import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="flex items-center gap-4 py-4">
        <div className="relative flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500/40"></span>
        </div>
        <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">INITIATING_SECURE_LINK...</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl group-hover:border-emerald-500/30 transition-colors">
            <Mail className="h-4 w-4 text-emerald-500/50" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-widest">DATASOURCE_01</span>
            <h3 className="text-sm font-serif font-medium text-white tracking-wide uppercase">Gmail_Connection</h3>
          </div>
        </div>

        {status?.connected ? (
          <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
            <CheckCircle2 className="w-3 h-3" />
            SECURE_LINK_ACTIVE
          </div>
        ) : (
          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 rounded-sm">
            <XCircle className="w-3 h-3" />
            NODE_OFFLINE
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider block">IDENTIFIED_ENDPOINT</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/60">
                {status?.email || 'AWAITING_AUTHORIZATION'}
              </span>
            </div>
          </div>

          {showActions && status?.connected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="h-9 px-4 text-[10px] font-mono font-bold text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 transition-all uppercase tracking-widest rounded-lg"
            >
              {disconnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  SEVERING...
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  SEVER_LINK
                </>
              )}
            </Button>
          )}

          {!status?.connected && showActions && (
            <Link to="/integrations-hub">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 text-[10px] font-mono font-bold text-emerald-500/50 hover:text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all uppercase tracking-widest rounded-lg"
              >
                AUTHORIZE_NODE
              </Button>
            </Link>
          )}
        </div>

        {status?.connected && status.lastSync && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <RefreshCw className="h-3 w-3 text-white/20" />
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
              LAST_SYNCHRONIZATION_EVENT: <span className="text-white/40">{new Date(status.lastSync).toLocaleString().toUpperCase()}</span>
            </span>
          </div>
        )}

        {!status?.connected && (
          <div className="p-4 bg-white/[0.01] border border-white/5 rounded-lg">
            <p className="text-[10px] font-mono text-white/20 leading-relaxed uppercase tracking-wider">
              System awaits authorization to initiate autonomous document ingestion protocol.
              Gmail link required for forensic scanning of invoice attachments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

