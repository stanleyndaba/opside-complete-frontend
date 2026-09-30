import React, { useState } from "react";
import { Check } from "lucide-react";

const timeline = [
  ["Shipment record", "60 units shipped on FBA17-ONT8-260114."],
  ["Amazon receiving record", "46 units received at ONT8."],
  ["Variance established", "14 units remain outside the receiving record."],
  ["Settlement review", "No corresponding credit found through SETTLE-2026-0418."],
  ["Recovery basis", "Evidence supports a seller-approved recovery submission."],
];

const closeoutTimeline = [
  ["Expected position", "$1,184.60 supported by the reviewed event record."],
  ["Amazon attribution", "$1,184.60 credit identified in the settlement record."],
  ["Settlement confirmed", "SETTLE-2026-0418 matches the expected recovery."],
  ["Financial closeout", "$0.00 variance remains."],
];

function Timeline({ items, closeout = false }: { items: string[][]; closeout?: boolean }) {
  return (
    <ol className="relative ml-1 border-l border-[#C9D6DE] pl-6">
      {items.map(([title, detail], index) => (
        <li key={title} className="relative pb-5 last:pb-0">
          <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${closeout ? "bg-[#2EAD7B]" : index === items.length - 1 ? "bg-[#2EAD7B]" : "bg-[#315C70]"}`} aria-hidden="true">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </span>
          <p className="text-[11px] font-semibold leading-4 text-[#25313A]">{title}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#66737F]">{detail}</p>
        </li>
      ))}
    </ol>
  );
}

export default function MarginStandardDeliverable() {
  const [view, setView] = useState<"finding" | "closeout">("finding");
  const isCloseout = view === "closeout";

  return (
    <main className="landing-google-sans min-h-screen bg-[#F3F5F5] px-4 py-7 text-[#182026] sm:px-8 sm:py-10 lg:flex lg:min-h-[700px] lg:flex-col lg:items-center lg:justify-center lg:px-10 lg:py-12">
      <section className="mx-auto mt-0 w-full max-w-[860px] text-left sm:mt-0" aria-label="Margin reconciliation record">
        <header className="border-b border-[#E9E9EC] px-0 pb-3 pt-0 sm:pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold leading-tight tracking-tight sm:text-[21px]">Northstar Commerce LLC</h2>
              <p className="mt-1 text-[11px] leading-4 text-[#73828A]">Amazon US · Jan–Mar 2026 · Account reconciliation record</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#2E7D5B]"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2EAD7B]"><Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /></span> {isCloseout ? "Financially reconciled" : "Review completed"}</div>
          </div>
          <div className="mt-5 flex gap-4 border-b border-[#E9E9EC]">
            <button type="button" onClick={() => setView("finding")} className={`border-b-2 pb-2 text-[11px] font-semibold tracking-normal ${!isCloseout ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#66737F]"}`}>Supported finding</button>
            <button type="button" onClick={() => setView("closeout")} className={`border-b-2 pb-2 text-[11px] font-semibold tracking-normal ${isCloseout ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#66737F]"}`}>Closeout record</button>
          </div>
        </header>

        {!isCloseout ? (
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-5 sm:px-6 lg:border-b-0 lg:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Inbound inventory variance</p>
              <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight sm:text-[28px]">14 units remain unaccounted for.</h3>
              <p className="mt-5 max-w-[680px] border-l-2 border-[#315C70] pl-4 text-[12px] leading-6 text-[#52616A]">For shipment <strong className="font-semibold text-[#25313A]">FBA17-ONT8-260114</strong>, SKU <strong className="font-semibold text-[#25313A]">NCS-48OZ-BLK</strong> records 60 units dispatched against 46 units received at ONT8; the resulting 14-unit variance is the exposure under reconciliation.</p>
              <div className="mt-6"><p className="mb-3 text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial evidence trail</p><Timeline items={timeline} /></div>
            </div>
            <aside className="px-4 py-5 sm:px-6 lg:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial position</p>
              <div className="mt-4 space-y-3">
                {[['Expected reimbursement value', '$1,184.60'], ['Amazon credited to date', '$0.00'], ['Supported exposure', '$1,184.60']].map(([label, value], index) => <div key={label} className={`flex items-end justify-between gap-3 ${index === 2 ? 'border-t border-[#E9E9EC] pt-3' : ''}`}><span className="text-[11px] leading-4 text-[#66737F]">{label}</span><span className={`text-right text-[15px] font-semibold ${index === 2 ? 'text-[#0B74DE]' : 'text-[#25313A]'}`}>{value}</span></div>)}
              </div>
              <div className="mt-6 border-t border-[#E9E9EC] pt-4"><h4 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Evidence confidence</h4><p className="mt-2 text-[12px] leading-5 text-[#52616A]">High. The unit variance is independently stated by the shipment and receiving records, and no corresponding settlement credit is present.</p></div>
              <div className="mt-5 border-t border-[#E9E9EC] pt-4"><h4 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Recommended action</h4><p className="mt-2 text-[12px] leading-5 text-[#52616A]">60 shipped − 46 received = 14 units unresolved. At $84.614 per unit, the supported exposure is 14 × $84.614 = $1,184.60. Seller approval is required before any submission.</p></div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-5 sm:px-6 lg:border-b-0 lg:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Settlement closeout</p>
              <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight sm:text-[28px]">The money is accounted for.</h3>
              <p className="mt-3 max-w-[560px] text-[12px] leading-5 text-[#52616A]">The expected position, Amazon attribution, and settlement record now agree.</p>
              <div className="mt-6"><p className="mb-3 text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Closeout trail</p><Timeline items={closeoutTimeline} closeout /></div>
            </div>
            <aside className="px-4 py-5 sm:px-6 lg:px-5"><div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#F2C94C] text-white"><Check className="h-4 w-4" strokeWidth={3} /></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial status</p><p className="mt-1 text-[20px] font-semibold tracking-tight text-[#2E7D5B]">Reconciled</p><div className="mt-5 space-y-3 border-t border-[#E9E9EC] pt-4 text-[11px]"><div className="flex justify-between gap-3"><span className="text-[#66737F]">Amazon credited</span><span className="font-semibold text-[#25313A]">$1,184.60</span></div><div className="flex justify-between gap-3"><span className="text-[#66737F]">Variance remaining</span><span className="font-semibold text-[#2E7D5B]">$0.00</span></div><div className="flex justify-between gap-3"><span className="text-[#66737F]">Settlement reference</span><span className="font-semibold text-[#25313A]">SETTLE-2026-0418</span></div></div><div className="mt-5 border-t border-[#2EAD7B] pt-3 text-[10px] font-semibold leading-4 text-[#2E7D5B]">Outcome verified against settlement evidence.</div></aside>
          </div>
        )}
      </section>

      <section className="mx-auto mt-10 w-full max-w-[860px] border-t border-[#DCE3E5] pt-7 text-left" aria-labelledby="audit-result-explanation">
        <h2 id="audit-result-explanation" className="text-[18px] font-semibold tracking-tight text-[#25313A] sm:text-[21px]">What the account record establishes</h2>
        <p className="mt-3 max-w-[760px] text-[12px] leading-6 text-[#52616A] sm:text-[13px] sm:leading-7">The audit isolates one inbound receiving event for Northstar Commerce LLC and keeps its financial position separate from assumptions about other shipments, periods, or settlement cycles.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
          <div className="border-t border-[#E9E9EC] pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Coverage</h3><p className="mt-2 text-[12px] leading-5 text-[#66737F]">Shipment FBA17-ONT8-260114, SKU NCS-48OZ-BLK, receiving node ONT8, and settlement SETTLE-2026-0418 resolve to the same event record.</p></div>
          <div className="border-t border-[#E9E9EC] pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Control test</h3><p className="mt-2 text-[12px] leading-5 text-[#66737F]">The receiving quantity is 46 against 60 dispatched. The 14-unit difference is not treated as recovered, cleared, or credited without a matching financial record.</p></div>
          <div className="border-t border-[#E9E9EC] pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Account position</h3><p className="mt-2 text-[12px] leading-5 text-[#66737F]">Expected reimbursement $1,184.60 − Amazon credit $0.00 = supported exposure $1,184.60. The finding remains open pending the seller&apos;s decision.</p></div>
        </div>
      </section>

    </main>
  );
}
