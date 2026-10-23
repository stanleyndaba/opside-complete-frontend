import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

export function MarginEngineSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Know what the evidence justifies.</h2>
          <p className="mt-4 max-w-[660px] text-[16px] leading-6 text-[#48677A] sm:text-[20px] sm:leading-7">Margin establishes what happened across Amazon&apos;s financial records, what&apos;s still unresolved, and which actions the evidence supports.</p>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Your team retains decision authority. Margin does the investigative work needed to make that decision defensible.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-[1040px] lg:max-w-[1350px]">
          <FinalDelegationPreview compactMobile tallMobile />
        </motion.div>

        <div className="mt-10 flex flex-col items-start gap-4 sm:items-center">
          <p className="text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>A clear position, without the operational drag.</p>
          <button type="button" className="landing-pressable inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-white px-5 text-[13px] font-semibold text-[#635BFF] transition-colors hover:bg-[#F1F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2" aria-label="See the recovery operating model">See the recovery operating model <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}
