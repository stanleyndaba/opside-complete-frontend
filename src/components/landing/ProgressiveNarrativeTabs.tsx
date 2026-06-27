import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const CHAPTERS = [
  {
    id: 1,
    title: 'The claim window closes fast.',
    subtext: 'Once a discrepancy is identified, the seller has limited time to gather the right evidence and file correctly.',
    duration: 6000,
  },
  {
    id: 2,
    title: 'The proof is scattered everywhere.',
    subtext: 'The invoice is in Gmail. The POD is in a carrier portal. The BOL is in Drive. The case ID is in Seller Central. The payout is buried in a settlement report.',
    duration: 6000,
  },
  {
    id: 3,
    title: 'Delay becomes lost money.',
    subtext: 'If the evidence is missing, late, weak, or rejected, a valid recovery opportunity can expire.',
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
    <section ref={containerRef} className="relative bg-white py-32 md:py-48">
      <div className="mx-auto w-full max-w-[880px] px-6 md:px-8">
        
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#0B74DE] mb-16 md:mb-24">
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
                    isActive ? 'text-[#182026]' : 'text-[#182026]/20 group-hover:text-[#182026]/40'
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
                      <p className="max-w-[720px] text-[18px] sm:text-[20px] md:text-[24px] leading-relaxed text-[#66737F]">
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
