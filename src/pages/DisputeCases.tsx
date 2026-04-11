import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  formatEligibilityStatus,
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
type QueueActionMode = 'file' | 'retry' | 'approve';
type QueueSummaryState = {
  total_cases: number | null;
  filtered_results: number | null;
  blocked_count: number | null;
  ready_to_file_count: number | null;
  filed_count: number | null;
  rejected_count: number | null;
  approved_pending_payout_count: number | null;
  recovered_count: number | null;
  verified_paid_count: number | null;
  billing_pending_count: number | null;
  supportable_claim_count: number | null;
  supportable_claim_value: number | null;
  supportable_ready_to_file_count: number | null;
  supportable_currency: string | null;
  last_updated_at: string | null;
  page: number;
  page_size: number;
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  filed: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  submitted: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-300 border-red-500/20',
  denied: 'bg-red-500/10 text-red-300 border-red-500/20',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  reconciled: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  pending_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  pending_safety_verification: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-300 border-red-500/20',
  retrying: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  billed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  charged: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  credited: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  default: 'bg-white/5 text-white/50 border-white/10'
};

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not Available';
  return value.replace(/_/g, ' ');
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return 'Not Available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatSummaryValue(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Not Available';
  }

  return String(value);
}

function badgeClass(value: string | null | undefined) {
  const key = String(value || '').toLowerCase();
  return STATUS_BADGE_STYLES[key] || STATUS_BADGE_STYLES.default;
}

function formatBlockReason(value: string) {
  return formatDisputeReason(value);
}

function formatMissingRequirementCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'No missing requirements';
  return value === 1 ? '1 missing requirement' : `${value} missing requirements`;
}

function formatCompactDate(value: string | null | undefined) {
  if (!value) return 'Not Available';
  return format(new Date(value), 'yyyy/MM/dd');
}

function getQueueEntityKind(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'> | null | undefined) {
  if (!row) return 'unknown' as const;
  if (row.entity_type === 'dispute_case' || row.row_type === 'dispute_case' || row.has_real_dispute_case === true) {
    return 'dispute_case' as const;
  }
  if (row.entity_type === 'detection' || row.row_type === 'orphan_detection' || row.has_real_dispute_case === false) {
    return 'detection' as const;
  }
  return 'unknown' as const;
}

function getQueueEntityLabel(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'> | null | undefined) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'Dispute Case';
  if (kind === 'detection') return 'Detection';
  return 'Not Available';
}

function getQueueEntityNoun(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'> | null | undefined) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'case';
  if (kind === 'detection') return 'detection';
  return 'record';
}

function formatQueueRowType(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'> | null | undefined) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'Dispute-case queue row';
  if (kind === 'detection') return 'Detection-only queue row';
  return 'Not Available';
}

function formatCaseOrigin(value: string | null | undefined) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Not Available';
  if (normalized === 'amazon_thread_backfill') return 'Backfilled from Amazon thread';
  if (normalized === 'detection_pipeline') return 'Detection pipeline';
  return formatLabel(value);
}

function isThreadBackfilled(row: Pick<QueueRow, 'case_origin'> | null | undefined) {
  return String(row?.case_origin || '').trim().toLowerCase() === 'amazon_thread_backfill';
}

function isSyntheticOpportunityReference(
  row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case' | 'claim_number' | 'detection_result_id'> | null | undefined
) {
  if (!row || getQueueEntityKind(row) !== 'detection') return false;
  return String(row.claim_number || row.detection_result_id || '').trim().toUpperCase().startsWith('OPP-');
}

function getQueueReferenceLabel(
  row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case' | 'claim_number' | 'detection_result_id'> | null | undefined
) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'Case reference';
  if (kind === 'detection') return isSyntheticOpportunityReference(row) ? 'Opportunity reference (synthetic)' : 'Opportunity reference';
  return 'Queue reference';
}

function getQueueRecordIdentifier(row: QueueRow) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') {
    return row.case_number || row.linked_dispute_case_id || row.dispute_case_id || 'Not Available';
  }
  if (kind === 'detection') {
    return row.claim_number || row.detection_result_id || row.dispute_case_id || 'Not Available';
  }
  return row.dispute_case_id || row.detection_result_id || 'Not Available';
}

type QueueProgressSnapshot = {
  label: 'Detected' | 'Evidence' | 'Filed' | 'Approved' | 'Recovered' | 'Legacy billed';
  toneClass: string;
};

function queueProgressTone(label: QueueProgressSnapshot['label']) {
  switch (label) {
    case 'Legacy billed':
      return 'text-fuchsia-200';
    case 'Recovered':
      return 'text-emerald-200';
    case 'Approved':
      return 'text-blue-300';
    case 'Filed':
      return 'text-blue-100';
    case 'Evidence':
      return 'text-amber-200';
    default:
      return 'text-white/68';
  }
}

function getQueueProgressSnapshot(row: QueueRow, financialSummary?: FinancialTruthSummary | null): QueueProgressSnapshot {
  const billingStatus = String(row.billing_status || '').trim().toLowerCase();
  const recoveryStatus = String(row.recovery_status || '').trim().toLowerCase();
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();
  const status = String(row.status || '').trim().toLowerCase();
  const evidenceState = String(row.evidence_state || '').trim().toLowerCase();
  const proofStatus = String(getProofStatus(row) || '').trim().toLowerCase();
  const hasEvidence = Number(row.matched_document_count || 0) > 0
    || ['filing_ready', 'manual_review', 'supportable_but_not_case_eligible'].includes(proofStatus)
    || ['matched', 'ready', 'usable', 'linked strongly'].includes(evidenceState);
  const hasFiled = Boolean(row.amazon_case_id || row.linked_dispute_case_id)
    || ['submitted', 'pending', 'retrying', 'queued', 'approved', 'filed'].includes(filingStatus);
  const hasApproved = ['approved', 'won'].includes(status) || row.approved_amount != null;
  const hasRecovered = (financialSummary?.verified_paid_amount ?? null) != null
    || row.actual_payout_amount != null
    || ['reconciled', 'discrepancy'].includes(recoveryStatus);
  const hasLegacyBilling = ['pending', 'completed', 'sent', 'charged', 'paid', 'credited'].includes(billingStatus);

  if (hasLegacyBilling) return { label: 'Legacy billed', toneClass: queueProgressTone('Legacy billed') };
  if (hasRecovered) return { label: 'Recovered', toneClass: queueProgressTone('Recovered') };
  if (hasApproved) return { label: 'Approved', toneClass: queueProgressTone('Approved') };
  if (hasFiled) return { label: 'Filed', toneClass: queueProgressTone('Filed') };
  if (hasEvidence) return { label: 'Evidence', toneClass: queueProgressTone('Evidence') };
  return { label: 'Detected', toneClass: queueProgressTone('Detected') };
}

function getOpenRecordLabel(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'>) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'Open Case';
  if (kind === 'detection') return 'Open Detection';
  return 'Not Available';
}

function getRecordDetailsLabel(row: Pick<QueueRow, 'entity_type' | 'row_type' | 'has_real_dispute_case'>) {
  const kind = getQueueEntityKind(row);
  if (kind === 'dispute_case') return 'Case Details';
  if (kind === 'detection') return 'Detection Details';
  return 'Not Available';
}

function getBackendPrimaryAction(row: QueueRow): { label: string; mode: QueueActionMode } | null {
  if (row.can_approve === true) return { label: 'Approve', mode: 'approve' };
  if (row.can_retry === true) return { label: 'Retry', mode: 'retry' };
  if (row.can_file === true) return { label: 'File', mode: 'file' };
  return null;
}

function getActionAvailabilityLabel(isAvailable: boolean, label: string) {
  return isAvailable ? label : `${label} · Not Available`;
}

type QueueUnavailableActionKind = 'primary' | 'brief' | 'details' | 'open_record';

type QueueGateState = {
  label: string;
  tone: 'ready' | 'attention' | 'blocked';
};

function getQueueGateState(
  row: Pick<QueueRow, 'eligibility_status' | 'filing_status'>
): QueueGateState | null {
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();
  if (filingStatus === 'pending_safety_verification') {
    return { label: 'Awaiting identifiers', tone: 'attention' };
  }

  const eligibilityStatus = String(row.eligibility_status || '').trim().toLowerCase();
  switch (eligibilityStatus) {
    case 'ready':
      return { label: formatEligibilityStatus(row.eligibility_status), tone: 'ready' };
    case 'duplicate_blocked':
      return { label: formatEligibilityStatus(row.eligibility_status), tone: 'blocked' };
    case 'safety_hold':
      return { label: formatEligibilityStatus(row.eligibility_status), tone: 'blocked' };
    case 'insufficient_data':
      return { label: formatEligibilityStatus(row.eligibility_status), tone: 'attention' };
    case 'thread_only':
      return { label: formatEligibilityStatus(row.eligibility_status), tone: 'attention' };
    default:
      return null;
  }
}

function getUnavailableActionExplanation(
  row: QueueRow,
  kind: QueueUnavailableActionKind
): { short: string; detail: string } {
  const gateState = getQueueGateState(row);
  const hasRealDisputeCase = row.has_real_dispute_case === true;
  const hasLinkedDisputeCase = hasRealDisputeCase && Boolean(row.linked_dispute_case_id);
  const entityKind = getQueueEntityKind(row);

  if ((kind === 'brief' || kind === 'primary') && !hasLinkedDisputeCase) {
    return kind === 'brief'
      ? {
          short: 'No linked case',
          detail: 'A backend-confirmed dispute brief is not available because this row has no real linked dispute case.'
        }
      : {
          short: 'No linked case',
          detail: 'Filing is not available because this row has no real linked dispute case.'
        };
  }

  const eligibilityStatus = String(row.eligibility_status || '').trim().toLowerCase();
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();

  if (filingStatus === 'pending_safety_verification') {
    return {
      short: 'Awaiting identifiers',
      detail: 'This row is awaiting verified identifiers before filing can continue.'
    };
  }

  switch (eligibilityStatus) {
    case 'duplicate_blocked':
      return {
        short: 'Duplicate blocked',
        detail: 'This row is duplicate-blocked, so a new filing is not available.'
      };
    case 'thread_only':
      return {
        short: 'Thread-only',
        detail: 'This row is linked to an existing Amazon support thread, so Margin will not file again until a safe path is verified.'
      };
    case 'insufficient_data':
      return {
        short: 'Awaiting identifiers',
        detail: 'This row is missing verified identifiers, so filing remains unavailable.'
      };
    case 'safety_hold':
      return {
        short: 'Safety hold',
        detail: 'This row is under a safety hold, so filing remains unavailable.'
      };
    default:
      break;
  }

  if ((kind === 'details' || kind === 'open_record') && row.can_open_case_detail !== true) {
    return entityKind === 'detection'
      ? {
          short: 'Detection detail unavailable',
          detail: 'Record detail is not backend-confirmed for this detection row.'
        }
      : {
          short: 'Case detail unavailable',
          detail: 'Record detail is not backend-confirmed for this dispute row.'
        };
  }

  if (kind === 'brief' && row.can_open_brief !== true) {
    return {
      short: gateState?.label || 'Brief unavailable',
      detail: gateState
        ? `A backend-confirmed dispute brief is not available because this row is ${gateState.label.toLowerCase()}.`
        : 'A backend-confirmed dispute brief is not available for this row.'
    };
  }

  if (gateState) {
    return {
      short: gateState.label,
      detail: `This row is currently ${gateState.label.toLowerCase()}, so the requested action is not available.`
    };
  }

  return {
    short: 'Not available',
    detail: 'This action is not backend-confirmed for this row.'
  };
}

function getActionAvailabilityText(
  row: QueueRow,
  kind: QueueUnavailableActionKind,
  isAvailable: boolean,
  label: string
) {
  if (isAvailable) return label;
  const explanation = getUnavailableActionExplanation(row, kind);
  return `${label} · ${explanation.short}`;
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

function createUnavailableSummary(page: number, pageSize: number): QueueSummaryState {
  return {
    total_cases: null,
    filtered_results: null,
    blocked_count: null,
    ready_to_file_count: null,
    filed_count: null,
    rejected_count: null,
    approved_pending_payout_count: null,
    recovered_count: null,
    verified_paid_count: null,
    billing_pending_count: null,
    supportable_claim_count: null,
    supportable_claim_value: null,
    supportable_ready_to_file_count: null,
    supportable_currency: null,
    last_updated_at: null,
    page,
    page_size: pageSize
  };
}

function deriveFilingPosture(row: QueueRow, financialSummary?: FinancialTruthSummary | null): FilingPosture {
  const entityKind = getQueueEntityKind(row);
  const entityNoun = getQueueEntityNoun(row);
  const hasRealDisputeCase = entityKind === 'dispute_case';
  const hasLinkedDisputeCase = hasRealDisputeCase && Boolean(row.linked_dispute_case_id);
  const backendFilingOpen = row.can_file === true;
  const eligibilityStatus = String(row.eligibility_status || '').toUpperCase();
  const filingStatus = String(row.filing_status || '').toLowerCase();
  const status = String(row.status || '').toLowerCase();
  const billingStatus = String(row.billing_status || '').toLowerCase();
  const evidenceState = String(row.evidence_state || '').toLowerCase();
  const operationalState = String(row.operational_state || '').toLowerCase();
  const operationalSummary = summarizeOperationalExplanation(row.operational_explanation);
  const blockReasons = Array.isArray(row.block_reasons) ? row.block_reasons : [];
  const lastError = String(row.last_error || '').trim();
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

  if (lastError) {
    risks.unshift(lastError);
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
      detail: `The payout has already been verified and tied back to this ${entityNoun} record.`,
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (financialSummary?.payout_status === 'paid') {
    if (billingStatus === 'credited' || billingStatus === 'completed' || row.billed_amount != null) {
      strengths.push('Legacy fee history present');
    }
    return {
      tone: 'resolved',
      headline: 'Financially confirmed',
      detail: row.billed_amount != null ? 'Payment is confirmed by financial events and a historical legacy recovery-fee record exists.' : 'Payment is confirmed by financial events.',
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (financialSummary?.payout_status === 'partially_paid') {
    return {
      tone: 'in_flight',
      headline: 'Partial payment confirmed',
      detail: `Financial events show a partial payout. Keep this ${entityNoun} record open until the full amount is confirmed.`,
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (row.approved_amount != null && row.actual_payout_amount == null) {
    return {
      tone: 'in_flight',
      headline: 'Awaiting financial confirmation',
      detail: hasRealDisputeCase
        ? row.expected_payout_date
          ? `Amazon approval is in place. Track payout timing against the estimate ${formatCompactDate(row.expected_payout_date)} until a financial event confirms payment.`
          : 'Amazon approval is in place. Payment is still awaiting financial confirmation.'
        : row.expected_payout_date
          ? `A backend approval amount is recorded. Track payout timing against the estimate ${formatCompactDate(row.expected_payout_date)} until a financial event confirms payment.`
          : 'A backend approval amount is recorded. Payment is still awaiting financial confirmation.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (eligibilityStatus === 'THREAD_ONLY') {
    return {
      tone: 'attention',
      headline: 'Amazon thread detected',
      detail: 'An existing Amazon support thread is linked, but Margin will not file again until verified identifiers support a safe path.',
      strengths: strengths.slice(0, 2),
      risks: ['Existing case already linked']
    };
  }

  if (eligibilityStatus === 'DUPLICATE_BLOCKED') {
    return {
      tone: 'blocked',
      headline: 'Duplicate detected',
      detail: 'Margin found an existing case, filing, or claim signature that makes a new Amazon submission unsafe.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (eligibilityStatus === 'INSUFFICIENT_DATA') {
    return {
      tone: 'attention',
      headline: 'Awaiting verified identifiers',
      detail: 'Required seller-verified identifiers are still missing or contradictory, so filing stays paused.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (eligibilityStatus === 'SAFETY_HOLD' && filingStatus === 'blocked') {
    return {
      tone: 'blocked',
      headline: 'Safety hold',
      detail: lastError || 'Agent 7 is holding this case because the current proof or runtime state is not safe enough to submit.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (!hasRealDisputeCase && getQueueEntityKind(row) === 'detection') {
    if (String(row.proof_status || '').trim().toLowerCase() === 'supportable_but_not_case_eligible') {
      return {
        tone: 'attention',
        headline: 'Detection only',
        detail: 'Supportable, but not yet a real case. Margin found value here, but filing stays unavailable until a dispute case is actually created.',
        strengths: strengths.slice(0, 3),
        risks: risks.slice(0, 2)
      };
    }

    return {
      tone: 'attention',
      headline: 'Detection only',
      detail: 'This record is still a detection signal, so it cannot file from this queue state yet.',
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 2)
    };
  }

  if (['filed', 'submitting', 'recovering', 'payment_required'].includes(filingStatus) || ['submitted', 'under review', 'in review'].includes(status)) {
    if (!hasRealDisputeCase) {
      return {
        tone: 'attention',
        headline: 'Not Available',
        detail: 'A backend-confirmed dispute case is not available for this detection row.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    return {
      tone: 'in_flight',
      headline: 'In Amazon review',
      detail: 'Submission has moved out of seller control. Focus on any rejection history or evidence gaps before retrying.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (['rejected', 'denied', 'lost'].includes(status) || filingStatus === 'failed') {
    if (!hasRealDisputeCase) {
      return {
        tone: 'attention',
        headline: 'Not Available',
        detail: 'A backend-confirmed dispute case is not available for this detection row.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    return {
      tone: 'blocked',
      headline: 'Rejection risk is live',
      detail: row.rejection_reason
        ? `Amazon has already objected to this case. Fix the recorded reason before retrying.`
        : `This ${entityNoun} was rejected or failed in filing. Review the evidence and filing posture before resubmission.`,
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (filingStatus === 'blocked' || row.eligible_to_file === false) {
    return {
      tone: 'blocked',
      headline: 'Blocked before filing',
      detail: lastError
        ? lastError
        : blockReasons.length
        ? 'The gate has already identified issues that should be fixed before submission.'
        : `This ${entityNoun} is not currently eligible to file.`,
      strengths: strengths.slice(0, 2),
      risks: risks.slice(0, 3)
    };
  }

  if (row.eligible_to_file === true && ['pending', 'retrying'].includes(filingStatus)) {
    if (!hasLinkedDisputeCase || !backendFilingOpen) {
      return {
        tone: 'attention',
        headline: 'Detection only',
        detail: 'Supportable, but not yet a real case. Filing is not available from this queue row until a dispute case is created.',
        strengths: strengths.slice(0, 3),
        risks: risks.slice(0, 2)
      };
    }
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
      detail: `The current gate is open. Seller-controlled quality now comes down to keeping this ${entityNoun}'s identifiers and evidence clean.`,
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  return {
    tone: 'attention',
    headline: 'Needs seller review',
    detail: `This ${entityNoun} record still has gaps or ambiguity that can dilute filing strength.`,
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

function normalizeIdentifier(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

function dedupeIdentifiers(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalizeIdentifier).filter(Boolean)));
}

function getQueuePrimaryRowKey(row: Pick<QueueRow, 'dispute_case_id' | 'linked_dispute_case_id' | 'detection_result_id'>) {
  return normalizeIdentifier(row.dispute_case_id || row.linked_dispute_case_id || row.detection_result_id);
}

function getQueueCanonicalIdentifiers(
  row: Pick<QueueRow, 'dispute_case_id' | 'linked_dispute_case_id' | 'detection_result_id'>
) {
  return dedupeIdentifiers([
    row.dispute_case_id,
    row.linked_dispute_case_id,
    row.detection_result_id
  ]);
}

function getQueueSecondaryIdentifiers(
  row: Pick<QueueRow, 'case_number' | 'claim_number' | 'amazon_case_id'>
) {
  return dedupeIdentifiers([
    row.case_number,
    row.claim_number,
    row.amazon_case_id
  ]);
}

function getEventCanonicalIdentifiers(event: { entityType?: string; entityId?: string; data: Record<string, any> }) {
  const inferredEntityIdentifier = (
    event.entityType === 'dispute_case' ||
    event.entityType === 'detection_result'
  )
    ? event.entityId
    : undefined;

  return dedupeIdentifiers([
    event.data?.dispute_case_id,
    event.data?.disputeId,
    event.data?.dispute_id,
    event.data?.linked_dispute_case_id,
    event.data?.linkedDisputeCaseId,
    event.data?.detection_id,
    event.data?.detectionId,
    event.data?.detection_result_id,
    event.data?.detectionResultId,
    event.data?.claim_id,
    event.data?.claimId,
    inferredEntityIdentifier
  ]);
}

function getEventSecondaryIdentifiers(event: { entityType?: string; entityId?: string; data: Record<string, any> }) {
  return dedupeIdentifiers([
    event.data?.case_number,
    event.data?.claim_number,
    event.data?.amazon_case_id,
    event.data?.amazonCaseId
  ]);
}

function hasSharedIdentifier(left: string[], right: string[]) {
  if (!left.length || !right.length) return false;
  return left.some((identifier) => right.includes(identifier));
}

function getMatchedRowKeysForEvent(rows: QueueRow[], event: { entityType?: string; entityId?: string; data: Record<string, any> }) {
  const canonicalEventIdentifiers = getEventCanonicalIdentifiers(event);
  if (canonicalEventIdentifiers.length) {
    const canonicalMatchKeys = Array.from(new Set(rows
      .filter((row) => hasSharedIdentifier(getQueueCanonicalIdentifiers(row), canonicalEventIdentifiers))
      .map((row) => getQueuePrimaryRowKey(row))
      .filter(Boolean)));

    if (canonicalMatchKeys.length === 1) {
      return canonicalMatchKeys;
    }

    if (canonicalMatchKeys.length > 1) {
      return [];
    }
  }

  if (canonicalEventIdentifiers.length) {
    return [];
  }

  const secondaryEventIdentifiers = getEventSecondaryIdentifiers(event);
  if (!secondaryEventIdentifiers.length) {
    return [];
  }

  const secondaryMatchKeys = Array.from(new Set(rows
    .filter((row) => hasSharedIdentifier(getQueueSecondaryIdentifiers(row), secondaryEventIdentifiers))
    .map((row) => getQueuePrimaryRowKey(row))
    .filter(Boolean)));

  if (secondaryMatchKeys.length !== 1) {
    return [];
  }

  return secondaryMatchKeys;
}

function rowMatchesEvent(row: QueueRow, event: { entityType?: string; entityId?: string; data: Record<string, any> }) {
  const rowCanonicalIdentifiers = getQueueCanonicalIdentifiers(row);
  const eventCanonicalIdentifiers = getEventCanonicalIdentifiers(event);

  if (rowCanonicalIdentifiers.length || eventCanonicalIdentifiers.length) {
    return rowCanonicalIdentifiers.length > 0 &&
      eventCanonicalIdentifiers.length > 0 &&
      hasSharedIdentifier(rowCanonicalIdentifiers, eventCanonicalIdentifiers);
  }

  return hasSharedIdentifier(
    getQueueSecondaryIdentifiers(row),
    getEventSecondaryIdentifiers(event)
  );
}

function rowsShareIdentity(left: QueueRow, right: QueueRow) {
  const leftPrimaryKey = getQueuePrimaryRowKey(left);
  const rightPrimaryKey = getQueuePrimaryRowKey(right);

  if (leftPrimaryKey || rightPrimaryKey) {
    return Boolean(leftPrimaryKey) && leftPrimaryKey === rightPrimaryKey;
  }

  const leftCanonicalIdentifiers = getQueueCanonicalIdentifiers(left);
  const rightCanonicalIdentifiers = getQueueCanonicalIdentifiers(right);

  if (leftCanonicalIdentifiers.length || rightCanonicalIdentifiers.length) {
    return leftCanonicalIdentifiers.length > 0 &&
      rightCanonicalIdentifiers.length > 0 &&
      hasSharedIdentifier(leftCanonicalIdentifiers, rightCanonicalIdentifiers);
  }

  return hasSharedIdentifier(
    getQueueSecondaryIdentifiers(left),
    getQueueSecondaryIdentifiers(right)
  );
}

function findBestMatchingQueueRow(target: QueueRow, candidates: QueueRow[]) {
  const targetPrimaryKey = getQueuePrimaryRowKey(target);
  if (targetPrimaryKey) {
    const primaryMatches = candidates.filter((row) => getQueuePrimaryRowKey(row) === targetPrimaryKey);
    if (primaryMatches.length === 1) {
      return primaryMatches[0];
    }
    if (primaryMatches.length > 1) {
      return null;
    }
  }

  const targetCanonicalIdentifiers = getQueueCanonicalIdentifiers(target);
  if (targetCanonicalIdentifiers.length) {
    const canonicalMatches = candidates.filter((row) =>
      hasSharedIdentifier(getQueueCanonicalIdentifiers(row), targetCanonicalIdentifiers)
    );

    if (canonicalMatches.length === 1) {
      return canonicalMatches[0];
    }

    if (canonicalMatches.length > 1) {
      return null;
    }

    return null;
  }

  const targetSecondaryIdentifiers = getQueueSecondaryIdentifiers(target);
  if (!targetSecondaryIdentifiers.length) {
    return null;
  }

  const secondaryMatches = candidates.filter((row) =>
    hasSharedIdentifier(getQueueSecondaryIdentifiers(row), targetSecondaryIdentifiers)
  );

  return secondaryMatches.length === 1 ? secondaryMatches[0] : null;
}

function readLiveTimestamp(timestamp: string | null | undefined) {
  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) {
    return null;
  }

  return timestamp;
}

type QueueLiveSignal = {
  label: string;
  detail: string;
  timestamp: string;
};

function describeQueueLiveSignal(event: { eventType: string; timestamp: string; data: Record<string, any> }): QueueLiveSignal | null {
  const timestamp = readLiveTimestamp(event.timestamp) || new Date().toISOString();

  switch (event.eventType) {
    case 'case.created':
      return {
        label: 'New case reached the queue',
        detail: 'A dispute case entered the filing queue and readiness truth is refreshing.',
        timestamp
      };
    case 'case.status_updated':
      return {
        label: 'Filing readiness updated just now',
        detail: 'Case posture changed and the queue refreshed its filing readiness truth.',
        timestamp
      };
    case 'filing.submitted':
      return {
        label: 'Amazon filing state updated just now',
        detail: 'A queued case moved forward and the filing queue refreshed around it.',
        timestamp
      };
    case 'evidence.linked':
      return {
        label: 'Evidence linked just now',
        detail: 'Supporting documents changed and filing posture refreshed for the affected record.',
        timestamp
      };
    case 'payout.detected':
      return {
        label: 'Recovery status updated just now',
        detail: 'A payout or recovery signal changed for a record already in this queue.',
        timestamp
      };
    default:
      return null;
  }
}

function isRecentTimestamp(value: string | null | undefined, windowHours = 6) {
  if (!value) return false;
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return false;
  return Date.now() - parsed <= windowHours * 60 * 60 * 1000;
}

function normalizeQueueFilingStrategy(value: unknown): QueueRow['filing_strategy'] {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (normalized === 'AUTO' || normalized === 'SMART' || normalized === 'BLOCKED') {
    return normalized;
  }
  return null;
}

function updateQueueRow(row: QueueRow, event: { eventType: string; data: Record<string, any>; timestamp: string }) {
  const updatedAt = readLiveTimestamp(event.timestamp);
  const patch: Partial<QueueRow> = {};

  if (event.eventType === 'filing.submitted') {
    if (typeof event.data?.status === 'string' && event.data.status.trim()) patch.status = event.data.status;
    if (typeof event.data?.filing_status === 'string' && event.data.filing_status.trim()) patch.filing_status = event.data.filing_status;
    const submittedFilingStrategy = normalizeQueueFilingStrategy(event.data?.filing_strategy);
    if (submittedFilingStrategy) patch.filing_strategy = submittedFilingStrategy;
    if (event.data?.explanation_payload && typeof event.data.explanation_payload === 'object') patch.explanation_payload = event.data.explanation_payload;
    if (typeof event.data?.amazon_case_id === 'string' && event.data.amazon_case_id.trim()) patch.amazon_case_id = event.data.amazon_case_id;
  }

  if (event.eventType === 'case.status_updated') {
    if (typeof event.data?.status === 'string' && event.data.status.trim()) patch.status = event.data.status;
    const updatedFilingStrategy = normalizeQueueFilingStrategy(event.data?.filing_strategy);
    if (updatedFilingStrategy) patch.filing_strategy = updatedFilingStrategy;
    if (event.data?.explanation_payload && typeof event.data.explanation_payload === 'object') patch.explanation_payload = event.data.explanation_payload;
    if (typeof event.data?.amazon_case_id === 'string' && event.data.amazon_case_id.trim()) patch.amazon_case_id = event.data.amazon_case_id;
    if (typeof event.data?.amount_approved === 'number' && Number.isFinite(event.data.amount_approved)) patch.approved_amount = event.data.amount_approved;
  }

  if (event.eventType === 'evidence.linked') {
    if (typeof event.data?.evidence_state === 'string' && event.data.evidence_state.trim()) patch.evidence_state = event.data.evidence_state;
    if (typeof event.data?.matched_document_count === 'number' && Number.isFinite(event.data.matched_document_count)) {
      patch.matched_document_count = event.data.matched_document_count;
    }
  }

  if (event.eventType === 'payout.detected') {
    if (typeof event.data?.status === 'string' && event.data.status.trim()) patch.recovery_status = event.data.status;
    if (typeof event.data?.actual_amount === 'number' && Number.isFinite(event.data.actual_amount)) {
      patch.actual_payout_amount = event.data.actual_amount;
    } else if (typeof event.data?.amount === 'number' && Number.isFinite(event.data.amount)) {
      patch.actual_payout_amount = event.data.amount;
    }
  }

  if (!Object.keys(patch).length) {
    return null;
  }

  if (updatedAt) {
    patch.updated_at = updatedAt;
  }

  return {
    ...row,
    ...patch
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [filingInProgress, setFilingInProgress] = useState<Set<string>>(new Set());
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [summary, setSummary] = useState<QueueSummaryState>(() => createUnavailableSummary(1, 25));

  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [gateState, setGateState] = useState('all');
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
  const [latestQueueSignal, setLatestQueueSignal] = useState<QueueLiveSignal | null>(null);
  const liveRefreshTimerRef = useRef<number | null>(null);
  const pageSize = 25;

  const markSummaryUnavailable = useCallback(() => {
    setSummary((current) => createUnavailableSummary(current.page, current.page_size));
  }, []);

  const refresh = useCallback(() => {
    markSummaryUnavailable();
    setRefreshKey((value) => value + 1);
  }, [markSummaryUnavailable]);

  const scheduleLiveRefresh = useCallback(() => {
    markSummaryUnavailable();
    if (liveRefreshTimerRef.current != null) return;

    liveRefreshTimerRef.current = window.setTimeout(() => {
      liveRefreshTimerRef.current = null;
      refresh();
    }, 150);
  }, [markSummaryUnavailable, refresh]);

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
      setSummary(createUnavailableSummary(page, pageSize));
      return;
    }

    let cancelled = false;
    const loadQueue = async () => {
      setLoading(true);
      setError(null);
      setSummary(createUnavailableSummary(page, pageSize));
      try {
        const response = await api.getDisputeCaseQueue({
          search: searchTerm || undefined,
          status: status !== 'all' ? status : undefined,
          gate_state: gateState !== 'all' ? gateState : undefined,
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
          throw new Error(response.error || 'Failed to load dispute queue');
        }

        if (cancelled) return;

        setRows(response.data.rows || []);
        setDetailsRow((currentDetails) => {
          if (!currentDetails) return currentDetails;
          const matchedRow = findBestMatchingQueueRow(currentDetails, response.data.rows || []);
          return matchedRow || currentDetails;
        });
        setSummary({
          total_cases: response.data.total_cases,
          filtered_results: response.data.filtered_results,
          blocked_count: response.data.blocked_count,
          ready_to_file_count: response.data.ready_to_file_count,
          filed_count: response.data.filed_count,
          rejected_count: response.data.rejected_count,
          approved_pending_payout_count: response.data.approved_pending_payout_count,
          recovered_count: response.data.recovered_count,
          verified_paid_count: response.data.verified_paid_count ?? null,
          billing_pending_count: response.data.billing_pending_count,
          supportable_claim_count: response.data.supportable_claim_count ?? null,
          supportable_claim_value: response.data.supportable_claim_value ?? null,
          supportable_ready_to_file_count: response.data.supportable_ready_to_file_count ?? null,
          supportable_currency: response.data.supportable_currency ?? null,
          last_updated_at: response.data.last_updated_at,
          page: response.data.page,
          page_size: response.data.page_size
        });
      } catch (err: any) {
        if (!cancelled) {
          setRows([]);
          setSummary(createUnavailableSummary(page, pageSize));
          setError(err?.message || 'Failed to load dispute queue');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadQueue();
    return () => { cancelled = true; };
  }, [activeTenantSlug, searchTerm, status, gateState, filingStatus, recoveryStatus, billingStatus, evidenceState, rejectionCategory, sortBy, sortOrder, page, refreshKey]);

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

  const totalPages = Math.max(1, Math.ceil((summary.filtered_results ?? 0) / pageSize));

  const hasActiveFilters = useMemo(() => (
    Boolean(searchTerm)
    || status !== 'all'
    || gateState !== 'all'
    || filingStatus !== 'all'
    || recoveryStatus !== 'all'
    || billingStatus !== 'all'
    || evidenceState !== 'all'
    || rejectionCategory !== 'all'
  ), [searchTerm, status, gateState, filingStatus, recoveryStatus, billingStatus, evidenceState, rejectionCategory]);

  const visibleQueuePosture = useMemo(() => {
    return rows.reduce((acc, row) => {
      const posture = deriveFilingPosture(row, getFinancialSummaryForRow(row, financialSummaries));
      acc[posture.tone] += 1;
      return acc;
    }, {
      ready: 0,
      attention: 0,
      blocked: 0,
      in_flight: 0,
      resolved: 0
    } as Record<FilingPosture['tone'], number>);
  }, [rows, financialSummaries]);

  const visibleBlockerSignals = useMemo(() => {
    const counts = new Map<string, number>();

    rows.forEach((row) => {
      const posture = deriveFilingPosture(row, getFinancialSummaryForRow(row, financialSummaries));
      if (posture.tone !== 'attention' && posture.tone !== 'blocked') return;

      const gate = getQueueGateState(row);
      const label = gate?.label || posture.headline;
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count]) => ({ label, count }));
  }, [rows, financialSummaries]);

  const recentlyUpdatedCount = useMemo(() => (
    rows.reduce((count, row) => count + (isRecentTimestamp(row.updated_at) ? 1 : 0), 0)
  ), [rows]);

  const queuePostureHeadline = useMemo(() => {
    const readyCount = summary.ready_to_file_count;
    const blockedCount = summary.blocked_count;

    if (typeof readyCount === 'number' && readyCount > 0) {
      return `${formatSummaryValue(readyCount)} ready to file now`;
    }

    if (typeof blockedCount === 'number' && blockedCount > 0) {
      return 'No filing-ready rows in this filtered view right now';
    }

    if (typeof summary.filtered_results === 'number' && summary.filtered_results === 0) {
      return 'No queue records match the current filters';
    }

    if (loading && rows.length > 0) {
      return 'Refreshing live filing queue truth';
    }

    return 'Preparing live filing queue truth';
  }, [summary.ready_to_file_count, summary.blocked_count, summary.filtered_results, loading, rows.length]);

  const queuePostureDetail = useMemo(() => {
    const detailBits: string[] = [];

    if (typeof summary.blocked_count === 'number' && summary.blocked_count > 0) {
      detailBits.push(`${formatSummaryValue(summary.blocked_count)} blocked in this filtered view`);
    }

    if (visibleQueuePosture.attention > 0) {
      detailBits.push(`${visibleQueuePosture.attention} on this page still need seller review`);
    }

    if (typeof summary.approved_pending_payout_count === 'number' && summary.approved_pending_payout_count > 0) {
      detailBits.push(`${formatSummaryValue(summary.approved_pending_payout_count)} waiting on payout`);
    }

    if (!detailBits.length) {
      return 'This filtered view is showing filing-readiness truth first, then the dense row detail underneath it.';
    }

    return detailBits.join(' · ');
  }, [summary.blocked_count, summary.approved_pending_payout_count, visibleQueuePosture.attention]);

  const queueTopSummaryCards = useMemo(() => ([
    {
      label: 'Ready to file now',
      value: summary.ready_to_file_count,
      detail: 'Canonical ready count in this filtered view'
    },
    {
      label: 'Blocked now',
      value: summary.blocked_count,
      detail: 'Canonical blocked count in this filtered view'
    },
    {
      label: 'Needs review on this page',
      value: visibleQueuePosture.attention,
      detail: 'Visible rows still waiting on seller review'
    },
    {
      label: 'Payout waiting',
      value: summary.approved_pending_payout_count,
      detail: 'Approved rows still awaiting payout confirmation'
    },
  ]), [summary.ready_to_file_count, summary.blocked_count, summary.approved_pending_payout_count, visibleQueuePosture.attention]);

  const secondarySummaryCards = useMemo(() => ([
    { label: 'Filed / submitted', value: summary.filed_count, detail: 'Already moving through Amazon filing flow' },
    { label: 'Rejected', value: summary.rejected_count, detail: 'Need rejection cleanup before retrying' },
    { label: 'Paid back', value: summary.verified_paid_count, detail: 'Financially confirmed recovery outcomes' },
    { label: 'Billing pending', value: summary.billing_pending_count, detail: 'Legacy billing still not reconciled' },
  ]), [summary]);

  const queueScopeLine = useMemo(() => {
    if ((summary.filtered_results == null || summary.total_cases == null) && loading && rows.length > 0) {
      return 'Current filtered view: refreshing queue scope';
    }

    return `Current filtered view: ${formatSummaryValue(summary.filtered_results)} of ${formatSummaryValue(summary.total_cases)} total queue records`;
  }, [summary.filtered_results, summary.total_cases, loading, rows.length]);

  const queueLoadingState = useMemo(() => {
    if (hasActiveFilters) {
      return {
        title: 'Preparing filing queue for the current filters',
        detail: 'Margin is loading which rows are ready now, blocked now, or still need seller review in this view.'
      };
    }

    return {
      title: 'Loading filing-ready and blocked queue truth',
      detail: 'Margin is preparing the latest readiness, blocker, and payout-waiting posture for this queue.'
    };
  }, [hasActiveFilters]);

  useStatusStream((event) => {
    if (!activeTenantSlug) return;

    const liveSignal = describeQueueLiveSignal(event);
    if (liveSignal) {
      setLatestQueueSignal(liveSignal);
    }

    if (event.eventType === 'case.created') {
      scheduleLiveRefresh();
      return;
    }

    if (
      event.eventType === 'case.status_updated' ||
      event.eventType === 'filing.submitted' ||
      event.eventType === 'evidence.linked' ||
      event.eventType === 'payout.detected'
    ) {
      const matchedRowKeys = getMatchedRowKeysForEvent(rows, event);
      if (!matchedRowKeys.length) {
        scheduleLiveRefresh();
        return;
      }

      const matchedRowKeySet = new Set(matchedRowKeys);
      let matchedAnyRow = false;
      let patchedAnyRow = false;
      let requiresRefresh = false;

      setRows((currentRows) => {
        const nextRows = currentRows.map((row) => {
          const rowKey = getQueuePrimaryRowKey(row);
          if (!rowKey || !matchedRowKeySet.has(rowKey)) return row;
          matchedAnyRow = true;
          const nextRow = updateQueueRow(row, event);
          if (!nextRow) {
            requiresRefresh = true;
            return row;
          }
          if (nextRow !== row) {
            patchedAnyRow = true;
          }
          return nextRow;
        });

        return nextRows;
      });

      setDetailsRow((currentDetails) => {
        if (!currentDetails) return currentDetails;
        const detailsKey = getQueuePrimaryRowKey(currentDetails);
        const shouldPatchDetails = detailsKey
          ? matchedRowKeySet.has(detailsKey)
          : rowMatchesEvent(currentDetails, event);
        if (!shouldPatchDetails) return currentDetails;
        const nextDetails = updateQueueRow(currentDetails, event);
        if (!nextDetails) {
          requiresRefresh = true;
          return currentDetails;
        }
        return nextDetails;
      });

      if (!matchedAnyRow || patchedAnyRow || requiresRefresh) {
        scheduleLiveRefresh();
      }
    }
  }, activeTenantSlug);

  useEffect(() => {
    return () => {
      if (liveRefreshTimerRef.current != null) {
        window.clearTimeout(liveRefreshTimerRef.current);
      }
      if (briefPreviewUrl) {
        URL.revokeObjectURL(briefPreviewUrl);
      }
    };
  }, [briefPreviewUrl]);

  const openCaseDetails = async (row: QueueRow) => {
    if (row.can_open_case_detail !== true) {
      const explanation = getUnavailableActionExplanation(row, 'details');
      toast({
        variant: 'destructive',
        title: 'Not Available',
        description: explanation.detail
      });
      return;
    }

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
    if (row.can_open_brief !== true || !row.linked_dispute_case_id) {
      const explanation = getUnavailableActionExplanation(row, 'brief');
      toast({
        variant: 'destructive',
        title: 'Not Available',
        description: explanation.detail
      });
      return;
    }

    if (!activeTenantSlug) return;
    setBriefPreviewOpen(true);
    setBriefPreviewLoading(false);
    setBriefPreviewRow(row);

    setBriefPreviewLoading(true);

    try {
      const response = await api.fetchDisputeBriefPdf(row.linked_dispute_case_id, activeTenantSlug);
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

  const handleFilingAction = async (row: QueueRow, mode: QueueActionMode) => {
    if (!activeTenantSlug) return;
    const actionAllowed =
      mode === 'approve'
        ? row.can_approve === true
        : mode === 'retry'
          ? row.can_retry === true
          : row.can_file === true;

    if (!actionAllowed || !row.linked_dispute_case_id) {
      toast({
        variant: 'destructive',
        title: 'Not Available',
        description: 'This action is not backend-confirmed for the selected row.'
      });
      return;
    }

    if (!isPaidUser && mode === 'file') {
      toast({ title: 'Upgrade required', description: 'Paid access is required before filing a case.' });
      return;
    }
    if (isThrottled) {
      toast({ variant: 'destructive', title: 'System cooldown', description: 'Filing is temporarily disabled due to Amazon rate limits.' });
      return;
    }

    const key = row.linked_dispute_case_id;
    setFilingInProgress((prev) => new Set(prev).add(key));
    try {
      const endpoint =
        mode === 'approve'
          ? `/api/disputes/approve-filing?tenantSlug=${encodeURIComponent(activeTenantSlug)}`
          : mode === 'retry'
            ? `/api/disputes/retry-filing?tenantSlug=${encodeURIComponent(activeTenantSlug)}`
            : `/api/disputes/file-now?tenantSlug=${encodeURIComponent(activeTenantSlug)}`;

      const response = await api.post(endpoint, {
        dispute_id: row.linked_dispute_case_id,
        claim_id: row.detection_result_id
      });

      if (!response.ok) {
        throw new Error(response.error || 'Action failed');
      }

      toast({
        title: mode === 'approve' ? 'Approval queued' : mode === 'retry' ? 'Retry queued' : 'Case queued',
        description: response.data?.message || row.case_number || row.dispute_case_id
      });
      setLatestQueueSignal({
        label: mode === 'approve' ? 'Approval queued just now' : mode === 'retry' ? 'Retry queued just now' : 'Filing queued just now',
        detail: response.data?.message || 'Queue readiness is refreshing for the selected record.',
        timestamp: new Date().toISOString()
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

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Dispute Queue" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pt-10 pb-20">
            <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl">
              <CardContent className="p-8 space-y-3">
                <h1 className="text-xl font-sans font-bold text-white tracking-tight">Queue unavailable</h1>
                <p className="text-sm text-white/50 font-sans">
                  A tenant workspace is required before dispute queue records can be loaded.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dispute Queue" midnight>
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
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Dispute Queue</h1>
              <p className="text-sm text-white/50 font-sans max-w-3xl">
                Track dispute cases, detection-only queue rows, approvals, and payout follow-up without assuming every record is already filed.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              {latestQueueSignal ? (
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/75">
                  {latestQueueSignal.label}
                  <span className="ml-2 text-white/40">
                    {formatDistanceToNow(new Date(latestQueueSignal.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ) : null}
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white">
                {summary.last_updated_at ? `Queue refreshed ${formatDistanceToNow(new Date(summary.last_updated_at), { addSuffix: true })}` : 'Queue update time unavailable'}
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
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Filtered queue snapshot</p>
                <p className="mt-2 text-sm font-sans font-bold tracking-tight text-white">{queuePostureHeadline}</p>
                <p className="mt-1 text-xs font-sans text-white/60">{queuePostureDetail}</p>
                <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{queueScopeLine}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-left">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Total queue records</p>
                  <p className="mt-1 text-lg leading-none font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">
                    {formatSummaryValue(summary.total_cases)}
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
                <p className="mb-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/25">
                  Snapshot scope: current filtered view
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {visibleBlockerSignals.map((signal) => (
                    <span
                      key={`queue-blocker-${signal.label}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"
                    >
                      {signal.count} {signal.label}
                    </span>
                  ))}
                  {recentlyUpdatedCount > 0 ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                      {recentlyUpdatedCount} recently updated on this page
                    </span>
                  ) : null}
                  {latestQueueSignal ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                      {latestQueueSignal.label}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[...queueTopSummaryCards, ...secondarySummaryCards].map((card) => (
                    <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{card.label}</div>
                      <div className="mt-2 text-left text-lg font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">
                        {formatSummaryValue(card.value)}
                      </div>
                      <div className="mt-1 text-[11px] font-sans leading-5 tracking-tight text-white/62">
                        {card.detail}
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
                      placeholder="Search queue ID, claim number, Amazon case, store, order, SKU, ASIN, or rejection reason"
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

                  <Select value={gateState} onValueChange={(value) => { setGateState(value); setPage(1); }}>
                    <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Gate" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All gate states</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="duplicate_blocked">Duplicate blocked</SelectItem>
                      <SelectItem value="insufficient_data">Insufficient data</SelectItem>
                      <SelectItem value="thread_only">Thread-only</SelectItem>
                      <SelectItem value="safety_hold">Safety hold</SelectItem>
                      <SelectItem value="pending_safety_verification">Pending safety verification</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filingStatus} onValueChange={(value) => { setFilingStatus(value); setPage(1); }}>
                    <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Filing" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                      <SelectItem value="all">All filing</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="retrying">Retrying</SelectItem>
                      <SelectItem value="pending_approval">Pending approval</SelectItem>
                      <SelectItem value="pending_safety_verification">Pending safety verification</SelectItem>
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
                      <SelectItem value="billed_amount">Legacy Billed Amount</SelectItem>
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

                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/25">
                    {queueScopeLine}
                  </div>
                  {loading && rows.length > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Refreshing queue readiness
                    </div>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading && rows.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-center text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <div className="space-y-1">
                    <span className="block text-sm font-sans font-bold text-white/70">{queueLoadingState.title}</span>
                    <span className="block text-xs font-sans text-white/40">{queueLoadingState.detail}</span>
                  </div>
                </div>
              ) : error ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                  <AlertCircle className="w-5 h-5 text-white/40" />
                  <div className="space-y-1">
                    <p className="text-sm font-sans font-bold text-white/70">Failed to load dispute queue</p>
                    <p className="text-xs font-sans text-white/40">{error}</p>
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                  <FileText className="w-5 h-5 text-white/20" />
                  <p className="text-sm font-sans font-bold text-white/60">No dispute queue records match the current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1440px]">
                    <thead className="bg-white/[0.02] border-b border-white/5">
                      <tr className="text-left">
                        {['Queue record', 'Record status', 'Amount at stake', 'Evidence', 'Next best move', 'Updated', 'Actions'].map((header) => (
                          <th key={header} className="px-6 py-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((row) => {
                        const isProcessing = row.linked_dispute_case_id ? filingInProgress.has(row.linked_dispute_case_id) : false;
                        const financialSummary = getFinancialSummaryForRow(row, financialSummaries);
                        const posture = deriveFilingPosture(row, financialSummary);
                        const decisionExplanation = summarizeExplanationPayload(row.explanation_payload);
                        const actionButton = getBackendPrimaryAction(row);
                        const canOpenCaseDetail = row.can_open_case_detail === true;
                        const canOpenBrief = row.can_open_brief === true && Boolean(row.linked_dispute_case_id);
                        const entityLabel = getQueueEntityLabel(row);
                        const openRecordLabel = getOpenRecordLabel(row);
                        const recordDetailsLabel = getRecordDetailsLabel(row);
                        const recordIdentifier = getQueueRecordIdentifier(row);
                        const recordIdentifierLabel = getQueueReferenceLabel(row);
                        const recordType = row.case_type || row.anomaly_type || 'Not Available';
                        const rowTypeLabel = formatQueueRowType(row);
                        const caseOriginLabel = formatCaseOrigin(row.case_origin);
                        const threadBackfilled = isThreadBackfilled(row);
                        const syntheticOpportunityReference = isSyntheticOpportunityReference(row);
                        const hasRealDisputeCase = row.has_real_dispute_case === true;
                        const gateState = getQueueGateState(row);
                        const missingRequirements = getMissingRequirements(row);
                        const progressSnapshot = getQueueProgressSnapshot(row, financialSummary);

                      return (
                        <tr key={row.dispute_case_id} className="align-top hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-5">
                              <div className="space-y-2 min-w-[220px]">
                                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                                  {recordIdentifierLabel}
                                </div>
                                {canOpenCaseDetail ? (
                                  <Link to={`/recoveries/${row.dispute_case_id}`} className="inline-flex items-center gap-2 text-sm font-sans font-bold text-white hover:text-emerald-300">
                                    {recordIdentifier}
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center gap-2 text-sm font-sans font-bold text-white/60">
                                    {recordIdentifier}
                                  </span>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/74">
                                    {hasRealDisputeCase ? 'Real dispute case' : 'Detection-only'}
                                  </Badge>
                                  {syntheticOpportunityReference ? (
                                    <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/74">
                                      Synthetic ref
                                    </Badge>
                                  ) : null}
                                  {threadBackfilled ? (
                                    <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/74">
                                      Thread-linked
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="space-y-1 text-[11px] text-white/50 font-sans">
                                  <div>Entity: {entityLabel}</div>
                                  <div>Row Type: {rowTypeLabel}</div>
                                  <div>Linked Dispute Case: {row.linked_dispute_case_id || 'Not Available'}</div>
                                  <div>Origin: {caseOriginLabel}</div>
                                  <div>Store: {row.store_name || 'Not Available'}</div>
                                  <div>Type: {recordType}</div>
                                </div>
                                <div className="border-t border-white/[0.06] pt-2 text-[10px] font-sans tracking-tight text-white/42">
                                  <span className="uppercase text-white/26">Case progress:</span>{' '}
                                  <span className={cn('font-semibold', progressSnapshot.toneClass)}>{progressSnapshot.label}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="grid grid-cols-1 gap-2 min-w-[220px]">
                                <Badge variant="outline" className={cn('w-fit justify-start border', badgeClass(row.status))}>Status: {formatLabel(row.status)}</Badge>
                                {gateState ? (
                                  <Badge variant="outline" className={cn('w-fit justify-start border', postureBadgeClass(gateState.tone))}>
                                    Gate: {gateState.label}
                                  </Badge>
                                ) : null}
                                {row.filing_status ? (
                                  <div className="text-[11px] text-white/45 font-sans">
                                    Filing state: {formatLabel(row.filing_status)}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="space-y-1 min-w-[220px] text-[12px] font-sans text-white/70">
                                <div className="flex justify-between gap-4"><span className="text-white/35">Requested</span><span>{formatMoney(row.requested_amount, row.currency)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-white/35">Approved</span><span>{formatMoney(row.approved_amount, row.currency)}</span></div>
                                  <div className="flex justify-between gap-4"><span className="text-white/35">Paid back (verified)</span><span>{formatMoney(financialSummary?.verified_paid_amount, row.currency)}</span></div>
                                  <div className="pt-1">
                                    <Badge variant="outline" className={cn('border', financialStatusTone(financialSummary?.payout_status))}>
                                    Payout status: {financialStatusLabel(financialSummary?.payout_status)}
                                    </Badge>
                                  </div>
                                <div className="text-[10px] text-white/40">{financialStatusDetail(financialSummary)}</div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <div className="min-w-[190px] max-w-[220px] space-y-2.5">
                                <Badge variant="outline" className={cn('w-fit max-w-full border', badgeClass(row.evidence_state))}>
                                  {row.evidence_state}
                                </Badge>
                                <div className="space-y-1.5 text-[11px] font-sans text-white/50">
                                  <div className="flex items-start justify-between gap-3">
                                    <span className="text-white/32">Documents linked</span>
                                    <span className="text-right text-white/65">{row.matched_document_count}</span>
                                  </div>
                                  {missingRequirements.length ? (
                                    <div className="space-y-1">
                                      <div className="text-white/32">Evidence gaps</div>
                                      <div className="break-words leading-snug text-white/62">
                                        {formatMissingRequirementCount(missingRequirements.length)}
                                      </div>
                                    </div>
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
                                </div>
                                <p className="text-[11px] font-sans leading-5 text-white/55">{posture.detail}</p>
                                {decisionExplanation ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/45">
                                    Why this record is in this state: {decisionExplanation}
                                  </p>
                                ) : null}
                                {getManualReviewReason(row) ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/38">
                                    Needs review because: {formatDisputeReason(getManualReviewReason(row))}
                                  </p>
                                ) : null}
                                {getQuarantineReason(row) ? (
                                  <p className="text-[11px] font-sans leading-5 text-white/38">
                                    Held because: {getQuarantineReason(row)}
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
                                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Last movement</div>
                                <div className="text-sm font-sans font-bold tracking-tight text-white">
                                  {row.updated_at ? formatDistanceToNow(new Date(row.updated_at), { addSuffix: true }) : 'Not Available'}
                                </div>
                                <div>{row.updated_at ? format(new Date(row.updated_at), 'yyyy/MM/dd HH:mm') : 'Not Available'}</div>
                                {isRecentTimestamp(row.updated_at) ? (
                                  <Badge variant="outline" className="w-fit border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                                    Recently updated
                                  </Badge>
                                ) : null}
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
                                    <div className="mb-1 border-b border-white/5 px-3 py-2 text-[9px] font-sans font-bold uppercase tracking-tight text-white/20">Record Actions</div>
                                    {canOpenCaseDetail ? (
                                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white">
                                        <Link to={`/recoveries/${row.dispute_case_id}`}>{openRecordLabel}</Link>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        disabled
                                        className="rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/35"
                                      >
                                        {getActionAvailabilityText(row, 'open_record', false, openRecordLabel)}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      disabled={!canOpenBrief}
                                      className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                      onClick={() => handleBriefPreview(row)}
                                    >
                                      {getActionAvailabilityText(row, 'brief', canOpenBrief, 'Brief PDF')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={!canOpenCaseDetail}
                                      className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                      onClick={() => openCaseDetails(row)}
                                    >
                                      {getActionAvailabilityText(row, 'details', canOpenCaseDetail, recordDetailsLabel)}
                                    </DropdownMenuItem>
                                    {actionButton ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white"
                                        disabled={isProcessing}
                                        onClick={() => handleFilingAction(row, actionButton.mode)}
                                      >
                                        {isProcessing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                                        {actionButton.label}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        disabled
                                        className="rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/35"
                                      >
                                        {getActionAvailabilityText(row, 'primary', false, 'Action blocked')}
                                      </DropdownMenuItem>
                                    )}
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
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">Record Details</div>
            <DialogTitle className="text-2xl font-sans font-bold tracking-tight text-white">
              {detailsRow ? getQueueRecordIdentifier(detailsRow) : 'Not Available'}
            </DialogTitle>
            {detailsRow ? (
              <div className="pt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/38">
                {getQueueReferenceLabel(detailsRow)} · Entity: {getQueueEntityLabel(detailsRow)} · Origin: {formatCaseOrigin(detailsRow.case_origin)} · Filing: {detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : formatLabel(detailsRow.filing_status)} · Recovery: {formatLabel(detailsRow.recovery_status)}
              </div>
            ) : null}
          </DialogHeader>
          {detailsRow ? (() => {
            const financialSummary = detailsFinancialSummary || getFinancialSummaryForRow(detailsRow, financialSummaries);
            const hasRealDisputeCase = getQueueEntityKind(detailsRow) === 'dispute_case';
            const detailsProofStatus = getProofStatus(detailsRow);
            const detailsPayoutProofStatus = getPayoutProofStatus(detailsRow);
            const detailsMissingRequirements = getMissingRequirements(detailsRow);
            return (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-2">
              <DetailSection
                title="Record"
                rows={[
                  { label: 'Entity Type', value: getQueueEntityLabel(detailsRow) },
                  { label: 'Row Type', value: formatQueueRowType(detailsRow) },
                  { label: 'Real Dispute Case', value: detailsRow.has_real_dispute_case === true ? 'Yes' : 'No' },
                  { label: getQueueReferenceLabel(detailsRow), value: getQueueRecordIdentifier(detailsRow) },
                  { label: 'Linked Dispute Case ID', value: detailsRow.linked_dispute_case_id || 'Not Available' },
                  { label: 'Detection Result ID', value: detailsRow.detection_result_id || (!hasRealDisputeCase ? detailsRow.dispute_case_id : null) || 'Not Available' },
                  { label: 'Amazon Case ID', value: hasRealDisputeCase ? (detailsRow.amazon_case_id || 'Not Available') : 'Not Available' },
                  { label: 'Case Origin', value: formatCaseOrigin(detailsRow.case_origin) },
                  { label: 'Store', value: detailsRow.store_name || 'Not Available' },
                  { label: 'Record Type', value: detailsRow.case_type || detailsRow.anomaly_type || 'Not Available' },
                ]}
              />
              <DetailSection
                title="Lifecycle"
                rows={[
                  { label: 'Status', value: formatLabel(detailsRow.status) },
                  { label: 'Filing Status', value: formatLabel(detailsRow.filing_status) },
                  { label: 'Eligibility', value: formatEligibilityStatus(detailsRow.eligibility_status) },
                  { label: 'Filing Strategy', value: detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : 'Not Available' },
                  { label: 'Runtime State', value: detailsRow.operational_state ? formatAutonomyLabel(detailsRow.operational_state) : 'Not Available' },
                  { label: 'Recovery Status', value: formatLabel(detailsRow.recovery_status) },
                  { label: 'Billing Status', value: formatLabel(detailsRow.billing_status) },
                  { label: 'Proof Status', value: formatProofStatus(detailsProofStatus) },
                  { label: 'Payout Proof', value: formatPayoutProofStatus(detailsPayoutProofStatus) },
                  { label: 'Financial Status', value: financialStatusLabel(financialSummary?.payout_status) },
                  { label: 'Next Action', value: detailsRow.next_action || 'Not Available' },
                ]}
              />
              <DetailSection
                title="Filing Posture"
                rows={[
                  { label: 'Posture', value: deriveFilingPosture(detailsRow).headline },
                  { label: 'Detail', value: deriveFilingPosture(detailsRow).detail },
                  { label: 'Decision Explanation', value: summarizeExplanationPayload(detailsRow.explanation_payload) || 'Not Available' },
                  { label: 'Runtime Explanation', value: summarizeOperationalExplanation(detailsRow.operational_explanation) || 'Not Available' },
                  { label: 'Eligible To File', value: detailsRow.eligible_to_file == null ? 'Not Available' : detailsRow.eligible_to_file ? 'Yes' : 'No' },
                  { label: 'Block Reasons', value: detailsRow.block_reasons?.length ? detailsRow.block_reasons.map(formatBlockReason).join(', ') : 'Not Available' },
                  { label: 'Last Filing Error', value: detailsRow.last_error || 'Not Available' },
                  { label: 'Missing Requirements', value: formatRequirementList(detailsMissingRequirements) },
                  { label: 'Manual Review Reason', value: getManualReviewReason(detailsRow) ? formatDisputeReason(getManualReviewReason(detailsRow)) : 'Not Available' },
                  { label: 'Quarantine Reason', value: getQuarantineReason(detailsRow) || 'Not Available' },
                ]}
              />
              <DetailSection
                title="Money"
                rows={[
                  { label: 'Requested Amount', value: formatMoney(detailsRow.requested_amount, detailsRow.currency) },
                  { label: 'Approved Amount', value: formatMoney(detailsRow.approved_amount, detailsRow.currency) },
                  { label: 'Paid (Verified)', value: formatMoney(financialSummary?.verified_paid_amount, detailsRow.currency) },
                  { label: 'Record Recovery Field (Legacy)', value: formatMoney(detailsRow.actual_payout_amount, detailsRow.currency) },
                  { label: 'Legacy Billed Amount', value: formatMoney(detailsRow.billed_amount, detailsRow.currency) },
                  { label: 'Expected Payout (Estimate)', value: formatMoney(detailsRow.expected_payout_amount, detailsRow.currency) },
                  { label: 'Variance', value: formatMoney(financialSummary?.variance_amount, detailsRow.currency) },
                ]}
              />
              <DetailSection
                title="Financial Confirmation"
                rows={[
                  { label: 'Summary', value: financialStatusDetail(financialSummary) },
                  { label: 'Paid Via Settlement', value: financialSummary?.proof_of_payment?.settlement_id || 'Not Available' },
                  { label: 'Payout Batch', value: financialSummary?.proof_of_payment?.payout_batch_id || 'Not Available' },
                  { label: 'Reference ID', value: financialSummary?.proof_of_payment?.reference_id || 'Not Available' },
                  { label: 'Confirmed At', value: financialSummary?.proof_of_payment?.event_date ? format(new Date(financialSummary.proof_of_payment.event_date), 'yyyy/MM/dd HH:mm') : 'Not Available' },
                  { label: 'Source', value: financialSummary?.source_types?.length ? financialSummary.source_types.map(financialSourceLabel).join(', ') : 'No financial events yet' },
                ]}
              />
              <DetailSection
                title="Evidence"
                rows={[
                  { label: 'Evidence State', value: detailsRow.evidence_state || 'Not Available' },
                  { label: 'Matched Documents', value: String(detailsRow.matched_document_count ?? 0) },
                  { label: 'Proof Status', value: formatProofStatus(detailsProofStatus) },
                  { label: 'Payout Proof', value: formatPayoutProofStatus(detailsPayoutProofStatus) },
                  { label: 'Still Needed', value: formatRequirementList(detailsMissingRequirements) },
                  { label: 'Rejection Category', value: detailsRow.rejection_category || 'Not Available' },
                  { label: 'Rejection Reason', value: detailsRow.rejection_reason || 'Not Available' },
                ]}
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/26">Detection Evidence Detail</div>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn('border', badgeClass(detailsRow.evidence_state))}>
                      {detailsRow.evidence_state || 'Not Available'}
                    </Badge>
                    {detailsProofStatus ? (
                      <Badge variant="outline" className={cn('border', proofStatusTone(detailsProofStatus))}>
                        Proof: {formatProofStatus(detailsProofStatus)}
                      </Badge>
                    ) : null}
                    {detailsPayoutProofStatus && detailsPayoutProofStatus !== 'not_applicable' ? (
                      <Badge variant="outline" className={cn('border', payoutProofTone(detailsPayoutProofStatus))}>
                        Payout Proof: {formatPayoutProofStatus(detailsPayoutProofStatus)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-[11px] font-sans">
                    <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-2">
                      <span className="text-white/35">Documents linked</span>
                      <span className="text-right font-semibold tracking-tight text-white/82">
                        {String(detailsRow.matched_document_count ?? 0)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-white/35">Still needed</div>
                      {detailsMissingRequirements.length ? (
                        <div className="flex flex-wrap gap-2">
                          {detailsMissingRequirements.map((requirement) => (
                            <span
                              key={`detail-missing-${detailsRow.dispute_case_id}-${requirement}`}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold tracking-tight text-white/72"
                            >
                              {formatRequirement(requirement)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] leading-5 text-white/68">No missing requirements recorded.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DetailSection
                title="Currentness"
                rows={[
                  { label: 'Created', value: detailsRow.created_at ? format(new Date(detailsRow.created_at), 'yyyy/MM/dd HH:mm') : 'Not Available' },
                  { label: 'Updated', value: detailsRow.updated_at ? format(new Date(detailsRow.updated_at), 'yyyy/MM/dd HH:mm') : 'Not Available' },
                  { label: 'Expected Payout Date (Estimate)', value: detailsRow.expected_payout_date ? format(new Date(detailsRow.expected_payout_date), 'yyyy/MM/dd') : 'Not Available' },
                  { label: 'Order ID', value: detailsRow.order_id || 'Not Available' },
                  { label: 'SKU / ASIN', value: [detailsRow.sku, detailsRow.asin].filter(Boolean).join(' / ') || 'Not Available' },
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
                        <div>Reference: {event.reference_id || 'Not Available'}</div>
                        <div>Settlement: {event.settlement_id || 'Not Available'}</div>
                        <div>Batch: {event.payout_batch_id || 'Not Available'}</div>
                        <div>Order / SKU: {[event.amazon_order_id, event.sku].filter(Boolean).join(' / ') || 'Not Available'}</div>
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
