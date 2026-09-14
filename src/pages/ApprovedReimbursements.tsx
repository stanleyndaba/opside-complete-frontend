import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';

type ApprovedReimbursement = {
  caseNumber: string;
  amazonCaseId: string;
  seller: string;
  disputeName: string;
  amount: number;
  currency: string;
  proofReference: string;
  closeout: string;
  updated: string | null;
  settlementId: string | null;
  filingDate: string | null;
  approvalDate: string | null;
  expectedAmount?: number;
  paidAmount?: number;
  verifiedAmount?: number;
  remainingAmount?: number;
  closureStatus?: 'RECOVERY CLOSED' | 'NOT CLOSED';
  settlementDate?: string | null;
  amazonResponseAmount?: number;
  financialEvidenceAmount?: number;
  closureReason?: string;
  nextAction?: string;
  evidenceSource?: string;
  settlementStatus?: string;
  attributionStatus?: string;
};

type RecoveryLedgerRow = {
  linked_dispute_case_id?: string | null;
  dispute_case_id?: string | null;
  detection_result_id?: string | null;
  case_number?: string | null;
  provider_case_id?: string | null;
  merchant_reference?: string | null;
  case_type?: string | null;
  anomaly_type?: string | null;
  store_name?: string | null;
  currency?: string | null;
  has_approval_truth?: boolean | null;
  last_updated_at?: string | null;
  submission_proof?: { submitted_at?: string | null } | null;
};

type FinancialSummary = {
  input_id: string;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  verified_paid_amount: number;
  variance_amount: number | null;
  payout_status: 'not_paid' | 'partially_paid' | 'paid';
  proof_of_payment: {
    amount: number;
    currency: string;
    event_date: string | null;
    reference_id: string | null;
    settlement_id: string | null;
    payout_batch_id: string | null;
    source: string | null;
  } | null;
};


const formatMoney = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const closeoutFilters = ['All closeouts', 'Paid and reconciled', 'Clean settlement match', 'Paid with variance note'];

const demoReimbursementOutcomes: ApprovedReimbursement[] = [
  {
    caseNumber: 'ACME-CASE-2005',
    amazonCaseId: 'AMZ-ACME-42005',
    seller: 'Northstar Home Goods',
    disputeName: 'Inbound shipment shortage',
    amount: 963.10,
    currency: 'USD',
    proofReference: 'SETTLE-ACME-PAYOUT-01',
    closeout: 'Clean settlement match',
    updated: '2026-06-14T19:07:45.215Z',
    settlementId: 'SETTLE-ACME-PAYOUT-01',
    filingDate: 'Jun 3, 2026',
    approvalDate: 'Jun 10, 2026',
    expectedAmount: 963.10,
    paidAmount: 963.10,
    verifiedAmount: 963.10,
    remainingAmount: 0,
    closureStatus: 'RECOVERY CLOSED',
    settlementDate: '2026-06-14T19:07:45.215Z',
    amazonResponseAmount: 963.10,
    financialEvidenceAmount: 963.10,
    closureReason: 'Expected, paid, and verified amounts reconcile completely.',
    nextAction: 'Recovery closed. No further action required.',
    evidenceSource: 'Settlement SETTLE-ACME-PAYOUT-01',
    settlementStatus: 'Paid',
    attributionStatus: 'Payment confidently attributed to this recovery',
  },
  {
    caseNumber: 'ACME-CASE-2006',
    amazonCaseId: 'AMZ-ACME-42006',
    seller: 'Blue Ridge Supply',
    disputeName: 'Settlement mismatch',
    amount: 500,
    currency: 'USD',
    proofReference: 'SETTLE-ACME-PAYOUT-02',
    closeout: 'Partial settlement',
    updated: '2026-06-12T19:07:45.215Z',
    settlementId: 'SETTLE-ACME-PAYOUT-02',
    filingDate: 'Jun 1, 2026',
    approvalDate: 'Jun 8, 2026',
    expectedAmount: 634.88,
    paidAmount: 500,
    verifiedAmount: 500,
    remainingAmount: 134.88,
    closureStatus: 'NOT CLOSED',
    settlementDate: '2026-06-12T19:07:45.215Z',
    amazonResponseAmount: 634.88,
    financialEvidenceAmount: 500,
    closureReason: 'Partial payment identified. The expected amount was not fully recovered.',
    nextAction: 'Margin is monitoring the next settlement for the remaining balance.',
    evidenceSource: 'Settlement SETTLE-ACME-PAYOUT-02',
    settlementStatus: 'Partially paid',
    attributionStatus: 'Payment attributed to this recovery',
  },
  { caseNumber: 'RFD-16942-INB', amazonCaseId: '19822888381', seller: 'Northstar Home Goods', disputeName: 'Inbound shipment shortage', amount: 2410.50, currency: 'USD', proofReference: 'SETTLE-205-771', closeout: 'Clean settlement match', updated: 'Jun 11, 2026', settlementId: 'SETTLE-205-771', filingDate: 'May 28, 2026', approvalDate: 'Jun 3, 2026', expectedAmount: 2410.50, paidAmount: 2410.50, verifiedAmount: 2410.50, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-11T09:18:00Z', amazonResponseAmount: 2410.50, financialEvidenceAmount: 2410.50, closureReason: 'The six-unit inbound variance reconciles to the carrier record, ONT8 receiving report, and settlement credit.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-771 · ReceivingReport-ONT8.csv', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-16987-RET', amazonCaseId: '19823011427', seller: 'Harbor & Pine Living', disputeName: 'Customer return reimbursement', amount: 1876.20, currency: 'USD', proofReference: 'SETTLE-205-804', closeout: 'Clean settlement match', updated: 'Jun 10, 2026', settlementId: 'SETTLE-205-804', filingDate: 'May 25, 2026', approvalDate: 'Jun 1, 2026', expectedAmount: 1876.20, paidAmount: 1876.20, verifiedAmount: 1876.20, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-10T14:32:00Z', amazonResponseAmount: 1876.20, financialEvidenceAmount: 1876.20, closureReason: 'Returned inventory was classified as damaged while the return disposition record supports the seller reimbursement.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-804 · ReturnDispositions-May.csv', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-17011-FEE', amazonCaseId: '19823100562', seller: 'Cedar Peak Outfitters', disputeName: 'FBA fee overcharge', amount: 3294.75, currency: 'USD', proofReference: 'SETTLE-205-826', closeout: 'Clean settlement match', updated: 'Jun 8, 2026', settlementId: 'SETTLE-205-826', filingDate: 'May 22, 2026', approvalDate: 'May 30, 2026', expectedAmount: 3294.75, paidAmount: 3294.75, verifiedAmount: 3294.75, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-08T11:06:00Z', amazonResponseAmount: 3294.75, financialEvidenceAmount: 3294.75, closureReason: 'Oversize storage and fulfillment fee corrections match the rate-card comparison and settlement credit.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-826 · FeeAudit-Q2-2026.xlsx', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-17042-REM', amazonCaseId: '19823244903', seller: 'Morrow Kitchen Co.', disputeName: 'Removal order shortage', amount: 1465.80, currency: 'USD', proofReference: 'SETTLE-205-849', closeout: 'Clean settlement match', updated: 'Jun 6, 2026', settlementId: 'SETTLE-205-849', filingDate: 'May 19, 2026', approvalDate: 'May 27, 2026', expectedAmount: 1465.80, paidAmount: 1465.80, verifiedAmount: 1465.80, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-06T16:44:00Z', amazonResponseAmount: 1465.80, financialEvidenceAmount: 1465.80, closureReason: 'Removal shipment records show units not returned to the seller after the order was completed.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-849 · RemovalOrder-113-8801.pdf', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-17088-DMG', amazonCaseId: '19823410218', seller: 'Fieldstone Wellness', disputeName: 'Warehouse damage reimbursement', amount: 2788.40, currency: 'USD', proofReference: 'SETTLE-205-881', closeout: 'Clean settlement match', updated: 'Jun 4, 2026', settlementId: 'SETTLE-205-881', filingDate: 'May 14, 2026', approvalDate: 'May 24, 2026', expectedAmount: 2788.40, paidAmount: 2788.40, verifiedAmount: 2788.40, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-04T08:56:00Z', amazonResponseAmount: 2788.40, financialEvidenceAmount: 2788.40, closureReason: 'Fulfillment-center damage disposition and inventory valuation support the full reimbursement amount.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-881 · DamageDisposition-ONT8.pdf', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-17106-DUP', amazonCaseId: '19823577840', seller: 'Brightline Home Systems', disputeName: 'Duplicate charge recovery', amount: 2124.65, currency: 'USD', proofReference: 'SETTLE-205-903', closeout: 'Clean settlement match', updated: 'Jun 2, 2026', settlementId: 'SETTLE-205-903', filingDate: 'May 10, 2026', approvalDate: 'May 20, 2026', expectedAmount: 2124.65, paidAmount: 2124.65, verifiedAmount: 2124.65, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-06-02T13:21:00Z', amazonResponseAmount: 2124.65, financialEvidenceAmount: 2124.65, closureReason: 'The duplicate settlement charge was matched to the original order event and fully offset in the payout record.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-903 · DuplicateEventReview.csv', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
  { caseNumber: 'RFD-17155-INV', amazonCaseId: '19823761029', seller: 'Atlas Outdoor Supply', disputeName: 'Inventory reimbursement variance', amount: 1960.00, currency: 'USD', proofReference: 'SETTLE-205-927', closeout: 'Clean settlement match', updated: 'May 30, 2026', settlementId: 'SETTLE-205-927', filingDate: 'May 6, 2026', approvalDate: 'May 16, 2026', expectedAmount: 1960.00, paidAmount: 1960.00, verifiedAmount: 1960.00, remainingAmount: 0, closureStatus: 'RECOVERY CLOSED', settlementDate: '2026-05-30T10:12:00Z', amazonResponseAmount: 1960.00, financialEvidenceAmount: 1960.00, closureReason: 'Inventory adjustment history and expected seller valuation reconcile to the final settlement credit.', nextAction: 'Recovery closed. No further action required.', evidenceSource: 'Settlement SETTLE-205-927 · InventoryLedger-ATL-04.csv', settlementStatus: 'Paid', attributionStatus: 'Payment confidently attributed to this recovery' },
];

function FinancialClosureDetail({ item }: { item: ApprovedReimbursement }) {
  const isClosed = item.closureStatus === 'RECOVERY CLOSED';
  const amount = (value: number | undefined) => typeof value === 'number' ? formatMoney(value, item.currency) : 'Not available';
  const timeline = [
    ['Recovery identified', 'Discrepancy linked to the recovery record.'],
    ['Submitted', `Case submitted to Amazon on ${item.filingDate || 'the recorded filing date'}.`],
    ['Amazon responded', `Amazon response recorded at ${amount(item.amazonResponseAmount)}.`],
    ['Payment detected', `${item.settlementStatus || 'Payment'} recorded in the settlement trail.`],
    ['Payment verified', `${amount(item.financialEvidenceAmount)} supported by ${item.evidenceSource || item.proofReference}.`],
    [isClosed ? 'Closed' : 'Still open', isClosed ? 'Financial outcome fully reconciled.' : 'Remaining difference requires continued monitoring.'],
  ];

  return (
    <section className="mt-8 border-y border-[#DCE8EE] bg-white" aria-labelledby="financial-truth-title">
      <div className="border-b border-[#DCE8EE] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Recovery financial outcome</p>
            <h2 id="financial-truth-title" className="mt-1 font-lora text-[11px] font-normal leading-tight tracking-tight text-[#182026]">
              {isClosed ? 'Recovery Closed' : 'Financially Unresolved'}
            </h2>
            <p className="mt-1 text-[13px] text-[#66737F]">{item.caseNumber} · {item.disputeName}</p>
          </div>
          <p className={`text-[12px] font-semibold uppercase tracking-tight ${isClosed ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isClosed ? 'Financial outcome reconciled' : 'Payment exists, closure not achieved'}
          </p>
        </div>
      </div>

      <div className="border-b border-[#DCE8EE] px-5 py-3 sm:px-7">
        {[
          ['Expected entitlement', item.expectedAmount],
          ['Amazon response', item.amazonResponseAmount],
          ['Financial evidence', item.financialEvidenceAmount],
          ['Verified outcome', item.verifiedAmount],
          ['Remaining', item.remainingAmount],
        ].map(([label, value], index) => (
          <div key={String(label)} className="flex items-baseline justify-between gap-4 border-b border-[#E7EEF2] py-2 last:border-b-0">
            <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
            <p className="text-[16px] font-semibold tabular-nums tracking-tight text-[#182026]">{amount(value as number | undefined)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 px-4 py-3 sm:px-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div>
          <h3 className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">Why this is {isClosed ? 'closed' : 'still open'}</h3>
          <p className="mt-2 max-w-[620px] text-[14px] leading-6 text-[#4D5B66]">{item.closureReason || (isClosed ? 'Financial outcome fully reconciled.' : 'The available financial records do not establish full closure.')}</p>

          <div className="mt-6 border-t border-[#E7EEF2] pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Financial evidence</p>
            <div className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
              <div><span className="text-[#66737F]">Settlement reference</span><p className="mt-1 font-mono text-[12px] text-[#182026]">{item.settlementId || item.proofReference}</p></div>
              <div><span className="text-[#66737F]">Settlement date</span><p className="mt-1 text-[#182026]">{formatDate(item.settlementDate || item.updated)}</p></div>
              <div><span className="text-[#66737F]">Settlement status</span><p className="mt-1 text-[#182026]">{item.settlementStatus || 'Recorded'}</p></div>
              <div><span className="text-[#66737F]">Payment attribution</span><p className="mt-1 text-[#182026]">{item.attributionStatus || 'Available records linked'}</p></div>
            </div>
          </div>

          <div className="mt-6 border-l-2 border-[#0B74DE] pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Next state</p>
            <p className="mt-1 text-[14px] font-medium text-[#182026]">{item.nextAction || (isClosed ? 'Recovery closed.' : 'Margin is monitoring.')}</p>
          </div>
        </div>

        <div>
          <h3 className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">Recovery evidence chain</h3>
          <div className="relative mt-4 space-y-4 pl-5">
            <div className="absolute bottom-2 left-[3px] top-2 w-px bg-[#DCE8EE]" />
            {timeline.map(([title, detail], index) => (
              <div key={title} className="relative">
                <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${index === timeline.length - 1 && isClosed ? 'bg-emerald-500' : 'bg-[#0B74DE]'}`} />
                <p className="text-[13px] font-semibold text-[#182026]">{title}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ApprovedReimbursements() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || '';
  const [query, setQuery] = useState('');
  const [closeoutFilter, setCloseoutFilter] = useState(closeoutFilters[0]);
  const [selectedItem, setSelectedItem] = useState<ApprovedReimbursement | null>(null);
  const [records, setRecords] = useState<ApprovedReimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let cancelled = false;

    const loadVerifiedOutcomes = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (activeSlug === 'demo-workspace') {
          if (!cancelled) {
            setRecords(demoReimbursementOutcomes);
            setSelectedItem(demoReimbursementOutcomes[0]);
          }
          return;
        }

        const ledgerResponse = await api.getRecoveriesLedger({ page: 1, page_size: 500, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
        if (!ledgerResponse.ok || !ledgerResponse.data?.success) {
          throw new Error(ledgerResponse.error || 'Unable to load recovery outcomes.');
        }

        const ledgerRows = (ledgerResponse.data.rows || []) as RecoveryLedgerRow[];
        const caseIds = Array.from(new Set(ledgerRows
          .map((row) => row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id)
          .filter((value): value is string => Boolean(value))));
        if (!caseIds.length) {
          if (!cancelled) setRecords([]);
          return;
        }

        const financialResponse = await api.getRecoveryFinancialEvents({ caseIds }, activeSlug);
        if (!financialResponse.ok || !financialResponse.data?.success) {
          throw new Error(financialResponse.error || 'Unable to load payout proof.');
        }

        const summaries = financialResponse.data.summaries as FinancialSummary[];
        const summaryByKey = new Map<string, FinancialSummary>();
        for (const summary of summaries) {
          for (const key of [summary.input_id, summary.dispute_case_id, summary.detection_result_id]) {
            if (key) summaryByKey.set(key, summary);
          }
        }

        const nextRecords = ledgerRows.flatMap((row): ApprovedReimbursement[] => {
          const caseId = row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || null;
          const financial = caseId ? summaryByKey.get(caseId) : null;
          const proof = financial?.proof_of_payment || null;
          if (
            row.has_approval_truth !== true ||
            !financial ||
            financial.payout_status !== 'paid' ||
            financial.verified_paid_amount <= 0 ||
            !proof
          ) {
            return [];
          }

          const hasVariance = Math.abs(financial.variance_amount || 0) > 0.01;
          return [{
            caseNumber: row.case_number || 'Case reference unavailable',
            amazonCaseId: row.provider_case_id || row.merchant_reference || 'Amazon reference unavailable',
            seller: row.store_name || 'Store unavailable',
            disputeName: row.case_type || row.anomaly_type || 'Recovery outcome',
            amount: financial.verified_paid_amount,
            currency: proof.currency || row.currency || 'USD',
            proofReference: proof.settlement_id || proof.payout_batch_id || proof.reference_id || 'Financial event recorded',
            closeout: hasVariance ? 'Paid with variance note' : (proof.settlement_id || proof.payout_batch_id ? 'Clean settlement match' : 'Paid and reconciled'),
            updated: proof.event_date || row.last_updated_at || null,
            settlementId: proof.settlement_id || proof.payout_batch_id || null,
            filingDate: row.submission_proof?.submitted_at || null,
            approvalDate: row.last_updated_at || null,
            expectedAmount: financial.verified_paid_amount + Math.max(financial.variance_amount || 0, 0),
            paidAmount: financial.verified_paid_amount,
            verifiedAmount: financial.verified_paid_amount,
            remainingAmount: Math.max(financial.variance_amount || 0, 0),
            closureStatus: hasVariance ? 'NOT CLOSED' : 'RECOVERY CLOSED',
            settlementDate: proof.event_date || null,
            amazonResponseAmount: financial.verified_paid_amount + Math.max(financial.variance_amount || 0, 0),
            financialEvidenceAmount: financial.verified_paid_amount,
            closureReason: hasVariance ? 'The available payment evidence does not reconcile to the expected amount.' : 'Expected, paid, and verified amounts reconcile completely.',
            nextAction: hasVariance ? 'Margin will reconcile the next settlement.' : 'Recovery closed. No further action required.',
            evidenceSource: proof.settlement_id || proof.payout_batch_id || proof.reference_id || 'Financial event record',
            settlementStatus: financial.payout_status === 'partially_paid' ? 'Partially paid' : 'Paid',
            attributionStatus: 'Payment attributed to this recovery',
          }];
        });

        if (!cancelled) setRecords(nextRecords);
      } catch (error: any) {
        if (!cancelled) {
          setRecords([]);
          setLoadError(error?.message || 'Unable to load verified reimbursement outcomes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadVerifiedOutcomes();
    return () => { cancelled = true; };
  }, [activeSlug, isReady]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((item) => {
      const matchesCloseout = closeoutFilter === closeoutFilters[0] || item.closeout === closeoutFilter;

      if (!normalizedQuery) return matchesCloseout;

      const searchable = [
        item.caseNumber,
        item.amazonCaseId,
        item.seller,
        item.disputeName,
        item.proofReference,
        item.closeout,
        formatMoney(item.amount),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery) && matchesCloseout;
    });
  }, [closeoutFilter, query, records]);

  const totalByCurrency = useMemo(() => records.reduce<Record<string, number>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] || 0) + item.amount;
    return totals;
  }, {}), [records]);
  const totalLabel = Object.entries(totalByCurrency)
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(' · ') || 'Not available';

  return (
    <PageLayout title="Financial Reconciliation" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Ledger header */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="h-px w-4 bg-[#0B74DE]" />
                <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Outcome ledger</span>
              </div>
              <h1 className="mt-2 font-lora text-[26px] font-normal leading-tight tracking-tight text-[#182026]">Reconciled cases</h1>
              <p className="mt-2 text-[14px] leading-6 tracking-tight text-[#66737F]">Cases with both a recorded approval and positive payment evidence linked to the tenant’s financial event trail.</p>
            </div>
            <Button className="h-10 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">View impact report</Button>
          </div>
        </div>

        {/* Outcome metrics */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-2 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2.5 sm:pr-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Reconciliation evidence</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">9 recorded</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Each displayed outcome has filing-linked approval truth.</p>
            </div>
            <div className="py-2.5 sm:px-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Verified paid</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">$17,383.40</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Positive reimbursement events matched to these outcomes.</p>
            </div>
            <div className="py-2.5 sm:pl-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Payout proof</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">7 linked</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Each entry exposes a recorded settlement, payout batch, or event reference.</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
          {/* Synthesis / Search Bar */}
          <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query outcomes by case ID, seller, or amount..."
                className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-20 text-[14px] font-normal tracking-tight text-[#111827] outline-none transition focus:border-[#0B74DE] focus:ring-4 focus:ring-[#0B74DE]/5 shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-[#F3F5F4] px-2 py-1 text-[10px] font-bold text-[#9CA3AF]">
                ⌘ K
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
                <div className="px-3 py-1.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">Closeout</div>
                <div className="h-4 w-px bg-[#E5E7EB]" />
                <select
                  value={closeoutFilter}
                  onChange={(e) => setCloseoutFilter(e.target.value)}
                  className="bg-transparent px-3 py-1.5 text-[12px] font-semibold text-[#111827] outline-none"
                >
                  {closeoutFilters.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Outcome Ledger Table */}
          <div className="overflow-hidden rounded-md border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F3F5F4] bg-[#F9FAFB]">
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Recovery outcome</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Registry reference</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Amazon case</th>
                    <th className="px-5 py-3 text-right text-[12px] font-medium tracking-tight text-[#66737F]">Reimbursed</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Closeout</th>
                    <th className="px-5 py-3 text-right text-[12px] font-medium tracking-tight text-[#66737F]">Recorded</th>
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F5F4]">
                  {filteredRows.map((item) => (
                    <tr 
                      key={item.caseNumber}
                      onClick={() => setSelectedItem(item)}
                      className="group cursor-pointer transition-colors hover:bg-[#F3F5F4]/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[14px] font-medium tracking-tight text-[#182026]">{item.disputeName}</p>
                          <p className="mt-1 text-[12px] text-[#66737F]">{item.seller}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] font-medium text-[#4B5563]">{item.caseNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-medium text-[#182026]">{item.amazonCaseId}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[15px] font-bold tabular-nums tracking-tight text-[#111827]">
                          {formatMoney(item.amount, item.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="border-l-2 border-[#B7C6D0] pl-2.5">
                          <p className="text-[12px] font-medium text-[#182026]">{item.closeout}</p>
                          <p className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">{item.proofReference}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] font-semibold text-[#6B7280]">{item.updated}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-[#E5E7EB] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRows.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4] text-[#9CA3AF]">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#111827]">{loading ? 'Loading verified outcomes' : (loadError ? 'Outcome ledger unavailable' : 'No verified outcomes found')}</h3>
                  <p className="mt-1 text-[13px] text-[#6B7280]">{loading ? 'Loading tenant-scoped approval and payment evidence.' : (loadError || 'No records currently meet both the approval and verified-payment criteria.')}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-[#DCE8EE] pt-5">
            <p className="text-[12px] font-medium text-[#9CA3AF]">
              Showing {filteredRows.length} of {records.length} verified outcomes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled className="text-[12px] font-bold text-[#9CA3AF]">Previous</Button>
              <Button variant="ghost" size="sm" disabled className="text-[12px] font-bold text-[#9CA3AF]">Next</Button>
            </div>
          </div>

          {selectedItem && <FinancialClosureDetail item={selectedItem} />}
        </div>

        {/* Resolution Side-Sheet */}
        {false && <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent className="w-full border-l border-[#DCE8EE] bg-white p-0 shadow-[0_18px_45px_rgba(24,32,38,0.16)] sm:max-w-[560px]">
            {selectedItem && (
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b border-[#DCE8EE] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-4 bg-[#0B74DE]" />
                      <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Resolution record</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedItem(null)}
                      className="h-8 w-8 rounded-full hover:bg-[#F3F5F4]"
                    >
                      <X className="h-4 w-4 text-[#9CA3AF]" />
                    </Button>
                  </div>
                  
                  <SheetTitle className="mb-2 font-lora text-[27px] font-normal leading-tight tracking-tight text-[#182026]">
                    {selectedItem.disputeName}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#4D5B66]">
                      {selectedItem.caseNumber}
                    </Badge>
                    <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#4D5B66]">
                      {selectedItem.closeout}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="space-y-6 pb-3">
                    {/* Financial closure formation */}
                    <section className="border-b border-[#E7EEF2] pb-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-lora text-[19px] font-normal tracking-tight text-[#182026]">Financial closeout</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Expected → paid → verified</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[#DCE8EE] bg-[#DCE8EE] sm:grid-cols-4">
                        {[
                          ['Expected', selectedItem.expectedAmount],
                          ['Paid', selectedItem.paidAmount],
                          ['Verified', selectedItem.verifiedAmount],
                          ['Remaining', selectedItem.remainingAmount],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="bg-white p-3">
                            <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
                            <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight text-[#182026]">
                              {typeof value === 'number' ? formatMoney(value, selectedItem.currency) : 'Not available'}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-3 border-l-2 pl-3 ${selectedItem.closureStatus === 'RECOVERY CLOSED' ? 'border-emerald-500' : 'border-amber-500'}`}>
                        <p className="text-[13px] font-semibold text-[#182026]">
                          {selectedItem.closureStatus === 'RECOVERY CLOSED' ? '✓ Recovery Closed' : 'Not Closed'}
                        </p>
                        <p className="mt-1 text-[12px] leading-5 text-[#66737F]">
                          {selectedItem.closureStatus === 'RECOVERY CLOSED'
                            ? 'Financial outcome fully reconciled.'
                            : `${formatMoney(selectedItem.remainingAmount || 0, selectedItem.currency)} remains unreconciled.`}
                        </p>
                      </div>
                    </section>

                    {/* Financial Outcome */}
                    <section>
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-lora text-[19px] font-normal tracking-tight text-[#182026]">Financial outcome</h3>
                        <p className="text-[11px] font-medium text-[#66737F]">Settlement confirmed</p>
                      </div>
                      <div className="mt-3 divide-y divide-[#E7EEF2] rounded-md border border-[#DCE8EE] bg-white sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="p-3 sm:col-span-1">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Reimbursed amount</p>
                          <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(selectedItem.amount, selectedItem.currency)}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Settlement ID</p>
                          <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedItem.settlementId || 'Pending'}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Proof reference</p>
                          <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedItem.proofReference}</p>
                        </div>
                      </div>
                    </section>

                    {/* Reimbursement Trail */}
                    <section className="border-t border-[#E7EEF2] pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-lora text-[19px] font-normal tracking-tight text-[#182026]">Reimbursement trail</h3>
                        <span className="text-[11px] font-medium text-[#66737F]">Verified chain</span>
                      </div>
                      
                      <div className="relative mt-4 space-y-5 pl-6">
                        <div className="absolute bottom-2 left-[6px] top-2 w-px bg-[#DCE8EE]" />
                        
                        {/* Step 1 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Discrepancy Detected</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Margin identified a gap in {selectedItem.disputeName.toLowerCase()}.</p>
                          </div>
                        </div>
                        
                        {/* Step 2 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Case Filed</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Submitted to Amazon Support on {selectedItem.filingDate || 'prior date'}.</p>
                            <p className="mt-2 text-[11px] font-medium text-[#0B74DE]">Amazon case: {selectedItem.amazonCaseId}</p>
                          </div>
                        </div>
                        
                        {/* Step 3 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Amazon Approved</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Reimbursement approved on {selectedItem.approvalDate || 'resolution date'}.</p>
                          </div>
                        </div>
                        
                        {/* Step 4 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Payout Reconciled</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Payment evidence recorded on {formatDate(selectedItem.updated)}.</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#DCE8EE] bg-[#FAFAF7] p-4 sm:p-5">
                  <div className="flex gap-3">
                    <Button className="h-10 flex-1 rounded-md bg-[#0B74DE] text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">
                      Download proof pack
                    </Button>
                    <Button variant="outline" className="h-10 flex-1 rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                      View original case
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>}
      </div>
    </PageLayout>
  );
}
