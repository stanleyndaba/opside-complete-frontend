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
  { id: "slack", name: "Slack", context: "internal context", src: "/slack-icon-2019.png", route: "M 50 50 V 94" },
  { id: "xero", name: "Xero", context: "accounting records", src: "/xero.png", route: "M 88 50 H 70 V 94 H 50" },
  { id: "dropbox", name: "Dropbox", context: "supporting files", src: "/Dropbox_Icon.svg.png", route: "M 12 86 H 30 V 94 H 50" },
  { id: "outlook", name: "Outlook", context: "supplier correspondence", src: "/outlookicon.webp", route: "M 50 86 V 94" },
  { id: "onedrive", name: "OneDrive", context: "working documents", src: "/onedriive.png", route: "M 88 86 H 70 V 94 H 50" },
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

  return (
    <section className="relative overflow-x-hidden border-b border-[var(--margin-border)] bg-[#FAFAF7] py-20 md:py-28" aria-labelledby="accounting-section-title">
      <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 gap-12 lg:grid-cols-[0.86fr_1fr] lg:items-start lg:gap-16">
          <motion.div {...revealProps} className="min-w-0">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Accounting</span>
            </div>
            <h2 id="accounting-section-title" className="max-w-full break-words font-lora text-[31px] leading-[1.01] tracking-[-0.04em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
              A recovery is easier to act on when the money around it is visible.
              <span className="mt-3 block text-[#8A99A4]">The right context should arrive beside the event.</span>
            </h2>
            <p className="mt-6 max-w-full break-words text-[14px] leading-6 text-[#4D5B66] md:max-w-[610px] md:text-[17px] md:leading-8">
              Amazon can show what happened to the shipment or inventory. Your existing records help explain what that event was worth, whether the amount is supported, and whether the outcome was actually settled.
            </p>
            <p className="mt-6 max-w-full break-words text-[13px] font-semibold leading-6 text-[#182026] md:max-w-[560px] md:text-[15px]">
              You should not have to reconstruct that financial context before you can decide what to do next.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative min-w-0 lg:pt-4">
            <div className="relative border-y border-[#D8E3EA] py-5 sm:py-6 md:py-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,_rgba(11,116,222,0.10),_transparent_62%)]" />
              <div className="relative flex flex-col items-start gap-2 border-b border-[#E4EDF1] pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0B74DE]">The context bridge</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">Your records / read-only</span>
              </div>

              <div className="relative mt-7">
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#66737F]">Integrated tools</p>
                  <span className="max-w-full break-words font-mono text-[9px] uppercase tracking-[0.12em] text-[#0B74DE]">Active signal / {activeSource.context}</span>
                </div>

                <div className="relative mt-4">
                  <div className="relative hidden h-[440px] overflow-hidden md:block lg:h-[470px]">
                    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {accountingSources.map((source) => (
                        <path key={`${source.id}-base`} d={source.route} fill="none" stroke="#D8E3EA" strokeWidth="0.22" strokeLinecap="square" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
                      ))}
                      <motion.path
                        key={activeSource.id}
                        d={activeSource.route}
                        fill="none"
                        stroke="#0B74DE"
                        strokeWidth="0.7"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={reduceMotion ? { pathLength: 1, opacity: 0.8 } : { pathLength: [0, 1], opacity: [0, 1, 0.75] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <circle cx="50" cy="94" r="1.2" fill="#FAFAF7" stroke="#0B74DE" strokeWidth="0.45" vectorEffect="non-scaling-stroke" />
                    </svg>

                    <div className="relative grid h-full grid-cols-3 grid-rows-3 gap-x-8 gap-y-4 px-1 py-2 lg:gap-x-12">
                      {accountingSources.map((source, index) => {
                        const isActive = index === activeEvidence % accountingSources.length;
                        return (
                          <motion.div
                            key={source.id}
                            animate={reduceMotion ? { opacity: 1, y: 0, x: 0 } : { opacity: isActive ? 1 : 0.62, y: isActive ? -4 : 0, x: isActive ? 3 : 0 }}
                            transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 flex min-w-0 flex-col items-center justify-center text-center"
                          >
                            <div className="flex h-12 items-center justify-center lg:h-14">
                              <img src={source.src} alt={source.name} className="max-h-10 max-w-12 object-contain" />
                            </div>
                            <span className={`mt-2 max-w-[112px] text-[9px] leading-4 tracking-tight ${isActive ? "font-semibold text-[#0B74DE]" : "text-[#94A3B8]"}`}>
                              {source.context}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 bg-[#FAFAF7] px-4 text-center">
                      <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">Recovery context</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={activeSource.context}
                          initial={reduceMotion ? { opacity: 1, y: 4 } : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                          transition={{ duration: reduceMotion ? 0 : 0.25 }}
                          className="mt-1 block whitespace-nowrap text-[10px] leading-4 text-[#66737F]"
                        >
                          {activeSource.context}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="relative md:hidden">
                    <div className="relative overflow-hidden py-5">
                      <motion.div
                        className="flex w-max gap-8 pr-8"
                        animate={reduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 34, repeat: Infinity, ease: "linear" }}
                        style={{ willChange: "transform" }}
                      >
                        {[...accountingSources, ...accountingSources].map((source, index) => (
                          <div key={`${source.id}-${index}`} className="w-[118px] shrink-0">
                            <div className="flex h-12 items-center">
                              <img src={source.src} alt={source.name} className="max-h-10 max-w-12 object-contain" />
                            </div>
                            <span className="mt-3 block text-[9px] leading-4 tracking-tight text-[#66737F]">{source.context}</span>
                          </div>
                        ))}
                      </motion.div>
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FAFAF7] to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAFAF7] to-transparent" />
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <motion.span
                        aria-hidden="true"
                        className="h-px bg-[#0B74DE]"
                        animate={reduceMotion ? { width: 32, opacity: 1 } : { width: [20, 44, 20], opacity: [0.35, 1, 0.35] }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <p className="text-[11px] leading-5 text-[#66737F]">Relevant context moves into view when it can change the recovery decision.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 hidden items-center gap-3 border-t border-[#E4EDF1] pt-4 md:flex">
                  <motion.span
                    aria-hidden="true"
                    className="h-px bg-[#0B74DE]"
                    animate={reduceMotion ? { width: 32, opacity: 1 } : { width: [20, 44, 20], opacity: [0.35, 1, 0.35] }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p className="text-[11px] leading-5 text-[#66737F]">
                    Relevant context moves into view when it can change the recovery decision.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        <motion.div {...revealProps} className="mt-16 border-t border-[#D8E3EA] pt-8 md:mt-24 md:pt-10">
          <p className="max-w-[760px] text-[16px] leading-7 text-[#4D5B66] md:text-[18px] md:leading-8">
            Margin does not replace your books. It brings in only the pieces that help explain a recovery.
          </p>
          <p className="mt-6 max-w-[980px] font-lora text-[30px] leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[50px]" style={{ fontWeight: 400 }}>
            Not another accounting system.
            <span className="mt-3 block text-[#0B74DE]">Just the context a recovery needs.</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
            <span>Read-only.</span><span className="text-[#B5C2CA]">·</span><span>Purpose-limited.</span><span className="text-[#B5C2CA]">·</span><span>Your books remain your books.</span>
          </div>
        </motion.div>
      </div>
    </section>
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
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Find what Amazon missed. Get it handled.</motion.span>
            <motion.span className="block text-slate-400" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>Know it was paid.</motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Margin keeps your FBA recovery work together—from understanding what happened and proving it, to handling what you approve and showing what Amazon actually paid.</motion.p>
          <p className="mt-4 font-lora text-[14px] leading-6 tracking-[-0.01em] text-slate-400 sm:mt-5 sm:text-[16px]">You keep selling. Margin handles the recovery work.</p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Connect Amazon" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-6 text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Connect Amazon <ArrowRight className="ml-2 h-5 w-5" /></Button>
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
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[860px]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              The reality check
            </span>
          </div>
          <h2 className="font-lora text-[36px] leading-[0.99] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>
            Finding the issue is only the first step.
          </h2>
          <p className="mt-6 max-w-[720px] text-[16px] leading-7 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-8">
            Most recovery systems stop after identifying a discrepancy.
          </p>
          <p className="mt-6 max-w-[620px] font-lora text-[25px] leading-tight tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[32px] md:text-[40px]" style={{ fontWeight: 400 }}>
            But an opportunity is not a recovery.
          </p>
        </motion.div>

        <div className="mt-16 max-w-[1080px] md:mt-24">
          <motion.p {...revealProps} className="max-w-[520px] text-[15px] font-semibold leading-7 text-[var(--margin-text-primary)] md:text-[17px]">
            A recovery still has to survive the rest of the process:
          </motion.p>

          <div className="mt-8 flex flex-nowrap items-baseline gap-x-2 overflow-x-hidden border-y border-[var(--margin-border)] py-6 sm:flex-wrap sm:gap-x-8 sm:gap-y-2 md:mt-10 md:py-7">
            {realityCheckStages.map((stage, index) => (
              <React.Fragment key={stage.title}>
                <motion.p
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.65 }}
                  transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="shrink-0 font-lora text-[30px] leading-none tracking-[-0.05em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[60px]"
                  style={{ fontWeight: 400 }}
                >
                  {stage.title}
                </motion.p>
                {index < realityCheckStages.length - 1 ? <span aria-hidden="true" className="shrink-0 font-mono text-[14px] text-[var(--margin-border-strong)] sm:text-[18px]">·</span> : null}
              </React.Fragment>
            ))}
          </div>

          <motion.div {...revealProps} className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 md:mt-8 md:gap-x-4">
            {realityCheckWords.map((word, index) => (
              <React.Fragment key={word}>
                <motion.span
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0.3 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.9 }}
                  animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }}
                  transition={reduceMotion ? undefined : { duration: 3.6, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}
                  className={`font-mono text-[11px] font-semibold uppercase tracking-tight md:text-[12px] ${index === realityCheckWords.length - 1 ? "text-[var(--margin-text-primary)]" : "text-[var(--margin-text-muted)]"}`}
                >
                  {word}
                </motion.span>
                {index < realityCheckWords.length - 1 ? <span aria-hidden="true" className="font-mono text-[11px] text-[var(--margin-border-strong)]">·</span> : null}
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        <motion.div {...revealProps} className="mt-16 border-t border-[var(--margin-border)] pt-7 md:mt-24 md:pt-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
            And this is where Margin should say:
          </p>
          <p className="mt-4 max-w-[980px] font-lora text-[30px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[50px]" style={{ fontWeight: 400 }}>
            Most of the work happens after the opportunity is found.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const marginLifecycleUnits = [
  { label: "Audit Amazon activity", side: "left" as const },
  { label: "Find potential losses", side: "right" as const },
  { label: "Verify the recovery", side: "left" as const },
  { label: "Build the evidence", side: "right" as const },
  { label: "Prepare the case", side: "left" as const },
  { label: "Manage filing", side: "right" as const },
  { label: "Track Amazon's response", side: "left" as const },
  { label: "Handle follow-up", side: "right" as const },
  { label: "Challenge weak outcomes", side: "left" as const },
  { label: "Track the result", side: "right" as const },
  { label: "Reconcile what happened", side: "left" as const },
];

function MarginLifecycleSection() {

  return (
    <section
      aria-labelledby="margin-lifecycle-title"
      className="relative overflow-hidden border-b border-[var(--margin-border)] bg-white py-16 sm:py-20 md:py-28"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[980px]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              03 / Introduce Margin's job
            </span>
          </div>
          <h2
            id="margin-lifecycle-title"
            className="font-lora text-[28px] leading-[1.02] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] sm:leading-[0.98] md:text-[56px]"
            style={{ fontWeight: 400 }}
          >
            <span className="block">Margin doesn&apos;t hand you a list of problems.</span>
            <span className="mt-3 block text-[var(--margin-text-muted)]">
              It takes the recovery from discovery to resolution.
            </span>
          </h2>
        </motion.div>

        <div className="mt-10 sm:mt-14 md:mt-20">
          <motion.p
            {...revealProps}
            className="max-w-[680px] text-[17px] font-medium leading-7 tracking-[-0.02em] text-[var(--margin-text-primary)] md:text-[23px] md:leading-8"
          >
            Margin operates across the full recovery lifecycle:
          </motion.p>

          <div className="relative mt-8 overflow-hidden px-1 py-3 sm:mt-10 sm:py-4 md:mt-12 md:px-0 md:py-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="brand-wordmark font-merriweather text-[clamp(4.5rem,12vw,10rem)] leading-none tracking-[-0.085em] text-[rgba(24,32,38,0.055)]">
                Margin
              </span>
            </div>

            <div className="relative z-10 space-y-2 md:space-y-2.5">
              {marginLifecycleUnits.map((item, index) => {
                const direction = item.side === "left" ? "left" : "right";

                return (
                    <div key={item.label} className="relative h-8 min-w-0 overflow-visible sm:h-9">
                    <span
                      style={{
                        animationDelay: `-${index * 0.52}s`,
                        animationDuration: `${11.4 + (index % 3) * 0.72}s`,
                      }}
                      className={cn(
                        "lifecycle-unit absolute top-0 inline-flex max-w-[calc(100vw-3rem)] whitespace-nowrap rounded-[10px] bg-[#EEF1F2] px-2.5 py-1.5 text-[10px] font-semibold leading-5 tracking-[-0.01em] text-[#182026] sm:max-w-none sm:px-3.5 sm:py-2 sm:text-[12px]",
                        direction === "left" ? "lifecycle-unit--left" : "lifecycle-unit--right",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.p
            {...revealProps}
            className="mt-12 max-w-[820px] font-lora text-[25px] leading-[1.08] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:mt-14 sm:text-[36px] md:mt-20 md:text-[48px]"
          >
            You don&apos;t need to remember which case needs attention.
            <span className="mt-4 block text-[var(--margin-text-muted)]">
              Margin keeps the recovery operation moving.
            </span>
          </motion.p>
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
    <section className="border-b border-[var(--margin-border)] bg-[var(--margin-canvas)]">
      <div className="mx-auto w-full max-w-[1280px] border-t border-[var(--margin-border)] px-4 py-14 sm:px-8 lg:px-10 2xl:px-12 md:py-20">
        <p className="mx-auto max-w-[1080px] text-center font-lora text-[28px] leading-[1.25] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[42px]" style={{ fontWeight: 400 }}>Keep your recovery work visible, supported, and moving. Eliminate manual reconciliation on a secure platform built for high-volume operations.</p>
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
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.28 });
  const [activeLeak, setActiveLeak] = useState(0);

  useEffect(() => {
    if (reduceMotion || !sectionInView) {
      setActiveLeak(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveLeak((current) => (current + 1) % riskLeakPoints.length);
    }, 1150);

    return () => window.clearInterval(interval);
  }, [reduceMotion, sectionInView]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="risk-section-title"
      className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(201,120,93,0.18),transparent_34%),radial-gradient(circle_at_12%_86%,rgba(201,120,93,0.08),transparent_30%)]" />
      <div className={containerClass}>
        <motion.div {...revealProps} className="relative max-w-[980px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[#C9785D]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#A95F49]">
              10 / Where recovery leaks
            </span>
          </div>
          <h2
            id="risk-section-title"
            className="font-lora text-[35px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[48px] md:text-[64px]"
            style={{ fontWeight: 400 }}
          >
            A recovery can lose value at any point in the chain.
            <span className="mt-3 block text-[var(--margin-text-muted)]">
              The gap is usually between one step and the next.
            </span>
          </h2>
          <p className="mt-7 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
            An opportunity can disappear during investigation, evidence gathering, filing, follow-up, or payout review. The exposure is not only what goes unnoticed—it is what remains unattended after someone notices it.
          </p>
        </motion.div>

        <motion.div
          {...revealProps}
          transition={{ ...revealProps.transition, delay: 0.12 }}
          className="relative mt-14 border border-[#D9B8AA] bg-[rgba(255,251,247,0.72)] p-5 shadow-[0_24px_80px_rgba(127,78,62,0.08)] sm:p-8 md:mt-18 md:p-10"
        >
          <div className="pointer-events-none absolute inset-2 border border-[#EBD8D1] sm:inset-3" />
          <div className="relative flex items-center justify-between gap-4 border-b border-[#E7D3CC] pb-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A95F49]">
              The leakage chain
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A8178]">
              {String(activeLeak + 1).padStart(2, "0")} / {String(riskLeakPoints.length).padStart(2, "0")}
            </span>
          </div>

          <div className="relative mt-8">
            <div className="pointer-events-none absolute left-0 right-0 top-[14px] hidden h-px bg-[#D9B8AA] md:block" />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute top-[11px] hidden h-[7px] w-16 rounded-full bg-[#C9785D] shadow-[0_0_20px_rgba(201,120,93,0.34)] md:block"
              animate={reduceMotion ? { left: "0%", opacity: 0.8 } : { left: `${(activeLeak / (riskLeakPoints.length - 1)) * 100}%`, opacity: [0.35, 1, 0.35] }}
              transition={reduceMotion ? { duration: 0 } : { left: { duration: 0.52, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 1.15, repeat: Infinity, ease: "easeInOut" } }}
            />
            <div className="grid gap-0 sm:grid-cols-2 md:grid-cols-4">
              {riskLeakPoints.map((point, index) => {
                const isActive = reduceMotion ? index === 0 : index === activeLeak;
                const isPast = !reduceMotion && index < activeLeak;
                return (
                  <motion.div
                    key={point.label}
                    initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0.38, y: 8 }}
                    animate={{ opacity: isActive ? 1 : isPast ? 0.7 : 0.4, y: isActive ? 0 : 2 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative border-b border-r border-[#E7D3CC] px-3 py-5 last:border-r-0 sm:px-4 md:min-h-[128px] md:border-b-0 md:px-5 md:py-8 md:[&:nth-child(4n)]:border-r-0"
                  >
                    <span className="mb-5 block h-2.5 w-2.5 rounded-full border border-[#C9785D] bg-[#FFF5EF] md:relative md:z-10" />
                    <span className={`block font-lora text-[21px] leading-[1.04] tracking-[-0.03em] ${isActive ? "text-[#A95F49]" : "text-[var(--margin-text-primary)]"}`} style={{ fontWeight: 400 }}>
                      {point.label}
                    </span>
                    <span className="mt-2 block max-w-[150px] text-[11px] leading-5 text-[#8A756D]">
                      {point.detail}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-7 border-t border-[#E7D3CC] pt-6 md:mt-8 md:pt-7">
            <p className="max-w-[920px] font-lora text-[25px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[32px] md:text-[43px]" style={{ fontWeight: 400 }}>
              The real exposure is what remains unattended after someone notices it.
            </p>
            <p className="mt-5 max-w-[690px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">
              Margin keeps the recovery moving across those handoffs until there is a recorded outcome, not just an open question.
            </p>
          </div>
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

const recoveryOperationStages = [
  "Activity",
  "Signal",
  "Evidence",
  "Judgment",
  "Casework",
  "Outcome",
  "Verified result",
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

  const progress = reduceMotion
    ? 1
    : visibleSteps / operationalBuildSteps.length;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="operational-economics-title"
      className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[980px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              11 / The operating economics
            </span>
          </div>
          <h2
            id="operational-economics-title"
            className="font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[62px]"
            style={{ fontWeight: 400 }}
          >
            The question is not whether recovery can be done in-house.
            <span className="mt-3 block text-[var(--margin-text-muted)]">
              It is what it takes to keep doing it properly.
            </span>
          </h2>
          <p className="mt-7 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px] md:leading-9">
            An internal recovery program needs a person, a process, and the discipline to keep every possible issue moving from first signal to final financial check.
          </p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="mt-14 md:mt-18">
          <div className="mb-5 flex items-end justify-between gap-5 border-b border-[var(--margin-border)] pb-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
              If you build the function yourself
            </span>
            <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)] sm:block">
              Recurring operating load
            </span>
          </div>

          <div className="relative border-y border-[var(--margin-border)] py-7 md:py-9">
            <motion.div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px origin-left bg-[var(--margin-blue)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {operationalBuildSteps.map((step, index) => {
                const isVisible = reduceMotion || visibleSteps > index;
                return (
                  <motion.div
                    key={step}
                    initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0.24, x: 10 }}
                    animate={{ opacity: isVisible ? 1 : 0.24, x: isVisible ? 0 : 10 }}
                    transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[74px] border-b border-r border-[var(--margin-border)] px-3 py-4 last:border-r-0 sm:min-h-[92px] sm:px-4 sm:py-5 lg:border-b-0 lg:first:border-l-0"
                  >
                    <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--margin-text-muted)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-3 block max-w-[130px] font-lora text-[18px] leading-[1.05] tracking-[-0.025em] text-[var(--margin-text-primary)] sm:text-[20px]">
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <motion.div {...revealProps}>
            <p className="max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              The work is possible. The cost is that someone inside the business now owns the whole function—and has to keep owning it when the next issue arrives.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-l border-[var(--margin-blue)] pl-6 md:pl-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-blue)]">
              The Margin alternative
            </p>
            <h3 className="mt-4 max-w-[640px] font-lora text-[30px] leading-[1.02] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]" style={{ fontWeight: 400 }}>
              Margin gives recovery its own operating layer.
            </h3>
            <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              The signals, evidence, decisions, cases, and outcomes stay connected, while your team stays focused on the business that generated the activity.
            </p>
            <p className="mt-7 max-w-[640px] font-lora text-[22px] leading-tight tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[28px]" style={{ fontWeight: 400 }}>
              You are not adding another screen to manage.
              <span className="mt-2 block text-[var(--margin-text-muted)]">You are avoiding another function to build.</span>
            </p>
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
    title: "Underpaid",
    description: "The result can be compared against the expected recovery.",
    action: "Compare expected to paid",
    visualLabel: "Recovery variance",
    visualValue: "Expected  /  actual",
    visualDetail: "The gap remains visible instead of being mistaken for a complete recovery.",
  },
  {
    title: "Partially resolved",
    description: "The unresolved balance remains visible.",
    action: "Keep the balance open",
    visualLabel: "Open balance",
    visualValue: "Resolved  /  unresolved",
    visualDetail: "A partial result becomes a tracked balance with a clear next state.",
  },
  {
    title: "Reversed",
    description: "A previously positive outcome can be detected and examined.",
    action: "Examine the reversal",
    visualLabel: "Outcome changed",
    visualValue: "Positive  →  reversed",
    visualDetail: "Margin surfaces the change so the earlier result can be investigated.",
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

        <motion.div {...revealProps} className="mt-16 border-t border-[var(--margin-border)] pt-8 md:mt-24 md:pt-10">
          <p className="max-w-[1060px] font-lora text-[30px] leading-[1.03] tracking-[-0.045em] sm:text-[40px] md:text-[54px]" style={{ fontWeight: 400 }}>
            <span className="text-[var(--margin-text-primary)]">You run the business.</span>{" "}
            <span className="text-[var(--margin-text-muted)]">Margin keeps the recovery work legible.</span>
          </p>
          <p className="mt-5 max-w-[700px] text-[14px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px] md:leading-8">
            Open Margin when you want to see what has surfaced, what is being handled, and what has genuinely been settled.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function RecoveryOutcomeExplorer() {
  const reduceMotion = useReducedMotion();
  const outcomeSceneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: outcomeSceneRef,
    offset: ["start start", "end end"],
  });
  const [activeOutcome, setActiveOutcome] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextOutcome = Math.min(
      recoveryOutcomeStates.length - 1,
      Math.floor(latest * recoveryOutcomeStates.length),
    );
    setActiveOutcome((current) => (current === nextOutcome ? current : nextOutcome));
  });

  const activeState = recoveryOutcomeStates[activeOutcome];
  const progressPercent = ((activeOutcome + 1) / recoveryOutcomeStates.length) * 100;

  return (
    <section
      aria-labelledby="recovery-outcome-title"
      className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)]"
    >
      <div ref={outcomeSceneRef} className="relative lg:min-h-[520vh]">
        <div className="lg:sticky lg:top-20 lg:flex lg:min-h-[calc(100svh-5rem)] lg:items-center">
          <div className={`${containerClass} w-full py-16 md:py-24 lg:py-10`}>
            <motion.div {...revealProps} className="max-w-[920px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px w-8 bg-[var(--margin-blue)]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
                  13 / What happens when things go wrong?
                </span>
              </div>
              <h2 id="recovery-outcome-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
                A recovery doesn&apos;t disappear when Amazon says no.
              </h2>
            </motion.div>

            <div className="relative mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16">
              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
                  <span>Outcome states</span>
                  <span>{String(activeOutcome + 1).padStart(2, "0")} / {String(recoveryOutcomeStates.length).padStart(2, "0")}</span>
                </div>
                <div className="mb-5 h-px w-full bg-[var(--margin-border)]">
                  <motion.div
                    className="h-px origin-left bg-[var(--margin-blue)]"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                  />
                </div>
                <div className="border-t border-[var(--margin-border)]">
                  {recoveryOutcomeStates.map((state, index) => {
                    const isActive = index === activeOutcome;
                    const isPast = index < activeOutcome;
                    return (
                      <motion.div
                        key={state.title}
                        initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : index * 0.045 }}
                        className={`relative border-b border-[var(--margin-border)] py-4 pr-2 transition-opacity duration-300 sm:py-5 ${isActive ? "opacity-100" : isPast ? "opacity-70" : "opacity-45"}`}
                      >
                        <div className="flex items-start gap-4">
                          <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors duration-300 ${isActive ? "bg-[var(--margin-blue)] text-white" : "bg-[#EEF1F2] text-[var(--margin-text-muted)]"}`}>
                            {isPast ? "✓" : String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h3 className={`font-lora text-[22px] leading-tight tracking-[-0.035em] transition-colors duration-300 sm:text-[25px] ${isActive ? "text-[var(--margin-text-primary)]" : "text-[var(--margin-text-secondary)]"}`} style={{ fontWeight: 400 }}>
                              {state.title}
                            </h3>
                            <p className="mt-1.5 max-w-[500px] text-[13px] leading-6 text-[var(--margin-text-secondary)] sm:text-[14px]">
                              {state.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="relative min-h-[350px] overflow-hidden rounded-[10px] border border-[var(--margin-border)] bg-white sm:min-h-[400px] lg:h-[min(520px,calc(100svh-14rem))] lg:min-h-0">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.08),transparent_35%)]" />
                  <div className="pointer-events-none absolute inset-x-5 top-5 h-px bg-[var(--margin-border)] sm:inset-x-7 sm:top-7" />
                  <div className="pointer-events-none absolute bottom-5 left-5 right-5 h-px bg-[var(--margin-border)] sm:bottom-7 sm:left-7 sm:right-7" />
                  <AnimatePresence mode="wait">
                    <OutcomeWorkspace key={activeState.title} state={activeState} index={activeOutcome} reduceMotion={Boolean(reduceMotion)} />
                  </AnimatePresence>
                </div>
                <p className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--margin-text-muted)]">
                  Image-ready workspace / visual states can be added here later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${containerClass} py-16 md:py-24`}>
        <motion.div {...revealProps} className="border-t border-[var(--margin-border)] pt-7 md:pt-9">
          <p className="max-w-[760px] font-lora text-[28px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[46px]" style={{ fontWeight: 400 }}>
            Every outcome becomes information.
            <span className="mt-2 block text-[var(--margin-text-muted)]">Every unresolved outcome has a next action.</span>
          </p>
        </motion.div>
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
        <RealityCheckSection />
        <MarginLifecycleSection />
        <MarginOperationSection />
        <RecoveryWorkStatement />

        <AccountingEvidenceSection />
        <RiskSection />
        <OperationalEconomicsSection />
        <FullRecoveryLoopSection />
        <RecoveryOutcomeExplorer />
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

        <ProductReframeSection />

        {/* Section 11 — Recovery statement */}
        <section className="relative border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto max-w-[980px] text-center">
              <h2 className="font-lora text-[42px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[56px] md:text-[76px]" style={{ fontWeight: 400 }}>
                <span className="block">You already have enough operations to run.</span>
                <span className="mt-3 block text-[var(--margin-text-muted)]">Recovery shouldn&apos;t be another one.</span>
              </h2>
            </motion.div>
          </div>
        </section>

        {/* Section 12 — Final operational handoff */}
        <section className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-18" aria-labelledby="final-handoff-title">
          <div className={containerClass}>
            <div className="relative border-y border-[var(--margin-border)] py-16 md:py-24">
              <div className="grid gap-14 lg:grid-cols-[1fr_0.82fr] lg:items-end lg:gap-20">
                <motion.div {...revealProps}>
                  <p className="max-w-[760px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px]">
                    Potential losses should not end as spreadsheets, reminders, or unresolved cases.
                  </p>
                  <p className="mt-6 max-w-[700px] text-[13px] leading-6 text-[var(--margin-text-muted)] md:text-[14px]">
                    Margin keeps the recovery moving until there is an outcome you can see.
                  </p>
                  <h2 id="final-handoff-title" className="mt-10 max-w-[720px] font-lora text-[32px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[54px]" style={{ fontWeight: 400 }}>
                    You sell. Margin runs the recovery operation.
                  </h2>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => handleClaimAccessClick("homepage_early_access_section")}
                      className="landing-pressable group relative h-14 w-full rounded-[7px] bg-[var(--margin-blue)] px-8 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(23,92,211,0.22)] transition-[background-color,box-shadow,transform] duration-150 hover:bg-[var(--margin-blue-hover)] max-md:shadow-none sm:w-auto"
                    >
                      <div className="absolute inset-0 rounded-[7px] bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      Start the recovery operation
                    </Button>
                  </div>
                </motion.div>

                <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="relative">
                  <div className="mb-5 flex items-center justify-between border-b border-[var(--margin-border)] pb-4">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">The work does not disappear</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">01—04</span>
                  </div>
                  <div className="divide-y divide-[var(--margin-border)] border-y border-[var(--margin-border)]">
                    {[
                      "Finds the recovery.",
                      "Builds the case.",
                      "Carries it forward.",
                      "Keeps the outcome visible."
                    ].map((item, index) => (
                      <motion.div
                        key={item}
                        initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="group flex items-center gap-4 py-5 md:py-6"
                      >
                        <span className="w-8 shrink-0 font-mono text-[10px] font-semibold tracking-[0.12em] text-[var(--margin-text-muted)] transition-colors duration-300 group-hover:text-[var(--margin-blue)]">
                          0{index + 1}
                        </span>
                        <span className={`text-[16px] leading-6 tracking-tight md:text-[18px] ${index === 3 ? "font-semibold text-[var(--margin-text-primary)]" : "font-medium text-[var(--margin-text-secondary)]"}`}>
                          {item}
                        </span>
                        {index === 3 ? <span aria-hidden="true" className="ml-auto h-px w-8 bg-[#C9785D]" /> : null}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
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
