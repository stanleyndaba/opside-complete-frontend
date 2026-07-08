'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const firstLine = 'Margin recovers from Amazon policy changes';
const secondLine = 'in real-time';

export default function StatementSimulate() {
  const [showSecondLine, setShowSecondLine] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSecondLine(true), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 font-sans text-[#242424]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center text-3xl leading-[1.15] text-[#242424] sm:text-4xl md:text-5xl">
        <motion.p
          initial={{ opacity: 0, x: -42, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="font-medium"
        >
          {firstLine}
        </motion.p>

        {showSecondLine ? (
          <motion.p
            initial={{ opacity: 0, x: 42, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold"
          >
            <span className="text-[#007AFF] underline decoration-[#007AFF] decoration-2 underline-offset-[6px]">
              {secondLine}
            </span>
          </motion.p>
        ) : (
          <div className="h-[1.15em]" aria-hidden="true" />
        )}
      </div>
    </main>
  );
}
