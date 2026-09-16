import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

// Isolated presentation fixture for the enterprise review route. This is not customer or production Audit data.
const enterpriseAuditFixture = {
  scope: {
    orders: 12486,
    shipments: 1842,
    returns: 763,
    feeRecords: 3194,
    inventoryMovements: 2860,
    marketplaces: 4,
    dateRange: '1 January – 31 August 2026',
  },
  complexity: {
    recoveryCategories: 7,
    affectedRecords: 1126,
    affectedSkus: 318,
    activityPeriods: '8 months of activity',
    signal: 'Cross-marketplace financial reconciliation required',
  },
  finding: 'Multiple reimbursement reversals were identified across US, CA, UK, and DE operations, with affected transactions requiring cross-marketplace reconciliation.',
  findingScope: 'US, CA, UK, and DE marketplace recovery activity from January through August 2026.',
  evidence: 'Settlement records, reimbursement events, shipment records, fee records, and inventory movement records are available for the affected transactions.',
  gaps: '14 affected transactions require additional supporting documentation before entitlement can be established.',
  exposure: 18420,
};

const reviewSteps = [
  'What is actually recoverable.',
  'What evidence supports it.',
  'What additional evidence may be required.',
  'What work Margin should take responsibility for.',
  'What operating scope is appropriate.',
  'What commercial structure, if any, makes sense.',
];

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export default function SpeakToSales() {
  usePageMeta({
    title: 'Talk to Sales — Recovery Program Review | Margin',
    description: 'Review a complex recovery situation with Margin before deciding on the right recovery structure.',
    url: `${SITE_META.url}/talk-to-sales`,
    image: SITE_META.image,
  });

  const { scope, complexity } = enterpriseAuditFixture;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">FBA Selling Partner Audit</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">27 June 2026 — 13:41 pm UTC</p>
          </div>
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-5 lg:px-6">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <article className="min-w-0 rounded-[16px] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:px-6 sm:py-5" aria-labelledby="talk-to-sales-title">
            <header className="border-b border-[#E8E7E1] pb-7">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">Recovery Program Review</mark></p>
              <h1 id="talk-to-sales-title" className="mt-1.5 max-w-2xl font-lora text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">Complex scale review</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{formatNumber(scope.orders)} orders · {formatNumber(scope.shipments)} shipments · {formatNumber(scope.returns)} returns · {formatNumber(scope.feeRecords)} fee records · {formatNumber(scope.inventoryMovements)} inventory movements</mark></p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">Across <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{scope.marketplaces} marketplaces</mark> from <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{scope.dateRange}</mark>.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">The Audit identified a recovery situation that does not fit responsibly into a standard Recover Once operation or Recovery Workspace.</p>
            </header>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="why-escalated">
              <h2 id="why-escalated" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this was escalated</h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]"><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.recoveryCategories} recovery categories</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{scope.marketplaces} marketplaces</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{formatNumber(complexity.affectedRecords)} affected records</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{formatNumber(complexity.affectedSkus)} affected SKUs</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.activityPeriods}</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{complexity.signal}</mark></li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">This escalation is based on what the Audit found — <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">not simply on the size of your business.</mark></p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-we-found-sales">
              <h2 id="what-we-found-sales" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What we found</h2>
              <p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{enterpriseAuditFixture.finding}</mark></p>
              <dl className="mt-3 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1] text-[14px] leading-6">
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Scope</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.findingScope}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Evidence currently available</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.evidence}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Known gaps</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.gaps}</dd></div>
              </dl>
              <div className="mt-3 border-y border-[#E8E7E1] text-[13px] leading-5"><div className="grid gap-1 py-2.5 sm:grid-cols-[190px_1fr] sm:items-baseline"><dt className="font-semibold uppercase tracking-tight text-[10px] text-[#777A82]">Estimated recovery exposure</dt><dd className="font-lora text-[18px] leading-tight tracking-[-0.03em] text-[#191B20]">${formatNumber(enterpriseAuditFixture.exposure)}</dd></div><p className="border-t border-[#E8E7E1] py-2 text-[12px] leading-5 text-[#595E68]">Based on the records reviewed. This is an estimate, not a promise that Amazon will reimburse this amount.</p></div>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="why-not-standard"><h2 id="why-not-standard" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Why we&apos;re not recommending Recover Once or Workspace</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recover Once is designed for a defined, finishable recovery operation.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recovery Workspace is designed for an established recurring recovery pattern within its standard operating scope.</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">What we found does not fit cleanly into either.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">That does not mean the opportunity is larger simply because this route is being shown. It means <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">the right scope cannot be responsibly determined from the standard offer alone.</mark></p></section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-happens-next-sales"><h2 id="what-happens-next-sales" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What happens next</h2><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">No payment is collected on this path.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">A member of the Margin team will review this Audit and discuss the situation with you.</p><p className="mt-3 text-[14px] leading-6 text-[#595E68]">Together, we&apos;ll establish:</p><ol className="mt-2 list-inside list-decimal space-y-1.5 text-[14px] text-[#595E68]">{reviewSteps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-[14px] leading-6 text-[#595E68]">You will receive a proposal covering the agreed scope, responsibilities, commercial structure, and approval point <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">before any payment or recovery submission.</mark></p></section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-margin-will-not-do"><h2 id="what-margin-will-not-do" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will not do</h2><ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#595E68]"><li>We will not turn an estimate into a promised recovery.</li><li>We will not recommend a larger engagement simply because your business is large.</li><li>We will not manufacture scope where the evidence does not support it.</li><li>We will not charge you before you agree to the proposed engagement.</li><li>And we will not represent an unresolved recovery as recovered.</li></ul><blockquote className="mt-4 border-l-2 border-[#3F51A8] pl-4 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">The Audit determines whether this conversation is warranted. The conversation determines what, if anything, Margin should take on.</mark></blockquote></section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="you-remain-in-control"><h2 id="you-remain-in-control" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">You remain in control</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no automatic purchase. There is no commitment from starting this conversation. Nothing is submitted to Amazon without your approval.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the review shows that Recover Once or Workspace is actually the better fit, <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">we will tell you.</mark></p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">The goal is the right recovery structure — not the largest one.</mark></p></section>

            <section className="py-5" aria-labelledby="if-right-fit"><h2 id="if-right-fit" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">If this is the right fit</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">At this level, the question isn&apos;t simply:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">“Did Margin find one reimbursement?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">“How much recovery work is sitting across the business, and does it make sense for Margin to take responsibility for it?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">That&apos;s what the Recovery Program Review is designed to determine.</p></section>
          </article>

          <aside className="lg:sticky lg:top-20" aria-label="Recovery Program Review next step"><div className="rounded-[14px] border border-[#D7D7D1] bg-white p-5 shadow-[0_8px_24px_rgba(25,27,32,0.06)] sm:p-4"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">Your next step</mark></p><h2 className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Recovery Program Review</h2><div className="mt-4 border-y border-[#E8E7E1] py-4"><p className="text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">A broader review for complex recovery operations.</mark></p><p className="mt-2 text-[13px] leading-5 text-[#595E68]">A Margin team member will review what the Audit found and discuss the appropriate next step with you.</p></div><div className="mt-4 space-y-2 text-[13px] leading-5 text-[#595E68]"><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">No payment required.</mark></p><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">No commitment required.</mark></p><p>Nothing is submitted without your approval.</p></div><button type="button" className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Talk to Sales — Recovery Program Review</button><p className="mt-3 border-t border-[#E8E7E1] pt-4 text-[12px] leading-5 text-[#595E68]">If the scope turns out to be smaller, we&apos;ll route you to Recover Once or Recovery Workspace instead.</p><p className="mt-2 text-[12px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">The right recovery structure. Nothing more.</mark></p></div></aside>
        </div>
      </main>
    </div>
  );
}
