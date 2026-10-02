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
    title: "observed delivery · SHIP-2026-1847 · Southdock Fulfillment",
    subtitle: "Role: observed delivery · Amazon US · FBA · 48 expected units · USD",
    file: "SHIP-2026-1847.pdf",
    confidence: "0.98",
    detail: "Signed carrier handoff for shipment FBA18QZ7M4K2, including carton count, ship-from address, destination fulfillment center ONT8, delivery timestamp, and the source period used in the review.",
    source: "Source: carrier repository · shipment FBA18QZ7M4K2 · parsed · matched to ONT8 receiving event",
    connection: "Role: observed delivery. Establishes the inbound event, delivery timing, and quantity Amazon was expected to receive. Identity match: high.",
  },
  {
    kind: "invoice",
    title: "valuation basis · INV-2026-1847 · Meridian Components",
    subtitle: "Role: commercial valuation basis · supplier record · USD · $64.75/unit",
    file: "INV-2026-1847.pdf",
    confidence: "0.96",
    detail: "Commercial invoice supporting supplier identity, invoice date, SKU NS-AIR-PURIFIER-3PK, currency, and the verified unit-cost basis used to translate quantity variance into exposure.",
    source: "Source: procurement repository · invoice INV-2026-1847 · parsed · supplier and SKU identity confirmed",
    connection: "Role: valuation basis. Establishes the $64.75 unit-cost basis used to translate the six-unit variance into supported $388.50 exposure.",
  },
  {
    kind: "po",
    title: "expected treatment · PO-2026-1847 · Northstar Commerce LLC",
    subtitle: "Role: expected inventory position · 48 units · SKU NS-AIR-PURIFIER-3PK · ASIN B0D4L8P1CX",
    file: "PO-2026-1847.pdf",
    confidence: "0.94",
    detail: "Seller procurement record connecting expected quantity, SKU, ASIN, marketplace, agreed unit cost, and receiving expectation to the canonical shipment event.",
    source: "Source: seller procurement repository · PO-2026-1847 · Amazon US · period Jan 2026",
    connection: "Role: expected treatment. Ties expected inventory, SKU, ASIN, marketplace, and commercial terms to the same event. Relationship match: complete.",
  },
  {
    kind: "receiving",
    title: "observed Amazon outcome · RECEIVE-ONT8-1847 · Amazon fulfillment",
    subtitle: "Role: observed Amazon outcome · ONT8 · 42 received / 48 expected · 6-unit variance",
    file: "RECEIVE-ONT8-1847.csv",
    confidence: "0.99",
    detail: "Fulfillment-center receiving event showing the six-unit delta at ONT8, with receipt timestamp, shipment identifier, received quantity, and report period tied back to the inbound plan.",
    source: "Source: Amazon FBA receiving records · ONT8 · report period Jan 2026 · parsed",
    connection: "Role: observed Amazon outcome. Establishes 48 expected versus 42 received at ONT8. The six-unit position remains unresolved; supported exposure is $388.50.",
  },
];

const evidenceLog = [
  { time: "09:18:42", label: "Observed outcome recorded", detail: "Amazon receiving records show 42 units received against 48 expected at ONT8. Six-unit variance remains unresolved.", file: "RECEIVE-ONT8-1847.csv" },
  { time: "09:19:06", label: "Clearing test completed", detail: "No reimbursement credit or reversal matched to the six-unit inbound shortage in settlement SETTLE-2026-01-AC7 through the review cutoff.", file: "SETTLE-205-771.csv" },
  { time: "09:19:31", label: "Valuation basis confirmed", detail: "Seller ledger and supplier invoice support a $64.75 unit-cost basis. Supported exposure: 6 × $64.75 = $388.50.", file: "LEDGER-NS-1847.csv" },
  { time: "09:20:14", label: "Evidence sufficiency assessed", detail: "Seven source classes are received and normalized; six match without conflict. Evidence supports seller review and controlled action. Financial conclusion: permitted for approval, not automatic certainty.", file: "EvidenceSufficiency-EVT-FBA-2026-0001847.pdf" },
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
          <p className="text-[10px] font-medium tracking-tight text-[#66737F]">Evidence control</p>
          <h1 className="mt-1 font-google-sans text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Evidence control for EVT-FBA-2026-0001847</h1>
          <p className="mt-2 text-[12px] leading-5 tracking-tight text-[#66737F]">Northstar Commerce LLC · Amazon US · FBA · Review period: 01 Jan–31 Mar 2026 · USD. Each record establishes a different part of the position; no document is treated as proof in isolation.</p>
        </header>
        <section className="px-5 pb-5 pt-4 sm:px-6">
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Evidence population</h2><span className="text-[11px] font-medium text-[#9AA7B0]">7/8 source classes</span><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
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
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Evidence sufficiency log</h2><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
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
