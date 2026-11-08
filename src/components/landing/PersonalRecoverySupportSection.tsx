import React from "react";
import { motion } from "framer-motion";
import { PersonalRecoverySupportVisual } from "./PersonalRecoverySupportVisual";
import { ArrowRight } from "lucide-react";

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
          <h2 id="personal-recovery-support-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Have someone who can explain the decision—not just tell you what to submit.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">Margin makes the investigation, case history, evidence requirements, Amazon responses and outstanding actions accessible as one connected case position. Your team can ask about the status, the reason for a decision, the evidence supporting it or what is preventing progress, and receive an explanation grounded in the recorded financial work.</p>
          <p className="mt-4 max-w-[560px] font-lora text-[20px] leading-[1.12] tracking-[-0.03em] text-[#315C70] sm:text-[24px]" style={{ fontWeight: 400 }}>The answer should identify the next action and its accountable owner, not simply repeat a status label.</p>
          <button type="button" className="landing-action-cta landing-pressable mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F05A3C] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(240,90,60,0.18)] transition-colors hover:bg-[#D9472D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A3C]/35 focus-visible:ring-offset-2" aria-label="Ask Margin about your recovery">Ask Margin about your recovery <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
          <PersonalRecoverySupportVisual />
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
