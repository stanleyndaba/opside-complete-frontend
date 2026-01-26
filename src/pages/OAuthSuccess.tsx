import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Shield, ArrowRight, RefreshCw, Power, Mail, Cloud, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const GmailIcon = '/G.png';
const OutlookIcon = '/outlookicon.webp';
const GoogleDriveIcon = '/gd.png';
const DropboxIcon = '/Dropbox_Icon.svg.png';


const SCOPE_COPY: Record<string, { label: string; why: string }> = {
  'orders.read': {
    label: 'Orders (read-only)',
    why: 'We analyze order and shipment history to detect missing units and overcharges.'
  },
  'inventory.read': {
    label: 'Inventory (read-only)',
    why: 'We reconcile inventory adjustments to find lost or damaged items.'
  },
  'transactions.read': {
    label: 'Transactions (read-only)',
    why: 'We match payouts and fees to verify recoverable amounts.'
  },
  'invoices.read': {
    label: 'Invoices (read-only)',
    why: 'We automatically find supplier invoices to prove claims (Evidence Engine).'
  },
  'files.read': {
    label: 'Files (read-only)',
    why: 'We read receipts from Drive/Dropbox to complete evidence packets.'
  }
};

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [connectEvidenceOpen, setConnectEvidenceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);


  const params = useMemo(() => {
    const p = new URLSearchParams(location.search);
    console.log('[OAuthSuccess] Landing Parameters:', Object.fromEntries(p.entries()));
    return p;
  }, [location.search]);

  const status = params.get('status') || 'ok';
  const provider = params.get('provider') || 'amazon';
  const tenant_slug = params.get('tenant_slug') || params.get('tenant') || '';
  const authBridge = params.get('auth_bridge') === 'true';
  const errorCode = params.get('error') || '';
  const marketplaceId = params.get('marketplaceId') || '';
  const scopesParam = params.get('scopes') || '';
  const scopes = useMemo(() => scopesParam.split(',').map(s => s.trim()).filter(Boolean), [scopesParam]);

  useEffect(() => {
    console.log('[OAuthSuccess] Component mounted', { status, provider, tenant_slug, authBridge });

    api.trackEvent && (api as any).trackEvent('oauth_success_view', { provider, status, tenant_slug });

    (async () => {
      // If we have an auth bridge, wait longer for session to settle
      const waitTime = authBridge ? 1200 : 800;
      console.log(`[OAuthSuccess] Waiting ${waitTime}ms for session...`);
      await new Promise(r => setTimeout(r, waitTime));

      try {
        console.log('[OAuthSuccess] Fetching integrations status...');
        const res = await api.getIntegrationsStatus();
        if (res.ok) {
          console.log('[OAuthSuccess] Status loaded:', res.data);
          setStatusData(res.data);
        } else {
          console.warn('[OAuthSuccess] Status fetch failed (likely expected if anonymous):', res.status);
        }
      } catch (err) {
        console.error('[OAuthSuccess] Status fetch error:', err);
      }

      // Always prompt evidence connections regardless of Amazon status
      setTimeout(() => setConnectEvidenceOpen(true), 600);
    })();
  }, [provider, status, tenant_slug, authBridge]);

  const handleStartSync = async () => {
    setLoading(true);
    try {
      (api as any).trackEvent && (api as any).trackEvent('first_sync_clicked', { provider, tenant_slug });
    } catch { }

    // Navigate to the tenant-scoped sync page as requested
    if (tenant_slug) {
      navigate(`/app/${tenant_slug}/sync`);
    } else {
      navigate('/sync');
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    api.trackEvent('oauth_reconnect_clicked', { provider, tenant_slug });
    const res = await api.connectAmazon();
    setLoading(false);
    if (res.ok && res.data?.auth_url) window.location.href = res.data.auth_url;
  };

  const handleDisconnect = async (purge: boolean) => {
    setLoading(true);
    api.trackEvent('disconnect_clicked', { provider, purge, tenant_slug });
    await api.disconnectIntegration(provider, purge);
    const s = await api.getIntegrationsStatus();
    if (s.ok) setStatusData(s.data);
    setLoading(false);
    setDisconnectOpen(false);
  };

  const grantedScopes = scopes.length > 0 ? scopes : (statusData?.providers ? Object.keys(statusData.providers) : []);

  return (
    <PageLayout title="Authorised Successfully">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {status === 'ok' ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {status === 'ok' ? 'Authorised Successfully' : 'Connection Interrupted'}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {status === 'ok'
                    ? `Your ${provider === 'amazon' ? 'Amazon Store' : provider} is now securely linked to your dashboard.`
                    : errorCode ? `Connection failed: ${errorCode.replace(/_/g, ' ')}. Please retry or contact support.` : 'Please retry with the required permissions, or contact support if the problem persists.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'ok' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm font-medium text-emerald-800">
                  Authentication complete. We are now preparing your first scan to find recoveries.
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Permissions granted</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {grantedScopes.length > 0 ? (
                  grantedScopes.map((scope, idx) => (
                    <div key={`${scope}-${idx}`} className="flex items-start gap-2 p-3 rounded-lg border bg-gray-50/50">
                      <Shield className="h-4 w-4 mt-0.5 text-emerald-600" />
                      <div>
                        <div className="text-sm font-semibold">{SCOPE_COPY[scope]?.label || scope}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed">{SCOPE_COPY[scope]?.why || 'Used to improve recovery detection and reconciliation.'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg border-dashed">
                    Finalizing connection details...
                  </div>
                )}
              </div>
            </div>

            {status !== 'ok' ? (
              <div className="flex gap-3">
                <Button onClick={handleReconnect} disabled={loading} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Reconnect
                </Button>
                <Button variant="outline" onClick={() => navigate('/help')}>Get Help</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleStartSync} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]">
                  See Findings <ArrowRight className="h-5 w-5" />
                </Button>
                <Button variant="ghost" onClick={() => setDisconnectOpen(true)} className="gap-2 text-muted-foreground hover:text-red-600">
                  <Power className="h-4 w-4" /> Disconnect
                </Button>
              </div>
            )}

            {status === 'ok' && (
              <div className="text-xs text-muted-foreground">
                Tokens are stored encrypted. You can revoke access and purge documents at any time.
              </div>
            )}
          </CardContent>
        </Card>

        {status === 'ok' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">Provider</div>
                <Badge variant="secondary">{provider}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect & purge?</DialogTitle>
            <DialogDescription>
              This will revoke access and optionally delete all stored documents and evidence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDisconnect(true)}>Disconnect & purge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Connections Prompt - Standardized Design */}
      <Dialog open={connectEvidenceOpen} onOpenChange={setConnectEvidenceOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-gray-200 rounded-sm shadow-2xl bg-white">
          <DialogHeader className="px-6 py-5 bg-gray-900 border-b border-gray-900">
            <DialogTitle className="text-xs font-semibold text-white">Connect Document Sources</DialogTitle>
            <DialogDescription className="text-xs text-gray-400 mt-1 font-medium">
              AUTHORIZED ACCESS FOR DOCUMENT INGESTION
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  try {
                    setProviderLoading('gmail');
                    const r = await api.connectDocs('gmail');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Gmail connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'gmail'}
                className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                {providerLoading === 'gmail' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                ) : (
                  <img src={GmailIcon} alt="Gmail" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                )}
                <span className="text-xs font-bold text-gray-900 group-hover:text-black">Gmail</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('outlook');
                    const r = await api.connectDocs('outlook');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Outlook connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'outlook'}
                className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                {providerLoading === 'outlook' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                ) : (
                  <img src={OutlookIcon} alt="Outlook" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                )}
                <span className="text-xs font-bold text-gray-900 group-hover:text-black">Outlook</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('gdrive');
                    const r = await api.connectDocs('gdrive');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Google Drive connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'gdrive'}
                className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                {providerLoading === 'gdrive' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                ) : (
                  <img src={GoogleDriveIcon} alt="Google Drive" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                )}
                <span className="text-xs font-bold text-gray-900 group-hover:text-black">Drive</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('dropbox');
                    const r = await api.connectDocs('dropbox');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Dropbox connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'dropbox'}
                className="group flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-sm disabled:opacity-50">
                {providerLoading === 'dropbox' ? (
                  <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                ) : (
                  <img src={DropboxIcon} alt="Dropbox" className="h-8 w-8 object-contain grayscale group-hover:grayscale-0 transition-all duration-300" />
                )}
                <span className="text-xs font-bold text-gray-900 group-hover:text-black">Dropbox</span>
              </button>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConnectEvidenceOpen(false)}
              className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              Skip for Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}


