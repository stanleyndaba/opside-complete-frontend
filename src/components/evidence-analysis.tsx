'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, ShieldCheck, FileText, Search, ArrowRight, RefreshCw } from 'lucide-react';

interface AnalysisCard {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'success';
  icon: 'warning' | 'check' | 'shield';
  triggerLine: number;
}

const ANALYSIS_CARDS: AnalysisCard[] = [
  {
    id: '1',
    title: 'Contradiction Identified',
    description: 'Amazon claims 0 units received while carrier records confirm delivery.',
    type: 'warning',
    icon: 'warning',
    triggerLine: 25,
  },
  {
    id: '2',
    title: 'Weight Evidence Bound',
    description: 'Carrier weight log confirms 45.2 lbs, matching the packing list.',
    type: 'success',
    icon: 'check',
    triggerLine: 50,
  },
  {
    id: '3',
    title: 'Signature Verified',
    description: 'Receiving clerk J. Smith signed for delivery on Jan 14.',
    type: 'success',
    icon: 'shield',
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
      <div className="w-full max-w-5xl flex gap-6 h-[600px]">

        {/* LEFT: DOCUMENT PREVIEW */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white z-10">
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

          <div className="flex-1 p-10 relative overflow-hidden">
            {/* Scanner Line */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.5)] z-20 pointer-events-none"
              style={{ top: `${scanProgress}%` }}
            />

            {/* Document Content */}
            <div className="space-y-6 text-gray-400 text-sm leading-relaxed select-none">
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
        <div className="w-[380px] flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-[#007AFF]" />
              <h3 className="font-semibold text-gray-900">Intake Form Analysis</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {activeCards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className={`p-4 rounded-xl border ${
                      card.type === 'warning'
                        ? 'bg-orange-50 border-orange-100'
                        : 'bg-emerald-50 border-emerald-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${card.type === 'warning' ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {card.icon === 'warning' && <AlertCircle className="w-5 h-5" />}
                        {card.icon === 'check' && <CheckCircle className="w-5 h-5" />}
                        {card.icon === 'shield' && <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold ${card.type === 'warning' ? 'text-orange-900' : 'text-emerald-900'}`}>
                          {card.title}
                        </h4>
                        <p className={`text-xs mt-1 leading-relaxed ${card.type === 'warning' ? 'text-orange-700' : 'text-emerald-700'}`}>
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
                className="mt-6 w-full bg-[#007AFF] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                Proceed to Dispute
                <ArrowRight className="w-4 h-4" />
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
