import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

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

  useEffect(() => {
    const p = query.get('provider');
    const error = query.get('error') || query.get('error_description');
    const success = query.get('success') || query.get('code');
    if (p) setProvider(p);
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setStatusMessage('Connection failed');
      api.trackEvent('oauth_callback_failure', { provider: p, error });
      return;
    }
    if (success) {
      setStatusMessage('Connection successful. Updating status...');
      api.trackEvent('oauth_callback_success', { provider: p });
    }
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Poll backend status briefly to reflect connection
      for (let i = 0; i < 5; i++) {
        const res = await api.getIntegrationsStatus();
        if (!res.ok) break;
        if (res.data?.amazon_connected || res.data?.docs_connected) {
          if (!cancelled) setStatusMessage('Connected. Redirecting...');
          break;
        }
        await new Promise(r => setTimeout(r, 600));
      }
      if (!cancelled) {
        setTimeout(() => navigate('/integrations-hub'), 600);
      }
    })();
    return () => { cancelled = true };
  }, [navigate]);

  return (
    <PageLayout title="Connecting Account">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>OAuth Callback</CardTitle>
            <CardDescription>
              {provider ? `Provider: ${provider}` : 'Completing connection'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!errorMessage ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{statusMessage}</span>
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
    </PageLayout>
  );
}

