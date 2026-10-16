import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, ChevronDown, Files, Layers3, ListChecks, Search, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type TabId = "approval" | "filing" | "filed" | "attention" | "payout" | "resolved";
type Tone = "ready" | "moving" | "filed" | "attention" | "payout" | "resolved";

const pipelineRail = [
  { label: "Recovery operations", href: "#pipeline-title", icon: ListChecks },
  { label: "Approval queue", href: "#approval-queue", icon: Layers3 },
  { label: "Evidence records", href: "#approval-queue", icon: Files },
  { label: "Control settings", href: "#approval-queue", icon: SlidersHorizontal },
  { label: "Search records", href: "#approval-queue", icon: Search },
] as const;

type RecordCard = {
  reference: string;
  type: string;
  title: string;
  amount: string;
  detail: string;
  meta: string;
  priority?: string;
  proof: string;
  days?: string;
  route: string;
  packet: string;
  safety: string;
  checks: string[];
  status: string;
  next: string;
  movement: string;
  docs: string[];
  tone: Tone;
};

const tabs: Array<{ id: TabId; label: string; count: number }> = [
  { id: "approval", label: "Awaiting seller approval", count: 43 },
];

const INTAKE_REPLAY_DELAY_MS = 36000;
const CORRESPONDENCE_DWELL_MS = 12000;
const ARTIFACT_ANALYSIS_DWELL_MS = 2000;

const cards: Record<TabId, RecordCard[]> = {
  approval: [{ reference: "REC-2026-004817", type: "Governed event cohort", title: "Inbound Receiving Cohort", amount: "$14,832", detail: "Three related inbound events were reconstructed across Amazon receiving, carrier delivery, procurement, inventory movement, and settlement records. Supported exposure is isolated from unresolved items.", meta: "NTH-US-01 · FY2026 Q1 · 3 shipments · 1,240 expected / 1,168 received · ONT8 · LGB8 · PHX7 · 72 units", priority: "Material position", proof: "Sufficiency gate passed", days: "Policy window valid", route: "Seller Central / FBA inventory reimbursement / Controlled inbound cohort", packet: "SP-API snapshot, POD, receiving reports, ERP ledger, settlement clearing", safety: "No duplicate credit identified · clearing test complete", checks: ["Event identity resolved", "Valuation basis verified", "Seller approval required"], status: "Approve controlled action", next: "Approve controlled filing", movement: "Updated 9 minutes ago", docs: ["EvidenceIndex-REC-2026-004817.csv", "ShipmentPopulation-FY2026.json", "ReceivingCohort-ONT8-LGB8-PHX7.csv", "ValuationBasis-REC-2026-004817.xlsx"], tone: "ready" }],
  filing: [{ reference: "REC-2026-004531", type: "Submission execution", title: "Removal and Warehouse-Loss Cohort", amount: "$22,480", detail: "Eighteen related events across four fulfillment centers cleared the evidence and materiality gates. Margin is sending the locked packet and capturing the Amazon receipt.", meta: "NTH-US-01 · FY2026 Q2 · 18 events · 312 units · ONT8 · PHX7 · ABE8 · FTW1", proof: "Evidence package locked", days: "Response expected in 12 days", route: "Seller Central / Removal reimbursement / Controlled cohort", packet: "Removal orders, carrier manifests, WMS release logs, inventory ledger", safety: "Duplicate claim check passed · submission route confirmed", checks: ["Submission receipt pending", "Case references linked", "Seller approval recorded"], status: "Submitting", next: "Capture Amazon receipt", movement: "Updated 4 minutes ago", docs: ["RemovalCohort-REC-2026-004531.csv", "CarrierManifestPopulation.xlsx", "SubmissionPacket-REC-2026-004531.pdf"], tone: "moving" }],
  filed: [{ reference: "REC-2026-003982", type: "Filed with Amazon", title: "Inventory Adjustment Cohort", amount: "$31,760", detail: "Twenty-seven inventory adjustments across the network are with Amazon. Margin keeps the evidence index, case references, response window, and financial position connected.", meta: "NTH-US-01 · FY2026 Q2 · 27 adjustments · 1,842 units · 6 fulfillment centers", proof: "Submitted 18 Jun", route: "Seller Central / FBA inventory reimbursement / Adjustment cohort", packet: "Adjustment history, WMS ledger, receiving records, valuation schedule", safety: "Policy route verified · response deadline active", checks: ["Submission receipt captured", "Case number linked", "Response window active"], status: "Under review", next: "Monitor response window", movement: "Updated 1 hour ago", docs: ["AdjustmentPopulation-Q2.csv", "WMS-Ledger-Extract.xlsx", "AmazonCase-REC-2026-003982.html"], tone: "filed" }],
  attention: [{ reference: "REC-2026-004206", type: "Control exception", title: "Cross-System Relationship Conflict", amount: "$8,940", detail: "The event is held because the WMS receipt and Amazon receiving record do not yet resolve to the same quantity. Margin has isolated the conflict and assigned the missing source.", meta: "NTH-US-01 · FY2026 Q2 · 4 shipments · 188 units · ONT8 · WMS vs Amazon receiving", proof: "Source conflict isolated", route: "Evidence resolution / Inbound receiving control", packet: "WMS receipt, Amazon receiving report, carrier handoff, ERP ledger", safety: "Filing blocked · no unsupported exposure included", checks: ["Event identity matched", "Materiality calculated", "Source exception assigned"], status: "Blocked", next: "Resolve source conflict", movement: "Updated 22 minutes ago", docs: ["WMS-Receipt-Conflict.xlsx", "AmazonReceiving-ONT8.csv", "ExceptionRegister-REC-2026-004206.pdf"], tone: "attention" }],
  payout: [{ reference: "REC-2026-003741", type: "Awaiting financial clearing", title: "Approved Reimbursement Cohort", amount: "$46,280", detail: "Amazon approved the supported position. Margin is testing settlement rows, payout timing, partial credits, reversals, and account attribution before treating the recovery as complete.", meta: "NTH-US-01 · FY2026 Q1 · 11 approved events · 624 units · Amazon US", proof: "Approved 12 Jun", route: "Settlement reconciliation / Seller reimbursement cohort", packet: "Approval notices, settlement population, payout ledger, reversal watch", safety: "Reversal watch active · residual balance open", checks: ["Approval linked", "Settlement period identified", "Payout not yet matched"], status: "Awaiting payout", next: "Reconcile credited position", movement: "Updated yesterday", docs: ["ApprovalPopulation-REC-2026-003741.csv", "Settlement-Q1-2026.xlsx", "ReversalWatch-REC-2026-003741.json"], tone: "payout" }],
  resolved: [{ reference: "REC-2026-002884", type: "Reconciled outcome", title: "Final Recovery Portfolio Outcome", amount: "$18,640", detail: "The approved recovery was matched to settlement, payout, and the seller ledger. The financial outcome is recorded as complete with no residual balance.", meta: "NTH-US-01 · FY2026 Q1 · 8 events · 416 units · Amazon US · USD", proof: "Reconciled 06 Jun", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Approval record, settlement lines, payout ledger, final outcome register", safety: "Final balance verified · no reversal detected", checks: ["Payout matched", "Seller ledger agrees", "Recovery record closed"], status: "Reconciled", next: "Record closed", movement: "Updated 3 days ago", docs: ["OutcomeRegister-REC-2026-002884.csv", "SettlementMatch-REC-2026-002884.json", "PayoutLedger-Q1.xlsx"], tone: "resolved" }],
};

const makeAdditionalCards = (
  prefix: string,
  tone: Tone,
  status: string,
  specs: Array<{ type: string; title: string; amount: string; detail: string; meta: string; proof: string; route: string; packet: string; safety: string; next: string; docs: string[] }>,
): RecordCard[] => specs.map((spec, index) => ({
  reference: `${prefix}-${String(index + 1).padStart(2, "0")}`,
  type: spec.type,
  title: spec.title,
  amount: spec.amount,
  detail: spec.detail,
  meta: spec.meta,
  proof: spec.proof,
  route: spec.route,
  packet: spec.packet,
  safety: spec.safety,
  checks: ["Policy window checked", "Source records matched", "No duplicate recovery found"],
  status,
  next: spec.next,
  movement: `Updated ${index + 3} minutes ago`,
  docs: spec.docs,
  tone,
}));

cards.approval.push(...makeAdditionalCards("RFD-169", "ready", "Approve filing", [
  { type: "Fee overcharge", title: "Storage Fee Miscalculation", amount: "$329.84", detail: "Monthly storage charges exceed the documented cubic-foot rate for the affected inventory period.", meta: "Settlement 204-771 · 186 units · SKU NS-STACKABLE-BIN · ASIN B0D6K8R4VQ", proof: "91% ready", route: "Seller Central / Fee reimbursement / Storage", packet: "Fee preview, storage report, rate card", safety: "Rate comparison completed", next: "Approve filing now", docs: ["fee-preview.csv", "storage-report.csv", "rate-card.pdf"] },
  { type: "Inbound shortage", title: "Carton Quantity Variance", amount: "$472.16", detail: "The receiving record shows two cartons fewer than the signed carrier handoff and shipment plan.", meta: "Shipment FBA18LQ4C2P1 · 16 units · SKU NS-LINEN-SHELF · ASIN B0D1P7X5TR", proof: "96% ready", route: "Seller Central / FBA inventory reimbursement / Inbound", packet: "POD, carton manifest, receiving report", safety: "Carrier handoff verified", next: "Review evidence", docs: ["pod-FBA18LQ4C2P1.pdf", "carton-manifest.csv", "receiving-report.pdf"] },
  { type: "Customer return", title: "Return Inventory Not Credited", amount: "$268.50", detail: "A customer return was received but the expected inventory credit is absent from the settlement record.", meta: "Order 114-4281902-663 · 3 units · SKU NS-CERAMIC-MUG-SET · ASIN B0C2M9Q8LK", proof: "89% ready", route: "Seller Central / Customer returns / Reimbursement", packet: "Return event, settlement line, unit ledger", safety: "Return event uniquely matched", next: "Approve filing now", docs: ["return-event.json", "settlement-line.csv", "unit-ledger.csv"] },
  { type: "Removal shortage", title: "Removal Shipment Variance", amount: "$716.40", detail: "The removal order closed with fewer units delivered than the carrier manifest and warehouse release record.", meta: "Removal R-89114 · 12 units · SKU NS-FOLDING-DESK · ASIN B0B5R2M6WJ", proof: "93% ready", route: "Seller Central / Removal reimbursement", packet: "Removal order, carrier manifest, warehouse release", safety: "No overlapping removal claim", next: "Review packet", docs: ["removal-R89114.pdf", "carrier-manifest.csv", "warehouse-release.pdf"] },
  { type: "Reimbursement error", title: "Underpaid Reimbursement", amount: "$542.88", detail: "The credited value is below the verified unit cost recorded in the invoice and product cost basis.", meta: "Settlement 205-114 · 7 units · SKU NS-HEPA-FILTER · ASIN B0C9F3L2ND", proof: "92% ready", route: "Seller Central / Reimbursement review / Valuation", packet: "Invoice, cost basis, reimbursement notice", safety: "Unit cost source verified", next: "Approve filing now", docs: ["invoice-HEPA.pdf", "cost-basis.csv", "reimbursement-notice.pdf"] },
  { type: "Warehouse damage", title: "Damaged Unit Not Reimbursed", amount: "$1,084.00", detail: "Warehouse damage is documented in the receiving record but no matching reimbursement appears in the account activity.", meta: "Warehouse WHS-07 · 10 units · SKU NS-GLASS-CANISTER · ASIN B0D7H2P4QS", proof: "95% ready", route: "Seller Central / FBA inventory reimbursement / Damage", packet: "Damage report, receiving photos, inventory adjustment", safety: "Damage event date validated", next: "Approve filing now", docs: ["damage-WHS07.pdf", "receiving-photos.zip", "inventory-adjustment.csv"] },
  { type: "SLA compensation", title: "Late Delivery Compensation", amount: "$391.22", detail: "The delivery event breached the service-level window and the supporting carrier timeline is complete.", meta: "Order 113-9027714-118 · SKU NS-USB-C-HUB · ASIN B09M6T1R8F", proof: "88% ready", route: "Seller Central / Service level compensation", packet: "Promise date, carrier timeline, delivery scan", safety: "Carrier timeline reconciled", next: "Review evidence", docs: ["promise-date.csv", "carrier-timeline.pdf", "delivery-scan.json"] },
  { type: "Fee overcharge", title: "Referral Fee Rate Difference", amount: "$214.70", detail: "The charged referral fee uses a higher category rate than the category assignment and rate card support.", meta: "Settlement 205-083 · 24 units · SKU NS-WALL-MOUNT · ASIN B0B2K7L9XV", proof: "90% ready", route: "Seller Central / Fee reimbursement / Referral fee", packet: "Settlement detail, category record, rate card", safety: "Category mapping confirmed", next: "Approve filing now", docs: ["settlement-detail.csv", "category-record.pdf", "referral-rate-card.pdf"] },
  { type: "Inventory adjustment", title: "Unmatched Inventory Adjustment", amount: "$633.15", detail: "An inventory adjustment reduced available units without a corresponding event in the attached operational records.", meta: "Adjustment ADJ-77419 · 9 units · SKU NS-BAMBOO-DRAWER · ASIN B0D8N4K2JT", proof: "87% ready", route: "Seller Central / Inventory reimbursement / Adjustment", packet: "Adjustment history, ledger export, unit cost", safety: "Adjustment has no prior filing", next: "Review packet", docs: ["adjustment-history.csv", "ledger-export.csv", "unit-cost.pdf"] },
]));

cards.filing.push(...makeAdditionalCards("RFD-168", "moving", "Submitting", [
  { type: "FBA reimbursement", title: "Inbound Case Packet", amount: "$438.60", detail: "The shipment discrepancy has cleared review and the reimbursement packet is being submitted with receipt capture enabled.", meta: "Shipment FBA18PX7N4L2 · 11 units · SKU NS-KITCHEN-RACK · ASIN B0D3N8Q1LM", proof: "Packet locked", route: "Seller Central / FBA inventory reimbursement", packet: "BOL, invoice, receive delta, shipment plan", safety: "Submission route confirmed", next: "Capture case number", docs: ["BOL-FBA18PX7N4L2.pdf", "invoice-rack.pdf", "receive-delta.csv"] },
  { type: "Fee reimbursement", title: "Oversize Fee Review", amount: "$287.44", detail: "The fee calculation and dimensional record are reconciled; Margin is sending the supported correction request.", meta: "Settlement 205-201 · 34 units · SKU NS-PET-FEEDER · ASIN B0C6N1V8RP", proof: "Submission active", route: "Seller Central / Fee reimbursement / Fulfillment fee", packet: "Fee detail, dimensions, product catalog", safety: "Dimensions independently checked", next: "Capture submission receipt", docs: ["fee-detail.csv", "dimensions.pdf", "catalog-export.csv"] },
  { type: "Customer return", title: "Return Credit Case", amount: "$349.90", detail: "The returned units are accounted for and the missing credit request is moving through the selected case route.", meta: "Order 112-6820145-908 · 5 units · SKU NS-COTTON-SHEET · ASIN B08L3M7Q2H", proof: "Evidence attached", route: "Seller Central / Customer returns / Credit", packet: "Return authorization, receiving scan, settlement line", safety: "Return was not previously claimed", next: "Await Amazon receipt", docs: ["return-auth.pdf", "receiving-scan.json", "settlement-line.csv"] },
  { type: "Removal reimbursement", title: "Carrier Count Mismatch", amount: "$824.00", detail: "The removal carrier count is below the warehouse release count and the final submission is in handoff.", meta: "Removal R-89602 · 18 units · SKU NS-OAK-SIDE-TABLE · ASIN B0D2H5K9WF", proof: "Packet assembled", route: "Seller Central / Removal reimbursement", packet: "Release record, carrier manifest, POD", safety: "Carrier route validated", next: "Monitor case receipt", docs: ["release-R89602.pdf", "manifest-R89602.csv", "pod-R89602.pdf"] },
  { type: "Damage reimbursement", title: "Transit Damage Submission", amount: "$1,116.75", detail: "The carrier damage notation and unit photographs support the filing now moving into Amazon submission.", meta: "Shipment FBA18KZ1D6R8 · 15 units · SKU NS-GLASS-LAMP · ASIN B0C4P8M2YQ", proof: "Packet assembled", route: "Seller Central / FBA inventory reimbursement / Damage", packet: "Carrier notation, photos, receiving report", safety: "Damage date within policy window", next: "Capture case number", docs: ["carrier-notation.pdf", "damage-photos.zip", "receiving-report.csv"] },
  { type: "SLA compensation", title: "Carrier Delay Filing", amount: "$263.18", detail: "The promised delivery window and carrier exception are reconciled and the compensation request is being sent.", meta: "Order 114-1058832-740 · SKU NS-WIRELESS-MOUSE · ASIN B0B9R4J6GK", proof: "Submission active", route: "Seller Central / Service level compensation", packet: "Promise timeline, carrier exception, order record", safety: "Exception timestamp verified", next: "Capture submission receipt", docs: ["promise-timeline.csv", "carrier-exception.pdf", "order-record.json"] },
  { type: "Inventory adjustment", title: "Unexplained Shrinkage Case", amount: "$755.20", detail: "A confirmed inventory reduction without a matching operational event is being filed with the supporting ledger trail.", meta: "Adjustment ADJ-78240 · 16 units · SKU NS-COAT-RACK · ASIN B0D5V1P7XC", proof: "Evidence attached", route: "Seller Central / Inventory reimbursement", packet: "Adjustment history, inventory ledger, cost basis", safety: "Duplicate event scan complete", next: "Await Amazon receipt", docs: ["adjustment-78240.csv", "inventory-ledger.csv", "cost-basis.pdf"] },
  { type: "Reimbursement error", title: "Partial Credit Correction", amount: "$196.80", detail: "Amazon returned only part of the supported amount and the correction packet is being submitted for the balance.", meta: "Case 9482716 · 4 units · SKU NS-COFFEE-SCALE · ASIN B09K2L6QTR", proof: "Packet locked", route: "Seller Central / Reimbursement review", packet: "Original case, payout record, unit-cost proof", safety: "Partial balance calculated", next: "Capture case number", docs: ["original-case.pdf", "payout-record.csv", "unit-cost-proof.pdf"] },
  { type: "Inbound shortage", title: "Receive Delta Correction", amount: "$503.28", detail: "The receiving delta and signed delivery record are attached while the inbound shortage submission completes.", meta: "Shipment FBA18VQ2A9M7 · 13 units · SKU NS-BATH-TOWEL · ASIN B0C1R6T8PL", proof: "Submission active", route: "Seller Central / FBA inventory reimbursement / Inbound", packet: "Receive delta, signed delivery, carton plan", safety: "Shipment identity verified", next: "Monitor case receipt", docs: ["receive-delta.csv", "signed-delivery.pdf", "carton-plan.csv"] },
]));

cards.filed.push(...makeAdditionalCards("RFD-167", "filed", "Under review", [
  { type: "Inbound shortage", title: "Inbound Carton Shortage", amount: "$924.36", detail: "Amazon has received the filing and the expected response window remains active.", meta: "Shipment FBA17ZK6E3H2 · 19 units · SKU NS-FOOD-CONTAINER · ASIN B0D5C1M8YR", proof: "Submitted 17 Jun", route: "Seller Central / FBA inventory reimbursement / Inbound", packet: "POD, carton plan, receive delta", safety: "Policy route verified", next: "Monitor response", docs: ["pod-FBA17ZK6E3H2.pdf", "carton-plan.csv", "receive-delta.csv"] },
  { type: "Fee overcharge", title: "Fulfillment Fee Overcharge", amount: "$318.72", detail: "The fee review is filed with the dimensional measurement and category record attached.", meta: "Settlement 204-998 · 41 units · SKU NS-TOOL-ORGANIZER · ASIN B08P4K7L2D", proof: "Submitted 16 Jun", route: "Seller Central / Fee reimbursement / Fulfillment fee", packet: "Fee preview, dimensions, settlement detail", safety: "Fee category verified", next: "Monitor response", docs: ["fee-preview.csv", "dimensions.pdf", "settlement-detail.csv"] },
  { type: "Warehouse damage", title: "Receiving Damage Record", amount: "$1,472.00", detail: "The damage filing is under Amazon review with the receiving record and unit images linked to the case.", meta: "Warehouse WHS-02 · 28 units · SKU NS-LED-DESK-LAMP · ASIN B0B7M3Q9HV", proof: "Submitted 15 Jun", route: "Seller Central / FBA inventory reimbursement / Damage", packet: "Receiving report, photos, adjustment record", safety: "Damage category confirmed", next: "Monitor response", docs: ["receiving-report.pdf", "damage-images.zip", "adjustment-record.csv"] },
  { type: "Customer return", title: "Return Inventory Credit", amount: "$412.50", detail: "The submitted record connects the return scan to the missing inventory credit.", meta: "Order 113-5810234-220 · 6 units · SKU NS-PLUSH-BLANKET · ASIN B09V6K1R8P", proof: "Submitted 13 Jun", route: "Seller Central / Customer returns / Reimbursement", packet: "Return scan, unit ledger, settlement record", safety: "Return event matched", next: "Review Amazon response", docs: ["return-scan.json", "unit-ledger.csv", "settlement-record.csv"] },
  { type: "Removal shortage", title: "Removal Shipment Missing Units", amount: "$688.40", detail: "The carrier delivery count and removal release record support the case now under review.", meta: "Removal R-87901 · 21 units · SKU NS-WOOD-SHOE-RACK · ASIN B0C8J2N6FT", proof: "Submitted 12 Jun", route: "Seller Central / Removal reimbursement", packet: "Removal release, carrier POD, inventory record", safety: "No duplicate removal filing", next: "Monitor response", docs: ["release-R87901.pdf", "carrier-pod.pdf", "inventory-record.csv"] },
  { type: "SLA compensation", title: "Delivery Promise Breach", amount: "$224.09", detail: "The service-level request is filed with the customer promise and carrier exception trail attached.", meta: "Order 112-9984210-631 · SKU NS-BLENDER-BOTTLE · ASIN B08T7L2Q4M", proof: "Submitted 11 Jun", route: "Seller Central / Service level compensation", packet: "Promise date, carrier exception, delivery scan", safety: "Order route verified", next: "Monitor response", docs: ["promise-date.csv", "carrier-exception.pdf", "delivery-scan.json"] },
  { type: "Reimbursement error", title: "Incorrect Unit Valuation", amount: "$879.60", detail: "The filed correction shows the supported cost basis against Amazon’s lower reimbursement calculation.", meta: "Case 9416802 · 12 units · SKU NS-ERGONOMIC-MAT · ASIN B0B4F8J2LK", proof: "Submitted 10 Jun", route: "Seller Central / Reimbursement review / Valuation", packet: "Original decision, invoice, cost basis", safety: "Cost basis independently matched", next: "Review Amazon response", docs: ["original-decision.pdf", "invoice-mat.pdf", "cost-basis.csv"] },
  { type: "Inventory adjustment", title: "Unmatched Adjustment", amount: "$336.00", detail: "The inventory adjustment case is filed with the account ledger and matching unit history.", meta: "Adjustment ADJ-76119 · 8 units · SKU NS-TRAVEL-CASE · ASIN B09N3P7V1C", proof: "Submitted 09 Jun", route: "Seller Central / Inventory reimbursement", packet: "Adjustment history, unit ledger, cost record", safety: "Event is not previously recovered", next: "Monitor response", docs: ["adjustment-history.csv", "unit-ledger.csv", "cost-record.pdf"] },
  { type: "Fee overcharge", title: "Referral Fee Correction", amount: "$265.18", detail: "The submitted category evidence supports a correction to the referral fee charged on the affected orders.", meta: "Settlement 204-812 · 52 units · SKU NS-PANTRY-LABELS · ASIN B08Q5R6M3X", proof: "Submitted 07 Jun", route: "Seller Central / Fee reimbursement / Referral fee", packet: "Category record, rate card, settlement detail", safety: "Category mapping verified", next: "Monitor response", docs: ["category-record.pdf", "rate-card.pdf", "settlement-detail.csv"] },
]));

cards.attention.push(...makeAdditionalCards("RFD-166", "attention", "Blocked", [
  { type: "Inbound shortage", title: "Shipment Proof Missing", amount: "$402.84", detail: "The receive delta is visible, but the signed delivery record is missing from the evidence packet.", meta: "Shipment FBA17HQ9T2M4 · 9 units · SKU NS-PLASTIC-DRAWER · ASIN B0D1K6R8WF", proof: "Missing signed delivery", route: "Seller Central / FBA inventory reimbursement", packet: "Shipment plan, receive delta, invoice", safety: "Hold until carrier proof", next: "Request carrier document", docs: ["shipment-plan.csv", "receive-delta.csv", "invoice-drawer.pdf"] },
  { type: "Customer return", title: "Return Event Conflict", amount: "$273.00", detail: "The return record and settlement activity disagree on the number of credited units.", meta: "Order 114-2206713-405 · 3 units · SKU NS-COTTON-ROBES · ASIN B0C3M9P1QK", proof: "Conflicting records", route: "Seller Central / Customer returns", packet: "Return event, settlement line, unit ledger", safety: "Do not file until reconciled", next: "Resolve mismatch", docs: ["return-event.json", "settlement-line.csv", "unit-ledger.csv"] },
  { type: "Fee overcharge", title: "Category Rate Unclear", amount: "$192.66", detail: "The rate card supports a recovery, but the historical category assignment changed during the period under review.", meta: "Settlement 205-042 · 37 units · SKU NS-COOKWARE-SET · ASIN B09F7L3M5D", proof: "Category review needed", route: "Seller Central / Fee reimbursement", packet: "Rate card, catalog history, settlement detail", safety: "Hold for category confirmation", next: "Review catalog history", docs: ["rate-card.pdf", "catalog-history.csv", "settlement-detail.csv"] },
  { type: "Warehouse damage", title: "Damage Date Outside Record", amount: "$1,018.00", detail: "The damage notation is present, but the event date needs confirmation against the receiving timeline.", meta: "Warehouse WHS-05 · 17 units · SKU NS-CERAMIC-PLANTER · ASIN B0D9Q2L5VC", proof: "Date validation needed", route: "Seller Central / FBA inventory reimbursement / Damage", packet: "Damage report, receiving record, warehouse photos", safety: "Hold until event date confirmed", next: "Validate receiving date", docs: ["damage-report.pdf", "receiving-record.csv", "warehouse-photos.zip"] },
  { type: "SLA compensation", title: "Promise Window Conflict", amount: "$337.45", detail: "The order promise date differs between the order record and the carrier timeline.", meta: "Order 113-7742088-514 · SKU NS-POWER-STRIP · ASIN B08K4P7R2H", proof: "Timeline conflict", route: "Seller Central / Service level compensation", packet: "Order record, promise timeline, carrier scans", safety: "Hold until promise date settled", next: "Reconcile timeline", docs: ["order-record.json", "promise-timeline.csv", "carrier-scans.pdf"] },
  { type: "Removal shortage", title: "Removal Route Unclear", amount: "$590.12", detail: "The warehouse release is present, but the carrier handoff route is not connected to the removal order.", meta: "Removal R-87218 · 10 units · SKU NS-STEEL-SHELF · ASIN B0C6H2M9XT", proof: "Route linkage missing", route: "Seller Central / Removal reimbursement", packet: "Removal order, release record, carrier invoice", safety: "Hold until route linked", next: "Link carrier handoff", docs: ["removal-order.pdf", "release-record.pdf", "carrier-invoice.pdf"] },
  { type: "Reimbursement error", title: "Decision Record Incomplete", amount: "$446.25", detail: "The original reimbursement decision is visible, but the underlying unit valuation attachment is missing.", meta: "Case 9374120 · 6 units · SKU NS-ALUMINUM-BOTTLE · ASIN B09R8K3L1P", proof: "Valuation attachment missing", route: "Seller Central / Reimbursement review", packet: "Original decision, settlement record, order history", safety: "Hold until valuation source found", next: "Request valuation record", docs: ["original-decision.pdf", "settlement-record.csv", "order-history.csv"] },
  { type: "Inventory adjustment", title: "Adjustment Already Offset", amount: "$281.90", detail: "The adjustment appears recoverable, but a later ledger entry may already offset part of the balance.", meta: "Adjustment ADJ-75018 · 5 units · SKU NS-LUNCH-BOX · ASIN B08P2T6V4Q", proof: "Possible offset", route: "Seller Central / Inventory reimbursement", packet: "Adjustment history, ledger, settlement report", safety: "Hold for offset review", next: "Reconcile ledger", docs: ["adjustment-history.csv", "ledger.csv", "settlement-report.csv"] },
  { type: "Inbound shortage", title: "Shipment Identity Mismatch", amount: "$615.70", detail: "The receive delta is supported, but the shipment identifier differs between the plan and carrier documentation.", meta: "Shipment FBA17RT4K6C9 · 12 units · SKU NS-ORGANIC-STORAGE · ASIN B0D3N7Q2LM", proof: "Shipment ID mismatch", route: "Seller Central / FBA inventory reimbursement / Inbound", packet: "Shipment plan, BOL, receive delta", safety: "Hold until shipment identity matched", next: "Resolve shipment identity", docs: ["shipment-plan.csv", "BOL-FBA17RT4K6C9.pdf", "receive-delta.csv"] },
]));

cards.payout.push(...makeAdditionalCards("RFD-165", "payout", "Awaiting payout", [
  { type: "Inbound shortage", title: "Inbound Credit Approved", amount: "$726.40", detail: "Amazon approved the shipment shortage; the credit has not appeared in the expected settlement period yet.", meta: "Shipment FBA17MN8Q3D1 · 15 units · SKU NS-BED-SIDE-TABLE · ASIN B0C5R1L7QH", proof: "Approved 14 Jun", route: "Settlement reconciliation / Inbound reimbursement", packet: "Approval notice, shipment report, settlement detail", safety: "Settlement period open", next: "Check next settlement", docs: ["approval-notice.pdf", "shipment-report.csv", "settlement-detail.csv"] },
  { type: "Fee reimbursement", title: "Fee Credit Pending", amount: "$181.66", detail: "The fee correction was approved and is being checked against subsequent settlement lines.", meta: "Settlement 204-621 · 68 units · SKU NS-UNDER-SINK-RACK · ASIN B08H7P2M4V", proof: "Approved 13 Jun", route: "Settlement reconciliation / Fee reimbursement", packet: "Approval notice, fee ledger, settlement report", safety: "No reversal seen", next: "Check settlement", docs: ["approval-fee.pdf", "fee-ledger.csv", "settlement-report.csv"] },
  { type: "Warehouse damage", title: "Damage Payout Partial", amount: "$1,092.30", detail: "The approved amount is present in part; Margin is reconciling the remaining balance against the payout record.", meta: "Warehouse WHS-03 · 13 units · SKU NS-FLOOR-FAN · ASIN B0B9N6K3TR", proof: "Partial payout", route: "Settlement reconciliation / Damage reimbursement", packet: "Approval record, payout line, damage report", safety: "Partial balance isolated", next: "Reconcile balance", docs: ["approval-record.pdf", "payout-line.csv", "damage-report.pdf"] },
  { type: "Customer return", title: "Return Credit Approved", amount: "$404.00", detail: "The return reimbursement is approved but remains absent from the latest seller settlement.", meta: "Order 113-8804217-339 · 8 units · SKU NS-KIDS-BACKPACK · ASIN B08V3M7Q1N", proof: "Approved 11 Jun", route: "Settlement reconciliation / Customer returns", packet: "Approval notice, return report, settlement line", safety: "Credit amount verified", next: "Check next settlement", docs: ["approval-return.pdf", "return-report.csv", "settlement-line.csv"] },
  { type: "Removal reimbursement", title: "Removal Credit Reversal Watch", amount: "$518.75", detail: "The approved removal credit is visible, with a reversal watch retained until the final settlement period closes.", meta: "Removal R-86420 · 9 units · SKU NS-BOOKCASE-SMALL · ASIN B0C4R8L2PJ", proof: "Approved 09 Jun", route: "Settlement reconciliation / Removal reimbursement", packet: "Approval notice, removal record, settlement report", safety: "Reversal watch active", next: "Monitor settlement", docs: ["approval-removal.pdf", "removal-record.pdf", "settlement-report.csv"] },
  { type: "SLA compensation", title: "Service Credit Pending", amount: "$248.90", detail: "The approved service-level compensation is being checked against the next available settlement cycle.", meta: "Order 112-7490213-882 · SKU NS-LAPTOP-STAND · ASIN B09C6P2R8M", proof: "Approved 08 Jun", route: "Settlement reconciliation / SLA compensation", packet: "Approval notice, order timeline, payout record", safety: "Order outcome verified", next: "Check settlement", docs: ["approval-sla.pdf", "order-timeline.csv", "payout-record.csv"] },
  { type: "Reimbursement error", title: "Valuation Correction Pending", amount: "$963.40", detail: "The corrected reimbursement was approved; the expected balance has not yet matched the settlement feed.", meta: "Case 9287164 · 11 units · SKU NS-WATER-FILTER · ASIN B0B7L4K2QX", proof: "Approved 07 Jun", route: "Settlement reconciliation / Valuation correction", packet: "Correction approval, cost basis, settlement line", safety: "Balance independently calculated", next: "Reconcile balance", docs: ["correction-approval.pdf", "cost-basis.csv", "settlement-line.csv"] },
  { type: "Inventory adjustment", title: "Adjustment Credit Not Matched", amount: "$376.20", detail: "The inventory adjustment recovery is approved and waiting for a matching credit in the seller account.", meta: "Adjustment ADJ-73190 · 7 units · SKU NS-DESK-TRAY · ASIN B08Q2M6V9T", proof: "Approved 05 Jun", route: "Settlement reconciliation / Inventory adjustment", packet: "Approval notice, adjustment history, ledger", safety: "Credit amount verified", next: "Check next settlement", docs: ["approval-adjustment.pdf", "adjustment-history.csv", "ledger.csv"] },
  { type: "Fee overcharge", title: "Storage Fee Credit Pending", amount: "$229.88", detail: "The storage fee recovery is approved while Margin watches for the credit to appear without a reversal.", meta: "Settlement 204-390 · 204 units · SKU NS-FOAM-MATTRESS · ASIN B0C8K1P4LR", proof: "Approved 03 Jun", route: "Settlement reconciliation / Storage fee", packet: "Approval notice, storage report, fee ledger", safety: "Reversal watch active", next: "Monitor settlement", docs: ["approval-storage.pdf", "storage-report.csv", "fee-ledger.csv"] },
]));

cards.resolved.push(...makeAdditionalCards("RFD-164", "resolved", "Recovered", [
  { type: "Inbound shortage", title: "Shipment Shortage Recovered", amount: "$684.00", detail: "The approved inbound shortage was matched to the settlement and the recovery record was closed.", meta: "Shipment FBA16GH4P8N2 · 12 units · SKU NS-DESK-LAMP · ASIN B08M3Q7R1V", proof: "Paid 04 Jun", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Approval notice, settlement line, payout record", safety: "Final balance verified", next: "Record closed", docs: ["approval-inbound.pdf", "settlement-line.csv", "payout-record.csv"] },
  { type: "Warehouse damage", title: "Damage Claim Recovered", amount: "$1,105.80", detail: "The damaged inventory credit was received in full and matched to the original warehouse event.", meta: "Warehouse WHS-01 · 16 units · SKU NS-CAST-IRON-PAN · ASIN B09D6K2M8P", proof: "Paid 02 Jun", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Approval notice, damage report, payout record", safety: "No reversal detected", next: "Record closed", docs: ["approval-damage.pdf", "damage-report.pdf", "payout-record.csv"] },
  { type: "Fee overcharge", title: "Fulfillment Fee Recovered", amount: "$288.44", detail: "The fee correction was paid and reconciled against the affected settlement period.", meta: "Settlement 203-884 · 73 units · SKU NS-TRAVEL-CUBE · ASIN B08R4L7Q2H", proof: "Paid 30 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Approval notice, fee detail, settlement line", safety: "Final balance verified", next: "Record closed", docs: ["approval-fee.pdf", "fee-detail.csv", "settlement-line.csv"] },
  { type: "Customer return", title: "Return Credit Recovered", amount: "$362.25", detail: "The customer return credit arrived and the return event, settlement line, and payout now agree.", meta: "Order 113-4417082-527 · 5 units · SKU NS-KITCHEN-TOWEL · ASIN B09P7M3Q5L", proof: "Paid 28 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Return report, approval notice, payout record", safety: "Return balance closed", next: "Record closed", docs: ["return-report.csv", "approval-return.pdf", "payout-record.csv"] },
  { type: "Removal reimbursement", title: "Removal Variance Recovered", amount: "$744.80", detail: "The removal variance payment was matched to the approved unit count and marked complete.", meta: "Removal R-84112 · 13 units · SKU NS-BED-FRAME · ASIN B0B2N8K4TX", proof: "Paid 26 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Removal record, approval notice, settlement line", safety: "No reversal detected", next: "Record closed", docs: ["removal-record.pdf", "approval-removal.pdf", "settlement-line.csv"] },
  { type: "SLA compensation", title: "Late Delivery Credit Recovered", amount: "$219.60", detail: "The service-level credit was received and verified against the carrier timeline.", meta: "Order 112-6389201-774 · SKU NS-MONITOR-STAND · ASIN B08K5R2P7M", proof: "Paid 23 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Approval notice, carrier timeline, payout record", safety: "Final balance verified", next: "Record closed", docs: ["approval-sla.pdf", "carrier-timeline.csv", "payout-record.csv"] },
  { type: "Reimbursement error", title: "Unit Value Correction Recovered", amount: "$856.15", detail: "The approved unit valuation correction was paid and reconciled to the original decision.", meta: "Case 9116384 · 10 units · SKU NS-AIR-PURIFIER-FILTER · ASIN B09H4L8Q2C", proof: "Paid 19 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Correction decision, invoice, payout record", safety: "Value correction closed", next: "Record closed", docs: ["correction-decision.pdf", "invoice-filter.pdf", "payout-record.csv"] },
  { type: "Inventory adjustment", title: "Inventory Shrinkage Recovered", amount: "$432.00", detail: "The unmatched inventory adjustment was credited and the account ledger now reconciles.", meta: "Adjustment ADJ-70211 · 8 units · SKU NS-ENTRYWAY-HOOKS · ASIN B08L6P3R9V", proof: "Paid 16 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "Adjustment history, approval notice, ledger", safety: "Ledger fully reconciled", next: "Record closed", docs: ["adjustment-history.csv", "approval-adjustment.pdf", "ledger.csv"] },
  { type: "Inbound shortage", title: "Carton Count Recovered", amount: "$598.32", detail: "The carton shortage credit was received and matched to the signed delivery and shipment plan.", meta: "Shipment FBA15KL7M2Q9 · 14 units · SKU NS-LAUNDRY-BASKET · ASIN B0C1V8M4QK", proof: "Paid 12 May", route: "Settlement reconciliation / Confirmed reimbursement", packet: "POD, shipment plan, settlement line", safety: "Final balance verified", next: "Record closed", docs: ["pod-FBA15KL7M2Q9.pdf", "shipment-plan.csv", "settlement-line.csv"] },
]));

  const analysisItems = [
    { kind: 'paragraph', text: 'Coverage established across 124,860 orders, 1,842 shipments, 7,630 returns, 31,940 fee records, and 28,600 inventory movements across 8 settlement periods.', highlight: 'yellow' },
    { kind: 'paragraph', text: 'The operating population spans 4 marketplaces and 3 legal entities, with 1,126 affected records across 318 SKUs.', highlight: 'blue' },
    { kind: 'paragraph', text: 'This is not one bounded event. The records establish a portfolio-level control position.', highlight: 'green' },
    { kind: 'heading', text: 'Financial pattern' },
    { kind: 'heading', text: 'Portfolio-level finding' },
    { kind: 'paragraph', text: 'Inbound receiving variances recur across multiple settlement periods and marketplaces. The population requires event-level entitlement, evidence testing, settlement reconciliation, and entity attribution before recovery treatment is determined.', highlight: 'purple' },
    { kind: 'list', text: '10 March 2026 — 17 affected units across two related shipments; the receiving and inventory records diverge after the same supplier delivery', highlight: 'blue' },
    { kind: 'list', text: '24 March 2026 — 9 affected units across one shipment; the settlement record does not reconcile to the receiving quantity', highlight: 'green' },
    { kind: 'list', text: '9 April and 22 April 2026 — 11 affected units across two shipments; settlement attribution remains unresolved', highlight: 'purple' },
    { kind: 'paragraph', text: 'The Audit separates independent financial events from duplicate records, recurring control failures, and already-accounted-for activity.' },
    { kind: 'heading', text: 'What this means for the operation' },
    { kind: 'paragraph', text: 'A single recovery workflow can address one supported event. It does not establish whether the same control failure is recurring across the account.' },
    { kind: 'paragraph', text: 'Margin distinguishes an isolated event from a repeated exposure pattern, then connects the pattern to the relevant marketplace, entity, settlement period, and evidence population.' },
    { kind: 'final', text: 'The Audit determines whether the business needs a defined recovery, recurring examination, or an enterprise control boundary.', highlight: 'blue' },
    { kind: 'heading', text: 'Evidence and control position' },
    { kind: 'paragraph', text: 'Margin has separated the reviewed population into supported, partially supported, settlement-pending, and unresolved positions. Supported records can move to controlled preparation; positions without sufficient evidence remain visible but are not counted as recoverable.' },
    { kind: 'paragraph', text: 'Current control population:', highlight: 'green' },
    { kind: 'paragraph', text: '$184,200 indicated exposure · $88,200 evidence-ready · $96,000 requiring evidence or settlement review · 14 source gaps requiring additional documentation.' },
    { kind: 'paragraph', text: 'Unverified conditions remain unresolved — they are not counted as recovered, recoverable, or cleared.' },
  ];

function FastDuplicateTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      onCompleteRef.current?.();
      return;
    }
    setVisibleText('');
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          if (interval) window.clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, 1);
    }, 70);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);

  return <>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</>;
}

function EvidenceAnalysisPanel({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(0);
  const highlightClasses: Record<string, string> = { yellow: 'bg-[#FFF1A8]', blue: 'bg-[#DDEBFF]', green: 'bg-[#DDF4E5]', purple: 'bg-[#E9DEFF]' };
  const analysisComplete = reduceMotion || activeItem >= analysisItems.length;
  useEffect(() => {
    if (analysisComplete) onComplete();
  }, [analysisComplete, onComplete]);
  const advance = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveItem((current) => current + 1), 80);
  };
  const analysisColumns = [analysisItems.slice(0, 9), analysisItems.slice(9)];
  const renderAnalysisItem = (item: typeof analysisItems[number], index: number) => {
    const visible = reduceMotion || index <= activeItem;
    const active = reduceMotion || index === activeItem;
    const typedContent = reduceMotion ? item.text : active ? <FastDuplicateTypewriter text={item.text} onComplete={advance} /> : index < activeItem ? item.text : null;
    const highlightComplete = reduceMotion || index < activeItem;
    const itemClass = item.kind === 'heading'
      ? 'mt-2 font-google-sans text-[11.25px] leading-tight tracking-[-0.02em] text-[#191B20]'
      : item.kind === 'final'
        ? 'mt-2 text-[10.5px] leading-[1.5rem] text-[#191B20]'
        : item.kind === 'list'
          ? 'flex items-baseline gap-2 text-[10.5px] leading-[1.5rem] text-[#595E68]'
          : 'text-[10.5px] leading-[1.5rem] text-[#595E68]';
    return <motion.div key={`${item.text}-${index}`} initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }} className={itemClass}>
      {item.kind === 'list' ? <span className="text-[#8A99A3]">•</span> : null}
      {item.highlight ? <mark className={`rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] ${highlightComplete ? highlightClasses[item.highlight] : 'bg-transparent'}`}>{typedContent}</mark> : typedContent}
    </motion.div>;
  };

  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white px-1 py-1 sm:px-2">
    <header className="pb-2.5"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] bg-[#F1F2F2] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Illustrative audit population · decision-grade account position</mark></p><h2 className="mt-1.5 max-w-2xl font-google-sans text-[15px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[18px]">The analysis establishes the account&apos;s operating position</h2></header>
    <section className="py-1" aria-live="polite"><div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">{analysisColumns.map((column, columnIndex) => <div key={columnIndex} className="min-w-0 space-y-1">{column.map((item, itemIndex) => renderAnalysisItem(item, columnIndex === 0 ? itemIndex : itemIndex + 9))}</div>)}</div></section>
    <p className="mt-2 text-[8px] leading-3 font-medium tracking-tight text-[#8A99A5]">{analysisComplete ? 'Analysis complete · loading the governed case positions next.' : 'Margin is reading the supplied account position and separating supported evidence from unresolved signal.'}</p>
  </motion.div>;
}

const intakeDocuments = [
  { type: 'PDF', name: 'Settlement reconciliation schedule · Apr 2026', source: 'Settlement file · payout activity', iconSrc: '/onedriive.png', iconAlt: 'OneDrive' },
  { type: 'CSV', name: 'Inbound receiving variance population · ONT8', source: 'Amazon SP-API · 60 dispatched / 46 received', iconSrc: '/onedriive.png', iconAlt: 'OneDrive' },
  { type: 'MAIL', name: 'Reimbursement case correspondence · REC-2026-004817', source: 'Gmail thread · case response and evidence request', iconSrc: '/gmailicon.png', iconAlt: 'Gmail' },
  { type: 'XLS', name: 'Inventory valuation and movement schedule · FY2026 Q1', source: 'NetSuite export · SKU and unit-level activity', iconSrc: '/gd.png', iconAlt: 'Google Drive' },
];

const intakeSources = [
  { name: 'Amazon', iconSrc: '/amazon-logo-transparent-circle.png', iconAlt: 'Amazon' },
  { name: 'Settlement', iconSrc: '/gd.png', iconAlt: 'Google Drive' },
  { name: 'Gmail', iconSrc: '/gmailicon.png', iconAlt: 'Gmail' },
  { name: 'NetSuite', iconSrc: '/onedriive.png', iconAlt: 'OneDrive' },
  { name: 'S3 / SFTP', iconSrc: '/Dropbox_Icon.svg.png', iconAlt: 'Dropbox' },
  { name: 'Carrier', iconSrc: '/outlookicon.webp', iconAlt: 'Outlook' },
  { name: 'Orders', iconSrc: '/amazon-logo-transparent-circle.png', iconAlt: 'Amazon' },
  { name: 'Inventory ledger', iconSrc: '/onedriive.png', iconAlt: 'OneDrive' },
  { name: 'Returns', iconSrc: '/gmailicon.png', iconAlt: 'Gmail' },
  { name: 'Fees', iconSrc: '/gd.png', iconAlt: 'Google Drive' },
  { name: 'Supplier docs', iconSrc: '/Dropbox_Icon.svg.png', iconAlt: 'Dropbox' },
  { name: 'Payouts', iconSrc: '/outlookicon.webp', iconAlt: 'Outlook' },
];

function documentVariant(document: string) {
  const score = Array.from(document).reduce((total, character) => total + character.charCodeAt(0), 0) % 7;
  return ['pdf', 'csv', 'image', 'spreadsheet', 'document', 'email', 'table'][score];
}

function DocumentMark({ document }: { document: string }) {
  const variant = documentVariant(document);
  if (variant === 'csv') return <img src="/excel-icon-margin.png" alt="CSV" className="h-4 w-4 shrink-0 object-contain" />;
  if (variant === 'spreadsheet') return <img src="/excel-icon-margin.png" alt="Spreadsheet" className="h-4 w-4 shrink-0 object-contain" />;
  if (variant === 'image') return <img src="/gd.png" alt="Google Drive" className="h-4 w-4 shrink-0 rounded-[3px] object-contain" />;
  if (variant === 'email') return <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 shrink-0 rounded-[3px] object-contain" />;
  if (variant === 'table') return <img src="/gd.png" alt="Google Drive" className="h-4 w-4 shrink-0 rounded-[3px] object-contain" />;
  if (variant === 'document') return <img src="/onedriive.png" alt="OneDrive" className="h-4 w-4 shrink-0 rounded-[3px] object-contain" />;
  return <img src="/pdf-file-icon.webp" alt="PDF" className="h-4 w-4 shrink-0 object-contain" />;
}

const evidenceRegisterProviderIcons = [
  { src: '/onedriive.png', alt: 'OneDrive' },
  { src: '/onedriive.png', alt: 'OneDrive' },
  { src: '/gmailicon.png', alt: 'Gmail' },
  { src: '/gd.png', alt: 'Google Drive' },
];

function EvidenceRegisterMark({ document, index }: { document: string; index: number }) {
  const providerIcon = evidenceRegisterProviderIcons[index];
  if (providerIcon) return <img src={providerIcon.src} alt={providerIcon.alt} className="h-4 w-4 shrink-0 rounded-[3px] object-contain" />;
  return <DocumentMark document={document} />;
}

function enterpriseDocumentName(document: string) {
  const extension = document.split('.').pop()?.toUpperCase() || 'RECORD';
  const stem = document.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `${stem} · ${extension}`;
}

const evidenceRegister = [
  { name: 'FBA inbound shipment plan', type: 'CSV', highlight: ['shipment plan', 'declared units'], description: 'Planned carton count, destination FC, SKU mix, and declared units for the inbound movement.' },
  { name: 'Carrier proof of delivery record', type: 'PDF', highlight: ['proof of delivery', 'carrier'], description: 'Signed delivery evidence used to test the handoff between the carrier and fulfilment centre.' },
  { name: 'Receiving discrepancy report', type: 'CSV', highlight: ['quantity variance', 'received units'], description: 'Amazon-recognized quantity variance between dispatched, delivered, and received units.' },
  { name: 'FBA inventory adjustment ledger', type: 'CSV', highlight: ['inventory adjustment', 'Unit-level'], description: 'Unit-level adjustments showing when inventory moved, changed state, or left the ledger.' },
  { name: 'Fulfilment centre transfer manifest', type: 'PDF', highlight: ['transfer manifest', 'carton identifiers'], description: 'Internal transfer routing, carton identifiers, and fulfilment-centre movement history.' },
  { name: 'Removal order reconciliation', type: 'XLS', highlight: ['removal activity', 'credited units'], description: 'Requested, shipped, and credited units for removal activity requiring financial reconciliation.' },
  { name: 'Customer return disposition report', type: 'CSV', highlight: ['return receipt', 'reimbursement state'], description: 'Return receipt, condition, disposition, and reimbursement state for returned customer units.' },
  { name: 'Reimbursement case correspondence', type: 'MAIL', highlight: ['requested evidence', 'unresolved case'], description: 'Amazon response history, requested evidence, submission events, and unresolved case language.' },
  { name: 'Settlement transaction detail', type: 'CSV', highlight: ['Payout lines', 'reversals'], description: 'Payout lines, fees, reimbursements, reversals, and adjustments across the relevant settlement period.' },
  { name: 'Fee assessment schedule', type: 'XLS', highlight: ['storage', 'service fees'], description: 'Fulfilment, storage, referral, and service fees matched to the affected order or inventory event.' },
  { name: 'Amazon reimbursement approval notice', type: 'PDF', highlight: ['Approved amount', 'decision date'], description: 'Approved amount, case reference, decision date, and the conditions attached to the reimbursement.' },
  { name: 'Account health and performance extract', type: 'CSV', highlight: ['isolated recovery', 'recurring account'], description: 'Operational context used to separate isolated recovery events from recurring account exposure.' },
  { name: 'SKU cost basis schedule', type: 'XLS', highlight: ['unit economics', 'materiality'], description: 'Entity-specific unit economics used to test valuation, entitlement, and materiality.' },
  { name: 'Marketplace order population', type: 'CSV', highlight: ['Order identifiers', 'financial state'], description: 'Order identifiers, marketplace, dates, quantities, and financial state across the reviewed scope.' },
  { name: 'Inventory ageing and disposition file', type: 'CSV', highlight: ['disposition indicators', 'operational review'], description: 'Age, location, condition, and disposition indicators for units under operational review.' },
  { name: 'Payout reconciliation workbook', type: 'XLS', highlight: ['cleared amounts', 'bank-recognized'], description: 'Expected, reported, and cleared amounts tied back to settlement and bank-recognized activity.' },
  { name: 'Supplier and commercial invoice pack', type: 'PDF', highlight: ['ownership', 'recoverable basis'], description: 'Source documentation supporting ownership, unit value, supplier relationship, and recoverable basis.' },
];

function HighlightedDescription({ description, highlight, highlightComplete = true }: { description: string; highlight: string | string[]; highlightComplete?: boolean }) {
  const highlights = (Array.isArray(highlight) ? highlight : [highlight])
    .map((value) => ({ value, start: description.indexOf(value) }))
    .filter(({ start }) => start >= 0)
    .sort((a, b) => a.start - b.start);
  if (!highlights.length) return <>{description}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  highlights.forEach(({ value, start }, index) => {
    if (start < cursor) return;
    if (start > cursor) parts.push(description.slice(cursor, start));
    parts.push(<mark key={`${value}-${index}`} data-evidence-highlight="true" style={{ backgroundColor: highlightComplete ? '#DDEEFF' : 'transparent', color: '#1E5878', textDecorationColor: '#7DB6D2' }} className="rounded-[2px] px-0.5 font-bold underline decoration-1 underline-offset-2">{value}</mark>);
    cursor = start + value.length;
  });
  if (cursor < description.length) parts.push(description.slice(cursor));
  return <>{parts}</>;
}

function EvidenceRegisterStage({ workspaceMode = false }: { workspaceMode?: boolean }) {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className={workspaceMode ? "px-0 pb-5" : "px-5 pb-5 sm:px-6"}>
    <div className={workspaceMode ? "rounded-none border-0 bg-transparent p-0" : "rounded-[10px] border border-[#D8E3E8] bg-white p-4 sm:p-5"}>
      <div className={workspaceMode ? "flex items-end justify-between gap-4 pb-3" : "flex items-end justify-between gap-4 border-b border-[#E3ECEF] pb-3"}><div><p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Evidence register</p><h2 className="mt-1 text-[16px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[18px]">Source records assembled for review</h2></div><span className="text-[10px] font-semibold tracking-tight text-[#527284]">17 records linked</span></div>
      <div className={workspaceMode ? "" : "divide-y divide-[#E8EFF1]"}>
        {evidenceRegister.map((document, index) => <motion.div key={document.name} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.055, duration: 0.25 }} className="flex items-start gap-3 py-3 first:pt-4 last:pb-1"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-[#F1F6F8]"><EvidenceRegisterMark document={`${document.name}.${document.type.toLowerCase()}`} index={index} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold tracking-tight text-[#36404A]">{document.name}</p><p className="mt-0.5 text-[10px] leading-4 tracking-tight text-[#66737F]"><HighlightedDescription description={document.description} highlight={document.highlight} /></p></div><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#26704E]" strokeWidth={2.5} /></motion.div>)}
      </div>
    </div>
  </motion.div>;
}

const artifactAnalysisItems = [
  {
    highlight: ['separates independent financial events', 'duplicate records', 'recurring control failures'],
    text: 'The Audit separates independent financial events from duplicate records, recurring control failures, and activity already accounted for. Margin connected the inbound shipment plan, carrier proof of delivery, Amazon receiving records, settlement schedule, inventory ledger, and reimbursement correspondence so the reviewed population can be assessed as a governed operating position rather than a loose collection of files.',
  },
  {
    highlight: ['single recovery workflow', 'recurring exposure pattern', 'event-level entitlement'],
    text: 'A single recovery workflow can address one supported event, but it does not establish whether the same control failure is recurring across the account. Margin distinguishes an isolated event from a repeated exposure pattern, then connects that pattern to the relevant marketplace, legal entity, settlement period, and evidence population before any recovery position is treated as supportable.',
  },
  {
    highlight: ['governed recovery cohort', 'duplicate credit', 'controlled preparation'],
    text: 'The evidence is sufficient to form a governed recovery cohort. Margin linked the source records, tested the receiving variance against the related financial events, checked for duplicate credit, and separated supported exposure from positions that still require confirmation. The resulting position is ready for controlled preparation and review before any filing or seller action.',
  },
  {
    highlight: ['account-level control position', 'supported exposure', 'unresolved positions'],
    text: 'The resulting record is an account-level control position, not a one-off answer to a single discrepancy. Supported exposure can move into a governed review queue, while unresolved positions remain visible with their evidence gaps, ownership, and next required action clearly separated from recoverable value.',
  },
  {
    highlight: ['decision-grade record', 'nothing submits until approved', 'next controlled action'],
    text: 'The final position is a decision-grade record: the evidence is connected, the financial exposure is bounded, and the remaining uncertainty is named rather than hidden. Nothing submits until approved; the operation can now move from reconstruction to the next controlled action with the record intact.',
  },
] as const;

const artifactAnalysisChecks = [
  ['Event identity resolved', 'Shipment, SKU, ASIN, receiving node, carrier movement, and settlement period resolve to one canonical financial event.'],
  ['Expected versus received reconciled', '2,416 units were expected; 2,352 were received. The 64-unit variance remains open after the receiving window closed.'],
  ['Cross-system evidence agrees', 'Carrier delivery, 3PL intake, and Amazon receiving records support the same delivery window and custody trail.'],
  ['Offsets and timing noise excluded', 'Inventory adjustments, duplicate lines, and subsequent settlement activity do not clear or duplicate the variance.'],
  ['Materiality and ownership assessed', 'Supported exposure is $4,144.00 at a verified $64.75 unit cost; Finance Operations owns the decision.'],
  ['Decision package ready', 'The supported exposure is separated from unresolved items and ready for the next controlled action.'],
] as const;

function ArtifactAnalysisStage({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(0);
  const analysisComplete = reduceMotion || activeItem >= artifactAnalysisItems.length;

  useEffect(() => {
    if (!analysisComplete) return;
    const completionTimer = window.setTimeout(onComplete, reduceMotion ? 3200 : ARTIFACT_ANALYSIS_DWELL_MS);
    return () => window.clearTimeout(completionTimer);
  }, [analysisComplete, onComplete, reduceMotion]);

  const advance = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveItem((current) => Math.min(current + 1, artifactAnalysisItems.length)), 80);
  };

  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="px-5 pb-5 sm:px-6">
    <div className="bg-white py-1 sm:py-2">
      <div className="max-w-[980px]">
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Artifact analysis</p>
        <h2 className="mt-1 font-google-sans text-[18px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[22px]">What the assembled record establishes</h2>
        <p className="mt-1 text-[11px] leading-5 tracking-tight text-[#66737F]">Margin is reading the connected artifacts before presenting a governed position for review.</p>
      </div>
      <div className="mt-5 max-w-[980px] space-y-5" aria-live="polite" aria-atomic="false">
        {artifactAnalysisItems.map((item, index) => {
          const visible = reduceMotion || index <= activeItem;
          const active = !reduceMotion && index === activeItem;
          const content = reduceMotion || index < activeItem ? item.text : active ? <FastDuplicateTypewriter text={item.text} onComplete={advance} /> : null;
          return <motion.p key={item.text} initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8, height: visible ? 'auto' : 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden text-[12px] leading-6 tracking-tight text-[#595E68] sm:text-[13px] sm:leading-7"><HighlightedDescription description={typeof content === 'string' ? content : item.text.slice(0, 0)} highlight={item.highlight} highlightComplete={reduceMotion || index < activeItem} />{typeof content === 'string' ? null : content}</motion.p>;
        })}
      </div>
      <motion.div initial={false} animate={analysisComplete ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 8, height: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-7 max-w-[980px] overflow-hidden" aria-live="polite">
        <p className="mb-3 text-[11px] font-medium tracking-tight text-[#182026]">What the reconciliation establishes</p>
        <div className="space-y-3">
          {artifactAnalysisChecks.map(([title, detail], index) => <motion.div key={title} initial={{ opacity: 0, y: 8 }} animate={analysisComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ delay: index * 0.09, duration: 0.34, ease: [0.22, 1, 0.36, 1] }} className="flex items-start gap-2 text-[#182026]"><span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#16866B] text-white" aria-hidden="true"><Check className="h-2 w-2" strokeWidth={3} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold leading-3.5 tracking-tight text-[#182026]">{title}</span><span className="mt-0.5 block text-[9px] leading-3.5 text-[#4D5B66]">{detail}</span></span></motion.div>)}
        </div>
      </motion.div>
      <p className="mt-6 max-w-[980px] text-[10px] font-medium tracking-tight text-[#8A99A5]">{analysisComplete ? 'Artifact analysis complete · loading governed positions next.' : 'Margin is connecting source artifacts and separating supported evidence from unresolved signal.'}</p>
    </div>
  </motion.div>;
}

function EvidenceIntakeStage({ stage }: { stage: 'dropzone' | 'documents' }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="px-5 py-5 sm:px-6">
      <div className="rounded-[10px] border border-[#D8E3E8] bg-[#FBFCFD] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Evidence intake</p>
            <h2 className="mt-1 font-google-sans text-[16px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[18px]">Assembling the operating record</h2>
            <p className="mt-1 text-[11px] leading-5 tracking-tight text-[#66737F]">Margin is gathering the source records needed to establish each financial position.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#EAF5F9] px-2.5 py-1 text-[9px] font-semibold tracking-tight text-[#2D6178]">Read-only intake</span>
        </div>
        <div className="relative mt-5 min-h-[222px] overflow-hidden rounded-[8px] border border-dashed border-[#AFC8D4] bg-white px-4 py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(220,236,242,0.72),transparent_48%)]" />
          <div className="relative flex min-h-[174px] items-center justify-center">
            <div className="relative flex h-[142px] w-[min(100%,420px)] items-center justify-center rounded-[8px] border border-[#C8DCE5] bg-[#F7FBFC] shadow-[0_12px_30px_rgba(37,73,91,0.08)]">
              <div className="text-center">
                <Files className="mx-auto h-7 w-7 text-[#6E9DB1]" strokeWidth={1.35} />
                <p className="mt-2 text-[13px] font-semibold tracking-tight text-[#36404A]">Drop records for review</p>
                <p className="mt-1 text-[10px] tracking-tight text-[#8A99A5]">Margin is connecting source files to the operating event.</p>
              </div>
              {[...intakeSources, ...intakeSources].map((source, index) => (
                <motion.span
                  key={`${source.name}-${index}`}
                  initial={reduceMotion ? { opacity: 0.75, scale: 0.82 } : { opacity: 0, x: (index % 2 ? 1 : -1) * (118 + (index % 6) * 24), y: index % 2 ? -118 - (index % 4) * 10 : 116 + (index % 4) * 10, scale: 0.76 }}
                  animate={stage === 'dropzone' ? { opacity: 0.92, x: 0, y: 0, scale: 0.84 } : { opacity: 0.28, x: 0, y: 0, scale: 0.68 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: index * 0.12, duration: 2.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-1/2 flex h-14 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-[5px] border border-[#C8DCE5] bg-white px-4 text-[11px] font-semibold tracking-tight text-[#527284] shadow-[0_10px_22px_rgba(37,73,91,0.16)]"
                >
                  <img src={source.iconSrc} alt={source.iconAlt} className="h-5 w-5 shrink-0 rounded-[3px] object-contain" />
                  <span>{source.name}</span>
                </motion.span>
              ))}
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: stage === 'dropzone' ? 1 : 0.78, scale: 1 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.65, duration: 0.35 }}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#111827] text-[10px] font-semibold tracking-tight text-white shadow-[0_6px_14px_rgba(17,24,39,0.18)]"
              >
                +39
              </motion.span>
            </div>
          </div>
          {stage === 'documents' ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative mt-3 border-t border-[#E3ECEF] pt-3">
              <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold tracking-tight text-[#36404A]">Ingested documents</p><span className="text-[9px] font-medium tracking-tight text-[#7B8A97]">4 records linked</span></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {intakeDocuments.map((document, index) => <motion.div key={document.name} initial={{ opacity: 0, y: 8, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.08 + index * 0.1, duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex min-w-0 items-center gap-2 rounded-[6px] border border-[#E0E9EC] bg-white px-2.5 py-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-[#EEF5F7]"><img src={document.iconSrc} alt={document.iconAlt} className="h-4 w-4 rounded-[3px] object-contain" /></span><span className="min-w-0"><span className="block truncate text-[10px] font-semibold tracking-tight text-[#36404A]">{document.name}</span><span className="mt-0.5 block truncate text-[9px] tracking-tight text-[#8A99A5]">{document.source}</span></span><Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#26704E]" strokeWidth={2.5} /></motion.div>)}
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function TeamHandoffStage() {
  const reduceMotion = useReducedMotion();
  const handoffMessages = [
    { role: 'Finance Operations', subject: 'Cost basis confirmed', preview: 'Unit value agrees with the attached valuation schedule.', avatar: '/recovery-finance-avatar.png', highlight: 'bg-[#F7E7CF]' },
    { role: 'Fulfilment Operations', subject: 'Warehouse event matched', preview: 'Receiving and carrier records resolve to the same event.', avatar: '/recovery-operations-avatar.png', highlight: 'bg-[#DDEBFF]' },
    { role: 'Recovery Owner', subject: 'Approved for filing', preview: 'Evidence is sufficient for the next controlled action.', avatar: '/recovery-owner-avatar.png', highlight: 'bg-[#DDF4E5]' },
  ];

  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="px-5 pb-5 sm:px-6">
    <div className="bg-[#F7FAFB] px-4 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <img src="/slack-icon-2019.png" alt="Slack" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Illustrative team handoff</p>
            <h2 className="mt-1 font-google-sans text-[16px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[18px]">The recovery now has an owner</h2>
            <p className="mt-1 max-w-[680px] text-[11px] leading-5 tracking-tight text-[#66737F]">A focused decision thread for the supported position.</p>
          </div>
        </div>
        <span className="hidden shrink-0 text-[10px] font-medium tracking-tight text-[#8A99A5] sm:block">Focused · Just now</span>
      </div>

      <div className="mt-6 max-w-[760px] space-y-5" aria-live="polite">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : 0.16, duration: 0.35 }} className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#182026] shadow-[0_3px_8px_rgba(24,32,38,0.12)]"><img src="/slack-icon-2019.png" alt="Margin team handoff" className="h-4 w-4 object-contain brightness-0 invert" /></span>
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-semibold tracking-tight text-[#7B8A97]">Margin <span className="ml-1 font-normal text-[#A0AAB0]">just now</span></p>
            <p className="mt-1 text-[12px] font-semibold leading-5 tracking-tight text-[#182026]"><mark className="rounded-[3px] bg-[#DDEBFF] px-1 py-0.5 font-semibold text-[#1E5878]">Supported recovery position · $1,284.60</mark></p>
            <p className="mt-1 text-[11px] leading-5 tracking-tight text-[#66737F]">Evidence attached · no duplicate credit found · seller approval required</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-medium tracking-tight text-[#66737F]"><span className="rounded-full bg-white px-2 py-1">Receiving record</span><span className="rounded-full bg-white px-2 py-1">Cost basis</span><span className="rounded-full bg-white px-2 py-1">Settlement line</span></div>
          </div>
        </motion.div>

        {handoffMessages.map((message, index) => <motion.div key={message.role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.48 + index * 0.2, duration: 0.32 }} className="flex items-start gap-3">
          <img src={message.avatar} alt={`${message.role} participant`} className="h-8 w-8 shrink-0 rounded-full object-cover shadow-[0_3px_8px_rgba(24,32,38,0.1)]" />
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-semibold tracking-tight text-[#7B8A97]">{message.role} <span className="ml-1 font-normal text-[#A0AAB0]">in recovery handoff</span></p>
            <p className="mt-1 text-[12px] font-semibold leading-5 tracking-tight text-[#182026]"><mark className={`rounded-[3px] px-1 py-0.5 font-semibold text-[#36404A] ${message.highlight}`}>{message.subject}</mark></p>
            <p className="mt-1 text-[11px] leading-5 tracking-tight text-[#66737F]">{message.preview}</p>
          </div>
        </motion.div>)}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduceMotion ? 0 : 1.12, duration: 0.3 }} className="mt-6 flex items-center gap-2 text-[10px] font-medium tracking-tight text-[#26704E]"><span className="h-1.5 w-1.5 rounded-full bg-[#26704E]" />Decision recorded · Owner assigned</motion.p>
    </div>
  </motion.div>;
}
function AmazonCorrespondenceStage() {
  const reduceMotion = useReducedMotion();
  const messages = [
    { direction: 'Inbound', state: 'Evidence request · Residual position only', subject: '[Case 19822888381] Additional evidence required for residual $12,850', sender: 'Amazon Selling Partner Support', body: 'Amazon requested proof connecting the shipment variance, unit value, and settlement detail to the governed recovery record.', attachments: ['Carrier delivery record', 'Valuation basis', 'Settlement detail'], tone: 'bg-[#F5F8FC]' },
    { direction: 'Outbound', state: 'Targeted residual response · Approval required', subject: '[Case 19822888381] Residual evidence response prepared', sender: 'Margin · evidence response owner', body: 'Margin mapped the request to the existing event record instead of restarting the investigation. The accepted evidence remains attached.', attachments: ['Residual evidence map', 'Approval record', 'Response draft'], tone: 'bg-[#F4FAF6]' },
  ];

  return <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} aria-labelledby="amazon-correspondence-title" className="mt-8 bg-[#FBFAF7] px-5 py-6 sm:px-6 sm:py-8">
    <div className="flex items-start gap-3">
      <img src="/gmailicon.png" alt="Gmail" className="mt-0.5 h-6 w-6 shrink-0 object-contain" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#7B8A97]">Amazon correspondence · illustrative</p>
        <h2 id="amazon-correspondence-title" className="mt-1 font-google-sans text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[21px]">The response updates the recovery record</h2>
        <p className="mt-1 max-w-[720px] text-[11px] leading-5 tracking-tight text-[#66737F]">The thread is not the record. It updates the record.</p>
      </div>
    </div>
    <div className="mt-6 max-w-[860px] space-y-6" aria-live="polite">
      {messages.map((message, index) => <motion.article key={message.subject} initial={{ opacity: 0, x: index === 0 ? -8 : 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : 0.18 + index * 0.24, duration: 0.38 }} className={`px-3 py-3 sm:px-4 ${message.tone}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold uppercase tracking-tight text-[#6B7C88]"><img src="/gmailicon.png" alt="Gmail correspondence" className="h-3.5 w-3.5 shrink-0 object-contain" /><span className="rounded-full bg-white/80 px-2 py-0.5">{message.direction}</span><span>{message.state}</span></div>
        <h3 className="mt-2 text-[12px] font-semibold leading-5 tracking-tight text-[#182026]"><mark className={index === 0 ? 'rounded-[3px] bg-[#F7E7CF] px-1 py-0.5 font-semibold text-[#6A4B22]' : 'rounded-[3px] bg-[#DDF4E5] px-1 py-0.5 font-semibold text-[#276247]'}>{message.subject}</mark></h3>
        <p className="mt-1 text-[10px] font-medium tracking-tight text-[#7B8A97]">From {message.sender}</p>
        <p className="mt-2 max-w-[760px] text-[11px] leading-5 tracking-tight text-[#4D5B66]">{message.body}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-medium tracking-tight text-[#66737F]"><span className="text-[#8A99A5]">Attached evidence</span>{message.attachments.map((attachment) => <span key={attachment} className="text-[#4D5B66]">{attachment}</span>)}</div>
      </motion.article>)}
    </div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduceMotion ? 0 : 0.78, duration: 0.3 }} className="mt-6 text-[10px] font-medium tracking-tight text-[#536B79]">Current position · Supported exposure $38,850 · Amazon approved $26,000 · Residual position remains open until response and settlement are reconciled.</motion.p>
  </motion.section>;
}

const toneClasses: Record<Tone, { card: string; badge: string; status: string }> = {
  ready: { card: "border-[#D8E3E8] bg-white", badge: "border-[#BFE3D7] bg-[#F1FAF6] text-[#26704E]", status: "bg-[#F1F3F4] text-[#36404A]" },
  moving: { card: "border-[#D8E3E8] bg-white", badge: "border-[#CFE2F2] bg-[#F2F8FC] text-[#1967A3]", status: "bg-[#FCF8EE] text-[#8A641B]" },
  filed: { card: "border-[#D8E3E8] bg-white", badge: "border-[#CFE2F2] bg-[#F2F8FC] text-[#1967A3]", status: "bg-[#F7FAFB] text-[#546575]" },
  attention: { card: "border-[#E8CCCC] bg-[#FFFDFC]", badge: "border-[#E8CCCC] bg-[#FFF6F5] text-[#A23A3A]", status: "bg-[#FFF6F5] text-[#A23A3A]" },
  payout: { card: "border-[#D8E3E8] bg-white", badge: "border-[#E8D8B8] bg-[#FCF8EE] text-[#8A641B]", status: "bg-[#FCF8EE] text-[#8A641B]" },
  resolved: { card: "border-[#C9E3D7] bg-white", badge: "border-[#C9E3D7] bg-[#F2FAF5] text-[#26704E]", status: "bg-[#F2FAF5] text-[#26704E]" },
};

function Metrics({ card }: { card: RecordCard }) {
  return <div className="min-w-0 lg:border-l lg:border-[#D8E3E8] lg:pl-5"><div className="flex items-center justify-between gap-4"><div><div className="text-[10px] font-medium tracking-tight text-[#7B8A97]">Proof posture</div><span className="mt-1 inline-flex rounded-full bg-[#F1F3F4] px-2.5 py-1 text-[10px] font-medium tracking-tight text-[#36404A]">{card.proof}</span></div>{card.days ? <div className="text-[11px] font-medium tracking-tight text-[#546575]">{card.days}</div> : null}</div><div className="mt-3 grid gap-2 text-[11px] font-medium tracking-tight text-[#546575]"><div className="flex items-start justify-between gap-3"><span className="text-[#8FA0AD]">Amazon route</span><span className="max-w-[70%] text-right text-[#4B5563]">{card.route}</span></div><div className="flex items-start justify-between gap-3"><span className="text-[#8FA0AD]">Evidence packet</span><span className="max-w-[70%] text-right text-[#4B5563]">{card.packet}</span></div><div className="flex items-start justify-between gap-3"><span className="text-[#8FA0AD]">Safety</span><span className="max-w-[70%] text-right text-[#4B5563]">{card.safety}</span></div></div><div className="mt-3 space-y-1.5">{card.checks.map((check) => <div key={check} className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-[#6B7C88]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.tone === "attention" ? "bg-[#B34B4B]" : "bg-[#07845A]"}`} />{check}</div>)}</div></div>;
}

function RecoveryCard({ card, onApprove, workspaceMode = false }: { card: RecordCard; onApprove: () => void; workspaceMode?: boolean }) {
  const classes = toneClasses[card.tone];
  const markerClass = card.tone === "attention" ? "bg-[#B34B4B]" : card.tone === "payout" ? "bg-[#C99A42]" : card.tone === "resolved" ? "bg-[#4F8067]" : card.tone === "moving" || card.tone === "filed" ? "bg-[#2D78A8]" : "bg-[#4F8067]";
  return <article className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4 py-4 text-[12px] first:pt-1 last:pb-1 sm:grid-cols-[26px_minmax(0,1fr)]">
    {workspaceMode ? null : <span className="absolute bottom-[-1px] left-[11px] top-[32px] w-px bg-[#C9D6DE] sm:left-[12px]" aria-hidden="true" />}
    <span className={`relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${markerClass}`} aria-label={`${card.status} record`}><Check className="h-3 w-3 text-white" strokeWidth={3} /></span>
    <div className="min-w-0 border-b border-[#E6EDF0] pb-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex rounded-full bg-[#F1F3F4] px-2 py-0.5 text-[8px] font-bold tracking-tight text-[#36404A]">{card.type}</span><p className="font-semibold tracking-tight text-[#182026]">{card.title}</p><span className="text-[11px] font-semibold tabular-nums tracking-tight text-[#182026]">{card.amount}</span><span className="text-[10px] font-semibold tracking-tight text-[#8FA0AD]">Ref {card.reference}</span>{card.priority ? <span className="text-[10px] font-semibold tracking-tight text-[#047857]">{card.priority}</span> : null}</div>
      <p className="mt-1 text-[10px] tracking-tight text-[#9CA3AF]">{card.meta}</p>
      <p className="mt-2 text-[11px] font-semibold leading-4 tracking-tight text-[#36404A]">{card.detail}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium tracking-tight text-[#66737F]"><span>Proof: <strong className="font-semibold text-[#36404A]">{card.proof}</strong></span>{card.days ? <span>{card.days}</span> : null}</div>
      <div className="mt-2 flex flex-wrap gap-2">{card.docs.map((doc) => <span key={doc} className="inline-flex max-w-full items-center gap-1.5 rounded-[8px] border border-[#D8E3E8] bg-[#F8FAFB] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-[#546575]"><DocumentMark document={doc} /><span className="truncate">{enterpriseDocumentName(doc)}</span></span>)}</div>
      {workspaceMode ? null : <div className="mt-3 grid gap-1.5 text-[10px] leading-4 tracking-tight text-[#66737F] sm:grid-cols-2"><p><span className="font-semibold text-[#8A99A5]">Amazon route:</span> {card.route}</p><p><span className="font-semibold text-[#8A99A5]">Evidence packet:</span> {card.packet}</p><p><span className="font-semibold text-[#8A99A5]">Safety:</span> {card.safety}</p><p><span className="font-semibold text-[#8A99A5]">Last movement:</span> {card.movement}</p></div>}
      <div className="mt-3 space-y-1">{card.checks.map((check) => <div key={check} className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-[#6B7C88]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${card.tone === "attention" ? "bg-[#B34B4B]" : "bg-[#07845A]"}`} />{check}</div>)}</div>
      {workspaceMode ? null : <><p className="mt-3 text-[11px] font-bold leading-4 tracking-tight text-[#111827]">Status: <span className={card.tone === "attention" ? "text-[#A23A3A]" : card.tone === "payout" ? "text-[#8A641B]" : "text-[#26704E]"}>{card.status}</span></p>
      <div className="mt-1 text-[11px] leading-4 text-[#66737F]"><span className="font-semibold text-[#36404A]">Next step:</span> {card.next} <span className="mx-1 text-[#C3CCD1]">·</span> <span className="font-semibold text-[#36404A]">Control:</span> Nothing submits until approved</div>
      <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={card.status === "Approve filing" ? onApprove : undefined} className={`inline-flex items-center gap-1 rounded-[7px] px-3 py-1.5 text-[11px] font-semibold tracking-tight ${card.status === "Submitting" ? "bg-[#F1F3F4] text-[#36404A]" : classes.status}`}>{card.status}<ArrowUpRight className="h-3 w-3" /></button><button type="button" className="inline-flex items-center gap-1 text-[11px] font-medium tracking-tight text-[#0B74DE] hover:underline">Review packet<ArrowUpRight className="h-3 w-3" /></button><span className="text-[10px] font-medium tracking-tight text-[#66737F]">View source detail</span></div></>}
    </div>
  </article>;
}

export function RecoveryPipelineSequence({ workspaceMode = false }: { workspaceMode?: boolean } = {}) {
  const [stage, setStage] = useState<'register' | 'artifact-analysis' | 'claims'>('register');
  const [activeTab, setActiveTab] = useState<TabId>('approval');
  const [query, setQuery] = useState('');
  const [queueMode, setQueueMode] = useState<'all' | 'priority' | 'recent'>('all');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setStage('artifact-analysis'), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  const tab = tabs.find((item) => item.id === activeTab)!;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCards = useMemo(() => {
    const filtered = cards[activeTab].filter((card) => !normalizedQuery || Object.values(card).join(' ').toLowerCase().includes(normalizedQuery));
    if (queueMode === 'priority') return [...filtered].sort((a, b) => (a.priority ? -1 : 1) - (b.priority ? -1 : 1));
    if (queueMode === 'recent') return [...filtered].sort((a, b) => a.movement.localeCompare(b.movement));
    return filtered;
  }, [activeTab, normalizedQuery, queueMode]);

  const approveCard = () => {
    setToast('Filing control recorded. Submission is now in progress.');
    window.setTimeout(() => setToast(null), 3200);
  };

  return <section className="mt-5" aria-label="Recovery evidence and claims progression">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    {stage === 'register' ? <EvidenceRegisterStage workspaceMode={workspaceMode} /> : null}
    {stage === 'artifact-analysis' ? <ArtifactAnalysisStage onComplete={() => setStage('claims')} /> : null}
    {stage === 'claims' ? <>
      <div className="max-h-24 overflow-x-auto border-y border-[#E8EFF1] opacity-100"><div className="flex min-w-max gap-7 px-5 sm:px-6">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`relative whitespace-nowrap border-b-2 px-0 py-4 text-[12px] font-medium tracking-tight ${activeTab === item.id ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F] hover:text-[#182026]'}`}>{workspaceMode && item.id === 'approval' ? 'Evidence to Cases' : item.label}</button>)}</div></div>
      <div id="recovery-claims" className="px-5 py-5 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-1.5"><div className="flex flex-wrap items-baseline gap-x-3"><h2 className="font-google-sans text-[14px] font-normal tracking-tight text-[#182026]">{workspaceMode ? "Evidence to Cases" : "Awaiting Seller Approval"}</h2><span className="text-[13px] font-semibold tabular-nums tracking-tight text-[#4D5B66]">$186,420</span></div><p className="max-w-3xl text-[13px] leading-5 tracking-tight text-[#4D5B66]">{workspaceMode ? "Cases take shape as Margin matches related evidence in real time. Each case keeps its source records attached, shows the basis for the match, and advances through the next workflow state in one live queue." : "Supported cohort queue. Review evidence sufficiency, materiality, control exceptions, and expected recovery before anything is submitted."}</p><p className="text-[11px] font-medium tracking-tight text-[#8A99A5]">{tab.count} governed positions in this queue</p></div><div className="flex items-center gap-2"><div className="flex h-9 items-center gap-2 rounded-[8px] border border-[#D8E3E8] bg-[#FBFCFD] px-3"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="w-[145px] bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div><button type="button" onClick={() => setQueueMode(queueMode === 'all' ? 'priority' : queueMode === 'priority' ? 'recent' : 'all')} className="hidden h-9 items-center gap-2 rounded-[8px] bg-[#F1F3F4] px-3 text-[10px] font-semibold tracking-tight text-[#36404A] sm:inline-flex">Review queue: {queueMode === 'all' ? 'All cases' : queueMode === 'priority' ? 'Priority first' : 'Recently updated'}<ChevronDown className="h-3.5 w-3.5" /></button></div></div><div className="mt-5 space-y-3">{visibleCards.map((card) => <RecoveryCard key={card.reference} card={card} onApprove={approveCard} workspaceMode={workspaceMode} />)}</div></div>
    </> : null}
  </section>;
}

export default function FilingPipelinePreview() {
  const [activeTab, setActiveTab] = useState<TabId>("approval");
  const [query, setQuery] = useState("");
  const [queueMode, setQueueMode] = useState<"all" | "priority" | "recent">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [intakeStage, setIntakeStage] = useState<'analysis' | 'dropzone' | 'documents' | 'handoff' | 'register' | 'artifact-analysis' | 'claims' | 'correspondence'>('analysis');
  const [intakeCycle, setIntakeCycle] = useState(0);

  useEffect(() => {
    if (!analysisComplete) return;
    setIntakeStage('dropzone');
    const documentTimer = window.setTimeout(() => setIntakeStage('documents'), 2000);
    const registerTimer = window.setTimeout(() => setIntakeStage('register'), 5000);
    const handoffTimer = window.setTimeout(() => setIntakeStage('handoff'), 11200);
    const artifactTimer = window.setTimeout(() => setIntakeStage('artifact-analysis'), 15200);
    // Artifact analysis owns the handoff into correspondence. The following
    // claims and replay timers are scheduled when that analysis completes so
    // correspondence can appear alone before claims replace it.
    return () => {
      window.clearTimeout(documentTimer);
      window.clearTimeout(handoffTimer);
      window.clearTimeout(registerTimer);
      window.clearTimeout(artifactTimer);

    };
  }, [analysisComplete]);

  const tab = tabs.find((item) => item.id === activeTab)!;
  const sectionTitle = activeTab === "approval" ? "Awaiting Seller Approval" : tab.label;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCards = useMemo(() => {
    const filtered = cards[activeTab].filter((card) => !normalizedQuery || Object.values(card).join(" ").toLowerCase().includes(normalizedQuery));
    if (queueMode === "priority") return [...filtered].sort((a, b) => (a.priority ? -1 : 1) - (b.priority ? -1 : 1));
    if (queueMode === "recent") return [...filtered].sort((a, b) => a.movement.localeCompare(b.movement));
    return filtered;
  }, [activeTab, normalizedQuery, queueMode]);
  const approveCard = () => {
    setToast("Filing control recorded. Submission is now in progress.");
    window.setTimeout(() => setToast(null), 3200);
  };
  return <main className="min-h-screen overflow-x-auto overscroll-x-contain bg-white font-google-sans text-[#182026] [-webkit-overflow-scrolling:touch]">{toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}<div className="mx-auto flex max-w-[1280px] items-start gap-3 px-0 py-0 sm:gap-4 sm:px-6 sm:py-6"><aside aria-label="Recovery operations controls" className="sticky top-6 flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">{pipelineRail.map(({ label, href, icon: Icon }, index) => <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? "bg-[#D9E0E3] text-[#26333A]" : ""}`}><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} /></a>)}</aside><section className="min-w-0 flex-1 bg-white">{intakeStage === "analysis" ? <div className="px-5 py-5 sm:px-6"><EvidenceAnalysisPanel key={intakeCycle} onComplete={() => setAnalysisComplete(true)} /></div> : intakeStage === "dropzone" || intakeStage === "documents" ? <EvidenceIntakeStage stage={intakeStage} /> : intakeStage === "handoff" ? <TeamHandoffStage /> : intakeStage === "register" ? <EvidenceRegisterStage /> : intakeStage === "artifact-analysis" ? <ArtifactAnalysisStage onComplete={() => {
          setIntakeStage('correspondence');
          window.setTimeout(() => setIntakeStage('claims'), CORRESPONDENCE_DWELL_MS);
          window.setTimeout(() => {
            setAnalysisComplete(false);
            setIntakeStage('analysis');
            setIntakeCycle((cycle) => cycle + 1);
          }, CORRESPONDENCE_DWELL_MS + INTAKE_REPLAY_DELAY_MS);
        }} /> : null}{intakeStage === "correspondence" ? <AmazonCorrespondenceStage /> : null}<div className={intakeStage === "claims" ? "max-h-24 overflow-x-auto opacity-100 transition-all duration-700 ease-out" : "max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-out"}><div className="flex min-w-max gap-7 px-5 sm:px-6">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={`relative whitespace-nowrap border-b-2 px-0 py-4 text-[12px] font-medium tracking-tight transition-colors ${activeTab === item.id ? "border-[#0B74DE] text-[#0B74DE]" : "border-transparent text-[#66737F] hover:text-[#182026]"}`}>{item.label}</button>)}</div></div><div id="approval-queue" className={intakeStage === "claims" ? "max-h-[4000px] overflow-hidden px-5 py-5 opacity-100 transition-all duration-700 ease-out sm:px-6" : "max-h-0 overflow-hidden px-5 py-0 opacity-0 transition-all duration-500 ease-out sm:px-6"}><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="space-y-1.5"><div className="flex flex-wrap items-baseline gap-x-3"><h2 className="font-google-sans text-[14px] font-normal tracking-tight text-[#182026]">{sectionTitle}</h2><span className="text-[13px] font-semibold tabular-nums tracking-tight text-[#4D5B66]">{tab.id === "approval" ? "$186,420" : tab.id === "filing" ? "$94,680" : tab.id === "filed" ? "$312,740" : tab.id === "attention" ? "$58,940" : tab.id === "payout" ? "$146,280" : "$1.84M"}</span></div><p className="max-w-3xl text-[13px] leading-5 tracking-tight text-[#4D5B66]">{tab.id === "approval" ? "Supported cohort queue. Review evidence sufficiency, materiality, control exceptions, and expected recovery before anything is submitted." : tab.id === "filing" ? "Live submissions with locked packets, receipt capture, response windows, and cross-system financial state." : tab.id === "attention" ? "Control exceptions held before filing because source relationships, valuation, or clearing evidence require resolution." : "Margin keeps the event record, evidence state, Amazon response, settlement truth, and next controlled action connected."}</p><p className="text-[11px] font-medium tracking-tight text-[#8A99A5]">{tab.count} governed positions in this queue</p></div><div className="flex items-center gap-2"><div className="flex h-9 items-center gap-2 rounded-[8px] border border-[#D8E3E8] bg-[#FBFCFD] px-3"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="w-[145px] bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div><div className="relative hidden sm:block"><button type="button" onClick={() => setQueueMode(queueMode === "all" ? "priority" : queueMode === "priority" ? "recent" : "all")} className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#F1F3F4] px-3 text-[10px] font-semibold tracking-tight text-[#36404A]">Review queue: {queueMode === "all" ? "All cases" : queueMode === "priority" ? "Priority first" : "Recently updated"}<ChevronDown className="h-3.5 w-3.5" /></button></div></div></div><div className="mt-5 space-y-3">{visibleCards.map((card) => <RecoveryCard key={card.reference} card={card} onApprove={approveCard} />)}{visibleCards.length === 0 ? <div className="rounded-[10px] border border-dashed border-[#D8E3E8] px-5 py-12 text-center text-[12px] text-[#7B8A97]">No records match this search.</div> : null}</div></div></section></div></main>;
}

export const __previewRecords = cards;
