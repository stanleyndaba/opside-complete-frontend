import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, ChevronDown, ChevronUp, Download, FileText, Loader2, MoreHorizontal, RefreshCw, Search, X } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [dataSource, setDataSource] = useState<'authoritative' | 'legacy'>('authoritative');
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [sourceCounts, setSourceCounts] = useState<{ authoritative: number | null; legacy: number | null }>({
    authoritative: null,
    legacy: null
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [filingInProgress, setFilingInProgress] = useState<Set<string>>(new Set());
  const [summaryExpanded, setSummaryExpanded] = useState(false);
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRow, setDetailsRow] = useState<QueueRow | null>(null);
  const [briefPreviewOpen, setBriefPreviewOpen] = useState(false);
  const [briefPreviewLoading, setBriefPreviewLoading] = useState(false);
  const [briefPreviewUrl, setBriefPreviewUrl] = useState<string | null>(null);
  const [briefPreviewRow, setBriefPreviewRow] = useState<QueueRow | null>(null);
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

          setRows([]);
          setSummary({
            total_cases: 0,
            filtered_results: 0,
            blocked_count: 0,
            ready_to_file_count: 0,
            filed_count: 0,
            rejected_count: 0,
            approved_pending_payout_count: 0,
            recovered_count: 0,
            billing_pending_count: 0,
            last_updated_at: null,
            page,
            page_size: pageSize
          });
          setDataSource('authoritative');
          setSourceNote(null);
          setError(err?.message || 'Failed to load dispute cases');
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

  useEffect(() => {
    return () => {
      if (briefPreviewUrl) {
        URL.revokeObjectURL(briefPreviewUrl);
      }
    };
  }, [briefPreviewUrl]);

  const openCaseDetails = (row: QueueRow) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeBriefPreview = () => {
    setBriefPreviewOpen(false);
    setBriefPreviewLoading(false);
    setBriefPreviewRow(null);
    setBriefPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  };

  const handleBriefPreview = async (row: QueueRow) => {
    if (!activeTenantSlug) return;
    setBriefPreviewOpen(true);
    setBriefPreviewLoading(false);
    setBriefPreviewRow(row);

    setBriefPreviewLoading(true);

    try {
      const response = await api.fetchDisputeBriefPdf(row.dispute_case_id, activeTenantSlug);
      if (!response.ok || !response.blob) {
        throw new Error(response.error || 'Unable to load dispute brief preview.');
      }

      setBriefPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(response.blob);
      });
    } catch (err: any) {
      closeBriefPreview();
      toast({
        variant: 'destructive',
        title: 'Brief preview failed',
        description: err?.message || 'Unable to load the dispute brief PDF.'
      });
    } finally {
      setBriefPreviewLoading(false);
    }
  };

  const downloadBriefPreview = () => {
    if (!briefPreviewUrl || !briefPreviewRow) return;
    const anchor = document.createElement('a');
    anchor.href = briefPreviewUrl;
    anchor.download = `dispute-brief-${briefPreviewRow.dispute_case_id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

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
        title: mode === 'approve' ? 'Approval queued' : mode === 'retry' ? 'Retry queued' : 'Case queued',
        description: response.data?.message || row.case_number || row.dispute_case_id
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

  const primarySummaryCards = useMemo(() => ([
    { label: 'Cases', value: summary.total_cases },
    { label: 'Ready', value: summary.ready_to_file_count },
    { label: 'Payout Pending', value: summary.approved_pending_payout_count },
  ]), [summary]);

  const secondarySummaryCards = useMemo(() => ([
    { label: 'Filed', value: summary.filed_count },
    { label: 'Rejected', value: summary.rejected_count },
    { label: 'Recovered', value: summary.recovered_count },
    { label: 'Billing', value: summary.billing_pending_count },
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
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Dispute Cases</h1>
              <p className="text-sm text-white/50 font-sans max-w-3xl">
                View your dispute cases, current status, evidence, and next steps in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white">
                {summary.last_updated_at ? `Updated ${formatDistanceToNow(new Date(summary.last_updated_at), { addSuffix: true })}` : 'Update time unavailable'}
              </div>
              <Button
                onClick={refresh}
                className="h-10 px-4 font-sans font-bold text-[10px] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white rounded-lg uppercase tracking-tight"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c] text-white">
            <button
              type="button"
              aria-expanded={summaryExpanded}
              onClick={() => setSummaryExpanded((current) => !current)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Summary</p>
                <p className="mt-2 text-xs font-sans text-white">Tap to view live dispute counts</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-left">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Cases</p>
                  <p className="mt-1 text-lg leading-none font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">
                    {summary.total_cases}
                  </p>
                </div>
                {summaryExpanded ? (
                  <ChevronUp className="h-4 w-4 text-white/55" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-white/55" />
                )}
              </div>
            </button>

            {summaryExpanded && (
              <div className="border-t border-white/8 px-5 py-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[...primarySummaryCards, ...secondarySummaryCards].map((card) => (
                    <div key={card.label} className="flex items-center gap-3">
                      <div className="min-w-[2.5rem] text-left text-sm font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">
                        {card.value}
                      </div>
                      <div className="text-xs font-sans font-medium tracking-tight text-white">
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                              <div className="space-y-2 min-w-[220px]">
                                <Link to={`/recoveries/${row.dispute_case_id}`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-white hover:text-emerald-300">
                                  {row.case_number || row.dispute_case_id}
                                </Link>
                                <div className="space-y-1 text-[11px] text-white/50 font-sans">
                                  <div>Store: {row.store_name || 'Not available'}</div>
                                  <div>Type: {row.case_type || row.anomaly_type || 'Not available'}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="grid grid-cols-1 gap-2 min-w-[220px]">
                                <Badge variant="outline" className={cn('w-fit justify-start border', badgeClass(row.status))}>Status: {formatLabel(row.status)}</Badge>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1 min-w-[220px] text-[12px] font-sans text-white/70">
                                <div className="flex justify-between gap-4"><span className="text-white/35">Requested</span><span>{formatMoney(row.requested_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Approved</span><span>{formatMoney(row.approved_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Recovered</span><span>{formatMoney(row.actual_payout_amount, row.currency)}</span></div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-2 min-w-[180px]">
                                <Badge variant="outline" className={cn('border', badgeClass(row.evidence_state))}>
                                  {row.evidence_state}
                                </Badge>
                                <div className="text-[11px] text-white/50 font-sans space-y-1">
                                  <div>Matched Docs: {row.matched_document_count}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="min-w-[200px] space-y-2">
                                <p className="text-[13px] font-sans font-bold tracking-tight text-white">{row.next_action}</p>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="min-w-[160px] space-y-1 text-[11px] text-white/50 font-sans">
                                <div>Updated: {row.updated_at ? format(new Date(row.updated_at), 'yyyy/MM/dd HH:mm') : 'Not available'}</div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex justify-end min-w-[88px]">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 rounded-lg text-white/35 hover:bg-white/5 hover:text-white"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 rounded-xl border border-white/10 bg-[#0c0c0c] p-1 shadow-2xl backdrop-blur-3xl">
                                    <div className="mb-1 border-b border-white/5 px-3 py-2 text-[9px] font-sans font-bold uppercase tracking-tight text-white/20">Case Actions</div>
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white">
                                      <Link to={`/recoveries/${row.dispute_case_id}`}>Open Case</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                      onClick={() => handleBriefPreview(row)}
                                    >
                                      Brief PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                      onClick={() => openCaseDetails(row)}
                                    >
                                      Case Details
                                    </DropdownMenuItem>
                                    {actionButton ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                        disabled={isProcessing || !row.detection_result_id}
                                        onClick={() => handleFilingAction(row, actionButton.mode)}
                                      >
                                        {isProcessing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                                        {actionButton.label}
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[#0c0c0c] text-white shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-5">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">Case Details</div>
            <DialogTitle className="text-2xl font-sans font-bold tracking-tight text-white">
              {detailsRow?.case_number || 'Dispute Case'}
            </DialogTitle>
            {detailsRow ? (
              <div className="pt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/38">
                Filing: {formatLabel(detailsRow.filing_status)} · Recovery: {formatLabel(detailsRow.recovery_status)}
              </div>
            ) : null}
          </DialogHeader>
          {detailsRow ? (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
              <DetailSection
                title="Case"
                rows={[
                  { label: 'Case Number', value: detailsRow.case_number || 'Not available' },
                  { label: 'Claim Number', value: detailsRow.claim_number || 'Not available' },
                  { label: 'Dispute Case ID', value: detailsRow.dispute_case_id || 'Not available' },
                  { label: 'Detection Reference', value: detailsRow.detection_result_id || 'Not available' },
                  { label: 'Amazon Case', value: detailsRow.amazon_case_id || 'Not available' },
                  { label: 'Store', value: detailsRow.store_name || 'Not available' },
                  { label: 'Case Type', value: detailsRow.case_type || detailsRow.anomaly_type || 'Not available' },
                ]}
              />
              <DetailSection
                title="Lifecycle"
                rows={[
                  { label: 'Status', value: formatLabel(detailsRow.status) },
                  { label: 'Filing Status', value: formatLabel(detailsRow.filing_status) },
                  { label: 'Recovery Status', value: formatLabel(detailsRow.recovery_status) },
                  { label: 'Billing Status', value: formatLabel(detailsRow.billing_status) },
                  { label: 'Next Action', value: detailsRow.next_action || 'Not available' },
                ]}
              />
              <DetailSection
                title="Money"
                rows={[
                  { label: 'Requested Amount', value: formatMoney(detailsRow.requested_amount, detailsRow.currency) },
                  { label: 'Approved Amount', value: formatMoney(detailsRow.approved_amount, detailsRow.currency) },
                  { label: 'Recovered Amount', value: formatMoney(detailsRow.actual_payout_amount, detailsRow.currency) },
                  { label: 'Billed Amount', value: formatMoney(detailsRow.billed_amount, detailsRow.currency) },
                  { label: 'Expected Payout', value: formatMoney(detailsRow.expected_payout_amount, detailsRow.currency) },
                ]}
              />
              <DetailSection
                title="Evidence"
                rows={[
                  { label: 'Evidence State', value: detailsRow.evidence_state || 'Not available' },
                  { label: 'Matched Documents', value: String(detailsRow.matched_document_count ?? 0) },
                  { label: 'Rejection Category', value: detailsRow.rejection_category || 'Not available' },
                  { label: 'Rejection Reason', value: detailsRow.rejection_reason || 'Not available' },
                ]}
              />
              <DetailSection
                title="Currentness"
                rows={[
                  { label: 'Created', value: detailsRow.created_at ? format(new Date(detailsRow.created_at), 'yyyy/MM/dd HH:mm') : 'Not available' },
                  { label: 'Updated', value: detailsRow.updated_at ? format(new Date(detailsRow.updated_at), 'yyyy/MM/dd HH:mm') : 'Not available' },
                  { label: 'Expected Payout Date', value: detailsRow.expected_payout_date ? format(new Date(detailsRow.expected_payout_date), 'yyyy/MM/dd') : 'Not available' },
                  { label: 'Order ID', value: detailsRow.order_id || 'Not available' },
                  { label: 'SKU / ASIN', value: [detailsRow.sku, detailsRow.asin].filter(Boolean).join(' / ') || 'Not available' },
                ]}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={briefPreviewOpen} onOpenChange={(open) => (open ? setBriefPreviewOpen(true) : closeBriefPreview())}>
        <DialogContent className="grid h-[90vh] w-[94vw] max-w-[1320px] gap-0 overflow-hidden border border-white/10 bg-black/35 p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:rounded-[28px] [&>button:last-child]:hidden">
          <DialogHeader className="border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Brief PDF Preview</div>
                <DialogTitle className="truncate text-2xl font-sans font-light tracking-tight text-white">
                  {briefPreviewRow?.case_number || 'Dispute Brief'}
                </DialogTitle>
                <div className="text-[11px] font-sans text-white/50">
                  Scroll in the preview and use the browser PDF controls to zoom.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!briefPreviewUrl}
                  onClick={downloadBriefPreview}
                  className="h-10 rounded-full border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeBriefPreview}
                  className="h-10 rounded-full border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 bg-transparent p-5 md:p-6">
            {briefPreviewLoading ? (
              <div className="flex h-full min-h-0 items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-black/20 text-sm font-sans text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading brief preview...
              </div>
            ) : briefPreviewUrl ? (
              <div className="h-full overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <iframe
                  title="Dispute brief PDF preview"
                  src={`${briefPreviewUrl}#toolbar=1&navpanes=0&view=FitH`}
                  className="h-full w-full bg-white"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-0 items-center justify-center rounded-[24px] border border-white/10 bg-black/20 px-8 text-center text-sm font-sans text-white/50">
                Preview unavailable.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
