import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type DocumentType = 'PDF' | 'DOC' | 'TSX';

type VaultDocument = {
  id: string;
  type: DocumentType;
  color: string;
  startX: number;
  startY: number;
  rotate: number;
  delay: number;
  size?: 'sm' | 'md';
};

const TYPE_COLORS: Record<DocumentType, string> = {
  PDF: '#FF4D4D',
  DOC: '#4D79FF',
  TSX: '#19A974',
};

const documents: VaultDocument[] = [
  { id: 'proof-01', type: 'PDF', color: TYPE_COLORS.PDF, startX: -520, startY: -260, rotate: -8, delay: 0 },
  { id: 'proof-02', type: 'DOC', color: TYPE_COLORS.DOC, startX: 470, startY: -245, rotate: 7, delay: 0.18 },
  { id: 'proof-03', type: 'TSX', color: TYPE_COLORS.TSX, startX: -420, startY: 285, rotate: 5, delay: 0.36 },
  { id: 'proof-04', type: 'PDF', color: TYPE_COLORS.PDF, startX: 520, startY: 250, rotate: -6, delay: 0.54 },
  { id: 'proof-05', type: 'DOC', color: TYPE_COLORS.DOC, startX: -165, startY: -350, rotate: 4, delay: 0.72, size: 'sm' },
  { id: 'proof-06', type: 'TSX', color: TYPE_COLORS.TSX, startX: 210, startY: 350, rotate: -4, delay: 0.9, size: 'sm' },
  { id: 'proof-07', type: 'PDF', color: TYPE_COLORS.PDF, startX: -610, startY: 45, rotate: 8, delay: 1.08 },
  { id: 'proof-08', type: 'DOC', color: TYPE_COLORS.DOC, startX: 610, startY: -40, rotate: -7, delay: 1.26 },
  { id: 'proof-09', type: 'TSX', color: TYPE_COLORS.TSX, startX: -285, startY: -300, rotate: -5, delay: 1.44, size: 'sm' },
  { id: 'proof-10', type: 'PDF', color: TYPE_COLORS.PDF, startX: 320, startY: 305, rotate: 6, delay: 1.62, size: 'sm' },
  { id: 'proof-11', type: 'DOC', color: TYPE_COLORS.DOC, startX: -545, startY: 180, rotate: -9, delay: 1.8 },
  { id: 'proof-12', type: 'TSX', color: TYPE_COLORS.TSX, startX: 555, startY: -185, rotate: 9, delay: 1.98 },
  { id: 'proof-13', type: 'PDF', color: TYPE_COLORS.PDF, startX: -70, startY: 395, rotate: 3, delay: 2.16, size: 'sm' },
  { id: 'proof-14', type: 'DOC', color: TYPE_COLORS.DOC, startX: 75, startY: -395, rotate: -3, delay: 2.34, size: 'sm' },
  { id: 'proof-15', type: 'TSX', color: TYPE_COLORS.TSX, startX: -655, startY: -115, rotate: 6, delay: 2.52 },
  { id: 'proof-16', type: 'PDF', color: TYPE_COLORS.PDF, startX: 655, startY: 115, rotate: -6, delay: 2.7 },
  { id: 'proof-17', type: 'DOC', color: TYPE_COLORS.DOC, startX: -360, startY: 375, rotate: 7, delay: 2.88, size: 'sm' },
  { id: 'proof-18', type: 'TSX', color: TYPE_COLORS.TSX, startX: 390, startY: -370, rotate: -7, delay: 3.06, size: 'sm' },
];

const FloatingDocument = ({ type, color, startX, startY, rotate, delay, size = 'md' }: VaultDocument) => {
  const reduceMotion = useReducedMotion();
  const isSmall = size === 'sm';

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md border bg-white/95 shadow-sm"
      style={{
        width: isSmall ? 46 : 56,
        height: isSmall ? 64 : 78,
        borderColor: `${color}CC`,
        boxShadow: `0 14px 36px rgba(24, 32, 38, 0.08), 0 0 22px ${color}20`,
      }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 0.68, rotate }}
      animate={
        reduceMotion
          ? { x: startX * 0.24, y: startY * 0.24, opacity: 0.85, scale: 0.88, rotate: 0 }
          : {
              x: [startX, startX * 0.62, startX * 0.28, 0],
              y: [startY, startY * 0.54, startY * 0.22, 0],
              opacity: [0, 0.98, 0.92, 0],
              scale: [0.68, 1, 0.72, 0.08],
              rotate: [rotate, rotate * 0.42, rotate * 0.12, 0],
            }
      }
      transition={{
        duration: reduceMotion ? 0 : 5.4,
        delay,
        repeat: reduceMotion ? 0 : Infinity,
        repeatDelay: 0.08,
        ease: [0.76, 0, 0.24, 1],
      }}
    >
      <div className="absolute right-0 top-0 h-3 w-3 rounded-bl border-b border-l border-[#D9E1E8] bg-[#F6F8FA]" />
      <span className="text-[11px] font-black tracking-[0.14em]" style={{ color }}>
        {type}
      </span>
      <span className="mt-3 h-px w-8" style={{ backgroundColor: color, opacity: 0.78 }} />
      <span className="mt-2 h-px w-6" style={{ backgroundColor: color, opacity: 0.52 }} />
      <span className="mt-2 h-px w-4" style={{ backgroundColor: color, opacity: 0.34 }} />
    </motion.div>
  );
};

const DesignSimulate = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-6 font-sans text-[#182026]"
      aria-label="Margin document ingestion animation"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: 'radial-gradient(rgba(114, 128, 143, 0.22) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.1),transparent_31%),linear-gradient(180deg,rgba(246,248,250,0.88),rgba(255,255,255,0.7)_45%,rgba(246,248,250,0.9))]" />

      <section className="relative h-[min(760px,100vh)] w-[min(1180px,100vw)]" aria-label="Documents flowing into the Margin logo">
        {documents.map((document) => (
          <FloatingDocument key={document.id} {...document} />
        ))}

        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <motion.div
            className="flex items-center gap-3"
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.035, 1],
                    filter: [
                      'drop-shadow(0 16px 36px rgba(24,32,38,0.12))',
                      'drop-shadow(0 22px 46px rgba(77,121,255,0.2))',
                      'drop-shadow(0 16px 36px rgba(24,32,38,0.12))',
                    ],
                  }
            }
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/logoimagetwo.png" alt="Margin" width="72" height="72" className="h-14 w-auto object-contain md:h-20" />
            <span className="brand-wordmark font-merriweather text-4xl tracking-tight text-[#182026] md:text-6xl">Margin</span>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default DesignSimulate;
