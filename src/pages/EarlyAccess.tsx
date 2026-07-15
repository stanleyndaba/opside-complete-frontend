import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';

import { DemoVideoModal } from '@/components/demo/DemoVideoModal';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import {
  EARLY_ACCESS_CURRENCY,
  EARLY_ACCESS_OFFER,
  EARLY_ACCESS_VALUE_ZAR,
  PAYSTACK_EARLY_ACCESS_URL,
  PAYSTACK_PAYMENT_PROVIDER,
  trackCheckoutStarted,
  trackClaimAccessClicked,
  trackEvent,
  trackOutboundPaymentClicked,
} from '@/lib/analytics';

/* ── constants ─────────────────────────────────────────────────── */
const EARLY_ACCESS_CHECKOUT_URL = PAYSTACK_EARLY_ACCESS_URL;
const EARLY_ACCESS_PRICE = '$99';
const DEMO_VIDEO_URL = 'https://youtu.be/B0ksWTlYbRo';
const DEMO_VIDEO_THUMBNAIL_URL = '/margin-logo-reveal.gif';
const EARLY_ACCESS_PAYMENT_SUCCESS_PATH = '/payment/success?source=paystack_payment_page&kind=early_access&offer=Early%20Access&price=%2499';

const getEarlyAccessSuccessUrl = () => {
  if (typeof window === 'undefined') {
    return EARLY_ACCESS_PAYMENT_SUCCESS_PATH;
  }

  return `${window.location.origin}${EARLY_ACCESS_PAYMENT_SUCCESS_PATH}`;
};

const rememberEarlyAccessCheckout = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const successUrl = getEarlyAccessSuccessUrl();
  window.localStorage.setItem('margin_pending_checkout', JSON.stringify({
    kind: 'early_access',
    source: 'paystack_payment_page',
    offer: 'Early Access',
    price: EARLY_ACCESS_PRICE,
    returnPath: '/early-access',
    successUrl,
    createdAt: new Date().toISOString(),
  }));
};

/* ── timeline data ─────────────────────────────────────────────── */
const timelineSteps = [
  {
    num: '01',
    label: 'Reserve',
    title: 'Reserve your Early Access seat.',
    detail:
      'Your reservation locks founder pricing and priority activation. Margin prepares infrastructure and onboarding readiness before platform access begins.',
  },
  {
    num: '02',
    label: 'Verify',
    title: "The Agent retrieves the Evidence (BOLs/Invoices) Amazon says you don't have.",
    detail:
      'Before anything is filed, you see the evidence Margin located — Bills of Lading, commercial invoices, shipment IDs, and tracking records — matched to each potential recovery case.',
  },
  {
    num: '03',
    label: 'Recover',
    title: 'We win the cases. You keep 100% of the recovered value.',
    detail:
      'Margin prepares and submits reimbursement cases with full evidence packages. Every approved payout goes directly to you. Margin takes zero commission on recovered funds.',
  },
];

/* ── marketplace flags ─────────────────────────────────────────── */
const marketplaceCountries = [
  { country: 'United States', code: 'US', flagCode: 'us' },
  { country: 'Canada', code: 'CA', flagCode: 'ca' },
  { country: 'Mexico', code: 'MX', flagCode: 'mx' },
  { country: 'Germany', code: 'DE', flagCode: 'de' },
  { country: 'United Kingdom', code: 'UK', flagCode: 'gb' },
  { country: 'Italy', code: 'IT', flagCode: 'it' },
  { country: 'France', code: 'FR', flagCode: 'fr' },
  { country: 'South Africa', code: 'ZA', flagCode: 'za' },
  { country: 'Japan', code: 'JP', flagCode: 'jp' },
  { country: 'Australia', code: 'AU', flagCode: 'au' },
];

/* ── animation presets ─────────────────────────────────────────── */
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

/* ── primary cta component ─────────────────────────────────────── */
function FounderPassCTA({
  subtext,
  location,
  onCheckoutClick,
}: {
  subtext?: React.ReactNode;
  location: string;
  onCheckoutClick: (event: React.MouseEvent<HTMLAnchorElement>, location: string, ctaText: string) => void;
}) {
  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col items-center">
      <div className="mb-4 inline-flex items-center rounded-full border border-[#E9EEF2] bg-white px-3 py-1 shadow-sm">
        <span className="flex h-2 w-2 rounded-full bg-[#E05B52] mr-2 animate-pulse" />
        <span className="text-[12px] font-semibold tracking-wide text-[#182026] uppercase">
          Closes July 30
        </span>
      </div>
      <Button
        asChild
        className="h-[56px] w-full max-w-[340px] justify-center rounded-full bg-[#0B74DE] px-6 text-[15px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-all hover:bg-[#0962bf] hover:shadow-[0_22px_50px_rgba(11,116,222,0.30)] md:text-[16px]"
      >
        <a
          href={EARLY_ACCESS_CHECKOUT_URL}
          onClick={(event) => onCheckoutClick(event, location, 'Get Started')}
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      </Button>
      <div className="mt-4 text-center">
        <p className="text-[13px] font-medium leading-5 text-[#4D5B66]">
          {subtext || 'Introductory pricing locked through December 31, 2026. Priority activation and onboarding are included.'}
        </p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-[#4D5B66]">
          <span className="font-semibold text-[#0B74DE]">E2E Recovery Commitment. No recovery left behind.</span>
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function EarlyAccess() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLElement>(null);
  const offerCtaRef = useRef<HTMLDivElement>(null);
  const bottomCtaRef = useRef<HTMLDivElement>(null);
  const firedAnalyticsRef = useRef<Set<string>>(new Set());
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const fireOnce = useCallback((eventName: string, params: Record<string, unknown> = {}) => {
    if (firedAnalyticsRef.current.has(eventName)) return;
    firedAnalyticsRef.current.add(eventName);
    trackEvent(eventName, {
      offer: EARLY_ACCESS_OFFER,
      ...params,
    });
  }, []);

  useEffect(() => {
    fireOnce(ANALYTICS_EVENTS.earlyAccessViewed, {
      cta_location: 'early_access_page',
    });
  }, [fireOnce]);

  useEffect(() => {
    const tenSecondTimer = window.setTimeout(() => {
      fireOnce(ANALYTICS_EVENTS.earlyAccess10sEngaged, {
        cta_location: 'early_access_page',
      });
    }, 10000);
    const thirtySecondTimer = window.setTimeout(() => {
      fireOnce(ANALYTICS_EVENTS.earlyAccess30sEngaged, {
        cta_location: 'early_access_page',
      });
    }, 30000);

    return () => {
      window.clearTimeout(tenSecondTimer);
      window.clearTimeout(thirtySecondTimer);
    };
  }, [fireOnce]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    const checkScrollDepth = () => {
      ticking = false;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const depth = (window.scrollY / scrollable) * 100;
      if (depth >= 50) {
        fireOnce(ANALYTICS_EVENTS.earlyAccessScroll50, {
          cta_location: 'early_access_page',
        });
      }
      if (depth >= 75) {
        fireOnce(ANALYTICS_EVENTS.earlyAccessScroll75, {
          cta_location: 'early_access_page',
        });
      }
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(checkScrollDepth);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkScrollDepth();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fireOnce]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const targets = [
      {
        ref: heroRef,
        eventName: ANALYTICS_EVENTS.earlyAccessHeroSeen,
        params: { cta_location: 'early_access_hero' },
      },
      {
        ref: offerRef,
        eventName: ANALYTICS_EVENTS.earlyAccessOfferSeen,
        params: { cta_location: 'early_access_offer_section' },
      },
      {
        ref: mainCtaRef,
        eventName: ANALYTICS_EVENTS.earlyAccessCtaSeen,
        params: { cta_location: 'early_access_hero', cta_text: 'Get Started' },
      },
      {
        ref: mainCtaRef,
        eventName: ANALYTICS_EVENTS.paystackCtaSeen,
        params: {
          cta_location: 'early_access_hero',
          cta_text: 'Get Started',
          value: EARLY_ACCESS_VALUE_ZAR,
          currency: EARLY_ACCESS_CURRENCY,
          payment_provider: PAYSTACK_PAYMENT_PROVIDER,
        },
      },
      {
        ref: offerCtaRef,
        eventName: ANALYTICS_EVENTS.paystackCtaSeen,
        params: {
          cta_location: 'early_access_offer_section',
          cta_text: 'Get Started',
          value: EARLY_ACCESS_VALUE_ZAR,
          currency: EARLY_ACCESS_CURRENCY,
          payment_provider: PAYSTACK_PAYMENT_PROVIDER,
        },
      },
      {
        ref: bottomCtaRef,
        eventName: ANALYTICS_EVENTS.paystackCtaSeen,
        params: {
          cta_location: 'early_access_bottom_cta',
          cta_text: 'Get Started',
          value: EARLY_ACCESS_VALUE_ZAR,
          currency: EARLY_ACCESS_CURRENCY,
          payment_provider: PAYSTACK_PAYMENT_PROVIDER,
        },
      },
    ];

    const observedTargets: Array<{
      element: Element;
      eventName: string;
      params: Record<string, unknown>;
    }> = [];

    targets.forEach((target) => {
      const element = target.ref.current;
      if (!element) return;
      observedTargets.push({
        element,
        eventName: target.eventName,
        params: target.params,
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observedTargets
            .filter((target) => target.element === entry.target)
            .forEach((target) => fireOnce(target.eventName, target.params));
        });
      },
      { threshold: 0.35 }
    );

    observedTargets.forEach((target) => observer.observe(target.element));
    return () => observer.disconnect();
  }, [fireOnce]);

  const handleCheckoutClick = useCallback((
    event: React.MouseEvent<HTMLAnchorElement>,
    ctaLocation: string,
    ctaText: string
  ) => {
    rememberEarlyAccessCheckout();
    trackClaimAccessClicked({
      cta_location: ctaLocation,
      cta_text: ctaText,
    });
    trackOutboundPaymentClicked({
      cta_location: ctaLocation,
      cta_text: ctaText,
      destination: EARLY_ACCESS_CHECKOUT_URL,
    });
    trackCheckoutStarted({
      cta_location: ctaLocation,
      cta_text: ctaText,
      destination: EARLY_ACCESS_CHECKOUT_URL,
    });

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    window.setTimeout(() => {
      window.location.assign(EARLY_ACCESS_CHECKOUT_URL);
    }, 180);
  }, []);

  usePageMeta({
    title: 'Free Amazon FBA Evidence Scan | Margin',
    description:
      'Margin is the only FBA recovery agent that retrieves the Bill of Lading and Invoices to prove your case. Start a free evidence scan — no payment required.',
    url: `${SITE_META.url}/early-access`,
    image: SITE_META.image,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: 'Work email required',
        description: 'Enter the email where we should send your evidence scan results.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.reserveEarlyAccess({
        email: trimmed,
        source_page: '/early-access',
        offer: 'Free Evidence Scan',
        price: 'Free',
        intent: 'request_free_evidence_scan',
      });
      if (!res.ok) {
        toast({
          title: 'Could not request scan',
          description: res.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
      setSubmitted(true);
      toast({ title: 'Scan requested', description: "We'll email results within 48 hours." });
    } catch {
      toast({
        title: 'Network issue',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        {/* subtle grid overlay */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(11,116,222,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

        {/* ═══ HERO ═══ */}
        <section ref={heroRef} className="relative pb-20 pt-32 md:pb-28 md:pt-44">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] bg-[radial-gradient(circle_at_50%_0%,rgba(11,116,222,0.10),transparent_46%)]" />

          <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center text-center"
            >
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B74DE] opacity-90">
                Early Access: Batch 01 Open
              </div>

              <h1 className="mt-6 max-w-[920px] text-[40px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#182026] sm:text-[52px] md:text-[82px]">
                Join Early Access.
              </h1>

              <p className="mx-auto mt-6 max-w-[680px] text-[17px] leading-8 text-[#4D5B66] md:mt-8 md:text-[21px] md:leading-9">
                {EARLY_ACCESS_PRICE} one-time. Keep 100% of every recovery through December 31, 2026. Upgrade to Pro or Scale anytime and your $99 is credited. Early Access closes July 30, 2026 or when 500 slots are filled.
              </p>

              <div ref={mainCtaRef} className="mt-10 w-full">
                <FounderPassCTA location="early_access_hero" onCheckoutClick={handleCheckoutClick} />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ DEMO VIDEO ═══ */}
        <section className="hidden relative pb-16 md:pb-24">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.button
              type="button"
              onClick={() => {
                trackEvent(ANALYTICS_EVENTS.demoCtaClicked, {
                  cta_location: 'early_access_demo_section',
                  cta_text: 'Watch the Margin product demo',
                  video_name: 'margin_demo',
                });
                setIsDemoOpen(true);
              }}
              {...reveal}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[3px] border border-[#CFE0EA] bg-white text-left shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF7]"
              aria-label="Watch the Margin product demo"
            >
              <div className="relative aspect-video overflow-hidden bg-[#E9EEF2]">
                <img
                  src={DEMO_VIDEO_THUMBNAIL_URL}
                  alt="Margin product demo thumbnail"
                  className="h-full w-full object-cover opacity-95 saturate-[0.95] transition duration-500 group-hover:scale-[1.015]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(24,32,38,0.54)_100%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-white/88 text-[#0B74DE] shadow-[0_22px_54px_rgba(37,49,58,0.18)] backdrop-blur transition group-hover:scale-105 md:h-20 md:w-20">
                    <PlayCircle className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.6} />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 md:text-[11px]">
                    Evidence-first walkthrough
                  </div>
                  <div className="mt-2 max-w-[760px] text-[20px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[34px]">
                    Watch Margin retrieve evidence, match it to loss events, and file winning cases.
                  </div>
                </div>
              </div>
            </motion.button>
          </div>
        </section>

        {/* ═══ EXECUTION TIMELINE — "The Path to Recovery" ═══ */}
        <section className="relative border-t border-[#E4EDF1] bg-white py-20 md:py-32">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.div {...reveal} className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B74DE]">
                The Path to Recovery
              </div>
              <h2 className="mx-auto mt-5 max-w-[800px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[66px]">
                One path. Three milestones.
              </h2>
              <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                No decision fatigue. Start with Early Access, then upgrade only when your recovery volume justifies it.
              </p>
            </motion.div>

            {/* vertical timeline */}
            <div ref={timelineRef} className="relative mx-auto mt-16 max-w-[820px] md:mt-24">
              {/* animated progress line (desktop only) */}
              <div className="absolute bottom-0 left-[27px] top-0 hidden w-px bg-[#E4EDF1] md:block">
                <motion.div
                  className="w-full bg-[#0B74DE]"
                  style={{ height: lineHeight }}
                />
              </div>

              <div className="flex flex-col gap-16 md:gap-20">
                {timelineSteps.map((step, i) => (
                  <motion.div
                    key={step.num}
                    {...reveal}
                    transition={{
                      ...reveal.transition,
                      delay: i * 0.1,
                    }}
                    className="relative grid gap-5 md:grid-cols-[56px_1fr] md:gap-10"
                  >
                    {/* dot */}
                    <div className="relative z-10 hidden md:block">
                      <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-2 border-[#0B74DE] bg-white text-[15px] font-bold text-[#0B74DE]">
                        {step.num}
                      </div>
                    </div>

                    {/* mobile dot */}
                    <div className="flex items-center gap-3 md:hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0B74DE] bg-white text-[13px] font-bold text-[#0B74DE]">
                        {step.num}
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]">
                        {step.label}
                      </span>
                    </div>

                    <div>
                      <div className="mb-2 hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE] md:block">
                        {step.label}
                      </div>
                      <h3 className="text-[24px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#182026] md:text-[34px]">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-[660px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOUNDER'S PASS ═══ */}
        <section ref={offerRef} className="relative border-t border-[#E4EDF1] py-20 md:py-32">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.div
              {...reveal}
              className="mx-auto max-w-[900px]"
            >
              <div className="text-center">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B74DE]">
                  Early Access
                </div>
                <h2 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[66px]">
                  Secure Your Early Access Slot.
                </h2>
                <p className="mx-auto mt-5 max-w-[640px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                  {EARLY_ACCESS_PRICE} one-time. Keep 100% of every recovery through December 31, 2026. No monthly fees during Early Access, no automatic renewal, and your $99 is credited if you upgrade to Pro or Scale before the period ends.
                </p>
              </div>

              <div className="mx-auto mt-12 grid max-w-[720px] gap-px overflow-hidden rounded-[20px] border border-[#E4EDF1] bg-[#E4EDF1] md:grid-cols-3">
                {[
                  { metric: '0%', label: 'Recovery commission' },
                  { metric: '100%', label: 'Reimbursements kept' },
                  { metric: '1-on-1', label: 'Founder-led onboarding' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white px-6 py-7 text-center"
                  >
                    <div className="text-[32px] font-semibold tracking-[-0.04em] text-[#182026]">
                      {stat.metric}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8896A1]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div ref={offerCtaRef} className="mt-10 text-center flex flex-col items-center">
                <Button
                  asChild
                  className="h-[52px] rounded-full border border-[#CFE0EA] bg-white px-7 text-[14px] font-semibold text-[#25313A] shadow-[0_14px_40px_rgba(37,49,58,0.08)] transition-all hover:bg-[#F8FAFC] hover:shadow-[0_18px_50px_rgba(37,49,58,0.12)]"
                >
                  <a
                    href={EARLY_ACCESS_CHECKOUT_URL}
                    onClick={(event) => handleCheckoutClick(event, 'early_access_offer_section', 'Get Started')}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5F3EC] text-[#2E7D5B]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#2E7D5B]">
                    E2E Recovery Commitment. No recovery left behind.
                  </p>
                </div>
                <div className="mt-4 text-[13px] font-medium text-[#4D5B66]">
                  One payment. {EARLY_ACCESS_PRICE} one-time. Introductory pricing locked through December 31, 2026. Priority activation and onboarding are included.
                </div>
                <p className="mt-4 max-w-[500px] text-[11px] leading-4 text-[#8A98A3]">
                  After 2026, the service ends unless you choose a Performance, Pro, or Scale plan for 2027.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ MARKETPLACE FLAGS ═══ */}
        <section className="relative border-t border-[#E4EDF1] bg-white py-16 md:py-24">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.div {...reveal} className="mb-10 text-center md:mb-14">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B74DE]">
                Marketplace Coverage
              </div>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.06] tracking-[-0.04em] text-[#182026] sm:text-[34px] md:text-[48px]">
                Built for the marketplaces you sell in.
              </h2>
            </motion.div>

            <motion.div
              {...reveal}
              className="mx-auto max-w-[860px] border-y border-[#D8E3E8]"
            >
              {marketplaceCountries.map((mp, i) => (
                <motion.div
                  key={mp.code}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: i * 0.03 }}
                  className={`flex items-center gap-3 py-4 ${i > 0 ? 'border-t border-[#D8E3E8]' : ''}`}
                >
                  <span
                    className={`fi fi-${mp.flagCode} h-4 w-6 shrink-0 rounded-[2px]`}
                    aria-hidden="true"
                  />
                  <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#182026]">
                    {mp.code}
                  </span>
                  <span className="text-[12px] text-[#66737F]">
                    {mp.country}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ BOTTOM CTA ═══ */}
        <section className="relative border-t border-[#E4EDF1] bg-[#FAFAF7] py-20 md:py-32">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <motion.div {...reveal} className="flex flex-col items-center text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0B74DE]">
                Start Here
              </div>
              <h2 className="mt-5 max-w-[860px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[68px]">
                Hire the Agent. Win the case.
              </h2>
              <p className="mx-auto mt-5 max-w-[600px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                Secure your Founding Pass before July 30, 2026 or before the first 500 slots are gone.
              </p>

              <div ref={bottomCtaRef} className="mt-10 w-full">
                <FounderPassCTA
                  location="early_access_bottom_cta"
                  onCheckoutClick={handleCheckoutClick}
                  subtext={`${EARLY_ACCESS_PRICE} one-time. Founder pricing locked through December 31, 2026. Priority activation and founder onboarding are included.`}
                />
              </div>

              <p className="mt-6 max-w-[540px] text-[11px] leading-5 text-[#9AA8B2]">
                Margin does not guarantee reimbursement outcomes. Amazon makes final reimbursement
                decisions. No filing happens without seller approval.
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin evidence-first recovery walkthrough"
        description="Watch Margin retrieve evidence, match it to loss events, and file winning cases."
        analyticsLocation="early_access_page"
        videoName="margin_demo"
      />
      <BrandFooter />
    </div>
  );
}
