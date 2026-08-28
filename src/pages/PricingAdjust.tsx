import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/contexts/TenantContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { trackClaimAccessClicked } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type PricingTier = {
  name: string;
  auditRequired?: boolean;
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

const getPricingTiers = (): PricingTier[] => [
  {
    name: 'Recovery Audit',
    price: 'Free',
    priceContext: 'A one-time snapshot',
    purpose: 'Find out exactly what is missing and what can be recovered.',
    features: [
      'Potential recovery opportunities',
      'Evidence gaps',
      'Claim deadlines',
      'Settlement mismatches',
      'Reversals or underpayments',
      'What is ready and what still needs proof',
      'Read-only connection',
      'No card required',
    ],
    ctaLabel: 'Get Started',
    checkoutUrl: '/audit',
  },
  {
    name: 'Recover Once',
    auditRequired: true,
    price: 'Personalised quote',
    priceContext: 'One defined recovery operation · ZAR quote',
    purpose: 'For one bounded, evidence-supported recovery scope. Review the quote before checkout.',
    features: [
      'One defined recovery operation',
      'Personalised quote from the audit record',
      'Evidence scope and review boundary',
      'Seller approval before any filing',
      'No recovery commission',
    ],
    ctaLabel: 'Review your quote',
  },
  {
    name: 'Recovery Workspace',
    auditRequired: true,
    price: '$109/month',
    priceContext: '0% recovery commission',
    purpose: 'For one Seller Central business. Cancel anytime. Nothing is filed without your approval.',
    features: [
      'Continuous discrepancy monitoring',
      'Evidence ingestion across connected sources',
      'Document extraction and analysis',
      'Evidence matching & Missing-proof identification',
      'Claim-ready case building',
      'Seller approval before filing',
      'Amazon response and rejection handling',
      'Recovery status tracking',
      'Payout, underpayment, and reversal reconciliation',
      'Accounting-ready recovery record',
    ],
    ctaLabel: 'Get Started',
    featured: true,
  },
  {
    name: 'Talk to Sales',
    price: 'Custom scope',
    priceContext: 'Recovery Control + larger operations',
    purpose: 'For ongoing control work, complex cases, multiple accounts, or requirements beyond standard Workspace.',
    features: [
      'Recovery-control engagement scoping',
      'Larger or more complex operations',
      'Multiple Seller Central accounts or brands',
      'Custom onboarding and operating requirements',
      'Seller-controlled commercial proposal',
      'No payment collected before scope is agreed',
    ],
    ctaLabel: 'Talk to Sales',
    salesLed: true,
  },
];

export default function PricingAdjust() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant, isReady: isTenantReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const isInAppOverlay = Boolean(tenantSlug);

  usePageMeta({
    title: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    description:
      'Keep your approved recoveries. Pay for the system, not a percentage of every reimbursement. Choose the tier that fits your operational scale.',
    url: `${SITE_META.url}/pricing`,
  });

  const openSalesPage = () => {
    navigate('/sales');
  };

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
        className={cn(cardClasses, "mx-auto w-full max-w-md lg:max-w-none")}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(11,116,222,0.1),_transparent_60%)]" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                {tier.salesLed ? 'Offer' : 'Coverage'}
              </div>
              <h2 className="mt-3 font-lora text-3xl font-normal leading-tight tracking-tight text-[#182026]">{tier.name}</h2>
            </div>
            {featured || tier.badgeLabel ? (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[9px] uppercase whitespace-nowrap rounded-[6px] px-2 py-0.5",
                  tier.badgeLabel?.includes('Coming Soon')
                    ? "font-medium tracking-tight bg-slate-100 text-slate-500 border-[#D8E3EA]"
                    : "font-bold tracking-tight border-[#D8E3EA] bg-white text-[#0B74DE] shadow-sm"
                )}
              >
                {tier.badgeLabel || 'Most Popular'}
              </Badge>
            ) : null}
          </div>

          <div className="mb-6 rounded-[24px] border border-[#E4EDF1] bg-[#F8FAFC] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Price</div>
            <div className="mt-3 font-lora text-4xl font-normal tracking-[-0.02em] text-[#182026]">
              {tier.price}
            </div>
            <div className="mt-2 text-[11px] text-[#66737F]">
              {tier.priceContext}
            </div>
          </div>

          <div className="mb-6 rounded-[22px] border border-[#E4EDF1] bg-white p-4 min-h-[104px]">
            <div className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Purpose</div>
            <div className="mt-3 text-sm font-semibold text-[#25313A]">{tier.purpose}</div>
          </div>

          <div className="mb-8 flex-grow rounded-[24px] border border-[#E4EDF1] bg-white p-5">
            <div className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Key Differentiators</div>
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
                const ctaText = tier.ctaLabel || `Start ${tier.name} Coverage`;
                const ctaLocation = tier.name === 'Early Access' ? 'pricing_early_access' : `pricing_${tier.name.toLowerCase()}`;
                trackClaimAccessClicked({
                  cta_location: ctaLocation,
                  cta_text: ctaText,
                });
                if (tier.checkoutUrl) {
                  navigate(tier.checkoutUrl);
                  return;
                }
                if (tier.auditRequired) {
                  navigate('/audit');
                  return;
                }
                if (tier.salesLed) {
                  openSalesPage();
                }
              }}
              disabled={tier.badgeLabel?.includes('Coming Soon')}
              className={cn(
                "h-12 rounded-[6px] font-bold text-[13px] uppercase tracking-tight transition-all duration-200",
                tier.badgeLabel?.includes('Coming Soon')
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : featured
                    ? "bg-white text-[#0B74DE] border border-[#0B74DE] hover:bg-[#FAFAF7] shadow-sm"
                    : "border border-[#D8E3EA] bg-white text-[#182026] hover:bg-[#FAFAF7]"
              )}
            >
              {tier.ctaLabel || `Start ${tier.name} Coverage`}
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
              className="inline-flex items-center rounded-full border border-[#DCE8EE] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
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
            className="mb-16 flex flex-col items-start justify-between gap-10 md:flex-row md:items-end"
          >
            <div className="max-w-xl">
              <h2 className="font-lora text-4xl font-normal leading-tight tracking-tight text-[#182026] sm:text-5xl md:text-7xl md:leading-none">
                Simple pricing,<br />
                <span className="text-[#8A99A4]">real results.</span>
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-[#66737F] sm:hidden">
                See what happened and what to do next.
              </p>
            </div>
            
            <div className="flex max-w-[320px] flex-col items-start md:items-end md:text-right">
              <div className="grid gap-2 text-left md:text-right">
                {[
                  'Start on any tier',
                  'Move up or down whenever your data follows',
                  'No migrations, exports, or downtime',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[13px] leading-relaxed text-[#66737F] md:justify-end">
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#0B74DE]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:gap-6 lg:grid-cols-3 items-stretch">
            {getPricingTiers().map((tier, index) => renderPricingTier(tier, index))}
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
