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
        toast({
          title: isCapacityFull ? 'Audit capacity is temporarily full' : 'Amazon connection failed',
          description: isCapacityFull
            ? 'Margin is processing the current audit queue. Join the waitlist and we will notify you when more audit capacity opens.'
            : (response.error || 'We could not start Amazon authorization. Please try again.'),
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
        navigate('/waitlist?reason=capacity');
      }
      setConnecting(false);
    }
  };

  return (
    <PageLayout title="Connect Amazon | Margin" hideNavbar hideSidebar hideLogo plainBackground noPadding>
      <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] py-12 text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_34%),radial-gradient(circle_at_84%_0%,rgba(46,125,91,0.1),transparent_32%)]" />

        <div className="relative mx-auto max-w-[860px] space-y-8 px-4 pt-20 md:px-6">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
              <span>Free Recovery Audit</span>
              <span className="h-1 w-1 rounded-full bg-[#0B74DE]/80" />
              <span className="text-[#66737F]">Amazon authorization</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-[620px] text-[38px] font-semibold leading-[0.95] tracking-[-0.06em] text-[#182026] md:text-[60px]">
                Connect Amazon to run your recovery audit.
              </h1>
              <p className="max-w-[560px] text-[16px] leading-7 text-[#4D5B66] md:text-lg md:leading-8">
                Margin needs secure Amazon authorization before it can analyze shipments, inventory events, settlement lines, refunds, fees, and reimbursement history.
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white p-5 shadow-[0_34px_100px_rgba(37,49,58,0.11)] md:p-7">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/24 to-transparent" />
            <div className="pointer-events-none absolute -right-16 top-10 h-32 w-32 rounded-full bg-[#0B74DE]/10 blur-3xl" />

            <div className="relative">
              <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                    Amazon connection
                  </div>
                  <h2 className="text-[28px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] md:text-[34px]">
                    Authorize read access for the Free Recovery Audit.
                  </h2>
                  <p className="max-w-[520px] text-[14px] leading-6 text-[#66737F] md:text-[15px]">
                    Select the marketplace you want Margin to review. Amazon will ask you to approve the connection, then Margin can sync the data required to surface recovery opportunities.
                  </p>
                </div>

                <div className="rounded-full border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold tracking-tight text-[#66737F]">
                  Secure OAuth
                </div>
              </div>

              {preparing ? (
                <div className="flex h-14 w-full items-center justify-center rounded-[20px] border border-[#DCE8EE] bg-[#F8FAFC] text-sm text-[#66737F]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#0B74DE]" />
                  Preparing workspace...
                </div>
              ) : isFull ? (
                <div className="space-y-5 rounded-[22px] border border-[#DCE8EE] bg-[#F8FAFC] p-5 text-[#182026]">
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold tracking-tight text-[#182026]">
                      Margin is processing the current audit queue.
                    </p>
                    <p className="text-[12px] text-[#66737F]">
                      Join the waitlist and we will notify you when more Free Recovery Audit capacity opens.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => navigate('/waitlist?reason=capacity')}
                    className="h-11 w-full justify-between rounded-full bg-[#0B74DE] px-5 text-[12px] font-semibold tracking-tight text-white hover:bg-[#0869C9]"
                  >
                    Join Waitlist
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-tight text-[#66737F]">
                      Marketplace
                    </p>
                    <Select
                      value={selectedMarketplace}
                      onValueChange={setSelectedMarketplace}
                      disabled={connecting}
                    >
                      <SelectTrigger className="h-14 rounded-[20px] border-[#CFE0EA] bg-white px-4 text-left text-[14px] tracking-tight text-[#182026] focus:border-[#0B74DE]/50 focus:ring-0">
                        <SelectValue placeholder="Select the Amazon marketplace to audit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[20px] border-[#CFE0EA] bg-white text-[#182026] shadow-[0_22px_70px_rgba(37,49,58,0.14)]">
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

                  <Button
                    type="button"
                    onClick={handleConnectAmazon}
                    disabled={connecting}
                    className="h-12 w-full justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9] disabled:cursor-not-allowed disabled:bg-[#BFD8EA] disabled:text-white"
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
                        Connect Amazon Account
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
