import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { MarginOperatingWorkflow } from "@/components/landing/MarginOperatingWorkflow";

export default function Workflows() {
  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#30343B] font-sans">
      <PublicNavbar variant="light" />
      <main className="pt-24 md:pt-28">
        <section className="bg-[#F7F8F7] px-5 pb-12 pt-10 sm:px-6 sm:pb-16 md:px-8 md:pt-16 lg:px-10 2xl:px-12">
          <div className="mx-auto max-w-[1280px]">
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">Margin operating model</p>
            <div className="mt-4 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.52fr)] lg:gap-16">
              <h1 className="max-w-[820px] font-lora text-[42px] leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[58px] md:text-[76px]" style={{ fontWeight: 400 }}>
                From Amazon activity to a supported financial position.
              </h1>
              <div className="max-w-[440px]">
                <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">The workflow does not end when a recovery is approved or an Amazon case is closed. Margin traces the evidence, the action, the downstream money, and the residual position.</p>
                <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#30343B] underline decoration-[#AEB8BC] underline-offset-4 transition-colors hover:text-[#635BFF] hover:decoration-[#635BFF]">Discuss the operating model <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>
        <MarginOperatingWorkflow />
        <section className="bg-[#182026] px-5 py-14 text-white sm:px-6 md:px-8 md:py-20 lg:px-10 2xl:px-12">
          <div className="mx-auto grid max-w-[1280px] items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.52fr)] lg:gap-16">
            <h2 className="max-w-[760px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] sm:text-[48px] md:text-[60px]" style={{ fontWeight: 400 }}>A closed case is not the same as an established financial position.</h2>
            <p className="max-w-[420px] text-[14px] leading-7 text-white/65 md:text-[16px] md:leading-8">The Financial Position Brief records what was examined, what the evidence supports, what reconciles, what remains unresolved, and what action is justified.</p>
          </div>
        </section>
      </main>
      <BrandFooter />
    </div>
  );
}
