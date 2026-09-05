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
import { RecoveryOfferSection } from "@/components/landing/RecoveryDecisionSections";
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
      body: "Relevant financial records help establish the amount involved, what should have happened, and whether the recovery amount is actually supported.",
    },
    {
      heading: "Know what was settled",
      body: "Margin connects the recovery to the financial outcome, so you can see whether the money was paid, adjusted, reversed, or still outstanding.",
    },
  ];

  return (
    <section className="relative overflow-x-hidden border-b border-[var(--margin-border)] bg-[#FAFAF7] py-16 md:py-24" aria-labelledby="accounting-section-title">
        <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-16">
          <motion.div {...revealProps} className="min-w-0 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Accounting</span>
            </div>
            <h2 id="accounting-section-title" className="max-w-[980px] break-words font-lora text-[28px] leading-[1.04] tracking-[-0.04em] text-[#182026] sm:text-[38px] md:text-[42px] lg:text-[44px]" style={{ fontWeight: 400 }}>
              The recovery doesn&apos;t exist in isolation.
            </h2>
            <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Amazon shows you the event. Your financial records show you what that event was worth. Margin brings those pieces together so a recovery can be understood in full—not just identified.
            </p>
          </motion.div>

        </div>

        <div className="mt-8 grid min-w-0 items-start gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 xl:mt-12">
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative min-w-0 lg:pt-2">
            <div className="relative border-y border-[#D8E3EA] py-5 sm:py-6 md:py-7">
              <div className="relative">
                <div className="relative overflow-hidden rounded-[20px] border border-[#D8E3EA] bg-[#F0F1EE] py-4 sm:rounded-[24px] md:rounded-[28px] md:py-6 lg:py-8">
                    <div className="relative space-y-4">
                      {accountingRows.map((row, rowIndex) => (
                        <motion.div
                          key={rowIndex}
                          className="flex w-max gap-3 px-3 md:gap-4 md:px-4 lg:gap-5 lg:px-6"
                          animate={reduceMotion ? { x: rowIndex === 0 ? 0 : -110 } : { x: rowIndex === 0 ? [0, -150] : [-110, 40] }}
                          transition={reduceMotion ? { duration: 0 } : { duration: rowIndex === 0 ? 24 : 28, repeat: Infinity, ease: "linear" }}
                        >
                          {[...row, ...row].map((source, index) => {
                            const isActive = source.id === activeSource.id;
                            return (
                              <div key={`${source.id}-${rowIndex}-${index}`} className="relative h-[94px] w-[94px] shrink-0 rounded-[14px] border-[5px] border-[#CBD4D9] bg-[#FFFFFF] p-3 shadow-[0_12px_22px_rgba(24,32,38,0.10)] sm:h-[112px] sm:w-[112px] sm:rounded-[16px] sm:p-4 md:h-[142px] md:w-[142px] md:rounded-[20px] md:border-[7px] md:p-5 md:shadow-[0_18px_28px_rgba(24,32,38,0.13)] lg:h-[156px] lg:w-[156px]">
                                <div className="flex h-full w-full items-center justify-center rounded-[8px] border border-[#EEF2F4] sm:rounded-[10px] md:rounded-[12px]">
                                  <img src={source.src} alt={source.name} className={`max-h-9 max-w-[48px] object-contain sm:max-h-12 sm:max-w-[60px] md:max-h-16 md:max-w-[76px] ${isActive ? "opacity-100" : "opacity-90"}`} />
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="relative hidden">
                    <div className="relative overflow-hidden py-5">
                      <motion.div
                        className="flex w-max gap-8 pr-8"
                        animate={reduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 34, repeat: Infinity, ease: "linear" }}
                        style={{ willChange: "transform" }}
                      >
                        {[...accountingSources, ...accountingSources].map((source, index) => (
                          <div key={`${source.id}-${index}`} className="w-[118px] shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[14px] border border-[#E1E8ED] bg-white/90 shadow-[0_8px_24px_rgba(24,32,38,0.04)]">
                              <img src={source.src} alt={source.name} className="max-h-8 max-w-9 object-contain grayscale opacity-75" />
                            </div>
                            <span className="mt-3 block text-[9px] leading-4 tracking-tight text-[#66737F]">{source.context}</span>
                          </div>
                        ))}
                      </motion.div>
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FAFAF7] to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAFAF7] to-transparent" />
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
      className="relative isolate flex min-h-svh overflow-hidden agentic-scan-subtle bg-[radial-gradient(circle_at_20%_18%,rgba(11,116,222,0.18),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(46,125,91,0.12),transparent_32%),linear-gradient(135deg,#101827_0%,#06080C_54%,#000000_100%)] px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-40 md:min-h-screen md:px-8 md:pb-44 md:pt-40"
      aria-labelledby="margin-hero-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")" }} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><motion.div className="absolute left-[-16%] top-[42%] h-px w-[62%] origin-left bg-gradient-to-r from-transparent via-[rgba(11,116,222,0.52)] to-transparent opacity-60" animate={reduceMotion ? undefined : { x: ["0%", "118%"], opacity: [0, 0.62, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ rotate: "-8deg" }} /></div>
      <div className="relative z-10 flex w-full items-center">
        <div className="max-w-[1040px]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="inline-flex max-w-full items-center rounded-[5px] border border-white/[0.12] bg-[#20385B]/72 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-tight text-slate-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)] backdrop-blur-xl sm:text-[11px]">Amazon FBA revenue recovery & reconciliation</motion.div>
          <div id="margin-hero-title" className="mt-6 max-w-[1040px] font-lora text-[42px] leading-[0.96] tracking-[-0.045em] min-[390px]:text-[48px] sm:mt-7 sm:text-[68px] md:text-[82px] lg:text-[96px]" style={{ fontWeight: 400 }}>
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Amazon recovery shouldn&apos;t be <span className="text-slate-400">another job you have to do.</span></motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Margin finds what Amazon missed, handles the recovery work, and tracks each case through to the money actually being recovered.</motion.p>
          <p className="mt-4 font-lora text-[14px] leading-6 tracking-[-0.01em] text-slate-400 sm:mt-5 sm:text-[16px]">You keep selling. Margin handles the recovery.</p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Get it handled" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-6 text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Get It Handled <ArrowRight className="ml-2 h-5 w-5" /></Button>
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
          <h2 className="font-lora text-[34px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[54px]" style={{ fontWeight: 400 }}>
            One Recovery Operation for Your Amazon Business
          </h2>
          <p className="mt-6 text-[16px] leading-7 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-8">
            Run your entire recovery operation with Margin—from finding what Amazon missed to getting the delta back and knowing when the recovery is actually complete.
          </p>
        </motion.div>
      </div>
      <div className="mx-auto mt-12 w-full max-w-[1440px] px-0 sm:mt-16 sm:px-4 md:mt-20 md:px-6">
        <motion.div {...revealProps} className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[12px] sm:rounded-[16px]">
          <img src={recoveryImg} alt="Recovery Operation" className="block w-full object-cover" style={{ imageRendering: 'high-quality' }} />
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
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">02 / The pain · 03 / The reframe</span>
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
            Find <span className="px-1 text-[var(--margin-border-strong)]">→</span> Investigate <span className="px-1 text-[var(--margin-border-strong)]">→</span> Prove <span className="px-1 text-[var(--margin-border-strong)]">→</span> Handle <span className="px-1 text-[var(--margin-border-strong)]">→</span> Verify
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
        <motion.div {...revealProps} className="relative order-2 overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_76%_22%,rgba(45,70,92,0.32),transparent_48%),linear-gradient(145deg,#11151A_0%,#050608_58%,#000000_100%)] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-5 lg:order-1 lg:p-7">
          <video className="block aspect-video w-full rounded-[8px] object-cover shadow-[0_20px_60px_rgba(0,0,0,0.34)]" src="/section_4.mp4" autoPlay loop muted playsInline preload="auto" aria-label="How Margin handles recovery work" />
        </motion.div>
        <div className="order-1 flex flex-col justify-center lg:order-2">
        <motion.div {...revealProps} className="max-w-[980px]">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              04 / How Margin handles it
            </span>
          </div>
          <h2
            id="margin-lifecycle-title"
            className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]"
            style={{ fontWeight: 400 }}
          >
            <span className="block">Margin doesn&apos;t give you another list to work through.</span>
            <span className="mt-3 block text-[var(--margin-text-muted)]">
              It takes the recovery from finding the problem to resolving the outcome.
            </span>
          </h2>
        </motion.div>

          <motion.p
            {...revealProps}
            className="mt-4 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7"
          >
            Margin investigates what happened, gathers the evidence, prepares the recovery, manages the case, follows what happens next, and keeps the outcome moving.
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

function RecoveryWorkStatement() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-16 sm:py-20 md:py-28" aria-labelledby="trust-section-title">
      <div className={containerClass}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
          <motion.div {...revealProps} className="flex flex-col justify-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">05 / One connected recovery record</p>
            <h2 id="trust-section-title" className="mt-4 font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>Everything that matters to the recovery stays connected.</h2>
            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">The evidence, financial context, decisions, case activity, Amazon responses, payments, reversals, and final outcome all belong to the same recovery record.</p>
            <div className="mt-5 space-y-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-text-muted)]">
              <p>No chasing reports.</p>
              <p>No rebuilding the story.</p>
              <p>No wondering what happened next.</p>
            </div>
            <p className="mt-6 font-lora text-[22px] leading-[1.05] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[28px]" style={{ fontWeight: 400 }}>One recovery. One record. One visible outcome.</p>
          </motion.div>
          <motion.div {...revealProps} className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_76%_22%,rgba(45,70,92,0.32),transparent_48%),linear-gradient(145deg,#11151A_0%,#050608_58%,#000000_100%)] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-5 lg:p-7">
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
  return (
    <section aria-labelledby="risk-section-title" className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[900px]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">06 — CONTROL / TRUST</span>
          </div>
          <h2 id="risk-section-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>
            A case isn&apos;t finished just because Amazon says it is.
          </h2>
          <p className="mt-7 max-w-[780px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px] md:leading-9">
            A recovery can lose value after the opportunity is found. Evidence can be missing, a case can be rejected, a response can go unanswered, a payment can be incomplete, or a reimbursement can later be reversed.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["Underpayment", "Partial recovery", "Reversal", "Incomplete outcome", "Next supported action"].map((item) => (
              <div key={item} className="border border-[var(--margin-border)] bg-white px-4 py-4 text-[13px] font-semibold leading-5 text-[var(--margin-text-primary)]">{item}</div>
            ))}
          </div>
          <p className="mt-10 max-w-[820px] font-lora text-[27px] leading-[1.08] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[46px]" style={{ fontWeight: 400 }}>
            Margin follows the money and keeps the state visible.
          </p>
        </motion.div>
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
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleSteps(operationalBuildSteps.length);
      return;
    }
    if (!sectionInView) return;

    setVisibleSteps(0);
    const interval = window.setInterval(() => {
      setVisibleSteps((current) => {
        if (current >= operationalBuildSteps.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 220);

    return () => window.clearInterval(interval);
  }, [reduceMotion, sectionInView]);

  const progress = reduceMotion ? 1 : visibleSteps / operationalBuildSteps.length;

  return (
    <section ref={sectionRef} aria-labelledby="operational-economics-title" className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[980px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">11 — BUSINESS CASE</span>
          </div>
          <h2 id="operational-economics-title" className="font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[62px]" style={{ fontWeight: 400 }}>
            You could manage recovery yourself.
            <span className="mt-3 block text-[var(--margin-text-muted)]">But someone has to own it.</span>
          </h2>
          <p className="mt-7 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
            Audit the activity, gather the evidence, manage the cases, watch the deadlines, respond to requests, check the payouts, reconcile the outcomes—and then do it again next month.
          </p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="mt-14 md:mt-18">
          <div className="mb-5 flex items-end justify-between gap-5 border-b border-[var(--margin-border)] pb-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">If you build the function yourself</span>
            <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)] sm:block">Recurring operating load</span>
          </div>

          <div className="relative border-y border-[var(--margin-border)] py-7 md:py-9">
            <motion.div aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left bg-[var(--margin-blue)]" initial={{ scaleX: 0 }} animate={{ scaleX: progress }} transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {operationalBuildSteps.map((step, index) => {
                const isVisible = reduceMotion || visibleSteps > index;
                return (
                  <motion.div key={step} initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0.24, x: 10 }} animate={{ opacity: isVisible ? 1 : 0.24, x: isVisible ? 0 : 10 }} transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }} className="min-h-[74px] border-b border-r border-[var(--margin-border)] px-3 py-4 last:border-r-0 sm:min-h-[92px] sm:px-4 sm:py-5 lg:border-b-0 lg:first:border-l-0">
                    <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--margin-text-muted)]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="mt-3 block max-w-[130px] font-lora text-[18px] leading-[1.05] tracking-[-0.025em] text-[var(--margin-text-primary)] sm:text-[20px]">{step}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <motion.div {...revealProps}>
            <p className="max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">The work is possible. The cost is that someone inside the business now owns the whole function—and has to keep owning it when the next issue arrives.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-l border-[var(--margin-blue)] pl-6 md:pl-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">The Margin alternative</p>
            <h3 className="mt-4 max-w-[640px] font-lora text-[30px] leading-[1.02] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]" style={{ fontWeight: 400 }}>Or let Margin run the recovery operation.</h3>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">Margin gives recovery its own operating layer, so you do not have to build the people, process, spreadsheets, reminders, and case management around it yourself.</p>
            <p className="mt-7 max-w-[640px] font-lora text-[22px] leading-tight tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[28px]" style={{ fontWeight: 400 }}>You are not adding another tool to operate.<span className="mt-2 block text-[var(--margin-text-muted)]">You are removing another function from your workload.</span></p>
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
              <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">13 / What happens when things go wrong?</span></div>
              <h2 id="recovery-outcome-title" className="max-w-[760px] font-lora text-[30px] leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[42px] lg:max-w-[760px] lg:text-[46px]" style={{ fontWeight: 400 }}>A recovery doesn&apos;t disappear when Amazon says no.</h2>
            </motion.div>

            <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
              <motion.div {...revealProps} className="border-t border-[var(--margin-text-primary)]">
                {recoveryOutcomeStates.map((state, index) => {
                  const isActive = index === activeOutcome;
                  return (
                    <div key={state.title} className={`border-b border-[var(--margin-border)] py-3.5 transition-opacity duration-300 sm:py-4 ${isActive ? "opacity-100" : "opacity-45"}`}>
                      <h3 className={`tracking-[-0.035em] ${isActive ? "text-[20px] font-medium text-[var(--margin-text-primary)] sm:text-[22px]" : "text-[19px] font-normal text-[var(--margin-text-secondary)] sm:text-[21px]"}`}>{state.title}</h3>
                      {isActive ? <><p className="mt-2 max-w-[420px] text-[13px] leading-5 text-[var(--margin-text-secondary)] sm:text-[14px]">{state.description}</p><button type="button" className="mt-3 text-[13px] font-medium text-[var(--margin-text-primary)] underline decoration-[var(--margin-border-strong)] underline-offset-4 transition-colors hover:text-[var(--margin-blue)]">Learn More</button></> : null}
                    </div>
                  );
                })}
              </motion.div>

              <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="lg:-translate-y-8">
                <div className="relative min-h-[360px] overflow-hidden rounded-[10px] bg-[#252522] sm:min-h-[450px] lg:h-[520px] lg:min-h-0">
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
        <RecoveryWorkStatement />
        <AccountingEvidenceSection />
        <RiskSection />
        <OperationalEconomicsSection />
        <RecoveryOutcomeExplorer />
        {false && <RecoveryThreadSection onAuditCta={() => handleClaimAccessClick("recovery_thread_audit", "sp_api")} />}
        <RecoveryOfferSection onAuditCta={handleClaimAccessClick} />

        {/* Section 10 — FAQ */}
        <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <h2 className="font-lora text-[34px] font-medium leading-tight tracking-[-0.045em] sm:text-[42px] md:text-[46px]" style={{ fontWeight: 400 }}>
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
                {faqs.map((item, index) => (
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
            </div>
          </div>
        </section>

        {/* Final CTA — compact operational handoff */}
        <section className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-8 sm:py-10 md:py-14" aria-labelledby="final-handoff-title">
          <div className={containerClass}>
            <div className="grid items-center gap-8 border-y border-[var(--margin-border)] py-8 md:gap-12 md:py-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
              <motion.div {...revealProps} className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">Final operational handoff</p>
                <h2 id="final-handoff-title" className="mt-3 max-w-[650px] font-lora text-[32px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
                  You sell on Amazon. Margin handles the recovery.
                </h2>
                <p className="mt-4 max-w-[620px] text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">
                  It finds what Amazon missed, builds the proof, carries the recovery forward, and tracks what Amazon actually paid.
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
                <div className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[radial-gradient(circle_at_76%_22%,rgba(45,70,92,0.32),transparent_48%),linear-gradient(145deg,#11151A_0%,#050608_58%,#000000_100%)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-5">
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
