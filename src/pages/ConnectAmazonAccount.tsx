import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { normalizeTenantSlug } from '@/lib/routes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AMAZON_MARKETPLACES } from '@/lib/amazonMarketplaces';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

export default function ConnectAmazonAccount() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const { isFull, capacity } = useOnboardingCapacity();
  const activeTenantSlug = tenantSlug || tenant?.slug || '';
  const [resolvedTenantSlug, setResolvedTenantSlug] = useState(activeTenantSlug);
  const [preparing, setPreparing] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState('');

  useEffect(() => {
    let mounted = true;

    const deriveWorkspaceName = (email: string) => {
      const normalized = email.trim().toLowerCase();
      const domain = normalized.split('@')[1] || '';
      const base = domain.split('.')[0] || normalized.split('@')[0] || 'workspace';
      return base
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Workspace';
    };

    const bootstrapWorkspace = async () => {
      try {
        const storedEmail = localStorage.getItem('user_email') || '';
        const preferredTenantSlug = normalizeTenantSlug(tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug'));
        const response = await api.post<{
          success: boolean;
          tenant?: { id: string; slug: string };
        }>('/api/auth/bootstrap', {
          workspaceName: deriveWorkspaceName(storedEmail),
          preferredTenantSlug,
        });

        if (!mounted) {
          return;
        }

        const nextTenantSlug = normalizeTenantSlug(response.data?.tenant?.slug) || preferredTenantSlug || '';
        if (response.ok && response.data?.tenant?.id && nextTenantSlug) {
          localStorage.setItem('active_tenant_id', response.data.tenant.id);
          localStorage.setItem('active_tenant_slug', nextTenantSlug);
          setResolvedTenantSlug(nextTenantSlug);

          if (tenantSlug && nextTenantSlug !== tenantSlug) {
            navigate(`/app/${nextTenantSlug}/connect-amazon`, { replace: true });
            return;
          }
        }
      } catch (error: any) {
        if (mounted) {
          toast({
            title: 'Workspace setup incomplete',
            description: error?.message || 'We could not finish preparing your workspace yet.',
            variant: 'destructive',
          });
        }
      } finally {
        if (mounted) {
          setPreparing(false);
        }
      }
    };

    bootstrapWorkspace();

    return () => {
      mounted = false;
    };
  }, [navigate, tenant?.slug, tenantSlug, toast]);

  const handleConnectAmazon = async () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    if (!resolvedTenantSlug) {
      toast({
        title: 'Workspace unavailable',
        description: 'We could not resolve your workspace yet. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedMarketplace) {
      toast({
        title: 'Marketplace required',
        description: 'Select a marketplace before continuing to Amazon.',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);

    try {
      const response = await api.connectAmazon(selectedMarketplace, false, resolvedTenantSlug);
      const authUrl = response.data?.auth_url || response.data?.authUrl;
      const stateParam = (response.data as any)?.state;

      if (!response.ok || !authUrl) {
        toast({
          title: 'Amazon connection failed',
          description: response.error || 'We could not start Amazon authorization. Please try again.',
          variant: 'destructive',
        });
        setConnecting(false);
        return;
      }

      if (stateParam) {
        try {
          sessionStorage.setItem('amazon_sandbox_state', stateParam);
          localStorage.setItem('amazon_sandbox_state', stateParam);
        } catch {
          // Ignore storage failures for OAuth state convenience caching.
        }
      }

      await api.trackEvent('amazon_connect_initiated', {
        timestamp: new Date().toISOString(),
        source: 'connect_amazon_onboarding',
        marketplaceId: selectedMarketplace,
      });

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
      <div className="relative min-h-screen overflow-hidden px-4 py-12 text-white md:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(133,170,255,0.1),transparent_40%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.05),transparent_42%)]" />

        <div className="relative mx-auto max-w-[860px] space-y-8 pt-20">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
              <span>Amazon authorization</span>
              <span className="h-1 w-1 rounded-full bg-[#8fb7ff]/80" />
              <span className="text-white/46">Workspace step 2</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[620px] text-[38px] font-light leading-[0.95] tracking-tight text-white md:text-[60px]">
                Connect your Amazon seller account.
              </h1>
              <p className="max-w-[560px] text-[16px] leading-7 text-white/58 md:text-lg md:leading-8">
                Your Margin login is already complete. This step sends you to Amazon so Seller Central can authorize the account and return you back into Margin.
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_16%,rgba(8,8,9,0.98)_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/40 to-transparent" />
            <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#7aa6ff]/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium tracking-tight text-white/40">
                    Seller Central handoff
                  </div>
                  <h2 className="text-[28px] font-light leading-[1.02] tracking-tight text-white md:text-[34px]">
                    Choose the marketplace and continue.
                  </h2>
                  <p className="max-w-[520px] text-[14px] leading-6 text-white/56 md:text-[15px]">
                    Margin prepares the workspace here. Amazon still handles the authorization itself. When the OAuth flow finishes, we resume from there.
                  </p>
                </div>

                <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
                  OAuth step
                </div>
              </div>

              {preparing ? (
                <div className="flex h-14 w-full items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.03] text-sm text-white/60">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing workspace...
                </div>
              ) : isFull ? (
                <div className="space-y-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 text-white">
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold tracking-tight text-white">
                      We’re onboarding a small batch of sellers right now.
                    </p>
                    <p className="text-[12px] text-white/60">
                      Next batch opens in {capacity?.nextBatchHours ?? 24} hours.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate('/waitlist?reason=capacity')}
                    className="h-11 w-full justify-between rounded-[18px] border border-white/10 bg-white px-5 text-[12px] font-medium tracking-tight text-black hover:bg-white/92"
                  >
                    Join Waitlist
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium tracking-tight text-white/42">
                      Marketplace
                    </p>
                    <Select
                      value={selectedMarketplace}
                      onValueChange={setSelectedMarketplace}
                      disabled={connecting}
                    >
                      <SelectTrigger className="h-14 rounded-[20px] border-white/10 bg-white/[0.02] px-4 text-left text-[14px] tracking-tight text-white focus:border-white/18 focus:ring-0">
                        <SelectValue placeholder="Choose the Amazon marketplace you want to connect" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[20px] border-white/10 bg-[#090909] text-white">
                        {AMAZON_MARKETPLACES.map((marketplace) => (
                          <SelectItem
                            key={marketplace.id}
                            value={marketplace.id}
                            className="text-sm text-white focus:bg-white/10 focus:text-white"
                          >
                            {marketplace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectAmazon}
                    disabled={connecting || !selectedMarketplace}
                    className="h-12 w-full justify-between rounded-[18px] border border-white/10 bg-white px-5 text-[13px] font-medium tracking-tight text-black hover:bg-white/92 disabled:cursor-not-allowed disabled:bg-white/25 disabled:text-white/50"
                  >
                    {connecting ? (
                      <>
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Connecting...
                        </span>
                      </>
                    ) : (
                      <>
                        Connect Amazon account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
