import { useEffect, useRef, useState } from 'react';
import { Files, Layers3, ListChecks, Search, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const operationSteps = [
  'Decision-grade audit position established',
  'Supported population isolated from unresolved signal',
  'Evidence and settlement gaps assigned',
  'Recommended operating boundary defined',
  'Enterprise Control Pilot presented for approval',
  'Margin carries investigation and execution',
  'Settlement, attribution, and ledger state verified',
  'Reconciled / Residual / Reversed / Held',
  'Margin continues examining the account population'
];


const assessmentRail = [
  { label: 'Assessment record', href: '#recovery-workspace-title', icon: ListChecks },
  { label: 'Operating scope', href: '#what-we-found', icon: Layers3 },
  { label: 'Evidence position', href: '#what-we-can-support', icon: Files },
  { label: 'Workspace decision', href: '#why-recovery-workspace', icon: SlidersHorizontal },
  { label: 'Next step', href: '#what-you-control', icon: Search },
] as const;

const assessmentTimeline = ['Audit opened', 'Operating population established', 'Evidence position reviewed', 'Workspace route prepared'] as const;

function FastWorkspaceTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
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

function WorkspaceResponseBuild() {
  const reduceMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(0);
  const items = [
    { text: 'Coverage established across 124,860 orders, 1,842 shipments, 7,630 returns, 31,940 fee records, and 28,600 inventory movements across 8 settlement periods.', highlight: 'yellow' },
    { text: 'The operating population spans 4 marketplaces and 3 legal entities, with 1,126 affected records across 318 SKUs.', highlight: 'blue' },
    { text: 'This is not one bounded event. The records establish a portfolio-level control position.', highlight: 'green' },
  ];
  const highlightClasses: Record<string, string> = { yellow: 'bg-[#FFF1A8]', blue: 'bg-[#DDEBFF]', green: 'bg-[#DDF4E5]' };

  const advance = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveItem((current) => current + 1 >= items.length ? 0 : current + 1), 140);
  };

  return (
    <div className="enterprise-response-build">
      <header className="pb-5">
        <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] bg-[#F1F2F2] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Illustrative audit population · decision-grade account position</mark></p>
        <h1 id="recovery-workspace-title" className="mt-1.5 max-w-2xl font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">The Audit establishes the account&apos;s financial position</h1>
      </header>
      <section className="py-4" aria-labelledby="workspace-opening-position">
        <div className="space-y-1.5">
          {items.map((item, index) => {
            const visible = reduceMotion || index <= activeItem;
            const active = reduceMotion || index === activeItem;
            const typedContent = reduceMotion ? item.text : active ? <FastWorkspaceTypewriter text={item.text} onComplete={advance} /> : index < activeItem ? item.text : null;
            const highlightComplete = reduceMotion || index < activeItem;
            return (
              <motion.div key={`${item.text}-${index}`} initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }} className="text-[14px] leading-6 text-[#595E68]">
                <mark className={`rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] ${highlightComplete ? highlightClasses[item.highlight] : 'bg-transparent'}`}>{typedContent}</mark>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function RecoveryWorkspace() {
  usePageMeta({
    title: 'Recovery Workspace | Margin',
    description: 'Review the Audit position and determine the appropriate enterprise recovery operating structure.',
    url: `${SITE_META.url}/recovery-workspace`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-auto bg-white font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Home US · Amazon Financial Audit</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">31 August 2026 — 13:41 UTC</p>
          </div>
        </div>
      </header>

      <main className="font-google-sans mx-auto min-w-[900px] max-w-[1180px] px-4 py-5 sm:min-w-0 sm:px-6 sm:py-5 lg:px-6">
        <div className="flex items-start gap-3 lg:gap-4">
          <aside aria-label="Recovery Workspace assessment controls" className="sticky top-[76px] flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">
            {assessmentRail.map(({ label, href, icon: Icon }, index) => (
              <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </a>
            ))}
          </aside>
          <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4">
          <article id="recovery-workspace-record" className="relative order-1 min-w-0 rounded-none bg-white px-0 py-5 shadow-none sm:px-6 sm:py-5" aria-labelledby="recovery-workspace-title">
            <div aria-label="Recovery Workspace assessment timeline" className="pointer-events-none absolute bottom-8 left-2 top-8 flex w-6 flex-col items-center justify-between">
              <span aria-hidden="true" className="absolute bottom-2 top-2 w-px bg-[#C9D6DE]" />
              <span className="relative z-10 h-[7px] w-[7px] rounded-full bg-[#0B74DE] shadow-[0_0_0_3px_white]" title={assessmentTimeline[0]} />
            </div>
            <div className="enterprise-assessment-copy pl-12" style={{ zoom: 0.75 }}>
              <WorkspaceResponseBuild />

              <section className="py-4" aria-labelledby="what-we-found">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Financial pattern</mark></p>
              <h2 id="what-we-found" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Portfolio-level finding</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">Inbound receiving variances</mark> recur across multiple settlement periods and marketplaces. The population requires event-level entitlement, evidence testing, settlement reconciliation, and entity attribution before recovery treatment is determined.</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">10 March 2026</mark> — 17 affected units across two related shipments; the receiving and inventory records diverge after the same supplier delivery</li>
                <li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">24 March 2026</mark> — 9 affected units across one shipment; the settlement record does not reconcile to the receiving quantity</li>
                <li><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">9 April and 22 April 2026</mark> — 11 affected units across two shipments; settlement attribution remains unresolved</li>
              </ul>
              <p className="mt-2 text-[14px] leading-6 text-[#595E68]">The Audit separates independent financial events from duplicate records, recurring control failures, and already-accounted-for activity.</p>
            </section>

            <section className="py-4" aria-labelledby="what-this-means">
              <h2 id="what-this-means" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What this means for the operation</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">A single recovery workflow can address one supported event. It does not establish whether the same control failure is recurring across the account.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin distinguishes an isolated event from a repeated exposure pattern, then connects the pattern to the relevant marketplace, entity, settlement period, and evidence population.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">The Audit determines whether the business needs a defined recovery, recurring examination, or an enterprise control boundary.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="what-we-can-support">
              <h2 id="what-we-can-support" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Evidence and control position</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin has separated the reviewed population into supported, partially supported, settlement-pending, and unresolved positions. Supported records can move to controlled preparation; positions without sufficient evidence remain visible but are not counted as recoverable.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">Current control population:</mark></p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">$184,200 indicated exposure · $88,200 evidence-ready · $96,000 requiring evidence or settlement review · 14 source gaps requiring additional documentation.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Unverified conditions remain unresolved — they are not counted as recovered, recoverable, or cleared.</p>
            </section>

            <section className="py-4" aria-labelledby="why-recovery-workspace">
              <h2 id="why-recovery-workspace" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why the operating route matters</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The Audit has established a population that requires more than a single bounded recovery and more than an ungoverned recurring queue.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The recommended next step is an <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">Enterprise Control Pilot</mark> to establish ownership, evidence operations, approval points, and financial close requirements.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the population is narrower than the enterprise boundary requires, Margin routes it to Recover Once or Recovery Workspace instead.</p>
            </section>

            <section className="py-4" aria-labelledby="what-covers">
              <h2 id="what-covers" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What the control review establishes</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The enterprise assessment establishes:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>Operating boundary across marketplaces, legal entities, catalogs, and settlement periods</li>
                <li>Separation of supported exposure from unresolved signal</li>
                <li>Evidence, settlement, attribution, and ledger control requirements</li>
                <li>Ownership and approval points for consequential actions</li>
                <li>Recovery documentation and response operating model</li>
                <li>Deadline, reversal, and residual-position treatment</li>
                <li>Recorded history of findings, decisions, settlements, and outcomes</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Each month, you can see:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>What new issues were identified</li>
                <li>What evidence supports each issue</li>
                <li>What Margin is doing about it</li>
                <li>What has been submitted</li>
                <li>What Amazon decided</li>
                <li>What Amazon credited and what reached settlement</li>
                <li>What remains unresolved</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">If the account is clear, Margin reports that honestly. If it is not, the unresolved position stays visible.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="what-ongoing-means">
              <h2 id="what-ongoing-means" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What recurring control means</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace examines the <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">connected account data available to Margin as new data becomes available</mark>.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is not a promise that a human or system checks every transaction every second.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It means the recurring examination and recovery responsibility remains active while Workspace is active — without turning every signal into a claim.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">New incidents are evaluated against the evidence available at the time. Only <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">qualifying, evidence-supported recovery issues</mark> enter recovery work.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no promise that every detected condition will qualify for submission.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">If a matter falls outside the included operating scope, Margin will show you the difference before proceeding.</mark></p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There are <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">no percentage-based recovery fees</mark>. Margin takes <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">0% of Amazon reimbursements</mark>.</p>
            </section>

            <section className="py-4" aria-labelledby="existing-incidents">
              <h2 id="existing-incidents" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Existing exposure: what happens first</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">supported audit population identified here</mark> is available for operating-scope review.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Assuming the available evidence is sufficient, they typically enter evidence preparation within <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">1–2 business days after approval</mark>.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">New incidents follow their own preparation status and timing as new account data becomes available.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Amazon's response time is outside Margin's control.</p>
            </section>

            <section className="py-4" aria-labelledby="why-price">
              <h2 id="why-price" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Why scope precedes commercial structure</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">An enterprise control boundary cannot be priced responsibly before the operating population, evidence requirements, ownership model, and approval points are established.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The Enterprise Control Pilot establishes the <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">control loop, evidence operations, follow-through, payout checking, and financial-close treatment</mark> required by the account.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">The Audit determines the right operating structure before Margin recommends the commercial structure.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="what-if-no">
              <h2 id="what-if-no" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What happens if Amazon says no?</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If Amazon rejects a recovery matter, Margin records the decision and reason, completes appropriate follow-up where the available evidence supports it, and records the final outcome.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">A rejected or unresolved matter is never represented as recovered.</p>
            </section>

            <section className="py-4" aria-labelledby="what-if-evidence">
              <h2 id="what-if-evidence" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What if Amazon asks for more evidence?</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the required evidence can be obtained from the connected account data or available sources, Margin continues the work.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the required evidence cannot be established, the matter is shown as <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">unresolved</mark> with the reason.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin does not manufacture evidence to keep a case alive.</p>
            </section>

            <section className="py-4" aria-labelledby="does-not-promise">
              <h2 id="does-not-promise" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What Workspace does not promise</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace does <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">not</mark> promise:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>A recovery every month</li>
                <li>A particular reimbursement amount</li>
                <li>Amazon approval</li>
                <li>That every detected condition qualifies for recovery</li>
                <li>That Amazon will respond within a particular timeframe</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Some months may produce no new recovery issues.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#E9DEFF]">Margin will tell you when that happens.</mark></p>
            </section>

            <section className="py-4" aria-labelledby="recover-once-vs-workspace">
              <h2 id="recover-once-vs-workspace" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Recover Once vs Workspace</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-[14px] font-normal text-[#191B20]"><mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Recover Once</mark></h3>
                  <p className="mt-1 text-[14px] leading-6 text-[#595E68]">For a bounded problem you want Margin to resolve once.</p>
                </div>
                <div>
                  <h3 className="text-[14px] font-normal text-[#191B20]"><mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Workspace</mark></h3>
                  <p className="mt-1 text-[14px] leading-6 text-[#595E68]">For a recurring problem you want Margin to keep examining and managing over time.</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If the supported population is narrower than the enterprise boundary requires, Recover Once or Recovery Workspace remains available for the defined scope.</p>
            </section>

            <section className="pt-5" aria-labelledby="what-you-control">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Seller-controlled</mark></p>
              <h2 id="what-you-control" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What you control</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You remain in control of submissions.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-normal"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">Nothing is filed or submitted to Amazon without your approval.</mark></p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You can cancel Workspace at any time.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If you cancel, Workspace remains active through the period you've paid for. Ongoing monitoring and new Workspace operations stop when that paid period ends. Your completed recovery history and recorded outcomes remain available.</p>
            </section>
            </div>
          </article>
          </div>
          </div>

          <aside className="order-2 w-full lg:sticky lg:top-[76px] lg:ml-auto lg:max-w-[380px]" aria-label="Recovery Workspace decision summary">
            <div className="rounded-[10px] border border-[#D7D7D1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-5">
              <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">What happens after you approve</mark></p>
              <h2 className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">The Workspace flow</h2>
              
              <div className="mt-3 py-3">
                <div className="grid gap-2">{operationSteps.map((step, index) => <div key={step} className="flex items-start gap-3 px-1 py-1"><span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-[#3F51A8]">{index === 0 ? "✓" : "↓"}</span><span className={`text-[13px] leading-5 ${index === operationSteps.length - 1 ? 'font-normal text-[#191B20]' : 'text-[#595E68]'}`}>{index === operationSteps.length - 1 ? <mark className="rounded-[2px] bg-[#DDF4E5] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">{step}</mark> : step}</span></div>)}</div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Recommended operating route</mark></p>
                <div className="mt-1.5 flex items-baseline justify-between gap-4">
                  <p className="text-[20px] font-semibold tracking-[-0.04em] text-[#191B20]">Enterprise Control Pilot</p>
                </div>
                <p className="mt-2 text-[13px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#FFF1A8]">$2,500–$25,000 scope-dependent.</mark></p>
                <p className="text-[13px] font-normal leading-5 text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDEBFF]">Commercial structure follows the operating review.</mark></p>
                <p className="mt-1 text-[13px] leading-5 text-[#595E68]">No payment or submission activity begins before scope and approval are agreed.</p>
              </div>
              
              <div className="mt-3 pt-3"><p className="text-[12px] font-normal text-[#191B20]"><mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#DDF4E5]">Before you continue</mark></p><p className="mt-1.5 text-[12px] italic leading-5 text-[#595E68]">I understand that this Audit establishes an operating position, not a guaranteed recovery. I am requesting an Enterprise Control Pilot discussion to establish scope, responsibility, commercial structure, and approval points. Nothing is submitted without my approval.</p></div>
              
              <button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Discuss an Enterprise Pilot</button>
              
              <div className="mt-2.5 text-center">
                <p className="text-[11px] font-medium text-[#595E68]">Scope first · Seller approval required · Smaller routes remain available</p>
              </div>

              <div className="mt-3 rounded-[8px] bg-[#F9F9F6] p-4 text-[12px] leading-5 text-[#595E68]">
                <mark className="rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] bg-[#F1F2F2]">Not ready?</mark> Tell us what is unclear: the audit population, evidence position, operating boundary, control-pilot scope, or how a smaller route would differ.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
