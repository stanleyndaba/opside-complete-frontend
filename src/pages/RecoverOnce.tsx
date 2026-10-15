import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

export default function RecoverOnce() {
  usePageMeta({
    title: 'Recovery Decision Record | Margin',
    description: 'Review an evidence-backed recovery decision record and approve a controlled recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <main className="min-h-screen bg-white px-5 py-10 font-google-sans text-[15px] leading-7 tracking-[-0.012em] text-[#595E68] sm:px-10 sm:py-16 lg:px-16">
      <div className="mx-auto max-w-[900px] space-y-8">
        <p>Financial position established · controlled recovery ready to transfer. Margin reconstructed the financial event across operational, inventory, settlement, and ledger records. The result separates supported exposure from amounts already accounted for and items that remain unresolved. The defined operating responsibility can transfer after seller approval. Control conclusion: Delegable supported exposure: $121,840. The position is evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion, not a guaranteed Amazon reimbursement. Reconciliation bridge: From identified variance to supported action. Gross identified variance: $184,260. All detected signals. Already accounted for: ($42,300). Credits and cleared outcomes. Insufficient basis: ($20,120). Held pending reconciliation. Supported exposure: $121,840. Actionable position. Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis. Evidence sufficiency: Source lineage behind the conclusion. Shipment movement: 18,420 records, matched, supported. FC receiving events: 17,982 records, 96.8% matched, exception review. Inventory ledger: 6,104 adjustments, matched to SAP, supported. Settlement activity: 2.8M rows, reconciled, supported. Returns &amp; reimbursements: 42,610 events, partial match, held. General ledger clearing: NetSuite postings, 3 open items, review. The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.</p>
        <p>Materiality and economics: Is the supported position worth pursuing? Supported exposure: $121,840. Modeled recovery likelihood: 82%. Expected recovery value: $99,909. Operating fee: $4,800. Expected net value: $95,109. The modeled likelihood is an operating estimate, not a promise. The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification. Recommended disposition: Pursue through Recover Once. Controlled execution: The recovery remains accountable until the outcome is verified. Financial position established. Evidence sufficiency assessed. Recovery case assembled. Seller approval required. Margin responsibility begins. Settlement verification required. After approval, Margin owns case administration, prepares the Amazon response, records the response basis, manages follow-up and escalation, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved. Decision boundary: What approval means. Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment. The position is established. The work is defined. Responsibility can move to Margin without moving decision rights.</p>
      </div>
    </main>
  );
}
