'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';

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

type HighlightTone = 'yellow' | 'emerald' | 'rose';

const highlightColors: Record<HighlightTone, string> = {
  yellow: 'bg-yellow-100',
  emerald: 'bg-emerald-100',
  rose: 'bg-rose-100',
};

function MetadataHighlight({
  active,
  children,
  tone,
}: {
  active: boolean;
  children: ReactNode;
  tone: HighlightTone;
}) {
  return (
    <span className="relative -mx-0.5 inline-flex overflow-hidden rounded px-0.5">
      <motion.span
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`absolute inset-0 origin-left ${highlightColors[tone]}`}
      />
      <motion.span
        className="relative z-10"
        animate={active ? { color: '#111827', fontWeight: 600 } : { color: '#9ca3af', fontWeight: 400 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function MatchAnalysisViz() {
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setResolved(true), 1600);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 text-[13px] leading-7 text-gray-500">
        <p>
          Amazon received fewer units than the inbound shipment record shows were shipped.{' '}
          <MetadataHighlight active={resolved} tone="yellow">60 shipped, 46 received</MetadataHighlight>{' '}
          with a{' '}
          <MetadataHighlight active={resolved} tone="yellow">14-unit gap at ONT8</MetadataHighlight>
          .
        </p>

        <p>
          Inbound discrepancy details are being matched to the evidence trail.{' '}
          <MetadataHighlight active={resolved} tone="yellow">What Margin found</MetadataHighlight>{' '}
          confirms the claim path.
        </p>

        <p>
          Current filing movement is ready to file when filing gates allow it.{' '}
          <MetadataHighlight active={resolved} tone="emerald">Next action: Open case.</MetadataHighlight>
        </p>

        <p>Margin is comparing shipment, receipt, and reimbursement records to determine whether the gap can move into a case.</p>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-3">
        <div className="space-y-2">
          <div className="space-y-1.5 text-[12px] leading-5 text-gray-700">
            <p>
              <span className="font-medium text-gray-400 uppercase tracking-[0.14em] text-[10px]">Shipment</span>{' '}
              Shipment <MetadataHighlight active={resolved} tone="yellow">FBA17ACME001</MetadataHighlight> ·{' '}
              <MetadataHighlight active={resolved} tone="yellow">60 shipped</MetadataHighlight>.
            </p>
            <p>
              <span className="font-medium text-gray-400 uppercase tracking-[0.14em] text-[10px]">Receipt</span>{' '}
              Amazon received <MetadataHighlight active={resolved} tone="yellow">46 units</MetadataHighlight> at{' '}
              <MetadataHighlight active={resolved} tone="yellow">ONT8</MetadataHighlight>.
            </p>
            <p>
              <span className="font-medium text-gray-400 uppercase tracking-[0.14em] text-[10px]">Backend</span>{' '}
              Record <MetadataHighlight active={resolved} tone="rose">00000000-000</MetadataHighlight> · Source{' '}
              <MetadataHighlight active={resolved} tone="rose">SP API</MetadataHighlight> · Sync{' '}
              <MetadataHighlight active={resolved} tone="rose">acme-sync-20260420</MetadataHighlight>
            </p>
          </div>

          <div className="border-t border-gray-100 pt-2 text-[12px] leading-5 text-gray-700">
            <p>
              <span className="font-medium text-gray-400 uppercase tracking-[0.14em] text-[10px]">Case readiness</span>{' '}
              <MetadataHighlight active={resolved} tone="emerald">Claim candidate</MetadataHighlight> · Deadline{' '}
              <MetadataHighlight active={resolved} tone="emerald">Apr 2, 2026</MetadataHighlight> · Case link{' '}
              <MetadataHighlight active={resolved} tone="emerald">ACME-CASE-2001</MetadataHighlight>
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-gray-200 pt-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-9 w-full rounded-[10px] bg-[#007AFF] text-sm font-medium text-white shadow-md shadow-blue-100"
            type="button"
          >
            Confirm Evidence Match
            <ArrowRight className="ml-2 inline-block h-3.5 w-3.5" />
          </motion.button>
        </div>
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
      <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-2">
        <div className="min-h-[740px] bg-white rounded-[14px] shadow-xl border border-gray-100 overflow-hidden flex flex-col relative">
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
                <MetadataHighlight active={scanProgress >= 10} tone="yellow">60 units shipped</MetadataHighlight>{' '}
                to{' '}
                <MetadataHighlight active={scanProgress >= 10} tone="yellow">ONT8</MetadataHighlight>
                . Amazon receiving records show fewer units than the shipment record.
              </p>

              <p>
                <MetadataHighlight active={scanProgress >= 22} tone="yellow">Amazon received 46 units</MetadataHighlight>
                , leaving a{' '}
                <MetadataHighlight active={scanProgress >= 22} tone="yellow">14-unit gap</MetadataHighlight>{' '}
                that must be matched to the evidence trail.
              </p>

              <p>
                Amazon policy basis for{' '}
                <MetadataHighlight active={scanProgress >= 40} tone="emerald">
                  FBA inventory reimbursement review
                </MetadataHighlight>{' '}
                is applied when the affected product, unit movement, and reimbursement outcome reconcile.
              </p>

              <p>
                Evidence fields include{' '}
                <MetadataHighlight active={scanProgress >= 58} tone="emerald">Shipment FBA17ACME001</MetadataHighlight>
                , Order{' '}
                <MetadataHighlight active={scanProgress >= 58} tone="emerald">113-8043372-9097841</MetadataHighlight>
                , SKU{' '}
                <MetadataHighlight active={scanProgress >= 58} tone="emerald">ACME-TRAVEL-MUG-BLK</MetadataHighlight>
                , and a{' '}
                <MetadataHighlight active={scanProgress >= 58} tone="emerald">14-unit shortage</MetadataHighlight>.
              </p>

              <p>
                Backend detection record{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="rose">00000000-000</MetadataHighlight> from{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="rose">SP API</MetadataHighlight> sync{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="rose">acme-sync-20260420</MetadataHighlight>. Case{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="emerald">ACME-CASE-2001</MetadataHighlight> is a{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="emerald">claim candidate</MetadataHighlight> before{' '}
                <MetadataHighlight active={scanProgress >= 80} tone="emerald">Apr 2, 2026</MetadataHighlight>.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-[740px] flex flex-col">
          <div className="bg-white rounded-[14px] p-5 shadow-lg border border-gray-100 flex flex-col h-full">
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
