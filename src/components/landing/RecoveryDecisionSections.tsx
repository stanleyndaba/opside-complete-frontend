import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

interface LandingAuditCtaProps {
  onAuditCta: (location: string) => void;
}

const pathOptions = [
  {
    label: "Recover Once",
    title: "One supported exposure. One accountable closeout.",
    copy: "For a defined financial exposure, Recover Once gives you a fixed-scope operation with a clear beginning and end. Margin establishes entitlement, prepares the evidence, manages the approved submission, follows the response through settlement, and returns a closed financial record — not another claim to chase.",
    price: "Personalized fixed scope after the Audit.",
    cta: "Start the Audit — Recover Once",
    ctaLocation: "homepage_recover_once",
    items: ["Event-level entitlement", "Evidence-backed preparation", "Seller-approved submission", "Response and appeal control", "Settlement verification"],
  },
  {
    label: "Recovery Workspace",
    title: "Keep the account under financial control.",
    copy: "For sellers with recurring exposure, Workspace keeps the account under examination after the first Audit. Margin identifies new financial events, maintains evidence and case continuity, tracks responses and settlements, and keeps the unresolved position visible — so the next problem does not become your team's next project.",
    price: "$109/month",
    subPrice: "0% recovery commission · 100% of Amazon reimbursements stay yours.",
    cta: "Start the Audit — Workspace",
    ctaLocation: "homepage_recovery_workspace",
    items: ["Recurring account examination", "New exposure detection", "Evidence and case continuity", "Response, reversal, and payout tracking", "One accountable financial record"],
  },
];

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export const RecoveryOfferSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="audit-routing-section relative bg-[#F6F8F9] py-10 sm:py-10 md:py-14">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} className="audit-routing-copy order-1 max-w-[780px] lg:order-1">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">21 / THE AUDIT</span>
          </div>
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
          <FinalDelegationPreview compactMobile tallMobile src="/speak-to-sales" title="Enterprise Recovery Assessment page preview" />
        </motion.div>
        <motion.div {...revealProps} className="enterprise-routing-copy order-1 max-w-[780px] lg:order-2">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">20 / ENTERPRISE</span>
          </div>
          <h2 id="recovery-audit-duplicate-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Your finance team should not have to reconstruct the business from every recovery.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8">At scale, recovery is no longer a sequence of isolated cases. It is a control problem across marketplaces, legal entities, catalogs, fulfilment networks, settlement periods, and operating teams. When those records are not connected, Finance cannot reliably determine what has been recovered, what remains exposed, who owns the position, or whether the outcome reached the books.</p>
          <p className="mt-4 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[17px] md:leading-8">Margin establishes one accountable financial record across the recovery lifecycle. It connects the event, evidence, submission, Amazon response, settlement, reversal status, entity attribution, and close state. Your team monitors the position and approves consequential actions; Margin carries the investigation, execution, follow-through, and financial closeout.</p>
          <p className="mt-4 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[#52616A] sm:text-[24px]" style={{ fontWeight: 400 }}>Leadership gets a controlled operating position—not another queue of claims to reconstruct.</p>
          <Link to="/sales" className="landing-pressable mt-6 inline-flex h-11 items-center rounded-[7px] bg-[#0B74DE] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(11,116,222,0.18)] transition-colors hover:bg-[#075EBA]">Discuss an Enterprise Pilot <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <div className="enterprise-routing-meta mt-4 border-l border-[#C8D2D9] pl-4 text-[13px] leading-6 text-[#98A5AE]"><p>US · CA · MX · UK · DE + More · 3 legal entities · 8 settlement periods</p><p>Every market. One accountable financial record.</p></div>
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
  <section className="enterprise-onboarding-section relative overflow-hidden bg-[#F6F8F9] py-12 sm:py-14 md:py-20" aria-labelledby="enterprise-onboarding-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[850px]">
        <div className="mb-5 flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">22 / ENTERPRISE ONBOARDING</span>
        </div>
        <h2 id="enterprise-onboarding-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>Your Amazon financials. Under control in 25 days.</h2>
        <p className="mt-5 max-w-[780px] text-[16px] leading-7 tracking-[-0.01em] text-[#182026] md:text-[18px] md:leading-8">Know where things stand within days, then establish a defined path to financial control within 25 days. Margin works with your team to establish the facts, resolve what can be resolved, and put the right recovery processes in place—without turning implementation into another project for the business.</p>
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
          <h2 id="recovery-routing-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>First establish the financial position. Then choose how much responsibility Margin should carry.</h2>
          <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#182026] md:text-[17px] md:leading-8">The Audit is the underwriting step. It establishes the account&apos;s exposure, evidence position, and recurring pattern before you choose a service. From there, Margin routes the work into a defined recovery closeout or an ongoing financial control layer — so you invest in the operating outcome, not another dashboard.</p>
        </motion.div>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 lg:flex-row" onMouseLeave={() => setActivePath(null)}>
          {pathOptions.map((option, index) => {
            const isFirst = index === 0;
            const gradientStyle = isFirst 
              ? 'radial-gradient(ellipse at 15% 85%, #D8B39A 0%, transparent 50%), radial-gradient(ellipse at 75% 15%, #E7D3D8 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #E8D8C2 0%, transparent 45%), radial-gradient(ellipse at 85% 75%, #D9B9A4 0%, transparent 40%), linear-gradient(145deg, #E8D8D3 0%, #E5C8B2 35%, #E8D4B8 70%, #E0C2B2 100%)'
              : 'radial-gradient(ellipse at 25% 75%, #BEB5AA 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #E0D8CF 0%, transparent 50%), radial-gradient(ellipse at 45% 35%, #E7E1D8 0%, transparent 45%), radial-gradient(ellipse at 70% 80%, #CFC4B9 0%, transparent 40%), linear-gradient(145deg, #E2DBD2 0%, #D0C4B8 35%, #BDB0A5 70%, #A99B91 100%)';
            
            return (
            <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} onMouseEnter={() => setActivePath(index)} animate={{ flexGrow: activePath === null ? 1 : activePath === index ? 1.14 : 0.86 }} style={{ background: gradientStyle }} className={`relative rounded-[8px] p-6 sm:p-8 md:p-10 transition-[filter,opacity] duration-500 will-change-[filter,opacity] lg:min-w-0 lg:flex-1 ${activePath !== null && activePath !== index ? "lg:blur-[2.5px] lg:opacity-55" : "lg:blur-0 lg:opacity-100"}`}>
              <p style={{ color: "#68655F" }} className="routing-card-label font-mono text-[11px] font-semibold uppercase tracking-tight">{option.label}</p>
              <h3 className="routing-card-heading mt-4 font-lora text-[29px] leading-[1.04] tracking-[-0.04em] sm:text-[36px] md:text-[42px]" style={{ fontWeight: 500 }}>{option.title}</h3>
              <p style={{ color: "#F0EEEA" }} className="routing-card-copy mt-4 max-w-[520px] text-[14px] leading-6 md:text-[15px] md:leading-7">{option.copy}</p>
              <div className="mt-7 grid gap-0 border-y border-white/40 sm:grid-cols-2">
                {option.items.map((item) => (
                  <div key={item} className="routing-card-item flex items-start gap-2 border-b border-[#7B8A82]/30 py-3 text-[12px] leading-5 text-[#F6F4F0] last:border-b-0 sm:pr-4 md:text-[13px]">
                    <Check className="routing-card-item-icon mt-0.5 h-4 w-4 shrink-0 text-[#F6F4F0]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-2">
                <p className="routing-card-price text-[26px] font-semibold tracking-[-0.05em] text-[#FFFCF8] md:text-[30px]">{option.price}</p>
                {option.subPrice && <p className="routing-card-subprice mt-1 text-[13px] font-medium text-[#E5E1DB]">{option.subPrice}</p>}
                <Button onClick={() => onAuditCta(option.ctaLocation)} className="routing-card-button mt-6 h-12 rounded-[6px] bg-[#0B74DE] px-6 text-[14px] font-semibold text-white shadow-sm hover:bg-[#075EBA]">
                  {option.cta}<ArrowRight className="ml-2 h-4 w-4 text-white" />
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
