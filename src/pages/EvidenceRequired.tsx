import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type EvidenceItem = {
  kind: string;
  title: string;
  subtitle: string;
  file: string;
  confidence: string;
  detail: string;
  source: string;
  connection: string;
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
    connection: "The shipment record establishes the inbound event and the quantity Amazon was contractually expected to receive.",
  },
  {
    kind: "invoice",
    title: "invoice INV-2026-1847 - Meridian Components",
    subtitle: "Supplier invoice · 48 units · $64.75/unit · $3,108.00 total",
    file: "INV-2026-1847.pdf",
    confidence: "96%",
    detail: "Commercial invoice supporting unit cost, supplier identity, invoice date, SKU NS-AIR-PURIFIER-3PK, and the cost basis used for the inbound shortage review.",
    source: "Supplier document · NS-AIR-PURIFIER-3PK",
    connection: "The supplier invoice establishes the $64.75 unit-cost basis used to translate the quantity variance into a supported $388.50 exposure.",
  },
  {
    kind: "po",
    title: "po PO-2026-1847 - Northstar Home",
    subtitle: "Purchase order · 48 units · SKU NS-AIR-PURIFIER-3PK · ASIN B0D4L8P1CX",
    file: "PO-2026-1847.pdf",
    confidence: "94%",
    detail: "Seller purchase order connecting the expected quantity, SKU, ASIN, marketplace, agreed unit cost, and receiving expectation to the shipment record.",
    source: "Seller procurement record · US marketplace",
    connection: "The purchase order ties the seller's expected inventory, SKU, ASIN, and commercial terms to the same shipment under review.",
  },
  {
    kind: "receiving",
    title: "receiving RECEIVE-ONT8-1847 - Amazon fulfillment",
    subtitle: "Receiving report · 42 received / 48 expected · 6-unit variance",
    file: "RECEIVE-ONT8-1847.csv",
    confidence: "99%",
    detail: "Fulfillment-center receiving event showing the six-unit delta at ONT8, with receipt timestamp, shipment identifier, and received quantity tied back to the inbound plan.",
    source: "Amazon receiving record · ONT8",
    connection: "The receiving event supplies the six-unit difference that connects the inbound plan to the unresolved financial outcome: 48 expected, 42 received, $388.50 supported exposure.",
  },
];

const evidenceLog = [
  { time: "09:18:42", label: "Receiving report", detail: "ONT8 received 42 of 48 expected units; six-unit variance remains unresolved.", file: "RECEIVE-ONT8-1847.csv" },
  { time: "09:19:06", label: "Settlement activity", detail: "No reimbursement credit matched to the six-unit inbound shortage in settlement SETTLE-2026-01-AC7.", file: "SETTLE-205-771.csv" },
  { time: "09:19:31", label: "Inventory ledger", detail: "Seller ledger retains the six-unit variance at the verified $64.75 unit cost; supported exposure is $388.50.", file: "LEDGER-NS-1847.csv" },
];

export default function EvidenceRequired() {
  const [toast, setToast] = useState<string | null>(null);
  const showDocument = (item: EvidenceItem) => {
    setToast(`${item.file} opened for review`);
    window.setTimeout(() => setToast(null), 2600);
  };
  return <main className="preview-google-sans min-h-screen overflow-x-auto bg-[#FAFAF7] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto min-w-[620px] max-w-[1280px] px-4 py-4 sm:min-w-0 sm:px-6 sm:py-6">
      <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
        <header className="border-b border-[#E7EEF2] px-5 pb-4 pt-5 sm:px-6">
          <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Supporting evidence</p>
          <h1 className="mt-1 font-google-sans text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Evidence supporting recovery basis &quot;NTH-FBA-2601-0047&quot;</h1>
          <p className="mt-2 text-[12px] leading-5 tracking-tight text-[#66737F]">Each record establishes a relationship in the financial story. Together, they reconcile the event; no single document is treated as proof of payment or closure.</p>
        </header>
        <section className="px-5 pb-5 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Matched evidence</h2><span className="text-[11px] font-medium text-[#9AA7B0]">({matchedDocuments.length})</span><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
          <div className="relative">
            {matchedDocuments.map((item, index) => <article key={item.file} className="relative pl-5 sm:pl-6">
              <div className="absolute bottom-0 left-[1px] top-0 w-px bg-[#C9D6DE]" aria-hidden="true" />
              <span className="absolute left-0 top-[22px] z-10 h-[2px] w-[2px] rounded-full bg-[#0B74DE] ring-2 ring-white" aria-hidden="true" />
              {index === matchedDocuments.length - 1 ? <span className="absolute bottom-0 left-[-3px] h-1 w-2 bg-white" aria-hidden="true" /> : null}
              <p className="pb-2 pt-1 text-[10px] leading-4 tracking-tight text-[#66737F]">{item.connection}</p>
              <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <img src={item.file.endsWith('.csv') ? '/evidence-csv-mark.png' : '/pdf-file-icon.webp'} alt={item.file.endsWith('.csv') ? 'CSV' : 'PDF'} className="h-6 w-6 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-3"><p className="min-w-0 truncate text-[11px] font-semibold tracking-tight text-[#36404A]">{item.file}</p><span className="shrink-0 text-[11px] font-semibold tracking-tight text-[#4D5B66]">{item.confidence}</span><button type="button" onClick={() => showDocument(item)} className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-tight text-[#36404A] hover:text-[#0B74DE]">Open<ArrowRight className="h-3.5 w-3.5" /></button></div><p className="mt-0.5 truncate text-[10px] tracking-tight text-[#66737F]">{item.title}</p></div>
                </div>
              </div>
            </article>)}
          </div>
        </section>
        <section className="border-t border-[#E7EEF2] px-5 pb-6 pt-5 sm:px-6">
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Financial evidence log</h2><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
          <div className="space-y-3">
            {evidenceLog.map((entry, index) => <div key={entry.file} className="relative grid grid-cols-[58px_24px_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[70px_26px_minmax(0,1fr)] sm:gap-4 sm:px-4">
              {index < evidenceLog.length - 1 ? <span className="absolute bottom-[-14px] left-[68px] hidden h-3 w-px bg-[#C9D6DE] sm:block" aria-hidden="true" /> : null}
              <time className="pt-1 font-mono text-[10px] tracking-tight text-[#7B8991]">{entry.time}</time>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8067]" aria-label="Recorded check"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span>
              <div className="min-w-0"><p className="text-[11px] font-semibold tracking-tight text-[#36404A]">{entry.label}</p><p className="mt-1 text-[11px] leading-4 tracking-tight text-[#66737F]">{entry.detail}</p><p className="mt-1 truncate text-[10px] tracking-tight text-[#9AA7B0]">{entry.file}</p></div>
            </div>)}
          </div>
        </section>
      </section>
    </div>
  </main>;
}
