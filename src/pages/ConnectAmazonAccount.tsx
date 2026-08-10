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

type AmazonConnectResponseData = {
  auth_url?: string;
  authUrl?: string;
  state?: string;
  capacity_full?: boolean;
  error?: string;
  message?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '';
}

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
      } catch (error: unknown) {
        if (mounted) {
          toast({
            title: 'Workspace setup incomplete',
            description: getErrorMessage(error) || 'We could not finish preparing your workspace yet.',
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
      const responseData = response.data as AmazonConnectResponseData | undefined;
      const authUrl = responseData?.auth_url || responseData?.authUrl;
      const stateParam = responseData?.state;

      if (!response.ok || !authUrl) {
        const rawError = typeof response.error === 'string' ? response.error : '';
        const isCapacityFull = rawError.includes('capacity_full') || responseData?.capacity_full;
        const connectionError = responseData?.message || responseData?.error || response.error;
        toast({
          title: isCapacityFull ? 'Audit capacity is temporarily full' : 'Amazon connection failed',
          description: isCapacityFull
            ? 'Margin is processing the current audit queue. Join the waitlist and we will notify you when more audit capacity opens.'
            : (connectionError || 'We could not start Amazon authorization. Please try again.'),
          variant: 'destructive',
        });
        if (isCapacityFull) {
          navigate('/waitlist?reason=capacity');
        }
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
    } catch (error: unknown) {
      const rawMsg = getErrorMessage(error);
      const isCapacityFull = rawMsg.includes('capacity_full');
      toast({
        title: isCapacityFull ? 'Audit capacity is temporarily full' : 'Amazon connection failed',
        description: isCapacityFull
          ? 'Margin is processing the current audit queue. Join the waitlist and we will notify you when more audit capacity opens.'
          : (rawMsg || 'We could not start Amazon authorization. Please try again.'),
        variant: 'destructive',
      });
      if (isCapacityFull) {
        variant: 'destructive',
      });
      if (isCapacityFull) {
        navigate('/waitlist?reason=capacity');
      }
      setConnecting(false);
    }
  };

  return (
    <PageLayout title="Connect Amazon | Margin" hideNavbar hideSidebar hideLogo plainBackground noPadding>
      <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
          <div className="w-full max-w-[390px]">
            <div className="mb-12 flex justify-center">
              <div className="flex items-center gap-3">
                <img src="/logoimagetwo.png" alt="Margin" className="h-6 w-auto object-contain" />
                <span className="brand-wordmark font-merriweather text-[20px] font-semibold tracking-tight text-[#182026]">Margin</span>
              </div>
            </div>

            <section>
              <h1 className="text-center text-[32px] font-bold leading-none tracking-[-0.065em] text-[#182026]">
                Connect Amazon
              </h1>
              <p className="mt-3 text-center text-[14px] leading-6 text-[#66737F]">
                Select your marketplace and authorize Margin to read your FBA history.
              </p>

              <div className="mt-10 space-y-5">
                {preparing ? (
                  <div className="flex h-14 w-full items-center justify-center rounded-sm border border-[#182026]/20 bg-transparent text-[14px] text-[#66737F]">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0B74DE]" />
                    Preparing workspace...
                  </div>
                ) : isFull ? (
                  <div className="space-y-5 border border-[#D8E3E8] bg-white/55 px-5 py-6 text-center text-[#182026]">
                    <div className="space-y-2">
                      <p className="text-[14px] font-semibold tracking-tight text-[#182026]">
                        Margin is processing the current audit queue.
                      </p>
                      <p className="text-[13px] leading-6 text-[#66737F]">
                        Join the waitlist and we will notify you when more Free Recovery Audit capacity opens.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => navigate('/waitlist?reason=capacity')}
                      className="mt-5 h-11 w-full rounded-sm bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white hover:bg-[#0869C9] active:scale-[0.98]"
                    >
                      Join Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium uppercase tracking-widest text-[#66737F]">
                        Marketplace
                      </label>
                      <Select
                        value={selectedMarketplace}
                        onValueChange={setSelectedMarketplace}
                        disabled={connecting}
                      >
                        <SelectTrigger className="h-12 w-full rounded-sm border-[#182026]/20 bg-transparent px-3 text-left text-[14px] tracking-tight text-[#182026] focus:border-[#182026] focus:ring-0">
                          <SelectValue placeholder="Select a marketplace" />
                        </SelectTrigger>
                        <SelectContent className="rounded-sm border-[#182026]/20 bg-white text-[#182026] shadow-md">
                          {AMAZON_MARKETPLACES.map((marketplace) => (
                            <SelectItem
                              key={marketplace.id}
                              value={marketplace.id}
                              className="text-sm text-[#182026] focus:bg-[#F3F6F8] focus:text-[#182026]"
                            >
                              {marketplace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleConnectAmazon}
                        disabled={connecting}
                        className="flex h-11 w-full items-center justify-center rounded-sm bg-[#0B74DE] px-8 text-[13px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            Connect Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}
