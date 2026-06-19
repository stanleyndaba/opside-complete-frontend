'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, FileText, Search, ArrowRight, RefreshCw } from 'lucide-react';

interface AnalysisCard {
  id: string;
  title: string;
  description: string;
  triggerLine: number;
}

const ANALYSIS_CARDS: AnalysisCard[] = [
  {
    id: '1',
    title: 'Contradiction Identified',
    description: 'Amazon claims 0 units received while carrier records confirm delivery.',
    triggerLine: 25,
  },
  {
    id: '2',
    title: 'Weight Evidence Bound',
    description: 'Carrier weight log confirms 45.2 lbs, matching the packing list.',
    triggerLine: 50,
  },
  {
    id: '3',
    title: 'Signature Verified',
    description: 'Receiving clerk J. Smith signed for delivery on Jan 14.',
    triggerLine: 75,
  },
];

export default function EvidenceAnalysis() {
  const [scanProgress, setScanProgress] = useState(0);
  const activeCards = ANALYSIS_CARDS.filter((card) => scanProgress >= card.triggerLine);

  useEffect(() => {
    if (scanProgress >= 100) return;

    const timeout = window.setTimeout(() => {
      setScanProgress((previous) => Math.min(previous + 0.5, 100));
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [scanProgress]);

  const handleReset = () => {
    setScanProgress(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex gap-5 h-[560px]">

        {/* LEFT: DOCUMENT PREVIEW */}
        <div className="flex-1 bg-white rounded-[14px] shadow-xl border border-gray-100 overflow-hidden flex flex-col relative">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Intake_Form_26197503.pdf</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-100" />
              <div className="w-2 h-2 rounded-full bg-gray-100" />
              <div className="w-2 h-2 rounded-full bg-gray-100" />
            </div>
          </div>

          <div className="flex-1 p-8 relative overflow-hidden">
            {/* Scanner Line */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.5)] z-20 pointer-events-none"
              style={{ top: `${scanProgress}%` }}
            />

            {/* Document Content */}
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed select-none">
              <p>Member submitted a formal dispute on January 15, 2024, regarding a series of unauthorized charges appearing on their account between January 10-13, 2024.</p>

              <p className="relative">
                <span className="relative z-10"><span className="text-gray-900 font-medium">Amazon claims 0 units received</span>, despite the carrier delivery record and warehouse intake confirmation.</span>
                <motion.span
                  className="absolute inset-0 bg-yellow-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 25 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p>Upon discovering the transactions, member attempted to resolve the matter directly by contacting the merchant. Technoworld Online, on January 14, 2024. The merchant's customer service representative was unable to locate an order associated with the member's account.</p>

              <p className="relative">
                <span className="relative z-10">Carrier weight log confirms <span className="text-gray-900 font-medium">shipment weight of 45.2 lbs</span>, matching the original packing list exactly. No discrepancies found in physical transit logs.</span>
                <motion.span
                  className="absolute inset-0 bg-emerald-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 50 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p className="relative">
                <span className="relative z-10">Receiving clerk <span className="text-gray-900 font-medium">J. Smith signed for delivery</span> at 14:22 on Jan 14. Signature verified against warehouse staff registry.</span>
                <motion.span
                  className="absolute inset-0 bg-emerald-100 -z-0 rounded"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 75 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p>Member confirmed that their physical debit card was in their possession at all times during the disputed transaction window and was not lost or stolen. Member further confirmed they have not shared their card number, PIN, or online banking credentials.</p>
            </div>
          </div>
        </div>

        {/* RIGHT: ANALYSIS PANEL */}
        <div className="w-[360px] flex flex-col">
          <div className="bg-white rounded-[14px] p-5 shadow-lg border border-gray-100 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-[18px] h-[18px] text-gray-600" />
              <h3 className="text-[15px] font-semibold text-gray-900">Meta-Data Analysis</h3>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence initial={false}>
                {activeCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 16, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className="rounded-[10px] border border-gray-300 bg-gray-100/80 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.55, delay: index * 0.12, ease: 'easeInOut' }}
                        className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-gray-300 border-t-[#3aaa78] text-[#3aaa78]"
                      >
                        <motion.span
                          initial={{ opacity: 0, scale: 0.2 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 460, damping: 18, delay: 0.5 + index * 0.12 }}
                          className="absolute inset-[-1.5px] flex items-center justify-center rounded-full border-[1.5px] border-[#3aaa78] bg-emerald-50"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.span>
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-semibold leading-5 text-gray-800">{card.title}</h4>
                        <p className="mt-0.5 text-[11px] leading-[17px] text-gray-600">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {activeCards.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw className="w-6 h-6 text-gray-200 animate-spin" />
                  </div>
                  <p className="text-sm text-gray-400">Scanning document for evidence...</p>
                </div>
              )}
            </div>

            {scanProgress === 100 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="mt-4 h-10 w-full bg-[#007AFF] text-white rounded-[10px] text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-blue-100"
              >
                Proceed to Dispute
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Custom styles for the scrollbar
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
