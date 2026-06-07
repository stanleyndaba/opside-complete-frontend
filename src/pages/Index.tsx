import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
} from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { InhaleSection } from '@/components/landing/InhaleSection';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

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
    title: 'The claim window closes fast',
    detail: 'Amazon gives you 60 days to claim what they owe you. After that the window closes permanently - no matter how valid the case. Most sellers find the discrepancy after the deadline. Margin catches it in 16 seconds.'
  },
  {
    title: 'The proof is scattered everywhere',
    detail: 'The invoice you need is in your email from seven months ago. The shipment log is in a supplier WhatsApp thread. By the time you find both, the claim window is gone. Margin connects those sources automatically before the deadline hits.'
  },
  {
    title: 'Delay becomes lost money',
    detail: "Every day you don't file is a day closer to losing the case permanently. Margin moves in minutes, not days."
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
  'Founding 500 Recovery Audit',
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
    answer: 'Margin does not take a percentage of approved recoveries. Founding 500 starts with a managed recovery audit, then sellers can keep Margin running as a monthly recovery management system.'
  },
  {
    question: 'What happens after I start the Founding 500 Recovery Audit?',
    answer: 'Your activation joins the managed Founding 500 cohort. Margin prepares the workspace carefully, starts with read-only setup, scans claim clocks, reviews evidence readiness, and keeps seller approval before filing.'
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
  onEarlyAccessCta,
  primaryCtaLabel,
  isFull,
  nextBatchHours
}: {
  onPrimaryCta: () => void;
  onEarlyAccessCta: () => void;
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
              Finding what Amazon owes you
            </motion.span>
            <motion.span
              className="block text-slate-400"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              was never the hard part.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[680px] text-[16px] leading-7 text-slate-300 md:text-lg md:leading-8"
          >
            Margin handles the part every other tool ignores – the evidence, the rejections, the appeals, and the payouts. You approve. Margin fights.
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
              onClick={onEarlyAccessCta}
              aria-label="Secure Early Access for 99 dollars"
              className="h-[52px] justify-center rounded-full border border-slate-800 bg-white/[0.04] px-7 text-sm font-semibold text-white backdrop-blur-md transition hover:scale-[1.02] hover:border-slate-700 hover:bg-white/[0.08]"
            >
              Secure Early Access – $99
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-[390px] sm:hidden"
      aria-label="Mobile marketplace support"
    >
      <div className={sectionLabelClass}>Marketplace Scope</div>
      <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026]">
        Supported FBA marketplaces
      </h2>
      <p className="mt-5 max-w-[340px] text-[16px] leading-8 text-[#66737F]">
        Margin supports FBA recovery workflows across major Amazon marketplaces in North America, Europe, and selected global regions.
      </p>
      <div className="mt-8 border-y border-[#D8E3E8] py-6">
        <div className="text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">
          All Supported Regions
        </div>
        <div className="mt-4 grid max-w-[340px] grid-cols-1">
          {marketplaceCountries.map((marketplace, index) => (
            <motion.span
              key={marketplace.code}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.28, delay: index * 0.018, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center gap-3 py-3 ${
                index > 0 ? 'border-t border-[#D8E3E8]' : ''
              }`}
            >
              <span
                className={`fi fi-${marketplace.flagCode} h-5 w-7 shrink-0 rounded-[4px] shadow-[0_8px_18px_rgba(37,49,58,0.12)]`}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold tracking-[-0.02em] text-[#182026]">
                  {marketplace.country}
                </span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-tight text-[#7A8994]">
                  {marketplace.region} · {marketplace.code}
                </span>
              </span>
            </motion.span>
          ))}
        </div>
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

function TestimonialSection() {
  return (
    <section className="relative py-32 md:py-40" aria-label="Seller case study">
      <div className={containerClass}>
        <motion.div
          {...revealProps}
          className="mx-auto flex max-w-[980px] flex-col items-center text-center"
        >
          <div className="h-px w-12 bg-[#0B74DE]" aria-hidden="true" />
          <div className="mt-10 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7A8994]">
            Seller case study | Approx. $120K/month
          </div>
          <p className="mt-8 text-[20px] font-semibold leading-relaxed tracking-[-0.025em] text-[#182026] sm:text-[26px] md:text-[30px] md:leading-relaxed">
            A seller doing approximately $120K/month came to Margin after Amazon denied three consecutive claims and underpaid another. Margin rebuilt the evidence trail, surfaced a $400 lowball dispute, and helped recover $1,200 in two weeks.
          </p>
          <div className="mt-10 text-[11px] font-medium uppercase tracking-[0.24em] text-[#7A8994]">
            Outcome shown as an individual case study, not a reimbursement guarantee.
          </div>
        </motion.div>
      </div>
    </section>
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

  const scrollToWorkflow = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('how-margin-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 4 : 5;
  const primaryCtaLabel = 'Secure Early Access – $99';
  const foundingSlotsRemaining = capacity ? Math.max(capacity.max - capacity.active, 0) : 500;
  const foundingSlotsLabel = `${foundingSlotsRemaining} ${foundingSlotsRemaining === 1 ? 'slot' : 'slots'} remaining.`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" ctaLabel="SEE WORKFLOW" ctaTo="#how-margin-works" />

      <main className="relative">
        <KineticHeroSection
          onPrimaryCta={scrollToWorkflow}
          onEarlyAccessCta={() => navigate('/early-access')}
          primaryCtaLabel="See Workflow"
          isFull={isFull}
          nextBatchHours={capacity?.nextBatchHours}
        />

        <section className="relative border-b border-[#E4EDF1] bg-[#FAFAF7] py-8">
          <div className={containerClass}>
            <motion.p
              {...revealProps}
              className="mx-auto max-w-[820px] text-center text-[20px] font-semibold leading-8 tracking-[-0.035em] text-[#182026] md:text-[28px] md:leading-9"
            >
              Most tools find the discrepancy. They stop there. Margin starts there.
            </motion.p>
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
                Amazon gives you 60 days to claim what they owe you. After that the window closes permanently - no matter how valid the case. Most sellers find the discrepancy after the deadline. Margin catches it in 16 seconds.
              </p>
              <p className={sectionBodyClass}>
                The invoice you need is in your email from seven months ago. The shipment log is in a supplier WhatsApp thread. By the time you find both, the claim window is gone. Margin connects those sources automatically before the deadline hits.
              </p>
              <p className={sectionBodyClass}>
                Every day you don't file is a day closer to losing the case permanently. Margin moves in minutes, not days.
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
                Margin turns Amazon operational data into organized recovery cases, enforces evidence requirements, applies claim timing logic, and tracks outcomes through final payout state.
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

        <TestimonialSection />

        <section className="relative bg-[#F7F5F0] py-8 sm:bg-transparent sm:py-16 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <motion.div {...revealProps} className="hidden max-w-[560px] sm:block">
                <div className={sectionLabelClass}>Marketplace Scope</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  Supported FBA marketplaces
                </h2>
                <p className={sectionBodyClass}>
                  Margin supports FBA recovery workflows across major Amazon marketplaces in North America, Europe, and selected global regions.
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

                <h2 className="mt-4 max-w-[760px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[62px]">
                  Founding 500 Access.
                </h2>
                <p className={sectionBodyClass}>
                  The first 500 sellers get 1 year of full-service recovery for a one-time $99 fee. We handle the evidence and fight the cases for you. Then renew at a low, locked-in rate. No recovery commissions, ever.
                </p>
                <p className="mt-5 max-w-[640px] text-[14px] font-semibold leading-7 text-[#25313A] md:text-[16px]">
                  {foundingSlotsLabel} Closes June 30, 2026 or when full. Standard plans begin at $199/month after Early Access closes.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                  >
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              <motion.div {...revealProps} className="grid gap-1">
                {earlyAccessItems.map((item, index) => (
                  <div
                    key={item}
                    className="group relative flex items-center gap-4 py-4 text-[#25313A] outline-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:translate-x-[5px]"
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

                <h2 className="mt-4 max-w-[860px] text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[42px] md:text-[68px]">
                  Start Your First Recovery.
                </h2>
                <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                  Margin identifies Amazon loss events, connects the required evidence, and manages every case until payout or escalation.
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
