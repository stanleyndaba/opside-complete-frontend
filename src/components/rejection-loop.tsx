'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';

type WorkflowEvent = {
  id: string;
  owner: 'amazon' | 'margin';
  label: string;
  body?: string;
  steps?: string[];
  delay: number;
  emphasis?: 'hero' | 'win';
};

const WORKFLOW: WorkflowEvent[] = [
  {
    id: 'rejection',
    owner: 'amazon',
    label: 'Amazon Support: Case Rejected',
    body: 'Insufficient evidence of delivery.',
    delay: 500,
  },
  {
    id: 'analysis',
    owner: 'margin',
    label: 'Margin: Rejection Pattern Analysis',
    steps: ['Parsing denial language', 'Mapping rejection to recovery rule set', 'Identifying missing proof threshold'],
    delay: 2100,
  },
  {
    id: 'protocol',
    owner: 'margin',
    label: 'Margin: Executing Second Strike Protocol',
    steps: ['Binding carrier metadata', 'Applying digital signature', 'Rebuilding evidence order for review'],
    delay: 4000,
    emphasis: 'hero',
  },
  {
    id: 'resubmission',
    owner: 'margin',
    label: 'Margin: Case Resubmitted',
    steps: ['Evidence packet locked', 'Case response advanced', 'Seller balance recovery tracked'],
    delay: 6100,
  },
  {
    id: 'approval',
    owner: 'amazon',
    label: 'Refund Approved',
    body: 'Initiated to Seller Balance.',
    delay: 8200,
    emphasis: 'win',
  },
];

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

function ThreadMarker({
  owner,
  active,
  win,
  topOffset = 'top-1.5',
}: {
  owner: WorkflowEvent['owner'];
  active: boolean;
  win?: boolean;
  topOffset?: string;
}) {
  if (owner === 'amazon' && !win) {
    return <span className={`absolute left-0 ${topOffset} h-2 w-2 -translate-x-1/2 rounded-full bg-[#9AA3B2]`} />;
  }

  return (
      <span
      className={`absolute left-0 ${topOffset} -translate-x-1/2 rounded-full border ${
        win ? 'h-3 w-3 border-[#3aaa78] bg-[#3aaa78] shadow-[0_0_14px_rgba(58,170,120,0.25)]' : 'h-3 w-3 border-[#D4D9E2] bg-white'
      }`}
    >
      {active && (
        <motion.span
          className="absolute inset-[-8px] rounded-full border border-[#3aaa78]/20"
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0.35, 1.35, 1.9] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </span>
  );
}

function CountUpCurrency({ start }: { start: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    const controls = animate(0, 1420, {
      duration: 1.15,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(latest),
    });

    return () => controls.stop();
  }, [start]);

  return (
    <span className="tabular-nums">
      {new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)}
    </span>
  );
}

function WorkflowItem({
  event,
  active,
  isVisible,
}: {
  event: WorkflowEvent;
  active: boolean;
  isVisible: boolean;
}) {
  const isHero = event.emphasis === 'hero';
  const isWin = event.emphasis === 'win';

  return (
    <motion.article
      initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring}
      className="relative pl-8 sm:pl-10"
    >
      <ThreadMarker owner={event.owner} active={active && event.owner === 'margin'} win={isWin} topOffset={isWin ? 'top-0.5' : 'top-1.5'} />

      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0.94, y: 4 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <p
          className={
            isWin
              ? 'text-lg font-medium tracking-tight text-[#242424] sm:text-xl'
              : isHero
                ? 'text-sm font-medium tracking-tight text-[#242424] sm:text-base'
                : event.owner === 'amazon'
                  ? 'text-sm font-normal text-[#A0A6AE]'
                  : 'text-sm font-medium text-[#242424]'
          }
        >
          {event.label}
        </p>

        {isWin ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                '0 0 0 rgba(58,170,120,0)',
                '0 0 16px rgba(58,170,120,0.18)',
                '0 0 10px rgba(58,170,120,0.1)',
              ],
            }}
            transition={{ delay: 0.18, duration: 0.75, ease: 'easeOut' }}
            className="mt-2 text-2xl font-medium tracking-tight text-[#242424] sm:text-[1.85rem]"
          >
            <CountUpCurrency start={isVisible} />
            <p className="mt-1.5 text-sm font-normal text-[#8B95A5]">{event.body}</p>
          </motion.div>
        ) : (
          event.body && <p className="mt-1.5 text-sm leading-6 text-[#6F7785]">{event.body}</p>
        )}

        {event.steps && (
          <motion.ul
            className="mt-3 space-y-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.45 }}
            variants={{
              hidden: {},
              show: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {event.steps.map((step) => (
              <motion.li
                key={step}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex items-center gap-2.5 text-sm leading-5 text-[#8B95A5]"
              >
                <span className="h-px w-4 bg-[#D7DCE4]" />
                {step}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </motion.article>
  );
}

export default function RejectionLoop() {
  const [visibleCount, setVisibleCount] = useState(0);
  const isSimulating = visibleCount < WORKFLOW.length;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timers = WORKFLOW.map((event, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), event.delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleCount]);

  const visibleEvents = WORKFLOW.slice(0, visibleCount);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 font-sans text-[#242424] sm:p-8">
      <section className="relative flex h-[min(560px,calc(100vh-32px))] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#E6E9EE] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.08)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(58,170,120,0.05),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.6),transparent_45%)]" />

        <header className="relative flex items-center justify-between border-b border-[#E6E9EE] px-6 py-4 sm:px-8">
          <div>
            <h1 className="text-base font-medium tracking-tight text-[#242424]">Resolution Workflow</h1>
            <p className="mt-1 text-sm text-[#8B95A5]">Analyzing responses and advancing the case</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#E6E9EE] bg-[#FAFAFA] px-3 py-1.5">
            <motion.span
              animate={isSimulating ? { opacity: [0.35, 1, 0.35] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: isSimulating ? Infinity : 0 }}
              className="h-1.5 w-1.5 rounded-full bg-[#3aaa78]"
            />
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#8B95A5]">
              {isSimulating ? 'Processing' : 'Resolved'}
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
          <div className="absolute bottom-6 left-[35px] top-6 w-px bg-[#D9DEE6] sm:left-[43px]" />

          <div className="relative space-y-7">
            <AnimatePresence initial={false}>
              {visibleEvents.map((event, index) => (
                <WorkflowItem
                  key={event.id}
                  event={event}
                  active={index === visibleEvents.length - 1 && isSimulating}
                  isVisible={visibleCount > index}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  );
}
