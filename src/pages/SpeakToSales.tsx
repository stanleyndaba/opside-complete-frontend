import { Link } from 'react-router-dom';
import { Files, Layers3, ListChecks, Search, SlidersHorizontal } from 'lucide-react';
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
    legalEntities: 3,
    settlementPeriods: 8,
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
  exposure: 184200,
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

const assessmentRail = [
  { label: 'Assessment record', href: '#talk-to-sales-title', icon: ListChecks },
  { label: 'Operating scope', href: '#why-escalated', icon: Layers3 },
  { label: 'Evidence position', href: '#what-we-found-sales', icon: Files },
  { label: 'Boundary decision', href: '#why-not-standard', icon: SlidersHorizontal },
  { label: 'Next step', href: '#what-happens-next-sales', icon: Search },
] as const;

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
      <header className="sticky top-0 z-50 border-b border-[#DCE3E7] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Home US · Enterprise Financial Review</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">31 August 2026 — 13:41 UTC</p>
          </div>
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
        <nav aria-label="Enterprise assessment search" className="mx-auto max-w-[1280px] px-4 pb-2 sm:px-6 lg:px-6">
          <div className="flex h-8 items-center gap-2 rounded-[7px] border border-[#DCE3E7] bg-[#FBFCFC] px-3 text-[11px] text-[#858792] shadow-[0_1px_2px_rgba(25,27,32,0.03)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#8A99A3]" strokeWidth={1.8} aria-hidden="true" />
            <span className="font-medium tracking-tight">Enterprise assessment search</span>
            <span className="ml-auto hidden text-[10px] text-[#A0A5AC] sm:inline">Scope · evidence · boundary · next step</span>
          </div>
        </nav>
      </header>

      <main className="font-google-sans mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-5 lg:px-6">
        <nav aria-label="Enterprise assessment sections" className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {assessmentRail.map(({ label, href, icon: Icon }, index) => (
            <a key={label} href={href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 py-2 text-[10px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 ${index === 0 ? 'border-[#C9D6DE] bg-[#EEF1F2] text-[#26333A]' : 'border-[#DCE3E7] bg-white text-[#66737F]'}`}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-start gap-3 lg:gap-4">
          <aside aria-label="Enterprise assessment controls" className="sticky top-[76px] hidden w-[52px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1.5 lg:flex">
            {assessmentRail.map(({ label, href, icon: Icon }, index) => (
              <a key={label} href={href} title={label} aria-label={label} className={`flex h-9 w-9 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </a>
            ))}
          </aside>
          <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4">
          <article className="order-1 min-w-0 rounded-none border border-[#DCE8EE] bg-white px-0 py-5 shadow-none sm:rounded-[10px] sm:px-6 sm:py-5 sm:shadow-[0_1px_2px_rgba(24,32,38,0.03)]" aria-labelledby="talk-to-sales-title">
            <header className="pb-5">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Enterprise financial-control assessment</mark></p>
              <h1 id="talk-to-sales-title" className="mt-1.5 max-w-2xl font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">Recovery operating-boundary review</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{formatNumber(scope.orders)} orders · {formatNumber(scope.shipments)} shipments · {formatNumber(scope.returns)} returns · {formatNumber(scope.feeRecords)} fee records · {formatNumber(scope.inventoryMovements)} inventory movements</mark></p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">Across <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{scope.marketplaces} marketplaces</mark> from <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{scope.dateRange}</mark>.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">The review identified a cross-marketplace exposure population requiring an operating boundary, not a one-off claim workflow.</p>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-[#595E68]">Operating scope: <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{scope.marketplaces} marketplaces · {scope.legalEntities} legal entities · {scope.settlementPeriods} settlement periods · {complexity.recoveryCategories} recovery categories</mark></p>
            </header>

            <section className="py-4" aria-labelledby="why-escalated">
              <h2 id="why-escalated" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this requires an enterprise control boundary</h2>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]"><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.recoveryCategories} recovery categories</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{scope.marketplaces} marketplaces</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">{formatNumber(complexity.affectedRecords)} affected records</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">{formatNumber(complexity.affectedSkus)} affected SKUs</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">{complexity.activityPeriods}</mark></li><li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">{complexity.signal}</mark></li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The complexity is determined by the number of records, systems, entities, decisions, and financial states that must remain connected — <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">not simply by the size of your business.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="what-we-found-sales">
              <h2 id="what-we-found-sales" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Material finding</h2>
              <p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">The assessment identified a cross-marketplace exposure population requiring event-level entitlement, evidence sufficiency testing, settlement reconciliation, entity attribution, and reversal monitoring before financial closure.</mark></p>
              <dl className="mt-3 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1] text-[14px] leading-6">
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Operating scope</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.findingScope} · {scope.legalEntities} legal entities · {scope.settlementPeriods} settlement periods</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Evidence currently available</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.evidence}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]"><dt className="text-[#777A82]">Known control gaps</dt><dd className="text-[#595E68]">{enterpriseAuditFixture.gaps}</dd></div>
                <div className="grid gap-1 py-2 sm:grid-cols-[190px_1fr]" ><dt className="text-[#777A82]">Close requirement</dt><dd className="text-[#595E68]">No position is treated as recovered until approved, settled, attributed, and reconciled.</dd></div>
              </dl>
              <div className="mt-3 border-y border-[#E8E7E1] text-[13px] leading-5"><div className="grid gap-1 py-2.5 sm:grid-cols-[190px_1fr] sm:items-baseline"><dt className="font-semibold uppercase tracking-tight text-[10px] text-[#777A82]">Indicated recovery exposure</dt><dd className="font-google-sans text-[18px] leading-tight tracking-[-0.03em] text-[#191B20]">${formatNumber(enterpriseAuditFixture.exposure)}</dd></div><p className="border-t border-[#E8E7E1] py-2 text-[12px] leading-5 text-[#595E68]">Based on the records reviewed. This is an indicated exposure, not a promise that Amazon will reimburse this amount.</p></div>
            </section>

            <section className="py-4" aria-labelledby="why-not-standard"><h2 id="why-not-standard" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this is not a standard workflow</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recover Once is designed for a defined recovery with a clear beginning, end, and closeout.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recovery Workspace is designed for recurring recovery work inside a defined operating scope.</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">This exposure requires a broader control boundary than either standard workflow provides.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The right scope must be established from the evidence, operating shape, and financial responsibility the work requires: <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">the correct scope cannot be responsibly determined from the standard offer alone.</mark></p></section>

            <section className="py-4" aria-labelledby="what-happens-next-sales"><h2 id="what-happens-next-sales" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will establish next</h2><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">No payment is collected on this path.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin will establish the financial exposure, evidence position, operating boundary, and decision rights before recommending what it should take on.</p><p className="mt-3 text-[14px] leading-6 text-[#595E68]">Before any operating scope is agreed, we will establish:</p><ol className="mt-2 list-inside list-decimal space-y-1.5 text-[14px] text-[#595E68]">{reviewSteps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-[14px] leading-6 text-[#595E68]">You will receive a proposal covering the agreed scope, responsibilities, commercial structure, and approval point <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">before any payment or recovery submission.</mark></p></section>

            <section className="py-4" aria-labelledby="what-margin-will-not-do"><h2 id="what-margin-will-not-do" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will not compromise</h2><ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#595E68]"><li>We will not turn indicated exposure into promised recovery.</li><li>We will not recommend a larger engagement simply because your business is large.</li><li>We will not manufacture entitlement, scope, or certainty where the evidence does not support it.</li><li>We will not begin paid work before scope, responsibility, and commercial terms are agreed.</li><li>We will not represent an unresolved financial position as recovered.</li></ul><blockquote className="mt-4 border-l-2 border-[#3F51A8] pl-4 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">The evidence determines whether the exposure is real. The operating review determines whether Margin should take responsibility for the control loop.</mark></blockquote></section>

            <section className="py-4" aria-labelledby="you-remain-in-control"><h2 id="you-remain-in-control" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">You remain in control</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no automatic purchase. There is no commitment from starting this conversation. Nothing is submitted to Amazon without your approval.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the evidence shows that Recover Once or Workspace is the better fit, <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">we will tell you.</mark></p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">The goal is the right financial control structure — not the largest one.</mark></p></section>

            <section className="py-4" aria-labelledby="if-right-fit"><h2 id="if-right-fit" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">If this is the right operating fit</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">At this level, the question is not simply:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">“Did Margin find one reimbursement?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">“What financial exposure is sitting across the business, what evidence supports it, and should Margin take responsibility for the control loop?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">That is what the Enterprise Recovery Assessment is designed to determine.</p></section>
          </article>

          <aside className="order-2 w-full lg:sticky lg:top-[76px] lg:ml-auto lg:max-w-[380px]" aria-label="Enterprise Recovery Assessment next step"><div className="rounded-[10px] border border-[#D7D7D1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-5"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Your next step</mark></p><h2 className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Discuss an Enterprise Pilot</h2><div className="mt-3 py-3"><p className="text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">A controlled review of the enterprise operating boundary.</mark></p><p className="mt-2 text-[13px] leading-5 text-[#595E68]">Margin will establish the scope, responsibility model, commercial structure, and approval points before any paid work or submission activity.</p></div><div className="mt-4 space-y-2 text-[13px] leading-5 text-[#595E68]"><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No payment required.</mark></p><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No commitment required.</mark></p><p>Nothing is submitted without your approval.</p></div><button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Discuss an Enterprise Pilot</button><p className="mt-3 pt-3 text-[12px] leading-5 text-[#595E68]">If the evidence supports a smaller scope, we will route you to Recover Once or Recovery Workspace instead.</p><p className="mt-2 text-[12px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">The right control structure. Nothing more.</mark></p></div></aside>
        </div>
        </div>
        </div>
      </main>
    </div>
  );
}
