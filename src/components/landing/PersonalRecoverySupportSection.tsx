import React from "react";
import { motion } from "framer-motion";
import { PersonalRecoverySupportVisual } from "./PersonalRecoverySupportVisual";
import { ScaledDemoStage } from "./ScaledDemoStage";
import { DemoTestsShell } from "@/pages/DemoTests";
import { ChevronRight } from "lucide-react";

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function PersonalRecoverySupportSection() {


  return (
    <section className="relative overflow-hidden border-y border-[#D6E3E8] bg-white py-12 sm:py-14 md:py-20" aria-labelledby="personal-recovery-support-title">
      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-10 2xl:px-12">
        <motion.div {...revealProps} className="max-w-[600px]">
          <p className="landing-section-eyebrow font-google-sans text-[11px] font-semibold tracking-tight text-[#635BFF]">Managed financial work</p>
          <h2 id="personal-recovery-support-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Margin performs the investigation—not just explains what to submit.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">Margin makes the investigation, case history, evidence requirements, Amazon responses and outstanding actions accessible as one connected case position. Your team can ask about the status, the reason for a decision, the evidence supporting it or what is preventing progress, and receive an explanation grounded in the recorded financial work.</p>
          <p className="mt-4 max-w-[560px] font-lora text-[20px] leading-[1.12] tracking-[-0.03em] text-[#315C70] sm:text-[24px]" style={{ fontWeight: 400 }}>The result is less investigative work for your team and a clearer account of what has actually happened.</p>
          <button type="button" className="landing-action-cta landing-pressable mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[3px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(240,90,60,0.18)] transition-colors hover:bg-[#D9472D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A3C]/35 focus-visible:ring-offset-2" aria-label="Discuss Your Recovery">Discuss Your Recovery <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
          <div className="relative h-[min(600px,62vw)] min-h-[320px] overflow-y-auto overscroll-contain rounded-[10px] border border-[#C9D9E1] bg-[#FBFAF7] shadow-[0_10px_30px_rgba(37,49,58,0.09)]">
            <ScaledDemoStage designWidth={900} designHeight={620}>
              <div className="h-[620px] w-[900px]">
                <DemoTestsShell embedded>
                  <div className="overflow-hidden rounded-[10px] border border-[#C9D9E1] bg-[#FBFAF7]"><PersonalRecoverySupportVisual /></div>
                </DemoTestsShell>
              </div>
            </ScaledDemoStage>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
