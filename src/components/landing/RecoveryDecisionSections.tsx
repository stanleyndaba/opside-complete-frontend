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

const evidenceRequests = [
  { title: "Invoice", copy: "Shows the supplier record for the affected units." },
  { title: "Shipment record", copy: "Shows what was shipped, when, and under which shipping plan." },
  { title: "Proof of delivery", copy: "Confirms that a shipment reached the fulfilment centre." },
  { title: "Inventory record", copy: "Shows what Amazon received, adjusted, lost, damaged, or reimbursed." },
  { title: "Case history", copy: "Shows what was submitted, what Amazon answered, and what still needs attention." },
];

const auditTrustItems = [
  ["Records reviewed", "See the source coverage and date range Margin actually examined."],
  ["Why it was flagged", "Understand what happened and which records created the finding."],
  ["Evidence status", "See what proof is ready, what is missing, and what would strengthen the recovery."],
  ["Recovery status", "Know whether the issue is ready, waiting, settled, evidence-limited, or needs your decision."],
  ["Payout status", "See what Amazon approved, what actually reached your account, and what remains unresolved."],
];

const controlItems = [
  ["Read-only account access", "Examining the records needed for the Audit."],
  ["Approval before submission", "Preparing the evidence and recovery record."],
  ["The important decisions", "Keeping the case, response, and next action visible."],
  ["A clear money view", "Keeping expected, approved, paid, reversed, and unresolved amounts distinct."],
];

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export const RecoveryProofSections: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
    <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <motion.div {...revealProps}>
          <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-border-strong)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">Evidence and control</span></div>
          <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>A finding is not a recovery.</h2>
          <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">A real recovery may need invoices, shipment details, proof of delivery, inventory records, or case history. If proof is missing, the case loses its thread, or the timing is missed, an issue can stay unresolved.</p>
          <p className="mt-8 text-[17px] font-semibold leading-8 tracking-[-0.015em] text-[var(--margin-text-primary)] md:text-[19px]">No black-box numbers. No blind submissions.</p>
          <p className="mt-3 text-[15px] leading-7 text-[var(--margin-text-secondary)]">Every finding is tied to the records Margin used to identify and assess it. You can see why it was flagged, what proof is ready, how the amount was calculated, and what decision is yours.</p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <Button onClick={() => onAuditCta("homepage_inspectability")} className="h-14 rounded-[8px] bg-[var(--margin-blue)] px-8 text-[15px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]">Run a free Recovery Audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <p className="text-[13px] text-[var(--margin-text-muted)]">Read-only access. No payment to run the Audit. Nothing is submitted without your approval.</p>
          </div>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.08 }} className="border-y border-[var(--margin-border)] bg-transparent">
          <div className="border-b border-[var(--margin-border)] px-5 py-4 md:px-7"><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">Margin keeps the recovery record together</p><p className="mt-2 text-[18px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)]">Issue → Proof → Approval → Case → Response → Payout</p></div>
          <div className="divide-y divide-[var(--margin-border-subtle)] px-5 md:px-7">
            {evidenceRequests.map((item, index) => <motion.div key={item.title} {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 + index * 0.05 }} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:items-start"><h3 className="text-[14px] font-bold uppercase tracking-tight text-[var(--margin-text-primary)]">{item.title}</h3><p className="text-[14px] leading-6 text-[var(--margin-text-secondary)]">{item.copy}</p></motion.div>)}
          </div>
          <div className="grid border-t border-[var(--margin-border)] lg:grid-cols-2">
            <div className="p-5 lg:border-r lg:border-[var(--margin-border)] md:p-7"><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">Every Audit gives you a clear answer</p><div className="mt-5 divide-y divide-[var(--margin-border-subtle)]">{auditTrustItems.map(([label, detail]) => <div key={label} className="py-3 first:pt-0 last:pb-0"><h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">{label}</h3><p className="mt-1 text-[13px] leading-5 text-[var(--margin-text-secondary)]">{detail}</p></div>)}</div></div>
            <div className="border-t border-[var(--margin-border)] bg-[var(--margin-surface)] p-5 lg:border-l-0 lg:border-t-0 md:p-7"><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">You keep control of</p><div className="mt-5 space-y-4">{controlItems.map(([title, detail]) => <div key={title}><h3 className="text-[14px] font-semibold text-[var(--margin-text-primary)]">{title}</h3><p className="mt-1 text-[13px] leading-5 text-[var(--margin-text-secondary)]">{detail}</p></div>)}</div></div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export const RecoveryOfferSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-32 md:py-56">
    <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-10 2xl:px-12">
      <motion.div {...revealProps} className="max-w-[780px]">
        <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-[var(--margin-border-strong)]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-primary)]">Your next step depends on what the Audit finds</span></div>
        <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[76px]" style={{ fontWeight: 400 }}>Handle one recovery—or stop carrying the work yourself.</h2>
        <p className="mt-6 max-w-[720px] text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">The Audit is the wide door. The right next step depends on the work Margin can actually establish.</p>
      </motion.div>

      <div className="mt-16 grid gap-0 border-y border-[var(--margin-border)] lg:grid-cols-2">
        {pathOptions.map((option, index) => <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className={`relative p-6 md:p-10 ${index > 0 ? "border-t border-[var(--margin-border)] lg:border-l lg:border-t-0" : ""}`}><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">{option.label}</p><h3 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.065em] text-[var(--margin-text-primary)] md:text-[48px]">{option.title}</h3><p className="mt-4 max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">{option.copy}</p><div className="mt-8 grid gap-0 border-y border-[var(--margin-border-subtle)] sm:grid-cols-2">{option.items.map((item) => <div key={item} className="flex items-start gap-2 border-b border-[var(--margin-border-subtle)] py-3 text-[14px] leading-6 text-[var(--margin-text-secondary)] last:border-b-0 sm:pr-5"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--margin-primary)]" /><span>{item}</span></div>)}</div><div className="mt-8 pt-2"><p className="text-[30px] font-semibold tracking-[-0.065em] text-[var(--margin-text-primary)]">{option.price}</p>{option.subPrice && <p className="mt-1 text-[14px] font-medium text-[var(--margin-text-muted)]">{option.subPrice}</p>}<Button onClick={() => onAuditCta(option.ctaLocation)} className="mt-5 h-12 rounded-[8px] bg-[var(--margin-blue)] px-5 text-[14px] font-semibold text-white hover:bg-[var(--margin-blue-hover)]">{option.cta}<ArrowRight className="ml-2 h-4 w-4" /></Button></div></motion.div>)}
      </div>

      <motion.div {...revealProps} className="mt-8 border-l border-[var(--margin-border)] pl-5"><p className="text-[17px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)]">Not ready to continue? That is fine.</p><p className="mt-2 text-[15px] leading-7 text-[var(--margin-text-secondary)]">The Audit is free. Review what Margin found, then decide whether there is work worth managing.</p></motion.div>
    </div>
  </section>
);
