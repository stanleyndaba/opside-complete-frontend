'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, FileText, Search, RefreshCw } from 'lucide-react';

interface MatchHighlight {
  id: string;
  label: string;
  description: string;
  triggerLine: number;
}

const MATCH_HIGHLIGHTS: MatchHighlight[] = [
  {
    id: '1',
    label: 'Shipment Record',
    description: 'Shipment FBA17ACME001 shows 60 units shipped from ONT8.',
    triggerLine: 22,
  },
  {
    id: '2',
    label: 'Inbound Gap',
    description: 'Amazon received 46 units, creating a 14-unit shortage.',
    triggerLine: 48,
  },
  {
    id: '3',
    label: 'Case Ready',
    description: 'Inbound discrepancy is aligned to the claim path and ready for filing.',
    triggerLine: 75,
  },
];

const discrepancyRows = [
  { label: 'Issue', value: 'Inbound Shipment Shortage' },
  { label: 'Shipped', value: '60 units' },
  { label: 'Received', value: '46 units' },
  { label: 'Gap', value: '14 units at ONT8' },
];

const discrepancyFacts = [
  ['Backend record', '00000000-000'],
  ['Source', 'SP API'],
  ['Sync', 'acme-sync-20260420'],
  ['Confidence', 'Not available'],
  ['Coverage', 'Launch detector'],
  ['Readiness', 'Claim candidate'],
  ['Severity', 'High'],
  ['Deadline', 'Apr 2, 2026'],
  ['Movement', 'Ready to file'],
  ['Case link', 'ACME-CASE-2001'],
];

function MatchDocumentViz() {
  const [scanProgress, setScanProgress] = useState(0);
  const activeHighlights = MATCH_HIGHLIGHTS.filter((card) => scanProgress >= card.triggerLine);

  useEffect(() => {
    if (scanProgress >= 100) return;

    const timeout = window.setTimeout(() => {
      setScanProgress((previous) => Math.min(previous + 0.5, 100));
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [scanProgress]);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-4 text-[13px] leading-7 text-gray-500">
        <p>
          Amazon received fewer units than the inbound shipment record shows were shipped.{' '}
          <motion.span
            animate={scanProgress >= 18 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
          >
            60 shipped, 46 received
          </motion.span>{' '}
          with a{' '}
          <motion.span
            animate={scanProgress >= 18 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
          >
            14-unit gap at ONT8
          </motion.span>
          .
        </p>

        <p className="relative">
          <span className="relative z-10">
            What Margin found: Amazon received fewer units than the inbound shipment record shows were shipped.{' '}
            <motion.span
              animate={scanProgress >= 32 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
            >
              Inbound discrepancy
            </motion.span>{' '}
            with{' '}
            <motion.span
              animate={scanProgress >= 32 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
            >
              evidence used
            </motion.span>{' '}
            from the shipment, order, and SKU trail.
          </span>
          <motion.span
            className="absolute inset-0 -z-0 rounded bg-yellow-100"
            initial={{ width: 0 }}
            animate={{ width: scanProgress > 32 ? '100%' : 0 }}
            transition={{ duration: 1 }}
          />
        </p>

        <p className="relative">
          <span className="relative z-10">
            Current filing movement: this finding is linked to a case that can proceed when filing gates allow it.{' '}
            <motion.span
              animate={scanProgress >= 58 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
            >
              Next action: Open case.
            </motion.span>
          </span>
          <motion.span
            className="absolute inset-0 -z-0 rounded bg-emerald-100"
            initial={{ width: 0 }}
            animate={{ width: scanProgress > 58 ? '100%' : 0 }}
            transition={{ duration: 1 }}
          />
        </p>

        <p>
          Margin is comparing shipment, receipt, and reimbursement records to determine whether the unresolved inbound gap can move into a case.
        </p>
      </div>

      <div className="mt-5 space-y-4 border-t border-gray-200 pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {discrepancyRows.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="rounded-[10px] border border-gray-200 bg-gray-50/80 px-3 py-2.5"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                {item.label}
              </div>
              <div className="mt-1 text-[13px] font-semibold leading-5 text-gray-800">{item.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-[10px] border border-gray-200 bg-gray-50/70 p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Evidence used</div>
          <div className="mt-2 text-[13px] leading-6 text-gray-700">
            Shipment FBA17ACME001 · Order 113-8043372-9097841 · SKU ACME-TRAVEL-MUG-BLK · 14 units
          </div>
        </div>

        <div className="rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">Current filing movement</div>
              <div className="mt-1 text-[12px] leading-5 text-gray-700">
                Ready to file when filing gates allow it.
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-emerald-700">
              Open case
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {discrepancyFacts.map(([label, value]) => (
            <div key={label} className="rounded-[10px] border border-gray-200 bg-white px-3 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</div>
              <div className="mt-1 text-[12px] font-semibold leading-5 text-gray-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-gray-200 pt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[11px] font-medium text-gray-500"
        >
          Evidence fields matched against inbound discrepancy.
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-1 h-10 w-full rounded-[10px] bg-[#007AFF] text-sm font-medium text-white shadow-md shadow-blue-100"
          type="button"
        >
          Open case
          <ArrowRight className="ml-2 inline-block h-3.5 w-3.5" />
        </motion.button>
      </div>
    </div>
  );
}

function MatchAnalysisViz() {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setResolved(true), 1600);
    return () => window.clearTimeout(timeout);
  }, []);

  const matchCards = [
    {
      title: 'Inbound Shipment Shortage',
      description: 'Amazon received fewer units than the inbound shipment record shows were shipped.',
    },
    {
      title: '14-unit gap at ONT8',
      description: 'Shipment, receipt, and reimbursement records are being compared for filing readiness.',
    },
    {
      title: 'Claim candidate',
      description: 'The finding is linked to a case that can proceed when filing gates allow it.',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-2">
          <Search className="h-[18px] w-[18px] text-slate-600" />
          <h3 className="text-[15px] font-semibold text-slate-900">Inbound Shipment Shortage</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{resolved ? 'READY' : 'MATCHING'}</span>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-100 py-2.5">
        {[
          { label: 'Shipped', value: '60' },
          { label: 'Received', value: '46' },
          { label: 'Gap', value: '14' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className={i > 0 ? 'border-l border-slate-100 pl-3' : ''}
          >
            <div className="font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              {metric.label}
            </div>
            <div className="mt-1 font-mono text-[13px] font-semibold tracking-tight text-slate-700">
              {metric.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {matchCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 14, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: index * 0.14, duration: 0.4 }}
            className="rounded-[10px] border border-gray-200 bg-gray-50/80 px-3 py-2.5"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-gray-300 bg-emerald-50 text-[#3aaa78]">
                <Check className="h-3 w-3" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-semibold leading-5 text-gray-800">{card.title}</h4>
                <p className="mt-0.5 text-[11px] leading-[17px] text-gray-600">{card.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 rounded-[10px] border border-gray-200 bg-white px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          <span>Backend detection record</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] tracking-tight text-gray-600">
            00000000-000
          </span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ['Source', 'SP API'],
            ['Sync', 'acme-sync-20260420'],
            ['Confidence', 'Not available'],
            ['Coverage', 'Launch detector'],
            ['Readiness', 'Claim candidate'],
            ['Severity', 'High'],
            ['Deadline', 'Apr 2, 2026'],
            ['Movement', 'Ready to file'],
            ['Case link', 'ACME-CASE-2001'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-gray-100 bg-gray-50 px-2.5 py-2">
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</div>
              <div className="mt-1 text-[12px] font-semibold leading-5 text-gray-800">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
        <span className="font-mono text-[9px] tracking-wide text-slate-400">READINESS: CLAIM CANDIDATE</span>
        <span className="font-mono text-[9px] tracking-wide text-slate-500">SEVERITY: HIGH</span>
      </div>
    </div>
  );
}

export default function EvidenceMatch() {
  const [scanProgress, setScanProgress] = useState(0);
  const activeHighlights = MATCH_HIGHLIGHTS.filter((card) => scanProgress >= card.triggerLine);

  useEffect(() => {
    if (scanProgress >= 100) return;

    const timeout = window.setTimeout(() => {
      setScanProgress((previous) => Math.min(previous + 0.5, 100));
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [scanProgress]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex items-start gap-5">
        <div className="flex-1 bg-white rounded-[14px] shadow-xl border border-gray-100 overflow-hidden flex flex-col relative">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Shipment_FBA17ACME001.pdf</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-100" />
              <div className="w-2 h-2 rounded-full bg-gray-100" />
              <div className="w-2 h-2 rounded-full bg-gray-100" />
            </div>
          </div>

          <div className="flex-1 p-8 relative overflow-hidden">
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed select-none">
              <p>
                Inbound shipment record shows{' '}
                <motion.span
                  animate={scanProgress >= 10 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                >
                  60 units shipped
                </motion.span>{' '}
                to{' '}
                <motion.span
                  animate={scanProgress >= 10 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                >
                  ONT8
                </motion.span>
                . Amazon receiving records show fewer units than the shipment record.
              </p>

              <p className="relative">
                <span className="relative z-10">
                  <motion.span
                    animate={scanProgress >= 22 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                  >
                    Amazon received 46 units
                  </motion.span>
                  , leaving a{' '}
                  <motion.span
                    animate={scanProgress >= 22 ? { color: '#1f2937', fontWeight: 500 } : { color: '#9ca3af', fontWeight: 400 }}
                  >
                    14-unit gap
                  </motion.span>{' '}
                  that must be matched to the evidence trail.
                </span>
                <motion.span
                  className="absolute inset-0 bg-yellow-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 22 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p>
                Amazon policy basis for{' '}
                <motion.span
                  animate={scanProgress >= 40 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                >
                  FBA inventory reimbursement review
                </motion.span>{' '}
                is applied when the affected product, unit movement, and reimbursement outcome reconcile.
              </p>

              <p className="relative">
                <span className="relative z-10">
                  Evidence fields include{' '}
                  <motion.span
                    animate={scanProgress >= 58 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                  >
                    Shipment FBA17ACME001
                  </motion.span>
                  , Order 113-8043372-9097841, SKU ACME-TRAVEL-MUG-BLK, and a{' '}
                  <motion.span
                    animate={scanProgress >= 58 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                  >
                    14-unit shortage
                  </motion.span>
                  .
                </span>
                <motion.span
                  className="absolute inset-0 bg-emerald-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 58 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p className="relative">
                <span className="relative z-10">
                  Backend detection record{' '}
                  <motion.span
                    animate={scanProgress >= 80 ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
                  >
                    ready for claim candidate
                  </motion.span>{' '}
                  with confidence not available and high severity.
                </span>
                <motion.span
                  className="absolute inset-0 bg-rose-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 80 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>
            </div>
          </div>
        </div>

        <div className="w-[360px] flex flex-col">
          <div className="bg-white rounded-[14px] p-5 shadow-lg border border-gray-100 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-[18px] h-[18px] text-gray-600" />
              <h3 className="text-[15px] font-semibold text-gray-900">Inbound Shipment Shortage</h3>
            </div>
            <MatchAnalysisViz />
          </div>
        </div>
      </div>

      <div className="hidden">
        {activeHighlights.length}
      </div>
    </div>
  );
}

const styleTag = typeof document !== 'undefined' ? document.createElement('style') : null;
if (styleTag) {
  styleTag.innerHTML = `
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
  `;
  document.head.appendChild(styleTag);
}
