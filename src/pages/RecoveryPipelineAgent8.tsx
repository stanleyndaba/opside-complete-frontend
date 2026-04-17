import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { useToast } from '@/hooks/use-toast';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';
import { RefreshCw, AlertTriangle, ArrowUpRight, MoreHorizontal, Search } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { formatAutonomyLabel, summarizeMatchExplanation } from '@/lib/autonomyTruth';
import { cn } from '@/lib/utils';
import {
  financialSourceLabel,
  financialStatusDetail,
  financialStatusLabel,
  financialStatusTone,
  labelFinancialEventType,
  type FinancialTruthEvent,
  type FinancialTruthSummary
} from '@/lib/financialTruth';

type Blocker = { key: string; label: string; count: number; severity: 'low' | 'medium' | 'high' };
type Summary = {
  approved_count: number;
  pending_payout_count: number;
  reconciled_count: number;
  partial_recovery_count: number;
  unreconciled_count: number;
  investigation_required_count: number;
  billing_pending_count: number;
  verified_paid_count: number | null;
  partial_paid_count: number | null;
  awaiting_payout_queue_count: number | null;
  verified_paid_total: number | null;
  awaiting_payout_total: number | null;
  approved_total: number | null;
  outstanding_total: number | null;
  summary_currency: string | null;
  recovered_cash_total: number;
  approved_value_total: number;
  pending_payout_total: number;
  billed_revenue_total: number;
  last_updated_at: string | null;
  blockers: Blocker[];
};
type Row = {
  row_type: 'dispute_case_projection' | 'detection_projection' | null;
  entity_type: 'dispute_case' | 'detection' | null;
  has_real_dispute_case: boolean | null;
  linked_dispute_case_id: string | null;
  has_real_recovery_record: boolean | null;
  recovery_record_id: string | null;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  expected_payout_source: 'approved_pending' | 'detection_estimate' | 'unavailable' | null;
  actual_payout_source: 'verified_financial_event' | 'legacy_case_field' | 'unavailable' | null;
  case_number: string;
  provider_case_id: string | null;
  merchant_reference: string | null;
  status: string | null;
  filing_status?: string | null;
  recovery_status: string | null;
  billing_status: string | null;
  block_reasons?: string[];
  last_error?: string | null;
  approved_amount: number | null;
  actual_payout_amount: number | null;
  expected_payout_amount: number | null;
  billed_revenue_amount: number | null;
  reconciliation_status: 'pending_payout' | 'partial_recovery' | 'reconciled' | null;
  reconciliation_source: 'canonical_financial_truth' | 'projected_legacy_case_field' | 'detection_estimate' | 'unavailable' | null;
  payout_status: 'not_paid' | 'partially_paid' | 'paid' | null;
  outstanding_amount: number | null;
  variance_amount: number | null;
  reconciliation_strategy?: 'AUTO_MATCH' | 'SMART_MATCH' | 'QUARANTINED' | null;
  match_explanation?: {
    competing_candidates?: number;
    selected_basis?: string;
    confidence?: number;
  } | null;
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
  recovery_work_max_attempts?: number | null;
  billing_work_max_attempts?: number | null;
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
  recovery_execution_processed_at?: string | null;
  billing_execution_processed_at?: string | null;
  recovery_next_attempt_at?: string | null;
  billing_next_attempt_at?: string | null;
  recovery_locked_by?: string | null;
  billing_locked_by?: string | null;
  recovery_lifecycle_state?: string | null;
  billing_lifecycle_state?: string | null;
  recovery_operational_state?: string | null;
  billing_operational_state?: string | null;
  recovery_operational_explanation?: {
    reason?: string;
    retry_at?: string;
    blocking_guard?: string;
    next_action?: string;
  } | null;
  billing_operational_explanation?: {
    reason?: string;
    retry_at?: string;
    blocking_guard?: string;
    next_action?: string;
  } | null;
  recovery_work_payload?: Record<string, any> | null;
  billing_work_payload?: Record<string, any> | null;
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

type FinancialMap = Record<string, FinancialTruthSummary>;
type CaseBasisSellerSummary = {
  title?: string;
  summary?: string;
  event_label?: string;
  recoverability_reason?: string;
  evidence_summary?: string;
};
type CaseBasisPolicy = {
  key?: string;
  title?: string;
  verification_status?: string;
  source_name?: string;
  source_url?: string;
  last_verified_at?: string | null;
  summary?: string;
  required_evidence?: string[];
};
type CaseBasisMovement = {
  state?: string;
  label?: string;
  detail?: string;
  next_action_label?: string;
  dispute_case_id?: string | null;
  case_number?: string | null;
  amazon_case_id?: string | null;
  filing_status?: string | null;
  case_state?: string | null;
  eligibility_status?: string | null;
  block_reasons?: string[];
};
type CaseBasisTruth = {
  seller_summary?: CaseBasisSellerSummary | null;
  policy_basis?: CaseBasisPolicy | null;
  filing_movement?: CaseBasisMovement | null;
  review_tier?: string | null;
  claim_readiness?: string | null;
  recommended_action?: string | null;
  value_label?: string | null;
  why_not_claim_ready?: string | null;
  coverage_family?: string | null;
};
type CaseBasisDetail = {
  id?: string;
  case_number?: string;
  claim_number?: string;
  title?: string;
  details?: string | null;
  status?: string | null;
  currency?: string | null;
  amount?: number | string | null;
  guaranteedAmount?: number | string | null;
  estimated_value?: number | string | null;
  approved_amount?: number | string | null;
  expected_payout_amount?: number | string | null;
  finding_truth?: CaseBasisTruth | null;
  seller_summary?: CaseBasisSellerSummary | null;
  policy_basis?: CaseBasisPolicy | null;
  filing_movement?: CaseBasisMovement | null;
  review_tier?: string | null;
  claim_readiness?: string | null;
  recommended_action?: string | null;
  value_label?: string | null;
  why_not_claim_ready?: string | null;
  coverage_family?: string | null;
  next_action_label?: string | null;
};

const PAGE_SIZE = 10;
const NOT_AVAILABLE = 'Not Available';
const statusOptions = [['all', 'All Recovery States'], ['waiting_for_payout', 'Waiting For Payout'], ['recovery_processing', 'Recovery Processing'], ['payout_detected_not_reconciled', 'Payout Detected'], ['partial_payout_review', 'Partial Recovery'], ['billing_pending', 'Billing Pending'], ['billing_processing', 'Billing Processing'], ['billing_complete', 'Billing Complete'], ['investigation_required', 'Investigation Required']];
const reconciliationOptions = [['all', 'All Reconciliation States'], ['pending_payout', 'Pending Payout'], ['payout_detected', 'Payout Detected'], ['partial_recovery', 'Partial Recovery'], ['reconciled', 'Reconciled'], ['unknown', 'Unknown']];
const billingOptions = [['all', 'All Billing States'], ['pending', 'Pending'], ['sent', 'Sent'], ['charged', 'Charged'], ['credited', 'Credited'], ['paid', 'Paid']];
const sortOptions = [['last_updated_at', 'Last Updated'], ['actual_payout_amount', 'Legacy Payout Field'], ['approved_amount', 'Approved Value'], ['expected_payout_amount', 'Projected Pending Payout'], ['case_number', 'Case Reference']];
const dateRanges = [['30', 'Last 30 Days'], ['90', 'Last 90 Days'], ['365', 'This Year'], ['all', 'All Time']];

const money = (value: number | null | undefined, currency = 'USD') =>
  typeof value === 'number' && !Number.isNaN(value)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    : NOT_AVAILABLE;

const summaryMoney = (value: number | null | undefined, currency: string | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) && currency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    : NOT_AVAILABLE;

const stamp = (value: string | null | undefined) => {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};

const label = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()) : NOT_AVAILABLE;

function rowTypeLabel(value: Row['row_type'] | null | undefined): string {
  switch (value) {
    case 'dispute_case_projection':
      return 'Dispute Case Projection';
    case 'detection_projection':
      return 'Detection Projection';
    default:
      return NOT_AVAILABLE;
  }
}

function entityTypeLabel(value: Row['entity_type'] | null | undefined): string {
  switch (value) {
    case 'dispute_case':
      return 'Dispute Case';
    case 'detection':
      return 'Detection';
    default:
      return NOT_AVAILABLE;
  }
}

function isSyntheticOpportunityReference(
  row: Pick<Row, 'entity_type' | 'row_type' | 'case_number'>
): boolean {
  if (row.entity_type !== 'detection' && row.row_type !== 'detection_projection') {
    return false;
  }
  return String(row.case_number || '').trim().toUpperCase().startsWith('OPP-');
}

function displayIdentityLabel(
  row: Pick<Row, 'row_type' | 'entity_type' | 'has_real_recovery_record' | 'has_real_dispute_case'>
): string {
  if (row.row_type === 'detection_projection' || row.entity_type === 'detection') {
    return 'Detection Projection';
  }
  if (row.has_real_recovery_record === true) {
    return 'Recovery-Linked Case';
  }
  if (row.row_type === 'dispute_case_projection' || row.has_real_dispute_case === true) {
    return 'Dispute Case Projection';
  }
  return NOT_AVAILABLE;
}

function identityMetaLabel(
  row: Pick<Row, 'row_type' | 'entity_type' | 'has_real_recovery_record' | 'has_real_dispute_case'>
): string {
  const entity = entityTypeLabel(row.entity_type);
  const displayIdentity = displayIdentityLabel(row);

  if (entity === NOT_AVAILABLE) return displayIdentity;
  if (displayIdentity === NOT_AVAILABLE) return entity;
  return `${entity} · ${displayIdentity}`;
}

function recordReferenceLabel(
  row: Pick<Row, 'entity_type' | 'row_type' | 'has_real_recovery_record' | 'case_number'>
): string {
  if (isSyntheticOpportunityReference(row)) {
    return 'Synthetic Opportunity Reference';
  }
  if (row.entity_type === 'detection' || row.row_type === 'detection_projection') {
    return 'Opportunity Reference';
  }
  if (row.has_real_recovery_record === true) {
    return 'Recovery-Linked Case Reference';
  }
  if (row.entity_type === 'dispute_case') {
    return 'Case Reference';
  }
  return 'Record Reference';
}

function payoutSourceLabel(value: Row['expected_payout_source'] | Row['actual_payout_source'] | null | undefined): string {
  switch (value) {
    case 'approved_pending':
      return 'Approved Pending';
    case 'detection_estimate':
      return 'Detection Estimate';
    case 'verified_financial_event':
      return 'Verified Financial Event';
    case 'legacy_case_field':
      return 'Legacy Case Field';
    case 'unavailable':
      return NOT_AVAILABLE;
    default:
      return NOT_AVAILABLE;
  }
}

function reconciliationSourceLabel(value: Row['reconciliation_source'] | null | undefined): string {
  switch (value) {
    case 'canonical_financial_truth':
      return 'Canonical Financial Truth';
    case 'projected_legacy_case_field':
      return 'Projected Legacy Case Field';
    case 'detection_estimate':
      return 'Detection Estimate';
    case 'unavailable':
      return NOT_AVAILABLE;
    default:
      return NOT_AVAILABLE;
  }
}

function visiblePayoutStatusLabel(value: Row['payout_status'] | null | undefined): string {
  return value ? financialStatusLabel(value) : NOT_AVAILABLE;
}

function visiblePayoutStatusTone(value: Row['payout_status'] | null | undefined): string {
  return value ? financialStatusTone(value) : 'border-white/10 bg-white/[0.04] text-white/60';
}

function isUnavailableDisplay(value: string | null | undefined): boolean {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized === 'not available' || normalized === 'unavailable';
}

function hasNumericValue(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function reconciliationTruthDetail(
  row: Pick<
    Row,
    | 'reconciliation_source'
    | 'reconciliation_status'
    | 'payout_status'
    | 'expected_payout_source'
    | 'actual_payout_source'
    | 'outstanding_amount'
    | 'variance_amount'
  >
): string {
  if (row.reconciliation_source === 'canonical_financial_truth') {
    if (row.reconciliation_status === 'reconciled' || row.payout_status === 'paid') {
      return 'Confirmed financial events show this payout has been reconciled.';
    }
    if (row.reconciliation_status === 'partial_recovery' || row.payout_status === 'partially_paid') {
      return 'Confirmed financial events show a partial payout, with value still outstanding.';
    }
    if (row.reconciliation_status === 'pending_payout' || row.payout_status === 'not_paid') {
      return 'Confirmed financial events show this row is awaiting payout and is not financially final yet.';
    }
    return 'This reconciliation view is backed by confirmed financial events.';
  }

  if (row.reconciliation_source === 'projected_legacy_case_field' || row.actual_payout_source === 'legacy_case_field') {
    return 'This row uses legacy dispute-case payout data and is not yet confirmed by financial events.';
  }

  if (row.reconciliation_source === 'detection_estimate' || row.expected_payout_source === 'detection_estimate') {
    return 'This row reflects a detection estimate only, not a confirmed payout.';
  }

  if (row.expected_payout_source === 'approved_pending') {
    return 'An expected payout is shown, but no reliable reconciliation or payout confirmation is available yet.';
  }

  return 'No reliable reconciliation or payout truth is available yet.';
}

function hasRecoveryWorkEntity(
  row: Pick<
    Row,
    | 'recovery_work_item_id'
    | 'recovery_work_status'
    | 'recovery_execution_lane'
    | 'recovery_last_runtime_role'
    | 'recovery_locked_by'
    | 'recovery_lifecycle_state'
    | 'recovery_operational_state'
    | 'recovery_operational_explanation'
    | 'recovery_work_payload'
    | 'recovery_last_deferred_reason'
    | 'recovery_last_processed_at'
    | 'recovery_last_claimed_at'
    | 'recovery_execution_processed_at'
    | 'recovery_next_attempt_at'
    | 'recovery_work_error'
  >
): boolean {
  return Boolean(
    row.recovery_work_item_id ||
    row.recovery_work_status ||
    row.recovery_execution_lane ||
    row.recovery_last_runtime_role ||
    row.recovery_locked_by ||
    row.recovery_lifecycle_state ||
    row.recovery_operational_state ||
    row.recovery_operational_explanation ||
    row.recovery_work_payload ||
    row.recovery_last_deferred_reason ||
    row.recovery_last_processed_at ||
    row.recovery_last_claimed_at ||
    row.recovery_execution_processed_at ||
    row.recovery_next_attempt_at ||
    row.recovery_work_error
  );
}

function hasBillingWorkEntity(
  row: Pick<
    Row,
    | 'billing_work_item_id'
    | 'billing_work_status'
    | 'billing_execution_lane'
    | 'billing_last_runtime_role'
    | 'billing_locked_by'
    | 'billing_lifecycle_state'
    | 'billing_operational_state'
    | 'billing_operational_explanation'
    | 'billing_work_payload'
    | 'billing_last_deferred_reason'
    | 'billing_last_processed_at'
    | 'billing_last_claimed_at'
    | 'billing_execution_processed_at'
    | 'billing_next_attempt_at'
    | 'billing_work_error'
  >
): boolean {
  return Boolean(
    row.billing_work_item_id ||
    row.billing_work_status ||
    row.billing_execution_lane ||
    row.billing_last_runtime_role ||
    row.billing_locked_by ||
    row.billing_lifecycle_state ||
    row.billing_operational_state ||
    row.billing_operational_explanation ||
    row.billing_work_payload ||
    row.billing_last_deferred_reason ||
    row.billing_last_processed_at ||
    row.billing_last_claimed_at ||
    row.billing_execution_processed_at ||
    row.billing_next_attempt_at ||
    row.billing_work_error
  );
}

function runtimeCounterValue(value: number | null | undefined, hasEntity: boolean): string {
  if (!hasEntity) return NOT_AVAILABLE;
  return typeof value === 'number' && !Number.isNaN(value) ? String(value) : NOT_AVAILABLE;
}

function boolTruth(value: boolean | null | undefined): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return NOT_AVAILABLE;
}

function getDetailRouteId(row: Pick<Row, 'linked_dispute_case_id' | 'dispute_case_id' | 'detection_result_id'>): string {
  return row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || '';
}

function getLedgerRowKey(row: Pick<Row, 'recovery_record_id' | 'linked_dispute_case_id' | 'dispute_case_id' | 'detection_result_id' | 'case_number'>): string {
  return row.recovery_record_id || getDetailRouteId(row) || row.case_number;
}

function identityTruthHeadline(row: Pick<Row, 'row_type' | 'entity_type' | 'has_real_recovery_record' | 'has_real_dispute_case'>): string {
  if (row.has_real_recovery_record === true) {
    return 'Recovery Record Linked';
  }
  return displayIdentityLabel(row);
}

function identityTruthDetail(row: Pick<Row, 'row_type' | 'entity_type' | 'has_real_recovery_record' | 'has_real_dispute_case'>): string {
  if (row.row_type === 'detection_projection' || row.entity_type === 'detection') {
    return 'Detection-backed payout estimate only. No confirmed dispute case or recovery record.';
  }
  if (row.has_real_dispute_case === true && row.has_real_recovery_record === true) {
    return 'Backed by a dispute case and a persisted recovery record.';
  }
  if (row.has_real_dispute_case === true) {
    return 'Backed by a dispute case. No persisted recovery record is linked yet.';
  }
  return NOT_AVAILABLE;
}

function identityBadgeTone(row: Pick<Row, 'row_type' | 'entity_type' | 'has_real_recovery_record'>): string {
  if (row.row_type === 'detection_projection' || row.entity_type === 'detection') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-100';
  }
  if (row.has_real_recovery_record === true) {
    return 'border-blue-500/20 bg-blue-500/10 text-blue-100';
  }
  return 'border-white/10 bg-white/[0.03] text-white/72';
}

type LedgerProgressSnapshot = {
  label: 'Detected' | 'Filed' | 'Approved' | 'Recovered' | 'Legacy billed';
  toneClass: string;
};

function ledgerProgressTone(label: LedgerProgressSnapshot['label']): string {
  switch (label) {
    case 'Legacy billed':
      return 'text-fuchsia-200';
    case 'Recovered':
      return 'text-emerald-200';
    case 'Approved':
      return 'text-blue-300';
    case 'Filed':
      return 'text-blue-100';
    default:
      return 'text-white/68';
  }
}

function getLedgerProgressSnapshot(row: Row, financialSummary?: FinancialTruthSummary | null): LedgerProgressSnapshot {
  const billingStatus = String(row.billing_status || '').trim().toLowerCase();
  const payoutStatus = String(row.payout_status || '').trim().toLowerCase();
  const reconciliationStatus = String(row.reconciliation_status || '').trim().toLowerCase();

  if (['pending', 'completed', 'sent', 'charged', 'paid', 'credited'].includes(billingStatus)) {
    return { label: 'Legacy billed', toneClass: ledgerProgressTone('Legacy billed') };
  }
  if (
    hasNumericValue(financialSummary?.verified_paid_amount)
    || hasNumericValue(row.actual_payout_amount)
    || ['paid', 'partially_paid'].includes(payoutStatus)
    || ['partial_recovery', 'reconciled'].includes(reconciliationStatus)
  ) {
    return { label: 'Recovered', toneClass: ledgerProgressTone('Recovered') };
  }
  if (hasNumericValue(row.approved_amount) || row.expected_payout_source === 'approved_pending') {
    return { label: 'Approved', toneClass: ledgerProgressTone('Approved') };
  }
  if (row.has_real_dispute_case === true || Boolean(row.linked_dispute_case_id) || Boolean(row.provider_case_id) || Boolean(row.filing_status)) {
    return { label: 'Filed', toneClass: ledgerProgressTone('Filed') };
  }
  return { label: 'Detected', toneClass: ledgerProgressTone('Detected') };
}

function detailLinkLabel(row: Pick<Row, 'entity_type' | 'linked_dispute_case_id' | 'dispute_case_id' | 'detection_result_id'>): string {
  if (!getDetailRouteId(row)) return NOT_AVAILABLE;
  if (row.entity_type === 'detection') return 'View detection detail';
  if (row.entity_type === 'dispute_case') return 'View dispute detail';
  return NOT_AVAILABLE;
}

type OperationalExplanationValue = {
  reason?: string;
  retry_at?: string;
  blocking_guard?: string;
  next_action?: string;
} | null | undefined;

function formatBackendOperationalExplanation(explanation: OperationalExplanationValue): string {
  if (!explanation) return NOT_AVAILABLE;
  const parts: string[] = [];
  if (explanation.reason) parts.push(`Reason: ${explanation.reason}`);
  if (explanation.blocking_guard) parts.push(`Blocking Guard: ${formatAutonomyLabel(explanation.blocking_guard)}`);
  if (explanation.next_action) parts.push(`Next Action: ${formatAutonomyLabel(explanation.next_action)}`);
  if (explanation.retry_at) parts.push(`Retry At: ${stamp(explanation.retry_at)}`);
  return parts.length ? parts.join(' · ') : NOT_AVAILABLE;
}

function formatBackendLifecycleSnapshot(params: {
  workStatus?: string | null;
  lifecycleState?: string | null;
  operationalState?: string | null;
  deferReason?: string | null;
  workError?: string | null;
  nextAttemptAt?: string | null;
  lastClaimedAt?: string | null;
  lastProcessedAt?: string | null;
}): string {
  const parts: string[] = [];
  if (params.workStatus) parts.push(`Work Status: ${label(params.workStatus)}`);
  if (params.lifecycleState) parts.push(`Lifecycle: ${label(params.lifecycleState)}`);
  if (params.operationalState) parts.push(`Runtime State: ${formatAutonomyLabel(params.operationalState)}`);
  if (params.deferReason) parts.push(`Deferred Reason: ${label(params.deferReason)}`);
  if (!params.deferReason && params.workError) parts.push(`Error: ${params.workError}`);
  if (params.nextAttemptAt) parts.push(`Next Attempt: ${stamp(params.nextAttemptAt)}`);
  if (params.lastClaimedAt) parts.push(`Last Claimed: ${stamp(params.lastClaimedAt)}`);
  if (params.lastProcessedAt) parts.push(`Last Processed: ${stamp(params.lastProcessedAt)}`);
  return parts.length ? parts.join(' · ') : NOT_AVAILABLE;
}

function formatLifecycleSection(labelText: string, summary: string): string {
  return `${labelText}: ${summary || NOT_AVAILABLE}`;
}

function pickLatestTimestamp(...values: Array<string | null | undefined>): string | null {
  const stamped = values
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => right.time - left.time)[0];
  return stamped?.value || null;
}

function getFinancialKey(row: Pick<Row, 'dispute_case_id' | 'detection_result_id'>): string {
  return row.dispute_case_id || row.detection_result_id || '';
}

function getFinancialSummaryForRow(row: Pick<Row, 'dispute_case_id' | 'detection_result_id'>, map: FinancialMap): FinancialTruthSummary | null {
  const directKey = getFinancialKey(row);
  if (directKey && map[directKey]) return map[directKey];
  if (row.detection_result_id && map[row.detection_result_id]) return map[row.detection_result_id];
  return null;
}

function getFinalityEventMatch(row: Row, event: StatusEvent) {
  const payload = (event.data || {}) as Record<string, any>;
  const eventType = String(event.eventType || '').toLowerCase();
  const isRecovery = eventType.startsWith('recovery.');
  const isBilling = eventType.startsWith('billing.');
  const isPayoutFinality = eventType === 'payout.detected' || eventType === 'detection.payout_received';
  if (!isRecovery && !isBilling && !isPayoutFinality) {
    return {
      payload,
      eventType,
      isRecovery,
      isBilling,
      isPayoutFinality,
      matchesRecovery: false,
      matchesBilling: false,
      matchesPayoutFinality: false,
      matched: false,
    };
  }

  const recoveryWorkItemId = String(payload.recovery_work_item_id || '').trim();
  const billingWorkItemId = String(payload.billing_work_item_id || '').trim();
  const disputeCaseId = String(payload.dispute_case_id || payload.claimId || payload.claim_id || payload.entity_id || '').trim();
  const recoveryId = String(payload.recovery_id || payload.recoveryId || '').trim();
  const billingEntityId = String(payload.recovery_id || payload.recoveryId || payload.entity_id || '').trim();
  const rowDisputeCaseId = String(row.linked_dispute_case_id || row.dispute_case_id || '').trim();
  const rowRecoveryRecordId = String(row.recovery_record_id || '').trim();

  const matchesRecovery = isRecovery && (
    (recoveryWorkItemId && recoveryWorkItemId === row.recovery_work_item_id) ||
    (disputeCaseId && disputeCaseId === rowDisputeCaseId)
  );
  const matchesBilling = isBilling && (
    (billingWorkItemId && billingWorkItemId === row.billing_work_item_id) ||
    (disputeCaseId && disputeCaseId === rowDisputeCaseId) ||
    (billingEntityId && billingEntityId === rowRecoveryRecordId)
  );
  const matchesPayoutFinality = isPayoutFinality && (
    (recoveryId && rowRecoveryRecordId && recoveryId === rowRecoveryRecordId) ||
    (disputeCaseId && rowDisputeCaseId && disputeCaseId === rowDisputeCaseId)
  );

  return {
    payload,
    eventType,
    isRecovery,
    isBilling,
    isPayoutFinality,
    matchesRecovery,
    matchesBilling,
    matchesPayoutFinality,
    matched: matchesRecovery || matchesBilling || matchesPayoutFinality,
  };
}

function mergeFinalityEventRow(row: Row, event: StatusEvent): Row {
  const match = getFinalityEventMatch(row, event);
  if (!match.matched || match.isPayoutFinality) {
    return row;
  }

  const { payload, eventType, matchesRecovery } = match;
  const envelopeTimestamp = String(event.timestamp || '').trim() || null;
  const explicitTimestamp = String(payload.timestamp || '').trim() || envelopeTimestamp;
  const runtimeRole = String(payload.runtime_role || '').trim() || null;
  const executionLane = String(payload.execution_lane || '').trim() || null;
  const lockedBy = String(payload.locked_by || '').trim() || null;
  const reason = String(payload.reason || payload.error || '').trim() || null;
  const status = String(payload.status || '').trim() || null;
  const nextAttemptAt = String(payload.next_attempt_at || '').trim() || null;
  const explicitLastClaimedAt = String(payload.last_claimed_at || '').trim() || null;
  const explicitLastProcessedAt = String(payload.last_processed_at || '').trim() || null;
  const explicitExecutionProcessedAt = String(payload.execution_processed_at || '').trim() || null;
  const deferCountRaw = typeof payload.defer_count === 'number' ? payload.defer_count : Number(payload.defer_count);
  const explicitDeferCount = Number.isFinite(deferCountRaw) ? deferCountRaw : null;
  const reconciliationStrategyRaw = String(payload.reconciliation_strategy || '').trim().toUpperCase();
  const reconciliationStrategy: Row['reconciliation_strategy'] =
    reconciliationStrategyRaw === 'AUTO_MATCH'
    || reconciliationStrategyRaw === 'SMART_MATCH'
    || reconciliationStrategyRaw === 'QUARANTINED'
      ? reconciliationStrategyRaw
      : null;
  const matchExplanation = payload.match_explanation || null;
  const explicitReconciliationStatus = String(payload.reconciliation_status || '').trim() || null;
  const explicitReconciliationSource = String(payload.reconciliation_source || '').trim() || null;
  const explicitPayoutStatus = String(payload.payout_status || '').trim() || null;
  const explicitRecoveryStatus = String(payload.recovery_status || '').trim() || null;
  const explicitBillingStatus = String(payload.billing_status || '').trim() || null;
  const explicitOperatorState = String(payload.operator_state || '').trim() || null;
  const explicitRecoveryLifecycleState = String(payload.recovery_lifecycle_state || payload.lifecycle_state || '').trim() || null;
  const explicitBillingLifecycleState = String(payload.billing_lifecycle_state || payload.lifecycle_state || '').trim() || null;
  const explicitInvestigationRequired = typeof payload.investigation_required === 'boolean' ? payload.investigation_required : null;
  const explicitOutstandingRaw = Number(payload.outstanding_amount);
  const explicitVarianceRaw = Number(payload.variance_amount);
  const explicitOutstandingAmount = Number.isFinite(explicitOutstandingRaw) ? explicitOutstandingRaw : null;
  const explicitVarianceAmount = Number.isFinite(explicitVarianceRaw) ? explicitVarianceRaw : null;

  if (matchesRecovery) {
    const recoveryWorkPayload = {
      ...(row.recovery_work_payload || {}),
      ...payload
    };
    const nextRow: Row = {
      ...row,
      recovery_work_item_id: String(payload.recovery_work_item_id || '').trim() || row.recovery_work_item_id || null,
      recovery_work_status: status || row.recovery_work_status || null,
      recovery_execution_lane: executionLane || row.recovery_execution_lane || null,
      recovery_last_runtime_role: runtimeRole || row.recovery_last_runtime_role || null,
      recovery_last_claimed_at: explicitLastClaimedAt || row.recovery_last_claimed_at || null,
      recovery_last_processed_at: explicitLastProcessedAt || row.recovery_last_processed_at || null,
      recovery_execution_processed_at: explicitExecutionProcessedAt || row.recovery_execution_processed_at || null,
      recovery_work_error: reason || row.recovery_work_error || null,
      reconciliation_strategy: reconciliationStrategy || row.reconciliation_strategy || null,
      match_explanation: matchExplanation || row.match_explanation || null,
      recovery_last_deferred_reason: eventType === 'recovery.work_deferred'
        ? (reason || row.recovery_last_deferred_reason || null)
        : row.recovery_last_deferred_reason || null,
      recovery_defer_count: eventType === 'recovery.work_deferred' && explicitDeferCount != null
        ? Math.max(row.recovery_defer_count ?? 0, explicitDeferCount)
        : row.recovery_defer_count ?? 0,
      recovery_next_attempt_at: nextAttemptAt || row.recovery_next_attempt_at || null,
      recovery_locked_by: lockedBy || row.recovery_locked_by || null,
      recovery_lifecycle_state: explicitRecoveryLifecycleState || row.recovery_lifecycle_state || null,
      recovery_operational_state: String(payload.operational_state || '').trim() || row.recovery_operational_state || null,
      recovery_operational_explanation: payload.operational_explanation || row.recovery_operational_explanation || null,
      recovery_work_payload: recoveryWorkPayload,
      reconciliation_status: explicitReconciliationStatus as Row['reconciliation_status'] || row.reconciliation_status,
      reconciliation_source: explicitReconciliationSource as Row['reconciliation_source'] || row.reconciliation_source,
      payout_status: explicitPayoutStatus as Row['payout_status'] || row.payout_status,
      recovery_status: explicitRecoveryStatus || row.recovery_status,
      operator_state: explicitOperatorState || row.operator_state,
      investigation_required: explicitInvestigationRequired ?? row.investigation_required,
      outstanding_amount: explicitOutstandingAmount ?? row.outstanding_amount,
      variance_amount: explicitVarianceAmount ?? row.variance_amount,
      last_updated_at: pickLatestTimestamp(explicitTimestamp, row.last_updated_at)
    };

    return nextRow;
  }

  const billingWorkPayload = {
    ...(row.billing_work_payload || {}),
    ...payload
  };
  const nextRow: Row = {
    ...row,
    billing_work_item_id: String(payload.billing_work_item_id || '').trim() || row.billing_work_item_id || null,
    billing_work_status: status || row.billing_work_status || null,
    billing_execution_lane: executionLane || row.billing_execution_lane || null,
    billing_last_runtime_role: runtimeRole || row.billing_last_runtime_role || null,
    billing_last_claimed_at: explicitLastClaimedAt || row.billing_last_claimed_at || null,
    billing_last_processed_at: explicitLastProcessedAt || row.billing_last_processed_at || null,
    billing_execution_processed_at: explicitExecutionProcessedAt || row.billing_execution_processed_at || null,
    billing_work_error: reason || row.billing_work_error || null,
    billing_last_deferred_reason: eventType === 'billing.work_deferred'
      ? (reason || row.billing_last_deferred_reason || null)
      : row.billing_last_deferred_reason || null,
    billing_defer_count: eventType === 'billing.work_deferred' && explicitDeferCount != null
      ? Math.max(row.billing_defer_count ?? 0, explicitDeferCount)
      : row.billing_defer_count ?? 0,
    billing_next_attempt_at: nextAttemptAt || row.billing_next_attempt_at || null,
    billing_locked_by: lockedBy || row.billing_locked_by || null,
    billing_lifecycle_state: explicitBillingLifecycleState || row.billing_lifecycle_state || null,
    billing_operational_state: String(payload.operational_state || '').trim() || row.billing_operational_state || null,
    billing_operational_explanation: payload.operational_explanation || row.billing_operational_explanation || null,
    billing_work_payload: billingWorkPayload,
    billing_status: explicitBillingStatus || row.billing_status,
    operator_state: explicitOperatorState || row.operator_state,
    investigation_required: explicitInvestigationRequired ?? row.investigation_required,
    last_updated_at: pickLatestTimestamp(explicitTimestamp, row.last_updated_at)
  };

  return nextRow;
}

function mergeLedgerRows(nextRows: Row[], previousRows: Row[] = []): Row[] {
  void previousRows;
  return nextRows;
}

const severityTone = (severity: Blocker['severity']) =>
  severity === 'high'
    ? 'border-red-500/25 bg-red-500/10 text-red-200'
    : severity === 'medium'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
      : 'border-blue-500/25 bg-blue-500/10 text-blue-100';

const badgeTone = (value: string | null | undefined) => {
  const normalized = String(value || '').toLowerCase();
  if (['reconciled', 'billing_complete', 'paid', 'charged', 'credited', 'complete', 'completed'].includes(normalized)) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  if (['partial_recovery', 'partial_payout_review', 'payout_detected', 'payout_detected_not_reconciled', 'waiting_for_payout', 'billing_pending', 'billing_processing', 'recovery_processing', 'pending', 'pending_payout', 'processing'].includes(normalized)) return 'border-amber-500/20 bg-amber-500/10 text-amber-100';
  if (['investigation_required', 'failed', 'failed_retry_exhausted', 'rejected', 'denied', 'lost'].includes(normalized)) return 'border-rose-500/20 bg-rose-500/10 text-rose-200';
  if (['filed', 'submitted', 'recovering'].includes(normalized)) return 'border-blue-500/20 bg-blue-500/10 text-blue-100';
  if (['retrying', 'submitting', 'pending_approval', 'pending_safety_verification'].includes(normalized)) return 'border-amber-500/20 bg-amber-500/10 text-amber-100';
  if (['blocked', 'duplicate_blocked', 'payment_required'].includes(normalized)) return 'border-rose-500/20 bg-rose-500/10 text-rose-200';
  return 'border-white/10 bg-white/[0.03] text-white/72';
};

function Metric({ labelText, value, sublabel }: { labelText: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5">
      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{labelText}</div>
      <div className="mt-3 text-[22px] font-sans font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/38">{sublabel}</div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5">
      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
            <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/34">{row.label}</span>
            <span className="text-right text-[11px] font-sans font-semibold leading-5 tracking-tight text-white/78">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function numericOrNull(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCaseBasisTruth(detail: CaseBasisDetail | null | undefined): CaseBasisTruth | null {
  return detail?.finding_truth || null;
}

function getCaseBasisSellerSummary(detail: CaseBasisDetail | null | undefined): CaseBasisSellerSummary | null {
  const truth = getCaseBasisTruth(detail);
  return truth?.seller_summary || detail?.seller_summary || null;
}

function getCaseBasisPolicy(detail: CaseBasisDetail | null | undefined): CaseBasisPolicy | null {
  const truth = getCaseBasisTruth(detail);
  return truth?.policy_basis || detail?.policy_basis || null;
}

function getCaseBasisMovement(detail: CaseBasisDetail | null | undefined): CaseBasisMovement | null {
  const truth = getCaseBasisTruth(detail);
  return truth?.filing_movement || detail?.filing_movement || null;
}

function getCaseBasisField(detail: CaseBasisDetail | null | undefined, key: keyof CaseBasisTruth): string {
  const truth = getCaseBasisTruth(detail);
  return String(truth?.[key] || detail?.[key as keyof CaseBasisDetail] || '').trim();
}

function getCaseBasisReadinessMeta(detail: CaseBasisDetail | null | undefined): { label: string; className: string } | null {
  const reviewTier = getCaseBasisField(detail, 'review_tier').toLowerCase();
  const claimReadiness = getCaseBasisField(detail, 'claim_readiness').toLowerCase();

  if (!reviewTier && !claimReadiness) return null;
  if (reviewTier === 'monitoring') {
    return { label: 'Monitoring', className: 'border-blue-400/25 bg-blue-400/10 text-blue-100' };
  }
  if (reviewTier === 'review_only' || claimReadiness === 'not_claim_ready') {
    return { label: 'Not claim-ready', className: 'border-amber-400/25 bg-amber-400/10 text-amber-100' };
  }
  if (claimReadiness === 'claim_ready') {
    return { label: 'Claim-ready', className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' };
  }
  return { label: label(reviewTier || claimReadiness), className: 'border-white/10 bg-white/[0.03] text-white/58' };
}

function getCaseBasisAmount(detail: CaseBasisDetail | null | undefined, row: Row): number | null {
  return numericOrNull(detail?.guaranteedAmount)
    ?? numericOrNull(detail?.amount)
    ?? numericOrNull(detail?.estimated_value)
    ?? numericOrNull(detail?.approved_amount)
    ?? numericOrNull(detail?.expected_payout_amount)
    ?? numericOrNull(row.approved_amount)
    ?? numericOrNull(row.expected_payout_amount)
    ?? numericOrNull(row.outstanding_amount);
}

function getCaseBasisAmountCopy(detail: CaseBasisDetail | null | undefined, row: Row): string {
  const claimReadiness = getCaseBasisField(detail, 'claim_readiness').toLowerCase();
  const valueLabel = getCaseBasisField(detail, 'value_label').toLowerCase();
  const amount = getCaseBasisAmount(detail, row);
  const currency = detail?.currency || row.currency || 'USD';

  if (detail && claimReadiness === 'claim_ready' && amount !== null) {
    return `Margin is tracking ${money(amount, currency)} as the current recoverable amount for this case.`;
  }
  if (detail && valueLabel === 'no_recovery_value') {
    return 'Margin is not treating this as recoverable value. It is being kept visible for monitoring and reconciliation.';
  }
  if (detail && claimReadiness === 'not_claim_ready') {
    return 'Margin is not treating this as claim-ready recovery yet. Financial context is being reviewed before any filing decision.';
  }
  if (amount !== null) {
    return `The recovery ledger currently carries ${money(amount, currency)} in financial context. Backend case-basis truth decides whether that value is claim-ready.`;
  }
  return 'No claim-ready recovery value is available for this record yet.';
}

function getCaseBasisSummary(detail: CaseBasisDetail | null | undefined, row: Row): string {
  const sellerSummary = getCaseBasisSellerSummary(detail);
  return sellerSummary?.summary
    || detail?.details
    || `This record exists because Margin has a ${displayIdentityLabel(row).toLowerCase()} tied to ${row.case_number}. ${identityTruthDetail(row)}`;
}

function getCaseBasisEvidenceSummary(detail: CaseBasisDetail | null | undefined, row: Row): string {
  const sellerSummary = getCaseBasisSellerSummary(detail);
  if (sellerSummary?.evidence_summary) return sellerSummary.evidence_summary;

  const identity = identityMetaLabel(row);
  const provider = row.provider_case_id ? ` Amazon reference ${row.provider_case_id}.` : '';
  return `Ledger reference ${row.case_number}. ${identity}.${provider}`;
}

function getCaseBasisRecoverabilityReason(detail: CaseBasisDetail | null | undefined): string {
  const sellerSummary = getCaseBasisSellerSummary(detail);
  return sellerSummary?.recoverability_reason
    || 'Amazon records do not reconcile with the expected seller outcome. Margin is verifying identifiers, evidence, payout, and policy support before treating the record as final.';
}

function getCaseBasisMovementCopy(detail: CaseBasisDetail | null | undefined, row: Row, financialSummary?: FinancialTruthSummary | null): { label: string; detail: string; nextAction: string | null } {
  const movement = getCaseBasisMovement(detail);
  const progress = getLedgerProgressSnapshot(row, financialSummary);
  return {
    label: movement?.label || progress.label,
    detail: movement?.detail || rowNeedsNextStep(row),
    nextAction: movement?.next_action_label || detail?.next_action_label || null
  };
}

function payoutProofSummary(financialSummary: FinancialTruthSummary | null | undefined): string {
  if (!financialSummary?.proof_of_payment) return 'No payout proof linked yet.';
  if (financialSummary.proof_of_payment.settlement_id) {
    return `Paid via settlement ${financialSummary.proof_of_payment.settlement_id}.`;
  }
  if (financialSummary.proof_of_payment.payout_batch_id) {
    return `Paid via batch ${financialSummary.proof_of_payment.payout_batch_id}.`;
  }
  if (financialSummary.proof_of_payment.reference_id) {
    return `Paid via reference ${financialSummary.proof_of_payment.reference_id}.`;
  }
  return 'Paid via a verified financial event.';
}

function rowNeedsNextStep(row: Pick<Row, 'investigation_required' | 'reconciliation_status' | 'payout_status'>): string {
  if (row.investigation_required) {
    return 'Needs investigation before Margin can treat this record as financially settled.';
  }
  if (row.reconciliation_status === 'partial_recovery' || row.payout_status === 'partially_paid') {
    return 'Partial payout detected. Remaining value still needs confirmation.';
  }
  if (row.reconciliation_status === 'pending_payout' || row.payout_status === 'not_paid') {
    return 'Approved value is still waiting for payout confirmation.';
  }
  if (row.reconciliation_status === 'reconciled' || row.payout_status === 'paid') {
    return 'This record already has confirmed payout truth attached.';
  }
  return 'Open extra info to review the full recovery and billing trail.';
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
  const [basisOpen, setBasisOpen] = useState(false);
  const [basisRow, setBasisRow] = useState<Row | null>(null);
  const [basisDetail, setBasisDetail] = useState<CaseBasisDetail | null>(null);
  const [basisLoading, setBasisLoading] = useState(false);
  const [basisError, setBasisError] = useState<string | null>(null);
  const [financialSummaries, setFinancialSummaries] = useState<FinancialMap>({});
  const [detailsFinancialSummary, setDetailsFinancialSummary] = useState<FinancialTruthSummary | null>(null);
  const [detailsFinancialEvents, setDetailsFinancialEvents] = useState<FinancialTruthEvent[]>([]);
  const [detailsFinancialLoading, setDetailsFinancialLoading] = useState(false);
  const liveRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDetailsRefreshKeyRef = useRef<string | null>(null);

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
      setLedger((current) => {
        const nextLedger = response.data as Ledger;
        return {
          ...nextLedger,
          rows: mergeLedgerRows(nextLedger.rows || [], current?.rows || [])
        };
      });
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

  const loadDetailsFinancialTruth = useCallback(async (row: Row) => {
    setDetailsFinancialLoading(true);
    try {
      const response = await api.getRecoveryFinancialEvents({ caseId: getFinancialKey(row) }, activeSlug);
      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Unable to load financial proof.');
      }
      const fetchedSummary = (response.data.summaries || [])[0] || getFinancialSummaryForRow(row, financialSummaries);
      setDetailsFinancialSummary(fetchedSummary || null);
      setDetailsFinancialEvents(response.data.events || []);
    } catch {
      setDetailsFinancialSummary(null);
      setDetailsFinancialEvents([]);
    } finally {
      setDetailsFinancialLoading(false);
    }
  }, [activeSlug, financialSummaries]);

  const scheduleLiveRefresh = useCallback(() => {
    if (liveRefreshTimeoutRef.current) {
      clearTimeout(liveRefreshTimeoutRef.current);
    }
    liveRefreshTimeoutRef.current = setTimeout(() => {
      void fetchLedger('refresh');
      liveRefreshTimeoutRef.current = null;
    }, 400);
  }, [fetchLedger]);

  useStatusStream((event: StatusEvent) => {
    const eventType = String(event.eventType || '').toLowerCase();
    const eventStatus = String(event.data?.status || '').toLowerCase();

    const isRecoveryRelevant =
      eventType === 'payout.detected' ||
      eventType === 'detection.payout_received' ||
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
    setLedger((current) => {
      if (!current?.rows?.length) return current;
      return {
        ...current,
        rows: current.rows.map((row) => mergeFinalityEventRow(row, event))
      };
    });
    if (detailsRow && getFinalityEventMatch(detailsRow, event).matched) {
      pendingDetailsRefreshKeyRef.current = getLedgerRowKey(detailsRow);
      setDetailsFinancialLoading(true);
    }
    scheduleLiveRefresh();
  }, activeSlug);

  const summary = ledger?.summary || null;
  const rows = ledger?.rows || [];
  const pagination = ledger?.pagination || null;
  const filteredLabel = useMemo(() => pagination ? `${pagination.total_filtered} filtered results of ${pagination.total_rows}` : '', [pagination]);

  useEffect(() => {
    if (!activeSlug || !rows.length) {
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

      const response = await api.getRecoveryFinancialEvents({ caseIds }, activeSlug);
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
    return () => {
      cancelled = true;
    };
  }, [activeSlug, rows]);

  useEffect(() => {
    if (!detailsOpen || !detailsRow || !ledger?.rows?.length) return;
    const detailsKey = getLedgerRowKey(detailsRow);
    const refreshedRow = ledger.rows.find((row) => getLedgerRowKey(row) === detailsKey);
    if (!refreshedRow || refreshedRow === detailsRow) return;
    setDetailsRow(refreshedRow);
  }, [detailsOpen, detailsRow, ledger]);

  useEffect(() => {
    if (!detailsOpen || !ledger?.rows?.length || !pendingDetailsRefreshKeyRef.current) return;
    const refreshedRow = ledger.rows.find((row) => getLedgerRowKey(row) === pendingDetailsRefreshKeyRef.current);
    if (!refreshedRow) {
      pendingDetailsRefreshKeyRef.current = null;
      setDetailsFinancialLoading(false);
      return;
    }
    setDetailsRow(refreshedRow);
    void loadDetailsFinancialTruth(refreshedRow);
    pendingDetailsRefreshKeyRef.current = null;
  }, [detailsOpen, ledger, loadDetailsFinancialTruth]);

  useEffect(() => {
    if (detailsOpen) return;
    pendingDetailsRefreshKeyRef.current = null;
    setDetailsFinancialLoading(false);
  }, [detailsOpen]);

  useEffect(() => {
    if (!basisOpen || !basisRow || !ledger?.rows?.length) return;
    const basisKey = getLedgerRowKey(basisRow);
    const refreshedRow = ledger.rows.find((row) => getLedgerRowKey(row) === basisKey);
    if (!refreshedRow || refreshedRow === basisRow) return;
    setBasisRow(refreshedRow);
  }, [basisOpen, basisRow, ledger]);

  const closeCaseBasis = () => {
    setBasisOpen(false);
    setBasisRow(null);
    setBasisDetail(null);
    setBasisError(null);
    setBasisLoading(false);
  };

  const openCaseBasis = async (row: Row) => {
    const detailRouteId = getDetailRouteId(row);
    setBasisRow(row);
    setBasisDetail(null);
    setBasisError(null);
    setBasisOpen(true);

    if (!detailRouteId) {
      setBasisLoading(false);
      setBasisError('Backend case basis is not linked yet. Showing ledger fallback.');
      return;
    }

    setBasisLoading(true);
    try {
      const res = await api.getRecoveryDetail(detailRouteId, activeSlug);
      if (!res.ok) {
        throw new Error(res.error || 'Unable to load backend case basis right now.');
      }
      setBasisDetail((res.data || null) as CaseBasisDetail | null);
    } catch (err: any) {
      setBasisDetail(null);
      setBasisError(err?.message || 'Unable to load backend case basis right now.');
    } finally {
      setBasisLoading(false);
    }
  };

  const openProofDocuments = async (row: Row) => {
    try {
      const detailRouteId = getDetailRouteId(row);
      if (!detailRouteId) {
        throw new Error(NOT_AVAILABLE);
      }
      const res = await api.getRecoveryDetail(detailRouteId, activeSlug);
      if (!res.ok) {
        throw new Error(res.error || 'Unable to load proof documents.');
      }
      setProofDocs(Array.isArray(res.data?.documents) ? res.data.documents : []);
      setProofDocsClaim({ id: detailRouteId, claim_number: row.case_number });
      setProofDocsModalOpen(true);
    } catch (err: any) {
      toast({ title: 'Unable to load proof documents', description: err?.message || 'The linked evidence documents could not be loaded.' });
    }
  };

  const openRecoveryDetails = async (row: Row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
    setDetailsFinancialSummary(getFinancialSummaryForRow(row, financialSummaries));
    setDetailsFinancialEvents([]);
    void loadDetailsFinancialTruth(row);
  };

  const openEvidencePacket = (row: Row) => {
    const detailRouteId = getDetailRouteId(row);
    if (!detailRouteId) {
      toast({ title: 'Evidence packet unavailable', description: NOT_AVAILABLE });
      return;
    }
    setEvidencePackClaimId(detailRouteId);
    setEvidencePackOpen(true);
  };

  if (isReady && !activeSlug) {
    return (
      <PageLayout title="Recoveries In Motion" midnight>
        <Card className="border-red-500/20 bg-[#0c0c0c]">
          <CardContent className="flex items-start gap-4 p-8">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />
            <div>
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-red-400">Workspace Required</div>
              <div className="mt-2 text-sm font-sans font-bold text-white">A workspace is required before Margin can show recovery activity.</div>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Recoveries In Motion" midnight>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
      <div className="relative w-full flex-1 overflow-x-hidden bg-[#050505]">
        <div className="relative w-full max-w-full px-8 pt-8 pb-24">
          <div className="mb-8 border-b border-white/10 pb-8">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Account-wide recovery ledger</div>
            <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-light tracking-tight text-white">Recoveries In Motion</h1>
                <p className="mt-3 max-w-3xl text-[12px] font-sans leading-6 text-white/40">
                  Review account-wide recovery history across approved claims, pending payouts, and completed paybacks. This ledger reflects workspace-level activity over time, not the results of a single CSV upload.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {summary?.last_updated_at ? <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/24">Account ledger updated {stamp(summary.last_updated_at)}</div> : null}
                <Button variant="outline" className="h-10 rounded-lg border-white/10 bg-white/5 px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white" onClick={() => fetchLedger('refresh')} disabled={loading || refreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh ledger
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
          ) : pagination ? (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-4">
                <Metric
                  labelText="Paid back so far"
                  value={summaryMoney(summary?.verified_paid_total, summary?.summary_currency)}
                  sublabel={
                    summary?.verified_paid_count != null && summary?.partial_paid_count != null
                      ? `${summary.verified_paid_count} paid back, ${summary.partial_paid_count} partial`
                      : NOT_AVAILABLE
                  }
                />
                <Metric
                  labelText="Awaiting payout"
                  value={summaryMoney(summary?.awaiting_payout_total, summary?.summary_currency)}
                  sublabel={
                    summary?.awaiting_payout_queue_count != null
                      ? `${summary.awaiting_payout_queue_count} awaiting payout`
                      : NOT_AVAILABLE
                  }
                />
                <Metric
                  labelText="Approved with Amazon"
                  value={summaryMoney(summary?.approved_total, summary?.summary_currency)}
                  sublabel={summary?.approved_count != null ? `${summary.approved_count} approved cases` : NOT_AVAILABLE}
                />
                <Metric
                  labelText="Outstanding total"
                  value={summaryMoney(summary?.outstanding_total, summary?.summary_currency)}
                  sublabel={summary?.summary_currency ? 'Queue-wide backend financial truth' : NOT_AVAILABLE}
                />
              </div>

              <Card className="border-white/10 bg-[#0c0c0c]">
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Account-wide status</div>
                      <div className="mt-2 text-[11px] font-sans font-medium uppercase tracking-tight text-white/32">{filteredLabel}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[['Paid back', summary?.reconciled_count ?? NOT_AVAILABLE], ['Partial payout', summary?.partial_recovery_count ?? NOT_AVAILABLE], ['Awaiting payout', summary?.awaiting_payout_queue_count ?? NOT_AVAILABLE], ['Needs review', summary?.investigation_required_count ?? NOT_AVAILABLE]].map(([text, value]) => (
                        <div key={String(text)} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
                          {text}: <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {summary?.blockers?.length ? <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">{summary.blockers.map((blocker) => <div key={blocker.key} className={`rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight ${severityTone(blocker.severity)}`}>{blocker.label}: {blocker.count}</div>)}</div> : null}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-[#0c0c0c]">
                <CardContent className="space-y-6 p-8">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-xl">
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                          <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search record, Amazon reference, merchant, or status" className="h-12 rounded-xl border-white/10 bg-white/[0.03] pl-11 text-sm font-sans font-bold text-white placeholder:text-white/20" />
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

                  {rows.length === 0 ? <div className="text-sm font-sans font-bold text-white/50">No account-wide ledger records match the current filters.</div> : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-3 pr-4 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Record</th>
                              <th className="px-4 py-3 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Current state</th>
                              <th className="px-4 py-3 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Recovery amounts</th>
                              <th className="px-4 py-3 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Payout and billing</th>
                              <th className="px-4 py-3 text-left text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Timing</th>
                              <th className="pl-4 py-3 text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => {
                              const financialSummary = getFinancialSummaryForRow(row, financialSummaries);
                              const detailRouteId = getDetailRouteId(row);
                              const detailLabel = detailLinkLabel(row);
                              const identityHeadline = identityTruthHeadline(row);
                              const operatorStateLabel = label(row.operator_state);
                              const reconciliationLabel = label(row.reconciliation_status);
                              const payoutStatusLabel = visiblePayoutStatusLabel(row.payout_status);
                              const billingStatusLabel = label(row.billing_status);
                              const showReconciliationBadge = !isUnavailableDisplay(reconciliationLabel);
                              const showPayoutStatusBadge = !isUnavailableDisplay(payoutStatusLabel);
                              const showBillingStatusBadge = !isUnavailableDisplay(billingStatusLabel);
                              const showInvestigationBadge = row.investigation_required && operatorStateLabel.trim().toLowerCase() !== 'investigation required';
                              const hasVisibleStateBadges = !isUnavailableDisplay(operatorStateLabel) || showReconciliationBadge || showInvestigationBadge;
                              const approvedAmountAvailable = hasNumericValue(row.approved_amount);
                              const paidBackAvailable = hasNumericValue(financialSummary?.verified_paid_amount);
                              const outstandingAvailable = hasNumericValue(row.outstanding_amount);
                              const legacyFeeAvailable = hasNumericValue(row.billed_revenue_amount);
                              const primaryActionLabel = detailRouteId ? 'Review record' : 'Review info';
                              const progressSnapshot = getLedgerProgressSnapshot(row, financialSummary);
                              return (
                              <tr key={getLedgerRowKey(row)} className="border-b border-white/[0.06] align-top transition-colors hover:bg-white/[0.02]">
                                <td className="py-4 pr-4">
                                  <div className="min-w-[250px] space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="max-w-[220px] break-words text-[15px] font-sans font-bold leading-6 tracking-tight text-white">
                                        {row.case_number}
                                      </div>
                                      <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${identityBadgeTone(row)}`}>{identityHeadline}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#8a8a8a]">
                                        {recordReferenceLabel(row)}
                                      </div>
                                      {row.provider_case_id ? (
                                        <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#9a9a9a]">
                                          Amazon reference {row.provider_case_id}
                                        </div>
                                      ) : null}
                                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/54">
                                        {row.merchant_reference ? `Merchant ${row.merchant_reference}` : identityMetaLabel(row)}
                                      </div>
                                      <div className="max-w-[265px] text-[11px] font-sans leading-6 tracking-tight text-white/70">
                                        {identityTruthDetail(row)}
                                      </div>
                                      <div className="text-[10px] font-sans tracking-tight text-white/42">
                                        <span className="uppercase text-[#6f6f6f]">Case progress:</span>{' '}
                                        <span className={cn('font-semibold', progressSnapshot.toneClass)}>{progressSnapshot.label}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openCaseBasis(row)}
                                        className="inline-flex w-fit items-center gap-1 text-[10px] font-sans font-semibold tracking-tight text-white/42 transition-colors hover:text-white/82"
                                      >
                                        Case basis
                                        <ArrowUpRight className="h-3 w-3 text-white/25" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex min-w-[230px] flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                      {!isUnavailableDisplay(operatorStateLabel) ? (
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.operator_state)}`}>{operatorStateLabel}</span>
                                      ) : null}
                                      {showReconciliationBadge ? (
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.reconciliation_status)}`}>{reconciliationLabel}</span>
                                      ) : null}
                                      {showInvestigationBadge ? (
                                        <span className="inline-flex w-fit rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight text-rose-200">
                                          Investigation Required
                                        </span>
                                      ) : null}
                                      {!hasVisibleStateBadges ? (
                                        <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight text-[#7b7b7b]">
                                          No active state yet
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="max-w-[255px] text-[11px] font-sans font-semibold leading-6 tracking-tight text-white/78">
                                      {rowNeedsNextStep(row)}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="min-w-[220px] space-y-1 text-[12px] font-sans text-white/70">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/35">Approved with Amazon</span>
                                      <span className={cn('font-semibold tracking-tight', approvedAmountAvailable ? 'text-white/88' : 'text-white/38')}>
                                        {money(row.approved_amount, row.currency)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/35">Paid back</span>
                                      <span className={cn('font-semibold tracking-tight', paidBackAvailable ? 'text-white/88' : 'text-white/38')}>
                                        {money(financialSummary?.verified_paid_amount, row.currency)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/35">Outstanding</span>
                                      <span className={cn('font-semibold tracking-tight', outstandingAvailable ? 'text-white/88' : 'text-white/38')}>
                                        {money(row.outstanding_amount, row.currency)}
                                      </span>
                                    </div>
                                    <div className="pt-1 text-[10px] font-sans text-white/40">
                                      {row.expected_payout_source ? `Expected source: ${payoutSourceLabel(row.expected_payout_source)}` : `Variance: ${money(row.variance_amount, row.currency)}`}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="min-w-[185px] space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                      {showPayoutStatusBadge ? (
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${visiblePayoutStatusTone(row.payout_status)}`}>{payoutStatusLabel}</span>
                                      ) : (
                                        <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#7b7b7b]">Payout status unavailable</span>
                                      )}
                                      {showBillingStatusBadge ? (
                                        <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight ${badgeTone(row.billing_status)}`}>{billingStatusLabel}</span>
                                      ) : null}
                                    </div>
                                    <div className="max-w-[185px] text-[11px] font-sans leading-6 tracking-tight text-white/70">
                                      {payoutProofSummary(financialSummary)}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#7f7f7f]">Legacy fee</div>
                                      <div className={cn('text-[11px] font-sans font-semibold tracking-tight', legacyFeeAvailable ? 'text-white/78' : 'text-[#6f6f6f]')}>
                                        {money(row.billed_revenue_amount, row.currency)}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="min-w-[125px] space-y-2">
                                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#8a8a8a]">Last Updated</div>
                                    <div className="text-[11px] font-sans font-semibold leading-5 tracking-tight text-white/82">{stamp(row.last_updated_at)}</div>
                                    {(row.recovery_next_attempt_at || row.billing_next_attempt_at) ? (
                                      <>
                                        <div className="pt-1 text-[10px] font-sans font-bold uppercase tracking-tight text-[#8a8a8a]">Next retry</div>
                                        <div className="text-[11px] font-sans font-semibold leading-5 tracking-tight text-white/82">{stamp(row.recovery_next_attempt_at || row.billing_next_attempt_at)}</div>
                                      </>
                                    ) : (row.recovery_last_processed_at || row.billing_last_processed_at) ? (
                                      <>
                                        <div className="pt-1 text-[10px] font-sans font-bold uppercase tracking-tight text-[#8a8a8a]">Last movement</div>
                                        <div className="text-[11px] font-sans font-semibold leading-5 tracking-tight text-white/82">{stamp(row.recovery_last_processed_at || row.billing_last_processed_at)}</div>
                                      </>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="py-4 pl-4 text-right">
                                  <div className="flex flex-col items-end gap-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 rounded-full border-white/10 bg-white/[0.03] px-3 text-[9px] font-sans font-bold uppercase tracking-tight text-white/78 hover:bg-white/[0.07] hover:text-white"
                                      onClick={() => openRecoveryDetails(row)}
                                    >
                                      {primaryActionLabel}
                                      <ArrowUpRight className="ml-1.5 h-3 w-3" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-white/34 hover:bg-white/5 hover:text-white">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56 rounded-xl border border-white/10 bg-[#0c0c0c] p-1 shadow-2xl backdrop-blur-3xl">
                                        <div className="mb-1 border-b border-white/5 px-3 py-2 text-[9px] font-sans font-bold uppercase tracking-tight text-white/20">Record actions</div>
                                        {detailRouteId ? (
                                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white">
                                            <Link to={`/app/${activeSlug}/recoveries/${detailRouteId}`} state={{ claim: row }}>{detailLabel}</Link>
                                          </DropdownMenuItem>
                                        ) : (
                                          <div className="px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
                                            {NOT_AVAILABLE}
                                          </div>
                                        )}
                                        <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white" onClick={() => openProofDocuments(row)}>
                                          View proof documents
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:text-white" onClick={() => openEvidencePacket(row)}>
                                          Open evidence packet
                                        </DropdownMenuItem>
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
      <Dialog open={basisOpen} onOpenChange={(open) => { if (!open) closeCaseBasis(); else setBasisOpen(true); }}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-32px)] max-w-6xl overflow-hidden rounded-2xl border-white/10 bg-[#050505] p-0 text-white shadow-2xl">
          {basisRow ? (() => {
            const detailRouteId = getDetailRouteId(basisRow);
            const financialSummary = getFinancialSummaryForRow(basisRow, financialSummaries);
            const readinessMeta = getCaseBasisReadinessMeta(basisDetail);
            const sellerSummary = getCaseBasisSellerSummary(basisDetail);
            const policyBasis = getCaseBasisPolicy(basisDetail);
            const movement = getCaseBasisMovementCopy(basisDetail, basisRow, financialSummary);
            const claimReadiness = getCaseBasisField(basisDetail, 'claim_readiness').toLowerCase();
            const reviewTier = getCaseBasisField(basisDetail, 'review_tier').toLowerCase();
            const whyNotClaimReady = getCaseBasisField(basisDetail, 'why_not_claim_ready');
            const isNotClaimReady = claimReadiness === 'not_claim_ready' || reviewTier === 'review_only' || reviewTier === 'monitoring';
            const policyEvidence = Array.isArray(policyBasis?.required_evidence) ? policyBasis.required_evidence.filter(Boolean) : [];
            const recordReference = basisDetail?.case_number || basisDetail?.claim_number || basisRow.case_number || 'Recovery record';

            return (
              <>
                <DialogHeader className="border-b border-white/10 px-6 py-5 pr-12">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.32]">Case Basis</div>
                      <DialogTitle className="mt-2 text-[22px] font-sans font-medium tracking-tight text-white">
                        {recordReference}
                      </DialogTitle>
                      <DialogDescription className="mt-2 max-w-2xl text-[12px] font-sans leading-5 tracking-tight text-white/[0.52]">
                        Why this recovery record exists, what supports it, and where it is moving.
                      </DialogDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {readinessMeta ? (
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight", readinessMeta.className)}>
                          {readinessMeta.label}
                        </span>
                      ) : null}
                      {isNotClaimReady ? (
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/45">
                          Review protected
                        </span>
                      ) : null}
                    </div>
                  </div>
                </DialogHeader>

                <div className="max-h-[calc(88vh-150px)] overflow-y-auto px-6">
                  {basisLoading ? (
                    <div className="flex items-center gap-2 border-b border-white/8 py-4 text-[11px] font-sans font-medium tracking-tight text-white/[0.52]">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/35" />
                      Loading backend case basis
                    </div>
                  ) : null}

                  {basisError ? (
                    <div className="border-b border-amber-400/20 py-4 text-[12px] font-sans leading-5 tracking-tight text-amber-100/78">
                      Unable to load backend case basis right now. Showing safe ledger fallback.
                    </div>
                  ) : null}

                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="border-b border-white/10 py-5 lg:border-r lg:pr-6">
                      <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">What Margin found</p>
                      <p className="mt-2 text-[15px] font-sans leading-6 tracking-tight text-white/[0.76]">
                        {getCaseBasisSummary(basisDetail, basisRow)}
                      </p>
                    </div>
                    <div className="border-b border-white/10 py-5 lg:pl-6">
                      <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">Evidence used</p>
                      <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                        {getCaseBasisEvidenceSummary(basisDetail, basisRow)}
                      </p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="border-b border-white/10 py-5 lg:border-r lg:pr-6">
                      <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">What may be owed</p>
                      <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                        {getCaseBasisAmountCopy(basisDetail, basisRow)}
                      </p>
                      {whyNotClaimReady ? (
                        <p className="mt-3 border-t border-white/8 pt-3 text-[12px] font-sans leading-5 tracking-tight text-amber-100/72">
                          {whyNotClaimReady}
                        </p>
                      ) : null}
                    </div>
                    <div className="border-b border-white/10 py-5 lg:pl-6">
                      <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">Why this may be recoverable</p>
                      <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                        {getCaseBasisRecoverabilityReason(basisDetail)}
                      </p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="border-b border-white/10 py-5 lg:border-r lg:pr-6">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">Current movement</p>
                        {movement.nextAction ? (
                          <span className="border border-white/10 px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/[0.46]">
                            {movement.nextAction}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] font-sans font-medium tracking-tight text-white/[0.82]">
                        {movement.label}
                      </p>
                      <p className="mt-2 text-[12px] font-sans leading-5 tracking-tight text-white/[0.52]">
                        {movement.detail}
                      </p>
                    </div>
                    <div className="border-b border-white/10 py-5 lg:pl-6">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.3]">Policy basis</p>
                        {policyBasis?.verification_status === 'policy_basis_pending_verification' ? (
                          <span className="text-[9px] font-sans font-medium uppercase tracking-tight text-amber-100/80">Pending verification</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-[13px] font-sans font-medium leading-tight tracking-tight text-white/[0.84]">
                        {policyBasis?.title || 'Policy basis pending verification'}
                      </p>
                      <p className="mt-2 text-[12px] font-sans leading-5 tracking-tight text-white/[0.52]">
                        {policyBasis?.summary || 'Margin has not mapped this record to a curated policy reference yet.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.36]">
                        {policyBasis?.source_url ? (
                          <a href={policyBasis.source_url} target="_blank" rel="noreferrer" className="transition-colors hover:text-white/70">
                            {policyBasis.source_name || 'Amazon Seller Central'}
                          </a>
                        ) : (
                          <span>{policyBasis?.source_name || 'Amazon Seller Central'}</span>
                        )}
                        <span className="text-white/18">/</span>
                        <span>{policyBasis?.last_verified_at ? `Verified ${stamp(policyBasis.last_verified_at)}` : 'Verification unavailable'}</span>
                      </div>
                      {policyEvidence.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {policyEvidence.slice(0, 4).map((item) => (
                            <span key={item} className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-sans font-medium tracking-tight text-white/[0.48]">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-white/10 px-6 py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-lg px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/45 hover:bg-white/[0.04] hover:text-white"
                    onClick={closeCaseBasis}
                  >
                    Close
                  </Button>
                  {detailRouteId ? (
                    <Button asChild className="h-9 rounded-lg border border-white/10 bg-white text-black px-4 text-[10px] font-sans font-bold uppercase tracking-tight hover:bg-white/90">
                      <Link to={`/app/${activeSlug}/recoveries/${detailRouteId}`} state={{ claim: basisRow }}>
                        Open full case record
                        <ArrowUpRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  ) : null}
                </DialogFooter>
              </>
            );
          })() : (
            <div className="p-6 text-[12px] font-sans text-white/54">No recovery record selected.</div>
          )}
        </DialogContent>
      </Dialog>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full border-white/10 bg-[#0c0c0c] p-0 text-white shadow-2xl sm:max-w-none md:w-[700px] xl:w-[48vw]">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-white/8 px-6 pb-5 pt-6 pr-14">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Extra info</div>
              <SheetTitle className="text-2xl font-sans font-bold tracking-tight text-white">
                {detailsRow?.case_number || 'Ledger Record'}
              </SheetTitle>
              <SheetDescription className="max-w-2xl text-[12px] font-sans leading-6 text-white/58">
                Transparency view for record identity, reconciliation truth, billing, payout proof, and timing.
              </SheetDescription>
            </SheetHeader>
          {detailsRow ? (() => {
            const financialSummary = detailsFinancialSummary || getFinancialSummaryForRow(detailsRow, financialSummaries);
            const hasRecoveryWork = hasRecoveryWorkEntity(detailsRow);
            const hasBillingWork = hasBillingWorkEntity(detailsRow);
            return (
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <DetailSection
                title="Record Identity"
                rows={[
                  { label: recordReferenceLabel(detailsRow), value: detailsRow.case_number || NOT_AVAILABLE },
                  { label: 'Merchant Reference', value: detailsRow.merchant_reference || NOT_AVAILABLE },
                  { label: 'Entity Type', value: entityTypeLabel(detailsRow.entity_type) },
                  { label: 'Display Identity', value: displayIdentityLabel(detailsRow) },
                  { label: 'Backend Row Type', value: rowTypeLabel(detailsRow.row_type) },
                  { label: 'Confirmed Dispute Case', value: boolTruth(detailsRow.has_real_dispute_case) },
                  { label: 'Dispute Case ID', value: detailsRow.dispute_case_id || NOT_AVAILABLE },
                  { label: 'Linked Dispute Case ID', value: detailsRow.linked_dispute_case_id || NOT_AVAILABLE },
                  { label: 'Confirmed Recovery Record', value: boolTruth(detailsRow.has_real_recovery_record) },
                  { label: 'Recovery Record ID', value: detailsRow.recovery_record_id || NOT_AVAILABLE },
                  { label: 'Provider Case', value: detailsRow.provider_case_id || NOT_AVAILABLE },
                  { label: 'Detection Result ID', value: detailsRow.detection_result_id || NOT_AVAILABLE },
                ]}
              />
              <DetailSection
                title="Status"
                rows={[
                  { label: 'Record Identity', value: identityTruthHeadline(detailsRow) },
                  { label: 'Identity Detail', value: identityTruthDetail(detailsRow) },
                  { label: 'Filing Status', value: detailsRow.filing_status ? label(detailsRow.filing_status) : NOT_AVAILABLE },
                  { label: 'Block Reasons', value: detailsRow.block_reasons?.length ? detailsRow.block_reasons.map(label).join(', ') : NOT_AVAILABLE },
                  { label: 'Last Filing Error', value: detailsRow.last_error || NOT_AVAILABLE },
                  { label: 'Operator State', value: label(detailsRow.operator_state) },
                  { label: 'Reconciliation State', value: label(detailsRow.reconciliation_status) },
                  { label: 'Reconciliation Source', value: reconciliationSourceLabel(detailsRow.reconciliation_source) },
                  { label: 'Reconciliation Detail', value: reconciliationTruthDetail(detailsRow) },
                  { label: 'Reconciliation Strategy', value: detailsRow.reconciliation_strategy ? formatAutonomyLabel(detailsRow.reconciliation_strategy) : NOT_AVAILABLE },
                  { label: 'Match Explanation', value: summarizeMatchExplanation(detailsRow.match_explanation) || NOT_AVAILABLE },
                  { label: 'Case Status', value: label(detailsRow.status) },
                  { label: 'Recovery Status', value: label(detailsRow.recovery_status) },
                  { label: 'Recovery Work', value: label(detailsRow.recovery_work_status) },
                  { label: 'Recovery Work Item', value: detailsRow.recovery_work_item_id || NOT_AVAILABLE },
                  { label: 'Recovery Lane', value: detailsRow.recovery_execution_lane ? label(detailsRow.recovery_execution_lane) : NOT_AVAILABLE },
                  { label: 'Recovery Runtime', value: detailsRow.recovery_last_runtime_role ? label(detailsRow.recovery_last_runtime_role) : NOT_AVAILABLE },
                  { label: 'Recovery Lock Owner', value: detailsRow.recovery_locked_by || NOT_AVAILABLE },
                  { label: 'Recovery Attempts', value: runtimeCounterValue(detailsRow.recovery_work_attempts, hasRecoveryWork) },
                  { label: 'Recovery Max Attempts', value: runtimeCounterValue(detailsRow.recovery_work_max_attempts, hasRecoveryWork) },
                  { label: 'Recovery Defers', value: runtimeCounterValue(detailsRow.recovery_defer_count, hasRecoveryWork) },
                  { label: 'Deferred Reason', value: detailsRow.recovery_last_deferred_reason ? label(detailsRow.recovery_last_deferred_reason) : NOT_AVAILABLE },
                  { label: 'Last Claimed', value: stamp(detailsRow.recovery_last_claimed_at) },
                  { label: 'Last Processed', value: stamp(detailsRow.recovery_last_processed_at) },
                  { label: 'Execution Processed', value: stamp(detailsRow.recovery_execution_processed_at) },
                  { label: 'Next Attempt', value: stamp(detailsRow.recovery_next_attempt_at) },
                  { label: 'Lifecycle State', value: detailsRow.recovery_lifecycle_state ? label(detailsRow.recovery_lifecycle_state) : NOT_AVAILABLE },
                  { label: 'Runtime State', value: detailsRow.recovery_operational_state ? formatAutonomyLabel(detailsRow.recovery_operational_state) : NOT_AVAILABLE },
                  { label: 'Runtime Explanation', value: formatBackendOperationalExplanation(detailsRow.recovery_operational_explanation) },
                  { label: 'Recovery Error', value: detailsRow.recovery_work_error || NOT_AVAILABLE },
                  { label: 'Investigation Required', value: detailsRow.investigation_required ? 'Yes' : 'No' },
                ]}
              />
              <DetailSection
                title="Financial Truth"
                rows={[
                  { label: 'Approved Value', value: money(detailsRow.approved_amount, detailsRow.currency) },
                  { label: 'Expected Payout', value: money(detailsRow.expected_payout_amount, detailsRow.currency) },
                  { label: 'Expected Payout Source', value: payoutSourceLabel(detailsRow.expected_payout_source) },
                  { label: 'Verified Paid', value: money(financialSummary?.verified_paid_amount, detailsRow.currency) },
                  { label: 'Actual Payout Source', value: payoutSourceLabel(detailsRow.actual_payout_source) },
                  { label: 'Payout Status', value: visiblePayoutStatusLabel(detailsRow.payout_status) },
                  { label: 'Outstanding', value: money(detailsRow.outstanding_amount, detailsRow.currency) },
                  { label: 'Variance', value: money(detailsRow.variance_amount, detailsRow.currency) },
                  { label: 'Source Rails', value: financialSummary?.source_types?.length ? financialSummary.source_types.map(financialSourceLabel).join(', ') : 'No financial events yet' },
                  { label: 'Legacy Case Payout Field', value: money(detailsRow.actual_payout_amount, detailsRow.currency) },
                ]}
              />
              <DetailSection
                title="Proof of Payment"
                rows={[
                  { label: 'Status', value: financialStatusDetail(financialSummary) },
                  { label: 'Paid Via Settlement', value: financialSummary?.proof_of_payment?.settlement_id || NOT_AVAILABLE },
                  { label: 'Payout Batch', value: financialSummary?.proof_of_payment?.payout_batch_id || NOT_AVAILABLE },
                  { label: 'Reference ID', value: financialSummary?.proof_of_payment?.reference_id || NOT_AVAILABLE },
                  { label: 'Payment Date', value: stamp(financialSummary?.proof_of_payment?.event_date) },
                  { label: 'Payment Source', value: financialSourceLabel(financialSummary?.proof_of_payment?.source) },
                ]}
              />
              <DetailSection
                title="Billing"
                rows={[
                  { label: 'Billing Status', value: label(detailsRow.billing_status) },
                  { label: 'Billing Work', value: label(detailsRow.billing_work_status) },
                  { label: 'Billing Work Item', value: detailsRow.billing_work_item_id || NOT_AVAILABLE },
                  { label: 'Billing Lane', value: detailsRow.billing_execution_lane ? label(detailsRow.billing_execution_lane) : NOT_AVAILABLE },
                  { label: 'Billing Runtime', value: detailsRow.billing_last_runtime_role ? label(detailsRow.billing_last_runtime_role) : NOT_AVAILABLE },
                  { label: 'Billing Lock Owner', value: detailsRow.billing_locked_by || NOT_AVAILABLE },
                  { label: 'Billing Attempts', value: runtimeCounterValue(detailsRow.billing_work_attempts, hasBillingWork) },
                  { label: 'Billing Max Attempts', value: runtimeCounterValue(detailsRow.billing_work_max_attempts, hasBillingWork) },
                  { label: 'Billing Defers', value: runtimeCounterValue(detailsRow.billing_defer_count, hasBillingWork) },
                  { label: 'Deferred Reason', value: detailsRow.billing_last_deferred_reason ? label(detailsRow.billing_last_deferred_reason) : NOT_AVAILABLE },
                  { label: 'Last Claimed', value: stamp(detailsRow.billing_last_claimed_at) },
                  { label: 'Last Processed', value: stamp(detailsRow.billing_last_processed_at) },
                  { label: 'Execution Processed', value: stamp(detailsRow.billing_execution_processed_at) },
                  { label: 'Next Attempt', value: stamp(detailsRow.billing_next_attempt_at) },
                  { label: 'Lifecycle State', value: detailsRow.billing_lifecycle_state ? label(detailsRow.billing_lifecycle_state) : NOT_AVAILABLE },
                  { label: 'Runtime State', value: detailsRow.billing_operational_state ? formatAutonomyLabel(detailsRow.billing_operational_state) : NOT_AVAILABLE },
                  { label: 'Runtime Explanation', value: formatBackendOperationalExplanation(detailsRow.billing_operational_explanation) },
                  { label: 'Billing Error', value: detailsRow.billing_work_error || NOT_AVAILABLE },
                  { label: 'Legacy Recovery Fee Amount', value: money(detailsRow.billed_revenue_amount, detailsRow.currency) },
                  { label: 'Currency', value: detailsRow.currency || 'USD' },
                ]}
              />
              <DetailSection
                title="Currentness"
                rows={[
                  { label: 'Last Updated', value: stamp(detailsRow.last_updated_at) },
                  { label: 'Expected Payout Date (Estimate)', value: stamp(detailsRow.expected_payout_date) },
                  { label: 'Detail Route ID', value: getDetailRouteId(detailsRow) || NOT_AVAILABLE },
                ]}
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Financial Events Timeline</div>
                  {detailsFinancialLoading ? <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/38">Loading proof…</div> : null}
                </div>
                <div className="mt-4 space-y-3">
                  {!detailsFinancialLoading && detailsFinancialEvents.length === 0 ? (
                    <div className="text-[11px] font-sans font-semibold tracking-tight text-white/70">No payout recorded yet.</div>
                  ) : detailsFinancialEvents.map((event) => (
                    <div key={event.event_id} className="rounded-xl border border-white/8 bg-black/30 p-4">
                      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="text-[11px] font-sans font-semibold tracking-tight text-white/92">{labelFinancialEventType(event.event_type, event.event_subtype)}</div>
                          <div className="mt-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/42">
                            {financialSourceLabel(event.source)} · {stamp(event.event_date)}
                          </div>
                        </div>
                        <div className="text-[12px] font-sans font-semibold tracking-tight text-white/88">{money(event.amount, event.currency)}</div>
                      </div>
                      <div className="mt-3 grid gap-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/52 xl:grid-cols-2">
                        <div>Reference: {event.reference_id || NOT_AVAILABLE}</div>
                        <div>Settlement: {event.settlement_id || NOT_AVAILABLE}</div>
                        <div>Batch: {event.payout_batch_id || NOT_AVAILABLE}</div>
                        <div>Order / SKU: {[event.amazon_order_id, event.sku].filter(Boolean).join(' / ') || NOT_AVAILABLE}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })() : null}
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
