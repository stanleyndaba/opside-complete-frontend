'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, animate, useInView } from 'framer-motion';

/* ── Data ──────────────────────────────────────────────── */
const DATA_POINTS = [
  { cases: '0', accuracy: 58 },
  { cases: '1k', accuracy: 67 },
  { cases: '2k', accuracy: 74 },
  { cases: '3k', accuracy: 82 },
  { cases: '4k', accuracy: 88 },
  { cases: '5k', accuracy: 93 },
];

const Y_MIN = 50;
const Y_MAX = 100;
const Y_TICKS = [50, 60, 70, 80, 90, 100];

/* ── Chart geometry ────────────────────────────────────── */
const SVG_W = 640;
const SVG_H = 320;
const PAD = { top: 36, right: 32, bottom: 44, left: 52 };
const CHART_W = SVG_W - PAD.left - PAD.right;
const CHART_H = SVG_H - PAD.top - PAD.bottom;

function xPos(i: number) {
  return PAD.left + (i / (DATA_POINTS.length - 1)) * CHART_W;
}
function yPos(val: number) {
  return PAD.top + CHART_H - ((val - Y_MIN) / (Y_MAX - Y_MIN)) * CHART_H;
}

/* Build the SVG path */
const linePath = DATA_POINTS.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(d.accuracy)}`).join(' ');

/* Build area path (line + close to bottom) */
const areaPath =
  linePath +
  ` L ${xPos(DATA_POINTS.length - 1)} ${yPos(Y_MIN)} L ${xPos(0)} ${yPos(Y_MIN)} Z`;

/* ── Animated counter ──────────────────────────────────── */
function AnimatedValue({ target, active }: { target: number; active: boolean }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    const ctrl = animate(0, target, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [active, target]);

  return <>{active ? `${val}%` : ''}</>;
}

/* ── Main component ────────────────────────────────────── */
export default function Graph() {
  const [revealedCount, setRevealedCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.35 });

  /* Stagger data-point reveals once in view */
  useEffect(() => {
    if (!isInView) return;

    const timers = DATA_POINTS.map((_, i) =>
      window.setTimeout(() => setRevealedCount(i + 1), 400 + i * 420),
    );

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const progress = revealedCount / DATA_POINTS.length;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-4 font-sans text-[#242424] sm:p-8">
      <section
        ref={sectionRef}
        className="w-full max-w-[860px]"
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="font-serif text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-[#242424] sm:text-[36px] md:text-[42px]">
            Evidence Intelligence Accuracy Over Time
          </h1>
          <p className="mt-4 max-w-[680px] text-[15px] leading-7 text-[#9CA3AF] md:text-[16px] md:leading-8">
            Margin learns from every approved, rejected, underpaid, and reversed claim to improve how it scores future evidence packs before filing.
          </p>
        </motion.div>

        {/* ── Graph card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="mt-10 rounded-2xl border border-[#EEEFF2] bg-white p-5 sm:p-8"
        >
          {/* Axis labels */}
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#C5CAD0]">
              Evidence decision accuracy (%)
            </span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#C5CAD0]">
              Resolved recovery cases learned from
            </span>
          </div>

          {/* SVG chart */}
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Evidence intelligence accuracy graph rising from 58% to 93% over 5,000 resolved cases"
          >
            {/* Horizontal grid lines */}
            {Y_TICKS.map((tick) => (
              <line
                key={tick}
                x1={PAD.left}
                y1={yPos(tick)}
                x2={SVG_W - PAD.right}
                y2={yPos(tick)}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
            ))}

            {/* Y-axis labels */}
            {Y_TICKS.map((tick) => (
              <text
                key={`y-${tick}`}
                x={PAD.left - 10}
                y={yPos(tick) + 4}
                textAnchor="end"
                className="fill-[#C5CAD0] font-mono text-[11px]"
              >
                {tick}%
              </text>
            ))}

            {/* X-axis labels — appear as graph reveals */}
            {DATA_POINTS.map((d, i) => (
              <motion.text
                key={`x-${i}`}
                x={xPos(i)}
                y={SVG_H - 8}
                textAnchor="middle"
                className="fill-[#C5CAD0] font-mono text-[11px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: i < revealedCount ? 1 : 0 }}
                transition={{ duration: 0.35 }}
              >
                {d.cases}
              </motion.text>
            ))}

            {/* Area fill — very subtle */}
            <motion.path
              d={areaPath}
              fill="#9CA3AF"
              fillOpacity={0.04}
              initial={{ opacity: 0 }}
              animate={{ opacity: isInView ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
            />

            {/* Animated line — soft grey, not navy */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: isInView ? progress : 0,
                opacity: isInView ? 1 : 0,
              }}
              transition={{ pathLength: { duration: 0.45, ease: 'easeOut' }, opacity: { duration: 0.3 } }}
            />

            {/* Data-point dots + value labels */}
            {DATA_POINTS.map((d, i) => {
              const cx = xPos(i);
              const cy = yPos(d.accuracy);
              const visible = i < revealedCount;

              return (
                <g key={`dot-${i}`}>
                  {/* Clean dot — small, soft */}
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="white"
                    stroke="#D1D5DB"
                    strokeWidth="1.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={visible ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.circle
                    cx={cx}
                    cy={cy}
                    r="2"
                    fill="#9CA3AF"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={visible ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.25, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />

                  {/* Clean text label — no badge, no background */}
                  <motion.text
                    x={cx}
                    y={cy - 14}
                    textAnchor="middle"
                    className="fill-[#4B5563] font-mono text-[12px] font-semibold"
                    initial={{ opacity: 0, y: cy - 8 }}
                    animate={visible ? { opacity: 1, y: cy - 14 } : {}}
                    transition={{ duration: 0.35, delay: 0.1 }}
                  >
                    <AnimatedValue target={d.accuracy} active={visible} />
                  </motion.text>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* ── Bottom caption ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 2.8 }}
          className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#D1D5DB]"
        >
          Operational memory · Recovery intelligence
        </motion.p>
      </section>
    </main>
  );
}
