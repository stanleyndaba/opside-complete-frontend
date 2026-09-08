import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { BrandFooter } from "@/components/layout/BrandFooter";

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";

export default function ConsumerRecovery() {
  return (
    <div className="min-h-screen bg-[var(--margin-canvas)] text-[var(--margin-text-primary)]">
      <PublicNavbar variant="light" wide />

      <main>
        <section className="relative overflow-hidden border-b border-[var(--margin-border)] bg-[var(--margin-canvas)] pb-20 pt-36 sm:pb-28 sm:pt-44 lg:pb-36 lg:pt-52">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(37,49,58,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,49,58,0.045)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className={`${containerClass} relative`}>
            <div className="max-w-[860px]">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[var(--margin-blue)]">
                Consumer Recovery
              </p>
              <h1 className="mt-5 max-w-[780px] font-lora text-[44px] leading-[0.98] tracking-[-0.05em] text-[var(--margin-text-primary)] sm:text-[64px] md:text-[78px] lg:text-[92px]">
                The same recovery engine.
                <span className="block text-[var(--margin-text-muted)]">Now for consumers.</span>
              </h1>
              <p className="mt-8 max-w-[680px] text-[17px] leading-8 text-[var(--margin-text-secondary)] sm:text-[20px] sm:leading-9">
                Margin is extending its financial recovery infrastructure beyond businesses.
              </p>
              <p className="mt-4 max-w-[680px] text-[17px] leading-8 text-[var(--margin-text-secondary)] sm:text-[20px] sm:leading-9">
                We&apos;re starting with high-value claims where a financial recovery may be available but hasn&apos;t been pursued.
              </p>

              <div className="mt-10 flex flex-col gap-4 border-t border-[var(--margin-border)] pt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="order-2 sm:order-1">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">Target launch</p>
                  <p className="mt-1 text-[13px] font-medium text-[var(--margin-text-muted)] sm:text-[16px] sm:text-[var(--margin-text-primary)]">Late November 2026</p>
                </div>
                <Link
                  to="/waitlist"
                  className="order-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--margin-blue)] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(11,116,222,0.18)] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#0869c9] sm:order-2 sm:w-auto"
                >
                  Get Early Access
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
}
