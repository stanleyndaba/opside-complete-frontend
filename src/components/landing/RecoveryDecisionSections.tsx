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
    title: "Resolve the supported recovery work in front of you.",
    subtitle: "Margin investigates a defined financial problem, establishes the supporting evidence, prepares justified recovery actions for authorization and documents the resulting outcome and any remaining limitations.",
    copy: "",
    itemHeading: "Best suited to",
    items: ["A material, bounded exposure that warrants investigation and managed recovery"],
    cta: "Discuss a Recover Once engagement",
    ctaLocation: "homepage_recover_once",
  },
  {
    label: "02 / FINANCIAL CONTROL PILOT",
    title: "See how your recovery operation performs under control.",
    subtitle: "Margin establishes a controlled operating process for recurring or complex exceptions, including investigation standards, evidence requirements, approval routes, ownership and financial outcome tracking.",
    copy: "",
    itemHeading: "Best suited to",
    items: ["Recurring exceptions or cross-functional recovery work that needs ongoing ownership"],
    cta: "Scope an Enterprise Control Pilot",
    ctaLocation: "homepage_control_pilot",
  },
  {
    label: "03 / ONGOING FINANCIAL CONTROL",
    title: "Keep recurring recovery and financial follow-through off your team's plate.",
    subtitle: "Margin maintains continuity across recurring financial examinations, evidence, authorized recovery work, Amazon responses and reconciliation, keeping the financial position and outstanding responsibilities current.",
    copy: "",
    itemHeading: "Best suited to",
    items: ["Recurring financial exceptions that require ongoing examination, continuity, and reconciliation"],
    cta: "Discuss ongoing control",
    ctaLocation: "homepage_recovery_workspace",
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
          <h2 className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Find out what your Amazon records can—and cannot—prove.</h2>
          <p className="audit-routing-body mt-6 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">Margin examines the Amazon records supplied for the review, connecting relevant transactions, settlement activity, inventory movements and adjustments to establish what the available evidence explains. It separates substantiated exposure from accounted-for activity, unresolved differences and conclusions that cannot yet be verified.</p>
          <p className="audit-routing-lead mt-5 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[#52616A] sm:text-[24px]" style={{ fontWeight: 400 }}>The Audit identifies what warrants further investigation, what supports a recovery, what additional records may be needed and what is already explained — before you commit to paid work.</p>
          <p className="mt-4 max-w-[760px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8"></p>
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
          <h2 id="recovery-audit-duplicate-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Make every resolved discrepancy easier to account for next time.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8">Margin preserves established evidence, prior decisions, linked financial events and verified outcomes so later investigations can build on what is already known. It can compare new activity against previously examined events, identify recurring patterns and distinguish a genuinely new discrepancy from a timing difference, reversal or previously resolved item.</p>
          <p className="mt-4 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[#52616A] sm:text-[24px]" style={{ fontWeight: 400 }}>Each examination adds to the record of what has been established, reducing the need to reconstruct the same financial history repeatedly.</p>
          <Link to="/sales" className="landing-pressable mt-6 inline-flex h-11 items-center rounded-[7px] bg-[#635BFF] px-6 text-[13px] font-bold text-white shadow-[0_18px_48px_rgba(99,91,255,0.24)] transition-colors hover:bg-[#5148E5]">Discuss an enterprise pilot <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </motion.div>
      </div>
    </div>
  </section>
);

const enterpriseOnboardingStages = [
  {
    period: "Day 1",
    title: "Agree what Margin is responsible for.",
    body: "Margin confirms the engagement scope, required records, access permissions, operating owners and approval boundaries. Your team starts with a defined examination and responsibility structure rather than an open-ended implementation.",
  },
  {
    period: "Days 1–5",
    title: "Find out what the records actually support.",
    body: "Margin examines the available records, traces material discrepancies and separates explained activity from unresolved exposure. The initial findings identify the evidence gaps, supported actions and decisions requiring your team&apos;s attention.",
  },
  {
    period: "By Day 25",
    title: "Put the agreed recovery process into operation.",
    body: "The agreed workflow is established: supported recovery actions are progressing through authorized stages, unresolved exceptions have owners and next steps, and reconciled items are documented. Leadership can inspect the position and monitor outstanding dependencies without personally coordinating each case.",
  },
];

export const EnterpriseOnboardingSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="enterprise-onboarding-section relative overflow-hidden bg-white py-12 sm:py-14 md:py-20" aria-labelledby="enterprise-onboarding-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[850px]">
        <h2 id="enterprise-onboarding-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>Know how your recovery operation will work before it goes live.</h2>
        <p className="mt-5 max-w-[780px] text-[16px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[18px] md:leading-8">During the defined 30–45 day engagement, Margin works with your team to examine the agreed records, establish the initial financial position, configure the recovery and control workflow, and assign responsibility to outstanding exceptions. The engagement establishes a documented operating process and agreed control state; Amazon&apos;s decisions and payment timelines remain external dependencies.</p>
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
        <p className="text-[14px] font-semibold leading-6 text-[#182026] md:text-[15px]">The engagement does not promise that every recovery will be completed by Day 25. It establishes the agreed operating state, with Amazon response times, further evidence requirements and payment timing tracked as external dependencies.</p>
        <p className="mt-1 text-[14px] leading-6 text-[#4D5B66] md:text-[15px] md:leading-7">By that point, the agreed operating state is established: reconciled items, supported recovery actions, unresolved exceptions, accountable owners, and defined next steps. Amazon response times and payment timing remain visible dependencies—not hidden assumptions.</p>
      </motion.div>

      <motion.div {...revealProps} className="mt-8 md:mt-10">
        <Button onClick={() => onAuditCta("enterprise_onboarding_timeline")} className="landing-pressable h-11 rounded-[7px] bg-[#635BFF] px-6 text-[13px] font-bold text-white shadow-[0_18px_48px_rgba(99,91,255,0.24)] transition-colors hover:bg-[#5148E5]">Discuss an Enterprise Pilot</Button>
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
          <h2 id="recovery-routing-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Start with the problem. Choose only the work it justifies.</h2>
          <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#182026] md:text-[17px] md:leading-8">The free Audit establishes the financial position supported by the records available, identifies material unresolved differences and determines whether further investigation or recovery is justified. Margin then scopes any proposed engagement around the nature of the problem, evidence requirements, operational complexity and level of ongoing responsibility required.</p>
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
              <div className="mt-8 pt-2">
                <Button onClick={() => onAuditCta(option.ctaLocation)} className="routing-card-button inline-flex h-12 min-w-0 w-full max-w-full items-center justify-center whitespace-nowrap rounded-[6px] bg-white px-2 text-center text-[11px] font-semibold leading-5 text-[#312E81] shadow-sm hover:bg-[#F1F0FF] sm:w-auto sm:px-6 sm:text-[14px]">
                  {option.cta}<ChevronRight className="ml-2 h-4 w-4 text-[#312E81]" />
                </Button>
              </div>
            </motion.div>
          )})}
        </div>
        <motion.div {...revealProps} className="routing-note mt-9 border-l-2 border-[var(--margin-border)] pl-5">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#182026]">Not sure what the records support? Start with the Audit.</p>
          <p className="mt-2 text-[14px] leading-6 text-[#182026]">The Audit establishes what the available records support before you commit to paid work. Its findings determine whether a defined recovery, a control engagement, ongoing oversight or no further action is appropriate.</p>
        </motion.div>
      </div>
    </section>
  );
};
