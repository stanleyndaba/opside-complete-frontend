"use client";

import { motion } from 'framer-motion';

export default function EvidenceBeforeAsked() {
  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50 px-6 py-12 font-sans text-slate-900"
      aria-label="Evidence before asked statement animation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(186,230,253,0.35),transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.64), rgba(255,255,255,0.26))',
        }}
      />

      <section className="relative z-10 w-full max-w-[960px]">
        <div className="mx-auto flex flex-col items-center gap-6 text-center text-5xl font-bold leading-[0.96] tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl">
          <motion.p
            initial={{ opacity: 0, x: 96, filter: 'blur(12px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] as const }}
            className="max-w-[14ch]"
          >
            Finds the gaps
          </motion.p>

          <motion.p
            initial={{ opacity: 0, x: -96, filter: 'blur(12px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.25, delay: 0.56, ease: [0.22, 1, 0.36, 1] as const }}
            className="max-w-[14ch]"
          >
            before Amazon does
          </motion.p>
        </div>
      </section>
    </main>
  );
}
