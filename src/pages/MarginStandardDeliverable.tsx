import React, { useState } from "react";
import { Check, ChevronRight, FileCheck2, ShieldCheck } from "lucide-react";

const evidenceRows = [
  ["Shipment record", "Confirmed", "FBA17-ONT8-260114"],
  ["Amazon receipt", "Confirmed", "46 units received at ONT8"],
  ["Inventory movement", "Variance identified", "14 units not accounted for"],
  ["Settlement history", "No credit found", "Through SETTLE-2026-0418"],
];

export default function MarginStandardDeliverable() {
  const [view, setView] = useState<"finding" | "closeout">("finding");

  return (
    <main className="min-h-screen bg-[#F3F7F7] px-4 py-7 text-[#182026] sm:px-8 sm:py-10 lg:flex lg:min-h-[700px] lg:flex-col lg:items-center lg:justify-center lg:px-10 lg:py-12">
      <div className="w-full max-w-[860px] text-center">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71818A]">MARGIN STANDARD · REPRESENTATIVE DELIVERABLE</p>
        <h1 className="mx-auto mt-3 max-w-[700px] font-lora text-[27px] leading-[1.04] tracking-[-0.045em] sm:text-[36px] md:text-[46px]">Do not buy a promise. <span className="text-[#74838B]">Review the work.</span></h1>
        <p className="mx-auto mt-4 max-w-[650px] text-[13px] leading-6 text-[#5B6A72] sm:text-[15px] sm:leading-7">Every material finding becomes an inspectable financial record: what happened, what supports it, what remains uncertain, and what action is justified.</p>
      </div>

      <section className="mx-auto mt-7 w-full max-w-[860px] overflow-hidden rounded-[10px] border border-[#C9D7DB] bg-white text-left shadow-[0_18px_45px_rgba(37,73,91,0.14)] sm:mt-9" aria-label="Representative Margin audit deliverable">
        <header className="border-b border-[#DCE6E8] bg-[#FBFCFB] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6D7D85]"><FileCheck2 className="h-3.5 w-3.5" /> Margin Audit Result</div>
              <h2 className="mt-2 font-google-sans text-[17px] font-semibold tracking-[-0.02em] sm:text-[20px]">Northstar Commerce LLC</h2>
              <p className="mt-1 text-[11px] text-[#73828A]">Amazon US · Jan–Mar 2026 · Representative account record</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-[#CFE5D8] bg-[#F1FAF4] px-3 py-1.5 text-[10px] font-semibold text-[#31734B]"><Check className="h-3 w-3" /> Review completed</div>
          </div>
          <div className="mt-5 flex gap-1 border-b border-[#DCE6E8]">
            <button type="button" onClick={() => setView("finding")} className={`border-b-2 px-1 pb-2 text-[11px] font-semibold ${view === "finding" ? "border-[#315C70] text-[#315C70]" : "border-transparent text-[#87949A]"}`}>Supported finding</button>
            <button type="button" onClick={() => setView("closeout")} className={`ml-4 border-b-2 px-1 pb-2 text-[11px] font-semibold ${view === "closeout" ? "border-[#315C70] text-[#315C70]" : "border-transparent text-[#87949A]"}`}>Closeout record</button>
          </div>
        </header>

        {view === "finding" ? (
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71818A]">Inbound inventory variance</p>
                <h3 className="mt-2 font-lora text-[25px] leading-none tracking-[-0.04em] sm:text-[31px]">14 units remain unaccounted for.</h3>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[['Shipment', 'FBA17-ONT8-260114'], ['SKU', 'NCS-48OZ-BLK'], ['Shipped', '60 units'], ['Received', '46 units']].map(([label, value]) => <div key={label} className="rounded-[6px] border border-[#E0E8EA] bg-[#FAFCFC] p-2.5"><p className="text-[9px] uppercase tracking-[0.06em] text-[#849198]">{label}</p><p className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#33434B]">{value}</p></div>)}
                </div>
                <div className="mt-5 overflow-hidden rounded-[7px] border border-[#DCE6E8]">
                  <div className="grid grid-cols-[1.05fr_0.9fr_1.1fr] border-b border-[#DCE6E8] bg-[#F6F9F9] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#849198]"><span>Evidence item</span><span>Assessment</span><span>Record detail</span></div>
                  {evidenceRows.map(([item, assessment, detail]) => <div key={item} className="grid grid-cols-[1.05fr_0.9fr_1.1fr] border-b border-[#EDF1F2] px-3 py-2.5 text-[10px] leading-4 last:border-0"><span className="font-medium text-[#394A52]">{item}</span><span className={assessment === "Confirmed" ? "font-semibold text-[#31734B]" : "font-semibold text-[#9B6829]"}>{assessment}</span><span className="text-[#687881]">{detail}</span></div>)}
                </div>
              </div>
              <aside className="rounded-[8px] border border-[#D4E1E4] bg-[#F7FBFB] p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71818A]">Financial position</p>
                <div className="mt-4 space-y-3">
                  {[['Expected reimbursement value', '$1,184.60'], ['Amazon credited to date', '$0.00'], ['Supported exposure', '$1,184.60']].map(([label, value], index) => <div key={label} className={`flex items-end justify-between gap-3 ${index === 2 ? 'border-t border-[#D4E1E4] pt-3' : ''}`}><span className="text-[11px] leading-4 text-[#687881]">{label}</span><span className={`text-right text-[15px] font-semibold ${index === 2 ? 'text-[#1F6175]' : 'text-[#33434B]'}`}>{value}</span></div>)}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-[6px] bg-[#EAF5EE] px-3 py-2.5"><span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#4E7560]">Evidence confidence</span><span className="text-[12px] font-bold text-[#31734B]">HIGH</span></div>
                <div className="mt-4 rounded-[6px] border border-[#D7E4E7] bg-white p-3"><p className="text-[10px] font-semibold text-[#33434B]">Recommended action</p><p className="mt-1 text-[11px] leading-5 text-[#687881]">Evidence supports recovery. Submission requires seller approval.</p><p className="mt-2 text-[10px] font-semibold text-[#315C70]">Margin prepares the case and tracks the outcome.</p></div>
              </aside>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71818A]">Settlement closeout</p>
                <h3 className="mt-2 font-lora text-[25px] leading-none tracking-[-0.04em] sm:text-[31px]">The recovery is closed only when the money is accounted for.</h3>
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {[['Amazon credited', '$1,184.60'], ['Variance remaining', '$0.00'], ['Settlement reference', 'SETTLE-2026-0418']].map(([label, value]) => <div key={label} className="rounded-[7px] border border-[#DCE6E8] bg-[#FAFCFC] p-3"><p className="text-[9px] uppercase tracking-[0.06em] text-[#849198]">{label}</p><p className="mt-1 text-[15px] font-semibold text-[#33434B]">{value}</p></div>)}
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-[7px] border border-[#CFE5D8] bg-[#F1FAF4] p-3"><ShieldCheck className="h-5 w-5 shrink-0 text-[#31734B]" /><div><p className="text-[11px] font-semibold text-[#31734B]">Financial status: Reconciled</p><p className="mt-1 text-[10px] leading-4 text-[#5F7768]">Expected position, Amazon credit, and settlement record agree.</p></div></div>
              </div>
              <aside className="rounded-[8px] border border-[#D4E1E4] bg-[#F7FBFB] p-4"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#71818A]">Margin closeout standard</p><p className="mt-4 font-lora text-[21px] leading-[1.08] tracking-[-0.03em] text-[#315C70]">A case is not a result. A result is not a closeout.</p><p className="mt-4 text-[11px] leading-5 text-[#687881]">The record stays open until the expected amount, Amazon attribution, and settlement outcome are reconciled.</p><div className="mt-5 flex items-center gap-2 text-[10px] font-semibold text-[#31734B]"><Check className="h-3 w-3" /> Outcome verified against settlement evidence</div></aside>
            </div>
          </div>
        )}
        <footer className="flex flex-col gap-2 border-t border-[#DCE6E8] bg-[#FBFCFB] px-4 py-3 text-[10px] text-[#71818A] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>Representative sample · Not a live customer result</span><span className="inline-flex items-center gap-1 font-semibold text-[#55717D]">Inspectable record <ChevronRight className="h-3 w-3" /></span></footer>
      </section>

      <p className="mx-auto mt-5 max-w-[680px] text-center font-lora text-[18px] leading-tight tracking-[-0.03em] text-[#315C70] sm:mt-7 sm:text-[23px]">The work is not complete when a case is opened. It is complete when the money is accounted for.</p>
    </main>
  );
}
