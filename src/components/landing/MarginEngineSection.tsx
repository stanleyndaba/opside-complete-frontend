import { motion } from "framer-motion";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

export function MarginEngineSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Give Finance a position the business can act on.</h2>
          <p className="mt-4 max-w-[660px] text-[16px] leading-6 text-[#48677A] sm:text-[20px] sm:leading-7">Margin turns fragmented operational signals into a financial position that can withstand scrutiny. What once required hours of cross-functional reconstruction becomes a clear basis for action.</p>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">The business moves from debating what happened to knowing what is supported, what deserves attention, and what can be closed. Finance gets fewer escalations, cleaner decisions, and confidence that the recovery position will hold.</p>
          <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-[#536872] sm:text-[17px]">Your team keeps the decision. Margin removes the investigation from the cost of carrying it.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-[1040px] lg:max-w-[1350px]">
          <FinalDelegationPreview compactMobile tallMobile />
        </motion.div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>A clear position, without the operational drag.</p>
          <button type="button" className="landing-pressable inline-flex h-11 items-center justify-center gap-2 rounded-[7px] border border-[#635BFF] bg-white px-5 text-[13px] font-semibold text-[#635BFF] transition-colors hover:bg-[#F1F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2" aria-label="See the recovery operating model">See the recovery operating model <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>
  );
}
