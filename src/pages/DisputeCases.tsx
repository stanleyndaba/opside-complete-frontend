import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, ArrowRight, FileText, Loader2, RefreshCw, Search, ShieldAlert } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizeTenantSlug } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { TenantLink as Link } from '@/components/navigation/TenantLink';

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  filed: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  submitted: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/20',
  denied: 'bg-red-500/10 text-red-300 border-red-500/20',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  reconciled: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  pending_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-300 border-red-500/20',
  retrying: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  billed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  charged: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  credited: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  default: 'bg-white/5 text-white/50 border-white/10'
};

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not available';
  return value.replace(/_/g, ' ');
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function badgeClass(value: string | null | undefined) {
  const key = String(value || '').toLowerCase();
  return STATUS_BADGE_STYLES[key] || STATUS_BADGE_STYLES.default;
}

export default function DisputeCases() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady, isThrottled } = useTenant();
  const { isPaidUser } = useSession();
  const { toast } = useToast();

  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filingInProgress, setFilingInProgress] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [summary, setSummary] = useState({
    total_cases: 0,
    filtered_results: 0,
    blocked_count: 0,
    ready_to_file_count: 0,
    filed_count: 0,
    rejected_count: 0,
    approved_pending_payout_count: 0,
    recovered_count: 0,
    billing_pending_count: 0,
    last_updated_at: null as string | null,
    page: 1,
    page_size: 25
  });

  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [filingStatus, setFilingStatus] = useState('all');
  const [recoveryStatus, setRecoveryStatus] = useState('all');
  const [billingStatus, setBillingStatus] = useState('all');
  const [evidenceState, setEvidenceState] = useState('all');
  const [rejectionCategory, setRejectionCategory] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!activeTenantSlug) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const loadQueue = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getDisputeCaseQueue({
          search: searchTerm || undefined,
          status: status !== 'all' ? status : undefined,
          filing_status: filingStatus !== 'all' ? filingStatus : undefined,
          recovery_status: recoveryStatus !== 'all' ? recoveryStatus : undefined,
          billing_status: billingStatus !== 'all' ? billingStatus : undefined,
          evidence_state: evidenceState !== 'all' ? evidenceState : undefined,
          rejection_category: rejectionCategory !== 'all' ? rejectionCategory : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          page_size: pageSize
        }, activeTenantSlug);

        if (!response.ok || !response.data) {
          throw new Error(response.error || 'Failed to load dispute cases');
        }

        if (cancelled) return;

        setRows(response.data.rows || []);
        setSummary({
          total_cases: response.data.total_cases,
          filtered_results: response.data.filtered_results,
          blocked_count: response.data.blocked_count,
          ready_to_file_count: response.data.ready_to_file_count,
          filed_count: response.data.filed_count,
          rejected_count: response.data.rejected_count,
          approved_pending_payout_count: response.data.approved_pending_payout_count,
          recovered_count: response.data.recovered_count,
          billing_pending_count: response.data.billing_pending_count,
          last_updated_at: response.data.last_updated_at,
          page: response.data.page,
          page_size: response.data.page_size
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dispute cases');
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadQueue();
    return () => { cancelled = true; };
  }, [activeTenantSlug, searchTerm, status, filingStatus, recoveryStatus, billingStatus, evidenceState, rejectionCategory, sortBy, sortOrder, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(summary.filtered_results / pageSize));

  const refresh = () => setRefreshKey((value) => value + 1);

  const handleFilingAction = async (row: QueueRow, mode: 'file' | 'retry' | 'approve') => {
    if (!activeTenantSlug) return;
    if (!isPaidUser && mode === 'file') {
      toast({ title: 'Upgrade required', description: 'Paid access is required before filing a case.' });
      return;
    }
    if (isThrottled) {
      toast({ variant: 'destructive', title: 'System cooldown', description: 'Filing is temporarily disabled due to Amazon rate limits.' });
      return;
    }

    const key = row.dispute_case_id;
    setFilingInProgress((prev) => new Set(prev).add(key));
    try {
      const endpoint =
        mode === 'approve'
          ? `/api/disputes/approve-filing?tenantSlug=${encodeURIComponent(activeTenantSlug)}`
          : mode === 'retry'
            ? `/api/disputes/retry-filing?tenantSlug=${encodeURIComponent(activeTenantSlug)}`
            : `/api/disputes/file-now?tenantSlug=${encodeURIComponent(activeTenantSlug)}`;

      const response = await api.post(endpoint, {
        dispute_id: row.dispute_case_id,
        claim_id: row.detection_result_id
      });

      if (!response.ok) {
        throw new Error(response.error || 'Action failed');
      }

      toast({
        title: mode === 'approve' ? 'Case approved' : mode === 'retry' ? 'Retry queued' : 'Case filed',
        description: row.case_number || row.dispute_case_id
      });
      refresh();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: err.message || 'Please try again.' });
    } finally {
      setFilingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const summaryCards = useMemo(() => ([
    { label: 'Total Cases', value: summary.total_cases },
    { label: 'Ready to File', value: summary.ready_to_file_count },
    { label: 'Filed', value: summary.filed_count },
    { label: 'Rejected', value: summary.rejected_count },
    { label: 'Approved / Pending Payout', value: summary.approved_pending_payout_count },
    { label: 'Recovered', value: summary.recovered_count },
    { label: 'Billing Pending', value: summary.billing_pending_count },
  ]), [summary]);

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Dispute Cases" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pt-10 pb-20">
            <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl">
              <CardContent className="p-8 space-y-3">
                <h1 className="text-xl font-sans font-bold text-white tracking-tight">Dispute queue unavailable</h1>
                <p className="text-sm text-white/50 font-sans">
                  A tenant workspace is required before dispute cases can be loaded.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dispute Cases" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="relative container mx-auto px-8 pt-10 pb-20 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Dispute Cases</h1>
              <p className="text-sm text-white/50 font-sans max-w-3xl">
                Tenant-scoped operator queue of dispute cases. Case identity, lifecycle, money, evidence posture, and next action are shown from backend case truth.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">
                {summary.last_updated_at ? `Updated ${formatDistanceToNow(new Date(summary.last_updated_at), { addSuffix: true })}` : 'Update time unavailable'}
              </Badge>
              <Button
                onClick={refresh}
                className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
            {summaryCards.map((card) => (
              <Card key={card.label} className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl">
                <CardContent className="p-5 space-y-2">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{card.label}</p>
                  <p className="text-2xl font-sans font-bold text-white tracking-tight tabular-nums">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search case number, Amazon case, store, order, SKU, ASIN, or rejection reason"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25"
                    />
                  </div>

                  <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filingStatus} onValueChange={(value) => { setFilingStatus(value); setPage(1); }}>
                    <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Filing" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All filing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="retrying">Retrying</SelectItem>
                      <SelectItem value="pending_approval">Pending approval</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={evidenceState} onValueChange={(value) => { setEvidenceState(value); setPage(1); }}>
                    <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Evidence" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All evidence</SelectItem>
                      <SelectItem value="Missing Evidence">Missing Evidence</SelectItem>
                      <SelectItem value="Weak Evidence">Weak Evidence</SelectItem>
                      <SelectItem value="Matched">Matched</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Needs Review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={recoveryStatus} onValueChange={(value) => { setRecoveryStatus(value); setPage(1); }}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Recovery" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All recovery</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={billingStatus} onValueChange={(value) => { setBillingStatus(value); setPage(1); }}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Billing" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All billing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="charged">Charged</SelectItem>
                      <SelectItem value="credited">Credited</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={rejectionCategory} onValueChange={(value) => { setRejectionCategory(value); setPage(1); }}>
                    <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Rejection" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All rejection types</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="missing_invoice">Missing invoice</SelectItem>
                      <SelectItem value="insufficient_evidence">Insufficient evidence</SelectItem>
                      <SelectItem value="duplicate">Duplicate</SelectItem>
                      <SelectItem value="invalid_date">Invalid date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                    <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="updated_at">Updated</SelectItem>
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="requested_amount">Requested Amount</SelectItem>
                      <SelectItem value="approved_amount">Approved Amount</SelectItem>
                      <SelectItem value="actual_payout_amount">Recovered Amount</SelectItem>
                      <SelectItem value="billed_amount">Billed Amount</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/25">
                  Filtered Results: {summary.filtered_results} of {summary.total_cases} total cases
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading && rows.length === 0 ? (
                <div className="py-20 flex items-center justify-center gap-3 text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-sans font-bold">Loading dispute queue...</span>
                </div>
              ) : error ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <AlertCircle className="w-5 h-5 text-white/40" />
                  <div className="space-y-1">
                    <p className="text-sm font-sans font-bold text-white/70">Failed to load dispute cases</p>
                    <p className="text-xs font-sans text-white/40">{error}</p>
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                  <FileText className="w-5 h-5 text-white/20" />
                  <p className="text-sm font-sans font-bold text-white/60">No dispute cases match the current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1440px]">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                      <tr className="text-left">
                        {['Case', 'Lifecycle', 'Money', 'Evidence', 'Next Action', 'Updated', 'Actions'].map((header) => (
                          <th key={header} className="px-6 py-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((row) => {
                        const filingValue = String(row.filing_status || '').toLowerCase();
                        const isProcessing = filingInProgress.has(row.dispute_case_id);
                        const actionButton =
                          filingValue === 'pending_approval'
                            ? { label: 'Approve', mode: 'approve' as const }
                            : filingValue === 'failed'
                              ? { label: 'Retry', mode: 'retry' as const }
                              : ['pending', 'retrying'].includes(filingValue) && row.evidence_state === 'Ready'
                                ? { label: 'File', mode: 'file' as const }
                                : null;

                        return (
                          <tr key={row.dispute_case_id} className="align-top hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-5">
                              <div className="space-y-2 min-w-[240px]">
                                <Link to={`/recoveries/${row.dispute_case_id}`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-white hover:text-emerald-300">
                                  {row.case_number || row.dispute_case_id}
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                                <div className="space-y-1 text-[11px] text-white/50 font-sans">
                                  <div>Case Type: {row.case_type || row.anomaly_type || 'Not available'}</div>
                                  <div>Detection Ref: {row.detection_result_id || 'Not available'}</div>
                                  <div>Amazon Case: {row.amazon_case_id || 'Not available'}</div>
                                  <div>Store: {row.store_name || 'Not available'}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="grid grid-cols-2 gap-2 min-w-[320px]">
                                <Badge variant="outline" className={cn('justify-start border', badgeClass(row.status))}>Status: {formatLabel(row.status)}</Badge>
                                <Badge variant="outline" className={cn('justify-start border', badgeClass(row.filing_status))}>Filing: {formatLabel(row.filing_status)}</Badge>
                                <Badge variant="outline" className={cn('justify-start border', badgeClass(row.recovery_status))}>Recovery: {formatLabel(row.recovery_status)}</Badge>
                                <Badge variant="outline" className={cn('justify-start border', badgeClass(row.billing_status))}>Billing: {formatLabel(row.billing_status)}</Badge>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1 min-w-[220px] text-[12px] font-sans text-white/70">
                                <div className="flex justify-between gap-4"><span className="text-white/35">Requested</span><span>{formatMoney(row.requested_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Approved</span><span>{formatMoney(row.approved_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Recovered</span><span>{formatMoney(row.actual_payout_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Billed</span><span>{formatMoney(row.billed_amount, row.currency)}</span></div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-2 min-w-[220px]">
                                <Badge variant="outline" className={cn('border', badgeClass(row.evidence_state))}>
                                  {row.evidence_state}
                                </Badge>
                                <div className="text-[11px] text-white/50 font-sans space-y-1">
                                  <div>Matched Docs: {row.matched_document_count}</div>
                                  <div>Rejection Category: {row.rejection_category || 'Not available'}</div>
                                  {row.rejection_reason && (
                                    <div className="text-red-300/80 flex items-start gap-2">
                                      <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      <span>{row.rejection_reason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="min-w-[220px] space-y-2">
                                <p className="text-sm font-sans font-bold text-white">{row.next_action}</p>
                                <p className="text-[11px] font-sans text-white/50">
                                  {row.expected_payout_date ? `Expected payout date: ${format(new Date(row.expected_payout_date), 'yyyy/MM/dd')}` : 'No payout estimate available'}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="min-w-[160px] space-y-1 text-[11px] text-white/50 font-sans">
                                <div>Created: {row.created_at ? format(new Date(row.created_at), 'yyyy/MM/dd HH:mm') : 'Not available'}</div>
                                <div>Updated: {row.updated_at ? format(new Date(row.updated_at), 'yyyy/MM/dd HH:mm') : 'Not available'}</div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-2 min-w-[150px]">
                                <Button asChild className="h-9 text-[10px] font-sans font-bold uppercase tracking-tight bg-white text-black hover:bg-emerald-500 rounded-lg">
                                  <Link to={`/recoveries/${row.dispute_case_id}`}>Open Case</Link>
                                </Button>
                                {actionButton ? (
                                  <Button
                                    onClick={() => handleFilingAction(row, actionButton.mode)}
                                    disabled={isProcessing || !row.detection_result_id}
                                    className="h-9 text-[10px] font-sans font-bold uppercase tracking-tight bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 rounded-lg"
                                  >
                                    {isProcessing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                                    {actionButton.label}
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-xs text-white/40 font-sans">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border-white/10 text-white/60 bg-white/5"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="border-white/10 text-white/60 bg-white/5"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
