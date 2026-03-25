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
import { useStatusStream } from '@/hooks/use-status-stream';
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

function formatBlockReason(value: string) {
  const mapped: Record<string, string> = {
    rejected_by_amazon: 'Rejected before',
    rejected_without_reason: 'Rejected before',
    missing_evidence_links: 'Missing evidence',
    wrong_claim_type: 'Wrong claim type',
    invalid_invoice_date: 'Invoice date mismatch',
    weak_pod_evidence: 'Weak POD evidence',
    amount_mismatch: 'Amount mismatch',
    dimension_proof_required: 'Dimension proof required',
    duplicate_active_claim_for_order: 'Duplicate active claim',
    already_reimbursed: 'Already reimbursed',
    claim_below_minimum_threshold: 'Below filing threshold',
    manual_approval_required_high_value: 'Manual approval required',
    dangerous_document_filename: 'Unsafe document filename',
    dangerous_document_content: 'Unsafe document content',
  };

  return mapped[value] || formatLabel(value);
}

function formatCompactDate(value: string | null | undefined) {
  if (!value) return 'Unavailable';
  return format(new Date(value), 'yyyy/MM/dd');
}

type FilingPosture = {
  tone: 'ready' | 'attention' | 'blocked' | 'in_flight' | 'resolved';
  headline: string;
  detail: string;
  strengths: string[];
  risks: string[];
};

function deriveFilingPosture(row: QueueRow): FilingPosture {
  const filingStatus = String(row.filing_status || '').toLowerCase();
  const status = String(row.status || '').toLowerCase();
  const recoveryStatus = String(row.recovery_status || '').toLowerCase();
  const billingStatus = String(row.billing_status || '').toLowerCase();
  const evidenceState = String(row.evidence_state || '').toLowerCase();
  const blockReasons = Array.isArray(row.block_reasons) ? row.block_reasons : [];

  const strengths: string[] = [];
  const risks: string[] = [];

  const identifierCount = [row.order_id, row.amazon_case_id, row.sku, row.asin].filter(Boolean).length;
  if (identifierCount >= 2) {
    strengths.push('Identifiers present');
  } else if (identifierCount === 1) {
    risks.push('Thin identifier trail');
  } else {
    risks.push('Identifier gap');
  }

  if (row.matched_document_count >= 2) {
    strengths.push(`${row.matched_document_count} docs linked`);
  } else if (row.matched_document_count === 1) {
    strengths.push('1 doc linked');
  } else {
    risks.push('No matched docs');
  }

  if (['matched', 'ready', 'usable', 'linked strongly'].includes(evidenceState)) {
    strengths.push(`Evidence ${row.evidence_state}`);
  } else if (row.evidence_state) {
    risks.push(row.evidence_state);
  }

  if (blockReasons.length) {
    risks.push(...blockReasons.map(formatBlockReason));
  }

  if (row.rejection_reason) {
    risks.push('Prior rejection to address');
  }

  if (row.expected_payout_date && row.approved_amount != null && row.actual_payout_amount == null) {
    strengths.push(`Payout target ${formatCompactDate(row.expected_payout_date)}`);
  }

  if (row.actual_payout_amount != null || recoveryStatus === 'reconciled') {
    if (billingStatus === 'credited' || billingStatus === 'completed' || row.billed_amount != null) {
      strengths.push('Billing reconciled');
    }
    return {
      tone: 'resolved',
      headline: 'Recovered',
      detail: row.billed_amount != null ? 'Recovery landed and billing has entered reconciliation.' : 'Recovery has been recorded for this case.',
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (row.approved_amount != null && row.actual_payout_amount == null) {
    return {
      tone: 'in_flight',
      headline: 'Payout pending',
      detail: row.expected_payout_date
        ? `Amazon approval is in place. Track payout timing against ${formatCompactDate(row.expected_payout_date)}.`
        : 'Amazon approval is in place. The remaining risk is payout timing, not filing readiness.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (['filed', 'submitting', 'recovering', 'payment_required'].includes(filingStatus) || ['submitted', 'under review', 'in review'].includes(status)) {
    return {
      tone: 'in_flight',
      headline: 'In Amazon review',
      detail: 'Submission has moved out of seller control. Focus on any rejection history or evidence gaps before retrying.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (['rejected', 'denied', 'lost'].includes(status) || filingStatus === 'failed') {
    return {
      tone: 'blocked',
      headline: 'Rejection risk is live',
      detail: row.rejection_reason
        ? `Amazon has already objected to this case. Fix the recorded reason before retrying.`
        : 'This case was rejected or failed in filing. Review the evidence and filing posture before resubmission.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (filingStatus === 'blocked' || row.eligible_to_file === false) {
    return {
      tone: 'blocked',
      headline: 'Blocked before filing',
      detail: blockReasons.length
        ? 'The gate has already identified issues that should be fixed before submission.'
        : 'This case is not currently eligible to file.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (row.eligible_to_file === true && ['pending', 'retrying'].includes(filingStatus)) {
    return {
      tone: 'ready',
      headline: 'Ready to file',
      detail: 'The current gate is open. Seller-controlled quality now comes down to keeping identifiers and evidence clean.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  return {
    tone: 'attention',
    headline: 'Needs seller review',
    detail: 'The case exists, but the current record still has gaps or ambiguity that can dilute filing strength.',
    strengths: strengths.slice(0, 2),
    risks: risks.slice(0, 3)
  };
}

function postureBadgeClass(tone: FilingPosture['tone']) {
  const map: Record<FilingPosture['tone'], string> = {
    ready: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    attention: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    blocked: 'border-red-500/20 bg-red-500/10 text-red-300',
    in_flight: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
    resolved: 'border-white/15 bg-white/10 text-white/75',
  };

  return map[tone];
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

function updateQueueRow(row: QueueRow, event: { eventType: string; data: Record<string, any>; timestamp: string }) {
  const updatedAt = event.timestamp || new Date().toISOString();

  if (event.eventType === 'filing.submitted') {
    return {
      ...row,
      status: event.data?.status || row.status,
      filing_status: event.data?.filing_status || 'filed',
      amazon_case_id: event.data?.amazon_case_id || row.amazon_case_id,
      updated_at: updatedAt
    };
  }

  if (event.eventType === 'case.status_updated') {
    return {
      ...row,
      status: event.data?.status || row.status,
      amazon_case_id: event.data?.amazon_case_id || row.amazon_case_id,
      approved_amount: event.data?.amount_approved ?? row.approved_amount,
      updated_at: updatedAt
    };
  }

  if (event.eventType === 'evidence.linked') {
    const nextMatchedCount = Math.max(Number(row.matched_document_count || 0), 1);
    return {
      ...row,
      evidence_state: nextMatchedCount > 0 ? 'Ready' : row.evidence_state,
      matched_document_count: nextMatchedCount,
      updated_at: updatedAt
    };
  }

  if (event.eventType === 'payout.detected') {
    return {
      ...row,
      recovery_status: event.data?.status || 'reconciled',
      actual_payout_amount: event.data?.actual_amount ?? event.data?.amount ?? row.actual_payout_amount,
      updated_at: updatedAt
    };
  }

  return row;
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

  useStatusStream((event) => {
    if (!activeTenantSlug) return;

    if (event.eventType === 'case.created') {
      refresh();
      return;
    }

    if (
      event.eventType === 'case.status_updated' ||
      event.eventType === 'filing.submitted' ||
      event.eventType === 'evidence.linked' ||
      event.eventType === 'payout.detected'
    ) {
      const disputeCaseId = String(event.data?.dispute_case_id || event.entityId || '').trim();
      if (!disputeCaseId) {
        refresh();
        return;
      }

      if (!rows.some((row) => row.dispute_case_id === disputeCaseId)) {
        refresh();
        return;
      }

      setRows((currentRows) => {
        const nextRows = currentRows.map((row) => {
          if (row.dispute_case_id !== disputeCaseId) return row;
          return updateQueueRow(row, event);
        });

        setSummary((currentSummary) => ({
          ...summarizeRows(nextRows),
          page: currentSummary.page,
          page_size: currentSummary.page_size
        }));

        return nextRows;
      });
    }
  }, activeTenantSlug);

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
                        {['Case', 'Lifecycle', 'Money', 'Evidence', 'Filing Posture', 'Updated', 'Actions'].map((header) => (
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
                        const posture = deriveFilingPosture(row);
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
                              <div className="min-w-[280px] space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[13px] font-sans font-bold tracking-tight text-white">{row.next_action}</p>
                                  <Badge variant="outline" className={cn('border', postureBadgeClass(posture.tone))}>
                                    {posture.headline}
                                  </Badge>
                                </div>
                                <p className="text-[11px] font-sans leading-5 text-white/55">{posture.detail}</p>
                                {posture.strengths.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {posture.strengths.map((item) => (
                                      <span
                                        key={`${row.dispute_case_id}-strength-${item}`}
                                        className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.08] px-2.5 py-1 text-[10px] font-sans font-semibold tracking-tight text-emerald-200/85"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                                {posture.risks.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {posture.risks.map((item) => (
                                      <span
                                        key={`${row.dispute_case_id}-risk-${item}`}
                                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-sans font-semibold tracking-tight text-white/62"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
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
                title="Filing Posture"
                rows={[
                  { label: 'Posture', value: deriveFilingPosture(detailsRow).headline },
                  { label: 'Detail', value: deriveFilingPosture(detailsRow).detail },
                  { label: 'Eligible To File', value: detailsRow.eligible_to_file == null ? 'Unavailable' : detailsRow.eligible_to_file ? 'Yes' : 'No' },
                  { label: 'Block Reasons', value: detailsRow.block_reasons?.length ? detailsRow.block_reasons.map(formatBlockReason).join(', ') : 'None recorded' },
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
        <DialogContent className="grid h-[94vh] w-[98vw] max-w-none gap-0 overflow-hidden border-0 bg-transparent p-0 text-white shadow-none sm:rounded-none [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{briefPreviewRow?.case_number || 'Dispute Brief'}</DialogTitle>
          </DialogHeader>

          <div className="relative h-full w-full">
            <div className="pointer-events-none absolute left-6 top-5 z-10 max-w-[60vw] space-y-1">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Brief PDF Preview</div>
              <div className="truncate text-2xl font-sans font-light tracking-tight text-white">
                {briefPreviewRow?.case_number || 'Dispute Brief'}
              </div>
            </div>

            <div className="absolute right-6 top-5 z-10 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!briefPreviewUrl}
                onClick={downloadBriefPreview}
                className="h-11 rounded-full border-white/15 bg-black/25 px-3 text-white backdrop-blur-md hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeBriefPreview}
                className="h-11 rounded-full border-white/15 bg-black/25 px-3 text-white backdrop-blur-md hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex h-full items-center justify-center px-3 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
              {briefPreviewLoading ? (
                <div className="flex h-full w-full items-center justify-center gap-3 text-sm font-sans text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading brief preview...
                </div>
              ) : briefPreviewUrl ? (
                <div className="h-full w-full overflow-hidden rounded-[10px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.40)]">
                  <iframe
                    title="Dispute brief PDF preview"
                    src={`${briefPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="h-full w-full bg-white"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center px-8 text-center text-sm font-sans text-white/50">
                  Preview unavailable.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
