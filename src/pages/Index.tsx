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
import { SystemPerformanceTicker } from "@/components/landing/SystemPerformanceTicker";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { RecoveryTimelineSection } from "@/components/landing/RecoveryTimelineSection";
import { RecoveryOfferSection, RecoveryProofSections } from "@/components/landing/RecoveryDecisionSections";
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

function SectionTwo() {
  return (
    <section data-navbar-theme="light" className="relative -mt-px border-none bg-white py-32 md:py-56">
      <div className={containerClass}>
        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <motion.div {...revealProps}>
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-blue)]/60" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">The difference</span></div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>Finding the issue is only the first step.</h2>
            <p className="mt-8 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">Most recovery tools find or file a claim. The hard part comes after: proving the issue, keeping the case moving, responding to Amazon, and knowing whether the money actually arrived.</p>
            <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">Margin keeps the proof, your approval, the case, the response, and the payout outcome in one recovery record.</p>
            <p className="mt-6 text-[17px] font-semibold leading-8 tracking-[-0.015em] text-[var(--margin-text-primary)] md:text-[19px]">You see the proof and the next decision. Margin keeps the recovery work moving.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative">
            <div className="relative overflow-hidden border border-[var(--margin-border)] bg-[var(--margin-canvas)] p-7 md:p-8">
              <div className="h-0.5 w-12 bg-[var(--margin-blue)]" />
              <p className="mt-8 font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">Most tools find a claim. Margin follows it through.</p>
              <div className="mt-7 divide-y divide-[var(--margin-border-subtle)] border-y border-[var(--margin-border)]">
                {[
                  ["Find or flag an issue", "Show what supports the issue"],
                  ["File a claim", "Prepare the proof and wait for your approval"],
                  ["Show a case status", "Keep the response, next action, and deadline visible"],
                  ["Mark it complete", "Verify what Amazon paid, what reversed, and what is still unresolved"],
                ].map(([other, margin]) => (
                  <div key={other} className="grid gap-2 py-4 sm:grid-cols-2 sm:gap-5">
                    <p className="text-[13px] leading-6 text-[var(--margin-text-secondary)]">{other}</p>
                    <p className="text-[13px] font-medium leading-6 text-[var(--margin-text-primary)]">{margin}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AccountingEvidenceSection() {
  const reduceMotion = useReducedMotion();
  const [activeEvidence, setActiveEvidence] = useState(0);

  const iconPool = [
    { id: "amazon", src: "/amazon-logo-transparent-circle.png" },
    { id: "gmail", src: "/gmailicon.png" },
    { id: "gd", src: "/gd.png" },
    { id: "quickbooks", src: "/quickbooks.png" },
    { id: "slack", src: "/slack-icon-2019.png" },
    { id: "xero", src: "/xero.png" },
    { id: "dropbox", src: "/Dropbox_Icon.svg.png" },
    { id: "outlook", src: "/outlookicon.webp" },
    { id: "onedrive", src: "/onedriive.png" },
  ];

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setActiveEvidence((current) => (current + 1) % (iconPool.length + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [reduceMotion, iconPool.length]);

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[#FAFAF7] py-28 md:py-44">
      <div className={containerClass}>
        <div className="grid gap-16 lg:grid-cols-[0.86fr_1fr] lg:items-start lg:gap-24">
          <motion.div {...revealProps}>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Accounting</span>
            </div>
            <h2 className="font-lora text-[42px] leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[54px] md:text-[72px]" style={{ fontWeight: 400 }}>
              Recovery gets stronger when the numbers have context.
              <span className="mt-4 block text-[#8A99A4]">Margin brings the right financial evidence into view.</span>
            </h2>
            <p className="mt-8 max-w-[610px] text-[16px] leading-8 text-[#4D5B66] md:text-[18px] md:leading-9">
              Amazon gives you one version of what happened. Margin helps place that version beside the records that explain the money around it.
            </p>
            <p className="mt-8 max-w-[560px] text-[14px] font-semibold leading-7 text-[#182026] md:text-[16px]">
              The useful context is often found in purchase records, cost signals, payout history, and reconciliation data.
            </p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative lg:pt-8">
            <div className="relative border-y border-[#D8E3EA] py-6 sm:py-8 md:py-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(11,116,222,0.10),_transparent_62%)]" />
              <div className="relative flex items-center justify-between border-b border-[#E4EDF1] pb-4">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Financial evidence</span>
                <span className="font-mono text-[9px] uppercase tracking-tight text-[#94A3B8]">Read-only / purpose-limited</span>
              </div>
              <div className="relative mt-8 grid gap-8 sm:grid-cols-[1fr_0.9fr] sm:items-center md:gap-10">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">Relevant context</p>
                  <div className="mt-4 grid grid-cols-3 gap-x-5 gap-y-4">
                    {iconPool.map((icon, index) => (
                      <motion.div
                        key={icon.id}
                        animate={reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: activeEvidence % iconPool.length === index ? 1 : 0.68, y: activeEvidence % iconPool.length === index ? -3 : 0, scale: activeEvidence % iconPool.length === index ? 1.04 : 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="flex h-14 items-center justify-center border-b border-[#E4EDF1] sm:h-16"
                      >
                        <img src={icon.src} alt="" className="max-h-7 max-w-8 object-contain" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="relative border-l border-[#D8E3EA] pl-5 sm:pl-7">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#66737F]">Recovery truth</div>
                  <div className="mt-4 space-y-3">
                    {["Expected reimbursement", "Approved amount", "Paid amount", "Reconciled outcome"].map((item, index) => (
                      <motion.div key={item} animate={{ opacity: reduceMotion || index <= activeEvidence % 5 ? 1 : 0.42 }} transition={{ duration: reduceMotion ? 0 : 0.3 }} className="flex items-center gap-2 text-[11px] font-medium leading-5 text-[#25313A]">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-[#0B74DE]" />
                        {item}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative mt-7 border-t border-[#E4EDF1] pt-4 text-[11px] leading-5 text-[#66737F]">
                Financial context appears when it can change the recovery decision.
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
              <span>Read-only.</span><span className="text-[#B5C2CA]">·</span><span>Purpose-limited.</span><span className="text-[#B5C2CA]">·</span><span>Your books remain your books.</span>
            </div>
          </motion.div>
        </div>

        <motion.div {...revealProps} className="mt-24 border-t border-[#D8E3EA] pt-10 md:mt-36 md:pt-14">
          <p className="max-w-[760px] text-[17px] leading-8 text-[#4D5B66] md:text-[20px] md:leading-9">
            Margin does not replace your books. It brings in only the pieces that help explain a recovery.
          </p>
          <p className="mt-8 max-w-[980px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[68px]" style={{ fontWeight: 400 }}>
            Not another accounting system.
            <span className="mt-3 block text-[#0B74DE]">Just the context a recovery needs.</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
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
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Connect Amazon" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-6 text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Connect Amazon <ArrowRight className="ml-2 h-5 w-5" /></Button>
            <div aria-hidden="true" className="mt-1 flex w-[76%] max-w-[290px] self-center items-center gap-3 sm:hidden"><span className="h-px flex-1 bg-white/15" /><span className="text-[11px] font-medium lowercase tracking-tight text-slate-500">or</span><span className="h-px flex-1 bg-white/15" /></div>
            <button type="button" onClick={onReportCta} className="group inline-flex h-[50px] w-full items-center justify-center px-1 text-[16px] font-semibold text-[#98A2B3] transition-colors duration-200 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] sm:h-11 sm:w-auto sm:justify-start sm:text-[15px]" aria-label="Use Amazon Reports">{reduceMotion ? <span className="leading-[1.25]">Use Amazon Reports</span> : <motion.span className="inline-block leading-[1.25] bg-[linear-gradient(110deg,#98A2B3_0%,#98A2B3_39%,#F8FAFC_50%,#BFC7D2_61%,#98A2B3_100%)] bg-[length:240%_100%] bg-clip-text text-transparent" initial={{ backgroundPosition: "145% 0%" }} animate={{ backgroundPosition: ["145% 0%", "-145% 0%"] }} transition={{ duration: 2.6, delay: 1, repeat: Infinity, repeatDelay: 2.4, ease: [0.23, 1, 0.32, 1] }}>Use Amazon Reports</motion.span>}</button>
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
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-28 md:py-48">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[860px]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
              The reality check
            </span>
          </div>
          <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[58px] md:text-[84px]" style={{ fontWeight: 400 }}>
            Finding the issue is only the first step.
          </h2>
          <p className="mt-8 max-w-[720px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[20px] md:leading-9">
            Most recovery systems stop after identifying a discrepancy.
          </p>
          <p className="mt-8 max-w-[620px] font-lora text-[28px] leading-tight tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[48px]" style={{ fontWeight: 400 }}>
            But an opportunity is not a recovery.
          </p>
        </motion.div>

        <div className="mt-24 max-w-[1080px] md:mt-36">
          <motion.p {...revealProps} className="max-w-[520px] text-[15px] font-semibold leading-7 text-[var(--margin-text-primary)] md:text-[17px]">
            A recovery still has to survive the rest of the process:
          </motion.p>

          <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-y border-[var(--margin-border)] py-8 sm:gap-x-10 md:mt-12 md:py-10">
            {realityCheckStages.map((stage, index) => (
              <React.Fragment key={stage.title}>
                <motion.p
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.65 }}
                  transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="font-lora text-[44px] leading-none tracking-[-0.05em] text-[var(--margin-text-primary)] sm:text-[58px] md:text-[82px]"
                  style={{ fontWeight: 400 }}
                >
                  {stage.title}
                </motion.p>
                {index < realityCheckStages.length - 1 ? <span aria-hidden="true" className="font-mono text-[18px] text-[var(--margin-border-strong)]">·</span> : null}
              </React.Fragment>
            ))}
          </div>

          <motion.div {...revealProps} className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 md:mt-10 md:gap-x-4">
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

        <motion.div {...revealProps} className="mt-24 border-t border-[var(--margin-border)] pt-8 md:mt-36 md:pt-10">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">
            And this is where Margin should say:
          </p>
          <p className="mt-5 max-w-[980px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[68px]" style={{ fontWeight: 400 }}>
            Most of the work happens after the opportunity is found.
          </p>
        </motion.div>
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
    <section ref={operationScrollRef} className="relative border-b border-[var(--margin-border)] bg-[#FAFAF7] py-28 md:py-44">
      <div className={containerClass}>
        <div className="grid gap-16 lg:grid-cols-[0.72fr_1fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <motion.div {...revealProps}>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px w-8 bg-[#0B74DE]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                  What Margin actually does
                </span>
              </div>
              <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[58px] md:text-[76px]" style={{ fontWeight: 400 }}>
                One recovery operation.
                <span className="mt-4 block text-[#8A99A4]">Multiple specialised jobs running inside it.</span>
              </h2>
            </motion.div>
          </div>

          <div className="relative min-h-[640px] md:min-h-[700px]">
            <div className="sticky top-24 h-[min(570px,calc(100vh-8rem))] md:top-28 md:h-[min(620px,calc(100vh-10rem))]">
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
                      className={`absolute inset-0 overflow-hidden rounded-[26px] border p-5 shadow-[0_22px_70px_rgba(37,49,58,0.1)] backdrop-blur-xl sm:p-7 md:p-8 ${
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
                        <h3 className="mt-5 max-w-[700px] font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[46px]" style={{ fontWeight: 400 }}>
                          {agent.title}
                        </h3>
                        <p className="mt-5 max-w-[620px] text-[14px] leading-6 text-[#4D5B66] md:text-[16px] md:leading-7">
                          {agent.body}
                        </p>
                        {agent.details ? (
                          <div className="mt-6 flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-[#E4EDF1] pt-4">
                            {agent.details.map((detail) => (
                              <span key={detail} className="rounded-full border border-[#D8E3EA] bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
                                {detail}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className={`mt-auto max-w-[620px] border-t border-[#E4EDF1] pt-4 font-lora text-[20px] leading-tight tracking-[-0.025em] sm:text-[24px] ${isFeatured ? "text-[#0B74DE]" : "text-[#66737F]"}`} style={{ fontWeight: 400 }}>
                          {agent.outcome}
                        </p>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-between gap-5">
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

export default function Index() {
  usePageMeta(PUBLIC_ROUTE_META['/']);
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { isFull, nextBatchHours } = useOnboardingCapacity();

  const [isBusy, setIsBusy] = useState(false);

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
        <MarginOperationSection />
        <RecoveryWorkStatement />

        <SectionTwo />
        <HowItWorksSection onCtaClick={() => handleClaimAccessClick("audit_output_section")} />
        <RecoveryTimelineSection />
        <RecoveryProofSections onAuditCta={handleClaimAccessClick} />
        <AccountingEvidenceSection />
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

        {/* Section 12 — Final CTA */}
        <section className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-18">
          <div className={containerClass}>
            <div className="relative border-y border-[var(--margin-border)] py-16 md:py-24">
              <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <motion.div {...revealProps}>
                  <p className="max-w-[760px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px]">
                    Margin exists to make sure potential losses don&apos;t simply become another spreadsheet, another reminder, another unfinished task, or another case nobody followed through.
                  </p>
                  <p className="mt-6 max-w-[700px] text-[13px] leading-6 text-[var(--margin-text-muted)] md:text-[14px]">
                    Margin finds the recovery. Builds the case. Manages what happens next. And keeps the outcome visible until the recovery is actually resolved.
                  </p>
                  <p className="mt-10 font-lora text-[28px] leading-tight tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[34px] md:text-[42px]" style={{ fontWeight: 400 }}>
                    You sell. Margin runs the recovery operation.
                  </p>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => handleClaimAccessClick("homepage_early_access_section")}
                      className="landing-pressable group relative h-16 w-full rounded-[8px] bg-[var(--margin-blue)] px-10 text-[16px] font-bold text-white shadow-[0_18px_40px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow,transform] duration-150 max-md:shadow-none sm:w-auto"
                    >
                      <div className="absolute inset-0 rounded-[8px] bg-white/20 opacity-0 transition-opacity duration-300" />
                      Sign Up Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </motion.div>
                <motion.div {...revealProps} className="border-y border-[var(--margin-border)] bg-white/50 p-8 md:p-12">
                  {[
                    "Finds the recovery.",
                    "Builds the case.",
                    "Manages what happens next.",
                    "Keeps the outcome visible."
                  ].map((item) => (
                    <div
                      key={item}
                      className="relative flex items-center gap-4 border-b border-[var(--margin-border)] py-5 last:border-b-0 md:py-6"
                    >
                      <Check className="h-5 w-5 shrink-0 text-[var(--margin-success)]" strokeWidth={3} />
                      <span className="text-[16px] font-semibold leading-6 tracking-tight text-[var(--margin-text-primary)] md:text-[18px]">
                        {item}
                      </span>
                    </div>
                  ))}
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
