import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type VaultDocument = {
  id: string;
  type: 'PDF' | 'DOC';
  color: string;
  startX: number;
  startY: number;
  rotate: number;
  delay: number;
};

const documents: VaultDocument[] = [
  { id: 'proof-01', type: 'PDF', color: '#FF4D4D', startX: -420, startY: -210, rotate: -8, delay: 0 },
  { id: 'proof-02', type: 'DOC', color: '#4D79FF', startX: 390, startY: -170, rotate: 7, delay: 0.55 },
  { id: 'proof-03', type: 'PDF', color: '#FF4D4D', startX: -360, startY: 230, rotate: 5, delay: 1.1 },
  { id: 'proof-04', type: 'DOC', color: '#4D79FF', startX: 440, startY: 210, rotate: -6, delay: 1.65 },
  { id: 'proof-05', type: 'PDF', color: '#FF4D4D', startX: -120, startY: -310, rotate: 4, delay: 2.2 },
  { id: 'proof-06', type: 'DOC', color: '#4D79FF', startX: 160, startY: 315, rotate: -4, delay: 2.75 },
];

const FloatingDocument = ({ type, color, startX, startY, rotate, delay }: VaultDocument) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 flex h-20 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md border bg-[#111214]/95 shadow-2xl"
      style={{
        borderColor: `${color}B3`,
        boxShadow: `0 0 24px ${color}26, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
      initial={{ x: startX, y: startY, opacity: 0, scale: 0.72, rotate }}
      animate={
        reduceMotion
          ? { x: startX * 0.28, y: startY * 0.28, opacity: 0.72, scale: 0.9, rotate: 0 }
          : {
              x: [startX, startX * 0.56, startX * 0.18, 0],
              y: [startY, startY * 0.48, startY * 0.16, 0],
              opacity: [0, 0.96, 0.92, 0],
              scale: [0.72, 1, 0.72, 0.14],
              rotate: [rotate, rotate * 0.35, rotate * 0.12, 0],
            }
      }
      transition={{
        duration: reduceMotion ? 0 : 4.8,
        delay,
        repeat: reduceMotion ? 0 : Infinity,
        repeatDelay: 0.15,
        ease: [0.76, 0, 0.24, 1],
      }}
    >
      <div className="absolute right-0 top-0 h-3 w-3 rounded-bl border-b border-l border-white/10 bg-white/[0.04]" />
      <span className="text-[11px] font-black tracking-[0.16em]" style={{ color }}>
        {type}
      </span>
      <span className="mt-3 h-px w-8" style={{ backgroundColor: color, opacity: 0.85 }} />
      <span className="mt-2 h-px w-6" style={{ backgroundColor: color, opacity: 0.55 }} />
      <span className="mt-2 h-px w-4" style={{ backgroundColor: color, opacity: 0.35 }} />
    </motion.div>
  );
};

const DesignSimulate = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0A0A0A] px-6 font-sans text-white"
      aria-label="Margin Evidence Vault animation"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(120, 135, 150, 0.34) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%,rgba(0,0,0,0.42))]" />

      <section className="relative h-[min(720px,100vh)] w-[min(1040px,100vw)]" aria-labelledby="evidence-vault-title">
        {documents.map((document) => (
          <FloatingDocument key={document.id} {...document} />
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 z-10 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-[#6F7A86] bg-[#0A0A0A]/95 text-center shadow-[0_0_42px_rgba(77,121,255,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]"
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 0 28px rgba(77,121,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
                    '0 0 54px rgba(77,121,255,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
                    '0 0 28px rgba(77,121,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
                  ],
                }
          }
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div>
            <p id="evidence-vault-title" className="text-[11px] font-black uppercase tracking-[0.24em] text-[#DCE8F7]">
              Evidence
            </p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#8FA4BC]">Vault</p>
          </div>
        </motion.div>
      </section>

      <p className="absolute bottom-[9vh] left-1/2 w-full -translate-x-1/2 px-6 text-center text-[clamp(1rem,2vw,1.5rem)] font-light tracking-[0.08em] text-[#8DB5FF]">
        building unbreakable truth
      </p>
    </main>
  );
};

export default DesignSimulate;
