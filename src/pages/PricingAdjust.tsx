import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { useTenant } from '@/contexts/TenantContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type PricingTier = {
  name: string;
  planKey?: SelectablePlan;
  monthlyPrice: string;
  annualPrice: string;
  annualCheckout: string;
  bestFor: string;
  features: string[];
  ctaLabel?: string;
  salesLed?: boolean;
  featured?: boolean;
};

type BillingView = 'monthly' | 'annual';
type SelectablePlan = 'starter' | 'pro' | 'enterprise';

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    planKey: 'starter',
    monthlyPrice: '$49',
    annualPrice: '$39 / month',
    annualCheckout: '$468 billed yearly',
    bestFor: 'New sellers with lighter volume.',
    features: [
      'Continuous discrepancy monitoring',
      'Ongoing evidence collection from connected sources',
      'Filing-ready cases as they appear',
      '5 claims per month',
      'Recovery and payout tracking',
    ],
  },
  {
    name: 'Pro',
    planKey: 'pro',
    monthlyPrice: '$99',
    annualPrice: '$79 / month',
    annualCheckout: '$948 billed yearly',
    bestFor: 'Growing sellers who want automation.',
    features: [
      'Continuous recovery coverage',
      '7 core recovery categories live today',
      'Expanded detector coverage rolls into your plan automatically',
      'Unlimited auto-filing',
      'Ongoing evidence matching from connected repositories',
      'Real-time alerts for new filing opportunities',
      'Priority support',
    ],
    featured: true,
  },
  {
    name: 'Ultra',
    planKey: 'enterprise',
    monthlyPrice: '$199',
    annualPrice: '$159 / month',
    annualCheckout: '$1,908 billed yearly',
    bestFor: 'Larger sellers with custom workflows.',
    features: [
      'Everything in Pro',
      'Early access to expanded detector coverage',
      'Uninterrupted multi-marketplace monitoring',
      'Custom recovery rules',
      'Custom valuation rules and sourcing-cost evidence collection',
      'API access',
      'High-priority operational coverage',
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    annualCheckout: 'Sales-led annual coverage',
    bestFor: 'Teams that need managed recovery ops.',
    features: [
      'Everything in Ultra',
      'Dedicated recovery operations support',
      'Custom detector coverage planning',
      'Custom valuation and sourcing-cost workflows',
      'Multi-marketplace and multi-workspace rollout support',
      'SLA planning, volume pricing, and implementation support',
    ],
    ctaLabel: 'Contact Sales',
    salesLed: true,
  },
];

export default function PricingAdjust() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthReady, authToken } = useSession();
  const { tenant, isReady: isTenantReady } = useTenant();
  const [selectedBillingView, setSelectedBillingView] = useState<Record<string, BillingView>>({
    Starter: 'monthly',
    Pro: 'monthly',
    Ultra: 'monthly',
    Enterprise: 'annual',
  });
  const [processingSelectionKey, setProcessingSelectionKey] = useState<string | null>(null);
  const [restoredSelectionKey, setRestoredSelectionKey] = useState<string | null>(null);
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const isInAppOverlay = Boolean(tenantSlug);

  usePageMeta({
    title: 'Margin Pricing | Monthly Plans, No Commissions',
    description:
      'Start with your first 30-day recovery cycle, then continue with ongoing account monitoring. Margin keeps finding new discrepancies, collecting evidence, and tracking claims and payouts over time. No commissions ever.',
    url: `${SITE_META.url}/pricing`,
  });

  const buildPricingReturnPath = (plan: SelectablePlan, interval: BillingView) =>
    `/app/default/pricing-adjust?plan=${plan}&interval=${interval}`;

  const openSalesPage = () => {
    navigate('/sales');
  };

  const openYocoCheckout = (checkoutUrl: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.location.assign(checkoutUrl);
  };

  const startSubscribeIntent = async (plan: SelectablePlan, interval: BillingView) => {
    const selectionKey = `${plan}:${interval}`;

    if (!isAuthReady) {
      toast({
        title: 'Checking account access',
        description: 'Pricing selection is waiting for authenticated workspace context.',
      });
      return;
    }

    if (!authToken) {
      navigate(`/login?next=${encodeURIComponent(buildPricingReturnPath(plan, interval))}`);
      return;
    }

    if (!isTenantReady) {
      toast({
        title: 'Loading workspace',
        description: 'Pricing selection needs a tenant-bound workspace before billing can begin.',
      });
      return;
    }

    if (!activeSlug) {
      toast({
        title: 'Workspace Not Available',
        description: 'Pricing cannot create a billing intent until a workspace is available.',
        variant: 'destructive',
      });
      navigate('/app');
      return;
    }

    setProcessingSelectionKey(selectionKey);

    try {
      const response = await api.createBillingSubscribeIntent({
        plan_tier: plan,
        billing_interval: interval,
      }, activeSlug);

      if (!response.ok) {
        if (response.status === 401) {
          navigate(`/login?next=${encodeURIComponent(buildPricingReturnPath(plan, interval))}`);
          return;
        }

        throw new Error(response.error || 'Unable to create a subscription invoice.');
      }

      const invoice = response.data?.invoice;
      const invoiceId = response.data?.invoice_id || invoice?.invoice_id || 'subscription invoice';
      const checkoutUrl = invoice?.payment_link_url || null;
      toast({
        title: checkoutUrl ? 'Opening secure checkout' : 'Billing invoice ready',
        description: checkoutUrl
          ? `Plan selection is bound to ${invoiceId}. Sending you to YOCO checkout now.`
          : `Plan selection is bound to ${invoiceId}, but the YOCO checkout link is not available yet. Review it from Billing.`,
      });

      if (checkoutUrl) {
        try {
          localStorage.setItem('pending_yoco_invoice_id', invoiceId);
          localStorage.setItem('pending_yoco_plan', plan);
          localStorage.setItem('pending_yoco_interval', interval);
        } catch {
          // Checkout redirect should not depend on local storage.
        }
        openYocoCheckout(checkoutUrl);
        return;
      }

      navigate(`/app/${activeSlug}/billing`);
    } catch (error) {
      toast({
        title: 'Unable to start billing',
        description: error instanceof Error ? error.message : 'Billing entrypoint is Not Available.',
        variant: 'destructive',
      });
    } finally {
      setProcessingSelectionKey(null);
    }
  };

  useEffect(() => {
    const planParam = searchParams.get('plan');
    const intervalParam = searchParams.get('interval');
    const plan = planParam === 'starter' || planParam === 'pro' || planParam === 'enterprise' ? planParam : null;
    const interval = intervalParam === 'monthly' || intervalParam === 'annual' ? intervalParam : null;

    if (!plan || !interval) return;
    if (!isAuthReady) return;
    if (authToken && !isTenantReady) return;

    const selectionKey = `${plan}:${interval}`;
    if (processingSelectionKey === selectionKey || restoredSelectionKey === selectionKey) return;

    setRestoredSelectionKey(selectionKey);
    void startSubscribeIntent(plan, interval);
  }, [authToken, isAuthReady, isTenantReady, processingSelectionKey, restoredSelectionKey, searchParams]);

  const closeOverlay = () => {
    if (!isInAppOverlay) {
      navigate('/');
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(`/app/${activeSlug}`);
  };

  return (
    <PageLayout title="Pricing" noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#070707] text-white relative overflow-hidden font-sans">
        {isInAppOverlay ? (
          <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-8">
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/68 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Landing Page
            </Link>
            <button
              type="button"
              onClick={closeOverlay}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/68 transition-colors hover:bg-white/[0.05] hover:text-white"
              aria-label="Close pricing"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <PublicNavbar />
        )}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className={cn(
          "relative z-10 w-full mx-auto px-6 lg:px-10 pb-24",
          isInAppOverlay ? "pt-24 md:pt-28 lg:pt-32" : "pt-32 md:pt-40 lg:pt-44"
        )}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 flex flex-col items-center text-center"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-sans font-light tracking-tight text-white">Pricing</h1>
              <Badge variant="outline" className="border-white/10 bg-white/[0.02] text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
                Flat Subscription
              </Badge>
            </div>
            <div className="mt-6 max-w-4xl space-y-4">
              <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white/95 leading-tight">
                Flat subscription pricing. No commissions. No surprises.
              </h2>
              <p className="max-w-3xl text-sm md:text-base leading-7 text-white/40 tracking-tight mx-auto">
                Start with your first 30-day recovery cycle, then continue with ongoing account monitoring. Margin keeps watching for new discrepancies, collecting evidence, surfacing filing-ready cases, and tracking recoveries and payouts over time. Cancel anytime.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
            {pricingTiers.map((tier, index) => {
              const featured = Boolean(tier.featured);
              const activeBillingView = selectedBillingView[tier.name] || 'monthly';
              const baseCard =
                'relative flex h-full flex-col rounded-2xl p-6 transition-all duration-300 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.45)]';
              const cardClasses = featured
                ? `${baseCard} bg-white/[0.045]`
                : `${baseCard} bg-white/[0.025]`;

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className={cardClasses}
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)] pointer-events-none" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Tier</div>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{tier.name}</h2>
                      </div>
                      {featured ? (
                        <Badge variant="outline" className="border-0 bg-white/[0.06] text-[9px] font-sans font-bold uppercase tracking-tight text-white/70">
                          Most Popular
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mb-6 rounded-xl bg-black/20 p-1">
                      {tier.salesLed ? (
                        <div className="rounded-lg bg-white/[0.04] px-3 py-2 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/58">
                          Sales-led
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {(['monthly', 'annual'] as BillingView[]).map((view) => {
                            const isActive = activeBillingView === view;
                            return (
                              <button
                                key={view}
                                type="button"
                                onClick={() => setSelectedBillingView((current) => ({ ...current, [tier.name]: view }))}
                                className={`rounded-lg px-3 py-2 text-left text-[10px] font-sans font-bold uppercase tracking-tight transition-all ${
                                  isActive
                                    ? 'bg-white text-black'
                                    : 'bg-transparent text-white/35 hover:text-white/70'
                                }`}
                              >
                                {view}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mb-6 rounded-xl bg-white/[0.03] p-5">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                        {tier.salesLed
                          ? 'Managed Recovery Coverage'
                          : activeBillingView === 'monthly'
                            ? 'First Recovery Cycle'
                            : 'Annual Recovery Coverage'}
                      </div>
                      <div className="mt-3 text-4xl font-light tracking-tight text-white">
                        {tier.salesLed
                          ? tier.monthlyPrice
                          : activeBillingView === 'monthly'
                            ? tier.monthlyPrice
                            : tier.annualPrice}
                      </div>
                      <div className="mt-2 text-[11px] text-white/45">
                        {tier.salesLed
                          ? 'Custom rollout, support, and operating terms'
                          : activeBillingView === 'monthly'
                            ? 'Starts your first 30-day recovery cycle'
                            : 'Locked-in monthly rate for uninterrupted annual monitoring'}
                      </div>
                      <div className="mt-1 text-[11px] text-white/32">
                        {tier.salesLed
                          ? 'Contact sales for SLA, workflow, and volume pricing'
                          : activeBillingView === 'monthly'
                            ? tier.name === 'Pro'
                              ? '7 detectors today · expanded coverage by May 20 · Cancel anytime'
                              : 'Then continues as ongoing recovery monitoring · Cancel anytime'
                            : `${tier.annualCheckout} · locks today\'s rate as coverage expands`}
                      </div>
                    </div>

                    <div className="mb-6 rounded-xl bg-white/[0.03] p-4">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Best For</div>
                      <div className="mt-3 text-sm font-medium text-white/80">{tier.bestFor}</div>
                    </div>

                    <div className="mb-8 flex-grow rounded-xl bg-white/[0.03] p-5">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Key Features</div>
                      <div className="mt-4 space-y-3">
                        {tier.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/78">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-white/45" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-4">
                      <Button
                        onClick={() => {
                          if (tier.salesLed || !tier.planKey) {
                            openSalesPage();
                            return;
                          }
                          startSubscribeIntent(tier.planKey, activeBillingView);
                        }}
                        disabled={processingSelectionKey !== null}
                        className="h-12 rounded-xl border border-white/15 bg-transparent text-white hover:bg-white/[0.04] font-sans font-medium"
                      >
                        {tier.planKey && processingSelectionKey === `${tier.planKey}:${activeBillingView}`
                          ? 'Preparing Checkout'
                          : tier.ctaLabel || `Start ${tier.name} Coverage`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {!isInAppOverlay ? (
          <div className="relative z-10 mt-24 w-full">
            <BrandFooter />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
