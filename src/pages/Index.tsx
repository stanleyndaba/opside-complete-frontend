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
import { MarginEngineSection } from "@/components/landing/MarginEngineSection";

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
  { id: "adobe_sign", name: "Adobe Sign", context: "signed documents", src: "/dobe.png", route: "M 12 14 H 28 V 94 H 50" },
];

const getAccountingRow = (order: string[]) => order.map((id) => accountingSources.find((source) => source.id === id)!).filter(Boolean);
const accountingRows = [
  getAccountingRow(["amazon", "slack", "outlook", "adobe_sign", "quickbooks"]),
  getAccountingRow(["gmail", "dropbox", "drive", "onedrive", "xero"]),
];

function AccountingEvidenceSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section data-navbar-theme="light" className="relative overflow-x-hidden bg-[#FAFAF7] py-10 md:py-16" aria-labelledby="accounting-section-title">
      <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-16 xl:gap-24">
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 min-w-0 overflow-hidden lg:order-1">
              <div className="relative min-h-[390px] overflow-hidden py-8 sm:min-h-[430px] sm:py-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#FAFAF7] via-[#FAFAF7]/85 to-transparent sm:w-24" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#FAFAF7] via-[#FAFAF7]/85 to-transparent sm:w-24" />
                <div className="relative space-y-5 sm:space-y-7">
                  {[0, 1].map((rowIndex) => (
                    <motion.div
                      key={rowIndex}
                      className="flex w-max gap-4 sm:gap-6"
                      animate={reduceMotion ? { x: rowIndex === 0 ? -72 : -170 } : { x: rowIndex === 0 ? [-72, -250] : [-360, -170] }}
                      transition={reduceMotion ? { duration: 0 } : { duration: rowIndex === 0 ? 22 : 27, repeat: Infinity, ease: "linear" }}
                    >
                      {[...accountingRows[rowIndex], ...accountingRows[rowIndex]].map((source, index) => (
                        <div key={`${source.id}-${rowIndex}-${index}`} className="flex h-[132px] w-[132px] shrink-0 items-center justify-center rounded-[10px] border-[7px] border-[#DCE8EE] bg-white shadow-[0_14px_28px_rgba(37,49,58,0.12)] sm:h-[150px] sm:w-[150px]">
                          <img src={source.src} alt={source.name} className="h-16 w-16 object-contain sm:h-[76px] sm:w-[76px]" />
                        </div>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.18 }} className="order-1 min-w-0 lg:order-2 lg:pt-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">08 / THE CONTEXT MARGIN HANDLES</span>
            </div>
            <h2 id="accounting-section-title" className="max-w-[700px] font-lora text-[36px] leading-[1.01] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}>
              You don&apos;t have to go looking for the answer.
            </h2>
            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Margin pulls together the relevant information it needs to understand, support, and close the recovery—so you don&apos;t have to search through reports, settlements, books, emails, and files to figure it out.
            </p>
            <div className="mt-8 border-t border-[#C9D1D6] pt-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#66737F]">Amazon · Accounting · Settlements · Files · Email</p>
              <p className="mt-4 font-lora text-[24px] leading-[1.05] tracking-[-0.04em] text-[#182026] sm:text-[30px]" style={{ fontWeight: 400 }}>
                Margin does the digging.
                <span className="mt-1.5 block text-[#0B74DE]">You get the recovery handled.</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[8px] font-semibold uppercase tracking-tight text-[#66737F]">
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
        <section key={section.id} aria-labelledby={`${section.id}-title`} className="relative overflow-hidden bg-white py-10 sm:py-[52px] md:py-[73px]">
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
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Is everything actually okay <span className="text-[#8FB5C9]">with your Amazon business?</span></motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Margin finds what needs attention, handles the recovery, and keeps going until you know what happened to the money.</motion.p>
          <p className="mt-4 text-[13px] font-medium leading-6 tracking-[-0.01em] text-[#B7CFDC] sm:mt-5 sm:text-[15px]">You keep selling. Margin handles the recovery.</p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Get it handled" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[#E5E5E0] px-6 text-[15px] font-bold text-[#111111] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition-[background-color,box-shadow] duration-200 hover:bg-[#D4D4CF] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Get It Handled <ArrowRight className="ml-2 h-5 w-5" /></Button>
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


function OneRecoverySection() {
  return (
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-[52px] md:py-[73px]">
      <div className={containerClass}>
        <div className="grid items-center gap-12 lg:grid-cols-1 xl:gap-24">
          <motion.div {...revealProps} className="order-1 lg:pt-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">02 / CATEGORY</span>
            </div>
            <h2 className="max-w-[700px] font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
              One Recovery Operation for Your Amazon Business
            </h2>
            <div className="mt-5 max-w-[620px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
              <p>When something needs recovering, Margin takes it from finding the problem to getting the outcome.</p>
              <p className="mt-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
                You don&apos;t have to figure out what happened, build the case, chase Amazon, or keep checking whether the money came back.
              </p>
              <p className="mt-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[17px] sm:leading-8">
                Margin handles the recovery.
              </p>
            </div>
          </motion.div>
        </div>
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
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-[52px] md:py-[73px]">
      <div className={containerClass}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:gap-8">
        <div className="flex flex-col justify-center">
        <motion.div {...revealProps} className="flex max-w-[900px] flex-col justify-center">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              03 / THE PROBLEM</span>
          </div>
          <h2 className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
            Recovery shouldn&apos;t be another job.
          </h2>
          <p className="mt-3 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            You shouldn&apos;t have to find the issue, figure out what happened, gather the proof, deal with Amazon, chase the outcome, and check whether the money actually came back.
          </p>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[17px] sm:leading-8">
            Margin handles it.
          </p>
          <p className="mt-3 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            It takes the recovery from the first finding through to the final outcome—so you can get back to running your business instead of running another recovery operation.
          </p>
        </motion.div>
        </div>
        <motion.div {...revealProps} className="relative">
          <DiscrepancyModalVisual />
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
      className="relative overflow-hidden bg-white py-10 sm:py-[52px] md:py-[73px]"
    >
      <div className={containerClass}>
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <motion.div {...revealProps} className="relative order-2 h-fit self-start overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 lg:order-1">
          <BrowserChrome path="margin.app/workspace" />
          <div className="isolate overflow-hidden rounded-[12px]" style={{ clipPath: "inset(0 round 12px)", WebkitClipPath: "inset(0 round 12px)" }}>
            <video className="block aspect-[1.45] w-full scale-[1.04] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.34)]" src="/workflow.mp4" autoPlay loop muted playsInline preload="auto" aria-label="How Margin handles recovery work" />
          </div>
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
            <span className="block">You don&apos;t get another list.</span>
            <span className="mt-3 block font-sans text-[18px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[22px] md:text-[26px]">You get it handled.</span>
          </h2>
        </motion.div>

          <motion.p
            {...revealProps}
            className="mt-4 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7"
          >
            Margin takes the recovery from finding the problem to getting the outcome. It investigates what happened, handles the case, follows up with Amazon, and keeps going until you know what happened to the money.
          </motion.p>
          <motion.p
            {...revealProps}
            className="mt-4 max-w-[780px] font-lora text-[19px] leading-[1.08] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[23px] md:text-[27px]"
            style={{ fontWeight: 400 }}
          >
            Margin takes responsibility for moving the recovery toward resolution.
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
    <section ref={operationScrollRef} className="relative bg-[#FAFAF7] py-[52px] md:py-[73px]">
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
  const reduceMotion = useReducedMotion();
  const [activeControlStep, setActiveControlStep] = useState(0);

  const controlSteps = [
    { label: "Amazon activity", detail: "New recovery signal", tone: "signal" },
    { label: "Evidence ready", detail: "Records connected", tone: "evidence" },
    { label: "Seller review", detail: "Approval required", tone: "approval" },
    { label: "Margin handling", detail: "Submission and follow-up", tone: "handled" },
    { label: "Outcome visible", detail: "Response and payout tracked", tone: "outcome" },
  ];

  useEffect(() => {
    if (reduceMotion) {
      setActiveControlStep(controlSteps.length - 1);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveControlStep((current) => (current + 1) % controlSteps.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const step = controlSteps[activeControlStep];
  const isApproval = step.tone === "approval";
  const isHandled = activeControlStep >= 3;

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] py-10 sm:py-[52px] md:py-16" aria-labelledby="control-section-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="lg:sticky lg:top-28">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">05 / CONTROL</span>
            </div>
            <h2 id="control-section-title" className="max-w-[620px] font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[56px]" style={{ fontWeight: 400 }}>
              You stay in control.
              <span className="mt-3 block font-sans text-[18px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[22px] md:text-[26px]">The work leaves your plate.</span>
            </h2>
            <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              Margin handles the recovery from investigation to outcome. You approve what needs your approval, stay informed, and step in only when a decision is actually yours to make.
            </p>
            <p className="mt-8 border-l-2 border-[var(--margin-blue)] pl-5 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
              Margin does the work. You make the decisions that matter.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="relative overflow-hidden rounded-[10px] border border-white/70 bg-[linear-gradient(135deg,rgba(217,238,245,0.86),rgba(255,255,255,0.72))] p-4 text-[#34414A] shadow-[0_18px_55px_rgba(72,103,122,0.12)] backdrop-blur-2xl sm:p-5 md:p-6">
            <div className="flex items-center justify-between border-b border-[#8EA9B5]/30 pb-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#5D7480]">The operating boundary</p>
                <p className="mt-1 font-lora text-[13px] leading-none tracking-tight text-[#34414A] sm:text-[14px]">Authority stays with you.</p>
              </div>
            </div>

            <div className="grid gap-4 py-4 md:grid-cols-[0.8fr_1.2fr] md:gap-5">
              <div className="relative border-b border-[#8EA9B5]/30 pb-4 md:border-b-0 md:border-r md:pr-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#5D7480]">Your authority</p>
                <div className="mt-3 grid grid-cols-3 gap-2 md:block md:space-y-2">
                  {[
                    ["Read-only access", "See the records first."],
                    ["Approve action", "Decide before submission."],
                    ["Stay informed", "Keep the outcome visible."],
                  ].map(([title, detail], index) => (
                    <div key={title} className="flex items-start gap-2 md:gap-3">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full md:mt-1.5 md:h-2 md:w-2 ${index === 1 && isApproval ? "bg-[#0B74DE] shadow-[0_0_0_3px_rgba(11,116,222,0.16)] md:shadow-[0_0_0_4px_rgba(11,116,222,0.16)]" : "bg-[#B9C0BE]"}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-4 text-[#34414A] md:text-[13px]">{title}</p>
                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#6B7D86] md:text-[11px] md:leading-4">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#5D7480]">Margin operates</p>
                </div>
                <div className="relative mt-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step.label}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="relative flex h-[34px] items-center overflow-hidden rounded-[5px] border border-white/75 bg-white/55 px-2.5 sm:h-[38px] sm:px-3"
                    >
                      <span className={`mr-2 h-1.5 w-1.5 shrink-0 rounded-full ${isHandled ? "bg-[#0B74DE]" : "bg-[#9AAEB7]"}`} />
                      <p className="min-w-0 truncate font-mono text-[7px] font-semibold uppercase tracking-tight text-[#5D7480] sm:text-[8px]">{step.label}</p>
                      <span className="mx-1.5 text-[8px] text-[#9AAEB7]">·</span>
                      <p className="min-w-0 truncate text-[9px] font-medium leading-none tracking-tight text-[#34414A] sm:text-[10px]">{step.detail}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="border-t border-[#8EA9B5]/30 pt-3">
              <p className="font-lora text-[12px] leading-tight tracking-tight text-[#34414A] sm:text-[13px]">{isHandled ? "Seller action: none required." : isApproval ? "Seller action: approve when ready." : "Margin is carrying the recovery forward."}</p>
            </div>
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
      if (visibleStandardLength < activeStandardText.length) delay = 39;
      else {
        setStandardPhase("pause");
        return;
      }
    } else if (standardPhase === "pause") {
      delay = 1267;
    } else if (standardPhase === "deleting") {
      if (visibleStandardLength > 0) delay = 23;
      else {
        setStandardPhase("empty");
        return;
      }
    } else {
      delay = 187;
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
    <section className="relative overflow-hidden bg-white py-10 sm:py-[52px] md:py-[73px]" aria-labelledby="margin-standard-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="max-w-[720px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">06 / THE MARGIN STANDARD</span>
            </div>
            <h2 id="margin-standard-title" className="font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
              If something needs recovering, Margin handles it.
            </h2>
            <p className="mt-6 max-w-[660px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              Margin investigates what happened, builds what is needed, handles the recovery, follows the outcome, and keeps going until the money is accounted for.
            </p>
            <p className="mt-6 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
              No guessing. No chasing. No unnecessary claims.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-t border-[var(--margin-border)]">
            <div className="relative flex min-h-[210px] items-center overflow-hidden border-b border-[var(--margin-border)] py-10 sm:min-h-[260px] sm:px-5 sm:py-12" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeStandardText}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-[620px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#20252A] sm:text-[46px] md:text-[58px]"
                  style={{ fontWeight: 400 }}
                >
                  {visibleStandardText || "\u00A0"}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-7 border-l border-[var(--margin-blue)] pl-5">
              <p className="text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
                Margin doesn&apos;t assume. It establishes.
              </p>
              <p className="mt-5 max-w-[620px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-8">
                If the evidence supports a recovery, Margin acts. If it doesn&apos;t, Margin tells you. If the outcome isn&apos;t complete, Margin keeps it visible.
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
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-10 sm:py-[52px] md:py-[73px]" aria-labelledby="trust-section-title">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-10">
          <motion.div {...revealProps} className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              07 / ONE RECORD</p>
            <h2 id="trust-section-title" className="mt-4 font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>You shouldn&apos;t have to piece the recovery together.</h2>
            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">Everything Margin needs to understand the recovery stays connected in one place—evidence, decisions, Amazon responses, payments, reversals, and the final outcome.</p>
            <div className="mt-5 space-y-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-text-muted)]">
              <p>No chasing reports.</p>
              <p>No rebuilding the story.</p>
              <p>No wondering what happened next.</p>
            </div>
            <p className="mt-6 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">One recovery. One record. One visible outcome.</p>
          </motion.div>
          <motion.div {...revealProps} className="relative overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 lg:p-4">
            <BrowserChrome path="margin.app/recovery-workspace" />
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
      title: "Found it. Now someone has to handle it.",
      copy: "You notice an issue and it becomes another thread to manage—an email to your FBA person, a message to your VA, a request for an invoice, a follow-up with Amazon, another document to find. The information, decisions, and next steps start living in different places.",
      visual: <img src="/discrepancy.png" alt="Amazon discrepancy requiring recovery work" className="h-full w-full rounded-[4px] object-cover" />,
    },
    {
      title: "Proved it. Now keep it moving.",
      copy: "Amazon asks for evidence. A case gets rejected. A document needs to be supplied. Someone needs to respond, follow up, or determine what should happen next. The recovery can stall not because the problem isn’t real, but because someone has to keep carrying the case forward.",
      visual: <img src="/openmail.png" alt="Open recovery correspondence requiring follow-up" className="h-full w-full rounded-[4px] object-cover" />,
    },
    {
      title: "Paid. Now make sure it’s actually finished.",
      copy: "A reimbursement or credit comes through, but the work isn’t necessarily over. You still need to know whether the amount was complete, whether it appeared where expected, whether anything was reversed, and whether the recovery can actually be closed.",
      visual: (
        <div className="relative isolate aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.96),transparent_36%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_52%,#F9FAF8_100%)]" />
          <motion.div
            aria-hidden="true"
            className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-[#D9EEE8]/75 blur-2xl"
            animate={{ x: [0, 18, 0], y: [0, 12, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-[#DCE7F4]/80 blur-2xl"
            animate={{ x: [0, -16, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[9%] right-[9%] top-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex items-center gap-3 rounded-[10px] border border-white/80 bg-white/62 px-3 py-3 shadow-[0_14px_32px_rgba(56,74,82,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:px-4 sm:py-3.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/70" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-sans text-[12px] font-medium tracking-[-0.02em] text-[#26333A] sm:text-[14px]">Reply to Amazon&apos;s Previous Email</span>
              <img src="/gmailicon.png" alt="Gmail" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] py-[52px] sm:py-16 md:py-[73px]" aria-labelledby="recovery-thread-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[860px]">
          <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">The recovery thread</span></div>
          <h2 id="recovery-thread-title" className="max-w-[900px] font-lora text-[36px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}>You run the business. <span className="font-sans text-[18px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[22px] md:text-[26px]">Margin keeps the recovery work legible.</span></h2>
          <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">Getting a recovery started is rarely the hard part. The work is everything that happens between <span className="font-semibold text-[var(--margin-text-primary)]">“something is wrong”</span> and <span className="font-semibold text-[var(--margin-text-primary)]">“this is actually finished.”</span></p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6 lg:mt-12 lg:gap-8">
          {recoveryThreadCards.map((card, index) => (
            <motion.article key={card.title} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className="min-w-0 border-t border-[#D8DEDA] pt-4">
              <div className="relative aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-white p-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] sm:p-3">{card.visual}</div>
              <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">0{index + 1} / RECOVERY THREAD</p>
              <h3 className="mt-2 font-lora text-[25px] leading-[1.06] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[29px]">{card.title}</h3>
              <p className="mt-3 text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">{card.copy}</p>
            </motion.article>
          ))}
        </div>

        <motion.div {...revealProps} className="mt-10 border-t border-[#D8DEDA] pt-7 md:mt-12 md:pt-8">
          <p className="max-w-[700px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">These are not separate problems when you are the seller. <span className="font-medium text-[#48677A]">They become one unresolved recovery thread.</span></p>
          <div className="mt-7 grid gap-6 border-t border-[#D8DEDA] pt-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-12">
            <div><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">The product bridge</p><h3 className="mt-3 font-lora text-[30px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[38px]" style={{ fontWeight: 400 }}>Margin connects the thread.</h3></div>
            <div><p className="max-w-[620px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">Margin keeps the recovery connected from the first finding through the final financial outcome—what happened, what evidence supports it, what needs to happen next, what Amazon did, and whether the money actually came back.</p><p className="mt-4 max-w-[620px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">So you don&apos;t have to become the person coordinating, proving, chasing, and reconciling every recovery yourself.</p><Button onClick={() => onAuditCta("recovery_thread_audit")} className="mt-6 h-12 rounded-[8px] bg-[var(--margin-blue)] px-6 text-[13px] font-semibold text-white shadow-none hover:bg-[var(--margin-blue-hover)]">Start a free Recovery Audit <ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-[#7A878E]">Read-only. See the result before deciding. Nothing is submitted without your approval.</p></div>
          </div>
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
      className="relative overflow-hidden bg-white py-10 md:py-[52px]"
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
            className="recovery-orchestra-canvas relative hidden overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] lg:block"
          >
            <div className="relative z-20"><BrowserChrome path="margin.app/recovery-loop" /></div>
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
          <p className="max-w-[700px] text-[17px] font-semibold leading-8 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[20px] sm:leading-9 md:text-[24px]">
            One continuous recovery lifecycle.
            <span className="mt-2 block font-sans text-[16px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[20px] md:text-[24px]">Not disconnected tools.</span>
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
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img
          src="/emaillist.png"
          alt="Evidence request list"
          className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]"
        />
        <img
          src="/openmail.png"
          alt="Opened evidence request"
          className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]"
        />
      </div>
    </div>
  );
}

function RejectedImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/resubmit.png" alt="Resubmission workspace" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/rejectedreason.png" alt="Rejected case reason" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] -rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function UnderpaidImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/evidenceatt.png" alt="Evidence attached to an underpaid recovery" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/underpayemail.png" alt="Underpayment recovery email" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function AppealableImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/financial.png" alt="Financial recovery record" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/realappeal.png" alt="Appeal record ready for review" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function FinancialClosureImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img
          src="/approved%20reimbursement.png"
          alt="Approved reimbursement record"
          className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]"
        />
        <img
          src="/recoveryclose.png"
          alt="Recovery closeout record"
          className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]"
        />
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
      className="relative overflow-hidden bg-white py-[52px] md:py-[73px]"
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
            <span className="mt-3 block font-sans text-[18px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[22px] md:text-[26px]">It is where the recovery operation stays in view.</span>
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
    <section aria-labelledby="financial-closure-title" className="relative overflow-hidden bg-[var(--margin-canvas)] py-8 md:py-[52px]">
      <div className={containerClass}>
        <div className="grid items-start gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-10">
          <motion.div {...revealProps} className="order-2 min-w-0 lg:order-2 lg:scale-[1.03] lg:origin-center">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">09 / FINANCIAL CLOSURE</span>
            </div>

            <div className="hidden overflow-hidden rounded-[10px] border border-[#4B4F50] bg-[#262829] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
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
            <div className="relative min-h-[360px] overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:min-h-[450px] sm:p-3 lg:h-[560px] lg:min-h-0">
              <BrowserChrome path="margin.app/financial-closure" />
              <div className="h-[calc(100%-28px)] overflow-hidden rounded-b-[6px] bg-white">
              <FinancialClosureImageStack />
              </div>
            </div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-1 border-l border-[#727778] pl-4 md:pl-5 lg:order-1 lg:mt-2">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#66737F]">Expected / Paid / Verified / Remaining</p>
            <h2 id="financial-closure-title" className="mt-2 max-w-[620px] font-lora text-[30px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]" style={{ fontWeight: 400 }}>
              You shouldn&apos;t have to wonder if you actually got paid.
            </h2>
            <p className="mt-3 max-w-[480px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-6">
              Margin checks the recovery against the financial records and keeps track of what&apos;s been paid, what&apos;s been verified, and what&apos;s still outstanding.
            </p>

            <div className="mt-5 border-t border-[var(--margin-border)]">
              {[
                ["Expected", "What you should have received."],
                ["Paid", "What was actually paid."],
                ["Verified", "What Margin can confirm."],
                ["Remaining", "What still needs attention."],
              ].map(([label, body]) => (
                <div key={label} className="border-b border-[var(--margin-border)] py-2.5">
                  <h3 className="text-[11px] font-semibold text-[var(--margin-text-primary)] md:text-[12px]">{label}</h3>
                  <p className="mt-0.5 max-w-[420px] text-[10px] leading-4 text-[var(--margin-text-secondary)] md:text-[11px]">{body}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-[560px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
              When the numbers agree, you&apos;re done.
              <span className="mt-2 block font-sans text-[13px] font-medium leading-6 tracking-normal text-[#48677A] sm:text-[15px]">If they don&apos;t, Margin keeps it open.</span>
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
    <section ref={sectionRef} aria-labelledby="operational-economics-title" className="relative overflow-hidden bg-[var(--margin-canvas)] py-10 sm:py-[52px] md:py-[73px]">
      <div className={containerClass}>
        <div className="grid items-start gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20">
          <motion.div {...revealProps} className="relative min-w-0 h-[380px] overflow-hidden rounded-[10px] border border-white/70 bg-[linear-gradient(135deg,rgba(217,238,245,0.84),rgba(255,255,255,0.74))] p-3 text-[#34414A] shadow-[0_18px_55px_rgba(72,103,122,0.12)] backdrop-blur-2xl sm:h-[410px] sm:p-4 md:h-auto md:p-5 lg:h-[390px] lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-4"><span className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#5D7480]">The work keeps coming back</span><span className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#5D7480]">Every month</span></div>
            <div className="relative grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:gap-0">
              <div className="relative md:pr-8">
                <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#34414A]">Your team</span><span className="font-mono text-[8px] uppercase tracking-tight text-[#6B7D86]">Owns the function</span></div>
                <div className="relative min-h-[112px] py-1 sm:min-h-[124px] md:min-h-[132px]"><div className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#8EA9B5]/55 text-[#48677A]"><svg aria-hidden="true" viewBox="0 0 36 24" className="h-4 w-6 fill-none stroke-current" strokeWidth="1.35"><circle cx="18" cy="7" r="3.2" /><path d="M11.5 19c.4-3.3 2.8-5.2 6.5-5.2s6.1 1.9 6.5 5.2" /><circle cx="7.5" cy="9" r="2.5" /><path d="M2.5 19c.3-2.6 2.1-4.2 5-4.2 1.5 0 2.8.4 3.7 1.2" /><circle cx="28.5" cy="9" r="2.5" /><path d="M33.5 19c-.3-2.6-2.1-4.2-5-4.2-1.5 0-2.8.4-3.7 1.2" /></svg></div><div className="absolute left-[42px] right-[92px] top-1/2 h-px -translate-y-1/2 bg-[#8EA9B5]/55"><motion.span aria-hidden="true" className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-[#0B74DE] shadow-[0_0_0_3px_rgba(11,116,222,0.16)]" initial={{ left: "0%" }} animate={reduceMotion || !sectionInView ? { left: "0%" } : { left: ["0%", "100%", "0%"] }} transition={{ duration: reduceMotion ? 0 : 1.8, ease: "easeInOut", repeat: reduceMotion ? 0 : Infinity, repeatDelay: 0.2 }} /></div><div className="absolute right-0 top-0 flex h-full w-[82px] flex-col justify-between py-1 text-[11px] font-medium leading-3.5 text-[#6B7D86] sm:w-[92px] sm:text-[12px]">{responsibilityCycle.map((step) => <span key={step} className={step === activeResponsibility ? "text-[#34414A]" : ""}>{step}</span>)}</div></div>
                <p className="mt-3 border-t border-dashed border-[#8EA9B5]/40 pt-2 text-center font-mono text-[8px] font-semibold uppercase tracking-tight text-[#6B7D86]">Six responsibilities · one recurring burden</p>
              </div>
              <div className="relative border-t border-[#8EA9B5]/30 pt-4 md:ml-0 md:border-t-0 md:pl-6 md:pt-0">
                <div className="mb-2 flex items-center gap-2"><img src="/logoimagetwo.png" alt="" className="h-4 w-auto" /><span className="font-merriweather text-[16px] tracking-tight text-[#34414A]">Margin</span></div>
                <div className="relative -ml-2 -mr-4 mt-3 h-[56px] w-[calc(100%+1rem)] translate-x-px overflow-hidden rounded-[6px] bg-transparent p-1 sm:-ml-2 sm:-mr-5 sm:mt-4 sm:h-[62px] sm:w-[calc(100%+1.5rem)] md:-ml-3 md:-mr-8 md:w-[calc(100%+2rem)]"><AnimatePresence mode="wait" initial={false}><motion.div key={activeNotification.title} initial={reduceMotion ? { opacity: 1, y: 12, filter: "blur(0px)" } : { opacity: 0, y: 12, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(5px)" }} transition={{ duration: reduceMotion ? 0 : 1, ease: [0.22, 1, 0.36, 1] }} className="flex h-full items-center gap-2 rounded-[5px] bg-[#E7E5DF] px-2.5 py-1.5 text-[#343532] shadow-[0_2px_8px_rgba(52,53,50,0.08)]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#343532]" /><div className="min-w-0 flex-1"><p className="font-mono text-[7px] font-semibold uppercase tracking-tight text-[#6E706B]">Live recovery movement</p><p className="mt-0.5 text-[11px] font-semibold leading-3.5">{activeNotification.title}</p><p className="text-[10px] leading-3">{activeNotification.detail}</p></div><span className="hidden max-w-[68px] text-right text-[7px] leading-3 text-[#6E706B] sm:block">{activeNotification.meta}</span></motion.div></AnimatePresence></div>
                <p className="mt-3 border-t border-[#8EA9B5]/40 pt-2 font-mono text-[8px] font-semibold uppercase tracking-tight text-[#6B7D86]">The burden becomes one connected recovery record.</p>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-[38%] left-[55%] top-[34px] hidden w-px -translate-x-[2px] bg-[#8EA9B5]/35 md:block" aria-hidden="true" /><div className="mt-4 border-t border-[#8EA9B5]/35 pt-2 text-center font-lora text-[16px] leading-tight tracking-tight text-[#34414A] sm:text-[19px]" style={{ fontWeight: 400 }}>The work is transferred. The authority stays with you.</div>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }}>
            <div className="mb-3 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">11 / THE COST OF DOING IT YOURSELF</span></div>
            <h2 id="operational-economics-title" className="font-lora text-[31px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[50px]" style={{ fontWeight: 400 }}>Recovery is not a task. It is a function.</h2>
            <p className="mt-2 max-w-[720px] font-sans text-[15px] font-medium leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[17px] sm:leading-8">Margin takes ownership of the recovery work so your team doesn&apos;t have to build and maintain the function themselves.</p>
            <div className="mt-5 border-t border-[var(--margin-border)]"><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Recurring</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">The work returns whenever the next issue appears.</p></div><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Connected</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">Evidence, cases, responses, payouts, and outcomes stay together.</p></div><div className="border-b border-[var(--margin-border)] py-2.5"><p className="text-[13px] font-semibold text-[var(--margin-text-primary)]">Owned by Margin</p><p className="mt-0.5 text-[12px] leading-4 text-[var(--margin-text-secondary)]">Your team remains the authority without carrying the entire operating burden.</p></div></div>
            <p className="mt-5 max-w-[520px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">You are not adding another tool to operate.<span className="mt-1.5 block font-medium text-[#48677A]">You are removing another function from your workload.</span></p>
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
    <section aria-labelledby="recovery-outcome-title" className="relative bg-[var(--margin-canvas)]">
      <div ref={outcomeSceneRef} className="relative lg:min-h-[520vh]">
        <div className="lg:sticky lg:top-16 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-start">
          <div className={`${containerClass} w-full py-16 md:py-24 lg:py-4 xl:py-6`}>
            <div className="grid items-start gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
              <motion.div {...revealProps} className="order-1">
                <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">10 / WHEN THINGS GO WRONG</span></div>
                <h2 id="recovery-outcome-title" className="max-w-[820px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px] lg:text-[58px]" style={{ fontWeight: 400 }}>A recovery doesn&apos;t disappear when Amazon says no.</h2>
                <p className="mt-4 max-w-[760px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">
                  Margin doesn&apos;t give up at the first answer. It treats the response as part of the recovery record—not automatically the end of it. Where the evidence and rules support another path, Margin determines the appropriate next action.
                </p>
              </motion.div>

              <motion.div {...revealProps} className="order-3 mt-0 lg:order-2 lg:row-span-2 lg:sticky lg:top-24 lg:self-start">
                <div className="relative min-h-[360px] overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:min-h-[450px] sm:p-3 lg:h-[560px] lg:min-h-0">
                  <BrowserChrome path="margin.app/recovery-outcomes" />
                  <div className="relative h-[calc(100%-28px)] overflow-hidden rounded-b-[6px] bg-white">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%)]" />
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
                </div>
              </motion.div>

              <motion.div {...revealProps} className="order-2 lg:order-3">
                <div className="mt-0 lg:mt-8">
                {recoveryOutcomeStates.map((state, index) => {
                  const isActive = index === activeOutcome;
                  return (
                    <div key={state.title} className={`border-b border-[var(--margin-border)] py-3.5 transition-opacity duration-300 sm:py-4 ${isActive ? "opacity-100" : "opacity-45"}`}>
                      <h3 className={`tracking-[-0.035em] ${isActive ? "text-[20px] font-medium text-[var(--margin-text-primary)] sm:text-[22px]" : "text-[19px] font-normal text-[var(--margin-text-secondary)] sm:text-[21px]"}`}>{state.title}</h3>
                      {isActive ? <p className="mt-2 max-w-[420px] text-[13px] leading-5 text-[var(--margin-text-secondary)] sm:text-[14px]">{state.description}</p> : null}
                    </div>
                  );
                })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}


function RecoverOncePagePreview() {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3">
      <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2"><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">margin.app/recover-once</span></div>
      <div className="relative h-[520px] overflow-hidden rounded-b-[6px] bg-[#FBFAF7] sm:h-[600px]">
        <iframe title="Recover Once page preview" src="/recover-once" className="h-full w-full border-0 bg-[#FBFAF7]" loading="lazy" />
      </div>
      <p className="px-1 pt-2 text-center font-mono text-[9px] uppercase tracking-tight text-[#647783]">Scroll the live offer page</p>
    </div>
  );
}


function BrowserChrome({ path }: { path: string }) {
  return (
    <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2">
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      <span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">{path}</span>
    </div>
  );
}

function DiscrepancyModalVisual() {
  const [mode, setMode] = useState<'finding' | 'proof'>('finding');
  const isProof = mode === 'proof';
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3">
      <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2"><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">margin.app/app/demo-workspace</span></div>
      <div className="mx-auto max-h-[620px] w-full max-w-[900px] overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E9E9EC] px-4 pb-2.5 pt-3"><div><p className="text-[10px] text-[#8A99A5]">{isProof ? 'Proof required' : 'Finding detail'}</p><h3 className="mt-1 text-[20px] font-normal leading-tight tracking-tight">{isProof ? 'Evidence required for this finding' : 'Fee Charge Review'}</h3><p className="mt-1 max-w-[610px] text-[10px] leading-4 tracking-tight text-[#6B7280]">{isProof ? 'Margin checks connected sources first. If the proof cannot be found automatically, upload it in Evidence Records so the case can keep moving.' : 'A storage-related charge appears to have been applied more than the seller record supports. · $1484.80 charged vs $742.40 expected'}</p></div><button type="button" aria-label="Close preview" className="text-[18px] leading-none text-[#9CA3AF]">×</button></div>
        <div className="flex border-b border-[#E9E9EC] bg-[#FAFAFB] px-4 py-2"><button type="button" onClick={() => setMode('finding')} className={`mr-4 border-b-2 pb-1 text-[10px] font-medium ${!isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#858792]'}`}>View finding</button><button type="button" onClick={() => setMode('proof')} className={`border-b-2 pb-1 text-[10px] font-medium ${isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#858792]'}`}>Proof needed</button></div>
        {isProof ? <div className="grid max-h-[470px] gap-0 overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]"><div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r"><div className="mb-3 flex gap-2"><span className="border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-1 text-[9px]">Fee Charge Review</span><span className="border border-[#B9D9C8] bg-[#F2FBF5] px-2 py-1 text-[9px] text-[#26734D]">Claim candidate</span></div><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">Required documentation</p><div className="mt-2 divide-y divide-[#E9E9EC] border-y border-[#E9E9EC]">{[['Fee event or settlement row','The charged fee transaction, fee type, settlement ID, order ID, or shipment context.'],['Product and marketplace context','SKU/ASIN, marketplace, fulfilment channel, size tier, dimensions, weight, and category where available.'],['Expected fee basis','The schedule version, rate basis, or calculation inputs Margin is comparing against the charge.'],['Charged-versus-expected amount','The actual fee, expected fee, currency, and overcharge delta for the same event.']].map(([label,copy]) => <div key={label} className="grid gap-2 py-2 sm:grid-cols-[150px_1fr]"><p className="text-[10px] font-medium text-[#50525B]">{label}</p><p className="text-[10px] leading-4 text-[#858792]">{copy}</p></div>)}</div><div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">What Margin already found</p><p className="mt-1 text-[10px] leading-4 text-[#50525B]">Order 113-9204451-1885026 · Settlement SETTLE-ACME-003 · SKU ACME-DESK-LAMP-OAK</p><div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-[#6B7280]"><span>Order ID<br /><strong className="text-[#182026]">113-9204451-1134623</strong></span><span>SKU<br /><strong className="text-[#182026]">ACME-DEMO-SKU-18</strong></span><span>ASIN<br /><strong className="text-[#182026]">B0ACME0018</strong></span><span>Shipment<br /><strong className="text-[#182026]">FBA17ACME018</strong></span></div></div><div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">If proof is missing</p><p className="mt-1 text-[10px] leading-4 text-[#50525B]">Margin keeps looking across connected repositories before asking the seller. If the required document is not found, upload it in Evidence Records and Margin can attach it to the filing workflow.</p></div></div><div className="px-4 py-3"><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">Why this proof matters</p><p className="mt-2 text-[10px] leading-4 text-[#50525B]">Margin checks the fee event against the available product, order, shipment, and fee basis before treating it as a supported case.</p><div className="mt-4 space-y-3 border-t border-[#E9E9EC] pt-3"><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">Amazon policy basis</p><p className="text-[10px] leading-4 text-[#50525B]">Amazon selling and FBA fee schedule review</p><p className="text-[9px] font-medium uppercase tracking-tight text-[#858792]">Claim window</p><p className="text-[10px] text-[#50525B]">28 days left · Deadline Feb 18, 2026</p></div></div></div> : <div className="grid max-h-[470px] gap-0 overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]"><div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r"><div className="grid border-y border-[#E9E9EC] md:grid-cols-3 md:divide-x md:divide-[#F0F0F2]"><div className="py-2 md:pr-3"><p className="text-[9px] uppercase tracking-tight text-[#858792]">Amount under review</p><p className="mt-1 text-[17px] font-medium">$900.95</p></div><div className="border-t border-[#E9E9EC] py-2 md:border-t-0 md:px-3"><p className="text-[9px] uppercase tracking-tight text-[#858792]">Found on</p><p className="mt-1 text-[11px] font-medium">Jan 21, 2026, 04:37 PM</p></div><div className="border-t border-[#E9E9EC] py-2 md:border-t-0 md:pl-3"><p className="text-[9px] uppercase tracking-tight text-[#858792]">Amazon source / activity</p><p className="mt-1 text-[10px] font-medium">Amazon FBA Settlement Activity</p><span className="mt-2 inline-flex border border-[#B9D9C8] bg-[#F2FBF5] px-2 py-0.5 text-[9px] text-[#26734D]">Evidence-ready</span></div></div><div className="mt-3"><p className="text-[9px] uppercase tracking-tight text-[#858792]">What Margin found</p><p className="mt-1 text-[10px] leading-4 text-[#50525B]">A storage-related charge appears to have been applied more than the seller record supports. · $1484.80 charged vs $742.40 expected</p><span className="mt-2 inline-flex border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-0.5 text-[9px]">Fee discrepancy</span><div className="mt-3 border-t border-[#E9E9EC] pt-2.5"><p className="text-[9px] uppercase tracking-tight text-[#858792]">Evidence used</p><p className="mt-1 text-[10px] leading-4 text-[#50525B]">Order 113-9204451-1885026 · Settlement SETTLE-ACME-003 · SKU ACME-DESK-LAMP-OAK</p></div><div className="mt-3 border border-[#CFE0EA] bg-[#F7FBFF] p-2.5"><div className="flex items-center justify-between gap-2"><p className="text-[9px] font-semibold uppercase tracking-tight text-[#0B74DE]">Margin analysis</p><p className="text-[8px] font-semibold uppercase text-[#26734D]">Investigation complete</p></div><p className="mt-1 text-[10px] leading-4 text-[#50525B]">Margin connected the Amazon activity, seller records, and expected outcome to identify the recovery gap.</p><div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#DCEAF4] pt-2 text-[9px]"><span>Charge applied<br /><strong>$1,792.82</strong></span><span>Should have been<br /><strong>$828.87</strong></span><span>Difference<br /><strong className="text-[#0B74DE]">$900.95</strong></span></div></div><div className="mt-3 border-y border-[#E9E9EC] bg-[#FFFBF8] py-2"><p className="text-[9px] font-semibold uppercase tracking-tight text-[#A95F49]">Why unresolved</p><p className="mt-1 text-[10px] leading-4 text-[#6B7280]">Evidence is assembled; Margin is waiting for the filing gate to clear.</p></div></div></div><div className="px-4 py-3"><p className="text-[9px] uppercase tracking-tight text-[#858792]">Backend detection record</p><div className="mt-2 grid grid-cols-2 gap-3 border-b border-[#E9E9EC] pb-3 text-[9px]"><span>Backend record<br /><strong>demo-finding</strong></span><span>Source<br /><strong>SP API</strong></span><span>Confidence<br /><strong>94%</strong></span><span>Readiness<br /><strong>Claim candidate</strong></span></div><p className="mt-3 text-[9px] uppercase tracking-tight text-[#858792]">Amazon policy basis</p><p className="mt-1 text-[10px] leading-4 text-[#50525B]">Amazon selling and FBA fee schedule review</p><p className="mt-3 text-[9px] uppercase tracking-tight text-[#858792]">Deadline</p><p className="mt-1 text-[10px] text-[#50525B]">28 days left · Feb 18, 2026</p></div></div>}
        <div className="flex items-center justify-between border-t border-[#E9E9EC] px-4 py-2 text-[9px] text-[#858792]"><span>ACM-FD-2604-0018 · Fee Charge Review</span>{isProof ? <button type="button" className="rounded-[6px] bg-[#0B74DE] px-3 py-1.5 text-[9px] font-medium text-white">Open Evidence Records</button> : <span>Evidence and policy checks aligned</span>}</div>
      </div>
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-tight text-white/70">Interactive finding detail · click between the two exact platform states</p>
    </div>
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
        <KineticHeroSection onAuditCta={() => { trackEarlyAccessCtaClicked("hero_connect_amazon"); navigate("/get-started"); }} isFull={isFull} nextBatchHours={nextBatchHours} />
        <MarginEngineSection />
        <RealityCheckSection />
        <MarginLifecycleSection />
        <ControlSection />
        <MarginStandardSection />
        <RecoveryWorkStatement />
        <AccountingEvidenceSection />
        <RiskSection />
        <RecoveryOutcomeExplorer />
        <OperationalEconomicsSection />
        <RecoveryThreadSection onAuditCta={() => handleClaimAccessClick("recovery_thread_audit", "sp_api")} />
        <RecoveryOfferSection onAuditCta={handleClaimAccessClick} />
        <RecoveryRoutingSection onAuditCta={handleClaimAccessClick} />

        {/* Section 14 — Trust / FAQ */}
        <section className="relative bg-[var(--margin-canvas)] py-[83px] md:py-[146px]" aria-labelledby="trust-faq-title">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-blue)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">14 / TRUST / FAQ</span>
              </div>
              <h2 id="trust-faq-title" className="font-lora text-[34px] font-medium leading-tight tracking-[-0.045em] sm:text-[42px] md:text-[46px]" style={{ fontWeight: 400 }}>
                <span className="text-[var(--margin-text-primary)]">Before you run the Audit.</span> <span className="font-sans text-[18px] font-medium tracking-[-0.01em] text-[#48677A] sm:text-[22px] md:text-[26px]">A few things to know.</span>
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
        <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-5 sm:py-6 md:py-9" aria-labelledby="final-handoff-title">
          <div className={containerClass}>
            <div className="grid items-center gap-6 border-y border-[var(--margin-border)] py-6 md:gap-8 md:py-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
              <motion.div {...revealProps} className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">15 / FINAL DELEGATION</p>
                <h2 id="final-handoff-title" className="mt-2 max-w-[720px] font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[44px]" style={{ fontWeight: 400 }}>
                  You don&apos;t have to wonder.
                </h2>
                <div className="mt-4 grid gap-x-5 gap-y-2 border-y border-[var(--margin-border-subtle)] py-2.5 sm:grid-cols-2">
                  {["Finds the recovery.", "Builds the case.", "Carries it forward.", "Keeps the outcome visible."].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[12px] leading-5 text-[var(--margin-text-secondary)] md:text-[13px]">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--margin-blue)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
                  You sell. Margin runs the recovery operation.
                </p>
                <Button onClick={() => handleClaimAccessClick("homepage_early_access_section")} className="landing-pressable mt-5 h-11 rounded-[7px] bg-[var(--margin-blue)] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] hover:bg-[var(--margin-blue-hover)]">
                  Get It Handled <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
                <RecoverOncePagePreview />
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
