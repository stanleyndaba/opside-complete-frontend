import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { BrandFooter } from "@/components/layout/BrandFooter";

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";

export default function ConsumerRecovery() {
  return (
    <div className="landing-google-sans min-h-screen bg-[#F1EFE8] text-[#182026] selection:bg-[#0B74DE]/15 selection:text-[#182026]">
      <PublicNavbar variant="light" wide />

      <main>
        <section className="relative overflow-hidden border-b border-[#BFC5C1] bg-[#F1EFE8] pb-16 pt-32 sm:pb-24 sm:pt-40 lg:pb-28 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(37,49,58,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,49,58,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className={`${containerClass} relative grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-20`}>
            <div className="max-w-[820px]">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px w-8 bg-[#0B74DE]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Consumer recovery</span>
              </div>
              <h1 className="max-w-[780px] text-[46px] font-normal leading-[0.98] tracking-[-0.055em] text-[#182026] sm:text-[68px] md:text-[82px] lg:text-[94px]">
                The same recovery engine.
                <span className="block text-[#7B817E]">Now for consumers.</span>
              </h1>
              <p className="mt-8 max-w-[660px] text-[17px] leading-8 text-[#52616A] sm:text-[20px] sm:leading-9">
                Margin is extending its financial recovery infrastructure beyond businesses.
              </p>
              <p className="mt-4 max-w-[660px] text-[17px] leading-8 text-[#52616A] sm:text-[20px] sm:leading-9">
                We&apos;re starting with high-value claims where a financial recovery may be available but hasn&apos;t been pursued.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to="/early-access" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] bg-[#0B74DE] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition-all hover:-translate-y-px hover:bg-[#095FB8] sm:w-auto">
                  Get Early Access <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#7B817E]">Target launch · Late November 2026</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#BFC5C1] bg-[#D7D9D5] py-14 sm:py-20">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-24`}>
            <div><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">A narrower beginning</p><h2 className="mt-4 max-w-[520px] text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#263438] sm:text-[48px]">Not every transaction needs a claim.</h2></div>
            <div className="max-w-[650px] text-[16px] leading-8 text-[#52616A] sm:text-[18px] sm:leading-9"><p>Consumer Recovery will focus on high-value unresolved transactions where the records support a meaningful contradiction—not generic customer support or promises of easy refunds.</p><p className="mt-5">The same discipline that helps businesses recover money now turns toward the consumer side of the transaction.</p></div>
          </div>
        </section>

        <section className="border-t border-[#BFC5C1] bg-[#D7D9D5] py-14 text-[#263438] sm:py-20">
          <div className={`${containerClass} grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end`}><div><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Consumer Recovery</p><h2 className="mt-4 max-w-[650px] text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#263438] sm:text-[48px]">A clearer record of what happened to your money.</h2></div><Link to="/early-access" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0B74DE] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition-all hover:bg-[#095FB8]">Join Early Access <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
}
