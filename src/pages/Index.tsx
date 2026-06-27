import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  PlayCircle,
} from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { DemoVideoModal } from '@/components/demo/DemoVideoModal';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { InhaleSection } from '@/components/landing/InhaleSection';
import { PUBLIC_ROUTE_META } from '@/config/seo';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ScrollytellingCoverage } from '@/components/landing/ScrollytellingCoverage';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';
import { ProgressiveNarrativeTabs } from '@/components/landing/ProgressiveNarrativeTabs';
import { TechnicalProtocolGrid } from '@/components/landing/TechnicalProtocolGrid';
import { SystemPerformanceTicker } from '@/components/landing/SystemPerformanceTicker';

const DEMO_VIDEO_URL = 'https://youtu.be/B0ksWTlYbRo';
const DEMO_VIDEO_THUMBNAIL_URL = '/margin-logo-reveal.gif';

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
    detail: 'Amazon reimbursement claims can move on short deadlines. Once a discrepancy is identified, the evidence, filing path, and response work need to move before the window closes.'
  },
  {
    title: 'The proof is scattered everywhere',
    detail: 'The invoice you need for a reimbursement claim is in your email from seven months ago. The shipment log is in a supplier WhatsApp thread. By the time you find both, the claim window is gone. Margin connects those sources before the deadline hits.'
  },
  {
    title: 'Delay becomes lost money',
    detail: "Every day a reimbursement claim is not filed is a day closer to losing the case permanently. Margin keeps the workflow moving in minutes, not days."
  }
];

const proofItems = [
  {
    title: 'Claim Deadline Tracking',
    detail: 'Every reimbursement case stays tied to the filing window that controls eligibility.'
  },
  {
    title: 'Document Matching',
    detail: 'Invoices, BOLs, PODs, shipment records, and support history are matched before filing.'
  },
  {
    title: 'Read-only First Mode',
    detail: 'All reimbursement workflows are structured without enabling actions until approval is granted.'
  },
  {
    title: 'Payout Reconciliation',
    detail: 'Each case is tracked from evidence pack to Amazon response, payout, dispute, or blocker.'
  }
];

const velocityMetrics = [
  {
    label: 'Evidence Readiness',
    value: 3,
    suffix: 'min',
    detail: 'Discrepancy is checked against the records Amazon may ask for before filing.'
  },
  {
    label: 'Document Matching',
    value: 1,
    suffix: 'min',
    detail: 'Invoices, shipment records, and support files are linked to the case context.'
  },
  {
    label: 'Claim Deadline Tracking',
    value: 16,
    suffix: 's',
    detail: 'Each issue is mapped to a claim window, required proof, and next action.'
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Detect discrepancy',
    detail: 'A potential reimbursement issue is identified from Amazon operational data.'
  },
  {
    step: '02',
    title: 'Identify required evidence',
    detail: 'Margin maps the issue to the invoices, BOLs, PODs, shipment IDs, carrier records, cost data, case history, and payout records Amazon may ask for.'
  },
  {
    step: '03',
    title: 'Locate matching documents',
    detail: 'Relevant records are pulled from inboxes, drives, shipment files, reports, and support trails.'
  },
  {
    step: '04',
    title: 'Generate evidence pack',
    detail: 'The claim is assembled with linked proof, deadline context, and seller approval before filing.'
  },
  {
    step: '05',
    title: 'Track Amazon response',
    detail: 'Margin follows the case through rejection recovery, escalation, payout, dispute, or reconciliation.'
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
  'Founding 500 Evidence Workflow Audit',
  'Managed onboarding before filing',
  'Read-only setup first',
  'Claim deadline and evidence readiness check',
  'Seller approval before filing',
  'No recovery commissions'
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin starts in read-only mode. After a discrepancy is identified, it maps the required evidence, tracks the claim window, matches supporting documents, and prepares reimbursement cases for seller review.'
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
    answer: 'Some reimbursement windows are short, and manual or quarterly audits can surface issues too late. Margin keeps each reimbursement issue tied to its deadline, required evidence, and next action before the window closes.'
  },
  {
    question: 'Does Margin file every reimbursement issue?',
    answer: 'No. Margin holds back weak, duplicate, unsupported, expired, or low-confidence reimbursement issues. The system is designed to move evidence-supported cases forward and block risky ones.'
  },
  {
    question: 'How is this different from commission-based services?',
    answer: 'Margin is monthly recovery management, not a percentage-based reimbursement service. It is built around claim deadline tracking, evidence-backed case preparation, seller approval before filing, and no recovery commissions.'
  },
  {
    question: 'Why no recovery commissions?',
    answer: 'Margin does not take a percentage of approved recoveries. Founding 500 starts with a managed evidence workflow audit, then sellers can keep Margin running as a monthly recovery management system.'
  },
  {
    question: 'What happens after I start the Founding 500 Evidence Workflow Audit?',
    answer: 'Your activation joins the managed Founding 500 cohort. Margin prepares the workspace carefully, starts with read-only setup, reviews claim deadlines, checks evidence readiness, and keeps seller approval before filing.'
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
  isFull,
  nextBatchHours
}: {
  onPrimaryCta: () => void;
  onEarlyAccessCta: () => void;
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

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center gap-12 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-[980px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-tight text-blue-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"
          >
            Claim-ready evidence packs for Amazon reimbursement work
          </motion.div>

          <h1
            id="margin-hero-title"
            className="mt-7 font-serif-headline max-w-[1040px] text-[48px] font-bold leading-[0.96] tracking-[-0.055em] sm:text-[64px] md:text-[88px] lg:text-[112px]"
          >
            <motion.span
              className="block text-white"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              Finding a discrepancy
            </motion.span>
            <motion.span
              className="block text-slate-400"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              is only the beginning.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[680px] text-[17px] leading-[1.7] text-slate-300 md:text-[20px]"
          >
            Margin turns scattered invoices, BOLs, PODs, shipment records, cost data, case history, and payout records into claim-ready evidence packs so Amazon reimbursement cases move faster, survive rejections, and reconcile to payout.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 grid w-full max-w-[700px] grid-cols-1 gap-3 min-[680px]:grid-cols-[1.18fr_1fr]"
          >
            <Button
              onClick={onEarlyAccessCta}
              aria-label="Secure Early Access for 99 dollars"
              className="group relative h-[52px] justify-center overflow-hidden rounded-full bg-[#0B74DE] px-7 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(11,116,222,0.34)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#0c66c2]"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              Secure Early Access – $99
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onPrimaryCta}
              aria-label="See Evidence Workflow"
              className="h-[52px] justify-center rounded-full border border-white/20 bg-white/[0.04] px-7 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.08]"
            >
              See Evidence Workflow
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 flex items-center gap-4 text-[12px] font-medium text-slate-400"
          >
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0B74DE]" /> 100% Read-Only</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0B74DE]" /> Seller Approval Before Filing</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0B74DE]" /> No Recovery Commissions</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#0B74DE]" /> Evidence-Heavy Claims</span>
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
        Margin supports FBA reimbursement workflows across major Amazon marketplaces in North America, Europe, and selected global regions.
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



export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { isFull, capacity } = useOnboardingCapacity();

  usePageMeta(PUBLIC_ROUTE_META['/']);

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
  const primaryCtaLabel = 'Secure Early Access – $99';


  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" ctaLabel="EVIDENCE WORKFLOW" ctaTo="#how-margin-works" />

      <main className="relative">
        <KineticHeroSection
          onPrimaryCta={scrollToWorkflow}
          onEarlyAccessCta={() => navigate('/early-access')}
          isFull={isFull}
          nextBatchHours={capacity?.nextBatchHours}
        />

        <section className="relative border-b border-[#E4EDF1] bg-[#FAFAF7] py-8">
          <div className={containerClass}>
            <motion.p
              {...revealProps}
              className="mx-auto max-w-[820px] text-center text-[20px] font-semibold leading-8 tracking-[-0.035em] text-[#182026] md:text-[28px] md:leading-9"
            >
              Most tools help you find or file reimbursement claims. Margin helps you prove them.
            </motion.p>
            <motion.p
              {...revealProps}
              className="mx-auto mt-4 max-w-[840px] text-center text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8"
            >
              We organize the evidence Amazon asks for - invoices, proof of delivery, bills of lading, shipment records, cost data, support history, and payout records - into deadline-aware recovery workflows.
            </motion.p>
          </div>
        </section>

        <SystemPerformanceTicker />

        <TechnicalProtocolGrid />

        <ProgressiveNarrativeTabs />

        <section className="hidden relative border-y border-[#E4EDF1] bg-[#F3F6F8] py-14 md:py-24" id="margin-demo">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto mb-8 max-w-[880px] text-center md:mb-12">
              <div className={sectionLabelClass}>See Demo</div>
              <h2 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#182026] sm:text-[40px] md:text-[58px]">
                See how Margin turns identified FBA discrepancies into review-ready reimbursement work.
              </h2>
              <p className="mx-auto mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[18px] md:leading-9">
                Follow the path from claim deadline review to evidence matching, filing approval, dispute handling, and payout reconciliation.
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
                  alt="Margin reimbursement workflow product demo thumbnail"
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
                  <div className="text-[10px] font-semibold uppercase tracking-tight text-white/78 md:text-[11px]">Discrepancy-to-workflow walkthrough</div>
                  <div className="mt-2 max-w-[780px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[36px]">
                    Amazon reimbursement work moves from validation to payout state with evidence and approval attached.
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
                Amazon does not just ask what happened. It asks you to prove it. Margin organizes invoices, BOLs, PODs, shipment IDs, ASIN/FNSKU records, carrier records, cost data, case history, settlement reports, and payout data into one evidence workflow.
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
              <h2 className={sectionHeadingClass}>From scattered proof to claim-ready evidence packs.</h2>
              <p className="mt-5 max-w-[760px] text-[20px] font-semibold leading-8 tracking-[-0.025em] text-[#25313A] md:text-[26px] md:leading-9">
                After a discrepancy is identified, Margin finds the records needed to support the claim, links them to the shipment or case, prepares the evidence pack for seller review, and tracks Amazon response through payout or escalation.
              </p>
              <p className={sectionBodyClass}>
                Evidence workflow: detect discrepancy -&gt; identify required evidence -&gt; locate matching documents -&gt; link proof to shipment or case -&gt; generate evidence pack -&gt; seller approves -&gt; track response -&gt; reconcile payout.
              </p>
              <p className={sectionBodyClass}>
                Each case stays tied to its evidence, deadline, approval, Amazon response, and payout context.
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

        <section className="relative border-y border-[#E4EDF1] bg-white py-16 md:py-28">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Evidence Readiness</div>
                <h2 className={sectionHeadingClass}>Know what is ready, what is missing, and when the claim window closes.</h2>
                <p className={sectionBodyClass}>
                  Margin scores each recovery case by evidence readiness so operators can see what can move, what needs proof, and what may expire soon.
                </p>
              </motion.div>

              <motion.div
                {...revealProps}
                className="rounded-[28px] border border-[#D8E3E8] bg-[#FAFAF7] p-6 shadow-[0_24px_70px_rgba(37,49,58,0.08)] md:p-8"
              >
                <div className="flex items-center justify-between gap-4 border-b border-[#D8E3E8] pb-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-tight text-[#7A8994]">Case readiness</div>
                    <div className="mt-2 text-[24px] font-semibold tracking-[-0.045em] text-[#182026]">Inbound shortage claim</div>
                  </div>
                  <div className="rounded-full bg-[#EAF6EF] px-4 py-2 text-[13px] font-bold text-[#2E7D5B]">
                    82% evidence-ready
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#D8E3E8] bg-white p-5">
                    <div className="text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">Missing proof</div>
                    <p className="mt-3 text-[15px] leading-7 text-[#4D5B66]">
                      Signed POD and supplier invoice cost breakdown.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#D8E3E8] bg-white p-5">
                    <div className="text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">Filing window</div>
                    <p className="mt-3 text-[15px] leading-7 text-[#4D5B66]">
                      12 days remaining before review risk increases.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[780px]">
              <div className={sectionLabelClass}>Before and After Margin</div>
              <h2 className={sectionHeadingClass}>Evidence-heavy claims stop living across five tools.</h2>
              <p className={sectionBodyClass}>
                Margin gives operators one place to see the proof, deadline, approval, Amazon response, and payout state behind a reimbursement claim.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <motion.div
                {...revealProps}
                className="rounded-[28px] border border-[#D8E3E8] bg-white p-6 md:p-8"
              >
                <div className="text-[11px] font-bold uppercase tracking-tight text-[#D76A3D]">Before Margin</div>
                <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-[#182026] md:text-[32px]">
                  Proof is scattered across the operation.
                </h3>
                <p className="mt-5 text-[15px] leading-7 text-[#66737F] md:text-[16px] md:leading-8">
                  Invoice in Gmail. POD in carrier portal. BOL in Drive. Case ID in Seller Central. Payout in settlement report. A VA tracking it all in Excel.
                </p>
              </motion.div>

              <motion.div
                {...revealProps}
                className="rounded-[28px] border border-[#BFD8EA] bg-white p-6 shadow-[0_24px_70px_rgba(11,116,222,0.08)] md:p-8"
              >
                <div className="text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">After Margin</div>
                <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.04em] text-[#182026] md:text-[32px]">
                  One claim-ready evidence pack.
                </h3>
                <p className="mt-5 text-[15px] leading-7 text-[#66737F] md:text-[16px] md:leading-8">
                  The reimbursement case is linked to shipment records, required documents, deadline state, seller approval, Amazon case status, and payout reconciliation.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <ScrollytellingCoverage />

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



        <section className="relative bg-[#F7F5F0] py-8 sm:bg-transparent sm:py-16 md:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <motion.div {...revealProps} className="hidden max-w-[560px] sm:block">
                <div className={sectionLabelClass}>Marketplace Scope</div>
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[42px] md:text-[58px]">
                  Supported FBA marketplaces
                </h2>
                <p className={sectionBodyClass}>
                  Margin supports FBA reimbursement workflows across major Amazon marketplaces in North America, Europe, and selected global regions.
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

        <section className="relative overflow-hidden py-28 md:py-40">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/3 hidden h-[500px] w-full bg-[radial-gradient(circle_at_50%_50%,rgba(11,116,222,0.06),transparent_60%)] md:block"
          />
          <div className={containerClass}>
            <div className="glass-card relative overflow-hidden rounded-[32px] p-8 md:p-16 lg:p-20 shadow-[0_32px_64px_rgba(0,0,0,0.08)] bg-white/60 backdrop-blur-3xl border border-white/40">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#0B74DE] to-transparent opacity-20" />
              <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <motion.div {...revealProps}>
                  <h2 className="font-serif-headline mt-2 max-w-[760px] text-[38px] font-bold leading-[1.02] tracking-tight text-[#182026] sm:text-[48px] md:text-[64px]">
                    Founding 500 Evidence Workflow Audit.
                  </h2>
                  <p className="mt-5 max-w-[740px] text-[17px] leading-[1.7] text-[#4d5b66] md:text-[19px]">
                    The first 500 sellers reserve founder pricing and priority activation for a one-time $99 fee. We help prepare, organize, and manage evidence-heavy reimbursement workflows with seller approval before filing. No recovery commissions.
                  </p>
                  
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handlePrimaryCta}
                      className="group relative h-14 w-full rounded-full bg-[#0B74DE] px-8 text-[15px] font-bold text-white shadow-[0_18px_40px_rgba(11,116,222,0.34)] transition-all duration-300 hover:scale-[1.02] sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-full" />
                      {primaryCtaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>

                <motion.div {...revealProps} className="grid gap-2">
                  {earlyAccessItems.map((item, index) => (
                    <div
                      key={item}
                      className="group relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-300 hover:bg-white/60 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B74DE]/10 text-[#0B74DE]">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </div>
                      <span className="text-[16px] font-medium leading-6 tracking-tight text-[#182026]">
                        {item}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
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
                  Turn scattered recovery proof into a claim-ready evidence pack.
                </h2>
                <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
                  Margin helps Amazon sellers prepare the evidence layer behind reimbursement work, from document matching and deadline tracking to seller approval, Amazon response, and payout reconciliation.
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
                  Review Evidence Workflow
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
        description="Watch how Margin manages Amazon reimbursement workflows after discrepancies are identified, from claim deadline review and evidence matching to filing, disputes, and payout reconciliation."
      />
      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
