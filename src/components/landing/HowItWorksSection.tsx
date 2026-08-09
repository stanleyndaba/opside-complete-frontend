import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksSectionProps {
  onCtaClick: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onCtaClick }) => {
  const revealProps = {
    initial: { opacity: 0, y: 15 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-28 md:py-44 overflow-hidden">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-24 max-w-[780px]">
          <motion.div {...revealProps} className="mb-6 flex items-center gap-3">
            <div className="h-[1px] w-8 bg-[var(--margin-border-strong)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-secondary)]">
              How it works
            </span>
          </motion.div>
          
          <motion.h2 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.1 }}
            className="text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] text-[var(--margin-text-primary)] md:text-[58px] lg:text-[72px]"
          >
            Margin checks what Amazon says happened against what actually happened.
          </motion.h2>
        </div>

        {/* Ledger rows */}
        <div className="mb-24 border-y border-[var(--margin-border)]">
          
          {/* Step 1 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.2 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-8 md:grid-cols-[120px_minmax(0,0.9fr)_minmax(0,1fr)] md:items-start md:py-10"
          >
            <span className="font-mono text-[12px] font-medium text-[var(--margin-text-muted)]">01 / CONNECT</span>
            <h3 className="text-[24px] font-semibold tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[30px]">
              Connect Amazon
            </h3>
            <p className="max-w-[520px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              Give Margin read-only access to your account.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.3 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-8 md:grid-cols-[120px_minmax(0,0.9fr)_minmax(0,1fr)] md:items-start md:py-10"
          >
            <span className="font-mono text-[12px] font-medium text-[var(--margin-text-muted)]">02 / AUDIT</span>
            <h3 className="text-[24px] font-semibold tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[30px]">
              Margin audits your records
            </h3>
            <ul className="grid max-w-[520px] grid-cols-2 gap-x-6 gap-y-2 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              <li>Shipment records</li>
              <li>Inventory events</li>
              <li>Settlements</li>
              <li>Case history</li>
              <li>Evidence files</li>
            </ul>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.4 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-8 md:grid-cols-[120px_minmax(0,0.9fr)_minmax(0,1fr)] md:items-start md:py-10"
          >
            <span className="font-mono text-[12px] font-medium text-[var(--margin-text-muted)]">03 / FIND</span>
            <h3 className="text-[24px] font-semibold tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[30px]">
              See what needs attention
            </h3>
            <ul className="grid max-w-[520px] grid-cols-2 gap-x-6 gap-y-2 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              <li>Recoverable findings</li>
              <li>Evidence gaps</li>
              <li>Deadlines</li>
              <li>Payout discrepancies</li>
            </ul>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.5 }}
            className="group grid gap-5 py-8 md:grid-cols-[120px_minmax(0,0.9fr)_minmax(0,1fr)] md:items-start md:py-10"
          >
            <span className="font-mono text-[12px] font-medium text-[var(--margin-text-muted)]">04 / DECIDE</span>
            <h3 className="text-[24px] font-semibold tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[30px]">
              Decide what happens next
            </h3>
            <ul className="grid max-w-[520px] gap-y-2 text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[16px]">
              <li>Handle it yourself</li>
              <li>Recover Once</li>
              <li>Recovery Workspace</li>
            </ul>
          </motion.div>
          
        </div>

        {/* CTA */}
        <motion.div 
          {...revealProps}
          transition={{ ...revealProps.transition, delay: 0.6 }}
          className="flex justify-start"
        >
          <Button
            size="lg"
            onClick={onCtaClick}
            className="h-14 rounded-[8px] bg-[var(--margin-primary)] px-8 text-[15px] font-semibold tracking-[-0.01em] text-white transition-transform hover:scale-[1.02] hover:bg-[var(--margin-primary-hover)] active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_12px_rgba(0,0,0,0.2)]"
          >
            Seller Central Audit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

      </div>
    </section>
  );
};
