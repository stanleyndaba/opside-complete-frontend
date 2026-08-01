import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  MessagesSquare,
  PlayCircle,
  Radar,
  UserCheck,
} from "lucide-react";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { DemoVideoModal } from "@/components/demo/DemoVideoModal";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { InhaleSection } from "@/components/landing/InhaleSection";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ScrollytellingCoverage } from "@/components/landing/ScrollytellingCoverage";
import { useOnboardingCapacity } from "@/hooks/useOnboardingCapacity";
import { ProgressiveNarrativeTabs } from "@/components/landing/ProgressiveNarrativeTabs";
import { SystemPerformanceTicker } from "@/components/landing/SystemPerformanceTicker";
import { ANALYTICS_EVENTS } from "@/lib/analyticsEvents";
import { trackEarlyAccessCtaClicked, trackEvent } from "@/lib/analytics";
const DEMO_VIDEO_URL = "https://youtu.be/B0ksWTlYbRo";
const DEMO_VIDEO_THUMBNAIL_URL = "/margin-logo-reveal.gif";
const RECOVERY_PREVIEW_VIDEO_URL = "/Evidentiary.mp4";
const DOCUMENT_ANALYSIS_VIDEO_URL = "/DocumentAnalysis.mp4";
const SUPER_EVIDENCE_VIDEO_URL = "/superEvidence.mp4";
const CASE_BUILDING_VIDEO_URL = "/CaseBuilding.mp4";
const CASES_TABLE_VIDEO_URL = "/CasesTable.mp4";
const FILING_VIDEO_URL = "/Filing.mp4";
const RECONCILIATION_VIDEO_URL = "/CasesTable.mp4";
const EVIDENCE_CALIBRATION_VIDEO_URL = "/EvidenceCalibration.mp4";
const REPLIES_PREVIEW_VIDEO_URL = "/Replies.mp4";
const APPEALS_PREVIEW_VIDEO_URL = "/2026-07-27__12_58_06_a_m_-Appeals_Scene.mp4";
const auditPulses = [
  { x: 8, y: 18, size: 9, color: "bg-blue-400", delay: 0.1, duration: 3.6 },
  { x: 18, y: 54, size: 7, color: "bg-emerald-400", delay: 1.4, duration: 4.2 },
  { x: 27, y: 30, size: 6, color: "bg-blue-300", delay: 2.2, duration: 3.8 },
  { x: 39, y: 68, size: 8, color: "bg-emerald-300", delay: 0.8, duration: 4.5 },
  { x: 48, y: 22, size: 7, color: "bg-blue-400", delay: 3.0, duration: 4.1 },
  {
    x: 59,
    y: 47,
    size: 10,
    color: "bg-emerald-400",
    delay: 1.1,
    duration: 3.9,
  },
  { x: 68, y: 74, size: 6, color: "bg-blue-300", delay: 2.8, duration: 4.6 },
  { x: 76, y: 28, size: 8, color: "bg-emerald-300", delay: 0.4, duration: 3.7 },
  { x: 84, y: 58, size: 7, color: "bg-blue-400", delay: 2.0, duration: 4.3 },
  { x: 92, y: 36, size: 6, color: "bg-emerald-400", delay: 3.4, duration: 4.0 },
  { x: 33, y: 84, size: 7, color: "bg-blue-300", delay: 1.8, duration: 3.9 },
];
const auditLines = [
  { left: 10, top: 22, width: 28, rotate: 18, delay: 0.4 },
  { left: 25, top: 54, width: 36, rotate: -10, delay: 1.6 },
  { left: 48, top: 32, width: 31, rotate: 14, delay: 2.7 },
  { left: 59, top: 66, width: 29, rotate: -20, delay: 3.4 },
  { left: 15, top: 76, width: 48, rotate: 7, delay: 4.3 },
];
const whyNowItems = [
  {
    title: "The claim window keeps closing",
    detail:
      "Once a discrepancy is found, the seller still has to prove the shipment, quantity, cost, case history, and payout before Amazon closes the window.",
  },
  {
    title: "Your proof stays scattered",
    detail:
      "The invoice is in email. The POD is in a carrier portal. The BOL is in Drive. The case ID is in Seller Central. None of it helps until it belongs to the same claim.",
  },
  {
    title: "Recoverable money quietly expires",
    detail:
      "A valid recovery can die because proof arrived late, Amazon asked again, or the payout never matched the approval.",
  },
];
const proofItems = [
  { title: "Before Amazon asks...", detail: "Know what is ready." },
  { title: "What is missing", detail: "See the proof gap." },
  {
    title: "What is about to expire",
    detail: "Move before the window closes.",
  },
  {
    title: "One recovery story",
    detail:
      "Each case is tracked from evidence pack to Amazon response, payout, dispute, or blocker.",
  },
];
const velocityMetrics = [
  {
    label: "Before Amazon asks...",
    value: 3,
    suffix: "min",
    detail: "Know what is ready.",
  },
  {
    label: "What is missing",
    value: 1,
    suffix: "min",
    detail: "See the proof gap.",
  },
  {
    label: "What is about to expire",
    value: 16,
    suffix: "s",
    detail: "Move before the window closes.",
  },
];
const workflowSteps = [
  {
    step: "01",
    title: "The discrepancy is found",
    detail:
      "The money may be there, but a detected issue is not a recoverable case yet.",
  },
  {
    step: "02",
    title: "Amazon needs proof",
    detail:
      "The invoice, BOL, POD, shipment ID, carrier record, cost basis, case history, and payout record all have to line up.",
  },
  {
    step: "03",
    title: "The proof is everywhere",
    detail:
      "One record sits in Gmail, another in Drive, another in Seller Central, another in a carrier portal.",
  },
  {
    step: "04",
    title: "The case becomes defensible",
    detail: "The evidence becomes one recovery story Amazon can verify.",
  },
  {
    step: "05",
    title: "The seller stays in control",
    detail: "Nothing moves until the seller approves it.",
  },
  {
    step: "06",
    title: "Amazon responds",
    detail:
      "Amazon asks again. Rejects. Approves less. Or requests more proof.",
  },
  {
    step: "07",
    title: "The payout has to reconcile",
    detail:
      "Amazon approval is not the end. Margin tracks whether the approved amount actually reaches the seller balance and prepares the recovery trail for accounting review.",
  },
];
const stateTransitionSources = ["Gmail", "Drive", "Seller Central", "Excel"];
const systemLogEntries = [
  { label: "SIGNAL", text: "Which discrepancies appeared today?" },
  { label: "TRACE", text: "Rebuild shipment history for FBA15J." },
  { label: "EVIDENCE", text: "Show every document behind this claim." },
  {
    label: "VALIDATION",
    text: "Does the carrier manifest match the packing list?",
  },
  { label: "TIMELINE", text: "Which cases expire this week?" },
  { label: "LEDGER", text: "Explain why this payout does not reconcile." },
  { label: "LEDGER", text: "Prepare this recovered payout for QuickBooks." },
  { label: "RISK", text: "What am I still missing before filing?" },
  { label: "RECOVERY", text: "Which claims are ready for seller review?" },
  { label: "RESPONSE", text: "Why was this reimbursement rejected?" },
  { label: "AUDIT", text: "Show the chain of custody for this claim." },
  { label: "SHIPMENT", text: "Why was this shipment received short?" },
  { label: "EVIDENCE", text: "Find every missing POD." },
  { label: "TRACE", text: "Where is this invoice linked?" },
  {
    label: "VALIDATION",
    text: "Confirm the shipped units against FC receiving.",
  },
  { label: "TIMELINE", text: "Show the recovery window for this case." },
  { label: "LEDGER", text: "Which settlements do not match approvals?" },
  {
    label: "LEDGER",
    text: "Show which reimbursements are ready for Xero export.",
  },
  { label: "RISK", text: "Which claims need stronger proof?" },
  { label: "RECOVERY", text: "Prepare this case for Amazon review." },
  { label: "RESPONSE", text: "Which Amazon cases changed status?" },
  { label: "AUDIT", text: "Verify the evidence chain before submission." },
  { label: "SHIPMENT", text: "Show every carrier exception for this inbound." },
  { label: "SIGNAL", text: "Explain this inventory variance." },
  { label: "TRACE", text: "Map supplier dispatch to Amazon receiving." },
  { label: "EVIDENCE", text: "Show supplier documentation for this shipment." },
  {
    label: "VALIDATION",
    text: "Check whether the payout matches the approved amount.",
  },
  {
    label: "TIMELINE",
    text: "Reconstruct the last 42 days of recovery history.",
  },
  { label: "LEDGER", text: "Where did approved reimbursement go?" },
  { label: "RISK", text: "Which cases are blocked by missing cost basis?" },
  { label: "RECOVERY", text: "Which recoveries still need approval?" },
  { label: "RESPONSE", text: "Monitor Case #8821 for Amazon response." },
  { label: "AUDIT", text: "What proof supports this escalation?" },
  { label: "SHIPMENT", text: "Which cartons diverged from received quantity?" },
  {
    label: "SIGNAL",
    text: "Which reimbursement candidates appeared after reconciliation?",
  },
  { label: "TRACE", text: "Link carrier weight logs to warehouse dispatch." },
  { label: "EVIDENCE", text: "Find the invoice behind this ASIN cost basis." },
  { label: "VALIDATION", text: "Clear duplicate claim risk before filing." },
];
const systemLogRows = [
  {
    direction: "left",
    duration: "68s",
    hoverDuration: "96s",
    items: systemLogEntries.slice(0, 12),
  },
  {
    direction: "right",
    duration: "78s",
    hoverDuration: "108s",
    items: systemLogEntries.slice(12, 24),
  },
  {
    direction: "left",
    duration: "88s",
    hoverDuration: "120s",
    items: systemLogEntries.slice(24),
  },
];
function TypewriterPrompt({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : "");
  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      return;
    }
    setVisibleText("");
    let index = 0;
    let interval: number | undefined;
    const startDelay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
        }
      }, 34);
    }, 520);
    return () => {
      window.clearTimeout(startDelay);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);
  return (
    <span>
      {" "}
      {visibleText}{" "}
      <motion.span
        aria-hidden="true"
        className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[var(--margin-text-primary)]"
        animate={reduceMotion ? undefined : { opacity: [1, 0, 1] }}
        transition={{ duration: 0.86, repeat: Infinity, ease: "linear" }}
      />{" "}
    </span>
  );
}
const marketplaceCountries = [
  { country: "United States", code: "US", flagCode: "us", region: "Americas" },
  { country: "Canada", code: "CA", flagCode: "ca", region: "Americas" },
  { country: "Mexico", code: "MX", flagCode: "mx", region: "Americas" },
  { country: "United Kingdom", code: "UK", flagCode: "gb", region: "Europe" },
  { country: "Germany", code: "DE", flagCode: "de", region: "Europe" },
  { country: "France", code: "FR", flagCode: "fr", region: "Europe" },
  { country: "Italy", code: "IT", flagCode: "it", region: "Europe" },
  { country: "Spain", code: "ES", flagCode: "es", region: "Europe" },
  { country: "Netherlands", code: "NL", flagCode: "nl", region: "Europe" },
  { country: "Poland", code: "PL", flagCode: "pl", region: "Europe" },
  { country: "Japan", code: "JP", flagCode: "jp", region: "Asia Pacific" },
  { country: "Australia", code: "AU", flagCode: "au", region: "Asia Pacific" },
];
const trustControls = [
  {
    title: "Margin maps your recovery operation before touching a single case.",
    detail:
      "We connect evidence, shipments, deadlines, and recovery history before any workflow begins.",
  },
  {
    title: "Margin prepares every case. You approve the decision.",
    detail:
      "Evidence is assembled, validated, and made filing-ready before you decide whether it moves.",
  },
  {
    title: "Margin keeps strengthening cases until they are ready.",
    detail:
      "It finds missing proof, follows Amazon responses, updates evidence, prepares follow-ups, and rebuilds rejected cases.",
  },
  {
    title: "Amazon decides reimbursements. Margin doesn't stop working.",
    detail:
      "We continue organizing evidence, handling follow-up requests, tracking responses, and reconciling payouts until the recovery reaches its natural conclusion.",
  },
];
const earlyAccessItems = [
  "Seller Approval Before Filing",
  "Evidence linked automatically",
  "Deadline tracking",
  "Accounting-ready reconciliation",
  "Payout trail kept with the recovery",
];
const securityFeatures = [
  "Official Amazon OAuth",
  "Read-only audit access",
  "No filing without approval",
  "Encrypted data in transit",
  "Disconnect anytime",
];
const outperformanceCards = [
  {
    title: "Built around Amazon reimbursement truth",
    points: [
      "Designed for shortages, lost or damaged inventory, settlement gaps, and evidence requests.",
      "Maps every signal back to the claim Amazon actually needs to review.",
    ],
    logos: [
      { src: "/amazon-logo-transparent-circle.png", alt: "Amazon" },
      { src: "/logoimagetwo.png", alt: "Margin" },
    ],
  },
  {
    title: "Evidence graph before filing",
    points: [
      "Connects invoices, BOLs, PODs, carrier records, Gmail, Drive, and Seller Central.",
      "Shows what is ready, missing, risky, or waiting for seller approval.",
    ],
    logos: [
      { src: "/gmailicon.png", alt: "Gmail" },
      { src: "/gd.png", alt: "Google Drive" },
      { src: "/amazon-logo-transparent-circle.png", alt: "Amazon" },
    ],
  },
  {
    title: "Seller-approved recovery control",
    points: [
      "Prepares the case without removing the seller from the decision.",
      "Keeps filing, replies, resubmissions, and follow-ups visible.",
    ],
    logos: [
      { src: "/logoimagetwo.png", alt: "Margin" },
      { src: "/amazon-logo-transparent-circle.png", alt: "Amazon" },
    ],
  },
  {
    title: "Reconciliation beyond approval",
    points: [
      "Tracks whether the approved amount actually lands in settlement.",
      "Leaves an accounting-ready trail for QuickBooks and Xero review.",
    ],
    logos: [
      { src: "/quickbooks.png", alt: "QuickBooks" },
      { src: "/xero.png", alt: "Xero" },
      { src: "/logoimagetwo.png", alt: "Margin" },
    ],
  },
];
const faqs = [
  {
    question: "What does the free audit access?",
    answer:
      "The audit reviews reimbursement-related Amazon activity such as shipments, inventory events, settlement lines, fees, refunds, case signals, and supporting proof. It is designed to show what Margin finds before you activate the recovery workspace.",
  },
  {
    question: "Is the Amazon connection read-only?",
    answer:
      "Yes. Margin begins with read-only audit access through Amazon's official authorization process. The audit does not change your seller account.",
  },
  {
    question: "Can Margin file anything without my approval?",
    answer:
      "No. Margin can prepare the recovery path, evidence trail, and filing package, but no claim is filed without seller approval.",
  },
  {
    question: "How long does the audit take?",
    answer:
      "Most sellers can start the audit in minutes after connecting Amazon. The full picture depends on account history, data volume, and how many recoveries need evidence review.",
  },
  {
    question: "What happens when Margin finds a recovery?",
    answer:
      "Margin shows the finding, the estimated recovery context, the proof already connected, what is missing, and whether the recovery is ready for seller review.",
  },
  {
    question: "Can I use Margin alongside another recovery provider?",
    answer:
      "Yes. Margin is built around evidence control, response continuity, and payout reconciliation, so it can sit alongside another provider or internal recovery process.",
  },
  {
    question: "Which Amazon marketplaces does Margin support?",
    answer:
      "Margin currently supports sellers across the United States, Canada, Mexico, United Kingdom, Germany, France, Italy, Spain, Netherlands, Poland, Japan, and Australia. Additional regions will be added over time.",
  },
  {
    question: "What if Amazon rejects my claim?",
    answer:
      "Margin keeps the proof, timeline, and response trail attached so the case can be rebuilt instead of starting from scratch.",
  },
  {
    question: "What if Amazon asks for more proof?",
    answer:
      "Margin flags the missing proof, links the right records, and keeps the case moving until the response can be answered.",
  },
  {
    question: "What if Amazon approves less than expected?",
    answer:
      "Margin keeps the payout in view so the approved amount can be compared against what actually reached the seller balance.",
  },
  {
    question: "What is an evidence pack?",
    answer:
      "An evidence pack is the claim-ready set of records behind a reimbursement case: invoices, BOLs, PODs, shipment records, cost data, Amazon case history, seller approval, and payout context.",
  },
  {
    question: "What happens if my invoice, POD, or BOL is missing?",
    answer:
      "Margin flags the missing proof before filing so the case can be completed, held, or reviewed instead of submitting weak evidence and risking rejection.",
  },
  {
    question: "Does Margin connect to QuickBooks or Xero?",
    answer:
      "Yes. Margin is adding QuickBooks and Xero support so recovered reimbursements can be tied back to payout records and prepared for accounting review. The goal is to keep the recovery trail clean from Amazon case evidence to settlement reconciliation to accounting export.",
  },
  {
    question: "Will Margin change my accounting records automatically?",
    answer:
      "No. Margin's accounting workflow is designed around visibility, reconciliation, and seller approval. Accounting exports or synced records should only move when the seller approves the action.",
  },
];
const integrationLogos = [
  { name: "Amazon", src: "/Amazon-logo.png", className: "h-6 w-auto md:h-7" },
  { name: "Gmail", src: "/gmailicon.png", className: "h-7 w-auto md:h-8" },
  { name: "Outlook", src: "/outlookicon.webp", className: "h-7 w-auto md:h-8" },
  { name: "Google Drive", src: "/gd.png", className: "h-7 w-auto md:h-8" },
  {
    name: "Dropbox",
    src: "/Dropbox_Icon.svg.png",
    className: "h-7 w-auto md:h-8",
  },
  { name: "OneDrive", src: "/onedriive.png", className: "h-7 w-auto md:h-8" },
  {
    name: "QuickBooks",
    src: "/quickbooks.png",
    className: "h-7 w-auto md:h-8",
  },
  { name: "Xero", src: "/xero.png", className: "h-7 w-auto md:h-8" },
  { name: "Adobe Sign", src: "/dobe.png", className: "h-7 w-auto md:h-8" },
  {
    name: "Slack",
    src: "/slack-icon-2019.png",
    className: "h-7 w-auto md:h-8",
  },
];
const containerClass = "mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8";
const demoContainerClass = "mx-auto w-full max-w-[1240px] px-5 sm:px-6 md:px-8";
const postHeroSectionClass =
  "relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-20";
const demoFrameClass =
  "margin-product-surface relative -mx-5 overflow-hidden border-y border-[var(--margin-border)] bg-[var(--margin-surface)] shadow-[0_18px_48px_rgba(27,28,32,0.045)] sm:mx-0 sm:rounded-[12px] sm:border";
const demoTitleClass =
  "mt-3 text-[28px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[34px] md:text-[40px]";
const demoBodyClass =
  "mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8";
const demoClosingClass =
  "mt-4 max-w-[500px] text-[18px] font-semibold leading-[1.18] tracking-[-0.035em] text-[var(--margin-text-muted)] md:text-[21px]";
const sectionLabelClass =
  "text-[11px] font-semibold tracking-tight text-[var(--margin-text-muted)]";
const sectionHeadingClass =
  "mt-4 max-w-[880px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[58px]";
const sectionBodyClass =
  "mt-5 max-w-[740px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8";
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

function DemoVideoFrame({
  src,
  label,
}: {
  src: string;
  label: string;
  stage?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const isNearView = useInView(frameRef, {
    margin: "640px 0px 640px 0px",
  });
  const isPlayingView = useInView(frameRef, {
    amount: 0.22,
    margin: "120px 0px 120px 0px",
  });
  const shouldLoad = isNearView || reduceMotion;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduceMotion || !isPlayingView) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => undefined);
    }
  }, [isPlayingView, reduceMotion, shouldLoad]);

  return (
    <div ref={frameRef} className={demoFrameClass}>
      <div className="aspect-video">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFFFFF_0%,#F6F9FB_100%)]" aria-hidden="true" />
        <video
          ref={videoRef}
          className="relative h-full w-full object-contain"
          src={shouldLoad ? src : undefined}
          aria-label={label}
          autoPlay={!reduceMotion}
          muted
          loop={!reduceMotion}
          playsInline
          preload={shouldLoad ? "metadata" : "none"}
        />
      </div>
    </div>
  );
}
function IntegrationsCarousel({ isMobileLayout }: { isMobileLayout: boolean }) {
  return (
    <motion.div {...revealProps}>
      <div className="relative flex items-center justify-center py-1 md:py-2">
        <motion.div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 origin-center bg-gradient-to-r from-transparent via-[var(--margin-border)] to-transparent"
          initial={{ scaleX: 0.55, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative z-10 mx-auto inline-flex rounded-full border border-[var(--margin-border)] bg-white px-4 py-1.5 text-[11px] font-semibold tracking-tight text-[var(--margin-text-secondary)]">
          Proof sources sellers already have
        </div>
      </div>
      <div className="relative mt-5 overflow-hidden md:mt-7">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--margin-canvas)] to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--margin-canvas)] to-transparent md:w-28" />
        <motion.div
          className="flex w-max items-center gap-8 px-2 md:gap-12 md:px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: isMobileLayout ? 25.3 : 34.5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[...integrationLogos, ...integrationLogos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-12 w-[78px] shrink-0 items-center justify-center rounded-2xl border border-[var(--margin-border-subtle)] bg-white/82 shadow-[0_12px_28px_rgba(37,49,58,0.04)] md:h-16 md:w-[116px]"
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

type EvidenceOrchestratorPoint = { x: number; y: number };

type EvidenceOrchestratorSource = {
  id: string;
  name: string;
  icon?: string;
  Icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  shortName: string;
  evidence: string[];
  x: number;
  y: number;
  laneX: number;
  delay: number;
};

const evidenceOrchestratorMarginNode: EvidenceOrchestratorPoint = { x: 20, y: 50 };
const evidenceOrchestratorIntakePoint: EvidenceOrchestratorPoint = { x: 32, y: 50 };
const evidenceOrchestratorTrunkX = 54;

const evidenceOrchestratorSources: EvidenceOrchestratorSource[] = [
  {
    id: "amazon",
    name: "Amazon",
    icon: "/amazon-logo-transparent-circle.png",
    shortName: "Amazon",
    evidence: ["Orders", "Ledger"],
    x: 70,
    y: 16,
    laneX: 58,
    delay: 0.2,
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "/gmailicon.png",
    shortName: "Gmail",
    evidence: ["Email", "Invoice"],
    x: 63,
    y: 29,
    laneX: 54,
    delay: 0.45,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    icon: "/gd.png",
    shortName: "Drive",
    evidence: ["Manifest", "PDF"],
    x: 85,
    y: 24,
    laneX: 62,
    delay: 0.7,
  },
  {
    id: "slack",
    name: "Slack",
    icon: "/slack-icon-2019.png",
    shortName: "Slack",
    evidence: ["Message", "Note"],
    x: 72,
    y: 44,
    laneX: 58,
    delay: 0.95,
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: "/outlookicon.webp",
    shortName: "Outlook",
    evidence: ["Thread", "BOL"],
    x: 87,
    y: 50,
    laneX: 62,
    delay: 1.2,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "/Dropbox_Icon.svg.png",
    shortName: "Dropbox",
    evidence: ["Archive", "CSV"],
    x: 78,
    y: 67,
    laneX: 58,
    delay: 1.45,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    icon: "/onedriive.png",
    shortName: "OneDrive",
    evidence: ["Report", "POD"],
    x: 91,
    y: 71,
    laneX: 62,
    delay: 1.7,
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    icon: "/quickbooks.png",
    shortName: "QuickBooks",
    evidence: ["Invoice", "Books"],
    x: 79,
    y: 80,
    laneX: 60,
    delay: 1.95,
  },
  {
    id: "xero",
    name: "Xero",
    icon: "/xero.png",
    shortName: "Xero",
    evidence: ["Payout", "Ledger"],
    x: 71,
    y: 91,
    laneX: 56,
    delay: 2.2,
  },
  {
    id: "adobe-sign",
    name: "Adobe Sign",
    icon: "/dobe.png",
    shortName: "Adobe",
    evidence: ["Signature", "Proof"],
    x: 62,
    y: 84,
    laneX: 52,
    delay: 1.95,
  },
];

function evidenceOrchestratorRoute(source: EvidenceOrchestratorSource): EvidenceOrchestratorPoint[] {
  return [
    { x: source.x, y: source.y },
    { x: source.laneX, y: source.y },
    { x: source.laneX, y: evidenceOrchestratorMarginNode.y },
    evidenceOrchestratorIntakePoint,
    evidenceOrchestratorMarginNode,
  ];
}

function evidenceOrchestratorPath(points: EvidenceOrchestratorPoint[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * 10} ${point.y * 6.4}`).join(" ");
}

function EvidenceOrchestratorSourceNode({
  source,
  reduceMotion,
}: {
  source: EvidenceOrchestratorSource;
  reduceMotion: boolean;
}) {
  const SourceIcon = source.Icon;

  return (
    <div
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${source.x}%`, top: `${source.y}%` }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.94 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: reduceMotion ? 0 : source.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-1.5"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E1EAF0] bg-white shadow-[0_14px_34px_rgba(37,49,58,0.08)] sm:h-14 sm:w-14">
          {source.icon ? (
            <img src={source.icon} alt={source.name} className="h-[62%] w-[62%] object-contain" />
          ) : SourceIcon ? (
            <SourceIcon className="h-5 w-5 text-[var(--margin-blue)] sm:h-6 sm:w-6" strokeWidth={1.9} />
          ) : (
            <span className="text-[10px] font-semibold tracking-tight text-[var(--margin-blue)]">{source.shortName}</span>
          )}
        </div>
        <span className="hidden text-[10px] font-semibold tracking-tight text-[var(--margin-text-secondary)] sm:block">{source.name}</span>
      </motion.div>
    </div>
  );
}

function EvidenceOrchestratorToken({
  source,
  label,
  tokenIndex,
  reduceMotion,
}: {
  source: EvidenceOrchestratorSource;
  label: string;
  tokenIndex: number;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  const route = evidenceOrchestratorRoute(source);
  const lastIndex = route.length - 1;

  return (
    <motion.div
      initial={{ left: `${source.x}%`, top: `${source.y}%`, opacity: 0, scale: 0.86 }}
      whileInView={{
        left: route.map((point) => `${point.x}%`),
        top: route.map((point) => `${point.y}%`),
        opacity: route.map((_, index) => (index === 0 || index === lastIndex ? 0 : 1)),
        scale: route.map((_, index) => (index >= lastIndex - 1 ? 0.72 : 1)),
      }}
      viewport={{ once: false, amount: 0.35 }}
      transition={{
        duration: 6.8,
        delay: source.delay + 1.05 + tokenIndex * 0.7,
        repeat: Infinity,
        repeatDelay: 1.8,
        times: route.map((_, index) => (index === lastIndex ? 1 : (index / (lastIndex - 1)) * 0.9)),
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-[6px] border border-[#D9E5EC] bg-white px-2 py-1 text-[9px] font-semibold tracking-tight text-[var(--margin-text-secondary)] shadow-[0_12px_24px_rgba(37,49,58,0.08)]"
    >
      {label}
    </motion.div>
  );
}

function EvidenceSourcesOrchestrator() {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <motion.div {...revealProps} className="mx-auto max-w-[1040px]">
      <div className="relative overflow-hidden border-y border-[var(--margin-border)] bg-white py-4 sm:py-6 md:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(11,116,222,0.045),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(46,125,91,0.04),transparent_28%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.32]"
          style={{
            backgroundImage: "radial-gradient(rgba(148,163,184,0.32) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <section
          className="relative h-[420px] w-full sm:h-[520px] md:h-[600px]"
          aria-label="Scattered reimbursement evidence organized into one Margin case"
        >
          <div className="absolute right-4 top-4 hidden text-[10px] font-semibold tracking-tight text-[var(--margin-text-muted)] sm:block">
            Evidence orchestration
          </div>

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 640"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.path
              d={evidenceOrchestratorPath([
                { x: evidenceOrchestratorTrunkX, y: 16 },
                { x: evidenceOrchestratorTrunkX, y: 84 },
              ])}
              fill="none"
              stroke="#D4E0E8"
              strokeWidth="1"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.72 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: reduceMotion ? 0 : 1.45, duration: 0.9, ease: "easeOut" }}
            />
            <motion.path
              d={evidenceOrchestratorPath([
                { x: evidenceOrchestratorTrunkX, y: evidenceOrchestratorMarginNode.y },
                evidenceOrchestratorIntakePoint,
                evidenceOrchestratorMarginNode,
              ])}
              fill="none"
              stroke="#AFC5D4"
              strokeWidth="1.2"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.9 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: reduceMotion ? 0 : 1.6, duration: 0.9, ease: "easeOut" }}
            />

            {evidenceOrchestratorSources.map((source) => (
              <motion.path
                key={source.id}
                d={evidenceOrchestratorPath(evidenceOrchestratorRoute(source).slice(0, -1))}
                fill="none"
                stroke="#C9D9E4"
                strokeWidth="1"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.66 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: reduceMotion ? 0 : source.delay + 0.35, duration: 0.95, ease: "easeOut" }}
              />
            ))}

            {Array.from(new Set([evidenceOrchestratorTrunkX, ...evidenceOrchestratorSources.map((source) => source.laneX)])).map((x) => (
              <circle key={x} cx={x * 10} cy={evidenceOrchestratorMarginNode.y * 6.4} r="3.5" fill="white" stroke="#AFC5D4" strokeWidth="1" />
            ))}
          </svg>

          <div
            className="absolute z-50 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${evidenceOrchestratorMarginNode.x}%`, top: `${evidenceOrchestratorMarginNode.y}%` }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
              whileInView={{
                opacity: 1,
                scale: reduceMotion ? 1 : [1, 1, 1.06, 1],
                borderColor: reduceMotion ? "#D8E3EA" : ["#D8E3EA", "#D8E3EA", "var(--margin-blue)", "#D8E3EA"],
              }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                opacity: { delay: reduceMotion ? 0 : 0.1, duration: 0.45, ease: "easeOut" },
                scale: { delay: reduceMotion ? 0 : 4.5, duration: 0.8 },
                borderColor: { delay: reduceMotion ? 0 : 4.5, duration: 0.8 },
              }}
              className="flex h-20 w-20 items-center justify-center rounded-[18px] border bg-white shadow-[0_22px_56px_rgba(37,49,58,0.12)] sm:h-24 sm:w-24"
            >
              <img src="/logoimagetwo.png" alt="Margin" className="h-7 w-auto object-contain sm:h-9" />
            </motion.div>
            <div className="absolute -bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-tight text-[var(--margin-text-secondary)] sm:block">
              Margin case file
            </div>
          </div>

          {evidenceOrchestratorSources.map((source) => (
            <EvidenceOrchestratorSourceNode key={source.id} source={source} reduceMotion={reduceMotion} />
          ))}

          {evidenceOrchestratorSources.flatMap((source) =>
            source.evidence.map((label, tokenIndex) => (
              <EvidenceOrchestratorToken
                key={`${source.id}-${label}-${tokenIndex}`}
                source={source}
                label={label}
                tokenIndex={tokenIndex}
                reduceMotion={reduceMotion}
              />
            )),
          )}
        </section>
      </div>
    </motion.div>
  );
}

function RecoveryPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="max-w-[500px]">
            <div className={sectionLabelClass}>Verify what Amazon owes</div>
            <h2 className={demoTitleClass}>
              Find the financial exceptions that deserve action.
            </h2>
            <p className={demoClosingClass}>
              Prioritized by value, deadline, evidence readiness and financial risk.
            </p>
            <p className={demoBodyClass}>
              Margin audits shipment, inventory, return, fee, reimbursement and
              settlement activity to identify potential recoveries, valuation
              differences, underpayments and reversals before they disappear
              into reports or expire.
            </p>
          </motion.div>

          <motion.div {...revealProps} className="relative">
            <DemoVideoFrame
              src={RECOVERY_PREVIEW_VIDEO_URL}
              label="Margin 10-second recovery preview"
              stage="Recovery Found"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DocumentIntelligencePreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={DOCUMENT_ANALYSIS_VIDEO_URL}
              label="Margin document intelligence preview"
              stage="Evidence Ready"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Document Intelligence</div>
            <h2 className={demoTitleClass}>
              Every document becomes evidence.
            </h2>
            <p className={demoBodyClass}>
              Margin connects to the platforms where your recovery records
              already exist, extracts the information that matters, and links
              every invoice, POD, BOL, shipment record, carrier update, and
              settlement to the recovery it supports.
            </p>
            <p className={demoClosingClass}>
              No manual searching. No copying data between systems. Every
              document ready when Amazon asks for proof.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RepliesPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="max-w-[500px]">
            <div className={sectionLabelClass}>Control the response</div>
            <h2 className={demoTitleClass}>
              Keep every request, rejection and decision on one timeline.
            </h2>
            <p className={demoBodyClass}>
              When Amazon asks for more information, rejects a case, approves
              partially or changes its position, Margin preserves the full case
              history, identifies the next evidence gap and prepares the
              response for seller review.
            </p>
            <p className={demoClosingClass}>
              No lost context. No duplicated work. Nothing submitted without approval.
            </p>
          </motion.div>

          <motion.div {...revealProps} className="relative">
            <DemoVideoFrame
              src={REPLIES_PREVIEW_VIDEO_URL}
              label="Margin Amazon replies management preview"
              stage="Amazon Response"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AppealsPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={APPEALS_PREVIEW_VIDEO_URL}
              label="Margin recovery appeals preview"
              stage="Amazon Response"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Recovery Appeals</div>
            <h2 className={demoTitleClass}>
              Rejected cases don&apos;t stop. Margin rebuilds them.
            </h2>
            <p className={demoBodyClass}>
              When Amazon rejects a recovery, Margin analyzes the response,
              gathers the missing evidence, rebuilds the case, and prepares it
              for resubmission automatically—keeping the recovery moving without
              starting over.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)] md:text-[14px]">
              {[
                "Rejections rebuilt automatically",
                "Stronger evidence prepared",
                "Recovery continues without starting over",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[var(--margin-blue)]" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </div>
            <p className={demoClosingClass}>
              The recovery keeps moving—even when Amazon says no.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SupportingEvidencePreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={SUPER_EVIDENCE_VIDEO_URL}
              label="Margin supporting evidence matching preview"
              stage="Evidence Ready"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Build the evidence</div>
            <h2 className={demoTitleClass}>
              Turn scattered records into a recovery Amazon can evaluate.
            </h2>
            <p className={demoBodyClass}>
              Margin connects the shipment records, quantities, SKUs, invoices,
              BOLs, PODs, receiving data, cost basis, policy references and
              deadlines behind each recovery.
            </p>
            <p className={demoClosingClass}>
              The relevant proof, attached to the correct issue, before filing.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CaseBuildingPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={CASE_BUILDING_VIDEO_URL}
              label="Margin case building preview"
              stage="Evidence Ready"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Case Building</div>
            <h2 className={demoTitleClass}>
              Your recovery is already prepared.
            </h2>
            <p className={demoBodyClass}>
              Margin brings the evidence together, builds the recovery case, and
              prepares a complete review package you can download, share,
              archive, or submit when you&apos;re ready. Every recovery stays
              organized from the first discrepancy to the final payout.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)] md:text-[14px]">
              {[
                "Evidence already attached",
                "Recovery timeline included",
                "Download or share anytime",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[var(--margin-blue)]" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </div>
            <p className={demoClosingClass}>
              Nothing left to assemble. Everything ready to review.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryOrchestrationPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="max-w-[520px]">
            <div className={sectionLabelClass}>Recovery Orchestration</div>
            <h2 className={demoTitleClass}>
              Every recovery keeps moving—even when you don&apos;t.
            </h2>
            <p className={demoBodyClass}>
              Once a recovery is created, Margin keeps it moving. Cases are
              tracked automatically, missing requirements are blocked before
              submission, and every recovery progresses through the workflow
              until it&apos;s resolved. Nothing gets forgotten. Nothing falls
              through the cracks.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)] md:text-[14px]">
              {[
                "Cases tracked automatically",
                "Incomplete submissions prevented",
                "Every recovery monitored end-to-end",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[var(--margin-blue)]" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </div>
            <p className={demoClosingClass}>
              Built once. Managed until it&apos;s finished.
            </p>
          </motion.div>

          <motion.div {...revealProps} className="relative">
            <DemoVideoFrame
              src={CASES_TABLE_VIDEO_URL}
              label="Margin recovery orchestration preview"
              stage="Seller Approval"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SellerControlledFilingPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={FILING_VIDEO_URL}
              label="Margin seller-controlled filing preview"
              stage="Seller Approval"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Seller-Controlled Filing</div>
            <h2 className={demoTitleClass}>
              Nothing gets filed without your approval.
            </h2>
            <p className={demoBodyClass}>
              When a recovery is ready, Margin notifies you for review before
              anything is submitted. After approval, the filing is tracked
              automatically, keeping every Amazon response, status change, and
              next step connected until the recovery is resolved.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)] md:text-[14px]">
              {[
                "Seller approval before filing",
                "Automatic case tracking",
                "Every Amazon update in one place",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[var(--margin-blue)]" strokeWidth={2.4} />
                  {item}
                </span>
              ))}
            </div>
            <p className={demoClosingClass}>
              You stay in control. Margin keeps the recovery moving.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PayoutReconciliationPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="relative order-2 lg:order-1">
            <DemoVideoFrame
              src={RECONCILIATION_VIDEO_URL}
              label="Margin payout reconciliation preview"
              stage="Payout Reconciled"
            />
          </motion.div>

          <motion.div {...revealProps} className="order-1 max-w-[520px] lg:order-2 lg:justify-self-end">
            <div className={sectionLabelClass}>Reconcile the money</div>
            <h2 className={demoTitleClass}>
              Confirm that the correct payout actually reached the business.
            </h2>
            <p className={demoBodyClass}>
              Margin connects the approved recovery to reimbursement and
              settlement activity, compares expected value with paid value,
              flags underpayments and later reversals, and keeps an
              accounting-ready record of the final outcome.
            </p>
            <p className={demoClosingClass}>
              Approval is not the finish line. Reconciled cash is.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EvidenceCalibrationPreviewSection() {
  return (
    <section className={postHeroSectionClass}>
      <div className={demoContainerClass}>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10">
          <motion.div {...revealProps} className="max-w-[520px]">
            <div className={sectionLabelClass}>Evidence Calibration</div>
            <h2 className={demoTitleClass}>
              Stronger cases. Better approval odds.
            </h2>
            <p className={demoBodyClass}>
              <strong className="font-semibold text-[var(--margin-text-primary)]">Every approved case teaches the next one.</strong>{" "}
              Margin remembers which evidence helped claims get approved, what
              caused rejections, and what Amazon asked for—so future recoveries
              start with stronger evidence before they&apos;re ever filed.
            </p>
            <p className={demoClosingClass}>
              Every case makes the next one stronger.
            </p>
          </motion.div>

          <motion.div {...revealProps} className="relative">
            <DemoVideoFrame
              src={EVIDENCE_CALIBRATION_VIDEO_URL}
              label="Margin evidence calibration preview"
              stage="Payout Reconciled"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const marginIdentityCards = [
  {
    image: "/Discover.png",
    title: "Finds money you didn't know you lost.",
    body:
      "Every shipment, inventory movement, settlement, and reimbursement is continuously audited—so missing money doesn't stay hidden.",
  },
  {
    image: "/BuildsCase.png",
    title: "Builds the case Amazon expects.",
    body:
      "Invoices, shipment records, receiving logs, carrier proof, and policy references are automatically connected into one recovery before filing begins.",
  },
  {
    image: "/Recover.png",
    title: "Stays with every recovery until you're paid.",
    body:
      "Amazon asks questions. Rejects claims. Approves partial payouts. Margin keeps everything connected until the recovery is finished.",
  },
];

const orchestrationSources = [
  { name: "Amazon", image: "/amazon-logo-transparent-circle.png", top: "14%", left: "5%", delay: 0 },
  { name: "Gmail", image: "/gmailicon.png", top: "30%", left: "10%", delay: 0.22 },
  { name: "Drive", image: "/Driveboy.png", top: "70%", left: "7%", delay: 0.44 },
  { name: "Dropbox", image: "/Dropbox_Icon.svg.png", top: "20%", left: "20%", delay: 0.66 },
  { name: "Slack", image: "/slack-icon-2019.png", top: "50%", left: "18%", delay: 0.88 },
  { name: "OneDrive", image: "/onedrivelogo.png", top: "80%", left: "23%", delay: 1.1 },
  { name: "QuickBooks", image: "/quickbooks.png", top: "36%", left: "30%", delay: 1.32 },
  { name: "Xero", image: "/xero.png", top: "62%", left: "31%", delay: 1.54 },
  { name: "Invoice", image: "/quickbooks.png", top: "10%", left: "36%", delay: 1.76 },
  { name: "Settlement", image: "/xero.png", top: "86%", left: "38%", delay: 1.98 },
];

const orchestrationOutputs = [
  { label: "Evidence pack ready", tone: "REVIEW", lane: -150, delay: 0 },
  { label: "Shipment timeline rebuilt", tone: "TRACE", lane: -108, delay: 0.18 },
  { label: "POD linked to case", tone: "EVIDENCE", lane: -66, delay: 0.36 },
  { label: "Invoice matched", tone: "VALIDATION", lane: -24, delay: 0.54 },
  { label: "Amazon response prepared", tone: "RESPONSE", lane: 20, delay: 0.72 },
  { label: "Payout variance flagged", tone: "LEDGER", lane: 64, delay: 0.9 },
  { label: "Case ready for approval", tone: "APPROVAL", lane: 108, delay: 1.08 },
  { label: "Accounting record ready", tone: "EXPORT", lane: 150, delay: 1.26 },
  { label: "Missing proof found", tone: "SIGNAL", lane: -128, delay: 1.44 },
  { label: "Settlement matched", tone: "LEDGER", lane: 128, delay: 1.62 },
];

function MarginOrchestrationFlow() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border-subtle)] bg-white py-10 md:py-16">
      <div className={demoContainerClass}>
        <div className="relative min-h-[420px] overflow-hidden border-y border-[var(--margin-border)] bg-[#FBFCFD]">
          <div className="absolute inset-8 grid grid-cols-6 gap-5 opacity-70 md:grid-cols-8">
            {Array.from({ length: 32 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-[10px] border border-[#E5ECEF]"
              />
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FBFCFD] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#FBFCFD] to-transparent" />

          {orchestrationSources.map((source) => (
            <motion.div
              key={source.name}
              className="absolute flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--margin-border)] bg-white shadow-[0_12px_28px_rgba(37,49,58,0.08)]"
              style={{ top: source.top, left: source.left }}
              animate={{
                x: [0, 155, 286, 376],
                y: [
                  0,
                  -18 + (source.delay % 1) * 36,
                  -5 + (source.delay % 1) * 10,
                  -2 + (source.delay % 1) * 5,
                ],
                opacity: [0, 0.82, 1, 0],
                scale: [0.72, 0.94, 0.72, 0.3],
              }}
              transition={{
                duration: 4.8,
                delay: source.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img src={source.image} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
            </motion.div>
          ))}

          <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[14px] border border-[#C9D8E0] bg-white shadow-[0_26px_60px_rgba(37,49,58,0.12)]">
            <img src="/logoimagetwo.png" alt="Margin" className="h-12 w-16 object-contain" />
          </div>

          {orchestrationOutputs.map((output) => (
            <motion.div
              key={output.label}
              className="absolute left-[52%] top-1/2 z-20 flex items-center gap-3 rounded-[2px] border border-[var(--margin-border)] bg-white/92 px-4 py-3 text-sm text-[var(--margin-text-primary)] shadow-[0_14px_34px_rgba(37,49,58,0.08)] backdrop-blur"
              animate={{
                x: [0, 42, 122, 272],
                y: [0, output.lane * 0.08, output.lane * 0.36, output.lane],
                opacity: [0, 1, 0.92, 0],
                scale: [0.56, 0.9, 1, 0.96],
              }}
              transition={{
                duration: 4.9,
                delay: output.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="h-3 w-3 rounded-[2px] border border-[#B9C7CF]" />
              <span className="font-medium tracking-[-0.02em]">{output.label}</span>
              <span className="text-[10px] font-semibold tracking-tight text-[var(--margin-text-muted)]">{output.tone}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarginIdentityCards() {
  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-10 md:py-14">
      <div className={demoContainerClass}>
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-0">
          {marginIdentityCards.map((card, index) => (
            <motion.article
              key={card.title}
              {...revealProps}
              transition={{
                ...revealProps.transition,
                delay: index * 0.06,
              }}
              className={`pt-2 lg:px-10 ${index > 0 ? "lg:border-l lg:border-[var(--margin-border)]" : ""}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-[5px] border border-[var(--margin-border)] bg-white">
                <img
                  src={card.image}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="mt-7 max-w-[360px] text-[25px] font-medium leading-[1.05] tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[28px]">
                {card.title}
              </h3>
              <p className="mt-4 max-w-[390px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">
                {card.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroAuditFindingCard() {
  const scenes = [
    {
      eyebrow: "Recovery Found",
      title: "Inbound shortage found",
      status: "Found",
      metrics: [
        ["60", "units shipped"],
        ["46", "received"],
        ["14", "unit gap"],
      ],
      rows: [
        ["Potential recovery", "USD 569.50"],
        ["Shipment", "FBA17ACME001"],
        ["Location", "ONT8"],
      ],
      note:
        "Margin surfaces the recoveries worth reviewing before they disappear into settlement noise.",
    },
    {
      eyebrow: "Evidence Ready",
      title: "Claim proof assembled",
      status: "Review",
      metrics: [
        ["80%", "readiness"],
        ["2", "records linked"],
        ["9d", "claim window"],
      ],
      rows: [
        ["Invoice", "Linked"],
        ["Shipment", "Matched"],
        ["Missing proof", "POD required"],
      ],
      note:
        "The case shows what is connected, what is missing, and what needs seller approval before filing.",
    },
    {
      eyebrow: "Payout Reconciled",
      title: "Recovery closed",
      status: "Paid",
      metrics: [
        ["USD", "currency"],
        ["1,247", "reimbursed"],
        ["0", "open gaps"],
      ],
      rows: [
        ["Amazon reimbursed", "USD 1,247.00"],
        ["Settlement", "Matched"],
        ["Case status", "Closed"],
      ],
      note:
        "Margin keeps the payout trail attached so approval and money received reconcile cleanly.",
    },
  ];
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = scenes[sceneIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % scenes.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [scenes.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.62, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
      className="hidden justify-self-end overflow-hidden rounded-[12px] border border-white/12 bg-white/[0.075] p-5 text-white shadow-[0_18px_54px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:block lg:w-full lg:max-w-[430px]"
      aria-label="Example Margin recovery lifecycle"
    >
      <motion.div
        key={scene.title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between border-b border-white/12 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-tight text-blue-100/80">
              {scene.eyebrow}
            </div>
            <div className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.035em]">
              {scene.title}
            </div>
          </div>
          <div className="rounded-[3px] bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-slate-200">
            {scene.status}
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-white/12 py-5">
          {scene.metrics.map(([value, label], index) => (
            <div
              key={label}
              className={index > 0 ? "border-l border-white/12 pl-5" : ""}
            >
              <div className="font-mono text-[26px] font-semibold leading-none tracking-[-0.04em] text-white">
                {value}
              </div>
              <div className="mt-2 text-[11px] font-medium uppercase tracking-tight text-slate-400">
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3 py-5">
          {scene.rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-6">
              <span className="text-[13px] text-slate-400">{label}</span>
              <span className="text-right text-[13px] font-semibold text-slate-100">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/12 pt-4 text-[12px] leading-5 text-slate-300">
          {scene.note}
        </div>
      </motion.div>
      <div className="mt-4 flex gap-1.5">
        {scenes.map((item, index) => (
          <span
            key={item.eyebrow}
            className={`h-1 rounded-full transition-[width,background-color] duration-300 ${
              index === sceneIndex ? "w-7 bg-[var(--margin-blue)]" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function OperatorQualificationSection() {
  const points = [
    "Your FBA activity is continuous across shipments, SKUs, marketplaces, brands or client accounts.",
    "Recovery work crosses operations, finance, VAs, agencies, carriers and suppliers.",
    "Invoices, BOLs, PODs, shipment records, support messages, cost data and payout entries live in different places.",
    "Approved reimbursements, partial payments, reversals and settlement differences still have to be reconstructed at month end.",
    "A missed window, weak evidence trail or underpaid reimbursement materially affects margin.",
  ];

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid gap-8 md:grid-cols-[0.86fr_1.14fr] md:items-start">
          <motion.div {...revealProps}>
            <div className={sectionLabelClass}>Built for complex FBA operations</div>
            <h2 className="mt-3 max-w-[640px] text-[31px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[50px]">
              Recovery has become an operating process, not an occasional claim.
            </h2>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              Margin is designed for businesses where shipment volume,
              evidence, Amazon responses and settlement activity are too
              important to depend on spreadsheets, inboxes or one person&apos;s
              memory.
            </p>
          </motion.div>
          <motion.div {...revealProps} className="border-y border-[var(--margin-border)]">
            {points.map((point) => (
              <div
                key={point}
                className="flex gap-4 border-b border-[var(--margin-border)] py-4 last:border-b-0 md:py-5"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--margin-blue)]" />
                <p className="max-w-[760px] text-[16px] leading-7 tracking-[-0.018em] text-[var(--margin-text-secondary)] md:text-[18px] md:leading-8">
                  {point}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DiscrepancyIsNotRevenueSection() {
  const stages = [
    {
      title: "Detect",
      detail: "Shipment gap found",
      meta: "REC-7702",
      icon: Radar,
    },
    {
      title: "Value",
      detail: "USD 1,247 scoped",
      meta: "VAL: 1,247",
      icon: CircleDollarSign,
    },
    {
      title: "Evidence",
      detail: "Invoice connected",
      meta: "DOC: 03",
      icon: FileCheck2,
    },
    {
      title: "Approve",
      detail: "Seller approval",
      meta: "CTL: USER",
      icon: UserCheck,
    },
    {
      title: "Respond",
      detail: "Reply managed",
      meta: "AMZ: OPEN",
      icon: MessagesSquare,
    },
    {
      title: "Reconcile",
      detail: "Settlement matched",
      meta: "LEDGER",
      icon: Landmark,
    },
  ];

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-14 md:py-24">
      <div className={containerClass}>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <motion.div {...revealProps}>
            <div className={sectionLabelClass}>Recovery Control Loop</div>
            <h2 className="mt-3 max-w-[760px] text-[34px] font-medium leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[60px]">
              Recovering revenue is a control loop, not an alert.
            </h2>
            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
              A discrepancy only becomes money when its value, evidence,
              approval, Amazon response and payout all stay attached to the same
              recovery record.
            </p>
            <p className="mt-4 max-w-[720px] text-[15px] font-semibold leading-7 tracking-[-0.02em] text-[var(--margin-text-primary)] md:text-[17px]">
              Margin keeps that path intact from first signal to reconciled
              cash.
            </p>
          </motion.div>
          <motion.div
            {...revealProps}
            className="relative overflow-hidden rounded-[12px] border-b border-r border-[rgba(0,0,0,0.05)] border-l border-t border-white/90 bg-white/40 p-5 shadow-[24px_42px_120px_rgba(27,28,32,0.055)] ring-1 ring-[var(--margin-border)] backdrop-blur-[30px] md:p-8"
            style={{
              transform: "perspective(1100px) rotateX(1.8deg) rotateY(-1.2deg)",
              transformOrigin: "center",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,92,214,0.035),transparent_56%),linear-gradient(135deg,rgba(255,255,255,0.62),rgba(247,247,248,0.22))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/95" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/95" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/[0.035]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-black/[0.035]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(34,92,214,0.025)] blur-3xl" />
            <div className="relative">
              <div className="hidden md:block">
                <div className="absolute left-[5%] right-[5%] top-[30px] h-px bg-[#E9E9EC]" />
                <motion.div
                  className="absolute left-[5%] top-[29.5px] h-[2px] origin-left bg-[var(--margin-blue)] shadow-[0_0_12px_rgba(34,92,214,0.4)]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 0.64 }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: "90%" }}
                />
                <motion.div
                  className="absolute top-[26px] h-[9px] w-[9px] rounded-full bg-[var(--margin-blue)] shadow-[0_0_18px_rgba(34,92,214,0.65)]"
                  initial={{ left: "5%", opacity: 0 }}
                  whileInView={{ left: "62%", opacity: [0, 1, 1, 0] }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-6 md:gap-3">
                {stages.map(({ title, detail, meta, icon: Icon }, index) => {
                  const isActive = index <= 3;

                  return (
                    <div
                      key={title}
                      className={`relative rounded-[10px] border border-white/80 bg-white/32 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:border-0 md:bg-transparent md:p-0 md:shadow-none ${index > 0 ? "md:pl-1" : ""}`}
                    >
                      <div className="flex items-start gap-3 md:block">
                        <motion.div
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white/46 backdrop-blur-xl ${
                            isActive
                              ? "border-[rgba(34,92,214,0.22)] text-[var(--margin-blue)] shadow-[0_0_22px_rgba(34,92,214,0.18),inset_0_1px_0_rgba(255,255,255,0.72)]"
                              : "border-white/80 text-[rgba(80,82,91,0.62)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                          }`}
                          animate={
                            index === 3
                              ? {
                                  boxShadow: [
                                    "0 0 22px rgba(34,92,214,0.18), 0 0 0 0 rgba(34,92,214,0.16), inset 0 1px 0 rgba(255,255,255,0.72)",
                                    "0 0 26px rgba(34,92,214,0.22), 0 0 0 10px rgba(34,92,214,0), inset 0 1px 0 rgba(255,255,255,0.72)",
                                  ],
                                }
                              : undefined
                          }
                          transition={{
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        >
                          <Icon
                            className="h-4 w-4 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]"
                            strokeWidth={1.15}
                          />
                        </motion.div>
                        <div>
                          <div className="mt-0 text-[15px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)] md:mt-4">
                            {title}
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-[var(--margin-text-muted)]">
                            {detail}
                          </div>
                          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] font-medium tracking-tight text-[rgba(34,92,214,0.62)] drop-shadow-[0_0_8px_rgba(34,92,214,0.12)]">
                            <span>{meta}</span>
                            {index === 2 && (
                              <>
                                <span className="h-3 w-px bg-[rgba(34,92,214,0.2)]" />
                                <span>POD linked</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="relative mt-6 border-t border-white/70 pt-5 text-[14px] font-medium leading-6 text-[var(--margin-text-secondary)] md:mt-10">
              No disconnected alerts. No rebuilding the case history. No
              approved reimbursement left unmatched.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FreeAuditResultPreviewSection() {
  const metrics = [
    ["Potential recovery", "USD 2,847.20"],
    ["Evidence-ready cases", "4"],
    ["Missing documents", "3"],
    ["Claim windows", "< 14 days"],
  ];
  const findings = [
    ["Inbound shortage", "14-unit gap at ONT8", "Needs invoice"],
    ["Settlement mismatch", "Approved value underpaid", "Reconcile payout"],
    ["Refund without return", "Return record unmatched", "Held for review"],
  ];

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-white py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <motion.div {...revealProps}>
            <div className={sectionLabelClass}>Free recovery audit</div>
            <h2 className="mt-3 max-w-[680px] text-[32px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[54px]">
              See what Amazon may owe and what it will take to recover it.
            </h2>
            <p className="mt-5 max-w-[660px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
              Connect your Amazon account through a read-only authorization.
              Margin audits shipment, inventory, fee, reimbursement and
              settlement activity, then shows named recoveries, potential value,
              evidence status, missing proof, deadlines, underpayments and
              reversals that require attention.
            </p>
          </motion.div>
          <motion.div
            {...revealProps}
            className="overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.04)] lg:-mr-10 xl:-mr-20"
          >
            <div className="grid grid-cols-2 gap-y-6 px-5 py-6 sm:px-7 lg:grid-cols-4 lg:gap-x-8 lg:px-8">
              {metrics.map(([label, value], index) => (
                <div
                  key={label}
                  className={index > 1 ? "border-t border-[var(--margin-border-subtle)] pt-6 lg:border-t-0 lg:pt-0" : ""}
                >
                  <div className="font-mono text-[24px] font-semibold leading-none tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[30px]">
                    {value}
                  </div>
                  <div className="mt-2 text-[13px] font-medium leading-5 text-[var(--margin-text-muted)]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            {findings.map(([name, detail, status]) => (
              <div
                key={name}
                className="grid gap-2 border-t border-[var(--margin-border-subtle)] px-5 py-4 sm:grid-cols-[1fr_1.25fr_auto] sm:items-center sm:px-7 lg:px-8"
              >
                <div className="text-[16px] font-medium tracking-[-0.025em] text-[var(--margin-text-primary)]">
                  {name}
                </div>
                <div className="text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                  {detail}
                </div>
                <div className="w-fit rounded-full bg-[var(--margin-section-alt)] px-3 py-1 text-[12px] font-medium leading-5 text-[var(--margin-text-muted)] transition-colors duration-150 hover:bg-[var(--margin-blue-soft)] hover:text-[var(--margin-blue)]">
                  {status}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryWorkspacePricingSection({
  onActivate,
}: {
  onActivate?: () => void;
}) {
  return (
    <section className="relative border-b border-[var(--margin-border)] bg-white py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div {...revealProps}>
            <div className={sectionLabelClass}>After the audit</div>
            <h2 className="mt-3 max-w-[720px] text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]">
              Keep every recovery under continuous control.
            </h2>
            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
              Activate the Recovery Workspace to continue monitoring, evidence
              preparation, seller approvals, Amazon response handling, payout
              validation and reconciliation.
            </p>
          </motion.div>
          <motion.div {...revealProps} className="border-y border-[var(--margin-border)] py-6">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  Recovery Workspace
                </div>
                <div className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[54px]">
                  $99/month
                </div>
                <p className="mt-3 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
                  Charged as R1,799 ZAR. 0% recovery commission. One fixed
                  monthly subscription. Keep 100% of the recovery.
                </p>
              </div>
              {onActivate ? (
                <Button
                  onClick={onActivate}
                  className="h-12 rounded-[8px] bg-[var(--margin-blue)] px-7 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(23,92,211,0.22)] hover:bg-[var(--margin-blue-hover)]"
                >
                  Activate Recovery Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <div className="mt-5 grid gap-3 border-t border-[var(--margin-border)] pt-5 sm:grid-cols-2">
              {[
                "Continuous recovery monitoring",
                "Evidence ingestion and matching",
                "Missing-proof and deadline alerts",
                "Case and response continuity",
                "Seller approval workflows",
                "Underpayment and reversal monitoring",
                "Payout and settlement reconciliation",
                "Accounting-ready recovery record",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-[13px] leading-6 text-[var(--margin-text-secondary)]">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--margin-blue)]" strokeWidth={2.4} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] leading-6 text-[var(--margin-text-muted)]">
              Cancel anytime. Nothing is filed without your approval. Managing
              multiple brands, client accounts or complex recovery operations?
              Talk to Sales about Scale.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ExistingOperationFitSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section
      className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-20"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[860px] text-center">
          <div className={sectionLabelClass}>One control layer across the team</div>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]">
            Operations sees the case. Finance sees the money.
          </h2>
          <p className="mx-auto mt-5 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
            Margin keeps the evidence, deadline, seller decision, Amazon
            response, expected value, paid value and settlement status attached
            to one recovery, so the story does not have to be reconstructed
            every time responsibility changes hands.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-7 lg:grid-cols-3">
          <motion.article
            {...revealProps}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(233,233,236,0.75)_1px,transparent_1px),linear-gradient(90deg,rgba(233,233,236,0.7)_1px,transparent_1px)] [background-size:38px_38px]" />
              <div className="relative space-y-4">
                {[
                  "Amazon synced",
                  "Shipment variance detected",
                  "Settlement checked",
                  "Recovery surfaced",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <motion.span
                      className="h-2 w-2 rounded-full bg-[var(--margin-blue)]"
                      animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.8,
                        delay: index * 0.35,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="border-b border-[var(--margin-border)] pb-2 text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)]">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[25px] font-medium leading-[1.06] tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[28px]">
              Operations knows what is ready and what happens next.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              See missing proof, deadlines, response status, seller approvals
              and the next required action without relying on another
              spreadsheet or someone&apos;s memory.
            </p>
          </motion.article>

          <motion.article
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.06 }}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["/amazon-logo-transparent-circle.png", "Amazon"],
                    ["/gmailicon.png", "Gmail"],
                    ["/gd.png", "Drive"],
                    ["/quickbooks.png", "QuickBooks"],
                  ].map(([src, label]) => (
                    <div
                      key={label}
                      className="flex h-14 items-center justify-center rounded-[8px] border border-[var(--margin-border)] bg-white"
                    >
                      <img src={src} alt="" className="max-h-7 max-w-8 object-contain" />
                    </div>
                  ))}
                </div>
                <div className="font-mono text-[18px] text-[var(--margin-text-muted)]">→</div>
                <div className="rounded-[8px] border border-[var(--margin-border)] bg-[var(--margin-section-alt)] p-4">
                  <div className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                    Connected recovery
                  </div>
                  <div className="mt-3 space-y-2 text-[12px] font-medium text-[var(--margin-text-primary)]">
                    <div>Shipment record</div>
                    <div>Invoice</div>
                    <div>Case timeline</div>
                    <div>Payout ledger</div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-6 text-[25px] font-medium leading-[1.06] tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[28px]">
              Finance knows what Amazon approved and what it actually paid.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              Compare expected, approved, paid, underpaid, reversed and
              unreconciled values from the same recovery record operations uses
              to manage the case.
            </p>
          </motion.article>

          <motion.article
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.12 }}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="space-y-3">
                {[
                  ["Case prepared", "Complete"],
                  ["Evidence ready", "Ready"],
                  ["Seller review required", "Approval"],
                  ["Approve filing", "Decision"],
                ].map(([item, label], index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between border-b border-[var(--margin-border)] pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${index < 2 ? "bg-[var(--margin-success-soft)] text-[var(--margin-success)]" : "bg-[var(--margin-warning-soft)] text-[var(--margin-warning)]"}`}>
                        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </span>
                      <span className="text-[13px] font-medium tracking-[-0.02em] text-[var(--margin-text-secondary)]">
                        {item}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[25px] font-medium leading-[1.06] tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[28px]">
              Seller control stays attached to every sensitive decision.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              Margin performs monitoring and preparation in the background.
              Filing and response actions remain subject to seller approval.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function KineticHeroSection({
  onEarlyAccessCta,
  isFull,
  nextBatchHours,
}: {
  onEarlyAccessCta: () => void;
  isFull: boolean;
  nextBatchHours?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.82]);
  const networkY = useTransform(
    scrollYProgress,
    [0, 0.25],
    [0, reduceMotion ? 0 : 34],
  );
  return (
    <motion.section
      style={{
        scale: reduceMotion ? 1 : heroScale,
        opacity: reduceMotion ? 1 : heroOpacity,
      }}
      data-navbar-theme="dark"
      className="relative isolate flex min-h-svh overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(11,116,222,0.18),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(46,125,91,0.12),transparent_32%),linear-gradient(135deg,#101827_0%,#06080C_54%,#000000_100%)] px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-40 md:min-h-screen md:px-8 md:pb-44 md:pt-64"
      aria-labelledby="margin-hero-title"
    >
      {" "}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")",
        }}
      />{" "}
      <motion.div
        style={{ y: networkY }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {" "}
        <motion.div
          className="absolute left-[-10%] top-[12%] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,122,255,0.28)_0%,rgba(0,122,255,0.12)_34%,transparent_70%)] blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 26, 0], y: [0, -18, 0], opacity: [0.54, 0.82, 0.54] }
          }
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />{" "}
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(96,165,250,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.10)_1px,transparent_1px)] [background-size:92px_92px]" />{" "}
        <motion.div
          className="absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.14),transparent)] blur-sm"
          animate={reduceMotion ? undefined : { x: ["-30vw", "115vw"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />{" "}
        {auditLines.map((line) => (
          <motion.div
            key={`${line.left}-${line.top}`}
            className="absolute h-px origin-left bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.42),rgba(52,211,153,0.24),transparent)]"
            style={{
              left: `${line.left}%`,
              top: `${line.top}%`,
              width: `${line.width}%`,
              rotate: `${line.rotate}deg`,
            }}
            animate={
              reduceMotion ? { opacity: 0.14 } : { opacity: [0, 0.26, 0] }
            }
            transition={{
              duration: 4.8,
              delay: line.delay,
              repeat: Infinity,
              repeatDelay: 3.2,
              ease: "easeInOut",
            }}
          />
        ))}{" "}
        {auditPulses.map((pulse, index) => (
          <motion.div
            key={`${pulse.x}-${pulse.y}`}
            className={`absolute rounded-full ${pulse.color} shadow-[0_0_30px_currentColor]`}
            style={{
              left: `${pulse.x}%`,
              top: `${pulse.y}%`,
              width: pulse.size,
              height: pulse.size,
              color: pulse.color.includes("emerald")
                ? "rgba(52,211,153,0.9)"
                : "rgba(96,165,250,0.9)",
            }}
            animate={
              reduceMotion
                ? { opacity: 0.14, scale: 1 }
                : { opacity: [0, 0.22, 0], scale: [0.2, 1.22, 1.6] }
            }
            transition={{
              duration: pulse.duration,
              delay: pulse.delay + index * 0.05,
              repeat: Infinity,
              repeatDelay: 1.2,
              ease: "easeOut",
            }}
          />
        ))}{" "}
      </motion.div>{" "}
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center gap-12 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        {" "}
        <div className="max-w-[980px]">
          {" "}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis rounded-[5px] bg-white/[0.07] px-4 py-2 text-left text-[9px] font-semibold leading-relaxed uppercase tracking-tight text-blue-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl sm:px-3 sm:py-1.5 sm:text-[11px]"
          >
            {" "}
            AMAZON FBA REVENUE RECOVERY &amp; RECONCILIATION{" "}
          </motion.div>{" "}
          <h1
            id="margin-hero-title"
            className="mt-6 font-serif-headline max-w-[880px] text-[34px] font-bold leading-[1.02] tracking-[-0.045em] min-[390px]:text-[40px] sm:mt-7 sm:text-[52px] sm:tracking-[-0.055em] md:text-[58px] lg:text-[64px]"
          >
            {" "}
            <motion.span
              className="block text-white"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.58,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Your FBA operation is too large
            </motion.span>{" "}
            <motion.span
              className="block text-slate-400"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.58,
                delay: 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className="block">to rebuild every recovery by hand.</span>
            </motion.span>{" "}
          </h1>{" "}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.58,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5 max-w-[680px] text-[15px] leading-[1.65] text-slate-300 sm:mt-7 sm:text-[17px] md:text-[18px]"
          >
            {" "}
            Margin verifies what Amazon may owe across shipments, inventory,
            fees, reimbursements and settlements, connects every valid recovery
            to the evidence behind it, and keeps the case moving until the
            payout is verified and reconciled—with your approval before
            anything is filed.{" "}
          </motion.p>{" "}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.78,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:mt-10"
          >
            {" "}
            <Button
              onClick={onEarlyAccessCta}
              aria-label="Audit Seller Account"
              className="landing-pressable group relative h-[52px] w-full sm:w-auto justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-10 text-sm font-semibold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)]"
            >
              {" "}
              <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />{" "}
              Audit Seller Account <ArrowRight className="ml-2 h-4 w-4" />{" "}
            </Button>{" "}
          </motion.div>{" "}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] font-medium text-slate-400 sm:mt-8"
          >
            {" "}
            <span>Read-only audit</span>
            <span className="text-slate-600">·</span>
            <span>No card required</span>
            <span className="text-slate-600">·</span>
            <span>Seller approval before filing</span>
            <span className="text-slate-600">·</span>
            <span>0% recovery commission</span>
          </motion.div>{" "}
          {isFull ? (
            <div className="mt-5 max-w-[430px] rounded-2xl bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl">
              {" "}
              <div>
                We are onboarding a small batch of sellers right now.
              </div>{" "}
              <div>Next batch opens in {nextBatchHours ?? 24} hours.</div>{" "}
            </div>
          ) : null}{" "}
        </div>{" "}
        <HeroAuditFindingCard />
      </div>{" "}
    </motion.section>
  );
}
function SystemLogMarquee() {
  return (
    <section className="system-log-marquee relative overflow-hidden bg-[var(--margin-canvas)] py-16 md:py-24">
      {" "}
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(201,214,222,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(201,214,222,0.18)_1px,transparent_1px)] [background-size:52px_52px]" />{" "}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--margin-canvas)] to-transparent" />{" "}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--margin-canvas)] to-transparent" />{" "}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--margin-canvas)] to-transparent md:w-32" />{" "}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--margin-canvas)] to-transparent md:w-32" />{" "}
      <div className={containerClass}>
        {" "}
        <motion.div {...revealProps} className="relative z-20 max-w-[760px]">
          {" "}
          <div className={sectionLabelClass}>Recovery Intelligence</div>{" "}
          <h2 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[42px] md:text-[62px]">
            <span className="text-[var(--margin-text-primary)]">One rejected case.</span> <span className="text-[var(--margin-text-muted)]">Every missing answer.</span>
          </h2>{" "}
          <p className="mt-5 max-w-[680px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
            {" "}
            Amazon asks again, rejects, underpays, or delays. Margin keeps the
            proof, timeline, response, and payout state tied to the same
            recovery.{" "}
          </p>{" "}
        </motion.div>{" "}
        <motion.div
          {...revealProps}
          className="relative z-20 mx-auto mt-12 max-w-[680px] border-y border-[#BFCBD3] bg-white/62 py-5 backdrop-blur-xl md:py-7"
        >
          {" "}
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-tight text-[#7B8A95]">
            {" "}
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--margin-success)]" /> Recovery
            OS{" "}
          </div>{" "}
          <div className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.035em] text-[var(--margin-text-primary)] md:text-[31px]">
            {" "}
            <TypewriterPrompt text="Show me what Amazon still needs for this claim." />{" "}
          </div>{" "}
          <div className="mt-5 border-t border-[var(--margin-border)] pt-3 font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-text-secondary)]">
            {" "}
            Missing proof found - Ready for seller review{" "}
          </div>{" "}
        </motion.div>{" "}
      </div>{" "}
      <div className="relative mt-12 space-y-2.5 md:mt-14 md:space-y-3">
        {" "}
        {systemLogRows.map((row, rowIndex) => (
          <div
            key={`${row.direction}-${rowIndex}`}
            className="system-log-row"
            data-direction={row.direction}
            style={
              {
                "--duration": row.duration,
                "--hover-duration": row.hoverDuration,
              } as React.CSSProperties
            }
          >
            {" "}
            <div className="system-log-track flex w-max gap-3 px-3 md:gap-3.5 md:px-4">
              {" "}
              {[...row.items, ...row.items].map((entry, index) => (
                <div
                  key={`${rowIndex}-${entry.label}-${entry.text}-${index}`}
                  className="min-w-[280px] border-y border-[#C9D6DE] bg-white/50 px-3 py-[9px] backdrop-blur-xl md:min-w-[350px]"
                >
                  {" "}
                  <div className="font-mono text-[8px] font-bold uppercase tracking-tight text-[var(--margin-text-muted)]">
                    {" "}
                    {entry.label}{" "}
                  </div>{" "}
                  <div className="mt-2 text-[14px] font-[350] leading-5 tracking-[-0.025em] text-[var(--margin-text-secondary)] md:text-[15px]">
                    {" "}
                    {entry.text}{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
    </section>
  );
}
function EvidenceReadinessBlueprint() {
  const panelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(panelRef, { amount: 0.45, once: true });
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, 82, {
      duration: 1.15,
      ease: "easeOut",
      onUpdate: (latest) => setScore(Math.round(latest)),
    });
    return () => controls.stop();
  }, [isInView]);
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-[var(--margin-border)] bg-[linear-gradient(135deg,#FFFFFF_0%,#F4FAFF_52%,var(--margin-section-alt)_100%)] p-7 shadow-[0_28px_90px_rgba(37,49,58,0.10)] max-md:rounded-none max-md:border-0 max-md:bg-white max-md:p-0 max-md:shadow-none md:p-9"
    >
      {" "}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.38] max-md:hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(122,137,148,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(122,137,148,0.11) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />{" "}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_14%,rgba(11,116,222,0.08),transparent_34%),radial-gradient(circle_at_12%_92%,rgba(46,125,91,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.82),transparent_54%)] max-md:hidden" />{" "}
      <div className="relative">
        {" "}
        <div className="text-[10px] font-semibold uppercase text-[var(--margin-text-muted)]">
          {" "}
          Potential evidence requests{" "}
        </div>{" "}
        <div className="mt-4 md:hidden">
          {" "}
          <div className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-primary)]">
            {" "}
            <span>Potential Amazon requests</span> <span>{score}%</span>{" "}
          </div>{" "}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-[1px] bg-[var(--margin-border-subtle)]">
            {" "}
            <motion.div
              className="h-full rounded-[1px] bg-[var(--margin-blue)]"
              initial={{ width: "0%" }}
              animate={isInView ? { width: `${score}%` } : { width: "0%" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-3 flex items-end gap-2 max-md:hidden">
          {" "}
          <span className="text-[78px] font-bold leading-none tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[104px]">
            {" "}
            {score}{" "}
          </span>{" "}
          <span className="mb-2 text-[28px] font-bold leading-none text-[var(--margin-text-primary)] md:mb-3 md:text-[38px]">
            %
          </span>{" "}
        </div>{" "}
        <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] max-md:mt-5 md:text-[16px]">
          {" "}
          Amazon may still ask for an invoice, shipment proof, carrier record,
          signed POD, or cost breakdown before the case is ready to survive
          another response.{" "}
        </p>{" "}
      </div>{" "}
      <div className="relative mt-9 grid gap-0 max-md:mt-7 md:mt-11 md:grid-cols-2">
        {" "}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 top-0 h-px origin-left bg-[#C9D6DE]"
        />{" "}
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.65, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 left-1/2 top-0 hidden w-px origin-top bg-[#C9D6DE] md:block"
        />{" "}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.65, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 top-1/2 h-px origin-left bg-[#C9D6DE] md:hidden"
        />{" "}
        <div className="min-h-[148px] py-7 pr-0 max-md:border-b max-md:border-[var(--margin-border-subtle)] max-md:pb-6 md:pr-8">
          {" "}
          <div className="text-[11px] font-bold uppercase text-[var(--margin-text-primary)]">
            {" "}
            Likely request list{" "}
          </div>{" "}
          <p className="mt-4 max-w-[260px] text-[15px] leading-7 text-[var(--margin-text-secondary)]">
            {" "}
            Invoice <br /> Shipment proof <br /> Carrier record <br /> Signed
            POD <br /> Cost breakdown{" "}
          </p>{" "}
        </div>{" "}
        <div className="min-h-[148px] py-7 max-md:pt-6 md:pl-8">
          {" "}
          <div className="text-[11px] font-bold uppercase text-[var(--margin-text-primary)]">
            {" "}
            Current status{" "}
          </div>{" "}
          <p className="mt-4 max-w-[280px] text-[15px] leading-7 text-[var(--margin-text-secondary)]">
            {" "}
            Not ready to survive another Amazon response.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </motion.div>
  );
}
function MobileMarketplaceHub() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-[390px] sm:hidden"
      aria-label="Mobile marketplace support"
    >
      {" "}
      <div className={sectionLabelClass}>Marketplace Scope</div>{" "}
      <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em]">
        <span className="text-[var(--margin-text-primary)]">Supported</span> <span className="text-[var(--margin-text-muted)]">FBA marketplaces</span>
      </h2>{" "}
      <p className="mt-5 max-w-[340px] text-[16px] leading-8 text-[var(--margin-text-secondary)]">
        {" "}
        Margin is built for Amazon FBA reimbursement work across supported
        marketplaces. Marketplace availability may vary during Early
        Access.{" "}
      </p>{" "}
      <div className="mt-8 border-y border-[var(--margin-border)] py-6">
        {" "}
        <div className="text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
          {" "}
          All Supported Regions{" "}
        </div>{" "}
        <div className="mt-4 grid max-w-[340px] grid-cols-1">
          {" "}
          {marketplaceCountries.map((marketplace, index) => (
            <motion.span
              key={marketplace.code}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.28,
                delay: index * 0.018,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`flex items-center gap-3 py-3 ${index > 0 ? "border-t border-[var(--margin-border)]" : ""}`}
            >
              {" "}
              <span
                className={`fi fi-${marketplace.flagCode} h-5 w-7 shrink-0 rounded-[4px] shadow-[0_8px_18px_rgba(37,49,58,0.12)]`}
                aria-hidden="true"
              />{" "}
              <span className="min-w-0">
                {" "}
                <span className="block truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                  {" "}
                  {marketplace.country}{" "}
                </span>{" "}
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  {" "}
                  {marketplace.region} · {marketplace.code}{" "}
                </span>{" "}
              </span>{" "}
            </motion.span>
          ))}{" "}
        </div>{" "}
      </div>{" "}
    </motion.div>
  );
}
function MinimalMetric({
  label,
  value,
  suffix,
  detail,
  index,
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
    const unsubscribe = spring.on("change", (latest) => {
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
      transition={{
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="min-w-0"
    >
      {" "}
      <motion.div
        aria-hidden="true"
        animate={
          reduceMotion ? { opacity: 0.78 } : { opacity: [0.58, 1, 0.58] }
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.35,
        }}
        className="text-[11px] font-bold uppercase tracking-tight text-[var(--margin-blue)] md:text-xs"
      >
        {" "}
        {label}{" "}
      </motion.div>{" "}
      <div
        aria-hidden="true"
        className="mt-4 flex items-end font-black leading-none tracking-[-0.08em] text-[var(--margin-text-primary)]"
      >
        {" "}
        <span className="text-[82px] sm:text-[96px] md:text-[112px] lg:text-[132px]">
          {" "}
          {displayValue}{" "}
        </span>{" "}
        <span className="mb-3 ml-2 text-[38px] font-medium tracking-[-0.05em] text-[var(--margin-text-muted)] sm:text-[44px] md:mb-4 md:text-[54px]">
          {" "}
          {suffix}{" "}
        </span>{" "}
      </div>{" "}
      <p className="mt-5 max-w-[320px] text-[15px] leading-6 text-[var(--margin-text-secondary)] md:text-base">
        {" "}
        {detail}{" "}
      </p>{" "}
    </motion.div>
  );
}

function TrustedConnectionGraphic() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative mx-auto h-[210px] w-full max-w-[520px] overflow-hidden sm:h-[240px] md:h-[280px]"
      aria-label="Amazon connection to Margin"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 520 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="trusted-logo-connection-glow" x="-25%" y="-75%" width="150%" height="250%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient
            id="trusted-logo-connection-flow"
            x1="128"
            y1="140"
            x2="392"
            y2="140"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="var(--margin-blue)" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="var(--margin-blue)" />
            <stop offset="1" stopColor="#2E7D5B" stopOpacity="0.38" />
          </linearGradient>
        </defs>
        <path
          d="M126 140H394"
          className="stroke-transparent"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <motion.path
          d="M126 140H394"
          stroke="url(#trusted-logo-connection-flow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 14"
          animate={reduceMotion ? undefined : { strokeDashoffset: [120, 0, -120] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "linear" }}
          opacity="0"
        />
        <motion.g
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "260px 140px" }}
        >
          <circle
            cx="260"
            cy="140"
            r="32"
            className="stroke-[rgba(23,92,211,0.55)]"
            strokeWidth="1.8"
            strokeDasharray="3 8"
          />
        </motion.g>
        <motion.g
          animate={reduceMotion ? undefined : { rotate: -360, scale: [0.92, 1.06, 0.92] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "260px 140px" }}
        >
          <circle
            cx="260"
            cy="140"
            r="45"
            className="stroke-[rgba(23,92,211,0.60)]"
            strokeWidth="1.9"
            strokeDasharray="10 14"
          />
        </motion.g>
        <motion.circle
          cx="132"
          cy="140"
          r="4.5"
          className="fill-[var(--margin-blue)]"
          animate={
            reduceMotion
              ? undefined
              : {
                  cx: [132, 252, 260, 268, 132, 252, 260, 268, 132],
                  scale: [1, 1.08, 2.35, 1.08, 1, 1.08, 2.35, 1.08, 1],
                  opacity: [0.62, 1, 1, 1, 0.66, 1, 1, 1, 0.62],
                }
          }
          transition={{
            duration: 6.8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.26, 0.34, 0.42, 0.56, 0.74, 0.82, 0.9, 1],
          }}
        />
        <motion.circle
          cx="388"
          cy="140"
          r="4.5"
          className="fill-[var(--margin-blue)]"
          animate={
            reduceMotion
              ? undefined
              : {
                  cx: [388, 268, 260, 252, 388, 268, 260, 252, 388],
                  scale: [1, 1.08, 2.35, 1.08, 1, 1.08, 2.35, 1.08, 1],
                  opacity: [0.62, 1, 1, 1, 0.66, 1, 1, 1, 0.62],
                }
          }
          transition={{
            duration: 6.8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.26, 0.34, 0.42, 0.56, 0.74, 0.82, 0.9, 1],
          }}
        />
      </svg>

      <div className="relative z-10 grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-3 sm:gap-8 sm:px-6">
        <div className="flex justify-center">
          <img
            src="/amazon-logo-transparent-circle.png"
            alt="Amazon"
            className="h-20 w-20 object-contain drop-shadow-[0_18px_34px_rgba(37,49,58,0.14)] sm:h-24 sm:w-24 md:h-28 md:w-28"
            loading="lazy"
          />
        </div>

        <div className="h-px w-24 sm:w-36 md:w-44" aria-hidden="true" />

        <div className="flex justify-center">
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            className="h-14 w-auto object-contain drop-shadow-[0_18px_34px_rgba(37,49,58,0.12)] sm:h-16 md:h-20"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { isFull, capacity } = useOnboardingCapacity();
  usePageMeta(PUBLIC_ROUTE_META["/"]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileLayout(mediaQuery.matches);
    sync();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", sync);
      return () => mediaQuery.removeEventListener("change", sync);
    }
    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);
  const handleClaimAccessClick = (location: string) => {
    trackEarlyAccessCtaClicked({
      cta_location: location,
      cta_text: primaryCtaLabel,
      destination: "/audit",
    });
    if (isFull) {
      window.location.assign("/waitlist?reason=capacity");
      return;
    }
    window.location.assign("/audit");
  };
  const openDemo = () => {
    trackEvent(ANALYTICS_EVENTS.demoCtaClicked, {
      cta_location: "homepage_demo_section",
      cta_text: "Watch the Margin product demo",
      video_name: "margin_demo",
    });
    setIsDemoOpen(true);
  };
  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 4 : 5;
  const primaryCtaLabel = "Audit Seller Account";
  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--margin-canvas)] font-sans text-[var(--margin-text-primary)] selection:bg-[rgba(23,92,211,0.16)] selection:text-[var(--margin-text-primary)]">
      {" "}
      <PublicNavbar variant="light" />{" "}
      <main className="relative">
        {" "}
        <KineticHeroSection
          onEarlyAccessCta={() => handleClaimAccessClick("homepage_hero")}
          isFull={isFull}
          nextBatchHours={capacity?.nextBatchHours}
        />{" "}
        <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-4">
          <div className={containerClass}>
            <div className="space-y-2 text-center">
              <p className="text-[13px] font-medium tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[14px]">
                Built for established FBA brands, agencies, aggregators, and
                the operations and finance teams responsible for recovery cash.
              </p>
              <div className="flex flex-col gap-3 text-[13px] font-semibold tracking-[-0.015em] text-[var(--margin-text-secondary)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 md:text-[14px]">
                <span>Official Amazon connection</span>
                <span className="hidden h-1 w-1 rounded-full bg-[#C4CED5] sm:block" />
                <span>Read-only audit</span>
                <span className="hidden h-1 w-1 rounded-full bg-[#C4CED5] sm:block" />
                <span>Seller approval before filing</span>
                <span className="hidden h-1 w-1 rounded-full bg-[#C4CED5] sm:block" />
                <span>Disconnect anytime</span>
              </div>
            </div>
          </div>
        </section>
        <DiscrepancyIsNotRevenueSection />
        <FreeAuditResultPreviewSection />
        <section className="hidden relative border-b border-[var(--margin-border-subtle)] bg-[var(--margin-canvas)] py-8 max-md:bg-[var(--margin-canvas)] max-md:py-14">
          {" "}
          <div className={containerClass}>
            {" "}
            <motion.p
              {...revealProps}
              className="mx-auto max-w-[820px] text-center text-[20px] font-semibold leading-8 tracking-[-0.035em] max-md:text-left md:text-[28px] md:leading-9"
            >
              <span className="text-[var(--margin-text-primary)]">Most sellers find the discrepancy.</span> <span className="text-[var(--margin-text-muted)]">The recovery dies when Amazon asks for proof.</span>
            </motion.p>{" "}
            <motion.p
              {...revealProps}
              className="mx-auto mt-4 max-w-[840px] text-center text-[15px] leading-7 text-[var(--margin-text-secondary)] max-md:text-left md:text-[18px] md:leading-8"
            >
              {" "}
              Invoices, PODs, BOLs, shipment records, cost data, support
              history, and payout records are usually there. They just are not
              tied to one case before the deadline moves.{" "}
            </motion.p>{" "}
          </div>{" "}
        </section>{" "}
        <RecoveryPreviewSection />
        <SupportingEvidencePreviewSection />
        <section className="hidden relative overflow-hidden border-y border-[var(--margin-border-subtle)] bg-white py-16 max-md:border-t-0 max-md:py-16 md:py-28">
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
              {" "}
              <motion.div {...revealProps}>
                {" "}
                <div className={sectionLabelClass}>
                  Before Amazon asks again
                </div>{" "}
                <h2 className={sectionHeadingClass}>
                  <span className="text-[var(--margin-text-primary)]">Know which claims</span> <span className="text-[var(--margin-text-muted)]">can survive Amazon review.</span>
                </h2>{" "}
                <p className={sectionBodyClass}>
                  A claim is not ready because a document exists. It is ready
                  when the proof matches the shipment, quantity, cost basis,
                  deadline, and Amazon response.
                </p>{" "}
              </motion.div>{" "}
              <motion.div
                {...revealProps}
                className="min-w-0 border-t border-[var(--margin-border)] pt-6 lg:border-t-0 lg:border-l lg:border-[var(--margin-border)] lg:pl-10 lg:pt-0"
              >
                {" "}
                <div className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
                  Potential evidence requests
                </div>{" "}
                <div className="mt-5 grid gap-0 border-t border-[var(--margin-border)]">
                  {" "}
                  <div className="grid gap-3 border-b border-[var(--margin-border)] py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                    {" "}
                    <div>
                      {" "}
                      <div className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        Invoice
                      </div>{" "}
                      <div className="mt-1 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
                        Amazon may still ask for the invoice, shipment proof,
                        carrier record, signed POD, or cost breakdown before the
                        case is ready to survive another response.
                      </div>{" "}
                    </div>{" "}
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[var(--margin-text-muted)]">
                      Likely request list
                    </div>{" "}
                  </div>{" "}
                  <div className="grid gap-3 border-b border-[var(--margin-border)] py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                    {" "}
                    <div>
                      {" "}
                      <div className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        Shipment proof
                      </div>{" "}
                      <div className="mt-1 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
                        The shipment record, carrier scan, and receiving data
                        need to line up before the recovery can move forward.
                      </div>{" "}
                    </div>{" "}
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[var(--margin-text-muted)]">
                      Current status
                    </div>{" "}
                  </div>{" "}
                  <div className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
                    {" "}
                    <div>
                      {" "}
                      <div className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        Case readiness
                      </div>{" "}
                      <div className="mt-1 text-[15px] leading-7 text-[var(--margin-text-secondary)]">
                        Margin keeps the evidence trail attached so the case is
                        ready when Amazon asks again.
                      </div>{" "}
                    </div>{" "}
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[var(--margin-text-muted)]">
                      Ready to review
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </motion.div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <RepliesPreviewSection />
        <PayoutReconciliationPreviewSection />
        <ExistingOperationFitSection />
        <RecoveryWorkspacePricingSection
          onActivate={() =>
            handleClaimAccessClick("homepage_recovery_workspace_pricing")
          }
        />
        {/* Additional mini-demo sections are intentionally hidden for the launch page. */}
        {/* <MarginOrchestrationFlow /> */}
        {/* Summary identity cards are hidden so the page focuses on three outcomes. */}
        <section
          className="hidden relative border-y border-[var(--margin-border-subtle)] bg-[var(--margin-canvas)] py-14 md:py-24"
          id="margin-demo"
        >
          {" "}
          <div className={containerClass}>
            {" "}
            <motion.div
              {...revealProps}
              className="mx-auto mb-8 max-w-[880px] text-center md:mb-12"
            >
              {" "}
              <div className={sectionLabelClass}>See Demo</div>{" "}
              <h2 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[40px] md:text-[58px]">
                <span className="text-[var(--margin-text-primary)]">See how a discovered discrepancy</span> <span className="text-[var(--margin-text-muted)]">becomes a case Amazon can review.</span>
              </h2>{" "}
              <p className="mx-auto mt-5 max-w-[720px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
                {" "}
                Follow the path from deadline pressure to evidence matching,
                seller approval, Amazon pushback, and payout
                reconciliation.{" "}
              </p>{" "}
            </motion.div>{" "}
            <motion.button
              type="button"
              onClick={openDemo}
              {...revealProps}
              className="landing-menu-item group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[2px] border border-[var(--margin-border)] bg-white text-left shadow-[0_34px_100px_rgba(37,49,58,0.14)] transition-[border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--margin-blue)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--margin-section-alt)]"
              aria-label="Watch the Margin product demo"
            >
              {" "}
              <div className="relative aspect-video overflow-hidden bg-[#E9EEF2]">
                {" "}
                <img
                  src={DEMO_VIDEO_THUMBNAIL_URL}
                  alt="Margin reimbursement proof path product demo thumbnail"
                  className="h-full w-full object-cover opacity-95 saturate-[0.95]"
                  loading="lazy"
                />{" "}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(24,32,38,0.54)_100%)]" />{" "}
                <div className="absolute inset-0 flex items-center justify-center">
                  {" "}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-white/88 text-[var(--margin-blue)] shadow-[0_22px_54px_rgba(37,49,58,0.18)] backdrop-blur md:h-20 md:w-20">
                    {" "}
                    <PlayCircle
                      className="h-8 w-8 md:h-10 md:w-10"
                      strokeWidth={1.7}
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8">
                  {" "}
                  <div className="text-[10px] font-semibold uppercase tracking-tight text-white/78 md:text-[11px]">
                    Discrepancy-to-proof walkthrough
                  </div>{" "}
                  <div className="mt-2 max-w-[780px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-white md:text-[36px]">
                    {" "}
                    The case keeps its proof, approval, response, and payout
                    trail attached.{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </motion.button>{" "}
          </div>{" "}
        </section>{" "}
        <section className="hidden relative border-b border-[var(--margin-border-subtle)] bg-[var(--margin-canvas)] py-14 md:py-20">
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="max-w-[680px] md:mx-auto md:text-center">
              {" "}
              <div className={sectionLabelClass}>Evidence Sources</div>{" "}
              <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.04em] md:text-[42px]">
                <span className="text-[var(--margin-text-primary)]">The proof exists.</span> <span className="text-[var(--margin-text-muted)]">Amazon just will not accept it scattered.</span>
              </h2>{" "}
              <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
                {" "}
                The invoice in Gmail, the BOL in Drive, the POD in a carrier
                portal, the shipment ID in Seller Central, and the payout record
                in settlements only matter when they point to the same recovery
                case.{" "}
              </p>{" "}
            </div>{" "}
            <div className="mt-8 md:mt-10">
              <EvidenceSourcesOrchestrator />
            </div>{" "}
            <p className="mx-auto mt-6 max-w-[760px] text-center text-[14px] leading-7 text-[var(--margin-text-secondary)] max-md:text-left md:text-[16px]">
              {" "}
              Amazon never reviews your Gmail. <br /> Or your Drive. <br /> Or
              your carrier portal. <br /> It reviews one reimbursement case.{" "}
              <br /> Everything has to point to the same recovery before Amazon
              accepts it.{" "}
            </p>{" "}
          </div>{" "}
        </section>{" "}
        <section
          className="hidden relative bg-[var(--margin-canvas)] py-14 max-md:border-b max-md:border-[var(--margin-border-subtle)] md:py-24"
          id="how-margin-works"
        >
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr] lg:items-end">
              {" "}
              <div>
                {" "}
                <div className="flex items-center gap-8 font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                  {" "}
                  <span>06</span> <span>What Happens After Detection</span>{" "}
                </div>{" "}
                <h2 className="font-serif-headline mt-5 max-w-[820px] text-[30px] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[44px] md:text-[58px] lg:text-[64px]">
                  <span className="text-[var(--margin-text-primary)]">
                    Finding the discrepancy is not the hard part.
                  </span>{" "}
                  <span className="text-[var(--margin-text-muted)]">Proving it is.</span>
                </h2>{" "}
              </div>{" "}
              <p className="max-w-[660px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9 lg:justify-self-end">
                {" "}
                Once the issue is found, the work becomes proof: deadline,
                invoice, BOL, POD, shipment ID, quantity, cost basis, Amazon
                response, and seller approval all have to support the same
                case.{" "}
              </p>{" "}
            </div>{" "}
            <div className="workflow-scrollbar-hide mt-10 border-y border-[#C9D6DE] overflow-x-auto overflow-y-hidden pb-2 pt-5 md:mt-14 md:overflow-hidden md:pt-7">
              <motion.div
                className="workflow-marquee-track flex w-max snap-x snap-mandatory items-stretch gap-x-4 pr-5 md:gap-x-7"
                style={{ ["--duration" as string]: "58s" }}
              >
                {" "}
                {(isMobileLayout
                  ? workflowSteps
                  : [...workflowSteps, ...workflowSteps]
                ).map((item, index) => (
                  <div
                    key={`${item.step}-${index}`}
                    className="min-h-[210px] w-[260px] shrink-0 snap-start pt-1 sm:w-[280px] md:min-h-[240px] md:w-[270px] lg:w-[320px]"
                  >
                    {" "}
                    <div className="flex h-full flex-col">
                      {" "}
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)] md:text-[11px]">
                        {" "}
                        {item.step}{" "}
                      </div>{" "}
                      <h3 className="font-serif-headline mt-4 max-w-[240px] text-[22px] font-bold leading-[1.08] tracking-[-0.025em] text-[var(--margin-text-primary)] md:mt-5 md:max-w-[260px] md:text-[29px]">
                        {" "}
                        {item.title}{" "}
                      </h3>{" "}
                      <p className="mt-3 max-w-[240px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:mt-4 md:max-w-[285px] md:text-[15px] md:leading-7">
                        {" "}
                        {item.detail}{" "}
                      </p>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </motion.div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="hidden relative border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-14 max-md:border-y max-md:border-[var(--margin-border)] md:py-20">
          <div className={containerClass}>
            <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <motion.div {...revealProps}>
                <div className={sectionLabelClass}>Security & Trust</div>
                <h2 className={sectionHeadingClass}>
                  <span className="text-[var(--margin-text-primary)]">Your Amazon account</span> <span className="text-[var(--margin-text-muted)]">stays under your control.</span>
                </h2>
                <p className={sectionBodyClass}>
                  Margin connects through Amazon&apos;s official authorization
                  process, begins with read-only audit access, and never files a
                  case without seller approval.
                </p>
              </motion.div>
              
              <motion.div {...revealProps} className="border-y border-[var(--margin-border)]">
                {securityFeatures.map((item) => (
                  <div
                    key={item}
                    className="relative flex items-center gap-4 border-b border-[var(--margin-border)] py-4 last:border-b-0 md:py-5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[var(--margin-blue-soft)] text-[var(--margin-blue)]">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </div>
                    <span className="text-[15px] font-medium leading-6 tracking-tight text-[var(--margin-text-primary)] md:text-[16px]">
                      {item}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
        <section
          className="hidden relative border-t border-[var(--margin-border-subtle)] bg-white py-16 max-md:border-y max-md:border-[var(--margin-border-subtle)] md:py-28"
          id="why-margin-outperforms"
        >
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="mx-auto max-w-[880px] text-center"
            >
              <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-[#CBD7DE] bg-[#F9FBFC] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-tight text-[var(--margin-text-secondary)]">
                Why Margin Outperforms
              </div>
              <h2 className="text-[38px] font-bold leading-[0.98] tracking-[-0.055em] text-[var(--margin-text-primary)] sm:text-[54px] md:text-[68px] lg:text-[76px]">
                Why Margin outperforms
              </h2>
              <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[20px] md:leading-9">
                Margin is not another claims checklist. It turns fragmented
                reimbursement signals into a controlled recovery system sellers
                can actually trust.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-3 md:mt-16 md:grid-cols-2">
              {outperformanceCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  {...revealProps}
                  transition={{
                    ...revealProps.transition,
                    delay: index * 0.06,
                  }}
                  className="grid min-h-[168px] grid-cols-[58px_1px_minmax(0,1fr)] gap-5 rounded-[2px] border border-[var(--margin-border-subtle)] bg-white px-5 py-6 shadow-[0_20px_60px_rgba(37,49,58,0.04)] sm:grid-cols-[76px_1px_minmax(0,1fr)_auto] sm:px-6 md:min-h-[188px] md:gap-6 lg:px-7"
                >
                  <div className="flex items-center text-[42px] font-semibold leading-none tracking-[-0.06em] text-[#D7DDE2] sm:text-[50px] md:text-[56px]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="h-full w-px bg-[var(--margin-border-subtle)]" />
                  <div className="min-w-0 self-center">
                    <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.04em] text-[var(--margin-text-primary)] md:text-[24px]">
                      {card.title}
                    </h3>
                    <ul className="mt-4 space-y-2">
                      {card.points.map((point, pointIndex) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px]"
                        >
                          <span
                            className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-[1px] ${
                              pointIndex === 0 ? "bg-[var(--margin-blue)]" : "bg-[var(--margin-success)]"
                            }`}
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 self-center justify-self-start sm:col-span-1 sm:grid sm:grid-cols-2 sm:justify-self-end">
                    {card.logos.map((logo) => (
                      <div
                        key={`${card.title}-${logo.alt}`}
                        className="flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9"
                      >
                        <img
                          src={logo.src}
                          alt={logo.alt}
                          className="max-h-7 max-w-7 object-contain"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="hidden relative bg-[var(--margin-canvas)] py-14 max-md:border-b max-md:border-[var(--margin-border-subtle)] max-md:bg-white md:py-24">
          {" "}
          <div className={containerClass}>
            {" "}
            <motion.div {...revealProps} className="max-w-[780px]">
              {" "}
              <div className={sectionLabelClass}>
                Before and After Proof
              </div>{" "}
              <h2 className={sectionHeadingClass}>
                <span className="text-[var(--margin-text-primary)]">The same evidence</span> <span className="text-[var(--margin-text-muted)]">can either stay scattered or become a case.</span>
              </h2>{" "}
              <p className={sectionBodyClass}>
                {" "}
                Sellers do not lose because Gmail, Drive, Seller Central, Excel,
                or carrier portals are empty. They lose because the records
                never become one proof trail in time.{" "}
              </p>{" "}
            </motion.div>{" "}
            <motion.div
              {...revealProps}
              className="mt-12 overflow-hidden border-y border-[#CBD7DE] bg-transparent max-md:mt-8"
            >
              {" "}
              <div className="grid gap-0 lg:grid-cols-2">
                {" "}
                <div className="px-0 py-8 md:py-10 lg:pr-12">
                  {" "}
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-danger)] md:text-[var(--margin-text-muted)]">
                    {" "}
                    Scattered Recovery{" "}
                  </div>{" "}
                  <h3 className="mt-5 max-w-[440px] text-[26px] font-semibold leading-tight tracking-[-0.04em] text-[#4E5B65] max-md:mt-3 max-md:text-[24px] md:text-[34px]">
                    {" "}
                    Scattered proof dies slowly.{" "}
                  </h3>{" "}
                  <div className="mt-8 border-t border-[var(--margin-border)] max-md:mt-6">
                    {" "}
                    {stateTransitionSources.map((source, index) => (
                      <motion.div
                        key={source}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{
                          opacity: [0, 0.72, 0.48, 0.78, 0.62],
                          x: [-8, 2, -2, 1, 0],
                        }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          duration: 0.72,
                          delay: index * 0.08,
                          ease: "easeOut",
                        }}
                        className={`flex items-center justify-between gap-4 py-4 ${index > 0 ? "border-t border-[var(--margin-border)]" : ""}`}
                      >
                        {" "}
                        <span className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[16px]">
                          {" "}
                          {source}{" "}
                        </span>{" "}
                        <span className="font-mono text-[10px] uppercase tracking-tight text-[var(--margin-text-muted)]">
                          {" "}
                          detached source{" "}
                        </span>{" "}
                      </motion.div>
                    ))}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="border-t border-[#CBD7DE] px-0 py-8 md:py-10 lg:border-l lg:border-t-0 lg:pl-12">
                  {" "}
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-success)] md:text-[var(--margin-text-secondary)]">
                    {" "}
                    Defensible Recovery{" "}
                  </div>{" "}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.38 }}
                    transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {" "}
                    <h3 className="mt-5 max-w-[460px] text-[28px] font-semibold leading-tight tracking-[-0.045em] text-[var(--margin-text-primary)] max-md:mt-3 max-md:text-[24px] md:text-[38px]">
                      {" "}
                      One evidence trail survives review.{" "}
                    </h3>{" "}
                    <div className="mt-8 border-t border-[#C9D6DE] bg-transparent max-md:mt-6">
                      {" "}
                      {stateTransitionSources.map((source, index) => (
                        <motion.div
                          key={source}
                          initial={{ opacity: 0, x: 16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{
                            duration: 0.45,
                            delay: 0.18 + index * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`flex items-center gap-3 py-4 ${index > 0 ? "border-t border-[var(--margin-border)]" : ""}`}
                        >
                          {" "}
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--margin-success)] text-white">
                            {" "}
                            <Check
                              className="h-2.5 w-2.5"
                              strokeWidth={3}
                            />{" "}
                          </span>{" "}
                          <span className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--margin-text-primary)] md:text-[16px]">
                            {" "}
                            {source}{" "}
                          </span>{" "}
                          <span className="ml-auto font-mono text-[10px] uppercase tracking-tight text-[#7B8A95]">
                            {" "}
                            verified{" "}
                          </span>{" "}
                        </motion.div>
                      ))}{" "}
                    </div>{" "}
                  </motion.div>{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
        </section>{" "}
        {/* <ScrollytellingCoverage /> */} {/* <SystemPerformanceTicker /> */}{" "}
        <section className="hidden relative bg-white py-14 max-md:border-b max-md:border-[var(--margin-border-subtle)] max-md:bg-white md:py-24">
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              {" "}
              <motion.div {...revealProps}>
                {" "}
                <div className={sectionLabelClass}>Trust & Control</div>{" "}
                <h2 className={sectionHeadingClass}>
                  <span className="text-[var(--margin-text-primary)]">Amazon doesn&apos;t stop after you submit.</span> <span className="text-[var(--margin-text-muted)]">Neither does Margin.</span>
                </h2>{" "}
                <p className={sectionBodyClass}>
                  {" "}
                  Amazon can reject. Ask for more proof. Approve less than
                  expected. Or approve everything and still pay the wrong
                  amount. Margin keeps the recovery moving until the evidence,
                  the response, and the payout all agree. QuickBooks and Xero
                  connections are used to support reconciliation and export
                  workflows. Margin does not change accounting records without
                  seller approval.{" "}
                </p>{" "}
              </motion.div>{" "}
              <div className="w-full">
                {" "}
                {trustControls.map((item, index) => (
                  <motion.div
                    key={item.title}
                    {...revealProps}
                    transition={{
                      ...revealProps.transition,
                      delay: index * 0.05,
                    }}
                    className={`grid gap-4 py-7 sm:grid-cols-[54px_minmax(0,1fr)] md:py-8 ${index > 0 ? "border-t border-[var(--margin-border)]" : ""}`}
                  >
                    {" "}
                    <div>
                      {" "}
                      <div className="text-[12px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                        {" "}
                        {String(index + 1).padStart(2, "0")}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <h3 className="text-[19px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)] md:text-[22px]">
                        {item.title}
                      </h3>{" "}
                      <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">
                        {item.detail}
                      </p>{" "}
                    </div>{" "}
                  </motion.div>
                ))}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        {/* <SystemLogMarquee /> */}{" "}
        <section className="hidden relative bg-white py-14 max-md:border-b max-md:border-[var(--margin-border-subtle)] md:py-24">
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              {" "}
              <motion.div {...revealProps} className="max-w-[560px]">
                {" "}
                <div className={sectionLabelClass}>Marketplace Scope</div>{" "}
                <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[58px]">
                  {" "}
                  Built for Amazon FBA operators worldwide.{" "}
                </h2>{" "}
                <p className={sectionBodyClass}>
                  {" "}
                  Margin currently supports sellers across the major Amazon FBA
                  marketplaces. Margin currently supports the listed
                  marketplaces. Additional regions will be added over time.{" "}
                </p>{" "}
              </motion.div>{" "}
              <motion.div
                {...revealProps}
                className="border-y border-[var(--margin-border)] sm:grid sm:grid-cols-2 xl:grid-cols-3"
              >
                {" "}
                {marketplaceCountries.map((marketplace, index) => (
                  <motion.div
                    key={marketplace.code}
                    {...revealProps}
                    transition={{
                      ...revealProps.transition,
                      delay: index * 0.035,
                    }}
                    className={`group flex items-center gap-4 py-5 sm:px-5 ${index > 0 ? "border-t border-[var(--margin-border)] sm:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-[var(--margin-border)]" : ""} ${index >= 2 ? "sm:border-t sm:border-[var(--margin-border)]" : ""} ${index % 3 !== 0 ? "xl:border-l xl:border-[var(--margin-border)]" : "xl:border-l-0"} ${index >= 3 ? "xl:border-t xl:border-[var(--margin-border)]" : ""}`}
                  >
                    {" "}
                    <span
                      className={`fi fi-${marketplace.flagCode} h-5 w-7 shrink-0 rounded-[4px] shadow-[0_8px_18px_rgba(37,49,58,0.12)]`}
                      aria-hidden="true"
                    />{" "}
                    <div>
                      {" "}
                      <div className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        {marketplace.country}
                      </div>{" "}
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                        {" "}
                        {marketplace.region} · {marketplace.code}{" "}
                      </div>{" "}
                    </div>{" "}
                  </motion.div>
                ))}{" "}
              </motion.div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="relative border-t border-[var(--margin-border)] bg-[var(--margin-surface)] py-14 max-md:py-16 md:py-20">
          {" "}
          <div className={containerClass}>
            {" "}
            <motion.div {...revealProps}>
              {" "}
              <h2 className="text-[34px] font-medium leading-tight tracking-[-0.045em] sm:text-[42px] md:text-[46px]">
                <span className="text-[var(--margin-text-primary)]">Frequently asked</span> <span className="text-[var(--margin-text-muted)]">questions</span>
              </h2>{" "}
            </motion.div>{" "}
            <div className="mt-10 md:mt-14">
              {" "}
              <Accordion
                type="single"
                collapsible
                className="w-full border-t border-[var(--margin-border)]"
              >
                {" "}
                {faqs.slice(0, visibleFaqCount).map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-[var(--margin-border)] px-0"
                  >
                    {" "}
                    <AccordionTrigger className="py-6 text-left text-[18px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)] hover:no-underline md:py-7 md:text-[22px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[var(--margin-text-muted)]">
                      {" "}
                      {item.question}{" "}
                    </AccordionTrigger>{" "}
                    <AccordionContent className="max-w-[860px] pb-7 pr-10 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
                      {" "}
                      <p>{item.answer}</p>{" "}
                    </AccordionContent>{" "}
                  </AccordionItem>
                ))}{" "}
              </Accordion>{" "}
              {!showMoreFaqs ? (
                <div className="mt-9 flex justify-start md:mt-11">
                  {" "}
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreFaqs(true)}
                    className="rounded-[5px] border-[var(--margin-border)] bg-white px-6 text-sm font-semibold text-[var(--margin-text-secondary)] hover:bg-[var(--margin-section-alt)]"
                  >
                    {" "}
                    Show more questions{" "}
                  </Button>{" "}
                </div>
              ) : null}{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="hidden relative bg-[var(--margin-canvas)] py-12 max-md:border-b max-md:border-[var(--margin-border)] md:py-16">
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              {" "}
              <motion.div {...revealProps} className="max-w-[560px]">
                {" "}
                <div className={sectionLabelClass}>Marketplace Scope</div>{" "}
                  <h2 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px]">
                  {" "}
                  Built for Amazon FBA operators worldwide.{" "}
                </h2>{" "}
                <p className={sectionBodyClass}>
                  {" "}
                  Margin currently supports sellers across the major Amazon FBA
                  marketplaces. Margin currently supports the listed
                  marketplaces. Additional regions will be added over time.{" "}
                </p>{" "}
              </motion.div>{" "}
              <motion.div
                {...revealProps}
                className="border-y border-[var(--margin-border)] sm:grid sm:grid-cols-2 xl:grid-cols-3"
              >
                {" "}
                {marketplaceCountries.map((marketplace, index) => (
                  <motion.div
                    key={marketplace.code}
                    {...revealProps}
                    transition={{
                      ...revealProps.transition,
                      delay: index * 0.035,
                    }}
                    className={`group flex items-center gap-4 py-5 sm:px-5 ${index > 0 ? "border-t border-[var(--margin-border)] sm:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-[var(--margin-border)]" : ""} ${index >= 2 ? "sm:border-t sm:border-[var(--margin-border)]" : ""} ${index % 3 !== 0 ? "xl:border-l xl:border-[var(--margin-border)]" : "xl:border-l-0"} ${index >= 3 ? "xl:border-t xl:border-[var(--margin-border)]" : ""}`}
                  >
                    {" "}
                    <span
                      className={`fi fi-${marketplace.flagCode} h-5 w-7 shrink-0 rounded-[4px] shadow-[0_8px_18px_rgba(37,49,58,0.12)]`}
                      aria-hidden="true"
                    />{" "}
                    <div>
                      {" "}
                      <div className="text-[16px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                        {marketplace.country}
                      </div>{" "}
                      <div className="mt-1 text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
                        {" "}
                        {marketplace.region} · {marketplace.code}{" "}
                      </div>{" "}
                    </div>{" "}
                  </motion.div>
                ))}{" "}
              </motion.div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="relative bg-[var(--margin-canvas)] py-14 max-md:border-y max-md:border-[var(--margin-border-subtle)] max-md:bg-[var(--margin-canvas)] md:py-24">
          {" "}
          <div className={containerClass}>
            {" "}
            <motion.div
              {...revealProps}
              className="hidden overflow-hidden border-y border-[var(--margin-border)] bg-white py-8 md:py-12"
            >
              {" "}
              <div className="max-w-[880px]">
                {" "}
                <h2 className="mt-4 max-w-[860px] text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[42px] md:text-[68px]">
                  <span className="text-[var(--margin-text-primary)]">Every recovery starts with &quot;I know Amazon owes me.&quot;</span> <span className="text-[var(--margin-text-muted)]">Too many end with &quot;I couldn&apos;t prove it.&quot; Don&apos;t let yours.</span>
                </h2>{" "}
                <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px] md:leading-9">
                  {" "}
                  Margin keeps every invoice, shipment record, POD, deadline,
                  response, and payout attached to the same recovery until the
                  money is actually reconciled.{" "}
                </p>{" "}
              </div>{" "}
              <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                {" "}
                <Button
                  onClick={() => handleClaimAccessClick("homepage_bottom_cta")}
                  className="h-12 w-full sm:w-auto rounded-[8px] bg-[var(--margin-blue)] px-10 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(23,92,211,0.22)] hover:bg-[var(--margin-blue-hover)] max-md:shadow-none"
                >
                  {" "}
                  {primaryCtaLabel} <ArrowRight className="ml-2 h-4 w-4" />{" "}
                </Button>{" "}
              </div>{" "}
            </motion.div>{" "}
          </div>{" "}
        </section>{" "}
        <section
          className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-18"
        >
          {" "}
          <div className={containerClass}>
            {" "}
            <div className="relative border-y border-[var(--margin-border)] py-8 md:py-10">
              {" "}
              <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                {" "}
                <motion.div {...revealProps}>
                  {" "}
                  <h2 className="font-serif-headline mt-2 max-w-[760px] text-[36px] font-semibold leading-[1.02] tracking-tight sm:text-[46px] md:text-[58px]">
                    <span className="text-[var(--margin-text-primary)]">You&apos;ve already done the hard work.</span> <span className="text-[var(--margin-text-muted)]">Margin simply connects it.</span>
                  </h2>{" "}
                  <p className="mt-5 max-w-[740px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[17px]">
                    {" "}
                    Shipment records. Invoices. PODs. Settlement history.
                    Support cases. Margin brings them together into one recovery
                    workflow before Amazon asks for proof.{" "}
                  </p>{" "}
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    {" "}
                    <Button
                      onClick={() =>
                        handleClaimAccessClick("homepage_early_access_section")
                      }
                    className="landing-pressable hidden group relative h-14 w-full rounded-[8px] bg-[var(--margin-blue)] px-8 text-[15px] font-bold text-white shadow-[0_18px_40px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow,transform] duration-150 max-md:shadow-none sm:w-auto"
                    >
                      {" "}
                      <div className="absolute inset-0 rounded-[8px] bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />{" "}
                      {primaryCtaLabel}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />{" "}
                    </Button>{" "}
                  </div>{" "}
                </motion.div>{" "}
                <motion.div {...revealProps} className="border-y border-[var(--margin-border)]">
                  {" "}
                  {earlyAccessItems.map((item) => (
                    <div
                      key={item}
                      className="relative flex items-center gap-3 border-b border-[var(--margin-border)] py-4 last:border-b-0 md:py-5"
                    >
                      {" "}
                      <Check className="h-4 w-4 shrink-0 text-[var(--margin-success)]" strokeWidth={2.2} />{" "}
                      <span className="text-[15px] font-medium leading-6 tracking-tight text-[var(--margin-text-primary)] md:text-[16px]">
                        {" "}
                        {item}{" "}
                      </span>{" "}
                    </div>
                  ))}{" "}
                </motion.div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
      </main>{" "}
      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin recovery walkthrough"
        description="Watch how Margin keeps Amazon reimbursement proof tied together after discrepancies are identified, from deadline review and evidence matching to rejection handling and payout reconciliation."
        analyticsLocation="homepage_demo_section"
        videoName="margin_demo"
      />{" "}
      <BrandFooter /> <CookieConsent />{" "}
    </div>
  );
}


