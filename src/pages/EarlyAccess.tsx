import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

const EARLY_ACCESS_CHECKOUT_URL = 'https://www.paypal.com/ncp/payment/P4XPE6PAPWT56';
const EARLY_ACCESS_PRICE = '$99';
const FREE_AUDIT_REPORT_TIMELINE = 'within 48 hours';
const DEMO_VIDEO_URL = 'https://youtu.be/B0ksWTlYbRo';
const DEMO_VIDEO_THUMBNAIL_URL = '/margin-logo-reveal.gif';

const offerHighlights = [
  {
    title: 'Free audit report',
    detail: `Request a no-payment pre-audit and get a written FBA recovery report ${FREE_AUDIT_REPORT_TIMELINE}.`
  },
  {
    title: 'Personalized signals first',
    detail: 'See potential missed reimbursements before deciding whether Founding 100 is worth it.'
  },
  {
    title: 'Read-only review',
    detail: 'The audit starts with visibility-first setup and seller-controlled next steps.'
  },
  {
    title: 'Upgrade only after proof',
    detail: `${EARLY_ACCESS_PRICE} Founding 100 activation is offered after your free audit shows what may be worth filing.`
  },
  {
    title: '0% recovery commission',
    detail: 'If you upgrade, Margin takes no commission from approved reimbursements.'
  }
];

const primaryOfferHighlights = offerHighlights.slice(0, 4);
const secondaryOfferHighlight = offerHighlights[4];

const whatYouGet = [
  {
    step: '01',
    title: 'We scan the FBA events sellers usually miss',
    detail: 'Margin reviews inventory adjustments, shipment discrepancies, returns, fees, and payout activity for recovery signals that may still be actionable.'
  },
  {
    step: '02',
    title: 'You see what may be recoverable before filing',
    detail: 'Your audit separates claim-ready issues from blocked cases and missing-proof items, so you are not guessing which recovery work deserves attention.'
  },
  {
    step: '03',
    title: 'Evidence gets organized around each case',
    detail: 'Margin maps available records to each opportunity and flags the documents or source data still needed before a reimbursement case should move forward.'
  },
  {
    step: '04',
    title: 'You keep control of every filing decision',
    detail: 'Evidence-supported cases are reviewed with you first. No filing happens without seller approval, context, and a clear view of the case basis.'
  },
  {
    step: '05',
    title: 'You keep approved reimbursements',
    detail: 'Margin charges no recovery commission on approved reimbursements. The Founding 100 audit is a flat activation fee for the first guided cycle.'
  }
];

const fitPoints = [
  {
    step: '01',
    title: 'Serious FBA sellers with recovery leakage',
    detail: 'For operators who want Amazon loss events surfaced before claim windows, missing evidence, or payout confusion become the reason recovery work fails.'
  },
  {
    step: '02',
    title: 'Operators who want proof before filing',
    detail: 'For sellers who care about evidence quality, duplicate prevention, claim readiness, and avoiding weak reimbursement claims.'
  },
  {
    step: '03',
    title: 'Founding members who want guided support',
    detail: 'For sellers who want a founder-led first recovery cycle instead of a black-box service, unsupported dashboard, or commission-heavy recovery model.'
  }
];

const auditBenefits = [
  'Get a written pre-audit report before you pay.',
  'See hidden inventory, shipment, return, fee, and payout recovery signals.',
  'Understand which opportunities look claim-ready, blocked, or missing proof.',
  'Upgrade to Founding 100 only after the audit shows personalized value.'
];

const comparisonRows = [
  {
    label: 'Recovery fee',
    margin: '$99 Founding 100 audit activation',
    traditional: 'Often a percentage of approved recoveries'
  },
  {
    label: 'Commission on reimbursements',
    margin: '0% commission to Margin',
    traditional: 'Commonly commission-based'
  },
  {
    label: 'Account setup',
    margin: 'Read-only first, guided by the founder',
    traditional: 'Varies by provider'
  },
  {
    label: 'Filing control',
    margin: 'Seller approval before any filing',
    traditional: 'May be less transparent'
  }
];

const auditFlowSteps = [
  'Enter your work email',
  'We review your FBA recovery signals',
  'You receive a written report within 48 hours',
  'Upgrade to Founding 100 only if you want us to file'
];

const marketplaceCountries = [
  { country: 'United States', code: 'US', flagCode: 'us', region: 'North America' },
  { country: 'Canada', code: 'CA', flagCode: 'ca', region: 'North America' },
  { country: 'Mexico', code: 'MX', flagCode: 'mx', region: 'North America' },
  { country: 'Germany', code: 'DE', flagCode: 'de', region: 'Europe' },
  { country: 'United Kingdom', code: 'UK', flagCode: 'gb', region: 'Europe' },
  { country: 'Italy', code: 'IT', flagCode: 'it', region: 'Europe' },
  { country: 'France', code: 'FR', flagCode: 'fr', region: 'Europe' },
  { country: 'South Africa', code: 'ZA', flagCode: 'za', region: 'Africa' },
  { country: 'Japan', code: 'JP', flagCode: 'jp', region: 'Far East' },
  { country: 'Australia', code: 'AU', flagCode: 'au', region: 'Far East' }
];

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const sectionHeadingClass = 'mt-4 max-w-[900px] text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[64px]';
const sectionBodyClass = 'mt-4 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';

export default function EarlyAccess() {
  const { toast } = useToast();
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [auditRequested, setAuditRequested] = useState(false);

  usePageMeta({
    title: 'Free Amazon FBA Recovery Audit Report | Margin',
    description:
      'Request a free Amazon FBA recovery audit report. Margin reviews hidden inventory losses, shipment issues, returns, fee errors, and payout discrepancies before any paid upgrade.',
    url: `${SITE_META.url}/early-access`,
    image: SITE_META.image,
  });

  const handleReserveEarlyAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = earlyAccessEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Work email required',
        description: 'Add the email we should use for Founding 100 onboarding and setup updates.',
        variant: 'destructive',
      });
      return;
    }

    setIsReserving(true);
    try {
      const response = await api.reserveEarlyAccess({
        email,
        source_page: '/early-access',
        offer: 'Free FBA Recovery Audit Report',
        price: 'Free pre-audit',
        intent: 'request_free_pre_audit_report',
      });

      if (!response.ok) {
        toast({
          title: 'Could not request audit',
          description: response.error || 'Please try again so we can queue your free audit report.',
          variant: 'destructive',
        });
        return;
      }

      setAuditRequested(true);
      toast({
        title: 'Free audit requested',
        description: `We will email your pre-audit report ${FREE_AUDIT_REPORT_TIMELINE}.`,
      });
    } catch {
      toast({
        title: 'Network issue',
        description: 'We could not queue your free audit report. Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-[860px]"
            >
              <div className="max-w-[780px]">
                <div className={sectionLabelClass}>Founding 100</div>

                <h1 className="mt-5 max-w-[760px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[78px]">
                  Find hidden Amazon reimbursements with a free audit report.
                </h1>

                <p className="mt-5 max-w-[640px] text-[20px] font-semibold leading-8 tracking-[-0.025em] text-[#25313A] md:mt-7 md:text-[28px] md:leading-9">
                  We review your FBA recovery signals first. No payment required.
                </p>

                <p className="mt-5 max-w-[680px] text-[16px] leading-7 text-[#4D5B66] md:text-[19px] md:leading-8">
                  Margin reviews your FBA activity for hidden inventory losses, shipment issues, returns, fee errors, and payout discrepancies. You get a written report of missed reimbursement opportunities before deciding whether to upgrade.
                </p>

                <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                  If the report shows opportunities worth filing, you can join Founding 100 for {EARLY_ACCESS_PRICE}. Margin keeps 0% commission, and no filing happens without your approval.
                </p>

                <div className="mt-6 grid max-w-[720px] gap-3 sm:grid-cols-2">
                  {auditBenefits.map((benefit) => (
                    <div key={benefit} className="flex gap-3 rounded-[18px] border border-[#D8E3E8] bg-white/72 px-4 py-3 text-[13px] leading-6 text-[#4D5B66] shadow-[0_16px_44px_rgba(37,49,58,0.06)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B74DE]" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReserveEarlyAccess} className="mt-8 w-full max-w-[540px]">
                  {auditRequested ? (
                    <div className="rounded-[24px] border border-[#BBD8C8] bg-[#F4FBF6] px-5 py-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">Audit request received</div>
                      <p className="mt-3 text-[15px] leading-7 text-[#25313A]">
                        Thanks. We will email your free pre-audit report {FREE_AUDIT_REPORT_TIMELINE}. While you wait, you can watch the audit walkthrough below.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor="early-access-email" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#66737F]">
                        Work email for your free report
                      </Label>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="early-access-email"
                          type="email"
                          value={earlyAccessEmail}
                          onChange={(event) => setEarlyAccessEmail(event.target.value)}
                          placeholder="you@company.com"
                          className="h-12 rounded-full border-[#CFE0EA] bg-white px-5 text-sm text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                          autoComplete="email"
                        />
                        <Button
                          type="submit"
                          disabled={isReserving}
                          className="h-12 shrink-0 justify-center rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[206px] md:px-6 md:text-sm"
                        >
                          {isReserving ? 'Requesting...' : 'Get My Free Audit Report'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-3 text-[12px] leading-6 text-[#66737F]">
                        No payment required. We use this email to send your report and follow-up questions if needed.
                      </p>
                    </>
                  )}

                  <div className="mt-3">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] hover:bg-[#F8FAFC] sm:min-w-[206px] md:h-12 md:px-6 md:text-sm"
                    >
                      <Link to="/waitlist">Join Priority Waitlist</Link>
                    </Button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-14 border-y border-[#D8E3E8] bg-white/50 md:mt-20">
          <div className={containerClass}>
            <div className="grid md:grid-cols-4">
              {primaryOfferHighlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.05 }}
                  className={`px-0 py-5 md:px-6 md:py-7 ${index > 0 ? 'border-t border-[#D8E3E8] md:border-l md:border-t-0' : ''}`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.title}</div>
                  <p className="mt-2 max-w-[220px] text-[14px] leading-7 text-[#4D5B66]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
            {secondaryOfferHighlight ? (
              <motion.div
                {...revealProps}
                className="border-t border-[#D8E3E8] py-5 md:px-6 md:py-7"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{secondaryOfferHighlight.title}</div>
                <p className="mt-2 max-w-[520px] text-[14px] leading-7 text-[#4D5B66]">{secondaryOfferHighlight.detail}</p>
              </motion.div>
            ) : null}
          </div>
        </section>

        <section className="relative py-12 md:py-20">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto mb-7 max-w-[880px] text-center md:mb-10">
              <div className={sectionLabelClass}>See Demo</div>
              <h2 className="mt-4 text-[28px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[54px]">
                See what the audit is looking for.
              </h2>
              <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                Watch how Margin detects Amazon loss events, matches evidence, prepares cases for seller review, and tracks recovery states through payout.
              </p>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => setIsDemoOpen(true)}
              {...revealProps}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[2px] border border-[#CFE0EA] bg-white text-left shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF7]"
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
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 md:text-[11px]">Full recovery walkthrough</div>
                  <div className="mt-2 max-w-[760px] text-[20px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[34px]">
                    Watch Margin detect loss events, match evidence, prepare cases for review, and track recovery states through payout.
                  </div>
                </div>
              </div>
            </motion.button>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-white py-16 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <motion.div {...revealProps} className="max-w-[560px]">
                <div className={sectionLabelClass}>Why Upgrade After The Free Audit</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  First we show you what may be recoverable.
                </h2>
                <p className={sectionBodyClass}>
                  The free report gives you personalized recovery signals before any payment. If there is value worth pursuing, Founding 100 is the paid filing and guided recovery cycle.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-7 h-11 rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] hover:bg-[#F8FAFC]"
                >
                  <a href={EARLY_ACCESS_CHECKOUT_URL}>Upgrade after receiving your report</a>
                </Button>
              </motion.div>

              <motion.div {...revealProps} className="overflow-hidden rounded-[24px] border border-[#D8E3E8] bg-[#FAFAF7] shadow-[0_24px_70px_rgba(37,49,58,0.08)]">
                <div className="grid grid-cols-[0.78fr_1fr_1fr] border-b border-[#D8E3E8] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">
                  <div className="px-4 py-4">Compare</div>
                  <div className="border-l border-[#D8E3E8] px-4 py-4 text-[#0B74DE]">Margin</div>
                  <div className="border-l border-[#D8E3E8] px-4 py-4">Traditional services</div>
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[0.78fr_1fr_1fr] border-b border-[#D8E3E8] last:border-b-0">
                    <div className="px-4 py-4 text-[13px] font-semibold text-[#25313A]">{row.label}</div>
                    <div className="border-l border-[#D8E3E8] px-4 py-4 text-[13px] leading-6 text-[#4D5B66]">{row.margin}</div>
                    <div className="border-l border-[#D8E3E8] px-4 py-4 text-[13px] leading-6 text-[#66737F]">{row.traditional}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-white py-16 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <motion.div {...revealProps} className="max-w-[560px]">
                <div className={sectionLabelClass}>Marketplace Reach</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  Marketplace coverage for Founding 100 operators.
                </h2>
                <p className={sectionBodyClass}>
                  Margin is built around the marketplaces where FBA sellers already operate. Coverage is activated through managed onboarding, read-only setup, and claim-type-aware recovery review.
                </p>
              </motion.div>

              <motion.div
                {...revealProps}
                className="grid border-y border-[#D8E3E8] sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              >
                {marketplaceCountries.map((marketplace, index) => (
                  <motion.div
                    key={marketplace.code}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.035 }}
                    className={`group flex items-center gap-4 py-5 sm:px-5 ${
                      index > 0 ? 'border-t border-[#D8E3E8] sm:border-t-0' : ''
                    } ${
                      index % 2 === 1 ? 'sm:border-l sm:border-[#D8E3E8]' : ''
                    } ${
                      index >= 2 ? 'sm:border-t sm:border-[#D8E3E8]' : ''
                    } ${
                      index % 3 !== 0 ? 'xl:border-l xl:border-[#D8E3E8]' : 'xl:border-l-0'
                    } ${
                      index >= 3 ? 'xl:border-t xl:border-[#D8E3E8]' : ''
                    }`}
                  >
                    <span
                      className={`fi fi-${marketplace.flagCode} h-5 w-7 shrink-0 rounded-[4px] shadow-[0_8px_18px_rgba(37,49,58,0.12)]`}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-[16px] font-semibold tracking-[-0.02em] text-[#182026]">{marketplace.country}</div>
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8994]">
                        {marketplace.region} · {marketplace.code}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>What You Get</div>
              <h2 className={sectionHeadingClass}>
                A free report first, then a paid filing path if it makes sense.
              </h2>
              <p className={sectionBodyClass}>
                The audit is built to surface recoverable FBA issues, organize the evidence around them, and help you decide whether Founding 100 is worth upgrading into.
              </p>
            </motion.div>

            <motion.div {...revealProps} className="mt-8 grid gap-3 md:mt-12 md:grid-cols-4">
              {auditFlowSteps.map((step, index) => (
                <div key={step} className="rounded-[20px] border border-[#D8E3E8] bg-white px-4 py-4 shadow-[0_18px_54px_rgba(37,49,58,0.06)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">Step {index + 1}</div>
                  <div className="mt-2 text-[14px] font-semibold leading-6 text-[#25313A]">{step}</div>
                </div>
              ))}
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-16">
              {whatYouGet.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-4 border-b border-[#D8E3E8] py-6 md:grid-cols-[88px_minmax(0,1fr)] md:gap-8 md:py-9"
                >
                  <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.step}</div>
                  <div className="max-w-[800px]">
                    <h3 className="text-[22px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#182026] md:text-[34px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[680px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                      {item.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Who It Is For</div>
              <h2 className={sectionHeadingClass}>
                Amazon FBA sellers who want recovery work handled carefully.
              </h2>
              <p className={sectionBodyClass}>
                This offer is for operators who want recovery visibility, seller-controlled filing, and stronger evidence before cases move.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-16">
              {fitPoints.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10 md:py-8"
                >
                  <h3 className="text-[22px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#182026] md:text-[28px]">
                    {item.title}
                  </h3>
                  <p className="max-w-[660px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Why This Exists</div>
              <h2 className={sectionHeadingClass}>
                Founding 100 is managed because recovery work depends on accurate setup.
              </h2>
              <p className={sectionBodyClass}>
                The free audit proves whether there is a recovery conversation worth having. The paid Founding 100 cycle is for sellers who want Margin to help move evidence-backed cases forward.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-14 md:px-10 md:py-12"
            >
              <div className="max-w-[820px]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]">Priority launch cohort</div>
                <p className="mt-5 text-[18px] leading-8 text-[#4D5B66] md:text-[24px] md:leading-10">
                  We keep launch access controlled on purpose. Each seller needs clean setup, correct marketplace coverage, evidence review, and a clear first recovery cycle before broader public access opens. That is why the first step is proof, not payment.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-36">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[900px]">
                <div className={sectionLabelClass}>Free Audit</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[68px]">
                  Get your free audit report.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  We will send a written pre-audit report within 48 hours. If it shows recovery opportunities worth pursuing, you can upgrade to Founding 100 for {EARLY_ACCESS_PRICE}.
                </p>
                <p className="mt-4 max-w-[780px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  Founding 100 includes guided filing support, 0% recovery commission, and seller approval before any case moves.
                </p>
              </div>

              <form onSubmit={handleReserveEarlyAccess} className="mt-8 w-full max-w-[560px] md:mt-10">
                {auditRequested ? (
                  <div className="rounded-[24px] border border-[#BBD8C8] bg-[#F4FBF6] px-5 py-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2E7D5B]">Audit request received</div>
                    <p className="mt-3 text-[15px] leading-7 text-[#25313A]">
                      Your free report is queued. We will email it {FREE_AUDIT_REPORT_TIMELINE}.
                    </p>
                  </div>
                ) : (
                  <>
                    <Label htmlFor="early-access-email-bottom" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#66737F]">
                      Work email for your free report
                    </Label>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <Input
                        id="early-access-email-bottom"
                        type="email"
                        value={earlyAccessEmail}
                        onChange={(event) => setEarlyAccessEmail(event.target.value)}
                        placeholder="you@company.com"
                        className="h-12 rounded-full border-[#CFE0EA] bg-white px-5 text-sm text-[#182026] placeholder:text-[#9AA8B2] focus-visible:ring-[#0B74DE]/20"
                        autoComplete="email"
                      />
                      <Button
                        type="submit"
                        disabled={isReserving}
                        className="h-12 shrink-0 justify-center rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[206px] md:px-6 md:text-sm"
                      >
                        {isReserving ? 'Requesting...' : 'Get My Free Audit Report'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
                <div className="mt-3">
                  <p className="mb-3 max-w-[540px] text-[12px] leading-6 text-[#66737F]">
                    Margin does not guarantee reimbursement outcomes. Amazon makes final reimbursement decisions. No filing happens without seller approval.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] hover:bg-[#F8FAFC] sm:min-w-[206px] md:h-12 md:px-6 md:text-sm"
                  >
                    <Link to="/waitlist">Join Priority Waitlist</Link>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin recovery walkthrough"
        description="Watch how Margin detects Amazon loss events, matches evidence, prepares cases for review, and tracks recovery states through payout."
      />
      <BrandFooter />
    </div>
  );
}
