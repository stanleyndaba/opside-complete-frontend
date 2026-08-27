import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
        title: 'Choose a marketplace to continue',
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
          title: isCapacityFull ? 'Audit capacity is temporarily full' : 'Connection issue',
          description: isCapacityFull
            ? 'Margin is processing the current audit queue. Join the waitlist and we will notify you when more audit capacity opens.'
            : 'Margin could not complete the connection. Your account has not been changed. Try again, or contact support if you need help.',
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

        title: isCapacityFull ? 'Audit capacity is temporarily full' : 'Connection issue',
        description: isCapacityFull
          ? 'Margin is processing the current audit queue. Join the waitlist and we will notify you when more audit capacity opens.'
          : 'Margin could not complete the connection. Your account has not been changed. Try again, or contact support if you need help.',
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
      <div className="min-h-screen bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col px-5 py-7 sm:px-8 sm:py-9 lg:px-12">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-[12px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#182026]"
            >
              ← Back to your Audit
            </button>
            <div className="flex items-center gap-2.5">
              <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
              <span className="brand-wordmark font-merriweather text-[18px] font-semibold tracking-tight text-[#182026]">Margin</span>
            </div>
            <div className="w-[115px]" aria-hidden="true" />
          </header>

          <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] lg:gap-20 lg:py-16">
            <div className="w-full">
              <div className="border-y border-[#D8E3E8] bg-white/55 px-5 py-6 sm:px-7 sm:py-8">
                <div className="mb-7">
                  <p className="text-[11px] font-semibold uppercase tracking-tight text-[#66737F]">Step 1 of 3</p>
                  <h1 className="mt-2 font-lora text-[25px] font-normal leading-tight tracking-tight text-[#182026]">Choose your Amazon marketplace</h1>
                </div>

                {preparing ? (
                  <div className="border-t border-[#D8E3E8] pt-6 text-[14px] text-[#66737F]">
                    <p>Preparing your connection…</p>
                    <p className="mt-2 text-[12px] leading-5 text-[#8C9BA6]">This only takes a moment. Your account details remain unchanged.</p>
                  </div>
                ) : isFull ? (
                  <div className="border-t border-[#D8E3E8] pt-6">
                    <p className="text-[14px] font-semibold tracking-tight text-[#182026]">The current audit queue is full.</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#66737F]">Join the waitlist and we will notify you when more Free Recovery Audit capacity opens.</p>
                    <Button
                      type="button"
                      onClick={() => navigate('/waitlist?reason=capacity')}
                      className="mt-6 h-11 w-full rounded-md bg-[#0B74DE] px-5 text-[13px] font-semibold tracking-tight text-white hover:bg-[#0869C9]"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                ) : (
                  <div className="border-t border-[#D8E3E8] pt-6">
                    <label className="mb-2 block text-[12px] font-medium tracking-tight text-[#66737F]">Amazon marketplace</label>
                    <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace} disabled={connecting}>
                      <SelectTrigger className="h-12 w-full rounded-md border-[#C9D4DB] bg-white px-3 text-left text-[14px] tracking-tight text-[#182026] focus:border-[#0B74DE] focus:ring-0">
                        <SelectValue placeholder="Select a marketplace" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-[#D8E3E8] bg-white text-[#182026] shadow-lg">
                        {AMAZON_MARKETPLACES.map((marketplace) => (
                          <SelectItem key={marketplace.id} value={marketplace.id} className="text-sm text-[#182026] focus:bg-[#F3F6F8] focus:text-[#182026]">
                            {marketplace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-3 text-[12px] leading-5 text-[#8C9BA6]">This opens the correct Amazon approval page for your account.</p>

                    <Button
                      type="button"
                      onClick={handleConnectAmazon}
                      disabled={connecting}
                      className="mt-7 flex h-12 w-full items-center justify-center rounded-md bg-[#0B74DE] px-8 text-[14px] font-semibold tracking-tight text-white shadow-[0_16px_32px_rgba(11,116,222,0.18)] hover:bg-[#0869C9] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {connecting ? 'Opening Amazon…' : 'Continue to Amazon →'}
                    </Button>

                    <div className="mt-6 border-t border-[#D8E3E8] pt-5">
                      <p className="text-[12px] leading-5 text-[#66737F]">
                        After you continue, Amazon will ask you to approve read-only access. Then it will bring you back to Margin and your Audit will begin.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="max-w-[570px] lg:justify-self-end">
              <h2 className="font-lora text-[38px] font-normal leading-[1.08] tracking-tight text-[#182026] sm:text-[50px] lg:text-[58px]">
                Start with the real record.
              </h2>
              <div className="mt-6 max-w-[510px] space-y-5 text-[16px] leading-7 text-[#66737F] sm:text-[17px]">
                <p>A useful Recovery Audit begins with the Amazon records behind the question.</p>
                <p>Connect your seller account so Margin can examine the relevant activity and give you a clear view of what happened, what supports it, and what makes sense to do next.</p>
                <p>You approve the connection directly through Amazon. Margin never sees your Amazon password.</p>
                <p>Once you are back, your free Recovery Audit begins.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  );
}
