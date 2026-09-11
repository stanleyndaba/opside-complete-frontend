import { motion } from "framer-motion";

export function AuditImageStackVisual() {
  return (
    <div className="relative isolate min-h-[280px] overflow-hidden rounded-[10px] border border-[#D9E2E6] bg-[#E9EEEC] px-3 pb-5 pt-11 shadow-[0_20px_60px_rgba(72,103,122,0.14)] sm:min-h-[360px] sm:px-6 sm:pb-8 sm:pt-14 lg:min-h-[430px] lg:px-8 lg:pb-10 lg:pt-16">
      <div className="absolute inset-x-0 top-0 z-30 flex h-7 items-center gap-1.5 border-b border-[#D9E2E6] px-2"><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="h-2 w-2 rounded-full bg-[#D7DAD7]" /><span className="ml-2 min-w-0 flex-1 truncate text-center font-sans text-[9px] text-[#7A8B93]">margin.app/audit</span></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(11,116,222,0.05),transparent_36%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)]" />
      <div className="absolute inset-x-4 top-11 h-[68%] -translate-x-px overflow-hidden rounded-[5px] border border-[#D9E2E6] bg-white shadow-[0_18px_45px_rgba(72,103,122,0.16)] sm:inset-x-8 sm:top-14 sm:rounded-[5px] lg:inset-x-12 lg:top-16">
        <img src="/auditResult.png" alt="Audit result showing recovery findings and filing movement" className="h-full w-full object-cover object-left-top" />
      </div>
      <motion.div
        initial={{ opacity: 0, x: 1.5, y: 20, rotate: 2 }}
        whileInView={{ opacity: 1, x: 1.5, y: 0, rotate: 0 }}
        viewport={{ once: true, margin: "-48px" }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-5 left-4 z-10 w-[82%] overflow-hidden rounded-[5px] border border-[var(--margin-border)] bg-white shadow-[0_20px_50px_rgba(72,103,122,0.18)] sm:bottom-8 sm:left-8 sm:w-[78%] sm:rounded-[5px] lg:bottom-10 lg:left-4"
      >
        <img src="/discrepancy.png" alt="Detailed discrepancy finding with evidence and recovery analysis" className="block h-auto w-full" />
      </motion.div>
      <div className="absolute bottom-3 right-3 z-20 rounded-full border border-[#D9E2E6] bg-white/95 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#647783] shadow-[0_8px_24px_rgba(72,103,122,0.12)] sm:bottom-5 sm:right-5">
        Finding detail / Audit result
      </div>
    </div>
  );
}
