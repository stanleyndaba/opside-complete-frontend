import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const recoverySteps = [
  {
    number: "01",
    title: "Find",
    body: "Why this recovery was surfaced",
    artifact: "The signal that brought the case into view.",
  },
  {
    number: "02",
    title: "Prove",
    body: "The records that support it",
    artifact: "The evidence attached to the judgment—and what is still missing.",
  },
  {
    number: "03",
    title: "Approve",
    body: "What you are being asked to authorize",
    artifact: "Your decision before anything moves forward.",
  },
  {
    number: "04",
    title: "Follow",
    body: "What Amazon said and what happened next",
    artifact: "The response, deadline, and next required action.",
  },
  {
    number: "05",
    title: "Verify",
    body: "What was actually paid and reconciled",
    artifact: "The settlement, reversal, or unresolved balance.",
  },
];

export const RecoveryTimelineSection: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section
      data-navbar-theme="dark"
      aria-labelledby="inspectability-title"
      className="relative overflow-hidden border-b border-white/10 bg-[#101827] py-28 text-white md:py-44"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_42%,rgba(48,123,210,0.12),transparent_34%),radial-gradient(circle_at_18%_88%,rgba(34,70,118,0.16),transparent_32%)]" />
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-10 2xl:px-12">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-48px" }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[880px]"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-white/20" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-blue-300">Inspectability</span>
          </div>
          <h2 id="inspectability-title" className="font-lora text-[42px] leading-[0.98] tracking-[-0.045em] text-white sm:text-[56px] md:text-[78px]" style={{ fontWeight: 400 }}>
            Know why every recovery is in front of you.
            <span className="mt-4 block text-slate-400">A recovery is never just a number asking for your trust.</span>
          </h2>
          <p className="mt-8 max-w-[780px] text-[17px] leading-8 tracking-[-0.015em] text-slate-300 md:text-[19px] md:leading-9">
            Margin keeps the reasoning, evidence, approvals, responses, and outcome connected—so you can open the trail and understand what happened, what supports it, and what happened next.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-48px" }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 md:mt-28"
        >
          <div className="relative hidden h-[270px] md:block">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[180px] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="recovery-trace-base" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
                  <stop offset="0.45" stopColor="#7DBDFF" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.16" />
                </linearGradient>
                <linearGradient id="recovery-trace-shine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#8BC6FF" stopOpacity="0" />
                  <stop offset="0.48" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="0.58" stopColor="#7DBDFF" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#8BC6FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 2 54 C 10 54, 12 20, 22 30 S 30 78, 40 54 S 50 20, 60 40 S 70 78, 80 48 S 90 20, 98 36" fill="none" stroke="url(#recovery-trace-base)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
              <motion.path
                d="M 2 54 C 10 54, 12 20, 22 30 S 30 78, 40 54 S 50 20, 60 40 S 70 78, 80 48 S 90 20, 98 36"
                fill="none"
                stroke="url(#recovery-trace-shine)"
                strokeWidth="1.15"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={reduceMotion ? { pathLength: 1, opacity: 0.9 } : { pathLength: [0, 1], opacity: [0, 1, 0.75] }}
                viewport={{ once: true, margin: "-48px" }}
                transition={reduceMotion ? { duration: 0 } : { duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="relative flex h-full items-start justify-between gap-5">
              {recoverySteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-48px" }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.35 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-[18%]"
                >
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-blue-300/70">{step.number}</span>
                  <h3 className="mt-3 font-lora text-[25px] leading-none tracking-[-0.035em] text-white md:text-[31px]" style={{ fontWeight: 400 }}>{step.title}</h3>
                  <p className="mt-4 text-[13px] font-medium leading-5 text-blue-100/90">{step.body}</p>
                  <p className="mt-3 max-w-[180px] text-[12px] leading-5 text-slate-400">{step.artifact}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="md:hidden">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-0 h-full w-8 overflow-visible" viewBox="0 0 20 100" preserveAspectRatio="none">
              <path d="M 10 0 C 2 14, 18 24, 10 38 S 2 62, 10 76 S 18 90, 10 100" fill="none" stroke="#7DBDFF" strokeOpacity="0.32" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
              <motion.path
                d="M 10 0 C 2 14, 18 24, 10 38 S 2 62, 10 76 S 18 90, 10 100"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.8"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={reduceMotion ? { pathLength: 1, opacity: 0.8 } : { pathLength: [0, 1], opacity: [0, 1, 0.7] }}
                viewport={{ once: true, margin: "-48px" }}
                transition={reduceMotion ? { duration: 0 } : { duration: 2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="relative space-y-10 pl-14">
              {recoverySteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={reduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-48px" }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-blue-300/70">{step.number}</span>
                  <h3 className="mt-3 font-lora text-[28px] leading-none tracking-[-0.035em] text-white" style={{ fontWeight: 400 }}>{step.title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-6 text-blue-100/90">{step.body}</p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-400">{step.artifact}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-48px" }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 max-w-[760px] border-t border-white/10 pt-8 md:mt-24 md:pt-10"
        >
          <p className="font-lora text-[29px] leading-[1.04] tracking-[-0.04em] text-white sm:text-[37px] md:text-[48px]" style={{ fontWeight: 400 }}>
            Nothing important disappears inside the workflow.
          </p>
          <p className="mt-5 text-[15px] leading-7 text-slate-400 md:text-[17px] md:leading-8">
            Open the trail. Inspect the judgment. Follow the evidence. See what happened to the money.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
