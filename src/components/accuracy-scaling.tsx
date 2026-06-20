'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const PARTICLES = Array.from({ length: 40 }, (_, index) => {
  const edge = index % 4;
  const offset = ((index * 37) % 100) / 100 - 0.5;

  return {
    id: index,
    x: edge === 0 ? -380 : edge === 1 ? 380 : offset * 620,
    y: edge === 2 ? -220 : edge === 3 ? 220 : offset * 300,
    delay: (index % 10) * 0.14,
    duration: 1.1 + (index % 5) * 0.1,
  };
});

export default function AccuracyScaling() {
  const [accuracy, setAccuracy] = useState(82.4);
  const [phase, setPhase] = useState<'initial' | 'scaling' | 'peak'>('initial');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('scaling'), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'scaling') return;

    const interval = window.setInterval(() => {
      setAccuracy((previous) => Math.min(99.9, Number((previous + 0.3).toFixed(1))));
    }, 50);

    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'scaling' && accuracy >= 99.9) setPhase('peak');
  }, [accuracy, phase]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl flex flex-col items-center">

        {/* The Particle Field (Visual representation of "more cases") */}
        <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden">
          <AnimatePresence>
            {phase === 'scaling' && PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: particle.x,
                  y: particle.y,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 0.5, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
                className="absolute h-1.5 w-1.5 rounded-full bg-[#111827]"
              />
            ))}
          </AnimatePresence>

          {/* Central Accuracy Display */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{
                scale: phase === 'peak' ? 1.1 : 1,
                color: '#111827',
                textShadow: phase === 'peak' ? '0 0 24px rgba(17,24,39,0.2)' : '0 0 0 rgba(17,24,39,0)',
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="text-7xl font-black tabular-nums"
            >
              {accuracy.toFixed(1)}%
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[10px] font-bold uppercase text-gray-400"
            >
              Case Build Accuracy
            </motion.div>
          </div>

          {/* Precision Ring */}
          <svg className="absolute h-80 w-80 -rotate-90" viewBox="0 0 320 320" aria-hidden="true">
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="1"
            />
            <motion.circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke={phase === 'peak' ? '#050505' : '#111827'}
              strokeWidth={phase === 'peak' ? 3 : 2}
              strokeDasharray="880"
              initial={{ strokeDashoffset: 880 }}
              animate={{ strokeDashoffset: 880 - (accuracy / 100) * 880 }}
              transition={{ duration: 0.5 }}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* The Core Text */}
        <div className="mt-6 space-y-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: phase === 'peak' ? '0 0 18px rgba(17,24,39,0.12)' : '0 0 0 rgba(17,24,39,0)',
            }}
            className="max-w-md text-2xl font-medium leading-tight text-[#111827]"
          >
            Improves case build accuracy <br />
            <span className="font-bold">with more cases</span>
          </motion.h2>

          <AnimatePresence>
            {phase === 'peak' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2"
              >
                <CheckCircle2 className="h-4 w-4 text-[#111827]" />
                <span className="text-xs font-semibold text-[#111827]">
                  Verified
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sub-text / Footnote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-[10px] font-medium uppercase text-gray-300"
        >
          Margin Proprietary Feedback Loop v4.2
        </motion.p>
      </div>
    </div>
  );
}
