import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { startSync } from '@/lib/inventoryApi';

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const query = useQueryParams();
  const [statusMessage, setStatusMessage] = useState<string>('Finalizing connection...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const p = query.get('provider') || 'amazon';
    const error = query.get('error') || query.get('error_description');
    const success = query.get('success') || query.get('code') || query.get('state');
    const state = query.get('state');

    if (p) setProvider(p);

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setStatusMessage('Connection failed');
      api.trackEvent('oauth_callback_failure', { provider: p, error });
      toast({ title: 'Connection failed', description: decodeURIComponent(error) });
      return;
    }

    if (success || state) {
      setStatusMessage('Connection successful. Analyzing your account...');
      api.trackEvent('oauth_callback_success', { provider: p, state });

      // For real OAuth: Amazon automatically redirected here with code=... parameter
      // Backend should handle the callback automatically - frontend just displays status
      // DO NOT call callback endpoint directly - Amazon redirects here automatically
      if (p === 'amazon') {
        // Real OAuth callback - backend should have already processed the code
        // Just show success message and wait for backend to update status
        setStatusMessage('Connected! Scanning for recovery opportunities...');
        toast({ title: 'Amazon Connected', description: 'Analyzing your FBA data for recoveries...' });
      } else {
        toast({ title: 'Connected', description: 'Updating status and redirecting…' });
      }
    }
  }, [query, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Poll backend status briefly to reflect connection
      for (let i = 0; i < 5; i++) {
        const res = await api.getIntegrationsStatus();
        if (!res.ok) break;
        if (res.data?.amazon_connected || res.data?.docs_connected) {
          if (!cancelled) {
            setStatusMessage('Connected. Fetching recovery data...');

            // If Amazon is connected, check if sync needs to be triggered
            if (res.data?.amazon_connected && provider === 'amazon') {
              try {
                // Check if backend has already started sync (check sync status)
                const syncStatusRes = await api.getSyncStatus();
                const hasActiveSync = syncStatusRes.ok && syncStatusRes.data?.hasActiveSync;

                // If backend hasn't started sync automatically, trigger it from frontend
                if (!hasActiveSync) {
                  try {
                    console.log('[OAuthCallback] Backend didn\'t auto-start sync, triggering from frontend...');
                    const syncRes = await startSync();
                    if (syncRes?.syncId) {
                      console.log('[OAuthCallback] Sync started successfully:', syncRes.syncId);
                      // Redirect to sync page to show progress
                      navigate(`/sync?id=${syncRes.syncId}`);
                      return;
                    }
                  } catch (syncErr: unknown) {
                    console.error('[OAuthCallback] Failed to start sync:', syncErr);
                    // Continue to normal flow even if sync start fails
                  }
                }

                // Try to get recovery data for the reveal
                const recoveryRes = await api.getAmazonRecoveries();
                if (recoveryRes.ok && recoveryRes.data?.totalAmount) {
                  // Redirect with recovery data for the "shock and awe" reveal
                  navigate(`/integrations-hub?amazon_connected=true&recovery_amount=${recoveryRes.data.totalAmount}&currency=${recoveryRes.data.currency || 'USD'}&claim_count=${recoveryRes.data.claimCount || 0}`);
                  return;
                }
              } catch (err) {
                console.error('Failed to fetch recovery data:', err);
              }
            }
          }
          break;
        }
        await new Promise(r => setTimeout(r, 600));
      }
      if (!cancelled) {
        setTimeout(() => navigate('/integrations-hub?amazon_connected=true'), 600);
      }
    })();
    return () => { cancelled = true };
  }, [navigate, provider]);

  return (
    <PageLayout title="Connecting Account">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_bottom,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%),linear-gradient(to_right,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%)] bg-[length:36px_36px]" />

          <div className="relative max-w-xl mx-auto">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle>OAuth Callback</CardTitle>
                <CardDescription>
                  {provider ? `Provider: ${provider}` : 'Completing connection'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!errorMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="relative inline-flex items-center">
                        <span className="absolute -inset-3 rounded-full bg-emerald-400/20 blur-2xl" />
                        <img src="/donelogo.png" alt="Margin" className="relative h-5 w-5 opacity-90" />
                      </span>
                      <span className="font-medium">{statusMessage}</span>
                      {statusMessage.includes('Analyzing') && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Scanning FBA transactions, fees, and inventory data...
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      You can safely close this page. We’ll take you back to Integrations.
                    </div>
                    <div>
                      <Button onClick={() => navigate('/integrations-hub')} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Go to Integrations Hub
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">{errorMessage}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Access was denied or failed. You can retry connecting with the correct account and read-only permissions.
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate('/integrations-hub')} className="gap-2">
                        Back to Integrations
                      </Button>
                      {provider && (
                        <Button onClick={async () => {
                          const p = provider as 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
                          const res = await api.connectDocs(p);
                          if (res.ok && res.data?.redirect_url) window.location.href = res.data.redirect_url;
                        }} className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Try Again
                        </Button>
                      )}
                    </div>
                    <div>
                      <Badge variant="secondary">Scopes</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        We request read-only access to emails and files for invoice ingestion. We never send email, alter files, or delete content.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

