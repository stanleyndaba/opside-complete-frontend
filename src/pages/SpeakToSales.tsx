import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

// Illustrative enterprise review record used to show the operating depth of an enterprise assessment.
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
    signal: 'Cross-marketplace control and reconciliation required',
  },
  finding: 'Reversal exposure was identified across US, CA, UK, and DE operations; affected transactions require an event-level entitlement and settlement reconciliation.',
  findingScope: 'US, CA, UK, and DE marketplace recovery activity from January through August 2026.',
  evidence: 'Settlement records, reimbursement events, shipment records, fee records, and inventory movement records are available for the affected transactions.',
  gaps: '14 affected transactions require additional supporting documentation before recoverable entitlement can be established.',
  exposure: 18420,
};

const reviewSteps = [
  'Establish recoverable entitlement by event, market, and financial cause.',
  'Map the evidence chain and identify control gaps.',
  'Separate supported exposure from unsupported signal.',
  'Define the operating ownership and approval points.',
  'Set the scope across marketplaces, entities, catalogs, and settlement periods.',
  'Agree the commercial structure only after scope and responsibility are established.',
];

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

export default function SpeakToSales() {
  usePageMeta({
    title: 'Request Enterprise Recovery Assessment | Margin',
    description: 'Review a complex recovery situation with Margin before deciding on the right recovery structure.',
    url: `${SITE_META.url}/talk-to-sales`,
    image: SITE_META.image,
  });

  const { scope, complexity } = enterpriseAuditFixture;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 bg-white">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Home US · Enterprise Financial Review</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">31 August 2026 — 13:41 UTC</p>
          </div>
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
      </header>

      <main className="font-google-sans mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-5 lg:px-6">
        <div className="flex flex-col gap-4">
          <article className="order-1 min-w-0 rounded-none bg-white px-0 py-5 shadow-none sm:rounded-[16px] sm:px-6 sm:py-5 sm:shadow-[0_1px_2px_rgba(25,27,32,0.05)]" aria-labelledby="talk-to-sales-title">
            <header className="pb-5">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Enterprise Recovery Assessment</mark></p>
              <h1 id="talk-to-sales-title" className="mt-1.5 max-w-2xl font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">Enterprise recovery control review</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{formatNumber(scope.orders)} orders · {formatNumber(scope.shipments)} shipments · {formatNumber(scope.returns)} returns · {formatNumber(scope.feeRecords)} fee records · {formatNumber(scope.inventoryMovements)} inventory movements</mark></p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">Across <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{scope.marketplaces} marketplaces</mark> from <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{scope.dateRange}</mark>.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">The review identified a cross-marketplace recovery exposure that requires an operating model, not a one-off claim workflow.</p>
            </header>

            <section className="py-4" aria-labelledby="why-escalated">
              <h2 id="why-escalated" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this requires enterprise handling</h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]"><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.recoveryCategories} recovery categories</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{scope.marketplaces} marketplaces</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{formatNumber(complexity.affectedRecords)} affected records</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{formatNumber(complexity.affectedSkus)} affected SKUs</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.activityPeriods}</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{complexity.signal}</mark></li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">This escalation is based on what the Audit found — <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">not simply on the size of your business.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="what-we-found-sales">
              <h2 id="what-we-found-sales" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Material finding</h2>
              <p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{enterpriseAuditFixture.finding}</mark></p>
              <dl className="mt-3 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1] text-[14px] leading-6">
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Scope</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.findingScope}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Evidence currently available</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.evidence}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Known gaps</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.gaps}</dd></div>
              </dl>
              <div className="mt-3 border-y border-[#E8E7E1] text-[13px] leading-5"><div className="grid gap-1 py-2.5 sm:grid-cols-[190px_1fr] sm:items-baseline"><dt className="font-semibold uppercase tracking-tight text-[10px] text-[#777A82]">Indicated recovery exposure</dt><dd className="font-google-sans text-[18px] leading-tight tracking-[-0.03em] text-[#191B20]">${formatNumber(enterpriseAuditFixture.exposure)}</dd></div><p className="border-t border-[#E8E7E1] py-2 text-[12px] leading-5 text-[#595E68]">Based on the records reviewed. This is an indicated exposure, not a promise that Amazon will reimburse this amount.</p></div>
            </section>

            <section className="py-4" aria-labelledby="why-not-standard"><h2 id="why-not-standard" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this is not a standard workflow</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recover Once is designed for a defined recovery with a clear beginning, end, and closeout.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recovery Workspace is designed for recurring recovery work inside a defined operating scope.</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">This exposure requires a broader control boundary than either standard workflow provides.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The right scope must be established from the evidence, operating shape, and financial responsibility the work requires: <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">the correct scope cannot be responsibly determined from the standard offer alone.</mark></p></section>

            <section className="py-4" aria-labelledby="what-happens-next-sales"><h2 id="what-happens-next-sales" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will establish next</h2><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">No payment is collected on this path.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin will establish the financial exposure, evidence position, operating boundary, and decision rights before recommending what it should take on.</p><p className="mt-3 text-[14px] leading-6 text-[#595E68]">Before any operating scope is agreed, we will establish:</p><ol className="mt-2 list-inside list-decimal space-y-1.5 text-[14px] text-[#595E68]">{reviewSteps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-[14px] leading-6 text-[#595E68]">You will receive a proposal covering the agreed scope, responsibilities, commercial structure, and approval point <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">before any payment or recovery submission.</mark></p></section>

            <section className="py-4" aria-labelledby="what-margin-will-not-do"><h2 id="what-margin-will-not-do" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will not compromise</h2><ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#595E68]"><li>We will not turn indicated exposure into promised recovery.</li><li>We will not recommend a larger engagement simply because your business is large.</li><li>We will not manufacture entitlement, scope, or certainty where the evidence does not support it.</li><li>We will not begin paid work before scope, responsibility, and commercial terms are agreed.</li><li>We will not represent an unresolved financial position as recovered.</li></ul><blockquote className="mt-4 border-l-2 border-[#3F51A8] pl-4 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">The evidence determines whether the exposure is real. The operating review determines whether Margin should take responsibility for the control loop.</mark></blockquote></section>

            <section className="py-4" aria-labelledby="you-remain-in-control"><h2 id="you-remain-in-control" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">You remain in control</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no automatic purchase. There is no commitment from starting this conversation. Nothing is submitted to Amazon without your approval.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the evidence shows that Recover Once or Workspace is the better fit, <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">we will tell you.</mark></p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">The goal is the right financial control structure — not the largest one.</mark></p></section>

            <section className="py-4" aria-labelledby="if-right-fit"><h2 id="if-right-fit" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">If this is the right operating fit</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">At this level, the question is not simply:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">“Did Margin find one reimbursement?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">“What financial exposure is sitting across the business, what evidence supports it, and should Margin take responsibility for the control loop?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">That is what the Enterprise Recovery Assessment is designed to determine.</p></section>
          </article>

          <aside className="order-2 w-full lg:ml-auto lg:max-w-[380px]" aria-label="Enterprise Recovery Assessment next step"><div className="rounded-[14px] border border-[#D7D7D1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-5"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Your next step</mark></p><h2 className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Enterprise Recovery Assessment</h2><div className="mt-3 py-3"><p className="text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">A controlled review for complex recovery operations.</mark></p><p className="mt-2 text-[13px] leading-5 text-[#595E68]">Margin will review the evidence, define the operating boundary, and recommend the appropriate next step.</p></div><div className="mt-4 space-y-2 text-[13px] leading-5 text-[#595E68]"><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No payment required.</mark></p><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No commitment required.</mark></p><p>Nothing is submitted without your approval.</p></div><button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Request Enterprise Recovery Assessment</button><p className="mt-3 pt-3 text-[12px] leading-5 text-[#595E68]">If the evidence supports a smaller scope, we will route you to Recover Once or Recovery Workspace instead.</p><p className="mt-2 text-[12px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">The right control structure. Nothing more.</mark></p></div></aside>
        </div>
      </main>
    </div>
  );
}
