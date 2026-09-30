import React, { useState } from "react";
import { AlertCircle, Check, Circle, Minus, Plus } from "lucide-react";

const findingRows = [
  {
    reference: "REC-014",
    state: "exception",
    label: "Exception",
    title: "Inbound receiving variance — 14 units under reconciliation",
    detail: "FBA17-ONT8-260114 · 60 dispatched / 46 received at ONT8",
    value: "$1,184.60",
  },
  {
    reference: "REC-013",
    state: "review",
    label: "Evidence basis",
    title: "Expected reimbursement exposure calculated from supported units",
    detail: "14 × $84.614 unit value = $1,184.60 gross exposure",
    value: "$1,184.60",
  },
  {
    reference: "REC-012",
    state: "action",
    label: "Decision",
    title: "Seller approval required before recovery submission",
    detail: "Evidence threshold met · response remains subject to seller control",
    value: "Approval",
  },
  {
    reference: "REC-011",
    state: "supported",
    label: "Supported",
    title: "Shipment and receiving records establish the unit variance",
    detail: "Manifest, carrier receiving record, and inventory history aligned",
    value: "14 units",
  },
  {
    reference: "REC-010",
    state: "supported",
    label: "Reconciled",
    title: "Settlement attribution tested against the expected position",
    detail: "SETTLE-2026-0418 · Amazon credit identified: $0.00",
    value: "$0.00",
  },
  {
    reference: "REC-009",
    state: "held",
    label: "Held",
    title: "Residual variance remains outside the supportable basis",
    detail: "No unsupported amount is treated as recovered or payable",
    value: "Unresolved",
  },
];

const closeoutRows = [
  {
    reference: "REC-014",
    state: "supported",
    label: "Verified",
    title: "Inbound variance carried to a supported recovery position",
    detail: "14 units × $84.614 = $1,184.60 expected reimbursement",
    value: "$1,184.60",
  },
  {
    reference: "REC-013",
    state: "supported",
    label: "Attributed",
    title: "Amazon credit matched to the expected financial position",
    detail: "Settlement SETTLE-2026-0418 records $1,184.60 credited",
    value: "$1,184.60",
  },
  {
    reference: "REC-012",
    state: "supported",
    label: "Closed",
    title: "Residual variance tested to zero at settlement closeout",
    detail: "$1,184.60 expected − $1,184.60 credited = $0.00 variance",
    value: "$0.00",
  },
  {
    reference: "REC-011",
    state: "supported",
    label: "Recorded",
    title: "Outcome recorded against the underlying evidence trail",
    detail: "Financial position closed without extending assumptions",
    value: "Complete",
  },
];

type RowState = "exception" | "review" | "action" | "supported" | "held";
type ControlRow = (typeof findingRows)[number];

const stateStyles: Record<RowState, { icon: React.ReactNode; className: string }> = {
  exception: { icon: <AlertCircle className="h-3 w-3" strokeWidth={3} />, className: "bg-[#2D7FF9] text-white" },
  review: { icon: <Circle className="h-3.5 w-3.5" strokeWidth={2.5} />, className: "bg-[#7E8A92] text-white" },
  action: { icon: <Minus className="h-3 w-3" strokeWidth={3} />, className: "bg-[#F39A45] text-white" },
  supported: { icon: <Check className="h-3 w-3" strokeWidth={3} />, className: "bg-[#35C56B] text-white" },
  held: { icon: <Circle className="h-3.5 w-3.5" strokeWidth={2.5} />, className: "bg-[#9AA8B7] text-white" },
};

function ThreeStrokeMark() {
  return <span className="flex h-3 w-3 items-end justify-center gap-[1px]" aria-hidden="true"><i className="h-1.5 w-px rounded-full bg-current" /><i className="h-2.5 w-px rounded-full bg-current" /><i className="h-2 w-px rounded-full bg-current" /></span>;
}

function ControlRowView({ row, index, selected, onSelect }: { row: ControlRow; index: number; selected: boolean; onSelect: () => void }) {
  const state = stateStyles[row.state as RowState];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group grid w-full grid-cols-[32px_88px_30px_minmax(0,1fr)] items-center gap-2 rounded-[10px] px-2 py-2 text-left transition-colors sm:grid-cols-[42px_108px_38px_minmax(0,1fr)_140px] sm:gap-3 sm:px-3 ${selected ? "bg-[#DCEEFF]" : "bg-transparent hover:bg-[#F5F8FB]"}`}
      aria-pressed={selected}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-[6px] ${selected ? "bg-[#1689E5]" : "bg-transparent text-[#9AA5AE]"}`}>
        {selected ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : <ThreeStrokeMark />}
      </span>
      <span className="truncate text-[11px] font-medium tracking-tight text-[#8A949C] sm:text-[11px]">{row.reference}</span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${state.className}`}>{state.icon}</span>
      <span className="min-w-0">
        <span className={`block truncate text-[12px] font-medium leading-5 tracking-tight sm:text-[13px] ${selected ? "text-[#17242D]" : "text-[#26343D]"}`}>{row.title}</span>
        <span className="block truncate text-[10px] leading-4 text-[#8B969E] sm:text-[10px]">{row.detail}</span>
      </span>
      <span className="hidden truncate text-right text-[11px] font-semibold text-[#56636D] sm:block">{row.value}</span>
    </button>
  );
}

export default function MarginStandardDeliverable() {
  const [view, setView] = useState<"finding" | "closeout">("finding");
  const [selected, setSelected] = useState(1);
  const rows = view === "finding" ? findingRows : closeoutRows;

  return (
    <main className="min-h-screen overflow-x-auto bg-[#E7E9EB] font-google-sans text-[#202A31]">
      <div className="mx-auto min-w-[600px] max-w-[820px] px-3 py-3 sm:px-4 sm:py-4"><section className="rounded-[8px] border border-white/80 bg-white/72 p-3 shadow-[0_1px_2px_rgba(49,62,72,0.04)] backdrop-blur-xl sm:p-4" aria-label="Amazon Financial Review actuarial control board">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2C21A] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.55)] sm:h-8 sm:w-8">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[14px] font-normal leading-tight tracking-tight text-[#1D272E] sm:text-[16px]">FR</h1>
              <p className="mt-0.5 truncate text-[10px] text-[#8A949C] sm:text-[11px]">Reconciliation control · Northstar Commerce LLC · Amazon US</p>
            </div>
          </div>
          <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#D8DDE1] bg-white px-3.5 py-2 text-[11px] font-medium text-[#29353D] shadow-[0_1px_2px_rgba(25,35,42,0.04)] transition-colors hover:bg-[#F7F9FA] sm:px-5 sm:py-2.5 sm:text-[12px]">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Add finding</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        <div className="mt-5 flex items-center justify-between gap-4 sm:mt-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#4D5B64] sm:text-[12px]">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#E9EDF0] text-[#65727B]"><Minus className="h-3.5 w-3.5" strokeWidth={2.5} /></span>
            <span>{view === "finding" ? "Audit findings" : "Closeout record"}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[#F4F6F7] p-1">
            <button type="button" onClick={() => setView("finding")} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${view === "finding" ? "bg-white text-[#26343D] shadow-sm" : "text-[#929CA3]"}`}>Open basis</button>
            <button type="button" onClick={() => setView("closeout")} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${view === "closeout" ? "bg-white text-[#26343D] shadow-sm" : "text-[#929CA3]"}`}>Reconciled</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[32px_88px_30px_minmax(0,1fr)] gap-2 px-2.5 text-[9px] font-semibold uppercase tracking-[0.02em] text-[#A0A9AF] sm:grid-cols-[42px_108px_38px_minmax(0,1fr)_140px] sm:gap-3 sm:px-3 sm:text-[10px]">
          <span aria-hidden="true" />
          <span>Reference</span>
          <span aria-hidden="true" />
          <span>Financial control item</span>
          <span className="hidden text-right sm:block">Position</span>
        </div>

        <div className="mt-2 space-y-1.5">
          {rows.map((row, index) => (
            <ControlRowView key={row.reference} row={row} index={index} selected={selected === index} onSelect={() => setSelected(index)} />
          ))}
        </div>

        <footer className="mt-4 rounded-[8px] bg-[#F4F5F6] px-3 py-2.5 sm:px-4">
          <p className="text-[10px] font-semibold tracking-tight text-[#596770] sm:text-[11px]">{view === "finding" ? "Supported exposure of $1,184.60 is stated separately from unresolved or unsubstantiated variance." : "The expected position and credited amount reconcile to a $0.00 residual variance."}</p>
        </footer>
      </section></div>
    </main>
  );
}
