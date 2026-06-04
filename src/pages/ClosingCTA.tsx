import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 10, filter: 'blur(14px)' },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.82, delay, ease },
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
      className="relative inline-flex h-[1.22em] min-w-[2.1ch] justify-end overflow-hidden tabular-nums"
      animate={{
        color: settled ? '#007aff' : '#94a3b8',
        textShadow: settled ? '0 10px 30px rgba(0,122,255,0.26)' : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ duration: 0.55, ease }}
    >
      <motion.span
        key={value}
        className="block leading-[1.15]"
        initial={{ y: '-105%', opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.18, ease }}
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
      className="group relative mt-8 h-14 overflow-hidden rounded-full bg-[#007aff] px-7 text-[13px] font-semibold uppercase tracking-tight text-white shadow-[0_22px_60px_rgba(0,122,255,0.28)] outline-none transition-shadow hover:shadow-[0_26px_76px_rgba(0,122,255,0.36)] focus-visible:ring-2 focus-visible:ring-[#007aff]/35 focus-visible:ring-offset-4 focus-visible:ring-offset-white"
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
        className="absolute inset-y-0 -left-2/3 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/55 to-transparent"
        animate={reduceMotion ? undefined : { x: ['0%', '420%'] }}
        transition={{ duration: 1.05, repeat: Infinity, repeatDelay: 2.95, ease: 'easeInOut' }}
      />
      <span className="relative z-10">GET ACCESS →</span>
    </motion.button>
  );
};

const ClosingCTA = () => {
  const reduceMotion = useReducedMotion();

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50 px-6 py-12 font-sans text-slate-900"
      aria-label="Founding member closing offer simulation"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(59,130,246,0.24),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_52%_82%,rgba(186,230,253,0.35),transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.64), rgba(255,255,255,0.26))',
        }}
      />

      <section className="relative z-10 w-full max-w-[780px]">
        <div className="relative overflow-hidden rounded-[32px] p-px shadow-2xl shadow-blue-100/50">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0"
            animate={reduceMotion ? undefined : { opacity: [0.62, 1, 0.62] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(135deg, rgba(0,122,255,0.28), rgba(255,255,255,0.78) 38%, rgba(244,114,182,0.24) 72%, rgba(0,122,255,0.18))',
            }}
          />
          <motion.div
            className="relative rounded-[32px] border border-white/60 bg-white/70 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl sm:p-10 md:p-12"
          >
            <motion.div initial="hidden" animate="show">
              <motion.div custom={0.1} variants={reveal} className="text-[11px] font-semibold uppercase tracking-tight text-blue-600/80">
                Founding Member Offer
              </motion.div>

              <motion.h1
                custom={0.26}
                variants={reveal}
                className="mt-5 max-w-[620px] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
              >
                Founding 500: $99 One-Time
              </motion.h1>

              <motion.p custom={0.48} variants={reveal} className="mt-6 text-lg font-medium tracking-tight text-slate-500 sm:text-xl">
                No Monthly Fees through 2026
              </motion.p>

              <motion.div
                custom={0.7}
                variants={reveal}
                className="mt-7 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100/80 bg-white/72 px-4 py-3 text-xl font-semibold tracking-tight text-slate-900 shadow-[0_18px_50px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] sm:text-2xl"
              >
                <CommissionTicker />
                <span>% Commission. 500 slots only.</span>
              </motion.div>

              <motion.p custom={1.08} variants={reveal} className="mt-6 text-[15px] font-semibold tracking-tight text-rose-500 sm:text-base">
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
