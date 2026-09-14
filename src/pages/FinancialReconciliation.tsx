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
        <section className="border-b border-[#DCE5E5] pb-8 sm:pb-10" aria-labelledby="reconciliation-title">
          <div className="flex items-center gap-3"><div className="h-px w-8 bg-[#0B74DE]" /><span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Recovery financial outcome</span></div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="reconciliation-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[50px]">Recovery Closed</h1>
              <p className="mt-3 text-[14px] text-[#66737F] sm:text-[15px]">ACME-CASE-2005 · Inbound shipment shortage</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#E5F4EC] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#23734D] lg:self-auto"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Financial outcome reconciled</div>
          </div>
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#4D5B66]">The expected entitlement, Amazon response, settlement evidence, and verified outcome all reconcile to the same amount. There is no remaining balance to carry forward.</p>
        </section>

        <section className="border-b border-[#DCE5E5] py-7 sm:py-9" aria-label="Reconciliation amounts">
          <div className="grid gap-0 border-y border-[#E2E8E7] sm:grid-cols-5">
            {amounts.map(([label, value], index) => (
              <div key={label} className={`px-3 py-4 sm:px-4 ${index < amounts.length - 1 ? 'border-b border-[#E2E8E7] sm:border-b-0 sm:border-r' : ''}`}>
                <p className="text-[10px] font-medium uppercase tracking-tight text-[#71818A]">{label}</p>
                <p className="mt-1.5 font-lora text-[22px] tracking-[-0.03em] text-[#182026] sm:text-[24px]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-b border-[#DCE5E5] py-8 sm:py-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
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
