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
import { buildYocoCheckoutUrl, PendingYocoCheckoutContext } from '@/lib/yocoCheckout';

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
    name: 'Starter',
    planKey: 'starter',
    price: '$79/mo',
    priceContext: 'Monthly recovery coverage',
    purpose: 'Small sellers, limited claim volume.',
    features: [
      'Continuous discrepancy monitoring',
      'Ongoing evidence collection from connected sources',
      'Filing-ready cases as they appear',
      '5 claims per month',
      'Recovery and payout tracking',
    ],
    checkoutUrl: 'https://pay.yoco.com/r/mErEdy',
  },
  {
    name: 'Pro',
    planKey: 'pro',
    price: '$199/mo',
    priceContext: 'Main plan. No commission.',
    purpose: 'Main plan for serious sellers. No commission.',
    features: [
      'Continuous recovery coverage',
      '7 core recovery categories live today',
      'Expanded detector coverage rolls into your plan automatically',
      'Unlimited auto-filing',
      'Ongoing evidence matching from connected repositories',
      'Real-time alerts for new filing opportunities',
      'Priority support',
    ],
    checkoutUrl: 'https://pay.yoco.com/r/4ZDLyo',
    featured: true,
  },
  {
    name: 'Scale / Ultra',
    planKey: 'enterprise',
    price: '$399/mo',
    priceContext: 'Priority recovery workflow',
    purpose: 'Higher volume, multi-marketplace, priority workflow.',
    features: [
      'Everything in Pro',
      'Early access to expanded detector coverage',
      'Uninterrupted multi-marketplace monitoring',
      'Custom recovery rules',
      'Custom valuation rules and sourcing-cost evidence collection',
      'API access',
      'High-priority operational coverage',
    ],
    checkoutUrl: 'https://pay.yoco.com/r/2bLVnw',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceContext: 'Managed recovery operations',
    purpose: 'Managed recovery ops, bigger sellers.',
    features: [
      'Everything in Scale / Ultra',
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
  const [processingSelectionKey, setProcessingSelectionKey] = useState<string | null>(null);
  const [restoredSelectionKey, setRestoredSelectionKey] = useState<string | null>(null);
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const isInAppOverlay = Boolean(tenantSlug);

  usePageMeta({
    title: 'Margin Pricing | Monthly Recovery Plans, No Commissions',
    description:
      'Choose a flat monthly recovery plan. Margin keeps finding discrepancies, preparing evidence, and tracking recoveries with no commissions.',
    url: `${SITE_META.url}/pricing`,
  });

  const buildPricingReturnPath = (plan: SelectablePlan, interval: BillingView) =>
    `/app/default/pricing-adjust?plan=${plan}&interval=${interval}`;

  const openSalesPage = () => {
    navigate('/sales');
  };

  const openYocoCheckout = (checkoutUrl: string, context: PendingYocoCheckoutContext = {}) => {
    if (typeof window === 'undefined') {
      return;
    }

    const returnPath = activeSlug
      ? `/app/${activeSlug}/billing`
      : `/login?next=${encodeURIComponent('/app')}`;
    window.location.assign(buildYocoCheckoutUrl(checkoutUrl, {
      returnPath,
      tenantSlug: activeSlug || null,
      ...context,
    }));
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
        openYocoCheckout(checkoutUrl, {
          kind: 'subscription',
          plan,
          offer: plan === 'pro' ? 'Pro' : plan === 'enterprise' ? 'Scale / Ultra' : 'Starter',
          invoiceId,
        });
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

  const renderPricingTier = (tier: PricingTier, index: number) => {
    const featured = Boolean(tier.featured);
    const baseCard =
      'relative flex h-full flex-col rounded-2xl border border-white/10 p-6 transition-all duration-300 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.45)]';
    const cardClasses = featured
      ? `${baseCard} bg-white/[0.055]`
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
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                {tier.salesLed ? 'Offer' : 'Coverage'}
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{tier.name}</h2>
            </div>
            {featured || tier.badgeLabel ? (
              <Badge variant="outline" className="border-0 bg-white/[0.06] text-[9px] font-sans font-bold uppercase tracking-tight text-white/70">
                {tier.badgeLabel || 'Most Popular'}
              </Badge>
            ) : null}
          </div>

          <div className="mb-6 rounded-xl bg-white/[0.03] p-5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Price</div>
            <div className="mt-3 text-4xl font-light tracking-tight text-white">
              {tier.price}
            </div>
            <div className="mt-2 text-[11px] text-white/45">
              {tier.priceContext}
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-white/[0.03] p-4">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Purpose</div>
            <div className="mt-3 text-sm font-medium text-white/80">{tier.purpose}</div>
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
                if (tier.checkoutUrl) {
                  openYocoCheckout(tier.checkoutUrl, {
                    kind: tier.name.toLowerCase().includes('scan') ? 'recovery_scan' : 'subscription',
                    plan: tier.planKey || null,
                    offer: tier.name,
                    price: tier.price,
                  });
                  return;
                }
                if (tier.salesLed || !tier.planKey) {
                  openSalesPage();
                  return;
                }
                startSubscribeIntent(tier.planKey, 'monthly');
              }}
              disabled={processingSelectionKey !== null}
              className="h-12 rounded-xl border border-white/15 bg-transparent text-white hover:bg-white/[0.04] font-sans font-medium"
            >
              {tier.planKey && processingSelectionKey === `${tier.planKey}:monthly`
                ? 'Preparing Checkout'
                : tier.ctaLabel || `Start ${tier.name} Coverage`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
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
            <div className="flex flex-col items-center gap-3">
              <Badge variant="outline" className="border-white/10 bg-white/[0.02] text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
                Flat Monthly Recovery Coverage
              </Badge>
              <h1 className="text-2xl font-sans font-light tracking-tight text-white">Pricing</h1>
            </div>
            <div className="mt-6 max-w-4xl space-y-4">
              <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white/95 leading-tight">
                Choose ongoing recovery coverage with no commissions.
              </h2>
              <p className="max-w-3xl text-sm md:text-base leading-7 text-white/40 tracking-tight mx-auto">
                Margin keeps watching for discrepancies, collecting evidence, surfacing filing-ready cases, and tracking recoveries and payouts over time through flat monthly coverage.
              </p>
              <p className="mx-auto max-w-2xl text-[11px] font-sans font-medium leading-5 text-white/32">
                Checkout is processed by Yoco and may show the local South African rand amount for the selected plan.
              </p>
            </div>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
            {pricingTiers.map((tier, index) => renderPricingTier(tier, index))}
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
