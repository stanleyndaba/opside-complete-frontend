import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useMotionValueEvent,
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
  Landmark,
  MessagesSquare,
  Monitor,
  PlayCircle,
  ReceiptText,
  SearchCheck,
  UserCheck,
  Square,
} from "lucide-react";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { DemoVideoModal } from "@/components/demo/DemoVideoModal";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { useNavigate, Link } from "react-router-dom";
import { RecoveryOfferSection, RecoveryRoutingSection } from "@/components/landing/RecoveryDecisionSections";
import { AuditImageStackVisual } from "@/components/landing/AuditImageStackVisual";
import { useOnboardingCapacity } from "@/hooks/useOnboardingCapacity";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ANALYTICS_EVENTS } from "@/lib/analyticsEvents";
import { trackEarlyAccessCtaClicked, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const DEMO_VIDEO_URL = "https://youtu.be/B0ksWTlYbRo";
const DEMO_VIDEO_THUMBNAIL_URL = "/margin-logo-reveal.gif";

const faqs = [
  {
    question: "Does the Recovery Audit cost anything?",
    answer:
      "No. The Recovery Audit is free. You can review what Margin found before deciding whether you want any recovery work managed. No payment is required to run the Audit.",
  },
  {
    question: "What access does Margin need?",
    answer:
      "Margin uses read-only access or the relevant Amazon report sources for the Audit. You can see the source coverage used for your result.",
  },
  {
    question: "Can Margin submit something without me?",
    answer:
      "No. Nothing is submitted to Amazon without your explicit approval for that recovery.",
  },
  {
    question: "What happens if Margin does not find anything to handle?",
    answer:
      "You still receive a clear result: what Margin checked, what appears settled, what may need more evidence or time, and whether there is a sensible next step.",
  },
  {
    question: "How does Recover Once pricing work?",
    answer:
      "If the Audit identifies a defined recovery Margin can take over, you receive a personalized fixed quote before paid work begins. The scope states what Margin will handle, what you need to approve, and what outcome record you will receive.",
  },
  {
    question: "What if I want Margin to keep looking?",
    answer:
      "If the Audit shows recurring recovery work that you want off your team’s plate, Recovery Workspace keeps the evidence, cases, responses, and payout tracking together over time.",
  },
  {
    question: "What does payout verified mean?",
    answer:
      "Margin compares the current supported recovery amount with the relevant Amazon approval and settlement records. Partial payments, reversals, and unresolved balances remain visible rather than being treated as complete.",
  },
  {
    question: "What exactly does Margin handle?",
    answer:
      "Margin investigates supported opportunities, assembles evidence, prepares approved recovery work, follows responses, and keeps outcomes visible through payout verification.",
  },
  {
    question: "What happens when Amazon rejects something?",
    answer:
      "The rejection reason remains visible and Margin identifies the next supported path, such as additional evidence, review, appeal, or reassessment.",
  },
  {
    question: "Can I see the evidence?",
    answer:
      "Yes. Margin keeps the records and supporting evidence behind a finding inspectable so you can understand what happened before approving next steps.",
  },
  {
    question: "Does Margin replace my accounting software?",
    answer:
      "No. When financial context is needed to establish a recovery, Margin can use relevant supporting records without replacing your accounting system.",
  },
  {
    question: "Can I stop using Margin?",
    answer:
      "Yes. Margin is designed to keep your recovery records clear and visible, while you remain in control of the work and any approved actions.",
  },
];

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";
const sectionLabelClass =
  "font-mono text-[11px] font-semibold tracking-tight text-[var(--margin-text-muted)]";
const sectionBodyClass =
  "mt-6 max-w-[740px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px] md:leading-9";
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

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

const accountingSources = [
  { id: "amazon", name: "Amazon", context: "orders + settlement", src: "/amazon-logo-transparent-circle.png", route: "M 12 14 H 28 V 94 H 50" },
  { id: "gmail", name: "Gmail", context: "invoices + threads", src: "/gmailicon.png", route: "M 50 14 V 94" },
  { id: "drive", name: "Google Drive", context: "documents + records", src: "/gd.png", route: "M 88 14 H 72 V 94 H 50" },
  { id: "quickbooks", name: "QuickBooks", context: "cost basis", src: "/quickbooks.png", route: "M 12 50 H 30 V 94 H 50" },
  { id: "slack", name: "Slack", context: "internal context", src: "/slack-icon-2019.png", route: "M 50 50 V 94 H 50" },
  { id: "xero", name: "Xero", context: "accounting records", src: "/xero.png", route: "M 88 50 H 70 V 94 H 50" },
  { id: "dropbox", name: "Dropbox", context: "supporting files", src: "/Dropbox_Icon.svg.png", route: "M 12 86 H 30 V 94 H 50" },
  { id: "outlook", name: "Outlook", context: "supplier correspondence", src: "/outlookicon.webp", route: "M 50 86 V 94" },
  { id: "onedrive", name: "OneDrive", context: "working documents", src: "/onedriive.png", route: "M 88 86 H 70 V 94 H 50" },
];

const getAccountingRow = (order: string[]) => order.map((id) => accountingSources.find((source) => source.id === id)!).filter(Boolean);
const accountingRows = [
  getAccountingRow(["drive", "amazon", "slack", "outlook", "quickbooks", "gmail", "onedrive", "xero", "dropbox"]),
  getAccountingRow(["xero", "gmail", "dropbox", "amazon", "onedrive", "quickbooks", "drive", "outlook", "slack"]),
];

function AccountingEvidenceSection() {
  const reduceMotion = useReducedMotion();
  const [activeEvidence, setActiveEvidence] = useState(0);
  const activeSource = accountingSources[activeEvidence % accountingSources.length];

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setActiveEvidence((current) => (current + 1) % accountingSources.length);
    }, 1900);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  const accountingHighlights = [
    {
      heading: "Understand what happened",
      body: "Amazon records can show the shipment, inventory movement, fee, adjustment, or reimbursement.",
    },
    {
      heading: "Understand what it’s worth",
      body: "Relevant financial records help establish the amount involved, what should have happened, and whether the recovery is actually supported.",
    },
    {
      heading: "Know what was settled",
      body: "Margin connects the recovery to the financial outcome, so you can see whether the money was paid, adjusted, reversed, or still outstanding.",
    },
  ];

  return (
    <section data-navbar-theme="dark" className="relative overflow-x-hidden border-b border-[var(--margin-border)] bg-[#FAFAF7] py-16 md:py-24" aria-labelledby="accounting-section-title">
        <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-16">
          <motion.div {...revealProps} className="min-w-0 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">              08 / FINANCIAL CONTEXT</span>
            </div>
            <h2 id="accounting-section-title" className="max-w-[980px] break-words font-lora text-[28px] leading-[1.04] tracking-[-0.04em] text-[#182026] sm:text-[38px] md:text-[42px] lg:text-[44px]" style={{ fontWeight: 400 }}>
              The recovery doesn&apos;t exist in isolation.
            </h2>
            <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Amazon shows you the event. Your financial records show you what that event was worth. Margin brings the relevant pieces together so the recovery can be understood, supported, and ultimately closed.
            </p>
          </motion.div>

        </div>

        <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 xl:mt-12">
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative min-w-0 lg:pt-2">
            <div className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(145deg,#1B1B1B_0%,#101010_58%,#080808_100%)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.18)] sm:p-6 md:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#B4B4B4]">Recovery context</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#858585]">Live record</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                <div className="rounded-[7px] border border-white/10 bg-white/[0.06] p-3.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#A6A6A6]">Amazon event</span>
                  <p className="mt-3 font-lora text-[20px] leading-[1.02] tracking-[-0.03em] text-white">Inventory adjustment</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#9C9C9C]">Shipment · fee · reimbursement</p>
                </div>
                <div className="hidden items-center justify-center px-1 sm:flex"><div className="h-px w-8 bg-[#777777]" /></div>
                <div className="rounded-[7px] border border-[#666666] bg-white/[0.07] p-3.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#BEBEBE]">Financial context</span>
                  <p className="mt-3 font-lora text-[20px] leading-[1.02] tracking-[-0.03em] text-white">Amount supported</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#A0A0A0]">Cost · settlement · payment</p>
                </div>
              </div>
              <div className="mt-3 rounded-[7px] border border-[#858585] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#E1E1E1]">Margin recovery record</span>
                  <span className="rounded-full border border-[#969696]/60 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.08em] text-[#E1E1E1]">Understood</span>
                </div>
                <p className="mt-3 max-w-[420px] font-lora text-[23px] leading-[1.02] tracking-[-0.03em] text-white">The event, its value, and its outcome stay connected.</p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A6A6A6]">Relevant context sources</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#858585]">read-only · purpose-limited</span>
                </div>
                <div className="relative overflow-hidden">
                  <div className="space-y-2">
                    {accountingRows.map((row, rowIndex) => (
                      <motion.div
                        key={rowIndex}
                        className="flex w-max gap-2"
                        animate={reduceMotion ? { x: rowIndex === 0 ? 0 : -44 } : { x: rowIndex === 0 ? [0, -76] : [-44, 20] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: rowIndex === 0 ? 22 : 26, repeat: Infinity, ease: "linear" }}
                      >
                        {[...row, ...row].map((source, index) => {
                          const isActive = source.id === activeSource.id;
                          return (
                            <div key={`${source.id}-${rowIndex}-${index}`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] border ${isActive ? "border-[#D2D2D2] bg-white" : "border-white/10 bg-white/[0.06]"}`}>
                              <img src={source.src} alt={source.name} className={`max-h-6 max-w-6 object-contain ${isActive ? "opacity-100" : "opacity-70"}`} />
                            </div>
                          );
                        })}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.18 }} className="min-w-0 lg:order-2 lg:pt-5">
            <div className="border-t border-[#C9D1D6]">
              {accountingHighlights.map((highlight) => (
                <div key={highlight.heading} className="border-b border-[#C9D1D6] py-3.5 md:py-4">
                  <h3 className="text-[13px] font-semibold leading-5 text-[#182026] md:text-[14px]">{highlight.heading}</h3>
                  <p className="mt-1.5 max-w-[440px] text-[12px] leading-5 text-[#4D5B66] md:text-[13px] md:leading-5">{highlight.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-[12px] leading-5 text-[#4D5B66] md:text-[13px] md:leading-6">
                You shouldn&apos;t have to search through your books, emails, settlements, and reports to reconstruct the story.
              </p>
              <p className="mt-3 font-lora text-[24px] leading-[1.05] tracking-[-0.04em] text-[#182026] sm:text-[29px] md:text-[34px]" style={{ fontWeight: 400 }}>
                Margin brings the financial context to the recovery.
                <span className="mt-1.5 block text-[#0B74DE]">Not another accounting system. Not another place to manage your books.</span>
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[#4D5B66] md:text-[13px] md:leading-6">
                Just the context Margin needs to handle the recovery properly.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[8px] font-semibold uppercase tracking-tight text-[#66737F]">
                <span>Read-only.</span><span className="text-[#B5C2CA]">·</span><span>Purpose-limited.</span><span className="text-[#B5C2CA]">·</span><span>Your books remain your books.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const historicalVideoSections = [
  { id: "recovery-preview", label: "Recovery preview", title: "See the recovery taking shape.", body: "Margin turns the first signal into a record you can understand, with the underlying activity and evidence kept in view.", videos: ["/Evidentiary.mp4", "/DocumentAnalysis.mp4"] },
  { id: "supporting-evidence-preview", label: "Supporting evidence", title: "The proof stays connected to the case.", body: "Supporting records, case preparation, and filing context remain connected instead of being rebuilt across separate tools.", videos: ["/superEvidence.mp4", "/CaseBuilding.mp4", "/CasesTable.mp4", "/Filing.mp4"] },
  { id: "replies-preview", label: "Replies preview", title: "Amazon responses do not disappear into an inbox.", body: "Responses, rejection context, and the next supported action stay attached to the recovery record.", videos: ["/Replies.mp4", "/2026-07-27__12_58_06_a_m_-Appeals_Scene.mp4"] },
  { id: "payout-reconciliation-preview", label: "Payout reconciliation", title: "The recovery is not complete until the money is checked.", body: "Margin keeps the case outcome connected to the payout record so approved value and actual settlement can be compared.", videos: ["/CasesTable.mp4", "/EvidenceCalibration.mp4"] },
] as const;

function HistoricalVideoPreviewSections() {
  return (
    <>
      {historicalVideoSections.map((section, sectionIndex) => (
        <section key={section.id} aria-labelledby={`${section.id}-title`} className="relative overflow-hidden border-b border-[var(--margin-border)] bg-white py-16 sm:py-20 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[900px]">
              <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">{String(sectionIndex + 1).padStart(2, "0")} / {section.label}</span></div>
              <h2 id={`${section.id}-title`} className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[54px]" style={{ fontWeight: 400 }}>{section.title}</h2>
              <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">{section.body}</p>
            </motion.div>
            <div className={`mt-10 grid gap-5 ${section.videos.length > 2 ? "sm:grid-cols-2" : "lg:grid-cols-2"}`}>
              {section.videos.map((video, videoIndex) => (
                <motion.div key={`${video}-${videoIndex}`} {...revealProps} transition={{ ...revealProps.transition, delay: videoIndex * 0.08 }} className="relative overflow-hidden rounded-[12px] sm:rounded-[16px]"><video className="block aspect-video w-full object-cover" src={video} autoPlay loop muted playsInline preload="auto" aria-label={`${section.label} demonstration ${videoIndex + 1}`} /></motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

function KineticHeroSection({
  onAuditCta,
  onReportCta,
  isFull,
  nextBatchHours,
}: {
  onAuditCta: () => void;
  onReportCta: () => void;
  isFull: boolean;
  nextBatchHours?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.82]);

  return (
    <motion.section
      style={{ scale: reduceMotion ? 1 : heroScale, opacity: reduceMotion ? 1 : heroOpacity }}
      data-navbar-theme="dark"
      className="relative isolate flex min-h-svh overflow-hidden agentic-scan-subtle bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(190,190,190,0.06),transparent_32%),linear-gradient(135deg,#1B1B1B_0%,#101010_54%,#080808_100%)] px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-40 md:min-h-screen md:px-8 md:pb-44 md:pt-40"
      aria-labelledby="margin-hero-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")" }} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><motion.div className="absolute left-[-16%] top-[42%] h-px w-[62%] origin-left bg-gradient-to-r from-transparent via-[rgba(11,116,222,0.52)] to-transparent opacity-60" animate={reduceMotion ? undefined : { x: ["0%", "118%"], opacity: [0, 0.62, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ rotate: "-8deg" }} /></div>
      <div className="relative z-10 flex w-full items-center">
        <div className="max-w-[1040px]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="inline-flex max-w-full items-center rounded-[5px] border border-white/[0.12] bg-[#20385B]/72 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-tight text-slate-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)] backdrop-blur-xl sm:text-[11px]">01 / DELEGATION · AMAZON FBA RECOVERY</motion.div>
          <div id="margin-hero-title" className="mt-6 max-w-[1040px] font-lora text-[42px] leading-[0.96] tracking-[-0.045em] min-[390px]:text-[48px] sm:mt-7 sm:text-[68px] md:text-[82px] lg:text-[96px]" style={{ fontWeight: 400 }}>
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Amazon recovery shouldn&apos;t be <span className="text-slate-400">another job you have to do.</span></motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Margin examines what happened, establishes what Amazon actually owes, handles the recovery work, and tracks each case through to the money actually being recovered.</motion.p>
          <p className="mt-4 font-lora text-[14px] leading-6 tracking-[-0.01em] text-slate-400 sm:mt-5 sm:text-[16px]">You keep selling. Margin handles the recovery.</p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Get it handled" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[#E5E5E0] px-6 text-[15px] font-bold text-[#111111] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition-[background-color,box-shadow] duration-200 hover:bg-[#D4D4CF] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Get It Handled <ArrowRight className="ml-2 h-5 w-5" /></Button>
            <div aria-hidden="true" className="mt-1 flex w-[76%] max-w-[290px] self-center items-center gap-3 sm:hidden"><span className="h-px flex-1 bg-white/15" /><span className="text-[11px] font-medium lowercase tracking-tight text-slate-500">or</span><span className="h-px flex-1 bg-white/15" /></div>
            <button type="button" onClick={onReportCta} className="group inline-flex h-[50px] w-full items-center justify-center px-1 text-[16px] font-semibold text-[#98A2B3] transition-colors duration-200 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] sm:h-11 sm:w-auto sm:justify-start sm:text-[15px]" aria-label="Use Amazon Reports">{reduceMotion ? <span className="leading-[1.25]">Use Amazon Reports</span> : <span className="relative inline-block leading-[1.25] text-[#98A2B3]"><motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_43%,#FFFFFF_50%,transparent_57%,transparent_100%)] bg-[length:280%_100%] bg-clip-text text-transparent" style={{ WebkitBackgroundClip: "text" }} initial={{ backgroundPosition: "150% 0%" }} animate={{ backgroundPosition: ["150% 0%", "-50% 0%"] }} transition={{ duration: 3.4, delay: 1, repeat: Infinity, repeatDelay: 2.8, ease: "linear" }}>Use Amazon Reports</motion.span><span className="relative">Use Amazon Reports</span></span>}</button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="mt-5 flex w-full max-w-[780px] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] font-medium text-slate-300 sm:mt-8 sm:justify-start sm:gap-x-5 sm:text-left sm:text-[12px]">
            <span>Free to run</span><span className="text-slate-600">·</span><span>Read-only access</span><span className="text-slate-600">·</span><span>You approve every submission</span>
          </motion.div>
          {isFull ? <div className="mt-5 max-w-[430px] rounded-[8px] bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
        </div>
      </div>
    </motion.section>
  );
}

import recoveryImg from "@/assets/recoveryy.png";

function OneRecoverySection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28 text-center">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[860px]">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">02 / CATEGORY</span>
          </div>
          <h2 className="font-lora text-[34px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[54px]" style={{ fontWeight: 400 }}>
            One Recovery Operation for Your Amazon Business
          </h2>
          <p className="mt-6 text-[16px] leading-7 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-8">
            From the first discrepancy to the final dollar, Margin keeps the recovery together—what happened, what supports it, what action is appropriate, and whether the money actually came back.
          </p>
        </motion.div>
      </div>
      <div className="mx-auto mt-12 w-full max-w-[1440px] px-0 sm:mt-16 sm:px-4 md:mt-20 md:px-6">
        <motion.div {...revealProps} className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[12px] border border-white/10 bg-[#1B1B1B] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:rounded-[16px] sm:p-5">
          <img src={recoveryImg} alt="Recovery Operation" className="block w-full rounded-[4px] object-cover" style={{ imageRendering: 'high-quality' }} />
        </motion.div>
      </div>
    </section>
  );
}

const realityCheckStages = [
  {
    title: "Prove.",
    words: ["Found", "Verified", "Proven"],
  },
  {
    title: "Move.",
    words: ["Prepared", "Filed", "Followed up", "Defended"],
  },
  {
    title: "Resolve.",
    words: ["Resolved", "Reconciled", "Actually recovered"],
  },
];

const realityCheckWords = realityCheckStages.flatMap((stage) => stage.words);

function RealityCheckSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28">
      <div className={containerClass}>
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
        <motion.div {...revealProps} className="flex max-w-[900px] flex-col justify-center">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              03 / THE PROBLEM</span>
          </div>
          <p className="mb-3 font-lora text-[19px] leading-tight tracking-[-0.025em] text-[var(--margin-text-muted)] sm:text-[23px]" style={{ fontWeight: 400 }}>You already have enough to manage.</p>
          <h2 className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
            Finding the problem is easy. Getting it resolved is the work.
          </h2>
          <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            A reimbursement can be found and still never become money you keep. Margin investigates what happened, gathers the proof, prepares the case, handles Amazon follow-up, and verifies the final payment.
          </p>
          <p className="mt-4 max-w-[720px] font-lora text-[19px] leading-[1.08] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[23px] md:text-[27px]" style={{ fontWeight: 400 }}>
            That is the work Margin takes off your plate.
          </p>
        </motion.div>
        <motion.div {...revealProps} className="mt-6 border-y border-[var(--margin-border)] py-3 md:mt-8 md:py-4">
          <p className="font-mono text-[11px] font-semibold tracking-[0.02em] text-[var(--margin-blue)] sm:text-[12px] md:text-[13px]">
            Understand <span className="px-1 text-[var(--margin-border-strong)]">→</span> Establish <span className="px-1 text-[var(--margin-border-strong)]">→</span> Prove <span className="px-1 text-[var(--margin-border-strong)]">→</span> Recover <span className="px-1 text-[var(--margin-border-strong)]">→</span> Verify <span className="px-1 text-[var(--margin-border-strong)]">→</span> Close
          </p>
        </motion.div>
        <motion.p {...revealProps} className="mt-5 max-w-[760px] font-lora text-[17px] leading-[1.12] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[20px] md:mt-7 md:text-[23px]" style={{ fontWeight: 400 }}>
          You don&apos;t manage the recovery step by step. <span className="text-[var(--margin-text-muted)]">Margin runs the operation.</span>
        </motion.p>
        </div>
        <motion.div {...revealProps} className="relative">
          <AuditImageStackVisual />
        </motion.div>
        </div>
      </div>
    </section>
  );
}

function MarginLifecycleSection() {

  return (
    <section
      aria-labelledby="margin-lifecycle-title"
      className="relative overflow-hidden border-b border-[var(--margin-border)] bg-white py-16 sm:py-20 md:py-28"
    >
      <div className={containerClass}>
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
        <motion.div {...revealProps} className="relative order-2 overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(145deg,#1B1B1B_0%,#101010_58%,#080808_100%)] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-5 lg:order-1 lg:p-7">
          <video className="block aspect-video w-full rounded-[8px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.34)]" src="/workflow.mp4" autoPlay loop muted playsInline preload="auto" aria-label="How Margin handles recovery work" />
        </motion.div>
        <div className="order-1 flex flex-col justify-center lg:order-2">
        <motion.div {...revealProps} className="max-w-[980px]">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              04 / AUTONOMY
            </span>
          </div>
          <h2
            id="margin-lifecycle-title"
            className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]"
            style={{ fontWeight: 400 }}
          >
            <span className="block">Margin doesn&apos;t give you another list to work through.</span>
            <span className="mt-3 block text-[var(--margin-text-muted)]">
              Margin doesn&apos;t just identify a recovery. It takes responsibility for moving it toward resolution.
            </span>
          </h2>
        </motion.div>

          <motion.p
            {...revealProps}
            className="mt-4 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7"
          >
            Margin investigates what happened, establishes what the evidence supports, prepares the appropriate recovery action, manages the case, follows what happens next, and verifies the financial outcome.
          </motion.p>
        </div>
        </div>
      </div>
    </section>
  );
}

const marginOperationAgents = [
  {
    number: "01",
    title: "Margin watches for losses",
    body: "It examines Amazon activity for discrepancies and recovery opportunities that deserve investigation.",
    outcome: "So you don't have to manually hunt through reports.",
  },
  {
    number: "02",
    title: "Margin investigates what actually happened",
    body: "It connects the relevant events, records, transactions, and history to determine whether there is a real recovery case.",
    outcome: "So you're not chasing noise.",
  },
  {
    number: "03",
    title: "Margin determines whether the recovery is worth pursuing",
    body: "Not every discrepancy becomes a case. Margin evaluates the evidence and recovery economics before moving forward.",
    outcome: "So effort is focused on opportunities that actually justify action.",
  },
  {
    number: "04",
    title: "Margin builds the evidence",
    body: "Relevant records and supporting documentation are gathered into an inspectable evidence chain.",
    outcome: "So the reason for the recovery is visible—not buried in spreadsheets.",
  },
  {
    number: "05",
    title: "Margin prepares the case",
    body: "The recovery is structured around what happened, what Amazon records show, and what evidence supports the claim.",
    outcome: "So you aren't manually assembling every case from scratch.",
  },
  {
    number: "06",
    title: "Margin moves the recovery forward",
    body: "Cases don't simply disappear into a spreadsheet after being identified. Margin tracks their progression through the recovery lifecycle.",
    outcome: "So recovery work doesn't depend on someone remembering to follow up.",
  },
  {
    number: "07",
    title: "Margin handles friction",
    body: "If Amazon requires more information, rejects a claim, or produces an outcome that needs further examination, the recovery enters the appropriate next stage.",
    details: ["Additional evidence", "Review", "Appeal", "Escalation", "Outcome reassessment"],
    outcome: "Because a rejection isn't automatically the end of the recovery.",
  },
  {
    number: "08",
    title: "Margin checks the result",
    body: "An approved case is not automatically treated as finished. Margin can track the outcome against what was expected.",
    outcome: "Because \"case closed\" and \"money correctly recovered\" are not always the same thing.",
    emphasis: true,
  },
  {
    number: "09",
    title: "Margin watches for reversals and incomplete outcomes",
    body: "Recovery truth doesn't stop at the first decision. Margin's recovery lifecycle can continue to inspect:",
    details: ["Expected vs actual reimbursement", "Partial outcomes", "Underpayments", "Reversals", "Unresolved discrepancies"],
    outcome: "So the seller has visibility into what actually happened, not just what Amazon said happened.",
  },
];

function MarginOperationSection() {
  const reduceMotion = useReducedMotion();
  const operationScrollRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: operationScrollRef,
    offset: ["start start", "end end"],
  });
  const [activeAgent, setActiveAgent] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextAgent = Math.min(
      marginOperationAgents.length - 1,
      Math.floor(latest * marginOperationAgents.length),
    );
    setActiveAgent((current) => (current === nextAgent ? current : nextAgent));
  });

  return (
    <section ref={operationScrollRef} className="relative border-b border-[var(--margin-border)] bg-[#FAFAF7] py-20 md:py-28">
      <div className={containerClass}>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <motion.div {...revealProps}>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px w-8 bg-[#0B74DE]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                  What Margin actually does
                </span>
              </div>
              <h2 className="font-lora text-[36px] leading-[0.99] tracking-[-0.05em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
                One recovery operation.
                <span className="mt-3 block text-[#8A99A4]">Multiple specialised jobs running inside it.</span>
              </h2>
            </motion.div>
          </div>

          <div className="relative min-h-[560px] md:min-h-[620px]">
            <div className="sticky top-24 h-[min(500px,calc(100vh-8rem))] md:top-28 md:h-[min(540px,calc(100vh-10rem))]">
              <div className="relative h-full">
                {marginOperationAgents.map((agent, index) => {
                  const distance = index - activeAgent;
                  const isAhead = distance > 0;
                  const isBehind = distance < 0;
                  const isFeatured = agent.emphasis;

                  return (
                    <motion.article
                      key={agent.number}
                      initial={false}
                      animate={reduceMotion ? { opacity: index === activeAgent ? 1 : 0, y: 0, scale: 1 } : {
                        opacity: isBehind ? 0 : 1,
                        y: isBehind ? -48 : isAhead ? distance * 18 : 0,
                        scale: isBehind ? 0.94 : 1 - Math.min(distance, 7) * 0.018,
                      }}
                      transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute inset-0 overflow-hidden rounded-[22px] border p-4 shadow-[0_18px_54px_rgba(37,49,58,0.1)] backdrop-blur-xl sm:p-6 md:p-7 ${
                        isFeatured
                          ? "border-[#BFD8EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF4FF_100%)]"
                          : index % 2 === 0
                            ? "border-[#D8E3EA] bg-white/90"
                            : "border-[#CFE0EA] bg-[#F8FAFC]/90"
                      }`}
                      style={{ zIndex: marginOperationAgents.length - index, pointerEvents: index === activeAgent ? "auto" : "none" }}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(11,116,222,0.13),_transparent_62%)]" />
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between gap-3 border-b border-[#E4EDF1] pb-3">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                            Operation {agent.number}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-tight text-[#94A3B8]">
                            {String(index + 1).padStart(2, "0")} / {String(marginOperationAgents.length).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="mt-4 max-w-[700px] font-lora text-[26px] leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[32px] md:text-[38px]" style={{ fontWeight: 400 }}>
                          {agent.title}
                        </h3>
                        <p className="mt-4 max-w-[620px] text-[13px] leading-[1.45] text-[#4D5B66] md:text-[14px] md:leading-6">
                          {agent.body}
                        </p>
                        {agent.details ? (
                          <div className="mt-5 flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-[#E4EDF1] pt-3">
                            {agent.details.map((detail) => (
                              <span key={detail} className="rounded-full border border-[#D8E3EA] bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
                                {detail}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className={`mt-auto max-w-[620px] border-t border-[#E4EDF1] pt-3 font-lora text-[18px] leading-tight tracking-[-0.025em] sm:text-[21px] ${isFeatured ? "text-[#0B74DE]" : "text-[#66737F]"}`} style={{ fontWeight: 400 }}>
                          {agent.outcome}
                        </p>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              <div className="absolute -bottom-9 left-0 right-0 flex items-center justify-between gap-5">
                <div className="h-px flex-1 bg-[#D8E3EA]">
                  <motion.div
                    className="h-px origin-left bg-[#0B74DE]"
                    animate={{ scaleX: (activeAgent + 1) / marginOperationAgents.length }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
                  {String(activeAgent + 1).padStart(2, "0")} / {String(marginOperationAgents.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const controlPrinciples = [
  {
    title: "Read-only access",
    body: "Margin starts by examining your Amazon data without changing anything.",
  },
  {
    title: "Evidence before action",
    body: "Every recovery is grounded in the records that support it.",
  },
  {
    title: "You approve consequential actions",
    body: "Before Margin submits a recovery, you can see what happened, what supports it, and what Margin is going to do.",
  },
  {
    title: "Everything stays visible",
    body: "Evidence, decisions, case activity, Amazon responses, payments, and outcomes remain connected and visible.",
  },
];

function ControlSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[#FAFAF7] py-16 sm:py-20 md:py-24" aria-labelledby="control-section-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="lg:sticky lg:top-28">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">05 / CONTROL</span>
            </div>
            <h2 id="control-section-title" className="max-w-[620px] font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[56px]" style={{ fontWeight: 400 }}>
              You stay in control.
              <span className="mt-3 block text-[var(--margin-text-muted)]">Margin does the work.</span>
            </h2>
            <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              Margin handles the recovery operation without taking control away from you.
            </p>
            <p className="mt-5 max-w-[500px] font-lora text-[19px] leading-[1.12] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[23px]" style={{ fontWeight: 400 }}>
              You don&apos;t have to manage the recovery to remain responsible for it.
            </p>
            <p className="mt-8 border-l-2 border-[var(--margin-blue)] pl-5 font-lora text-[22px] leading-[1.08] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[27px]" style={{ fontWeight: 400 }}>
              Margin runs the recovery. You remain the authority.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="border-t border-[var(--margin-border-strong)]">
            {controlPrinciples.map((principle, index) => (
              <div key={principle.title} className="grid gap-2 border-b border-[var(--margin-border)] py-5 sm:grid-cols-[minmax(180px,0.72fr)_1.28fr] sm:gap-8 sm:py-6">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[var(--margin-blue)]">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.02em] text-[var(--margin-text-primary)] md:text-[16px]">{principle.title}</h3>
                </div>
                <p className="max-w-[520px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">{principle.body}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MarginStandardSection() {
  const reduceMotion = useReducedMotion();
  const standardSteps = [
    "What happened?",
    "What should have happened?",
    "What the evidence supports?",
    "What should happen next?",
    "What was actually recovered?",
  ];
  const [activeStandardStep, setActiveStandardStep] = useState(0);
  const [standardPhase, setStandardPhase] = useState<"typing" | "pause" | "deleting" | "empty">("typing");
  const [visibleStandardLength, setVisibleStandardLength] = useState(reduceMotion ? standardSteps[0].length : 0);
  const activeStandardText = standardSteps[activeStandardStep];
  const visibleStandardText = activeStandardText.slice(0, visibleStandardLength);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleStandardLength(activeStandardText.length);
      setStandardPhase("pause");
      return;
    }

    let delay = 0;
    if (standardPhase === "typing") {
      if (visibleStandardLength < activeStandardText.length) delay = 58;
      else {
        setStandardPhase("pause");
        return;
      }
    } else if (standardPhase === "pause") {
      delay = 1900;
    } else if (standardPhase === "deleting") {
      if (visibleStandardLength > 0) delay = 34;
      else {
        setStandardPhase("empty");
        return;
      }
    } else {
      delay = 280;
    }

    const timeout = window.setTimeout(() => {
      if (standardPhase === "typing") {
        setVisibleStandardLength((length) => Math.min(length + 1, activeStandardText.length));
      } else if (standardPhase === "pause") {
        setStandardPhase("deleting");
      } else if (standardPhase === "deleting") {
        setVisibleStandardLength((length) => Math.max(length - 1, 0));
      } else {
        setActiveStandardStep((current) => {
          const nextOptions = standardSteps.map((_, index) => index).filter((index) => index !== current);
          return nextOptions[Math.floor(Math.random() * nextOptions.length)];
        });
        setVisibleStandardLength(0);
        setStandardPhase("typing");
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activeStandardText, reduceMotion, standardPhase, visibleStandardLength]);

  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-white py-16 sm:py-20 md:py-28" aria-labelledby="margin-standard-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="max-w-[720px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">06 / THE MARGIN STANDARD</span>
            </div>
            <h2 id="margin-standard-title" className="font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
              Margin doesn&apos;t assume. It establishes.
            </h2>
            <p className="mt-6 max-w-[660px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              A recovery is not real just because a report, system, or response says it is. Margin examines what happened, establishes what the available evidence supports, determines what action is appropriate, and keeps the financial outcome visible until the recovery is resolved.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-t border-[var(--margin-border)]">
            <div className="relative flex min-h-[210px] items-center overflow-hidden border-b border-[var(--margin-border)] py-10 sm:min-h-[260px] sm:px-5 sm:py-12" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeStandardText}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[620px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#20252A] sm:text-[46px] md:text-[58px]"
                  style={{ fontWeight: 400 }}
                >
                  {visibleStandardText || "\u00A0"}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-7 border-l border-[var(--margin-blue)] pl-5">
              <p className="font-lora text-[23px] leading-[1.04] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[29px]" style={{ fontWeight: 400 }}>
                Not every discrepancy is a recovery.
                <span className="mt-1.5 block text-[var(--margin-text-muted)]">Not every recovery is complete. Not every response is a resolution.</span>
              </p>
              <p className="mt-5 max-w-[620px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-8">
                Margin finds the truth of the money—and carries the justified recovery through to the outcome.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryWorkStatement() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-16 sm:py-20 md:py-28" aria-labelledby="trust-section-title">
      <div className={containerClass}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          <motion.div {...revealProps} className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              07 / ONE RECORD</p>
            <h2 id="trust-section-title" className="mt-4 font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>Everything that matters to the recovery stays connected.</h2>
            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">The evidence, financial context, decisions, case activity, Amazon responses, payments, reversals, and final outcome all belong to the same recovery record.</p>
            <div className="mt-5 space-y-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-text-muted)]">
              <p>No chasing reports.</p>
              <p>No rebuilding the story.</p>
              <p>No wondering what happened next.</p>
            </div>
            <p className="mt-6 font-lora text-[22px] leading-[1.05] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[28px]" style={{ fontWeight: 400 }}>One recovery. One record. One visible outcome.</p>
          </motion.div>
          <motion.div {...revealProps} className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(145deg,#1B1B1B_0%,#101010_58%,#080808_100%)] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-5 lg:p-7">
            <video className="block aspect-video w-full rounded-[8px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.34)]" src="/section_5.mp4" autoPlay loop muted playsInline preload="auto" aria-label="Margin connected recovery record demonstration" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryThreadSection({ onAuditCta }: { onAuditCta: (location: string) => void }) {
  const recoveryThreadCards = [
    {
      title: "Delivered. Not reconciled.",
      copy: "An inbound shipment reaches Amazon, but the units do not appear where they should. The carrier confirms delivery. Amazon’s inventory record tells a different story.",
      visual: (
        <div className="relative aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-white/96 p-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-md sm:p-3">
          <img src="/delivered.png" alt="Delivered shipment with an unresolved inventory discrepancy" className="h-full w-full rounded-[4px] object-cover" />
        </div>
      ),
    },
    {
      title: "Charged. Not explained.",
      copy: "A fee appears in the account, but the seller cannot confidently trace it to the shipment, adjustment, service, or event that created it. The amount is real. The explanation is missing.",
      visual: (
        <div className="relative aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-white/96 p-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-md sm:p-3">
          <img src="/charged.png" alt="Unresolved account charge without a linked source event" className="h-full w-full rounded-[4px] object-cover" />
        </div>
      ),
    },
    {
      title: "Paid. Not closed.",
      copy: "A reimbursement or credit appears, but the seller still needs to know whether it was complete, later reversed, correctly reflected in settlement, and financially reconciled.",
      visual: (
        <div className="relative aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-white/96 p-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] backdrop-blur-md sm:p-3">
          <img src="/paid.png" alt="Paid reimbursement with an unresolved settlement outcome" className="h-full w-full rounded-[4px] object-cover" />
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[#FAFAF7] py-20 sm:py-24 md:py-32" aria-labelledby="recovery-thread-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[820px] text-center">
          <div className="mb-5 flex items-center justify-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">The recovery thread</span><div className="h-px w-8 bg-[var(--margin-blue)]" /></div>
          <h2 id="recovery-thread-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>You run the business. Margin keeps the recovery work legible.</h2>
          <p className="mx-auto mt-6 max-w-[760px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">A shipment can be marked delivered while the units never reconcile. A fee can appear without an obvious explanation. A reimbursement can look complete and still fail to match the final settlement. The difficult part is connecting the event, the evidence, the claim, and the money.</p>
        </motion.div>

        <div className="mt-14 grid border-y border-[#D8DEDA] md:grid-cols-3">
          {recoveryThreadCards.map((card, index) => (
            <motion.article key={card.title} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className={`px-0 py-8 md:px-7 md:py-10 ${index > 0 ? "border-t border-[#D8DEDA] md:border-l md:border-t-0" : ""}`}>
              {card.visual}
              <h3 className="mt-7 font-lora text-[25px] leading-[1.06] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[29px]">{card.title}</h3>
              <p className="mt-4 text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">{card.copy}</p>
            </motion.article>
          ))}
        </div>

        <motion.div {...revealProps} className="mt-12 border-y border-[#D8DEDA] py-8 text-center md:mt-16 md:py-10">
          <p className="font-lora text-[24px] leading-[1.08] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[30px] md:text-[38px]" style={{ fontWeight: 400 }}>These are not separate problems when you are the seller. They become one unresolved recovery thread.</p>
        </motion.div>

        <motion.div {...revealProps} className="mx-auto max-w-[760px] pt-14 text-center md:pt-20">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">The product bridge</p>
          <h3 className="mt-4 font-lora text-[30px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[46px]" style={{ fontWeight: 400 }}>Margin connects the thread.</h3>
          <p className="mx-auto mt-5 max-w-[680px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">Margin examines your Amazon records, shows you what the evidence supports, and helps move the approved recovery work forward—so you can see what happened, what needs attention, and whether Amazon actually paid.</p>
          <Button onClick={() => onAuditCta("recovery_thread_audit")} className="mt-8 h-12 rounded-[8px] bg-[var(--margin-blue)] px-6 text-[13px] font-semibold text-white shadow-none hover:bg-[var(--margin-blue-hover)]">Start a free Recovery Audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-[#7A878E]">Read-only. See the result before deciding. Nothing is submitted without your approval.</p>
        </motion.div>
      </div>
    </section>
  );
}



function FullRecoveryLoopSection() {
  const reduceMotion = useReducedMotion();
  const [activeEvent, setActiveEvent] = useState(0);

  const desktopEvents = [
    { number: "01", label: "Amazon activity", x: "5%", y: "17%" },
    { number: "02", label: "Audit", x: "27%", y: "17%" },
    { number: "03", label: "Opportunity detected", x: "49%", y: "17%" },
    { number: "04", label: "Investigation", x: "71%", y: "17%" },
    { number: "05", label: "Evidence assembled", x: "14%", y: "46%" },
    { number: "06", label: "Recovery judgment", x: "34%", y: "46%" },
    { number: "07", label: "Case preparation", x: "54%", y: "46%" },
    { number: "08", label: "Filing", x: "74%", y: "46%" },
    { number: "09", label: "Amazon response", x: "92%", y: "46%" },
    { number: "10", label: "Evidence request", x: "73%", y: "69%", variant: "branch" },
    { number: "11", label: "Rejection", x: "84%", y: "69%", variant: "branch" },
    { number: "12", label: "Approval", x: "95%", y: "69%", variant: "branch" },
    { number: "13", label: "Follow-up / appeal / reassessment", x: "52%", y: "82%", variant: "branch" },
    { number: "14", label: "Outcome", x: "65%", y: "92%" },
    { number: "15", label: "Payout reconciliation", x: "81%", y: "92%" },
    { number: "16", label: "Recovery closed", x: "96%", y: "92%" },
  ] as const;

  useEffect(() => {
    if (reduceMotion) {
      setActiveEvent(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveEvent((current) => (current + 1) % desktopEvents.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [reduceMotion, desktopEvents.length]);

  const eventIsActive = (index: number) => (reduceMotion ? index === 0 : activeEvent === index);

  return (
    <section
      aria-labelledby="full-recovery-loop-title"
      className="relative overflow-hidden border-b border-[var(--margin-border)] bg-white py-16 md:py-20"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[900px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              12 / The full recovery loop
            </span>
          </div>
          <h2
            id="full-recovery-loop-title"
            className="font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]"
            style={{ fontWeight: 400 }}
          >
            From Amazon event to financial outcome.
          </h2>
        </motion.div>

        <motion.div {...revealProps} className="mt-8 md:mt-10">
          <div
            aria-label="A living orchestration of the full recovery loop"
            className="recovery-orchestra-canvas relative hidden overflow-hidden border-y border-[var(--margin-border)] lg:block"
          >
            <svg
              aria-hidden="true"
              className="recovery-orchestra-lines pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1200 560"
              preserveAspectRatio="none"
            >
              <path d="M45 96 C260 96 520 96 852 96" />
              <path d="M852 96 C1080 120 1065 220 1010 244 C850 300 470 205 168 244" />
              <path d="M168 244 C390 244 650 244 1104 244" />
              <path className="is-broken" d="M1104 244 C1060 300 935 318 876 360" />
              <path className="is-broken" d="M1104 244 C1110 300 1010 330 1008 360" />
              <path className="is-branch" d="M1104 244 C1160 300 1145 338 1140 360" />
              <path className="is-broken" d="M876 360 C790 420 690 432 624 454" />
              <path className="is-broken" d="M1008 360 C900 430 720 438 624 454" />
              <path className="is-branch" d="M1140 360 C1080 430 860 470 780 514" />
              <path d="M624 454 C640 486 710 505 780 514" />
              <path d="M780 514 C850 514 930 514 972 514" />
              <path d="M972 514 C1040 514 1100 514 1152 514" />
            </svg>

            <motion.span
              aria-hidden="true"
              className="recovery-orchestra-signal"
              animate={
                reduceMotion
                  ? { left: "5%", top: "17%", opacity: 0.35 }
                  : {
                      left: ["5%", "27%", "49%", "71%", "14%", "34%", "54%", "74%", "92%", "73%", "84%", "95%", "52%", "65%", "81%", "96%"],
                      top: ["17%", "17%", "17%", "17%", "46%", "46%", "46%", "46%", "46%", "69%", "69%", "69%", "82%", "92%", "92%", "92%"],
                      opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 25.6, repeat: Infinity, ease: "linear", times: desktopEvents.map((_, index) => index / (desktopEvents.length - 1)) }
              }
            />

            {desktopEvents.map((event, index) => (
              <div
                key={event.number}
                className={`recovery-event-unit ${event.variant === "branch" ? "recovery-event-unit--branch" : ""}`}
                data-active={eventIsActive(index)}
                style={{ left: event.x, top: event.y }}
              >
                <span className="recovery-event-number">{event.number}</span>
                <span className="recovery-event-label">{event.label}</span>
                <span className="recovery-event-check" aria-hidden="true">✓</span>
              </div>
            ))}
          </div>

          <div
            aria-label="The full recovery loop in a vertical orchestration"
            className="recovery-mobile-orchestra relative ml-2 border-l border-[var(--margin-border)] pl-7 lg:hidden"
          >
            <span className={`recovery-mobile-signal ${reduceMotion ? "recovery-mobile-signal--static" : ""}`} aria-hidden="true" />
            {desktopEvents.map((event, index) => (
              <div key={event.number} className={`recovery-mobile-event ${event.variant === "branch" ? "recovery-mobile-event--branch" : ""}`} data-active={eventIsActive(index)}>
                <span className="recovery-mobile-event-line" aria-hidden="true" />
                <div className="recovery-mobile-event-unit">
                  <span className="recovery-event-number">{event.number}</span>
                  <span className="recovery-event-label">{event.label}</span>
                  <span className="recovery-event-check" aria-hidden="true">✓</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...revealProps} className="mt-8 border-t border-[var(--margin-border)] pt-6 md:mt-10 md:pt-7">
          <p className="max-w-[700px] font-lora text-[26px] leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[32px] md:text-[42px]" style={{ fontWeight: 400 }}>
            One continuous recovery lifecycle.
            <span className="mt-2 block text-[var(--margin-text-muted)]">Not disconnected tools.</span>
          </p>
          <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--margin-blue)]">
            That is the architecture.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const recoveryOutcomeStates = [
  {
    title: "Needs evidence",
    description: "More proof is required.",
    action: "Request the missing support",
    visualLabel: "Evidence request",
    visualValue: "Open case / proof gap",
    visualDetail: "The recovery remains active while the required evidence is assembled.",
  },
  {
    title: "Rejected",
    description: "The reason is recorded and the outcome can be reviewed.",
    action: "Review the rejection",
    visualLabel: "Decision recorded",
    visualValue: "Rejected / reason captured",
    visualDetail: "The original case, evidence, and Amazon response stay together for review.",
  },
  {
    title: "Recovery Outcome",
    description: "Underpaid, partially resolved, and reversed outcomes are different ways a recovery can fall short of the expected result—and each remains visible for follow-up.",
    action: "Compare expected to paid",
    visualLabel: "Recovery variance",
    visualValue: "Expected  /  actual",
    visualDetail: "The gap remains visible instead of being mistaken for a complete recovery.",
  },
  {
    title: "Appealable",
    description: "Where the rules and evidence support another path, the case can move into appeal or further action.",
    action: "Move into appeal",
    visualLabel: "Next path available",
    visualValue: "Appeal / reassess",
    visualDetail: "The case moves forward when the evidence and recovery rules support another action.",
  },
] as const;

function NeedsEvidenceImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#252522] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img
          src="/emaillist.png"
          alt="Evidence request list"
          className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] -rotate-[1.5deg] rounded-[16px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]"
        />
        <img
          src="/openmail.png"
          alt="Opened evidence request"
          className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[18px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]"
        />
      </div>
    </div>
  );
}

function RejectedImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#252522] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/resubmit.png" alt="Resubmission workspace" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-[1.5deg] rounded-[16px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/rejectedreason.png" alt="Rejected case reason" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] -rotate-[0.5deg] rounded-[18px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function UnderpaidImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#252522] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/evidenceatt.png" alt="Evidence attached to an underpaid recovery" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] -rotate-[1.5deg] rounded-[16px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/underpayemail.png" alt="Underpayment recovery email" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[18px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function AppealableImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#252522] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/financial.png" alt="Financial recovery record" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] -rotate-[1.5deg] rounded-[16px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/realappeal.png" alt="Appeal record ready for review" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[18px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function OutcomeWorkspace({ state, index, reduceMotion }: { state: (typeof recoveryOutcomeStates)[number]; index: number; reduceMotion: boolean }) {
  return (
    <motion.div
      key={state.title}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7 md:p-9"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--margin-border)] pb-4">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">
          Outcome state / {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          Margin keeps it moving
        </span>
      </div>

      <div className="py-8 sm:py-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          {state.visualLabel}
        </p>
        <p className="mt-4 max-w-[520px] font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
          {state.visualValue}
        </p>
        <p className="mt-5 max-w-[470px] text-[14px] leading-7 text-[var(--margin-text-secondary)] sm:text-[15px]">
          {state.visualDetail}
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          <span>Next action</span>
          <span>{state.action}</span>
        </div>
        <div className="space-y-2 border-t border-[var(--margin-border)] pt-4">
          {[0.38, 0.62, 0.46].map((width, lineIndex) => (
            <div key={lineIndex} className="h-2 rounded-full bg-[#EEF1F2]">
              <motion.div
                initial={reduceMotion ? { scaleX: width } : { scaleX: 0 }}
                animate={{ scaleX: width }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : lineIndex * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="h-full origin-left rounded-full bg-[var(--margin-blue)]/45"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ProductReframeSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.26 });
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (reduceMotion || !sectionInView) {
      setActiveStage(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % recoveryOperationStages.length);
    }, 1250);

    return () => window.clearInterval(interval);
  }, [reduceMotion, sectionInView]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="product-reframe-title"
      className="relative overflow-hidden border-t border-[var(--margin-border)] bg-white py-20 md:py-28"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[1040px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              14 / The product reframe
            </span>
          </div>
          <h2
            id="product-reframe-title"
            className="font-lora text-[36px] leading-[0.99] tracking-[-0.05em] text-[var(--margin-text-primary)] sm:text-[48px] md:text-[66px]"
            style={{ fontWeight: 400 }}
          >
            Margin is not another place to look for problems.
            <span className="mt-3 block text-[var(--margin-text-muted)]">It is where the recovery operation stays in view.</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-20">
          <motion.div {...revealProps}>
            <p className="max-w-[560px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
              Amazon activity does not become useful simply because it has been collected. It becomes useful when the right signal can be understood, supported, acted on, and checked against the money that followed.
            </p>
            <p className="mt-6 max-w-[520px] text-[14px] leading-7 text-[var(--margin-text-muted)] md:text-[15px] md:leading-8">
              Margin keeps that movement connected so recovery is treated as an operating function—not a pile of disconnected findings.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }}>
            <div className="border-y border-[var(--margin-border)]">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--margin-border)] py-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">
                  From activity to financial truth
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
                  {String(activeStage + 1).padStart(2, "0")} / {String(recoveryOperationStages.length).padStart(2, "0")}
                </span>
              </div>
              <div className="relative py-6 sm:py-8">
                <motion.div
                  aria-hidden="true"
                  className="absolute left-0 right-0 top-0 h-px origin-left bg-[var(--margin-blue)]"
                  animate={{ scaleX: reduceMotion ? 1 : (activeStage + 1) / recoveryOperationStages.length }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
                <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                  {recoveryOperationStages.map((stage, index) => {
                    const isActive = reduceMotion ? index === 0 : index === activeStage;
                    const isPast = !reduceMotion && index < activeStage;
                    return (
                      <motion.div
                        key={stage}
                        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0.36, y: 8 }}
                        animate={{ opacity: isActive ? 1 : isPast ? 0.68 : 0.38, y: isActive ? 0 : 2 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="border-b border-r border-[var(--margin-border)] px-3 py-4 last:border-r-0 sm:px-4 sm:py-5 lg:[&:nth-child(4n)]:border-r-0"
                      >
                        <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--margin-text-muted)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={`mt-3 block font-lora text-[21px] leading-[1.04] tracking-[-0.03em] ${isActive ? "text-[var(--margin-blue)]" : "text-[var(--margin-text-primary)]"}`} style={{ fontWeight: 400 }}>
                          {stage}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

const riskLeakPoints = [
  { label: "Not found", detail: "the signal never surfaces" },
  { label: "Not investigated", detail: "the question stays open" },
  { label: "Unsupported", detail: "the evidence is not ready" },
  { label: "Not filed", detail: "the case never moves" },
  { label: "Unanswered", detail: "the next request is missed" },
  { label: "Rejected", detail: "the first answer becomes final" },
  { label: "Partly paid", detail: "the balance goes unchecked" },
  { label: "Assumed complete", detail: "the payout is never reconciled" },
];

function RiskSection() {
  const reduceMotion = useReducedMotion();
  const reconciliationRows = [
    { label: "Expected", value: "$1,482.20", detail: "What should have happened" },
    { label: "Paid", value: "$519.10", detail: "What Amazon says it paid / what reached the account" },
    { label: "Verified", value: "$519.10", detail: "What the available records actually reconcile" },
    { label: "Remaining", value: "$963.10", detail: "What still isn't explained" },
  ];

  return (
    <section aria-labelledby="financial-closure-title" className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-20">
      <div className={containerClass}>
        <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <motion.div {...revealProps} className="order-2 min-w-0 lg:order-2 lg:scale-[1.03] lg:origin-center">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">09 / FINANCIAL CLOSURE</span>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[#4B4F50] bg-[#262829] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <div className="border-b border-[#4B4F50] bg-[#303334] px-3 py-2.5 sm:px-4 sm:py-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#B7BBBB]">Recovery record</p>
                    <p className="mt-1 font-lora text-[19px] leading-none tracking-[-0.035em] text-[#E7E8E6] sm:text-[22px]">ACME-CASE-2005</p>
                    <p className="mt-1 text-[9px] leading-4 text-[#AEB3B3]">FBA reimbursement · Shipment FBA17XJ4K2</p>
                  </div>
                  <div className="border border-[#666B6C] bg-[#414445] px-2 py-1 text-right">
                    <p className="font-mono text-[7px] font-semibold uppercase tracking-[0.13em] text-[#D5D7D6]">Financial closure</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-[#E7E8E6]">Balance remains</p>
                  </div>
                </div>
              </div>

              <div className="px-3 py-3.5 sm:px-4 sm:py-4">
                <div className="border-t border-[#55595A]">
                  {reconciliationRows.map((row, index) => (
                    <div key={row.label} className="grid gap-1 border-b border-[#4B4F50] py-2.5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-[#E7E8E6]">{row.label}</p>
                        <p className="mt-0.5 text-[9px] leading-4 text-[#AEB3B3]">{row.detail}</p>
                      </div>
                      <p className={`font-lora text-[20px] tracking-[-0.035em] ${index === 0 ? "text-[#F0F1EF]" : "text-[#D0D3D2]"}`} style={{ fontWeight: 400 }}>{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between font-mono text-[7px] font-semibold uppercase tracking-[0.12em] text-[#B7BBBB]">
                    <span>Expected</span><span>Paid</span><span>Verified</span><span>Remaining</span>
                  </div>
                  <div className="relative mt-2 flex items-center">
                    <div className="h-px w-full bg-[#727778]" />
                    <motion.div
                      aria-hidden="true"
                      className="absolute left-0 h-1.5 w-1.5 rounded-full bg-[#E7E8E6]"
                      animate={reduceMotion ? { left: "100%" } : { left: ["0%", "66%", "100%", "100%"] }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 3.4, repeat: Infinity, repeatDelay: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <div className="absolute left-0 right-0 flex justify-between">
                      <span className="h-2 w-2 rounded-full border border-[#D5D7D6] bg-[#303334]" />
                      <span className="h-2 w-2 rounded-full border border-[#D5D7D6] bg-[#303334]" />
                      <span className="h-2 w-2 rounded-full border border-[#D5D7D6] bg-[#303334]" />
                      <span className="h-2 w-2 rounded-full border border-[#D5D7D6] bg-[#303334]" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.1em] text-[#BFC3C3]"><span>Remaining delta</span><span>Not closed</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-1 border-l border-[#727778] pl-4 md:pl-5 lg:order-1 lg:mt-2">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">Expected / Paid / Verified / Remaining</p>
            <h2 id="financial-closure-title" className="mt-2 max-w-[620px] font-lora text-[30px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]" style={{ fontWeight: 400 }}>
              A recovery is not closed until the money agrees.
            </h2>
            <p className="mt-3 max-w-[480px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-6">
              Amazon can confirm a response without confirming the financial result. Margin compares what the recovery should have produced with what actually reached the seller account, then keeps the difference visible until it is understood.
            </p>

            <div className="mt-5 border-t border-[var(--margin-border)]">
              {[
                ["Expected", "What should have happened."],
                ["Paid", "What Amazon says it paid / what reached the account."],
                ["Verified", "What the available records actually reconcile."],
                ["Remaining", "What still isn't explained."],
              ].map(([label, body]) => (
                <div key={label} className="border-b border-[var(--margin-border)] py-2.5">
                  <h3 className="text-[11px] font-semibold text-[var(--margin-text-primary)] md:text-[12px]">{label}</h3>
                  <p className="mt-0.5 max-w-[420px] text-[10px] leading-4 text-[var(--margin-text-secondary)] md:text-[11px]">{body}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-[560px] font-lora text-[22px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[27px]" style={{ fontWeight: 400 }}>
              A response is not a financial closure.
              <span className="mt-2 block text-[var(--margin-text-muted)]">The recovery is finished when the outcome reconciles—not when the first answer arrives.</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const operationalBuildSteps = [
  "Audit activity",
  "Gather evidence",
  "Manage cases",
  "Watch deadlines",
  "Review payouts",
  "Check outcomes",
];

function OperationalEconomicsSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.28 });
  const responsibilityCycle = ["Audit", "Cases", "Payouts", "Deadlines", "Evidence", "Outcomes"];
  const marginNotifications = [
    { title: "Amazon activity", detail: "Dispute charge", meta: "New recovery signal" },
    { title: "Recovery record", detail: "Evidence linked", meta: "Connected and supported" },
    { title: "Verified outcome", detail: "Payout reconciled", meta: "Outcome kept visible" },
  ];
  const [responsibilityIndex, setResponsibilityIndex] = useState(0);
  const [notificationIndex, setNotificationIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || !sectionInView) return;
    const responsibilityTimer = window.setInterval(() => setResponsibilityIndex((current) => (current + 1) % responsibilityCycle.length), 1800);
    const notificationTimer = window.setInterval(() => setNotificationIndex((current) => (current + 1) % marginNotifications.length), 2000);
    return () => {
      window.clearInterval(responsibilityTimer);
      window.clearInterval(notificationTimer);
    };
  }, [reduceMotion, sectionInView, responsibilityCycle.length, marginNotifications.length]);

  const activeResponsibility = responsibilityCycle[responsibilityIndex];
  const activeNotification = marginNotifications[notificationIndex];

  return (
    <section ref={sectionRef} aria-labelledby="operational-economics-title" className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-16 sm:py-20 md:py-28">
      <div className={containerClass}>
        <div className="grid items-start gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
          <motion.div {...revealProps} className="relative min-w-0 h-[516px] overflow-hidden rounded-[12px] border border-[#373735] bg-[#1B1B1B] p-4 text-[#E7E5DF] sm:h-[564px] sm:p-6 md:h-auto md:p-8 lg:h-[520px] lg:p-10">
            <div className="mb-7 flex items-center justify-between gap-4"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8AAA5]">The work keeps coming back</span><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8AAA5]">Every month</span></div>
            <div className="relative grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-0">
              <div className="relative md:pr-8">
                <div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E7E5DF]">Your team</span><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A8AAA5]">Owns the function</span></div>
                <div className="relative min-h-[150px] py-1 sm:min-h-[160px] md:min-h-[174px]"><div className="absolute left-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#777A76] text-[#E7E5DF]"><svg aria-hidden="true" viewBox="0 0 36 24" className="h-5 w-7 fill-none stroke-current" strokeWidth="1.35"><circle cx="18" cy="7" r="3.2" /><path d="M11.5 19c.4-3.3 2.8-5.2 6.5-5.2s6.1 1.9 6.5 5.2" /><circle cx="7.5" cy="9" r="2.5" /><path d="M2.5 19c.3-2.6 2.1-4.2 5-4.2 1.5 0 2.8.4 3.7 1.2" /><circle cx="28.5" cy="9" r="2.5" /><path d="M33.5 19c-.3-2.6-2.1-4.2-5-4.2-1.5 0-2.8.4-3.7 1.2" /></svg></div><div className="absolute left-[52px] right-[106px] top-1/2 h-px -translate-y-1/2 bg-[#777A76]"><motion.span aria-hidden="true" className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-[#FF5A1F] shadow-[0_0_0_4px_rgba(255,90,31,0.18)]" initial={{ left: "0%" }} animate={reduceMotion || !sectionInView ? { left: "0%" } : { left: ["0%", "100%", "0%"] }} transition={{ duration: reduceMotion ? 0 : 1.8, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity, repeatDelay: 0.2 }} /></div><div className="absolute right-0 top-0 flex h-full w-[94px] flex-col justify-between py-1 text-[12px] font-medium leading-4 text-[#A8AAA5] sm:w-[106px] sm:text-[13px]">{responsibilityCycle.map((step) => <span key={step} className={step === activeResponsibility ? "text-[#E7E5DF]" : ""}>{step}</span>)}</div></div>
                <p className="mt-5 border-t border-dashed border-[#555653] pt-3 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#A8AAA5]">Six responsibilities · one recurring burden</p>
              </div>
              <div className="relative border-t border-[#3D3E3B] pt-6 md:ml-0 md:border-t-0 md:pl-8 md:pt-0">
                <div className="mb-3 flex items-center gap-2"><img src="/logoimagetwo.png" alt="" className="h-5 w-auto invert brightness-0" /><span className="font-merriweather text-[18px] tracking-tight text-[#E7E5DF]">Margin</span></div>
                <div className="relative -ml-2 -mr-5 mt-4 h-[70px] w-[calc(100%+1.25rem)] translate-x-px overflow-hidden rounded-[8px] bg-transparent p-1.5 sm:-ml-3 sm:-mr-8 sm:mt-6 sm:h-[76px] sm:w-[calc(100%+2rem)] md:-ml-4 md:-mr-12 md:w-[calc(100%+3rem)]"><AnimatePresence mode="wait" initial={false}><motion.div key={activeNotification.title} initial={reduceMotion ? { opacity: 1, y: 16, filter: "blur(0px)" } : { opacity: 0, y: 16, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, filter: "blur(5px)" }} transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }} className="flex h-full items-center gap-2.5 rounded-[6px] bg-[#E7E5DF] px-3 py-2 text-[#343532] shadow-[0_2px_8px_rgba(52,53,50,0.08)]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#343532]" /><div className="min-w-0 flex-1"><p className="font-mono text-[8px] font-semibold uppercase tracking-[0.08em] text-[#6E706B]">Live recovery movement</p><p className="mt-0.5 text-[12px] font-semibold leading-4">{activeNotification.title}</p><p className="text-[11px] leading-3.5">{activeNotification.detail}</p></div><span className="hidden max-w-[78px] text-right text-[8px] leading-3 text-[#6E706B] sm:block">{activeNotification.meta}</span></motion.div></AnimatePresence></div>
                <p className="mt-5 border-t border-[#555653] pt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#D1D0C8]">The burden becomes one connected recovery record.</p>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-[40%] left-[55%] top-[42px] hidden w-px -translate-x-[2px] bg-[#737570] md:block" aria-hidden="true" /><div className="mt-7 border-t border-[#3D3E3B] pt-3 text-center font-lora text-[18px] leading-tight tracking-[-0.02em] text-[#E7E5DF] sm:text-[22px]" style={{ fontWeight: 400 }}>The work is transferred. The authority stays with you.</div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }}>
            <div className="mb-3 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">11 / THE COST OF DOING IT YOURSELF</span></div>
            <h2 id="operational-economics-title" className="font-lora text-[31px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[50px]" style={{ fontWeight: 400 }}>Recovery is not a task. It is a function.</h2>
            <p className="mt-2 max-w-[720px] font-lora text-[19px] leading-[1.05] tracking-[-0.03em] text-[var(--margin-text-muted)] sm:text-[23px]" style={{ fontWeight: 400 }}>Margin takes ownership of the recovery work so your team doesn&apos;t have to build and maintain the function themselves.</p>
            <div className="mt-5 border-t border-[var(--margin-border)]"><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Recurring</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">The work returns whenever the next issue appears.</p></div><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Connected</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">Evidence, cases, responses, payouts, and outcomes stay together.</p></div><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Owned by Margin</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">Your team remains the authority without carrying the entire operating burden.</p></div></div>
            <p className="mt-5 max-w-[520px] font-lora text-[21px] leading-[1.04] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[26px]" style={{ fontWeight: 400 }}>You are not adding another tool to operate.<span className="mt-1.5 block text-[var(--margin-text-muted)]">You are removing another function from your workload.</span></p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryOutcomeExplorer() {
  const reduceMotion = useReducedMotion();
  const outcomeSceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: outcomeSceneRef, offset: ["start start", "end end"] });
  const [activeOutcome, setActiveOutcome] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextOutcome = Math.min(recoveryOutcomeStates.length - 1, Math.floor(latest * recoveryOutcomeStates.length));
    setActiveOutcome((current) => (current === nextOutcome ? current : nextOutcome));
  });

  const activeState = recoveryOutcomeStates[activeOutcome];

  return (
    <section aria-labelledby="recovery-outcome-title" className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)]">
      <div ref={outcomeSceneRef} className="relative lg:min-h-[520vh]">
        <div className="lg:sticky lg:top-16 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-start">
          <div className={`${containerClass} w-full py-16 md:py-24 lg:py-4 xl:py-6`}>
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">10 / WHEN THINGS GO WRONG</span></div>
              <h2 id="recovery-outcome-title" className="max-w-[820px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px] lg:text-[58px]" style={{ fontWeight: 400 }}>A recovery doesn&apos;t disappear when Amazon says no.</h2>
              <p className="mt-4 max-w-[760px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">
                Margin doesn&apos;t give up at the first answer. It treats the response as part of the recovery record—not automatically the end of it. Where the evidence and rules support another path, Margin determines the appropriate next action.
              </p>
            </motion.div>

            <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
              <motion.div {...revealProps}>
                {recoveryOutcomeStates.map((state, index) => {
                  const isActive = index === activeOutcome;
                  return (
                    <div key={state.title} className={`border-b border-[var(--margin-border)] py-3.5 transition-opacity duration-300 sm:py-4 ${isActive ? "opacity-100" : "opacity-45"}`}>
                      <h3 className={`tracking-[-0.035em] ${isActive ? "text-[20px] font-medium text-[var(--margin-text-primary)] sm:text-[22px]" : "text-[19px] font-normal text-[var(--margin-text-secondary)] sm:text-[21px]"}`}>{state.title}</h3>
                      {isActive ? <p className="mt-2 max-w-[420px] text-[13px] leading-5 text-[var(--margin-text-secondary)] sm:text-[14px]">{state.description}</p> : null}
                    </div>
                  );
                })}
              </motion.div>

              <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="lg:-translate-y-8">
                <div className="relative min-h-[360px] overflow-hidden rounded-[10px] bg-[#1B1B1B] sm:min-h-[450px] lg:h-[520px] lg:min-h-0">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.12),transparent_35%)]" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeState.title}
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      {activeState.title === "Needs evidence" ? <NeedsEvidenceImageStack /> : activeState.title === "Rejected" ? <RejectedImageStack /> : activeState.title === "Recovery Outcome" ? <UnderpaidImageStack /> : activeState.title === "Appealable" ? <AppealableImageStack /> : <OutcomeWorkspace state={activeState} index={activeOutcome} reduceMotion={Boolean(reduceMotion)} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

export default function Index() {
  usePageMeta(PUBLIC_ROUTE_META['/']);
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const { isFull, nextBatchHours } = useOnboardingCapacity();

  const [isBusy, setIsBusy] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleClaimAccessClick = (location: string, sourceType: 'sp_api' | 'csv_upload' = 'sp_api') => {
    trackEarlyAccessCtaClicked(location);
    navigate(sourceType === 'sp_api' ? '/audit' : '/data-upload');
  };

  return (
    <div className="min-h-screen bg-[var(--margin-canvas)] selection:bg-[var(--margin-blue)]/16 selection:text-[var(--margin-text-primary)]">
      <PublicNavbar variant="light" wide />
      
      <main>
        <KineticHeroSection onAuditCta={() => handleClaimAccessClick("hero_connect_amazon", "sp_api")} onReportCta={() => handleClaimAccessClick("hero_use_amazon_reports", "csv_upload")} isFull={isFull} nextBatchHours={nextBatchHours} />
        <OneRecoverySection />
        <RealityCheckSection />
        <MarginLifecycleSection />
        <ControlSection />
        <MarginStandardSection />
        <RecoveryWorkStatement />
        <AccountingEvidenceSection />
        <RiskSection />
        <RecoveryOutcomeExplorer />
        <OperationalEconomicsSection />
        {false && <RecoveryThreadSection onAuditCta={() => handleClaimAccessClick("recovery_thread_audit", "sp_api")} />}
        <RecoveryOfferSection onAuditCta={handleClaimAccessClick} />
        <RecoveryRoutingSection onAuditCta={handleClaimAccessClick} />

        {/* Section 14 — Trust / FAQ */}
        <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56" aria-labelledby="trust-faq-title">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-blue)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">14 / TRUST / FAQ</span>
              </div>
              <h2 id="trust-faq-title" className="font-lora text-[34px] font-medium leading-tight tracking-[-0.045em] sm:text-[42px] md:text-[46px]" style={{ fontWeight: 400 }}>
                <span className="text-[var(--margin-text-primary)] font-lora">Before you run the Audit.</span> <span className="text-[var(--margin-text-muted)] font-lora">A few things to know.</span>
              </h2>
            </motion.div>
            <div className="mt-10 md:mt-14 max-w-4xl">
              <Accordion
                type="single"
                collapsible
                defaultValue="faq-0"
                className="w-full border-t border-[var(--margin-border)]"
              >
                {faqs.slice(0, showAllFaqs ? faqs.length : 3).map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-[var(--margin-border)] px-0"
                  >
                    <AccordionTrigger className="py-6 text-left text-[18px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)] hover:no-underline md:py-7 md:text-[22px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[var(--margin-text-muted)]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-7 pr-10 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button
                type="button"
                onClick={() => setShowAllFaqs((current) => !current)}
                className="landing-pressable mt-7 h-11 rounded-[7px] bg-[var(--margin-blue)] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] hover:bg-[var(--margin-blue-hover)]"
              >
                {showAllFaqs ? "Show fewer answers" : "More answers to your questions"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA — compact operational handoff */}
        <section className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-8 sm:py-10 md:py-14" aria-labelledby="final-handoff-title">
          <div className={containerClass}>
            <div className="grid items-center gap-8 border-y border-[var(--margin-border)] py-8 md:gap-12 md:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
              <motion.div {...revealProps} className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">15 / FINAL DELEGATION</p>
                <h2 id="final-handoff-title" className="mt-3 max-w-[720px] font-lora text-[32px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
                  You don&apos;t have to wonder.
                  <span className="mt-3 block text-[var(--margin-text-muted)]">You sell on Amazon. Margin handles the recovery.</span>
                </h2>
                <p className="mt-4 max-w-[680px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">
                  Know what happened, what is justified, what Margin is doing, and whether the money came back.
                </p>
                <p className="mt-4 max-w-[620px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[24px]" style={{ fontWeight: 400 }}>
                  You stay informed. You stay in control. The recovery work is no longer yours to carry.
                </p>
                <div className="mt-5 grid gap-x-5 gap-y-2 border-y border-[var(--margin-border-subtle)] py-3 sm:grid-cols-2">
                  {["Finds the recovery.", "Builds the case.", "Carries it forward.", "Keeps the outcome visible."].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[12px] leading-5 text-[var(--margin-text-secondary)] md:text-[13px]">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--margin-blue)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 font-lora text-[24px] leading-[1.04] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[30px]" style={{ fontWeight: 400 }}>
                  You sell. Margin runs the recovery operation.
                </p>
                <Button onClick={() => handleClaimAccessClick("homepage_early_access_section")} className="landing-pressable mt-5 h-11 rounded-[7px] bg-[var(--margin-blue)] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] hover:bg-[var(--margin-blue-hover)]">
                  Get It Handled <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
                <div className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(145deg,#1B1B1B_0%,#101010_58%,#080808_100%)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-5">
                  <AuditImageStackVisual />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin recovery walkthrough"
        description="Watch how Margin keeps Amazon reimbursement proof tied together after discrepancies are identified, from deadline review and evidence matching to rejection handling and payout reconciliation."
        analyticsLocation="homepage_demo_section"
        videoName="margin_demo"
      />
      <BrandFooter wide />
      <CookieConsent />
    </div>
  );
}
