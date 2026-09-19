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
              aria-label="Three consistent recovery layers connected by an observe, learn, improve route"
              className="h-auto w-full"
            >
              <defs>
                <linearGradient id="learning-surface" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
                  <stop offset="1" stopColor="#E6F0F1" stopOpacity="0.9" />
                </linearGradient>
                <filter id="learning-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="12" stdDeviation="13" floodColor="#617C87" floodOpacity="0.16" />
                </filter>
              </defs>

              {/* Three intentional recovery layers using the same +60° / -60° projection. */}
              <g fill="none" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
                <path d="M104 270 L300 371 L496 270 L300 169 Z" stroke="#C5D0D3" strokeWidth="1" opacity="0.52" />
                <path d="M104 234 L300 335 L496 234 L300 133 Z" stroke="#AEBFC4" strokeWidth="1.05" opacity="0.7" />
                <path d="M104 198 L300 299 L496 198 L300 97 Z" stroke="#8499A1" strokeWidth="1.25" opacity="0.9" />
                <path d="M104 198 L300 299 L300 343 L104 242 Z" fill="#E5EEF0" fillOpacity="0.58" stroke="#82969D" strokeWidth="1.35" />
                <path d="M300 299 L496 198 L496 242 L300 343 Z" fill="#DCE9EC" fillOpacity="0.72" stroke="#82969D" strokeWidth="1.35" />
                <path d="M300 97 L516 208 L300 319 L84 208 Z" fill="url(#learning-surface)" stroke="#718890" strokeWidth="1.7" filter="url(#learning-soft-shadow)" />
              </g>

              {/* The process route stays inside the top plane rather than orbiting it. */}
              <path d="M168 207 C203 165 254 150 303 169 C354 188 398 213 432 204 C411 244 360 268 307 246 C252 224 208 215 168 207 Z" fill="none" stroke="#2E6A83" strokeWidth="1.35" strokeDasharray="4 6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

              {[{ x: 168, y: 207, label: "OBSERVE", lx: 168, ly: 178, active: false }, { x: 432, y: 204, label: "LEARN", lx: 451, ly: 178, active: false }, { x: 307, y: 246, label: "IMPROVE", lx: 307, ly: 280, active: true }].map((node, index) => (
                <g key={node.label}>
                  <path d={`M${node.x} ${node.y} L${node.lx} ${node.ly + (node.active ? -7 : 7)}`} fill="none" stroke="#5F7D88" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  <circle cx={node.x} cy={node.y} r="6" fill={node.active ? "#0B74DE" : "#F4F8F8"} stroke="#1683BD" strokeWidth="1.45" />
                  {!node.active && <circle cx={node.x} cy={node.y} r="2" fill="#1683BD" />}
                  {node.active && !reduceMotion && <animate attributeName="r" values="6;8;6" dur={`${2.4 + index * 0.3}s`} repeatCount="indefinite" />}
                  <text x={node.lx} y={node.ly} textAnchor="middle" fill="#5E7078" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" fontWeight="600" letterSpacing="1.5">{node.label}</text>
                </g>
              ))}

              <g fill="#536B75" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                <text x="275" y="148" fontSize="12" fontWeight="600" letterSpacing="1.5">RECOVERY RECORD</text>
                <text x="275" y="166" fill="#71858D" fontSize="11" letterSpacing="0.8">evidence / response / outcome</text>
                <text x="190" y="393" fill="#83959B" fontSize="11" letterSpacing="1.2">HISTORY → CONTEXT</text>
              </g>
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
