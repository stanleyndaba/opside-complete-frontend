import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SITE_META } from "@/config/site";

const primaryButtonClass =
  "group inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#0B74DE] px-6 text-[15px] font-semibold text-white shadow-[0_16px_34px_rgba(11,116,222,0.2)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#0869C9] hover:shadow-[0_20px_42px_rgba(11,116,222,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 focus-visible:ring-offset-2";
const secondaryButtonClass =
  "group inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[7px] border border-[#0B74DE] bg-white px-6 text-[15px] font-semibold text-[#0B74DE] shadow-[0_12px_28px_rgba(37,49,58,0.06)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#F5FAFF] hover:shadow-[0_16px_34px_rgba(37,49,58,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 focus-visible:ring-offset-2";

export default function RecoveryStart() {
  usePageMeta({
    title: "Start Your Recovery | Margin",
    description: "Choose how you want to begin with Margin.",
    url: `${SITE_META.url}/get-started`,
    image: SITE_META.image,
  });

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-6 text-[#182026] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1160px] flex-col">
        <Link to="/" className="inline-flex w-fit items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-[#F3F6F8]">
          <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
          <span className="font-merriweather text-lg tracking-tight text-[#182026]">Margin</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-20 sm:py-24">
          <section className="w-full max-w-[620px] text-center" aria-labelledby="recovery-start-title">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">Start with Margin</p>
            <h1 id="recovery-start-title" className="mt-5 font-lora text-[40px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[54px]" style={{ fontWeight: 400 }}>
              How would you like to begin?
            </h1>
            <p className="mx-auto mt-5 max-w-[500px] text-[16px] leading-7 text-[#4D5B66] sm:text-[18px] sm:leading-8">
              Choose the way you want Margin to start understanding your recovery work.
            </p>

            <div className="mx-auto mt-10 grid w-full max-w-[500px] gap-4">
              <Link to="/audit" className={primaryButtonClass}>
                Audit Account
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/data-upload" className={secondaryButtonClass}>
                Use Amazon Reports
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.1em] text-[#7A8994]">
              Read-only to start. You decide what happens next.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
