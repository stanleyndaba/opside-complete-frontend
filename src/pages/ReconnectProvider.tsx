import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Cloud, Shield, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; colorClass: string; scopes: string[] }> = {
  amazon: {
    label: 'Amazon SP-API',
    icon: <Shield className="h-6 w-6 text-emerald-400" />,
    colorClass: 'bg-emerald-500 hover:bg-emerald-400',
    scopes: ['orders.read', 'inventory.read', 'transactions.read'],
  },
  gmail: {
    label: 'Gmail',
    icon: <Mail className="h-6 w-6 text-red-500" />,
    colorClass: 'bg-red-600 hover:bg-red-700',
    scopes: ['mail.readonly'],
  },
  outlook: {
    label: 'Outlook',
    icon: <Mail className="h-6 w-6 text-blue-500" />,
    colorClass: 'bg-blue-600 hover:bg-blue-700',
    scopes: ['mail.read'],
  },
  gdrive: {
    label: 'Google Drive',
    icon: <Cloud className="h-6 w-6 text-emerald-500" />,
    colorClass: 'bg-emerald-600 hover:bg-emerald-700',
    scopes: ['drive.readonly'],
  },
  dropbox: {
    label: 'Dropbox',
    icon: <Cloud className="h-6 w-6 text-sky-500" />,
    colorClass: 'bg-sky-600 hover:bg-sky-700',
    scopes: ['files.metadata.read'],
  },
};

export default function ReconnectProvider() {
  const { provider = '' } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const meta = useMemo(() => PROVIDER_META[provider] || PROVIDER_META.amazon, [provider]);

  const begin = useCallback(async () => {
    setLoading(true);
    try {
      if (provider === 'amazon') {
        const res = await api.connectAmazon();
        const url = res.data?.auth_url;
        if ((res as any)?.ok && url) {
          window.location.assign(url as string);
          return;
        }
        // Fallback sandbox
        window.location.assign('/auth/amazon-sandbox');
        return;
      }
      // Evidence providers (gmail, outlook, gdrive, dropbox)
      if (['gmail', 'outlook', 'gdrive', 'dropbox'].includes(provider)) {
        const r = await api.connectDocs(provider as 'gmail' | 'outlook' | 'gdrive' | 'dropbox');
        if (r.ok && r.data?.auth_url) {
          window.location.assign(r.data.auth_url);
          return;
        }
        // Fallback to sandbox if API fails
        window.location.assign(`/auth/${provider}-sandbox`);
        return;
      }
      // Other providers (fallback to connectIntegration for backward compatibility)
      const r = await api.connectIntegration(provider);
      const url = (r as any)?.data?.auth_url;
      if ((r as any)?.ok && url) {
        window.location.assign(url as string);
      } else {
        window.location.assign(`/auth/${provider}-sandbox`);
      }
    } catch {
      if (provider === 'amazon') {
        window.location.assign('/auth/amazon-sandbox');
      } else {
        window.location.assign(`/auth/${provider}-sandbox`);
      }
    } finally {
      setLoading(false);
    }
  }, [provider]);

  return (
    <PageLayout title={`Reconnect ${meta.label}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 space-y-6">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-gray-200 hover:bg-white/10">
                <Link to="/integrations-hub"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Integrations</Link>
              </Button>
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center gap-2">
                  {meta.icon}
                  Reconnect {meta.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-300">
                  You’re about to securely reconnect {meta.label}. We’ll request only the minimum permissions required to ingest evidence and keep your recoveries flowing.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-400">Requested scopes:</span>
                  {meta.scopes.map((s) => (
                    <Badge key={s} variant="outline" className="border-white/20 text-gray-200">{s}</Badge>
                  ))}
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button onClick={begin} className={`${meta.colorClass} w-full sm:w-auto`} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Continue to {meta.label}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/integrations-hub')}>Cancel</Button>
                </div>
                <p className="text-xs text-gray-500">
                  You can revoke access and purge data at any time from Integrations. Tokens are stored securely and are never shared.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
