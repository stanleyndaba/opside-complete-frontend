'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCircle2, Download, FileSearch, FileText, Layers, RefreshCw, X } from 'lucide-react';

type Phase = 'extracting' | 'compiling' | 'output';

const METADATA = [
  { label: 'Shipment: FBA15JJ4K7L1' },
  { label: 'Units: 120' },
  { label: 'Weight: 45.2lb' },
  { label: 'Carrier: UPS Freight' },
  { label: 'Tracking: 1Z84...2216' },
  { label: 'Status: Signed & accepted' },
  { label: 'Signature: J. Smith' },
  { label: 'Delivered: Nov 10 · 14:22:01' },
];

const TABS = ['Inputs', 'Reasoning', 'Screenshots', 'Output'];
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
    <span className="relative -mx-1 inline-flex overflow-hidden rounded px-1">
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
    <div className="relative flex h-24 w-20 flex-col items-center rounded-xl border border-red-100 bg-white px-3 pt-4 shadow-xl shadow-red-100/60">
      <div className="absolute right-0 top-0 h-5 w-5 rounded-bl-lg rounded-tr-xl bg-red-100" />
      <div className="mt-2 w-full rounded-md bg-red-600 py-1.5 text-center text-[10px] font-bold text-white">PDF</div>
      <div className="mt-3 h-1 w-full rounded bg-gray-200" />
      <div className="mt-1.5 h-1 w-3/4 self-start rounded bg-gray-100" />
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
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (phase === 'extracting') {
      const timers: number[] = [];

      METADATA.forEach((_, index) => {
        timers.push(window.setTimeout(() => setExtractedCount(index + 1), index * 550 + 400));
      });

      timers.push(window.setTimeout(() => setPhase('compiling'), METADATA.length * 550 + 650));
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    if (phase === 'compiling') {
      const timer = window.setTimeout(() => setPhase('output'), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const restartSimulation = () => {
    setShowPreview(false);
    setExtractedCount(0);
    setPhase('extracting');
  };

  const downloadReport = async () => {
    const { jsPDF } = await import('jspdf');
    const report = new jsPDF();

    report.setFontSize(20);
    report.text('Dispute Claim Report', 20, 28);
    report.setFontSize(11);
    report.text('Amazon FBA Shipment Investigation', 20, 42);
    report.text('Carrier Weight: 45.2lb', 20, 60);
    report.text('Signature: J. Smith', 20, 70);
    report.text('Timestamp: 14:22:01', 20, 80);
    report.text('Finding: Delivery evidence verified and bound to the dispute.', 20, 100);
    report.save('dispute-investigation-report.pdf');
  };

  return (
    <main className="font-apple-system flex min-h-screen items-center justify-center bg-[#FAFAF7] p-3 text-[#182026] selection:bg-[#0B74DE]/16 sm:p-6">
      <section
        className={`flex w-full max-w-5xl flex-col overflow-hidden border border-[#CFE0EA] bg-white ${
          phase === 'output' ? 'h-[min(340px,calc(100vh-48px))]' : 'h-[min(540px,calc(100vh-48px))]'
        }`}
      >
        <header className="flex min-h-14 items-center justify-between border-b border-[#DCE8EE] bg-white px-4 sm:px-6">
          {phase === 'output' ? (
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <span className="hidden font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F] sm:block">Run Output</span>
              <div className="hidden h-5 w-px bg-[#DCE8EE] sm:block" />
              <nav className="flex min-w-0 gap-5" aria-label="Report output">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`relative py-3 font-mono text-[10px] font-medium uppercase tracking-tight transition-colors ${
                      tab === 'Output' ? 'text-[#182026]' : 'text-[#8A99A4] hover:text-[#66737F]'
                    }`}
                  >
                    {tab}
                    {tab === 'Output' && (
                      <motion.span
                        layoutId="report-output-tab"
                        className="absolute -bottom-px left-0 h-px w-full bg-[#182026]"
                        transition={spring}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-[#CFE0EA] bg-[#F8FAFC] text-[#182026]">
                {phase === 'extracting' ? <FileSearch className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Evidence Pack Assembly</p>
                <p className="text-[12px] text-[#66737F]">Dispute evidence pipeline</p>
              </div>
            </div>
          )}

          <div className="ml-3 flex shrink-0 items-center gap-2 border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5">
            <motion.span
              animate={phase === 'output' ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.1, repeat: phase === 'output' ? 0 : Infinity }}
              className={`h-2 w-2 rounded-full ${phase === 'output' ? 'bg-emerald-500' : 'bg-[#007AFF]'}`}
            />
            <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
              {phase === 'output' ? 'Ready' : 'Generating'}
            </span>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden bg-[#FAFAF7]">
          <AnimatePresence mode="wait">
            {phase === 'extracting' && (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 grid gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_260px] md:p-6"
              >
                <div className="relative min-h-[390px] overflow-hidden border border-[#DCE8EE] bg-white p-6 sm:p-7">
                  <div className="flex items-start justify-between border-b border-[#DCE8EE] pb-4">
                    <div>
                      <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Carrier Proof of Delivery</p>
                      <h2 className="mt-1 text-base font-semibold text-[#182026]">Inbound Shipment Receipt</h2>
                      <p className="mt-1 text-[11px] text-[#8A99A4]">Amazon FBA receiving documentation</p>
                    </div>
                    <FileText className="h-5 w-5 text-[#B9C4CC]" />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="border border-[#E4ECF1] bg-[#F8FAFC] p-3">
                      <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Shipment ID</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 1} tone="blue">FBA15JJ4K7L1</MetadataHighlight>
                      </p>
                    </div>
                    <div className="border border-[#E4ECF1] bg-[#F8FAFC] p-3">
                      <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Units Shipped</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 2} tone="amber">120 units</MetadataHighlight>
                      </p>
                    </div>
                    <div className="border border-[#E4ECF1] bg-[#F8FAFC] p-3">
                      <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Carrier Weight</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 3} tone="amber">45.2 lb</MetadataHighlight>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border border-[#DCE8EE]">
                    <div className="flex items-center justify-between border-b border-[#E4ECF1] px-4 py-2.5">
                      <span className="text-[10px] text-[#8A99A4]">Carrier</span>
                      <span className="text-[11px] font-medium text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 4} tone="blue">UPS Freight</MetadataHighlight>
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#E4ECF1] px-4 py-2.5">
                      <span className="text-[10px] text-[#8A99A4]">Tracking ID</span>
                      <span className="text-[11px] font-medium text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 5} tone="blue">1Z84A07Y0391842216</MetadataHighlight>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-[#8A99A4]">Receiving status</span>
                      <span className="text-[11px] font-medium text-emerald-700">
                        <MetadataHighlight active={extractedCount >= 6} tone="emerald">Signed and accepted</MetadataHighlight>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="border border-[#CFEADC] bg-[#F4FBF7] p-3">
                      <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Received By</p>
                      <p className="mt-1 text-xs font-semibold text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 7} tone="emerald">J. Smith</MetadataHighlight>
                      </p>
                      <p className="mt-1 text-[10px] text-[#66737F]">Dock D-14 · Signature verified</p>
                    </div>
                    <div className="border border-[#E4ECF1] bg-[#F8FAFC] p-3">
                      <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Delivery Event</p>
                      <p className="mt-1 text-xs font-semibold text-[#182026]">
                        <MetadataHighlight active={extractedCount >= 8} tone="amber">Nov 10, 2025</MetadataHighlight>
                      </p>
                      <p className="mt-1 text-[10px] text-[#66737F]">
                        Timestamp <MetadataHighlight active={extractedCount >= 8} tone="amber">14:22:01 UTC</MetadataHighlight>
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="border border-[#DCE8EE] bg-[#F8FAFC] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Metadata Identified</p>
                    <span className="font-mono text-[10px] font-medium text-[#8A99A4]">{extractedCount}/{METADATA.length}</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {METADATA.slice(0, extractedCount).map((item) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 24, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={spring}
                          className="flex items-center gap-2.5 border border-[#DCE8EE] bg-white px-3 py-2"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="text-[11px] font-medium text-[#33404A]">{item.label}</span>
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
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-8"
              >
                <div className="relative flex h-56 w-full max-w-xl items-center justify-center">
                  {METADATA.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 1, x: -230, y: (index - (METADATA.length - 1) / 2) * 28, scale: 1 }}
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

                <h2 className="text-lg font-semibold text-[#182026]">Compiling Report...</h2>
                <p className="mt-2 text-sm text-[#8A99A4]">Binding verified evidence and investigation reasoning</p>
                <CompilingCheck />
              </motion.div>
            )}

            {phase === 'output' && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="absolute inset-0 overflow-y-auto p-4 sm:p-5"
              >
                <div className="mx-auto max-w-4xl">
                  <div className="mb-3">
                    <h2 className="text-sm font-medium tracking-tight text-[#182026]">Claim Package Ready</h2>
                    <p className="mt-1 text-sm font-normal text-[#8A8F98]">All evidence bound and verified.</p>
                  </div>

                  <article className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-32 w-[96px] shrink-0">
                      <div className="absolute inset-0 translate-x-3 -rotate-3 border border-[#DCE8EE] bg-white/40" />
                      <div className="absolute inset-0 translate-x-1.5 rotate-2 border border-[#DCE8EE] bg-white/60" />
                      <div className="absolute inset-0 border border-[#DCE8EE] bg-white/85 p-3">
                        <div className="flex items-center justify-between border-b border-[#D8DDE3] pb-2">
                          <span className="text-[8px] font-medium uppercase tracking-tight text-[#242424]">Margin</span>
                          <span className="text-[6px] uppercase tracking-tight text-[#A0A6AE]">Dossier</span>
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="h-1.5 w-20 rounded-full bg-[#242424]/70" />
                          <div className="h-1 w-24 rounded-full bg-[#C7CDD4]" />
                          <div className="h-1 w-16 rounded-full bg-[#E1E5EA]" />
                        </div>
                        <div className="mt-3 space-y-1.5 border-y border-[#E6E9EE] py-2">
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">CASE</span><span className="font-medium text-[#242424]">#17520708561</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">SHIPMENT</span><span className="font-medium text-[#242424]">FBA15JJ4K7L1</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">WEIGHT</span><span className="font-medium text-[#242424]">45.2 lb</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">SIGNATURE</span><span className="font-medium text-[#242424]">J. Smith</span></div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          <div className="h-1 rounded-full bg-[#D8DDE3]" />
                          <div className="h-1 rounded-full bg-[#E6E9EE]" />
                          <div className="h-1 rounded-full bg-[#E6E9EE]" />
                          <div className="h-1 rounded-full bg-[#D8DDE3]" />
                        </div>
                        <span className="absolute bottom-2 right-2 text-[7px] text-[#C5CBD3]">1 / 14</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h3 className="text-[15px] font-bold tracking-tight text-[#182026] sm:text-base">Claim Submission Package</h3>
                      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-tight text-[#8A8F98] sm:text-[11px]">
                        FILE_TYPE: PDF&nbsp;&nbsp; SIZE: 2.4MB&nbsp;&nbsp; PAGES: 14&nbsp;&nbsp; CREATED: NOV 12 2025&nbsp;&nbsp; VERIFIED
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5 sm:justify-start justify-center">
                        {[
                          'Recovery summary', 'Claim type', 'Shipment timeline',
                          'Required evidence checklist', 'Invoice', 'BOL', 'POD',
                          'ASIN/FNSKU mapping', 'Quantity comparison', 'Cost basis',
                          'Case narrative', 'Attachment index', 'Filing deadline', 'Seller approval status'
                        ].map((item) => (
                          <span key={item} className="inline-flex items-center gap-1 border border-[#E6E9EE] bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-medium text-[#66737F]">
                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="flex h-8 items-center rounded-[2px] border border-[#101820] bg-[#101820] px-5 text-sm font-medium text-white transition-colors hover:border-[#0B1117] hover:bg-[#0B1117]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={downloadReport}
                          className="flex h-8 items-center gap-2 text-sm font-medium text-[#8A8F98] transition-colors hover:text-[#242424]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={restartSimulation}
                          className="flex h-8 items-center gap-2 text-sm font-medium text-[#8A8F98] transition-colors hover:text-[#242424]"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

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
              aria-label="Dispute Claim Report preview"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={spring}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-100 bg-white p-8 shadow-xl"
            >
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                aria-label="Close report preview"
                className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-xs font-semibold uppercase text-[#007AFF]">Margin</p>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Dispute Claim Report</h2>
              <p className="mt-2 text-sm text-gray-400">Created Nov 12, 2025</p>
              <div className="my-6 h-px bg-gray-100" />
              <h3 className="text-sm font-semibold text-gray-900">Verified Evidence</h3>
              <div className="mt-4 space-y-3">
                {METADATA.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-gray-600">
                Carrier records, receiving metadata, and the verified warehouse signature establish physical delivery of the disputed shipment.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
