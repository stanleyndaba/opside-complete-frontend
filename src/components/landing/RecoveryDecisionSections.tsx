import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

interface LandingAuditCtaProps {
  onAuditCta: (location: string) => void;
}

const pathOptions = [
  {
    label: "01 / DEFINED ENGAGEMENT",
    title: "Recover Once",
    subtitle: "One defined financial exposure. Managed through to a documented outcome.",
    copy: "Margin establishes what happened, determines what the evidence supports, prepares authorized recovery actions, manages follow-up within scope, and verifies the financial result.",
    followUp: "Best suited to: a material, bounded exposure that warrants investigation and managed recovery.",
    itemHeading: "Best suited to",
    cta: "Discuss a Recover Once engagement",
    ctaLocation: "homepage_recover_once",
    items: ["A material, bounded exposure that warrants investigation and managed recovery"],
  },
  {
    label: "02 / CONTROL PILOT",
    title: "30–45 Day Control Pilot",
    subtitle: "Establish the process for a broader or recurring control problem.",
    copy: "Margin works with Finance and Operations to establish the financial position, define ownership and approval boundaries, and put agreed recovery and reconciliation workflows into operation.",
    followUp: "Best suited to: businesses with recurring exceptions or cross-functional recovery work that needs ongoing ownership.",
    itemHeading: "Best suited to",
    cta: "Scope an Enterprise Control Pilot",
    ctaLocation: "homepage_control_pilot",
    items: ["Recurring exceptions or cross-functional recovery work that needs ongoing ownership"],
  },
  {
    label: "03 / ONGOING CONTROL",
    title: "Recovery Workspace",
    subtitle: "Keep recurring financial exceptions under examination.",
    copy: "For businesses that need ongoing review, evidence continuity, response handling, reversal monitoring and reconciliation across new and unresolved financial events.",
    followUp: "Best suited to: recurring financial exceptions that require ongoing examination, continuity, and reconciliation.",
    itemHeading: "Best suited to",
    cta: "Discuss ongoing control",
    ctaLocation: "homepage_recovery_workspace",
    items: ["Recurring financial exceptions that require ongoing examination, continuity, and reconciliation"],
  },
];

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export const RecoveryOfferSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="audit-routing-section relative bg-white py-10 sm:py-10 md:py-14">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} className="audit-routing-copy order-1 max-w-[780px] lg:order-1">
          <h2 className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Know the account&apos;s financial position before you decide what to hand over.</h2>
          <div className="audit-routing-body mt-6 max-w-[760px] space-y-4 text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">
            <p><span className="font-semibold text-[#182026]">Before:</span> The Audit begins with one financial question: Does the money reconcile at event level?</p>
            <p><span className="font-semibold text-[#182026]">Now:</span> Margin examines shipments, returns, fees, reimbursements, settlements, inventory movements, and related account records as one control population. It establishes what is accounted for, what is supported, what remains unresolved, what requires evidence, and what should not be treated as recoverable.</p>
          </div>
          <p className="audit-routing-lead mt-5 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[#52616A] sm:text-[24px]" style={{ fontWeight: 400 }}>The Audit does not turn every variance into a claim. It establishes the operating position first.</p>
          <p className="mt-4 max-w-[760px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8">You leave with a controlled view of the account—what requires action, what can be handed over, and what is already accounted for.</p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 lg:order-2">
          <FinalDelegationPreview compactMobile tallMobile src="/recovery-workspace" title="Recovery Workspace page preview" />
        </motion.div>
      </div>

    </div>
  </section>
);

export const RecoveryOfferSectionDuplicate: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="enterprise-routing-section relative bg-white py-10 sm:py-10 md:py-14" aria-labelledby="recovery-audit-duplicate-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[1.26fr_0.74fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 lg:order-1">
          <FinalDelegationPreview compactMobile tallMobile src="/accuracy-graph" title="Accuracy Graph page preview" />
        </motion.div>
        <motion.div {...revealProps} className="enterprise-routing-copy order-1 max-w-[780px] lg:order-2">
          <h2 id="recovery-audit-duplicate-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Every recovery makes the next one smarter.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8">Margin preserves what each examination establishes—evidence, decisions, outcomes, and unresolved exposure—so recurring exceptions can be assessed with existing context instead of starting from zero.</p>
          <p className="mt-4 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[#52616A] sm:text-[24px]" style={{ fontWeight: 400 }}>Recovery becomes a lasting operating advantage.</p>
          <Link to="/sales" className="landing-pressable mt-6 inline-flex h-11 items-center rounded-[7px] bg-[#0B74DE] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(11,116,222,0.18)] transition-colors hover:bg-[#075EBA]">Discuss an enterprise pilot <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </motion.div>
      </div>
    </div>
  </section>
);

const enterpriseOnboardingStages = [
  {
    period: "Day 1",
    title: "Establish the mandate",
    body: "Confirm scope, access, operating owners, and the records required to begin. Your team receives a bounded starting plan rather than another open-ended implementation request.",
  },
  {
    period: "Days 1–5",
    title: "Establish the financial position",
    body: "Margin examines the available records, separates reconciled activity from unresolved exposure, and identifies the evidence and decisions that require attention.",
  },
  {
    period: "By Day 25",
    title: "Put recovery under control",
    body: "The agreed operating state is in place: supported actions are moving, exceptions have owners, outstanding items have defined next steps, and leadership can monitor the position without carrying the work.",
  },
];

export const EnterpriseOnboardingSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="enterprise-onboarding-section relative overflow-hidden bg-white py-12 sm:py-14 md:py-20" aria-labelledby="enterprise-onboarding-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[850px]">
        <h2 id="enterprise-onboarding-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>Establish a controlled recovery operation in 25 days.</h2>
        <p className="mt-5 max-w-[780px] text-[16px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[18px] md:leading-8">In a defined 30–45 day engagement, Margin works with your team to establish the financial position, put supported recovery actions in motion, assign ownership to unresolved exceptions, and create a documented operating process. The engagement establishes the agreed operating state. Amazon responses and payment timelines remain external dependencies.</p>
      </motion.div>

      <div className="mt-10 overflow-x-auto pb-4 [scrollbar-width:thin] md:mt-14">
        <div className="relative grid min-w-[930px] grid-cols-3 gap-5 md:gap-8">
          <div className="pointer-events-none absolute left-[8%] right-[8%] top-[18px] hidden h-px bg-[#B8C5CC] md:block" aria-hidden="true" />
          {enterpriseOnboardingStages.map((stage, index) => (
            <motion.article key={stage.period} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.1 }} className="relative pt-12">
              <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#7A8994] bg-[#F6F8F9] font-mono text-[11px] font-semibold text-[#182026]">0{index + 1}</div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#5E6D76]">{stage.period}</p>
              <h3 className="mt-3 max-w-[300px] font-lora text-[27px] leading-[1.05] tracking-[-0.035em] text-[#182026] sm:text-[32px]" style={{ fontWeight: 400 }}>{stage.title}</h3>
              <p className="mt-4 max-w-[350px] text-[14px] leading-6 text-[#4D5B66] md:text-[15px] md:leading-7">{stage.body}</p>
            </motion.article>
          ))}
        </div>
      </div>

      <motion.div {...revealProps} className="mt-5 max-w-[900px] border-l-2 border-[#AABAC3] pl-5 md:mt-8">
        <p className="text-[14px] font-semibold leading-6 text-[#182026] md:text-[15px]">The objective is not to imply that every recovery is complete by Day 25.</p>
        <p className="mt-1 text-[14px] leading-6 text-[#4D5B66] md:text-[15px] md:leading-7">By that point, the agreed operating state is established: reconciled items, supported recovery actions, unresolved exceptions, accountable owners, and defined next steps. Amazon response times and payment timing remain visible dependencies—not hidden assumptions.</p>
      </motion.div>

      <motion.div {...revealProps} className="mt-8 md:mt-10">
        <Button onClick={() => onAuditCta("enterprise_onboarding_timeline")} className="landing-pressable h-11 rounded-[7px] bg-[#0B74DE] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(11,116,222,0.18)] transition-colors hover:bg-[#075EBA]">Discuss an Enterprise Pilot</Button>
      </motion.div>
    </div>
  </section>
);

export const RecoveryRoutingSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => {
    const [activePath, setActivePath] = useState<number | null>(null);
  
    return (
    <section className="recovery-routing-section relative bg-white py-10 sm:py-10 md:py-14" aria-labelledby="recovery-routing-title">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <motion.div {...revealProps} className="routing-copy max-w-[760px]">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">24 / ROUTING</span>
          </div>
          <h2 id="recovery-routing-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Engagements designed around your financial operations.</h2>
          <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#182026] md:text-[17px] md:leading-8">Margin scopes each engagement around the financial exposure, evidence requirements, operational complexity, and level of recovery responsibility involved.</p>
        </motion.div>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 lg:flex-row" onMouseLeave={() => setActivePath(null)}>
          {pathOptions.map((option, index) => {
            const cardBackground = index === 0
              ? '/assets/recover-once-card-background.png'
              : index === 1
                ? '/assets/control-pilot-card-background-b.png'
                : '/assets/ongoing-control-card-background.png';
            const backgroundStyle = {
              backgroundImage: `linear-gradient(rgba(8, 12, 24, 0.28), rgba(8, 12, 24, 0.28)), url(${cardBackground})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            };
            
            return (
            <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} onMouseEnter={() => setActivePath(index)} animate={{ flexGrow: activePath === null ? 1 : activePath === index ? 1.14 : 0.86 }} style={backgroundStyle} className={`relative rounded-[8px] p-6 text-white sm:p-8 md:p-10 transition-[filter,opacity] duration-500 will-change-[filter,opacity] lg:min-w-0 lg:flex-1 ${activePath !== null && activePath !== index ? "lg:blur-[2.5px] lg:opacity-55" : "lg:blur-0 lg:opacity-100"}`}>
              <p className="routing-card-label font-mono text-[11px] font-semibold uppercase tracking-tight text-white">{option.label}</p>
              <h3 className="routing-card-heading mt-4 font-lora text-[29px] leading-[1.04] tracking-[-0.04em] text-white sm:text-[36px] md:text-[42px]" style={{ fontWeight: 500 }}>{option.title}</h3>
              <p className="routing-card-subtitle mt-3 max-w-[520px] font-lora text-[19px] leading-[1.12] tracking-[-0.03em] text-[#FFFDF9] sm:text-[22px]">{option.subtitle}</p>
              <p className="routing-card-copy mt-4 max-w-[520px] text-[14px] leading-6 text-white md:text-[15px] md:leading-7">{option.copy}</p>
              <p className="routing-card-copy mt-3 max-w-[520px] text-[14px] leading-6 text-white md:text-[15px] md:leading-7">{option.followUp}</p>
              <div className="mt-6 border-y border-white/25">
                <p className="routing-card-item-heading py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">{option.itemHeading}</p>
                <div className="grid gap-0 sm:grid-cols-2">
                  {option.items.map((item) => (
                    <div key={item} className="routing-card-item flex items-start gap-2 border-t border-white/25 py-3 text-[12px] leading-5 text-white sm:pr-4 md:text-[13px]">
                      <Check className="routing-card-item-icon mt-0.5 h-4 w-4 shrink-0 text-white" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-7 pt-2">
                <Button onClick={() => onAuditCta(option.ctaLocation)} className="routing-card-button inline-flex h-12 min-w-0 w-full max-w-full items-center justify-center whitespace-nowrap rounded-[6px] bg-white px-2 text-center text-[11px] font-semibold leading-5 text-[#312E81] shadow-sm hover:bg-[#F1F0FF] sm:w-auto sm:px-6 sm:text-[14px]">
                  {option.cta}<ChevronRight className="ml-2 h-4 w-4 text-[#312E81]" />
                </Button>
              </div>
            </motion.div>
          )})}
        </div>
        <motion.div {...revealProps} className="routing-note mt-9 border-l-2 border-[var(--margin-border)] pl-5">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#182026]">Not ready to choose the operating path? Start with the financial position.</p>
          <p className="mt-2 text-[14px] leading-6 text-[#182026]">The Audit is free. It tells you whether the account carries a defined exposure, a recurring control problem, or no supported recovery to manage — before you pay or commit.</p>
        </motion.div>
      </div>
    </section>
  );
};
