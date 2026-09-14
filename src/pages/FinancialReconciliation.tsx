import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const timeline = [
  ['Recovery identified', 'Discrepancy linked to the recovery record.'],
  ['Submitted', 'Case submitted to Amazon on Jun 3, 2026.'],
  ['Amazon responded', 'Amazon response recorded at $963.10.'],
  ['Payment detected', 'Paid recorded in the settlement trail.'],
  ['Payment verified', '$963.10 supported by Settlement SETTLE-ACME-PAYOUT-01.'],
  ['Closed', 'Financial outcome fully reconciled.'],
] as const;

const amounts = [
  ['Expected entitlement', '$963.10'],
  ['Amazon response', '$963.10'],
  ['Financial evidence', '$963.10'],
  ['Verified outcome', '$963.10'],
  ['Remaining', '$0.00'],
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
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026]">
      <header className="border-b border-[#E2E6E3] bg-[#FAFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-7">
          <Link to="/" className="inline-flex items-center gap-2.5 rounded-md outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-[#0B74DE] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#182026]">Margin</span>
          </Link>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Financial reconciliation</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-8 sm:px-7 sm:py-12">
        <section className="border-b border-[#DCE5E5] pb-8 sm:pb-10" aria-labelledby="approved-reimbursements-title">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Verified outcomes</p>
              <h2 id="approved-reimbursements-title" className="mt-1 font-lora text-[22px] leading-tight tracking-[-0.035em] text-[#182026]">Reconciled cases</h2>
              <p className="mt-2 max-w-[680px] text-[13px] leading-6 text-[#66737F]">Cases with both a recorded approval and positive payment evidence linked to the tenant&apos;s financial event trail.</p>
            </div>
            <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View impact report <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 grid gap-0 border-y border-[#E2E8E7] sm:grid-cols-3">
            {[
              ['Reconciliation evidence', '9 recorded', 'Each displayed outcome has filing-linked approval truth.'],
              ['Verified paid', '$17,383.40', 'Positive reimbursement events matched to these outcomes.'],
              ['Payout proof', '7 linked', 'Each entry exposes a recorded settlement, payout batch, or event reference.'],
            ].map(([label, value, detail], index) => (
              <div key={label} className={`px-3 py-3 sm:px-4 ${index < 2 ? 'border-b border-[#E2E8E7] sm:border-b-0 sm:border-r' : ''}`}>
                <p className="text-[10px] font-medium uppercase tracking-tight text-[#71818A]">{label}</p>
                <p className="mt-1 font-lora text-[17px] tracking-[-0.03em] text-[#182026]">{value}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#66737F]">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-[8px] border border-[#E2E8E7] bg-white px-3 py-2 text-[11px] text-[#8A99A5]">
            <span className="text-[16px]">⌕</span><span className="flex-1">Query outcomes by case ID, seller, or amount...</span><span className="rounded-[5px] bg-[#F1F3F4] px-2 py-1 font-mono text-[10px] text-[#66737F]">⌘ K</span>
          </div>
          <div className="mt-3 overflow-x-auto rounded-[8px] border border-[#E2E8E7] bg-white">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead><tr className="border-b border-[#E2E8E7] text-[10px] font-medium tracking-tight text-[#71818A]"><th className="px-4 py-3">Recovery outcome</th><th className="px-4 py-3">Registry reference</th><th className="px-4 py-3">Amazon case</th><th className="px-4 py-3 text-right">Reimbursed</th><th className="px-4 py-3">Closeout</th><th className="px-4 py-3">Recorded</th></tr></thead>
              <tbody>{verifiedOutcomes.map(([outcome, seller, registry, amazonCase, reimbursed, closeout, settlement, recorded]) => <tr key={registry} className="border-b border-[#EEF1F0] last:border-b-0"><td className="px-4 py-4"><p className="text-[12px] font-semibold text-[#182026]">{outcome}</p><p className="mt-1 text-[11px] text-[#66737F]">{seller}</p></td><td className="px-4 py-4 font-mono text-[11px] text-[#4D5B66]">{registry}</td><td className="px-4 py-4 font-mono text-[11px] text-[#4D5B66]">{amazonCase}</td><td className="px-4 py-4 text-right text-[13px] font-semibold tabular-nums text-[#182026]">{reimbursed}</td><td className="px-4 py-4"><p className="text-[11px] font-semibold text-[#182026]">{closeout}</p><p className="mt-1 font-mono text-[10px] text-[#66737F]">{settlement}</p></td><td className="px-4 py-4 font-mono text-[10px] text-[#66737F]">{recorded}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[#8A99A5]">Showing 9 of 9 reconciled cases</p>
        </section>

        <section className="border-b border-[#DCE5E5] pb-8 sm:pb-10" aria-labelledby="reconciliation-title">
          <div className="flex items-center gap-3"><div className="h-px w-8 bg-[#0B74DE]" /><span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Recovery financial outcome</span></div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="reconciliation-title" className="font-lora text-[14px] leading-tight tracking-[-0.045em] text-[#182026] sm:text-[20px]">Recovery Closed</h1>
              <p className="mt-3 text-[14px] text-[#66737F] sm:text-[15px]">ACME-CASE-2005 · Inbound shipment shortage</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#E5F4EC] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#23734D] lg:self-auto"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Financial outcome reconciled</div>
          </div>
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#4D5B66]">The expected entitlement, Amazon response, settlement evidence, and verified outcome all reconcile to the same amount. There is no remaining balance to carry forward.</p>
        </section>

        <section className="border-b border-[#DCE5E5] py-5 sm:py-6" aria-label="Reconciliation amounts">
          <div className="max-w-[520px] divide-y divide-[#E2E8E7] border-y border-[#E2E8E7]">
            {amounts.map(([label, value], index) => (
              <div key={label} className="flex items-baseline justify-between gap-6 px-3 py-2.5 sm:px-4">
                <p className="text-[10px] font-medium uppercase tracking-tight text-[#71818A]">{label}</p>
                <p className="font-lora text-[17px] tracking-[-0.03em] text-[#182026]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 border-b border-[#DCE5E5] py-6 sm:py-7 lg:grid-cols-[1fr_0.9fr] lg:gap-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Closeout decision</p>
            <h2 className="mt-2 font-lora text-[26px] leading-tight tracking-[-0.035em] text-[#182026]">Why this is closed</h2>
            <p className="mt-3 max-w-[610px] text-[14px] leading-6 text-[#4D5B66]">Expected, paid, and verified amounts reconcile completely.</p>
            <div className="mt-7 border-t border-[#E2E8E7] pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Financial evidence</p>
              <dl className="mt-4 grid gap-4 text-[13px] sm:grid-cols-2">
                <div><dt className="text-[#71818A]">Settlement reference</dt><dd className="mt-1 font-mono text-[12px] text-[#182026]">SETTLE-ACME-PAYOUT-01</dd></div>
                <div><dt className="text-[#71818A]">Settlement date</dt><dd className="mt-1 text-[#182026]">Jun 14, 2026</dd></div>
                <div><dt className="text-[#71818A]">Settlement status</dt><dd className="mt-1 text-[#182026]">Paid</dd></div>
                <div><dt className="text-[#71818A]">Payment attribution</dt><dd className="mt-1 text-[#182026]">Payment confidently attributed to this recovery</dd></div>
              </dl>
            </div>
            <div className="mt-7 border-l-2 border-[#198A68] pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Next state</p>
              <p className="mt-1 text-[14px] font-medium text-[#182026]">Recovery closed. No further action required.</p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Evidence chain</p>
            <h2 className="mt-2 font-lora text-[26px] leading-tight tracking-[-0.035em] text-[#182026]">Recovery evidence chain</h2>
            <div className="relative mt-5 space-y-5 pl-6">
              <div className="absolute bottom-2 left-[4px] top-2 w-px bg-[#CFE0E0]" />
              {timeline.map(([title, detail]) => (
                <div key={title} className="relative">
                  <div className="absolute -left-[25px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#FAFAF7] bg-[#198A68]"><Check className="h-2 w-2 text-white" strokeWidth={3} /></div>
                  <p className="text-[13px] font-semibold text-[#182026]">{title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[12px] font-semibold text-[#182026]">The seller position is clear.</p><p className="mt-1 text-[12px] leading-5 text-[#66737F]">The recovery is closed because the financial record supports closure.</p></div>
          <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View verified outcomes <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>
      </main>
    </div>
  );
}
