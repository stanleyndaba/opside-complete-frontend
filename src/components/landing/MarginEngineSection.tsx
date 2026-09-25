import { motion } from "framer-motion";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

export function MarginEngineSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-[#0B74DE]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">06 / THE PROMISE</span>
          </div>
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Less uncertainty. Less financial chasing. More confidence about what happened to the money.</h2>
          <p className="mt-4 max-w-[620px] text-[16px] leading-6 text-[#48677A] sm:text-[20px] sm:leading-7">Know what happened. Resolve what matters. Move forward.</p>
        <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Margin owns the gap between what Amazon says happened and what actually happened to your money.</p>
        <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-[#536872] sm:text-[17px]">Margin maintains that truth as records, reimbursements, reversals, and outcomes change—so each examination starts with established history.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-[1040px] lg:max-w-[1350px]">
          <FinalDelegationPreview compactMobile tallMobile />
        </motion.div>

        <p className="mt-10 text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>Every financial discrepancy becomes a traceable decision.</p>
      </div>
    </section>
  );
}
