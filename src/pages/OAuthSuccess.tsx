import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertTriangle, Shield, ArrowRight, RefreshCw, Power } from 'lucide-react';
import { api } from '@/lib/api';

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
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const status = params.get('status') || 'ok';
  const provider = params.get('provider') || 'amazon';
  const scopesParam = params.get('scopes') || '';
  const scopes = useMemo(() => scopesParam.split(',').map(s => s.trim()).filter(Boolean), [scopesParam]);

  useEffect(() => {
    api.trackEvent('oauth_success_view', { provider, status });
    (async () => {
      const res = await api.getIntegrationsStatus();
      if (res.ok) setStatusData(res.data);
    })();
  }, [provider, status]);

  const handleStartSync = async () => {
    setLoading(true);
    const res = await api.startAmazonSync();
    setLoading(false);
    if (res.ok) navigate(`/sync?id=${encodeURIComponent(res.data!.syncId)}`);
  };

  const handleReconnect = async () => {
    setLoading(true);
    const res = await api.connectAmazon();
    setLoading(false);
    if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url;
  };

  const handleDisconnect = async (purge: boolean) => {
    setLoading(true);
    await api.disconnectIntegration(provider, purge);
    const s = await api.getIntegrationsStatus();
    if (s.ok) setStatusData(s.data);
    setLoading(false);
    setDisconnectOpen(false);
  };

  const grantedScopes = scopes.length > 0 ? scopes : (statusData?.providers ? Object.keys(statusData.providers) : []);

  return (
    <PageLayout title="Connection Complete">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {status === 'ok' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <CardTitle className="text-xl">
                  {status === 'ok' ? 'Connected — We are starting your scan' : 'We could not complete the connection'}
                </CardTitle>
                <CardDescription>
                  {status === 'ok'
                    ? 'You will see your estimate and first findings in about 60–120 seconds.'
                    : 'Please retry with the required permissions, or contact support if the problem persists.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Access we request — and why</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {grantedScopes.length > 0 ? (
                  grantedScopes.map((scope, idx) => (
                    <div key={`${scope}-${idx}`} className="flex items-start gap-2 p-2 rounded-md border">
                      <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{SCOPE_COPY[scope]?.label || scope}</div>
                        <div className="text-xs text-muted-foreground">{SCOPE_COPY[scope]?.why || 'Used to improve recovery detection and reconciliation.'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Scopes will appear once the connection is finalized.</div>
                )}
              </div>
            </div>

            {status !== 'ok' ? (
              <div className="flex gap-3">
                <Button onClick={handleReconnect} disabled={loading} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Reconnect with correct permissions
                </Button>
                <Button variant="outline" onClick={() => navigate('/help')}>Get Help</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleStartSync} disabled={loading} className="gap-2">
                  <ArrowRight className="h-4 w-4" /> See what we found
                </Button>
                <Button variant="outline" onClick={() => setDisconnectOpen(true)} className="gap-2">
                  <Power className="h-4 w-4" /> Disconnect & purge
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
    </PageLayout>
  );
}

