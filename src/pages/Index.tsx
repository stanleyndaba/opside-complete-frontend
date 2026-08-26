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
    <section data-navbar-theme="dark" className="relative border-none bg-[#101827] py-32 text-white md:py-56">
      <div className={containerClass}>
        <div className="grid gap-16 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <motion.div {...revealProps}>
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-blue-500/50" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-400">The difference</span></div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-white md:text-[76px]" style={{ fontWeight: 400 }}>Finding the issue is only the first step.</h2>
            <p className="mt-8 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">Most recovery tools find or file a claim. The hard part comes after: proving the issue, keeping the case moving, responding to Amazon, and knowing whether the money actually arrived.</p>
            <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">Margin keeps the proof, your approval, the case, the response, and the payout outcome in one recovery record.</p>
            <p className="mt-6 text-[17px] font-semibold leading-8 tracking-[-0.015em] text-blue-100 md:text-[19px]">You see the proof and the next decision. Margin keeps the recovery work moving.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative">
            <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_38px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl md:p-8">
              <div className="h-0.5 w-12 bg-[var(--margin-blue)]" />
              <p className="mt-8 font-mono text-[11px] font-semibold uppercase tracking-tight text-slate-400">Most tools find a claim. Margin follows it through.</p>
              <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {[
                  ["Find or flag an issue", "Show what supports the issue"],
                  ["File a claim", "Prepare the proof and wait for your approval"],
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
  return (
    <section className="border-b border-[#CCD2D0] bg-[#EEF0EC] py-24 sm:py-32 lg:py-40">
      <div className={containerClass}>
        <div className="grid gap-14 lg:grid-cols-[0.84fr_1.16fr] lg:gap-20">
          <div className="lg:pt-5">
            <h2 className="max-w-[560px] font-lora text-[40px] leading-[1.02] tracking-[-0.045em] text-[#1B252A] sm:text-[52px] lg:text-[64px]" style={{ fontWeight: 400 }}>Approved does not always mean paid.</h2>
            <p className="mt-7 max-w-[520px] text-[17px] leading-8 text-[#536068] sm:text-[18px]">A case status can say approved while the amount is delayed, partial, reversed, or still missing from the settlement. Margin separates the case status from the final money outcome.</p>
            <p className="mt-6 text-[16px] font-semibold leading-7 text-[#1B252A] md:text-[18px]">A case status is not the money outcome.</p>
            <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-[#536068] md:text-[16px]">Margin gives operations and finance the same recovery record: what happened, what proof exists, what was approved, what was paid, and what still needs attention.</p>
          </div>
          <div className="border-y border-[#AEB8B5]">
            <div className="border-b border-[#AEB8B5] py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#66716C]">Money state</div>
            <div className="divide-y divide-[#C6CECB]">
              {[
                ["Expected", "What the supported recovery should be worth."],
                ["Approved", "What Amazon said it would reimburse or resolve."],
                ["Paid", "What appeared in the relevant settlement or payment record."],
                ["Reversed", "What was later adjusted or taken back."],
                ["Still unresolved", "What remains open, short, missing, or waiting for a next action."],
              ].map(([state, detail]) => (
                <div key={state} className="grid gap-3 py-5 sm:grid-cols-[14px_170px_1fr] sm:gap-5 sm:py-6">
                  <span aria-hidden="true" className="mt-1 hidden h-8 w-px bg-[#52625C] sm:block" />
                  <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#1B252A]">{state}</h3>
                  <p className="max-w-[430px] text-[14px] leading-6 text-[#536068]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
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
  return (
    <section data-navbar-theme="dark" className="relative overflow-hidden bg-[#141B22] px-5 pb-16 pt-28 text-white sm:px-8 sm:pb-24 sm:pt-36 lg:px-12 lg:pb-32" aria-labelledby="margin-hero-title">
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1320px]">
        <div className="grid gap-14 border-b border-white/15 pb-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.78fr)] lg:items-end lg:gap-20 lg:pb-20">
          <div className="max-w-[760px]">
            <p className="text-[13px] font-medium leading-6 text-[#C4CDD5] sm:text-[15px]">For Amazon FBA sellers with an unresolved recovery—or recovery work they are tired of carrying themselves.</p>
            <h1 id="margin-hero-title" className="mt-6 max-w-[720px] font-lora text-[46px] leading-[0.98] tracking-[-0.045em] text-[#F7F5EF] min-[390px]:text-[54px] sm:mt-8 sm:text-[72px] lg:text-[88px]" style={{ fontWeight: 400 }}>
              Find what Amazon missed. Get it handled.<br />
              Know it was paid.
            </h1>
            <p className="mt-7 max-w-[610px] text-[17px] leading-8 text-[#C4CDD5] sm:text-[19px] sm:leading-9">When an Amazon inventory, reimbursement, return, inbound, fee, or settlement record does not add up, Margin shows what is supported, handles the recovery work you approve, and checks the final money outcome.</p>
            <div className="mt-9">
              <Button onClick={onAuditCta} aria-label="Run a free Recovery Audit" className="landing-pressable h-[54px] w-full rounded-none bg-[#E5EBF0] px-7 text-[15px] font-semibold text-[#17202B] hover:bg-white sm:w-auto sm:px-9 sm:text-[16px]">Run a free Recovery Audit</Button>
            </div>
            <div className="mt-10 grid border-y border-white/15 text-left sm:grid-cols-3">
              <p className="border-b border-white/15 py-4 text-[14px] leading-6 text-[#E7EBEF] sm:border-b-0 sm:border-r sm:pr-5">Read-only access</p>
              <p className="border-b border-white/15 py-4 text-[14px] leading-6 text-[#E7EBEF] sm:border-b-0 sm:border-r sm:px-5">No payment to run the Audit</p>
              <p className="py-4 text-[14px] leading-6 text-[#E7EBEF] sm:pl-5">Nothing is submitted without your approval</p>
            </div>
            {isFull ? <div className="mt-6 max-w-[520px] border-l border-[#8FA8BF] pl-4 text-[14px] leading-6 text-[#C4CDD5]"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
          </div>
          <div aria-hidden="true" className="border border-white/20 bg-[#EDEDE7] p-4 sm:p-6 lg:p-7">
            <div className="border-b border-[#C8CFD0] pb-5"><div className="h-2 w-24 bg-[#17202B]" /><div className="mt-4 h-px w-full bg-[#C8CFD0]" /></div>
            <div className="mt-7 grid grid-cols-[1.15fr_0.85fr] gap-4 border-b border-[#C8CFD0] pb-7"><div className="space-y-3"><div className="h-3 w-4/5 bg-[#17202B]/85" /><div className="h-3 w-3/5 bg-[#82908D]" /><div className="h-3 w-2/5 bg-[#C8CFD0]" /></div><div className="border-l border-[#C8CFD0] pl-4"><div className="h-16 border border-[#82908D]" /><div className="mt-3 h-2 w-full bg-[#C8CFD0]" /></div></div>
            <div className="space-y-4 py-7"><div className="grid grid-cols-[88px_1fr] gap-4"><div className="h-2 bg-[#82908D]" /><div className="h-2 bg-[#C8CFD0]" /></div><div className="grid grid-cols-[88px_1fr] gap-4"><div className="h-2 bg-[#82908D]" /><div className="h-2 w-4/5 bg-[#C8CFD0]" /></div><div className="grid grid-cols-[88px_1fr] gap-4"><div className="h-2 bg-[#82908D]" /><div className="h-2 w-3/5 bg-[#C8CFD0]" /></div></div>
            <div className="border-t border-[#C8CFD0] pt-5"><div className="h-2 w-2/5 bg-[#17202B]/85" /></div>
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

  const handleClaimAccessClick = (location: string, sourceType: 'sp_api' | 'csv_upload' = 'sp_api') => {
    trackEarlyAccessCtaClicked(location);
    navigate(sourceType === 'sp_api' ? '/audit' : '/data-upload');
  };

  return (
    <div className="margin-landing-editorial min-h-screen bg-[var(--margin-canvas)] selection:bg-[var(--margin-blue)]/16 selection:text-[var(--margin-text-primary)]">
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
