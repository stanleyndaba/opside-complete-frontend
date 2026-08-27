import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  AnimatePresence,
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

const containerClass = "mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8";
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

function ExistingOperationFitSection() {
  const reduceMotion = useReducedMotion();
  const [activeIcons, setActiveIcons] = useState(["amazon", "gmail", "gd", "quickbooks"]);

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
    { id: "adobe", src: "/dobe.png" },
  ];

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      const slotToChange = Math.floor(Math.random() * 4);
      const currentIds = activeIcons;
      let nextIcon;
      do {
        nextIcon = iconPool[Math.floor(Math.random() * iconPool.length)];
      } while (currentIds.includes(nextIcon.id));

      const nextIcons = [...currentIds];
      nextIcons[slotToChange] = nextIcon.id;
      setActiveIcons(nextIcons);
    }, 2400);
    return () => clearInterval(interval);
  }, [activeIcons, reduceMotion]);

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[860px] text-center">
          <div className={sectionLabelClass}>One recovery record. One version of the truth.</div>
          <h2 className="mt-3 font-lora text-[34px] leading-[1.03] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
            Operations sees the case. Finance sees the money.
          </h2>
          <p className="mx-auto mt-8 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
            Operations can see what is missing and what happens next. Finance can compare what was expected, what Amazon approved, and what Amazon actually paid. No more rebuilding the story from Seller Central, spreadsheets, files, and one person’s memory.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          <motion.article {...revealProps} className="border-t border-[var(--margin-border)] pt-5">
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(201,214,222,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(201,214,222,0.3)_1px,transparent_1px)] [background-size:24px_24px]" />
              {!reduceMotion && <motion.div className="absolute left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-[var(--margin-blue)] to-transparent opacity-40" animate={{ top: ["0%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />}
              <div className="relative space-y-4">
                {["Amazon synced", "Variance detected", "Settlement checked", "Recovery surfaced"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <motion.span className="absolute h-full w-full rounded-full bg-[var(--margin-blue)]" animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.4, 0.2, 0.4] }} transition={{ duration: 2, delay: index * 0.4, repeat: Infinity }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--margin-blue)]" />
                    </div>
                    <div className="flex-1 border-b border-[var(--margin-border-subtle)] pb-2 text-[13px] font-medium tracking-tight text-[var(--margin-text-secondary)]">{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">The latest supported records are available.</h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">See missing proof, deadlines, response status, seller approvals, and the next required action without relying on another spreadsheet or one person’s memory.</p>
          </motion.article>

          <motion.article {...revealProps} transition={{ ...revealProps.transition, delay: 0.06 }} className="border-t border-[var(--margin-border)] pt-5">
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeIcons.slice(0, 4).map((iconId, index) => {
                    const icon = iconPool.find((item) => item.id === iconId);
                    return (
                      <div key={index} className="relative flex h-14 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--margin-border)] bg-white">
                        <AnimatePresence mode="wait">
                          <motion.img key={iconId} src={icon?.src} alt="" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="max-h-7 max-w-8 object-contain" />
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <div className="font-mono text-[18px] text-[var(--margin-text-muted)] opacity-40">→</div>
                <div className="rounded-[8px] border border-[var(--margin-border-subtle)] bg-[#F8FAFB] p-4">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--margin-text-muted)]">Finance Loop</div>
                  <div className="mt-3 space-y-2 text-[12px] font-medium tracking-tight text-[var(--margin-text-primary)]">
                    {["Expected", "Approved", "Paid", "Settled"].map((item) => <div key={item} className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-[var(--margin-blue)]" />{item}</div>)}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">Approved does not always mean paid.</h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">Compare the amount you expected, the amount Amazon approved, and the amount that actually reached your account. See underpayments, reversals, and unresolved amounts before they disappear into a settlement report.</p>
          </motion.article>

          <motion.article {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-t border-[var(--margin-border)] pt-5">
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="space-y-3">
                {[["Case prepared", "Complete", "success"], ["Evidence ready", "Ready", "success"], ["Seller review required", "Approval", "warning"], ["Approve filing", "Decision", "warning"]].map(([item, label, status]) => (
                  <div key={item} className="flex items-center justify-between border-b border-[var(--margin-border-subtle)] pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-colors", status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600")}><Check className="h-3.5 w-3.5" strokeWidth={3} /></div>
                      <span className="text-[13px] font-semibold tracking-tight text-[var(--margin-text-primary)]">{item}</span>
                    </div>
                    <span className={cn("font-mono text-[9px] font-bold uppercase tracking-tight", status === "success" ? "text-emerald-600/70" : "text-orange-600/70")}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">Know what needs you—and what no longer does.</h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">Margin prepares and monitors the recovery work in the background. You see what was found, what needs your approval, and whether the money arrived.</p>
          </motion.article>
        </div>
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
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Amazon can lose inventory, reverse a reimbursement, underpay a recovery, or leave a case unresolved. Margin checks your Amazon records, shows you what is supported, and helps move the recovery forward.</motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <Button onClick={onAuditCta} aria-label="Connect Amazon" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-6 text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Connect Amazon <ArrowRight className="ml-2 h-5 w-5" /></Button>
            <button type="button" onClick={onReportCta} className="group inline-flex h-[50px] w-full items-center justify-center px-1 text-[16px] font-semibold text-[#98A2B3] transition-colors duration-200 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] sm:h-11 sm:w-auto sm:justify-start sm:text-[15px]" aria-label="Use Amazon Reports">{reduceMotion ? <span className="leading-[1.25]">Use Amazon Reports</span> : <motion.span className="inline-block leading-[1.25] bg-[linear-gradient(110deg,#98A2B3_0%,#98A2B3_39%,#F8FAFC_50%,#BFC7D2_61%,#98A2B3_100%)] bg-[length:240%_100%] bg-clip-text text-transparent" initial={{ backgroundPosition: "-145% 0%" }} animate={{ backgroundPosition: ["-145% 0%", "145% 0%"] }} transition={{ duration: 1.9, delay: 1.45, repeat: Infinity, repeatDelay: 3.7, ease: [0.23, 1, 0.32, 1] }}>Use Amazon Reports</motion.span>}</button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="mt-5 flex w-full max-w-[780px] flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-300 sm:mt-8 sm:gap-x-5 sm:text-[12px]">
            <span>Free to run</span><span className="text-slate-600">·</span><span>Read-only access</span><span className="text-slate-600">·</span><span>You approve every submission</span>
          </motion.div>
          {isFull ? <div className="mt-5 max-w-[430px] rounded-[8px] bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
        </div>
      </div>
    </motion.section>
  );
}


function RecoveryWorkStatement() {
  return (
    <section className="border-b border-[var(--margin-border)] bg-[var(--margin-canvas)]">
      <div className="mx-auto w-full max-w-[1360px] border-t border-[var(--margin-border)] px-4 py-14 sm:px-8 md:py-20">
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
      <PublicNavbar variant="light" />
      
      <main>
        <KineticHeroSection onAuditCta={() => handleClaimAccessClick("hero_connect_amazon", "sp_api")} onReportCta={() => handleClaimAccessClick("hero_use_amazon_reports", "csv_upload")} isFull={isFull} nextBatchHours={nextBatchHours} />
        <RecoveryWorkStatement />

        <SectionTwo />
        <HowItWorksSection onCtaClick={() => handleClaimAccessClick("audit_output_section")} />
        <RecoveryTimelineSection />
        <RecoveryProofSections onAuditCta={handleClaimAccessClick} />
        <ExistingOperationFitSection />
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

        {/* Section 11 — Final CTA */}
        <section className="relative overflow-hidden border-t border-[var(--margin-border)] bg-[var(--margin-canvas)] py-12 md:py-18">
          <div className={containerClass}>
            <div className="relative border-y border-[var(--margin-border)] py-16 md:py-24">
              <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <motion.div {...revealProps}>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">
                      Final step
                    </span>
                  </div>
                  <h2 className="font-lora mt-2 max-w-[760px] text-[36px] leading-[1.02] tracking-tight sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
                    <span className="text-[var(--margin-text-primary)] font-lora">See what Amazon still owes—and what is already settled.</span>
                  </h2>
                  <p className="mt-8 max-w-[740px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px]">
                    Run a free Recovery Audit to see what Margin can establish, what may be recoverable, what proof is missing, and whether there is work worth managing.
                  </p>
                  <div className="mt-12 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => handleClaimAccessClick("homepage_early_access_section")}
                      className="landing-pressable group relative h-16 w-full rounded-[8px] bg-[var(--margin-blue)] px-10 text-[16px] font-bold text-white shadow-[0_18px_40px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow,transform] duration-150 max-md:shadow-none sm:w-auto"
                    >
                      <div className="absolute inset-0 rounded-[8px] bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      Run a free Recovery Audit
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                  <p className="mt-6 text-[14px] text-[var(--margin-text-muted)]">
                    Read-only access. No payment to run the Audit. Nothing is submitted without your approval.
                  </p>
                </motion.div>
                <motion.div {...revealProps} className="border-y border-[var(--margin-border)] bg-white/50 p-8 md:p-12">
                  {[
                    "Run the free Audit.",
                    "Review what is supported.",
                    "Decide whether there is work worth managing."
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
      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
