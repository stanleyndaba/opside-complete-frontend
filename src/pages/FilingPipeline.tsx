import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, ArrowUpRight, Clock3, FileCheck2, RefreshCw } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { formatEligibilityStatus, formatProofStatus, getProofStatus } from '@/lib/disputeProof';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';

type DisputeRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type DisputeQueueData = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>;

type LedgerRow = {
  row_type: 'dispute_case_projection' | 'detection_projection' | null;
  entity_type: 'dispute_case' | 'detection' | null;
  has_real_dispute_case: boolean | null;
  has_real_recovery_record: boolean | null;
  linked_dispute_case_id: string | null;
  recovery_record_id: string | null;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  case_number: string;
  provider_case_id: string | null;
  merchant_reference: string | null;
  status?: string | null;
  filing_status?: string | null;
  approved_amount: number | null;
  actual_payout_amount: number | null;
  expected_payout_amount: number | null;
  reconciliation_status: string | null;
  reconciliation_source?: string | null;
  payout_status: string | null;
  operator_state?: string | null;
  outstanding_amount?: number | null;
  currency: string;
  last_updated_at: string | null;
};

type LedgerResponse = {
  success: boolean;
  summary?: { last_updated_at: string | null } | null;
  rows: LedgerRow[];
  pagination?: {
    page: number;
    page_size: number;
    total_filtered: number;
    total_pages: number;
    total_rows: number;
  };
};

type RowTone = 'ready' | 'inFlight' | 'submitted' | 'approved' | 'completed';

const NOT_AVAILABLE = 'Not Available';
const DISPUTE_PAGE_SIZE = 100;
const LEDGER_PAGE_SIZE = 100;
const ACTIVE_FILING_STATUSES = new Set(['pending', 'retrying', 'filing', 'submitting']);
const FILED_FILING_STATUSES = new Set(['filed', 'submitted', 'resubmitted']);
const ACTIVE_AMAZON_REVIEW_STATUSES = new Set(['submitted', 'under review', 'under_review', 'in review', 'in_review', 'in_progress', 'processing']);
const APPROVED_CASE_STATUSES = new Set(['approved', 'won']);
const COMPLETED_RECOVERY_STATUSES = new Set(['reconciled', 'paid', 'paid_out', 'reimbursed']);

function amountOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return NOT_AVAILABLE;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatRelative(value: string | null | undefined) {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return formatDistanceToNow(date, { addSuffix: true });
}

function humanize(value: string | null | undefined) {
  if (!value) return NOT_AVAILABLE;
  return value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function totalAmount(values: Array<number | null | undefined>) {
  return values.reduce((sum, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);
}

function isRecoveredDisputeRow(row: DisputeRow) {
  return COMPLETED_RECOVERY_STATUSES.has(normalizeStatus(row.recovery_status))
    || amountOrNull(row.actual_payout_amount) !== null
    || normalizeStatus(row.payout_proof_status) === 'verified';
}

function isApprovedPendingDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && APPROVED_CASE_STATUSES.has(normalizeStatus(row.status))
    && !isRecoveredDisputeRow(row);
}

function isBeingFiledDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && ACTIVE_FILING_STATUSES.has(normalizeStatus(row.filing_status))
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row);
}

function isFiledDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && !isBeingFiledDisputeRow(row)
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row)
    && (
      FILED_FILING_STATUSES.has(normalizeStatus(row.filing_status))
      || ACTIVE_AMAZON_REVIEW_STATUSES.has(normalizeStatus(row.status))
    );
}

function isReadyDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && row.can_file === true
    && !isBeingFiledDisputeRow(row)
    && !isFiledDisputeRow(row)
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row);
}

function isCompletedLedgerRow(row: LedgerRow) {
  return ['reconciled', 'paid'].includes(normalizeStatus(row.reconciliation_status))
    || normalizeStatus(row.payout_status) === 'paid'
    || amountOrNull(row.actual_payout_amount) !== null;
}

function isAwaitingPayoutLedgerRow(row: LedgerRow) {
  if (isCompletedLedgerRow(row)) return false;
  const reconciliationStatus = normalizeStatus(row.reconciliation_status);
  const operatorState = normalizeStatus(row.operator_state);
  const payoutStatus = normalizeStatus(row.payout_status);
  const caseStatus = normalizeStatus(row.status);
  const hasApprovedValue = amountOrNull(row.approved_amount) !== null
    || amountOrNull(row.expected_payout_amount) !== null
    || amountOrNull(row.outstanding_amount) !== null;

  return reconciliationStatus === 'pending_payout'
    || operatorState === 'waiting_for_payout'
    || (payoutStatus === 'not_paid' && hasApprovedValue)
    || (APPROVED_CASE_STATUSES.has(caseStatus) && hasApprovedValue);
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  const valid = values
    .map((value) => {
      if (!value) return null;
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? null : { value, time };
    })
    .filter((item): item is { value: string; time: number } => item !== null)
    .sort((left, right) => right.time - left.time);
  return valid[0]?.value ?? null;
}

function disputeReference(row: DisputeRow) {
  return row.case_number || row.claim_number || row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || NOT_AVAILABLE;
}

function ledgerReference(row: LedgerRow) {
  return row.case_number || row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || NOT_AVAILABLE;
}

function disputeTypeLabel(row: DisputeRow) {
  return row.has_real_dispute_case === true ? 'Case' : 'Detection';
}

function ledgerTypeLabel(row: LedgerRow) {
  if (row.has_real_recovery_record === true) return 'Recovery';
  if (row.has_real_dispute_case === true) return 'Case';
  return 'Record';
}

function disputeTitle(row: DisputeRow) {
  return humanize(row.anomaly_type || row.case_type) !== NOT_AVAILABLE
    ? humanize(row.anomaly_type || row.case_type)
    : disputeReference(row);
}

function disputeMeta(row: DisputeRow) {
  const items = [
    row.store_name ? `Store ${row.store_name}` : null,
    row.order_id ? `Order ${row.order_id}` : null,
    row.sku ? `SKU ${row.sku}` : null,
    row.asin ? `ASIN ${row.asin}` : null,
  ].filter(Boolean);
  return items.length ? items.join(' · ') : 'Identity not available';
}

function ledgerMeta(row: LedgerRow) {
  if (row.merchant_reference) return row.merchant_reference;
  if (row.provider_case_id) return `Amazon reference ${row.provider_case_id}`;
  if (row.has_real_recovery_record === true) return 'Recovery record linked';
  if (row.has_real_dispute_case === true) return 'Dispute case linked';
  return 'Identity not available';
}

function disputeAmount(row: DisputeRow) {
  return amountOrNull(row.expected_payout_amount)
    ?? amountOrNull(row.requested_amount)
    ?? amountOrNull(row.approved_amount)
    ?? amountOrNull(row.actual_payout_amount);
}

function ledgerApprovedAmount(row: LedgerRow) {
  return amountOrNull(row.approved_amount)
    ?? amountOrNull(row.expected_payout_amount)
    ?? amountOrNull(row.actual_payout_amount);
}

function ledgerRecoveredAmount(row: LedgerRow) {
  return amountOrNull(row.actual_payout_amount)
    ?? amountOrNull(row.approved_amount)
    ?? amountOrNull(row.expected_payout_amount);
}

function readyReason(row: DisputeRow) {
  const proofStatus = getProofStatus(row);
  if (proofStatus) return `Proof: ${formatProofStatus(proofStatus)}`;
  const eligibility = formatEligibilityStatus(row.eligibility_status || null);
  if (eligibility !== 'Not available') return eligibility;
  return 'Linked case is safe to file from current backend truth.';
}

function beingFiledReason(row: DisputeRow) {
  const normalized = String(row.filing_status || '').trim().toLowerCase();
  if (normalized === 'retrying') return 'Queued for filing retry';
  if (normalized === 'pending') return 'Submitting to Amazon';
  return 'Preparing filing handoff';
}

function filedReason(row: DisputeRow) {
  const status = humanize(row.status);
  if (status !== NOT_AVAILABLE) return `Filed with Amazon · ${status}`;
  return 'Filed with Amazon · awaiting response';
}

function pendingPayoutReason(row: LedgerRow) {
  const payout = humanize(row.payout_status);
  if (payout !== NOT_AVAILABLE) return `Awaiting payout · ${payout}`;
  return 'Approved with Amazon · awaiting payout';
}

function completedReason(row: LedgerRow) {
  return String(row.payout_status || '').trim().toLowerCase() === 'paid' ? 'Payout confirmed' : 'Recovered and reconciled';
}

function toneClasses(tone: RowTone) {
  switch (tone) {
    case 'ready':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        chip: 'border-emerald-500/18 bg-emerald-500/[0.08] text-emerald-200',
      };
    case 'inFlight':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
        chip: 'border-amber-500/18 bg-amber-500/[0.08] text-amber-200',
      };
    case 'submitted':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
        chip: 'border-blue-500/18 bg-blue-500/[0.08] text-blue-200',
      };
    case 'approved':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
        chip: 'border-violet-500/18 bg-violet-500/[0.08] text-violet-200',
      };
    case 'completed':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        chip: 'border-emerald-500/18 bg-emerald-500/[0.08] text-emerald-200',
      };
  }
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/90 p-4 shadow-2xl">
      <div className="flex items-center gap-3 text-[12px] font-medium text-white/64">
        <RefreshCw className="h-4 w-4 animate-spin text-white/42" />
        <span>{label}</span>
      </div>
      <div className="mt-4 grid gap-3">
        <Skeleton className="h-24 w-full bg-white/[0.06]" />
        <Skeleton className="h-24 w-full bg-white/[0.04]" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/14 bg-[#111111]/92 px-4 py-5 text-sm leading-6 text-white/66 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
      {message}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-500/18 bg-red-500/[0.05] px-4 py-4 text-sm leading-6 text-red-100/90">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
      <div>{message}</div>
    </div>
  );
}

function PipelineSection({
  title,
  detail,
  amount,
  countLabel,
  action,
  children,
}: {
  title: string;
  detail: string;
  amount: string;
  countLabel: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <h2 className="text-[19px] font-sans font-bold tracking-tight text-white">{title}</h2>
            <div className="text-[16px] font-sans font-bold tracking-tight text-[#8b8b8b]">{amount}</div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-sans text-white/60">
            <span>{detail}</span>
            <span className="text-white/32">{countLabel}</span>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InlineMetricStack({
  rows,
}: {
  rows: Array<{ label: string; value: string | null | undefined }>;
}) {
  const visibleRows = rows.filter((row) => row.value && row.value !== NOT_AVAILABLE);

  return (
    <div className="min-w-0 lg:border-l lg:border-white/7 lg:pl-5">
      <div className="space-y-1.5">
        {visibleRows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium tracking-tight text-white/34">{row.label}</span>
            <span
              className={cn(
                'text-right font-semibold tracking-tight',
                index === 0 ? 'text-[13px] tabular-nums text-white' : 'text-[12px] text-[#c4c4c4]'
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisputeCard({
  row,
  tone,
  amountLabel,
  statusLabel,
  detail,
  timeLabel,
  action,
}: {
  row: DisputeRow;
  tone: RowTone;
  amountLabel: string;
  statusLabel: string;
  detail: string;
  timeLabel?: string | null;
  action?: React.ReactNode;
}) {
  const classes = toneClasses(tone);
  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.7fr)_auto] lg:items-start lg:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>{disputeTypeLabel(row)}</span>
            <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {disputeReference(row)}</span>
          </div>
          <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-white">{disputeTitle(row)}</h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#9a9a9a]">{detail}</p>
          <div className="mt-2 text-[11px] font-medium tracking-tight text-white/38">{disputeMeta(row)}</div>
        </div>
        <InlineMetricStack
          rows={[
            { label: amountLabel, value: formatMoney(disputeAmount(row), row.currency) },
            { label: 'Pipeline status', value: statusLabel },
            { label: 'Last movement', value: timeLabel || null },
          ]}
        />
        <div className="flex flex-col items-start gap-2 lg:items-end">{action}</div>
      </CardContent>
    </Card>
  );
}

function LedgerCard({
  row,
  tone,
  amountLabel,
  amount,
  statusLabel,
  detail,
  timeLabel,
  detailHref,
}: {
  row: LedgerRow;
  tone: RowTone;
  amountLabel: string;
  amount: number | null;
  statusLabel: string;
  detail: string;
  timeLabel?: string | null;
  detailHref: string | null;
}) {
  const classes = toneClasses(tone);
  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.7fr)_auto] lg:items-start lg:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>{ledgerTypeLabel(row)}</span>
            <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {ledgerReference(row)}</span>
          </div>
          <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-white">{ledgerReference(row)}</h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#9a9a9a]">{detail}</p>
          <div className="mt-2 text-[11px] font-medium tracking-tight text-white/38">{ledgerMeta(row)}</div>
        </div>
        <InlineMetricStack
          rows={[
            { label: amountLabel, value: formatMoney(amount, row.currency) },
            { label: 'Payout status', value: statusLabel },
            { label: 'Last movement', value: timeLabel || null },
          ]}
        />
        <div className="flex flex-col items-start gap-2 lg:items-end">
          {detailHref ? (
            <Button asChild size="sm" variant="outline" className="border-white/12 bg-transparent text-white/72 hover:bg-white/[0.05] hover:text-white">
              <Link to={detailHref}>
                Open recovery
                <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-tight text-white/34">Not Available</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FilingPipeline() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { isReady } = useTenant();
  const activeSlug = normalizeTenantSlug(tenantSlug) || '';

  const [disputeRows, setDisputeRows] = useState<DisputeRow[] | null>(null);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[] | null>(null);
  const [disputeUpdatedAt, setDisputeUpdatedAt] = useState<string | null>(null);
  const [ledgerUpdatedAt, setLedgerUpdatedAt] = useState<string | null>(null);
  const [disputeLoading, setDisputeLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ready' | 'filing' | 'filed' | 'payout' | 'completed'>('ready');

  const loadDisputes = useCallback(async () => {
    if (!activeSlug) {
      setDisputeRows([]);
      setDisputeLoading(false);
      return;
    }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      const response = await api.getDisputeCaseQueue({ page: 1, page_size: DISPUTE_PAGE_SIZE, sort_by: 'updated_at', sort_order: 'desc' }, activeSlug);
      if (!response.ok || !response.data) throw new Error(response.error || 'Unable to load filing-ready truth.');

      const firstPage = response.data as DisputeQueueData;
      const allRows = [...(firstPage.rows || [])];
      const totalRows = Number(firstPage.filtered_results || allRows.length);
      const pageSize = Math.max(1, Number(firstPage.page_size || DISPUTE_PAGE_SIZE));

      for (let page = 2; allRows.length < totalRows; page += 1) {
        const pageResponse = await api.getDisputeCaseQueue({ page, page_size: DISPUTE_PAGE_SIZE, sort_by: 'updated_at', sort_order: 'desc' }, activeSlug);
        if (!pageResponse.ok || !pageResponse.data) {
          throw new Error(pageResponse.error || 'Unable to load complete filing queue truth.');
        }

        const pageRows = pageResponse.data.rows || [];
        if (pageRows.length === 0) break;

        allRows.push(...pageRows);
        if (pageRows.length < pageSize) break;
      }

      setDisputeRows(allRows);
      setDisputeUpdatedAt(firstPage.last_updated_at || null);
    } catch (error: any) {
      setDisputeRows([]);
      setDisputeUpdatedAt(null);
      setDisputeError(error?.message || 'Unable to load filing-ready truth.');
    } finally {
      setDisputeLoading(false);
    }
  }, [activeSlug]);

  const loadLedger = useCallback(async () => {
    if (!activeSlug) {
      setLedgerRows([]);
      setLedgerLoading(false);
      return;
    }
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const response = await api.getRecoveriesLedger({ page: 1, page_size: LEDGER_PAGE_SIZE, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
      if (!response.ok || !response.data?.success) throw new Error(response.error || 'Unable to load payout truth.');
      const firstPage = response.data as LedgerResponse;
      const allRows = Array.isArray(firstPage.rows) ? [...firstPage.rows] : [];
      const totalPages = Math.max(1, Number(firstPage.pagination?.total_pages || 1));

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await api.getRecoveriesLedger({ page, page_size: LEDGER_PAGE_SIZE, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
        if (!pageResponse.ok || !pageResponse.data?.success) {
          throw new Error(pageResponse.error || 'Unable to load complete payout truth.');
        }

        const pageData = pageResponse.data as LedgerResponse;
        const pageRows = Array.isArray(pageData.rows) ? pageData.rows : [];
        if (pageRows.length === 0) break;
        allRows.push(...pageRows);
      }

      setLedgerRows(allRows);
      setLedgerUpdatedAt(firstPage.summary?.last_updated_at || null);
    } catch (error: any) {
      setLedgerRows([]);
      setLedgerUpdatedAt(null);
      setLedgerError(error?.message || 'Unable to load payout truth.');
    } finally {
      setLedgerLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!isReady) return;
    void loadDisputes();
    void loadLedger();
  }, [isReady, loadDisputes, loadLedger]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([loadDisputes(), loadLedger()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDisputes, loadLedger]);

  const readyRows = useMemo(() => (disputeRows || []).filter(isReadyDisputeRow), [disputeRows]);
  const beingFiledRows = useMemo(() => (disputeRows || []).filter(isBeingFiledDisputeRow), [disputeRows]);
  const filedRows = useMemo(() => (disputeRows || []).filter(isFiledDisputeRow), [disputeRows]);
  const approvedRows = useMemo(() => (ledgerRows || []).filter(isAwaitingPayoutLedgerRow), [ledgerRows]);
  const completedRows = useMemo(() => (ledgerRows || []).filter(isCompletedLedgerRow), [ledgerRows]);

  const readyTotal = useMemo(() => totalAmount(readyRows.map(disputeAmount)), [readyRows]);
  const inMotionTotal = useMemo(() => totalAmount([...beingFiledRows.map(disputeAmount), ...filedRows.map(disputeAmount), ...approvedRows.map(ledgerApprovedAmount)]), [approvedRows, beingFiledRows, filedRows]);
  const recoveredTotal = useMemo(() => totalAmount(completedRows.map(ledgerRecoveredAmount)), [completedRows]);

  const latestMovement = latestTimestamp(
    disputeUpdatedAt,
    ledgerUpdatedAt,
    ...readyRows.map((row) => row.updated_at),
    ...beingFiledRows.map((row) => row.updated_at),
    ...filedRows.map((row) => row.updated_at),
    ...approvedRows.map((row) => row.last_updated_at),
    ...completedRows.map((row) => row.last_updated_at),
  );

  const disputeCasesHref = tenantRoute(activeSlug, '/dispute-cases');
  const lastUpdatedLabel = latestMovement ? formatDistanceToNow(new Date(latestMovement), { addSuffix: true }) : null;
  const totalVisibleRecords = readyRows.length + beingFiledRows.length + filedRows.length + approvedRows.length + completedRows.length;
  const snapshotPills = [
    readyRows.length ? `${readyRows.length} ready to file` : null,
    beingFiledRows.length ? `${beingFiledRows.length} submitting now` : null,
    filedRows.length ? `${filedRows.length} already with Amazon` : null,
    approvedRows.length ? `${approvedRows.length} awaiting payout` : null,
    completedRows.length ? `${completedRows.length} recovered` : null,
  ].filter(Boolean) as string[];

  const pipelineTabs = [
    {
      value: 'ready' as const,
      label: 'Ready to file',
      title: 'Ready to File',
      detail: 'What money can move into Amazon filing right now.',
      amount: formatMoney(readyTotal),
      countLabel: `${readyRows.length} case${readyRows.length === 1 ? '' : 's'} ready`,
      action: readyRows.length ? (
        <Button asChild size="sm" className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight">
          <Link to={disputeCasesHref}>Start Filing<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
        </Button>
      ) : null,
      content: disputeLoading ? (
        <LoadingState label="Preparing filing-ready cases" />
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : readyRows.length ? (
        <div className="grid gap-3">
          {readyRows.map((row) => (
            <DisputeCard
              key={row.dispute_case_id}
              row={row}
              tone="ready"
              amountLabel="Estimated recovery"
              statusLabel={readyReason(row)}
              detail="Evidence and case truth are aligned, so this case can safely move into filing."
              timeLabel={row.updated_at ? `Updated ${formatRelative(row.updated_at)}` : null}
              action={<Button asChild size="sm" variant="outline" className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight"><Link to={disputeCasesHref}>Start filing<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link></Button>}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No filing-ready cases yet — continue scanning or review blocked items below." />
      ),
    },
    {
      value: 'filing' as const,
      label: 'Being filed',
      title: 'Being Filed',
      detail: 'Cases already moving through the filing handoff.',
      amount: formatMoney(totalAmount(beingFiledRows.map(disputeAmount))),
      countLabel: `${beingFiledRows.length} case${beingFiledRows.length === 1 ? '' : 's'} in submission`,
      action: null,
      content: disputeLoading ? (
        <LoadingState label="Checking active filing handoffs" />
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : beingFiledRows.length ? (
        <div className="grid gap-3">
          {beingFiledRows.map((row) => (
            <DisputeCard
              key={row.dispute_case_id}
              row={row}
              tone="inFlight"
              amountLabel="Amount in motion"
              statusLabel={beingFiledReason(row)}
              detail={String(row.filing_status || '').trim().toLowerCase() === 'retrying' ? 'Margin is retrying the filing path using the same backend action truth.' : 'Margin is handing this case off for Amazon submission now.'}
              timeLabel={row.updated_at ? `Updated ${formatRelative(row.updated_at)}` : null}
              action={<span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', toneClasses('inFlight').chip)}><Clock3 className="h-3.5 w-3.5" />{beingFiledReason(row)}</span>}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No cases are being filed right now — new submissions will appear here as soon as Margin queues them." />
      ),
    },
    {
      value: 'filed' as const,
      label: 'Filed',
      title: 'Filed / In Progress',
      detail: 'Cases already filed with Amazon and waiting on the next movement.',
      amount: formatMoney(totalAmount(filedRows.map(disputeAmount))),
      countLabel: `${filedRows.length} case${filedRows.length === 1 ? '' : 's'} already with Amazon`,
      action: null,
      content: disputeLoading ? (
        <LoadingState label="Checking filed cases and Amazon response truth" />
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : filedRows.length ? (
        <div className="grid gap-3">
          {filedRows.map((row) => (
            <DisputeCard
              key={row.dispute_case_id}
              row={row}
              tone="submitted"
              amountLabel="Amount in review"
              statusLabel={filedReason(row)}
              detail="Margin has already submitted this case and is waiting on the next Amazon response."
              timeLabel={row.updated_at ? `Last movement ${formatRelative(row.updated_at)}` : null}
              action={<span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', toneClasses('submitted').chip)}><FileCheck2 className="h-3.5 w-3.5" />Filed with Amazon</span>}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No cases filed yet — once submitted, they will appear here." />
      ),
    },
    {
      value: 'payout' as const,
      label: 'Awaiting payout',
      title: 'Approved / Awaiting Payout',
      detail: 'Approved value that still needs payout confirmation.',
      amount: formatMoney(totalAmount(approvedRows.map(ledgerApprovedAmount))),
      countLabel: `${approvedRows.length} recovery item${approvedRows.length === 1 ? '' : 's'} awaiting payout`,
      action: null,
      content: ledgerLoading ? (
        <LoadingState label="Loading payout truth" />
      ) : ledgerError ? (
        <ErrorState message={ledgerError} />
      ) : approvedRows.length ? (
        <div className="grid gap-3">
          {approvedRows.map((row) => (
            <LedgerCard
              key={row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.case_number}
              row={row}
              tone="approved"
              amountLabel="Approved value"
              amount={ledgerApprovedAmount(row)}
              statusLabel={pendingPayoutReason(row)}
              detail="Amazon approval is already recorded. Margin is now waiting on payout truth to land."
              timeLabel={row.last_updated_at ? `Awaiting payout · updated ${formatRelative(row.last_updated_at)}` : null}
              detailHref={row.linked_dispute_case_id || row.dispute_case_id ? tenantRoute(activeSlug, `/recoveries/${encodeURIComponent(row.linked_dispute_case_id || row.dispute_case_id || '')}`) : null}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No approved payouts waiting right now — once Amazon approves a case, it will appear here until payout lands." />
      ),
    },
    {
      value: 'completed' as const,
      label: 'Completed',
      title: 'Completed',
      detail: 'Recovered value already confirmed back to the account.',
      amount: formatMoney(recoveredTotal),
      countLabel: `${completedRows.length} recovery item${completedRows.length === 1 ? '' : 's'} completed`,
      action: null,
      content: ledgerLoading ? (
        <LoadingState label="Loading recovered payout confirmations" />
      ) : ledgerError ? (
        <ErrorState message={ledgerError} />
      ) : completedRows.length ? (
        <div className="grid gap-3">
          {completedRows.map((row) => (
            <LedgerCard
              key={row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.case_number}
              row={row}
              tone="completed"
              amountLabel="Recovered value"
              amount={ledgerRecoveredAmount(row)}
              statusLabel={completedReason(row)}
              detail="The payout has already been confirmed or reconciled in the recovery ledger."
              timeLabel={row.last_updated_at ? `Confirmed ${formatRelative(row.last_updated_at)}` : null}
              detailHref={row.linked_dispute_case_id || row.dispute_case_id ? tenantRoute(activeSlug, `/recoveries/${encodeURIComponent(row.linked_dispute_case_id || row.dispute_case_id || '')}`) : null}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="No completed recoveries yet — once payout is confirmed, completed items will appear here." />
      ),
    },
  ];

  return (
    <PageLayout title="Filing Pipeline" midnight>
      <div className="min-h-screen bg-[#070707] text-white relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className="relative z-10 container mx-auto px-8 pt-10 pb-20 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Filing Pipeline</h1>
              <p className="text-sm text-white/50 font-sans max-w-3xl">
                Show exactly what is ready to file, already being submitted, already with Amazon, waiting for payout, and fully recovered without asking sellers to interpret queue logic.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              {lastUpdatedLabel ? (
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/75">
                  Filing pipeline live
                  <span className="ml-2 text-white/40">{lastUpdatedLabel}</span>
                </div>
              ) : null}
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white">
                {latestMovement ? `Pipeline refreshed ${lastUpdatedLabel}` : 'Pipeline update time unavailable'}
              </div>
              <Button
                onClick={() => void refreshAll()}
                className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight"
              >
                <RefreshCw className={cn('w-3 h-3 mr-2', refreshing ? 'animate-spin' : '')} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c] text-white">
            <div className="px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Current filing snapshot</p>
                <p className="mt-2 text-sm font-sans font-bold tracking-tight text-white">
                  {readyRows.length > 0
                    ? `${formatMoney(readyTotal)} is ready to file now while ${formatMoney(inMotionTotal)} is already moving through Amazon or payout follow-up.`
                    : `${formatMoney(inMotionTotal)} is already moving while Margin keeps checking for the next filing-ready case.`}
                </p>
                <p className="mt-1 text-xs font-sans text-white/60">
                  {completedRows.length > 0
                    ? `${formatMoney(recoveredTotal)} is already confirmed back to the account.`
                    : 'Recovered payouts will appear here as soon as financial confirmation lands.'}
                </p>
                <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
                  Scope: ready, filing, filed, payout, and recovered truth from the current account
                </p>
              </div>
            </div>
            <div className="border-t border-white/8 px-5 py-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {snapshotPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"
                  >
                    {pill}
                  </span>
                ))}
                {totalVisibleRecords > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                    {totalVisibleRecords} records in pipeline view
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Ready to file', value: formatMoney(readyTotal), detail: readyRows.length ? `${readyRows.length} case${readyRows.length === 1 ? '' : 's'} can move right now` : 'Nothing is filing-ready yet' },
                  { label: 'Being filed', value: formatMoney(totalAmount(beingFiledRows.map(disputeAmount))), detail: beingFiledRows.length ? `${beingFiledRows.length} case${beingFiledRows.length === 1 ? '' : 's'} in submission` : 'No filing handoffs running right now' },
                  { label: 'With Amazon', value: formatMoney(totalAmount([...filedRows.map(disputeAmount), ...approvedRows.map(ledgerApprovedAmount)])), detail: filedRows.length + approvedRows.length ? `${filedRows.length + approvedRows.length} case${filedRows.length + approvedRows.length === 1 ? '' : 's'} waiting on Amazon or payout` : 'No filed or approved cases yet' },
                  { label: 'Recovered', value: formatMoney(recoveredTotal), detail: completedRows.length ? `${completedRows.length} payout-confirmed item${completedRows.length === 1 ? '' : 's'}` : 'No recovered payouts confirmed yet' },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{card.label}</div>
                    <div className="mt-2 text-left text-lg font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">{card.value}</div>
                    <div className="mt-1 text-[11px] font-sans leading-5 tracking-tight text-white/62">{card.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-5">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Conversion surface</div>
                  <h2 className="mt-2 text-xl font-sans font-bold tracking-tight text-white">Money moving through filing</h2>
                  <p className="mt-1 text-xs font-sans leading-5 text-white/60">
                    Each tab answers one question: what can file, what is filing, what is already with Amazon, what is approved, and what is already recovered.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
                <div className="overflow-x-auto border-b border-white/6">
                  <TabsList className="h-auto w-full min-w-max justify-start gap-8 rounded-none bg-transparent px-6 py-0 text-left">
                    {pipelineTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent px-0 py-4 text-[15px] font-sans font-semibold tracking-tight text-white/38 shadow-none ring-0 transition-colors hover:text-white/70 data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {pipelineTabs.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-0">
                    <PipelineSection title={tab.title} detail={tab.detail} amount={tab.amount} countLabel={tab.countLabel} action={tab.action}>
                      {tab.content}
                    </PipelineSection>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
