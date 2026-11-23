import { motion } from "framer-motion";
import RecoverOnce from "@/pages/RecoverOnce";
import { ScaledDemoStage } from "@/components/landing/ScaledDemoStage";

export function MarginEngineSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <p className="landing-section-eyebrow font-google-sans text-[11px] font-semibold tracking-tight text-[#635BFF]">Evidence before action</p>
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Do not let an uncertain position trigger the wrong action.</h2>
          <p className="mt-4 max-w-[660px] text-[16px] leading-6 text-[#48677A] sm:text-[20px] sm:leading-7">Margin examines the originating event, expected financial treatment, available evidence, alternative explanations and materiality before determining whether recovery or further resolution work is justified.</p>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Your team retains approval authority. Margin performs the investigation and supplies the evidence behind it.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-[1040px] lg:max-w-[1350px]">
          <div className="relative h-auto min-h-0 overflow-y-auto overscroll-contain rounded-none border-0 bg-transparent shadow-none sm:h-[min(600px,62vw)] sm:min-h-[320px] sm:rounded-[10px] sm:border sm:border-[#C9D9E1] sm:bg-[#FBFAF7] sm:shadow-[0_10px_30px_rgba(37,49,58,0.09)]">
            <ScaledDemoStage designWidth={900} designHeight={760}>
              <RecoverOnce embedded />
            </ScaledDemoStage>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
