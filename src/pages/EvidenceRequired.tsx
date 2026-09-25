import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type EvidenceItem = {
  kind: string;
  title: string;
  subtitle: string;
  file: string;
  confidence: string;
  detail: string;
  source: string;
};

const matchedDocuments: EvidenceItem[] = [
  {
    kind: "shipping",
    title: "shipping SHIP-2026-1847 - Southdock Fulfillment",
    subtitle: "FBA inbound shipment · 48 units · $64.75/unit · $3,108.00 total",
    file: "SHIP-2026-1847.pdf",
    confidence: "98%",
    detail: "Signed carrier handoff for shipment FBA18QZ7M4K2, including carton count, ship-from address, destination fulfillment center ONT8, and delivery timestamp.",
    source: "Carrier delivery record · FBA18QZ7M4K2",
  },
  {
    kind: "invoice",
    title: "invoice INV-2026-1847 - Meridian Components",
    subtitle: "Supplier invoice · 48 units · $64.75/unit · $3,108.00 total",
    file: "INV-2026-1847.pdf",
    confidence: "96%",
    detail: "Commercial invoice supporting unit cost, supplier identity, invoice date, SKU NS-AIR-PURIFIER-3PK, and the cost basis used for the inbound shortage review.",
    source: "Supplier document · NS-AIR-PURIFIER-3PK",
  },
  {
    kind: "po",
    title: "po PO-2026-1847 - Northstar Home",
    subtitle: "Purchase order · 48 units · SKU NS-AIR-PURIFIER-3PK · ASIN B0D4L8P1CX",
    file: "PO-2026-1847.pdf",
    confidence: "94%",
    detail: "Seller purchase order connecting the expected quantity, SKU, ASIN, marketplace, agreed unit cost, and receiving expectation to the shipment record.",
    source: "Seller procurement record · US marketplace",
  },
  {
    kind: "receiving",
    title: "receiving RECEIVE-ONT8-1847 - Amazon fulfillment",
    subtitle: "Receiving report · 42 received / 48 expected · 6-unit variance",
    file: "RECEIVE-ONT8-1847.csv",
    confidence: "99%",
    detail: "Fulfillment-center receiving event showing the six-unit delta at ONT8, with receipt timestamp, shipment identifier, and received quantity tied back to the inbound plan.",
    source: "Amazon receiving record · ONT8",
  },
];

const evidenceLog = [
  ["Receiving report", "ONT8 received 42 of 48 expected units; six-unit delta remains unresolved.", "RECEIVE-ONT8-1847.csv"],
  ["Settlement activity", "No reimbursement credit matched to the six-unit inbound shortage in settlement 205-771.", "SETTLE-205-771.csv"],
  ["Inventory ledger", "Seller ledger retains the six units at the verified $64.75 unit cost.", "LEDGER-NS-1847.csv"],
];

export default function EvidenceRequired() {
  const [toast, setToast] = useState<string | null>(null);
  const showDocument = (item: EvidenceItem) => {
    setToast(`${item.file} opened for review`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="preview-google-sans min-h-screen bg-[#FAFAF7] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-6">
      <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
        <header className="border-b border-[#E7EEF2] px-5 pb-4 pt-5 sm:px-6">
          <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Supporting evidence</p>
          <h1 className="mt-1 font-lora text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Evidentiary records for case &quot;RFD-16942-INB&quot;</h1>
          <p className="mt-2 text-[12px] leading-5 tracking-tight text-[#66737F]">Each item is supporting context for the case record. A document or event is not automatically proof of filing, payment, or closure.</p>
        </header>
        <section className="px-5 pb-5 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Matched Documents</h2><span className="text-[11px] font-medium text-[#9AA7B0]">({matchedDocuments.length})</span><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
          <div className="space-y-3">
            {matchedDocuments.map((item) => <article key={item.file} className="flex items-center gap-3 rounded-[7px] border border-[#DCE8EE] bg-[#F9FAFB] px-3 py-3 sm:px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#F0C9C9] bg-[#FFF8F8] p-1"><img src="/pdf-file-icon.webp" alt="PDF" className="h-full w-full object-contain" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold tracking-tight text-[#182026]">{item.title}</p><p className="mt-1 truncate text-[10px] tracking-tight text-[#66737F]">{item.subtitle}</p><p className="mt-1 truncate text-[10px] tracking-tight text-[#9AA7B0]">File: {item.file}</p></div>
              <div className="hidden max-w-[310px] text-[10px] leading-4 text-[#66737F] lg:block">{item.detail}</div>
              <div className="flex shrink-0 items-center gap-3"><span className="rounded-[6px] border border-[#DCE8EE] bg-white px-2 py-1 text-[10px] font-medium tracking-tight text-[#66737F]">{item.confidence}</span><button type="button" onClick={() => showDocument(item)} className="inline-flex items-center gap-2 text-[11px] font-medium tracking-tight text-[#0B74DE] hover:underline">View<ArrowRight className="h-3.5 w-3.5" /></button></div>
            </article>)}
          </div>
        </section>
        <section className="border-t border-[#E7EEF2] px-5 pb-6 pt-5 sm:px-6">
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Evidence Log</h2><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
          <div className="divide-y divide-[#E7EEF2] rounded-[7px] border border-[#DCE8EE] bg-[#FBFCFD]">
            {evidenceLog.map(([label, detail, file]) => <div key={file} className="grid gap-2 px-4 py-3 sm:grid-cols-[150px_1fr_210px] sm:items-center"><div className="flex items-center gap-2 text-[11px] font-semibold tracking-tight text-[#36404A]"><CheckCircle2 className="h-3.5 w-3.5 text-[#26704E]" />{label}</div><p className="text-[11px] leading-4 tracking-tight text-[#66737F]">{detail}</p><p className="text-[10px] tracking-tight text-[#9AA7B0] sm:text-right">{file}</p></div>)}
          </div>
        </section>
      </section>
    </div>
  </main>;
}
