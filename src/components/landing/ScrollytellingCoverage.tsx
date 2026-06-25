import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, AnimatePresence, useReducedMotion } from 'framer-motion';

/* ── Data ─────────────────────────────────────────────────────── */

const workflows = [
  {
    index: '01',
    label: 'Lost inventory discrepancy',
    title: 'Shipment mismatch → claim clock activated',
    detail:
      'Lost inventory reimbursement work is converted from inventory variance into a timed workflow with evidence requirements and filing deadlines.',
  },
  {
    index: '02',
    label: 'Inbound shortage',
    title: 'Received quantity variance → evidence required before eligibility',
    detail:
      'Inbound discrepancies are held until shipment data and supporting records validate eligibility before any claim advances.',
  },
  {
    index: '03',
    label: 'Refund without return',
    title: 'Refund event unmatched to return record → held for validation',
    detail:
      'Refund activity is separated from return proof before a case advances. Unmatched refunds are flagged and held.',
  },
  {
    index: '04',
    label: 'Fee drift',
    title: 'Measurement or fee adjustment variance → recalculation required',
    detail:
      'Fee changes are mapped to the records required before reimbursement workflow execution. Measurement and category drift are tracked.',
  },
  {
    index: '05',
    label: 'Payout mismatch',
    title: 'Approved value differs from received payout → reconciliation triggered',
    detail:
      'Approval and cash movement stay separated until payout state is resolved. Delta amounts are tracked through reconciliation.',
  },
];

/* ── Visual Simulations ───────────────────────────────────────── */

function DiscrepancyDetectionViz() {
  const items = [
    { sku: 'SKU-4821', units: -12, value: '$847.20', status: 'critical' as const },
    { sku: 'SKU-7103', units: -8, value: '$523.84', status: 'critical' as const },
    { sku: 'SKU-2954', units: -23, value: '$1,102.50', status: 'validating' as const },
    { sku: 'SKU-6618', units: -5, value: '$375.00', status: 'queued' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Discrepancy Feed
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-600">SCANNING</span>
        </div>
      </div>

      <div className="mt-4">
        {items.map((item, i) => (
          <motion.div
            key={item.sku}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between border-b border-slate-100 py-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${
                  item.status === 'critical'
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                    : item.status === 'validating'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-slate-300'
                }`}
              />
              <span className="font-mono text-[13px] text-slate-700">{item.sku}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[12px] text-red-600">{item.units} units</span>
              <span className="font-mono text-[13px] text-slate-500">{item.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 flex items-end justify-between"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Total at risk
        </span>
        <span className="font-mono text-[24px] font-bold tracking-tight text-slate-900">$2,847</span>
      </motion.div>

      <motion.div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500"
          initial={{ width: '0%' }}
          animate={{ width: '73%' }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </div>
  );
}

function EvidenceBindingViz() {
  const sources = [
    { label: 'Shipment Record', status: 'Linked', linked: true },
    { label: 'Supplier Invoice', status: 'Linked', linked: true },
    { label: 'Amazon Receiving Report', status: 'Binding...', linked: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Evidence Chain
        </span>
        <span className="text-[10px] font-mono text-amber-600">2/3 BOUND</span>
      </div>

      <div className="mt-5 space-y-1.5">
        {sources.map((src, i) => (
          <React.Fragment key={src.label}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                src.linked
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                    src.linked
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <span className="text-[13px] font-medium text-slate-800">{src.label}</span>
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  src.linked ? 'text-emerald-600' : 'text-amber-600 animate-pulse'
                }`}
              >
                {src.status}
              </span>
            </motion.div>
            {i < sources.length - 1 && (
              <motion.div
                className="ml-8 flex h-2.5 items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.15 }}
              >
                <div
                  className={`h-full w-px ${src.linked ? 'bg-emerald-300' : 'bg-slate-200'}`}
                />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-5 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500 border border-slate-100"
      >
        Case held until all evidence sources are bound and validated.
      </motion.div>
    </div>
  );
}

function RefundMatchingViz() {
  const pairs = [
    { refund: 'RFD-8841', amount: '$67.50', returnId: 'RTN-8841', matched: true },
    { refund: 'RFD-9023', amount: '$112.00', returnId: 'RTN-9023', matched: true },
    { refund: 'RFD-9156', amount: '$89.99', returnId: '—', matched: false },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Refund ↔ Return Matching
        </span>
        <span className="text-[10px] font-mono text-red-600">1 UNMATCHED</span>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 border-b border-slate-100 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>Refund Event</span>
          <span />
          <span className="text-right">Return Record</span>
        </div>

        {pairs.map((pair, i) => (
          <motion.div
            key={pair.refund}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-slate-50 py-3.5"
          >
            <div>
              <div className="font-mono text-[12px] text-slate-700">{pair.refund}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{pair.amount}</div>
            </div>
            <div className={`text-[14px] ${pair.matched ? 'text-emerald-500' : 'text-red-500'}`}>
              {pair.matched ? '←→' : '←✕'}
            </div>
            <div className="text-right">
              <div
                className={`font-mono text-[12px] ${
                  pair.matched ? 'text-slate-700' : 'text-red-600'
                }`}
              >
                {pair.returnId}
              </div>
              {!pair.matched && (
                <div className="mt-0.5 text-[10px] font-semibold text-red-600 animate-pulse">
                  HELD
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
      >
        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <span className="text-[11px] font-medium text-red-700">
          1 unmatched refund held for validation
        </span>
      </motion.div>
    </div>
  );
}

function FeeDriftViz() {
  const fees = [
    { label: 'FBA Fulfillment Fee', listed: '$4.82', actual: '$5.17', delta: '+$0.35' },
    { label: 'Storage Fee (Monthly)', listed: '$0.87', actual: '$1.12', delta: '+$0.25' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Fee Recalculation
        </span>
        <span className="text-[10px] font-mono text-amber-600">DRIFT DETECTED</span>
      </div>

      <div className="mt-5 space-y-4">
        {fees.map((fee, i) => (
          <motion.div
            key={fee.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-tight text-slate-500">
              {fee.label}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <div className="text-[10px] text-slate-400">Listed</div>
                <div className="mt-0.5 font-mono text-[18px] font-bold text-slate-400 line-through">
                  {fee.listed}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Actual</div>
                <div className="mt-0.5 font-mono text-[18px] font-bold text-slate-900">
                  {fee.actual}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Drift</div>
                <div className="mt-0.5 font-mono text-[18px] font-bold text-amber-600">
                  {fee.delta}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 border-t border-slate-200 pt-4"
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Cumulative Impact
            </div>
            <div className="mt-1 text-[11px] text-slate-500">$0.60/unit × 847 units</div>
          </div>
          <div className="font-mono text-[28px] font-bold tracking-tight text-amber-600">$508</div>
        </div>
      </motion.div>
    </div>
  );
}

function PayoutReconciliationViz() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Payout Reconciliation
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-mono text-amber-600">MISMATCH</span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-500">Approved</span>
            <span className="font-mono font-bold text-slate-900">$1,847.00</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-500">Received</span>
            <span className="font-mono font-bold text-slate-700">$1,412.00</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
            <motion.div
              className="h-full rounded-full bg-[#0B74DE]"
              initial={{ width: '0%' }}
              animate={{ width: '76.4%' }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">
              Underpaid Delta
            </div>
            <div className="mt-1 font-mono text-[28px] font-bold tracking-tight text-amber-600">
              $435.00
            </div>
          </div>
          <div className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Reconciliation
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Visual Switcher ──────────────────────────────────────────── */

function WorkflowVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <DiscrepancyDetectionViz />;
    case 1:
      return <EvidenceBindingViz />;
    case 2:
      return <RefundMatchingViz />;
    case 3:
      return <FeeDriftViz />;
    case 4:
      return <PayoutReconciliationViz />;
    default:
      return null;
  }
}

/* ── Main Component ───────────────────────────────────────────── */

export function ScrollytellingCoverage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v: number) => {
      setActiveIndex(Math.min(4, Math.max(0, Math.floor(v * 5))));
    });
    return unsubscribe;
  }, [scrollYProgress]);

  const dur = reduceMotion ? 0 : 0.45;
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '350vh' }}
      aria-label="Coverage examples showing Amazon reimbursement workflows"
    >
      {/* ── Light background ── */}
      <div className="absolute inset-0 bg-[#F3F6F8]" />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(11,116,222,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,116,222,0.06) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute right-[10%] top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(11,116,222,0.05),transparent_70%)]" />

      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8">
          {/* Section header */}
          <div className="text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
            Coverage Examples
          </div>
          <h2 className="mt-3 max-w-[680px] text-[22px] font-semibold leading-tight tracking-[-0.035em] text-[#182026] sm:text-[28px] md:text-[34px]">
            Amazon reimbursement workflows Margin manages.
          </h2>

          {/* ── Split layout ── */}
          <div className="mt-8 grid gap-8 md:mt-12 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            {/* Left: Text */}
            <div className="relative order-2 min-h-[220px] sm:min-h-[260px] md:min-h-[300px] lg:order-1">
              {/* Large background number */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`num-${activeIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pointer-events-none absolute -left-2 -top-4 select-none font-serif-headline text-[120px] font-bold leading-none text-[#182026]/[0.04] sm:text-[160px] md:-left-4 md:-top-8 md:text-[200px]"
                  aria-hidden="true"
                >
                  {workflows[activeIndex].index}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${activeIndex}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: dur, ease }}
                  className="relative"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]/90">
                    {workflows[activeIndex].label}
                  </div>
                  <h3 className="mt-4 max-w-[480px] text-[24px] font-bold leading-[1.1] tracking-[-0.035em] text-[#182026] sm:text-[30px] md:text-[38px]">
                    {workflows[activeIndex].title}
                  </h3>
                  <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {workflows[activeIndex].detail}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="absolute bottom-0 left-0 flex items-center gap-2">
                {workflows.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-500 ${
                      i === activeIndex
                        ? 'h-2 w-8 bg-[#0B74DE]'
                        : i < activeIndex
                        ? 'h-2 w-2 bg-slate-400'
                        : 'h-2 w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Visual panel */}
            <div className="relative order-1 lg:order-2">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/20 to-transparent" />
                <div className="p-5 sm:p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`visual-${activeIndex}`}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                      transition={{ duration: reduceMotion ? 0 : 0.55, ease }}
                    >
                      <WorkflowVisual index={activeIndex} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
