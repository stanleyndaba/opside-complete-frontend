import { useCallback, useEffect, useState } from 'react';
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
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type PricingTier = {
  name: string;
  planKey?: SelectablePlan;
  price: string;
  priceContext: string;
  purpose: string;
  features: string[];
  checkoutUrl?: string;
  ctaLabel?: string;
  salesLed?: boolean;
  featured?: boolean;
  badgeLabel?: string;
};

type BillingView = 'monthly' | 'annual';
type SelectablePlan = 'starter' | 'pro' | 'enterprise';

const pricingTiers: PricingTier[] = [
  {
    name: 'Early Access',
    planKey: 'starter',
    price: '$99',
    priceContext: 'One-time payment. 0% commission through Dec 31, 2026.',
    purpose: 'Early sellers who want founder pricing locked and priority activation reserved before standard plans begin.',
    features: [
      'Keep 100% of every recovery during Early Access',
      '$0 monthly subscription fee through Dec 31, 2026',
      '$99 credited if you upgrade to Pro or Scale',
      'Limited to 500 slots; closes July 30, 2026 or when filled',
    ],
    ctaLabel: 'Get Early Access',
    checkoutUrl: 'https://paystack.shop/pay/margin-early-access',
  },
  {
    name: 'Performance',
    planKey: 'pro',
    price: '10% on recovered funds',
    priceContext: '$0 monthly fee. Pay only when recoveries are made.',
    purpose: 'Low-volume or risk-averse sellers who prefer no base fee.',
    features: [
      'We win the cases other tools avoid.',
      'Pay only on what we recover',
      '$0 monthly subscription fee',
      'Includes one primary marketplace',
      'Standard support',
    ],
    ctaLabel: 'Start Risk-Free',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/LE8SN5PGT6PPC',
    badgeLabel: 'Coming Soon',
  },
  {
    name: 'Pro',
    planKey: 'enterprise',
    price: '$199/mo + 3% on recovered funds',
    priceContext: 'Recommended for serious sellers',
    purpose: 'Consistent claim volume requiring priority handling and lower success fees. Recommended for sellers recovering $8,000+ annually.',
    features: [
      'Lower 3% success fee',
      'Priority case processing & filing',
      'Up to 3 marketplaces supported',
      'Early Access members can apply their $99 credit',
      'Priority email & chat support',
    ],
    ctaLabel: 'Upgrade to Pro',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/FXJZGLPPDYWJU',
    featured: true,
    badgeLabel: 'Coming Soon',
  },
  {
    name: 'Scale',
    price: '$399/mo',
    priceContext: '0% commission on recovered funds',
    purpose: 'High-volume, multi-marketplace enterprises and aggregators.',
    features: [
      '0% commission on recovered funds',
      'Unlimited global marketplace support',
      'Early Access members can apply their $99 credit',
      'Highest priority processing & 24/7 dedicated support',
      'Advanced analytics & API access',
    ],
    ctaLabel: 'Run Recoveries at Scale',
    salesLed: true,
    badgeLabel: 'Coming Soon',
  },
];

export default function PricingAdjust() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthReady, authToken } = useSession();
  const { tenant, isReady: isTenantReady } = useTenant();
  const [processingSelectionKey, setProcessingSelectionKey] = useState<string | null>(null);
  const [restoredSelectionKey, setRestoredSelectionKey] = useState<string | null>(null);
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const isInAppOverlay = Boolean(tenantSlug);

  usePageMeta({
    title: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    description:
      'Keep your approved recoveries. Pay for the system, not a percentage of every reimbursement. Choose the tier that fits your operational scale.',
    url: `${SITE_META.url}/pricing`,
  });

  const buildPricingReturnPath = (plan: SelectablePlan, interval: BillingView) =>
    `/app/default/pricing-adjust?plan=${plan}&interval=${interval}`;

  const openSalesPage = () => {
    navigate('/sales');
  };

  const openPaymentCheckout = useCallback((checkoutUrl: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    trackEvent(ANALYTICS_EVENTS.checkoutStarted, {
      offer: 'early_access',
      value: 1799,
      currency: 'ZAR',
      payment_provider: 'paystack_payment_page',
    });
    window.location.assign(checkoutUrl);
  }, []);

  const startSubscribeIntent = useCallback(async (plan: SelectablePlan, interval: BillingView) => {
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
          ? `Plan selection is bound to ${invoiceId}. Sending you to secure checkout now.`
          : `Plan selection is bound to ${invoiceId}, but the checkout link is not available yet. Review it from Billing.`,
      });

      if (checkoutUrl) {
        openPaymentCheckout(checkoutUrl);
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
  }, [activeSlug, authToken, isAuthReady, isTenantReady, navigate, openPaymentCheckout, toast]);

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
  }, [authToken, isAuthReady, isTenantReady, processingSelectionKey, restoredSelectionKey, searchParams, startSubscribeIntent]);

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

  const renderPricingTier = (tier: PricingTier, index: number) => {
    const featured = Boolean(tier.featured);
    const baseCard =
      'relative flex h-full flex-col overflow-hidden rounded-[34px] border p-6 transition-all duration-300 shadow-[0_28px_90px_rgba(37,49,58,0.1)]';
    const cardClasses = featured
      ? `${baseCard} border-[#BFD8EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF4FF_100%)]`
      : `${baseCard} border-[#CFE0EA] bg-white`;

    return (
      <motion.div
        key={tier.name}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className={cardClasses}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(11,116,222,0.1),_transparent_60%)]" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                {tier.salesLed ? 'Offer' : 'Coverage'}
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#182026]">{tier.name}</h2>
            </div>
            {featured || tier.badgeLabel ? (
              <Badge 
                variant={tier.badgeLabel?.includes('Coming Soon') ? 'default' : 'outline'} 
                className={cn(
                  "text-[9px] uppercase",
                  tier.badgeLabel?.includes('Coming Soon')
                    ? "font-medium tracking-tight bg-[#007AFF] text-white border-transparent shadow-[0_4px_14px_rgba(0,122,255,0.25)] hover:bg-[#007AFF]"
                    : "font-semibold tracking-[0.14em] border-[#BFD8EA] bg-white text-[#0B74DE]"
                )}
              >
                {tier.badgeLabel || 'Most Popular'}
              </Badge>
            ) : null}
          </div>

          <div className="mb-6 rounded-[24px] border border-[#E4EDF1] bg-[#F8FAFC] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">Price</div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#182026]">
              {tier.price}
            </div>
            <div className="mt-2 text-[11px] text-[#66737F]">
              {tier.priceContext}
            </div>
          </div>

          <div className="mb-6 rounded-[22px] border border-[#E4EDF1] bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">Purpose</div>
            <div className="mt-3 text-sm font-semibold text-[#25313A]">{tier.purpose}</div>
          </div>

          <div className="mb-8 flex-grow rounded-[24px] border border-[#E4EDF1] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">Key Differentiators</div>
            <div className="mt-4 space-y-3">
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-[#4D5B66]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#2E7D5B]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <Button
              onClick={() => {
              trackEvent(ANALYTICS_EVENTS.claimAccessClicked, {
                location: 'pricing_early_access',
                cta_text: tier.ctaLabel || `Start ${tier.name} Coverage`,
                offer: 'early_access',
              });
                if (tier.checkoutUrl) {
                  openPaymentCheckout(tier.checkoutUrl);
                  return;
                }
                if (tier.salesLed || !tier.planKey) {
                  openSalesPage();
                  return;
                }
                startSubscribeIntent(tier.planKey, 'monthly');
              }}
              disabled={processingSelectionKey !== null || tier.badgeLabel?.includes('Coming Soon')}
              className={cn(
                "h-12 rounded-full font-semibold",
                tier.badgeLabel?.includes('Coming Soon')
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-100 opacity-80"
                  : featured
                    ? "bg-[#0B74DE] text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] hover:bg-[#0869C9]"
                    : "border border-[#CFE0EA] bg-white text-[#25313A] hover:bg-[#F8FAFC]"
              )}
            >
              {tier.planKey && processingSelectionKey === `${tier.planKey}:monthly`
                ? 'Preparing Checkout'
                : tier.ctaLabel || `Start ${tier.name} Coverage`}
              {!tier.badgeLabel?.includes('Coming Soon') && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <PageLayout title="Pricing" noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        {isInAppOverlay ? (
          <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-8">
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-[#DCE8EE] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
            >
              Landing Page
            </Link>
            <button
              type="button"
              onClick={closeOverlay}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE8EE] bg-white text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
              aria-label="Close pricing"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <PublicNavbar variant="light" />
        )}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]"
        />
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

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
            <div className="flex flex-col items-center gap-3">
              <Badge variant="outline" className="border-[#DCE8EE] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">
                Tiered Revenue Recovery Infrastructure
              </Badge>
              <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#182026]">Pricing</h1>
            </div>
            <div className="mt-6 max-w-4xl space-y-4">
              <h2 className="text-4xl font-semibold leading-tight tracking-[-0.055em] text-[#182026] md:text-6xl">
                Evidence-ready Amazon reimbursement workflows.
              </h2>
              <p className="mx-auto max-w-3xl text-sm leading-7 tracking-tight text-[#66737F] md:text-base">
                Early Access locks introductory pricing through 2026 with 0% commission, priority activation, and onboarding included. Standard plans are available for sellers who prefer performance-based, priority, or scale-level recovery management.
              </p>
              <p className="mx-auto max-w-2xl text-[13px] font-semibold leading-6 text-[#182026] md:text-[15px]">
                Early Access is now open. Performance, Pro, and Scale plans will become available after the Early Access launch.
              </p>
            </div>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
            {pricingTiers.map((tier, index) => renderPricingTier(tier, index))}
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-[11px] font-medium leading-5 text-[#7A8994]">
            Every case is seller-approved before filing. Amazon makes the final call - we just make sure your case gives them no reason to say no.
          </p>
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
