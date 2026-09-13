import React, { useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, Clock3, Search, Send, WalletCards } from "lucide-react";

type PipelineTab = "approval" | "filing" | "filed" | "attention" | "payout" | "completed";

type PipelineRecord = {
  id: string;
  marketplace: string;
  recovery: string;
  amount: string;
  evidence: string;
  status: string;
  next: string;
  tone: "blue" | "amber" | "green" | "red" | "slate";
};

const tabs: { id: PipelineTab; label: string; count: number }[] = [
  { id: "approval", label: "Awaiting approval", count: 4 },
  { id: "filing", label: "Filing in progress", count: 2 },
  { id: "filed", label: "Filed", count: 6 },
  { id: "attention", label: "Needs attention", count: 3 },
  { id: "payout", label: "Awaiting payout", count: 5 },
  { id: "completed", label: "Completed", count: 18 },
];

const records: Record<PipelineTab, PipelineRecord[]> = {
  approval: [
    { id: "REC-10482", marketplace: "US", recovery: "Duplicate charge", amount: "$853.60", evidence: "Proof complete", status: "Ready to file", next: "Review and approve", tone: "blue" },
    { id: "REC-10476", marketplace: "CA", recovery: "Warehouse damage", amount: "$1,240.00", evidence: "3 sources matched", status: "Approval required", next: "Review evidence", tone: "blue" },
    { id: "REC-10471", marketplace: "UK", recovery: "SLA breach compensation", amount: "$418.25", evidence: "Proof complete", status: "Ready to file", next: "Review and approve", tone: "blue" },
  ],
  filing: [
    { id: "REC-10454", marketplace: "US", recovery: "Phantom refund", amount: "$672.18", evidence: "Packet assembled", status: "Submitting", next: "Amazon response", tone: "amber" },
    { id: "REC-10439", marketplace: "MX", recovery: "Dispute charge", amount: "$296.40", evidence: "Packet assembled", status: "Evidence upload", next: "Capture receipt", tone: "amber" },
  ],
  filed: [
    { id: "REC-10398", marketplace: "US", recovery: "Removal auditor", amount: "$2,108.00", evidence: "Submitted 18 Jun", status: "Under review", next: "Monitor response", tone: "slate" },
    { id: "REC-10386", marketplace: "EU", recovery: "Warehouse damage", amount: "$934.70", evidence: "Submitted 17 Jun", status: "Under review", next: "Monitor response", tone: "slate" },
    { id: "REC-10372", marketplace: "CA", recovery: "Duplicate charge", amount: "$517.90", evidence: "Submitted 14 Jun", status: "Response received", next: "Review decision", tone: "slate" },
  ],
  attention: [
    { id: "REC-10361", marketplace: "UK", recovery: "SLA breach compensation", amount: "$781.30", evidence: "Missing delivery proof", status: "Blocked", next: "Request document", tone: "red" },
    { id: "REC-10348", marketplace: "US", recovery: "Dispute charge", amount: "$1,054.22", evidence: "Conflicting records", status: "Needs review", next: "Resolve mismatch", tone: "red" },
    { id: "REC-10327", marketplace: "EU", recovery: "Phantom refund", amount: "$389.00", evidence: "Amazon response unclear", status: "Escalation ready", next: "Review response", tone: "red" },
  ],
  payout: [
    { id: "REC-10294", marketplace: "US", recovery: "Duplicate charge", amount: "$1,638.91", evidence: "Approved 12 Jun", status: "Awaiting payout", next: "Check settlement", tone: "amber" },
    { id: "REC-10282", marketplace: "CA", recovery: "Warehouse damage", amount: "$246.80", evidence: "Approved 10 Jun", status: "Awaiting payout", next: "Check settlement", tone: "amber" },
    { id: "REC-10264", marketplace: "MX", recovery: "Removal auditor", amount: "$927.15", evidence: "Approved 08 Jun", status: "Partial payout", next: "Reconcile balance", tone: "amber" },
  ],
  completed: [
    { id: "REC-10188", marketplace: "US", recovery: "Phantom refund", amount: "$540.00", evidence: "Paid 06 Jun", status: "Recovered", next: "Record closed", tone: "green" },
    { id: "REC-10173", marketplace: "UK", recovery: "Duplicate charge", amount: "$312.45", evidence: "Paid 04 Jun", status: "Recovered", next: "Record closed", tone: "green" },
    { id: "REC-10144", marketplace: "EU", recovery: "SLA breach compensation", amount: "$1,204.66", evidence: "Paid 31 May", status: "Recovered", next: "Record closed", tone: "green" },
  ],
};

const toneStyles: Record<PipelineRecord["tone"], string> = {
  blue: "border-[#CFE2F2] bg-[#F2F8FC] text-[#1967A3]",
  amber: "border-[#E8D8B8] bg-[#FCF8EE] text-[#8A641B]",
  green: "border-[#C9E3D7] bg-[#F2FAF5] text-[#26704E]",
  red: "border-[#E8CCCC] bg-[#FFF6F5] text-[#A23A3A]",
  slate: "border-[#D8E3E8] bg-[#F7FAFB] text-[#546575]",
};

export default function FilingPipelinePreview() {
  const [activeTab, setActiveTab] = useState<PipelineTab>("approval");
  const [query, setQuery] = useState("");
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;
  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records[activeTab];
    return records[activeTab].filter((record) => Object.values(record).join(" ").toLowerCase().includes(normalized));
  }, [activeTab, query]);

  return (
    <main className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026]">
      <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0B74DE] text-white"><Send className="h-4 w-4" /></div>
            <div><p className="text-[13px] font-semibold tracking-tight text-[#182026]">Filing pipeline</p><p className="text-[10px] tracking-tight text-[#7B8A97]">Recovery cases under Margin&apos;s control</p></div>
          </div>
          <div className="hidden items-center gap-2 text-[10px] font-semibold tracking-tight text-[#6B7C88] sm:flex"><span className="h-2 w-2 rounded-full bg-[#43A878]" /> Updated 2 min ago</div>
        </div>

        <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#DCE8EE] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
            <div><p className="text-[10px] font-semibold tracking-tight text-[#7B8A97]">Submission and payout view</p><h1 className="mt-1 font-lora text-[24px] font-normal leading-tight tracking-tight text-[#182026]">Your recovery operation, in motion.</h1></div>
            <div className="flex h-8 items-center gap-2 rounded-[7px] border border-[#D8E3E8] bg-[#FBFCFD] px-2.5 sm:w-[210px]"><Search className="h-3.5 w-3.5 shrink-0 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="min-w-0 flex-1 bg-transparent text-[11px] tracking-tight text-[#182026] outline-none placeholder:text-[#9AA7B0]" /></div>
          </div>

          <div className="overflow-x-auto border-b border-[#D8E3E8]">
            <div className="flex min-w-max gap-6 px-4 sm:px-5">
              {tabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0 py-3 text-[11px] font-medium tracking-tight transition-colors ${activeTab === tab.id ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#66737F] hover:text-[#182026]"}`}>
                  {tab.label}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? "bg-[#E8F3FC] text-[#0B74DE]" : "bg-[#F2F5F7] text-[#7B8A97]"}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F4] bg-[#FCFDFE] px-4 py-3 sm:px-5"><div><p className="text-[12px] font-semibold tracking-tight text-[#182026]">{activeLabel}</p><p className="mt-0.5 text-[10px] tracking-tight text-[#7B8A97]">Showing {visibleRecords.length} of the current records</p></div><div className="hidden items-center gap-1.5 text-[10px] tracking-tight text-[#7B8A97] sm:flex"><WalletCards className="h-3.5 w-3.5" /> Protected workflow</div></div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead><tr className="border-b border-[#DCE8EE] bg-[#F8FAFB] text-[9px] font-semibold uppercase tracking-tight text-[#7B8A97]"><th className="px-4 py-3 sm:px-5">Recovery</th><th className="px-3 py-3">Marketplace</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Evidence</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Next action</th><th className="px-3 py-3" /></tr></thead>
              <tbody>{visibleRecords.map((record) => <tr key={record.id} className="border-b border-[#EEF2F4] last:border-0 hover:bg-[#FBFCFD]"><td className="px-4 py-3.5 sm:px-5"><p className="text-[11px] font-semibold tracking-tight text-[#182026]">{record.recovery}</p><p className="mt-0.5 text-[10px] tracking-tight text-[#8A99A3]">{record.id}</p></td><td className="px-3 py-3.5 text-[11px] font-semibold tracking-tight text-[#546575]">{record.marketplace}</td><td className="px-3 py-3.5 text-[12px] font-semibold tracking-tight text-[#182026] tabular-nums">{record.amount}</td><td className="px-3 py-3.5 text-[10px] tracking-tight text-[#66737F]">{record.evidence}</td><td className="px-3 py-3.5"><span className={`inline-flex items-center gap-1 rounded-[5px] border px-2 py-1 text-[9px] font-semibold tracking-tight ${toneStyles[record.tone]}`}>{record.tone === "green" ? <Check className="h-3 w-3" /> : record.tone === "red" ? <CircleAlert className="h-3 w-3" /> : record.tone === "amber" ? <Clock3 className="h-3 w-3" /> : null}{record.status}</span></td><td className="px-3 py-3.5 text-[10px] font-medium tracking-tight text-[#546575]">{record.next}</td><td className="px-3 py-3.5"><ChevronDown className="h-3.5 w-3.5 -rotate-90 text-[#A4B0B8]" /></td></tr>)}</tbody>
            </table>
            {visibleRecords.length === 0 ? <div className="px-5 py-12 text-center text-[12px] text-[#7B8A97]">No records match this search.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export const __previewRecords = records;
        
