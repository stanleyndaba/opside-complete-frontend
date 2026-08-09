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
    <section className="relative border-b border-[var(--margin-border)] bg-[var(--margin-surface)] py-20 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        
        {/* Header */}
        <div className="mb-20 max-w-[720px]">
          <motion.div {...revealProps} className="mb-6 flex items-center gap-3">
            <div className="h-[1px] w-8 bg-[var(--margin-border-strong)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--margin-text-secondary)]">
              How it works
            </span>
          </motion.div>
          
          <motion.h2 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.1 }}
            className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] md:text-[42px] lg:text-[48px]"
          >
            Margin checks what Amazon says happened against what actually happened.
          </motion.h2>
        </div>

        {/* 4-Step Grid */}
        <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-16 lg:gap-x-20">
          
          {/* Step 1 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.2 }}
            className="group relative flex flex-col"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--margin-border)] pb-4">
              <span className="font-mono text-[13px] font-medium text-[var(--margin-text-muted)]">01</span>
              <ArrowRight className="h-4 w-4 text-[var(--margin-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100" />
            </div>
            <h3 className="mb-4 text-[20px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
              Connect Amazon
            </h3>
            <p className="text-[15px] leading-relaxed text-[var(--margin-text-secondary)]">
              Give Margin read-only access to your account.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.3 }}
            className="group relative flex flex-col"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--margin-border)] pb-4">
              <span className="font-mono text-[13px] font-medium text-[var(--margin-text-muted)]">02</span>
              <ArrowRight className="h-4 w-4 text-[var(--margin-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:hidden" />
            </div>
            <h3 className="mb-4 text-[20px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
              Margin audits your records
            </h3>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--margin-text-secondary)]">
              <li>Shipments</li>
              <li>Inventory</li>
              <li>Settlements</li>
              <li>Cases</li>
              <li>Evidence</li>
            </ul>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.4 }}
            className="group relative flex flex-col"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--margin-border)] pb-4">
              <span className="font-mono text-[13px] font-medium text-[var(--margin-text-muted)]">03</span>
              <ArrowRight className="h-4 w-4 text-[var(--margin-text-muted)] opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100" />
            </div>
            <h3 className="mb-4 text-[20px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
              See what needs attention
            </h3>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--margin-text-secondary)]">
              <li>Recoveries</li>
              <li>Evidence gaps</li>
              <li>Deadlines</li>
              <li>Payout discrepancies</li>
            </ul>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.5 }}
            className="group relative flex flex-col"
          >
            <div className="mb-4 flex items-center justify-between border-b border-[var(--margin-border)] pb-4">
              <span className="font-mono text-[13px] font-medium text-[var(--margin-text-muted)]">04</span>
            </div>
            <h3 className="mb-4 text-[20px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
              Decide what happens next
            </h3>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--margin-text-secondary)]">
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
          className="flex justify-center"
        >
          <Button
            size="lg"
            onClick={onCtaClick}
            className="h-14 rounded-full bg-[var(--margin-primary)] px-8 text-[15px] font-semibold tracking-[-0.01em] text-white transition-transform hover:scale-[1.02] hover:bg-[var(--margin-primary-hover)] active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_12px_rgba(0,0,0,0.2)]"
          >
            Seller Central Audit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

      </div>
    </section>
  );
};
