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
    state: "reimbursement request",
    stateClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    subject: "FBA18QZ7M4K2 — reconciled inbound quantity variance | 6 units | $388.50",
    sender: "Margin",
    body: `Hello Amazon Selling Partner Support,\n\nWe are requesting reimbursement for a six-unit inbound quantity variance associated with shipment FBA18QZ7M4K2, received at ONT8 on 05/07/26.\n\nThe shipment plan and commercial records support 48 units of NS-AIR-PURIFIER-3PK (ASIN B0D4L8P1CX) at a unit cost of $64.75. Amazon's receiving report records 42 units. The unresolved variance is therefore 6 units, representing a supported reimbursement amount of $388.50.\n\nThe attached shipment, receiving, procurement, and cost records reconcile the shipment identity, expected quantity, received quantity, and valuation basis. Please review the evidence and apply the eligible reimbursement to the seller account.`,
    attachments: [
      { label: "BOL attached", name: "BOL-FBA18QZ7M4K2-ONT8.pdf" },
      { label: "Inventory detail", name: "FBA-Inventory-Reconciliation-ONT8.csv" },
      { label: "ASIN detail", name: "ASIN-B0D4L8P1CX-Product-Context.pdf" },
      { label: "Invoice attached", name: "Commercial-Invoice-NS-AIR-PURIFIER-3PK.pdf" },
      { label: "Purchase order", name: "Purchase-Order-NS-1847.pdf" },
      { label: "Receiving report", name: "FBA-Receiving-Report-ONT8.csv" },
    ],
  },
  {
    direction: "inbound",
    date: "05/09/26, 11:16:00",
    state: "underpaid",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Reimbursement review completed — $260.00 issued | $128.50 remains",
    sender: "Amazon Selling Partner Support",
    body: `Hello,\n\nWe reviewed the reimbursement request for shipment FBA18QZ7M4K2. Amazon has issued $260.00 against the supported $388.50 exposure. The remaining $128.50 remains unresolved.\n\nThe credit has been recorded to the seller account. To review the outstanding balance, reply with documentation that clearly identifies the shipment, product, received quantity, and unit-value basis.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: [
      { label: "Amazon response", name: "Amazon-Case-19822888381-Response.pdf" },
      { label: "Settlement detail", name: "Settlement-205-771-Partial-Reimbursement.csv" },
    ],
  },
  {
    direction: "inbound",
    date: "05/09/26, 13:08:00",
    state: "needs evidence",
    stateClass: "border-blue-500/20 bg-blue-500/10 text-blue-700",
    subject: "[Case ID: 19822888381] Additional evidence required for remaining $128.50",
    sender: "Amazon Selling Partner Support",
    body: `Hello,\n\nTo continue reviewing the remaining $128.50, please provide evidence that connects the six-unit variance and $64.75 unit value to shipment FBA18QZ7M4K2.\n\nPlease include:\n\n• The carrier-signed bill of lading or proof of delivery showing the carton count.\n• The commercial invoice or purchase order establishing the $64.75 unit cost for NS-AIR-PURIFIER-3PK.\n• The fulfillment-center receiving record or shipment reconciliation showing 42 received against 48 expected.\n• The settlement detail showing the $260.00 credit and the remaining $128.50 balance.\n\nReply to this case with the requested documents within 14 days. The case will remain open while the outstanding balance is reviewed.\n\nRegards,\nAmazon Selling Partner Support`,
    attachments: [
      { label: "Evidence request", name: "Evidence-Request-19822888381.pdf" },
      { label: "Inventory ledger", name: "Seller-Inventory-Ledger-NS-1847.csv" },
      { label: "ASIN detail", name: "ASIN-B0D4L8P1CX-Unit-Value-Basis.pdf" },
    ],
  },
];

export default function AmazonThreadReview() {
  const [toast, setToast] = useState<string | null>(null);
  const openAttachment = (name: string) => {
    setToast(`${name} is available in the evidence record`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="preview-google-sans min-h-screen overflow-x-hidden bg-[#F6F8F9] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1280px] px-1.5 py-2 sm:px-6 sm:py-6">
      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-2 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-4">
        <div className="mb-2 border-b border-[#E7EEF2] pb-2"><p className="text-[9px] font-medium tracking-tight text-[#66737F]">Amazon records</p><h1 className="mt-0.5 text-[15px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[19px]">What Amazon stated and how Margin reconciled it</h1><p className="mt-1 text-[9px] leading-3.5 text-[#66737F]">Inspect Amazon&apos;s case state, the recorded payment, the remaining variance, and Margin&apos;s evidence-backed response.</p></div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2"><img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 shrink-0 object-contain" /><h2 className="text-[13px] font-semibold tracking-tight text-[#07111A]">Amazon Thread</h2><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[9px] uppercase tracking-tight text-[#36404A]">Reconciliation status tracked</span></div>
          <p className="text-[9px] leading-3.5 text-[#6B7C88]">Thread states record Amazon communication. Margin keeps them attached to the reconciliation record; communication alone does not establish verified payment or financial closure.</p>
          <div className="space-y-1.5">{messages.map((message) => <article key={message.subject} className={`space-y-1.5 rounded-[5px] border px-2 py-2 ${message.direction === "inbound" ? "border-[#DCE8EE] bg-[#F5F8FC]" : "border-[#DCEFE3] bg-[#F4FAF6]"}`}>
            <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight"><img src="/gmailicon.png" alt="Gmail" className="h-3.5 w-3.5 shrink-0 object-contain" /><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[#36404A]">{message.direction === "inbound" ? "Inbound" : "Outbound"}</span><span className="text-[#6B7C88]">{message.date}</span><span className="rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[#36404A]">{message.state}</span></div>
            <div className="space-y-0.5"><h3 className="text-[12px] font-semibold leading-4 tracking-tight text-[#07111A]">{message.subject}</h3><p className="text-[9px] text-[#6B7C88]">From {message.sender}</p></div>
            <div className="whitespace-pre-wrap text-[12px] leading-4.5 text-[#4D5B66]">{message.body}</div>
            {message.attachments ? <div className="space-y-1.5"><div className="text-[9px] font-semibold uppercase tracking-tight text-[#6B7C88]">Attachments</div><div className="grid gap-1.5 sm:grid-cols-2">{message.attachments.map((attachment) => <button key={attachment.name} type="button" onClick={() => openAttachment(attachment.name)} className="flex min-h-8 min-w-0 items-center gap-1.5 border border-[#D8E3E8] bg-white px-2 py-1.5 text-left hover:bg-[#F8FAFB]"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4B946F] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span className="shrink-0 text-[8px] font-semibold tracking-tight text-[#4B946F]">{attachment.label}</span><span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#4D5B66]">{attachment.name}</span><ArrowRight className="h-2.5 w-2.5 shrink-0 text-[#0B74DE]" /></button>)}</div></div> : null}
          </article>)}</div>
        </div>
      </section>
    </div>
  </main>;
}
