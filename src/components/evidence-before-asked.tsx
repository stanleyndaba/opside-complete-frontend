import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const TEXT_SEQUENCE = [
  "You shipped 120 units.",
  "Amazon received 113.",
  "You filed a reimbursement claim.",
  "But instead, you received...",
  "Your claim has been denied.",
  "or",
  "We couldn't validate your claim.",
  "We couldn't validate your claim.", // Duplicate string creates a pause because the key won't change
  "The claim wasn't weak.",
  "The evidence trail was."
];

export default function EvidenceBeforeAsked() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % TEXT_SEQUENCE.length);
    }, 1800); // 1.8 seconds per slide
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50 px-6 py-12 font-sans text-slate-900"
      aria-label="Evidence before asked statement animation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(186,230,253,0.35),transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.64), rgba(255,255,255,0.26))',
        }}
      />

      <section className="relative z-10 w-full max-w-[960px]">
        {/* Font size reduced by ~10% (4xl/5xl/6xl/7xl instead of 5xl/6xl/7xl/8xl) */}
        <div className="mx-auto flex h-[200px] flex-col items-center justify-center gap-6 text-center text-4xl font-bold leading-[0.96] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
          <AnimatePresence mode="wait">
            <motion.p
              key={TEXT_SEQUENCE[index]}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[18ch]"
            >
              {TEXT_SEQUENCE[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
