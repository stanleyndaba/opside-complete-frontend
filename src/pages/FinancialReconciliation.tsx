import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const timeline = [
  ['Recovery identified', 'Discrepancy linked to the recovery record.'],
  ['Submitted', 'Case submitted to Amazon on Jun 3, 2026.'],
  ['Amazon responded', 'Amazon response recorded at $963.10.'],
  ['Settlement credit detected', 'Settlement credit recorded in the payout trail.'],
  ['Settlement credit verified', '$963.10 supported by Settlement SETTLE-NSH-PAYOUT-01.'],
  ['Reconciliation closed', 'Financial outcome fully reconciled.'],
] as const;

const verifiedOutcomes = [
  ['Inbound shipment shortage', 'Northstar Home Goods', 'RFD-16942-INB', '19822888381', '$2,410.50', 'Clean settlement match', 'SETTLE-205-771', 'Jun 11, 2026'],
  ['Customer return reimbursement', 'Harbor & Pine Living', 'RFD-16987-RET', '19823011427', '$1,876.20', 'Clean settlement match', 'SETTLE-205-804', 'Jun 10, 2026'],
  ['FBA fee overcharge', 'Cedar Peak Outfitters', 'RFD-17011-FEE', '19823100562', '$3,294.75', 'Clean settlement match', 'SETTLE-205-826', 'Jun 8, 2026'],
  ['Removal order shortage', 'Morrow Kitchen Co.', 'RFD-17042-REM', '19823244903', '$1,465.80', 'Clean settlement match', 'SETTLE-205-849', 'Jun 6, 2026'],
  ['Warehouse damage reimbursement', 'Fieldstone Wellness', 'RFD-17088-DMG', '19823410218', '$2,788.40', 'Clean settlement match', 'SETTLE-205-881', 'Jun 4, 2026'],
  ['Duplicate charge recovery', 'Brightline Home Systems', 'RFD-17106-DUP', '19823577840', '$2,124.65', 'Clean settlement match', 'SETTLE-205-903', 'Jun 2, 2026'],
  ['Inventory reimbursement variance', 'Atlas Outdoor Supply', 'RFD-17155-INV', '19823761029', '$1,960.00', 'Clean settlement match', 'SETTLE-205-927', 'May 30, 2026'],
  ['Lost-inbound carton recovery', 'Westline Consumer Goods', 'RFD-17188-CAR', '19823844211', '$1,014.00', 'Clean settlement match', 'SETTLE-205-944', 'May 28, 2026'],
  ['Referral fee correction', 'Oak & Ember Market', 'RFD-17204-REF', '19823900186', '$449.10', 'Clean settlement match', 'SETTLE-205-958', 'May 26, 2026'],
] as const;

export default function FinancialReconciliation() {
  usePageMeta({
    title: 'Financial Reconciliation | Margin',
    description: 'See what the recovery was expected to produce, what Amazon paid, and how the outcome was verified.',
    url: `${SITE_META.url}/financial-reconciliation`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-google-sans text-[#182026]">
      <main className="mx-auto max-w-[1180px] px-5 py-5 sm:px-7 sm:py-7">
        <section className="border-b border-[#DCE5E5] pb-5 sm:pb-6" aria-labelledby="approved-reimbursements-title">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="approved-reimbursements-title" className="mt-1 font-google-sans text-[22px] leading-tight tracking-[-0.035em] text-[#182026]">Reconciled cases</h2>
              <p className="mt-1 max-w-[680px] text-[12px] leading-5 text-[#66737F]">Cases with recorded approval and positive settlement evidence linked to the seller&apos;s financial event trail.</p>
            </div>
            <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View verified impact <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-5 max-w-[820px] text-[12px] leading-6 text-[#4D5B66]">
            <p><span className="font-semibold text-[#182026]">Reconciliation evidence:</span> 9 recorded outcomes carry approval, settlement, and payout evidence. Across those outcomes, <span className="font-semibold text-[#182026]">$17,383.40</span> has been verified as paid through positive reimbursement events.</p>
            <p className="mt-2"><span className="font-semibold text-[#182026]">Settlement trace:</span> 7 entries expose a settlement, payout batch, or event reference, so the record can be followed from approval to credited cash.</p>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-[8px] border border-[#E2E8E7] bg-white px-3 py-2 text-[11px] text-[#8A99A5]">
            <span className="text-[16px]">⌕</span><span className="flex-1">Query outcomes by case ID</span><span className="rounded-[5px] bg-[#F1F3F4] px-2 py-1 font-google-sans text-[10px] text-[#66737F]">⌘ K</span>
          </div>
          <div className="mt-5">
            {verifiedOutcomes.map(([outcome, seller, registry, amazonCase, reimbursed, closeout, settlement, recorded], index) => <article key={registry} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[22px_minmax(0,1fr)] sm:gap-4">
              {index < verifiedOutcomes.length - 1 ? <span className="absolute bottom-[-1px] left-[9px] top-[38px] w-px bg-[#C9D6DE] sm:left-[10px]" aria-hidden="true" /> : null}
              <span className="relative z-10 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0B74DE]" aria-label="Reconciliation verified"><Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /></span>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-[11px] font-semibold tracking-tight text-[#182026]">{outcome}</p><span className="text-[11px] font-semibold tabular-nums text-[#182026]">{reimbursed}</span><span className="text-[10px] text-[#66737F]">{recorded}</span></div><p className="mt-0.5 text-[10px] text-[#66737F]">{seller} · {registry} · Amazon case {amazonCase}</p><p className="mt-1 text-[10px] leading-4 text-[#4D5B66]">{closeout} · Settlement {settlement}</p></div>
            </article>)}
          </div>
          <p className="mt-2 text-[11px] text-[#8A99A5]">Showing 9 of 9 reconciled cases</p>
        </section>

        <section className="border-b border-[#DCE5E5] pb-5 sm:pb-6" aria-labelledby="reconciliation-title">
          <div className="flex items-center gap-3"><div className="h-px w-8 bg-[#0B74DE]" /><span className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Financial closeout</span></div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="reconciliation-title" className="font-google-sans text-[14px] leading-tight tracking-[-0.045em] text-[#182026] sm:text-[20px]">Reconciled recovery</h1>
              <p className="mt-1 text-[12px] text-[#66737F]">RFD-16942-INB · Inbound shipment shortage</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#E8F1FB] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE] lg:self-auto"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Settlement reconciled</div>
          </div>
          <p className="mt-3 max-w-[680px] text-[13px] leading-5 text-[#4D5B66]">The expected entitlement, Amazon response, settlement credit, and verified outcome reconcile to the same amount. No unresolved balance remains to carry forward.</p>
        </section>

        <section className="border-b border-[#DCE5E5] py-5 sm:py-6" aria-label="Reconciliation amounts">
          <p className="max-w-[760px] text-[12px] leading-5 tracking-tight text-[#4D5B66]">The expected entitlement was <span className="font-semibold text-[#182026]">$963.10</span>. Amazon recorded <span className="font-semibold text-[#182026]">$963.10</span>, the settlement trail confirms <span className="font-semibold text-[#182026]">$963.10</span> credited, and the verified remaining balance is <span className="font-semibold text-[#182026]">$0.00</span>. The financial position is fully reconciled.</p>
        </section>

        <section className="grid gap-6 border-b border-[#DCE5E5] py-6 sm:py-7 lg:grid-cols-[1fr_0.9fr] lg:gap-10">
          <div>
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Closeout control</p>
            <h2 className="mt-1 font-google-sans text-[20px] leading-tight tracking-[-0.035em] text-[#182026]">Why this is closed</h2>
            <p className="mt-2 max-w-[610px] text-[12px] leading-5 text-[#4D5B66]">Expected entitlement, settlement credit, and verified cash outcome reconcile completely.</p>
            <div className="mt-5 border-t border-[#E2E8E7] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Settlement evidence</p>
              <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
                <div><dt className="text-[#71818A]">Settlement reference</dt><dd className="mt-1 font-google-sans text-[12px] text-[#182026]">SETTLE-NSH-PAYOUT-01</dd></div>
                <div><dt className="text-[#71818A]">Settlement date</dt><dd className="mt-1 text-[#182026]">Jun 14, 2026</dd></div>
                <div><dt className="text-[#71818A]">Settlement status</dt><dd className="mt-1 text-[#182026]">Paid</dd></div>
                <div><dt className="text-[#71818A]">Settlement credit attribution</dt><dd className="mt-1 text-[#182026]">Settlement credit attributed to Northstar Home US recovery RFD-16942-INB</dd></div>
              </dl>
            </div>
            <div className="mt-5 border-l-2 border-[#0B74DE] pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Record state</p>
              <p className="mt-1 text-[14px] font-medium text-[#182026]">Closed — no unresolved balance remains.</p>
            </div>
          </div>

          <div>
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Settlement evidence chain</p>
            <h2 className="mt-2 font-google-sans text-[26px] leading-tight tracking-[-0.035em] text-[#182026]">Evidence-to-settlement chain</h2>
            <div className="relative mt-5 space-y-5 pl-6">
              <div className="absolute bottom-2 left-[4px] top-2 w-px bg-[#CFE0E0]" />
              {timeline.map(([title, detail]) => (
                <div key={title} className="relative">
                  <div className="absolute -left-[25px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#FAFAF7] bg-[#0B74DE]"><Check className="h-2 w-2 text-white" strokeWidth={3} /></div>
                  <p className="text-[13px] font-semibold text-[#182026]">{title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[12px] font-semibold text-[#182026]">The seller position is reconciled.</p><p className="mt-1 text-[12px] leading-5 text-[#66737F]">The recovery is closed because expected, credited, and settled amounts reconcile.</p></div>
          <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View reconciled outcomes <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>
      </main>
    </div>
  );
}
