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
          <p className="mt-1 text-[11px] leading-5 text-[#595E68]">{detail}</p>
        </li>
      ))}
    </ol>
  );
}

export default function MarginStandardDeliverable() {
  const [view, setView] = useState<"finding" | "closeout">("finding");
  const isCloseout = view === "closeout";

  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-4 py-5 font-google-sans text-[#191B20] sm:px-6 sm:py-5 lg:px-6">
      <section className="mx-auto mt-0 w-full max-w-[980px] text-left sm:mt-0" aria-label="Margin reconciliation record">
        <header className="px-0 pb-3 pt-0 sm:pt-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-semibold leading-tight tracking-tight sm:text-[21px]">Northstar Commerce LLC</h2>
              <p className="mt-1 text-[11px] leading-4 text-[#858792]">Amazon US · Jan–Mar 2026 · Account reconciliation record</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#2E7D5B]"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2EAD7B]"><Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /></span> {isCloseout ? "Reconciled" : "Completed"}</div>
          </div>
          <div className="mt-5 flex gap-4">
            <button type="button" onClick={() => setView("finding")} className={`border-b-2 pb-2 text-[11px] font-semibold tracking-normal ${!isCloseout ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#595E68]"}`}>Supported finding</button>
            <button type="button" onClick={() => setView("closeout")} className={`border-b-2 pb-2 text-[11px] font-semibold tracking-normal ${isCloseout ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#595E68]"}`}>Closeout record</button>
          </div>
        </header>

        {!isCloseout ? (
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-4 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#595E68]">Inbound inventory variance</p>
              <h3 className="mt-2 text-[16px] font-normal leading-tight tracking-tight sm:text-[20px]">14 units remain unaccounted for.</h3>
              <p className="mt-5 max-w-[680px] border-l-2 border-[#315C70] pl-4 text-[12px] leading-6 text-[#595E68]">For shipment <strong className="font-semibold text-[#25313A]">FBA17-ONT8-260114</strong>, SKU <strong className="font-semibold text-[#25313A]">NCS-48OZ-BLK</strong> records 60 units dispatched against 46 units received at ONT8; the resulting 14-unit variance is the exposure under reconciliation.</p>
              <div className="mt-6"><p className="mb-3 text-[10px] font-semibold uppercase tracking-tight text-[#595E68]">Financial evidence trail</p><Timeline items={timeline} /></div>
            </div>
            <aside className="px-4 py-5 sm:px-6 lg:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#595E68]">Financial position</p>
              <div className="mt-4 space-y-3">
                {[['Expected reimbursement value', '$1,184.60'], ['Amazon credited to date', '$0.00'], ['Supported exposure', '$1,184.60']].map(([label, value], index) => <div key={label} className={`flex items-end justify-between gap-3 ${index === 2 ? 'pt-3' : ''}`}><span className="text-[11px] leading-4 text-[#595E68]">{label}</span><span className={`text-right text-[15px] font-semibold ${index === 2 ? 'text-[#0B74DE]' : 'text-[#25313A]'}`}>{value}</span></div>)}
              </div>
              <div className="mt-6 pt-4"><h4 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Evidence confidence</h4><p className="mt-2 text-[12px] leading-5 text-[#595E68]">High. The unit variance is independently stated by the shipment and receiving records, and no corresponding settlement credit is present.</p></div>
              <div className="mt-5 pt-4"><h4 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Recommended action</h4><p className="mt-2 text-[12px] leading-5 text-[#595E68]">60 shipped − 46 received = 14 units unresolved. At $84.614 per unit, the supported exposure is 14 × $84.614 = $1,184.60. Seller approval is required before any submission.</p></div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-4 py-5 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#595E68]">Settlement closeout</p>
              <h3 className="mt-2 text-[16px] font-normal leading-tight tracking-tight sm:text-[20px]">The money is accounted for.</h3>
              <p className="mt-3 max-w-[560px] text-[12px] leading-5 text-[#595E68]">The expected position, Amazon attribution, and settlement record now agree.</p>
              <div className="mt-6"><p className="mb-3 text-[10px] font-semibold uppercase tracking-tight text-[#595E68]">Closeout trail</p><Timeline items={closeoutTimeline} closeout /></div>
            </div>
            <aside className="px-4 py-5 sm:px-6 lg:px-5"><div className="pt-4"><span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8D8] px-2.5 py-1.5 text-[10px] font-semibold tracking-tight text-[#6C5A15]"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F2C94C] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>Financial status · Reconciled</span></div><dl className="mt-5 text-[11px]"><div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-[#595E68]">Amazon credited</dt><dd className="font-semibold text-[#25313A]">$1,184.60</dd></div><div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-[#595E68]">Variance remaining</dt><dd className="font-semibold text-[#2E7D5B]">$0.00</dd></div><div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-[#595E68]">Settlement reference</dt><dd className="font-semibold text-[#25313A]">SETTLE-2026-0418</dd></div></dl><p className="mt-4 border-l-2 border-[#F2C94C] pl-3 text-[11px] font-semibold leading-5 text-[#2E7D5B]">Outcome verified against settlement evidence.</p></aside>
          </div>
        )}
      </section>

      <section className="mx-auto mt-10 w-full max-w-[980px] border-[#D7D7D1] pt-7 text-left" aria-labelledby="audit-result-explanation">
        <h2 id="audit-result-explanation" className="text-[18px] font-semibold tracking-tight text-[#25313A] sm:text-[21px]">What the account record establishes</h2>
        <p className="mt-3 max-w-[760px] text-[12px] leading-6 text-[#595E68] sm:text-[13px] sm:leading-7">The audit isolates one inbound receiving event for Northstar Commerce LLC and keeps its financial position separate from assumptions about other shipments, periods, or settlement cycles.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
          <div className="pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Coverage</h3><p className="mt-2 text-[12px] leading-5 text-[#595E68]">Shipment FBA17-ONT8-260114, SKU NCS-48OZ-BLK, receiving node ONT8, and settlement SETTLE-2026-0418 resolve to the same event record.</p></div>
          <div className="pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Control test</h3><p className="mt-2 text-[12px] leading-5 text-[#595E68]">The receiving quantity is 46 against 60 dispatched. The 14-unit difference is not treated as recovered, cleared, or credited without a matching financial record.</p></div>
          <div className="pt-3"><h3 className="text-[13px] font-semibold tracking-tight text-[#25313A]">Account position</h3><p className="mt-2 text-[12px] leading-5 text-[#595E68]">Expected reimbursement $1,184.60 − Amazon credit $0.00 = supported exposure $1,184.60. The finding remains open pending the seller&apos;s decision.</p></div>
        </div>
      </section>

    </main>
  );
}
