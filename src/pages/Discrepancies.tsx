import React, { useMemo, useState } from 'react';
import { ArrowRight, Download, Search } from 'lucide-react';
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
  { anomaly: 'inbound_shipment_shortage', title: 'Inbound receiving variance', summary: 'Amazon received fewer units than the shipment plan and carrier handoff support.', currency: 'USD', state: 'Flagged', movement: 'Evidence-ready', readiness: 'Evidence and policy aligned', source: 'Amazon SP-API · Seller Central', scope: 'ONT8 · FBA inbound population', record: 'FBA17ACME001', status: 'Ready', tone: 'green' },
  { anomaly: 'incorrect_fee', title: 'Fulfillment fee basis variance', summary: 'The charged fulfillment fee does not reconcile to the supported dimensional and category basis.', currency: 'USD', state: 'Logged', movement: 'Preparing case', readiness: 'Valuation basis under review', source: 'Settlement report · fee ledger', scope: 'FY2026 Q1 · 186 units', record: 'SETTLE-ACME-0002', status: 'In review', tone: 'blue' },
  { anomaly: 'duplicate_charge', title: 'Duplicate settlement charge', summary: 'The same seller event appears more than once without a clean offset in the settlement trail.', currency: 'USD', state: 'Logged', movement: 'Blocked', readiness: 'Duplicate control required', source: 'Settlement report · ledger', scope: 'Settlement SETTLE-ACME-0003', record: 'TXN-ACME-0003', status: 'In review', tone: 'red' },
  { anomaly: 'missing_unit', title: 'Unresolved inventory movement', summary: 'A unit reduction is present without a corresponding receiving, transfer, disposal, or reimbursement event.', currency: 'USD', state: 'Detected', movement: 'Preview finding', readiness: 'Source relationship pending', source: 'Inventory adjustment report', scope: 'ABE8 · 42 units', record: 'ADJ-ACME-0004', status: 'Open', tone: 'muted' },
  { anomaly: 'refund_no_return', title: 'Refund without matched return', summary: 'A customer refund is recorded without a corresponding return receipt or inventory restoration.', currency: 'USD', state: 'Identified', movement: 'Preparing case', readiness: 'Return event matched', source: 'Customer returns · settlement', scope: 'Amazon US · Q1 2026', record: 'ORDER-ACME-0005', status: 'In review', tone: 'blue' },
  { anomaly: 'reimbursement_reversal', title: 'Reimbursement reversal', summary: 'A previously credited recovery appears to have been reversed or partially offset in later settlement activity.', currency: 'USD', state: 'Logged', movement: 'Filed', readiness: 'Response and payout watch', source: 'Settlement report · reimbursement', scope: 'Settlement SETTLE-ACME-0006', record: 'REC-ACME-0006', status: 'In review', tone: 'amber' },
  { anomaly: 'lost_warehouse', title: 'Warehouse loss exposure', summary: 'Inventory movement indicates a warehouse loss without a matching reimbursement outcome.', currency: 'USD', state: 'Detected', movement: 'Preview finding', readiness: 'Initial finding', source: 'Inventory adjustment · FC report', scope: 'LGB8 · 28 units', record: 'WHS-ACME-0007', status: 'Open', tone: 'muted' },
  { anomaly: 'weight_fee_overcharge', title: 'Weight-based fee overcharge', summary: 'The applied fee is above the supported weight and dimensional record for the affected inventory.', currency: 'USD', state: 'Logged', movement: 'Evidence-ready', readiness: 'Cost basis verified', source: 'Fee transaction · catalog record', scope: 'FY2026 Q1 · 24 SKUs', record: 'FEE-ACME-0008', status: 'Ready', tone: 'green' },
  { anomaly: 'storage_overcharge', title: 'Storage fee miscalculation', summary: 'Storage charges exceed the documented cubic-foot rate for the affected inventory period.', currency: 'USD', state: 'Logged', movement: 'Preparing case', readiness: 'Rate comparison complete', source: 'Storage report · rate card', scope: 'Jan–Mar 2026 · 6,412 units', record: 'STOR-ACME-0009', status: 'In review', tone: 'blue' },
  { anomaly: 'return_not_restocked', title: 'Return not restocked', summary: 'A returned unit was received but the inventory ledger and settlement record do not show the expected treatment.', currency: 'USD', state: 'Identified', movement: 'Evidence-ready', readiness: 'Return event uniquely matched', source: 'Returns report · inventory ledger', scope: 'Amazon US · 9 units', record: 'RET-ACME-0010', status: 'Ready', tone: 'green' },
  { anomaly: 'partial_reimbursement', title: 'Partial reimbursement position', summary: 'Amazon credited less than the supported unit-cost basis for the affected recovery event.', currency: 'USD', state: 'Logged', movement: 'Filed', readiness: 'Payout variance open', source: 'Approval notice · settlement', scope: 'FBA reimbursement · 17 units', record: 'REC-ACME-0011', status: 'In review', tone: 'amber' },
  { anomaly: 'fulfillment_fee_error', title: 'Fulfillment fee classification error', summary: 'The fee classification does not match the product dimensions and catalog attributes retained for the event.', currency: 'USD', state: 'Logged', movement: 'Blocked', readiness: 'Catalog evidence required', source: 'Fee ledger · catalog export', scope: 'FY2026 Q1 · 43 orders', record: 'FEE-ACME-0012', status: 'Open', tone: 'red' },
];

const findings: Finding[] = Array.from({ length: 25 }, (_, index) => {
  const template = findingTemplates[index % findingTemplates.length];
  const value = Number((842 + ((index * 683.41) % 14820)).toFixed(2));
  return {
    ...template,
    reference: `ACM-${['LI', 'FD', 'DC', 'IR', 'RR', 'ST', 'IN', 'RT'][index % 8]}-2604-${String(index + 1).padStart(4, '0')}`,
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

export default function Discrepancies() {
  const [query, setQuery] = useState('');
  const [showProcessed, setShowProcessed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ready' | 'attention'>('all');
  const visibleFindings = useMemo(() => findings.filter((finding) => {
    const matchesQuery = !query.trim() || Object.values(finding).join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesFilter = activeFilter === 'all' || (activeFilter === 'ready' ? finding.status === 'Ready' : finding.tone === 'red' || finding.status === 'Open');
    return matchesQuery && matchesFilter && (showProcessed || finding.movement !== 'Filed');
  }), [activeFilter, query, showProcessed]);
  const estimatedValue = findings.reduce((sum, finding) => sum + finding.value, 0);
  const readyValue = findings.filter((finding) => finding.status === 'Ready').reduce((sum, finding) => sum + finding.value, 0);

  return (
    <main className="min-h-screen overflow-x-auto bg-[#FAFAF7] font-google-sans text-[#182026]">
      <div className="mx-auto min-w-[760px] max-w-[1240px] px-4 py-5 sm:px-8 sm:py-8">
        <section className="relative space-y-4">
          <div className="border-b border-[#DCE8EE] pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-[11px] font-google-sans font-medium text-[#66737F]">Enterprise discrepancy register</p>
                <h1 className="mt-2 font-lora text-[26px] font-normal leading-tight tracking-tight text-[#182026]">Issues found</h1>
                <p className="mt-3 text-[12px] font-google-sans leading-5 text-[#4D5B66]">ACME Operations US FBA · Amazon US · Demo workspace. Margin has examined the available operating records and is holding each finding at its current financial and evidence position.</p>
                <p className="mt-2 max-w-3xl text-[11px] font-google-sans leading-5 text-[#66737F]">This is not an unranked alert feed. Each discrepancy carries an event identity, source population, estimated exposure, evidence state, policy window, and next justified action.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-[6px] border border-[#DCE8EE] bg-white px-3 py-2 text-[10px] font-google-sans text-[#4D5B66] shadow-[0_2px_8px_rgba(24,32,38,0.03)]"><span className="h-1.5 w-1.5 rounded-full bg-[#66A9E8]" />ACME Operations US FBA · Amazon US</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#DCE8EE] pt-4">
              <div className="min-w-[140px]"><p className="text-[10px] font-google-sans text-[#8A99A5]">Open findings</p><p className="mt-1 text-[14px] font-google-sans font-medium leading-none tracking-tight text-[#182026]">{visibleFindings.length}</p></div>
              <div className="min-w-[140px]"><p className="text-[10px] font-google-sans text-[#8A99A5]">Detected value</p><p className="mt-1 text-[14px] font-google-sans font-medium leading-none tracking-tight text-[#182026]">{money.format(estimatedValue)}</p></div>
              <div className="min-w-[140px]"><p className="text-[10px] font-google-sans text-[#8A99A5]">Evidence-ready</p><p className="mt-1 text-[14px] font-google-sans font-medium leading-none tracking-tight text-[#26704E]">{money.format(readyValue)}</p></div>
              <div className="min-w-[140px]"><p className="text-[10px] font-google-sans text-[#8A99A5]">Source coverage</p><p className="mt-1 text-[14px] font-google-sans font-medium leading-none tracking-tight text-[#182026]">7 source families</p></div>
            </div>
          </div>

          <div className="border-b border-[#E9E9EC] py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-[11px] font-google-sans tracking-tight text-[#6B7280]">Review what Margin found, whether a discrepancy is ready, blocked by evidence, or still requires financial interpretation.</div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-8 items-center gap-2 rounded-[6px] border border-[#D8E3E8] bg-white px-3"><Search className="h-3.5 w-3.5 text-[#8A99A3]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search findings" className="w-[150px] bg-transparent text-[11px] tracking-tight outline-none placeholder:text-[#9AA7B0]" /></div>
              {(['all', 'ready', 'attention'] as const).map((filter) => <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={cn('h-8 border px-3 text-[10px] font-google-sans font-medium uppercase tracking-tight transition-colors', activeFilter === filter ? 'border-[#0B74DE] bg-[#EFF6FF] text-[#1769AA]' : 'border-[#E9E9EC] bg-transparent text-[#50525B] hover:bg-[#FAFAFB]')}>{filter === 'all' ? 'All findings' : filter === 'ready' ? 'Evidence-ready' : 'Needs attention'}</button>)}
              <button type="button" onClick={() => setShowProcessed((current) => !current)} className="inline-flex items-center gap-2 text-[10px] font-google-sans font-medium uppercase tracking-tight text-[#66737F]"><span className={cn('relative h-4 w-8 rounded-full transition-colors', showProcessed ? 'bg-[#B8C4CE]' : 'bg-[#E9E9EC]')}><span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform', showProcessed ? 'translate-x-4' : 'translate-x-0.5')} /></span> Show processed</button>
              <button type="button" className="inline-flex h-8 items-center border border-[#E9E9EC] bg-transparent px-3 text-[10px] font-google-sans font-medium uppercase tracking-tight text-[#50525B] hover:bg-[#FAFAFB]"><Download className="mr-2 h-3 w-3" />Export findings</button>
            </div>
          </div>

          <div className="border-y border-[#E9E9EC] bg-transparent">
            <div className="hidden border-b border-[#F0F0F2] px-5 py-3 xl:grid xl:grid-cols-[minmax(0,1.4fr)_130px_minmax(0,1fr)_auto] xl:gap-5">{['Issue', 'Value', 'Position', 'Action'].map((label) => <div key={label} className="text-[9px] font-google-sans font-medium uppercase tracking-tight text-[#858792]">{label}</div>)}</div>
            <div className="divide-y divide-[#F0F0F2]">
              {visibleFindings.map((finding) => <article key={finding.reference} className="grid gap-4 px-5 py-4 transition-colors hover:bg-[#FBFCFD] xl:grid-cols-[minmax(0,1.4fr)_130px_minmax(0,1fr)_auto] xl:items-start xl:gap-5">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold tracking-tight', stateTone[finding.tone])}>{finding.anomaly.replaceAll('_', ' ')}</span><p className="font-semibold tracking-tight text-[#182026]">{finding.title}</p><span className="text-[10px] font-semibold tracking-tight text-[#8FA0AD]">{finding.reference}</span></div><p className="mt-1 text-[10px] tracking-tight text-[#9CA3AF]">{finding.source} · {finding.scope} · Record {finding.record}</p><p className="mt-2 text-[11px] font-semibold leading-4 tracking-tight text-[#36404A]">{finding.summary}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium tracking-tight text-[#66737F]"><span>Position: <strong className="font-semibold text-[#36404A]">{finding.movement}</strong></span><span>Readiness: <strong className="font-semibold text-[#36404A]">{finding.readiness}</strong></span></div></div>
                <div><p className="text-[10px] font-google-sans text-[#8A99A5]">Estimated exposure</p><p className="mt-1 text-[15px] font-medium tracking-tight text-[#182026]">{money.format(finding.value)}</p><p className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">{finding.days} days remaining</p></div>
                <div className="grid gap-1.5 text-[10px] leading-4 tracking-tight text-[#66737F]"><p><span className="font-semibold text-[#8A99A5]">Financial state:</span> {finding.state}</p><p><span className="font-semibold text-[#8A99A5]">Source:</span> {finding.source}</p><p><span className="font-semibold text-[#8A99A5]">Control:</span> {finding.status === 'Ready' ? 'Evidence supports next action' : finding.status === 'In review' ? 'Margin is holding the position in review' : 'Further reconciliation required'}</p></div>
                <div className="flex flex-wrap items-center gap-3 xl:justify-end"><button type="button" className="inline-flex items-center gap-1 border border-[#E9E9EC] px-3 py-1.5 text-[10px] font-google-sans font-medium uppercase tracking-tight text-[#50525B] hover:bg-[#FAFAFB]">Review finding<ArrowRight className="h-3 w-3" /></button></div>
              </article>)}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[10px] font-google-sans tracking-tight text-[#858792]"><span>Showing {visibleFindings.length} of {findings.length} demo findings · ACME Operations US FBA</span><span>Read-only mock register · Nothing submits from this page.</span></div>
        </section>
      </div>
    </main>
  );
}
