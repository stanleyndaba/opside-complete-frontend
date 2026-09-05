import { motion } from "framer-motion";

export function AuditImageStackVisual() {
  return (
    <div className="relative isolate min-h-[280px] overflow-hidden rounded-[10px] border border-white/10 bg-[#050608] px-3 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:min-h-[360px] sm:px-6 sm:py-8 lg:min-h-[430px] lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(45,70,92,0.38),transparent_48%),linear-gradient(145deg,#11151A_0%,#050608_58%,#000000_100%)]" />
      <div className="absolute inset-x-4 top-5 h-[72%] translate-x-[1.5px] overflow-hidden rounded-[12px] border border-white/15 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:inset-x-8 sm:top-8 sm:rounded-[14px] lg:inset-x-12 lg:top-10">
        <img src="/auditResult.png" alt="Audit result showing recovery findings and filing movement" className="h-full w-full object-cover object-left-top" />
      </div>
      <motion.div
        initial={{ opacity: 0, x: 1.5, y: 20, rotate: 2 }}
        whileInView={{ opacity: 1, x: 1.5, y: 0, rotate: 0 }}
        viewport={{ once: true, margin: "-48px" }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-5 left-4 z-10 w-[82%] overflow-hidden rounded-[12px] border border-[var(--margin-border)] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:bottom-8 sm:left-8 sm:w-[78%] sm:rounded-[14px] lg:bottom-10 lg:left-4"
      >
        <img src="/discrepancy.png" alt="Detailed discrepancy finding with evidence and recovery analysis" className="block h-auto w-full" />
      </motion.div>
      <div className="absolute bottom-3 right-3 z-20 rounded-full border border-white/15 bg-[#0C1116]/90 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#BFD8EA] shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:bottom-5 sm:right-5">
        Finding detail / Audit result
      </div>
    </div>
  );
}
