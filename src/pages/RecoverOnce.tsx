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
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-[4px] bg-[#F1F3F4] px-2 py-1 text-[11px] leading-4 tracking-[-0.01em] text-[#3B4650]" title={`${source}: ${name}`}>
      <img src={icon} alt={source} className="h-4 w-4 shrink-0 object-contain" />
      <span className="font-semibold">{name}</span>
    </span>
  );
}

function WorkflowStep({ number, title, children, pending = false }: { number: string; title: string; children: React.ReactNode; pending?: boolean }) {
  return (
    <section className="relative pl-9 sm:pl-12">
      <span className={`absolute left-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${pending ? 'border-2 border-[#C9CED3] bg-white text-[#9AA1A8]' : 'bg-[#303A43] text-white'}`} aria-hidden="true">
        {pending ? '○' : number}
      </span>
      <div className="absolute bottom-[-28px] left-[11px] top-7 w-px bg-[#D9DEE1]" aria-hidden="true" />
      <h2 className={`text-[17px] font-semibold leading-6 tracking-[-0.02em] sm:text-[20px] ${pending ? 'text-[#8B9299]' : 'text-[#252D34]'}`}>{title}</h2>
      <div className="mt-3 space-y-3 text-[12px] leading-5 text-[#626D75] sm:text-[13px] sm:leading-6">{children}</div>
    </section>
  );
}

function NestedPanel({ title, children, tone = 'neutral' }: { title: string; children: React.ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'yellow' }) {
  const toneClass = {
    neutral: 'border-[#E3E7E9] bg-[#FAFBFB]',
    blue: 'border-[#D5E4F4] bg-[#F5F9FE]',
    green: 'border-[#D8EBDD] bg-[#F5FBF6]',
    yellow: 'border-[#EEE2B7] bg-[#FFFCF1]',
  }[tone];
  return <div className={`rounded-[6px] border p-3 sm:p-4 ${toneClass}`}><p className="text-[10px] font-semibold uppercase tracking-tight text-[#7A858C]">{title}</p><div className="mt-2">{children}</div></div>;
}

function MetricRow({ label, value, detail, emphasis = false }: { label: string; value: string; detail: string; emphasis?: boolean }) {
  return <div className={`flex flex-col gap-1 border-b border-[#E6E9EA] py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${emphasis ? 'text-[#253E58]' : ''}`}><span className="text-[11px] text-[#68747C]">{label}</span><span className="text-right"><strong className="font-google-sans text-[14px] font-semibold tracking-tight">{value}</strong><span className="ml-2 text-[10px] text-[#8A949A]">{detail}</span></span></div>;
}

const assessmentRail = [
  { label: 'Decision record', href: '#analysis-workspace-title', icon: ListChecks },
  { label: 'Reconciliation bridge', href: '#reconciliation-bridge', icon: Layers3 },
  { label: 'Evidence position', href: '#evidence-sufficiency', icon: Files },
  { label: 'Decision boundary', href: '#progressive-recovery-stance', icon: SlidersHorizontal },
  { label: 'Next step', href: '#analysis-workspace-title', icon: Search },
] as const;

export default function RecoverOnce({ embedded = false }: { embedded?: boolean } = {}) {
  usePageMeta(embedded ? { title: '', description: '' } : {
    title: 'Recovery Decision Record | Margin',
    description: 'Review an evidence-backed recovery decision record and approve a controlled recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-auto bg-white font-sans text-[#191B20]">
      {embedded ? null : <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Commerce LLC · Amazon US Recovery Decision Record</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-tight text-[#777A82]">Analysis Workspace</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">RCR-2026-00418 · 30 April 2026 · 13:41 UTC</p>
          </div>
        </div>
      </header>}
      <main className={`font-google-sans mx-auto ${embedded ? 'max-w-[1180px] px-0 py-0' : 'min-w-[900px] max-w-[1180px] px-4 py-5 sm:min-w-0 sm:px-6 sm:py-5 lg:px-6'}`}>
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
                <div>
                  <h1 id="analysis-workspace-title" className="font-google-sans text-[28px] font-normal leading-tight tracking-[-0.03em] text-[#191B20] sm:text-[36px]">Analysis Workspace</h1>
                  <p className="mt-2 text-[11px] text-[#858792]">Northstar Commerce LLC · Amazon US Recovery Decision Record · RCR-2026-00418</p>
                </div>

                <div className="relative space-y-8 rounded-[8px] border border-[#E4E8EA] bg-[#FEFEFE] p-4 sm:p-6">
                  <WorkflowStep number="1" title="Establishing financial position">
                    <p><mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B]">Financial position established</mark> · controlled recovery ready to transfer.</p>
                    <NestedPanel title="Reconstructed financial event" tone="blue">
                      <p>Margin reconstructed the financial event across operational, inventory, settlement, and ledger records, then connected the affected populations into a <mark className="rounded-[2px] bg-[#DDF4E5] px-0.5 font-normal text-[#30343B]">single evidence-backed recovery stance</mark> with clear boundaries around <mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B]">what is supported</mark>, what is already accounted for, and <mark className="rounded-[2px] bg-[#E9DEFF] px-0.5 font-normal text-[#30343B]">what remains unresolved</mark>.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <DocumentReference icon="/amazon-logo-transparent-circle.png" source="Amazon" name="Amazon Fulfilment Network Inventory Adjustment and Disposition Ledger" />
                        <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Seller Evidence Intake and Shipment Support Folder" />
                        <DocumentReference icon="/onedriive.png" source="OneDrive" name="Settlement Period Reconciliation and Clearing Workbook" />
                      </div>
                    </NestedPanel>
                    <p>The result separates supported exposure from amounts already accounted for and items that remain unresolved.</p>
                    <NestedPanel title="Connected operating records">
                      <div className="flex flex-wrap gap-2">
                        <DocumentReference icon="/excel-icon-margin.png" source="Excel" name="FBA Inbound Receiving Variance and Shipment Reconciliation Schedule" />
                        <DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Inventory Custody and Valuation Evidence Register" />
                        <DocumentReference icon="/onedriive.png" source="OneDrive" name="Returns and Reimbursement Exception Register" />
                      </div>
                    </NestedPanel>
                    <p>The defined operating responsibility can transfer after seller approval.</p>
                    <NestedPanel title="Control conclusion" tone="green">
                      <p>Delegable supported exposure: <strong className="font-semibold text-[#253E58]">$121,840</strong>. The position is evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion, not a guaranteed Amazon reimbursement.</p>
                    </NestedPanel>
                  </WorkflowStep>

                  <WorkflowStep number="2" title="Reconciling the source records">
                    <p id="reconciliation-bridge">Reconciliation bridge: From identified variance to supported action.</p>
                    <NestedPanel title="Financial bridge" tone="blue">
                      <MetricRow label="Gross identified variance" value="$184,260" detail="All detected signals" />
                      <div className="flex items-center gap-2 border-b border-[#E6E9EA] py-2.5"><DocumentReference icon="/gd.png" source="Google Drive" name="Amazon Settlement Transaction Detail and Reimbursement Clearing Extract" /></div>
                      <MetricRow label="Already accounted for" value="($42,300)" detail="Credits and cleared outcomes" />
                      <MetricRow label="Insufficient basis" value="($20,120)" detail="Held pending reconciliation" />
                      <MetricRow label="Supported exposure" value="$121,840" detail="Actionable position" emphasis />
                    </NestedPanel>
                    <p>Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis.</p>
                  </WorkflowStep>

                  <WorkflowStep number="3" title="Testing the supported position">
                    <p id="evidence-sufficiency">Evidence sufficiency: Source lineage behind the conclusion.</p>
                    <NestedPanel title="Evidence coverage" tone="neutral">
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2"><DocumentReference icon="/Dropbox_Icon.svg.png" source="Dropbox" name="Enterprise Accounts Payable Invoice and Cost-Basis Support Register" /><span>Shipment movement: 18,420 records, matched, supported.</span></div>
                        <p>FC receiving events: 17,982 records, 96.8% matched, exception review.</p>
                        <div className="flex flex-wrap items-center gap-2"><DocumentReference icon="/onedriive.png" source="OneDrive" name="Inventory Ledger Adjustment, Valuation, and Custody Reconciliation Workbook" /><span>Inventory ledger: 6,104 adjustments, matched to SAP, supported.</span></div>
                        <p>Settlement activity: 2.8M rows, reconciled, supported.</p>
                        <p>Returns &amp; reimbursements: 42,610 events, partial match, held.</p>
                        <p>General ledger clearing: NetSuite postings, 3 open items, review.</p>
                      </div>
                    </NestedPanel>
                    <p>The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.</p>
                  </WorkflowStep>

                  <WorkflowStep number="4" title="Determining materiality and economics">
                    <p>Materiality and economics: Is the supported position worth pursuing?</p>
                    <NestedPanel title="Operating economics" tone="yellow">
                      <MetricRow label="Supported exposure" value="$121,840" detail="Position under review" />
                      <MetricRow label="Modeled recovery likelihood" value="82%" detail="Operating estimate" />
                      <MetricRow label="Expected recovery value" value="$99,909" detail="Before fee" />
                      <MetricRow label="Operating fee" value="$4,800" detail="Agreed scope" />
                      <MetricRow label="Expected net value" value="$95,109" detail="Decision basis" emphasis />
                    </NestedPanel>
                    <div className="flex flex-wrap items-center gap-2"><DocumentReference icon="/outlookicon.webp" source="Outlook" name="Amazon Case Escalation, Evidence Request, and Seller Operations Correspondence" /><p>The modeled likelihood is an operating estimate, not a promise.</p></div>
                    <p>The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification.</p>
                    <p><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B]">Recommended disposition: Pursue through Recover Once.</mark></p>
                  </WorkflowStep>

                  <WorkflowStep number="5" title="Controlling execution">
                    <p>Controlled execution: The recovery remains accountable until the outcome is verified.</p>
                    <NestedPanel title="Execution state" tone="green">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {['Financial position established.', 'Evidence sufficiency assessed.', 'Recovery case assembled.', 'Seller approval required.', 'Margin responsibility begins.', 'Settlement verification required.'].map((statement) => <div key={statement} className="flex items-start gap-2"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#26734D] text-[10px] font-bold leading-none text-white">✓</span><span>{statement}</span></div>)}
                      </div>
                    </NestedPanel>
                    <div className="flex flex-wrap items-center gap-2"><DocumentReference icon="/gmailicon.png" source="Gmail" name="Supplier Invoice, Amazon Support, and Recovery Approval Correspondence Register" /><p>After approval, Margin owns case administration.</p></div>
                    <p>After approval, Margin owns case administration, prepares the Amazon response, records the response basis, manages follow-up and escalation, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved.</p>
                  </WorkflowStep>

                  <WorkflowStep number="6" title="Defining the decision boundary" pending>
                    <p>Decision boundary: What approval means.</p>
                    <NestedPanel title="Approval scope">
                      <p>Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment.</p>
                      <div className="mt-3"><DocumentReference icon="/onedriive.png" source="OneDrive" name="Financial Control Workbook and Recovery Decision Support Pack" /></div>
                    </NestedPanel>
                    <p>The position is established. The work is defined. Responsibility can move to Margin without moving decision rights.</p>
                  </WorkflowStep>
                </div>

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
