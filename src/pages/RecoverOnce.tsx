import { ArrowRight, Check, CircleAlert, LockKeyhole } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlStates = [
  ['Financial position established', 'Complete', 'text-[#26734D]', 'bg-[#4F8067]'],
  ['Evidence sufficiency assessed', 'Complete', 'text-[#26734D]', 'bg-[#4F8067]'],
  ['Recovery case assembled', 'Complete', 'text-[#26734D]', 'bg-[#4F8067]'],
  ['Seller approval', 'Required', 'text-[#3F51A8]', 'bg-[#3F51A8]'],
  ['Amazon submission', 'Pending approval', 'text-[#8A5A16]', 'bg-[#C99A42]'],
  ['Settlement verification', 'Required for closure', 'text-[#777A82]', 'bg-[#A6ADB3]'],
];

const evidenceRows = [
  ['Shipment movement', '18,420 records', 'Matched', 'Supported', 'text-[#26734D]'],
  ['FC receiving events', '17,982 records', '96.8% matched', 'Exception review', 'text-[#8A5A16]'],
  ['Inventory ledger', '6,104 adjustments', 'Matched to SAP', 'Supported', 'text-[#26734D]'],
  ['Settlement activity', '2.8M rows', 'Reconciled', 'Supported', 'text-[#26734D]'],
  ['Returns & reimbursements', '42,610 events', 'Partial match', 'Held', 'text-[#8A5A16]'],
  ['General ledger clearing', 'NetSuite postings', '3 open items', 'Review', 'text-[#777A82]'],
];

const approvalItems = [
  ['Record', 'RCR-2026-00418'],
  ['Scope', '3 marketplaces · 2 legal entities'],
  ['Source population', '2.8M rows · 18,420 movements'],
  ['Supported exposure', '$121,840'],
  ['Unresolved balance', '$20,120'],
  ['Recommended route', 'Recover Once'],
  ['You control', 'Final approval before submission'],
  ['Margin will handle', 'Casework, response, follow-through, and payout verification'],
] as const;

export default function RecoverOnce() {
  usePageMeta({
    title: 'Recovery Decision Record | Margin',
    description: 'Review an evidence-backed recovery decision record and approve a controlled recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-google-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 py-1.5">
            <p className="truncate text-[11px] font-semibold tracking-tight text-[#30343B]">Northstar Commerce LLC · Amazon US</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">Recovery Decision Record · RCR-2026-00418 · 30 April 2026 · 13:41 UTC</p>
          </div>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#F1F2F2] px-2.5 py-1 text-[10px] font-semibold text-[#595E68] sm:inline-flex"><LockKeyhole className="h-3 w-3" /> Read-only audit output</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <article className="min-w-0 rounded-none bg-white px-0 py-3 sm:rounded-[16px] sm:px-6 sm:py-5 sm:shadow-[0_1px_2px_rgba(25,27,32,0.05)]" aria-labelledby="recover-once-title">
            <header className="pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Financial recovery control record</p>
              <h1 id="recover-once-title" className="mt-1 max-w-3xl text-[22px] leading-[1.12] tracking-[-0.03em] text-[#191B20] sm:text-[28px]">Recovery position established · controlled action recommended</h1>
              <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[#595E68]">Margin reconstructed the financial event across operational, inventory, settlement, and ledger records. The result below separates supported exposure from amounts already accounted for and items that remain unresolved.</p>

              <div className="mt-5 grid gap-3 border-y border-[#E8E7E1] py-3 sm:grid-cols-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Audit period</p><p className="mt-1 text-[12px] font-semibold text-[#191B20]">01 Jan–31 Mar 2026</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Operational scope</p><p className="mt-1 text-[12px] font-semibold text-[#191B20]">3 marketplaces · 4 FC nodes</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Source population</p><p className="mt-1 text-[12px] font-semibold text-[#191B20]">2.8M rows · 18,420 movements</p></div>
                <div><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Control state</p><p className="mt-1 text-[12px] font-semibold text-[#3F51A8]">Approval required</p></div>
              </div>

              <section className="mt-5 border-l-2 border-[#3F51A8] pl-4" aria-label="Control conclusion">
                <p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Control conclusion</p>
                <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.025em] text-[#191B20]">Supported recovery exposure: $121,840</h2>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#595E68]">The position is sufficiently evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion—not a guaranteed Amazon reimbursement.</p>
              </section>
            </header>

            <section className="py-5" aria-labelledby="reconciliation-bridge">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Reconciliation bridge</p>
              <h2 id="reconciliation-bridge" className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em]">From identified variance to supported action</h2>
              <div className="mt-3 grid gap-0 border-y border-[#E8E7E1] sm:grid-cols-4 sm:divide-x sm:divide-[#E8E7E1]">
                <div className="py-3 sm:px-3 sm:first:pl-0"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Gross identified variance</p><p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#191B20]">$184,260</p><p className="mt-0.5 text-[10px] text-[#595E68]">All detected signals</p></div>
                <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Already accounted for</p><p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#595E68]">($42,300)</p><p className="mt-0.5 text-[10px] text-[#595E68]">Credits and cleared outcomes</p></div>
                <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Insufficient basis</p><p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#8A5A16]">($20,120)</p><p className="mt-0.5 text-[10px] text-[#595E68]">Held pending reconciliation</p></div>
                <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3 sm:last:pr-0"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Supported exposure</p><p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-[#26734D]">$121,840</p><p className="mt-0.5 text-[10px] font-semibold text-[#26734D]">Actionable position</p></div>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[#595E68]">Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis.</p>
            </section>

            <section className="py-5" aria-labelledby="evidence-sufficiency">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Evidence sufficiency</p>
              <h2 id="evidence-sufficiency" className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em]">Source lineage behind the conclusion</h2>
              <div className="mt-3 overflow-x-auto border-y border-[#E8E7E1]"><table className="w-full min-w-[610px] text-left text-[11px]"><thead><tr className="border-b border-[#E8E7E1] text-[10px] font-semibold uppercase tracking-tight text-[#777A82]"><th className="py-2 pr-3">Control area</th><th className="py-2 pr-3">Population</th><th className="py-2 pr-3">Match state</th><th className="py-2">Decision</th></tr></thead><tbody>{evidenceRows.map(([area, population, match, decision, tone]) => <tr key={area} className="border-b border-[#F0EFEA] last:border-0"><td className="py-2.5 pr-3 font-semibold text-[#30343B]">{area}</td><td className="py-2.5 pr-3 text-[#595E68]">{population}</td><td className="py-2.5 pr-3 text-[#595E68]">{match}</td><td className={`py-2.5 font-semibold ${tone}`}>{decision}</td></tr>)}</tbody></table></div>
              <p className="mt-3 text-[12px] leading-5 text-[#595E68]">The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.</p>
            </section>

            <section className="py-5" aria-labelledby="materiality">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Materiality and economics</p>
              <h2 id="materiality" className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em]">Is the supported position worth pursuing?</h2>
              <div className="mt-3 grid gap-0 border-y border-[#E8E7E1] sm:grid-cols-5 sm:divide-x sm:divide-[#E8E7E1]">
                {[['Supported exposure', '$121,840'], ['Modeled recovery likelihood', '82%'], ['Expected recovery value', '$99,909'], ['Operating fee', '$4,800'], ['Expected net value', '$95,109']].map(([label, value], index) => <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[#E8E7E1] py-2.5 last:border-0 sm:block sm:border-0 sm:px-3 sm:first:pl-0 sm:last:pr-0"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">{label}</p><p className={`text-[14px] font-semibold tracking-[-0.02em] ${index === 4 ? 'text-[#26734D]' : 'text-[#191B20]'}`}>{value}</p></div>)}
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[#595E68]">The modeled likelihood is an operating estimate, not a promise. The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification.</p>
              <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-[#F3F7F4] px-3 py-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#26734D]" /><p className="text-[12px] font-semibold leading-5 text-[#26734D]">Recommended disposition: Pursue through Recover Once.</p></div>
            </section>

            <section className="py-5" aria-labelledby="controlled-lifecycle">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Controlled execution</p>
              <h2 id="controlled-lifecycle" className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em]">The case remains open until the financial outcome is verified</h2>
              <div className="relative mt-3 space-y-0">{controlStates.map(([label, state, tone, dot], index) => <div key={label} className="relative flex items-center gap-3 py-2"><span className="absolute bottom-[-1px] left-[9px] top-0 w-px bg-[#C9D6DE]" aria-hidden="true" /> <span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dot} text-white`}>{state === 'Complete' ? <Check className="h-3 w-3" strokeWidth={3} /> : index === 3 ? <CircleAlert className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span><span className="flex min-w-0 flex-1 items-center justify-between gap-3"><span className="text-[12px] font-medium text-[#595E68]">{label}</span><span className={`text-[10px] font-semibold ${tone}`}>{state}</span></span></div>)}</div>
              <p className="mt-3 text-[12px] leading-5 text-[#595E68]">After approval, Margin prepares the Amazon response, records the response basis, monitors the case, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved.</p>
            </section>

            <section className="pt-5" aria-labelledby="record-boundary">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Decision boundary</p>
              <h2 id="record-boundary" className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em]">What approval means</h2>
              <p className="mt-2 text-[14px] leading-6 text-[#595E68]">Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment.</p>
              <p className="mt-2 text-[14px] font-semibold leading-6 text-[#191B20]">The Audit established the financial position. Recover Once carries the supported action through verified closure.</p>
            </section>
          </article>

          <aside className="lg:sticky lg:top-20" aria-label="Recovery decision summary">
            <div className="rounded-[14px] border border-[#D7D7D1] bg-white p-5 shadow-[0_8px_24px_rgba(25,27,32,0.06)] sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Decision summary</p>
              <h2 className="mt-1.5 text-[18px] font-semibold tracking-[-0.025em] text-[#191B20]">Approve controlled recovery</h2>
              <div className="mt-3 border-y border-[#E8E7E1] py-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Supported recovery exposure</p><p className="mt-1 text-[26px] font-semibold tracking-[-0.05em] text-[#26734D]">$121,840</p><p className="mt-0.5 text-[11px] leading-5 text-[#595E68]">Evidence-backed position · not a guaranteed reimbursement</p></div>
              <dl className="mt-3 space-y-2.5">{approvalItems.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 text-[11px] leading-4"><dt className="text-[#777A82]">{label}</dt><dd className="text-right font-medium text-[#595E68]">{value}</dd></div>)}</dl>
              <div className="mt-4 rounded-[8px] bg-[#F7F7F4] px-3 py-2.5"><p className="text-[11px] font-semibold text-[#30343B]">Seller approval required</p><p className="mt-1 text-[11px] leading-5 text-[#595E68]">Nothing is submitted to Amazon without review and approval of the evidence and response.</p></div>
              <button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Approve controlled recovery <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
              <p className="mt-3 border-t border-[#E8E7E1] pt-3 text-[11px] leading-5 text-[#595E68]">You are approving the work and decision path—not a guaranteed outcome. Margin remains accountable for the case record, Amazon response, and payout verification.</p>
            </div>
            <div className="mt-2 rounded-[14px] border border-[#E8E7E1] bg-white p-4"><div className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#26734D]" /><div><p className="text-[12px] font-semibold text-[#191B20]">Financial position remains visible</p><p className="mt-1 text-[12px] leading-5 text-[#595E68]">Supported, accounted-for, and unresolved amounts stay separated throughout the operation.</p></div></div></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
