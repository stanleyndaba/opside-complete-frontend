import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { useToast } from '@/hooks/use-toast';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';
import { RefreshCw, AlertTriangle, MoreHorizontal, Search } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';

type Blocker = { key: string; label: string; count: number; severity: 'low' | 'medium' | 'high' };
type Summary = {
  approved_count: number;
  pending_payout_count: number;
  reconciled_count: number;
  partial_recovery_count: number;
  unreconciled_count: number;
  investigation_required_count: number;
  billing_pending_count: number;
  recovered_cash_total: number;
  approved_value_total: number;
  pending_payout_total: number;
  billed_revenue_total: number;
  last_updated_at: string | null;
  blockers: Blocker[];
};
type Row = {
  recovery_id: string;
  dispute_case_id: string;
  detection_result_id: string | null;
  case_number: string;
  provider_case_id: string | null;
  merchant_reference: string | null;
  status: string | null;
  recovery_status: string | null;
  billing_status: string | null;
  approved_amount: number | null;
  actual_payout_amount: number | null;
  expected_payout_amount: number | null;
  billed_revenue_amount: number | null;
  reconciliation_status: string;
  operator_state: string;
  recovery_work_status?: string | null;
  billing_work_status?: string | null;
  recovery_work_item_id?: string | null;
  billing_work_item_id?: string | null;
  recovery_execution_lane?: string | null;
  billing_execution_lane?: string | null;
  recovery_work_error?: string | null;
  billing_work_error?: string | null;
  recovery_work_attempts?: number | null;
  billing_work_attempts?: number | null;
  recovery_defer_count?: number | null;
  billing_defer_count?: number | null;
  recovery_last_deferred_reason?: string | null;
  billing_last_deferred_reason?: string | null;
  recovery_last_processed_at?: string | null;
  billing_last_processed_at?: string | null;
  recovery_last_claimed_at?: string | null;
  billing_last_claimed_at?: string | null;
  recovery_last_runtime_role?: string | null;
  billing_last_runtime_role?: string | null;
  recovery_next_attempt_at?: string | null;
  billing_next_attempt_at?: string | null;
  investigation_required: boolean;
  currency: string;
  expected_payout_date: string | null;
  last_updated_at: string | null;
};
type Ledger = {
  success: boolean;
  summary: Summary;
  rows: Row[];
  pagination: { page: number; page_size: number; total_filtered: number; total_pages: number; total_rows: number };
};
type ProofDocument = {
  id: string;
  name?: string;
  filename?: string;
  type?: string;
  doc_type?: string;
  uploadDate?: string;
  created_at?: string;
  url?: string;
  supplier?: string;
  invoice_number?: string;
  amount?: number;
};

const PAGE_SIZE = 10;
const statusOptions = [['all', 'All Recovery States'], ['waiting_for_payout', 'Waiting For Payout'], ['recovery_processing', 'Recovery Processing'], ['payout_detected_not_reconciled', 'Payout Detected'], ['partial_payout_review', 'Partial Recovery'], ['billing_pending', 'Billing Pending'], ['billing_processing', 'Billing Processing'], ['billing_complete', 'Billing Complete'], ['investigation_required', 'Investigation Required']];
const reconciliationOptions = [['all', 'All Reconciliation States'], ['pending_payout', 'Pending Payout'], ['payout_detected', 'Payout Detected'], ['partial_recovery', 'Partial Recovery'], ['reconciled', 'Reconciled'], ['unknown', 'Unknown']];
const billingOptions = [['all', 'All Billing States'], ['pending', 'Pending'], ['sent', 'Sent'], ['charged', 'Charged'], ['credited', 'Credited'], ['paid', 'Paid']];
const sortOptions = [['last_updated_at', 'Last Updated'], ['actual_payout_amount', 'Actual Payout'], ['approved_amount', 'Approved Value'], ['expected_payout_amount', 'Pending Payout'], ['case_number', 'Case Reference']];
const dateRanges = [['30', 'Last 30 Days'], ['90', 'Last 90 Days'], ['365', 'This Year'], ['all', 'All Time']];

const money = (value: number | null | undefined, currency = 'USD') =>
  typeof value === 'number' && !Number.isNaN(value)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    : 'Not available';

const stamp = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const label = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Unknown';

const describeWorkCycle = (status: string | null | undefined, deferReason: string | null | undefined, nextAttemptAt: string | null | undefined) => {
  const normalized = String(status || '').toLowerCase();
  if (!normalized) return null;
  if (normalized === 'pending' && deferReason) {
    return `Deferred: ${label(deferReason)}${nextAttemptAt ? ` · Next ${stamp(nextAttemptAt)}` : ''}`;
  }
  if (normalized === 'processing') {
    return 'Claimed by execution lane';
  }
  if (normalized === 'failed_retry_exhausted') {
    return 'Retry exhausted';
  }
  return null;
};

const severityTone = (severity: Blocker['severity']) =>
  severity === 'high'
    ? 'border-red-500/25 bg-red-500/10 text-red-200'
    : severity === 'medium'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
      : 'border-blue-500/25 bg-blue-500/10 text-blue-100';

const badgeTone = (value: string | null | undefined) => {
  const normalized = String(value || '').toLowerCase();
  if (['reconciled', 'billing_complete', 'paid', 'charged', 'credited', 'complete', 'completed'].includes(normalized)) return 'border-blue-500/20 bg-blue-500/10 text-blue-100';
  if (['partial_recovery', 'partial_payout_review', 'payout_detected', 'payout_detected_not_reconciled', 'waiting_for_payout', 'billing_pending', 'billing_processing', 'recovery_processing', 'pending', 'pending_payout', 'processing'].includes(normalized)) return 'border-amber-500/20 bg-amber-500/10 text-amber-100';
  if (['investigation_required', 'failed', 'failed_retry_exhausted', 'rejected', 'denied', 'lost'].includes(normalized)) return 'border-red-500/20 bg-red-500/10 text-red-200';
  return 'border-white/10 bg-white/[0.04] text-white/70';
};

function Metric({ labelText, value, sublabel }: { labelText: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{labelText}</div>
      <div className="mt-3 text-[22px] font-sans font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/24">{sublabel}</div>
    </div>
  );
}

function DetailSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
            <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{row.label}</span>
            <span className="text-right text-[11px] font-sans font-semibold tracking-tight text-white/86">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecoveryPipelineAgent8() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReady } = useTenant();
  const activeSlug = (tenantSlug || '').trim();
  const { toast } = useToast();
  const urlQuery = (searchParams.get('q') || '').trim();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reconciliationFilter, setReconciliationFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [proofDocsModalOpen, setProofDocsModalOpen] = useState(false);
  const [proofDocsClaim, setProofDocsClaim] = useState<{ id: string; claim_number?: string } | null>(null);
  const [proofDocs, setProofDocs] = useState<ProofDocument[]>([]);
  const [evidencePackOpen, setEvidencePackOpen] = useState(false);
  const [evidencePackClaimId, setEvidencePackClaimId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState<Row | null>(null);
  const liveRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTerm !== urlQuery) {
      setSearchTerm(urlQuery);
      setPage(1);
    }
  }, [searchTerm, urlQuery]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim();
    const currentQuery = (searchParams.get('q') || '').trim();
    if (normalizedSearch === currentQuery) return;

    const nextParams = new URLSearchParams(searchParams);
    if (normalizedSearch) {
      nextParams.set('q', normalizedSearch);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, searchTerm, setSearchParams]);

  const fetchLedger = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (!activeSlug) return;
    if (mode === 'load') setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const response = await api.getRecoveriesLedger({
        search: searchTerm || undefined,
        status: statusFilter,
        reconciliation_status: reconciliationFilter,
        billing_status: billingFilter,
        date_range: dateRange,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: PAGE_SIZE,
      }, activeSlug);
      if (!response.ok || !response.data?.success) throw new Error(response.error || 'Failed to load recoveries.');
      setLedger(response.data as Ledger);
    } catch (err: any) {
      setLedger(null);
      setError(err?.message || 'Failed to load recoveries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSlug, billingFilter, dateRange, page, reconciliationFilter, searchTerm, sortBy, sortDir, statusFilter]);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    fetchLedger('load');
  }, [activeSlug, fetchLedger, isReady]);

  useEffect(() => () => {
    if (liveRefreshTimeoutRef.current) {
      clearTimeout(liveRefreshTimeoutRef.current);
      liveRefreshTimeoutRef.current = null;
    }
  }, []);

  const scheduleLiveRefresh = useCallback(() => {
    if (liveRefreshTimeoutRef.current) {
      clearTimeout(liveRefreshTimeoutRef.current);
    }
    liveRefreshTimeoutRef.current = setTimeout(() => {
      fetchLedger('refresh');
      liveRefreshTimeoutRef.current = null;
    }, 400);
  }, [fetchLedger]);

  useStatusStream((event: StatusEvent) => {
    const eventType = String(event.eventType || '').toLowerCase();
    const eventStatus = String(event.data?.status || '').toLowerCase();

    const isRecoveryRelevant =
      eventType === 'payout.detected' ||
      eventType === 'recovery.work_claimed' ||
      eventType === 'recovery.work_created' ||
      eventType === 'recovery.work_deferred' ||
      eventType === 'recovery.completed' ||
      eventType === 'recovery.quarantined' ||
      eventType === 'recovery.failed' ||
      eventType === 'recovery.failed_retry_exhausted' ||
      eventType === 'billing.work_claimed' ||
      eventType === 'billing.work_created' ||
      eventType === 'billing.work_deferred' ||
      eventType === 'billing.completed' ||
      eventType === 'billing.processed' ||
      eventType === 'billing.failed' ||
      eventType === 'billing.failed_retry_exhausted' ||
      (eventType === 'case.status_updated' && eventStatus === 'approved');

    if (!isRecoveryRelevant) return;
    scheduleLiveRefresh();
  }, activeSlug);

  const summary = ledger?.summary || null;
  const rows = ledger?.rows || [];
  const pagination = ledger?.pagination || null;
  const filteredLabel = useMemo(() => pagination ? `${pagination.total_filtered} filtered results of ${pagination.total_rows}` : '', [pagination]);

  const openProofDocuments = async (row: Row) => {
    try {
      const res = await api.getRecoveryDetail(row.dispute_case_id || row.recovery_id, activeSlug);
      if (!res.ok) {
        throw new Error(res.error || 'Unable to load proof documents.');
      }
      setProofDocs(Array.isArray(res.data?.documents) ? res.data.documents : []);
      setProofDocsClaim({ id: row.dispute_case_id || row.recovery_id, claim_number: row.case_number });
      setProofDocsModalOpen(true);
    } catch (err: any) {
      toast({ title: 'Unable to load proof documents', description: err?.message || 'The linked evidence documents could not be loaded.' });
    }
  };

  const openRecoveryDetails = (row: Row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const openEvidencePacket = (row: Row) => {
    setEvidencePackClaimId(row.dispute_case_id || row.recovery_id);
    setEvidencePackOpen(true);
  };

  if (isReady && !activeSlug) {
    return (
      <PageLayout title="Recovery Pipeline" midnight>
        <Card className="border-red-500/20 bg-[#0c0c0c]">
          <CardContent className="flex items-start gap-4 p-8">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-red-400">Tenant Required</div>
              <div className="mt-2 text-sm font-sans font-bold text-white">Recovery truth is blocked until a real tenant context is present.</div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Recovery Pipeline" midnight>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
      <div className="relative w-full flex-1 overflow-x-hidden bg-[#050505]">
        <div className="relative w-full max-w-full px-8 pt-8 pb-24">
          <div className="mb-8 border-b border-white/10 pb-8">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Recovery Ledger</div>
            <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-light tracking-tight text-white">Recovery Pipeline</h1>
                <p className="mt-3 max-w-3xl text-[11px] font-sans font-medium uppercase tracking-tight text-white/32">
                  Approved claims, pending payouts, reconciliations, and billed recoveries for your account.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {summary?.last_updated_at ? <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/24">Updated {stamp(summary.last_updated_at)}</div> : null}
                <Button variant="outline" className="h-10 rounded-lg border-white/10 bg-white/5 px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white" onClick={() => fetchLedger('refresh')} disabled={loading || refreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Recoveries
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <Card className="border-white/10 bg-[#0c0c0c]">
              <CardContent className="space-y-6 p-8">
                <div className="grid gap-4 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-white/10" />)}</div>
                <Skeleton className="h-24 rounded-2xl bg-white/10" />
                <Skeleton className="h-80 rounded-2xl bg-white/10" />
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-500/20 bg-[#0c0c0c]">
              <CardContent className="flex items-start gap-4 p-8">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
                <div>
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-red-400">Recovery Error</div>
                  <div className="mt-2 text-sm font-sans font-bold text-white">{error}</div>
                </div>
              </CardContent>
            </Card>
          ) : summary && pagination ? (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-4">
                <Metric labelText="Recovered Cash" value={money(summary.recovered_cash_total)} sublabel={`${summary.reconciled_count} reconciled, ${summary.unreconciled_count} unreconciled`} />
                <Metric labelText="Pending Payout" value={money(summary.pending_payout_total)} sublabel={`${summary.pending_payout_count} waiting for payout`} />
                <Metric labelText="Approved Value" value={money(summary.approved_value_total)} sublabel={`${summary.approved_count} approved cases`} />
                <Metric labelText="Billed Revenue" value={money(summary.billed_revenue_total)} sublabel={`${summary.billing_pending_count} billing pending`} />
              </div>

              <Card className="border-white/10 bg-[#0c0c0c]">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Recovery State Summary</div>
                      <div className="mt-2 text-[11px] font-sans font-medium uppercase tracking-tight text-white/32">{filteredLabel}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[['Reconciled', summary.reconciled_count], ['Partial Recovery', summary.partial_recovery_count], ['Unreconciled', summary.unreconciled_count], ['Investigation Required', summary.investigation_required_count]].map(([text, value]) => (
                        <div key={String(text)} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
                          {text}: <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {summary.blockers.length > 0 ? <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">{summary.blockers.map((blocker) => <div key={blocker.key} className={`rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight ${severityTone(blocker.severity)}`}>{blocker.label}: {blocker.count}</div>)}</div> : null}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#0c0c0c]">
                <CardContent className="space-y-6 p-8">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-xl">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                          <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search by case reference, provider case ID, merchant, or status" className="h-12 rounded-xl border-white/10 bg-white/[0.03] pl-11 text-sm font-sans font-bold text-white placeholder:text-white/20" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dateRanges.map(([value, text]) => (
                            <Button key={value} type="button" variant="outline" className={`h-9 rounded-full px-4 text-[10px] font-sans font-bold uppercase tracking-tight ${dateRange === value ? 'border-white/30 bg-white text-black hover:bg-white/90' : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'}`} onClick={() => { setDateRange(value); setPage(1); }}>
                              {text}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                          <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"><SelectValue placeholder="Recovery state" /></SelectTrigger>
                          <SelectContent className="rounded-xl border border-white/10 bg-[#0c0c0c] text-white">{statusOptions.map(([value, text]) => <SelectItem key={value} value={value} className="text-[10px] font-sans font-bold uppercase tracking-tight">{text}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={reconciliationFilter} onValueChange={(v) => { setReconciliationFilter(v); setPage(1); }}>
                          <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"><SelectValue placeholder="Reconciliation" /></SelectTrigger>
                          <SelectContent className="rounded-xl border border-white/10 bg-[#0c0c0c] text-white">{reconciliationOptions.map(([value, text]) => <SelectItem key={value} value={value} className="text-[10px] font-sans font-bold uppercase tracking-tight">{text}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={billingFilter} onValueChange={(v) => { setBillingFilter(v); setPage(1); }}>
                          <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"><SelectValue placeholder="Billing" /></SelectTrigger>
                          <SelectContent className="rounded-xl border border-white/10 bg-[#0c0c0c] text-white">{billingOptions.map(([value, text]) => <SelectItem key={value} value={value} className="text-[10px] font-sans font-bold uppercase tracking-tight">{text}</SelectItem>)}</SelectContent>
                        </Select>
                        <div className="flex gap-3">
                          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                            <SelectTrigger className="h-11 flex-1 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"><SelectValue placeholder="Sort by" /></SelectTrigger>
                            <SelectContent className="rounded-xl border border-white/10 bg-[#0c0c0c] text-white">{sortOptions.map(([value, text]) => <SelectItem key={value} value={value} className="text-[10px] font-sans font-bold uppercase tracking-tight">{text}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button type="button" variant="outline" className="h-11 rounded-xl border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white" onClick={() => { setSortDir((current) => current === 'asc' ? 'desc' : 'asc'); setPage(1); }}>
                            {sortDir === 'asc' ? 'Asc' : 'Desc'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {rows.length === 0 ? <div className="text-sm font-sans font-bold text-white/50">No recovery rows match the current backend filters.</div> : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-3 pr-4 text-left text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Recovery Case</th>
                              <th className="px-4 py-3 text-left text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Recovery State</th>
                              <th className="px-4 py-3 text-left text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Money</th>
                              <th className="px-4 py-3 text-left text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Billing</th>
                              <th className="px-4 py-3 text-left text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Currentness</th>
                              <th className="pl-4 py-3 text-right text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.recovery_id} className="border-b border-white/[0.06] align-top">
                                <td className="py-5 pr-4">
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-sans font-semibold tracking-tight text-white/92">{row.case_number}</div>
                                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/45">
                                      {row.merchant_reference ? `Merchant ${row.merchant_reference}` : 'Merchant reference not available'}
                                    </div>
                                    {(row.recovery_work_status || row.billing_work_status) ? (
                                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/28">
                                        {row.recovery_work_status ? `Recovery Work ${label(row.recovery_work_status)}` : ''}
                                        {row.recovery_work_status && row.billing_work_status ? ' · ' : ''}
                                        {row.billing_work_status ? `Billing Work ${label(row.billing_work_status)}` : ''}
                                      </div>
                                    ) : null}
                                    {(row.recovery_execution_lane || row.billing_execution_lane) ? (
                                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/20">
                                        {row.recovery_execution_lane ? `Recovery Lane ${label(row.recovery_execution_lane)}` : ''}
                                        {row.recovery_execution_lane && row.billing_execution_lane ? ' · ' : ''}
                                        {row.billing_execution_lane ? `Billing Lane ${label(row.billing_execution_lane)}` : ''}
                                      </div>
                                    ) : null}
                                    {describeWorkCycle(row.recovery_work_status, row.recovery_last_deferred_reason, row.recovery_next_attempt_at) ? (
                                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-amber-100/70">
                                        {describeWorkCycle(row.recovery_work_status, row.recovery_last_deferred_reason, row.recovery_next_attempt_at)}
                                      </div>
                                    ) : null}
                                    {describeWorkCycle(row.billing_work_status, row.billing_last_deferred_reason, row.billing_next_attempt_at) ? (
                                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-blue-100/60">
                                        {describeWorkCycle(row.billing_work_status, row.billing_last_deferred_reason, row.billing_next_attempt_at)}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-4 py-5">
                                  <div className="flex flex-col gap-2">
                                    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.operator_state)}`}>{label(row.operator_state)}</span>
                                    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.reconciliation_status)}`}>{label(row.reconciliation_status)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-5">
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">Approved Value</div>
                                    <div className="text-[12px] font-sans font-semibold tracking-tight text-white">{money(row.approved_amount, row.currency)}</div>
                                    <div className="pt-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">Actual Payout</div>
                                    <div className="text-[12px] font-sans font-semibold tracking-tight text-white">{money(row.actual_payout_amount, row.currency)}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-5">
                                  <div className="space-y-2">
                                    <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.billing_status)}`}>{label(row.billing_status)}</span>
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/32">Billed Revenue</div>
                                    <div className="text-[12px] font-sans font-semibold tracking-tight text-white">{money(row.billed_revenue_amount, row.currency)}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-5">
                                  <div className="space-y-2">
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/32">Last Updated</div>
                                    <div className="text-[10px] font-sans font-semibold tracking-tight text-white/78">{stamp(row.last_updated_at)}</div>
                                    {(row.recovery_next_attempt_at || row.billing_next_attempt_at) ? (
                                      <>
                                        <div className="pt-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/32">Next Attempt</div>
                                        <div className="text-[10px] font-sans font-semibold tracking-tight text-white/78">{stamp(row.recovery_next_attempt_at || row.billing_next_attempt_at)}</div>
                                      </>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="py-5 pl-4 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-white/26 hover:bg-white/5 hover:text-white">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-xl border border-white/10 bg-[#0c0c0c] p-1 shadow-2xl backdrop-blur-3xl">
                                      <div className="mb-1 border-b border-white/5 px-3 py-2 text-[9px] font-sans font-bold uppercase tracking-tight text-white/20">Recovery Actions</div>
                                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white">
                                        <Link to={`/app/${activeSlug}/recoveries/${row.dispute_case_id}`}>View Case Detail</Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white" onClick={() => openProofDocuments(row)}>
                                        Proof Documents
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white" onClick={() => openEvidencePacket(row)}>
                                        Evidence Packet
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white" onClick={() => openRecoveryDetails(row)}>
                                        Recovery Details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <div className="mt-3 text-[9px] font-sans font-medium uppercase tracking-tight text-white/28">{row.investigation_required ? 'Needs Investigation' : label(row.operator_state)}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-5">
                        <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">Page {pagination.page} of {pagination.total_pages}</div>
                        <div className="flex items-center gap-3">
                          <Button type="button" variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                          <Button type="button" variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white" disabled={pagination.page >= pagination.total_pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      <ProofDocumentsModal open={proofDocsModalOpen} onClose={() => setProofDocsModalOpen(false)} claimId={proofDocsClaim?.id || ''} claimNumber={proofDocsClaim?.claim_number} documents={proofDocs} />
      {evidencePackClaimId ? (
        <EvidencePackView
          open={evidencePackOpen}
          onClose={() => {
            setEvidencePackOpen(false);
            setEvidencePackClaimId(null);
          }}
          claimId={evidencePackClaimId}
          tenantSlug={activeSlug}
        />
      ) : null}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[#0c0c0c] text-white shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">Recovery Details</div>
            <DialogTitle className="text-2xl font-sans font-bold tracking-tight text-white">
              {detailsRow?.case_number || 'Recovery Case'}
            </DialogTitle>
          </DialogHeader>
          {detailsRow ? (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
              <DetailSection
                title="Case"
                rows={[
                  { label: 'Case Number', value: detailsRow.case_number || 'Not available' },
                  { label: 'Merchant Reference', value: detailsRow.merchant_reference || 'Not available' },
                  { label: 'Provider Case', value: detailsRow.provider_case_id || 'Not available' },
                  { label: 'Detection Reference', value: detailsRow.detection_result_id || 'Not available' },
                  { label: 'Dispute Case ID', value: detailsRow.dispute_case_id || 'Not available' },
                ]}
              />
              <DetailSection
                title="Status"
                rows={[
                  { label: 'Operator State', value: label(detailsRow.operator_state) },
                  { label: 'Reconciliation State', value: label(detailsRow.reconciliation_status) },
                  { label: 'Case Status', value: label(detailsRow.status) },
                  { label: 'Recovery Status', value: label(detailsRow.recovery_status) },
                  { label: 'Recovery Work', value: label(detailsRow.recovery_work_status) },
                  { label: 'Recovery Work Item', value: detailsRow.recovery_work_item_id || 'Not available' },
                  { label: 'Recovery Lane', value: detailsRow.recovery_execution_lane ? label(detailsRow.recovery_execution_lane) : 'Not available' },
                  { label: 'Recovery Runtime', value: detailsRow.recovery_last_runtime_role ? label(detailsRow.recovery_last_runtime_role) : 'Not available' },
                  { label: 'Recovery Attempts', value: String(detailsRow.recovery_work_attempts ?? 0) },
                  { label: 'Recovery Defers', value: String(detailsRow.recovery_defer_count ?? 0) },
                  { label: 'Deferred Reason', value: detailsRow.recovery_last_deferred_reason ? label(detailsRow.recovery_last_deferred_reason) : 'None' },
                  { label: 'Last Claimed', value: stamp(detailsRow.recovery_last_claimed_at) },
                  { label: 'Last Processed', value: stamp(detailsRow.recovery_last_processed_at) },
                  { label: 'Next Attempt', value: stamp(detailsRow.recovery_next_attempt_at) },
                  { label: 'Recovery Error', value: detailsRow.recovery_work_error || 'None' },
                  { label: 'Investigation Required', value: detailsRow.investigation_required ? 'Yes' : 'No' },
                ]}
              />
              <DetailSection
                title="Money"
                rows={[
                  { label: 'Approved Value', value: money(detailsRow.approved_amount, detailsRow.currency) },
                  { label: 'Actual Payout', value: money(detailsRow.actual_payout_amount, detailsRow.currency) },
                  { label: 'Pending Payout', value: money(detailsRow.expected_payout_amount, detailsRow.currency) },
                ]}
              />
              <DetailSection
                title="Billing"
                rows={[
                  { label: 'Billing Status', value: label(detailsRow.billing_status) },
                  { label: 'Billing Work', value: label(detailsRow.billing_work_status) },
                  { label: 'Billing Work Item', value: detailsRow.billing_work_item_id || 'Not available' },
                  { label: 'Billing Lane', value: detailsRow.billing_execution_lane ? label(detailsRow.billing_execution_lane) : 'Not available' },
                  { label: 'Billing Runtime', value: detailsRow.billing_last_runtime_role ? label(detailsRow.billing_last_runtime_role) : 'Not available' },
                  { label: 'Billing Attempts', value: String(detailsRow.billing_work_attempts ?? 0) },
                  { label: 'Billing Defers', value: String(detailsRow.billing_defer_count ?? 0) },
                  { label: 'Deferred Reason', value: detailsRow.billing_last_deferred_reason ? label(detailsRow.billing_last_deferred_reason) : 'None' },
                  { label: 'Last Claimed', value: stamp(detailsRow.billing_last_claimed_at) },
                  { label: 'Last Processed', value: stamp(detailsRow.billing_last_processed_at) },
                  { label: 'Next Attempt', value: stamp(detailsRow.billing_next_attempt_at) },
                  { label: 'Billing Error', value: detailsRow.billing_work_error || 'None' },
                  { label: 'Billed Revenue', value: money(detailsRow.billed_revenue_amount, detailsRow.currency) },
                  { label: 'Currency', value: detailsRow.currency || 'USD' },
                ]}
              />
              <DetailSection
                title="Currentness"
                rows={[
                  { label: 'Last Updated', value: stamp(detailsRow.last_updated_at) },
                  { label: 'Expected Payout Date', value: stamp(detailsRow.expected_payout_date) },
                  { label: 'Recovery ID', value: detailsRow.recovery_id || 'Not available' },
                ]}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
