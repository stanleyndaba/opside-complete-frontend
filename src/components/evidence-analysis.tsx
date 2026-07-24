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
    <main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#FAFAF7] p-2 text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="grid h-[calc(100dvh-88px)] max-h-[500px] min-h-0 w-full max-w-6xl grid-cols-1 gap-0 overflow-hidden border border-[#CFE0EA] bg-white lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* LEFT: DOCUMENT PREVIEW */}
        <div className="relative flex min-h-0 flex-col overflow-hidden border-b border-[#DCE8EE] bg-white lg:border-b-0 lg:border-r">
          <div className="z-10 flex items-center justify-between border-b border-[#DCE8EE] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#66737F]" />
              <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Intake_Form_26197503.pdf</span>
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden p-5 sm:p-6">
            {/* Document Content */}
            <div className="space-y-3 select-none text-[12.5px] leading-6 text-[#8A99A4]">
              <p>
                Member submitted a formal dispute on{' '}
                <motion.span
                  animate={scanProgress >= 12 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  January 15, 2024
                </motion.span>
                , regarding a series of unauthorized charges appearing on their account between{' '}
                <motion.span
                  animate={scanProgress >= 12 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  January 10-13, 2024
                </motion.span>
                .
              </p>

              <p className="relative">
                <span className="relative z-10">
                  <motion.span
                    animate={scanProgress >= 25 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    Amazon claims 0 units received
                  </motion.span>
                  , despite the{' '}
                  <motion.span
                    animate={scanProgress >= 25 ? { color: '#25313A', fontWeight: 500 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    carrier delivery record
                  </motion.span>{' '}
                  and warehouse intake confirmation.
                </span>
                <motion.span
                  className="absolute inset-0 -z-0 rounded-[2px] bg-[#F4E8B8]"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 25 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p>
                Upon discovering the transactions, member attempted to resolve the matter directly by contacting{' '}
                <motion.span
                  animate={scanProgress >= 38 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  Technoworld Online
                </motion.span>{' '}
                on{' '}
                <motion.span
                  animate={scanProgress >= 38 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  January 14, 2024
                </motion.span>
                . The merchant's customer service representative was unable to locate an order associated with the member's account.
              </p>

              <p className="relative">
                <span className="relative z-10">
                  Carrier weight log confirms{' '}
                  <motion.span
                    animate={scanProgress >= 50 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    shipment weight of 45.2 lbs
                  </motion.span>
                  , matching the{' '}
                  <motion.span
                    animate={scanProgress >= 50 ? { color: '#25313A', fontWeight: 500 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    original packing list
                  </motion.span>{' '}
                  exactly. No discrepancies found in physical transit logs.
                </span>
                <motion.span
                  className="absolute inset-0 -z-0 rounded-[2px] bg-[#DCEEE5]"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 50 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p className="relative">
                <span className="relative z-10">
                  Receiving clerk{' '}
                  <motion.span
                    animate={scanProgress >= 75 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    J. Smith signed for delivery
                  </motion.span>{' '}
                  at{' '}
                  <motion.span
                    animate={scanProgress >= 75 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    14:22
                  </motion.span>{' '}
                  on{' '}
                  <motion.span
                    animate={scanProgress >= 75 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    Jan 14
                  </motion.span>
                  . Signature verified against the{' '}
                  <motion.span
                    animate={scanProgress >= 75 ? { color: '#25313A', fontWeight: 500 } : { color: '#8A99A4', fontWeight: 400 }}
                  >
                    warehouse staff registry
                  </motion.span>
                  .
                </span>
                <motion.span
                  className="absolute inset-0 -z-0 rounded-[2px] bg-[#F0D7D8]"
                  initial={{ width: 0 }}
                  animate={{ width: scanProgress > 75 ? '100%' : 0 }}
                  transition={{ duration: 1 }}
                />
              </p>

              <p>
                Member confirmed that their{' '}
                <motion.span
                  animate={scanProgress >= 90 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  physical debit card remained in their possession
                </motion.span>{' '}
                during the disputed transaction window and was{' '}
                <motion.span
                  animate={scanProgress >= 90 ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
                >
                  not lost or stolen
                </motion.span>
                . Member further confirmed they have not shared their card number, PIN, or online banking credentials.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: ANALYSIS PANEL */}
        <div className="flex min-h-0 flex-col overflow-hidden bg-[#F8FAFC]">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-[17px] w-[17px] text-[#66737F]" />
              <div>
                <div className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">
                  Evidence extraction
                </div>
                <h3
                  className="mt-1 text-[16px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
                  style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                >
                  Meta-Data Analysis
                </h3>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence initial={false}>
                {activeCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 16, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    className="border border-[#DCE8EE] bg-white px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.55, delay: index * 0.12, ease: 'easeInOut' }}
                        className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#DCE8EE] border-t-[#3aaa78] text-[#3aaa78]"
                      >
                        <motion.span
                          initial={{ opacity: 0, scale: 0.2 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 460, damping: 18, delay: 0.5 + index * 0.12 }}
                          className="absolute inset-[-1.5px] flex items-center justify-center rounded-full border-[1.5px] border-[#3aaa78] bg-[#DCEEE5]"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </motion.span>
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[12px] font-semibold leading-5 text-[#182026]">{card.title}</h4>
                        <p className="mt-0.5 text-[10.5px] leading-[16px] text-[#4D5B66]">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {activeCards.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[#DCE8EE] bg-white">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#B9C4CC]" />
                  </div>
                  <p className="text-sm text-[#8A99A4]">Scanning document for evidence...</p>
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
                className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-[2px] bg-[#182026] font-mono text-[11px] font-medium tracking-tight text-white"
              >
                Proceed to Dispute
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </div>
        </div>

      </section>
    </main>
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
