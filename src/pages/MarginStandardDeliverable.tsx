import React, { useState } from "react";
import { Check, ChevronRight, FileCheck2 } from "lucide-react";

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
      <div className="w-full max-w-[860px] text-center">
        <p className="font-google-sans text-[10px] font-semibold uppercase tracking-normal text-[#7A8994]">MARGIN STANDARD · REPRESENTATIVE DELIVERABLE</p>
        <h1 className="mx-auto mt-3 max-w-[700px] font-google-sans text-[27px] font-semibold leading-[1.04] tracking-tight sm:text-[36px] md:text-[46px]">Do not buy a promise. <span className="font-normal text-[#74838B]">Review the work.</span></h1>
        <p className="mx-auto mt-4 max-w-[650px] text-[13px] leading-6 text-[#5B6A72] sm:text-[15px] sm:leading-7">Every material finding becomes an inspectable financial record: what happened, what supports it, what remains uncertain, and what action is justified.</p>
      </div>

      <section className="mx-auto mt-7 w-full max-w-[860px] overflow-hidden rounded-[8px] border border-[#DCE8EE] bg-white text-left shadow-[0_18px_45px_rgba(24,32,38,0.12)] sm:mt-9" aria-label="Representative Margin audit deliverable">
        <header className="border-b border-[#E9E9EC] px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-normal text-[#7A8994]"><FileCheck2 className="h-3.5 w-3.5" /> Margin Audit Result</div>
              <h2 className="mt-2 text-[18px] font-semibold leading-tight tracking-tight sm:text-[21px]">Northstar Commerce LLC</h2>
              <p className="mt-1 text-[11px] leading-4 text-[#73828A]">Amazon US · Jan–Mar 2026 · Representative account record</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-[4px] bg-[#2EAD7B] px-2.5 py-1.5 text-[10px] font-semibold text-white"><Check className="h-3 w-3" strokeWidth={3} /> {isCloseout ? "Financially reconciled" : "Review completed"}</div>
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
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Shipment', 'FBA17-ONT8-260114'], ['SKU', 'NCS-48OZ-BLK'], ['Shipped', '60 units'], ['Received', '46 units']].map(([label, value]) => <div key={label} className="border border-[#E9E9EC] bg-[#FAFAFB] p-2.5"><p className="text-[9px] uppercase tracking-normal text-[#8A99A5]">{label}</p><p className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#33434B]">{value}</p></div>)}
              </div>
              <div className="mt-6"><p className="mb-3 text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial evidence trail</p><Timeline items={timeline} /></div>
            </div>
            <aside className="px-4 py-5 sm:px-6 lg:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial position</p>
              <div className="mt-4 space-y-3">
                {[['Expected reimbursement value', '$1,184.60'], ['Amazon credited to date', '$0.00'], ['Supported exposure', '$1,184.60']].map(([label, value], index) => <div key={label} className={`flex items-end justify-between gap-3 ${index === 2 ? 'border-t border-[#E9E9EC] pt-3' : ''}`}><span className="text-[11px] leading-4 text-[#66737F]">{label}</span><span className={`text-right text-[15px] font-semibold ${index === 2 ? 'text-[#0B74DE]' : 'text-[#25313A]'}`}>{value}</span></div>)}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-[4px] bg-[#2EAD7B] px-3 py-2.5 text-white"><span className="text-[10px] font-semibold uppercase tracking-normal">Evidence confidence</span><span className="text-[12px] font-bold">HIGH</span></div>
              <div className="mt-4 border-l-2 border-[#2EAD7B] bg-[#F4FAF6] px-3 py-3"><p className="text-[10px] font-semibold text-[#25313A]">Recommended action</p><p className="mt-1 text-[11px] leading-5 text-[#52616A]">Evidence supports recovery. Submission requires seller approval.</p><p className="mt-2 text-[10px] font-semibold text-[#2E7D5B]">Margin prepares the case and tracks the outcome.</p></div>
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
            <aside className="px-4 py-5 sm:px-6 lg:px-5"><div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#2EAD7B] text-white"><Check className="h-7 w-7" strokeWidth={3} /></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-normal text-[#66737F]">Financial status</p><p className="mt-1 text-[20px] font-semibold tracking-tight text-[#2E7D5B]">Reconciled</p><div className="mt-5 space-y-3 border-t border-[#E9E9EC] pt-4 text-[11px]"><div className="flex justify-between gap-3"><span className="text-[#66737F]">Amazon credited</span><span className="font-semibold text-[#25313A]">$1,184.60</span></div><div className="flex justify-between gap-3"><span className="text-[#66737F]">Variance remaining</span><span className="font-semibold text-[#2E7D5B]">$0.00</span></div><div className="flex justify-between gap-3"><span className="text-[#66737F]">Settlement reference</span><span className="font-semibold text-[#25313A]">SETTLE-2026-0418</span></div></div><div className="mt-5 rounded-[4px] bg-[#2EAD7B] px-3 py-2.5 text-[10px] font-semibold leading-4 text-white">Outcome verified against settlement evidence.</div></aside>
          </div>
        )}
        <footer className="flex flex-col gap-2 border-t border-[#E9E9EC] bg-[#FAFAFB] px-4 py-3 text-[10px] text-[#71818A] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>Representative sample · Not a live customer result</span><span className="inline-flex items-center gap-1 font-semibold text-[#55717D]">Inspectable record <ChevronRight className="h-3 w-3" /></span></footer>
      </section>

      <p className="mx-auto mt-5 max-w-[680px] text-center text-[16px] font-semibold leading-6 tracking-tight text-[#315C70] sm:mt-7 sm:text-[20px]">The work is not complete when a case is opened. It is complete when the money is accounted for.</p>
    </main>
  );
}
