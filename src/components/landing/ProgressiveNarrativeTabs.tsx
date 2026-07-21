import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const CHAPTERS = [
  {
    id: 1,
    title: 'The claim window keeps closing.',
    subtext: 'Once a discrepancy is found, the seller still has to prove the shipment, quantity, cost, case history, and payout before Amazon closes the window.',
    duration: 6000,
  },
  {
    id: 2,
    title: 'Your proof stays scattered.',
    subtext: 'The invoice is in Gmail. The POD is in a carrier portal. The BOL is in Drive. The case ID is in Seller Central. None of it helps until it belongs to the same claim.',
    duration: 6000,
  },
  {
    id: 3,
    title: 'Recoverable money quietly expires.',
    subtext: 'A valid recovery can die because proof arrived late, Amazon asked again, or the payout never matched the approval.',
    duration: 6000,
  }
];

export function ProgressiveNarrativeTabs() {
  const [activeChapter, setActiveChapter] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!isInView || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const index = chapterRefs.current.findIndex((node) => node === visible.target);
        if (index >= 0) {
          setActiveChapter(index);
        }
      },
      {
        root: null,
        threshold: [0.25, 0.4, 0.55, 0.7, 0.85],
        rootMargin: '-28% 0px -32% 0px',
      }
    );

    chapterRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [isInView]);

  return (
    <section ref={containerRef} className="relative bg-white py-32 max-md:border-b max-md:border-[#E5E7EB] max-md:py-20 md:py-48">
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-8">
        <div className="max-w-[880px]">
          <div className="mb-16 text-[11px] font-bold uppercase tracking-tight text-[#0B74DE] md:mb-24">
            Why timing matters
          </div>

          <div className="flex flex-col space-y-12 md:space-y-20">
            {CHAPTERS.map((chapter, idx) => {
              const isActive = idx === activeChapter;
              return (
                <div
                  key={chapter.id}
                  ref={(node) => {
                    chapterRefs.current[idx] = node;
                  }}
                  className="group relative flex flex-col text-left outline-none"
                >
                  <h3
                    className={`font-serif-headline text-[32px] font-bold leading-[1.1] tracking-tight transition-colors duration-500 sm:text-[42px] md:text-[56px] ${
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
                        <p className="max-w-[720px] text-[18px] leading-relaxed text-[#66737F] sm:text-[20px] md:text-[24px]">
                          {chapter.subtext}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
