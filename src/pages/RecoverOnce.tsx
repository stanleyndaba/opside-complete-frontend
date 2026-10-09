import { useEffect, useRef, useState } from 'react';
import { Files, Layers3, ListChecks, Search, SlidersHorizontal } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const evidenceRows = [
  ['Shipment movement', '18,420 records', 'Matched', 'Supported', 'green'],
  ['FC receiving events', '17,982 records', '96.8% matched', 'Exception review', 'yellow'],
  ['Inventory ledger', '6,104 adjustments', 'Matched to SAP', 'Supported', 'green'],
  ['Settlement activity', '2.8M rows', 'Reconciled', 'Supported', 'green'],
  ['Returns & reimbursements', '42,610 events', 'Partial match', 'Held', 'yellow'],
  ['General ledger clearing', 'NetSuite postings', '3 open items', 'Review', 'neutral'],
] as const;

const assessmentRail = [
  { label: 'Decision record', href: '#recover-once-title', icon: ListChecks },
  { label: 'Reconciliation bridge', href: '#reconciliation-bridge', icon: Layers3 },
  { label: 'Evidence position', href: '#evidence-sufficiency', icon: Files },
  { label: 'Decision boundary', href: '#record-boundary', icon: SlidersHorizontal },
  { label: 'Next step', href: '#recover-once-title', icon: Search },
] as const;

const assessmentTimeline = [
  'Financial position established',
  'Evidence sufficiency assessed',
  'Recovery case assembled',
  'Seller approval required',
  'Margin responsibility begins',
  'Settlement verification required',
] as const;

type BuildItem = {
  kind: 'paragraph' | 'heading' | 'final';
  text: string;
  highlight?: 'yellow' | 'blue' | 'green' | 'purple';
};

function FastRecoveryTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
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

function RecoveryRecordBuild() {
  const reduceMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState(0);
  const items: BuildItem[] = [
    { kind: 'paragraph', text: 'Margin reconstructed the financial event across operational, inventory, settlement, and ledger records.', highlight: 'blue' },
    { kind: 'paragraph', text: 'The result separates supported exposure from amounts already accounted for and items that remain unresolved.', highlight: 'yellow' },
    { kind: 'paragraph', text: 'The defined operating responsibility can transfer after seller approval.' },
    { kind: 'heading', text: 'Control conclusion' },
    { kind: 'final', text: 'Delegable supported exposure: $121,840', highlight: 'green' },
    { kind: 'paragraph', text: 'The position is evidenced, material, and bounded for controlled recovery action. This is an exposure conclusion, not a guaranteed Amazon reimbursement.', highlight: 'yellow' },
  ];
  const highlightClasses = { yellow: 'bg-[#FFF1A8]', blue: 'bg-[#DDEBFF]', green: 'bg-[#DDF4E5]', purple: 'bg-[#E9DEFF]' };

  useEffect(() => setActiveItem(0), []);

  const advance = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveItem((current) => Math.min(current + 1, items.length)), 140);
  };

  return (
    <div className="recovery-response-build">
      <header className="pb-5">
        <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><mark className="rounded-[2px] bg-[#F1F2F2] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">Financial recovery control record</mark></p>
        <h1 id="recover-once-title" className="mt-1.5 max-w-2xl font-google-sans text-[20px] leading-[1.08] tracking-[-0.03em] text-[#191B20] sm:text-[24px]">Financial position established · controlled recovery ready to transfer</h1>
      </header>
      <section className="py-4" aria-label="Recovery decision record narrative">
        <div className="space-y-1.5">
          {items.map((item, index) => {
            const visible = reduceMotion || index <= activeItem;
            const active = reduceMotion || index === activeItem;
            const typedContent = reduceMotion ? item.text : active ? <FastRecoveryTypewriter text={item.text} onComplete={advance} /> : index < activeItem ? item.text : null;
            const highlightComplete = reduceMotion || index < activeItem;
            const content = item.highlight ? <mark className={`rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] ${highlightComplete ? highlightClasses[item.highlight] : 'bg-transparent'}`}>{typedContent}</mark> : typedContent;
            return (
              <motion.div key={`${item.text}-${index}`} initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }} className={item.kind === 'heading' ? 'mt-3 font-google-sans text-[15px] leading-tight tracking-[-0.02em]' : item.kind === 'final' ? 'mt-3 text-[14px] leading-6 text-[#191B20]' : 'text-[14px] leading-6 text-[#595E68]'}>{content}</motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const Mark = ({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'yellow' | 'blue' | 'green' | 'purple' | 'neutral' }) => {
  const tones = { yellow: 'bg-[#FFF1A8]', blue: 'bg-[#DDEBFF]', green: 'bg-[#DDF4E5]', purple: 'bg-[#E9DEFF]', neutral: 'bg-[#F1F2F2]' };
  return <mark className={`rounded-[2px] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone] ${tones[tone]}`}>{children}</mark>;
};

export default function RecoverOnce() {
  usePageMeta({
    title: 'Recovery Decision Record | Margin',
    description: 'Review an evidence-backed recovery decision record and approve a controlled recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-auto bg-white font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-start gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">Northstar Commerce LLC · Amazon US Recovery Decision Record</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">RCR-2026-00418 · 30 April 2026 · 13:41 UTC</p>
          </div>
        </div>
      </header>

      <main className="font-google-sans mx-auto min-w-[900px] max-w-[1180px] px-4 py-5 sm:min-w-0 sm:px-6 sm:py-5 lg:px-6">
        <div className="flex items-start gap-3 lg:gap-4">
          <aside aria-label="Recovery decision controls" className="sticky top-[76px] flex w-[42px] shrink-0 flex-col items-center gap-2 rounded-[5px] border border-[#DDE3E6] bg-[#EEF1F2] p-1 sm:w-[52px] sm:p-1.5">
            {assessmentRail.map(({ label, href, icon: Icon }, index) => (
              <a key={label} href={href} title={label} aria-label={label} className={`flex h-8 w-8 items-center justify-center rounded-[5px] text-[#52616A] transition-colors hover:bg-[#D9E0E3] hover:text-[#26333A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/35 sm:h-9 sm:w-9 ${index === 0 ? 'bg-[#D9E0E3] text-[#26333A]' : ''}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
              </a>
            ))}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4">
              <article className="relative order-1 min-w-0 rounded-none bg-white px-0 py-5 shadow-none sm:px-6 sm:py-5" aria-labelledby="recover-once-title">
                <div aria-label="Recovery decision timeline" className="pointer-events-none absolute bottom-8 left-2 top-8 flex w-6 flex-col items-center justify-between">
                  <span aria-hidden="true" className="absolute bottom-2 top-2 w-px bg-[#C9D6DE]" />
                  <span className="relative z-10 h-[7px] w-[7px] rounded-full bg-[#0B74DE] shadow-[0_0_0_3px_white]" title={assessmentTimeline[0]} />
                </div>

                <div className="pl-12" style={{ zoom: 0.75 }}>
                  <RecoveryRecordBuild />

                  <section className="py-4" aria-labelledby="reconciliation-bridge">
                    <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><Mark>Reconciliation bridge</Mark></p>
                    <h2 id="reconciliation-bridge" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">From identified variance to supported action</h2>
                    <div className="mt-3 grid gap-0 border-y border-[#E8E7E1] sm:grid-cols-4 sm:divide-x sm:divide-[#E8E7E1]">
                      <div className="py-3 sm:px-3 sm:first:pl-0"><p className="text-[10px] font-normal uppercase tracking-tight text-[#777A82]">Gross identified variance</p><p className="mt-1 text-[18px] font-normal tracking-[-0.03em] text-[#191B20]">$184,260</p><p className="mt-0.5 text-[10px] text-[#595E68]">All detected signals</p></div>
                      <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3"><p className="text-[10px] font-normal uppercase tracking-tight text-[#777A82]">Already accounted for</p><p className="mt-1 text-[18px] font-normal tracking-[-0.03em] text-[#595E68]">($42,300)</p><p className="mt-0.5 text-[10px] text-[#595E68]">Credits and cleared outcomes</p></div>
                      <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3"><p className="text-[10px] font-normal uppercase tracking-tight text-[#777A82]">Insufficient basis</p><p className="mt-1 text-[18px] font-normal tracking-[-0.03em] text-[#8A5A16]">($20,120)</p><p className="mt-0.5 text-[10px] text-[#595E68]">Held pending reconciliation</p></div>
                      <div className="border-t border-[#E8E7E1] py-3 sm:border-t-0 sm:px-3 sm:last:pr-0"><p className="text-[10px] font-normal uppercase tracking-tight text-[#777A82]">Supported exposure</p><p className="mt-1 text-[18px] font-normal tracking-[-0.03em] text-[#26734D]">$121,840</p><p className="mt-0.5 text-[10px] font-normal text-[#26734D]">Actionable position</p></div>
                    </div>
                    <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Margin does not convert a gross signal into a claim. The bridge isolates what the records support, what later activity cleared, and what remains outside the current decision basis.</p>
                  </section>

                  <section className="py-4" aria-labelledby="evidence-sufficiency">
                    <p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><Mark>Evidence sufficiency</Mark></p>
                    <h2 id="evidence-sufficiency" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Source lineage behind the conclusion</h2>
                    <div className="mt-3 overflow-x-auto border-y border-[#E8E7E1]"><table className="w-full min-w-[610px] text-left text-[11px]"><thead><tr className="border-b border-[#E8E7E1] text-[10px] font-normal uppercase tracking-tight text-[#777A82]"><th className="py-2 pr-3">Control area</th><th className="py-2 pr-3">Population</th><th className="py-2 pr-3">Match state</th><th className="py-2">Decision</th></tr></thead><tbody>{evidenceRows.map(([area, population, match, decision, tone]) => <tr key={area} className="border-b border-[#F0EFEA] last:border-0"><td className="py-2.5 pr-3 text-[#30343B]">{area}</td><td className="py-2.5 pr-3 text-[#595E68]">{population}</td><td className="py-2.5 pr-3 text-[#595E68]">{match}</td><td className={`py-2.5 ${tone === 'green' ? 'text-[#26734D]' : tone === 'yellow' ? 'text-[#8A5A16]' : 'text-[#777A82]'}`}>{decision}</td></tr>)}</tbody></table></div>
                    <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The case is bounded by matched shipment, receiving, inventory, and settlement records. Returns, reimbursements, and three ledger items remain visible as exceptions rather than being silently absorbed into the supported position.</p>
                  </section>

                  <section className="py-4" aria-labelledby="materiality"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><Mark>Materiality and economics</Mark></p><h2 id="materiality" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">Is the supported position worth pursuing?</h2><div className="mt-3 grid gap-0 border-y border-[#E8E7E1] sm:grid-cols-5 sm:divide-x sm:divide-[#E8E7E1]">{[['Supported exposure', '$121,840'], ['Modeled recovery likelihood', '82%'], ['Expected recovery value', '$99,909'], ['Operating fee', '$4,800'], ['Expected net value', '$95,109']].map(([label, value], index) => <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[#E8E7E1] py-2.5 last:border-0 sm:block sm:border-0 sm:px-3 sm:first:pl-0 sm:last:pr-0"><p className="text-[10px] font-normal uppercase tracking-tight text-[#777A82]">{label}</p><p className={`text-[14px] tracking-[-0.02em] ${index === 4 ? 'text-[#26734D]' : 'text-[#191B20]'}`}>{value}</p></div>)}</div><p className="mt-3 text-[14px] leading-6 text-[#595E68]">The modeled likelihood is an operating estimate, not a promise. The recommendation reflects materiality, evidence sufficiency, expected value, and the cost of carrying the case through response and settlement verification.</p><p className="mt-3 text-[14px] leading-6 text-[#191B20]"><Mark tone="green">Recommended disposition: Pursue through Recover Once.</Mark></p></section>

                  <section className="py-4" aria-labelledby="controlled-lifecycle"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><Mark>Controlled execution</Mark></p><h2 id="controlled-lifecycle" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">The recovery remains accountable until the outcome is verified</h2><div className="relative mt-3 space-y-0">{assessmentTimeline.map((label, index) => <div key={label} className="relative flex items-center gap-3 py-2"><span className="absolute bottom-[-1px] left-[9px] top-0 w-px bg-[#C9D6DE]" aria-hidden="true" /><span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index < 3 ? 'bg-[#4F8067]' : index === 3 ? 'bg-[#3F51A8]' : index === 4 ? 'bg-[#C99A42]' : 'bg-[#A6ADB3]'} text-white`}><span className="h-1.5 w-1.5 rounded-full bg-white" /></span><span className="flex min-w-0 flex-1 items-center justify-between gap-3"><span className="text-[12px] text-[#595E68]">{label}</span><span className={`text-[10px] ${index < 3 ? 'text-[#26734D]' : index === 3 ? 'text-[#3F51A8]' : index === 4 ? 'text-[#8A5A16]' : 'text-[#777A82]'}`}>{index < 3 ? 'Complete' : index === 3 ? 'Required' : index === 4 ? 'Begins after approval' : 'Required for closure'}</span></span></div>)}</div><p className="mt-3 text-[14px] leading-6 text-[#595E68]">After approval, Margin owns case administration, prepares the Amazon response, records the response basis, manages follow-up and escalation, checks the settlement credit, and keeps the position open until the outcome can be classified as recovered, partially recovered, or unresolved.</p></section>

                  <section className="pt-4" aria-labelledby="record-boundary"><p className="text-[11px] font-normal uppercase tracking-tight text-[#777A82]"><Mark>Decision boundary</Mark></p><h2 id="record-boundary" className="mt-1.5 inline-block font-google-sans text-[15px] font-normal leading-tight tracking-[-0.02em]">What approval means</h2><p className="mt-2 text-[14px] leading-6 text-[#595E68]">Approval authorizes Margin to carry the defined recovery operation described in this record. It does not approve an unbounded claim, and it does not represent the supported exposure as a guaranteed payment.</p><p className="mt-2 text-[14px] leading-6 text-[#191B20]"><Mark tone="purple">The position is established. The work is defined. Responsibility can move to Margin without moving decision rights.</Mark></p></section>
                </div>
              </article>

              {/* Intentionally retained in source and visually hidden per design direction. */}
              <aside className="hidden" aria-hidden="true" aria-label="Recovery decision summary">
                <div className="rounded-[10px] border border-[#D7D7D1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)]"><p className="text-[11px] uppercase text-[#777A82]">Operating handoff</p><h2>Delegate controlled recovery</h2><p>Delegable supported exposure: $121,840</p><button type="button">Delegate controlled recovery</button></div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
