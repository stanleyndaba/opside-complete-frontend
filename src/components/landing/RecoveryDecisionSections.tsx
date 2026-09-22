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
  <section className="relative bg-[var(--margin-canvas)] py-10 sm:py-10 md:py-14">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} className="order-1 max-w-[780px] lg:order-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">15 / THE AUDIT</span>
          </div>
          <h2 className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-white sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Know what&apos;s actually happening.</h2>
          <div className="mt-6 max-w-[760px] space-y-4 text-[15px] leading-7 tracking-[-0.01em] text-white/72 md:text-[17px] md:leading-8">
            <p><span className="font-semibold text-white">Before:</span> Sort through Amazon records trying to work out what happened, what matters, and whether anything needs to be recovered.</p>
            <p><span className="font-semibold text-white">Now:</span> See what reconciles, what doesn&apos;t, what&apos;s supported by the evidence, and where recovery makes sense.</p>
          </div>
          <p className="mt-5 max-w-[760px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-white sm:text-[24px]" style={{ fontWeight: 400 }}>The Audit turns uncertainty into something you can understand.</p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 lg:order-2">
          <FinalDelegationPreview compactMobile src="/recovery-workspace" title="Recovery Workspace page preview" />
        </motion.div>
      </div>

    </div>
  </section>
);

export const RecoveryOfferSectionDuplicate: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => (
  <section className="relative bg-[var(--margin-canvas)] py-10 sm:py-10 md:py-14" aria-labelledby="recovery-audit-duplicate-title">
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
      <div className="grid gap-10 lg:grid-cols-[1.26fr_0.74fr] lg:items-center lg:gap-16">
        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative order-2 lg:order-1">
          <FinalDelegationPreview compactMobile src="/speak-to-sales" title="Enterprise Recovery Program Review page preview" />
        </motion.div>
        <motion.div {...revealProps} className="order-1 max-w-[780px] lg:order-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">14 / ENTERPRISE</span>
          </div>
          <h2 id="recovery-audit-duplicate-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-white sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Don&apos;t manage recovery across complex Amazon operations. Let Margin run it.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-white/72 md:text-[17px] md:leading-8">When your business spans multiple marketplaces, entities, catalogs, and operational environments, recovery doesn&apos;t get simpler.</p>
          <p className="mt-4 max-w-[760px] text-[15px] leading-7 tracking-[-0.01em] text-white/72 md:text-[17px] md:leading-8">Your team no longer has to carry the financial history of every recovery across systems, people, and marketplaces. Margin keeps the operation accountable to what actually happened.</p>
          <Link to="/sales" className="landing-pressable mt-6 inline-flex h-11 items-center rounded-[7px] bg-[var(--margin-blue)] px-6 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition-colors hover:bg-[var(--margin-blue-hover)]">Explore Margin for Enterprise <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <div className="mt-4 border-l border-white/25 pl-4 text-[13px] leading-6 text-white/60"><p>US · CA · MX · UK · EU + More</p><p>Multiple markets / one examination</p></div>
        </motion.div>
      </div>
    </div>
  </section>
);

export const RecoveryRoutingSection: React.FC<LandingAuditCtaProps> = ({ onAuditCta }) => {
    const [activePath, setActivePath] = useState<number | null>(null);
  
    return (
    <section className="relative bg-[var(--margin-canvas)] py-10 sm:py-10 md:py-14" aria-labelledby="recovery-routing-title">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <motion.div {...revealProps} className="max-w-[760px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[var(--margin-blue)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">17 / ROUTING</span>
          </div>
          <h2 id="recovery-routing-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>Choose the recovery path that fits the work.</h2>
          <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">The Audit establishes what is happening first. Then Margin routes you to the right level of support-one justified recovery or an operating layer for work that keeps returning.</p>
        </motion.div>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 lg:flex-row" onMouseLeave={() => setActivePath(null)}>
          {pathOptions.map((option, index) => {
            const isFirst = index === 0;
            const gradientStyle = isFirst 
              ? 'radial-gradient(ellipse at 15% 85%, #c97b4a 0%, transparent 50%), radial-gradient(ellipse at 75% 15%, #d4a0b8 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #dbb896 0%, transparent 45%), radial-gradient(ellipse at 85% 75%, #c48a6e 0%, transparent 40%), linear-gradient(145deg, #d1a0a0 0%, #cc9870 35%, #d4a87a 70%, #c8907a 100%)'
              : 'radial-gradient(ellipse at 25% 75%, #6b7a54 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #a8b098 0%, transparent 50%), radial-gradient(ellipse at 45% 35%, #c2c8b8 0%, transparent 45%), radial-gradient(ellipse at 70% 80%, #8a9a6e 0%, transparent 40%), linear-gradient(145deg, #b8bda8 0%, #96a480 35%, #7a8e60 70%, #5e7244 100%)';
            
            return (
            <motion.div key={option.label} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} onMouseEnter={() => setActivePath(index)} animate={{ flexGrow: activePath === null ? 1 : activePath === index ? 1.14 : 0.86 }} style={{ background: gradientStyle }} className={`relative rounded-[8px] p-6 sm:p-8 md:p-10 transition-[filter,opacity] duration-500 will-change-[filter,opacity] lg:min-w-0 lg:flex-1 ${activePath !== null && activePath !== index ? "lg:blur-[2.5px] lg:opacity-55" : "lg:blur-0 lg:opacity-100"}`}>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-white/90">{option.label}</p>
              <h3 className="mt-4 font-lora text-[29px] leading-[1.04] tracking-[-0.04em] text-white sm:text-[36px] md:text-[42px]" style={{ fontWeight: 400 }}>{option.title}</h3>
              <p className="mt-4 max-w-[520px] text-[14px] leading-6 text-white/80 md:text-[15px] md:leading-7">{option.copy}</p>
              <div className="mt-7 grid gap-0 border-y border-white/20 sm:grid-cols-2">
                {option.items.map((item) => (
                  <div key={item} className="flex items-start gap-2 border-b border-white/10 py-3 text-[12px] leading-5 text-white/90 last:border-b-0 sm:pr-4 md:text-[13px]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-2">
                <p className="text-[26px] font-semibold tracking-[-0.05em] text-white md:text-[30px]">{option.price}</p>
                {option.subPrice && <p className="mt-1 text-[13px] font-medium text-white/70">{option.subPrice}</p>}
                <Button onClick={() => onAuditCta(option.ctaLocation)} className="mt-6 h-12 rounded-[6px] bg-white text-[#191B20] px-6 text-[14px] font-semibold hover:bg-gray-100 shadow-sm">
                  {option.cta}<ArrowRight className="ml-2 h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </motion.div>
          )})}
        </div>
        <motion.div {...revealProps} className="mt-9 border-l-2 border-[var(--margin-border)] pl-5">
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">Not ready to continue? That is fine.</p>
          <p className="mt-2 text-[14px] leading-6 text-[var(--margin-text-secondary)]">The Audit is free. Margin establishes that a recovery exists before asking you to decide whether any work is worth managing.</p>
        </motion.div>
      </div>
    </section>
  );
};
