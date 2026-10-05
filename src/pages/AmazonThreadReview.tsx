import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type ThreadMessage = {
  direction: "inbound" | "outbound";
  date: string;
  state: string;
  stateClass: string;
  subject: string;
  sender: string;
  body: string;
  attachments?: Array<{ name: string; label: string }>;
};

const messages: ThreadMessage[] = [
  {
    direction: "outbound",
    date: "05/09/26, 10:42:00",
    state: "controlled submission · approved scope",
    stateClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    subject: "EVT-FBA-2026-0001847 — controlled reimbursement submission | $38,850",
    sender: "Margin · action owner",
    body: `Hello Amazon Selling Partner Support,\n\nMargin is requesting reimbursement for the supported 600-unit inbound quantity variance associated with shipment FBA18QZ7M4K2, received at ONT8 on 05/07/26.\n\nThe governed event record establishes 4,800 units expected and 4,200 units received for NS-AIR-PURIFIER-3PK (ASIN B0D4L8P1CX). The valuation basis is $64.75 per unit, producing supported exposure of 600 × $64.75 = $38,850.\n\nThe attached shipment, carrier, procurement, receiving, inventory, and clearing records resolve to EVT-FBA-2026-0001847. The request is limited to the supported exposure; no unsupported or duplicate amount is included. Please review the evidence and apply any eligible reimbursement to merchant account NTH-US-01.`,
    attachments: [
      { label: "Event index", name: "EvidenceIndex-EVT-FBA-2026-0001847.csv" },
      { label: "API snapshot", name: "ShipmentPlan-FBA18QZ7M4K2.json" },
      { label: "Delivery proof", name: "POD-FBA18QZ7M4K2.pdf" },
      { label: "Receiving record", name: "RECEIVE-ONT8-1847.csv" },
      { label: "Valuation basis", name: "PO-2026-1847.xlsx" },
      { label: "Clearing test", name: "SETTLE-2026-Q1.csv" },
    ],
  },
  {
    direction: "inbound",
    date: "05/09/26, 11:16:00",
    state: "Amazon decision · partial approval",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Partial approval issued — $26,000 | $12,850 residual",
    sender: "Amazon Selling Partner Support · administrative decision",
    body: `Hello,\n\nWe reviewed the reimbursement request for shipment FBA18QZ7M4K2. Amazon has approved and issued $26,000 against the supported $38,850 exposure. The remaining $12,850 remains unresolved.\n\nMargin interpretation: this is a partial approval, not financial closure. The approved amount is still subject to settlement verification, and the residual remains open for targeted evidence review.\n\nThe credit has been recorded to the seller account. To review the outstanding balance, reply with documentation that clearly identifies the shipment, product, received quantity, and unit-value basis.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: [
      { label: "Amazon response", name: "AmazonResponse-19822888381.html" },
      { label: "Case record", name: "AmazonCase-19822888381.pdf" },
      { label: "Settlement detail", name: "Settlement-205-771-Partial-Reimbursement.csv" },
      { label: "Outcome class", name: "ResponseClassification-Partial.json" },
    ],
  },
  {
    direction: "inbound",
    date: "05/09/26, 13:08:00",
    state: "evidence request · residual position only",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Additional evidence required for residual $12,850",
    sender: "Amazon Selling Partner Support · evidence request",
    body: `Hello,\n\nTo continue reviewing the remaining $12,850, please provide evidence that connects the 600-unit variance and $64.75 unit value to shipment FBA18QZ7M4K2.\n\nMargin interpretation: this request applies only to the residual position. The accepted evidence and $26,000 portion remain attached to the original event record; the investigation does not restart. Margin will map the requested items to the existing evidence population and isolate any actual gap before responding.\n\nPlease include the carrier delivery record, commercial valuation basis, fulfillment-center receiving record, and settlement detail showing the credit and residual balance. Reply within 14 days.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: [
      { label: "Evidence request", name: "Evidence-Request-19822888381.pdf" },
      { label: "Requested source map", name: "ResidualEvidenceMap-EVT-FBA-2026-0001847.csv" },
      { label: "Inventory ledger", name: "FBA-InventoryMovement-Q1.csv" },
      { label: "Unit-value basis", name: "INV-2026-1847.pdf" },
    ],
  },
  {
    direction: "outbound",
    date: "05/09/26, 13:24:17",
    state: "targeted residual response · approval required",
    stateClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    subject: "[Case ID: 19822888381] Residual evidence response prepared | $12,850",
    sender: "Margin · evidence response owner",
    body: `Margin mapped Amazon's request to the existing governed event record rather than resubmitting the full case.\n\nResponse scope: residual $12,850 only. The shipment plan, carrier delivery record, receiving result, procurement basis, inventory movement, settlement population, and $26,000 credit match are re-indexed to the case.\n\nCurrent financial position:\nSupported exposure: $38,850\nAmazon approved: $26,000\nSettlement verification: pending\nResidual exposure: $12,850\nReversal detected: No\nNext controlled action: seller approval for targeted residual response\nClose state: open until response and settlement are reconciled\n\nAccepted evidence and settled value remain attached; the residual position is the only scope still requiring action.`,
    attachments: [
      { label: "Residual packet", name: "ResidualEvidenceResponse-19822888381.pdf" },
      { label: "Response index", name: "EvidenceIndex-Residual-128-50.csv" },
      { label: "Approval gate", name: "ApprovalRecord-Residual-128-50.pdf" },
      { label: "Submission draft", name: "AmazonResponseDraft-19822888381.html" },
    ],
  },
];

export default function AmazonThreadReview() {
  const [toast, setToast] = useState<string | null>(null);
  const openAttachment = (name: string) => {
    setToast(`${name} is available in the governed evidence record`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="preview-google-sans min-h-screen overflow-x-hidden bg-[#F6F8F9] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1280px] px-1.5 py-2 sm:px-6 sm:py-6">
      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-2 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-4">
        <div className="mb-2 border-b border-[#E7EEF2] pb-2"><p className="text-[9px] font-medium tracking-tight text-[#66737F]">Governed Amazon response record · Illustrative control record</p><h1 className="mt-0.5 text-[15px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[19px]">What Amazon changed in the financial position</h1><p className="mt-1 text-[9px] leading-3.5 text-[#66737F]">EVT-FBA-2026-0001847 · Northstar Commerce LLC · Legal entity NTH-US-01 · Amazon US · FBA · Case 19822888381 · Source run NTH-US-Q1-2026-0904. Amazon correspondence is linked to the governed event record; communication alone does not establish approval, settlement, or financial closure.</p></div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2"><img src="/gmailicon.png" alt="Amazon thread" className="h-4 w-4 shrink-0 object-contain" /><h2 className="text-[13px] font-semibold tracking-tight text-[#07111A]">Amazon Thread</h2><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[9px] uppercase tracking-tight text-[#36404A]">Partial approval · residual position open</span></div>
          <p className="text-[9px] leading-3.5 text-[#6B7C88]">Q1 2026 recovery control population: 1,842 positions reviewed · $2.84M supported exposure · 126 residual positions under watch.</p>
          <p className="text-[9px] leading-3.5 text-[#6B7C88]">Current position · Supported exposure $38,850 · Amazon approved $26,000 · Settlement state pending verification · Residual position $12,850 · Response deadline 14 days · Action owner Margin · Close state open.</p>
          <div className="space-y-1.5">{messages.map((message) => <article key={message.subject} className={`space-y-1.5 rounded-[5px] border px-2 py-2 ${message.direction === "inbound" ? "border-[#DCE8EE] bg-[#F5F8FC]" : "border-[#DCEFE3] bg-[#F4FAF6]"}`}>
            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight"><img src="/gmailicon.png" alt="Amazon correspondence" className="h-3.5 w-3.5 shrink-0 object-contain" /><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[#36404A]">{message.direction === "inbound" ? "Inbound" : "Outbound"}</span><span className="text-[#6B7C88]">{message.date}</span><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[#36404A]">{message.state}</span></div>
            <div className="space-y-0.5"><h3 className="text-[12px] font-semibold leading-4 tracking-tight text-[#07111A]">{message.subject}</h3><p className="text-[9px] text-[#6B7C88]">From {message.sender}</p></div>
            <div className="whitespace-pre-wrap text-[12px] leading-4.5 text-[#4D5B66]">{message.body}</div>
            {message.attachments ? <div className="space-y-1.5"><div className="text-[9px] font-semibold uppercase tracking-tight text-[#6B7C88]">Attachments</div><div className="grid gap-1.5 sm:grid-cols-2">{message.attachments.map((attachment) => <button key={attachment.name} type="button" onClick={() => openAttachment(attachment.name)} className="flex min-h-8 min-w-0 items-center gap-1.5 border border-[#D8E3E8] bg-white px-2 py-1.5 text-left hover:bg-[#F8FAFB]"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4B946F] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span className="shrink-0 text-[8px] font-semibold tracking-tight text-[#4B946F]">{attachment.label}</span><span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#4D5B66]">{attachment.name}</span><ArrowRight className="h-2.5 w-2.5 shrink-0 text-[#0B74DE]" /></button>)}</div></div> : null}
          </article>)}</div>
        </div>
      </section>
    </div>
  </main>;
}
