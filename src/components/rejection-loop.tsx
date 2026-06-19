'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

type TimelineEvent = {
  id: string;
  kind: 'amazon' | 'analysis' | 'margin' | 'resubmission' | 'approval';
  delay: number;
};

const TIMELINE: TimelineEvent[] = [
  { id: 'rejection', kind: 'amazon', delay: 500 },
  { id: 'analysis', kind: 'analysis', delay: 2100 },
  { id: 'counter', kind: 'margin', delay: 4000 },
  { id: 'resubmission', kind: 'resubmission', delay: 6100 },
  { id: 'approval', kind: 'approval', delay: 8200 },
];

const spring = { type: 'spring' as const, stiffness: 320, damping: 28 };

export default function RejectionLoop() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [runId, setRunId] = useState(0);
  const isSimulating = visibleCount < TIMELINE.length;

  useEffect(() => {
    const timers = TIMELINE.map((event, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), event.delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [runId]);

  const restartSimulation = () => {
    setVisibleCount(0);
    setRunId((current) => current + 1);
  };

  const visibleEvents = TIMELINE.slice(0, visibleCount);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans sm:p-8">
      <section className="flex h-[min(680px,calc(100vh-32px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-xl backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-5 py-3 backdrop-blur-md sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Resolution Workflow</h1>
            <p className="mt-0.5 text-xs text-gray-400">Analyzing responses and advancing the case</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
            <motion.span
              animate={isSimulating ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: isSimulating ? Infinity : 0 }}
              className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-[#007AFF]' : 'bg-emerald-500'}`}
            />
            <span className="text-[10px] font-semibold uppercase text-gray-500">
              {isSimulating ? 'Processing' : 'Resolved'}
            </span>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto bg-gray-50/60 px-5 py-5 sm:px-7">
          <div className="absolute bottom-6 left-9 top-6 w-px bg-gray-200 sm:left-11" />

          <div className="relative space-y-3">
            <AnimatePresence initial={false}>
              {visibleEvents.map((event) => {
                if (event.kind === 'analysis') {
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scaleX: 0.75 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={spring}
                      className="ml-8 rounded-xl border border-blue-100 bg-blue-50/80 p-3 backdrop-blur sm:ml-11"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white">
                          <img src="/logoimagetwo.png" alt="Margin" className="h-3.5 w-auto object-contain" />
                        </div>
                        <motion.div
                          animate={{ opacity: [0.45, 1, 0.45] }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                          className="h-7 w-1 rounded-full bg-[#007AFF] shadow-[0_0_12px_rgba(0,122,255,0.55)]"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#007AFF]">Margin</p>
                          <p className="mt-0.5 text-sm font-medium text-gray-700">
                            Analyzing Rejection Root-Cause...
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                if (event.kind === 'resubmission') {
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={spring}
                      className="ml-8 py-1 sm:ml-11"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase text-[#007AFF]">Resubmitting</span>
                        <div className="relative h-px flex-1 overflow-visible bg-blue-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 bg-[#007AFF] shadow-[0_0_12px_rgba(0,122,255,0.8)]"
                          />
                          <motion.div
                            initial={{ left: 0, opacity: 0 }}
                            animate={{ left: '100%', opacity: [0, 1, 1] }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute -top-3 -translate-x-full rounded-full bg-[#007AFF] p-1.5 text-white shadow-lg shadow-blue-200"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                const isAmazon = event.kind === 'amazon' || event.kind === 'approval';
                const isApproval = event.kind === 'approval';

                return (
                  <motion.article
                    key={event.id}
                    initial={{ opacity: 0, x: isAmazon ? 44 : -44, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={spring}
                    className={`relative ml-8 rounded-xl border p-3.5 shadow-sm backdrop-blur sm:ml-11 sm:p-4 ${
                      isApproval
                        ? 'border-emerald-100 bg-emerald-50/90'
                        : event.kind === 'amazon'
                          ? 'border-red-100 bg-red-50/80'
                          : 'border-blue-100 bg-white/90'
                    }`}
                  >
                    <div
                      className={`absolute -left-[45px] top-4 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm sm:-left-[53px] ${
                        isApproval
                          ? 'border-emerald-200 text-emerald-500'
                          : event.kind === 'amazon'
                            ? 'border-red-200 text-red-400'
                            : 'border-blue-200 text-[#007AFF]'
                      }`}
                    >
                      {isAmazon ? (
                        <img
                          src="/amazon-logo-transparent-circle.png"
                          alt="Amazon"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src="/logoimagetwo.png" alt="Margin" className="h-3 w-auto object-contain" />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isApproval
                              ? 'text-emerald-700'
                              : event.kind === 'amazon'
                                ? 'text-red-500'
                                : 'text-[#007AFF]'
                          }`}
                        >
                          {isAmazon ? 'Amazon Seller Central Support' : 'Margin'}
                        </p>
                        <p className={`mt-1.5 text-sm leading-5 ${isApproval ? 'font-medium text-emerald-900' : 'text-gray-700'}`}>
                          {isApproval
                            ? 'Refund Approved. $1,420.00 initiated to Seller Balance.'
                            : event.kind === 'amazon'
                              ? 'Case Rejected - Insufficient Evidence of Delivery.'
                              : 'Executing Second Strike Logic. Binding Carrier Metadata & Digital Signature.'}
                        </p>
                      </div>
                      {event.kind === 'amazon' && <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" />}
                      {isApproval && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <footer className="border-t border-gray-100 bg-white/80 p-3 backdrop-blur-md sm:px-6">
          <motion.button
            type="button"
            onClick={restartSimulation}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSimulating}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-[#007AFF] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            {isSimulating ? 'Second Strike Running' : 'Replay Second Strike'}
          </motion.button>
        </footer>
      </section>
    </main>
  );
}
