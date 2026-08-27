import React from "react";
import { motion } from "framer-motion";

const recoverySteps = [
  {
    number: "01",
    title: "Find",
    body: "Identifies a possible recovery issue in your Amazon records.",
    outcome: "A clear explanation of what does not add up.",
  },
  {
    number: "02",
    title: "Prove",
    body: "Connects the relevant shipment, inventory, settlement, invoice, and case records.",
    outcome: "See what supports the recovery and what is missing.",
  },
  {
    number: "03",
    title: "Approve",
    body: "Puts the recovery in front of you before it moves forward.",
    outcome: "Nothing is submitted without your approval.",
  },
  {
    number: "04",
    title: "Follow",
    body: "Keeps the case response, deadline, and next required action visible.",
    outcome: "Know what Amazon said and what needs attention next.",
  },
  {
    number: "05",
    title: "Verify",
    body: "Compares the supported recovery amount with the relevant approval and settlement records.",
    outcome: "Know what was paid, reversed, or remains unresolved.",
  },
];

export const RecoveryTimelineSection: React.FC = () => {
  const revealProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px" },
    transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  };

  return (
    <section data-navbar-theme="dark" className="relative overflow-hidden border-b border-white/10 bg-[#101827] py-32 text-white md:py-56">
      <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 lg:px-10 2xl:px-12">
        <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.div {...revealProps} className="max-w-[560px]">
            <div className="mb-5 flex items-center gap-3"><div className="h-px w-8 bg-white/20" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-300">How Margin handles a recovery</span></div>
            <h2 className="font-lora text-[44px] leading-[0.98] tracking-[-0.045em] text-white md:text-[76px]" style={{ fontWeight: 400 }}>Find it. Prove it. Approve it. Follow it. Verify it.</h2>
            <p className="mt-8 text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px]">The recovery path keeps the proof, your approval, the case, and the payout outcome attached to the same record.</p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="relative">
            <div className="agentic-scan relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.035] shadow-[0_38px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
              <div className="border-b border-white/10 px-5 py-4 md:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="font-mono text-[11px] font-medium uppercase tracking-tight text-slate-400">Recovery path</p><p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-white">Find → Prove → Approve → Follow → Verify</p></div>
                  <span className="hidden rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-tight text-slate-300 sm:inline-flex">Seller controlled</span>
                </div>
              </div>
              <div className="relative px-5 py-3 md:px-7">
                <div className="divide-y divide-white/10">
                  {recoverySteps.map((step, index) => (
                    <motion.div key={step.number} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-48px" }} transition={{ duration: 0.5, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="font-mono text-[10px] font-semibold text-blue-300/70">{step.number}</span><h3 className="text-[18px] font-semibold tracking-[-0.025em] text-white">{step.title}</h3></div>
                        <p className="mt-2 max-w-[560px] text-[14px] leading-6 text-slate-400 md:text-[15px]">{step.body}</p>
                        <p className="mt-2 text-[13px] font-medium leading-6 text-blue-100/90">{step.outcome}</p>
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
