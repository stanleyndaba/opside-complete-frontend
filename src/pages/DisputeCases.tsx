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
import { formatAutonomyLabel, summarizeExplanationPayload, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
import {
  formatDisputeReason,
  formatPayoutProofStatus,
  formatProofStatus,
  formatRequirement,
  formatRequirementList,
  getManualReviewReason,
  getMissingRequirements,
  getPayoutProofStatus,
  getProofStatus,
  getQuarantineReason,
  payoutProofTone,
  proofStatusTone
} from '@/lib/disputeProof';
import {
  financialSourceLabel,
  financialStatusDetail,
  financialStatusLabel,
  financialStatusTone,
  labelFinancialEventType,
  type FinancialTruthEvent,
  type FinancialTruthSummary
} from '@/lib/financialTruth';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { useStatusStream } from '@/hooks/use-status-stream';
import { TenantLink as Link } from '@/components/navigation/TenantLink';

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type FinancialMap = Record<string, FinancialTruthSummary>;

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

const YOCO_UNLOCK_URL = 'https://pay.yoco.com/r/7rnpQ3';

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
  return formatDisputeReason(value);
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

function getFinancialKey(row: Pick<QueueRow, 'dispute_case_id' | 'detection_result_id'>): string {
  return row.dispute_case_id || row.detection_result_id || '';
}

function getFinancialSummaryForRow(row: Pick<QueueRow, 'dispute_case_id' | 'detection_result_id'>, map: FinancialMap): FinancialTruthSummary | null {
  const directKey = getFinancialKey(row);
  if (directKey && map[directKey]) return map[directKey];
  if (row.detection_result_id && map[row.detection_result_id]) return map[row.detection_result_id];
  return null;
}

function deriveFilingPosture(row: QueueRow, financialSummary?: FinancialTruthSummary | null): FilingPosture {
  const filingStatus = String(row.filing_status || '').toLowerCase();
  const status = String(row.status || '').toLowerCase();
  const billingStatus = String(row.billing_status || '').toLowerCase();
  const evidenceState = String(row.evidence_state || '').toLowerCase();
  const operationalState = String(row.operational_state || '').toLowerCase();
  const operationalSummary = summarizeOperationalExplanation(row.operational_explanation);
  const blockReasons = Array.isArray(row.block_reasons) ? row.block_reasons : [];
  const proofStatus = getProofStatus(row);
  const missingRequirements = getMissingRequirements(row);
  const manualReviewReason = getManualReviewReason(row);
  const payoutProofStatus = getPayoutProofStatus(row);
  const quarantineReason = getQuarantineReason(row);

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

  if (proofStatus === 'filing_ready') {
    strengths.push('Proof packet ready');
  } else if (proofStatus === 'manual_review') {
    risks.push('Proof needs review');
  } else if (proofStatus === 'ineligible') {
    risks.push('Proof not filing ready');
  }

  if (missingRequirements.length) {
    risks.push(...missingRequirements.slice(0, 2).map(formatRequirement));
  }

  if (manualReviewReason) {
    risks.push(formatDisputeReason(manualReviewReason));
  }

  if (row.rejection_reason) {
    risks.push('Prior rejection to address');
  }

  if (payoutProofStatus === 'verified') {
    strengths.push('Payout verified');
  } else if (payoutProofStatus === 'awaiting_payout') {
    strengths.push('Awaiting payout confirmation');
  } else if (payoutProofStatus === 'quarantined') {
    risks.push('Payout quarantined');
  }

  if (quarantineReason) {
    risks.push(quarantineReason);
  }

  if (row.expected_payout_date && row.approved_amount != null && row.actual_payout_amount == null) {
    strengths.push(`Est. payout ${formatCompactDate(row.expected_payout_date)}`);
  }

  if (payoutProofStatus === 'verified' && !financialSummary) {
    return {
      tone: 'resolved',
      headline: 'Payment verified',
      detail: 'The payout has already been verified and tied back to the case record.',
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (financialSummary?.payout_status === 'paid') {
    if (billingStatus === 'credited' || billingStatus === 'completed' || row.billed_amount != null) {
      strengths.push('Billing reconciled');
    }
    return {
      tone: 'resolved',
      headline: 'Financially confirmed',
      detail: row.billed_amount != null ? 'Payment is confirmed by financial events and billing has entered reconciliation.' : 'Payment is confirmed by financial events.',
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (financialSummary?.payout_status === 'partially_paid') {
    return {
      tone: 'in_flight',
      headline: 'Partial payment confirmed',
      detail: 'Financial events show a partial payout. Keep the case open until the full amount is confirmed.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (row.approved_amount != null && row.actual_payout_amount == null) {
    return {
      tone: 'in_flight',
      headline: 'Awaiting financial confirmation',
      detail: row.expected_payout_date
        ? `Amazon approval is in place. Track payout timing against the estimate ${formatCompactDate(row.expected_payout_date)} until a financial event confirms payment.`
        : 'Amazon approval is in place. Payment is still awaiting financial confirmation.',
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
    if (operationalState === 'retry_scheduled') {
      return {
        tone: 'attention',
        headline: 'Retry scheduled',
        detail: operationalSummary || 'Runtime controls have scheduled this filing for another attempt.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    if (operationalState === 'deferred_explicit') {
      return {
        tone: 'attention',
        headline: 'Deferred by runtime guard',
        detail: operationalSummary || 'The case is supportable, but dispatch is intentionally deferred by a runtime guard.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    if (operationalState === 'blocked_operational' || operationalState === 'failed_durable') {
      return {
        tone: 'blocked',
        headline: operationalState === 'failed_durable' ? 'Runtime failure is durable' : 'Dispatch is operationally blocked',
        detail: operationalSummary || 'A runtime failure is currently preventing dispatch.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 3)
      };
    }
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

function normalizeIdentifier(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function getQueueRowIdentifiers(row: QueueRow) {
  return [
    row.dispute_case_id,
    row.case_number,
    row.claim_number,
    row.amazon_case_id,
    row.detection_result_id
  ]
    .map(normalizeIdentifier)
    .filter(Boolean);
}

function getEventIdentifiers(event: { entityId?: string; data: Record<string, any> }) {
  return [
    event.entityId,
    event.data?.dispute_case_id,
    event.data?.case_number,
    event.data?.claim_number,
    event.data?.amazon_case_id,
    event.data?.detection_id
  ]
    .map(normalizeIdentifier)
    .filter(Boolean);
}

function rowMatchesEvent(row: QueueRow, event: { entityId?: string; data: Record<string, any> }) {
  const rowIdentifiers = getQueueRowIdentifiers(row);
  const eventIdentifiers = getEventIdentifiers(event);

  if (!rowIdentifiers.length || !eventIdentifiers.length) {
    return false;
  }

  return eventIdentifiers.some((identifier) => rowIdentifiers.includes(identifier));
}

function updateQueueRow(row: QueueRow, event: { eventType: string; data: Record<string, any>; timestamp: string }) {
  const updatedAt = event.timestamp || new Date().toISOString();

  if (event.eventType === 'filing.submitted') {
    return {
      ...row,
      status: event.data?.status || row.status,
      filing_status: event.data?.filing_status || 'filed',
      filing_strategy: event.data?.filing_strategy || row.filing_strategy,
      explanation_payload: event.data?.explanation_payload || row.explanation_payload,
      amazon_case_id: event.data?.amazon_case_id || row.amazon_case_id,
      updated_at: updatedAt
    };
  }

  if (event.eventType === 'case.status_updated') {
    return {
      ...row,
      status: event.data?.status || row.status,
      filing_strategy: event.data?.filing_strategy || row.filing_strategy,
      explanation_payload: event.data?.explanation_payload || row.explanation_payload,
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
  const [paymentConfirmationVisible, setPaymentConfirmationVisible] = useState(false);
  const [unlockSubmitting, setUnlockSubmitting] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{
    already_unlocked: boolean;
    billing_status: 'unlocked';
    billing_unlocked_at: string;
    billing_source: string;
    queued_count: number;
    blocked_count: number;
    scanned_count: number;
    queued_case_ids: string[];
    blocked_case_ids: string[];
    message: string;
  } | null>(null);
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
  const [financialSummaries, setFinancialSummaries] = useState<FinancialMap>({});
  const [detailsFinancialSummary, setDetailsFinancialSummary] = useState<FinancialTruthSummary | null>(null);
  const [detailsFinancialEvents, setDetailsFinancialEvents] = useState<FinancialTruthEvent[]>([]);
  const [detailsFinancialLoading, setDetailsFinancialLoading] = useState(false);
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

  useEffect(() => {
    if (!activeTenantSlug || !rows.length) {
      setFinancialSummaries({});
      return;
    }

    let cancelled = false;
    const loadFinancialTruth = async () => {
      const caseIds = Array.from(new Set(rows.map((row) => getFinancialKey(row)).filter(Boolean)));
      if (!caseIds.length) {
        if (!cancelled) setFinancialSummaries({});
        return;
      }

      const response = await api.getRecoveryFinancialEvents({ caseIds }, activeTenantSlug);
      if (cancelled) return;
      if (!response.ok || !response.data?.success) {
        setFinancialSummaries({});
        return;
      }

      const nextMap = (response.data.summaries || []).reduce<FinancialMap>((acc, item) => {
        if (item.input_id) acc[item.input_id] = item;
        if (item.dispute_case_id) acc[item.dispute_case_id] = item;
        if (item.detection_result_id) acc[item.detection_result_id] = item;
        return acc;
      }, {});
      setFinancialSummaries(nextMap);
    };

    void loadFinancialTruth();
    return () => { cancelled = true; };
  }, [activeTenantSlug, rows]);

  const totalPages = Math.max(1, Math.ceil(summary.filtered_results / pageSize));
  const verifiedRecoveryCount = useMemo(
    () => rows.filter((row) => getFinancialSummaryForRow(row, financialSummaries)?.payout_status === 'paid').length,
    [financialSummaries, rows]
  );

  const refresh = () => setRefreshKey((value) => value + 1);

  const handleUnlockCheckout = () => {
    const popup = window.open(YOCO_UNLOCK_URL, '_blank', 'noopener,noreferrer');
    if (!popup) {
      toast({
        variant: 'destructive',
        title: 'Unable to open checkout',
        description: 'Please allow pop-ups and try again.'
      });
      return;
    }

    setPaymentConfirmationVisible(true);
    toast({
      title: 'Checkout opened',
      description: 'Complete your payment in the new tab, then confirm here to start filing.'
    });
  };

  const handleConfirmPaymentAndStartFiling = async () => {
    if (!activeTenantSlug || unlockSubmitting) return;

    setUnlockSubmitting(true);
    try {
      const response = await api.confirmDisputeUnlockAndFile(activeTenantSlug);
      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Unable to confirm payment unlock.');
      }

      setUnlockResult(response.data);
      setPaymentConfirmationVisible(false);
      toast({
        title: response.data.queued_count > 0 ? 'Filing started' : 'Payment confirmed',
        description: response.data.message
      });
      refresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Confirmation failed',
        description: err?.message || 'Unable to confirm payment right now.'
      });
    } finally {
      setUnlockSubmitting(false);
    }
  };

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
      const eventIdentifiers = getEventIdentifiers(event);
      if (!eventIdentifiers.length) {
        refresh();
        return;
      }

      if (!rows.some((row) => rowMatchesEvent(row, event))) {
        refresh();
        return;
      }

      setRows((currentRows) => {
        const nextRows = currentRows.map((row) => {
          if (!rowMatchesEvent(row, event)) return row;
          return updateQueueRow(row, event);
        });

        setSummary((currentSummary) => ({
          ...summarizeRows(nextRows),
          page: currentSummary.page,
          page_size: currentSummary.page_size
        }));

        return nextRows;
      });

      setDetailsRow((currentDetails) => {
        if (!currentDetails || !rowMatchesEvent(currentDetails, event)) return currentDetails;
        return updateQueueRow(currentDetails, event);
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

  const openCaseDetails = async (row: QueueRow) => {
    setDetailsRow(row);
    setDetailsOpen(true);
    setDetailsFinancialSummary(getFinancialSummaryForRow(row, financialSummaries));
    setDetailsFinancialEvents([]);
    setDetailsFinancialLoading(true);
    try {
      const response = await api.getRecoveryFinancialEvents({ caseId: getFinancialKey(row) }, activeTenantSlug);
      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Unable to load financial confirmation.');
      }
      const fetchedSummary = (response.data.summaries || [])[0] || getFinancialSummaryForRow(row, financialSummaries);
      setDetailsFinancialSummary(fetchedSummary || null);
      setDetailsFinancialEvents(response.data.events || []);
    } catch {
      setDetailsFinancialEvents([]);
    } finally {
      setDetailsFinancialLoading(false);
    }
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
    { label: 'Financially Verified', value: verifiedRecoveryCount },
    { label: 'Billing', value: summary.billing_pending_count },
  ]), [summary, verifiedRecoveryCount]);

  const unlockOffer = useMemo(() => {
    const supportableRows = rows.flatMap((row) => {
      const filingValue = String(row.filing_status || '').toLowerCase();
      const amount = typeof row.requested_amount === 'number' && row.requested_amount > 0
        ? row.requested_amount
        : null;

      if (!row.eligible_to_file || !['pending', 'retrying', 'pending_approval'].includes(filingValue) || amount == null) {
        return [];
      }

      const financialSummary = getFinancialSummaryForRow(row, financialSummaries);
      const posture = deriveFilingPosture(row, financialSummary);
      if (posture.tone === 'blocked' || posture.tone === 'resolved' || posture.tone === 'in_flight') {
        return [];
      }

      return [{
        row,
        amount,
        currency: row.currency || 'USD',
        posture
      }];
    });

    const previewRows = rows.flatMap((row) => {
      const amount = typeof row.requested_amount === 'number' && row.requested_amount > 0
        ? row.requested_amount
        : null;

      if (amount == null) {
        return [];
      }

      const financialSummary = getFinancialSummaryForRow(row, financialSummaries);
      return [{
        row,
        amount,
        currency: row.currency || 'USD',
        posture: deriveFilingPosture(row, financialSummary)
      }];
    });

    const offerRows = supportableRows.length > 0 ? supportableRows : previewRows;

    if (!offerRows.length) {
      return null;
    }

    const currencies = Array.from(new Set(offerRows.map((item) => item.currency).filter(Boolean)));
    if (currencies.length !== 1) {
      return null;
    }

    return {
      mode: supportableRows.length > 0 ? 'queueable' as const : 'preview' as const,
      currency: currencies[0],
      totalSupportableValue: offerRows.reduce((sum, item) => sum + item.amount, 0),
      supportableClaimCount: offerRows.length,
      readyToFileCount: supportableRows.filter((item) => item.posture.tone === 'ready').length,
      linkedDocumentCount: offerRows.reduce((sum, item) => sum + Math.max(Number(item.row.matched_document_count || 0), 0), 0)
    };
  }, [financialSummaries, rows]);

  const hasUnlockOfferValue = Boolean(unlockOffer)
    && (unlockOffer?.totalSupportableValue || 0) > 0
    && (unlockOffer?.supportableClaimCount || 0) > 0;
  const isUnlockComplete = Boolean(unlockResult);
  const showUnlockOffer = hasUnlockOfferValue && !isUnlockComplete;
  const showUnlockedState = hasUnlockOfferValue && isUnlockComplete;

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

          {hasUnlockOfferValue && unlockOffer ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-[0_0_24px_rgba(0,0,0,0.22)]">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[radial-gradient(circle_at_left,rgba(52,211,153,0.14),transparent_68%)]" />
              <div className="relative flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-5 lg:px-6">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-emerald-100/80">
                    Real claim value found
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/38">
                      Pay once to start filing
                    </p>
                    <h2 className="max-w-3xl text-[28px] leading-[1.05] font-sans font-bold tracking-tight text-white md:text-[32px]">
                      Start filing {formatMoney(unlockOffer.totalSupportableValue, unlockOffer.currency)} in claims for $99
                    </h2>
                    <p className="max-w-2xl text-[13px] font-sans leading-5 text-white/62">
                      You have {unlockOffer.supportableClaimCount} real claims with money attached. Pay once to start filing every supportable case for your account.
                    </p>
                    <p className="text-[11px] font-sans leading-5 text-white/44">
                      We found real claim value for your account.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/74">
                      {unlockOffer.supportableClaimCount} supportable claims
                    </span>
                    {unlockOffer.readyToFileCount > 0 ? (
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-emerald-100/80">
                        {unlockOffer.readyToFileCount} ready to file
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  {showUnlockOffer ? (
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={handleUnlockCheckout}
                        className="h-11 w-full rounded-xl bg-emerald-400 px-4 text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-black hover:bg-emerald-300"
                      >
                        Start Filing All Claims for $99
                      </Button>
                      <p className="text-[12px] font-sans leading-5 text-white/68">
                        Charged as R1,699 at checkout. You keep 100% of recovered funds.
                      </p>
                      <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/34">
                        Only shown because we found real claim value for your account.
                      </p>

                      {paymentConfirmationVisible ? (
                        <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] p-3.5">
                          <p className="text-[12px] font-sans leading-5 text-emerald-50/88">
                            Complete your payment in the opened tab, then confirm below to start filing.
                          </p>
                          <Button
                            type="button"
                            onClick={handleConfirmPaymentAndStartFiling}
                            disabled={unlockSubmitting}
                            className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-white text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-black hover:bg-white/90"
                          >
                            {unlockSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            I&apos;ve Completed Payment
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {showUnlockedState ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-emerald-100/80">
                        Payment confirmed
                      </div>
                      <p className="text-lg font-sans font-bold tracking-tight text-white">
                        {unlockResult?.queued_count ? 'Filing in progress' : 'Filing access unlocked'}
                      </p>
                      <p className="text-[13px] font-sans leading-5 text-white/68">
                        {unlockResult?.message || 'This account is unlocked. Eligible claims can move into filing immediately.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unlockResult?.queued_count ? (
                          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-emerald-100/80">
                            {unlockResult.queued_count} queued now
                          </span>
                        ) : null}
                        {unlockResult?.blocked_count ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/74">
                            {unlockResult.blocked_count} still held back
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
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
                      <SelectItem value="actual_payout_amount">Legacy Payout Field</SelectItem>
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
                        const financialSummary = getFinancialSummaryForRow(row, financialSummaries);
                        const posture = deriveFilingPosture(row, financialSummary);
                        const decisionExplanation = summarizeExplanationPayload(row.explanation_payload);
                        const operationalExplanation = summarizeOperationalExplanation(row.operational_explanation);
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
                                <div className="flex justify-between gap-4"><span className="text-white/35">Paid (verified)</span><span>{formatMoney(financialSummary?.verified_paid_amount, row.currency)}</span></div>
                                <div className="pt-1">
                                  <Badge variant="outline" className={cn('border', financialStatusTone(financialSummary?.payout_status))}>
                                    Financial Status: {financialStatusLabel(financialSummary?.payout_status)}
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-white/40">{financialStatusDetail(financialSummary)}</div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-2 min-w-[180px]">
                                <Badge variant="outline" className={cn('border', badgeClass(row.evidence_state))}>
                                  {row.evidence_state}
                                </Badge>
                                {getProofStatus(row) ? (
                                  <Badge variant="outline" className={cn('border', proofStatusTone(getProofStatus(row)))}>
                                    Proof: {formatProofStatus(getProofStatus(row))}
                                  </Badge>
                                ) : null}
                                {getPayoutProofStatus(row) && getPayoutProofStatus(row) !== 'not_applicable' ? (
                                  <Badge variant="outline" className={cn('border', payoutProofTone(getPayoutProofStatus(row)))}>
                                    Payout: {formatPayoutProofStatus(getPayoutProofStatus(row))}
                                  </Badge>
                                ) : null}
                                <div className="text-[11px] text-white/50 font-sans space-y-1">
                                  <div>Matched Docs: {row.matched_document_count}</div>
                                  {getMissingRequirements(row).length ? (
                                    <div>Missing: {formatRequirementList(getMissingRequirements(row), 2)}</div>
                                  ) : null}
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
                                  {row.filing_strategy ? (
                                    <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                                      Filing: {formatAutonomyLabel(row.filing_strategy)}
                                    </Badge>
                                  ) : null}
                                  {row.operational_state ? (
                                    <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-amber-100/80">
                                      Runtime: {formatAutonomyLabel(row.operational_state)}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-[11px] font-sans leading-5 text-white/55">{posture.detail}</p>
                                {decisionExplanation ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/45">
                                    Decision: {decisionExplanation}
                                  </p>
                                ) : null}
                                {operationalExplanation ? (
                                  <p className="text-[11px] font-sans leading-5 text-amber-100/55">
                                    Runtime: {operationalExplanation}
                                  </p>
                                ) : null}
                                {getManualReviewReason(row) ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/38">
                                    Review reason: {formatDisputeReason(getManualReviewReason(row))}
                                  </p>
                                ) : null}
                                {getQuarantineReason(row) ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/38">
                                    Quarantine: {getQuarantineReason(row)}
                                  </p>
                                ) : null}
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
                Filing: {detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : formatLabel(detailsRow.filing_status)} · Recovery: {formatLabel(detailsRow.recovery_status)}
              </div>
            ) : null}
          </DialogHeader>
          {detailsRow ? (() => {
            const financialSummary = detailsFinancialSummary || getFinancialSummaryForRow(detailsRow, financialSummaries);
            return (
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
                  { label: 'Filing Strategy', value: detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : 'Not available' },
                  { label: 'Runtime State', value: detailsRow.operational_state ? formatAutonomyLabel(detailsRow.operational_state) : 'Not available' },
                  { label: 'Recovery Status', value: formatLabel(detailsRow.recovery_status) },
                  { label: 'Billing Status', value: formatLabel(detailsRow.billing_status) },
                  { label: 'Proof Status', value: formatProofStatus(getProofStatus(detailsRow)) },
                  { label: 'Payout Proof', value: formatPayoutProofStatus(getPayoutProofStatus(detailsRow)) },
                  { label: 'Financial Status', value: financialStatusLabel(financialSummary?.payout_status) },
                  { label: 'Next Action', value: detailsRow.next_action || 'Not available' },
                ]}
              />
              <DetailSection
                title="Filing Posture"
                rows={[
                  { label: 'Posture', value: deriveFilingPosture(detailsRow).headline },
                  { label: 'Detail', value: deriveFilingPosture(detailsRow).detail },
                  { label: 'Decision Explanation', value: summarizeExplanationPayload(detailsRow.explanation_payload) || 'None recorded' },
                  { label: 'Runtime Explanation', value: summarizeOperationalExplanation(detailsRow.operational_explanation) || 'None recorded' },
                  { label: 'Eligible To File', value: detailsRow.eligible_to_file == null ? 'Unavailable' : detailsRow.eligible_to_file ? 'Yes' : 'No' },
                  { label: 'Block Reasons', value: detailsRow.block_reasons?.length ? detailsRow.block_reasons.map(formatBlockReason).join(', ') : 'None recorded' },
                  { label: 'Missing Requirements', value: formatRequirementList(getMissingRequirements(detailsRow)) },
                  { label: 'Manual Review Reason', value: getManualReviewReason(detailsRow) ? formatDisputeReason(getManualReviewReason(detailsRow)) : 'None recorded' },
                  { label: 'Quarantine Reason', value: getQuarantineReason(detailsRow) || 'None recorded' },
                ]}
              />
              <DetailSection
                title="Money"
                rows={[
                  { label: 'Requested Amount', value: formatMoney(detailsRow.requested_amount, detailsRow.currency) },
                  { label: 'Approved Amount', value: formatMoney(detailsRow.approved_amount, detailsRow.currency) },
                  { label: 'Paid (Verified)', value: formatMoney(financialSummary?.verified_paid_amount, detailsRow.currency) },
                  { label: 'Case Recovery Field (Legacy)', value: formatMoney(detailsRow.actual_payout_amount, detailsRow.currency) },
                  { label: 'Billed Amount', value: formatMoney(detailsRow.billed_amount, detailsRow.currency) },
                  { label: 'Expected Payout (Estimate)', value: formatMoney(detailsRow.expected_payout_amount, detailsRow.currency) },
                  { label: 'Variance', value: formatMoney(financialSummary?.variance_amount, detailsRow.currency) },
                ]}
              />
              <DetailSection
                title="Financial Confirmation"
                rows={[
                  { label: 'Summary', value: financialStatusDetail(financialSummary) },
                  { label: 'Paid Via Settlement', value: financialSummary?.proof_of_payment?.settlement_id || 'Not available' },
                  { label: 'Payout Batch', value: financialSummary?.proof_of_payment?.payout_batch_id || 'Not available' },
                  { label: 'Reference ID', value: financialSummary?.proof_of_payment?.reference_id || 'Not available' },
                  { label: 'Confirmed At', value: financialSummary?.proof_of_payment?.event_date ? format(new Date(financialSummary.proof_of_payment.event_date), 'yyyy/MM/dd HH:mm') : 'Not available' },
                  { label: 'Source', value: financialSummary?.source_types?.length ? financialSummary.source_types.map(financialSourceLabel).join(', ') : 'No financial events yet' },
                ]}
              />
              <DetailSection
                title="Evidence"
                rows={[
                  { label: 'Evidence State', value: detailsRow.evidence_state || 'Not available' },
                  { label: 'Matched Documents', value: String(detailsRow.matched_document_count ?? 0) },
                  { label: 'Proof Status', value: formatProofStatus(getProofStatus(detailsRow)) },
                  { label: 'Rejection Category', value: detailsRow.rejection_category || 'Not available' },
                  { label: 'Rejection Reason', value: detailsRow.rejection_reason || 'Not available' },
                ]}
              />
              <DetailSection
                title="Currentness"
                rows={[
                  { label: 'Created', value: detailsRow.created_at ? format(new Date(detailsRow.created_at), 'yyyy/MM/dd HH:mm') : 'Not available' },
                  { label: 'Updated', value: detailsRow.updated_at ? format(new Date(detailsRow.updated_at), 'yyyy/MM/dd HH:mm') : 'Not available' },
                  { label: 'Expected Payout Date (Estimate)', value: detailsRow.expected_payout_date ? format(new Date(detailsRow.expected_payout_date), 'yyyy/MM/dd') : 'Not available' },
                  { label: 'Order ID', value: detailsRow.order_id || 'Not available' },
                  { label: 'SKU / ASIN', value: [detailsRow.sku, detailsRow.asin].filter(Boolean).join(' / ') || 'Not available' },
                ]}
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">Financial Events Timeline</div>
                  {detailsFinancialLoading ? <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Loading proof…</div> : null}
                </div>
                <div className="mt-4 space-y-3">
                  {!detailsFinancialLoading && detailsFinancialEvents.length === 0 ? (
                    <div className="text-[11px] font-sans font-semibold tracking-tight text-white/62">No payout recorded yet.</div>
                  ) : detailsFinancialEvents.map((event) => (
                    <div key={event.event_id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="text-[11px] font-sans font-semibold tracking-tight text-white">{labelFinancialEventType(event.event_type, event.event_subtype)}</div>
                          <div className="mt-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/32">
                            {financialSourceLabel(event.source)} · {event.event_date ? format(new Date(event.event_date), 'yyyy/MM/dd HH:mm') : 'No event date'}
                          </div>
                        </div>
                        <div className="text-[12px] font-sans font-semibold tracking-tight text-white">{formatMoney(event.amount, event.currency)}</div>
                      </div>
                      <div className="mt-3 grid gap-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/42 xl:grid-cols-2">
                        <div>Reference: {event.reference_id || 'Not available'}</div>
                        <div>Settlement: {event.settlement_id || 'Not available'}</div>
                        <div>Batch: {event.payout_batch_id || 'Not available'}</div>
                        <div>Order / SKU: {[event.amazon_order_id, event.sku].filter(Boolean).join(' / ') || 'Not available'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })() : null}
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
