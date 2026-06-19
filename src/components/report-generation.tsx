'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, FileSearch, FileText, Layers, X } from 'lucide-react';

type Phase = 'extracting' | 'compiling' | 'output';

const METADATA = [
  { label: 'Weight: 45.2lb', top: '30%', left: '78%' },
  { label: 'Signature: J. Smith', top: '61%', left: '34%' },
  { label: 'Timestamp: 14:22:01', top: '79%', left: '68%' },
];

const TABS = ['Inputs', 'Reasoning', 'Screenshots', 'Output'];
const spring = { type: 'spring' as const, stiffness: 260, damping: 24 };

export default function ReportGeneration() {
  const [phase, setPhase] = useState<Phase>('extracting');
  const [activeSpotlight, setActiveSpotlight] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (phase === 'extracting') {
      const timers: number[] = [];

      METADATA.forEach((_, index) => {
        timers.push(window.setTimeout(() => setActiveSpotlight(index), index * 1300));
        timers.push(window.setTimeout(() => setExtractedCount(index + 1), index * 1300 + 720));
      });

      timers.push(window.setTimeout(() => setPhase('compiling'), METADATA.length * 1300 + 450));
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }

    if (phase === 'compiling') {
      const timer = window.setTimeout(() => setPhase('output'), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const restartSimulation = () => {
    setShowPreview(false);
    setActiveSpotlight(0);
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans sm:p-8">
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
                      <p className="mt-1 text-[11px] font-semibold text-gray-800">FBA15JJ4K7L1</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Units Shipped</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-800">120 units</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Carrier Weight</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-900">45.2 lb</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Carrier</span>
                      <span className="text-[11px] font-medium text-gray-800">UPS Freight</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Tracking ID</span>
                      <span className="text-[11px] font-medium text-gray-800">1Z84A07Y0391842216</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">Receiving status</span>
                      <span className="text-[11px] font-medium text-emerald-700">Signed and accepted</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Received By</p>
                      <p className="mt-1 text-xs font-semibold text-gray-900">J. Smith</p>
                      <p className="mt-1 text-[10px] text-gray-500">Dock D-14 · Signature verified</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[9px] font-medium uppercase text-gray-400">Delivery Event</p>
                      <p className="mt-1 text-xs font-semibold text-gray-900">Nov 10, 2025</p>
                      <p className="mt-1 text-[10px] text-gray-500">Timestamp 14:22:01 UTC</p>
                    </div>
                  </div>

                  <motion.div
                    animate={{
                      top: METADATA[activeSpotlight].top,
                      left: METADATA[activeSpotlight].left,
                    }}
                    transition={spring}
                    className="absolute z-20 -ml-12 -mt-12 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#007AFF] bg-blue-50/55 shadow-[0_0_0_1000px_rgba(248,250,252,0.3),0_0_24px_rgba(0,122,255,0.3)]"
                  >
                    <FileSearch className="h-6 w-6 text-[#007AFF]" />
                  </motion.div>
                </div>

                <aside className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
                  <p className="mb-5 text-xs font-semibold uppercase text-gray-400">Metadata Identified</p>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {METADATA.slice(0, extractedCount).map((item) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 24, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={spring}
                          className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007AFF]" />
                          <span className="text-xs font-medium text-gray-700">{item.label}</span>
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
                      initial={{ opacity: 1, x: -230, y: (index - 1) * 56, scale: 1 }}
                      animate={{ opacity: [1, 1, 0], x: 0, y: 0, scale: 0.7 }}
                      transition={{ duration: 1.6, delay: index * 0.22, ease: 'easeInOut' }}
                      className="absolute rounded-xl border border-blue-100 bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-md"
                    >
                      {item.label}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ scale: 0.82 }}
                    animate={{ scale: [0.82, 1.08, 1] }}
                    transition={{ duration: 1.8, delay: 1.1 }}
                    className="z-10 flex h-24 w-20 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#007AFF] shadow-xl shadow-blue-100"
                  >
                    <FileText className="h-10 w-10" />
                  </motion.div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900">Compiling Report...</h2>
                <p className="mt-2 text-sm text-gray-400">Binding verified evidence and investigation reasoning</p>
                <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.6, ease: 'easeInOut' }}
                    className="h-full rounded-full bg-[#007AFF]"
                  />
                </div>
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
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Generated Report</h2>
                    <p className="mt-1 text-sm text-gray-400">All evidence bound and verified.</p>
                  </div>

                  <article className="flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:flex-row sm:p-6">
                    <div className="relative h-48 w-36 shrink-0">
                      <div className="absolute inset-0 translate-x-3 -rotate-3 rounded-lg border border-gray-200 bg-gray-100" />
                      <div className="absolute inset-0 translate-x-1.5 rotate-2 rounded-lg border border-gray-200 bg-gray-50" />
                      <div className="absolute inset-0 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                        <div className="flex items-center gap-2 text-[#007AFF]">
                          <FileText className="h-5 w-5" />
                          <span className="text-[9px] font-semibold uppercase">Margin</span>
                        </div>
                        <div className="mt-5 h-2 w-3/4 rounded bg-gray-300" />
                        <div className="mt-3 space-y-2">
                          <div className="h-1.5 rounded bg-gray-100" />
                          <div className="h-1.5 rounded bg-gray-100" />
                          <div className="h-1.5 w-4/5 rounded bg-gray-100" />
                        </div>
                        <div className="mt-6 rounded-md bg-blue-50 p-3">
                          <div className="h-1.5 w-2/3 rounded bg-blue-200" />
                          <div className="mt-2 h-1.5 rounded bg-blue-100" />
                        </div>
                        <span className="absolute bottom-3 right-3 text-[8px] text-gray-300">1 / 14</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">Dispute Investigation Report</h3>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-500">PDF Document</p>
                      <p className="mt-1 text-sm text-gray-400">2.4 MB · 14 pages</p>
                      <p className="mt-1 text-sm text-gray-400">Created Nov 12, 2025</p>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="flex h-10 items-center rounded-xl border border-gray-950 bg-gray-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={downloadReport}
                          className="flex h-10 items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={restartSimulation}
                          className="px-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-900"
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
