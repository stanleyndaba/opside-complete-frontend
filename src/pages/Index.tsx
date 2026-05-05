import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, Layers3, LockKeyhole, Menu, PlayCircle, ShieldCheck } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const DEMO_VIDEO_URL = 'https://youtu.be/NFDzqcaAFHM';
const DEMO_VIDEO_THUMBNAIL_URL = '/Demo2.png';

const navLinks = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Research', to: '/research' },
  { label: 'API', to: '/developer-api' },
  { label: 'About', to: '/about-margin' },
  { label: 'Enterprise', to: '/sales' }
];

const trustHighlights = [
  'Read-only first',
  'Seller approval before filing',
  'No commissions',
  'Weak cases held back'
];

const whyNowItems = [
  {
    title: 'Short claim windows',
    detail: 'Some FBA reimbursement windows can be short, including 60-day windows for key lost or damaged inventory scenarios.'
  },
  {
    title: 'Granular fee noise',
    detail: 'Removal, disposal, reversal, reimbursement, and payout activity can split into smaller events that are harder to reconcile manually.'
  },
  {
    title: 'Quarterly audits are late',
    detail: 'If recovery work waits for a quarterly review, eligible issues can age out before anyone has prepared the evidence.'
  }
];

const proofItems = [
  {
    title: 'Claim-window urgency',
    detail: 'Key FBA claim windows can now be as short as 60 days. Margin helps recovery issues surface while there is still time to act.',
    icon: Clock3
  },
  {
    title: 'Evidence-backed preparation',
    detail: 'Records, documents, and support are linked before a recovery case moves toward filing.',
    icon: FileCheck2
  },
  {
    title: 'Read-only trust layer',
    detail: 'Start with visibility into the recovery trail before any account-changing action is considered.',
    icon: LockKeyhole
  },
  {
    title: 'Tracked through payout',
    detail: 'See what was detected, prepared, filed, approved, blocked, and actually paid out.',
    icon: Layers3
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Read-only setup',
    detail: 'Margin begins with a read-only view of shipments, inventory, refunds, fees, reimbursements, and payout activity.'
  },
  {
    step: '02',
    title: 'Detect recovery signals',
    detail: 'The workflow checks where quantities, events, reimbursements, and ledger activity stop matching cleanly.'
  },
  {
    step: '03',
    title: 'Match evidence',
    detail: 'Supporting records are pulled together so each case can move with proof instead of guesswork.'
  },
  {
    step: '04',
    title: 'Hold weak cases',
    detail: 'Weak, duplicate, or unsupported issues stay held back instead of being pushed forward carelessly.'
  },
  {
    step: '05',
    title: 'Review and track',
    detail: 'Supportable cases are reviewed with the seller, then tracked through filing, approval, payout, or block state.'
  }
];

const coverageExamples = [
  {
    label: 'Lost or damaged inventory',
    title: 'Inventory events stay tied to support and recovery state.',
    detail: 'Margin keeps the inventory event, support trail, and case movement connected from detection through resolution.'
  },
  {
    label: 'Inbound shipment shortages',
    title: 'Received units land short against the shipment plan.',
    detail: 'Quantity checks, shipment records, and supporting documents stay visible before the loss gets buried in operations.'
  },
  {
    label: 'Refund without return',
    title: 'A customer refund does not prove the unit came back.',
    detail: 'Refund activity is separated from actual return and inventory resolution before a case is treated as supportable.'
  },
  {
    label: 'Fees and removals',
    title: 'Removal fees, reversals, and reimbursements can drift quietly.',
    detail: 'As charges become more granular, Margin helps sellers keep fee events, inventory movement, and recovery context tied together.'
  },
  {
    label: 'Payout reconciliation',
    title: 'Approval and cash movement are not the same event.',
    detail: 'Margin keeps approval, awaiting payout, recovered, and blocked states separate so outcomes stay clear.'
  }
];

const trustControls = [
  {
    title: 'Official read-only connection',
    detail: 'Margin uses Amazon connection flows with read-only permissions first, so sellers can begin with visibility and control.'
  },
  {
    title: 'No filing without approval',
    detail: 'Supportable cases are reviewed with the seller before moving into a filing workflow.'
  },
  {
    title: 'Weak cases held back',
    detail: 'Duplicate, thread-only, or unsupported findings are held instead of being pushed into risky volume filing.'
  },
  {
    title: 'No outcome guarantees',
    detail: 'Margin prepares and tracks recovery work. Amazon makes final reimbursement decisions.'
  }
];

const earlyAccessItems = [
  'Founding 100 managed cohort',
  '$99 early-access reservation',
  'Workspace preparation before onboarding',
  'Founder-led first recovery cycle'
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin starts with a read-only review across shipments, inventory, refunds, fees, reimbursements, and payout activity. It surfaces potential recovery issues, prepares support, and separates what is ready to move from what still needs proof or review.'
  },
  {
    question: 'Does Margin guarantee reimbursements?',
    answer: 'No. Margin helps identify potential recovery opportunities, prepare evidence, and guide supportable cases. Amazon makes the final decision on every reimbursement outcome.'
  },
  {
    question: 'Can Margin change my Amazon account?',
    answer: 'Margin is read-only first. The recovery workflow is designed around visibility, evidence, and seller approval before any filing action is considered.'
  },
  {
    question: 'Why does recovery timing matter more now?',
    answer: 'Some FBA reimbursement claim windows are short, including 60-day windows for key lost or damaged inventory scenarios. If sellers only audit manually once a quarter, issues can age out before they are reviewed. Margin is built to keep recovery work visible sooner.'
  },
  {
    question: 'Does Margin file every issue it finds?',
    answer: 'No. Margin is built to hold weak, duplicate, or unsupported cases instead of pushing everything forward carelessly. The goal is valid recovery work, not volume filing.'
  },
  {
    question: 'How is this different from commission-based services?',
    answer: 'Margin is built around read-only visibility, evidence-backed case preparation, seller approval, and no recovery commissions. The seller keeps control of which supportable cases move forward.'
  },
  {
    question: 'What happens after I reserve Early Access?',
    answer: 'Your reservation joins the managed Founding 100 cohort. Margin prepares the workspace carefully, sends onboarding updates, and begins the guided first recovery cycle after setup is ready.'
  }
];

const integrationLogos = [
  { name: 'Amazon', src: '/AMZN.png', className: 'h-4 w-auto md:h-5' },
  { name: 'Gmail', src: '/gmailicon.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Outlook', src: '/outlookicon.webp', className: 'h-5 w-auto md:h-6' },
  { name: 'Google Drive', src: '/gd.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Dropbox', src: '/Dropbox_Icon.svg.png', className: 'h-5 w-auto md:h-6' },
  { name: 'OneDrive', src: '/onedriive.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Adobe Sign', src: '/dobe.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Slack', src: '/slack-icon-2019.png', className: 'h-5 w-auto md:h-6' }
];

const containerClass = 'mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const sectionHeadingClass = 'mt-4 max-w-[880px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[64px]';
const sectionBodyClass = 'mt-5 max-w-[740px] text-[16px] leading-8 text-[#66737F] md:text-[18px] md:leading-9';
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

function LightNavbar({ onPrimaryCta, primaryCtaLabel }: { onPrimaryCta: () => void; primaryCtaLabel: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-[1240px] px-3 py-3 md:px-6 md:py-5">
        <div className="rounded-[22px] border border-[#DCE8EE] bg-white/86 px-4 py-3 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-2xl md:px-5">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-full px-1 py-1 text-[#182026]">
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                width="22"
                height="22"
                className="h-5 w-auto object-contain"
              />
              <span className="brand-wordmark font-merriweather text-lg tracking-tight text-[#182026]">Margin</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-[12px] font-semibold text-[#25313A] transition-colors hover:bg-[#F3F6F8]"
              >
                Login
              </Link>
              <Button
                onClick={onPrimaryCta}
                className="h-10 rounded-full bg-[#0B74DE] px-5 text-[12px] font-semibold text-white shadow-[0_14px_30px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
              >
                {primaryCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE8EE] bg-white text-[#25313A] md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="mt-4 grid gap-1 border-t border-[#E4EDF1] pt-4 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm font-medium text-[#25313A] hover:bg-[#F3F6F8]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-3 py-3 text-sm font-medium text-[#25313A] hover:bg-[#F3F6F8]"
              >
                Login
              </Link>
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPrimaryCta();
                }}
                className="mt-2 h-11 rounded-full bg-[#0B74DE] text-sm font-semibold text-white hover:bg-[#0869C9]"
              >
                {primaryCtaLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function IntegrationsCarousel({ isMobileLayout }: { isMobileLayout: boolean }) {
  return (
    <motion.div {...revealProps}>
      <div className="relative flex items-center justify-center py-1 md:py-2">
        <motion.div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 origin-center bg-gradient-to-r from-transparent via-[#CFE0EA] to-transparent"
          initial={{ scaleX: 0.55, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative z-10 mx-auto inline-flex rounded-full border border-[#DCE8EE] bg-white px-4 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-[#66737F]">
          Evidence sources Margin can organize
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden md:mt-7">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#FAFAF7] to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#FAFAF7] to-transparent md:w-28" />
        <motion.div
          className="flex w-max items-center gap-8 px-2 md:gap-12 md:px-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: isMobileLayout ? 22 : 30, repeat: Infinity, ease: 'linear' }}
        >
          {[...integrationLogos, ...integrationLogos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-12 w-[78px] shrink-0 items-center justify-center rounded-2xl border border-[#E4EDF1] bg-white/82 shadow-[0_12px_28px_rgba(37,49,58,0.04)] md:h-16 md:w-[116px]"
              aria-label={logo.name}
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className={`${logo.className} object-contain`}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { isFull, capacity } = useOnboardingCapacity();

  usePageMeta(SITE_META);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileLayout(mediaQuery.matches);
    sync();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync);
      return () => mediaQuery.removeEventListener('change', sync);
    }

    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);

  const handlePrimaryCta = () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    navigate('/early-access');
  };

  const scrollToDemo = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('margin-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToWorkflow = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('how-margin-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 4 : 5;
  const primaryCtaLabel = isFull ? 'Join Waitlist' : 'Reserve Early Access';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <LightNavbar onPrimaryCta={handlePrimaryCta} primaryCtaLabel={primaryCtaLabel} />

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.12),transparent_28%)]" />

        <section className="relative pt-32 md:pt-44">
          <div className={containerClass}>
            <div className="max-w-[900px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-[760px]"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8EE] bg-white/76 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE] shadow-[0_12px_30px_rgba(37,49,58,0.05)]">
                  Amazon reimbursement recovery
                </div>

                <h1 className="mt-6 max-w-[780px] text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[58px] md:text-[82px]">
                  Recover FBA revenue before claim windows close.
                </h1>

                <p className="mt-6 max-w-[680px] text-[17px] leading-8 text-[#4D5B66] md:text-[20px] md:leading-9">
                  Margin helps Amazon FBA sellers detect missed recovery opportunities, prepare evidence-backed cases, and track claims through payout before short claim windows and transaction noise bury the money. Start read-only. Seller approval before filing. No commissions.
                </p>

                <div className="mt-9 grid w-full max-w-[460px] grid-cols-1 gap-3 min-[430px]:grid-cols-2">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-12 justify-center rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.24)] hover:bg-[#0869C9]"
                  >
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={scrollToDemo}
                    className="h-12 justify-center rounded-full border-[#CFE0EA] bg-white/72 px-6 text-sm font-semibold text-[#25313A] hover:bg-white"
                  >
                    Watch Demo
                  </Button>
                </div>

                {!isFull ? (
                  <div className="mt-3 max-w-[520px] text-sm leading-6 text-[#66737F]">
                    Managed Early Access opens in careful batches before read-only setup begins.
                  </div>
                ) : null}

                <div className="mt-7 flex max-w-[680px] flex-wrap gap-2.5">
                  {trustHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-full border border-[#DCE8EE] bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4D5B66] shadow-[0_8px_22px_rgba(37,49,58,0.04)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  to="/early-access"
                  className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE] transition-colors hover:text-[#0869C9]"
                >
                  Early Access
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {isFull ? (
                  <div className="mt-5 max-w-[420px] rounded-2xl border border-[#DCE8EE] bg-white/82 p-4 text-sm leading-6 text-[#66737F]">
                    <div>We are onboarding a small batch of sellers right now.</div>
                    <div>Next batch opens in {capacity?.nextBatchHours ?? 24} hours.</div>
                  </div>
                ) : null}
              </motion.div>

            </div>
          </div>
        </section>

        <section className="relative mt-16 md:mt-24">
          <div className={containerClass}>
            <div className="grid overflow-hidden rounded-[34px] border border-[#DCE8EE] bg-white shadow-[0_24px_80px_rgba(37,49,58,0.08)] md:grid-cols-4">
              {proofItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.05 }}
                    className={`p-6 md:p-7 ${index > 0 ? 'border-t border-[#E4EDF1] md:border-l md:border-t-0' : ''}`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9F4FF] text-[#0B74DE]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">{item.title}</div>
                    <p className="mt-3 text-[15px] leading-7 text-[#4D5B66]">{item.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[820px]">
              <div className={sectionLabelClass}>Why Now</div>
              <h2 className={sectionHeadingClass}>Amazon recovery work is getting more time-sensitive.</h2>
              <p className={sectionBodyClass}>
                Short claim windows, granular removal and disposal charges, and reconciliation complexity make clean inventory and payout visibility harder to manage manually. Margin keeps recovery issues visible, evidence-backed, and seller-controlled before they disappear into operational noise.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {whyNowItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.05 }}
                  className="rounded-[28px] border border-[#DCE8EE] bg-white p-6 shadow-[0_18px_50px_rgba(37,49,58,0.06)]"
                >
                  <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">{item.title}</div>
                  <p className="mt-4 text-[15px] leading-7 text-[#66737F]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-[#E4EDF1] bg-[#F3F6F8] py-14 md:py-24" id="margin-demo">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto mb-8 max-w-[880px] text-center md:mb-12">
              <div className={sectionLabelClass}>See Demo</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#182026] sm:text-[40px] md:text-[58px]">
                See how Margin turns raw FBA activity into evidence-backed recovery work.
              </h2>
            </motion.div>

            <motion.a
              href={DEMO_VIDEO_URL}
              target="_blank"
              rel="noreferrer"
              {...revealProps}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-transform hover:-translate-y-1 md:rounded-[44px]"
              aria-label="Watch the Margin product demo on YouTube"
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
                    <PlayCircle className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.7} />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 md:text-[11px]">Product walkthrough</div>
                  <div className="mt-2 max-w-[780px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[36px]">
                    Watch how Margin finds, prepares, and tracks FBA recovery cases.
                  </div>
                </div>
              </div>
            </motion.a>
          </div>
        </section>

        <section className="relative py-16 md:py-28" id="how-margin-works">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>How Margin Works</div>
              <h2 className={sectionHeadingClass}>Read-only. Evidence. Approval. Payout visibility.</h2>
              <p className={sectionBodyClass}>
                Margin turns Amazon reimbursement work into a controlled sequence, so sellers can see what is supportable before anything moves.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              {workflowSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="rounded-[28px] border border-[#DCE8EE] bg-white p-6 shadow-[0_18px_50px_rgba(37,49,58,0.05)]"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.step}</div>
                  <h3 className="mt-5 text-xl font-semibold leading-tight tracking-[-0.025em] text-[#182026]">{item.title}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-[#66737F]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-[#E4EDF1] bg-white py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Coverage Examples</div>
              <h2 className={sectionHeadingClass}>Recovery categories Margin reviews.</h2>
              <p className={sectionBodyClass}>
                These are representative recovery categories, not the limit of the system. Each one stays tied to what broke, what evidence exists, and whether the case is supportable.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[34px] border border-[#DCE8EE] bg-[#FBFCFA] shadow-[0_24px_80px_rgba(37,49,58,0.07)]">
              {coverageExamples.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-4 px-5 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-9 md:px-8 md:py-8 ${
                    index > 0 ? 'border-t border-[#E4EDF1]' : ''
                  }`}
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <div className="max-w-[760px]">
                    <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-[#182026] md:text-[32px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                      {item.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Trust & Control</div>
                <h2 className={sectionHeadingClass}>Built to make sellers feel in control.</h2>
                <p className={sectionBodyClass}>
                  Margin does not need to feel mysterious to be powerful. The workflow is designed around read-only visibility, evidence quality, seller approval, and transparent case states.
                </p>
              </motion.div>

              <div className="overflow-hidden rounded-[32px] border border-[#DCE8EE] bg-white shadow-[0_24px_70px_rgba(37,49,58,0.07)]">
                {trustControls.map((item, index) => (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.05 }}
                    className={`grid gap-4 px-6 py-7 sm:grid-cols-[54px_minmax(0,1fr)] md:px-8 md:py-8 ${
                      index > 0 ? 'border-t border-[#E4EDF1]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:block">
                      <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9AA8B2]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="mt-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#2E7D5B] sm:mt-4">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[19px] font-semibold tracking-[-0.025em] text-[#182026] md:text-[22px]">{item.title}</h3>
                      <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-[#66737F] md:text-[16px] md:leading-8">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-[#E4EDF1] bg-[#F3F6F8] py-12 md:py-18">
          <div className={containerClass}>
            <div className="max-w-[680px] md:mx-auto md:text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">Connect Amazon plus the inboxes and files where reimbursement proof already lives</div>
            </div>
            <div className="mt-7 md:mt-9">
              <IntegrationsCarousel isMobileLayout={isMobileLayout} />
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-8 rounded-[38px] border border-[#CFE0EA] bg-white p-6 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:p-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Managed Early Access</div>
                <h2 className="mt-4 max-w-[760px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[62px]">
                  Join the Founding 100 recovery cohort.
                </h2>
                <p className={sectionBodyClass}>
                  Reserve your place for $99, move through guided setup, and begin a founder-led first recovery cycle. Workspaces are prepared before onboarding, so Early Access stays controlled and useful.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                  >
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={scrollToDemo}
                    className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] hover:bg-[#F8FAFC]"
                  >
                    Watch Demo
                  </Button>
                </div>
              </motion.div>

              <motion.div {...revealProps} className="grid gap-3">
                {earlyAccessItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E4EDF1] bg-[#FBFCFA] px-4 py-4 text-[#25313A]">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D5B]" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-white py-14 md:py-24">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <h2 className="text-[34px] font-medium leading-tight tracking-[-0.045em] text-[#050607] sm:text-[42px] md:text-[46px]">
                Frequently asked questions
              </h2>
            </motion.div>

            <div className="mt-10 md:mt-14">
              <Accordion type="single" collapsible className="w-full border-t border-[#DADFE3]">
                {faqs.slice(0, visibleFaqCount).map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-b border-[#DADFE3] px-0">
                    <AccordionTrigger className="py-6 text-left text-[19px] font-semibold tracking-[-0.035em] text-[#050607] hover:no-underline md:py-7 md:text-[24px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#6C737A]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-[860px] pb-7 pr-10 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {!showMoreFaqs ? (
                <div className="mt-9 flex justify-start md:mt-11">
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreFaqs(true)}
                    className="rounded-full border-[#DADFE3] bg-white px-6 text-sm font-semibold text-[#050607] hover:bg-[#F8FAFC]"
                  >
                    Show more questions
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[38px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] p-7 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:p-12"
            >
              <div className="max-w-[880px]">
                <div className={sectionLabelClass}>Start With Clarity</div>
                <h2 className="mt-4 max-w-[860px] text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[42px] md:text-[68px]">
                  Start with managed Early Access.
                </h2>
                <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                  Reserve your spot, move through guided setup, and let Margin show which recovery issues have real evidence before anything gets filed.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Button
                  onClick={handlePrimaryCta}
                  className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  {primaryCtaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={scrollToWorkflow}
                  className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] hover:bg-[#F8FAFC]"
                >
                  Review Workflow
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
