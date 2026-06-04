import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 22, filter: 'blur(16px)' },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.95, delay, ease },
  }),
};

const CommissionTicker = () => {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? 0 : 25);

  useEffect(() => {
    if (reduceMotion) {
      setValue(0);
      return;
    }

    const start = performance.now();
    const duration = 1500;
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.max(0, Math.round(25 * (1 - eased))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  const settled = value === 0;

  return (
    <motion.span
      className="inline-flex min-w-[2.35ch] justify-end tabular-nums"
      animate={{ color: settled ? '#53E6A7' : '#A9B2BC', textShadow: settled ? '0 0 24px rgba(83,230,167,0.35)' : '0 0 0 rgba(0,0,0,0)' }}
      transition={{ duration: 0.55, ease }}
    >
      <motion.span
        key={value}
        initial={{ y: -18, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 18, opacity: 0, filter: 'blur(8px)' }}
        transition={{ duration: 0.16, ease }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};

const MagneticButton = () => {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 180, damping: 18, mass: 0.35 });
  const springY = useSpring(pointerY, { stiffness: 180, damping: 18, mass: 0.35 });
  const x = useTransform(springX, (v) => v * 0.16);
  const y = useTransform(springY, (v) => v * 0.16);

  return (
    <motion.button
      type="button"
      className="group relative mt-8 h-14 overflow-hidden rounded-full border border-[#F4C76A]/30 bg-[#F4C76A] px-7 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#111315] shadow-[0_24px_80px_rgba(244,199,106,0.22)] outline-none transition-colors hover:bg-[#FFD982] focus-visible:ring-2 focus-visible:ring-[#F4C76A]/60"
      style={reduceMotion ? undefined : { x, y }}
      onPointerMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set(event.clientX - rect.left - rect.width / 2);
        pointerY.set(event.clientY - rect.top - rect.height / 2);
      }}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.025 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
        animate={reduceMotion ? undefined : { x: ['0%', '320%'] }}
        transition={{ duration: 1.35, repeat: Infinity, repeatDelay: 1.65, ease: 'easeInOut' }}
      />
      <span className="relative z-10">Claim Founding Slot</span>
    </motion.button>
  );
};

const ClosingCTA = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#060708] px-6 font-sans text-white"
      aria-label="Founding member closing offer simulation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(244,199,106,0.14),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(11,116,222,0.16),transparent_30%),linear-gradient(180deg,#060708,#0A0D10_48%,#050506)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />

      <section className="relative z-10 w-full max-w-[780px]">
        <div className="relative overflow-hidden rounded-3xl p-px">
          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              background: 'conic-gradient(from 0deg, rgba(244,199,106,0.12), rgba(83,230,167,0.42), rgba(11,116,222,0.35), rgba(244,199,106,0.76), rgba(244,199,106,0.12))',
            }}
          />
          <motion.div
            className="relative rounded-3xl border border-white/10 bg-black/40 p-7 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-10 md:p-12"
          >
            <motion.div initial="hidden" animate="show">
              <motion.div custom={0.1} variants={reveal} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4C76A]/80">
                Founding Member Offer
              </motion.div>

              <motion.h1
                custom={0.26}
                variants={reveal}
                className="mt-5 max-w-[620px] text-4xl font-semibold tracking-tight text-[#F4C76A] sm:text-5xl md:text-6xl"
              >
                Founding 500: $99 One-Time
              </motion.h1>

              <motion.p custom={0.48} variants={reveal} className="mt-6 text-lg font-medium tracking-tight text-white/78 sm:text-xl">
                No Monthly Fees through 2026
              </motion.p>

              <motion.div
                custom={0.7}
                variants={reveal}
                className="mt-7 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-xl font-semibold tracking-tight text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:text-2xl"
              >
                <CommissionTicker />
                <span>% Commission. 500 slots only.</span>
              </motion.div>

              <motion.p custom={1.08} variants={reveal} className="mt-6 text-[15px] font-semibold tracking-tight text-[#FF7A7A] sm:text-base">
                Closes June 30 or when full. No exceptions.
              </motion.p>

              <motion.div custom={1.28} variants={reveal}>
                <MagneticButton />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default ClosingCTA;
