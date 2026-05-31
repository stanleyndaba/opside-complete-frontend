import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Send } from 'lucide-react';

const Plane = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-6 font-sans text-[#182026]"
      aria-label="Case submission paper plane animation"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'radial-gradient(rgba(94, 108, 122, 0.42) 1.15px, transparent 1.15px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(77,121,255,0.08),transparent_31%),linear-gradient(180deg,rgba(246,248,250,0.42),rgba(255,255,255,0.28)_45%,rgba(246,248,250,0.46))]" />

      <section className="relative z-10 h-[min(760px,100vh)] w-[min(1180px,100vw)]" aria-label="Paper plane submitting cases">
        <motion.div
          aria-hidden="true"
          className="absolute left-[12%] top-[64%] flex h-20 w-20 items-center justify-center rounded-full border border-[#CFE0EA] bg-white/90 shadow-[0_22px_70px_rgba(37,49,58,0.12)]"
          animate={
            reduceMotion
              ? { x: 0, y: 0, rotate: -18, opacity: 1 }
              : {
                  x: [0, 180, 380, 620, 900],
                  y: [0, -130, -270, -220, -420],
                  rotate: [-18, -24, -12, 5, 18],
                  opacity: [0, 1, 1, 0.9, 0],
                  scale: [0.82, 1, 1.06, 0.96, 0.62],
                }
          }
          transition={{
            duration: reduceMotion ? 0 : 3.8,
            repeat: reduceMotion ? 0 : Infinity,
            repeatDelay: 2.4,
            ease: [0.76, 0, 0.24, 1],
          }}
        >
          <Send className="h-10 w-10 text-[#0B74DE]" strokeWidth={2.2} />
        </motion.div>

        <motion.div
          className="absolute bottom-10 right-8 flex w-[min(380px,calc(100vw-32px))] items-start gap-2 overflow-hidden rounded-lg border border-white/20 bg-[#0B74DE] p-3 pr-6 text-white shadow-2xl backdrop-blur-md sm:bottom-8 sm:right-8"
          initial={{ opacity: 0, y: 28, x: 18, scale: 0.96 }}
          animate={
            reduceMotion
              ? { opacity: 1, y: 0, x: 0, scale: 1 }
              : {
                  opacity: [0, 0, 1, 1, 0],
                  y: [28, 28, 0, 0, 18],
                  x: [18, 18, 0, 0, 12],
                  scale: [0.96, 0.96, 1, 1, 0.98],
                }
          }
          transition={{
            duration: reduceMotion ? 0 : 6.2,
            times: [0, 0.5, 0.58, 0.86, 1],
            repeat: reduceMotion ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          role="status"
          aria-live="polite"
        >
          <div className="grid gap-1">
            <img src="/logoimagetwo.png" alt="Margin" className="h-2.5 w-auto object-contain brightness-0 invert" />
            <div className="text-xs font-semibold text-white">Cases submitted</div>
            <div className="text-xs font-normal text-white/90">ACME-2004, ACME-2005 submitted.</div>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default Plane;
