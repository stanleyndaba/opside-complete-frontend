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

/* ── Buzzing platform icons ────────────────────────────── */
const PLATFORM_ICONS = [
  {
    id: 'amazon-badge',
    icon: '/amazon-logo-transparent-circle.png',
    alt: 'Amazon',
    size: 52,
    buzzDelay: 0,
  },
  {
    id: 'margin-badge',
    icon: '/logoimagetwo.png',
    alt: 'Margin',
    size: 62,
    buzzDelay: 0.7,
  },
  {
    id: 'gmail-badge',
    icon: '/gmailicon.png',
    alt: 'Gmail',
    size: 52,
    buzzDelay: 0.35,
  },
];

function BuzzingIcons() {
  return (
    <div className="flex items-center gap-3">
      {PLATFORM_ICONS.map((platform) => (
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, scale: 0.5, y: 12 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -5, 0, -3, 0],
            rotate: [0, -2, 0, 2, 0],
          }}
          transition={{
            opacity: { delay: 0.3 + platform.buzzDelay, duration: 0.45, ease: 'easeOut' },
            scale: { delay: 0.3 + platform.buzzDelay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            y: {
              delay: 1.2 + platform.buzzDelay,
              duration: 3.2,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            },
            rotate: {
              delay: 1.4 + platform.buzzDelay,
              duration: 3.8,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            },
          }}
          className="flex items-center justify-center rounded-2xl border border-[#E6E9EE] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          style={{
            width: platform.size,
            height: platform.size,
          }}
        >
          <img
            src={platform.icon}
            alt={platform.alt}
            className="h-[58%] w-[58%] object-contain"
            draggable={false}
          />
        </motion.div>
      ))}
    </div>
  );
}

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
}: {
  event: WorkflowEvent;
  isVisible: boolean;
}) {
  const isHero = event.emphasis === 'hero';
  const isWin = event.emphasis === 'win';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10 }}
      transition={spring}
      className="relative"
    >
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0.94, y: 4 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="min-w-0">
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
              className="mt-0.5 text-lg font-bold tracking-tight text-[#242424] sm:text-[1.25rem] leading-none"
            >
              <CountUpCurrency start={isVisible} />
              <p className="mt-0.5 text-sm font-normal text-[#8B95A5]">{event.body}</p>
            </motion.div>
          ) : (
            event.body && <p className="mt-1.5 text-sm leading-6 text-[#6F7785]">{event.body}</p>
          )}

          {event.steps && (
            <motion.ul
              className="mt-1.5 space-y-1"
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
      </motion.div>
    </motion.article>
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
    <main className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 font-sans text-[#242424] sm:p-8">
      <section className="relative flex h-[min(420px,calc(100vh-32px))] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#E6E9EE] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.06),0_4px_16px_rgba(17,24,39,0.03)]">
        {/* Soft radial overlay – warmer tone */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_80%_8%,rgba(66,133,244,0.04),transparent_40%),radial-gradient(circle_at_20%_90%,rgba(58,170,120,0.03),transparent_35%)]" />

        {/* ── Header with buzzing icons ── */}
        <header className="relative flex items-center justify-between border-b border-[#EAECF0] px-6 py-3 sm:px-8 sm:py-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[#1A1D23]">Amazon Response Handling</h1>
            <p className="mt-0.5 text-sm text-[#8B95A5]">Analyzing responses and advancing the case</p>
          </div>

          {/* Buzzing platform badges */}
          <BuzzingIcons />
        </header>



        {/* ── Event stream ── */}
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-3 sm:px-8 sm:py-4">
          <div className="relative space-y-3.5">
            <AnimatePresence initial={false}>
              {visibleEvents.map((event, index) => (
                <WorkflowItem
                  key={event.id}
                  event={event}
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
