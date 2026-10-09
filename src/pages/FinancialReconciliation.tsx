import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const timeline = [
  ['Entitlement established', 'The supported position is tied to the governed event population.'],
  ['Submission scope approved', 'Only the supported exposure enters the controlled recovery route.'],
  ['Amazon decision recorded', 'The response and approved scope remain attached to the event record.'],
  ['Settlement population identified', 'The relevant settlement period, payout batch, and account are isolated.'],
  ['Credit matched to settlement', 'The credited amount is tested against settlement activity.'],
  ['Entity and attribution verified', 'The credit is assigned to the correct legal entity and merchant account.'],
  ['Ledger treatment confirmed', 'Downstream financial evidence agrees with the settlement outcome.'],
  ['Residual and reversal checks completed', 'Open balances, reversals, and attribution exceptions are classified.'],
  ['Financial position closed', 'Only the reconciled scope is treated as complete.'],
] as const;

const reconciliationNarrative = [
  'Q1 2026 financial close population. Approved value is not treated as closed until settlement, attribution, ledger treatment, and residual checks agree.',
  'Across 684 positions reviewed, Margin approved $2.84M of supported exposure. $2.51M has since settled and been verified, while $184K remains visible as residual exposure under control.',
  'Close-control population: 412 positions are closed, 92 require evidence or settlement action, and $96K remains under reversal or attribution watch.',
  'Control rule: approved value, credited value, settled value, and downstream ledger treatment remain distinct until the financial position is fully reconciled.',
] as const;

function ReconciliationNarrativeBuild({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const completionSent = useRef(false);
  const [currentSegment, setCurrentSegment] = useState(reduceMotion ? reconciliationNarrative.length : 0);
  const [visibleText, setVisibleText] = useState('');

  useEffect(() => {
    if (reduceMotion || currentSegment >= reconciliationNarrative.length) return;
    setVisibleText('');
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(reconciliationNarrative[currentSegment].slice(0, index));
        if (index >= reconciliationNarrative[currentSegment].length) {
          if (interval) window.clearInterval(interval);
          window.setTimeout(() => setCurrentSegment((segment) => segment + 1), 160);
        }
      }, 3);
    }, currentSegment === 0 ? 90 : 40);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [currentSegment, reduceMotion]);

  useEffect(() => {
    if (currentSegment >= reconciliationNarrative.length && !completionSent.current) {
      completionSent.current = true;
      onComplete();
    }
  }, [currentSegment, onComplete]);

  const completed = reduceMotion ? reconciliationNarrative.length : currentSegment;
  const renderStatement = (text: string) => {
    if (text !== reconciliationNarrative[1]) return text;
    return <>Across 684 positions reviewed, Margin approved <mark className="rounded-[2px] bg-[#DDEBFF] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">$2.84M</mark> of supported exposure. <mark className="rounded-[2px] bg-[#DDF4E5] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">$2.51M has since settled and been verified</mark>, while <mark className="rounded-[2px] bg-[#FFF1A8] px-0.5 font-normal text-[#30343B] [box-decoration-break:clone]">$184K remains visible as residual exposure under control</mark>.</>;
  };

  return (
    <div className="mt-1 max-w-[820px] space-y-3 text-[13px] leading-6 text-[#4D5B66]">
      {completed > 0 || currentSegment === 0 ? <p>{completed > 0 ? reconciliationNarrative[0] : visibleText}{completed === 0 ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</p> : null}
      {completed > 0 ? <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View verified impact <ArrowRight className="h-3.5 w-3.5" /></Link> : null}
      {completed > 1 || currentSegment === 1 ? <div className="border-y border-[#DCE5E5] py-4"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Close-control statement</p><p className="mt-2 text-[16px] leading-7 tracking-[-0.02em] text-[#4D5B66]">{completed > 1 ? renderStatement(reconciliationNarrative[1]) : visibleText}<span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /></p></div> : null}
      {completed > 2 || currentSegment === 2 ? <p><span className="font-semibold text-[#182026]">Close-control population:</span> {completed > 2 ? reconciliationNarrative[2].replace('Close-control population: ', '') : visibleText.replace('Close-control population: ', '')}<span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /></p> : null}
      {completed > 3 || currentSegment === 3 ? <p><span className="font-semibold text-[#182026]">Control rule:</span> {completed > 3 ? reconciliationNarrative[3].replace('Control rule: ', '') : visibleText.replace('Control rule: ', '')}<span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /></p> : null}
    </div>
  );
}

const verifiedOutcomes = [
  ['Inbound recovery cohort', 'Northstar Home Goods', 'RFD-16942-INB', '19822888381', '$184,600.00', '$172,400.00', '$172,400.00', 'Reconciled · approved scope closed', 'SETTLE-205-771', 'Jun 11, 2026'],
  ['Return credit population', 'Harbor & Pine Living', 'RFD-16987-RET', '19823011427', '$96,300.00', '$81,200.00', '$74,900.00', 'Partial settlement · residual open', 'SETTLE-205-804', 'Jun 10, 2026'],
  ['FBA fee correction cohort', 'Cedar Peak Outfitters', 'RFD-17011-FEE', '19823100562', '$42,800.00', '$42,800.00', '$42,800.00', 'Reconciled · no residual', 'SETTLE-205-826', 'Jun 8, 2026'],
  ['Removal reimbursement', 'Morrow Kitchen Co.', 'RFD-17042-REM', '19823244903', '$68,400.00', '$68,400.00', '$52,100.00', 'Partial settlement · residual open', 'SETTLE-205-849', 'Jun 6, 2026'],
  ['Warehouse damage cohort', 'Fieldstone Wellness', 'RFD-17088-DMG', '19823410218', '$31,700.00', '$29,600.00', '$0.00', 'Approved · awaiting settlement', 'SETTLE-205-881', 'Jun 4, 2026'],
  ['Inventory adjustment', 'Atlas Outdoor Supply', 'RFD-17155-INV', '19823761029', '$21,900.00', '$18,300.00', '$19,100.00', 'Settlement received · attribution review', 'SETTLE-205-927', 'May 30, 2026'],
  ['Prior recovery population', 'Westline Consumer Goods', 'RFD-17188-CAR', '19823844211', '$14,800.00', '$14,800.00', '$14,800.00', 'Reversal watch active', 'SETTLE-205-944', 'May 28, 2026'],
] as const;

function SettlementOutcomeSequence({ enabled, onComplete }: { enabled: boolean; onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(reduceMotion ? verifiedOutcomes.length - 1 : -1);
  const [lineReady, setLineReady] = useState(false);
  useEffect(() => {
    if (!enabled || reduceMotion) return;
    setActiveIndex(0);
    setLineReady(false);
  }, [enabled, reduceMotion]);
  useEffect(() => {
    if (!enabled || reduceMotion || activeIndex < 0 || activeIndex >= verifiedOutcomes.length) return;
    setLineReady(false);
    const lineTimer = window.setTimeout(() => setLineReady(true), 280);
    const nextTimer = window.setTimeout(() => {
      if (activeIndex === verifiedOutcomes.length - 1) {
        onComplete();
      } else {
        setActiveIndex((index) => Math.min(index + 1, verifiedOutcomes.length - 1));
      }
    }, activeIndex === verifiedOutcomes.length - 1 ? 1500 : 620);
    return () => {
      window.clearTimeout(lineTimer);
      window.clearTimeout(nextTimer);
    };
  }, [activeIndex, enabled, onComplete, reduceMotion]);
  if (!enabled) return null;
  return (
    <div className="mt-5">
      {verifiedOutcomes.map(([outcome, seller, registry, amazonCase, supported, approved, settled, state, settlement, recorded], index) => {
        const visible = reduceMotion || index <= activeIndex;
        const connectorActive = reduceMotion || index < activeIndex || (index === activeIndex && lineReady);
        if (!visible) return null;
        return (
          <article key={registry} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[22px_minmax(0,1fr)] sm:gap-4">
            {index < verifiedOutcomes.length - 1 ? <span className={`absolute bottom-[-1px] left-[9px] top-[38px] w-px origin-top bg-[#C9D6DE] transition-transform duration-300 sm:left-[10px] ${connectorActive ? 'scale-y-100' : 'scale-y-0'}`} aria-hidden="true" /> : null}
            <span className={`relative z-10 mt-0.5 flex h-4 w-4 items-center justify-center text-[14px] font-semibold leading-none ${state.includes('Residual') || state.includes('awaiting') ? 'text-[#C28B00]' : state.includes('watch') || state.includes('attribution') ? 'text-[#8A641B]' : 'text-[#4B946F]'}`} aria-label="Settlement control state">✓</span>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-[11px] font-semibold tracking-tight text-[#182026]">{outcome}</p><span className="text-[11px] font-semibold tabular-nums text-[#182026]">{supported}</span><span className="text-[10px] text-[#66737F]">{state}</span><span className="text-[10px] text-[#66737F]">{recorded}</span></div><p className="mt-0.5 text-[10px] text-[#66737F]">{seller} · {registry} · Amazon case {amazonCase}</p><p className="mt-1 text-[10px] leading-4 text-[#4D5B66]">Approved {approved} · Settled {settled} · {state} · Settlement {settlement}</p></div>
          </article>
        );
      })}
    </div>
  );
}

export default function FinancialReconciliation() {
  usePageMeta({
    title: 'Financial Reconciliation | Margin',
    description: 'See what the recovery was expected to produce, what Amazon approved, what reached settlement, and how the financial position was closed.',
    url: `${SITE_META.url}/financial-reconciliation`,
    image: SITE_META.image,
  });

  const [showVerifiedOutcomes, setShowVerifiedOutcomes] = useState(false);
  const [sequenceCycle, setSequenceCycle] = useState(0);
  const restartSequence = () => {
    setShowVerifiedOutcomes(false);
    setSequenceCycle((cycle) => cycle + 1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-google-sans text-[#182026]">
      <main className="mx-auto max-w-[1180px] px-5 py-5 sm:px-7 sm:py-7">
        <section className="border-b border-[#DCE5E5] pb-5 sm:pb-6" aria-labelledby="approved-reimbursements-title">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Illustrative control population</p>
              <h2 id="approved-reimbursements-title" className="mt-1 font-google-sans text-[22px] leading-tight tracking-[-0.035em] text-[#182026]">Recovery settlement control</h2>
              <ReconciliationNarrativeBuild key={sequenceCycle} onComplete={() => setShowVerifiedOutcomes(true)} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-[8px] border border-[#E2E8E7] bg-white px-3 py-2 text-[11px] text-[#8A99A5]
          "><span className="text-[16px]">⌕</span><span className="flex-1">Query positions by case ID, entity, or settlement reference</span><span className="rounded-[5px] bg-[#F1F3F4] px-2 py-1 font-google-sans text-[10px] text-[#66737F]">⌘ K</span></div>
          <SettlementOutcomeSequence enabled={showVerifiedOutcomes} onComplete={restartSequence} />
          <p className="mt-2 text-[11px] text-[#8A99A5]">Showing 7 illustrative positions from the Q1 2026 financial close population</p>
        </section>

        <section className="border-b border-[#DCE5E5] pb-5 sm:pb-6" aria-labelledby="reconciliation-title">
          <div className="flex items-center gap-3"><div className="h-px w-8 bg-[#0B74DE]" /><span className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Financial close control</span></div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 id="reconciliation-title" className="font-google-sans text-[14px] leading-tight tracking-[-0.045em] text-[#182026] sm:text-[20px]">Settlement and ledger reconciliation</h1>
              <p className="mt-1 text-[12px] text-[#66737F]">Illustrative cohort · RFD-16942-INB · Inbound recovery · 27 shipments · 1,842 units · 6 fulfilment centres</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#E9F5EE] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-tight text-[#26704E] lg:self-auto"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Reconciled · approved scope closed</div>
          </div>
          <p className="mt-3 max-w-[720px] text-[13px] leading-5 text-[#4D5B66]">Margin tests the approved position against settlement, payout, entity attribution, and downstream ledger evidence before it is treated as closed. Residual exposure remains visible outside the closed scope.</p>
        </section>

        <section className="border-b border-[#DCE5E5] py-5 sm:py-6" aria-label="Reconciliation amounts">
          <p className="max-w-[800px] text-[12px] leading-5 tracking-tight text-[#4D5B66]">The supported entitlement was <span className="font-semibold text-[#182026]">$184,600.00</span>. Amazon approved <span className="font-semibold text-[#182026]">$172,400.00</span>, settlement confirms <span className="font-semibold text-[#182026]">$172,400.00</span> credited, and the approved scope carries a <span className="font-semibold text-[#182026]">$0.00</span> residual. The remaining <span className="font-semibold text-[#8A641B]">$12,200.00</span> is retained as a separate unsupported or unresolved position—not concealed by the close state.</p>
        </section>

        <section className="grid gap-6 border-b border-[#DCE5E5] py-6 sm:py-7 lg:grid-cols-[1fr_0.9fr] lg:gap-10">
          <div>
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Closeout control</p>
            <h2 className="mt-1 font-google-sans text-[20px] leading-tight tracking-[-0.035em] text-[#182026]">Why this scope is closed</h2>
            <p className="mt-2 max-w-[610px] text-[12px] leading-5 text-[#4D5B66]">Expected entitlement, approved value, settlement credit, entity attribution, and verified ledger treatment reconcile for the approved scope.</p>
            <div className="mt-5 border-t border-[#E2E8E7] pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Settlement and attribution evidence</p>
              <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
                <div><dt className="text-[#71818A]">Settlement reference</dt><dd className="mt-1 font-google-sans text-[12px] text-[#182026]">SETTLE-NSH-PAYOUT-01</dd></div>
                <div><dt className="text-[#71818A]">Settlement date</dt><dd className="mt-1 text-[#182026]">Jun 14, 2026</dd></div>
                <div><dt className="text-[#71818A]">Settlement status</dt><dd className="mt-1 text-[#182026]">Paid · verified</dd></div>
                <div><dt className="text-[#71818A]">Legal entity</dt><dd className="mt-1 text-[#182026]">Northstar Home US · NTH-US-01</dd></div>
                <div><dt className="text-[#71818A]">Ledger treatment</dt><dd className="mt-1 text-[#182026]">Recovery income posted · Q1 FY2026</dd></div>
                <div><dt className="text-[#71818A]">Reversal status</dt><dd className="mt-1 text-[#182026]">No reversal detected</dd></div>
              </dl>
            </div>
            <div className="mt-5 border-l-2 border-[#4B946F] pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Record state</p>
              <p className="mt-1 text-[14px] font-medium text-[#182026]">Closed for approved scope · residual position retained separately.</p>
            </div>
          </div>

          <div>
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71818A]">Financial close sequence</p>
            <h2 className="mt-2 font-google-sans text-[26px] leading-tight tracking-[-0.035em] text-[#182026]">From entitlement to close</h2>
            <div className="relative mt-5 space-y-4 pl-6">
              <div className="absolute bottom-2 left-[4px] top-2 w-px bg-[#CFE0E0]" />
              {timeline.map(([title, detail]) => (
                <div key={title} className="relative">
                  <div className="absolute -left-[25px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#FAFAF7] bg-[#4B946F]"><Check className="h-2 w-2 text-white" strokeWidth={3} /></div>
                  <p className="text-[13px] font-semibold text-[#182026]">{title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[12px] font-semibold text-[#182026]">The financial position is closed.</p><p className="mt-1 text-[12px] leading-5 text-[#66737F]">Expected entitlement, approved value, settlement credit, attribution, and ledger treatment agree for the closed scope.</p></div>
          <Link to="/approved-reimbursements" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#0B74DE] hover:text-[#075AAB]">View reconciled outcomes <ArrowRight className="h-3.5 w-3.5" /></Link>
        </section>
      </main>
    </div>
  );
}
