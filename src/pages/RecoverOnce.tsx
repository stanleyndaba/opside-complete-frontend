import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

type DocumentReferenceProps = {
  name: string;
  source: string;
  icon: string;
};

function DocumentReference({ name, source, icon }: DocumentReferenceProps) {
  return (
    <span className="mx-1 inline-flex max-w-full translate-y-[0.12em] items-center gap-1.5 rounded-[4px] bg-[#F1F3F4] px-2 py-1 align-baseline text-[11px] leading-4 tracking-[-0.01em] text-[#3B4650]" title={`${source}: ${name}`}>
      <img src={icon} alt={source} className="h-4 w-4 shrink-0 object-contain" />
      <span className="font-semibold">{name}</span>
    </span>
  );
}

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
        <h1 className="font-google-sans text-[28px] font-normal leading-tight tracking-[-0.03em] text-[#191B20] sm:text-[36px]">Evidence-Backed Recovery Stance</h1>
        <p>
          Financial position established · controlled recovery ready to transfer. Margin reconstructed the financial event across operational, inventory, settlement, and ledger records, then connected the affected populations into a single evidence-backed recovery stance with clear boundaries around what is supported, what is already accounted for, and what remains unresolved. <DocumentReference icon="/amazon-logo-transparent-circle.png" source="Amazon" name="Amazon Fulfilment Network Inventory Adjustment and Disposition Ledger" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Seller Evidence Intake and Shipment Support Folder" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Settlement Period Reconciliation and Clearing Workbook" /> The result separates supported exposure from amounts already accounted for and items that remain unresolved. <DocumentReference icon="/excel-icon-margin.png" source="Excel" name="FBA Inbound Receiving Variance and Shipment Reconciliation Schedule" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Inventory Custody and Valuation Evidence Register" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Returns and Reimbursement Exception Register" /> The defined operating responsibility can transfer after seller approval. Control conclusion: Delegable supported exposure: $121,840. The position is evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion, not a guaranteed Amazon reimbursement. Reconciliation bridge: From identified variance to supported action. Gross identified variance: $184,260. All detected signals. <DocumentReference icon="/gd.png" source="Google Drive" name="Amazon Settlement Transaction Detail and Reimbursement Clearing Extract" /> Already accounted for: ($42,300). Credits and cleared outcomes. Insufficient basis: ($20,120). Held pending reconciliation. Supported exposure: $121,840. Actionable position. Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis. Evidence sufficiency: Source lineage behind the conclusion. <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Enterprise Accounts Payable Invoice and Cost-Basis Support Register" /> Shipment movement: 18,420 records, matched, supported. FC receiving events: 17,982 records, 96.8% matched, exception review. <DocumentReference icon="/onedriive.png" source="OneDrive" name="Inventory Ledger Adjustment, Valuation, and Custody Reconciliation Workbook" /> Inventory ledger: 6,104 adjustments, matched to SAP, supported. Settlement activity: 2.8M rows, reconciled, supported. Returns &amp; reimbursements: 42,610 events, partial match, held. General ledger clearing: NetSuite postings, 3 open items, review. The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.
        </p>
        <p>
          Materiality and economics: Is the supported position worth pursuing? Supported exposure: $121,840. Modeled recovery likelihood: 82%. Expected recovery value: $99,909. Operating fee: $4,800. Expected net value: $95,109. <DocumentReference icon="/outlookicon.webp" source="Outlook" name="Amazon Case Escalation, Evidence Request, and Seller Operations Correspondence" /> The modeled likelihood is an operating estimate, not a promise. The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification. Recommended disposition: Pursue through Recover Once. Controlled execution: The recovery remains accountable until the outcome is verified. Financial position established. Evidence sufficiency assessed. <DocumentReference icon="/gmailicon.png" source="Gmail" name="Supplier Invoice, Amazon Support, and Recovery Approval Correspondence Register" /> Recovery case assembled. Seller approval required. Margin responsibility begins. Settlement verification required. After approval, Margin owns case administration, prepares the Amazon response, records the response basis, manages follow-up and escalation, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved. Decision boundary: What approval means. Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment. <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Financial Control Workbook and Recovery Decision Support Pack" /> The position is established. The work is defined. Responsibility can move to Margin without moving decision rights.
        </p>
      </div>
    </main>
  );
}
