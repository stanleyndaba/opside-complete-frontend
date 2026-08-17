import React from "react";
import { motion } from "framer-motion";

const recoverySteps = [
  {
    number: "01",
    title: "Found",
    body: "A possible recovery issue is identified in your Amazon records.",
    state: "FOUND",
  },
  {
    number: "02",
    title: "Evidence",
    body: "The relevant shipment, inventory, settlement, and supporting records are connected to the finding.",
    state: "EVIDENCE",
  },
  {
    number: "03",
    title: "Approval",
    body: "You review the issue and decide whether it should move forward.",
    state: "APPROVAL",
  },
  {
    number: "04",
    title: "Filed",
    body: "The recovery is prepared and submitted through the appropriate Amazon process after approval.",
    state: "FILED",
  },
  {
    number: "05",
    title: "Response",
    body: "Amazon’s response is tracked, including what needs attention next.",
    state: "RESPONSE",
  },
  {
    number: "06",
    title: "Verified",
    body: "The result is checked against the expected amount. Shortfalls, reversals, and unresolved balances remain visible.",
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
    <section 
      data-navbar-theme="dark"
      className="relative overflow-hidden border-b border-white/10 bg-[#101827] py-32 text-white md:py-56"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.div {...revealProps} className="max-w-[560px]">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-white/20" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-300">
                Keep control without keeping all the work
              </span>
            </div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-white md:text-[76px]" style={{ fontWeight: 400 }}>
              Keep control without keeping all the work.
            </h2>
            <p className="mt-8 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">
              Margin prepares the recovery record, connects the supporting evidence, tracks Amazon’s response, and checks what Amazon pays. You review the important decisions and approve the action.
            </p>
            <div className="mt-10 border-l border-blue-400/45 pl-5">
              <p className="text-[16px] leading-7 text-slate-400">
                You should not have to chase every document, remember every deadline, or wonder whether an approved reimbursement reached your account.
              </p>
              <p className="mt-4 font-semibold text-[15px] text-blue-200">
                You approve the action. Margin keeps the work moving.
              </p>
            </div>
          </motion.div>

          <motion.div
            {...revealProps}
            transition={{ ...revealProps.transition, delay: 0.12 }}
            className="relative"
          >
            <div className="agentic-scan relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.035] shadow-[0_38px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl">
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
                      className="relative grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center"
                    >

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
