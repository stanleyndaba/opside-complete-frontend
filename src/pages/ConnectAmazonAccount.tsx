import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function ConnectAmazonAccount() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const activeTenantSlug = tenantSlug || tenant?.slug || '';
  const [connecting, setConnecting] = useState(false);

  const handleConnectAmazon = async () => {
    if (!activeTenantSlug) {
      toast({
        title: 'Workspace unavailable',
        description: 'We could not resolve your workspace yet. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);

    try {
      const response = await api.connectAmazon(undefined, false, activeTenantSlug);
      const authUrl = response.data?.auth_url || response.data?.authUrl;

      if (!response.ok || !authUrl) {
        toast({
          title: 'Amazon connection failed',
          description: response.error || 'We could not start Amazon authorization. Please try again.',
          variant: 'destructive',
        });
        setConnecting(false);
        return;
      }

      window.location.assign(authUrl);
    } catch (error: any) {
      toast({
        title: 'Amazon connection failed',
        description: error?.message || 'We could not start Amazon authorization. Please try again.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  return (
    <PageLayout title="Connect Amazon Account" hideNavbar hideSidebar midnight>
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl border border-white/10 bg-white/[0.02] p-8 text-white shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
          <div className="mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-white/55">
              <Lock className="h-3.5 w-3.5" />
              Account Ready
            </div>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Connect Amazon Account
              </h1>
              <p className="max-w-xl text-sm leading-6 text-white/50 md:text-base">
                Your platform login is complete. The next step is connecting your Amazon seller account so Amazon can handle authorization and hand the account back to Margin.
              </p>
            </div>
          </div>

          <div className="space-y-6 border border-white/10 bg-black/20 p-6">
            <p className="text-sm leading-6 text-white/45">
              Click the button below to begin Amazon authorization. Once Amazon finishes the OAuth flow, Margin will resume from there.
            </p>

            <Button
              type="button"
              onClick={handleConnectAmazon}
              disabled={connecting}
              className="h-12 w-full rounded-none bg-white text-black hover:bg-white/90"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Amazon Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
