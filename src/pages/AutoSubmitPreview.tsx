import React, { useState } from "react";
import { Check } from "lucide-react";

type CaseStatus = "ready" | "submitted" | "approved";

type AutoSubmitCase = {
  reference: string;
  status: CaseStatus;
  statusLabel: string;
  title: string;
  event: string;
  basis: string;
  control: string;
  amount: string;
  date: string;
  docs: string[];
};

const cases: AutoSubmitCase[] = [
  {
    reference: "REC-014",
    status: "ready",
    statusLabel: "Ready to submit",
    title: "Inbound receiving variance",
    event: "Shipment FBA17-ONT8-260114 · SKU NCS-48OZ-BLK · ONT8",
    basis: "60 units dispatched; 46 units received. Supported exposure calculated at $1,184.60 using the verified unit-cost basis.",
    control: "Evidence packet complete · policy window open · Auto Submit eligible",
    amount: "$1,184.60",
    date: "Today · 08:42",
    docs: ["ShipmentPlan-FBA17-ONT8-260114.pdf", "ReceivingReport-ONT8.csv", "Invoice-NCS-2026-114.pdf"],
  },
  {
    reference: "REC-013",
    status: "submitted",
    statusLabel: "Submitted",
    title: "FBA fee overcharge correction",
    event: "Settlement 205-771 · fee event 8F-441 · Amazon US",
    basis: "Charged fee basis exceeded the applicable fee schedule for the fulfilled unit class. Reimbursement request filed for $388.50.",
    control: "Case packet accepted by Amazon · receipt linked · response monitoring active",
    amount: "$388.50",
    date: "30 Sep · 14:18",
    docs: ["CasePacket-NTH-FBA-2601-0047.pdf", "FeeBasis-8F-441.pdf", "SubmissionReceipt.pdf"],
  },
  {
    reference: "REC-012",
    status: "approved",
    statusLabel: "Approved",
    title: "Inventory adjustment reimbursement",
    event: "Adjustment 19822888381 · SKU NCS-48OZ-BLK · Amazon US",
    basis: "Amazon approved the supported inventory adjustment and credited $742.00 against the established recovery record.",
    control: "Approval recorded · settlement credit identified · payout reconciliation pending",
    amount: "$742.00",
    date: "29 Sep · 11:06",
    docs: ["AmazonResponse-19822888381.pdf", "ApprovalRecord-REC-012.pdf", "Settlement-205-771.csv"],
  },
];

const statusStyles: Record<CaseStatus, { dot: string; text: string; badge: string }> = {
  ready: { dot: "bg-[#1689E5]", text: "text-[#0B74DE]", badge: "bg-[#EAF4FC]" },
  submitted: { dot: "bg-[#F39A45]", text: "text-[#B96515]", badge: "bg-[#FFF3E6]" },
  approved: { dot: "bg-[#35C56B]", text: "text-[#23834A]", badge: "bg-[#EAF8F0]" },
};

function EvidenceIcon({ file }: { file: string }) {
  const isCsv = file.toLowerCase().endsWith(".csv");
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-white shadow-[0_1px_2px_rgba(32,42,49,0.1)]">
      <img src={isCsv ? "/evidence-csv-mark.png" : "/pdf-file-icon.webp"} alt={isCsv ? "CSV evidence" : "PDF evidence"} className="h-4 w-4 object-contain" />
    </span>
  );
}

function CaseTimelineRow({ item }: { item: AutoSubmitCase }) {
  const tone = statusStyles[item.status];
  return (
    <article className="relative pl-6 sm:pl-7">
      <span className={`absolute left-[-5px] top-4 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[#F4F6F7] ${tone.dot}`} aria-label={`${item.statusLabel} recorded`}>
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
      </span>
      <div className="rounded-[7px] bg-white/52 px-3 py-2.5 shadow-[0_10px_24px_rgba(56,74,82,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-lg sm:px-3.5 sm:py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-semibold tracking-tight text-[#8A949C] sm:text-[10px]">{item.reference}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${tone.badge} ${tone.text}`}>{item.statusLabel}</span>
            </div>
            <h3 className="mt-1 text-[11px] font-semibold leading-4 tracking-tight text-[#1D272E] sm:text-[12px]">{item.title}</h3>
            <p className="mt-0.5 text-[9px] leading-4 text-[#56646D] sm:text-[10px]">{item.event}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold tracking-tight text-[#26343D] sm:text-[12px]">{item.amount}</p>
            <p className="mt-0.5 text-[8px] text-[#97A1A8] sm:text-[9px]">{item.date}</p>
          </div>
        </div>
        <div className="mt-2 space-y-1 pt-2 text-[9px] leading-4 sm:text-[10px] sm:leading-5">
          <p><span className="font-semibold text-[#56646D]">Financial basis:</span> <span className="text-[#71808A]">{item.basis}</span></p>
          <p><span className="font-semibold text-[#56646D]">Control state:</span> <span className="text-[#71808A]">{item.control}</span></p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
          {item.docs.map((file) => (
            <span key={file} className="flex min-w-0 items-center gap-1 text-[8px] text-[#6B7881] sm:text-[9px]">
              <EvidenceIcon file={file} />
              <span className="max-w-[170px] truncate">{file}</span>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function AutoSubmitPreview() {
  const [enabled, setEnabled] = useState(true);

  return (
    <main className="min-h-screen overflow-x-auto bg-[#F4F6F7] font-google-sans text-[#202A31]">
      <div className="mx-auto min-w-[520px] max-w-[820px] px-2 py-2 sm:min-w-0 sm:px-4 sm:py-4">
        <section className="rounded-[8px] bg-white/42 p-2.5 shadow-[0_18px_42px_rgba(56,74,82,0.08),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl sm:p-4" aria-label="Auto Submit control and case queue for Northstar Commerce LLC">
          <header className="flex items-center gap-2 pb-2.5 sm:gap-2.5 sm:pb-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2C21A] text-white sm:h-6 sm:w-6"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
            <h1 className="truncate text-[10px] font-medium leading-tight tracking-tight text-[#1D272E] sm:text-[12px]">Reconciliation control · Northstar Commerce LLC · Amazon US</h1>
          </header>

          <div className="grid items-start gap-4 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-5 sm:py-5">
            <aside className="pb-4 sm:pb-0 sm:pr-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.02em] text-[#7B8790] sm:text-[10px]">Submission control</p>
              <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled((current) => !current)} className={`mt-3 flex items-center gap-2 rounded-full px-1.5 py-1.5 pr-2.5 transition-colors ${enabled ? "bg-[#1689E5]" : "bg-[#9AA8B2]"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(28,47,59,0.2)] transition-transform ${enabled ? "translate-x-0" : "translate-x-[18px]"}`}><Check className={`h-3 w-3 ${enabled ? "text-[#1689E5]" : "text-[#9AA8B2]"}`} strokeWidth={3} /></span>
                <span className="min-w-[52px] text-left text-[10px] font-semibold text-white">{enabled ? "Auto Submit" : "Paused"}</span>
              </button>
              <p className="mt-3 max-w-[135px] text-[9px] leading-4 text-[#56646D] sm:text-[10px] sm:leading-5">{enabled ? "Qualified cases file automatically after evidence and confidence controls pass." : "Cases remain in review until you approve submission."}</p>
              <p className="mt-3 text-[9px] leading-4 text-[#8A959C]">Exceptions stay held.</p>
            </aside>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[12px] font-semibold tracking-tight text-[#26343D] sm:text-[13px]">Auto Submit queue</p><p className="mt-0.5 text-[9px] text-[#7B8790] sm:text-[10px]">Three controlled recovery states</p></div><span className="rounded-full bg-[#F1F4F5] px-2 py-1 text-[8px] font-semibold text-[#6B7881]">1 tab</span></div>
              <div className="relative space-y-2.5 border-l border-[#C8D0D5] py-0.5">{cases.map((item) => <CaseTimelineRow key={item.reference} item={item} />)}</div>
            </div>
          </div>

          <footer className="pt-2.5 text-[9px] leading-4 text-[#7B8790] sm:text-[10px] sm:leading-5"><span className="font-semibold text-[#596770]">Control state:</span>{" "}{enabled ? "pre-authorized submission · evidence threshold enforced · exceptions retained for review" : "manual submission path · seller approval required before filing"}</footer>
        </section>
      </div>
    </main>
  );
}
