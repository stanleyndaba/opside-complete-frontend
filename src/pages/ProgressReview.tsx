import React, { useState } from "react";
import { ArrowRight, Check, Files, Layers3, ListChecks, Search, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type ProgressEvent = {
  type: string;
  status: string;
  date: string;
  message: string;
  amount?: string;
  docs: string[];
};

const assessmentRail = [
  { label: 'Decision record', href: '#progress-review-title', icon: ListChecks },
  { label: 'Reconciliation bridge', href: '#progress-record', icon: Layers3 },
  { label: 'Evidence position', href: '#progress-timeline', icon: Files },
  { label: 'Decision boundary', href: '#progress-review-title', icon: SlidersHorizontal },
  { label: 'Next step', href: '#progress-review-title', icon: Search },
] as const;

const events: ProgressEvent[] = [
  { type: "control intake", status: "scope established", date: "09/04/2026, 08:31:02 AM", message: "Control record EVT-FBA-2026-0001847 opened for Northstar Commerce LLC · legal entity NTH-US-01 · Amazon US · FBA. Review window: 01 Jan–31 Mar 2026 · USD. Scope covers inbound receiving, inventory movement, reimbursements, settlements, and payout activity within the Q1 2026 recovery control population.", docs: ["ControlScope-EVT-FBA-2026-0001847.pdf", "EntityScope-NTH-US-01.csv"] },
  { type: "source control", status: "source population accepted", date: "09/04/2026, 08:34:18 AM", message: "Amazon SP-API settlement, inventory, reimbursement, and shipment populations were accepted for source run NTH-US-Q1-2026-0904. ERP ledger extracts, warehouse receiving records, carrier evidence, and supplier valuation records were registered as controlled supporting source classes.", docs: ["SourcePopulationRegister-Q1-2026.csv", "AmazonSPAPI-SourceRun-NTH-US-Q1-2026-0904.pdf", "ERP-InventoryPopulation-Q1.csv"] },
  { type: "source normalization", status: "records normalized", date: "09/04/2026, 08:38:47 AM", message: "184,293 Amazon settlement rows and 42,817 inventory movement rows were normalized to the Margin event schema under source run NTH-US-Q1-2026-0904. Reporting periods, currencies, legal-entity identifiers, merchant accounts, shipment references, and duplicate records were tested before downstream matching.", docs: ["NormalizationRun-NTH-US-Q1-2026-0904.pdf", "SettlementPopulationControl-Q1.csv", "InventoryMovementPopulation-Q1.csv"] },
  { type: "causal reconstruction", status: "event identity resolved", date: "09/04/2026, 08:42:15 AM", message: "Shipment FBA18QZ7M4K2, SKU NS-AIR-PURIFIER-3PK, ASIN B0D4L8P1CX, receiving node ONT8, supplier delivery, and related settlement activity resolve to one financial event. Expected quantity: 17 units. Amazon recorded 14 units received.", amount: "$194.25", docs: ["ShipmentPlan-FBA18QZ7M4K2.pdf", "ReceivingReport-ONT8.csv", "EventIdentity-EVT-FBA-2026-0001847.pdf"] },
  { type: "expected treatment", status: "valuation basis verified", date: "09/04/2026, 08:44:03 AM", message: "Expected treatment was calculated from the supplier invoice and purchase-order basis: 3 units at a verified unit cost of $64.75. Supported exposure: $194.25 before any later clearing activity or recovery decision.", amount: "$194.25", docs: ["Invoice-2026-1847.pdf", "PO-2026-1847.pdf", "ValuationBasis-EVT-FBA-2026-0001847.csv"] },
  { type: "causal reconstruction", status: "supported variance established", date: "09/04/2026, 08:47:26 AM", message: "Carrier delivery and warehouse intake support the same delivery window. The three-unit receiving difference remains attributable to the Amazon receiving event; subsequent inventory movement and settlement activity do not show a matching reimbursement credit or clearing adjustment.", amount: "$194.25", docs: ["BOL-FBA18QZ7M4K2.pdf", "POD-FBA18QZ7M4K2.pdf", "ReceivingToSettlementMatch.csv"] },
  { type: "evidence control", status: "sufficiency permitted", date: "09/04/2026, 08:52:10 AM", message: "Seven source classes were received and normalized; six matched without conflict. One warehouse record was immaterial to the supported quantity. Control sufficiency: permitted for Finance review and controlled action, with the outstanding exception recorded rather than assumed complete.", amount: "$194.25", docs: ["EvidenceIndex-EVT-FBA-2026-0001847.csv", "ControlSufficiency-EVT-FBA-2026-0001847.pdf", "ExceptionRegister-Q1.csv"] },
  { type: "economic review", status: "action worthwhile", date: "09/04/2026, 08:55:41 AM", message: "Supported exposure, control materiality, policy window, expected effort, and probability of recovery were assessed. Decision: pursue. The action is economically justified and remains within the applicable Amazon filing window.", amount: "$194.25", docs: ["RecoveryDecision-EVT-FBA-2026-0001847.pdf", "PolicyWindow-FBA-Inbound.pdf"] },
  { type: "operator decision", status: "seller approval recorded", date: "09/04/2026, 09:12:41 AM", message: "Finance Controller approval was recorded for the supported exposure only. Approval authority covers submission of the verified three-unit receiving variance; unsupported or unresolved amounts remain excluded from the approved position.", amount: "$194.25", docs: ["ApprovalRecord-NTH-FBA-2601-0047.pdf", "RecoveryApprovalPolicy-AmazonRecovery.pdf"] },
  { type: "controlled execution", status: "case packet submitted", date: "09/04/2026, 09:21:34 AM", message: "Margin generated the case narrative from the governed event record, attached the evidence index and valuation basis, submitted the reimbursement request through the Amazon recovery route, and linked the receipt to EVT-FBA-2026-0001847.", amount: "$194.25", docs: ["CasePacket-NTH-FBA-2601-0047.pdf", "AmazonCase-19822888381.pdf", "SubmissionReceipt-NTH-FBA-2601-0047.pdf"] },
  { type: "outcome reconciliation", status: "partial reimbursement identified", date: "09/05/2026, 11:16:00 AM", message: "Amazon approved $150.00 against the supported exposure of $194.25. The response is classified as a partial reimbursement. Residual exposure: $44.25. The original case, evidence, response, and outcome classification remain attached for the next control decision.", amount: "$44.25", docs: ["AmazonResponse-19822888381.pdf", "Settlement-205-771.csv", "ResponseClassification-Partial.pdf"] },
  { type: "settlement verification", status: "credit matched to settlement", date: "09/08/2026, 07:42:19 AM", message: "The approved $150.00 credit was matched to settlement activity for legal entity NTH-US-01. No reversal was identified through the current cutoff. Residual exposure remains separately classified rather than treated as recovered.", amount: "$150.00", docs: ["SettlementMatch-205-771.csv", "CreditVerification-EVT-FBA-2026-0001847.pdf", "ReversalWatch-Q1.csv"] },
  { type: "residual monitoring", status: "reversal watch active", date: "09/08/2026, 07:45:03 AM", message: "The $44.25 residual is carried separately from the $150.00 settled credit. Margin keeps the event on a reversal and late-adjustment watch through the defined monitoring cutoff; no unsupported balance is treated as recovered.", amount: "$44.25", docs: ["ResidualPosition-EVT-FBA-2026-0001847.csv", "ReversalWatch-Q1.csv"] },
  { type: "financial close", status: "position classified", date: "09/08/2026, 07:46:11 AM", message: "The financial position is closed as a partial outcome: $150.00 approved and reconciled to settlement, $44.25 residual classified for follow-up, and no unowned or unaccounted balance remains in the governed record.", amount: "$150.00", docs: ["FinancialClose-EVT-FBA-2026-0001847.pdf", "OutcomeClassification-Partial.csv"] },
];

export default function ProgressReview() {
  const [toast, setToast] = useState<string | null>(null);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [isTimelinePaused, setIsTimelinePaused] = useState(false);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (reduceMotion || isTimelinePaused) return;
    const cycle = window.setInterval(() => setAnimationCycle((current) => current + 1), 16000);
    return () => window.clearInterval(cycle);
  }, [isTimelinePaused, reduceMotion]);
  const getDocumentIcon = (event: ProgressEvent, doc: string) => {
    if (event.status === "partial reimbursement identified") return { src: "/gmailicon.png", alt: "Amazon response" };
    if (doc.toLowerCase().endsWith(".csv")) return { src: "/evidence-csv-mark.png", alt: "CSV" };
    return { src: "/pdf-file-icon.webp", alt: "PDF" };
  };
  const openDoc = (doc: string) => {
    setToast(`${doc} opened from the governed progress record`);
    window.setTimeout(() => setToast(null), 2500);
  };
  return <main className="preview-google-sans min-h-screen overflow-x-auto bg-[#FAFAF7] text-[#182026]">
    {toast ? <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-[8px] bg-[#26333A] px-4 py-3 text-[12px] font-semibold tracking-tight text-white shadow-[0_14px_32px_rgba(24,32,38,0.22)]">{toast}</div> : null}
    <div className="mx-auto flex min-w-[820px] max-w-[1320px] items-start gap-3 px-4 py-4 sm:min-w-0 sm:px-6 sm:py-6">
      <aside aria-label="Progress preview controls" className="sticky top-[76px] flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">
        {assessmentRail.map(({ label, href, icon: Icon }, index) => (
          <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
          </a>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <section id="progress-record" className="rounded-[5px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 pb-3"><h1 id="progress-review-title" className="font-google-sans text-[17px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[20px]">Updated Review</h1></div>
        <div className="space-y-1"><div className="text-[12px] font-medium tracking-tight text-[#182026]">EVT-FBA-2026-0001847 · Northstar Commerce LLC · Legal entity NTH-US-01 · Amazon US · FBA</div><div className="text-[11px] font-medium text-[#0B74DE]">The position is tracked from scope acceptance through evidence sufficiency, approval authority, controlled execution, response classification, settlement verification, and residual close state.</div><div className="text-[10px] font-medium text-[#4B5563]">Review period: 01 Jan–31 Mar 2026 · Source run: NTH-US-Q1-2026-0904 · Materiality: operational exception · Close state: partial outcome with residual under watch · Currency: USD</div></div>
        <div id="progress-timeline" className="mt-5 rounded-[8px] border border-[#DCE8EE] bg-white p-2 sm:p-3">
          <div className="h-[58vh] min-h-[420px] max-h-[760px] overflow-y-auto overscroll-contain pr-1 sm:pr-2" onMouseEnter={() => setIsTimelinePaused(true)} onMouseLeave={() => setIsTimelinePaused(false)}>
          <div key={animationCycle}>
          {events.map((event, index) => <motion.article key={`${event.date}-${event.status}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { delay: index * 1.05, duration: 0.34, ease: [0.22, 1, 0.36, 1] }} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4 py-4 text-[12px] sm:grid-cols-[26px_minmax(0,1fr)]">
            {index < events.length - 1 ? <motion.span initial={reduceMotion ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={reduceMotion ? { duration: 0 } : { delay: index * 1.05 + 0.66, duration: 0.34, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "top" }} className="absolute bottom-[-1px] left-[11px] top-[54px] w-px bg-[#C9D6DE] sm:left-[12px]" aria-hidden="true" /> : null}
            <motion.span initial={reduceMotion ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { delay: index * 1.05 + 0.42, duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8067]" aria-label="Recorded event"><Check className="h-3 w-3 text-white" strokeWidth={3} /></motion.span>
            <div className="min-w-0"><p className="font-medium tracking-tight text-[#182026]">{event.type} · {event.status}</p><p className="mt-1 leading-5 text-[#4D5B66]">{event.message}</p><time className="mt-2 block text-[10px] font-medium tabular-nums tracking-tight text-[#66737F]">{event.date}</time>{event.amount ? <p className="mt-1 font-medium tabular-nums text-[#0B74DE]">Supported amount: {event.amount}</p> : null}<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[#4B5563]"><span className="text-[11px] font-medium tracking-tight text-[#66737F]">Docs</span>{event.docs.map((doc) => <button type="button" key={doc} onClick={() => openDoc(doc)} className="inline-flex items-center gap-1 text-[11px] font-medium tracking-tight text-[#36404A] transition-colors hover:text-[#0B74DE]">{(() => { const icon = getDocumentIcon(event, doc); return <><img src={icon.src} alt={icon.alt} className="h-4 w-4 object-contain" />{doc}</>; })()}<ArrowRight className="h-3 w-3" /></button>)}</div></div>
          </motion.article>)}
          </div>
          </div>
        </div>
        <div aria-hidden="true" className="h-6 sm:h-8" />
        <section aria-labelledby="enterprise-fba-parameters" className="px-0 py-2">
          <div className="border-b border-[#E8EDF0] pb-4">
            <h2 id="enterprise-fba-parameters" className="mt-1 text-[15px] font-medium tracking-tight text-[#182026]">Parameterize the original Amazon working scope</h2>
            <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Northstar Commerce LLC · Amazon US · FBA · Q1 2026 recovery control population</p>
          </div>
          <div className="grid gap-5 pt-5 sm:grid-cols-2 sm:gap-8">
            <fieldset>
              <legend className="text-[13px] font-semibold tracking-tight text-[#182026]">Claim type</legend>
              <p className="mt-1 text-[11px] text-[#8A99A3]">What financial exception is being reviewed?</p>
              <div className="mt-3 space-y-2.5">
                {['Inbound receiving variance', 'Inventory movement discrepancy', 'Settlement or reimbursement mismatch', 'Payout reconciliation exception', 'Returns or fulfillment exception'].map((label, index) => (
                  <label key={label} className="flex items-center gap-2.5 text-[12px] leading-5 text-[#36404A]">
                    <input type="checkbox" defaultChecked={index === 0} className="h-4 w-4 accent-[#3F63D8]" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[13px] font-semibold tracking-tight text-[#182026]">Issue location</legend>
              <p className="mt-1 text-[11px] text-[#8A99A3]">Where was the position first identified?</p>
              <div className="mt-3 space-y-2.5">
                {['Fulfillment center receiving', 'Inbound shipment or carrier handoff', 'Inventory storage and movement', 'Settlement or reimbursement ledger', 'Post-receipt reconciliation'].map((label, index) => (
                  <label key={label} className="flex items-center gap-2.5 text-[12px] leading-5 text-[#36404A]">
                    <input type="checkbox" defaultChecked={index === 0} className="h-4 w-4 accent-[#3F63D8]" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-[#E8EDF0] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-5 text-[#66737F]">Agent uses the selected parameters to keep the review inside the governed Enterprise FBA scope.</p>
            <button type="button" onClick={() => setToast('Enterprise FBA parameters applied to the review')} className="inline-flex min-h-9 items-center justify-center rounded-[6px] bg-[#3F63D8] px-4 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(63,99,216,0.22)] transition-colors hover:bg-[#3152C0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F63D8]/35">Agent</button>
          </div>
        </section>
        </section>
      </div>
    </div>
  </main>;
}
