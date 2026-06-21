'use client';

import { motion } from 'framer-motion';

export type StatementLine = {
  text: string;
  strong?: boolean;
};

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

export function AnimatedStatement({ lines }: { lines: StatementLine[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-[#242424]">
      <motion.h1
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-5xl text-center text-4xl leading-[1.12] text-[#242424] sm:text-6xl"
      >
        {lines.map((line, lineIndex) => (
          <span
            key={`${line.text}-${lineIndex}`}
            className={`flex flex-wrap justify-center gap-x-[0.28em] ${line.strong ? 'font-bold' : 'font-medium'}`}
          >
            {line.text.split(' ').map((item, wordIndex) => (
              <motion.span key={`${item}-${wordIndex}`} variants={word} className="inline-block">
                {item}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.h1>
    </main>
  );
}
