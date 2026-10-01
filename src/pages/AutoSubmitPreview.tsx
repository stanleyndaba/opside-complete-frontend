import React, { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";

export default function AutoSubmitPreview() {
  const [enabled, setEnabled] = useState(true);

  return (
    <main className="min-h-screen overflow-x-auto bg-[#E7E9EB] font-google-sans text-[#202A31]">
      <div className="mx-auto min-w-[600px] max-w-[820px] px-3 py-3 sm:px-4 sm:py-4">
        <section
          className="rounded-[8px] border border-[#D2D7DB] bg-white/78 p-3 shadow-[0_1px_2px_rgba(49,62,72,0.04)] backdrop-blur-xl sm:p-4"
          aria-label="Auto Submit control for Northstar Commerce LLC"
        >
          <header className="flex items-center gap-2.5 border-b border-[#C8CED3] pb-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2C21A] text-white sm:h-6 sm:w-6">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <h1 className="truncate text-[11px] font-medium leading-tight tracking-tight text-[#1D272E] sm:text-[12px]">
              Reconciliation control · Northstar Commerce LLC · Amazon US
            </h1>
          </header>

          <div className="mx-auto max-w-[560px] py-8 text-center sm:py-12">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4FC] text-[#1689E5] sm:h-10 sm:w-10">
              <ShieldCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />
            </div>
            <h2 className="mt-4 text-[18px] font-medium tracking-[-0.025em] text-[#1D272E] sm:text-[21px]">
              Auto Submit
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-5 text-[#748089] sm:text-[12px] sm:leading-6">
              When enabled, Margin submits only recovery findings that pass the configured evidence and confidence controls.
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((current) => !current)}
              className={`mx-auto mt-6 flex items-center gap-3 rounded-full px-2 py-2 pr-3 transition-colors ${enabled ? "bg-[#1689E5]" : "bg-[#9AA8B2]"}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(28,47,59,0.2)] transition-transform ${enabled ? "translate-x-0" : "translate-x-[22px]"}`}>
                <Check className={`h-3.5 w-3.5 ${enabled ? "text-[#1689E5]" : "text-[#9AA8B2]"}`} strokeWidth={3} />
              </span>
              <span className="min-w-[64px] text-left text-[11px] font-semibold text-white">
                {enabled ? "Enabled" : "Paused"}
              </span>
            </button>

            <p className="mx-auto mt-5 max-w-[460px] text-[11px] leading-5 text-[#56646D] sm:text-[12px] sm:leading-6">
              {enabled
                ? "Qualifying findings move from verified evidence to Amazon submission without another seller review step. Exceptions, weak evidence, and unresolved variance remain held for review."
                : "No finding is submitted automatically. Qualified recoveries remain available for seller review before filing."}
            </p>
          </div>

          <div className="border-t border-[#C8CED3] pt-3 text-[10px] leading-5 text-[#7B8790] sm:text-[11px]">
            <span className="font-semibold text-[#596770]">Control state:</span>{" "}
            {enabled
              ? "pre-authorized recovery submission · evidence threshold enforced · seller approval retained for exceptions"
              : "manual submission path · seller approval required before filing"}
          </div>
        </section>
      </div>
    </main>
  );
}
