'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CheckCircle2, Download, X } from 'lucide-react';

type Phase = 'extracting' | 'compiling' | 'output';

const METADATA = [
  { label: 'Account: NTH-US-01 · FY2026' },
  { label: 'Population: 9,284 inbound shipments' },
  { label: 'Source coverage: Amazon SP-API · ERP · 3PL' },
  { label: 'Scale: 2.8M inventory movement records' },
  { label: 'Network: 6 fulfillment centers · 7,412 SKUs' },
  { label: 'Materiality: $186,420 retained for review' },
  { label: 'Case: REC-2026-004817 · 3 shipments' },
  { label: 'Position: $14,832 supported exposure' },
];

const EVIDENCE_MATCH_SEQUENCE = [
  ['gap', 300],
  ['inbound-record', 520],
  ['units', 680],
  ['evidence-trail', 920],
  ['ont8', 1120],
  ['claim-path', 1320],
  ['filing-gates', 1800],
  ['received', 1580],
  ['policy', 2140],
  ['reimbursement-records', 2380],
  ['order', 2620],
  ['unit-movement', 2920],
  ['shipment', 3080],
  ['affected-product', 3280],
  ['sku', 3480],
  ['reimbursement-outcome', 3660],
  ['shortage', 3860],
  ['record', 4320],
  ['sp-api', 4740],
  ['sync', 5120],
  ['case', 5480],
  ['deadline', 5840],
  ['candidate', 6200],
] as const;

const spring = { type: 'spring' as const, stiffness: 260, damping: 24 };

type HighlightTone = 'blue' | 'amber' | 'emerald';

const highlightColors: Record<HighlightTone, string> = {
  blue: 'bg-blue-200/70',
  amber: 'bg-amber-200/70',
  emerald: 'bg-emerald-200/70',
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
    <span className="relative -mx-1 inline-flex overflow-hidden rounded-[3px] px-1">
      <motion.span
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`absolute inset-0 origin-left ${highlightColors[tone]}`}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

function PdfDocumentIcon() {
  return (
    <div className="relative flex h-24 w-20 flex-col items-center rounded-[3px] border border-red-100 bg-white px-3 pt-4 shadow-xl shadow-red-100/60">
      <div className="absolute right-0 top-0 h-5 w-5 rounded-[3px] bg-red-100" />
      <div className="mt-2 w-full rounded-[3px] bg-red-600 py-1.5 text-center text-[10px] font-bold text-white">PDF</div>
      <div className="mt-3 h-1 w-full rounded-[3px] bg-gray-200" />
      <div className="mt-1.5 h-1 w-3/4 self-start rounded-[3px] bg-gray-100" />
    </div>
  );
}

function CompilingCheck() {
  return (
    <div className="relative mt-5 h-9 w-9">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 720 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full border-2 border-emerald-100 border-t-[#3aaa78]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 460, damping: 18, delay: 1.9 }}
        className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-[#3aaa78] bg-emerald-50 text-[#3aaa78]"
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </motion.div>
    </div>
  );
}

export default function ReportGeneration() {
  const [phase, setPhase] = useState<Phase>('extracting');
  const [extractedCount, setExtractedCount] = useState(0);
  const [evidenceMatches, setEvidenceMatches] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [runId, setRunId] = useState(0);
  const evidenceScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'extracting') {
      const timers: number[] = [];

      METADATA.forEach((_, index) => {
        timers.push(window.setTimeout(() => setExtractedCount(index + 1), index * 550 + 400));
      });

      timers.push(window.setTimeout(() => setPhase('compiling'), 7000));
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    if (phase === 'compiling') {
      const timer = window.setTimeout(() => setPhase('output'), 3000);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'output') {
      const timer = window.setTimeout(() => {
        setShowPreview(false);
        setExtractedCount(0);
        setEvidenceMatches(new Set());
        setPhase('extracting');
        setRunId((current) => current + 1);
      }, 3500);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    evidenceScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    const timeouts = EVIDENCE_MATCH_SEQUENCE.map(([id, delay]) =>
      window.setTimeout(() => {
        setEvidenceMatches((previous) => new Set(previous).add(id));
      }, delay),
    );
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout));
  }, [runId]);

  useEffect(() => {
    if (phase !== 'extracting' || evidenceMatches.size === 0 || !evidenceScrollRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      evidenceScrollRef.current?.scrollBy({ top: 42, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [evidenceMatches.size, phase]);

  const isEvidenceMatchActive = (id: string) => evidenceMatches.has(id);

  const downloadReport = async () => {
    const { jsPDF } = await import('jspdf');
    const report = new jsPDF();

    report.setFontSize(20);
    report.text('Financial Recovery Case File', 20, 28);
    report.setFontSize(11);
    report.text('Northstar Commerce LLC · Amazon US · FY2026 control population', 20, 42);
    report.text('Review population: 9,284 inbound shipments · 6 fulfillment centers', 20, 60);
    report.text('Source coverage: Amazon SP-API · Seller Central · ERP · 3PL', 20, 70);
    report.text('Control record: REC-2026-004817 · 3 shipments · 72 units', 20, 80);
    report.text('Finding: $14,832 supported exposure · no duplicate controlled case path identified.', 20, 100);
    report.save('dispute-investigation-report.pdf');
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAFAF7] p-0 font-google-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1180px] items-center">
      <section
        className={`flex min-h-[620px] w-full flex-col overflow-hidden border-0 bg-white shadow-none sm:rounded-[3px] sm:border sm:border-[#DCE8EE] sm:shadow-[0_1px_2px_rgba(24,32,38,0.03)] ${
          phase === 'output' ? 'h-[min(420px,calc(100vh-180px))]' : 'h-[min(620px,calc(100vh-180px))]'
        }`}
      >
        <div className="relative flex-1 overflow-hidden bg-[#FAFAF7]">
          <AnimatePresence mode="wait">
            {phase === 'extracting' && (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 grid grid-cols-1 gap-2 overflow-y-auto p-0 sm:gap-4 sm:p-4 md:grid-cols-[minmax(0,1fr)_260px] md:p-6"
              >
                <div className="relative h-[360px] overflow-hidden border border-[#DCE8EE] bg-white p-4 sm:h-[390px] sm:p-7">
                  <div className="flex items-start justify-between border-b border-[#DCE8EE] pb-4">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-[#182026]">Recovery case assembly</h2>
                      <p className="mt-1 text-[11px] text-[#8A99A4]">Northstar Commerce LLC · Amazon US · 12-month control population</p>
                    </div>
                  </div>

                  <div ref={evidenceScrollRef} className="h-full overflow-y-auto pr-2 [scrollbar-width:thin]">
                  <div className="mt-2 space-y-1.5 text-[10.5px] leading-[1.15rem] text-[#4D5B66] sm:mt-4 sm:space-y-2.5 sm:text-[13px] sm:leading-6">
                    <p>
                      The account population is being tested across shipment, receiving, inventory, settlement, procurement, and carrier records. From 9,284 inbound shipments,{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('inbound-record')} tone="amber">three related shipments</MetadataHighlight>{' '}
                      form the retained cohort.{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('units')} tone="amber">1,240 expected, 1,168 received</MetadataHighlight>{' '}
                      with a{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('gap')} tone="amber">72-unit receiving variance across ONT8, LGB8, and PHX7</MetadataHighlight>.
                    </p>
                    <p>
                      The material cohort is being reconstructed against the{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('evidence-trail')} tone="amber">evidence chain</MetadataHighlight>.{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('case')} tone="amber">Reconstructed event</MetadataHighlight>{' '}
                      confirms the <MetadataHighlight active={isEvidenceMatchActive('claim-path')} tone="emerald">controlled case path</MetadataHighlight>.
                    </p>
                    <p>
                      Case eligibility is ready for review when{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('filing-gates')} tone="emerald">source, materiality, and clearing controls pass</MetadataHighlight>.{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('candidate')} tone="emerald">Next action: Seller approval required.</MetadataHighlight>
                    </p>
                    <p>
                      Margin is normalizing <MetadataHighlight active={isEvidenceMatchActive('shipment')} tone="amber">shipment</MetadataHighlight>,{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('received')} tone="amber">receiving outcomes</MetadataHighlight>, and{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('reimbursement-records')} tone="emerald">settlement, reimbursement, and ledger records</MetadataHighlight>{' '}
                      to determine whether the retained cohort is supported, attributable, and not already credited.
                    </p>
                    <p>
                      <MetadataHighlight active={isEvidenceMatchActive('policy')} tone="emerald">Enterprise recovery control review</MetadataHighlight>{' '}
                      reconciles the <MetadataHighlight active={isEvidenceMatchActive('affected-product')} tone="emerald">material cohort</MetadataHighlight>,{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('unit-movement')} tone="amber">unit movement across the network</MetadataHighlight>, and{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('reimbursement-outcome')} tone="emerald">financial clearing outcome</MetadataHighlight>{' '}
                      against Case cohort <MetadataHighlight active={isEvidenceMatchActive('order')} tone="amber">REC-2026-004817</MetadataHighlight>, SKU{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('sku')} tone="amber">NS-AIR-PURIFIER-3PK</MetadataHighlight>, and a{' '}
                      <MetadataHighlight active={isEvidenceMatchActive('shortage')} tone="amber">72-unit receiving variance</MetadataHighlight>.
                    </p>
                  </div>

                  <div className="mt-3 border-t border-[#DCE8EE] pt-2 sm:mt-4 sm:pt-3">
                    <div className="space-y-1.5 font-google-sans text-[10.5px] leading-[1.15rem] text-[#25313A]">
                      <p>
                        <span className="font-medium uppercase tracking-tight text-[#66737F]">Review population</span>{' '}
                        Review scope <MetadataHighlight active={isEvidenceMatchActive('shipment')} tone="amber">9,284 inbound shipments</MetadataHighlight> ·{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('units')} tone="amber">12-month population</MetadataHighlight>.
                      </p>
                      <p>
                        <span className="font-medium uppercase tracking-tight text-[#66737F]">Material cohort</span>{' '}
                        Population retained: <MetadataHighlight active={isEvidenceMatchActive('received')} tone="amber">1,240 expected · 1,168 received · 72 units unresolved</MetadataHighlight> across{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('ont8')} tone="amber">ONT8 · LGB8 · PHX7</MetadataHighlight>.
                      </p>
                      <p>
                        <span className="font-medium uppercase tracking-tight text-[#66737F]">Source systems</span>{' '}
                        Control record <MetadataHighlight active={isEvidenceMatchActive('record')} tone="amber">REC-2026-004817</MetadataHighlight> · Source{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('sp-api')} tone="amber">Amazon SP-API · ERP · 3PL</MetadataHighlight> · Sync{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('sync')} tone="amber">NTH-US-01-FY2026</MetadataHighlight>
                      </p>
                    </div>
                    <div className="mt-1.5 border-t border-[#E8EFF3] pt-1.5 font-google-sans text-[10.5px] leading-[1.15rem] text-[#25313A]">
                      <p>
                        <span className="font-medium uppercase tracking-tight text-[#66737F]">Case readiness</span>{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('candidate')} tone="emerald">Evidence-sufficient case</MetadataHighlight> · Materiality{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('deadline')} tone="emerald">$14,832 supported exposure</MetadataHighlight> · Approval state{' '}
                        <MetadataHighlight active={isEvidenceMatchActive('case')} tone="emerald">Seller approval required</MetadataHighlight>
                      </p>
                    </div>
                  </div>
                  </div>
                </div>

                <aside className="flex min-h-[230px] flex-col bg-transparent px-1 py-1 md:min-h-0 md:py-0">
                  <div className="flex items-center justify-between">
                    <p className="font-google-sans text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Control attributes resolved</p>
                    <span className="font-google-sans text-[10px] font-medium text-[#8A99A4]">{extractedCount}/{METADATA.length}</span>
                  </div>
                  <div className="mt-auto flex flex-col-reverse gap-2 pt-4">
                    <AnimatePresence initial={false}>
                      {METADATA.slice(0, extractedCount).map((item) => (
                        <motion.div
                          key={item.label}
                          layout
                          initial={{ opacity: 0, x: 56, scale: 0.92 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={spring}
                          className="flex items-center gap-2.5 rounded-[5px] border border-[#DCE8EE] bg-white px-3 py-2.5 text-[#33404A] shadow-[0_8px_18px_rgba(24,32,38,0.12)]"
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#182026] text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          </span>
                          <span className="text-[11px] font-medium">{item.label}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </aside>
              </motion.div>
            )}

            {phase === 'compiling' && (
              <motion.div
                key="compiling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-6 text-center sm:p-8"
              >
                <div className="relative flex h-56 w-full max-w-2xl items-center justify-center">
                  {METADATA.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 1, x: index % 2 === 0 ? -250 : 250, y: (index - (METADATA.length - 1) / 2) * 28, scale: 1 }}
                      animate={{ opacity: [1, 1, 0], x: 0, y: 0, scale: 0.7 }}
                      transition={{ duration: 1.4, delay: index * 0.12, ease: 'easeInOut' }}
                    className="absolute border border-[#DCE8EE] bg-white px-4 py-2.5 text-xs font-medium text-[#33404A]"
                    >
                      {item.label}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ scale: 0.82 }}
                    animate={{ scale: [0.82, 1.08, 1] }}
                    transition={{ duration: 1.8, delay: 1.1 }}
                    className="z-10"
                  >
                    <PdfDocumentIcon />
                  </motion.div>
                </div>

                <h2 className="text-lg font-semibold text-[#182026]">Building recovery case...</h2>
                <p className="mt-2 text-sm text-[#8A99A4]">Connecting source records, control checks, and case rationale</p>
                <CompilingCheck />
              </motion.div>
            )}

            {phase === 'output' && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="absolute inset-0 flex flex-col justify-center overflow-y-auto p-4 sm:p-5"
              >
                <div className="mx-auto max-w-4xl">
                  <div className="mb-3">
                    <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }} className="flex items-center gap-2 text-sm font-medium tracking-tight text-[#182026]">
                      Recovery case built
                      <motion.span initial={{ opacity: 0, scale: 0.45 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.42 }} className="flex h-4 w-4 items-center justify-center rounded-full bg-[#32B768] text-white shadow-[0_2px_6px_rgba(50,183,104,0.28)]" aria-label="Recovery case built and verified">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.2} />
                      </motion.span>
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }} className="mt-1 text-sm font-normal text-[#8A8F98]">Evidence chain reconciled and source, materiality, and clearing controls passed.</motion.p>
                  </div>

                  <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut', delay: 0.48 }} className="mt-6 flex flex-col items-center gap-5 sm:mt-0 sm:flex-row sm:items-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: 'easeOut', delay: 0.58 }} className="relative hidden h-[116px] w-[86px] shrink-0 sm:block">
                      <div className="absolute inset-0 translate-x-2.5 -rotate-2 border border-[#DCE8EE] bg-white/45" />
                      <div className="absolute inset-0 translate-x-1 rotate-1 border border-[#DCE8EE] bg-white/70" />
                      <div className="absolute inset-0 border border-[#DCE8EE] bg-white p-2.5">
                        <div className="flex items-center justify-between border-b border-[#E3E8ED] pb-1.5">
                          <span className="text-[7px] font-semibold uppercase tracking-tight text-[#182026]">Margin</span>
                          <span className="font-google-sans text-[5.5px] uppercase tracking-tight text-[#A0A6AE]">Verified</span>
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          <div className="h-1.5 w-16 bg-[#182026]/80" />
                          <div className="h-1 w-20 bg-[#C9D0D7]" />
                          <div className="h-1 w-14 bg-[#E4E8EC]" />
                        </div>
                        <div className="mt-3 border-t border-[#E6E9EE] pt-2">
                          <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 font-google-sans text-[5.5px] uppercase tracking-tight">
                            <span className="text-[#A0A6AE]">Case</span>
                            <span className="text-[#182026]">175207</span>
                            <span className="text-[#A0A6AE]">Ship</span>
                            <span className="text-[#182026]">FBA15J</span>
                            <span className="text-[#A0A6AE]">Match</span>
                            <span className="text-[#182026]">14/14</span>
                          </div>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 h-3 bg-[#F3F6F8]">
                          <div className="mt-1 h-1 w-10 bg-[#B8C0C8]" />
                        </div>
                        <span className="absolute bottom-1.5 right-2 text-[6px] text-[#B7C0C9]">1/14</span>
                      </div>
                    </motion.div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <motion.h3 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.62 }} className="text-[15px] font-bold tracking-tight text-[#182026] sm:text-base">Inbound receiving variance case file</motion.h3>
                      <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.72 }} className="mt-1.5 font-google-sans text-[10px] uppercase tracking-tight text-[#8A8F98] sm:text-[11px]">
                        FILE_TYPE: PDF&nbsp;&nbsp; SIZE: 2.4MB&nbsp;&nbsp; PAGES: 14&nbsp;&nbsp; CREATED: APR 30 2026&nbsp;&nbsp; VERIFIED
                      </motion.p>

                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.82 }} className="mt-2.5 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                        {[
                          'Reconciliation summary', 'Finding classification', 'Review scope timeline',
                          'Evidence requirements', 'Commercial invoice', 'Bill of lading', 'POD',
                          'ASIN/FNSKU mapping', 'Quantity variance', 'Cost basis',
                          'Case rationale', 'Evidence index', 'Filing deadline', 'Seller approval status'
                        ].map((item, index) => (
                          <motion.span key={item} initial={{ opacity: 0, y: 7, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28, ease: 'easeOut', delay: 0.84 + index * 0.055 }} className="inline-flex items-center gap-1 rounded-[2px] border-0 bg-[#EEF1F3] px-2 py-0.5 text-[9px] font-medium text-[#30373C]">
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                            {item}
                          </motion.span>
                        ))}
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 1.7 }} className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="flex h-8 items-center gap-2 rounded-[3px] border border-[#182026] bg-black px-5 text-sm font-medium text-white transition-colors hover:border-[#303334] hover:bg-[#303334]"
                        >
                          Open recovery case file <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={downloadReport}
                          className="flex h-8 items-center gap-2 text-sm font-medium text-[#8A8F98] transition-colors hover:text-[#242424]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </motion.div>
                    </div>
                  </motion.article>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Financial Recovery Case File preview"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={spring}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[3px] border border-gray-100 bg-white p-8 shadow-xl"
            >
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                aria-label="Close report preview"
                className="absolute right-4 top-4 rounded-[3px] p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-semibold uppercase text-[#007AFF]">Margin</p>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Financial Recovery Case File</h2>
              <p className="mt-2 text-sm text-gray-400">Created Apr 30, 2026</p>
              <div className="my-6 h-px bg-gray-100" />
              <h3 className="text-sm font-semibold text-gray-900">Reconciled Evidence</h3>
              <div className="mt-4 space-y-3">
                {METADATA.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-[3px] bg-gray-50 p-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-gray-600">
                Carrier records, receiving metadata, inventory movement, and the signed warehouse record establish the receiving variance and support the defined recovery case.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
