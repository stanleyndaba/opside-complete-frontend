import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { BrandFooter } from "@/components/layout/BrandFooter";

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";

const recordRows = [
  ["Transaction", "High-value Amazon purchase"],
  ["Issue", "Unresolved financial discrepancy"],
  ["Evidence", "Order, payment, fulfillment, and policy records"],
  ["Readiness", "Investigation candidate"],
];

const processSteps = [
  { label: "Find", copy: "Surface the transaction worth looking at." },
  { label: "Connect", copy: "Gather the records around what happened." },
  { label: "Recover", copy: "Build the case before anything is filed." },
];

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
                <Link to="/waitlist" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-[#263438] px-5 py-3 text-[14px] font-semibold text-[#F1EFE8] shadow-[0_12px_28px_rgba(37,49,58,0.16)] transition-transform duration-200 hover:-translate-y-px sm:w-auto">
                  Get Early Access <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#7B817E]">Target launch · Late November 2026</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[3px] border border-[#BFC5C1] bg-[#D7D9D5] p-3 shadow-[0_18px_50px_rgba(37,49,58,0.08)] sm:p-4">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.34),transparent_55%)]" />
              <div className="relative bg-[#F8F7F2] p-4 sm:p-5">
                <div className="flex items-start justify-between border-b border-[#D8DDD9] pb-3">
                  <div><p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#7B817E]">Margin record</p><p className="mt-1 text-[16px] font-semibold tracking-tight text-[#263438]">Consumer claim review</p></div>
                  <span className="rounded-full bg-[#E5F2E8] px-2 py-1 text-[9px] font-semibold text-[#26734D]">Evidence-ready</span>
                </div>
                <div className="divide-y divide-[#E6E8E4]">
                  {recordRows.map(([label, value]) => <div key={label} className="grid grid-cols-[88px_1fr] gap-3 py-3 text-[10px] leading-4"><span className="text-[#7B817E]">{label}</span><span className="font-medium text-[#263438]">{value}</span></div>)}
                </div>
                <div className="mt-2 flex items-center gap-2 border-t border-[#D8DDD9] pt-3 text-[10px] font-semibold text-[#26734D]"><Check className="h-3.5 w-3.5" /> Investigation can begin</div>
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

        <section className="border-b border-[#BFC5C1] bg-[#F1EFE8] py-14 sm:py-20">
          <div className={containerClass}>
            <div className="mb-10 flex items-end justify-between gap-6"><div><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">The recovery path</p><h2 className="mt-4 text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#263438] sm:text-[48px]">Evidence before action.</h2></div><span className="hidden font-mono text-[10px] font-semibold uppercase tracking-tight text-[#7B817E] sm:block">01 / 03</span></div>
            <div className="grid gap-px overflow-hidden border border-[#BFC5C1] bg-[#BFC5C1] md:grid-cols-3">
              {processSteps.map((step, index) => <article key={step.label} className="bg-[#F8F7F2] p-6 sm:p-8"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-semibold text-[#0B74DE]">0{index + 1}</span><ChevronRight className="h-4 w-4 text-[#9BA6A3]" /></div><h3 className="mt-12 text-[25px] font-semibold tracking-[-0.035em] text-[#263438]">{step.label}</h3><p className="mt-3 text-[14px] leading-6 text-[#52616A]">{step.copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-[#263438] py-14 text-[#F1EFE8] sm:py-20">
          <div className={`${containerClass} grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end`}><div><p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#AEBAB5]">Consumer Recovery</p><h2 className="mt-4 max-w-[650px] text-[34px] font-normal leading-[1.03] tracking-[-0.045em] sm:text-[48px]">A clearer record of what happened to your money.</h2></div><Link to="/waitlist" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#F1EFE8] underline decoration-[#71827D] underline-offset-4">Join Early Access <ArrowRight className="h-4 w-4" /></Link></div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
}
