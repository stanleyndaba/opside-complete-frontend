'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckCircle2, Download, FileSearch, FileText, Layers, X } from 'lucide-react';

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
    report.text('Dispute Investigation Report', 20, 28);
    report.setFontSize(11);
    report.text('Amazon FBA Shipment Investigation', 20, 42);
    report.text('Carrier Weight: 45.2lb', 20, 60);
    report.text('Signature: J. Smith', 20, 70);
    report.text('Timestamp: 14:22:01', 20, 80);
    report.text('Finding: Delivery evidence verified and bound to the dispute.', 20, 100);
    report.save('dispute-investigation-report.pdf');
  };

  return (
    <main className="font-apple-system flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-8">
      <section
        className={`flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl ${
          phase === 'output' ? 'h-[min(480px,calc(100vh-32px))]' : 'h-[min(580px,calc(100vh-32px))]'
        }`}
      >
        <header className="flex min-h-16 items-center justify-between border-b border-gray-100 bg-white px-5 sm:px-7">
          {phase === 'output' ? (
            <div className="flex min-w-0 items-center gap-4 sm:gap-6">
              <span className="hidden text-sm font-semibold text-gray-500 sm:block">Run Output</span>
              <div className="hidden h-5 w-px bg-gray-200 sm:block" />
              <nav className="flex min-w-0 gap-1" aria-label="Report output">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-lg px-2 py-2 text-xs font-medium sm:px-3 sm:text-sm ${
                      tab === 'Output' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#007AFF]">
                {phase === 'extracting' ? <FileSearch className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Report Generation</p>
                <p className="text-xs text-gray-400">Dispute evidence pipeline</p>
              </div>
            </div>
          )}

          <div className="ml-3 flex shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1.5">
            <motion.span
              animate={phase === 'output' ? { opacity: 1 } : { opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.1, repeat: phase === 'output' ? 0 : Infinity }}
              className={`h-2 w-2 rounded-full ${phase === 'output' ? 'bg-emerald-500' : 'bg-[#007AFF]'}`}
            />
            <span className="text-[10px] font-semibold uppercase text-gray-500">
              {phase === 'output' ? 'Ready' : 'Generating'}
            </span>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden bg-gray-50/60">
          <AnimatePresence mode="wait">
            {phase === 'extracting' && (
              <motion.div
                key="extracting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 grid gap-5 overflow-y-auto p-5 md:grid-cols-[minmax(0,1fr)_280px] md:p-8"
              >
                <div className="relative min-h-[430px] overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
                  <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-[#007AFF]">Carrier Proof of Delivery</p>
                      <h2 className="mt-1 text-base font-semibold text-gray-900">Inbound Shipment Receipt</h2>
                      <p className="mt-1 text-[11px] text-gray-400">Amazon FBA receiving documentation</p>
                    </div>
                    <FileText className="h-5 w-5 text-gray-300" />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Shipment ID</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-800">
                        <MetadataHighlight active={extractedCount >= 1} tone="blue">FBA15JJ4K7L1</MetadataHighlight>
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Units Shipped</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-800">
                        <MetadataHighlight active={extractedCount >= 2} tone="amber">120 units</MetadataHighlight>
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Carrier Weight</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-900">
                        <MetadataHighlight active={extractedCount >= 3} tone="amber">45.2 lb</MetadataHighlight>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Carrier</span>
                      <span className="text-[11px] font-medium text-gray-800">
                        <MetadataHighlight active={extractedCount >= 4} tone="blue">UPS Freight</MetadataHighlight>
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Tracking ID</span>
                      <span className="text-[11px] font-medium text-gray-800">
                        <MetadataHighlight active={extractedCount >= 5} tone="blue">1Z84A07Y0391842216</MetadataHighlight>
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Receiving status</span>
                      <span className="text-[11px] font-medium text-emerald-700">
                        <MetadataHighlight active={extractedCount >= 6} tone="emerald">Signed and accepted</MetadataHighlight>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Received By</p>
                      <p className="mt-1 text-xs font-semibold text-gray-900">
                        <MetadataHighlight active={extractedCount >= 7} tone="emerald">J. Smith</MetadataHighlight>
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500">Dock D-14 · Signature verified</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Delivery Event</p>
                      <p className="mt-1 text-xs font-semibold text-gray-900">
                        <MetadataHighlight active={extractedCount >= 8} tone="amber">Nov 10, 2025</MetadataHighlight>
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500">
                        Timestamp <MetadataHighlight active={extractedCount >= 8} tone="amber">14:22:01 UTC</MetadataHighlight>
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-gray-400">Metadata Identified</p>
                    <span className="text-[10px] font-semibold text-gray-400">{extractedCount}/{METADATA.length}</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {METADATA.slice(0, extractedCount).map((item) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 24, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={spring}
                          className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="text-[11px] font-medium text-gray-700">{item.label}</span>
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
                      className="absolute rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-md"
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

                <h2 className="text-xl font-semibold text-gray-900">Compiling Report...</h2>
                <p className="mt-2 text-sm text-gray-400">Binding verified evidence and investigation reasoning</p>
                <CompilingCheck />
              </motion.div>
            )}

            {phase === 'output' && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="absolute inset-0 overflow-y-auto p-4 sm:p-6"
              >
                <div className="mx-auto max-w-4xl">
                  <div className="mb-4">
                    <h2 className="text-base font-medium tracking-tight text-[#242424] sm:text-lg">Generated Report</h2>
                    <p className="mt-1 text-sm font-normal text-[#8A8F98]">All evidence bound and verified.</p>
                  </div>

                  <article className="flex flex-col items-center gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/50 sm:flex-row sm:p-6">
                    <div className="relative h-44 w-32 shrink-0">
                      <div className="absolute inset-0 translate-x-2.5 -rotate-2 rounded-lg border border-gray-200 bg-[#F4F5F6]" />
                      <div className="absolute inset-0 translate-x-1 rotate-1 rounded-lg border border-gray-200 bg-[#FAFAFA]" />
                      <div className="absolute inset-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-medium uppercase text-[#242424]">Margin</span>
                          <span className="text-[6px] text-[#A0A6AE]">Private</span>
                        </div>
                        <div className="mt-3 border-y border-[#D8DDE3] py-2">
                          <p className="text-[7px] font-medium leading-tight text-[#242424]">Dispute investigation</p>
                          <p className="mt-0.5 text-[6px] text-[#8A8F98]">Delivery evidence report</p>
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">Case ID</span><span className="font-medium text-[#242424]">#17520708561</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">Shipment</span><span className="font-medium text-[#242424]">FBA15JJ4K7L1</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">Weight</span><span className="font-medium text-[#242424]">45.2 lb</span></div>
                          <div className="flex justify-between gap-2 text-[6px]"><span className="text-[#A0A6AE]">Signed by</span><span className="font-medium text-[#242424]">J. Smith</span></div>
                        </div>
                        <div className="mt-2 rounded-sm border border-emerald-100 bg-emerald-50 px-2 py-1 text-[6px] font-medium text-emerald-700">Delivery verified</div>
                        <span className="absolute bottom-3 right-3 text-[8px] text-[#C5CBD3]">1 / 14</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                        <h3 className="text-base font-medium tracking-tight text-[#242424] sm:text-lg">Dispute Investigation Report</h3>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-normal text-[#5E6670]">PDF Document</p>
                      <p className="mt-1 text-sm text-[#8A8F98]">2.4 MB · 14 pages</p>
                      <p className="mt-1 text-sm text-[#8A8F98]">Created Nov 12, 2025</p>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="flex h-9 items-center rounded-[10px] border border-[#242424] bg-[#242424] px-5 text-sm font-medium text-white transition-colors hover:bg-[#343434]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={downloadReport}
                          className="flex h-9 items-center gap-2 rounded-[10px] border border-[#D3D7DE] bg-white px-5 text-sm font-medium text-[#242424] transition-colors hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={restartSimulation}
                          className="px-2 text-xs font-normal text-[#8A8F98] transition-colors hover:text-[#242424]"
                        >
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
              aria-label="Dispute Investigation Report preview"
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
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">Dispute Investigation Report</h2>
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
