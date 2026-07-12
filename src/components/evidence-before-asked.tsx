'use client';

import { motion } from 'framer-motion';

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.25,
    },
  },
};

const word = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const lines = [
  { text: 'Audits evidence', strong: false },
  { text: 'amazon asks for', strong: true },
];

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

      <section className="relative z-10 w-full max-w-[920px]">
        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="text-center text-5xl font-bold leading-[0.96] tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {lines.map((line, lineIndex) => (
            <span
              key={`${line.text}-${lineIndex}`}
              className={`flex flex-wrap justify-center gap-x-[0.28em] ${line.strong ? 'text-slate-950' : 'text-slate-900'}`}
            >
              {line.text.split(' ').map((item, wordIndex) => (
                <motion.span key={`${item}-${wordIndex}`} variants={word} className="inline-block">
                  {item}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h1>
      </section>
    </main>
  );
}
