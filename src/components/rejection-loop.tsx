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

function StepStatus({ active }: { active: boolean }) {
  return (
    <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6E9EE]">
      {active ? (
        <motion.div
          initial={{ rotate: 0, opacity: 0.85 }}
          animate={{ rotate: 360, opacity: 1 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-[#7D8696] border-t-[#242424]"
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.35 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
          className="absolute inset-0 rounded-full border border-[#C8CED7] bg-[#E6E9EE]"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 460, damping: 18 }}
            className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#242424]"
          >
            ✓
          </motion.span>
        </motion.div>
      )}
    </div>
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
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0.94, y: 4 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="flex items-start gap-3">
          <StepStatus active={active} />
          <div className="min-w-0 flex-1">
            <p
              className={
                isWin
                  ? 'text-lg font-medium tracking-tight text-[#242424] sm:text-xl'
                  : isHero
                    ? 'text-sm font-medium tracking-tight text-[#242424] sm:text-base'
                    : event.owner === 'amazon'
                      ? 'text-sm font-normal text-[#8B95A5]'
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
                className="mt-2 text-lg font-medium tracking-tight text-[#242424] sm:text-[1.25rem]"
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
                    className="flex items-center gap-2.5 text-sm leading-5 text-[#6F7785]"
                  >
                    <span className="h-px w-4 bg-[#D7DCE4]" />
                    {step}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
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
          <div className="relative space-y-6">
            <AnimatePresence initial={false}>
              {visibleEvents.map((event, index) => (
                <WorkflowItem
                  key={event.id}
                  event={event}
                  active={index === visibleEvents.length - 1 && event.owner === 'margin'}
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
