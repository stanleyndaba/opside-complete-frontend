import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, Download, FileText, Loader2, MoreHorizontal, RefreshCw, Search, X } from 'lucide-react';

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

const CASE_BADGE_BASE = 'border-0 px-2 py-0.5 text-[10px] font-normal leading-4 tracking-tight';

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-[#F1F5F7] text-[#4D5B66]',
  filed: 'bg-[#EDF5FF] text-[#0B74DE]',
  submitted: 'bg-[#EDF5FF] text-[#0B74DE]',
  rejected: 'bg-[#FFF0EF] text-[#B42318]',
  denied: 'bg-[#FFF0EF] text-[#B42318]',
  approved: 'bg-[#EEF8F2] text-[#2F6C54]',
  reconciled: 'bg-[#EEF8F2] text-[#2F6C54]',
  pending_approval: 'bg-[#F1F5F7] text-[#4D5B66]',
  pending_safety_verification: 'bg-[#F1F5F7] text-[#4D5B66]',
  failed: 'bg-[#FFF0EF] text-[#B42318]',
  retrying: 'bg-[#F1F5F7] text-[#4D5B66]',
  billed: 'bg-[#EEF8F2] text-[#2F6C54]',
  charged: 'bg-[#EEF8F2] text-[#2F6C54]',
  credited: 'bg-[#EEF8F2] text-[#2F6C54]',
  completed: 'bg-[#EEF8F2] text-[#2F6C54]',
  default: 'bg-[#F1F5F7] text-[#66737F]'
};

function formatLabel(value: string | null | undefined) {
  if (!value) return 'Not Available';
  return value.replace(/_/g, ' ');
}

function positiveAmount(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function hasVerifiedFinancialPayout(summary?: FinancialTruthSummary | null) {
  return Boolean(
    summary &&
    summary.payout_status === 'paid' &&
    positiveAmount(summary.verified_paid_amount) !== null
  );
}

function hasPartialFinancialPayout(summary?: FinancialTruthSummary | null) {
  return Boolean(
    summary &&
    summary.payout_status === 'partially_paid' &&
    positiveAmount(summary.verified_paid_amount) !== null
  );
}

function hasVerifiedPayout(row: Pick<QueueRow, 'actual_payout_amount' | 'payout_proof_status'>, summary?: FinancialTruthSummary | null) {
  return hasVerifiedFinancialPayout(summary) ||
    positiveAmount(row.actual_payout_amount) !== null ||
    (row.payout_proof_status === 'verified' && positiveAmount(row.actual_payout_amount) !== null);
}

function sellerSafeText(value: string | null | undefined, fallback = 'Margin is holding this record until the next safe filing step is available.') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();

  if (
    lower.includes('redis') ||
    lower.includes('upstash') ||
    lower.includes('max requests') ||
    lower.includes('quota') ||
    lower.includes('dispatch queue') ||
    lower.includes('runtime')
  ) {
    return "Filing is temporarily paused because Margin's filing lane is at capacity. No Amazon submission is treated as complete from this paused state.";
  }

  return raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || fallback;
}

function formatSellerFilingStatus(row: Pick<QueueRow, 'filing_status' | 'eligibility_status' | 'eligible_to_file'>) {
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();
  const eligibilityStatus = String(row.eligibility_status || '').trim().toUpperCase();

  if (filingStatus === 'pending' && row.eligible_to_file === true && eligibilityStatus === 'READY') {
    return 'Ready to file';
  }

  if (filingStatus === 'pending') return 'Waiting for proof';
  if (filingStatus === 'submitting') return 'Being filed now';
  if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'resubmitted') return 'Filed';
  if (filingStatus === 'blocked') return 'Blocked';
  if (filingStatus === 'payment_required') return 'Payment required';
  if (filingStatus === 'pending_safety_verification') return 'Needs safety verification';
  if (filingStatus === 'failed') return 'Failed';
  if (filingStatus === 'retrying') return 'Ready to retry';

  return formatLabel(row.filing_status);
}

function filingTruthLine(row: Pick<QueueRow, 'filing_status' | 'eligibility_status' | 'eligible_to_file' | 'block_reasons' | 'last_error' | 'has_filing_truth'>) {
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();
  const eligibilityStatus = String(row.eligibility_status || '').trim().toUpperCase();
  const blockers = Array.isArray(row.block_reasons)
    ? row.block_reasons.slice(0, 2).map(formatDisputeReason).join(', ')
    : '';
  const lastError = sellerSafeText(row.last_error, '');

  if (filingStatus === 'pending' && row.eligible_to_file === true && eligibilityStatus === 'READY') {
    return 'Proof requirements are complete; this has not been submitted yet.';
  }

  if (filingStatus === 'submitting') {
    return 'Margin is actively submitting now; queued or pending states are not treated as filed.';
  }

  if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'resubmitted') {
    return row.has_filing_truth === true
      ? 'Amazon submission proof or an Amazon reference is recorded for this case.'
      : 'This is marked as filed internally, but no durable Amazon submission proof is recorded yet.';
  }

  if (filingStatus === 'payment_required') {
    return 'Payment is required before this can file.';
  }

  if (filingStatus === 'blocked' || filingStatus === 'pending_safety_verification' || row.eligible_to_file === false) {
    return blockers
      ? `Blocked until ${blockers.toLowerCase()} is cleared.`
      : lastError || 'Blocked until the recorded filing gate clears.';
  }

  return 'Margin will only file when the backend filing gate says this is safe.';
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
  return sellerSafeText(formatDisputeReason(value), formatDisputeReason(value));
}

function proofNeedFor(requirement: string, row: QueueRow) {
  const normalized = String(requirement || '').trim().toLowerCase();
  const caseContext = String(`${row.case_type || ''} ${row.anomaly_type || ''} ${row.rejection_category || ''}`).toLowerCase();
  const sourceRecord =
    caseContext.includes('inbound') || caseContext.includes('shipment') || caseContext.includes('warehouse') || caseContext.includes('transfer')
      ? 'shipment or receiving record tied to the units'
      : caseContext.includes('return') || caseContext.includes('refund')
        ? 'return, refund, or customer-order trail tied to the unit'
        : caseContext.includes('fee')
          ? 'fee event or settlement ledger entry tied to the charge'
          : 'invoice, inventory, shipment, return, or settlement record tied to this case';

  if (normalized === 'proof_snapshot') {
    return {
      title: 'Evidence decision snapshot',
      detail: 'Needs policy lane, quantity/value math, deadline check, and source links.'
    };
  }

  if (normalized === 'supporting_document' || normalized === 'missing_evidence_links') {
    return {
      title: 'Linked source document',
      detail: `Link a ${sourceRecord}.`
    };
  }

  if (normalized === 'unit_cost_proof' || normalized === 'missing_unit_cost_proof') {
    return {
      title: 'Invoice unit-cost proof',
      detail: 'Link an invoice or supplier document showing unit cost for the SKU/FNSKU/ASIN.'
    };
  }

  if (normalized.startsWith('document_type:')) {
    const documentType = formatRequirement(normalized.split(':')[1]);
    return {
      title: `Required document: ${documentType}`,
      detail: `Link a ${documentType.toLowerCase()} document before filing.`
    };
  }

  if (normalized.startsWith('document_family:')) {
    const family = normalized
      .split(':')[1]
      ?.split('|')
      .map(formatRequirement)
      .join(' or ');
    return {
      title: family ? `Required document family: ${family}` : 'Required document family',
      detail: family ? `Link one of these document types: ${family}.` : 'Link the required document family before filing.'
    };
  }

  if (normalized.includes('quantity')) {
    return {
      title: 'Quantity movement proof',
      detail: 'Link records showing units sent, received, refunded, adjusted, or reimbursed.'
    };
  }

  if (normalized.includes('identifier')) {
    return {
      title: 'Verified identifiers',
      detail: 'Add the SKU/FNSKU/ASIN, order ID, shipment ID, or Amazon case reference needed to support this case.'
    };
  }

  return {
    title: formatRequirement(requirement),
    detail: `Resolve this recorded evidence blocker: ${formatRequirement(requirement)}.`
  };
}

function proofNeedsFor(row: QueueRow) {
  return getMissingRequirements(row).map((requirement) => proofNeedFor(requirement, row));
}

function evidenceHeadline(row: QueueRow) {
  const missing = proofNeedsFor(row);
  const linkedCount = Number(row.matched_document_count || 0);

  if (missing.length > 0 && linkedCount === 0) return 'Source records';
  if (missing.length > 0) return 'Proof incomplete';
  if (linkedCount > 0) return 'Proof linked';
  return 'No proof linked';
}

function evidenceDetail(row: QueueRow) {
  const missing = proofNeedsFor(row);
  const linkedCount = Number(row.matched_document_count || 0);

  if (missing.length > 0) {
    return missing.slice(0, 2).map((item) => item.title).join(' + ');
  }

  if (linkedCount > 0) {
    return `${linkedCount} source document${linkedCount === 1 ? '' : 's'} linked.`;
  }

  return 'Link source records before filing.';
}

function sellerNextActionLabel(row: QueueRow, posture: FilingPosture) {
  const filingStatus = String(row.filing_status || '').trim().toLowerCase();
  const operationalState = String(row.operational_state || '').trim().toLowerCase();

  if (filingStatus === 'filed' && row.has_filing_truth !== true) return 'Verify filing proof';
  if (operationalState === 'deferred_explicit') return 'Paused before filing';
  if (operationalState === 'blocked_operational' || operationalState === 'failed_durable') return 'Filing temporarily paused';
  return posture.headline || sellerSafeText(row.next_action, 'Review this record');
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
      return 'text-[#66737F]';
    case 'Recovered':
      return 'text-[#2F6C54]';
    case 'Approved':
      return 'text-[#0B74DE]';
    case 'Filed':
      return 'text-[#0B74DE]';
    case 'Evidence':
      return 'text-[#4D5B66]';
    default:
      return 'text-[#66737F]';
  }
}

function getQueueProgressSnapshot(row: QueueRow, financialSummary?: FinancialTruthSummary | null): QueueProgressSnapshot {
  const billingStatus = String(row.billing_status || '').trim().toLowerCase();
  const evidenceState = String(row.evidence_state || '').trim().toLowerCase();
  const proofStatus = String(getProofStatus(row) || '').trim().toLowerCase();
  const hasEvidence = Number(row.matched_document_count || 0) > 0
    || ['filing_ready', 'manual_review', 'supportable_but_not_case_eligible'].includes(proofStatus)
    || ['matched', 'ready', 'usable', 'linked strongly'].includes(evidenceState);
  const hasFiled = row.has_filing_truth === true;
  const hasApproved = row.has_approval_truth === true;
  const hasRecovered = hasVerifiedPayout(row, financialSummary);
  const hasLegacyBilling = ['pending', 'completed', 'sent', 'charged', 'paid', 'credited'].includes(billingStatus);

  if (hasRecovered) return { label: 'Recovered', toneClass: queueProgressTone('Recovered') };
  if (hasLegacyBilling) return { label: 'Legacy billed', toneClass: queueProgressTone('Legacy billed') };
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
  const operationalSummary = sellerSafeText(summarizeOperationalExplanation(row.operational_explanation), '');
  const blockReasons = Array.isArray(row.block_reasons) ? row.block_reasons : [];
  const lastError = String(row.last_error || '').trim();
  const safeLastError = sellerSafeText(lastError, '');
  const proofStatus = getProofStatus(row);
  const missingRequirements = getMissingRequirements(row);
  const manualReviewReason = getManualReviewReason(row);
  const payoutProofStatus = getPayoutProofStatus(row);
  const quarantineReason = sellerSafeText(getQuarantineReason(row), '');
  const payoutVerified = hasVerifiedPayout(row, financialSummary);

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

  if (safeLastError) {
    risks.unshift(safeLastError);
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

  if (payoutVerified) {
    strengths.push('Payout verified');
  } else if (payoutProofStatus === 'awaiting_payout' && row.has_approval_truth === true) {
    strengths.push('Awaiting payout confirmation');
  } else if (payoutProofStatus === 'quarantined') {
    risks.push('Payout quarantined');
  }

  if (quarantineReason) {
    risks.push(quarantineReason);
  }

  if (row.has_approval_truth === true && row.expected_payout_date && row.approved_amount != null && positiveAmount(row.actual_payout_amount) === null) {
    strengths.push(`Est. payout ${formatCompactDate(row.expected_payout_date)}`);
  }

  if (payoutVerified && !financialSummary) {
    return {
      tone: 'resolved',
      headline: 'Payment verified',
      detail: `The payout has already been verified and tied back to this ${entityNoun} record.`,
      strengths: strengths.slice(0, 3),
      risks: []
    };
  }

  if (hasVerifiedFinancialPayout(financialSummary)) {
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

  if (hasPartialFinancialPayout(financialSummary)) {
    return {
      tone: 'in_flight',
      headline: 'Partial payment confirmed',
      detail: `Financial events show a partial payout. Keep this ${entityNoun} record open until the full amount is confirmed.`,
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (row.has_approval_truth === true && row.approved_amount != null && positiveAmount(row.actual_payout_amount) === null) {
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
      detail: safeLastError || 'Margin is holding this case because the current proof or filing state is not safe enough to submit.',
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

  if (filingStatus === 'payment_required') {
    return {
      tone: 'blocked',
      headline: 'Payment required',
      detail: 'Payment must be confirmed before Margin can file. This case will wait instead of filing silently.',
      strengths: strengths.slice(0, 2),
      risks: ['Payment gate']
    };
  }

  if (filingStatus === 'submitting') {
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
      headline: 'Being filed',
      detail: 'Margin is actively submitting this case now. The next state should be filed with proof, failed, or blocked with a reason.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if (['filed', 'recovering'].includes(filingStatus) || ['submitted', 'under review', 'in review'].includes(status)) {
    if (!hasRealDisputeCase) {
      return {
        tone: 'attention',
        headline: 'Not Available',
        detail: 'A backend-confirmed dispute case is not available for this detection row.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    if (row.has_filing_truth !== true) {
      return {
        tone: 'attention',
        headline: 'Filing proof missing',
        detail: 'This record has an internal filed state, but no durable Amazon submission proof or Amazon reference is recorded yet.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 3)
      };
    }
    return {
      tone: 'in_flight',
      headline: 'Filed / in Amazon review',
      detail: 'Submission has moved out of seller control. Keep submission proof and Amazon response tracking visible while Margin waits for the next update.',
      strengths: strengths.slice(0, 3),
      risks: risks.slice(0, 2)
    };
  }

  if ((row.has_rejection_truth === true && ['rejected', 'denied', 'lost'].includes(status)) || filingStatus === 'failed') {
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
      detail: safeLastError
        ? safeLastError
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
        detail: operationalSummary || 'Margin has scheduled this filing for another safe attempt.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    if (operationalState === 'deferred_explicit') {
      return {
        tone: 'attention',
        headline: 'Paused before filing',
        detail: operationalSummary || 'The case is supportable, but Margin has paused filing until the filing lane is ready.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 2)
      };
    }
    if (operationalState === 'blocked_operational' || operationalState === 'failed_durable') {
      return {
        tone: 'blocked',
        headline: operationalState === 'failed_durable' ? 'Filing needs attention' : 'Filing temporarily paused',
        detail: operationalSummary || 'Margin cannot safely send this filing yet. The case remains unsubmitted until the filing lane clears.',
        strengths: strengths.slice(0, 2),
        risks: risks.slice(0, 3)
      };
    }
    return {
      tone: 'ready',
      headline: 'Ready to file',
      detail: 'Proof requirements are complete. This case is ready to file, but it is not submitted until Agent 7 records submission proof.',
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
    ready: 'bg-[#EEF8F2] text-[#2F6C54]',
    attention: 'bg-[#F1F5F7] text-[#4D5B66]',
    blocked: 'bg-[#FFF0EF] text-[#B42318]',
    in_flight: 'bg-[#EDF5FF] text-[#0B74DE]',
    resolved: 'bg-[#EEF8F2] text-[#2F6C54]',
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
    <div className="border border-[#DCE8EE] bg-white">
      <div className="border-b border-[#E7EEF2] bg-[#F7FAFC] px-4 py-3 text-[12px] font-medium tracking-tight text-[#4D5B66]">{title}</div>
      <div className="divide-y divide-[#E7EEF2] px-4">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-start justify-between gap-4 py-3 last:pb-3">
            <span className="text-[11px] text-[#66737F]">{row.label}</span>
            <span className="max-w-[62%] text-right text-[11px] font-medium leading-5 tracking-tight text-[#182026]">{row.value}</span>
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
  const isDemoWorkspace = activeTenantSlug === 'demo-workspace';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filingInProgress, setFilingInProgress] = useState<Set<string>>(new Set());
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
      <PageLayout title="Dispute Queue" noPadding>
        <div className="platform-vitality-page min-h-screen bg-[#F9FAFB] text-[#111827]">
          <div className="container mx-auto px-8 pt-10 pb-20">
            <Card className="rounded-2xl border-[#E5E7EB] bg-white text-[#111827] shadow-[0_4px_20px_rgba(17,24,39,0.03)]">
              <CardContent className="p-8 space-y-3">
                <h1 className="text-xl font-sans font-bold text-[#111827] tracking-tight">Queue unavailable</h1>
                <p className="text-sm text-[#4B5563] font-sans">
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
    <PageLayout title="Dispute Queue" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] text-[#182026]">
        <div className="container mx-auto max-w-[1600px] space-y-6 px-6 pb-16 pt-7 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Filed case control</div>
              <h1 className="mt-2 font-lora text-[30px] font-normal tracking-tight text-[#182026]">Dispute queue</h1>
              <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#66737F]">
                Review what Amazon has received, what proof remains, what was approved, and whether the payout is verified.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              {latestQueueSignal ? (
                <div className="inline-flex items-center rounded-md border border-[#DCE8EE] bg-white px-3 py-1 text-[11px] font-medium tracking-tight text-[#4D5B66]">
                  {latestQueueSignal.label}
                  <span className="ml-2 text-[#8A99A5]">
                    {formatDistanceToNow(new Date(latestQueueSignal.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ) : null}
              <div className="text-[11px] text-[#66737F]">
                {summary.last_updated_at ? `Queue refreshed ${formatDistanceToNow(new Date(summary.last_updated_at), { addSuffix: true })}` : 'Queue update time unavailable'}
              </div>
              <Button
                onClick={refresh}
                className="h-9 rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:border-[#BFD8F6] hover:bg-[#F3F7FF] hover:text-[#0B74DE]"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-none border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
            <CardHeader className="border-b border-[#E7EEF2] bg-white px-5 py-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A5]" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search queue ID, claim number, Amazon case, store, order, SKU, ASIN, or rejection reason"
                      className="h-10 border-[#DCE8EE] bg-white pl-10 text-[12px] text-[#182026] placeholder:text-[#8A99A5] focus:border-[#0B74DE] focus:ring-[#0B74DE]/10"
                    />
                  </div>

                  <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[160px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={gateState} onValueChange={(value) => { setGateState(value); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[200px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Gate" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
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
                    <SelectTrigger className="h-10 w-[170px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Filing" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
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
                    <SelectTrigger className="h-10 w-[170px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Evidence" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="all">All evidence</SelectItem>
                      <SelectItem value="Missing Evidence">Missing Evidence</SelectItem>
                      <SelectItem value="Weak Evidence">Weak Evidence</SelectItem>
                      <SelectItem value="Matched">Matched</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="Needs Review">Needs Review</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={recoveryStatus} onValueChange={(value) => { setRecoveryStatus(value); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[180px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Recovery" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="all">All recovery</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={billingStatus} onValueChange={(value) => { setBillingStatus(value); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[180px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Billing" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="all">All billing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="charged">Charged</SelectItem>
                      <SelectItem value="credited">Credited</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={rejectionCategory} onValueChange={(value) => { setRejectionCategory(value); setPage(1); }}>
                    <SelectTrigger className="h-10 w-[200px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Rejection" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
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
                    <SelectTrigger className="h-10 w-[170px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="updated_at">Updated</SelectItem>
                      <SelectItem value="created_at">Created</SelectItem>
                      <SelectItem value="requested_amount">Requested Amount</SelectItem>
                      <SelectItem value="approved_amount">Approved Amount</SelectItem>
                      <SelectItem value="actual_payout_amount">Legacy Payout Field</SelectItem>
                      <SelectItem value="billed_amount">Legacy Billed Amount</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger className="h-10 w-[120px] border-[#DCE8EE] bg-white text-[11px] text-[#4D5B66]">
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                  <div className="text-[11px] text-[#66737F]">
                    {queueScopeLine}
                  </div>
                  {loading && rows.length > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] px-3 py-1 text-[11px] font-medium tracking-tight text-[#66737F]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Refreshing queue readiness
                    </div>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading && rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-[#66737F]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <div className="space-y-1">
                    <span className="block font-lora text-[20px] font-normal tracking-tight text-[#182026]">{queueLoadingState.title}</span>
                    <span className="block text-[12px] leading-5 text-[#66737F]">{queueLoadingState.detail}</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                  <AlertCircle className="h-5 w-5 text-[#B42318]" />
                  <div className="space-y-1">
                    <p className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">Dispute records could not be loaded.</p>
                    <p className="text-[12px] leading-5 text-[#66737F]">{error}</p>
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <FileText className="h-5 w-5 text-[#8A99A5]" />
                  <p className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">No filed cases match these filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1240px]">
                    <thead className="border-b border-[#E7EEF2] bg-[#F7FAFC]">
                      <tr className="text-left">
                        {['Recovery record', 'Filing and proof', 'Financial trail', 'Next controlled action', 'Last movement', ''].map((header) => (
                          <th key={header || 'actions'} className="px-5 py-3 text-[10px] font-medium tracking-tight text-[#66737F]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EEF2]">
                      {rows.map((row) => {
                        const isProcessing = row.linked_dispute_case_id ? filingInProgress.has(row.linked_dispute_case_id) : false;
                        const isDemoCase = isDemoWorkspace && String(row.case_number || row.dispute_case_id || '').startsWith('ACME-');
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
                        const evidenceNeeds = proofNeedsFor(row);
                        const evidenceStatus = evidenceHeadline(row);
                        const progressSnapshot = getQueueProgressSnapshot(row, financialSummary);
                        const approvedAmount = row.has_approval_truth === true ? row.approved_amount : null;
                        const safeDecisionExplanation = sellerSafeText(decisionExplanation, '');
                        const safeManualReviewReason = getManualReviewReason(row)
                          ? proofNeedFor(getManualReviewReason(row) || '', row).title
                          : null;
                        const safeQuarantineReason = sellerSafeText(getQuarantineReason(row), '');
                        const nextActionLabel = sellerNextActionLabel(row, posture);
                        const displayedStatus = isDemoCase ? 'In progress' : formatLabel(row.status);
                        const displayedGate = isDemoCase ? 'Active review' : gateState?.label;
                        const displayedFiling = isDemoCase ? 'Submitted — awaiting response' : formatSellerFilingStatus(row);

                      return (
                        <tr key={row.dispute_case_id} className="align-top transition-colors hover:bg-[#F7FAFC]">
                            <td className="px-5 py-4">
                              <div className="min-w-[210px] space-y-2">
                                <div className="text-[10px] font-medium tracking-tight text-[#8A99A5]">Recovery record</div>
                                {canOpenCaseDetail ? (
                                  <Link to={`/recoveries/${row.dispute_case_id}`} state={{ claim: row }} className="inline-flex items-center gap-2 text-[13px] font-medium tracking-tight text-[#0B74DE] hover:text-[#0968C8]">
                                    {recordIdentifier}
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center gap-2 text-[13px] font-medium tracking-tight text-[#4D5B66]">
                                    {recordIdentifier}
                                  </span>
                                )}
                                <div className="text-[11px] leading-5 text-[#66737F]">
                                  {recordType} · {row.store_name || 'Amazon recovery record'}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className={cn(CASE_BADGE_BASE, 'bg-[#F1F5F7] text-[#66737F]')}>
                                    {hasRealDisputeCase ? 'Dispute case' : 'Detection record'}
                                  </Badge>
                                  {threadBackfilled ? (
                                    <Badge variant="outline" className={cn(CASE_BADGE_BASE, 'bg-[#F1F5F7] text-[#66737F]')}>Amazon thread</Badge>
                                  ) : null}
                                </div>
                                <div className="border-t border-[#E7EEF2] pt-2 text-[10px] tracking-tight text-[#66737F]">
                                  <span className="text-[#8A99A5]">Progress:</span>{' '}
                                  <span className={cn('font-medium', isDemoCase ? 'text-[#0B74DE]' : progressSnapshot.toneClass)}>{isDemoCase ? 'In progress · Investigated → Evidence prepared → Approved → Submitted' : progressSnapshot.label}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[235px] space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  <Badge variant="outline" className={cn(CASE_BADGE_BASE, badgeClass(isDemoCase ? 'pending' : row.status))}>Status: {displayedStatus}</Badge>
                                  {gateState ? (
                                    <Badge variant="outline" className={cn(CASE_BADGE_BASE, postureBadgeClass(gateState.tone))}>Gate: {displayedGate}</Badge>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-[#4D5B66]">Filing: {displayedFiling}</div>
                                <div className="border-t border-[#E7EEF2] pt-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <Badge variant="outline" className={cn('w-fit max-w-full', CASE_BADGE_BASE, badgeClass(row.evidence_state))}>{evidenceStatus}</Badge>
                                    <span className="text-[10px] text-[#8A99A5]">{row.matched_document_count ? `${row.matched_document_count} source docs` : 'No source docs'}</span>
                                  </div>
                                  <p className="mt-1.5 text-[11px] leading-5 text-[#66737F]">{evidenceNeeds[0]?.title || evidenceDetail(row)}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[210px] space-y-2">
                                <div className="grid grid-cols-3 gap-3 text-[10px]">
                                  <div><div className="text-[#8A99A5]">Requested</div><div className="mt-1 font-medium text-[#182026]">{formatMoney(row.requested_amount, row.currency)}</div></div>
                                  <div><div className="text-[#8A99A5]">Approved</div><div className="mt-1 font-medium text-[#182026]">{formatMoney(approvedAmount, row.currency)}</div></div>
                                  <div><div className="text-[#8A99A5]">Paid</div><div className="mt-1 font-medium text-[#182026]">{formatMoney(financialSummary?.verified_paid_amount, row.currency)}</div></div>
                                </div>
                                <div className="border-t border-[#E7EEF2] pt-2">
                                  <Badge variant="outline" className={cn(CASE_BADGE_BASE, 'bg-[#F1F5F7] text-[#4D5B66]')}>Payout: {financialStatusLabel(financialSummary?.payout_status)}</Badge>
                                  <p className="mt-1.5 text-[10px] leading-4 text-[#66737F]">{financialStatusDetail(financialSummary)}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[270px] space-y-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="text-[13px] font-medium tracking-tight text-[#182026]">{isDemoCase ? 'Margin will monitor and follow up.' : nextActionLabel}</p>
                                  <Badge variant="outline" className={cn(CASE_BADGE_BASE, postureBadgeClass(posture.tone))}>{posture.headline}</Badge>
                                </div>
                                <p className="text-[11px] leading-5 text-[#4D5B66]">{posture.detail}</p>
                                {isDemoCase ? <div className="flex flex-wrap items-center gap-1.5"><span className="whitespace-nowrap rounded-full bg-[#F1F5F7] px-2 py-1 text-[10px] font-normal leading-4 text-[#4D5B66]">Amazon response: Awaiting response</span><span className="whitespace-nowrap rounded-full bg-[#F1F5F7] px-2 py-1 text-[10px] font-normal leading-4 text-[#4D5B66]">Seller action: none required</span></div> : null}
                                <p className="text-[11px] leading-5 text-[#66737F]">{filingTruthLine(row)}</p>
                                {safeDecisionExplanation ? <p className="text-[10px] leading-4 text-[#8A99A5]">Context: {safeDecisionExplanation}</p> : null}
                                {(posture.strengths.length || posture.risks.length) ? (
                                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                                    {posture.strengths.slice(0, 1).map((item) => <span key={`${row.dispute_case_id}-strength-${item}`} className="rounded-full bg-[#EEF8F2] px-2 py-1 font-normal leading-4 text-[#2F6C54]">Verified: {item}</span>)}
                                    {posture.risks.slice(0, 1).map((item) => <span key={`${row.dispute_case_id}-risk-${item}`} className="rounded-full bg-[#F1F5F7] px-2 py-1 font-normal leading-4 text-[#4D5B66]">Watch: {item}</span>)}
                                  </div>
                                ) : null}
                                {(safeManualReviewReason || safeQuarantineReason) ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {safeManualReviewReason ? <span className="rounded-full bg-[#F1F5F7] px-2 py-1 text-[10px] font-normal leading-4 text-[#4D5B66]">Review: {safeManualReviewReason}</span> : null}
                                    {safeQuarantineReason ? <span className="rounded-full bg-[#FFF0EF] px-2 py-1 text-[10px] font-normal leading-4 text-[#B42318]">Held: {safeQuarantineReason}</span> : null}
                                  </div>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="min-w-[160px] space-y-1 text-[11px] text-[#66737F]">
                                <div className="text-[10px] font-medium tracking-tight text-[#8A99A5]">Last movement</div>
                                <div className="text-[12px] font-medium tracking-tight text-[#182026]">
                                  {row.updated_at ? formatDistanceToNow(new Date(row.updated_at), { addSuffix: true }) : 'Not Available'}
                                </div>
                                <div>{row.updated_at ? format(new Date(row.updated_at), 'yyyy/MM/dd HH:mm') : 'Not Available'}</div>
                                {isRecentTimestamp(row.updated_at) ? (
                                  <Badge variant="outline" className={cn('w-fit', CASE_BADGE_BASE, 'bg-[#F1F5F7] text-[#66737F]')}>
                                    Recently updated
                                  </Badge>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end min-w-[88px]">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-md border border-[#DCE8EE] bg-white text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56 rounded-md border border-[#DCE8EE] bg-white p-1 shadow-[0_12px_32px_rgba(24,32,38,0.10)]">
                                    <div className="mb-1 border-b border-[#E7EEF2] px-3 py-2 text-[11px] font-medium tracking-tight text-[#66737F]">Record actions</div>
                                    {canOpenCaseDetail ? (
                                      <DropdownMenuItem asChild className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                                        <Link to={`/recoveries/${row.dispute_case_id}`} state={{ claim: row }}>{openRecordLabel}</Link>
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        disabled
                                        className="rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#8A99A5]"
                                      >
                                        {getActionAvailabilityText(row, 'open_record', false, openRecordLabel)}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      disabled={!canOpenBrief}
                                      className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                      onClick={() => handleBriefPreview(row)}
                                    >
                                      {getActionAvailabilityText(row, 'brief', canOpenBrief, 'Brief PDF')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={!canOpenCaseDetail}
                                      className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                      onClick={() => openCaseDetails(row)}
                                    >
                                      {getActionAvailabilityText(row, 'details', canOpenCaseDetail, recordDetailsLabel)}
                                    </DropdownMenuItem>
                                    {actionButton ? (
                                      <DropdownMenuItem
                                        className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                        disabled={isProcessing}
                                        onClick={() => handleFilingAction(row, actionButton.mode)}
                                      >
                                        {isProcessing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                                        {actionButton.label}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        disabled
                                        className="rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#8A99A5]"
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
            <div className="text-[11px] text-[#66737F]">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border-[#DCE8EE] bg-white text-[#4D5B66] hover:bg-[#F7FAFC]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="border-[#DCE8EE] bg-white text-[#4D5B66] hover:bg-[#F7FAFC]"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl border border-[#DCE8EE] bg-[#FAFAF7] p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.14)]">
          <DialogHeader className="border-b border-[#E7EEF2] bg-white px-6 pb-5 pt-6">
            <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Case record</div>
            <DialogTitle className="mt-2 font-lora text-[26px] font-normal tracking-tight text-[#182026]">
              {detailsRow ? getQueueRecordIdentifier(detailsRow) : 'Not Available'}
            </DialogTitle>
            {detailsRow ? (
              <div className="pt-2 text-[11px] leading-5 text-[#66737F]">
                {getQueueReferenceLabel(detailsRow)} · Entity: {getQueueEntityLabel(detailsRow)} · Origin: {formatCaseOrigin(detailsRow.case_origin)} · Filing: {detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : formatSellerFilingStatus(detailsRow)} · Recovery: {formatLabel(detailsRow.recovery_status)}
              </div>
            ) : null}
          </DialogHeader>
          {detailsRow ? (() => {
            const financialSummary = detailsFinancialSummary || getFinancialSummaryForRow(detailsRow, financialSummaries);
            const hasRealDisputeCase = getQueueEntityKind(detailsRow) === 'dispute_case';
            const detailsProofStatus = getProofStatus(detailsRow);
            const detailsPayoutProofStatus = getPayoutProofStatus(detailsRow);
            const detailsMissingRequirements = getMissingRequirements(detailsRow);
            const detailsProofNeeds = proofNeedsFor(detailsRow);
            const detailsPosture = deriveFilingPosture(detailsRow, financialSummary);
            return (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto bg-[#FAFAF7] px-6 py-5">
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
                  { label: 'Filing Status', value: formatSellerFilingStatus(detailsRow) },
                  { label: 'Eligibility', value: formatEligibilityStatus(detailsRow.eligibility_status) },
                  { label: 'Filing Strategy', value: detailsRow.filing_strategy ? formatAutonomyLabel(detailsRow.filing_strategy) : 'Not Available' },
                  { label: 'Runtime State', value: detailsRow.operational_state ? formatAutonomyLabel(detailsRow.operational_state) : 'Not Available' },
                  { label: 'Recovery Status', value: formatLabel(detailsRow.recovery_status) },
                  { label: 'Billing Status', value: formatLabel(detailsRow.billing_status) },
                  { label: 'Proof Status', value: formatProofStatus(detailsProofStatus) },
                  { label: 'Payout Proof', value: formatPayoutProofStatus(detailsPayoutProofStatus) },
                  { label: 'Financial Status', value: financialStatusLabel(financialSummary?.payout_status) },
                  { label: 'Next Action', value: sellerNextActionLabel(detailsRow, detailsPosture) },
                  { label: 'Filing State', value: filingTruthLine(detailsRow) },
                ]}
              />
              <DetailSection
                title="Filing Posture"
                rows={[
                  { label: 'Posture', value: detailsPosture.headline },
                  { label: 'Detail', value: detailsPosture.detail },
                  { label: 'Decision Explanation', value: sellerSafeText(summarizeExplanationPayload(detailsRow.explanation_payload), 'Not Available') },
                  { label: 'Filing Lane Note', value: sellerSafeText(summarizeOperationalExplanation(detailsRow.operational_explanation), 'Not Available') },
                  { label: 'Eligible To File', value: detailsRow.eligible_to_file == null ? 'Not Available' : detailsRow.eligible_to_file ? 'Yes' : 'No' },
                  { label: 'Block Reasons', value: detailsRow.block_reasons?.length ? detailsRow.block_reasons.map(formatBlockReason).join(', ') : 'Not Available' },
                  { label: 'Last Filing Note', value: sellerSafeText(detailsRow.last_error, 'Not Available') },
                  { label: 'Required Proof', value: detailsProofNeeds.length ? detailsProofNeeds.map((item) => item.title).join(', ') : formatRequirementList(detailsMissingRequirements) },
                  { label: 'Manual Review Reason', value: getManualReviewReason(detailsRow) ? proofNeedFor(getManualReviewReason(detailsRow) || '', detailsRow).title : 'Not Available' },
                  { label: 'Hold Reason', value: sellerSafeText(getQuarantineReason(detailsRow), 'Not Available') },
                ]}
              />
              <DetailSection
                title="Money"
                rows={[
                  { label: 'Requested Amount', value: formatMoney(detailsRow.requested_amount, detailsRow.currency) },
                  { label: 'Amazon Approval', value: formatMoney(detailsRow.has_approval_truth === true ? detailsRow.approved_amount : null, detailsRow.currency) },
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
                  { label: 'Evidence State', value: evidenceHeadline(detailsRow) },
                  { label: 'Source Docs Linked', value: String(detailsRow.matched_document_count ?? 0) },
                  { label: 'Proof Status', value: formatProofStatus(detailsProofStatus) },
                  { label: 'Payout Proof', value: formatPayoutProofStatus(detailsPayoutProofStatus) },
                  { label: 'Still Needed', value: detailsProofNeeds.length ? detailsProofNeeds.map((item) => `${item.title}: ${item.detail}`).join(' ') : formatRequirementList(detailsMissingRequirements) },
                  { label: 'Rejection Category', value: detailsRow.rejection_category || 'Not Available' },
                  { label: 'Rejection Reason', value: detailsRow.rejection_reason || 'Not Available' },
                ]}
              />
              <div className="border border-[#DCE8EE] bg-white p-4">
                <div className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Evidence detail</div>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn('border', badgeClass(detailsRow.evidence_state))}>
                      {detailsRow.evidence_state || 'Not Available'}
                    </Badge>
                    {detailsProofStatus ? (
                      <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]">
                        Proof: {formatProofStatus(detailsProofStatus)}
                      </Badge>
                    ) : null}
                    {detailsPayoutProofStatus && detailsPayoutProofStatus !== 'not_applicable' ? (
                      <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]">
                        Payout Proof: {formatPayoutProofStatus(detailsPayoutProofStatus)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2 text-[11px] font-sans">
                    <div className="flex items-start justify-between gap-4 border-b border-[#E7EEF2] pb-2">
                      <span className="text-[#8A99A5]">Source docs linked</span>
                      <span className="text-right font-medium tracking-tight text-[#182026]">
                        {String(detailsRow.matched_document_count ?? 0)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[#8A99A5]">Still needed</div>
                      {detailsProofNeeds.length ? (
                        <div className="flex flex-wrap gap-2">
                          {detailsProofNeeds.map((requirement) => (
                            <span
                              key={`detail-missing-${detailsRow.dispute_case_id}-${requirement.title}`}
                              className="rounded-md border border-[#DCE8EE] bg-[#F7FAFC] px-2.5 py-1 text-[10px] font-medium tracking-tight text-[#4D5B66]"
                            >
                              {requirement.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] leading-5 text-[#66737F]">No missing requirements recorded.</div>
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
              <div className="border border-[#DCE8EE] bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Financial events</div>
                  {detailsFinancialLoading ? <div className="text-[11px] text-[#8A99A5]">Loading proof…</div> : null}
                </div>
                <div className="mt-4 space-y-3">
                  {!detailsFinancialLoading && detailsFinancialEvents.length === 0 ? (
                    <div className="text-[11px] font-medium tracking-tight text-[#66737F]">No payout recorded yet.</div>
                  ) : detailsFinancialEvents.map((event) => (
                    <div key={event.event_id} className="border border-[#E7EEF2] bg-[#FAFAF7] p-4">
                      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="text-[11px] font-medium tracking-tight text-[#182026]">{labelFinancialEventType(event.event_type, event.event_subtype)}</div>
                          <div className="mt-1 text-[10px] font-medium tracking-tight text-[#8A99A5]">
                            {financialSourceLabel(event.source)} · {event.event_date ? format(new Date(event.event_date), 'yyyy/MM/dd HH:mm') : 'No event date'}
                          </div>
                        </div>
                        <div className="text-[12px] font-medium tracking-tight text-[#182026]">{formatMoney(event.amount, event.currency)}</div>
                      </div>
                      <div className="mt-3 grid gap-2 text-[10px] leading-4 text-[#66737F] xl:grid-cols-2">
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
        <DialogContent className="grid h-[94vh] w-[98vw] max-w-none gap-0 overflow-hidden border border-[#DCE8EE] bg-[#FAFAF7] p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.14)] sm:rounded-none [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{briefPreviewRow?.case_number || 'Dispute Brief'}</DialogTitle>
          </DialogHeader>

          <div className="relative h-full w-full">
            <div className="pointer-events-none absolute left-6 top-5 z-10 max-w-[60vw] space-y-1">
              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Brief PDF preview</div>
              <div className="truncate font-lora text-[24px] font-normal tracking-tight text-[#182026]">
                {briefPreviewRow?.case_number || 'Dispute Brief'}
              </div>
            </div>

            <div className="absolute right-6 top-5 z-10 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!briefPreviewUrl}
                onClick={downloadBriefPreview}
                className="h-9 rounded-md border border-[#DCE8EE] bg-white px-3 text-[#4D5B66] hover:bg-[#F3F7FF] hover:text-[#0B74DE]"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeBriefPreview}
                className="h-9 rounded-md border border-[#DCE8EE] bg-white px-3 text-[#4D5B66] hover:bg-[#F3F7FF] hover:text-[#0B74DE]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex h-full items-center justify-center px-3 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
              {briefPreviewLoading ? (
                <div className="flex h-full w-full items-center justify-center gap-3 text-[12px] text-[#66737F]">
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
                <div className="flex h-full w-full items-center justify-center px-8 text-center text-[12px] text-[#66737F]">
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
