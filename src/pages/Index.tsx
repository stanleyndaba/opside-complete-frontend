import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
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
import { DemoVideoModal } from '@/components/demo/DemoVideoModal';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { InhaleSection } from '@/components/landing/InhaleSection';
import { ProductsMegaMenu } from '@/components/landing/ProductsMegaMenu';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const DEMO_VIDEO_URL = 'https://youtu.be/B0ksWTlYbRo';
const DEMO_VIDEO_THUMBNAIL_URL = '/Gen-4 Turbo - Minimal cinematic logo reveal, modern SaaS motion, soft glow, structured lines forming.gif';

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

const auditPulses = [
  { x: 8, y: 18, size: 9, color: 'bg-blue-400', delay: 0.1, duration: 3.6 },
  { x: 18, y: 54, size: 7, color: 'bg-emerald-400', delay: 1.4, duration: 4.2 },
  { x: 27, y: 30, size: 6, color: 'bg-blue-300', delay: 2.2, duration: 3.8 },
  { x: 39, y: 68, size: 8, color: 'bg-emerald-300', delay: 0.8, duration: 4.5 },
  { x: 48, y: 22, size: 7, color: 'bg-blue-400', delay: 3.0, duration: 4.1 },
  { x: 59, y: 47, size: 10, color: 'bg-emerald-400', delay: 1.1, duration: 3.9 },
  { x: 68, y: 74, size: 6, color: 'bg-blue-300', delay: 2.8, duration: 4.6 },
  { x: 76, y: 28, size: 8, color: 'bg-emerald-300', delay: 0.4, duration: 3.7 },
  { x: 84, y: 58, size: 7, color: 'bg-blue-400', delay: 2.0, duration: 4.3 },
  { x: 92, y: 36, size: 6, color: 'bg-emerald-400', delay: 3.4, duration: 4.0 },
  { x: 33, y: 84, size: 7, color: 'bg-blue-300', delay: 1.8, duration: 3.9 }
];

const auditLines = [
  { left: 10, top: 22, width: 28, rotate: 18, delay: 0.4 },
  { left: 25, top: 54, width: 36, rotate: -10, delay: 1.6 },
  { left: 48, top: 32, width: 31, rotate: 14, delay: 2.7 },
  { left: 59, top: 66, width: 29, rotate: -20, delay: 3.4 },
  { left: 15, top: 76, width: 48, rotate: 7, delay: 4.3 }
];

const whyNowItems = [
  {
    title: 'Time-bound recovery data',
    detail: 'Amazon recovery data is time-bound and distributed across systems that update independently. When claim windows expire, the associated loss becomes structurally unrecoverable regardless of later detection.'
  },
  {
    title: 'Fragmented evidence',
    detail: 'Required evidence is fragmented across invoices, shipment logs, and support records, which degrade in accessibility over time and reduce successful claim rates in delayed workflows.'
  },
  {
    title: 'Compounding backlog',
    detail: 'Continuous transaction-level noise causes delays to compound, turning recovery into backlog rather than resolution.'
  }
];

const proofItems = [
  {
    title: 'Claim Clock Visibility',
    detail: 'Every event is assigned a deadline state that governs eligibility until resolution or expiry.'
  },
  {
    title: 'Evidence Binding',
    detail: 'Reports, invoices, and shipment data are linked before any case can advance.'
  },
  {
    title: 'Read-only First Mode',
    detail: 'All recovery signals are structured without enabling actions until approval is granted.'
  },
  {
    title: 'Payout Trail Tracking',
    detail: 'Each case is tracked across detected → filed → approved → paid or blocked states without merging outcomes.'
  }
];

const velocityMetrics = [
  {
    label: 'Audit-to-Evidence Speed',
    value: 3,
    suffix: 'min',
    detail: 'Event is classified, matched to supporting records, and validated for claim readiness.'
  },
  {
    label: 'Filing Preparation Cycle',
    value: 1,
    suffix: 'min',
    detail: 'Evidence-complete cases pass approval and move directly into submission queue.'
  },
  {
    label: 'Detection Latency',
    value: 16,
    suffix: 's',
    detail: 'Incoming Amazon activity is parsed and mapped to potential recovery cases in real time.'
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Detect',
    detail: 'Amazon events are captured and converted into structured signals.'
  },
  {
    step: '02',
    title: 'Classify',
    detail: 'Signals are mapped to recovery types and claim rules.'
  },
  {
    step: '03',
    title: 'Bind Evidence',
    detail: 'Supporting records are attached and validated.'
  },
  {
    step: '04',
    title: 'Approve',
    detail: 'Seller review gates progression into filing.'
  },
  {
    step: '05',
    title: 'Track Outcome',
    detail: 'Filed cases move through Amazon response to payout or rejection.'
  }
];

const coverageExamples = [
  {
    label: 'Lost units detected',
    title: 'Shipment mismatch → claim clock activated',
    detail: 'Lost units are converted from inventory variance into a timed recovery case.'
  },
  {
    label: 'Inbound shortage',
    title: 'Received quantity variance → evidence required before eligibility',
    detail: 'Inbound discrepancies are held until shipment data and supporting records validate eligibility.'
  },
  {
    label: 'Refund without return',
    title: 'Refund event unmatched to return scan → held for validation',
    detail: 'Refund activity is separated from return proof before a case advances.'
  },
  {
    label: 'Fee drift',
    title: 'Measurement or fee adjustment detected → recalculation required',
    detail: 'Fee changes are mapped to the records required before recovery execution.'
  },
  {
    label: 'Payout mismatch',
    title: 'Approved value differs from received payout → reconciliation state triggered',
    detail: 'Approval and cash movement stay separated until payout state is resolved.'
  }
];

const marketplaceCountries = [
  { country: 'United States', code: 'US', flagCode: 'us', region: 'Americas' },
  { country: 'Canada', code: 'CA', flagCode: 'ca', region: 'Americas' },
  { country: 'Mexico', code: 'MX', flagCode: 'mx', region: 'Americas' },
  { country: 'Germany', code: 'DE', flagCode: 'de', region: 'Europe' },
  { country: 'Netherlands', code: 'NL', flagCode: 'nl', region: 'Europe' },
  { country: 'United Kingdom', code: 'UK', flagCode: 'gb', region: 'Europe' },
  { country: 'South Africa', code: 'ZA', flagCode: 'za', region: 'Europe' },
  { country: 'France', code: 'FR', flagCode: 'fr', region: 'Europe' },
  { country: 'Spain', code: 'ES', flagCode: 'es', region: 'Europe' },
  { country: 'Poland', code: 'PL', flagCode: 'pl', region: 'Europe' },
  { country: 'Italy', code: 'IT', flagCode: 'it', region: 'Europe' },
  { country: 'Saudi Arabia', code: 'SA', flagCode: 'sa', region: 'Middle East' },
  { country: 'Egypt', code: 'EG', flagCode: 'eg', region: 'Middle East' },
  { country: 'Japan', code: 'JP', flagCode: 'jp', region: 'Asia Pacific' },
  { country: 'China', code: 'CN', flagCode: 'cn', region: 'Asia Pacific' },
  { country: 'Singapore', code: 'SG', flagCode: 'sg', region: 'Asia Pacific' },
  { country: 'Australia', code: 'AU', flagCode: 'au', region: 'Asia Pacific' },
  { country: 'India', code: 'IN', flagCode: 'in', region: 'Asia Pacific' }
];

const marketplaceNodePositions: Record<string, { x: number; y: number }> = {
  US: { x: 16, y: 24 },
  CA: { x: 35, y: 12 },
  MX: { x: 60, y: 16 },
  DE: { x: 82, y: 26 },
  NL: { x: 87, y: 48 },
  UK: { x: 70, y: 62 },
  ZA: { x: 48, y: 82 },
  FR: { x: 26, y: 74 },
  ES: { x: 12, y: 55 },
  PL: { x: 25, y: 42 },
  IT: { x: 39, y: 28 },
  SA: { x: 59, y: 36 },
  EG: { x: 72, y: 44 },
  JP: { x: 78, y: 78 },
  CN: { x: 55, y: 68 },
  SG: { x: 39, y: 58 },
  AU: { x: 18, y: 86 },
  IN: { x: 88, y: 68 }
};

const trustControls = [
  {
    title: 'Read-only mode enforced',
    detail: 'Read-only mode is enforced until explicit approval.'
  },
  {
    title: 'No filing without validation',
    detail: 'No filing occurs without evidence validation and seller approval.'
  },
  {
    title: 'Low-confidence cases filtered',
    detail: 'Low-confidence cases are filtered out of the execution queue.'
  },
  {
    title: 'No reimbursement guarantee',
    detail: 'No guarantee of reimbursement outcomes; the system only structures recovery execution.'
  }
];

const earlyAccessItems = [
  'Founding 100 Recovery Audit',
  'Managed onboarding before filing',
  'Read-only setup first',
  'Claim-clock scan and evidence readiness review',
  'Seller approval before filing',
  'No recovery commissions'
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin starts in read-only mode. It reviews FBA activity for recovery-relevant events, identifies the claim type, tracks the claim window, matches supporting evidence, and prepares recovery cases for seller review.'
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
    answer: 'Margin is monthly recovery management, not a percentage-based reimbursement service. It is built around claim-clock visibility, evidence-backed case preparation, seller approval before filing, and no recovery commissions.'
  },
  {
    question: 'Why no recovery commissions?',
    answer: 'Margin does not take a percentage of approved recoveries. Founding 100 starts with a managed recovery audit, then sellers can keep Margin running as a monthly recovery management system.'
  },
  {
    question: 'What happens after I start the Founding 100 Recovery Audit?',
    answer: 'Your activation joins the managed Founding 100 cohort. Margin prepares the workspace carefully, starts with read-only setup, scans claim clocks, reviews evidence readiness, and keeps seller approval before filing.'
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

function LightNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOverDarkSurface, setIsOverDarkSurface] = useState(false);

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

  useEffect(() => {
    const updateNavbarTheme = () => {
      const themeProbeY = window.innerWidth >= 768 ? 76 : 56;
      const darkSections = Array.from(document.querySelectorAll<HTMLElement>('[data-navbar-theme="dark"]'));

      setIsOverDarkSurface(
        darkSections.some((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= themeProbeY && rect.bottom >= themeProbeY;
        })
      );
    };

    updateNavbarTheme();
    window.addEventListener('scroll', updateNavbarTheme, { passive: true });
    window.addEventListener('resize', updateNavbarTheme);

    return () => {
      window.removeEventListener('scroll', updateNavbarTheme);
      window.removeEventListener('resize', updateNavbarTheme);
    };
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-[1240px] px-3 py-3 md:px-6 md:py-5">
        <div
          className={`rounded-[22px] px-4 py-3 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-2xl transition-colors duration-300 md:px-5 ${
            isOverDarkSurface ? 'bg-[#07101A]/72 shadow-[0_18px_60px_rgba(0,0,0,0.22)]' : 'bg-white/86'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className={`inline-flex items-center gap-2.5 rounded-full px-1 py-1 transition-colors duration-300 ${
                isOverDarkSurface ? 'text-white' : 'text-[#182026]'
              }`}
            >
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                width="22"
                height="22"
                className={`h-5 w-auto object-contain transition duration-300 ${isOverDarkSurface ? 'invert brightness-0' : ''}`}
              />
              <span className={`brand-wordmark font-merriweather text-lg tracking-tight transition-colors duration-300 ${isOverDarkSurface ? 'text-white' : 'text-[#182026]'}`}>
                Margin
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <div className="hidden lg:block">
                <ProductsMegaMenu variant={isOverDarkSurface ? 'dark' : 'light'} />
              </div>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-tight transition-colors ${
                    isOverDarkSurface
                      ? 'text-white/90 hover:bg-white/10 hover:text-white'
                      : 'text-[#66737F] hover:bg-[#F3F6F8] hover:text-[#182026]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className={`rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-tight transition-colors ${
                  isOverDarkSurface ? 'text-white/90 hover:bg-white/10 hover:text-white' : 'text-[#25313A] hover:bg-[#F3F6F8]'
                }`}
              >
                LOGIN
              </Link>
              <a
                href="#how-margin-works"
                className={`inline-flex h-10 items-center rounded-full px-5 text-[12px] font-semibold uppercase tracking-tight transition-colors ${
                  isOverDarkSurface
                    ? 'bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] hover:bg-white/[0.14]'
                    : 'bg-[#F3F6F8] text-[#25313A] shadow-[inset_0_0_0_1px_rgba(207,224,234,0.9)] hover:bg-[#EAF1F5]'
                }`}
              >
                See Workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>

            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors md:hidden ${
                isOverDarkSurface ? 'border-white/14 bg-white/10 text-white' : 'border-[#DCE8EE] bg-white text-[#25313A]'
              }`}
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
                className="rounded-2xl px-3 py-3 text-sm font-semibold uppercase tracking-tight text-[#25313A] hover:bg-[#F3F6F8]"
              >
                LOGIN
              </Link>
              <a
                href="#how-margin-works"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-[#F3F6F8] px-4 text-sm font-semibold uppercase tracking-tight text-[#25313A] shadow-[inset_0_0_0_1px_rgba(207,224,234,0.9)] hover:bg-[#EAF1F5]"
              >
                See Workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
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

function KineticHeroSection({
  onPrimaryCta,
  onDemoCta,
  primaryCtaLabel,
  isFull,
  nextBatchHours
}: {
  onPrimaryCta: () => void;
  onDemoCta: () => void;
  primaryCtaLabel: string;
  isFull: boolean;
  nextBatchHours?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.82]);
  const networkY = useTransform(scrollYProgress, [0, 0.25], [0, reduceMotion ? 0 : 34]);

  return (
    <motion.section
      style={{ scale: heroScale, opacity: heroOpacity }}
      data-navbar-theme="dark"
      className="relative isolate flex min-h-[calc(100svh-24px)] overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(11,116,222,0.18),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(46,125,91,0.12),transparent_32%),linear-gradient(135deg,#101827_0%,#06080C_54%,#000000_100%)] px-5 pb-32 pt-52 text-white sm:px-6 md:min-h-screen md:px-8 md:pb-44 md:pt-64"
      aria-labelledby="margin-hero-title"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")",
        }}
      />
      <motion.div
        style={{ y: networkY }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="absolute left-[-10%] top-[12%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,122,255,0.28)_0%,rgba(0,122,255,0.12)_34%,transparent_70%)] blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 26, 0], y: [0, -18, 0], opacity: [0.54, 0.82, 0.54] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(96,165,250,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.10)_1px,transparent_1px)] [background-size:92px_92px]" />
        <motion.div
          className="absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.14),transparent)] blur-sm"
          animate={reduceMotion ? undefined : { x: ['-30vw', '115vw'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        {auditLines.map((line) => (
          <motion.div
            key={`${line.left}-${line.top}`}
            className="absolute h-px origin-left bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.42),rgba(52,211,153,0.24),transparent)]"
            style={{
              left: `${line.left}%`,
              top: `${line.top}%`,
              width: `${line.width}%`,
              rotate: `${line.rotate}deg`
            }}
            animate={reduceMotion ? { opacity: 0.14 } : { opacity: [0, 0.26, 0] }}
            transition={{ duration: 4.8, delay: line.delay, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
          />
        ))}
        {auditPulses.map((pulse, index) => (
          <motion.div
            key={`${pulse.x}-${pulse.y}`}
            className={`absolute rounded-full ${pulse.color} shadow-[0_0_30px_currentColor]`}
            style={{
              left: `${pulse.x}%`,
              top: `${pulse.y}%`,
              width: pulse.size,
              height: pulse.size,
              color: pulse.color.includes('emerald') ? 'rgba(52,211,153,0.9)' : 'rgba(96,165,250,0.9)'
            }}
            animate={reduceMotion ? { opacity: 0.14, scale: 1 } : { opacity: [0, 0.22, 0], scale: [0.2, 1.22, 1.6] }}
            transition={{ duration: pulse.duration, delay: pulse.delay + index * 0.05, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center">
        <div className="max-w-[980px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-tight text-blue-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"
          >
            Always-on recovery management for Amazon sellers
          </motion.div>

          <h1
            id="margin-hero-title"
            className="mt-7 max-w-[1040px] text-[48px] font-bold leading-[0.96] tracking-[-0.055em] sm:text-[64px] md:text-[88px] lg:text-[104px]"
          >
            <motion.span
              className="block text-white"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              Margin turns Amazon loss events
            </motion.span>
            <motion.span
              className="block text-slate-400"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              into structured recovery cases.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[680px] text-[16px] leading-7 text-slate-300 md:text-lg md:leading-8"
          >
            Bind evidence, enforce claim readiness, and track payouts from detection to resolution.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid w-full max-w-[700px] grid-cols-1 gap-3 min-[680px]:grid-cols-[1.18fr_1fr]"
          >
            <Button
              onClick={onPrimaryCta}
              aria-label="Start Recovery Audit"
              className="h-[52px] justify-center rounded-full bg-[#007AFF] px-7 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(0,122,255,0.34)] transition hover:scale-[1.02] hover:bg-[#168BFF] hover:shadow-[0_22px_70px_rgba(0,122,255,0.48)]"
            >
              {primaryCtaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onDemoCta}
              aria-label="Watch 60-Second Demo"
              className="h-[52px] justify-center rounded-full border border-slate-800 bg-white/[0.04] px-7 text-sm font-semibold text-white backdrop-blur-md transition hover:scale-[1.02] hover:border-slate-700 hover:bg-white/[0.08]"
            >
              Watch 60-Second Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.02 }}
            className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500"
          >
            100% Read-Only • No Commissions • Full Seller Approval
          </motion.div>

          {isFull ? (
            <div className="mt-5 max-w-[430px] rounded-2xl bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl">
              <div>We are onboarding a small batch of sellers right now.</div>
              <div>Next batch opens in {nextBatchHours ?? 24} hours.</div>
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}

function MobileMarketplaceHub() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const activeMarketplace = marketplaceCountries.find((marketplace) => marketplace.code === activeCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative sm:hidden"
    >
      <div className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7A8994]">
        Global Marketplace Support
      </div>

      <div className="relative mx-auto h-[380px] max-w-[360px] overflow-hidden rounded-[28px] border border-slate-900/10 bg-[#070B12] shadow-[0_28px_90px_rgba(24,32,38,0.22)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(0,122,255,0.26),transparent_34%),radial-gradient(circle_at_50%_50%,rgba(46,125,91,0.14),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:42px_42px]" />

        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <filter id="marketplace-line-glow">
              <feGaussianBlur stdDeviation="0.75" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {marketplaceCountries.map((marketplace, index) => {
            const position = marketplaceNodePositions[marketplace.code];
            if (!position) return null;

            return (
              <motion.line
                key={`line-${marketplace.code}`}
                x1="50"
                y1="50"
                x2={position.x}
                y2={position.y}
                stroke="rgba(148,163,184,0.24)"
                strokeWidth="0.45"
                filter="url(#marketplace-line-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.7 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.18 + index * 0.025 }}
              />
            );
          })}
        </svg>

        <motion.div
          className="absolute z-10 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-[38px] font-semibold tracking-[-0.08em] text-white shadow-[0_0_72px_rgba(0,122,255,0.35)] backdrop-blur-xl"
          style={{ left: 'calc(50% - 44px)', top: 'calc(50% - 44px)' }}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.58,
            ease: [0.22, 1, 0.36, 1],
            boxShadow: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
          }}
          animate={reduceMotion ? undefined : { boxShadow: ['0 0 54px rgba(0,122,255,0.26)', '0 0 86px rgba(0,122,255,0.42)', '0 0 54px rgba(0,122,255,0.26)'] }}
        >
          M
        </motion.div>

        {marketplaceCountries.map((marketplace, index) => {
          const position = marketplaceNodePositions[marketplace.code];
          if (!position) return null;
          const isActive = activeCode === marketplace.code;

          return (
            <motion.button
              key={marketplace.code}
              type="button"
              aria-label={`${marketplace.country} marketplace`}
              onClick={() => setActiveCode(isActive ? null : marketplace.code)}
              className="absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-white/[0.09] shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition"
              style={{ left: `calc(${position.x}% - 20px)`, top: `calc(${position.y}% - 20px)` }}
              initial={{ opacity: 0, scale: 0.35 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.42,
                delay: 0.24 + index * 0.035,
                ease: [0.22, 1, 0.36, 1],
                y: { duration: 3.2 + (index % 4) * 0.28, repeat: Infinity, ease: 'easeInOut' },
                boxShadow: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
              }}
              animate={reduceMotion ? undefined : {
                y: [0, -4, 0],
                boxShadow: isActive
                  ? '0 0 32px rgba(0,122,255,0.72)'
                  : ['0 12px 28px rgba(0,0,0,0.22)', '0 14px 34px rgba(0,122,255,0.18)', '0 12px 28px rgba(0,0,0,0.22)']
              }}
            >
              <span className={`fi fi-${marketplace.flagCode} h-4 w-6 rounded-[3px]`} aria-hidden="true" />
            </motion.button>
          );
        })}

        {activeMarketplace ? (
          <motion.div
            key={activeMarketplace.code}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-5 left-6 right-6 z-30 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-center backdrop-blur-xl"
          >
            <div className="text-[13px] font-semibold text-white">{activeMarketplace.country}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {activeMarketplace.region} / {activeMarketplace.code}
            </div>
          </motion.div>
        ) : (
          <div className="absolute bottom-6 left-7 right-7 z-30 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Tap a node
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MinimalMetric({
  label,
  value,
  suffix,
  detail,
  index
}: {
  label: string;
  value: number;
  suffix: string;
  detail: string;
  index: number;
}) {
  const metricRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(metricRef, { once: true, amount: 0.55 });
  const count = useMotionValue(reduceMotion ? value : 0);
  const spring = useSpring(count, { stiffness: 120, damping: 26, mass: 0.45 });
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return unsubscribe;
  }, [spring]);

  useEffect(() => {
    if (isInView || reduceMotion) {
      count.set(value);
    }
  }, [count, isInView, reduceMotion, value]);

  return (
    <motion.div
      ref={metricRef}
      aria-label={`${label}: ${value}${suffix}. ${detail}`}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-w-0"
    >
      <motion.div
        aria-hidden="true"
        animate={reduceMotion ? { opacity: 0.78 } : { opacity: [0.58, 1, 0.58] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35 }}
        className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0B74DE] md:text-xs"
      >
        {label}
      </motion.div>
      <div aria-hidden="true" className="mt-4 flex items-end font-black leading-none tracking-[-0.08em] text-[#182026]">
        <span className="text-[82px] sm:text-[96px] md:text-[112px] lg:text-[132px]">
          {displayValue}
        </span>
        <span className="mb-3 ml-2 text-[38px] font-medium tracking-[-0.05em] text-[#8A98A3] sm:text-[44px] md:mb-4 md:text-[54px]">
          {suffix}
        </span>
      </div>
      <p className="mt-5 max-w-[320px] text-[15px] leading-6 text-[#66737F] md:text-base">
        {detail}
      </p>
    </motion.div>
  );
}

function CoverageItem({
  item,
  index
}: {
  item: (typeof coverageExamples)[number];
  index: number;
}) {
  const isFeature = index === 0;
  const offsetClass = index % 2 === 1 ? 'md:ml-[12%]' : index % 3 === 2 ? 'md:ml-[6%]' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, x: index % 2 === 0 ? -10 : 10 }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount: 0.38 }}
      transition={{ duration: 0.78, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 5, scale: 1.005 }}
      whileFocus={{ x: 5, scale: 1.005 }}
      tabIndex={0}
      className={`group relative max-w-[940px] py-7 outline-none md:py-10 ${isFeature ? 'md:max-w-[1040px]' : offsetClass}`}
      aria-label={`${item.label}. ${item.title} ${item.detail}`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-6 inset-y-0 rounded-[40px] bg-[radial-gradient(circle_at_18%_50%,rgba(11,116,222,0.10),transparent_58%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <div className="relative grid gap-4 md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] md:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]/70 transition duration-200 group-hover:text-[#0B74DE] group-hover:[text-shadow:0_0_22px_rgba(11,116,222,0.20)] group-focus-visible:text-[#0B74DE]"
        >
          {item.label}
        </motion.div>
        <div className="max-w-[760px]">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.62, delay: 0.08 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`${isFeature ? 'text-[34px] md:text-[48px]' : 'text-[29px] md:text-[40px]'} font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026]/90 transition duration-200 group-hover:text-[#182026] group-focus-visible:text-[#182026]`}
          >
            {item.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.62, delay: 0.16 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-[690px] text-[15px] leading-7 text-[#66737F]/68 transition duration-200 group-hover:text-[#4D5B66] group-focus-visible:text-[#4D5B66] md:text-[17px] md:leading-8"
          >
            {item.detail}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function CoverageExamplesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-24 hidden h-px bg-[linear-gradient(90deg,transparent_0%,rgba(11,116,222,0.08)_18%,rgba(11,116,222,0.30)_48%,rgba(46,125,91,0.10)_78%,transparent_100%)] md:block"
        style={{ backgroundSize: '220% 100%' }}
        animate={reduceMotion ? undefined : { backgroundPosition: ['0% 50%', '220% 50%'] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
      />
      <div className={containerClass}>
        <InhaleSection className="max-w-[760px]">
          <div className={sectionLabelClass}>Coverage Examples</div>
          <h2 className={sectionHeadingClass}>Recovery categories Margin reviews.</h2>
          <p className={sectionBodyClass}>
            These are representative recovery categories, not the limit of the system. Each case stays tied to what happened, what deadline applies, what evidence exists, and whether the recovery is evidence-supported.
          </p>
        </InhaleSection>

        <div className="relative mt-12 md:mt-20">
          {coverageExamples.map((item, index) => (
            <CoverageItem key={item.label} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
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

  const openDemo = () => {
    setIsDemoOpen(true);
  };

  const scrollToWorkflow = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('how-margin-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 4 : 5;
  const primaryCtaLabel = 'Start Recovery Audit';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <LightNavbar />

      <main className="relative">
        <KineticHeroSection
          onPrimaryCta={handlePrimaryCta}
          onDemoCta={openDemo}
          primaryCtaLabel={primaryCtaLabel}
          isFull={isFull}
          nextBatchHours={capacity?.nextBatchHours}
        />

        <section className="relative border-b border-[#E4EDF1] bg-[#FAFAF7] py-8 md:py-10">
          <div className={containerClass}>
            <p className="max-w-[900px] text-[17px] font-medium leading-8 tracking-[-0.02em] text-[#25313A] md:text-[20px] md:leading-9">
              Amazon does handle some reimbursements automatically. Margin is built for the recovery work that still needs visibility: missing proof, claim windows, case readiness, seller approval, underpaid reimbursements, rejections, and payout tracking.
            </p>
          </div>
        </section>

        <section className="relative py-28 md:py-40" aria-label="Margin recovery speed metrics">
          <div className={containerClass}>
            <div className="grid gap-20 md:grid-cols-3 md:items-start md:gap-12">
              {velocityMetrics.map((metric, index) => (
                <MinimalMetric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  suffix={metric.suffix}
                  detail={metric.detail}
                  index={index}
                />
              ))}
            </div>
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
              <h2 className={sectionHeadingClass}>Why timing matters</h2>
              <p className={sectionBodyClass}>
                Amazon recovery data is time-bound and distributed across systems that update independently. When claim windows expire, the associated loss becomes structurally unrecoverable regardless of later detection.
              </p>
              <p className={sectionBodyClass}>
                Required evidence is fragmented across invoices, shipment logs, and support records, which degrade in accessibility over time and reduce successful claim rates in delayed workflows.
              </p>
              <p className={sectionBodyClass}>
                Continuous transaction-level noise causes delays to compound, turning recovery into backlog rather than resolution.
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
                Amazon activity is converted into structured recovery workflows through event detection, claim clock assignment, evidence matching, approval gating, and payout tracking across the full lifecycle.
              </p>
            </motion.div>

            <motion.button
              type="button"
              onClick={openDemo}
              {...revealProps}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[2px] border border-[#CFE0EA] bg-white text-left shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F3F6F8]"
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
                    <PlayCircle className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.7} />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8">
                  <div className="text-[10px] font-semibold uppercase tracking-tight text-white/78 md:text-[11px]">Event-to-recovery walkthrough</div>
                  <div className="mt-2 max-w-[780px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[36px]">
                    Amazon activity becomes structured recovery workflows from detection through payout state.
                  </div>
                </div>
              </div>
            </motion.button>
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
              <div className={sectionLabelClass}>What Margin Does</div>
              <h2 className={sectionHeadingClass}>What Margin does</h2>
              <p className="mt-5 max-w-[760px] text-[20px] font-semibold leading-8 tracking-[-0.025em] text-[#25313A] md:text-[26px] md:leading-9">
                Margin is a workflow engine that converts Amazon operational data into structured recovery cases, enforces evidence requirements, applies claim timing logic, and tracks outcomes through final payout state.
              </p>
              <p className={sectionBodyClass}>
                States: detected → classified → evidence-linked → approved → filed → in-review → paid / blocked / expired.
              </p>
              <p className={sectionBodyClass}>
                Each state keeps the recovery case tied to its evidence, deadline, approval, filing, and payout context.
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

        <CoverageExamplesSection />

        <section className="relative py-16 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Trust & Control</div>
                <h2 className={sectionHeadingClass}>Why sellers trust the workflow.</h2>
                <p className={sectionBodyClass}>
                  Read-only mode is enforced until explicit approval. No filing can advance without evidence validation and seller approval.
                </p>
                <p className={sectionBodyClass}>
                  Low-confidence cases are filtered out of the execution queue. Margin does not guarantee reimbursement outcomes; it structures recovery execution.
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
              <motion.div {...revealProps} className="hidden max-w-[560px] sm:block">
                <div className={sectionLabelClass}>Marketplace Scope</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  Supported regions for Amazon FBA recovery workflows.
                </h2>
                <p className={sectionBodyClass}>
                  Marketplace coverage follows the approved Amazon Appstore regions Margin supports for FBA recovery workflows.
                </p>
              </motion.div>

              <MobileMarketplaceHub />

              <motion.div
                {...revealProps}
                className="hidden border-y border-[#D8E3E8] sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
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
                <div className={sectionLabelClass}>Founding 100 Recovery Audit</div>
                <h2 className="mt-4 max-w-[760px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[62px]">
                  Join the Founding 100 before your next recovery window closes.
                </h2>
                <p className={sectionBodyClass}>
                  Founding 100 Recovery Audit starts with controlled onboarding, read-only setup, claim-clock scanning, evidence readiness review, and seller approval before filing. No recovery commissions.
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
                    onClick={openDemo}
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
                  Start with the Founding 100 Recovery Audit. Margin helps identify Amazon loss events, match the required evidence, and show which recovery cases are ready, blocked, or waiting before anything gets filed.
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

      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin recovery walkthrough"
        description="Watch how Margin detects Amazon loss events, starts the claim clock, matches evidence, prepares cases for review, and tracks recovery states through payout."
      />
      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
