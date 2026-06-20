'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const MAX_INSIGHTS = 8;

const NODES = [
  { x: 300, y: 190 },
  { x: 205, y: 112 },
  { x: 300, y: 82 },
  { x: 395, y: 112 },
  { x: 445, y: 190 },
  { x: 395, y: 268 },
  { x: 300, y: 298 },
  { x: 205, y: 268 },
  { x: 155, y: 190 },
  { x: 110, y: 92 },
  { x: 490, y: 92 },
  { x: 490, y: 288 },
  { x: 110, y: 288 },
];

const CONNECTIONS = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8],
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1],
  [1, 9], [2, 9], [2, 10], [3, 10], [4, 10], [4, 11], [5, 11], [6, 11],
  [6, 12], [7, 12], [8, 12], [9, 12], [9, 10], [10, 11], [11, 12],
] as const;

const PULSE_ORIGINS = [
  { x: -320, y: -110 },
  { x: 320, y: -95 },
  { x: 310, y: 125 },
  { x: -315, y: 130 },
] as const;

type FeedbackPulse = {
  id: number;
  x: number;
  y: number;
  arrived: boolean;
};

export default function FeedbackLearning() {
  const [insights, setInsights] = useState(0);
  const [pulse, setPulse] = useState<FeedbackPulse | null>(null);
  const [modelUpdated, setModelUpdated] = useState(false);
  const complete = insights >= MAX_INSIGHTS;

  useEffect(() => {
    const timeouts: number[] = [];
    let interval: number | undefined;
    let launched = 0;

    const launchFeedback = () => {
      if (launched >= MAX_INSIGHTS) {
        if (interval) window.clearInterval(interval);
        return;
      }

      const id = launched;
      const origin = PULSE_ORIGINS[id % PULSE_ORIGINS.length];
      setPulse({ id, x: origin.x, y: origin.y, arrived: false });

      timeouts.push(window.setTimeout(() => {
        setPulse((current) => current?.id === id ? { ...current, arrived: true } : current);
        setInsights((current) => {
          const next = Math.min(current + 1, MAX_INSIGHTS);
          if (next === MAX_INSIGHTS) {
            setModelUpdated(true);
            timeouts.push(window.setTimeout(() => setModelUpdated(false), 1900));
          }
          return next;
        });
      }, 1050));

      timeouts.push(window.setTimeout(() => {
        setPulse((current) => current?.id === id ? null : current);
      }, 1700));

      launched += 1;
    };

    const initial = window.setTimeout(() => {
      launchFeedback();
      interval = window.setInterval(launchFeedback, 2000);
    }, 800);

    return () => {
      window.clearTimeout(initial);
      if (interval) window.clearInterval(interval);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const visibleConnections = Math.min(CONNECTIONS.length, 7 + insights * 3);
  const visibleNodes = Math.min(NODES.length, 5 + insights);
  const remainingDisorder = MAX_INSIGHTS - insights;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 font-sans text-[#111827]">
      <section className="relative flex w-full max-w-3xl flex-col items-center">
        <div className="relative flex h-[430px] w-full items-center justify-center overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 600 380"
            aria-hidden="true"
          >
            <AnimatePresence>
              {CONNECTIONS.slice(0, visibleConnections).map(([from, to], index) => {
                const source = NODES[from];
                const target = NODES[to];
                const jitter = remainingDisorder * 1.4;

                return (
                  <motion.line
                    key={`${from}-${to}`}
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{
                      opacity: 0.2 + insights * 0.035,
                      pathLength: 1,
                      x1: source.x + Math.sin(index * 1.7) * jitter,
                      y1: source.y + Math.cos(index * 1.3) * jitter,
                      x2: target.x + Math.cos(index * 1.5) * jitter,
                      y2: target.y + Math.sin(index * 1.1) * jitter,
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    stroke="#111827"
                    strokeWidth="0.8"
                  />
                );
              })}
            </AnimatePresence>

            {NODES.slice(0, visibleNodes).map((node, index) => (
              <motion.circle
                key={`${node.x}-${node.y}`}
                initial={{ opacity: 0, r: 0 }}
                animate={{
                  opacity: index === 0 ? 0.8 : 0.35 + insights * 0.035,
                  r: index === 0 ? 4 : 2.4,
                  cx: node.x + Math.sin(index) * remainingDisorder,
                  cy: node.y + Math.cos(index) * remainingDisorder,
                }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                fill="#111827"
              />
            ))}
          </svg>

          <AnimatePresence mode="wait">
            {pulse && (
              <motion.div
                key={pulse.id}
                initial={{ x: pulse.x, y: pulse.y, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                className="absolute z-20 flex h-8 w-8 items-center justify-center"
              >
                <motion.span
                  initial={{ scale: 0.4, opacity: 0.7 }}
                  animate={{ scale: 4.5, opacity: 0 }}
                  transition={{ duration: 1.05, ease: 'easeOut' }}
                  className={`absolute h-8 w-8 rounded-full border ${pulse.arrived ? 'border-blue-300' : 'border-red-300'}`}
                />
                <motion.span
                  animate={{
                    backgroundColor: pulse.arrived ? '#2563EB' : '#DC2626',
                    scale: pulse.arrived ? 1.35 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className="relative h-2.5 w-2.5 rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 max-w-lg bg-white/85 px-6 py-5 text-center backdrop-blur-[2px]">
            <motion.h1
              animate={{ textShadow: complete ? '0 0 20px rgba(17,24,39,0.14)' : '0 0 0 rgba(17,24,39,0)' }}
              className="text-3xl font-medium leading-tight"
            >
              While learning and improving
              <span className="block font-bold">from feedback</span>
            </motion.h1>

            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-xs text-gray-400">Insights Learned</span>
              <motion.span
                key={insights}
                initial={{ opacity: 0.4, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-8 text-left text-lg font-semibold tabular-nums"
              >
                {insights}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Rejection
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-gray-500">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Insight
          </div>
        </div>

        <AnimatePresence>
          {modelUpdated && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-6 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold">Model Updated</span>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
