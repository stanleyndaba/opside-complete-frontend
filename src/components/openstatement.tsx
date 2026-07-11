'use client';

import { motion, useReducedMotion } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const statementTransition = {
  duration: 0.92,
  ease,
};

export default function OpenStatement() {
  const reduceMotion = useReducedMotion();

  const fromRight = reduceMotion ? { opacity: 0 } : { opacity: 0, x: 92, filter: 'blur(18px)' };
  const fromLeft = reduceMotion ? { opacity: 0 } : { opacity: 0, x: -92, filter: 'blur(18px)' };
  const fromBottom = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 72, filter: 'blur(18px)' };
  const show = { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' };

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50 px-6 py-12 font-sans text-slate-900"
      aria-label="Opening statement animation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(186,230,253,0.35),transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.64), rgba(255,255,255,0.26))',
        }}
      />

      <section className="relative z-10 w-full max-w-[920px]">
        <div className="flex flex-col items-center text-center text-5xl font-bold leading-[0.96] tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl">
          <motion.div
            initial={fromRight}
            animate={show}
            transition={{ ...statementTransition, delay: 0.18 }}
            className="will-change-transform"
          >
            The discrepancy
          </motion.div>

          <motion.div
            initial={fromLeft}
            animate={show}
            transition={{ ...statementTransition, delay: 1.02 }}
            className="mt-3 will-change-transform sm:mt-4"
          >
            wasn't the problem.
          </motion.div>

          <motion.div
            initial={fromBottom}
            animate={show}
            transition={{ ...statementTransition, delay: 1.86 }}
            className="mt-3 will-change-transform sm:mt-4"
          >
            The <span className="text-[#007aff]">evidence</span> was.
          </motion.div>
        </div>
      </section>
    </main>
  );
}
