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
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-32 md:py-56">
      <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 lg:px-10 2xl:px-12">

        {/* Header */}
        <div className="mb-20 max-w-[920px]">
          <motion.div {...revealProps} className="mb-6 flex items-center gap-3">
            <div className="h-[1px] w-8 bg-[var(--margin-border-strong)]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-secondary)]">
              What your free Recovery Audit shows
            </span>
          </motion.div>

          <motion.h2
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.1 }}
            className="font-lora text-[44px] leading-[0.96] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[66px] lg:text-[86px]"
            style={{ fontWeight: 400 }}
          >
            See what happened—before you decide what to do next.
          </motion.h2>

          <motion.p
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.2 }}
            className="mt-8 max-w-[740px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px] md:leading-9"
          >
            Amazon’s records do not always tell one clear story. Margin compares the relevant records and shows what changed, what is missing, what is already settled, and what still needs a decision.
          </motion.p>
        </div>

        <div className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">Example recovery record</div>
        <div className="mb-20 border-y border-[var(--margin-border)]">

          {/* Step 1 */}
          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.3 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-9 md:grid-cols-[160px_minmax(0,0.85fr)_minmax(0,1fr)] md:items-start md:py-12"
          >
            <span className="font-mono text-[12px] font-medium uppercase tracking-tight text-[var(--margin-text-muted)]">What was found</span>
            <h3 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[42px]">
              14 units missing
            </h3>
            <p className="max-w-[560px] font-mono text-[13px] leading-7 text-[var(--margin-text-secondary)] md:text-[14px]">
              Amazon received 46 of the 60 units you shipped. Margin found a receiving variance of 14 units.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.4 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-9 md:grid-cols-[160px_minmax(0,0.85fr)_minmax(0,1fr)] md:items-start md:py-12"
          >
            <span className="font-mono text-[12px] font-medium uppercase tracking-tight text-[var(--margin-text-muted)]">What supports it</span>
            <h3 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[42px]">
              Proof connected
            </h3>
            <p className="max-w-[560px] font-mono text-[13px] leading-7 text-[var(--margin-text-secondary)] md:text-[14px]">
              The shipment record, invoice, SKU, quantity, cost basis, and relevant deadline are attached to the recovery.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.5 }}
            className="group grid gap-5 border-b border-[var(--margin-border-subtle)] py-9 md:grid-cols-[160px_minmax(0,0.85fr)_minmax(0,1fr)] md:items-start md:py-12"
          >
            <span className="font-mono text-[12px] font-medium uppercase tracking-tight text-[var(--margin-text-muted)]">What needs your decision</span>
            <h3 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[42px]">
              Your approval is required
            </h3>
            <p className="max-w-[560px] font-mono text-[13px] leading-7 text-[var(--margin-text-secondary)] md:text-[14px]">
              The recovery is ready for review. Nothing is submitted to Amazon without your approval.
            </p>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.6 }}
            className="group grid gap-5 py-9 md:grid-cols-[160px_minmax(0,0.85fr)_minmax(0,1fr)] md:items-start md:py-12"
          >
            <span className="font-mono text-[12px] font-medium uppercase tracking-tight text-[var(--margin-text-muted)]">What happened to the money</span>
            <h3 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--margin-text-primary)] md:text-[42px]">
              Payout verified
            </h3>
            <p className="max-w-[560px] font-mono text-[13px] leading-7 text-[var(--margin-text-secondary)] md:text-[14px]">
              Amazon reimbursed US$1,247. Margin matched the settlement to the recovery and saved the payout trail with the case.
            </p>
          </motion.div>

        </div>

        {/* CTA */}
        <motion.div
          {...revealProps}
          transition={{ ...revealProps.transition, delay: 0.7 }}
          className="flex flex-col items-start gap-4"
        >
          <Button
            size="lg"
            onClick={onCtaClick}
            className="h-14 rounded-[8px] bg-[var(--margin-blue)] px-8 text-[15px] font-semibold tracking-[-0.01em] text-white transition-transform hover:scale-[1.02] hover:bg-[var(--margin-blue-hover)] active:scale-[0.98] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_12px_rgba(0,0,0,0.2)]"
          >
            Run a free Recovery Audit <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-[13px] text-[var(--margin-text-muted)]">
            No payment required. You decide what happens after the Audit.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
