import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditImageStackVisual } from "@/components/landing/AuditImageStackVisual";

interface LandingAuditCtaProps {
  onAuditCta: (location: string) => void;
}

const pathOptions = [
  {
    label: "Recover Once",
    title: "One supported recovery. One defined engagement.",
    copy: "When the Audit identifies a recovery Margin can take over, Margin prepares the proof, manages the approved action, follows the response, and keeps the outcome visible.",
    price: "Personalized fixed quote after your Audit.",
    cta: "Handle this recovery",
    ctaLocation: "homepage_recover_once",
    items: ["Evidence preparation", "Recovery preparation", "Approved submission", "Follow-up and eligible appeal handling", "Payout verification"],
  },
  {
    label: "Recovery Workspace",
    title: "For recovery work that keeps coming back.",
    copy: "If you keep carrying the same recovery work across spreadsheets, evidence, cases, and settlements, Workspace keeps the recurring work together over time.",
    price: "$109/month",
    subPrice: "0% recovery commission.",
    cta: "Activate Recovery Workspace",
    ctaLocation: "homepage_recovery_workspace",
    items: ["Recurring recovery work", "Evidence readiness", "Case continuity", "Payout and reversal tracking", "One ongoing recovery record"],
  },
];

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export const RecoveryOfferSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-16 sm:py-20 md:py-28">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} className="max-w-[780px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">12 / THE AUDIT</span>
          </div>
          <h2 className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Start with the Audit. Find out what is actually happening.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">You do not need to decide which recovery service you need before you know what is happening in your account. Margin examines the available records, establishes what can be supported, shows you what remains unresolved, and then tells you what—if anything—should happen next.</p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative">
          <AuditImageStackVisual />
        </motion.div>
      </div>

    </div>
  </section>
);

export const RecoveryRoutingSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-16 sm:py-20 md:py-28" aria-labelledby="recovery-routing-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[760px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px w-8 bg-[var(--margin-blue)]" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">13 / ROUTING</span>
        </div>
        <h2 id="recovery-routing-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Choose the recovery path that fits the work.</h2>
        <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">The Audit establishes what is happening first. Then Margin routes you to the right level of support—one justified recovery or an operating layer for work that keeps returning.</p>
      </motion.div>
      <div className="mt-12 grid gap-0 border-y border-[var(--margin-border)] md:mt-16 lg:grid-cols-2">
        {pathOptions.map((option, index) => (
          <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className={`relative p-5 sm:p-7 md:p-9 ${index > 0 ? "border-t border-[var(--margin-border)] lg:border-l lg:border-t-0" : ""}`}>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">{option.label}</p>
            <h3 className="mt-4 font-lora text-[29px] leading-[1.04] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[36px] md:text-[42px]" style={{ fontWeight: 400 }}>{option.title}</h3>
            <p className="mt-4 max-w-[520px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">{option.copy}</p>
            <div className="mt-7 grid gap-0 border-y border-[var(--margin-border-subtle)] sm:grid-cols-2">
              {option.items.map((item) => (
                <div key={item} className="flex items-start gap-2 border-b border-[var(--margin-border-subtle)] py-2.5 text-[12px] leading-5 text-[var(--margin-text-secondary)] last:border-b-0 sm:pr-4 md:text-[13px]">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--margin-blue)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-7 pt-1">
              <p className="text-[26px] font-semibold tracking-[-0.05em] text-[var(--margin-text-primary)] md:text-[30px]">{option.price}</p>
              {option.subPrice && <p className="mt-1 text-[13px] font-medium text-[var(--margin-text-muted)]">{option.subPrice}</p>}
              <Button onClick={() => onAuditCta(option.ctaLocation)} className="mt-5 h-11 rounded-[8px] bg-[var(--margin-blue)] px-5 text-[13px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]">
                {option.cta}<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div {...revealProps} className="mt-7 border-l border-[var(--margin-border)] pl-5">
        <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">Not ready to continue? That is fine.</p>
        <p className="mt-2 text-[14px] leading-6 text-[var(--margin-text-secondary)]">The Audit is free. Margin establishes that a recovery exists before asking you to decide whether any work is worth managing.</p>
      </motion.div>
    </div>
  </section>
);
