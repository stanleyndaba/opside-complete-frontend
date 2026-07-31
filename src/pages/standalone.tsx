import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const auditLines = [
  { left: 10, top: 22, width: 28, rotate: 18, delay: 0.4 },
  { left: 25, top: 54, width: 36, rotate: -10, delay: 1.6 },
  { left: 48, top: 32, width: 31, rotate: 14, delay: 2.7 },
  { left: 59, top: 66, width: 29, rotate: -20, delay: 3.4 },
  { left: 15, top: 76, width: 48, rotate: 7, delay: 4.3 },
];

const signalDots = [
  { x: 18, y: 24, size: 8, color: "bg-blue-300", delay: 0.2 },
  { x: 31, y: 75, size: 7, color: "bg-emerald-300", delay: 1.1 },
  { x: 56, y: 19, size: 9, color: "bg-blue-400", delay: 1.7 },
  { x: 75, y: 63, size: 7, color: "bg-emerald-400", delay: 2.4 },
  { x: 88, y: 34, size: 6, color: "bg-blue-300", delay: 3.2 },
];

const recoveryStages = [
  "Recovery Found",
  "Evidence Ready",
  "Seller Approved",
  "Payout Reconciled",
];

export default function Standalone() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(11,116,222,0.18),transparent_30%),radial-gradient(circle_at_76%_28%,rgba(46,125,91,0.12),transparent_32%),linear-gradient(135deg,#101827_0%,#06080C_54%,#000000_100%)] px-5 py-5 text-white sm:px-7 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(96,165,250,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.10)_1px,transparent_1px)] [background-size:92px_92px]" />
        {auditLines.map((line) => (
          <motion.div
            key={`${line.left}-${line.top}`}
            className="absolute h-px origin-left bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.42),rgba(52,211,153,0.24),transparent)]"
            style={{
              left: `${line.left}%`,
              top: `${line.top}%`,
              width: `${line.width}%`,
              rotate: `${line.rotate}deg`,
            }}
            animate={reduceMotion ? undefined : { opacity: [0.14, 0.54, 0.14] }}
            transition={{
              duration: 6,
              delay: line.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {signalDots.map((dot) => (
          <motion.span
            key={`${dot.x}-${dot.y}`}
            className={`absolute rounded-full ${dot.color}`}
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
            }}
            animate={reduceMotion ? undefined : { opacity: [0.2, 0.85, 0.2], scale: [1, 1.28, 1] }}
            transition={{ duration: 4.2, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1080px] flex-col justify-center">
        <div className="mb-6 inline-flex items-center gap-2.5">
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            width="44"
            height="24"
            className="h-5 w-auto object-contain invert brightness-0"
          />
          <span className="brand-wordmark font-merriweather text-[20px] tracking-tight text-white">
            Margin
          </span>
        </div>

        <div className="grid items-end gap-7 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h1 className="max-w-[650px] text-[40px] font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-[58px] lg:text-[68px] xl:text-[76px]">
              Know what Amazon owes.
              <span className="mt-2 block text-[#9BA8B6]">
                Prove it. Recover it. Reconcile it.
              </span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[16px] leading-7 tracking-[-0.02em] text-[#D4DEE8] sm:text-[19px] sm:leading-8">
              Revenue recovery and payout reconciliation for established Amazon FBA operations.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11.5px] font-medium text-[#AEBBCA] sm:text-[12.5px]">
              <span>Read-only first</span>
              <span className="text-[#607182]">·</span>
              <span>Seller approval before filing</span>
              <span className="text-[#607182]">·</span>
              <span>0% recovery commission</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-white/12 bg-white/[0.055] p-4 shadow-[0_18px_56px_rgba(0,0,0,0.28)] [backdrop-filter:blur(28px)_saturate(160%)] sm:p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#9BA8B6]">
                  Recovery Rail
                </p>
                <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.04em] text-white sm:text-[20px]">
                  One case from finding to reconciled payout.
                </h2>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-tight text-emerald-200">
                Live path
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-5 right-5 top-[17px] h-px bg-white/14" aria-hidden="true" />
              <div className="relative grid gap-4 sm:grid-cols-4">
                {recoveryStages.map((stage, index) => (
                  <div key={stage} className="relative">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/16 bg-[#111A24] text-white shadow-[0_0_0_4px_rgba(255,255,255,0.03)]">
                      <Check className="h-3 w-3 text-[#7EE0B3]" strokeWidth={2.6} />
                    </div>
                    <p className="mt-2.5 max-w-[120px] text-[12px] font-semibold leading-snug tracking-[-0.03em] text-white sm:text-[13px]">
                      {stage}
                    </p>
                    <p className="mt-1 font-mono text-[8.5px] font-semibold uppercase tracking-tight text-[#7C8A99]">
                      0{index + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
