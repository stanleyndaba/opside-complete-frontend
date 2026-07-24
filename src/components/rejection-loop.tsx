'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion } from 'framer-motion';

type WorkflowEvent = {
  id: string;
  owner: 'amazon' | 'margin';
  code: string;
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
    code: 'AMZ-REPLY-01',
    label: 'Amazon response received',
    body: 'Support requested proof of delivery, invoice support, and transaction detail before review can continue.',
    delay: 500,
  },
  {
    id: 'analysis',
    owner: 'margin',
    code: 'REQUIREMENTS PARSED',
    label: 'Requirements parsed',
    steps: ['Amazon evidence requests identified', 'POD already linked to shipment', 'Invoice already linked to cost basis'],
    delay: 2100,
  },
  {
    id: 'protocol',
    owner: 'margin',
    code: 'CASE UPDATED',
    label: 'Evidence gap resolved',
    steps: ['Quantity variance explanation added', 'Missing support matched to records', 'Evidence packet rebuilt with case history intact'],
    delay: 4000,
    emphasis: 'hero',
  },
  {
    id: 'resubmission',
    owner: 'margin',
    code: 'SELLER APPROVAL',
    label: 'Updated response ready',
    steps: ['Proof packet updated', 'Response language prepared', 'Seller approval required before submission'],
    delay: 6100,
  },
  {
    id: 'approval',
    owner: 'amazon',
    code: 'OUTCOME',
    label: 'Reimbursement approved',
    body: 'Recovered value initiated to Seller Balance after the follow-up response.',
    delay: 8200,
    emphasis: 'win',
  },
];

const spring = { type: 'spring' as const, stiffness: 260, damping: 28 };

/* ── Counter animation ─────────────────────────────────── */
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

/* ── Single workflow event card ────────────────────────── */
function WorkflowItem({
  event,
  isVisible,
  index,
}: {
  event: WorkflowEvent;
  isVisible: boolean;
  index: number;
}) {
  const isHero = event.emphasis === 'hero';
  const isWin = event.emphasis === 'win';
  const isAmazon = event.owner === 'amazon';

  return (
    <motion.article
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring}
      className="relative grid grid-cols-[42px_1fr_96px] gap-3 border-b border-[#DCE8EE] py-2.5 last:border-b-0"
    >
      <div className="font-mono text-[10px] text-[#8A99A4]">{`00:${String(index * 4 + 3).padStart(2, '0')}`}</div>

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`h-2 w-2 ${isAmazon ? 'bg-[#8A99A4]' : isHero ? 'bg-[#0B74DE]' : 'bg-[#2F8A62]'}`}
          />
          <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
            {event.code}
          </span>
        </div>

        <p
          className={
            isWin
              ? 'text-[17px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]'
              : isHero
                ? 'text-[15px] font-semibold leading-tight tracking-[-0.03em] text-[#182026]'
                : isAmazon
                  ? 'text-[14px] font-medium leading-tight text-[#4D5B66]'
                  : 'text-[14px] font-semibold leading-tight text-[#182026]'
          }
          style={isWin || isHero ? { fontFamily: 'Georgia, Merriweather, serif' } : undefined}
        >
          {event.label}
        </p>

        {isWin ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                '0 0 0 rgba(47,138,98,0)',
                '0 0 14px rgba(47,138,98,0.16)',
                '0 0 8px rgba(47,138,98,0.08)',
              ],
            }}
            transition={{ delay: 0.18, duration: 0.7, ease: 'easeOut' }}
            className="mt-1 text-[14px] font-semibold leading-tight tracking-tight text-[#182026]"
          >
            <CountUpCurrency start={isVisible} />
            <p className="mt-1 text-[11px] font-normal leading-4 text-[#66737F]">{event.body}</p>
          </motion.div>
        ) : (
          event.body && <p className="mt-1 text-[11px] leading-4 text-[#66737F]">{event.body}</p>
        )}

        {event.steps && (
          <motion.ul
            className="mt-1.5 grid gap-0.5"
            initial="hidden"
            animate="show"
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
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-center gap-2 text-[11px] leading-4 text-[#4D5B66]"
              >
                <span className="h-px w-4 bg-[#AEBAC5]" />
                {step}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      <div className="text-right">
        <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#8A99A4]">
          {isWin ? 'outcome' : isAmazon ? 'pushback' : 'strategy'}
        </span>
        {isHero && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mt-2 h-px origin-right bg-[#0B74DE]"
          />
        )}
      </div>
    </motion.article>
  );
}

function StrategicSummary({ isComplete }: { isComplete: boolean }) {
  return (
    <aside className="border-l border-[#DCE8EE] bg-[#F8FAFC] p-3.5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Case continuity</p>
      <h2
        className="mt-1.5 text-[17px] font-semibold leading-tight tracking-[-0.04em] text-[#182026]"
        style={{ fontFamily: 'Georgia, Merriweather, serif' }}
      >
        Response Orchestration
      </h2>
      <p className="mt-2 text-[11px] leading-4 text-[#66737F]">
        Margin maintains the case through Amazon's back-and-forth instead of treating each response as a new manual task.
      </p>
      <div className="mt-3 border-y border-[#DCE8EE] py-2.5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Response signals</p>
        <ul className="mt-2 space-y-1.5 text-[11px] leading-4 text-[#33404A]">
          <li>Amazon evidence requests</li>
          <li>Missing support</li>
          <li>Case-thread blockers</li>
          <li>Prior submissions</li>
        </ul>
      </div>
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 border border-[#DCE8EE] bg-white p-2.5"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#2F8A62]">Response ready for approval</p>
            <p className="mt-1.5 text-[11px] leading-4 text-[#4D5B66]">
              The requested support has been added and the evidence packet has been rebuilt without losing the case history.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

/* ── Main component ────────────────────────────────────── */
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
    <main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#FAFAF7] p-2 font-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="flex h-[calc(100dvh-112px)] max-h-[500px] w-full max-w-5xl flex-col overflow-hidden border border-[#CFE0EA] bg-white">
        <header className="flex shrink-0 items-center justify-between border-b border-[#DCE8EE] bg-white px-4 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Amazon response handling</p>
            <h1
              className="mt-0.5 text-[18px] font-semibold leading-tight tracking-[-0.04em] text-[#182026]"
              style={{ fontFamily: 'Georgia, Merriweather, serif' }}
            >
              Adaptive Resubmission
            </h1>
            <p className="mt-1 max-w-2xl text-[11px] leading-4 text-[#66737F]">
              Margin interprets Amazon's response, resolves the evidence gap, and prepares the updated case for seller approval.
            </p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-9 w-9 object-contain" draggable={false} />
            <div className="h-px w-16 bg-[#DCE8EE]" />
            <img src="/logoimagetwo.png" alt="Margin" className="h-11 w-11 object-contain" draggable={false} />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_292px]">
          <div ref={scrollRef} className="min-h-0 overflow-y-auto bg-white px-4 py-1.5 custom-scrollbar">
            <AnimatePresence initial={false}>
              {visibleEvents.map((event, index) => (
                <WorkflowItem
                  key={event.id}
                  event={event}
                  index={index}
                  isVisible={visibleCount > index}
                />
              ))}
            </AnimatePresence>
          </div>
          <StrategicSummary isComplete={!isSimulating} />
        </div>
      </section>
    </main>
  );
}
