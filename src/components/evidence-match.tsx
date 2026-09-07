'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

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
  yellow: 'bg-[#F4E8B8]',
  emerald: 'bg-[#DCEEE5]',
  rose: 'bg-[#F0D7D8]',
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
    <span className="relative -mx-0.5 inline-flex overflow-hidden rounded-[2px] px-0.5">
      <motion.span
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`absolute inset-0 origin-left ${highlightColors[tone]}`}
      />
      <motion.span
        className="relative z-10"
        animate={active ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function MatchAnalysisViz() {
  const [activeMatches, setActiveMatches] = useState<Set<string>>(new Set());
  const [buttonReady, setButtonReady] = useState(false);

  useEffect(() => {
    const highlightSequence = [
      ['r-gap', 520],
      ['r-summary', 940],
      ['r-found', 1480],
      ['r-ship-id', 1960],
      ['r-received', 2340],
      ['r-shipped', 2720],
      ['r-action', 3160],
      ['r-ont8', 3540],
      ['r-record', 3920],
      ['r-sp-api', 4340],
      ['r-sync', 4760],
      ['r-candidate', 5140],
      ['r-deadline', 5520],
      ['r-case-link', 5900],
    ] as const;

    const timeouts = highlightSequence.map(([id, delay]) =>
      window.setTimeout(() => {
        setActiveMatches((previous) => new Set(previous).add(id));
      }, delay)
    );
    const buttonTimeout = window.setTimeout(() => setButtonReady(true), 6350);

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      window.clearTimeout(buttonTimeout);
    };
  }, []);

  const isActive = (id: string) => activeMatches.has(id);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 text-[12px] leading-6 text-[#4D5B66] sm:text-[13px]">
        <p>
          Amazon received fewer units than the inbound shipment record shows were shipped.{' '}
          <MetadataHighlight active={isActive('r-summary')} tone="yellow">60 shipped, 46 received</MetadataHighlight>{' '}
          with a{' '}
          <MetadataHighlight active={isActive('r-gap')} tone="yellow">14-unit gap at ONT8</MetadataHighlight>
          .
        </p>

        <p>
          Inbound discrepancy details are being matched to the evidence trail.{' '}
          <MetadataHighlight active={isActive('r-found')} tone="yellow">What Margin found</MetadataHighlight>{' '}
          confirms the claim path.
        </p>

        <p>
          Current filing movement is ready to file when filing gates allow it.{' '}
          <MetadataHighlight active={isActive('r-action')} tone="emerald">Next action: Open case.</MetadataHighlight>
        </p>

        <p>Margin is comparing shipment, receipt, and reimbursement records to determine whether the gap can move into a case.</p>
      </div>

      <div className="mt-4 border-t border-[#DCE8EE] pt-3">
        <div className="space-y-2">
          <div className="space-y-1.5 font-mono text-[11px] leading-5 text-[#25313A]">
            <p>
              <span className="font-medium uppercase tracking-tight text-[#66737F]">Shipment</span>{' '}
              Shipment <MetadataHighlight active={isActive('r-ship-id')} tone="yellow">FBA17ACME001</MetadataHighlight> ·{' '}
              <MetadataHighlight active={isActive('r-shipped')} tone="yellow">60 shipped</MetadataHighlight>.
            </p>
            <p>
              <span className="font-medium uppercase tracking-tight text-[#66737F]">Receipt</span>{' '}
              Amazon received <MetadataHighlight active={isActive('r-received')} tone="yellow">46 units</MetadataHighlight> at{' '}
              <MetadataHighlight active={isActive('r-ont8')} tone="yellow">ONT8</MetadataHighlight>.
            </p>
            <p>
              <span className="font-medium uppercase tracking-tight text-[#66737F]">Backend</span>{' '}
              Record <MetadataHighlight active={isActive('r-record')} tone="rose">00000000-000</MetadataHighlight> · Source{' '}
              <MetadataHighlight active={isActive('r-sp-api')} tone="rose">SP API</MetadataHighlight> · Sync{' '}
              <MetadataHighlight active={isActive('r-sync')} tone="rose">acme-sync-20260420</MetadataHighlight>
            </p>
          </div>

          <div className="border-t border-[#E8EFF3] pt-2 font-mono text-[11px] leading-5 text-[#25313A]">
            <p>
              <span className="font-medium uppercase tracking-tight text-[#66737F]">Case readiness</span>{' '}
              <MetadataHighlight active={isActive('r-candidate')} tone="emerald">Claim candidate</MetadataHighlight> · Deadline{' '}
              <MetadataHighlight active={isActive('r-deadline')} tone="emerald">Apr 2, 2026</MetadataHighlight> · Case link{' '}
              <MetadataHighlight active={isActive('r-case-link')} tone="emerald">ACME-CASE-2001</MetadataHighlight>
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-[#DCE8EE] pt-3">
          {buttonReady && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-8 w-full rounded-[4px] bg-[#182026] font-mono text-[11px] font-medium tracking-tight text-white hover:bg-[#303334]"
              type="button"
            >
              Evidence Match Confirmed
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
export default function EvidenceMatch() {
  const [scanProgress, setScanProgress] = useState(0);
  const [documentMatches, setDocumentMatches] = useState<Set<string>>(new Set());
  const activeHighlights = MATCH_HIGHLIGHTS.filter((card) => scanProgress >= card.triggerLine);

  useEffect(() => {
    if (scanProgress >= 100) return;

    const timeout = window.setTimeout(() => {
      setScanProgress((previous) => Math.min(previous + 0.5, 100));
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [scanProgress]);

  useEffect(() => {
    const highlightSequence = [
      ['l-gap', 300],
      ['l-units', 680],
      ['l-ont8', 1120],
      ['l-received', 1580],
      ['l-policy', 2140],
      ['l-order', 2620],
      ['l-shipment', 3080],
      ['l-sku', 3480],
      ['l-shortage', 3860],
      ['l-record', 4320],
      ['l-sp-api', 4740],
      ['l-sync', 5120],
      ['l-case', 5480],
      ['l-deadline', 5840],
      ['l-candidate', 6200],
    ] as const;

    const timeouts = highlightSequence.map(([id, delay]) =>
      window.setTimeout(() => {
        setDocumentMatches((previous) => new Set(previous).add(id));
      }, delay)
    );

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const isDocumentMatch = (id: string) => documentMatches.has(id);

  return (
    <main className="min-h-screen bg-[#FAFAF7] p-4 text-[#182026] selection:bg-[#0B74DE]/16 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center">
      <section className="grid min-h-[620px] w-full grid-cols-1 gap-0 overflow-hidden rounded-[5px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)] lg:grid-cols-2">
        <div className="relative flex min-h-0 flex-col overflow-hidden border-b border-[#DCE8EE] bg-white lg:border-b-0 lg:border-r">
          <div className="z-10 flex items-center justify-between border-b border-[#DCE8EE] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#66737F]" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
                Shipment_FBA17ACME001.pdf
              </span>
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden p-5 sm:p-6">
            <div className="space-y-3 select-none text-[12.5px] leading-6 text-[#8A99A4]">
              <p>
                Inbound shipment record shows{' '}
                <MetadataHighlight active={isDocumentMatch('l-units')} tone="yellow">60 units shipped</MetadataHighlight>{' '}
                to{' '}
                <MetadataHighlight active={isDocumentMatch('l-ont8')} tone="yellow">ONT8</MetadataHighlight>
                . Amazon receiving records show fewer units than the shipment record.
              </p>

              <p>
                <MetadataHighlight active={isDocumentMatch('l-received')} tone="yellow">Amazon received 46 units</MetadataHighlight>
                , leaving a{' '}
                <MetadataHighlight active={isDocumentMatch('l-gap')} tone="yellow">14-unit gap</MetadataHighlight>{' '}
                that must be matched to the evidence trail.
              </p>

              <p>
                Amazon policy basis for{' '}
                <MetadataHighlight active={isDocumentMatch('l-policy')} tone="emerald">
                  FBA inventory reimbursement review
                </MetadataHighlight>{' '}
                is applied when the affected product, unit movement, and reimbursement outcome reconcile.
              </p>

              <p>
                Evidence fields include{' '}
                <MetadataHighlight active={isDocumentMatch('l-shipment')} tone="emerald">Shipment FBA17ACME001</MetadataHighlight>
                , Order{' '}
                <MetadataHighlight active={isDocumentMatch('l-order')} tone="emerald">113-8043372-9097841</MetadataHighlight>
                , SKU{' '}
                <MetadataHighlight active={isDocumentMatch('l-sku')} tone="emerald">ACME-TRAVEL-MUG-BLK</MetadataHighlight>
                , and a{' '}
                <MetadataHighlight active={isDocumentMatch('l-shortage')} tone="emerald">14-unit shortage</MetadataHighlight>.
              </p>

              <p>
                Backend detection record{' '}
                <MetadataHighlight active={isDocumentMatch('l-record')} tone="rose">00000000-000</MetadataHighlight> from{' '}
                <MetadataHighlight active={isDocumentMatch('l-sp-api')} tone="rose">SP API</MetadataHighlight> sync{' '}
                <MetadataHighlight active={isDocumentMatch('l-sync')} tone="rose">acme-sync-20260420</MetadataHighlight>. Case{' '}
                <MetadataHighlight active={isDocumentMatch('l-case')} tone="emerald">ACME-CASE-2001</MetadataHighlight> is a{' '}
                <MetadataHighlight active={isDocumentMatch('l-candidate')} tone="emerald">claim candidate</MetadataHighlight> before{' '}
                <MetadataHighlight active={isDocumentMatch('l-deadline')} tone="emerald">Apr 2, 2026</MetadataHighlight>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-t border-[#DCE8EE] bg-[#F8FAFC] lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-[#DCE8EE] bg-white px-4 py-3">
            <div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">
                Evidence matching protocol
              </div>
              <h1
                className="mt-1 text-[16px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
                style={{ fontFamily: 'Georgia, Merriweather, serif' }}
              >
                Inbound shipment shortage
              </h1>
            </div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
              Ready
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <MatchAnalysisViz />
          </div>
        </div>
      </section>
      </div>

      <div className="hidden">
        {activeHighlights.length}
      </div>
    </main>
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
