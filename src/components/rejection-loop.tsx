'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';

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

function AnimatedCheck() {
  return (
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.65, ease: 'easeInOut' }}
      className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gray-300 border-t-[#3aaa78] text-[#3aaa78]"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 460, damping: 18, delay: 0.58 }}
        className="absolute inset-[-1.5px] flex items-center justify-center rounded-full border-[1.5px] border-[#3aaa78] bg-emerald-50"
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.span>
    </motion.div>
  );
}

export default function RejectionLoop() {
  const [visibleCount, setVisibleCount] = useState(0);
  const isSimulating = visibleCount < TIMELINE.length;

  useEffect(() => {
    const timers = TIMELINE.map((event, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), event.delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const visibleEvents = TIMELINE.slice(0, visibleCount);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans sm:p-8">
      <section className="flex h-[min(620px,calc(100vh-32px))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/90 shadow-xl backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-5 py-3 backdrop-blur-md sm:px-6">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Resolution Workflow</h1>
            <p className="mt-0.5 text-xs text-gray-400">Analyzing responses and advancing the case</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
            <motion.span
              animate={isSimulating ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: isSimulating ? Infinity : 0 }}
              className={`h-2 w-2 rounded-full ${isSimulating ? 'bg-[#3aaa78]' : 'bg-emerald-500'}`}
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
                      className="ml-8 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 backdrop-blur sm:ml-11"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
                          <img src="/logoimagetwo.png" alt="" aria-hidden="true" className="h-3.5 w-auto object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-emerald-700">Margin</p>
                          <p className="mt-0.5 text-sm font-medium text-gray-700">
                            Analyzing Rejection Root-Cause...
                          </p>
                        </div>
                        <AnimatedCheck />
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
                        <span className="text-[10px] font-semibold uppercase text-emerald-700">Resubmitting</span>
                        <div className="relative h-px flex-1 overflow-visible bg-emerald-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 bg-[#3aaa78] shadow-[0_0_10px_rgba(58,170,120,0.55)]"
                          />
                          <motion.div
                            initial={{ left: 0, opacity: 0 }}
                            animate={{ left: '100%', opacity: [0, 1, 1] }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute -top-3 -translate-x-full rounded-full bg-[#3aaa78] p-1.5 text-white shadow-lg shadow-emerald-100"
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
                          ? 'border-gray-200 bg-gray-100/80'
                          : 'border-emerald-200 bg-emerald-50/70'
                    }`}
                  >
                    <div
                      className={`absolute -left-[45px] top-4 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm sm:-left-[53px] ${
                        isApproval
                          ? 'border-emerald-200 text-emerald-500'
                          : event.kind === 'amazon'
                            ? 'border-gray-300 text-gray-500'
                            : 'border-emerald-200 text-emerald-600'
                      }`}
                    >
                      {isAmazon ? (
                        <img
                          src="/amazon-logo-transparent-circle.png"
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src="/logoimagetwo.png" alt="" aria-hidden="true" className="h-3 w-auto object-contain" />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            isApproval
                              ? 'text-emerald-700'
                              : event.kind === 'amazon'
                                ? 'text-gray-600'
                                : 'text-emerald-700'
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
                      {event.kind === 'margin' && <AnimatedCheck />}
                      {isApproval && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </section>
    </main>
  );
}
