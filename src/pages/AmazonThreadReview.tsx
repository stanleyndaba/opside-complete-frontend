import React, { useState } from "react";
import { ArrowRight, FileText } from "lucide-react";

type ThreadMessage = {
  direction: "inbound" | "outbound";
  date: string;
  state: string;
  stateClass: string;
  subject: string;
  sender: string;
  body: string;
  attachments?: string[];
};

const messages: ThreadMessage[] = [
  {
    direction: "outbound",
    date: "05/09/26, 10:42:00",
    state: "reimbursement request",
    stateClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    subject: "FBA18QZ7M4K2 reimbursement request - inbound quantity variance",
    sender: "Margin",
    body: `Hello Amazon Selling Partner Support,\n\nWe are requesting reimbursement for an inbound quantity variance associated with shipment FBA18QZ7M4K2, received at ONT8 on 05/07/26.\n\nThe shipment plan expected 48 units of NS-AIR-PURIFIER-3PK (ASIN B0D4L8P1CX). Amazon's receiving report records 42 units, leaving a six-unit shortage.\n\nThe supported unit cost is $64.75, for a requested reimbursement of $388.50. The attached bill of lading, supplier invoice, purchase order, and receiving report reconcile the shipment identity, expected quantity, and unit cost.\n\nPlease review the attached records and apply the eligible reimbursement to the seller account.`,
    attachments: ["SHIP-2026-1847.pdf", "INV-2026-1847.pdf", "PO-2026-1847.pdf", "RECEIVE-ONT8-1847.csv"],
  },
  {
    direction: "inbound",
    date: "05/09/26, 11:16:00",
    state: "underpaid",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Reimbursement review completed - partial amount issued",
    sender: "Amazon Selling Partner Support",
    body: `Hello,\n\nWe reviewed the reimbursement request for shipment FBA18QZ7M4K2. Our review confirms an eligible reimbursement of $519.10 for the shipment discrepancy.\n\nThe reimbursement has been recorded to the seller account. The amount issued reflects the quantity and valuation available in the fulfillment-center receiving record.\n\nIf you believe additional units or a different cost basis should be considered, reply to this case with documentation that clearly identifies the shipment, product, received quantity, and unit value.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: ["CASE-19822888381-response.pdf"],
  },
  {
    direction: "inbound",
    date: "05/09/26, 13:08:00",
    state: "needs evidence",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Additional evidence required for reimbursement review",
    sender: "Amazon Selling Partner Support",
    body: `Hello,\n\nTo continue reviewing the remaining reimbursement amount, please provide evidence that connects the claimed quantity and unit value to shipment FBA18QZ7M4K2.\n\nPlease include:\n\n• The carrier-signed bill of lading or proof of delivery showing the carton count.\n• The commercial invoice or purchase order showing the product cost for NS-AIR-PURIFIER-3PK.\n• The fulfillment-center receiving record or shipment reconciliation showing the six-unit variance.\n• Any prior reimbursement or settlement detail for this shipment.\n\nReply to this case with the requested documents within 14 days. The case will remain open while the evidence is reviewed.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: ["EVIDENCE-REQUEST-19822888381.pdf"],
  },
];

export default function AmazonThreadReview() {
  const [toast, setToast] = useState<string | null>(null);
  const openAttachment = (name: string) => {
    setToast(`${name} is available in the evidence record`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 border-b border-[#E7EEF2] pb-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">Amazon record</p><h1 className="mt-0.5 font-lora text-[23px] font-normal tracking-tight text-[#182026] sm:text-[27px]">What Amazon said and what Margin sent</h1><p className="mt-1 text-[11px] leading-5 text-[#66737F]">Inspect Amazon&apos;s case state, messages, attachments, and the evidence-backed reply from this recovery record.</p></div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-semibold tracking-tight text-[#07111A]">Amazon Thread</h2><span className="rounded-full border border-[#D8E3E8] bg-[#F8FAFB] px-2.5 py-1 text-[10px] uppercase tracking-tight text-[#4D5B66]">Reimbursement recorded in thread</span></div>
          <p className="text-[11px] leading-5 text-[#6B7C88]">Thread states describe Amazon communication records. They do not, by themselves, establish verified payment or financial closure.</p>
          <div className="space-y-3">{messages.map((message) => <article key={message.subject} className={`space-y-3 border px-4 py-4 ${message.direction === "inbound" ? "border-blue-500/20 bg-blue-500/[0.05]" : "border-emerald-500/20 bg-emerald-500/[0.05]"}`}>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-tight"><span className={`rounded-full border px-2.5 py-1 ${message.direction === "inbound" ? "border-blue-500/20 bg-blue-500/10 text-blue-700" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"}`}>{message.direction === "inbound" ? "Inbound" : "Outbound"}</span><span className="text-[#6B7C88]">{message.date}</span><span className={`rounded-full border px-2.5 py-1 ${message.stateClass}`}>{message.state}</span></div>
            <div className="space-y-1"><h3 className="text-sm font-semibold tracking-tight text-[#07111A]">{message.subject}</h3><p className="text-[11px] text-[#6B7C88]">{message.direction === "inbound" ? `From ${message.sender}` : `From ${message.sender}`}</p></div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4D5B66]">{message.body}</div>
            {message.attachments ? <div className="space-y-2"><div className="text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Attachments</div><div className="flex flex-wrap gap-2">{message.attachments.map((attachment) => <button key={attachment} type="button" onClick={() => openAttachment(attachment)} className="inline-flex h-7 items-center gap-1.5 border border-[#D8E3E8] bg-white px-2 text-[10px] font-semibold text-[#4D5B66] hover:bg-[#F8FAFB]"><FileText className="h-3 w-3 text-[#D64B4B]" />{attachment}<ArrowRight className="h-3 w-3 text-[#0B74DE]" /></button>)}</div></div> : null}
          </article>)}</div>
        </div>
      </section>
    </div>
  </main>;
}
