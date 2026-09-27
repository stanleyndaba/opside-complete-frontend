import React, { useMemo, useState } from "react";
import { ArrowUpRight, Check, Search } from "lucide-react";

type ReviewCase = {
  id: string;
  store: string;
  identifiers: string;
  progress: string;
  progressTone: string;
  requested: string;
  approved: string;
  gap: string;
  responseType: string;
  response: string;
  reason: string;
  state: string;
  stateTone: string;
  stateSummary: string;
  proof: string;
  proofDetail: string;
  basis: string;
  updated: string;
  next: string;
};

const cases: ReviewCase[] = [
  { id: "RFD-16942-INB", store: "Northstar Home US", identifiers: "113-9074218-552 / NS-LINEN-SHELF / B0D1P7X5TR", progress: "Response received", progressTone: "text-[#26704E]", requested: "$1,248.60", approved: "$0.00", gap: "$1,248.60", responseType: "Denied response", response: "Amazon determined that the inbound quantity variance was not supported by the receiving record.", reason: "Inbound shipment shortage", state: "Ready to review", stateTone: "bg-[#F1FAF6] text-[#26704E]", stateSummary: "Support is strong enough to review without another evidence pass.", proof: "BOL and receive delta linked", proofDetail: "Signed delivery record, carton manifest, shipment plan, and receiving report are connected.", basis: "The seller evidence shows a documented difference between shipped cartons and Amazon receiving activity.", updated: "Updated 18 minutes ago", next: "Prepare resubmission" },
  { id: "RFD-16918-RET", store: "Brightline Living CA", identifiers: "114-2083167-901 / BL-CERAMIC-MUG / B09Q4M2L7H", progress: "Response received", progressTone: "text-[#8A641B]", requested: "$486.00", approved: "$120.00", gap: "$366.00", responseType: "Approved-value gap", response: "Amazon approved part of the return reimbursement but did not account for two received units.", reason: "Customer return credit", state: "Strengthen evidence", stateTone: "bg-[#FCF8EE] text-[#8A641B]", stateSummary: "The support pack is close, but one stronger source should be added first.", proof: "Return scan needs reconciliation", proofDetail: "Return authorization and settlement line are linked; receiving scan needs the unit-level match.", basis: "The recorded approval is lower than the return event and the unit ledger indicate.", updated: "Updated 42 minutes ago", next: "Verify return receipt" },
  { id: "RFD-16877-REM", store: "Harbor & Pine UK", identifiers: "Removal R-90318 / HP-OAK-SIDE-TABLE / B0D2H5K9WF", progress: "Response received", progressTone: "text-[#A23A3A]", requested: "$892.40", approved: "$0.00", gap: "$892.40", responseType: "Denied response", response: "Amazon could not match the removal delivery variance to the carrier handoff in the submitted record.", reason: "Removal shipment shortage", state: "Needs proof", stateTone: "bg-[#FFF6F5] text-[#A23A3A]", stateSummary: "This case should not be retried until the required proof is linked.", proof: "Carrier handoff missing", proofDetail: "Removal order and warehouse release are present; carrier manifest and delivery scan are still required.", basis: "The warehouse release supports the shortage, but the handoff chain is incomplete.", updated: "Updated 1 hour ago", next: "Request carrier record" },
  { id: "RFD-16831-FEE", store: "Alder Peak DE", identifiers: "Settlement 205-442 / AP-REFILL-FILTER / B0C9F3L2ND", progress: "Response received", progressTone: "text-[#26704E]", requested: "$274.88", approved: "$0.00", gap: "$274.88", responseType: "Denied response", response: "Amazon applied a referral fee rate that differs from the category and rate card recorded for the affected period.", reason: "Referral fee overcharge", state: "Ready to review", stateTone: "bg-[#F1FAF6] text-[#26704E]", stateSummary: "Support is strong enough to review without another evidence pass.", proof: "Rate card and category record linked", proofDetail: "Settlement detail, historical category assignment, and rate card are connected.", basis: "The charged fee does not reconcile with the verified category rate for the settlement period.", updated: "Updated 2 hours ago", next: "Prepare resubmission" },
  { id: "RFD-16792-SLA", store: "Cedar & Coast MX", identifiers: "112-7742088-514 / CC-POWER-STRIP / B08K4P7R2H", progress: "Response received", progressTone: "text-[#8A641B]", requested: "$337.45", approved: "$0.00", gap: "$337.45", responseType: "Denied response", response: "The service-level request was rejected because the delivery promise timeline was not fully established.", reason: "SLA breach compensation", state: "Strengthen evidence", stateTone: "bg-[#FCF8EE] text-[#8A641B]", stateSummary: "The support pack is close, but one stronger source should be added first.", proof: "Promise timeline needs source detail", proofDetail: "Order record and carrier exception are linked; the original promise timestamp needs confirmation.", basis: "The response can be reviewed once the promise window is reconciled to the carrier event.", updated: "Updated 3 hours ago", next: "Reconcile promise window" },
];

export default function AppealsReview() {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? cases.filter((item) => Object.values(item).join(" ").toLowerCase().includes(needle)) : cases;
  }, [query]);
  const review = (item: ReviewCase) => {
    setToast(`${item.id}: review opened`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="preview-google-sans min-h-screen overflow-x-auto bg-[#FAFAF7] font-google-sans text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto min-w-[760px] max-w-[1280px] px-4 py-4 sm:min-w-0 sm:px-6 sm:py-6">
      <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <header className="mb-4 pb-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Appeals and response review</p><h1 className="mt-0.5 font-google-sans text-[20px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[23px]">Appeals review</h1><p className="mt-1 max-w-4xl text-[11px] leading-5 tracking-tight text-[#66737F]">Review recorded Amazon responses, verify the evidence behind each decision, and decide whether resubmission is supportable.</p></header>
        <div className="space-y-1"><div className="text-[12px] font-medium tracking-tight text-[#182026]">Reconstructed appeals from Amazon responses and linked case evidence</div><div className="text-[11px] font-medium text-[#0B74DE]">Each response stays attached to its review state, proof requirement, and next supported action.</div><div className="text-[10px] font-medium text-[#4B5563]">{filtered.length} response cases requiring review</div></div>
        <div className="mt-4 flex h-9 max-w-[260px] items-center gap-2 rounded-[8px] border border-[#D8E3E8] bg-[#FBFCFD] px-3"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases" className="w-full bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div>
        <div className="mt-5">
          {filtered.map((item, index) => <article key={item.id} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4 py-4 text-[12px] sm:grid-cols-[26px_minmax(0,1fr)]">
            {index < filtered.length - 1 ? <span className="absolute bottom-[-1px] left-[11px] top-[54px] w-px bg-[#C9D6DE] sm:left-[12px]" aria-hidden="true" /> : null}
            <span className={`relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${item.approved === "$0.00" ? "bg-[#E6A700]" : "bg-[#4F8067]"}`} aria-label="Appeal response recorded"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="font-semibold tracking-tight text-[#182026]">{item.id} · {item.store}</p><span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold tracking-tight ${item.stateTone}`}>{item.state}</span></div><p className="mt-1 text-[10px] tracking-tight text-[#9CA3AF]">{item.identifiers}</p><p className="mt-2 text-[11px] font-semibold tracking-tight text-[#36404A]">{item.responseType}: {item.response}</p><p className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">Reason: {item.reason}</p><p className="mt-2 text-[11px] font-bold leading-4 tracking-tight text-[#111827]">{item.stateSummary}</p><p className="mt-1 text-[11px] leading-4 text-[#66737F]">Required proof: <span className="font-semibold text-[#36404A]">{item.proof}</span> — {item.proofDetail}</p><p className="mt-1 text-[11px] leading-4 text-[#66737F]">Review basis: {item.basis}</p><time className="mt-2 block text-[10px] font-medium tracking-tight text-[#66737F]">{item.updated}</time><p className="mt-1 text-[11px] font-medium tracking-tight text-[#66737F]">Requested {item.requested} · Approved {item.approved} · <span className="font-semibold text-[#0B74DE]">Review gap {item.gap}</span></p><div className="mt-2 flex flex-wrap items-center gap-3"><span className="text-[11px] font-semibold tracking-tight text-[#36404A]">Next: {item.next}</span><button type="button" onClick={() => review(item)} className="inline-flex items-center gap-1 text-[11px] font-medium tracking-tight text-[#0B74DE] hover:underline">Review response<ArrowUpRight className="h-3 w-3" /></button><button type="button" onClick={() => review(item)} className="text-[10px] font-medium tracking-tight text-[#66737F] hover:text-[#0B74DE] hover:underline">View source detail</button></div></div>
          </article>)}
          {filtered.length === 0 ? <div className="px-6 py-20 text-center text-[12px] tracking-tight text-[#7B8A97]">No cases match this search.</div> : null}
        </div>
      </section>
    </div>
  </main>;
}
