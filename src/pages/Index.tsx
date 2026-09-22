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
import { RecoveryOfferSection, RecoveryOfferSectionDuplicate, RecoveryRoutingSection } from "@/components/landing/RecoveryDecisionSections";
import { AuditImageStackVisual } from "@/components/landing/AuditImageStackVisual";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";
import { useOnboardingCapacity } from "@/hooks/useOnboardingCapacity";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ANALYTICS_EVENTS } from "@/lib/analyticsEvents";
import { trackEarlyAccessCtaClicked, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { MarginEngineSection } from "@/components/landing/MarginEngineSection";
import { GoogleMark } from "@/components/GoogleMark";

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
    <section data-navbar-theme="light" className="relative overflow-x-hidden bg-[#D7D9D5] py-10 md:py-16" aria-labelledby="accounting-section-title">
      <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-16 xl:gap-24">
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 min-w-0 overflow-hidden lg:order-1">
              <div className="relative min-h-[390px] overflow-hidden py-8 sm:min-h-[430px] sm:py-10">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#D7D9D5] via-[#D7D9D5]/85 to-transparent sm:w-24" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#D7D9D5] via-[#D7D9D5]/85 to-transparent sm:w-24" />
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
              Bring it all together.
            </h2>
            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              <span className="font-semibold text-[#182026]">Before:</span> Search across Amazon, settlements, accounting, email, and files to piece together what happened.
            </p>
            <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              <span className="font-semibold text-[#182026]">Now:</span> Relevant records come together in one place, so you can understand the situation without chasing information across systems.
            </p>
            <div className="mt-8 border-t border-[#C9D1D6] pt-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#66737F]">Amazon · Accounting · Settlements · Files · Email</p>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] font-semibold uppercase tracking-tight text-[#66737F]">
                <span>Read-only.</span><span className="text-[#B5C2CA]">·</span><span>Purpose-limited.</span><span className="text-[#B5C2CA]">·</span><span>Your books remain your books.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const financialControlOperations = [
  "Find the discrepancy",
  "Trace what happened",
  "Prove what’s owed",
  "Build the recovery",
  "Handle the case",
  "Manage rejections",
  "Pursue appeals",
  "Reconcile the outcome",
];

function FinancialControlOperationsSection() {
  const reduceMotion = useReducedMotion();
  const [activeOperation, setActiveOperation] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setActiveOperation(0);
      return;
    }
    const interval = window.setInterval(() => {
      setActiveOperation((current) => (current + 1) % financialControlOperations.length);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  const visibleOperations = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const index = (activeOperation - offset + financialControlOperations.length) % financialControlOperations.length;
    return { operation: financialControlOperations[index], offset, opacity: [0.1, 0.3, 0.6, 1, 0.6, 0.3, 0.1][offset + 3] };
  });

  return (
    <section className="relative overflow-hidden bg-[#F4F7F7] py-14 sm:py-18 md:py-24" aria-labelledby="financial-control-operations-title">
      <div className={containerClass}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-20">
          <motion.div {...revealProps}>
            <h2 id="financial-control-operations-title" className="max-w-[620px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Margin handles the work between a financial problem and its resolution
            </h2>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative flex min-h-[330px] items-center justify-center overflow-hidden sm:min-h-[430px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)]">
            <div className="relative flex w-full max-w-[585px] flex-col items-center justify-center gap-1.5 text-center sm:gap-2.5">
              {visibleOperations.map(({ operation, offset, opacity }) => {
                const isActive = offset === 0;
                return (
                  <motion.div
                    key={operation}
                    initial={false}
                    layout
                    animate={{ opacity, scale: isActive ? 1.02 : 1 }}
                    transition={{
                      layout: { duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] },
                      scale: { duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] },
                    }}
                    className={`font-lora text-[32px] leading-[1.05] tracking-[-0.045em] sm:text-[48px] md:text-[60px] ${isActive ? "text-[#182026]" : "text-[#A8B3B7]"}`}
                    style={{ fontWeight: 400 }}
                  >
                    {operation}
                  </motion.div>
                );
              })}
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

function DeferredVideo({ src, label, className }: { src: string; label: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || shouldLoad) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={shouldLoad ? src : undefined}
      autoPlay={shouldLoad}
      loop
      muted
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}

function HistoricalVideoPreviewSections() {
  return (
    <>
      {historicalVideoSections.map((section, sectionIndex) => (
        <section key={section.id} aria-labelledby={`${section.id}-title`} className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[900px]">
              <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">{String(sectionIndex + 1).padStart(2, "0")} / {section.label}</span></div>
              <h2 id={`${section.id}-title`} className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[54px]" style={{ fontWeight: 400 }}>{section.title}</h2>
              <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">{section.body}</p>
            </motion.div>
            <div className={`mt-10 grid gap-5 ${section.videos.length > 2 ? "sm:grid-cols-2" : "lg:grid-cols-2"}`}>
              {section.videos.map((video, videoIndex) => (
                <motion.div key={`${video}-${videoIndex}`} {...revealProps} transition={{ ...revealProps.transition, delay: videoIndex * 0.08 }} className="relative overflow-hidden rounded-[12px] bg-[#F3F7F8] sm:rounded-[16px]"><DeferredVideo className="block aspect-video w-full object-cover" src={video} label={`${section.label} demonstration ${videoIndex + 1}`} /></motion.div>
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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="inline-flex max-w-full items-center rounded-[5px] border border-white/[0.12] bg-[#20385B]/72 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-tight text-slate-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)] backdrop-blur-xl sm:text-[11px]">Financial Resolution Infrastructure for Commerce.</motion.div>
          <div id="margin-hero-title" className="mt-6 max-w-[1040px] font-lora text-[42px] leading-[0.96] tracking-[-0.045em] min-[390px]:text-[48px] sm:mt-7 sm:text-[68px] md:text-[82px] lg:text-[96px]" style={{ fontWeight: 400 }}>
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Is everything actually okay <span className="text-[#8FB5C9]">with your Amazon business?</span></motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Stop wondering where money is slipping through the cracks. Spend more time growing your business, and less time checking whether Amazon got the numbers right.</motion.p>
          <p className="mt-4 text-[13px] font-medium leading-6 tracking-[-0.01em] text-[#B7CFDC] sm:mt-5 sm:text-[15px]">You keep selling. Margin handles the recovery.</p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Get it handled" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[#E5E5E0] px-6 text-[15px] font-bold text-[#111111] shadow-[0_18px_48px_rgba(0,0,0,0.24)] transition-[background-color,box-shadow] duration-200 hover:bg-[#D4D4CF] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Get It Handled <ArrowRight className="ml-2 h-5 w-5" /></Button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="mt-5 flex w-full max-w-[780px] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] font-medium text-slate-300 sm:mt-8 sm:justify-start sm:gap-x-5 sm:text-left sm:text-[12px]">
            <span>Free Audits</span><span className="text-slate-600">·</span><span>Read-only access</span><span className="text-slate-600">·</span><span>You approve every submission</span>
          </motion.div>
          {isFull ? <div className="mt-5 max-w-[430px] rounded-[8px] bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
        </div>
      </div>
    </motion.section>
  );
}


function OneRecoverySection() {
  return (
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-10 md:py-14">
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
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:gap-8">
        <div className="flex flex-col justify-center">
        <motion.div {...revealProps} className="flex max-w-[900px] flex-col justify-center">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              03 / THE PROBLEM</span>
          </div>
          <h2 className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
            Make the money make sense.
          </h2>
          <p className="mt-6 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            <span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Piece together and dig through transactions, documents, evidence, and Amazon records to figure out where something went wrong.
          </p>
          <p className="mt-5 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            <span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> See the discrepancy, understand why it matters, what supports it, and know what happens next.
          </p>
        </motion.div>
        </div>
        <motion.div {...revealProps} className="relative">
          <DiscrepancyModalVisual compactMobile />
        </motion.div>
        </div>
      </div>
    </section>
  );
}

const recoveryHarnessPoints = [
  {
    number: "01",
    title: "Guardrails Controlled by Design",
    lead: "Not everything becomes a claim.",
    body: "Margin applies evidence, rules, and guardrails before a recovery moves forward. You see what was found, why it matters, and approve the action before anything is submitted.",
    outcome: "Find it. Prove it. Approve it.",
  },
  {
    number: "02",
    title: "Learns From What Happens",
    lead: "Every outcome teaches the system.",
    body: "Rejections, responses, recoveries, reversals, and successful outcomes become part of the evidence Margin learns from. What happens to one case can improve how the next case is investigated and handled.",
    outcome: "What happens next makes Margin better.",
  },
  {
    number: "03",
    title: "Builds From the Supply Chain",
    lead: "The transaction is only part of the story.",
    body: "Margin connects supply-chain financial events and operational records — shipments, inventory movements, fulfillment events, returns, and financial activity — to reconstruct what actually happened and build the case around it.",
    outcome: "Context grounds the case.",
  },
];
function GuardrailListVisual() {
  const items = [
    { title: "Blocked (Overcharged Fee FG34421)", detail: "Compiling complete evidence for this case", status: "Held", tone: "text-[#9A5A03]" },
    { title: "Paused (Reversed Payment)", detail: "Investigating reversal…", status: "Review", tone: "text-[#52616A]" },
    { title: "Case rejected by Amazon", detail: "Rebuilding the case from objection…", status: "Rework", tone: "text-[#7A5147]" },
  ];
  return (
    <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[4px] border border-[#BFC5C1] bg-[#D7D9D5]" aria-label="Guardrails evidence status list">
      <img src="/recovery-harness-guardrails.png" alt="Seller reviewing evidence before approving a recovery" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-[#263438]/42 backdrop-blur-[1px]" />
      <div className="relative flex h-full items-center justify-center p-3 sm:p-5">
        <div className="w-full max-w-[390px] space-y-2.5">
          {items.map(({ title, detail, status, tone }) => (
            <div key={title} className="rounded-[10px] bg-[#F2F4F2]/78 px-3 py-2.5 shadow-[0_14px_30px_rgba(20,31,34,0.16)] backdrop-blur-xl sm:px-4 sm:py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4FB879] text-white shadow-[0_3px_8px_rgba(31,119,76,0.22)]" aria-hidden="true"><Check className="h-3 w-3" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-[11px] font-semibold leading-4 tracking-tight text-[#263438] sm:text-[12px]">{title}</span>
                <span className={`shrink-0 text-[9px] font-semibold leading-4 tracking-tight ${tone}`}>{status}</span>
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-3.5 tracking-tight text-[#667177]">{detail}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function RecoveryHarnessSection() {
  function SettlementOutcomeVisual() {
    return (
      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[4px] border border-[#BFC5C1] bg-[#D7D9D5]" aria-label="Settlement outcome record">
        <img src="/recovery-harness-settlement.png" alt="Settlement statement showing a recorded recovery outcome" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-3 bottom-3 rounded-[10px] bg-[#F2F4F2]/78 px-3 py-2.5 shadow-[0_14px_30px_rgba(20,31,34,0.16)] backdrop-blur-xl sm:inset-x-4 sm:bottom-4 sm:px-4 sm:py-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7B878D]">Case outcome</span>
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-tight text-[#2D7B59]"><Check className="h-3 w-3" strokeWidth={2.5} /> Pattern learned</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold leading-4 tracking-tight text-[#263438] sm:text-[12px]">Rejected → Reason identified → Evidence updated → Refiled</p>
          <p className="mt-1 text-[9px] leading-3.5 tracking-tight text-[#667177]">Evidence requirement → updated</p>
        </div>
      </div>
    );
  }
  return (
    <section className="relative overflow-hidden border-y border-[#D8E3EA] bg-[#F4F8F8] py-12 sm:py-14 md:py-20" aria-labelledby="recovery-harness-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[760px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">THE RECOVERY HARNESS</span>
          </div>
          <h2 id="recovery-harness-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            The Recovery Harness
          </h2>
          <p className="mt-5 max-w-[720px] text-[16px] leading-7 text-[var(--margin-text-secondary)] sm:text-[18px] sm:leading-8">
            Margin doesn&apos;t just find something that looks wrong. It establishes whether there&apos;s something worth acting on, learns from what happens, and builds the case from the evidence around it.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[10px] bg-[#D8E3EA] shadow-[0_18px_50px_rgba(37,49,58,0.07)] md:mt-14 md:grid-cols-3">
          {recoveryHarnessPoints.map((point, index) => (
            <motion.article key={point.number} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className="flex min-h-[330px] flex-col bg-transparent p-0">
              {point.number === "01" ? <GuardrailListVisual /> : null}
              {point.number === "02" ? <SettlementOutcomeVisual /> : null}
              <h3 className="mt-6 px-6 font-lora text-[25px] leading-[1.08] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:px-8 sm:text-[28px]">{point.title}</h3>
              <p className="mt-5 px-6 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#294B61] sm:px-8">{point.lead}</p>
              <p className="mt-3 px-6 text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:px-8">{point.body}</p>
              <p className="mt-auto px-6 pt-7 font-lora text-[17px] leading-6 tracking-[-0.02em] text-[var(--margin-text-primary)] sm:px-8">{point.outcome}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
function MarginLifecycleSection() {

  return (
    <section
      aria-labelledby="margin-lifecycle-title"
      className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11"
    >
      <div className={containerClass}>
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <motion.div {...revealProps} className="relative order-2 h-fit self-start overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 lg:order-1">
          <BrowserChrome path="margin.app/workspace" />
          <div className="isolate overflow-hidden rounded-[12px]" style={{ clipPath: "inset(0 round 12px)", WebkitClipPath: "inset(0 round 12px)" }}>
            <DeferredVideo className="block aspect-[1.45] w-full scale-[1.04] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.18)]" src="/workflow.mp4" label="How Margin handles recovery work" />
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
            Let it be handled.
          </h2>
        </motion.div>

          <motion.p {...revealProps} className="mt-6 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            <span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Investigate the records yourself, piece together and work through transactions, metadata, and supporting records to figure out whether a case can actually be supported.
          </motion.p>
          <motion.p {...revealProps} className="mt-5 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            <span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> The relevant evidence is examined, the case is built, and the next step is ready when you are.
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
    <section ref={operationScrollRef} className="relative bg-[#FAFAF7] py-10 md:py-14">
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
    <section className="relative overflow-hidden bg-[#FAFAF7] py-8 sm:py-10 md:py-12" aria-labelledby="control-section-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <motion.div {...revealProps} className="lg:sticky lg:top-28">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">05 / CONTROL</span>
            </div>
            <h2 id="control-section-title" className="max-w-[620px] font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[56px]" style={{ fontWeight: 400 }}>
              Keep the recovery moving.
            </h2>
            <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              <span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Carry every case forward manually as evidence changes, submissions move, Amazon responds, and payouts arrive.
            </p>
            <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              <span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> See what is ready to approve, what has been filed, what is waiting on Amazon, what needs attention, and what is resolved—without having to keep every recovery in your head.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="relative overflow-hidden rounded-[14px] border border-[#DCE8EE] bg-white shadow-[0_24px_75px_rgba(42,91,116,0.12)]">
            <FinalDelegationPreview compactMobile src="/filing-pipeline-preview" title="Recovery Pipeline page preview" />
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
    <section className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11" aria-labelledby="margin-standard-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="order-1 max-w-[720px] lg:order-2">
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

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-2 border-t border-[var(--margin-border)] lg:order-1">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OneRecordAnalysisVisual() {
    const checks = [
      ['Delta confirmed', '14 received against 17 planned; the three-unit shortage remains explicit.'],
      ['Shipment identity bound', 'FBA shipment, SKU, ASIN, and supplier delivery resolve to one event.'],
      ['Receiving trail aligned', 'Carrier delivery and warehouse intake support the same delivery window.'],
      ['Adjustment gap preserved', 'The inventory adjustment does not explain or restore the missing units.'],
      ['Reimbursement not found', 'No matching payout is recorded for the supported shortage in the reviewed period.'],
      ['Submission basis prepared', 'The supported delta is separated from the units that still require proof.'],
    ];
  
    return (
    <div className="relative isolate max-h-[360px] overflow-y-auto rounded-[8px] border border-[#BFD8E6]/80 bg-[#EAF4F8] shadow-[0_18px_60px_rgba(37,91,116,0.16)] sm:max-h-none sm:overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.95),transparent_34%),linear-gradient(135deg,#EAF5F9_0%,#DDECF3_50%,#F5FAFB_100%)]" />
        <motion.div aria-hidden="true" className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#B9E0EF]/65 blur-3xl" animate={{ x: [0, 16, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div aria-hidden="true" className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-[#C9D5F0]/65 blur-3xl" animate={{ x: [0, -15, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
        <div className="relative grid gap-3 p-3 sm:p-4 lg:grid-cols-[1.32fr_0.68fr] lg:gap-4">
          <div className="rounded-[10px] border border-white/85 bg-white/58 p-3 shadow-[0_16px_34px_rgba(56,95,112,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#C9DDE5]/80 pb-2">
              <div>
                <p className="text-[11px] font-medium tracking-tight text-[#66737F]">FBA evidence extraction</p>
                <p className="mt-0.5 font-lora text-[14px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[15px]">Shortage variance (delta)</p>
              </div>
              <span className="rounded-full bg-[#E3F0F5] px-2 py-1 text-[10px] font-medium tracking-tight text-[#0B74DE]">Analyzed</span>
            </div>
            <div className="mt-2.5 space-y-1.5 text-[11px] leading-5 text-[#4D5B66]">
              <p>Amazon&apos;s receiving record shows <strong className="font-semibold text-[#182026]">14 units received</strong> against a shipment plan for 17 units.</p>
              <p><span className="rounded-[3px] bg-[#F5E7A9]/85 px-1 text-[#4D4A32]">The three-unit delta survives every receiving record reviewed</span>; it is not a simple posting delay or a duplicate line.</p>
              <p><span className="rounded-[3px] bg-[#CDEBE2]/90 px-1 text-[#315D56]">Carrier delivery and warehouse intake records agree on the delivery window</span>, proving the shipment arrived while leaving the shortage inside Amazon&apos;s receiving trail.</p>
              <p><span className="rounded-[3px] bg-[#EACEDB]/85 px-1 text-[#6A4054]">The subsequent inventory adjustment does not reconcile the three units</span>, and the payout records reviewed do not show that Amazon has already reimbursed them.</p>
              <p>This is the distinction a surface-level review misses: the records support a defined shortage, but only <strong className="font-semibold text-[#182026]">14 of 17 affected units</strong> are presently defensible for filing. Margin keeps the remaining three unresolved rather than overstating the claim.</p>
            </div>
          </div>
          <div className="space-y-1.5 p-1 sm:p-2">
            <p className="mb-1 text-[11px] font-medium tracking-tight text-[#66737F]">Meta-detail extracted</p>
            {checks.map(([title, detail]) => (
              <div key={title} className="flex items-start gap-2 rounded-[7px] border border-white/70 bg-white/44 px-2 py-1.5 shadow-[0_8px_18px_rgba(56,95,112,0.08),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#16866B] text-white" aria-hidden="true"><Check className="h-2 w-2" strokeWidth={3} /></span>
                <span className="min-w-0"><span className="block text-[10px] font-semibold leading-3.5 tracking-tight text-[#182026]">{title}</span><span className="mt-0.5 block text-[9px] leading-3.5 text-[#66737F]">{detail}</span></span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-[#BFD8E6]/70 pt-3 text-[11px] font-medium tracking-tight text-[#182026]">
              <span>Proceed to Dispute</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#0B74DE]" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  function RecoveryWorkStatement() {
  return (
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-7 sm:py-8 md:py-11" aria-labelledby="trust-section-title">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-10">
          <motion.div {...revealProps} className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">              07 / ONE RECORD</p>
            <h2 id="trust-section-title" className="mt-4 font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>Make the evidence usable.</h2>
            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7"><span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Reconstruct the case from disconnected records and turn scattered details into an explanation you can actually stand behind.</p>
            <p className="mt-5 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7"><span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> Extract the relevant facts, connect them to the records that support them, and show why the recovery exists—not just that it does.</p>
          </motion.div>
          <motion.div {...revealProps} className="relative overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 lg:p-4">
            <BrowserChrome hidePath />
            <OneRecordAnalysisVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryThreadSection({ onAuditCta }: { onAuditCta: (location: string) => void }) {
  const recoveryThreadCards = [
    {
      title: "See the problem. Know the next step.",
      copy: "When something doesn’t add up, Margin shows what happened, what supports it, and what needs to happen next. You see the issue and keep moving.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.98),transparent_36%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_54%,#F9FAF8_100%)]" />
          <motion.div aria-hidden="true" className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#D9EEE8]/75 blur-2xl" animate={{ x: [0, 16, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-[#D8E8F4]/75 blur-2xl" animate={{ x: [0, -14, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[9%] right-[9%] top-[18%] -translate-y-1/2 lg:top-[7%]"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-2.5">
              {[
                "Phantom Fee",
                "SLA Breach Compensation",
                "Dispute Charge",
                "Removal Auditor",
                "Warehouse Damage",
              ].map((label, index) => (
                <div key={label} className={`flex items-center gap-3 rounded-[10px] border border-white/70 px-3 py-2.5 shadow-[0_12px_28px_rgba(56,74,82,0.08),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-lg sm:px-4 sm:py-3 ${index === 0 ? "bg-white/62" : index === 1 ? "bg-white/54" : index === 2 ? "bg-white/48" : "bg-white/42"}`}>
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${index === 0 || index === 2 ? "border-[#8DB8D0] bg-[#E8F3F8] text-[#0B74DE]" : "border-[#C8D0CD] bg-white/60"}`} aria-hidden="true">{(index === 0 || index === 2) && <Check className="h-3 w-3" strokeWidth={2.5} />}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[11px] font-medium tracking-[-0.02em] text-[#344149] sm:text-[13px]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "The recovery stays together.",
      copy: "Documents, responses, evidence, reversals, and appeals stay connected. You stay out of the chase.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.98),transparent_38%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_54%,#F9FAF8_100%)]" />
          <motion.div aria-hidden="true" className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-[#D8E8F4]/75 blur-2xl" animate={{ x: [0, -14, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#D9EEE8]/70 blur-2xl" animate={{ x: [0, 16, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[6%] right-[6%] top-[25%] -translate-y-1/2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative min-h-[190px]">
              <div className="absolute left-0 right-[8%] top-0 rounded-[11px] border border-white/85 bg-white/62 px-2.5 py-2.5 shadow-[0_16px_34px_rgba(56,74,82,0.12),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-xl sm:px-3 sm:py-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#D9E2E2]/80 pb-1.5">
                  <div>
                    <p className="font-mono text-[7px] font-semibold uppercase tracking-tight text-[#748188] sm:text-[8px]">Context</p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-3.5 tracking-[-0.02em] text-[#26333A] sm:text-[11px]">Amazon reimbursement</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Status</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-3.5 text-[#26333A] sm:text-[10px]">Evidence requested</p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Next milestone</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-3.5 text-[#26333A] sm:text-[10px]">Submit supporting documents</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-[#D9E2E2]/80 pt-2">
                  <div className="rounded-[6px] bg-white/45 px-1.5 py-1">
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Reversals</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#26333A] sm:text-[10px]">Watch</p>
                  </div>
                  <div className="rounded-[6px] bg-white/45 px-1.5 py-1">
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Appeals</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#26333A] sm:text-[10px]">Ready</p>
                  </div>
                </div>
              </div>
              <div className="relative z-10 ml-[22%] w-[78%] space-y-1.5 pt-3 sm:pt-4">
                <p className="mb-1 font-mono text-[7px] font-semibold uppercase tracking-tight text-[#748188] sm:text-[8px]">Next actions</p>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/80 bg-white/64 px-2 py-2 shadow-[0_10px_22px_rgba(56,74,82,0.1),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur-lg sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/70" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#344149] sm:text-[10px]">Request BOL and POD</span>
                  <img src="/gd.png" alt="Google Drive" className="h-4 w-4 shrink-0 object-contain" />
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/70 bg-white/54 px-2 py-2 shadow-[0_9px_20px_rgba(56,74,82,0.08)] backdrop-blur-lg sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/64" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#46535A] sm:text-[10px]">Review Amazon response</span>
                  <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 shrink-0 object-contain" />
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/65 bg-white/46 px-2 py-2 shadow-[0_8px_18px_rgba(56,74,82,0.06)] backdrop-blur-md sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/58" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#566167] sm:text-[10px]">Prepare next submission</span>
                  <img src="/logoimagetwo.png" alt="Margin" className="h-4 w-auto shrink-0 object-contain" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "No handoff to manage.",
      copy: "Requests, responses, decisions, and next steps stay connected across Amazon, email, and documents. See where it stands. Know when it’s done.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
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
            className="absolute left-[9%] right-[9%] top-[17%] -translate-y-1/2 lg:top-[3%]"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex items-center gap-3 rounded-[10px] border border-white/80 bg-white/62 px-3 py-2 shadow-[0_14px_32px_rgba(56,74,82,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:px-4 sm:py-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/70" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block truncate font-sans text-[12px] font-medium leading-tight tracking-[-0.02em] text-[#26333A] sm:text-[14px]">Reply to Amazon&apos;s Email</span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">First draft complete</span></span>
              <img src="/gmailicon.png" alt="Gmail" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/48 px-3 py-1.5 shadow-[0_12px_28px_rgba(56,74,82,0.08),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-lg sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/62" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#3A474D] sm:text-[13px]">Fetching BOL, POD <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#87949A]/35 border-t-[#66757C]" aria-label="Fetching in progress" /></span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">4/7 complete</span></span>
              <img src="/gd.png" alt="Google Drive" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/42 px-3 py-1.5 shadow-[0_10px_24px_rgba(56,74,82,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/56" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#4A555B] sm:text-[13px]">Confirming ASIN/SKU <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#87949A]/35 border-t-[#66757C]" aria-label="Validation in progress" /></span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">Validating meta-data match...</span></span>
              <img src="/outlookicon.webp" alt="Outlook" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/38 px-3 py-1.5 shadow-[0_8px_20px_rgba(56,74,82,0.05),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-md sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/52" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#566167] sm:text-[13px]">Flagging the next recovery step</span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">Ready for the next recovery...</span></span>
              <img src="/slack-icon-2019.png" alt="Slack" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] py-8 sm:py-10 md:py-12" aria-labelledby="recovery-thread-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[860px]">
          <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">09 / THE RECOVERY SYSTEM</span></div>
          <h2 id="recovery-thread-title" className="max-w-[900px] font-lora text-[36px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}>One recovery. Every step connected.</h2>
          <p className="mt-5 max-w-[840px] font-sans text-[18px] font-semibold leading-[1.45] tracking-[-0.025em] text-[#294B61] sm:text-[21px] md:text-[24px]">Find what happened. Establish what is supported. Build what is owed. Move the case forward. Verify the money.</p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6 lg:mt-12 lg:gap-8">
          {recoveryThreadCards.map((card, index) => (
            <motion.article key={card.title} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className="min-w-0 border-t border-[#D8DEDA] pt-4">
              <div className="relative aspect-[1.55] overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-white p-2.5 shadow-[0_18px_60px_rgba(37,49,58,0.08)] sm:p-3">{card.visual}</div>
              <h3 className="mt-2 font-lora text-[25px] leading-[1.06] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[29px]">{card.title}</h3>
              <p className="mt-3 text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">{card.copy}</p>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}

function NestedRecoveryBrowsers() {
  const [activeBrowser, setActiveBrowser] = useState<'progress' | 'evidence'>('progress');
  const browsers = {
    progress: { label: 'Progress review', path: '/progress-review' },
    evidence: { label: 'Evidence required', path: '/evidence-required' },
  } as const;

  return (
    <section className="relative overflow-hidden border-t border-[#D8DEDA] bg-[#F4F8F8] py-8 sm:py-10 md:py-12" aria-labelledby="nested-recovery-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-14">
          <motion.div {...revealProps} className="order-1 lg:order-2">
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">Connected operational view</span></div>
            <h2 id="nested-recovery-title" className="max-w-[560px] font-lora text-[34px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[52px]" style={{ fontWeight: 400 }}>See how it got there.</h2>
            <div className="mt-6 max-w-[560px] space-y-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Reconstruct the history of a recovery from scattered records, messages, documents, and case notes to work out what was actually done.</p>
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> Follow the recovery from the first finding through investigation, evidence, action, and outcome — with the underlying records connected at every step.</p>
            </div>
            <p className="mt-5 max-w-[560px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[24px]" style={{ fontWeight: 400 }}>The work has a history. The evidence stays with it.</p>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Nested recovery pages">
              {(Object.keys(browsers) as Array<'progress' | 'evidence'>).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={activeBrowser === key} onClick={() => setActiveBrowser(key)} className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-tight transition-colors ${activeBrowser === key ? 'bg-[#DCEBF2] text-[#284B5B]' : 'bg-white/70 text-[#6A7D86] hover:bg-white'}`}>{browsers[key].label}</button>
              ))}
            </div>
          </motion.div>
          <motion.div {...revealProps} className="relative order-2 min-h-[470px] overflow-hidden rounded-[12px] border border-[#C8DCE5]/80 bg-[#E5F0F3] p-3 shadow-[0_24px_70px_rgba(37,91,116,0.16)] sm:min-h-[570px] sm:p-4 lg:order-1">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.95),transparent_34%),linear-gradient(135deg,#EAF5F9_0%,#DCECF2_52%,#F6FAFB_100%)]" />
            <motion.div aria-hidden="true" className="absolute -left-14 -top-16 h-48 w-48 rounded-full bg-[#B9E0EF]/60 blur-3xl" animate={{ x: [0, 18, 0], y: [0, 14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div aria-hidden="true" className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-[#C9D5F0]/65 blur-3xl" animate={{ x: [0, -16, 0], y: [0, -12, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
            <div className="relative h-full min-h-[440px] sm:min-h-[538px]">
              {(Object.keys(browsers) as Array<'progress' | 'evidence'>).map((key) => {
                const isActive = activeBrowser === key;
                const browser = browsers[key];
                return (
                  <div key={key} role="button" tabIndex={0} onClick={() => setActiveBrowser(key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveBrowser(key); }} aria-label={`Show ${browser.label}`} className={`absolute overflow-hidden rounded-[10px] border text-left transition-all duration-500 ${key === 'progress' ? 'left-[3%] top-[5%] h-[76%] w-[78%]' : 'bottom-[3%] right-[3%] h-[73%] w-[78%]'} ${isActive ? 'z-20 border-white/95 shadow-[0_24px_48px_rgba(37,73,91,0.25)]' : 'z-10 border-white/65 shadow-[0_12px_30px_rgba(37,73,91,0.14)]'}`}>
                    <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] bg-[#E9EEEC] px-2"><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">{browser.path}</span></div>
                    <iframe title={`${browser.label} live preview`} src={browser.path} className={`h-[calc(100%-28px)] w-full border-0 bg-[#FBFAF7] ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`} loading="lazy" />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
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

const recoveryOperationStages = [
  "Find the discrepancy",
  "Trace what happened",
  "Prove what’s owed",
  "Build the recovery",
  "Handle the case",
  "Manage rejections",
  "Pursue appeals",
  "Reconcile the outcome",
];

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
    }, 1000);

    return () => window.clearInterval(interval);
  }, [reduceMotion, sectionInView]);

  const visibleStages = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const index = (activeStage + offset + recoveryOperationStages.length) % recoveryOperationStages.length;
    return { stage: recoveryOperationStages[index], offset, opacity: [0.1, 0.3, 0.6, 1, 0.6, 0.3, 0.1][offset + 3] };
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="product-reframe-title"
      className="relative overflow-hidden bg-white py-10 md:py-14"
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
            Margin handles the work between a financial problem and its resolution.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-20">
          <motion.div {...revealProps} aria-hidden="true" />

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }}>
            <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden py-2 sm:min-h-[430px] sm:py-4 [mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)]">
              <div className="relative flex w-full max-w-[585px] flex-col items-center justify-center gap-1.5 text-center sm:gap-2.5">
                {visibleStages.map(({ stage, offset, opacity }) => {
                  const isActive = offset === 0;
                  return (
                    <motion.div
                      key={`${stage}-${offset}`}
                      initial={false}
                      animate={{ opacity, scale: isActive ? 1.02 : 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                      className={`font-lora text-[32px] leading-[1.05] tracking-[-0.045em] sm:text-[48px] md:text-[60px] ${isActive ? "text-[var(--margin-text-primary)]" : "text-[var(--margin-text-muted)]"}`}
                      style={{ fontWeight: 400 }}
                    >
                      {stage}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function RiskSection() {
  return (
    <section aria-labelledby="amazon-thread-title" className="relative overflow-hidden bg-[var(--margin-canvas)] py-7 sm:py-8 md:py-11">
      <div className={containerClass}>
        <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12">
          <motion.div {...revealProps} className="order-1 border-l border-[#D8DEDA] pl-4 md:pl-5">
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">09 / THE AMAZON THREAD</span></div>
            <h2 id="amazon-thread-title" className="max-w-[620px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px]" style={{ fontWeight: 400 }}>The recovery stops living in your inbox.</h2>
            <p className="mt-6 max-w-[560px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7"><span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> Search through Amazon messages, old case threads, and scattered notes to remember what was said and what it was about.</p>
            <p className="mt-5 max-w-[560px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7"><span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> The conversation stays with the recovery — what Amazon said, what Margin responded, what changed, and what still needs to happen.</p>
            <p className="mt-5 max-w-[560px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">No lost context. No starting over. A recovery with a history.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-2 min-w-0 overflow-hidden rounded-[12px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 lg:p-4">
            <BrowserChrome path="margin.app/amazon-thread-review" />
            <iframe title="Amazon Thread Review page preview" src="/amazon-thread-review" className="block h-[520px] w-full rounded-b-[8px] border-0 bg-[#FBFAF7] sm:h-[600px]" loading="lazy" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryOutcomeExplorer() {
  return (
    <section aria-labelledby="recovery-outcome-title" className="relative bg-[var(--margin-canvas)] py-10 md:py-12">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <motion.div {...revealProps} className="order-1 lg:order-2 lg:sticky lg:top-28">
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">10 / WHEN THINGS GO WRONG</span></div>
            <h2 id="recovery-outcome-title" className="max-w-[820px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px]" style={{ fontWeight: 400 }}>Don&apos;t let a rejection stop the recovery.</h2>
            <div className="mt-6 max-w-[760px] space-y-4 text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> A rejection leaves you to figure out why Amazon said no, what was missing, and whether the case is worth fighting again.</p>
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> Margin examines the rejection, learns what Amazon challenged, rebuilds the case around what the response revealed, and handles the appeal when the evidence supports it.</p>
            </div>
            <p className="mt-5 max-w-[760px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">You don&apos;t have to start the investigation again.</p>
            <p className="mt-4 max-w-[760px] font-lora text-[19px] leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[23px] md:text-[27px]" style={{ fontWeight: 400 }}>The case gets stronger. The recovery keeps moving.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="order-2 min-w-0 overflow-hidden rounded-[12px] border border-[#D9E2E6] bg-white shadow-[0_20px_60px_rgba(72,103,122,0.14)] lg:order-1">
            <FinalDelegationPreview compactMobile src="/appeals-review" title="Appeals Review page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}


function FinancialReconciliationSection() {
  return (
    <section aria-labelledby="financial-reconciliation-title" className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-14">
          <motion.div {...revealProps} className="order-1 border-l border-[#D8DEDA] pl-4 md:pl-5">
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">11 / FINANCIAL RECONCILIATION</span></div>
            <h2 id="financial-reconciliation-title" className="max-w-[560px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[50px]" style={{ fontWeight: 400 }}>Know it&apos;s closed.</h2>
            <div className="mt-6 max-w-[580px] space-y-4 text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Before:</span> A recovery gets paid, but you&apos;re left checking settlements and records to make sure the numbers actually tie out.</p>
              <p><span className="font-semibold text-[var(--margin-text-primary)]">Now:</span> Margin verifies what was expected, what Amazon credited, and what actually landed — then closes the recovery when the financial record reconciles.</p>
            </div>
            <p className="mt-5 max-w-[580px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">No second investigation. No loose ends.</p>
            <p className="mt-4 max-w-[580px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[24px]" style={{ fontWeight: 400 }}>The money is accounted for. The record is closed.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="order-2 min-w-0 overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3">
            <FinalDelegationPreview compactMobile src="/financial-reconciliation" title="Financial reconciliation page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const enterpriseReviewCards = [
  {
    quote: "We stopped treating reimbursement work as a monthly fire drill. The team can see what is supported, what is waiting, and what needs a decision.",
    name: "Maya Chen",
    role: "VP Finance · Northline Home",
    mark: "N",
    tone: "bg-[#DCEAF0] text-[#31576B]",
  },
  {
    quote: "The useful part is not another dashboard. It is being able to return to a case and understand the evidence, the response, and the next action immediately.",
    name: "Daniel Ortiz",
    role: "Director of Operations · Harbor & Pine",
    mark: "H",
    tone: "bg-[#E9E3F1] text-[#65527A]",
  },
  {
    quote: "Our finance and operations teams now work from the same recovery record. There is less chasing and far less time spent rebuilding the history.",
    name: "Priya Shah",
    role: "Controller · Fieldstone Goods",
    mark: "F",
    tone: "bg-[#E5EFE2] text-[#4E6B4A]",
  },
  {
    quote: "When Amazon asks for more information, we know what was already sent, what is still missing, and who owns the next move.",
    name: "Evan Brooks",
    role: "Head of Marketplace · Alder Supply",
    mark: "A",
    tone: "bg-[#F1E7D9] text-[#806243]",
  },
];

function EnterpriseReviewsSection() {
  const reduceMotion = useReducedMotion();
  const cards = [...enterpriseReviewCards, ...enterpriseReviewCards];

  return (
    <section className="hidden relative overflow-hidden border-y border-[#DCE5E7] bg-[#F4F8F8] py-12 sm:py-14 md:py-16" aria-labelledby="enterprise-reviews-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[760px] text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">Seller perspectives</p>
          <h2 id="enterprise-reviews-title" className="mt-3 font-lora text-[34px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[52px]" style={{ fontWeight: 400 }}>Recovery work that stays understandable.</h2>
          <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] sm:text-[17px] sm:leading-8">A clearer operating record changes how finance, operations, and marketplace teams move through the work.</p>
        </motion.div>
      </div>
      <div className="relative mt-12 overflow-hidden sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#F4F8F8] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#F4F8F8] to-transparent sm:w-24" />
        <motion.div
          className="flex w-max gap-4 px-4 sm:gap-5 sm:px-8"
          animate={reduceMotion ? { x: -420 } : { x: [0, -1080] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {cards.map((review, index) => (
            <article key={`${review.name}-${index}`} className="relative flex w-[300px] flex-col overflow-hidden rounded-[12px] bg-white/18 p-5 shadow-[0_18px_40px_rgba(59,84,94,0.08)] backdrop-blur-xl sm:w-[390px] sm:p-6 md:w-[430px]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[12px] border border-[#D8E3E5]/90 border-b-0 bg-gradient-to-b from-white/45 via-white/18 to-transparent" />
              <p className="relative z-10 min-h-[122px] text-[14px] leading-6 text-[#4D5B66] sm:text-[15px] sm:leading-7">“{review.quote}”</p>
              <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-[#E5ECEC]/60 pt-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-lora text-[17px] ${review.tone}`}>{review.mark}</span>
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#26343B]">{review.name}</p><p className="truncate text-[11px] text-[#748188]">{review.role}</p></div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


function BrowserChrome({ path, hidePath = false }: { path?: string; hidePath?: boolean }) {
  return (
    <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2">
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      <span className="h-2 w-2 rounded-full bg-[#D7DAD7]" />
      {!hidePath && path ? <span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">{path}</span> : <span className="flex-1" aria-hidden="true" />}
    </div>
  );
}

function DiscrepancyModalVisual({ compactMobile = false }: { compactMobile?: boolean }) {
  const [mode, setMode] = useState<'finding' | 'proof'>('proof');
  const isProof = mode === 'proof';
  return (
    <div className={`relative rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] p-2 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:p-3 ${compactMobile ? "max-h-[440px] overflow-y-auto sm:max-h-none sm:overflow-hidden" : "overflow-hidden"}`}>
      <div className="flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2"><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[10px] text-[#7A8B93]">margin.app/app/demo-workspace</span></div>
      <div className="mx-auto max-h-[620px] w-full max-w-[900px] overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E9E9EC] px-4 pb-2.5 pt-3"><div><p className="text-[10px] text-[#8A99A5]">{isProof ? 'Proof required' : 'Finding detail'}</p><h3 className="mt-1 text-[20px] font-normal leading-tight tracking-tight">{isProof ? 'Evidence required for this finding' : 'Fee Charge Review'}</h3><p className="mt-1 max-w-[610px] text-[10px] leading-4 tracking-tight text-[#6B7280]">{isProof ? 'Margin checks connected sources first. If the proof cannot be found automatically, upload it in Evidence Records so the case can keep moving.' : 'A storage-related charge appears to have been applied more than the seller record supports. · $1484.80 charged vs $742.40 expected'}</p></div><button type="button" aria-label="Close preview" className="text-[18px] leading-none text-[#9CA3AF]">×</button></div>
        <div className="flex border-b border-[#E9E9EC] bg-[#FAFAFB] px-4 py-2"><button type="button" onClick={() => setMode('finding')} className={`mr-4 border-b-2 pb-1 text-[11px] font-medium tracking-tight ${!isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>View finding</button><button type="button" onClick={() => setMode('proof')} className={`border-b-2 pb-1 text-[11px] font-medium tracking-tight ${isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>Proof needed</button></div>
        {isProof ? <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]"><div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r"><div className="mb-3 flex gap-2"><span className="border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-1 text-[10px]">Fee Charge Review</span><span className="border border-[#B9D9C8] bg-[#F2FBF5] px-2 py-1 text-[10px] font-medium text-[#26734D]">Claim candidate</span></div><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Required documentation</p><div className="mt-2 divide-y divide-[#E9E9EC] border-y border-[#E9E9EC]">{[['Fee event or settlement row','The charged fee transaction, fee type, settlement ID, order ID, or shipment context.'],['Product and marketplace context','SKU/ASIN, marketplace, fulfilment channel, size tier, dimensions, weight, and category where available.'],['Expected fee basis','The schedule version, rate basis, or calculation inputs Margin is comparing against the charge.'],['Charged-versus-expected amount','The actual fee, expected fee, currency, and overcharge delta for the same event.']].map(([label,copy]) => <div key={label} className="grid gap-2 py-2 sm:grid-cols-[150px_1fr]"><p className="text-[11px] font-medium tracking-tight text-[#4D5B66]">{label}</p><p className="text-[10px] leading-4 text-[#66737F]">{copy}</p></div>)}</div><div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">What Margin already found</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">Order 113-9204451-1885026 · Settlement SETTLE-ACME-003 · SKU ACME-DESK-LAMP-OAK</p><div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#6B7280]"><span>Order ID<br /><strong className="text-[#182026]">113-9204451-1134623</strong></span><span>SKU<br /><strong className="text-[#182026]">ACME-DEMO-SKU-18</strong></span><span>ASIN<br /><strong className="text-[#182026]">B0ACME0018</strong></span><span>Shipment<br /><strong className="text-[#182026]">FBA17ACME018</strong></span></div></div><div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">If proof is missing</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">Margin keeps looking across connected repositories before asking the seller. If the required document is not found, upload it in Evidence Records and Margin can attach it to the filing workflow.</p></div></div><div className="px-4 py-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Why this proof matters</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]">Margin checks the fee event against the available product, order, shipment, and fee basis before treating it as a supported case.</p><div className="mt-4 space-y-3 border-t border-[#E9E9EC] pt-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Amazon policy basis</p><p className="text-[11px] leading-5 text-[#4D5B66]">Amazon selling and FBA fee schedule review</p><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Claim window</p><p className="text-[10px] text-[#4D5B66]">28 days left · Deadline Feb 18, 2026</p></div></div></div> : <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]"><div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r"><div className="grid border-y border-[#E9E9EC] md:grid-cols-3 md:divide-x md:divide-[#F0F0F2]"><div className="py-2 md:pr-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Amount under review</p><p className="mt-1 font-lora text-[17px] font-normal leading-tight tracking-tight">$900.95</p></div><div className="border-t border-[#E9E9EC] py-2 md:border-t-0 md:px-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Found on</p><p className="mt-1 text-[11px] font-medium">Jan 21, 2026, 04:37 PM</p></div><div className="border-t border-[#E9E9EC] py-2 md:border-t-0 md:pl-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Amazon source / activity</p><p className="mt-1 text-[11px] font-medium tracking-tight">Amazon FBA Settlement Activity</p><span className="mt-2 inline-flex border border-[#B9D9C8] bg-[#F2FBF5] px-2 py-0.5 text-[10px] font-medium text-[#26734D]">Evidence-ready</span></div></div><div className="mt-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">What Margin found</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">A storage-related charge appears to have been applied more than the seller record supports. · $1484.80 charged vs $742.40 expected</p><span className="mt-2 inline-flex border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-0.5 text-[10px]">Fee discrepancy</span><div className="mt-3 border-t border-[#E9E9EC] pt-2.5"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Evidence used</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">Order 113-9204451-1885026 · Settlement SETTLE-ACME-003 · SKU ACME-DESK-LAMP-OAK</p></div><div className="mt-3 border border-[#CFE0EA] bg-[#F7FBFF] p-2.5"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-medium tracking-tight text-[#0B74DE]">Margin analysis</p><p className="text-[11px] font-medium tracking-tight tracking-tight text-[#26734D]">Investigation complete</p></div><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">Margin connected the Amazon activity, seller records, and expected outcome to identify the recovery gap.</p><div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#DCEAF4] pt-2 text-[10px]"><span>Charge applied<br /><strong>$1,792.82</strong></span><span>Should have been<br /><strong>$828.87</strong></span><span>Difference<br /><strong className="text-[#0B74DE]">$900.95</strong></span></div></div><div className="mt-3 border-y border-[#E9E9EC] bg-[#FFFBF8] py-2"><p className="text-[11px] font-medium tracking-tight text-[#A95F49]">Why unresolved</p><p className="mt-1 text-[10px] leading-4 text-[#6B7280]">Evidence is assembled; Margin is waiting for the filing gate to clear.</p></div></div></div><div className="px-4 py-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Backend detection record</p><div className="mt-2 grid grid-cols-2 gap-3 border-b border-[#E9E9EC] pb-3 text-[10px]"><span>Backend record<br /><strong>demo-finding</strong></span><span>Source<br /><strong>SP API</strong></span><span>Confidence<br /><strong>94%</strong></span><span>Readiness<br /><strong>Claim candidate</strong></span></div><p className="mt-3 text-[11px] font-medium tracking-tight text-[#66737F]">Amazon policy basis</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">Amazon selling and FBA fee schedule review</p><p className="mt-3 text-[11px] font-medium tracking-tight text-[#66737F]">Deadline</p><p className="mt-1 text-[10px] text-[#4D5B66]">28 days left · Feb 18, 2026</p></div></div>}
        <div className="flex items-center justify-between border-t border-[#E9E9EC] px-4 py-2 text-[10px] text-[#66737F]"><span>ACM-FD-2604-0018 · Fee Charge Review</span>{isProof ? <button type="button" className="rounded-[6px] bg-[#0B74DE] px-3 py-1.5 text-[10px] font-medium text-white">Open Evidence Records</button> : <span>Evidence and policy checks aligned</span>}</div>
      </div>
      <p className="mt-2 text-center text-[11px] font-medium tracking-tight text-white/70">Interactive finding detail · click between the two exact platform states</p>
    </div>
  );
}

function ConsumerRecoverySection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-12 sm:py-10 md:py-12" aria-labelledby="consumer-recovery-title">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-14">
          <motion.div {...revealProps} role="link" tabIndex={0} onClick={onCta} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onCta(); }} className="group relative flex min-h-[360px] cursor-pointer items-center justify-center overflow-hidden rounded-[4px] p-8 shadow-[0_24px_60px_rgba(72,103,122,0.14)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--margin-blue)] sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 22% 72%, #f08a6e 0%, transparent 48%), radial-gradient(ellipse at 75% 20%, #8a8aef 0%, transparent 50%), radial-gradient(ellipse at 48% 42%, #e87aaa 0%, transparent 46%), radial-gradient(ellipse at 82% 68%, #a78ae8 0%, transparent 46%), radial-gradient(ellipse at 18% 22%, #7aade8 0%, transparent 42%), linear-gradient(145deg, #c8a0e0 0%, #e8889a 35%, #f0a070 65%, #a088e0 100%)' }}>
            <div className="absolute inset-0 bg-white/5" />
              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.6%22/%3E%3C/svg%3E")', backgroundSize: '120px 120px' }} />
            <div className="relative z-10 flex flex-col items-center text-center text-white">
              <img src="/logoimagetwo.png" alt="Margin" className="h-16 w-auto object-contain brightness-0 invert sm:h-20" />
              <p className="mt-4 font-lora text-[24px] leading-tight tracking-[-0.04em] sm:text-[30px]">Consumer Recovery</p>
            </div>
            <p className="absolute bottom-6 left-6 right-6 z-10 mx-auto max-w-[420px] text-center text-[11px] leading-5 text-white/75 sm:bottom-8 sm:text-[12px]">Consumer Recovery is opening soon. For the initial Early Access program, Margin will focus on high-value Amazon consumer claims where the potential recovery justifies a managed investigation.</p>
            <span className="absolute bottom-3 right-5 z-10 text-[11px] font-semibold text-white/90 transition-colors group-hover:text-white sm:bottom-5 sm:right-7">Read more <ArrowRight className="ml-1 inline h-3 w-3" /></span>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="max-w-[620px]">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-blue)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">CONSUMER RECOVERY</span>
            </div>
            <h2 id="consumer-recovery-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[50px]" style={{ fontWeight: 400 }}>
              The same recovery engine.<br />Now for consumers.
            </h2>
            <p className="mt-4 max-w-[580px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin investigates high-value consumer claims, builds the evidence, handles the recovery process, and keeps going until there&apos;s an outcome.</p>
            <p className="mt-4 text-[15px] font-medium leading-7 text-[var(--margin-text-primary)] sm:text-[17px]">Starting with high-value Amazon claims.</p>
            <Button type="button" onClick={onCta} className="landing-pressable mt-6 h-11 rounded-[7px] bg-[var(--margin-blue)] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] hover:bg-[var(--margin-blue-hover)]">Join Early Access <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <p className="mt-3 text-[11px] leading-5 text-[var(--margin-text-muted)]">Early access opens late November 2026.</p>
          </motion.div>
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
    <div className="landing-google-sans min-h-screen bg-[var(--margin-canvas)] selection:bg-[var(--margin-blue)]/16 selection:text-[var(--margin-text-primary)]">
      <PublicNavbar variant="light" wide />
      
      <main>
        <KineticHeroSection onAuditCta={() => { trackEarlyAccessCtaClicked("hero_connect_amazon"); navigate("/audit-start"); }} isFull={isFull} nextBatchHours={nextBatchHours} />
        <MarginEngineSection />
        <RealityCheckSection />
        <RecoveryHarnessSection />
        <MarginLifecycleSection />
        <ControlSection />
        <MarginStandardSection />
        <RecoveryWorkStatement />
        <AccountingEvidenceSection />
        <FinancialControlOperationsSection />
        <RecoveryThreadSection onAuditCta={() => handleClaimAccessClick("recovery_thread_audit", "sp_api")} />
        <NestedRecoveryBrowsers />
        <RiskSection />
        <RecoveryOutcomeExplorer />
        <FinancialReconciliationSection />
        <RecoveryOfferSectionDuplicate onAuditCta={handleClaimAccessClick} />
        <EnterpriseReviewsSection />
        <RecoveryOfferSection onAuditCta={handleClaimAccessClick} />
        <RecoveryRoutingSection onAuditCta={(location) => { trackEarlyAccessCtaClicked(location); navigate("/audit-start"); }} />

        {/* Section 14 — Trust / FAQ */}
        <section className="relative bg-[var(--margin-canvas)] py-10 md:py-14" aria-labelledby="trust-faq-title">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-blue)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">14 / TRUST / FAQ</span>
              </div>
              <h2 id="trust-faq-title" className="font-lora text-[34px] font-medium leading-tight tracking-[-0.045em] sm:text-[42px] md:text-[46px]" style={{ fontWeight: 400 }}>
                Your questions answered
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
        <ConsumerRecoverySection onCta={() => { trackEarlyAccessCtaClicked("homepage_consumer_recovery"); navigate("/early-access"); }} />

        {/* Closing CTA */}
          <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-12 sm:py-10 md:py-12" aria-labelledby="final-handoff-title">
            <div className={containerClass}>
              <div className="flex flex-col items-start gap-8 pt-8 sm:pt-10 lg:flex-row lg:gap-10 lg:pt-16">

                {/* Left label */}
                <motion.div {...revealProps} className="w-full shrink-0 lg:w-[360px]">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[var(--margin-blue)] mb-1">15 / DELEGATION &amp; CONTROL</p>
                  <h2 id="final-handoff-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[38px]" style={{ fontWeight: 400 }}>
                    You hand Margin the recovery. You stay in control.
                  </h2>
                  <div className="mt-6 hidden w-full max-w-[380px] p-0 text-[#182026] md:block">
                    <label htmlFor="delegation-email" className="mb-1.5 block text-[11px] font-semibold text-[#66737F]">Email address</label>
                    <input id="delegation-email" type="email" placeholder="you@example.com" className="h-10 w-full rounded-[6px] border border-[#C8D6DF] bg-white px-3 text-[13px] text-[#182026] outline-none placeholder:text-[#A1AEB7] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15" />
                    <Button onClick={() => navigate("/audit-start")} className="mt-3 h-10 w-full rounded-[6px] bg-[#0B74DE] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(11,116,222,0.18)] hover:bg-[#075EBA]">Get started for free</Button>
                    <div className="my-3 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-[#A1AEB7]">
                      <span className="h-px flex-1 bg-[#D8E3EA]" /><span>or</span><span className="h-px flex-1 bg-[#D8E3EA]" />
                    </div>
                    <Button type="button" variant="outline" className="h-10 w-full rounded-[6px] border-[#C8D6DF] bg-white px-3 text-[12px] font-semibold text-[#182026] hover:bg-[#F3F6F8]">
                      <GoogleMark className="mr-2 h-4 w-4" />Continue with Google
                    </Button>
                    <p className="mt-3 max-w-[360px] text-center text-[10px] leading-4 text-[#7B8790]">By signing up, I agree to Margin&apos;s Terms of Service and Privacy Policy.</p>
                  </div>
                </motion.div>

                {/* Two cards */}
                <div className="grid w-full flex-1 grid-cols-1 gap-3 md:grid-cols-2">

                  {/* Card 1 — warm aurora */}
                  <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[4px] p-6 sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 20% 80%, #d4956a 0%, transparent 55%), radial-gradient(ellipse at 70% 20%, #c9a0c4 0%, transparent 50%), radial-gradient(ellipse at 40% 40%, #d4b896 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #e8c4a0 0%, transparent 45%), linear-gradient(145deg, #cba4b8 0%, #d5b8a0 40%, #c9a888 100%)' }}>
                    <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight sm:text-[24px]">
                      You don&apos;t have to wonder.
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/80 font-medium">
                      Understand what happened, identify what&apos;s unresolved, and decide what deserves action.
                    </p>
                    <div className="mt-auto pt-10 sm:pt-16">
                      <Button onClick={() => { trackEarlyAccessCtaClicked("homepage_closing_cta_audit"); navigate("/audit-start"); }} className="landing-pressable h-11 rounded-[4px] bg-white/20 backdrop-blur-sm text-white font-semibold text-[13px] px-5 hover:bg-white/30 flex items-center gap-2 w-fit border border-white/20 shadow-sm">
                        Start Audit Now <ArrowRight className="h-4 w-4 text-white/60" />
                      </Button>
                    </div>
                  </motion.div>

                  {/* Card 2 — cool sage earth */}
                  <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.2 }} className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[4px] p-6 sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 30% 70%, #4a5e3a 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, #8a9a7e 0%, transparent 50%), radial-gradient(ellipse at 50% 30%, #b0b8a8 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, #c4c8be 0%, transparent 45%), linear-gradient(145deg, #b8bdb0 0%, #8a9680 40%, #5a6e4a 100%)' }}>
                    <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight sm:text-[24px]">
                      Let it be handled.
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/75 font-medium">
                      You sell. Margin runs the recovery operation — every discrepancy, case, rejection, and follow-up.
                    </p>
                    <div className="mt-auto pt-10 sm:pt-16">
                      <Button onClick={() => { trackEarlyAccessCtaClicked("homepage_closing_cta_handled"); navigate("/audit-start"); }} className="landing-pressable h-11 rounded-[4px] bg-white/20 backdrop-blur-sm text-white font-semibold text-[13px] px-5 hover:bg-white/30 flex items-center gap-2 w-fit border border-white/20 shadow-sm">
                        Get It Handled <ArrowRight className="h-4 w-4 text-white/60" />
                      </Button>
                    </div>
                  </motion.div>

                </div>

                <div className="w-full md:hidden">
                  <div className="mx-auto w-full max-w-[380px] p-0 text-[#182026]">
                    <p className="mb-5 text-center font-lora text-[18px] leading-tight tracking-[-0.02em] text-[var(--margin-text-primary)]">Your process. Your rules. Your approvals.</p>
                    <label htmlFor="delegation-email-mobile" className="mb-1.5 block text-[11px] font-semibold text-[#66737F]">Email address</label>
                    <input id="delegation-email-mobile" type="email" placeholder="you@example.com" className="h-10 w-full rounded-[6px] border border-[#C8D6DF] bg-white px-3 text-[13px] text-[#182026] outline-none placeholder:text-[#A1AEB7] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15" />
                    <Button onClick={() => navigate("/audit-start")} className="mt-3 h-10 w-full rounded-[6px] bg-[#0B74DE] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(11,116,222,0.18)] hover:bg-[#075EBA]">Get started for free</Button>
                    <div className="my-3 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.18em] text-[#A1AEB7]">
                      <span className="h-px flex-1 bg-[#D8E3EA]" /><span>or</span><span className="h-px flex-1 bg-[#D8E3EA]" />
                    </div>
                    <Button type="button" variant="outline" className="h-10 w-full rounded-[6px] border-[#C8D6DF] bg-white px-3 text-[12px] font-semibold text-[#182026] hover:bg-[#F3F6F8]">
                      <GoogleMark className="mr-2 h-4 w-4" />Continue with Google
                    </Button>
                    <p className="mt-3 max-w-[360px] text-center text-[10px] leading-4 text-[#7B8790]">By signing up, I agree to Margin&apos;s Terms of Service and Privacy Policy.</p>
                  </div>
                </div>
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
