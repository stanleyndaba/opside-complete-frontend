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
  FileCheck2,
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
      "For a Connected Audit, Margin uses read-only access to examine the Amazon records needed to reconcile your account. Margin does not file claims or take consequential action during the Audit. If you prefer not to connect Amazon, you can use the Manual-Report Audit and upload your Amazon operational reports instead.",
  },
  {
    question: "Can Margin submit something without me?",
    answer:
      "No. You review and approve a recovery before it is submitted. Margin prepares the work and tracks what happens after your decision.",
  },
  {
    question: "What happens if Margin does not find anything to handle?",
    answer:
      "You still receive a clear Audit result. Margin shows what was checked, what appears settled, what may need more evidence or time, and whether there is any next action worth taking.",
  },
  {
    question: "How does Recover Once pricing work?",
    answer:
      "If the Audit identifies a defined recovery Margin can take over, you receive a personalized fixed quote before any paid work begins. The quote states what Margin will handle, what you need to approve, and what outcome record you will receive.",
  },
  {
    question: "What if I want Margin to keep looking?",
    answer:
      "If your Audit shows recurring recovery work that you want off your team’s plate, Recovery Workspace keeps the evidence, cases, responses, and payout tracking together over time.",
  },
  {
    question: "What does payout verified mean?",
    answer:
      "Margin compares the current supported recovery amount with the relevant Amazon approval and payment or settlement records, then keeps partial payments, reversals, and unresolved balances visible instead of treating every approval as final.",
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
    <section data-navbar-theme="dark" className="relative border-none bg-[#101827] py-32 text-white md:py-56">
      <div className={containerClass}>
        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <motion.div {...revealProps}>
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-blue-500/50" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-400">The difference</span></div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-white md:text-[76px]" style={{ fontWeight: 400 }}>Finding the issue is only the first step.</h2>
            <p className="mt-8 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">Most recovery tools stop at the claim. The real work starts after the issue is found: collecting the proof, keeping the case together, meeting the deadline, responding to Amazon, and checking whether the money actually arrived.</p>
            <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">Margin keeps the evidence, approval, case, response, and payout connected in one recovery record.</p>
            <p className="mt-6 text-[17px] font-semibold leading-8 tracking-[-0.015em] text-blue-100 md:text-[19px]">You see the proof and the next decision. Margin keeps the recovery work moving.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative">
            <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_38px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-8">
              <div className="h-0.5 w-12 bg-[var(--margin-blue)]" />
              <p className="mt-8 font-mono text-[11px] font-semibold uppercase tracking-tight text-slate-400">Most tools find a claim. Margin follows it through.</p>
              <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {[
                  ["Find an issue", "Find the issue and show what supports it"],
                  ["File or flag a claim", "Prepare the proof and wait for your approval"],
                  ["Show a case status", "Keep the response, next action, and deadline visible"],
                  ["Mark it complete", "Verify what Amazon paid, what reversed, and what is still unresolved"],
                ].map(([other, margin]) => (
                  <div key={other} className="grid gap-2 py-4 sm:grid-cols-2 sm:gap-5">
                    <p className="text-[13px] leading-6 text-slate-500">{other}</p>
                    <p className="text-[13px] font-medium leading-6 text-white">{margin}</p>
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
    { id: "adobe", src: "/dobe.png" }
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
    <section
      className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[860px] text-center">
          <div className={sectionLabelClass}>Payout and financial clarity</div>
          <h2 className="mt-3 font-lora text-[34px] leading-[1.03] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
            Approved does not always mean paid.
          </h2>
          <p className="mx-auto mt-8 max-w-[760px] text-[16px] leading-8 text-[var(--margin-text-secondary)] md:text-[18px]">
            A case status can say approved while the amount is delayed, partial, reversed, or still missing from settlement. Margin compares what you expected, what Amazon approved, and what actually reached your account.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          {/* Tile 1: Operations Scan */}
          <motion.article
            {...revealProps}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(201,214,222,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(201,214,222,0.3)_1px,transparent_1px)] [background-size:24px_24px]" />
              
              {!reduceMotion && (
                <motion.div 
                  className="absolute left-0 right-0 z-10 h-[1px] bg-gradient-to-r from-transparent via-[var(--margin-blue)] to-transparent opacity-40"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              )}

              <div className="relative space-y-4">
                {[
                  "Amazon synced",
                  "Variance detected",
                  "Settlement checked",
                  "Recovery surfaced",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <motion.span
                        className="absolute h-full w-full rounded-full bg-[var(--margin-blue)]"
                        animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.4, 0.2, 0.4] }}
                        transition={{ duration: 2, delay: index * 0.4, repeat: Infinity }}
                      />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--margin-blue)]" />
                    </div>
                    <div className="flex-1 border-b border-[var(--margin-border-subtle)] pb-2 text-[13px] font-medium tracking-tight text-[var(--margin-text-secondary)]">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">
              The latest supported records are available.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              See missing proof, deadlines, response status, seller approvals, and the next required action without relying on another spreadsheet or one person’s memory.
            </p>
          </motion.article>

          {/* Tile 2: Finance Reconciliation */}
          <motion.article
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.06 }}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeIcons.slice(0, 4).map((iconId, index) => {
                    const icon = iconPool.find(i => i.id === iconId);
                    return (
                      <div
                        key={index}
                        className="relative flex h-14 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--margin-border)] bg-white"
                      >
                        <AnimatePresence mode="wait">
                          <motion.img 
                            key={iconId}
                            src={icon?.src} 
                            alt="" 
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="max-h-7 max-w-8 object-contain" 
                          />
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <div className="font-mono text-[18px] text-[var(--margin-text-muted)] opacity-40">→</div>
                <div className="rounded-[8px] border border-[var(--margin-border-subtle)] bg-[#F8FAFB] p-4">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--margin-text-muted)]">
                    Money state
                  </div>
                  <div className="mt-3 space-y-2 text-[12px] font-medium tracking-tight text-[var(--margin-text-primary)]">
                    {["Expected", "Approved", "Paid", "Reversed", "Still unresolved"].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-[var(--margin-blue)]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">
              A case status is not the money outcome.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              See what the supported records indicate: expected, approved, paid, reversed, or still unresolved. Approval is kept distinct from the payout outcome.
            </p>
          </motion.article>

          {/* Tile 3: Decision Visibility */}
          <motion.article
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.12 }}
            className="border-t border-[var(--margin-border)] pt-5"
          >
            <div className="relative h-[210px] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 shadow-[0_18px_48px_rgba(27,28,32,0.045)]">
              <div className="space-y-3">
                {[
                  ["Case prepared", "Complete", "success"],
                  ["Evidence ready", "Ready", "success"],
                  ["Seller review required", "Approval", "warning"],
                  ["Approve filing", "Decision", "warning"],
                ].map(([item, label, status], index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between border-b border-[var(--margin-border-subtle)] pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                        status === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                      )}>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-semibold tracking-tight text-[var(--margin-text-primary)]">
                        {item}
                      </span>
                    </div>
                    <span className={cn(
                      "font-mono text-[9px] font-bold uppercase tracking-tight",
                      status === "success" ? "text-emerald-600/70" : "text-orange-600/70"
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-[var(--margin-text-primary)]">
              Know what needs you—and what no longer does.
            </h3>
            <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              Margin prepares and monitors the recovery work in the background. You see what was found, what needs your approval, and whether the money arrived.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function KineticHeroSection({
  onAuditCta,
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
      className="relative isolate flex min-h-svh overflow-hidden agentic-scan-subtle bg-[radial-gradient(circle_at_20%_18%,rgba(11,116,222,0.18),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(46,125,91,0.12),transparent_32%),linear-gradient(135deg,#101827_0%,#06080C_54%,#000000_100%)] px-4 pb-16 pt-28 text-white sm:px-6 sm:pb-24 sm:pt-40 md:min-h-screen md:px-8 md:pb-44 md:pt-40"
      aria-labelledby="margin-hero-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")" }} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden"><motion.div className="absolute left-[-16%] top-[42%] h-px w-[62%] origin-left bg-gradient-to-r from-transparent via-[rgba(11,116,222,0.52)] to-transparent opacity-60" animate={reduceMotion ? undefined : { x: ["0%", "118%"], opacity: [0, 0.62, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ rotate: "-8deg" }} /></div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center">
        <div className="max-w-[1040px]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="inline-block max-w-full truncate whitespace-nowrap overflow-hidden text-ellipsis rounded-[5px] bg-white/[0.07] px-4 py-2 text-left text-[9px] font-semibold leading-relaxed uppercase tracking-tight text-blue-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl sm:px-3 sm:py-1.5 sm:text-[11px]">Amazon FBA recovery and payout visibility</motion.div>
          <div id="margin-hero-title" className="mt-6 max-w-[1040px] font-lora text-[42px] leading-[0.96] tracking-[-0.045em] min-[390px]:text-[48px] sm:mt-7 sm:text-[68px] md:text-[82px] lg:text-[96px]" style={{ fontWeight: 400 }}>
            <motion.span className="block text-white" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Find what Amazon missed. Get it handled.</motion.span>
            <motion.span className="block text-slate-400" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>Know it was paid.</motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[760px] text-[15px] leading-[1.6] text-slate-300 sm:mt-8 sm:text-[18px] sm:leading-[1.75] md:text-[20px]">Amazon can lose inventory, underpay a recovery, reverse a reimbursement, or leave a case unresolved. Margin finds supported recovery issues, prepares the evidence and recovery work you approve, and verifies what Amazon actually paid.</motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 sm:mt-10">
            <Button onClick={onAuditCta} aria-label="Run a free Recovery Audit" className="landing-pressable group relative h-[54px] w-full justify-center overflow-hidden rounded-[8px] bg-[var(--margin-blue)] px-6 text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-[background-color,box-shadow] duration-200 hover:bg-[var(--margin-blue-hover)] sm:h-[56px] sm:w-auto sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />Run a free Recovery Audit <ArrowRight className="ml-2 h-5 w-5" /></Button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="mt-5 flex w-full max-w-[780px] flex-wrap items-center gap-x-3 gap-y-1 border-y border-white/10 py-3 text-[11px] font-medium text-slate-300 sm:mt-8 sm:gap-x-5 sm:border-0 sm:py-0 sm:text-[12px]">
            <span>Read-only access</span><span className="text-slate-600">·</span><span>No payment to run the Audit</span><span className="text-slate-600">·</span><span>Nothing is submitted without your approval</span>
          </motion.div>
          {isFull ? <div className="mt-5 max-w-[430px] rounded-[8px] bg-white/[0.07] p-4 text-sm leading-6 text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)] backdrop-blur-xl"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
        </div>
      </div>
    </motion.section>
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
        <KineticHeroSection onAuditCta={() => handleClaimAccessClick("hero_section")} isFull={isFull} nextBatchHours={nextBatchHours} />

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
                <span className="text-[var(--margin-text-primary)] font-lora">Before you connect.</span> <span className="text-[var(--margin-text-muted)] font-lora">A few things to know.</span>
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
                      See what Amazon may have missed
                    </span>
                  </div>
                  <h2 className="font-lora mt-2 max-w-[760px] text-[36px] leading-[1.02] tracking-tight sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
                    <span className="text-[var(--margin-text-primary)] font-lora">Find out what is unresolved in your account.</span>
                  </h2>
                  <p className="mt-8 max-w-[740px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px]">
                    Run a free Recovery Audit to see what Margin can establish, what may be recoverable, what proof is missing, and what the next sensible step is.
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
                    "No payment required.",
                    "Read-only access.",
                    "See findings before deciding."
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
