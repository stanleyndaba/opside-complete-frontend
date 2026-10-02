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
    kind: "shipment",
    title: "expected inbound · ShipmentPlan-FBA18QZ7M4K2.json",
    subtitle: "Role: expected treatment · Amazon SP-API snapshot · 48 units · Amazon US FBA",
    file: "ShipmentPlan-FBA18QZ7M4K2.json",
    confidence: "0.99",
    detail: "API snapshot establishing shipment identity, expected quantity, SKU, ASIN, fulfillment node ONT8, carton structure, and the source timestamp used for the control record.",
    source: "Source: Amazon SP-API · shipment FBA18QZ7M4K2 · parsed · identity matched",
    connection: "Role: expected inbound. Establishes what Amazon was expected to receive before the observed outcome is tested.",
  },
  {
    kind: "shipping",
    title: "observed delivery · POD-FBA18QZ7M4K2.pdf",
    subtitle: "Role: delivery occurrence · Southdock Fulfillment · carrier repository · Jan 2026",
    file: "POD-FBA18QZ7M4K2.pdf",
    confidence: "0.98",
    detail: "Signed carrier proof of delivery with carton count, ship-from address, destination fulfillment center ONT8, delivery timestamp, and shipment reference.",
    source: "Source: carrier repository · FBA18QZ7M4K2 · parsed · matched to receiving event",
    connection: "Role: observed delivery. Establishes the inbound event and delivery timing independently of Amazon's receiving result.",
  },
  {
    kind: "invoice",
    title: "valuation basis · INV-2026-1847.pdf",
    subtitle: "Role: commercial valuation basis · Meridian Components · USD · $64.75/unit",
    file: "INV-2026-1847.pdf",
    confidence: "0.96",
    detail: "Commercial invoice supporting supplier identity, invoice date, SKU NS-AIR-PURIFIER-3PK, currency, unit cost, and the valuation basis used to calculate supported exposure.",
    source: "Source: procurement repository · INV-2026-1847 · parsed · supplier and SKU identity confirmed",
    connection: "Role: valuation basis. Converts the six-unit quantity variance into supported $388.50 exposure.",
  },
  {
    kind: "po",
    title: "expected treatment · PO-2026-1847.xlsx",
    subtitle: "Role: procurement expectation · Northstar Commerce LLC · 48 units · Amazon US",
    file: "PO-2026-1847.xlsx",
    confidence: "0.94",
    detail: "Procurement extract connecting expected quantity, SKU, ASIN, marketplace, agreed unit cost, purchase terms, and receiving expectation to the canonical shipment event.",
    source: "Source: seller procurement repository · PO-2026-1847 · period Jan 2026 · imported",
    connection: "Role: expected inventory position. Ties commercial terms and inventory expectation to the same event.",
  },
  {
    kind: "receiving",
    title: "observed Amazon outcome · RECEIVE-ONT8-1847.csv",
    subtitle: "Role: Amazon receiving result · ONT8 · 42 received / 48 expected · 6-unit variance",
    file: "RECEIVE-ONT8-1847.csv",
    confidence: "0.99",
    detail: "Fulfillment-center receiving record showing the six-unit delta at ONT8, with receipt timestamp, shipment identifier, received quantity, and report period tied to the inbound plan.",
    source: "Source: Amazon FBA receiving records · ONT8 · Jan 2026 · parsed",
    connection: "Role: observed Amazon outcome. Establishes 48 expected versus 42 received; the six-unit position remains unresolved.",
  },
  {
    kind: "inventory",
    title: "subsequent movement · FBA-InventoryMovement-Q1.csv",
    subtitle: "Role: clearing test · Amazon inventory ledger · Q1 2026 · 42,817 rows normalized",
    file: "FBA-InventoryMovement-Q1.csv",
    confidence: "0.93",
    detail: "Inventory movement ledger tested for later receipt, adjustment, transfer, removal, or reimbursement activity that could clear or alter the original receiving variance.",
    source: "Source: Amazon inventory ledger · report period Q1 2026 · normalized · duplicate check complete",
    connection: "Role: subsequent outcome. No later movement clears the six-unit position before the review cutoff.",
  },
  {
    kind: "settlement",
    title: "financial clearing · SETTLE-2026-Q1.csv",
    subtitle: "Role: settlement evidence · Amazon SP-API · 184,293 rows normalized · USD",
    file: "SETTLE-2026-Q1.csv",
    confidence: "0.97",
    detail: "Settlement population tested for reimbursement credits, reversals, fee adjustments, merchant account identity, settlement period, and any credit attributable to the canonical event.",
    source: "Source: Amazon SP-API settlement reports · Q1 2026 · 184,293 rows · normalized",
    connection: "Role: financial clearing. No reimbursement credit matched to the six-unit inbound shortage through SETTLE-2026-01-AC7.",
  },
  {
    kind: "reimbursement",
    title: "reimbursement population · Reimbursements-Q1-2026.csv",
    subtitle: "Role: recovery activity check · Amazon reimbursement report · Q1 2026",
    file: "Reimbursements-Q1-2026.csv",
    confidence: "0.95",
    detail: "Reimbursement report searched by shipment, SKU, ASIN, merchant account, and event period to test whether Amazon already issued, reversed, or partially issued a credit.",
    source: "Source: Amazon reimbursement reports · Q1 2026 · joined on shipment and SKU",
    connection: "Role: duplicate-recovery control. No existing reimbursement was identified for this event; no duplicate action is permitted.",
  },
  {
    kind: "ledger",
    title: "seller financial position · ERP-Inventory-Variance-Q1.xlsx",
    subtitle: "Role: ledger comparison · Northstar Commerce LLC · inventory variance account · USD",
    file: "ERP-Inventory-Variance-Q1.xlsx",
    confidence: "0.91",
    detail: "ERP extract used to compare the operational quantity variance with the seller's inventory and fulfillment-variance accounts. Period mapping and currency basis were confirmed.",
    source: "Source: ERP inventory extract · Q1 2026 · imported · account mapping confirmed",
    connection: "Role: financial attribution. Confirms the six-unit position is carried in the seller's ledger and has not been cleared downstream.",
  },
  {
    kind: "case",
    title: "Amazon case history · AmazonCase-19822888381.html",
    subtitle: "Role: action and response record · Seller Central · case 19822888381",
    file: "AmazonCase-19822888381.html",
    confidence: "0.89",
    detail: "Seller Central case history preserving submission, Amazon requests, responses, timestamps, and the decision state attached to the governed event record.",
    source: "Source: Amazon Seller Central case history · captured 04 Sep 2026 · response linked",
    connection: "Role: action record. Preserves the filing trail and prevents the case response from being separated from the underlying evidence.",
  },
];

const evidenceLog = [
  { time: "09:17:58", label: "Source population accepted", detail: "Twelve source classes are required for this control. Ten artifacts are available; two non-material source classes remain outstanding and are recorded rather than assumed complete.", file: "SourceRegister-Q1-2026.csv" },
  { time: "09:18:12", label: "API and structured records normalized", detail: "Amazon SP-API shipment, inventory, settlement, and reimbursement records were parsed, period-scoped, deduplicated, and linked to merchant account NTH-US-01.", file: "AmazonSPAPI-IngestionLog.json" },
  { time: "09:18:42", label: "Observed outcome recorded", detail: "Amazon receiving records show 42 units received against 48 expected at ONT8. Six-unit variance remains unresolved.", file: "RECEIVE-ONT8-1847.csv" },
  { time: "09:19:06", label: "Clearing test completed", detail: "No reimbursement credit or reversal matched to the six-unit inbound shortage in settlement SETTLE-2026-01-AC7 through the review cutoff.", file: "SETTLE-2026-Q1.csv" },
  { time: "09:19:31", label: "Valuation basis confirmed", detail: "Seller ledger and supplier invoice support a $64.75 unit-cost basis. Supported exposure: 6 × $64.75 = $388.50.", file: "ERP-Inventory-Variance-Q1.xlsx" },
  { time: "09:19:48", label: "Relationship match completed", detail: "Shipment, carrier, procurement, receiving, inventory, settlement, reimbursement, and ERP records resolve to EVT-FBA-2026-0001847. Eight source classes match without material conflict.", file: "EvidenceIndex-EVT-FBA-2026-0001847.csv" },
  { time: "09:20:14", label: "Evidence sufficiency assessed", detail: "Evidence supports seller review and controlled action. Financial conclusion: permitted for approval, not automatic certainty. Outstanding source classes remain visible in the exception register.", file: "EvidenceSufficiency-EVT-FBA-2026-0001847.pdf" },
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
          <div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Evidence population</h2><span className="text-[11px] font-medium text-[#9AA7B0]">12 required · 10 available</span><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
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
