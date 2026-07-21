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

const DocumentIcon = ({ type, isSmall }: { type: DocumentType; isSmall: boolean }) => {
  const iconScale = isSmall ? 'scale-[0.82]' : 'scale-100';

  if (type === 'DOC') {
    return (
      <div className={`relative h-[72px] w-[62px] ${iconScale}`}>
        <div className="absolute right-0 top-0 h-[58px] w-[48px] rounded-[8px] border border-[#c8d1dc] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
          <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-[5px] border-b border-l border-[#c8d1dc] bg-[#eef3f8]" />
          <div className="absolute left-2 top-3 h-8 w-8 rounded-[7px] bg-gradient-to-br from-[#5de1ff] via-[#2563eb] to-[#7c3aed] opacity-95" />
          <div className="absolute left-4 top-5 h-8 w-8 rounded-[7px] bg-gradient-to-br from-[#38bdf8] via-[#3b82f6] to-[#2563eb] opacity-90" />
        </div>
        <div className="absolute bottom-0 left-0 flex h-9 w-9 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#2f7df6] to-[#183fb7] text-[22px] font-black text-white shadow-[0_8px_16px_rgba(37,99,235,0.32)]">
          W
        </div>
      </div>
    );
  }

  if (type === 'PDF') {
    return (
      <div className={`relative h-[72px] w-[58px] ${iconScale}`}>
        <div className="absolute inset-x-1 top-0 h-[68px] rounded-[2px] border border-[#cfd6dd] bg-[#f8fafc] shadow-[0_8px_18px_rgba(15,23,42,0.11)]">
          <div className="absolute right-0 top-0 h-[18px] w-[18px] border-b border-l border-[#cfd6dd] bg-[#e9eef3]" />
          <div className="absolute left-2 top-2 h-px w-6 bg-[#cbd5df]" />
          <div className="absolute left-2 top-8 h-px w-8 bg-[#d7dde4]" />
          <div className="absolute left-2 top-12 h-px w-8 bg-[#d7dde4]" />
          <div className="absolute bottom-4 left-[-4px] right-[-4px] flex h-7 items-center justify-center bg-[#e30012] text-[19px] font-black tracking-tight text-white shadow-[0_5px_10px_rgba(227,0,18,0.24)]">
            PDF
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-[72px] w-[58px] ${iconScale}`}>
      <div className="absolute inset-x-1 top-0 h-[68px] rounded-[7px] border border-[#b8dfca] bg-[#f8fffb] shadow-[0_8px_18px_rgba(15,23,42,0.1)]">
        <div className="absolute right-0 top-0 h-4 w-4 rounded-bl-[5px] border-b border-l border-[#b8dfca] bg-[#ecfdf5]" />
        <div className="absolute left-2 right-2 top-7 rounded-[5px] bg-[#12a66a] py-1 text-center text-[14px] font-black tracking-tight text-white">
          TSX
        </div>
        <div className="absolute left-3 top-4 h-px w-7 bg-[#8bd8b2]" />
        <div className="absolute bottom-3 left-3 h-px w-8 bg-[#9ee4bf]" />
      </div>
    </div>
  );
};

const FloatingDocument = ({ type, color, startX, startY, rotate, delay, size = 'md' }: VaultDocument) => {
  const reduceMotion = useReducedMotion();
  const isSmall = size === 'sm';

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{
        width: isSmall ? 52 : 66,
        height: isSmall ? 66 : 82,
        transformOrigin: 'center',
        filter: `drop-shadow(0 14px 24px rgba(24, 32, 38, 0.1)) drop-shadow(0 0 18px ${color}18)`,
      }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 0.92, rotate }}
      animate={
        reduceMotion
          ? { x: startX * 0.24, y: startY * 0.24, opacity: 0.85, scale: 1.19, rotate: 0 }
          : {
              x: [startX, startX * 0.62, startX * 0.28, 0],
              y: [startY, startY * 0.54, startY * 0.22, 0],
              opacity: [0, 0.98, 0.92, 0],
              scale: [0.92, 1.35, 0.97, 0.11],
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
      <DocumentIcon type={type} isSmall={isSmall} />
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
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'radial-gradient(rgba(94, 108, 122, 0.42) 1.15px, transparent 1.15px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.07),transparent_31%),linear-gradient(180deg,rgba(246,248,250,0.42),rgba(255,255,255,0.28)_45%,rgba(246,248,250,0.46))]" />

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
