import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

type ProgressEvent = {
  type: string;
  status: string;
  date: string;
  message: string;
  amount?: string;
  docs: string[];
};

const events: ProgressEvent[] = [
  { type: "subagent event", status: "recovery identified", date: "09/04/2026, 08:42:15 AM", message: "Inbound shipment FBA18QZ7M4K2 shows 42 units received against 48 units expected at ONT8. The six-unit variance is a supported recovery candidate.", amount: "$388.50", docs: ["ShipmentPlan-FBA18QZ7M4K2.pdf", "ReceivingReport-ONT8.csv"] },
  { type: "subagent event", status: "source records linked", date: "09/04/2026, 08:44:03 AM", message: "The shipment plan, carrier handoff, supplier invoice, purchase order, and fulfillment-center receiving report were connected to the recovery record.", amount: "$388.50", docs: ["BOL-FBA18QZ7M4K2.pdf", "Invoice-2026-1847.pdf", "PO-2026-1847.pdf"] },
  { type: "subagent event", status: "evidence verified", date: "09/04/2026, 08:47:26 AM", message: "Subagent verified the shipment identifier, SKU NS-AIR-PURIFIER-3PK, ASIN B0D4L8P1CX, 48-unit expected quantity, and $64.75 unit cost across the source records.", amount: "$388.50", docs: ["Invoice-2026-1847.pdf", "ReceivingReport-ONT8.csv"] },
  { type: "notification", status: "seller approval recorded", date: "09/04/2026, 09:12:41 AM", message: "Seller approved the supported inbound shortage filing after reviewing the evidence packet and recovery basis.", amount: "$388.50", docs: ["ApprovalRecord-RFD-16942-INB.pdf"] },
  { type: "subagent event", status: "case prepared", date: "09/04/2026, 09:18:09 AM", message: "Subagent assembled the Amazon case narrative with the receiving delta, carrier proof, commercial invoice, unit-cost basis, and requested reimbursement amount.", amount: "$388.50", docs: ["CasePacket-RFD-16942-INB.pdf", "EvidenceIndex-RFD-16942-INB.csv"] },
  { type: "notification", status: "filed with Amazon", date: "09/04/2026, 09:21:34 AM", message: "The reimbursement request was submitted to Amazon Seller Central under the FBA inventory reimbursement route. Case receipt is linked to the recovery record.", amount: "$388.50", docs: ["AmazonCase-19822888381.pdf", "SubmissionReceipt-RFD-16942-INB.pdf"] },
  { type: "notification", status: "response requires review", date: "09/05/2026, 11:16:00 AM", message: "Amazon recorded a partial reimbursement of $260.00 and requested additional evidence for the remaining supported balance.", amount: "$128.50", docs: ["AmazonResponse-19822888381.pdf", "Settlement-205-771.csv"] },
];

export default function ProgressReview() {
  const [toast, setToast] = useState<string | null>(null);
  const getDocumentIcon = (event: ProgressEvent, doc: string) => {
    if (event.status === "response requires review") return { src: "/gmailicon.png", alt: "Gmail" };
    if (doc.toLowerCase().endsWith(".csv")) return { src: "/evidence-csv-mark.png", alt: "CSV" };
    return { src: "/pdf-file-icon.webp", alt: "PDF" };
  };
  const openDoc = (doc: string) => {
    setToast(`${doc} opened from the progress record`);
    window.setTimeout(() => setToast(null), 2500);
  };
  return <main className="preview-google-sans min-h-screen bg-[#FAFAF7] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 border-b border-[#E7EEF2] pb-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">What happened</p><h1 className="mt-0.5 font-lora text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Progress review</h1><p className="mt-1 text-[11px] leading-5 text-[#66737F]">These are recorded operational events. They support the history of this recovery but do not, by themselves, establish financial closure.</p></div>
        <div className="space-y-1"><div className="text-[12px] font-medium tracking-tight text-[#182026]">Reconstructed history from notifications and subagent events</div><div className="text-[11px] font-medium text-[#0B74DE]">Progress record reconstructed from the connected recovery activity.</div><div className="text-[10px] font-medium text-[#4B5563]">Last refreshed: 09/05/2026, 11:18:22 AM</div></div>
        <div className="mt-5 space-y-2">{events.map((event) => <article key={`${event.date}-${event.status}`} className="flex flex-col gap-1 border-l-2 border-[#DCE8EE] py-2 pl-4 text-[12px] transition-colors hover:border-[#66737F]"><div className="font-medium tracking-tight text-[#182026]">{event.type} · {event.status}</div><div className="text-[11px] font-medium tabular-nums text-[#66737F]">{event.date}</div><div className="leading-5 text-[#4D5B66]">{event.message}</div>{event.amount ? <div className="font-medium tabular-nums text-[#0B74DE]">Amount: {event.amount}</div> : null}<div className="mt-1 flex flex-wrap items-center gap-2 text-[#4B5563]"><span className="text-[11px] font-medium tracking-tight text-[#66737F]">Docs</span>{event.docs.map((doc) => <button type="button" key={doc} onClick={() => openDoc(doc)} className="inline-flex items-center gap-1 text-[#0052FF] underline transition-colors hover:text-[#003DB8]">{(() => { const icon = getDocumentIcon(event, doc); return <><img src={icon.src} alt={icon.alt} className="h-3.5 w-3.5 object-contain" />{doc}</>; })()}<ArrowRight className="h-3 w-3 no-underline" /></button>)}</div></article>)}</div>
      </section>
    </div>
  </main>;
}
