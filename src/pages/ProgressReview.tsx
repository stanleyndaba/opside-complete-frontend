import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type ProgressEvent = {
  type: string;
  status: string;
  date: string;
  message: string;
  amount?: string;
  docs: string[];
};

const events: ProgressEvent[] = [
  { type: "Margin analysis", status: "variance identified", date: "09/04/2026, 08:42:15 AM", message: "Inbound shipment FBA18QZ7M4K2 shows 42 units received against 48 expected at ONT8. The six-unit variance represents a supported exposure of $388.50.", amount: "$388.50", docs: ["ShipmentPlan-FBA18QZ7M4K2.pdf", "ReceivingReport-ONT8.csv"] },
  { type: "Margin analysis", status: "source records linked", date: "09/04/2026, 08:44:03 AM", message: "The shipment plan, carrier handoff, supplier invoice, purchase order, and fulfillment-center receiving report were linked to one reconciled recovery record.", amount: "$388.50", docs: ["BOL-FBA18QZ7M4K2.pdf", "Invoice-2026-1847.pdf", "PO-2026-1847.pdf"] },
  { type: "Margin analysis", status: "evidence verified", date: "09/04/2026, 08:47:26 AM", message: "Margin verified the shipment identifier, SKU NS-AIR-PURIFIER-3PK, ASIN B0D4L8P1CX, 48-unit expected quantity, and $64.75 unit cost across the source records.", amount: "$388.50", docs: ["Invoice-2026-1847.pdf", "ReceivingReport-ONT8.csv"] },
  { type: "operator decision", status: "seller approval recorded", date: "09/04/2026, 09:12:41 AM", message: "The operator approved the inbound shortage filing after reviewing the evidence packet, valuation basis, and supported amount.", amount: "$388.50", docs: ["ApprovalRecord-NTH-FBA-2601-0047.pdf"] },
  { type: "Margin analysis", status: "case prepared", date: "09/04/2026, 09:18:09 AM", message: "Margin assembled the case narrative with the receiving delta, carrier proof, commercial invoice, unit-cost basis, and requested reimbursement amount.", amount: "$388.50", docs: ["CasePacket-NTH-FBA-2601-0047.pdf", "EvidenceIndex-NTH-FBA-2601-0047.csv"] },
  { type: "notification", status: "filed with Amazon", date: "09/04/2026, 09:21:34 AM", message: "The reimbursement request was submitted to Amazon Seller Central under the FBA inventory reimbursement route. The case receipt is linked to the recovery record.", amount: "$388.50", docs: ["AmazonCase-19822888381.pdf", "SubmissionReceipt-NTH-FBA-2601-0047.pdf"] },
  { type: "notification", status: "response requires review", date: "09/05/2026, 11:16:00 AM", message: "Amazon recorded a $260.00 reimbursement against the supported $388.50 exposure. The remaining $128.50 requires review and additional evidence.", amount: "$128.50", docs: ["AmazonResponse-19822888381.pdf", "Settlement-205-771.csv"] },
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
  return <main className="preview-google-sans min-h-screen overflow-x-auto bg-[#FAFAF7] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto min-w-[760px] max-w-[1280px] px-4 py-4 sm:min-w-0 sm:px-6 sm:py-6">
      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 pb-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">What happened</p><h1 className="mt-0.5 font-google-sans text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Progress review</h1><p className="mt-1 text-[11px] leading-5 text-[#66737F]">This is the controlled financial history of the recovery. Recorded events show progression; payout reconciliation establishes closure.</p></div>
        <div className="space-y-1"><div className="text-[12px] font-medium tracking-tight text-[#182026]">Recovery history reconstructed from connected financial and operational records</div><div className="text-[11px] font-medium text-[#0B74DE]">The recovery position is tracked from variance identification through approval, filing, and payout review.</div><div className="text-[10px] font-medium text-[#4B5563]">Last refreshed: 09/05/2026, 11:18:22 AM</div></div>
        <div className="mt-5">
          {events.map((event, index) => <article key={`${event.date}-${event.status}`} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4 py-4 text-[12px] sm:grid-cols-[26px_minmax(0,1fr)]">
            {index < events.length - 1 ? <span className="absolute bottom-[-1px] left-[11px] top-[54px] w-px bg-[#C9D6DE] sm:left-[12px]" aria-hidden="true" /> : null}
            <span className="relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8067]" aria-label="Recorded event"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span>
            <div className="min-w-0"><p className="font-medium tracking-tight text-[#182026]">{event.type} · {event.status}</p><p className="mt-1 leading-5 text-[#4D5B66]">{event.message}</p><time className="mt-2 block text-[10px] font-medium tabular-nums tracking-tight text-[#66737F]">{event.date}</time>{event.amount ? <p className="mt-1 font-medium tabular-nums text-[#0B74DE]">Supported amount: {event.amount}</p> : null}<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#4B5563]"><span className="text-[11px] font-medium tracking-tight text-[#66737F]">Docs</span>{event.docs.map((doc) => <button type="button" key={doc} onClick={() => openDoc(doc)} className="inline-flex items-center gap-1 text-[11px] font-medium tracking-tight text-[#36404A] transition-colors hover:text-[#0B74DE]">{(() => { const icon = getDocumentIcon(event, doc); return <><img src={icon.src} alt={icon.alt} className="h-4 w-4 object-contain" />{doc}</>; })()}<ArrowRight className="h-3 w-3" /></button>)}</div></div>
          </article>)}
        </div>
      </section>
    </div>
  </main>;
}
