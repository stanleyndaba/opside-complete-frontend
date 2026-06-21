'use client';

import { motion } from 'framer-motion';

const firstLine = ['And', 'produces', 'fully', 'auditable'];
const secondLine = ['outputs,', 'all', 'in', 'your', 'workspace'];

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

function AnimatedLine({ words, strong = false }: { words: string[]; strong?: boolean }) {
  return (
    <span className={`flex flex-wrap justify-center gap-x-[0.28em] ${strong ? 'font-bold' : 'font-medium'}`}>
      {words.map((item) => (
        <motion.span key={item} variants={word} className="inline-block">
          {item}
        </motion.span>
      ))}
    </span>
  );
}

export default function AuditableOutputs() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-[#111827]">
      <motion.h1
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-4xl text-center text-4xl leading-[1.12] sm:text-6xl"
      >
        <AnimatedLine words={firstLine} />
        <AnimatedLine words={secondLine} strong />
      </motion.h1>
    </main>
  );
}
