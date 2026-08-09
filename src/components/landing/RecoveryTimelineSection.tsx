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
    <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[#101827] py-28 text-white md:py-44">
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.div {...revealProps} className="max-w-[560px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-white/20" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-300">
                From finding to recovery
              </span>
            </div>
            <h2 className="text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] text-white md:text-[64px]">
              Every recovery has a next step.
            </h2>
            <p className="mt-6 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">
              Margin turns a potential recovery into an evidence-backed case,
              keeps the process moving, and verifies the outcome.
            </p>
            <div className="mt-10 border-l border-blue-400/45 pl-5">
              <p className="text-[18px] font-semibold leading-7 tracking-[-0.025em] text-white">
                Margin prepares the evidence. You decide the action.
              </p>
              <p className="mt-2 text-[14px] leading-6 text-slate-400">
                You remain in control while Margin handles the recovery work.
              </p>
            </div>
          </motion.div>

          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.12 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-white/[0.035] shadow-[0_38px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
              <div className="border-b border-white/10 px-5 py-4 md:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-tight text-slate-400">
                      Recovery lifecycle
                    </p>
                    <p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-white">
                      {"FOUND -> EVIDENCE -> APPROVAL -> FILED -> RESPONSE -> VERIFIED"}
                    </p>
                  </div>
                  <span className="hidden rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-tight text-slate-300 sm:inline-flex">
                    Seller controlled
                  </span>
                </div>
              </div>

              <div className="relative px-5 py-3 md:px-7">
                <div className="absolute bottom-8 left-[34px] top-8 w-px bg-white/12 md:left-[42px]" />
                <div className="divide-y divide-white/10">
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
                      <div className="absolute left-0 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/14 bg-[#101827] font-mono text-[11px] font-semibold text-slate-300 shadow-[0_0_0_4px_rgba(16,24,39,0.9)] md:h-10 md:w-10">
                        {step.number}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="text-[18px] font-semibold tracking-[-0.025em] text-white">
                            {step.title}
                          </h3>
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-blue-300/70">
                            {step.state}
                          </span>
                        </div>
                        <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-slate-400 md:text-[15px]">
                          {step.body}
                        </p>
                      </div>
                      <div className="hidden h-px w-16 bg-white/10 md:block" />
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
