import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { tenantRoute } from '@/lib/routes';
import { useTenant } from '@/contexts/TenantContext';
import {
  getProviderConnectionContext,
  hasAuthoritativeCallbackConfirmation,
  isSupportedOAuthProvider,
} from '@/lib/oauthCallbackConfirmation';

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function providerLabel(provider: string): string {
  const labels: Record<string, string> = {
    amazon: 'Amazon',
    gmail: 'Gmail',
    outlook: 'Outlook',
    gdrive: 'Google Drive',
    dropbox: 'Dropbox',
    slack: 'Slack',
    adobe_sign: 'Adobe Sign',
    onedrive: 'OneDrive',
    quickbooks: 'QuickBooks',
    xero: 'Xero',
  };
  return labels[provider] || 'this provider';
}

function hasPendingAuditContext() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('margin_pending_audit');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { auditId?: string; tenantSlug?: string; phase?: string };
    return Boolean(parsed.auditId && parsed.tenantSlug && parsed.phase === 'amazon_oauth_started');
  } catch {
    return false;
  }
}

function buildAuditContinuationPath(query: URLSearchParams, confirmedAmazon: boolean) {
  const preserved = new URLSearchParams();
  for (const key of ['auditId', 'auditIntentId', 'tenant_slug', 'tenant_id', 'store_id', 'seller_id', 'marketplaceId', 'marketplace_id']) {
    const value = query.get(key);
    if (value) preserved.set(key, value);
  }
  if (confirmedAmazon) preserved.set('amazon_connected', '1');

  const suffix = preserved.toString();
  return suffix ? `/audit?${suffix}` : '/audit';
}

function isSupportedDocumentProvider(provider: string): provider is 'gmail' | 'outlook' | 'gdrive' | 'dropbox' {
  return provider === 'gmail' || provider === 'outlook' || provider === 'gdrive' || provider === 'dropbox';
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const query = useQueryParams();
  const queryProvider = getProviderConnectionContext(query).provider || '';
  const [statusMessage, setStatusMessage] = useState<string>('Finalizing connection...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>(queryProvider);
  const [providerConfirmed, setProviderConfirmed] = useState(false);
  const { toast } = useToast();
  const { isReady } = useTenant();
  const providerSupported = isSupportedOAuthProvider(provider);
  const isAmazon = provider === 'amazon';
  const hasAuditContinuation = isAmazon && (
    hasPendingAuditContext() || Boolean(query.get('auditId')) || Boolean(query.get('auditIntentId'))
  );
  const auditContinuationPath = buildAuditContinuationPath(query, isAmazon && providerConfirmed);
  const unsupportedProviderMessage = providerSupported
    ? null
    : 'Margin could not identify this connection provider. No connection was marked complete.';
  const visibleError = errorMessage || unsupportedProviderMessage;

  useEffect(() => {
    const nextProvider = getProviderConnectionContext(query).provider || '';
    const callbackError = query.get('error') || query.get('error_description');
    setProvider(nextProvider);
    setProviderConfirmed(false);

    // Every browser callback value is contextual only. A provider is marked
    // connected only by the provider-specific integration status check below.
    if (!isSupportedOAuthProvider(nextProvider)) {
      setErrorMessage('Margin could not identify this connection provider. No connection was marked complete.');
      setStatusMessage('Connection provider was not recognized.');
      api.trackEvent('oauth_callback_failure', { provider: nextProvider, error: 'unsupported_provider' });
      toast({
        title: 'Connection provider was not recognized.',
        description: 'No connection was marked complete.',
      });
      return;
    }

    if (callbackError || query.get('status') === 'error') {
      setErrorMessage('No connection was made. You can try again whenever you are ready.');
      setStatusMessage('No connection was made.');
      api.trackEvent('oauth_callback_failure', { provider: nextProvider, error: callbackError || 'provider_error' });
      toast({ title: 'No connection was made.', description: 'You can try again whenever you are ready.' });
      return;
    }

    setErrorMessage(null);
    setStatusMessage(
      nextProvider === 'amazon'
        ? 'Margin is confirming the Amazon connection. It will not mark this connection complete until that confirmation is available.'
        : `Margin is confirming the ${providerLabel(nextProvider)} connection. It will not mark this connection complete until that provider is confirmed.`
    );
  }, [query, toast]);

  useEffect(() => {
    if (!isReady || !providerSupported || visibleError || providerConfirmed) return;

    let cancelled = false;
    let navigationTimer: number | null = null;

    const confirmProviderConnection = async () => {
      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const response = await api.getIntegrationsStatus(tenantSlug);
          if (!response.ok || !response.data) break;

          const confirmed = hasAuthoritativeCallbackConfirmation(provider, response.data);

          if (confirmed) {
            if (cancelled) return;

            setProviderConfirmed(true);
            setStatusMessage(
              provider === 'amazon'
                ? 'Amazon connection confirmed. Continue to your Recovery Audit when you are ready.'
                : `${providerLabel(provider)} connection confirmed. Updating your workspace…`
            );
            api.trackEvent('oauth_callback_success', { provider, state: query.get('state') });

            if (provider !== 'amazon') {
              navigationTimer = window.setTimeout(() => {
                if (!cancelled) navigate(tenantRoute(tenantSlug || 'beta', '/integrations-hub'));
              }, 600);
            }
            return;
          }

          await new Promise((resolve) => window.setTimeout(resolve, 600));
        }

        if (!cancelled) {
          setStatusMessage(
            provider === 'amazon'
              ? 'Margin could not confirm the Amazon connection yet. Return to your Audit to try again or use supported Amazon reports.'
              : `Margin could not confirm the ${providerLabel(provider)} connection yet. Return to Integrations to try again.`
          );
        }
      } catch {
        if (!cancelled) {
          setStatusMessage(
            provider === 'amazon'
              ? 'Margin could not verify Amazon access right now. Return to your Audit to try again or use supported Amazon reports.'
              : `Margin could not verify the ${providerLabel(provider)} connection right now. Return to Integrations to try again.`
          );
        }
      }
    };

    void confirmProviderConnection();

    return () => {
      cancelled = true;
      if (navigationTimer !== null) window.clearTimeout(navigationTimer);
    };
  }, [isReady, navigate, provider, providerSupported, query, tenantSlug, visibleError]);

  const retryDocumentConnection = async () => {
    if (!isSupportedDocumentProvider(provider)) return;
    const response = await api.connectDocs(provider, tenantSlug);
    if (response.ok && response.data?.auth_url) window.location.href = response.data.auth_url;
  };

  const primaryDestination = isAmazon
    ? auditContinuationPath
    : tenantRoute(tenantSlug || 'beta', '/integrations-hub');
  const primaryLabel = isAmazon
    ? providerConfirmed
      ? (hasAuditContinuation ? 'Back to Audit' : 'Audit Seller Account')
      : 'Return to Audit'
    : providerConfirmed
      ? 'Go to Integrations Hub'
      : 'Return to Integrations Hub';

  return (
    <PageLayout title="Connecting Account">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative min-h-[calc(100vh+96px)] w-full -mt-24 bg-[#0B1220] pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%),linear-gradient(to_right,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%)] bg-[length:36px_36px] opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

          <div className="relative mx-auto max-w-xl">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>{isAmazon ? 'Amazon connection' : providerSupported ? `${providerLabel(provider)} connection` : 'Connection handoff needs attention'}</CardTitle>
                <CardDescription>
                  {providerSupported ? `Provider: ${providerLabel(provider)}` : 'Provider: not recognized'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!visibleError ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="relative inline-flex items-center">
                        <span className="absolute -inset-3 rounded-full bg-emerald-400/20 blur-2xl" />
                        {providerConfirmed ? <CheckCircle className="relative h-5 w-5" /> : <RefreshCw className="relative h-5 w-5 animate-spin" />}
                      </span>
                      <span className="font-medium">{statusMessage}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isAmazon
                        ? 'Margin keeps this connection unconfirmed until its stored Amazon connection record is valid for this workspace.'
                        : `Margin keeps this connection unconfirmed until ${providerLabel(provider)} is confirmed for this workspace.`}
                    </div>
                    <div>
                      <Button onClick={() => navigate(primaryDestination)} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {primaryLabel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">{visibleError}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isAmazon
                        ? 'Access was denied or failed. You can retry connecting with the correct account and the required permissions.'
                        : 'Return to Integrations and start the connection again from the provider you need.'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => navigate(primaryDestination)} className="gap-2">
                        Back to {isAmazon ? 'Audit' : 'Integrations'}
                      </Button>
                      {!isAmazon && isSupportedDocumentProvider(provider) ? (
                        <Button onClick={retryDocumentConnection} className="gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Try Again
                        </Button>
                      ) : null}
                    </div>
                    {!isAmazon ? (
                      <div>
                        <Badge variant="secondary">Scopes</Badge>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Margin scans connected evidence sources only after the provider confirms the required permissions. It does not mark this source connected from callback URL data.
                        </div>
                      </div>
                    ) : null}
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
