import React from "react";
import { motion } from "framer-motion";

const recoverySteps = [
  {
    number: "01",
    title: "Issue Found",
    body: "A potential discrepancy is identified in your Amazon records.",
    state: "FOUND",
  },
  {
    number: "02",
    title: "Evidence Ready",
    body: "Relevant shipment, inventory, settlement and supporting records are matched to the finding.",
    state: "EVIDENCE",
  },
  {
    number: "03",
    title: "Seller Approval",
    body: "You review the recovery and decide whether it should be submitted.",
    state: "APPROVAL",
  },
  {
    number: "04",
    title: "Filed",
    body: "The recovery case is prepared and submitted through the appropriate Amazon process.",
    state: "FILED",
  },
  {
    number: "05",
    title: "Amazon Response",
    body: "Margin tracks the response and identifies what needs to happen next.",
    state: "RESPONSE",
  },
  {
    number: "06",
    title: "Payout Verified",
    body: "The reimbursement is checked against the expected outcome and recorded.",
    state: "VERIFIED",
  },
];

export const RecoveryTimelineSection: React.FC = () => {
  const revealProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <motion.div {...revealProps} className="max-w-[560px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--margin-border-strong)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-primary)]">
                From finding to recovery
              </span>
            </div>
            <h2 className="text-[36px] font-semibold leading-[1.04] tracking-[-0.045em] text-[var(--margin-text-primary)] md:text-[52px]">
              Every recovery has a next step.
            </h2>
            <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-[var(--margin-text-secondary)] md:text-[19px]">
              Margin turns a potential recovery into an evidence-backed case,
              keeps the process moving, and verifies the outcome.
            </p>
            <div className="mt-10 border-l border-[var(--margin-border)] pl-5">
              <p className="text-[18px] font-semibold leading-7 tracking-[-0.025em] text-[var(--margin-text-primary)]">
                Margin prepares the evidence. You decide the action.
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[var(--margin-text-secondary)]">
                You remain in control while Margin handles the recovery work.
              </p>
            </div>
          </motion.div>

          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-[12px] border border-[var(--margin-border)] bg-[var(--margin-surface)] shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
              <div className="border-b border-[var(--margin-border)] px-5 py-4 md:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--margin-text-muted)]">
                      Recovery lifecycle
                    </p>
                    <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">
                      {"FOUND -> EVIDENCE -> APPROVAL -> FILED -> RESPONSE -> VERIFIED"}
                    </p>
                  </div>
                  <span className="hidden rounded-full border border-[var(--margin-border)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-text-secondary)] sm:inline-flex">
                    Seller controlled
                  </span>
                </div>
              </div>

              <div className="relative px-5 py-3 md:px-7">
                <div className="absolute bottom-8 left-[34px] top-8 w-px bg-[var(--margin-border)] md:left-[42px]" />
                <div className="divide-y divide-[var(--margin-border-subtle)]">
                  {recoverySteps.map((step, index) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-48px" }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="relative grid gap-4 py-5 pl-12 md:grid-cols-[1fr_auto] md:items-center md:pl-16"
                    >
                      <div className="absolute left-0 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--margin-border)] bg-[var(--margin-surface)] font-mono text-[11px] font-semibold text-[var(--margin-text-secondary)] md:h-10 md:w-10">
                        {step.number}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-[18px] font-semibold tracking-[-0.025em] text-[var(--margin-text-primary)]">
                            {step.title}
                          </h3>
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--margin-text-muted)]">
                            {step.state}
                          </span>
                        </div>
                        <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px]">
                          {step.body}
                        </p>
                      </div>
                      <div className="hidden h-px w-16 bg-[var(--margin-border)] md:block" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
