import React, { useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, Search } from "lucide-react";

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
  return <main className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
      <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
        <header className="border-b border-[#DCE8EE] px-5 py-5 sm:px-6">
          <div className="text-[10px] font-medium tracking-tight text-[#7B8A97]">Response review</div>
          <h1 className="mt-1 font-lora text-[20px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[23px]">Appeals review</h1>
          <p className="mt-2 max-w-4xl text-[12px] leading-5 tracking-tight text-[#66737F]">Review recorded Amazon responses, verify the evidence behind each decision, and decide whether resubmission is supportable.</p>
        </header>
        <div className="flex items-center justify-between gap-4 border-b border-[#DCE8EE] px-5 py-4 sm:px-6">
          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">{filtered.length} response cases requiring review</p>
          <div className="flex h-9 items-center gap-2 rounded-[8px] border border-[#D8E3E8] bg-[#FBFCFD] px-3"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases" className="w-[150px] bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] border-collapse text-left">
            <thead><tr className="border-b border-[#F3F5F4] bg-[#F9FAFB]">{["Case", "Verified Response", "Review State", "Required Proof", "Review Basis", "Next Step", ""].map((heading) => <th key={heading} className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#F3F5F4]">{filtered.map((item) => <tr key={item.id} className="group align-top transition-colors hover:bg-[#F3F5F4]/50">
              <td className="px-4 py-4"><div className="w-[260px] space-y-3"><div className="space-y-1"><p className="text-[13px] font-bold tracking-tight text-[#111827]">{item.id}</p><p className="text-[11px] font-medium text-[#6B7280]">{item.store}</p><p className="text-[10px] font-medium tracking-tight text-[#9CA3AF]">{item.identifiers}</p><div className="pt-0.5 flex items-center gap-1.5"><span className="text-[8px] font-bold tracking-tight text-[#D1D5DB]">Case progress:</span><span className={`text-[9px] font-bold tracking-tight ${item.progressTone}`}>{item.progress}</span></div></div><div className="border-t border-[#F3F5F4] pt-3 space-y-1.5"><p className="text-[9px] font-bold tracking-tight text-[#9CA3AF]">Amount at stake</p><div className="space-y-0.5 text-[11px]"><div className="flex justify-between"><span className="text-[#9CA3AF]">Requested</span><span className="font-semibold text-[#111827]">{item.requested}</span></div><div className="flex justify-between"><span className="text-[#9CA3AF]">Amazon approval</span><span className="font-semibold text-[#111827]">{item.approved}</span></div><div className="flex justify-between"><span className="text-[#9CA3AF]">Review gap</span><span className="font-bold text-[#111827]">{item.gap}</span></div></div></div></div></td>
              <td className="px-4 py-4"><div className="w-[280px] space-y-3"><span className="inline-flex rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[8px] font-bold tracking-tight text-[#36404A]">{item.responseType}</span><p className="text-[12px] font-semibold leading-5 tracking-tight text-[#111827]">{item.response}</p><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-medium tracking-tight text-[#66737F]">Reason: {item.reason}</span><button type="button" onClick={() => review(item)} className="text-[9px] font-bold tracking-tight text-[#0B74DE] hover:underline">View source detail</button></div></div></td>
              <td className="px-4 py-4"><div className="w-[205px] space-y-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold tracking-tight ${item.stateTone}`}>{item.state}</span><p className="text-[11px] font-bold leading-4 tracking-tight text-[#111827]">{item.stateSummary}</p></div></td>
              <td className="px-4 py-4"><div className="w-[225px] space-y-1.5"><p className="text-[12px] font-bold tracking-tight text-[#111827]">{item.proof}</p><p className="text-[10px] font-medium leading-4 text-[#6B7280]">{item.proofDetail}</p></div></td>
              <td className="px-4 py-4"><div className="w-[245px] space-y-1.5"><p className="text-[12px] font-semibold leading-5 tracking-tight text-[#111827]">{item.basis}</p><div className="text-[9px] font-medium tracking-tight text-[#66737F]">{item.updated}</div></div></td>
              <td className="px-4 py-4"><div className="w-[185px] space-y-2"><p className="text-[11px] font-bold leading-4 text-[#111827]">{item.next}</p><button type="button" onClick={() => review(item)} className="inline-flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-[#0B74DE] text-[11px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">Review response<ArrowUpRight className="h-3 w-3" /></button></div></td>
              <td className="px-4 py-4"><ChevronRight className="h-3.5 w-3.5 text-[#E5E7EB] group-hover:translate-x-0.5 group-hover:text-[#111827]" /></td>
            </tr>)}</tbody>
          </table>
          {filtered.length === 0 ? <div className="px-6 py-20 text-center text-[12px] tracking-tight text-[#7B8A97]">No cases match this search.</div> : null}
        </div>
      </section>
    </div>
  </main>;
}
