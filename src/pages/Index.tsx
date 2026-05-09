import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BarChart3,
  BoxSelect,
  Briefcase,
  Check,
  FileText,
  Layers,
  Menu,
  PlayCircle,
  Search,
  ShieldCheck,
  TrendingUp,
  Truck
} from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const DEMO_VIDEO_URL = 'https://youtu.be/NFDzqcaAFHM';
const DEMO_VIDEO_THUMBNAIL_URL = '/DEMO34.png';

const navLinks = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Research', to: '/research' },
  { label: 'About', to: '/about-margin' },
  { label: 'Enterprise', to: '/sales' }
];

const mobileProductSections = [
  {
    label: 'Recovery Coverage',
    items: [
      { icon: Search, title: 'Inbound Shipments', description: 'Short receives and receiving drift' },
      { icon: ShieldCheck, title: 'Lost or Damaged Inventory', description: 'Recovery across FBA states' },
      { icon: BoxSelect, title: 'Fee Discrepancies', description: 'Overcharges, reversals, and gaps' },
      { icon: ArrowLeft, title: 'Refund Without Return', description: 'Refunds not matched to real return outcome' },
      { icon: Truck, title: 'Transfer & Operations', description: 'Inter-fulfillment discrepancies' },
      { icon: BarChart3, title: 'Recovery Workflow', description: 'Valid cases, evidence, filing, payout', highlight: true }
    ]
  },
  {
    label: 'Evidence & Control',
    items: [
      { icon: Layers, title: 'Evidence Matching', description: 'Connect support to the right case' },
      { icon: Briefcase, title: 'Filing Readiness', description: 'Hold weak or duplicate issues back' },
      { icon: BadgePercent, title: 'Recovery Tracking', description: 'Approval and payout visibility' },
      { icon: FileText, title: 'Connected Sources', description: 'Email, storage, and uploaded proof' }
    ]
  },
  {
    label: 'By Seller Type',
    items: [
      { icon: Activity, title: 'Emerging Sellers', description: 'Read-only audit and guided recovery' },
      { icon: TrendingUp, title: 'Growth Sellers', description: 'Ongoing recovery coverage at scale' },
      { icon: Layers, title: 'Enterprise Teams', description: 'Multi-workspace recovery operations' }
    ]
  }
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
    detail: 'Some FBA reimbursement windows can be short, including 60-day windows for key lost or damaged inventory scenarios. Margin keeps deadline-sensitive issues visible before they age out.'
  },
  {
    title: 'Granular transaction noise',
    detail: 'Removal fees, disposal charges, reversals, reimbursements, refunds, and payouts can split into smaller events that are hard to reconcile manually.'
  },
  {
    title: 'Quarterly audits are too late',
    detail: 'If recovery work waits for a quarterly review, eligible issues can expire before anyone has prepared the evidence.'
  }
];

const proofItems = [
  {
    title: 'Claim clock visibility',
    detail: 'Every recovery issue stays tied to the deadline that matters, so eligible cases do not disappear quietly.'
  },
  {
    title: 'Evidence before action',
    detail: 'Margin links records, reports, invoices, and support files before a recovery case moves forward.'
  },
  {
    title: 'Read-only first',
    detail: 'Start with visibility and audit confidence before any account-changing action is considered.'
  },
  {
    title: 'Payout trail',
    detail: 'Track detected, prepared, filed, approved, blocked, and paid states without mixing them together.'
  }
];

const velocityMetrics = [
  {
    label: 'Event-to-Evidence Speed',
    value: '3min',
    detail: 'From Amazon loss signal to matched support trail.'
  },
  {
    label: 'Review-to-Filing Speed',
    value: '1min',
    detail: 'Prepared cases move from seller review to filing action.'
  },
  {
    label: 'Signal Discovery',
    value: '16s',
    detail: 'Recoverable events surface before manual review begins.',
    featured: true
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Read-only setup',
    detail: 'Connect Amazon and evidence sources in visibility-first mode, so Margin can begin identifying recovery signals without changing your account.'
  },
  {
    step: '02',
    title: 'Detect signals and start the clock',
    detail: 'Margin identifies reimbursement-worthy FBA events, assigns the claim type, and keeps the deadline visible before the window closes.'
  },
  {
    step: '03',
    title: 'Match required evidence',
    detail: 'Margin links invoices, shipment records, sourcing costs, Amazon reports, support files, and reference IDs into a recovery-ready trail.'
  },
  {
    step: '04',
    title: 'Hold weak cases',
    detail: 'Unsupported, duplicate, thread-only, or risky findings are held back instead of being pushed into reckless filing.'
  },
  {
    step: '05',
    title: 'Review, file, and track',
    detail: 'Seller-approved cases move into filing action, while approved, blocked, awaiting payout, paid, or re-evaluation states remain visible.'
  }
];

const coverageExamples = [
  {
    label: 'Lost or damaged inventory',
    title: 'Inventory events stay tied to claim windows and support trails.',
    detail: 'Margin connects the inventory event, claim type, evidence checklist, and recovery state from detection through resolution.'
  },
  {
    label: 'Inbound shipment shortages',
    title: 'Received units fall short against the shipment plan.',
    detail: 'Shipment records, received quantities, reference IDs, and supporting documents stay visible before the issue gets buried in operations.'
  },
  {
    label: 'Refund without return',
    title: 'A customer refund does not prove the unit came back.',
    detail: 'Margin separates refund activity from actual return, inventory, and reimbursement resolution before a case is treated as evidence-supported.'
  },
  {
    label: 'Fees and removals',
    title: 'Small operational charges can drift quietly.',
    detail: 'Removal fees, disposal charges, reversals, reimbursements, and related inventory movement stay tied to recovery context.'
  },
  {
    label: 'Payout reconciliation',
    title: 'Approval and cash movement are not the same event.',
    detail: 'Margin keeps approved, awaiting payout, recovered, blocked, and re-evaluation states separate so outcomes stay clear.'
  }
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

const trustControls = [
  {
    title: 'Read-only first',
    detail: 'Margin begins with visibility-first Amazon connection flows, so sellers can review recovery opportunities before any account-changing action is considered.'
  },
  {
    title: 'No filing without approval',
    detail: 'Evidence-supported cases are reviewed with the seller before moving into a filing workflow, unless the seller later chooses a trusted filing mode.'
  },
  {
    title: 'Weak cases held back',
    detail: 'Duplicate, unsupported, thread-only, expired, or low-confidence findings are blocked instead of being pushed into risky filing volume.'
  },
  {
    title: 'No outcome guarantees',
    detail: 'Margin prepares, organizes, and tracks recovery work. Amazon makes the final reimbursement decision.'
  }
];

const earlyAccessItems = [
  'Founding 100 managed cohort',
  '$99 early-access reservation',
  'Workspace prepared before onboarding',
  'Founder-led first recovery cycle',
  'Read-only setup before filing',
  'No commissions during Early Access'
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin starts in read-only mode. It reviews FBA activity for reimbursement-worthy events, identifies the claim type, tracks the claim window, matches supporting evidence, and prepares recovery cases for seller review.'
  },
  {
    question: 'Does Margin guarantee reimbursements?',
    answer: 'No. Margin prepares and tracks evidence-backed recovery work, but Amazon makes the final reimbursement decision. Margin is designed to improve visibility, timing, evidence quality, and workflow control, not to guarantee outcomes.'
  },
  {
    question: 'Can Margin change my Amazon account?',
    answer: 'Margin starts read-only. Filing or account-changing actions require seller approval unless the seller later chooses a trusted filing mode. The workflow is built to keep sellers in control.'
  },
  {
    question: 'Why does recovery timing matter more now?',
    answer: 'Some recovery windows are short, and manual or quarterly audits can surface issues too late. Margin keeps each recovery issue tied to its claim clock, required evidence, and next action before the window closes.'
  },
  {
    question: 'Does Margin file every issue it finds?',
    answer: 'No. Margin holds back weak, duplicate, unsupported, expired, or low-confidence findings. The system is designed to move evidence-supported cases forward and block risky ones.'
  },
  {
    question: 'How is this different from commission-based services?',
    answer: 'Margin is built around claim-clock visibility, evidence-backed case preparation, seller approval before filing, and no recovery commissions. The seller keeps control of which evidence-supported cases move forward.'
  },
  {
    question: 'Why no commissions?',
    answer: 'Margin Early Access is designed so sellers can validate the recovery workflow without giving up a percentage of every approved reimbursement. The goal is clear recovery visibility, evidence-backed action, and seller control from the first cycle.'
  },
  {
    question: 'What happens after I reserve Early Access?',
    answer: 'Your reservation joins the managed Founding 100 cohort. Margin prepares the workspace carefully, sends onboarding updates, and begins the guided first recovery cycle after setup is ready.'
  }
];

const integrationLogos = [
  { name: 'Amazon', src: '/Amazon-logo.png', className: 'h-4 w-auto md:h-5' },
  { name: 'Gmail', src: '/gmailicon.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Outlook', src: '/outlookicon.webp', className: 'h-5 w-auto md:h-6' },
  { name: 'Google Drive', src: '/gd.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Dropbox', src: '/Dropbox_Icon.svg.png', className: 'h-5 w-auto md:h-6' },
  { name: 'OneDrive', src: '/onedriive.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Adobe Sign', src: '/dobe.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Slack', src: '/slack-icon-2019.png', className: 'h-5 w-auto md:h-6' }
];

const containerClass = 'mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8';
const sectionLabelClass = 'text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]';
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

  useEffect(() => {
    document.documentElement.classList.add('public-light-scrollbar');
    return () => {
      document.documentElement.classList.remove('public-light-scrollbar');
    };
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
              <div className="hidden lg:block">
                <ProductsMegaMenu variant="light" />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-tight text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
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
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="products" className="border-none">
                  <AccordionTrigger className="rounded-2xl px-3 py-3 text-sm font-medium text-[#25313A] hover:bg-[#F3F6F8] hover:no-underline [&>svg]:h-4 [&>svg]:w-4">
                    Products
                  </AccordionTrigger>
                  <AccordionContent className="px-1 pb-4 pt-2">
                    <div className="grid gap-5">
                      {mobileProductSections.map((section) => (
                        <div key={section.label} className="grid gap-2">
                          <div className="px-2 text-[10px] font-semibold uppercase tracking-tight text-[#7A8994]">{section.label}</div>
                          <div className="grid gap-1">
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div
                                  key={item.title}
                                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                                    item.highlight
                                      ? 'border-[#BFD8EA] bg-[#EAF4FF]'
                                      : 'border-transparent bg-transparent hover:border-[#DCE8EE] hover:bg-[#F8FAFC]'
                                  }`}
                                >
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                      item.highlight
                                        ? 'border-[#BFD8EA] bg-white text-[#0B74DE]'
                                        : 'border-[#DCE8EE] bg-[#EEF4F6] text-[#0B74DE]'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`truncate text-[13px] font-semibold ${item.highlight ? 'text-[#0B74DE]' : 'text-[#182026]'}`}>
                                      {item.title}
                                    </div>
                                    <div className="mt-1 truncate text-[11px] leading-none text-[#66737F]">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
        <div className="relative z-10 mx-auto inline-flex rounded-full border border-[#DCE8EE] bg-white px-4 py-1.5 text-[11px] font-semibold tracking-tight text-[#66737F]">
          Recovery proof sources Margin can organize
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
  const primaryCtaLabel = 'Start Recovery Audit';

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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE8EE] bg-white/76 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE] shadow-[0_12px_30px_rgba(37,49,58,0.05)]">
                  Deadline-aware recovery automation for Amazon sellers
                </div>

                <h1 className="mt-6 max-w-[780px] text-[46px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[58px] md:text-[82px]">
                  Turn Amazon loss events into claim-ready recoveries before time runs out.
                </h1>

                <p className="mt-6 max-w-[680px] text-[17px] leading-8 text-[#4D5B66] md:text-[20px] md:leading-9">
                  Margin detects reimbursement-worthy FBA events, starts the claim clock, matches the required evidence, and prepares recovery cases before Amazon's reimbursement windows close. Start read-only. Approve before filing. Keep recoveries without commissions.
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
                    Watch 60-Second Demo
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
                      className="rounded-full border border-[#DCE8EE] bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-tight text-[#4D5B66] shadow-[0_8px_22px_rgba(37,49,58,0.04)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <Link
                  to="/early-access"
                  className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE] transition-colors hover:text-[#0869C9]"
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

        <section className="relative mt-12 md:mt-16">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="relative py-8 md:py-12"
            >
              <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 overflow-hidden bg-[#D8E3E8] md:block">
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/4 bg-[linear-gradient(90deg,transparent,rgba(11,116,222,0.48),transparent)]"
                  animate={{ x: ['-120%', '460%'] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="grid gap-12 md:grid-cols-3 md:gap-0">
                {velocityMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.72, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative md:px-10 ${index > 0 ? 'md:border-l md:border-[#D8E3E8]' : ''}`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                      {metric.label}
                    </div>
                    <div
                      className={`mt-4 font-semibold leading-none tracking-[-0.075em] ${
                        metric.featured ? 'text-[78px] text-[#0B74DE] md:text-[104px]' : 'text-[70px] text-[#182026] md:text-[94px]'
                      }`}
                    >
                      {metric.value}
                    </div>
                    <p className="mt-5 max-w-[300px] text-[14px] leading-6 text-[#66737F]">
                      {metric.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-14 md:mt-22">
          <div className={containerClass}>
            <div className="grid border-y border-[#D8E3E8] md:grid-cols-4">
              {proofItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.05 }}
                  className={`py-7 md:px-7 md:py-9 ${
                    index > 0 ? 'border-t border-[#D8E3E8] md:border-l md:border-t-0' : ''
                  }`}
                >
                  <div className="text-[12px] font-semibold uppercase tracking-tight text-[#9AA8B2]">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="mt-4 text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]">{item.title}</div>
                  <p className="mt-3 max-w-[250px] text-[15px] leading-7 text-[#4D5B66]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[820px]">
              <div className={sectionLabelClass}>Why Now</div>
              <h2 className={sectionHeadingClass}>Amazon does not just create reimbursement issues. It starts a clock.</h2>
              <p className={sectionBodyClass}>
                Lost inventory, damaged units, inbound shortages, return gaps, fee events, and reimbursement reversals can expire before sellers have proof ready. Margin keeps deadline-aware recovery work visible, evidence-backed, and seller-controlled before claim windows close.
              </p>
              <Button
                variant="outline"
                onClick={scrollToWorkflow}
                className="mt-7 h-11 rounded-full border-[#CFE0EA] bg-white/72 px-5 text-sm font-semibold text-[#25313A] hover:bg-white"
              >
                See the Recovery Flow
              </Button>
            </motion.div>

            <div className="relative mt-10 md:mt-14">
              <motion.div
                className="pointer-events-none absolute left-0 right-0 top-10 z-0 hidden h-px bg-[linear-gradient(90deg,transparent_0%,rgba(11,116,222,0.08)_16%,rgba(11,116,222,0.42)_48%,rgba(46,125,91,0.16)_76%,transparent_100%)] opacity-70 md:block"
                style={{ backgroundSize: '240% 100%' }}
                animate={{ backgroundPosition: ['0% 50%', '240% 50%'] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10 grid gap-9 md:grid-cols-3 md:gap-10">
                {whyNowItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    whileHover={{ x: 5 }}
                    transition={{ ...revealProps.transition, delay: index * 0.08 }}
                    className="group relative min-h-[210px] py-4 outline-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
                    tabIndex={0}
                  >
                    <div className="pointer-events-none absolute -left-6 top-7 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(11,116,222,0.13),transparent_68%)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    <div className="relative">
                      <div className="text-[11px] font-semibold uppercase tracking-tight text-[#9AA8B2] transition duration-500 group-hover:text-[#0B74DE] group-hover:[text-shadow:0_0_22px_rgba(11,116,222,0.28)] group-focus-visible:text-[#0B74DE]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <h3 className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.035em] text-[#182026] transition duration-500 group-hover:translate-x-[5px] group-hover:text-[#0B74DE] group-hover:[text-shadow:0_0_24px_rgba(11,116,222,0.18)] group-focus-visible:text-[#0B74DE] md:text-[28px]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-[15px] leading-7 text-[#66737F]/70 transition duration-500 group-hover:translate-x-[5px] group-hover:text-[#4D5B66] group-hover:opacity-100 group-focus-visible:text-[#4D5B66] md:text-[16px] md:leading-8">
                        {item.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-y border-[#E4EDF1] bg-[#F3F6F8] py-14 md:py-24" id="margin-demo">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto mb-8 max-w-[880px] text-center md:mb-12">
              <div className={sectionLabelClass}>See Demo</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#182026] sm:text-[40px] md:text-[58px]">
                See how Margin turns raw FBA activity into claim-ready recovery work.
              </h2>
              <p className="mx-auto mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[18px] md:leading-9">
                Watch the flow from Amazon event detection to claim clock, evidence matching, seller approval, filing action, and payout tracking.
              </p>
            </motion.div>

            <motion.a
              href={DEMO_VIDEO_URL}
              target="_blank"
              rel="noreferrer"
              {...revealProps}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[2px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-transform hover:-translate-y-1"
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
                  <div className="text-[10px] font-semibold uppercase tracking-tight text-white/78 md:text-[11px]">Event-to-recovery walkthrough</div>
                  <div className="mt-2 max-w-[780px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[36px]">
                    See how Margin finds, prepares, and tracks deadline-aware FBA recovery cases.
                  </div>
                </div>
              </div>
            </motion.a>
          </div>
        </section>

        <section className="relative border-b border-[#E4EDF1] bg-[#F3F6F8] py-12 md:py-18">
          <div className={containerClass}>
            <div className="max-w-[680px] md:mx-auto md:text-center">
              <div className={sectionLabelClass}>Evidence Sources</div>
              <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[#182026] md:text-[42px]">
                Connect the places where recovery proof already lives.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Margin organizes Amazon activity, inbox records, files, shipment documents, invoices, and support trails into deadline-aware recovery work.
              </p>
            </div>
            <div className="mt-7 md:mt-9">
              <IntegrationsCarousel isMobileLayout={isMobileLayout} />
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-28" id="how-margin-works">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>How Margin Works</div>
              <h2 className={sectionHeadingClass}>From Amazon event to claim-ready recovery.</h2>
              <p className="mt-5 max-w-[760px] text-[20px] font-semibold leading-8 tracking-[-0.025em] text-[#25313A] md:text-[26px] md:leading-9">
                Every recovery gets a deadline, an evidence checklist, a readiness state, and a payout trail.
              </p>
              <p className={sectionBodyClass}>
                Margin turns reimbursement work into a controlled sequence, so sellers can see what is evidence-supported before anything moves forward.
              </p>
            </motion.div>

            <div className="relative mt-10 md:mt-12">
              <div className="relative z-10 grid gap-3 border-y border-[#D8E3E8] bg-white/36 lg:grid-cols-5 lg:gap-0">
                {workflowSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    {...revealProps}
                    whileHover={{ y: -3 }}
                    transition={{ ...revealProps.transition, delay: index * 0.08 }}
                    tabIndex={0}
                    className={`group relative min-h-[188px] overflow-hidden bg-white/40 px-5 py-6 outline-none transition-[background-color,box-shadow] duration-500 hover:bg-white/92 hover:shadow-[0_18px_48px_rgba(11,116,222,0.09)] focus-visible:bg-white/92 focus-visible:ring-2 focus-visible:ring-[#0B74DE]/25 md:px-6 lg:min-h-[176px] ${
                      index > 0 ? 'border-t border-[#D8E3E8] lg:border-l lg:border-t-0' : ''
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,116,222,0.06),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#BFD8EA] bg-white text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_10px_24px_rgba(37,49,58,0.06)] transition duration-500 group-hover:border-[#0B74DE] group-hover:bg-[#0B74DE] group-hover:text-white group-focus:border-[#0B74DE] group-focus:bg-[#0B74DE] group-focus:text-white">
                        {item.step}
                      </div>
                      <h3 className="mt-7 text-[18px] font-semibold leading-tight tracking-[-0.025em] text-[#182026] md:text-[20px]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-7 text-[#66737F] transition-all duration-500 lg:max-h-0 lg:translate-y-2 lg:overflow-hidden lg:opacity-0 lg:group-hover:max-h-40 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus:max-h-40 lg:group-focus:translate-y-0 lg:group-focus:opacity-100">
                        {item.detail}
                      </p>
                      <div className="mt-auto hidden pt-5 text-[10px] font-semibold uppercase tracking-tight text-[#9AA8B2] transition-colors duration-500 group-hover:text-[#0B74DE] group-focus:text-[#0B74DE] lg:block">
                        View workflow note
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white py-16 md:py-28">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(11,116,222,0.07),transparent_68%)] blur-3xl md:block"
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Coverage Examples</div>
              <h2 className={sectionHeadingClass}>Recovery categories Margin reviews.</h2>
              <p className={sectionBodyClass}>
                These are representative recovery categories, not the limit of the system. Each case stays tied to what happened, what deadline applies, what evidence exists, and whether the recovery is evidence-supported.
              </p>
            </motion.div>

            <div className="relative mt-11 grid gap-x-14 gap-y-10 md:mt-14 md:grid-cols-2 lg:gap-y-14">
              {coverageExamples.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  whileHover={{ x: 5 }}
                  transition={{ ...revealProps.transition, delay: index * 0.07 }}
                  tabIndex={0}
                  className={`group relative grid gap-4 py-3 outline-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${
                    index === 0 ? 'md:col-span-2 md:grid-cols-[270px_minmax(0,1fr)] md:gap-12' : ''
                  }`}
                >
                  <div className="pointer-events-none absolute -left-8 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(46,125,91,0.12),transparent_68%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <div className="relative text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE] transition duration-500 group-hover:translate-x-[5px] group-hover:[text-shadow:0_0_22px_rgba(11,116,222,0.24)]">
                    {item.label}
                  </div>
                  <div className="relative max-w-[760px]">
                    <h3 className="text-[25px] font-semibold leading-tight tracking-[-0.035em] text-[#182026] transition duration-500 group-hover:translate-x-[5px] group-hover:text-[#0B74DE] group-focus-visible:text-[#0B74DE] md:text-[34px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-[#66737F]/70 transition duration-500 group-hover:translate-x-[5px] group-hover:text-[#4D5B66] group-hover:opacity-100 group-focus-visible:text-[#4D5B66] md:text-[17px] md:leading-8">
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
                <h2 className={sectionHeadingClass}>Autonomous where it saves time. Controlled where it protects your account.</h2>
                <p className={sectionBodyClass}>
                  Margin does not need to feel mysterious to be powerful. The workflow is built around read-only visibility, evidence quality, seller approval, weak-case blocking, and transparent recovery states.
                </p>
              </motion.div>

              <div className="w-full">
                {trustControls.map((item, index) => (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.05 }}
                    className={`grid gap-4 py-7 sm:grid-cols-[54px_minmax(0,1fr)] md:py-8 ${
                      index > 0 ? 'border-t border-[#D8E3E8]' : ''
                    }`}
                  >
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-tight text-[#9AA8B2]">
                        {String(index + 1).padStart(2, '0')}
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

        <section className="relative py-16 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <motion.div {...revealProps} className="max-w-[560px]">
                <div className={sectionLabelClass}>Marketplace Reach</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  Marketplace coverage for serious Amazon operators.
                </h2>
                <p className={sectionBodyClass}>
                  Margin is built around the marketplaces where FBA sellers already operate. Coverage is activated through managed onboarding, read-only setup, and claim-type-aware recovery workflows.
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
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">
                        {marketplace.region} · {marketplace.code}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 md:py-28">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-24 hidden h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(11,116,222,0.1)_20%,rgba(46,125,91,0.26)_50%,rgba(11,116,222,0.1)_80%,transparent_100%)] md:block"
            style={{ backgroundSize: '220% 100%' }}
            animate={{ backgroundPosition: ['0% 50%', '220% 50%'] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
          />
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Managed Early Access</div>
                <h2 className="mt-4 max-w-[760px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[62px]">
                  Join the Founding 100 before your next recovery window closes.
                </h2>
                <p className={sectionBodyClass}>
                  Reserve your place for $99, move through guided setup, and begin a founder-led first recovery cycle. Margin prepares your workspace, connects read-only data, and shows which Amazon loss events are claim-ready, blocked, or still missing evidence.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                  >
                    Reserve Founding Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={scrollToDemo}
                    className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] hover:bg-[#F8FAFC]"
                  >
                    Watch 60-Second Demo
                  </Button>
                </div>
              </motion.div>

              <motion.div {...revealProps} className="grid gap-1">
                {earlyAccessItems.map((item, index) => (
                  <div
                    key={item}
                    className="group relative flex items-center gap-4 py-4 text-[#25313A] outline-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:translate-x-[5px]"
                    tabIndex={0}
                  >
                    <span className="absolute -left-5 h-12 w-12 rounded-full bg-[radial-gradient(circle,rgba(46,125,91,0.13),transparent_68%)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    <Check className="relative mt-0.5 h-4 w-4 shrink-0 text-[#2E7D5B]" />
                    <span className="relative text-[15px] font-semibold leading-6 tracking-[-0.015em] transition duration-500 group-hover:text-[#182026] group-focus-visible:text-[#182026]">
                      {item}
                    </span>
                    <span className="ml-auto hidden text-[11px] font-semibold uppercase tracking-tight text-[#9AA8B2]/70 transition duration-500 group-hover:text-[#0B74DE] sm:inline">
                      {String(index + 1).padStart(2, '0')}
                    </span>
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
                  Find the recoveries already on the clock.
                </h2>
                <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                  Start with managed Early Access. Margin will help you identify Amazon loss events, match the required evidence, and see which recovery cases are ready, blocked, or waiting before anything gets filed.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Button
                  onClick={handlePrimaryCta}
                  className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  Reserve Founding Access
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
