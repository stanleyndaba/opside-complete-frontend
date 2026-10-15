import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { Files, Layers3, ListChecks, Search, SlidersHorizontal } from 'lucide-react';

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
const assessmentRail = [
  { label: 'Decision record', href: '#analysis-workspace-title', icon: ListChecks },
  { label: 'Reconciliation bridge', href: '#reconciliation-bridge', icon: Layers3 },
  { label: 'Evidence position', href: '#evidence-sufficiency', icon: Files },
  { label: 'Decision boundary', href: '#progressive-recovery-stance', icon: SlidersHorizontal },
  { label: 'Next step', href: '#analysis-workspace-title', icon: Search },
] as const;
export default function RecoverOnce() {
  usePageMeta({
    title: 'Recovery Decision Record | Margin',
    description: 'Review an evidence-backed recovery decision record and approve a controlled recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-auto bg-white font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Commerce LLC · Amazon US Recovery Decision Record</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-tight text-[#777A82]">Analysis Workspace</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">RCR-2026-00418 · 30 April 2026 · 13:41 UTC</p>
          </div>
        </div>
      </header>
      <main className="font-google-sans mx-auto min-w-[900px] max-w-[1180px] px-4 py-5 sm:min-w-0 sm:px-6 sm:py-5 lg:px-6">
        <div className="flex items-start gap-3 lg:gap-4">
          <aside aria-label="Recover Once assessment controls" className="sticky top-[76px] flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">
            {assessmentRail.map(({ label, href, icon: Icon }, index) => (
              <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </a>
            ))}
          </aside>
          <div className="min-w-0 flex-1">
            <article className="min-w-0 bg-white px-0 py-5 sm:px-6 sm:py-5" aria-labelledby="analysis-workspace-title">
              <div className="mx-auto max-w-[900px] space-y-8">
        <h1 id="analysis-workspace-title" className="font-google-sans text-[28px] font-normal leading-tight tracking-[-0.03em] text-[#191B20] sm:text-[36px]">Analysis Workspace</h1>
        <p id="reconciliation-bridge">
          <mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Financial position established</mark> · controlled recovery ready to transfer. Margin reconstructed the financial event across operational, inventory, settlement, and ledger records, then connected the affected populations into a <mark className="rounded-[2px] bg-[#DDF4E5] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">single evidence-backed recovery stance</mark> with clear boundaries around <mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">what is supported</mark>, what is already accounted for, and <mark className="rounded-[2px] bg-[#E9DEFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">what remains unresolved</mark>. <DocumentReference icon="/amazon-logo-transparent-circle.png" source="Amazon" name="Amazon Fulfilment Network Inventory Adjustment and Disposition Ledger" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Seller Evidence Intake and Shipment Support Folder" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Settlement Period Reconciliation and Clearing Workbook" /> The result separates supported exposure from amounts already accounted for and items that remain unresolved. <DocumentReference icon="/excel-icon-margin.png" source="Excel" name="FBA Inbound Receiving Variance and Shipment Reconciliation Schedule" /> <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Inventory Custody and Valuation Evidence Register" /> <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Returns and Reimbursement Exception Register" /> The defined operating responsibility can transfer after seller approval. Control conclusion: Delegable supported exposure: $121,840. The position is evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion, not a guaranteed Amazon reimbursement. Reconciliation bridge: From identified variance to supported action. Gross identified variance: $184,260. All detected signals. <DocumentReference icon="/gd.png" source="Google Drive" name="Amazon Settlement Transaction Detail and Reimbursement Clearing Extract" /> Already accounted for: ($42,300). Credits and cleared outcomes. Insufficient basis: ($20,120). Held pending reconciliation. <mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Supported exposure: $121,840</mark>. Actionable position. Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis. Evidence sufficiency: Source lineage behind the conclusion. <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Enterprise Accounts Payable Invoice and Cost-Basis Support Register" /> Shipment movement: 18,420 records, matched, supported. FC receiving events: 17,982 records, 96.8% matched, exception review. <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Inventory Ledger Adjustment, Valuation, and Custody Reconciliation Workbook" /> Inventory ledger: 6,104 adjustments, matched to SAP, supported. Settlement activity: 2.8M rows, reconciled, supported. Returns &amp; reimbursements: 42,610 events, partial match, held. General ledger clearing: NetSuite postings, 3 open items, review. The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.
        </p>
        <p id="evidence-sufficiency">
          Materiality and economics: Is the supported position worth pursuing? Supported exposure: $121,840. Modeled recovery likelihood: 82%. Expected recovery value: $99,909. Operating fee: $4,800. <mark className="rounded-[2px] bg-[#DDF4E5] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Expected net value: $95,109</mark>. <DocumentReference icon="/outlookicon.webp" source="Outlook" name="Amazon Case Escalation, Evidence Request, and Seller Operations Correspondence" /> The modeled likelihood is an operating estimate, not a promise. The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification. <mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Recommended disposition: Pursue through Recover Once.</mark> Controlled execution: The recovery remains accountable until the outcome is verified. Financial position established. Evidence sufficiency assessed. <DocumentReference icon="/gmailicon.png" source="Gmail" name="Supplier Invoice, Amazon Support, and Recovery Approval Correspondence Register" /> Recovery case assembled. Seller approval required. Margin responsibility begins. Settlement verification required. After approval, Margin owns case administration, prepares the Amazon response, records the response basis, manages follow-up and escalation, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved. Decision boundary: What approval means. Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment. <DocumentReference icon="/onedrive-icon.png" source="OneDrive" name="Financial Control Workbook and Recovery Decision Support Pack" /> The position is established. The work is defined. Responsibility can move to Margin without moving decision rights.
        </p>

        <section id="progressive-recovery-stance" aria-label="Progressive recovery stance" className="border-t border-[#E8E7E1] pt-5">
          <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]">Progressive recovery stance</p>
          <div className="mt-3 space-y-2.5 text-[14px] leading-6 text-[#595E68]">
            {[
              'Financial position established',
              'Evidence coverage established',
              'Shipment and receiving delta confirmed',
              'Inventory and settlement delta reconciled',
              'Supported exposure separated from unresolved signal',
              'Recovery stance confirmed for controlled action',
            ].map((statement) => <div key={statement} className="flex items-center gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26734D] text-[12px] font-bold leading-none text-white" aria-hidden="true">✓</span><span>{statement}</span></div>)}
          </div>
        </section>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
