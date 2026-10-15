import { motion } from "framer-motion";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";

export function MarginEngineSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Give Finance a defensible stance on material recovery exposure.</h2>
          <p className="mt-4 max-w-[660px] text-[16px] leading-6 text-[#48677A] sm:text-[20px] sm:leading-7">For a $25M–$107M Amazon seller—or a group approaching $600M—a recovery position has to survive CFO review. Shipment movement, receiving events, inventory adjustments, returns, settlements, and ledger activity must support the same financial conclusion.</p>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Margin connects those populations, surfaces mismatches and operational objections, and separates supported exposure from activity already accounted for or still unresolved. Finance receives a bounded decision record with the evidence basis, materiality, decision boundary, and next action in view.</p>
          <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-[#536872] sm:text-[17px]">The CFO keeps decision rights. Margin carries the evidence-backed position through controlled recovery.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-[1040px] lg:max-w-[1350px]">
          <FinalDelegationPreview compactMobile tallMobile />
        </motion.div>

        <p className="mt-10 text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>A finance-ready position, not a louder claim.</p>
      </div>
    </section>
  );
}
