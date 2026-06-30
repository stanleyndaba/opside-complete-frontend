import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type StatementStage = 'idle' | 'first' | 'second' | 'done';

const StatementSimulate = () => {
  const [stage, setStage] = useState<StatementStage>('idle');

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage('first'), 700),
      window.setTimeout(() => setStage('second'), 3100),
      window.setTimeout(() => setStage('done'), 5600),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const isActive = stage === 'first' || stage === 'second';

  return (
    <div className="flex items-center justify-center min-h-screen bg-white font-sans p-12">
      <div className="max-w-3xl text-center">
        <AnimatePresence mode="wait">
          {stage === 'first' && (
            <motion.h1
              key="policy-changes"
              initial={{ opacity: 0, filter: 'blur(20px)', y: 18, scale: 0.96 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(18px)', y: -18, scale: 0.98 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
            >
              Margin adapts from Amazon policy changes
            </motion.h1>
          )}

          {stage === 'second' && (
            <motion.h1
              key="real-time"
              initial={{ opacity: 0, filter: 'blur(20px)', y: 18, scale: 0.96 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(18px)', y: -18, scale: 0.98 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
            >
              in{' '}
              <span className="text-[#007AFF] underline decoration-[#007AFF] decoration-2 underline-offset-[6px]">
                real-time
              </span>
            </motion.h1>
          )}
        </AnimatePresence>

        {/* The "Pause" Indicator (Subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 0.2 } : { opacity: 0 }}
          transition={{ delay: isActive ? 1.4 : 0, duration: 0.5 }}
          className="mt-12 flex justify-center gap-1"
        >
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-1 h-1 bg-gray-900 rounded-full animate-bounce [animation-delay:0.4s]" />
        </motion.div>
      </div>
    </div>
  );
};

export default StatementSimulate;
