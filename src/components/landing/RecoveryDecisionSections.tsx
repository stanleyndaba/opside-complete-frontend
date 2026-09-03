import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
    <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[780px]">
        <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-border-strong)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">Your next step depends on what the Audit finds</span></div>
        <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>Start with the Audit. Margin will show you what happens next.</h2>
        <p className="mt-6 max-w-[720px] text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">You do not need to decide which recovery service you need before you know what is actually happening in your account. Run the free Recovery Audit first, then Margin shows you what it found, what can be supported, and the appropriate next step.</p>
      </motion.div>

      <div className="mt-16 grid gap-0 border-y border-[var(--margin-border)] lg:grid-cols-2">
        {pathOptions.map((option, index) => <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className={`relative p-6 md:p-10 ${index > 0 ? "border-t border-[var(--margin-border)] lg:border-l lg:border-t-0" : ""}`}><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">{option.label}</p><h3 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.065em] text-[var(--margin-text-primary)] md:text-[48px]">{option.title}</h3><p className="mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">{option.copy}</p><div className="mt-8 grid gap-0 border-y border-[var(--margin-border-subtle)] sm:grid-cols-2">{option.items.map((item) => <div key={item} className="flex items-start gap-2 border-b border-[var(--margin-border-subtle)] py-3 text-[14px] leading-6 text-[var(--margin-text-secondary)] last:border-b-0 sm:pr-5"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--margin-primary)]" /><span>{item}</span></div>)}</div><div className="mt-8 pt-2"><p className="text-[30px] font-semibold tracking-[-0.065em] text-[var(--margin-text-primary)]">{option.price}</p>{option.subPrice && <p className="mt-1 text-[14px] font-medium text-[var(--margin-text-muted)]">{option.subPrice}</p>}<Button onClick={() => onAuditCta(option.ctaLocation)} className="mt-5 h-12 rounded-[8px] bg-[var(--margin-blue)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]">{option.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></motion.div>)}
      </div>

      <motion.div {...revealProps} className="mt-8 border-l border-[var(--margin-border)] pl-5"><p className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)]">Not ready to continue? That is fine.</p><p className="mt-2 text-[15px] leading-7 text-[var(--margin-text-secondary)]">The Audit is free. Review what Margin found, then decide whether there is work worth managing.</p></motion.div>
    </div>
  </section>
);
