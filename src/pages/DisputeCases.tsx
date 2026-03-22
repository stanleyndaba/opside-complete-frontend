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
type LegacyCase = NonNullable<Awaited<ReturnType<typeof api.getDisputeCases>>['data']>['cases'][number];

const PREVIEW_ROWS: QueueRow[] = [
  {
    dispute_case_id: 'preview-case-1001',
    detection_result_id: 'preview-detection-1001',
    case_number: 'DMO-CASE-1001',
    claim_number: 'DMO-CLAIM-1001',
    case_type: 'amazon_fba',
    anomaly_type: 'missing_unit',
    status: 'pending',
    filing_status: 'pending',
    recovery_status: 'pending',
    billing_status: 'pending',
    requested_amount: 128.4,
    approved_amount: null,
    actual_payout_amount: null,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Missing Evidence',
    matched_document_count: 0,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-15T09:15:00.000Z',
    updated_at: '2026-03-16T11:00:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1001',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1001',
    sku: 'DEMO-SKU-01',
    asin: 'B0DEMO0001',
    expected_payout_amount: null,
    expected_payout_date: null,
    next_action: 'Waiting for evidence'
  },
  {
    dispute_case_id: 'preview-case-1002',
    detection_result_id: 'preview-detection-1002',
    case_number: 'DMO-CASE-1002',
    claim_number: 'DMO-CLAIM-1002',
    case_type: 'amazon_fba',
    anomaly_type: 'incorrect_fee',
    status: 'pending',
    filing_status: 'pending',
    recovery_status: 'pending',
    billing_status: 'pending',
    requested_amount: 74.15,
    approved_amount: null,
    actual_payout_amount: null,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Ready',
    matched_document_count: 1,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-14T12:30:00.000Z',
    updated_at: '2026-03-16T09:40:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1002',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1002',
    sku: 'DEMO-SKU-02',
    asin: 'B0DEMO0002',
    expected_payout_amount: 74.15,
    expected_payout_date: '2026-03-28T00:00:00.000Z',
    next_action: 'Ready to file'
  },
  {
    dispute_case_id: 'preview-case-1003',
    detection_result_id: 'preview-detection-1003',
    case_number: 'DMO-CASE-1003',
    claim_number: 'DMO-CLAIM-1003',
    case_type: 'amazon_fba',
    anomaly_type: 'overcharge',
    status: 'submitted',
    filing_status: 'filed',
    recovery_status: 'pending',
    billing_status: 'pending',
    requested_amount: 162.75,
    approved_amount: null,
    actual_payout_amount: null,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Matched',
    matched_document_count: 2,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-13T08:20:00.000Z',
    updated_at: '2026-03-17T10:05:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1003',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1003',
    sku: 'DEMO-SKU-03',
    asin: 'B0DEMO0003',
    expected_payout_amount: 162.75,
    expected_payout_date: '2026-03-27T00:00:00.000Z',
    next_action: 'Filed / awaiting Amazon'
  },
  {
    dispute_case_id: 'preview-case-1004',
    detection_result_id: 'preview-detection-1004',
    case_number: 'DMO-CASE-1004',
    claim_number: 'DMO-CLAIM-1004',
    case_type: 'amazon_fba',
    anomaly_type: 'damaged_stock',
    status: 'rejected',
    filing_status: 'failed',
    recovery_status: 'pending',
    billing_status: 'pending',
    requested_amount: 93.2,
    approved_amount: null,
    actual_payout_amount: null,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Needs Review',
    matched_document_count: 1,
    rejection_category: 'insufficient_evidence',
    rejection_reason: 'Invoice date did not match the reimbursement window.',
    created_at: '2026-03-12T13:45:00.000Z',
    updated_at: '2026-03-18T14:20:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1004',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1004',
    sku: 'DEMO-SKU-04',
    asin: 'B0DEMO0004',
    expected_payout_amount: null,
    expected_payout_date: null,
    next_action: 'Review rejection'
  },
  {
    dispute_case_id: 'preview-case-1005',
    detection_result_id: 'preview-detection-1005',
    case_number: 'DMO-CASE-1005',
    claim_number: 'DMO-CLAIM-1005',
    case_type: 'amazon_fba',
    anomaly_type: 'duplicate_charge',
    status: 'approved',
    filing_status: 'filed',
    recovery_status: 'pending',
    billing_status: 'pending',
    requested_amount: 145.9,
    approved_amount: 145.9,
    actual_payout_amount: null,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Matched',
    matched_document_count: 1,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-11T15:10:00.000Z',
    updated_at: '2026-03-19T12:00:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1005',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1005',
    sku: 'DEMO-SKU-05',
    asin: 'B0DEMO0005',
    expected_payout_amount: 145.9,
    expected_payout_date: '2026-03-25T00:00:00.000Z',
    next_action: 'Waiting for payout'
  },
  {
    dispute_case_id: 'preview-case-1006',
    detection_result_id: 'preview-detection-1006',
    case_number: 'DMO-CASE-1006',
    claim_number: 'DMO-CLAIM-1006',
    case_type: 'amazon_fba',
    anomaly_type: 'incorrect_fee',
    status: 'approved',
    filing_status: 'filed',
    recovery_status: 'reconciled',
    billing_status: 'pending',
    requested_amount: 112.75,
    approved_amount: 112.75,
    actual_payout_amount: 112.75,
    billed_amount: null,
    currency: 'USD',
    evidence_state: 'Matched',
    matched_document_count: 1,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-10T10:05:00.000Z',
    updated_at: '2026-03-20T08:45:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1006',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1006',
    sku: 'DEMO-SKU-06',
    asin: 'B0DEMO0006',
    expected_payout_amount: null,
    expected_payout_date: null,
    next_action: 'Billing pending'
  },
  {
    dispute_case_id: 'preview-case-1007',
    detection_result_id: 'preview-detection-1007',
    case_number: 'DMO-CASE-1007',
    claim_number: 'DMO-CLAIM-1007',
    case_type: 'amazon_fba',
    anomaly_type: 'overcharge',
    status: 'approved',
    filing_status: 'filed',
    recovery_status: 'reconciled',
    billing_status: 'credited',
    requested_amount: 189.2,
    approved_amount: 189.2,
    actual_payout_amount: 189.2,
    billed_amount: 37.84,
    currency: 'USD',
    evidence_state: 'Matched',
    matched_document_count: 2,
    rejection_category: null,
    rejection_reason: null,
    created_at: '2026-03-09T16:50:00.000Z',
    updated_at: '2026-03-21T07:20:00.000Z',
    amazon_case_id: 'AMZ-DEMO-1007',
    store_name: 'Preview Workspace',
    order_id: 'ORDER-DEMO-1007',
    sku: 'DEMO-SKU-07',
    asin: 'B0DEMO0007',
    expected_payout_amount: null,
    expected_payout_date: null,
    next_action: 'Billing complete'
  }
];

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

function deriveLegacyNextAction(status: string | null | undefined) {
  const normalizedStatus = String(status || '').toLowerCase();
  if (['paid', 'complete', 'completed'].includes(normalizedStatus)) return 'Recovered';
  if (['approved', 'resolved', 'won'].includes(normalizedStatus)) return 'Waiting for payout';
  if (['submitted', 'under review', 'in review'].includes(normalizedStatus)) return 'Filed / awaiting Amazon';
  if (['rejected', 'denied', 'lost'].includes(normalizedStatus)) return 'Review rejection';
  if (['pending'].includes(normalizedStatus)) return 'Ready to file';
  return 'Manual review';
}

function toQueueRowFromLegacy(item: LegacyCase): QueueRow {
  const normalizedStatus = String(item.status || '').toLowerCase();
  const approvedAmount = ['approved', 'resolved', 'won', 'paid', 'complete', 'completed'].includes(normalizedStatus)
    ? item.amount
    : null;
  const actualPayoutAmount = ['paid', 'complete', 'completed'].includes(normalizedStatus)
    ? item.amount
    : null;

  return {
    dispute_case_id: item.id,
    detection_result_id: item.claim_id || null,
    case_number: item.case_number || item.id,
    claim_number: item.claim_id || null,
    case_type: null,
    anomaly_type: null,
    status: item.status || null,
    filing_status: null,
    recovery_status: actualPayoutAmount != null ? 'reconciled' : null,
    billing_status: null,
    requested_amount: item.amount ?? null,
    approved_amount: approvedAmount,
    actual_payout_amount: actualPayoutAmount,
    billed_amount: null,
    currency: item.currency || 'USD',
    evidence_state: 'Not available',
    matched_document_count: 0,
    rejection_category: null,
    rejection_reason: null,
    created_at: item.created_at || null,
    updated_at: item.created_at || null,
    amazon_case_id: null,
    store_name: null,
    order_id: null,
    sku: null,
    asin: null,
    expected_payout_amount: actualPayoutAmount == null && (item.expected_payout_date || item.expectedPayoutDate) ? item.amount ?? null : null,
    expected_payout_date: item.expected_payout_date || item.expectedPayoutDate || null,
    next_action: deriveLegacyNextAction(item.status),
  };
}

function summarizeRows(rows: QueueRow[]) {
  return {
    total_cases: rows.length,
    filtered_results: rows.length,
    blocked_count: rows.filter((row) => ['Waiting for evidence', 'Needs review', 'Review rejection'].includes(row.next_action)).length,
    ready_to_file_count: rows.filter((row) => row.next_action === 'Ready to file').length,
    filed_count: rows.filter((row) => row.next_action === 'Filed / awaiting Amazon').length,
    rejected_count: rows.filter((row) => ['rejected', 'denied', 'lost'].includes(String(row.status || '').toLowerCase())).length,
    approved_pending_payout_count: rows.filter((row) => ['approved', 'resolved', 'won'].includes(String(row.status || '').toLowerCase()) && row.actual_payout_amount == null).length,
    recovered_count: rows.filter((row) => row.actual_payout_amount != null || String(row.recovery_status || '').toLowerCase() === 'reconciled').length,
    billing_pending_count: rows.filter((row) => row.next_action === 'Billing pending').length,
    last_updated_at: rows.map((row) => row.updated_at || row.created_at).filter(Boolean).sort().reverse()[0] || null,
    page: 1,
    page_size: 25
  };
}

export default function DisputeCases() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady, isThrottled } = useTenant();
  const { isPaidUser } = useSession();
  const { toast } = useToast();

  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'authoritative' | 'legacy' | 'preview'>('authoritative');
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [sourceCounts, setSourceCounts] = useState<{ authoritative: number | null; legacy: number | null }>({
    authoritative: null,
    legacy: null
  });
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
      setSourceNote(null);
      setSourceCounts({ authoritative: null, legacy: null });
      try {
        const queuePromise = api.getDisputeCaseQueue({
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
        const legacyPromise = api.getDisputeCases({ limit: 500 }, activeTenantSlug);

        const [response, legacyResponse] = await Promise.all([queuePromise, legacyPromise]);

        setSourceCounts({
          authoritative: response.ok && response.data ? response.data.total_cases : null,
          legacy: legacyResponse.ok && legacyResponse.data ? legacyResponse.data.total || legacyResponse.data.cases?.length || 0 : null
        });

        if (!response.ok || !response.data) {
          if (legacyResponse.ok && legacyResponse.data?.cases?.length) {
            if (cancelled) return;
            const legacyRows = (legacyResponse.data.cases || []).map(toQueueRowFromLegacy);
            setRows(legacyRows.slice((page - 1) * pageSize, page * pageSize));
            setSummary({
              ...summarizeRows(legacyRows),
              total_cases: legacyResponse.data.total || legacyRows.length,
              filtered_results: legacyResponse.data.total || legacyRows.length,
              page,
              page_size: pageSize
            });
            setDataSource('legacy');
            setSourceNote('Strict queue failed; showing legacy dispute list for launch visibility.');
            return;
          }

          throw new Error(response.error || 'Failed to load dispute cases');
        }

        if (legacyResponse.ok && legacyResponse.data?.cases?.length) {
          if (cancelled) return;
          const legacyRows = (legacyResponse.data.cases || []).map(toQueueRowFromLegacy);
          setRows(legacyRows.slice((page - 1) * pageSize, page * pageSize));
          setSummary({
            ...summarizeRows(legacyRows),
            total_cases: legacyResponse.data.total || legacyRows.length,
            filtered_results: legacyResponse.data.total || legacyRows.length,
            page,
            page_size: pageSize
          });
          setDataSource('legacy');
          setSourceNote(
            (response.data.total_cases || 0) === 0
              ? 'Strict queue returned no cases; showing legacy dispute list for launch visibility.'
              : 'Showing legacy dispute list for launch visibility while the strict queue is still being reconciled.'
          );
          return;
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
        setDataSource('authoritative');
        if ((response.data.total_cases || 0) === 0) {
          const previewRows = PREVIEW_ROWS.slice((page - 1) * pageSize, page * pageSize);
          setRows(previewRows);
          setSummary({
            ...summarizeRows(PREVIEW_ROWS),
            total_cases: PREVIEW_ROWS.length,
            filtered_results: PREVIEW_ROWS.length,
            page,
            page_size: pageSize
          });
          setDataSource('preview');
          setSourceNote('Both live dispute sources returned zero cases, so preview fixtures are being shown for UI iteration only.');
        }
      } catch (err: any) {
        if (!cancelled) {
          try {
            const legacyResponse = await api.getDisputeCases({ limit: 500 }, activeTenantSlug);
            if (legacyResponse.ok && legacyResponse.data?.cases?.length) {
              if (cancelled) return;
              const legacyRows = (legacyResponse.data.cases || []).map(toQueueRowFromLegacy);
              setRows(legacyRows.slice((page - 1) * pageSize, page * pageSize));
              setSummary({
                ...summarizeRows(legacyRows),
                total_cases: legacyResponse.data.total || legacyRows.length,
                filtered_results: legacyResponse.data.total || legacyRows.length,
                page,
                page_size: pageSize
              });
              setDataSource('legacy');
              setSourceNote('Strict queue failed; showing legacy dispute list while the queue route stabilizes.');
              setError(null);
              return;
            }
          } catch {
            // Keep original error below if both sources fail.
          }

          setRows(PREVIEW_ROWS.slice((page - 1) * pageSize, page * pageSize));
          setSummary({
            ...summarizeRows(PREVIEW_ROWS),
            total_cases: PREVIEW_ROWS.length,
            filtered_results: PREVIEW_ROWS.length,
            page,
            page_size: pageSize
          });
          setDataSource('preview');
          setSourceNote('Live dispute data could not be loaded, so preview fixtures are being shown for UI iteration only.');
          setError(null);
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
                Tenant: {activeTenantSlug || 'Unavailable'}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'border text-white/70',
                  dataSource === 'legacy'
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    : dataSource === 'preview'
                      ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                )}
              >
                Source: {dataSource === 'legacy' ? 'Legacy fallback' : dataSource === 'preview' ? 'Preview fixtures' : 'Authoritative queue'}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">
                Strict: {sourceCounts.authoritative ?? 'n/a'}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">
                Legacy: {sourceCounts.legacy ?? 'n/a'}
              </Badge>
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

          {sourceNote ? (
            <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl">
              <CardContent className="px-5 py-4 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] font-sans font-bold uppercase tracking-tight text-amber-300">Launch visibility mode</p>
                  <p className="text-xs font-sans text-white/55">{sourceNote}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
