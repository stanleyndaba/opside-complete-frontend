import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Cloud, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function getProviderFromPath(pathname: string): 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'unknown' {
  const m = pathname.match(/\/auth\/(.+)-sandbox$/);
  const p = (m?.[1] || '').toLowerCase();
  if (p === 'gmail') return 'gmail';
  if (p === 'outlook') return 'outlook';
  if (p === 'gdrive') return 'gdrive';
  if (p === 'dropbox') return 'dropbox';
  return 'unknown';
}

export default function OAuthProviderSandbox() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const provider = getProviderFromPath(location.pathname);

  useEffect(() => {
    const t = setTimeout(() => {
      toast({ title: `${provider === 'unknown' ? 'Provider' : provider} connected (sandbox)`, description: 'Redirecting back to Integrations…' });
      navigate('/integrations-hub');
    }, 900);
    return () => clearTimeout(t);
  }, [navigate, toast, provider]);

  const icon = provider === 'gmail' || provider === 'outlook' ? <Mail className="h-8 w-8 text-gray-200" /> : provider === 'gdrive' || provider === 'dropbox' ? <Cloud className="h-8 w-8 text-gray-200" /> : <Shield className="h-8 w-8 text-gray-200" />;
  const label = provider === 'gmail' ? 'Gmail' : provider === 'outlook' ? 'Outlook' : provider === 'gdrive' ? 'Google Drive' : provider === 'dropbox' ? 'Dropbox' : 'Provider';

  return (
    <PageLayout title={`Connecting ${label}`} hideNavbar hideSidebar>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-transparent min-h-screen text-gray-300 flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative max-w-md w-full mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-gray-100">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg font-medium">Connecting {label}…</span>
            </div>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-gray-200 flex items-center justify-center gap-2">{icon} {label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-300">
                Simulating OAuth consent in sandbox. You will be redirected back to Integrations.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
