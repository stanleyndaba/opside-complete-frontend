import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FindingState = 'Detected' | 'Flagged' | 'Identified' | 'Logged';
type FindingMovement = 'Preview finding' | 'Preparing case' | 'Evidence-ready' | 'Filed' | 'Blocked';

type Finding = {
  reference: string;
  anomaly: string;
  title: string;
  summary: string;
  value: number;
  currency: string;
  state: FindingState;
  movement: FindingMovement;
  readiness: string;
  days: number;
  source: string;
  scope: string;
  record: string;
  status: 'Open' | 'In review' | 'Ready';
  tone: 'muted' | 'blue' | 'green' | 'amber' | 'red';
};

const findingTemplates: Array<Omit<Finding, 'reference' | 'value' | 'days'>> = [
  { anomaly: 'inbound_shipment_shortage', title: 'Inbound receiving variance', summary: 'Amazon received fewer units than the shipment plan and carrier handoff support.', currency: 'USD', state: 'Flagged', movement: 'Evidence-ready', readiness: 'Evidence and policy aligned', source: 'Amazon SP-API · Seller Central · 3PL EDI', scope: 'ONT8 · NA FBA entity · 4,812 active SKUs', record: 'FBA17NSC001', status: 'Ready', tone: 'green' },
  { anomaly: 'incorrect_fee', title: 'Fulfillment fee basis variance', summary: 'The charged fulfillment fee does not reconcile to the supported dimensional and category basis.', currency: 'USD', state: 'Logged', movement: 'Preparing case', readiness: 'Valuation basis under review', source: 'Amazon SP-API settlements · NetSuite fee ledger', scope: 'FY2026 Q1 · 3 marketplaces · 186 units', record: 'SETTLE-NSC-0002', status: 'In review', tone: 'blue' },
  { anomaly: 'duplicate_charge', title: 'Duplicate settlement charge', summary: 'The same seller event appears more than once without a clean offset in the settlement trail.', currency: 'USD', state: 'Logged', movement: 'Blocked', readiness: 'Duplicate control required', source: 'Amazon settlement API · SAP S/4HANA posting ledger', scope: 'Settlement SETTLE-NSC-0003 · Entity US-01', record: 'TXN-NSC-0003', status: 'In review', tone: 'red' },
  { anomaly: 'missing_unit', title: 'Unresolved inventory movement', summary: 'A unit reduction is present without a corresponding receiving, transfer, disposal, or reimbursement event.', currency: 'USD', state: 'Detected', movement: 'Preview finding', readiness: 'Source relationship pending', source: 'Amazon inventory API · SAP S/4HANA inventory ledger', scope: 'ABE8 · US-01 entity · 42 units', record: 'ADJ-NSC-0004', status: 'Open', tone: 'muted' },
  { anomaly: 'refund_no_return', title: 'Refund without matched return', summary: 'A customer refund is recorded without a corresponding return receipt or inventory restoration.', currency: 'USD', state: 'Identified', movement: 'Preparing case', readiness: 'Return event matched', source: 'Amazon returns API · NetSuite order ledger', scope: 'Amazon US · Q1 2026 · 3PL returns feed', record: 'ORDER-NSC-0005', status: 'In review', tone: 'blue' },
  { anomaly: 'reimbursement_reversal', title: 'Reimbursement reversal', summary: 'A previously credited recovery appears to have been reversed or partially offset in later settlement activity.', currency: 'USD', state: 'Logged', movement: 'Filed', readiness: 'Response and payout watch', source: 'Amazon reimbursement API · SAP clearing ledger', scope: 'Settlement SETTLE-NSC-0006 · US-01 / US-02', record: 'REC-NSC-0006', status: 'In review', tone: 'amber' },
  { anomaly: 'lost_warehouse', title: 'Warehouse loss exposure', summary: 'Inventory movement indicates a warehouse loss without a matching reimbursement outcome.', currency: 'USD', state: 'Detected', movement: 'Preview finding', readiness: 'Initial finding', source: 'Amazon inventory API · 3PL FC EDI feed', scope: 'LGB8 · US-01 entity · 28 units', record: 'WHS-NSC-0007', status: 'Open', tone: 'muted' },
  { anomaly: 'weight_fee_overcharge', title: 'Weight-based fee overcharge', summary: 'The applied fee is above the supported weight and dimensional record for the affected inventory.', currency: 'USD', state: 'Logged', movement: 'Evidence-ready', readiness: 'Cost basis verified', source: 'Amazon fee API · product master · NetSuite item ledger', scope: 'FY2026 Q1 · 24 SKUs · 2 legal entities', record: 'FEE-NSC-0008', status: 'Ready', tone: 'green' },
  { anomaly: 'storage_overcharge', title: 'Storage fee miscalculation', summary: 'Storage charges exceed the documented cubic-foot rate for the affected inventory period.', currency: 'USD', state: 'Logged', movement: 'Preparing case', readiness: 'Rate comparison complete', source: 'Amazon storage report API · SAP cost basis', scope: 'Jan–Mar 2026 · 6,412 units · 2 FCs', record: 'STOR-NSC-0009', status: 'In review', tone: 'blue' },
  { anomaly: 'return_not_restocked', title: 'Return not restocked', summary: 'A returned unit was received but the inventory ledger and settlement record do not show the expected treatment.', currency: 'USD', state: 'Identified', movement: 'Evidence-ready', readiness: 'Return event uniquely matched', source: 'Amazon returns API · SAP inventory ledger · 3PL EDI', scope: 'Amazon US · 9 units · return node ONT8', record: 'RET-NSC-0010', status: 'Ready', tone: 'green' },
  { anomaly: 'partial_reimbursement', title: 'Partial reimbursement position', summary: 'Amazon credited less than the supported unit-cost basis for the affected recovery event.', currency: 'USD', state: 'Logged', movement: 'Filed', readiness: 'Payout variance open', source: 'Amazon case API · settlement API · SAP clearing ledger', scope: 'FBA reimbursement · 17 units · 2 marketplaces', record: 'REC-NSC-0011', status: 'In review', tone: 'amber' },
  { anomaly: 'fulfillment_fee_error', title: 'Fulfillment fee classification error', summary: 'The fee classification does not match the product dimensions and catalog attributes retained for the event.', currency: 'USD', state: 'Logged', movement: 'Blocked', readiness: 'Catalog evidence required', source: 'Amazon fee API · PIM catalog export · NetSuite item ledger', scope: 'FY2026 Q1 · 43 orders · US-01 entity', record: 'FEE-NSC-0012', status: 'Open', tone: 'red' },
];

const findings: Finding[] = Array.from({ length: 25 }, (_, index) => {
  const template = findingTemplates[index % findingTemplates.length];
  const value = Number((842 + ((index * 683.41) % 14820)).toFixed(2));
  return {
    ...template,
    reference: `NSC-${['LI', 'FD', 'DC', 'IR', 'RR', 'ST', 'IN', 'RT'][index % 8]}-2604-${String(index + 1).padStart(4, '0')}`,
    value,
    days: Math.max(7, 62 - index * 2),
  };
});

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const stateTone: Record<Finding['tone'], string> = {
  muted: 'bg-[#F1F3F4] text-[#66737F]',
  blue: 'bg-[#EFF6FF] text-[#1769AA]',
  green: 'bg-[#EEF9F3] text-[#26704E]',
  amber: 'bg-[#FFF8E6] text-[#8A641B]',
  red: 'bg-[#FFF1F2] text-[#A23A3A]',
};

function ControlTypewriter({ text, speed = 3, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
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
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [delay, reduceMotion, speed, text]);

  return <>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</>;
}

export default function Discrepancies() {
  const [query, setQuery] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'attention'>('all');
  const [introStage, setIntroStage] = useState(0);
  const [timelineCount, setTimelineCount] = useState(1);
  const [timelinePaused, setTimelinePaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const visibleFindings = useMemo(() => findings.filter((finding) => {
    const matchesQuery = !query.trim() || Object.values(finding).join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'ready' ? finding.status === 'Ready' : finding.tone === 'red' || finding.status === 'Open');
    return matchesQuery && matchesFilter && (showProcessed || finding.movement !== 'Filed');
  }), [activeFilter, query, showProcessed]);
  const estimatedValue = findings.reduce((sum, finding) => sum + finding.value, 0);
  const readyValue = findings.filter((finding) => finding.status === 'Ready').reduce((sum, finding) => sum + finding.value, 0);
  const unresolvedValue = estimatedValue - readyValue;
  const readyCount = findings.filter((finding) => finding.status === 'Ready').length;
  const reviewCount = findings.filter((finding) => finding.status === 'In review').length;

  React.useEffect(() => {
    setTimelineCount(1);
    setIntroStage(0);
  }, [activeFilter, query, showProcessed]);

  React.useEffect(() => {
    if (reduceMotion || timelinePaused || introStage < 3 || visibleFindings.length === 0) return;
    const timer = window.setInterval(() => {
      setTimelineCount((current) => current >= visibleFindings.length ? 1 : current + 1);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [introStage, reduceMotion, timelinePaused, visibleFindings.length]);

  const markerTone: Record<Finding["tone"], string> = {
    muted: 'bg-[#9AA7B0]',
    blue: 'bg-[#0B74DE]',
    green: 'bg-[#4F8067]',
    amber: 'bg-[#E6A700]',
    red: 'bg-[#A23A3A]',
  };

  return (
    <main className="preview-google-sans min-h-screen overflow-x-auto bg-[#FAFAF7] font-google-sans text-[#182026]">
      <div className="mx-auto min-w-[760px] max-w-[1280px] px-4 py-4 sm:min-w-0 sm:px-6 sm:py-6">
        <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
          <header className="mb-4 border-b border-[#E5ECEF] pb-4">
            <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Amazon financial control · Recovery position</p>
            <h1 className="mt-0.5 font-google-sans text-[20px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[23px]">Recovery control position</h1>
            <p className="mt-1 max-w-4xl text-[11px] leading-5 tracking-tight text-[#66737F]">Margin reconciles each position to the underlying Amazon event, distinguishes supported exposure from unresolved exceptions, and governs the next action through the evidence record.</p>
          </header>
          <div className="space-y-1">
            <div className="text-[12px] font-medium tracking-tight text-[#182026]">Northstar Commerce Group · US · CA · UK · DE · multi-entity discrepancy register</div>
            <div className="text-[11px] font-medium leading-5 text-[#0B74DE]"><ControlTypewriter text="Issues found are recorded as controlled financial positions—not alerts. Each position carries its event identity, source population, financial basis, evidence state, and accountable next step." onComplete={() => setIntroStage(1)} /></div>
            {introStage >= 1 ? <div className="text-[10px] font-medium text-[#4B5563]"><ControlTypewriter text="FY2026 Q1 · 4 legal entities · 5 marketplaces · 11 connected source families · read-only control view" onComplete={() => setIntroStage(2)} /></div> : null}
          </div>
          <div className="mt-4 border-y border-[#E2E9EC] py-4 sm:py-5 text-[12px] leading-6 tracking-tight text-[#66737F] sm:text-[13px] sm:leading-7">
            {introStage >= 2 ? <ControlTypewriter text={`The current review population represents ${money.format(estimatedValue)} in detected exposure. Of that position, ${money.format(readyValue)} is currently supported by evidence across ${readyCount} evidence-ready positions, while ${money.format(unresolvedValue)} remains unresolved across ${reviewCount} positions still in reconciliation.`} onComplete={() => setIntroStage(3)} /> : null}
          </div>
          <div className="mt-4 flex max-w-[260px] items-center gap-2 rounded-[8px] border border-[#D8E3E8] bg-[#FBFCFD] px-3 h-9"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search control register" className="w-full bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(['all', 'ready', 'attention'] as const).map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={cn('rounded-[5px] border px-3 py-1.5 text-[10px] font-medium tracking-tight transition-colors', activeFilter === filter ? 'border-[#0B74DE] bg-[#EFF6FF] text-[#1769AA]' : 'border-[#E9E9EC] bg-white text-[#66737F] hover:bg-[#FAFAFB]')}>{filter === 'all' ? 'All positions' : filter === 'ready' ? 'Evidence-ready' : 'Needs control'}</button>)}
            <button type="button" onClick={() => setShowProcessed((current) => !current)} className="rounded-[5px] border border-[#E9E9EC] bg-white px-3 py-1.5 text-[10px] font-medium tracking-tight text-[#66737F]">{showProcessed ? 'Hide processed' : 'Show processed'}</button>
            <button type="button" className="inline-flex items-center rounded-[5px] border border-[#E9E9EC] bg-white px-3 py-1.5 text-[10px] font-medium tracking-tight text-[#66737F] hover:bg-[#FAFAFB]"><Download className="mr-2 h-3 w-3" />Export findings</button>
          </div>
          <div className="mt-5">
            <div onMouseEnter={() => setTimelinePaused(true)} onMouseLeave={() => setTimelinePaused(false)}>
            {(reduceMotion ? visibleFindings : visibleFindings.slice(0, timelineCount)).map((finding, index, shownFindings) => <motion.article key={finding.reference} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }} className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-4 py-4 text-[12px] sm:grid-cols-[26px_minmax(0,1fr)]">
              {index < shownFindings.length - 1 ? <motion.span initial={reduceMotion ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={reduceMotion ? { duration: 0 } : { delay: 0.22, duration: 0.28 }} style={{ transformOrigin: 'top' }} className="absolute bottom-[-1px] left-[11px] top-[54px] w-px bg-[#C9D6DE] sm:left-[12px]" aria-hidden="true" /> : null}
              <span className={cn('relative z-10 ml-[9px] mt-2 h-1 w-1 rounded-full', markerTone[finding.tone])} aria-label={`${finding.state} finding`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="font-semibold tracking-tight text-[#182026]">{finding.reference} · {finding.title}</p><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold tracking-tight', stateTone[finding.tone])}>{finding.state}</span></div>
                <p className="mt-1 text-[10px] tracking-tight text-[#9CA3AF]">{finding.source} · {finding.scope} · Record {finding.record}</p>
                <p className="mt-2 text-[11px] font-semibold tracking-tight text-[#36404A]">{finding.anomaly.replaceAll('_', ' ')}: {finding.summary}</p>
                <p className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">Financial position: <span className="font-semibold text-[#36404A]">{money.format(finding.value)} estimated exposure</span> · {finding.days} days remaining</p>
                <p className="mt-2 text-[11px] font-bold leading-4 tracking-tight text-[#111827]">{finding.movement} · {finding.readiness}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#66737F]">Source lineage: <span className="font-semibold text-[#36404A]">{finding.source}</span> — the event remains attached to its operating scope, ledger relationship, and supporting record.</p>
                <p className="mt-1 text-[11px] leading-4 text-[#66737F]">Control decision: {finding.status === 'Ready' ? 'Evidence supports the next justified recovery action.' : finding.status === 'In review' ? 'Margin is holding the position for further reconciliation.' : 'Further reconciliation is required before action.'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3"><span className="text-[11px] font-semibold tracking-tight text-[#36404A]">Next controlled step: {finding.movement === 'Blocked' ? 'Resolve evidence blocker' : finding.movement === 'Filed' ? 'Verify response and payout' : finding.status === 'Ready' ? 'Prepare case' : 'Review evidence chain'}</span><button type="button" className="inline-flex items-center gap-1 rounded-[5px] px-1 py-0.5 text-[11px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#EFF6FF]">Open finding<ArrowRight className="h-3 w-3" /></button></div>
              </div>
            </motion.article>)}
            </div>
            {visibleFindings.length === 0 ? <div className="px-6 py-20 text-center text-[12px] tracking-tight text-[#7B8A97]">No findings match this search.</div> : null}
          </div>
          <p className="pt-2 text-[10px] font-medium tracking-tight text-[#7B8A97]">Read-only representative register for Northstar Commerce LLC · US FBA. Nothing submits from this page.</p>
        </section>
      </div>
    </main>
  );
}
