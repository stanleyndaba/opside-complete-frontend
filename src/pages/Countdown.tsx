import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const STARTING_DAYS_LEFT = 30;
const COUNTDOWN_STEP_MS = 28;

const Countdown = () => {
  const reduceMotion = useReducedMotion();
  const [daysLeft, setDaysLeft] = useState(STARTING_DAYS_LEFT);
  const [showDaysLeft, setShowDaysLeft] = useState(true);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const interval = window.setInterval(() => {
      setDaysLeft((current) => {
        if (current <= 0) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, COUNTDOWN_STEP_MS);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    if (daysLeft !== 0) return undefined;

    const timeout = window.setTimeout(() => setShowDaysLeft(false), 180);
    return () => window.clearTimeout(timeout);
  }, [daysLeft]);

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#121212] px-6 font-sans text-[#FF6B35]"
      aria-label="July 30 2026 countdown animation"
    >
      <motion.section
        className="text-center"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.01, 1],
                textShadow: [
                  '0 0 5px rgba(232, 93, 4, 0.5), 0 0 10px rgba(232, 93, 4, 0.3)',
                  '0 0 12px rgba(232, 93, 4, 0.68), 0 0 22px rgba(232, 93, 4, 0.42)',
                  '0 0 5px rgba(232, 93, 4, 0.5), 0 0 10px rgba(232, 93, 4, 0.3)',
                ],
              }
        }
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          textShadow: '0 0 5px rgba(232, 93, 4, 0.5), 0 0 10px rgba(232, 93, 4, 0.3)',
        }}
      >
        <h1 className="flex flex-wrap items-baseline justify-center gap-x-[0.22em] text-[clamp(3.8rem,11vw,11rem)] font-[800] leading-none tracking-normal text-[#FF6B35]">
          <span>JUNE</span>
          {showDaysLeft ? (
            <motion.span
              key={daysLeft}
              className="inline-block min-w-[1.28em] tabular-nums"
              initial={reduceMotion ? false : { opacity: 0.45, y: -18, scale: 1.08 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.05, ease: 'linear' }}
            >
              {daysLeft}
            </motion.span>
          ) : null}
          <span>, 2026</span>
        </h1>

        {showDaysLeft ? (
          <motion.p
            key={daysLeft}
            className="mt-6 text-[clamp(1.4rem,3.4vw,3.3rem)] font-[800] leading-none tracking-normal text-[#E85D04]"
            initial={reduceMotion ? false : { opacity: 0.35, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.05, ease: 'linear' }}
          >
            {daysLeft} days left
          </motion.p>
        ) : null}
      </motion.section>
    </main>
  );
};

export default Countdown;
