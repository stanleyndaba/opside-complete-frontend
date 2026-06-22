'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const firstStatement = ['Most', 'sellers', 'stop', 'here'];
const secondStatement = ['This', 'is', 'where', 'Margin'];

const wordMotion = {
  hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: 0.22 + index * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function MarginTakesOver() {
  const prefersReducedMotion = useReducedMotion();
  const [stage, setStage] = useState<'stop' | 'takeover'>('stop');
  const activeStage = prefersReducedMotion ? 'takeover' : stage;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = window.setTimeout(() => setStage('takeover'), 2800);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-[#242424]">
      <div className="w-full max-w-5xl text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          {activeStage === 'stop' ? (
            <motion.h1
              key="stop"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
              transition={{ duration: 0.55, ease: [0.4, 0, 1, 1] }}
              className="flex flex-wrap justify-center gap-x-[0.28em] text-4xl font-medium leading-[1.12] sm:text-6xl"
            >
              {firstStatement.map((word, index) => (
                <motion.span
                  key={word}
                  custom={index}
                  variants={wordMotion}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>
          ) : (
            <motion.h1
              key="takeover"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap justify-center gap-x-[0.28em] text-4xl font-semibold leading-[1.12] sm:text-6xl"
            >
              {secondStatement.map((word, index) => (
                <motion.span
                  key={word}
                  custom={index}
                  variants={wordMotion}
                  initial={prefersReducedMotion ? false : 'hidden'}
                  animate="visible"
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                custom={secondStatement.length}
                variants={wordMotion}
                initial={prefersReducedMotion ? false : 'hidden'}
                animate="visible"
                className="relative inline-block text-[#007AFF]"
              >
                takes over.
                <motion.span
                  aria-hidden="true"
                  initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : 0.92,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute -bottom-[0.08em] left-0 h-[0.055em] w-full origin-left rounded-full bg-[#007AFF]"
                />
              </motion.span>
            </motion.h1>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
