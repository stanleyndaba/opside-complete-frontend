import { useEffect, useRef, useState } from 'react';
import { Check, Files, Layers3, ListChecks, Search, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
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

const assessmentTimeline = [
  'Assessment opened',
  'Operating scope established',
  'Complexity assessed',
  'Material finding recorded',
  'Evidence position reviewed',
  'Control gaps identified',
  'Boundary decision prepared',
] as const;

type AssessmentBuildItem = {
  kind: 'heading' | 'paragraph' | 'list' | 'final';
  text: string;
  highlight?: string;
  tone?: string;
};

function FastAssessmentTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      onCompleteRef.current?.();
      return;
    }
    setVisibleText('');
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          if (interval) window.clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, 3);
    }, 70);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);

  return <>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</>;
}

function EnterpriseResponseBuild({ scope, complexity }: { scope: typeof enterpriseAuditFixture.scope; complexity: typeof enterpriseAuditFixture.complexity }) {
  const reduceMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(0);
  const items: AssessmentBuildItem[] = [
    { kind: 'paragraph', text: `${formatNumber(scope.orders)} orders · ${formatNumber(scope.shipments)} shipments · ${formatNumber(scope.returns)} returns · ${formatNumber(scope.feeRecords)} fee records · ${formatNumber(scope.inventoryMovements)} inventory movements`, highlight: 'yellow' },
    { kind: 'paragraph', text: `Across ${scope.marketplaces} marketplaces from ${scope.dateRange}.`, highlight: 'blue' },
    { kind: 'paragraph', text: 'The review identified a cross-marketplace exposure population requiring an operating boundary, not a one-off claim workflow.' },
    { kind: 'paragraph', text: `Operating scope: ${scope.marketplaces} marketplaces · ${scope.legalEntities} legal entities · ${scope.settlementPeriods} settlement periods · ${complexity.recoveryCategories} recovery categories`, highlight: 'blue' },
    { kind: 'heading', text: 'Why this requires an enterprise control boundary', tone: 'subheading' },
    { kind: 'list', text: `${complexity.recoveryCategories} recovery categories`, highlight: 'purple' },
    { kind: 'list', text: `${scope.marketplaces} marketplaces`, highlight: 'yellow' },
    { kind: 'list', text: `${formatNumber(complexity.affectedRecords)} affected records`, highlight: 'blue' },
    { kind: 'list', text: `${formatNumber(complexity.affectedSkus)} affected SKUs`, highlight: 'green' },
    { kind: 'list', text: complexity.activityPeriods, highlight: 'purple' },
    { kind: 'list', text: complexity.signal, highlight: 'yellow' },
    { kind: 'final', text: 'The complexity is determined by the number of records, systems, entities, decisions, and financial states that must remain connected — not simply by the size of your business.', highlight: 'blue' },
    { kind: 'heading', text: 'Material finding', tone: 'subheading' },
    { kind: 'paragraph', text: 'The assessment identified a cross-marketplace exposure population requiring event-level entitlement, evidence sufficiency testing, settlement reconciliation, entity attribution, and reversal monitoring before financial closure.', highlight: 'yellow' },
    { kind: 'heading', text: 'Operating scope', tone: 'subheading' },
    { kind: 'paragraph', text: 'US, CA, UK, and DE marketplace recovery activity from January through August 2026. · 3 legal entities · 8 settlement periods', highlight: 'blue' },
    { kind: 'heading', text: 'Evidence currently available', tone: 'subheading' },
    { kind: 'paragraph', text: 'Settlement records, reimbursement events, shipment records, fee records, and inventory movement records are available for the affected transactions.', highlight: 'green' },
    { kind: 'heading', text: 'Known control gaps', tone: 'subheading' },
    { kind: 'paragraph', text: '14 affected transactions require additional supporting documentation before recoverable entitlement can be established.', highlight: 'purple' },
    { kind: 'heading', text: 'Close requirement', tone: 'subheading' },
    { kind: 'paragraph', text: 'No position is treated as recovered until approved, settled, attributed, and reconciled.', highlight: 'yellow' },
    { kind: 'heading', text: 'Indicated recovery exposure', tone: 'subheading' },
    { kind: 'paragraph', text: '$184,200', highlight: 'blue' },
    { kind: 'final', text: 'Based on the records reviewed. This is an indicated exposure, not a promise that Amazon will reimburse this amount.', highlight: 'blue' },
  ];
  const highlightClasses: Record<string, string> = {
    yellow: 'bg-[#FFF1A8]',
    blue: 'bg-[#DDEBFF]',
    green: 'bg-[#DDF4E5]',
    purple: 'bg-[#E9DEFF]',
  };

  useEffect(() => {
    setActiveItem(0);
  }, [scope.orders]);

  const advance = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveItem((current) => current + 1 >= items.length ? 0 : current + 1), 140);
  };

  return (
    <div className="enterprise-response-build">
      <header className="pb-5">
        <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] bg-[#F1F2F2] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Enterprise financial-control assessment</mark></p>
        <h1 id="talk-to-sales-title" className="mt-1.5 max-w-2xl font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">Recovery operating-boundary review</h1>
      </header>
      <section className="py-4" aria-labelledby="why-escalated">
        <div className="space-y-1.5">
          {items.map((item, index) => {
            const visible = reduceMotion || index <= activeItem;
            const active = reduceMotion || index === activeItem;
            const typedContent = reduceMotion ? item.text : active ? <FastAssessmentTypewriter text={item.text} onComplete={advance} /> : index < activeItem ? item.text : null;
            const content = item.highlight ? <mark className={`rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] ${highlightClasses[item.highlight]}`}>{typedContent}</mark> : typedContent;
            return (
              <motion.div id={item.text === 'Why this requires an enterprise control boundary' ? 'why-escalated' : item.text === 'Material finding' ? 'what-we-found-sales' : undefined} key={`${item.text}-${index}`} initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }} className={item.kind === 'list' ? 'flex items-baseline gap-2 text-[14px] text-[#595E68]' : item.kind === 'heading' ? (item.tone === 'heading' ? 'mt-1.5 font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20]' : 'mt-3 font-google-sans text-[15px] leading-tight tracking-[-0.02em]') : item.kind === 'final' ? 'mt-3 text-[14px] leading-6 text-[#595E68]' : 'text-[14px] leading-6 text-[#595E68]'}>
                {item.kind === 'list' ? <span className="text-[#8A99A3]">•</span> : null}{content}
              </motion.div>
              );
          })}
        </div>
      </section>
    </div>
  );
}

export default function SpeakToSales() {
  usePageMeta({
    title: 'Request Enterprise Recovery Assessment | Margin',
    description: 'Review a complex recovery situation with Margin before deciding on the right recovery structure.',
    url: `${SITE_META.url}/talk-to-sales`,
    image: SITE_META.image,
  });

  const { scope, complexity } = enterpriseAuditFixture;

  return (
    <div className="min-h-screen overflow-x-auto bg-white font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#DCE3E7] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Home US · Enterprise Financial Review</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">31 August 2026 — 13:41 UTC</p>
          </div>
        </div>
        <nav aria-label="Enterprise assessment search" className="mx-auto max-w-[1280px] px-4 pb-2 sm:px-6 lg:px-6">
          <div className="flex h-8 items-center gap-2 rounded-[7px] border border-[#DCE3E7] bg-[#FBFCFC] px-3 text-[11px] text-[#858792] shadow-[0_1px_2px_rgba(25,27,32,0.03)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#8A99A3]" strokeWidth={1.8} aria-hidden="true" />
            <span className="font-medium tracking-tight">Enterprise assessment search</span>
            <span className="ml-auto hidden text-[10px] text-[#A0A5AC] sm:inline">Scope · evidence · boundary · next step</span>
          </div>
        </nav>
      </header>

      <main className="font-google-sans mx-auto min-w-[900px] max-w-[1180px] px-4 py-5 sm:min-w-0 sm:px-6 sm:py-5 lg:px-6">
        <div className="flex items-start gap-3 lg:gap-4">
          <aside aria-label="Enterprise assessment controls" className="sticky top-[76px] flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">
            {assessmentRail.map(({ label, href, icon: Icon }, index) => (
              <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </a>
            ))}
          </aside>
          <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4">
          <article id="enterprise-assessment-record" className="enterprise-assessment-record relative order-1 min-w-0 rounded-none bg-white px-0 py-5 shadow-none sm:px-6 sm:py-5" aria-labelledby="talk-to-sales-title">
            <div aria-label="Enterprise assessment timeline" className="pointer-events-none absolute bottom-8 left-2 top-8 flex w-6 flex-col items-center justify-between">
              <span aria-hidden="true" className="absolute bottom-2 top-2 w-px bg-[#C9D6DE]" />
              {assessmentTimeline.map((stage) => (
                <span key={stage} className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8067] shadow-[0_0_0_3px_white]" title={stage}>
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              ))}
            </div>
            <div className="enterprise-assessment-copy pl-12" style={{ zoom: 0.75 }}>
            <EnterpriseResponseBuild scope={scope} complexity={complexity} />

            <section className="py-4" aria-labelledby="why-not-standard"><h2 id="why-not-standard" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why this is not a standard workflow</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recover Once is designed for a defined recovery with a clear beginning, end, and closeout.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Recovery Workspace is designed for recurring recovery work inside a defined operating scope.</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">This exposure requires a broader control boundary than either standard workflow provides.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The right scope must be established from the evidence, operating shape, and financial responsibility the work requires: <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">the correct scope cannot be responsibly determined from the standard offer alone.</mark></p></section>

            <section className="py-4" aria-labelledby="what-happens-next-sales"><h2 id="what-happens-next-sales" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will establish next</h2><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">No payment is collected on this path.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin will establish the financial exposure, evidence position, operating boundary, and decision rights before recommending what it should take on.</p><p className="mt-3 text-[14px] leading-6 text-[#595E68]">Before any operating scope is agreed, we will establish:</p><ol className="mt-2 list-inside list-decimal space-y-1.5 text-[14px] text-[#595E68]">{reviewSteps.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-[14px] leading-6 text-[#595E68]">You will receive a proposal covering the agreed scope, responsibilities, commercial structure, and approval point <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">before any payment or recovery submission.</mark></p></section>

            <section className="py-4" aria-labelledby="what-margin-will-not-do"><h2 id="what-margin-will-not-do" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will not compromise</h2><ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#595E68]"><li>We will not turn indicated exposure into promised recovery.</li><li>We will not recommend a larger engagement simply because your business is large.</li><li>We will not manufacture entitlement, scope, or certainty where the evidence does not support it.</li><li>We will not begin paid work before scope, responsibility, and commercial terms are agreed.</li><li>We will not represent an unresolved financial position as recovered.</li></ul><blockquote className="mt-4 border-l-2 border-[#3F51A8] pl-4 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">The evidence determines whether the exposure is real. The operating review determines whether Margin should take responsibility for the control loop.</mark></blockquote></section>

            <section className="py-4" aria-labelledby="you-remain-in-control"><h2 id="you-remain-in-control" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">You remain in control</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no automatic purchase. There is no commitment from starting this conversation. Nothing is submitted to Amazon without your approval.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the evidence shows that Recover Once or Workspace is the better fit, <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">we will tell you.</mark></p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">The goal is the right financial control structure — not the largest one.</mark></p></section>

            <section className="py-4" aria-labelledby="if-right-fit"><h2 id="if-right-fit" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">If this is the right operating fit</h2><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">At this level, the question is not simply:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">“Did Margin find one reimbursement?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is:</p><p className="mt-1.5 text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">“What financial exposure is sitting across the business, what evidence supports it, and should Margin take responsibility for the control loop?”</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">That is what the Enterprise Recovery Assessment is designed to determine.</p></section>
            </div>
          </article>

          <aside className="order-2 w-full lg:sticky lg:top-[76px] lg:ml-auto lg:max-w-[380px]" aria-label="Enterprise Recovery Assessment next step"><div className="rounded-[10px] border border-[#D7D7D1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-5"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Your next step</mark></p><h2 className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Discuss an Enterprise Pilot</h2><div className="mt-3 py-3"><p className="text-[14px] font-normal leading-6 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">A controlled review of the enterprise operating boundary.</mark></p><p className="mt-2 text-[13px] leading-5 text-[#595E68]">Margin will establish the scope, responsibility model, commercial structure, and approval points before any paid work or submission activity.</p></div><div className="mt-4 space-y-2 text-[13px] leading-5 text-[#595E68]"><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No payment required.</mark></p><p><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">No commitment required.</mark></p><p>Nothing is submitted without your approval.</p></div><button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Discuss an Enterprise Pilot</button><p className="mt-3 pt-3 text-[12px] leading-5 text-[#595E68]">If the evidence supports a smaller scope, we will route you to Recover Once or Recovery Workspace instead.</p><p className="mt-2 text-[12px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">The right control structure. Nothing more.</mark></p></div></aside>
        </div>
        </div>
        </div>
      </main>
    </div>
  );
}
