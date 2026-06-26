import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const CHAPTERS = [
  {
    id: 1,
    title: 'The claim window closes fast.',
    subtext: 'Amazon reimbursement claims move on short deadlines. Once a discrepancy is identified, the evidence and filing path must move before the window closes permanently.',
    duration: 6000,
  },
  {
    id: 2,
    title: 'The proof is scattered everywhere.',
    subtext: 'The invoice you need is in an old email; the shipment log is in a WhatsApp thread. Margin connects these sources into a single dossier before the deadline hits.',
    duration: 6000,
  },
  {
    id: 3,
    title: 'Delay becomes lost money.',
    subtext: 'Every day a claim is not filed is a day closer to losing the case. Margin keeps the workflow moving in minutes, ensuring no capital is left behind.',
    duration: 6000,
  }
];

export function ProgressiveNarrativeTabs() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!isInView || isPaused) return;

    const currentTab = CHAPTERS[activeChapter];
    const timer = setTimeout(() => {
      setActiveChapter((prev) => (prev + 1) % CHAPTERS.length);
    }, currentTab.duration);

    return () => clearTimeout(timer);
  }, [activeChapter, isInView, isPaused]);

  return (
    <section ref={containerRef} className="relative bg-[#050B14] py-32 md:py-48">
      <div className="mx-auto w-full max-w-[880px] px-6 md:px-8">
        
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-16 md:mb-24">
          Why timing matters
        </div>

        <div className="flex flex-col space-y-12 md:space-y-20">
          {CHAPTERS.map((chapter, idx) => {
            const isActive = idx === activeChapter;
            return (
              <button
                key={chapter.id}
                onClick={() => { setActiveChapter(idx); setIsPaused(true); }}
                className="group relative flex flex-col text-left outline-none"
              >
                <h3 
                  className={`font-serif-headline text-[32px] sm:text-[42px] md:text-[56px] font-bold leading-[1.1] tracking-tight transition-colors duration-500 ${
                    isActive ? 'text-white' : 'text-white/20 group-hover:text-white/40'
                  }`}
                >
                  {chapter.title}
                </h3>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[720px] text-[18px] sm:text-[20px] md:text-[24px] leading-relaxed text-slate-400">
                        {chapter.subtext}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
