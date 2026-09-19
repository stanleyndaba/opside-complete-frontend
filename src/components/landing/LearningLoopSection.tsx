import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";

export function LearningLoopSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden bg-[#F4F8F8] py-12 sm:py-16 md:py-24"
      aria-labelledby="learning-loop-title"
    >
      <div className={containerClass}>
        <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="h-px w-8 bg-[#0B74DE]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">
                THE LEARNING LOOP
              </span>
            </div>
            <h2
              id="learning-loop-title"
              className="max-w-[600px] font-lora text-[35px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[56px]"
              style={{ fontWeight: 400 }}
            >
              Every recovery makes the next one clearer.
            </h2>
            <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Margin learns from the patterns in your recovery history—what happened, what evidence supported it, what Amazon challenged, and what finally reconciled.
            </p>
            <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Each resolved recovery gives the next investigation more context, so the work becomes more focused over time.
            </p>
            <div className="mt-8 grid max-w-[560px] gap-4 border-t border-[#C9D5D8] pt-5 sm:grid-cols-3 sm:gap-5">
              {[
                ["01", "Observe", "See the pattern."],
                ["02", "Learn", "Keep what matters."],
                ["03", "Improve", "Move with more context."],
              ].map(([number, title, copy]) => (
                <div key={number}>
                  <span className="font-mono text-[10px] font-semibold tracking-tight text-[#0B74DE]">{number}</span>
                  <h3 className="mt-2 font-sans text-[14px] font-semibold tracking-[-0.02em] text-[#263D4B]">{title}</h3>
                  <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[330px] sm:min-h-[420px]"
          >
            <svg
              viewBox="0 0 640 480"
              role="img"
              aria-label="Three connected recovery layers forming a learning loop"
              className="h-auto w-full"
            >
              <defs>
                <linearGradient id="learning-surface" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.96" />
                  <stop offset="1" stopColor="#E8F1F2" stopOpacity="0.74" />
                </linearGradient>
                <filter id="learning-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#73919C" floodOpacity="0.14" />
                </filter>
              </defs>

              <g fill="none" stroke="#91A8B1" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                <path d="M320 72 L526 178 L320 284 L114 178 Z" fill="url(#learning-surface)" filter="url(#learning-soft-shadow)" />
                <path d="M114 178 L320 284 L320 329 L114 223 Z" fill="#E7EFF0" fillOpacity="0.68" />
                <path d="M320 284 L526 178 L526 223 L320 329 Z" fill="#DCE9EC" fillOpacity="0.72" />
                <path d="M114 223 L320 329 L526 223" stroke="#B4C5CA" />
                <path d="M114 246 L320 352 L526 246" stroke="#B4C5CA" strokeOpacity="0.72" />
                <path d="M114 269 L320 375 L526 269" stroke="#B4C5CA" strokeOpacity="0.48" />
                <path d="M114 292 L320 398 L526 292" stroke="#B4C5CA" strokeOpacity="0.3" />
              </g>

              <g fill="none" stroke="#2E6A83" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                <path d="M151 176 C180 102 260 64 338 88 C431 117 473 178 447 244" strokeDasharray="4 7" />
                <path d="M447 244 C424 288 379 308 326 304" strokeDasharray="4 7" />
                <path d="M326 304 C253 302 194 265 168 218" strokeDasharray="4 7" />
              </g>

              {[{ x: 151, y: 176, label: "OBSERVE" }, { x: 447, y: 244, label: "LEARN" }, { x: 326, y: 304, label: "IMPROVE" }].map((node, index) => (
                <g key={node.label}>
                  <circle cx={node.x} cy={node.y} r="8" fill="#F4F8F8" stroke="#2E6A83" strokeWidth="1.2" />
                  <circle cx={node.x} cy={node.y} r="3" fill="#0B74DE">
                    {!reduceMotion && <animate attributeName="r" values="3;5;3" dur={`${2.4 + index * 0.3}s`} repeatCount="indefinite" />}
                  </circle>
                  <text x={node.x} y={node.y - 17} textAnchor="middle" fill="#496772" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1.2">{node.label}</text>
                </g>
              ))}

              <g fill="#536B75" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1">
                <text x="278" y="139">RECOVERY RECORD</text>
                <text x="278" y="157" fill="#84979D">evidence · response · outcome</text>
                <text x="194" y="346" fill="#84979D">history becomes context</text>
              </g>
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
