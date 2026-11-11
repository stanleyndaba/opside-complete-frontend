import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RecoveryTruthRecord } from "@/components/cases/RecoveryTruthRecord";
import { RecoveryProgressControl } from "@/components/cases/RecoveryProgressControl";
import { buildRecoveryTruthPresentation } from "@/lib/caseDetailTruthPresentation";

const documents = [
  { id: "ship-acme-2005", name: "SHIP-ACME-2005.pdf", type: "shipping", iconSrc: "/Amazon-logo.png", iconAlt: "Amazon", detail: "Shipment reconciliation and received quantity record", confidence: "98%" },
  { id: "inv-acme-2005", name: "INV-ACME-2005.pdf", type: "invoice", iconSrc: "/gmailicon.png", iconAlt: "Gmail", detail: "Commercial unit-value basis", confidence: "96%" },
  { id: "po-acme-2005", name: "PO-ACME-2005.pdf", type: "purchase order", iconSrc: "/onedrive-icon.png", iconAlt: "OneDrive", detail: "Expected quantity and supplier reference", confidence: "95%" },
  { id: "ledger-acme-2005", name: "ACME-2005-ledger.pdf", type: "ledger", iconSrc: "/outlookicon.webp", iconAlt: "Outlook", detail: "Accounting ledger excerpt tied to the reimbursement trail", confidence: "95%" },
];

const messages = [
  {
    direction: "outbound",
    date: "05/09/26, 10:42:00",
    state: "controlled submission · approved scope",
    subject: "EVT-FBA-2026-0001847 — controlled reimbursement submission | $38,850",
    sender: "Margin · action owner",
    body: `Hello Amazon Selling Partner Support,

Margin is requesting reimbursement for the supported 600-unit inbound quantity variance associated with shipment FBA18QZ7M4K2, received at ONT8 on 05/07/26.

The governed event record establishes 4,800 units expected and 4,200 units received for NS-AIR-PURIFIER-3PK (ASIN B0D4L8P1CX). The valuation basis is $64.75 per unit, producing supported exposure of 600 × $64.75 = $38,850.

The attached shipment, carrier, procurement, receiving, inventory, and clearing records resolve to EVT-FBA-2026-0001847. The request is limited to the supported exposure; no unsupported or duplicate amount is included. Please review the evidence and apply any eligible reimbursement to merchant account NTH-US-01.`,
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
    subject: "[Case ID: 19822888381] Partial approval issued — $26,000 | $12,850 residual",
    sender: "Amazon Selling Partner Support · administrative decision",
    body: `Hello,

We reviewed the reimbursement request for shipment FBA18QZ7M4K2. Amazon has approved and issued $26,000 against the supported $38,850 exposure. The remaining $12,850 remains unresolved.

Margin interpretation: this is a partial approval, not financial closure. The approved amount is still subject to settlement verification, and the residual remains open for targeted evidence review.

The credit has been recorded to the seller account. To review the outstanding balance, reply with documentation that clearly identifies the shipment, product, received quantity, and unit-value basis.

Regards,
Amazon Selling Partner Support`,
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
    subject: "[Case ID: 19822888381] Additional evidence required for residual $12,850",
    sender: "Amazon Selling Partner Support · evidence request",
    body: `Hello,

To continue reviewing the remaining $12,850, please provide evidence that connects the 600-unit variance and $64.75 unit value to shipment FBA18QZ7M4K2.

Margin interpretation: this request applies only to the residual position. The accepted evidence and $26,000 portion remain attached to the original event record; the investigation does not restart. Margin will map the requested items to the existing evidence population and isolate any actual gap before responding.

Please include the carrier delivery record, commercial valuation basis, fulfillment-center receiving record, and settlement detail showing the credit and residual balance. Reply within 14 days.

Regards,
Amazon Selling Partner Support`,
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
    subject: "[Case ID: 19822888381] Residual evidence response prepared | $12,850",
    sender: "Margin · evidence response owner",
    body: `Margin mapped Amazon's request to the existing governed event record rather than resubmitting the full case.

Response scope: residual $12,850 only. The shipment plan, carrier delivery record, receiving result, procurement basis, inventory movement, settlement population, and $26,000 credit match are re-indexed to the case.

Current financial position:
Supported exposure: $38,850
Amazon approved: $26,000
Settlement verification: pending
Residual exposure: $12,850
Reversal detected: No
Next controlled action: seller approval for targeted residual response
Close state: open until response and settlement are reconciled

Accepted evidence and settled value remain attached; the residual position is the only scope still requiring action.`,
    attachments: [
      { label: "Residual packet", name: "ResidualEvidenceResponse-19822888381.pdf" },
      { label: "Response index", name: "EvidenceIndex-Residual-128-50.csv" },
      { label: "Approval gate", name: "ApprovalRecord-Residual-128-50.pdf" },
      { label: "Submission draft", name: "AmazonResponseDraft-19822888381.html" },
    ],
  },
];

const caseData = {
  productName: "Northstar Home Goods · inbound shipment shortage recovery",
  title: "Inbound shipment shortage recovery",
  sku: "ACME-YOGA-MAT-SAGE",
  asin: "B0DMRGN184",
  fnsku: "MGRN-BTL-18",
  facility: "ABE8",
  warehouse: "ABE8",
  created_at: "2026-03-18T00:00:00Z",
  updated_at: "2026-05-08T14:37:00Z",
  discovery_date: "2026-03-18T00:00:00Z",
  identity_truth: { fnsku: { state: "confirmed" } },
  evidence_summary: { linked_document_count: 4, matched_document_count: 4, match_type: "invoice_shipment_inventory_match" },
  missing_requirements: [],
  safety_evaluations: {
    prior_reimbursement: { state: "clear" },
    inventory_adjustment: { state: "clear" },
    duplicate_claim: { state: "clear" },
  },
};

const truthPresentation = buildRecoveryTruthPresentation({
  hasTrustedFiling: true,
  hasTrustedApproval: true,
  hasTrustedPayout: false,
  filingStatus: "filed",
  filingTruthLine: "The filing record is linked to this recovery and its evidence packet.",
  claimReadiness: "claim_ready",
  financialPayoutStatus: "underpaid",
  financialReversalState: "review_required",
  financialTruthLimitation: "The credited amount is recorded, but final payment and closure are not yet verified for the outstanding balance.",
  verifiedPaidAmount: null,
  outstandingAmount: 963.1,
  varianceAmount: 963.1,
  accountingStatus: "not_reconciled",
  accountingLimitation: "Accounting context has not independently confirmed final settlement closure.",
  closureState: "open",
  closureReason: "The outstanding balance remains under review.",
  hasSafetyBlock: false,
  hasUnassessedSafety: false,
  statusFeedUnavailable: true,
});

const evidenceRequiredLog = [
  { time: "09:17:58", label: "Source population accepted", detail: "Twelve source classes are required for this control. Ten artifacts are available; two non-material source classes remain outstanding and are recorded rather than assumed complete within source run NTH-US-Q1-2026-0904.", file: "SourcePopulationRegister-Q1-2026.csv" },
  { time: "09:18:12", label: "API and structured records normalized", detail: "Amazon SP-API shipment, inventory, settlement, and reimbursement populations were parsed, period-scoped, deduplicated, and linked to legal entity NTH-US-01 and merchant account NTH-US-01.", file: "AmazonSPAPI-SourceRun-NTH-US-Q1-2026-0904.json" },
  { time: "09:18:42", label: "Observed outcome recorded", detail: "Amazon receiving records show 42 units received against 48 expected at ONT8. Six-unit variance remains unresolved.", file: "RECEIVE-ONT8-1847.csv" },
  { time: "09:19:06", label: "Clearing test completed", detail: "No reimbursement credit or reversal matched to the six-unit inbound shortage in settlement SETTLE-2026-01-AC7 through the review cutoff.", file: "SETTLE-2026-Q1.csv" },
  { time: "09:19:31", label: "Valuation basis confirmed", detail: "Seller ledger and supplier invoice support a $64.75 unit-cost basis. Supported exposure: 6 × $64.75 = $388.50.", file: "ERP-Inventory-Variance-Q1.xlsx" },
  { time: "09:19:48", label: "Relationship match completed", detail: "Shipment, carrier, procurement, receiving, inventory, settlement, reimbursement, and ERP records resolve to EVT-FBA-2026-0001847. Eight source classes match without material conflict.", file: "EvidenceIndex-EVT-FBA-2026-0001847.csv" },
  { time: "09:20:14", label: "Control sufficiency assessed", detail: "Evidence supports Finance review and controlled action. Financial conclusion: permitted for approval, not automatic certainty. Outstanding source classes remain visible in the exception register and excluded from the approved position.", file: "ControlSufficiency-EVT-FBA-2026-0001847.pdf" },
];

const lifecycleSteps = [
  { label: "Detected", active: true },
  { label: "Evidence", active: true },
  { label: "Filed", active: true },
  { label: "Approved", active: true },
  { label: "Payment verified", active: false },
];

function SectionHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="mb-4 border-b border-[#E7EEF2] pb-3"><p className="text-[11px] font-medium tracking-tight text-[#66737F]">{eyebrow}</p><h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">{title}</h3><p className="mt-1 text-[11px] leading-5 text-[#66737F]">{detail}</p></div>;
}

function EvidenceSufficiencyLog() {
  return <div className="border-t border-[#E7EEF2] px-5 pb-6 pt-5 sm:px-6"><div className="mb-4 flex items-center gap-2"><h2 className="text-[12px] font-semibold tracking-tight text-[#66737F]">Evidence sufficiency log</h2><div className="h-px flex-1 bg-[#DCE8EE]" /></div><div className="space-y-3">{evidenceRequiredLog.map((entry, index) => <div key={entry.file} className="relative grid grid-cols-[58px_24px_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[70px_26px_minmax(0,1fr)] sm:gap-4 sm:px-4">{index < evidenceRequiredLog.length - 1 ? <span className="absolute bottom-[-14px] left-[96px] h-3 w-px bg-[#C9D6DE] sm:left-[115px]" aria-hidden="true" /> : null}<time className="pt-1 font-mono text-[10px] tracking-tight text-[#7B8991]">{entry.time}</time><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8067]" aria-label="Recorded check"><Check className="h-3 w-3 text-white" strokeWidth={3} /></span><div className="min-w-0"><p className="text-[11px] font-semibold tracking-tight text-[#36404A]">{entry.label}</p><p className="mt-1 text-[11px] leading-4 tracking-tight text-[#66737F]">{entry.detail}</p><p className="mt-1 truncate text-[10px] tracking-tight text-[#9AA7B0]">{entry.file}</p></div></div>)}</div></div>;
}

function ProtocolRecord() {
  return <div className="space-y-3">
    <section className="rounded-[8px] border border-[#DCE8EE] bg-white p-3 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-3"><SectionHeader eyebrow="What happened" title="Operational history" detail="These are recorded operational events. They support the history of this recovery but do not, by themselves, establish financial closure." /><div className="space-y-3 border-l border-[#D8E3E8] pl-5">{[{ date: "Mar 18, 2026", title: "Recovery position detected", detail: "Inbound received quantity discrepancy identified from the linked source records." }, { date: "Mar 19, 2026", title: "Evidence packet assembled", detail: "Shipment, invoice, purchase order, and ledger records were matched to the governed event." }, { date: "Apr 02, 2026", title: "Filing submitted", detail: "Seller-approved evidence was submitted to the linked Amazon support case." }, { date: "May 08, 2026", title: "Underpaid reimbursement recorded", detail: "Amazon credited $519.10 against the $1,482.20 supported position; the $963.10 residual remains open." }].map((event) => <div key={event.title} className="relative"><span className="absolute -left-[22px] top-1.5 h-2 w-2 rounded-full bg-[#8A97A2]" /><p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">{event.date}</p><p className="mt-1 text-[12px] font-semibold text-[#182026]">{event.title}</p><p className="mt-1 text-[11px] leading-5 text-[#66737F]">{event.detail}</p></div>)}</div></section>
    <section className="rounded-[8px] border border-[#DCE8EE] bg-white p-3 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-3"><SectionHeader eyebrow="Amazon record" title="What Amazon said and what Margin sent" detail="Inspect Amazon’s case state, messages, attachments, and any eligible evidence-backed reply from this recovery record." /><div className="space-y-3">{messages.map((message) => <article key={message.date} className={`space-y-3 rounded-[8px] rounded-[8px] border px-4 py-3 ${message.direction === "inbound" ? "border-[#DCE8EE] bg-[#F7FAFC]" : "border-[#DCE8EE] bg-[#F8FAFB]"}`}><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-tight"><Badge variant="outline" className={message.direction === "inbound" ? "border-[#DCE8EE] bg-[#F7FAFC] text-[#182026]" : "border-[#DCE8EE] bg-[#F8FAFB] text-[#66737F]"}>{message.direction === "inbound" ? "Inbound" : "Outbound"}</Badge><span className="text-[#6B7C88]">{message.date}</span><Badge variant="outline" className="border-[#D8E3E8] bg-white text-[10px] uppercase tracking-tight text-[#6B7C88]">{message.state}</Badge></div><div><p className="text-sm font-semibold tracking-tight text-[#07111A]">{message.subject}</p><p className="mt-1 text-[11px] text-[#6B7C88]">From {message.from}</p></div><p className="whitespace-pre-wrap text-sm leading-relaxed text-[#4D5B66]">{message.body}</p>{message.attachments?.length ? <div className="space-y-2"><div className="text-[9px] font-semibold uppercase tracking-tight text-[#6B7C88]">Attachments</div><div className="grid gap-2 sm:grid-cols-2">{message.attachments.map((attachment) => <button key={attachment.name} type="button" className="flex min-h-8 min-w-0 items-center gap-1.5 rounded-[8px] border border-[#D8E3E8] bg-white px-2 py-1.5 text-left transition-colors hover:bg-[#F8FAFB]"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4B946F] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span className="shrink-0 text-[8px] font-semibold tracking-tight text-[#4B946F]">{attachment.label}</span><span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-[#4D5B66]">{attachment.name}</span><ArrowRight className="h-2.5 w-2.5 shrink-0 text-[#0B74DE]" /></button>)}</div></div> : null}</article>)}</div><div className="mt-3 space-y-3 rounded-[8px] border border-[#D8E3E8] bg-[#F8FAFB] p-3"><div><p className="text-xs font-semibold text-[#07111A]">Reply to Amazon</p><p className="mt-1 text-[11px] text-[#6B7C88]">Continue the linked Amazon support thread from inside Margin.</p></div><Textarea placeholder="Write the evidence-backed reply you want Amazon to receive." className="min-h-[120px] border-[#D8E3E8] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF]" /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-[#6B7C88]">Thread linkage is confirmed. This reply will stay on the stored Amazon conversation.</p><Button type="button" className="bg-[#182026] text-white"><Send className="mr-2 h-3.5 w-3.5" />Send Reply</Button></div></div></section>
    <section className="rounded-[8px] border border-[#DCE8EE] bg-white p-3 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-3"><SectionHeader eyebrow="Supporting evidence" title="Documents and evidence history" detail="Each item is supporting context for the case record. A document or event is not automatically proof of filing, payment, or closure." /><div className="space-y-8"><div className="space-y-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#6B7C88]">Matched Documents (4)<div className="h-px flex-1 bg-[#D8E3E8]" /></div><div className="space-y-3">{documents.map((doc) => <div key={doc.id} className="group rounded-[8px] border border-[#DCE8EE] bg-[#F7FAFC] p-3.5 transition-colors hover:bg-white"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#E7EEF2] bg-white"><span className="relative flex h-7 w-7 items-center justify-center"><img src={doc.iconSrc} alt={doc.iconAlt} className="h-6 w-6 object-contain" /></span></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#07111A]">{doc.name}</p><p className="mt-1 truncate text-[10px] text-[#6B7C88]">{doc.detail}</p><p className="mt-1 text-[10px] text-[#8A98A3]">File: {doc.name}</p></div></div><div className="flex shrink-0 items-center gap-3"><Badge variant="outline" className="h-5 rounded-[8px] border-[#DCE8EE] bg-white px-2 text-[11px] font-medium text-[#4D5B66]">{doc.confidence}</Badge><Button variant="ghost" size="sm" className="h-7 px-1 text-[12px] font-medium text-[#182026]"><span className="hidden sm:inline">View</span><ArrowRight className="ml-1 h-2.5 w-2.5" /></Button></div></div><div className="mt-3 ml-6 rounded-[8px] border border-[#E7EEF2] bg-[#F8FAFB] px-3 py-2 text-[10px] text-[#6B7C88]"><span className="font-bold uppercase tracking-tight text-[#66737F]">Evidence match</span><span className="ml-2 italic text-[#26333D]">"{doc.detail}"</span></div></div>)}</div></div><EvidenceSufficiencyLog /></div></section>
  </div>;
}

export default function CaseDetailDemo() {
  const [activeTab, setActiveTab] = useState<"RECORD" | "PROTOCOL">("RECORD");
  return <main className="min-h-full overflow-x-hidden bg-white font-sans text-[#111827]"><div className="mx-auto max-w-[1280px] px-3 py-3 sm:px-6 sm:py-5 lg:px-8"><header className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div className="flex items-start gap-3"><button type="button" aria-label="Back to recoveries" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#D8E3E8] bg-white text-[#6B7C88]"><ArrowLeft className="h-4 w-4" /></button><div className="max-w-[720px]"><div className="flex flex-wrap items-center gap-3"><h1 className="font-lora text-[24px] font-normal tracking-tight text-[#182026]">AMZ-CASE-2005</h1><Badge variant="outline" className="rounded-[8px] border-[#DCE8EE] bg-[#F7FAFC] text-[12px] font-medium text-[#4D5B66]">Recovery case</Badge><Badge variant="outline" className="rounded-[8px] border-[#DCE8EE] bg-[#F7FAFC] text-[12px] font-medium text-[#182026]">Live Updates Unavailable</Badge></div><div className="mt-3"><p className="text-[12px] font-medium tracking-tight text-[#66737F]">What this case needs next</p><p className="mt-1 text-[12px] leading-5 tracking-tight text-[#26333D]">This case has the core evidence and identifiers in place. If it has not been filed yet, the next step is submission; after filing, Margin tracks Amazon review and payout movement.</p><p className="mt-1.5 text-[11px] leading-5 tracking-tight text-[#6B7C88]">Four linked records are already attached behind the case. Margin files only when proof requirements are met.</p><div className="mt-2 flex flex-wrap gap-2"><span className="inline-flex items-center bg-[#F8FAFB] px-2.5 py-1 text-[10px] font-medium text-[#4D5B66]">Proof: Filing ready</span><span className="inline-flex items-center bg-[#F8FAFB] px-2.5 py-1 text-[10px] font-medium text-[#4D5B66]">Docs linked: 4</span><span className="inline-flex items-center bg-[#F8FAFB] px-2.5 py-1 text-[10px] font-medium text-[#4D5B66]">Payout: Tracked</span></div></div></div></div><div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" className="h-8 border-[#D8E3E8] bg-white text-xs font-semibold text-[#4D5B66]"><FileText className="mr-2 h-3.5 w-3.5" />Brief PDF · Not Available</Button><Button variant="outline" size="sm" className="h-8 border-[#D8E3E8] bg-white text-xs font-semibold text-[#4D5B66]"><Download className="mr-2 h-3.5 w-3.5" />Case PDF Export</Button></div></header><div className="mb-4 flex gap-1 border-b border-[#DCE8EE]" role="tablist" aria-label="Case detail views"><button type="button" role="tab" aria-selected={activeTab === "RECORD"} onClick={() => setActiveTab("RECORD")} className={`relative px-4 py-3 text-[13px] font-medium tracking-tight transition-colors sm:px-5 ${activeTab === "RECORD" ? "bg-[#F7FAFC] text-[#182026]" : "text-[#66737F] hover:bg-[#F7FAFC]"}`}>What we found<span className={`absolute inset-x-3 bottom-0 h-[2px] bg-[#182026] transition-transform ${activeTab === "RECORD" ? "scale-x-100" : "scale-x-0"}`} /></button><button type="button" role="tab" aria-selected={activeTab === "PROTOCOL"} onClick={() => setActiveTab("PROTOCOL")} className={`relative px-4 py-3 text-[13px] font-medium tracking-tight transition-colors sm:px-5 ${activeTab === "PROTOCOL" ? "bg-[#F7FAFC] text-[#182026]" : "text-[#66737F] hover:bg-[#F7FAFC]"}`}>Recovery progress<span className={`absolute inset-x-3 bottom-0 h-[2px] bg-[#182026] transition-transform ${activeTab === "PROTOCOL" ? "scale-x-100" : "scale-x-0"}`} /></button></div>{activeTab === "RECORD" ? <RecoveryTruthRecord caseData={caseData} truthPresentation={truthPresentation} requestedLanguage={{ label: "Original requested recovery", detail: "This is the amount originally requested. It is not, by itself, a verified payment or final financial outcome." }} accountingBoundary={{ label: "Accounting boundary", detail: "Margin does not replace the seller's accounting system. Accounting reconciliation remains a separate condition for financial closure.", prohibitedImplication: "A case record is not an accounting ledger." }} currency="USD" requestedAmount={1482.2} estimatedClaimValue={1482.2} approvedAmount={1482.2} recordedPayoutAmount={519.1} verifiedPaidAmount={null} outstandingAmount={963.1} varianceAmount={963.1} trustedApproval={true} trustedPayout={false} hasResolvedBackend={true} hasSafetyBlock={false} hasUnassessedSafety={false} proofStatus="filing_ready" payoutProofStatus="tracked" filingStatus="Filed · underpaid" filingTruthLine="The filing record is linked to this recovery and its evidence packet." nextStep={{ title: "Seller approval before the next controlled action", description: "Review the linked evidence packet and approve the prepared follow-up workflow." }} sellerSummary={{ evidence_summary: "Four linked source records resolve to one governed inbound shipment event." }} policyBasis={{ title: "Inventory Reimbursement - Inbound Shipments", summary: "FBA 9.1 · Section 1.3: Lost Inbound" }} matchedDocuments={documents} inventory={{ totalInput: 246, totalOutput: 228, calculatedStock: 18, warehouseBalance: 0, discrepancy: 18 }} findingNarrative="Margin identified a supported inbound received quantity discrepancy for SKU ACME-YOGA-MAT-SAGE at fulfillment center ABE8. The evidence packet supports a claim-ready position while the underpaid balance remains open." generatedNarrative={false} financialTruthLimitation="The credited amount is recorded, but final payment and closure are not yet verified for the outstanding balance." accountingTruth={{ status: "not_reconciled", limitation: "Accounting context has not independently confirmed final settlement closure." }} closureTruth={{ state: "open", reason: "The outstanding balance remains under review." }} /> : <div className="space-y-3"><RecoveryProgressControl truthPresentation={truthPresentation} lifecycleSteps={lifecycleSteps} nextStep={{ title: "Seller approval before the next controlled action", description: "Review the linked evidence packet and approve the prepared follow-up workflow." }} missingRequirements={[]} proofStatus="filing_ready" financialPayoutStatus="underpaid" financialReversalState="review_required" accountingStatus="not_reconciled" accountingLimitation="Accounting context has not independently confirmed final settlement closure." closureState="open" closureReason="The outstanding balance remains under review." hasTrustedFiling={true} hasTrustedApproval={true} hasTrustedPayout={false} hasSafetyBlock={false} hasUnassessedSafety={false} truthUnavailable={false} statusFeedUnavailable={true} /><section className="rounded-[8px] border border-[#DCE8EE] bg-white p-3 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-3"><SectionHeader eyebrow="Original requested recovery" title="Requested amount" detail="This is the amount originally requested. It is not, by itself, a verified payment or final financial outcome." /><p className="text-[16px] font-semibold tracking-tight text-[#182026]">$1,482.20</p></section><ProtocolRecord /></div>}</div></main>;
}
