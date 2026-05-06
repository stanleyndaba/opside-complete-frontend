import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AiExplanationDialog } from '@/components/ai/AiExplanationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle,
  Calendar, RefreshCw, ExternalLink, Receipt, ChevronDown, ShieldCheck, Activity,
  BarChart3, Database, History, ArrowRight, Upload, ChevronRight, Scale, Info,
  Zap, ShieldAlert, Download, Loader2, X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAiExplanation } from '@/hooks/useAiExplanation';
import { formatAutonomyLabel, sellerSafeOperationalText, summarizeExplanationPayload, summarizeOperationalExplanation } from '@/lib/autonomyTruth';
import {
  formatEligibilityStatus,
  formatDisputeReason,
  formatPayoutProofStatus,
  formatProofStatus,
  formatRequirementList,
} from '@/lib/disputeProof';
import { parseDefaultSSEMessage, registerNamedSSEListeners } from '@/lib/sse';
import { createAuthenticatedEventStream } from '@/lib/authenticatedSSE';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

// Rejection reason classification
type RejectionReason = 'missing_evidence' | 'wrong_category' | 'expired_window' | 'amount_disputed' | 'generic_denial' | 'duplicate_claim' | 'insufficient_info' | 'inbound_damage';

const REJECTION_CATEGORY_TO_PLAYBOOK: Record<string, RejectionReason> = {
  MISSING_DOCUMENT: 'missing_evidence',
  OUT_OF_WINDOW: 'expired_window',
  ALREADY_REIMBURSED: 'duplicate_claim',
  INSUFFICIENT_EVIDENCE: 'insufficient_info',
  INVALID_CLAIM: 'generic_denial',
};

const POLICY_MAP: Record<string, { code: string; title: string; link: string; clause?: string }> = {
  lost_warehouse: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound/Warehouse',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.1: Lost in Warehouse'
  },
  damaged_warehouse: {
    code: 'FBA 9.2',
    title: 'Inventory Reimbursement - Warehouse Handling',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.2: Damaged in Warehouse'
  },
  lost_inbound: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound Shipments',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.3: Lost Inbound'
  },
  damaged_inbound: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound Shipments',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.4: Damaged Inbound'
  },
  refund_without_return: {
    code: 'FBA §4.2(b)',
    title: 'Customer Returns Reimbursement Policy',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200379860',
    clause: 'Clause 4.2.b: Refund Without Return'
  }
};

const AGENT_NAMES: Record<string, string> = {
  'data_sync': 'Agent 2: Sync Signal',
  'detection': 'Agent 3: Inbound Inspector',
  'evidence_ingestion': 'Agent 4: Evidence Harvester',
  'document_parsing': 'Agent 5: Optical Reader',
  'evidence_matching': 'Agent 6: Pattern Matcher',
  'refund_filing': 'Agent 7',
  'recoveries': 'Agent 8: Recovery Engine',
  'billing': 'Agent 9: Ledger Bot',
  'notifications': 'Agent 10: Comms Relay',
  'learning': 'Agent 11: Logic Optimizer'
};

interface EscalationPlaybook {
  reason: RejectionReason;
  label: string;
  description: string;
  actions: string[];
  autoTriggerable: boolean;
}

const escalationPlaybooks: Record<RejectionReason, EscalationPlaybook> = {
  missing_evidence: {
    reason: 'missing_evidence',
    label: 'Missing Evidence',
    description: 'Amazon needs additional documentation.',
    actions: ['Check Doc Locker for matching docs', 'Upload invoice, POD, or shipment confirmation', 'Re-submit with complete evidence'],
    autoTriggerable: true
  },
  wrong_category: {
    reason: 'wrong_category',
    label: 'Wrong Category',
    description: 'Claim filed under incorrect type.',
    actions: ['Review claim type against guidelines', 'Reclassify to appropriate category', 'Re-file with corrected type'],
    autoTriggerable: true
  },
  expired_window: {
    reason: 'expired_window',
    label: 'Expired Window',
    description: 'Filing window has passed.',
    actions: ['Verify discovery date accuracy', 'Check if exception applies', 'Document Amazon-caused delays'],
    autoTriggerable: false
  },
  amount_disputed: {
    reason: 'amount_disputed',
    label: 'Amount Disputed',
    description: 'Amazon disagrees with claimed amount.',
    actions: ['Review Amazon\'s calculated value', 'Provide cost documentation', 'Accept adjusted amount or appeal'],
    autoTriggerable: true
  },
  generic_denial: {
    reason: 'generic_denial',
    label: 'Generic Denial',
    description: 'Denied without specific reason.',
    actions: ['Request clarification', 'Compile comprehensive evidence', 'Re-submit with policy argument'],
    autoTriggerable: false
  },
  duplicate_claim: {
    reason: 'duplicate_claim',
    label: 'Duplicate Claim',
    description: 'Already filed or resolved.',
    actions: ['Check for previous case IDs', 'Verify if reimbursement issued', 'Appeal only if truly not resolved'],
    autoTriggerable: false
  },
  insufficient_info: {
    reason: 'insufficient_info',
    label: 'Insufficient Info',
    description: 'Lacks required details.',
    actions: ['Add order IDs, SKUs, dates', 'Include FBA shipment IDs', 'Provide quantity/value breakdown'],
    autoTriggerable: true
  },
  inbound_damage: {
    reason: 'inbound_damage',
    label: 'Inbound Damage Dispute',
    description: 'Amazon claims damage occurred prior to arrival at FC.',
    actions: ['Retrieve carrier damage insurance records', 'Provide "Condition upon Loading" timestamped photos', 'Link FBA check-in logs showing delayed offloading'],
    autoTriggerable: false
  }
};

// Classify rejection reason from status/notes
const classifyRejection = (status: string, notes?: string): RejectionReason => {
  const text = `${status} ${notes || ''}`.toLowerCase();
  if (text.includes('document') || text.includes('evidence') || text.includes('proof')) return 'missing_evidence';
  if (text.includes('category') || text.includes('type') || text.includes('classif')) return 'wrong_category';
  if (text.includes('expired') || text.includes('window') || text.includes('late') || text.includes('deadline')) return 'expired_window';
  if (text.includes('amount') || text.includes('value') || text.includes('price') || text.includes('partial')) return 'amount_disputed';
  if (text.includes('duplicate') || text.includes('already') || text.includes('previous')) return 'duplicate_claim';
  if (text.includes('info') || text.includes('detail') || text.includes('incomplete')) return 'insufficient_info';
  return 'generic_denial';
};


const getStatusColor = (status: string) => {
  switch (status) {
    case 'Guaranteed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Under Review':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Paid Out':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Awaiting Approval':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getEventIcon = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return <AlertCircle className="h-4 w-4" />;
    case 'analysis':
      return <FileText className="h-4 w-4" />;
    case 'generation':
      return <FileText className="h-4 w-4" />;
    case 'submission':
      return <Package className="h-4 w-4" />;
    case 'update':
      return <Clock className="h-4 w-4" />;
    case 'completion':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventColor = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return 'text-amber-600';
    case 'analysis':
      return 'text-blue-600';
    case 'generation':
      return 'text-purple-600';
    case 'submission':
      return 'text-emerald-600';
    case 'update':
      return 'text-gray-600';
    case 'completion':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

const NOT_AVAILABLE = 'Not Available';

const toStatusLabel = (value?: string | null) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === '-' || normalized.toLowerCase() === 'n/a') return NOT_AVAILABLE;
  return normalized.replace(/_/g, ' ');
};

const normalizeLifecycleValue = (value?: unknown) => String(value || '').trim().toLowerCase();

const positiveAmount = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const hasTrustedFilingTruth = (caseData: any) => Boolean(
  caseData?.has_filing_truth === true ||
  caseData?.has_submission_proof === true ||
  caseData?.has_amazon_reference === true ||
  (
    caseData?.has_submission === true &&
    (
      caseData?.submission_proof?.proof_present === true ||
      caseData?.submission_proof?.proof_reference ||
      caseData?.amazonCaseId ||
      caseData?.amazon_case_id ||
      caseData?.provider_case_id
    )
  )
);

const hasTrustedApprovalTruth = (caseData: any) => Boolean(
  hasTrustedFilingTruth(caseData) && caseData?.has_approval_truth === true
);

const hasTrustedPayoutTruth = (caseData: any) => Boolean(
  caseData?.has_payout === true &&
  (
    positiveAmount(caseData?.actual_payout_amount) !== null ||
    positiveAmount(caseData?.recovered_amount) !== null ||
    caseData?.payout_proof_status === 'verified'
  )
);

const getCaseBlockerSummary = (caseData: any) => {
  const blockers = Array.isArray(caseData?.block_reasons)
    ? caseData.block_reasons.slice(0, 2).map((reason: string) => formatDisputeReason(reason)).filter(Boolean)
    : [];
  const lastError = String(caseData?.last_error || '').trim();
  const safeLastError = sellerSafeOperationalText(lastError, '');

  if (safeLastError && safeLastError !== lastError) return safeLastError;
  if (blockers.length > 0) return blockers.join(', ');

  return safeLastError || null;
};

const hasCaseSubmissionDivergence = (caseData: any) => {
  return caseData?.submission_state_divergence === true ||
    (Array.isArray(caseData?.block_reasons) &&
      caseData.block_reasons.some((reason: string) => normalizeLifecycleValue(reason) === 'submission_state_divergence'));
};

const formatSellerCaseFilingStatus = (caseData: any, proofStatus?: string | null) => {
  const filingStatus = normalizeLifecycleValue(caseData?.filing_status);
  const eligibilityStatus = normalizeLifecycleValue(caseData?.eligibility_status).toUpperCase();
  const normalizedProofStatus = normalizeLifecycleValue(proofStatus || caseData?.proof_status);

  if (hasCaseSubmissionDivergence(caseData)) return 'Reconciliation needed';
  if (filingStatus === 'pending' && (caseData?.eligible_to_file === true || eligibilityStatus === 'READY' || normalizedProofStatus === 'filing_ready')) {
    return 'Ready to file';
  }
  if (filingStatus === 'pending') return 'Waiting for proof';
  if (filingStatus === 'submitting') return 'Being filed now';
  if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'resubmitted') {
    return hasTrustedFilingTruth(caseData) ? 'Filed' : 'Filing proof needed';
  }
  if (filingStatus === 'blocked') return 'Blocked';
  if (filingStatus === 'payment_required') return 'Payment required';
  if (filingStatus === 'pending_safety_verification') return 'Needs safety verification';
  if (filingStatus === 'failed') return 'Failed';
  if (filingStatus === 'retrying') return 'Ready to retry';

  return toStatusLabel(caseData?.filing_status);
};

const getCaseFilingTruthLine = (caseData: any, proofStatus?: string | null) => {
  const filingStatus = normalizeLifecycleValue(caseData?.filing_status);
  const eligibilityStatus = normalizeLifecycleValue(caseData?.eligibility_status).toUpperCase();
  const normalizedProofStatus = normalizeLifecycleValue(proofStatus || caseData?.proof_status);
  const blockers = getCaseBlockerSummary(caseData);

  if (hasCaseSubmissionDivergence(caseData)) {
    return 'Submission proof exists, but case state needs reconciliation before Margin treats the filed state as clean.';
  }

  if (filingStatus === 'pending' && (caseData?.eligible_to_file === true || eligibilityStatus === 'READY' || normalizedProofStatus === 'filing_ready')) {
    return 'Proof requirements are complete. This case is ready, but it has not been submitted yet.';
  }

  if (filingStatus === 'submitting') {
    return 'Margin is actively submitting now; the next state should be filed with proof, failed, or blocked with a reason.';
  }

  if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'resubmitted') {
    return hasTrustedFilingTruth(caseData)
      ? 'Submission proof has been recorded.'
      : 'Internal filed state is recorded, but Margin has not verified an Amazon submission reference for this case yet.';
  }

  if (filingStatus === 'payment_required') {
    return 'Payment is required before Margin can file this case.';
  }

  if (filingStatus === 'blocked' || filingStatus === 'pending_safety_verification' || filingStatus === 'failed') {
    if (blockers) {
      const safeBlocker = sellerSafeOperationalText(blockers, blockers);
      return safeBlocker !== blockers
        ? safeBlocker
        : `Blocked until ${blockers.toLowerCase()} is cleared.`;
    }
    return 'Blocked until the recorded filing gate clears.';
  }

  return sellerSafeOperationalText(blockers || '', 'Margin files only when proof requirements are met.');
};

const toEntityLabel = (value?: string | null) => {
  const normalized = String(value || '').trim();
  if (!normalized || normalized === '-' || normalized.toLowerCase() === 'n/a') return NOT_AVAILABLE;
  return normalized.replace(/_/g, ' ');
};

const toEventSourceLabel = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return NOT_AVAILABLE;
  if (normalized === 'agent_event') return 'Agent Event';
  if (normalized === 'notification') return 'Notification';
  return String(value).replace(/[_-]+/g, ' ');
};

const formatEventTimestamp = (value?: string | null) => {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
};

const asPlainObject = (value: any) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}
);

const getDocumentEvidenceTitle = (doc: any, index: number) => {
  const metadata = asPlainObject(doc?.metadata);
  const parsedMetadata = asPlainObject(doc?.parsed_metadata);
  const identifiers = asPlainObject(parsedMetadata?.identifiers);
  const explicitTitle = String(metadata?.evidence_title || metadata?.title || doc?.title || '').trim();
  if (explicitTitle) return explicitTitle;

  const typeLabel = String(doc?.doc_type || metadata?.doc_type || metadata?.document_type || 'Evidence')
    .replace(/[_-]+/g, ' ')
    .trim();
  const invoiceNumber = String(doc?.invoice_number || metadata?.invoice_number || identifiers?.invoiceNumber || '').trim();
  const supplier = String(doc?.supplier_name || metadata?.supplier || metadata?.supplier_name || '').trim();
  const filename = String(doc?.name || doc?.filename || metadata?.original_filename || '').trim();

  if (invoiceNumber && supplier) return `${typeLabel} ${invoiceNumber} - ${supplier}`;
  if (invoiceNumber) return `${typeLabel} ${invoiceNumber}`;
  if (supplier && filename) return `${supplier} - ${filename}`;
  return filename || `Evidence document ${index + 1}`;
};

const getDocumentEvidenceSubtitle = (doc: any) => {
  const metadata = asPlainObject(doc?.metadata);
  const parsedMetadata = asPlainObject(doc?.parsed_metadata);
  const extracted = asPlainObject(doc?.extracted);
  const parsedItems = Array.isArray(parsedMetadata?.items) ? parsedMetadata.items : [];
  const extractedItems = Array.isArray(extracted?.items) ? extracted.items : [];
  const firstItem = asPlainObject(parsedItems[0] || extractedItems[0]);
  const quantity = metadata?.quantity ?? firstItem?.quantity;
  const unitCost = metadata?.unit_cost ?? firstItem?.unit_cost ?? firstItem?.unitPrice ?? doc?.unit_manufacturing_cost;
  const totalAmount = doc?.total_amount ?? metadata?.amount;
  const unitCostNumber = Number(unitCost);
  const totalAmountNumber = Number(totalAmount);
  const parts = [
    doc?.doc_type ? String(doc.doc_type).replace(/[_-]+/g, ' ') : null,
    quantity ? `${quantity} units` : null,
    Number.isFinite(unitCostNumber) ? `$${unitCostNumber.toFixed(2)}/unit` : null,
    Number.isFinite(totalAmountNumber) ? `$${totalAmountNumber.toFixed(2)} total` : null,
  ].filter(Boolean);

  return parts.join(' | ');
};

const formatThreadStateLabel = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return NOT_AVAILABLE;
  return normalized.replace(/_/g, ' ');
};

const getThreadStateTone = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'paid') return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
  if (normalized === 'approved') return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
  if (normalized === 'needs_evidence') return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
  if (normalized === 'rejected') return 'text-red-400 border-red-500/20 bg-red-500/10';
  if (normalized === 'unlinked') return 'text-white/40 border-white/10 bg-white/[0.03]';
  return 'text-white/70 border-white/10 bg-white/[0.03]';
};

const buildUnavailableCaseDetail = (fallbackId: string, failureReason?: string | null) => ({
  id: fallbackId,
  truth_unavailable: true,
  entity_type: null,
  has_linked_dispute_case: null,
  dispute_case_id: null,
  linked_dispute_case_id: null,
  has_submission: null,
  has_submission_proof: null,
  has_amazon_reference: null,
  has_filing_truth: null,
  has_approval_truth: null,
  has_payout: null,
  submission_proof: null,
  detection_result_id: null,
  title: NOT_AVAILABLE,
  status: null,
  filing_status: null,
  filing_strategy: null,
  explanation_payload: null,
  operational_state: null,
  operational_explanation: null,
  recovery_status: null,
  billing_status: null,
  block_reasons: [],
  last_error: failureReason || null,
  proof_status: null,
  missing_requirements: null,
  manual_review_reason: null,
  payout_proof_status: null,
  quarantine_reason: null,
  eligibility_status: null,
  guaranteedAmount: null,
  estimated_claim_value: null,
  requested_amount: null,
  approved_amount: null,
  recovered_amount: null,
  actual_payout_amount: null,
  billed_amount: null,
  expectedPayoutDate: null,
  createdDate: null,
  updated_at: null,
  sku: NOT_AVAILABLE,
  asin: NOT_AVAILABLE,
  productName: NOT_AVAILABLE,
  facility: NOT_AVAILABLE,
  unitsLost: null,
  units_is_verified: false,
  unitCost: null,
  confidence: null,
  evidenceStatus: null,
  documents: [],
  events: [],
  evidence: {},
  evidence_summary: {},
  evidence_attachments: null,
  finding_truth: null,
  seller_summary: null,
  policy_basis: null,
  filing_movement: null,
  review_tier: null,
  claim_readiness: null,
  recommended_action: null,
  value_label: null,
  why_not_claim_ready: null,
  coverage_family: null,
  claim_number: null,
  generated_context: {
    summaryLabel: NOT_AVAILABLE,
    strategyLabel: NOT_AVAILABLE,
    trustLabel: NOT_AVAILABLE,
    generated: false
  },
  next_step_context: {
    key: 'truth_unavailable',
    title: NOT_AVAILABLE,
    description: NOT_AVAILABLE,
    generated: false
  },
  rejection_category: null,
  rejection_reason: null,
  autonomous_logic_summary: NOT_AVAILABLE,
  playbook: {
    title: NOT_AVAILABLE,
    council: [],
    steps: [NOT_AVAILABLE]
  },
  protection_protocol: [NOT_AVAILABLE],
  seller_id: NOT_AVAILABLE,
  user_id: NOT_AVAILABLE,
  store_name: NOT_AVAILABLE,
  prior_case_id: NOT_AVAILABLE,
  amazonCaseId: null,
  case_state: 'unlinked',
  amazon_thread_linked: false,
  case_origin: null,
  origin_metadata: {},
  thread_backfilled_at: null,
  can_reply_to_thread: false,
  case_messages: [],
  currency: 'USD'
});

const normalizeCaseDetailData = (apiData: any, fallbackId?: string) => {
  const caseOrigin = apiData.case_origin || null;
  const originMetadata = apiData.origin_metadata && typeof apiData.origin_metadata === 'object'
    ? apiData.origin_metadata
    : {};
  const claimAmountUnknown = caseOrigin === 'amazon_thread_backfill' && originMetadata?.claim_amount_unknown === true;

  return {
  ...apiData,
  id: apiData.id || fallbackId || null,
  entity_type: apiData.entity_type || null,
  has_linked_dispute_case: typeof apiData.has_linked_dispute_case === 'boolean' ? apiData.has_linked_dispute_case : null,
  dispute_case_id: apiData.dispute_case_id || null,
  linked_dispute_case_id: apiData.linked_dispute_case_id || null,
  has_submission: typeof apiData.has_submission === 'boolean' ? apiData.has_submission : null,
  has_submission_proof: typeof apiData.has_submission_proof === 'boolean' ? apiData.has_submission_proof : null,
  has_amazon_reference: typeof apiData.has_amazon_reference === 'boolean' ? apiData.has_amazon_reference : null,
  has_filing_truth: typeof apiData.has_filing_truth === 'boolean' ? apiData.has_filing_truth : null,
  has_approval_truth: typeof apiData.has_approval_truth === 'boolean' ? apiData.has_approval_truth : null,
  has_payout: typeof apiData.has_payout === 'boolean' ? apiData.has_payout : null,
  submission_proof: apiData.submission_proof || null,
  detection_result_id: apiData.detection_result_id || null,
  title: apiData.title || apiData.details || apiData.anomaly_type || 'Claim Details',
  status: apiData.status || null,
  case_state: apiData.case_state || (apiData.amazonCaseId || apiData.amazon_case_id ? 'pending' : 'unlinked'),
  filing_status: apiData.filing_status || null,
  filing_strategy: apiData.filing_strategy || apiData.evidence_attachments?.decision_intelligence?.filing_strategy || null,
  explanation_payload: apiData.explanation_payload || apiData.evidence_attachments?.decision_intelligence?.explanation_payload || null,
  operational_state: apiData.operational_state || apiData.evidence_attachments?.decision_intelligence?.operational_state || null,
  operational_explanation: apiData.operational_explanation || apiData.evidence_attachments?.decision_intelligence?.operational_explanation || null,
  recovery_status: apiData.recovery_status || null,
  billing_status: apiData.billing_status || null,
  eligibility_status: apiData.eligibility_status || apiData.evidence_attachments?.decision_intelligence?.eligibility_status || null,
  case_origin: caseOrigin,
  origin_metadata: originMetadata,
  thread_backfilled_at: apiData.thread_backfilled_at || null,
  block_reasons: Array.isArray(apiData.block_reasons) ? apiData.block_reasons : [],
  last_error: apiData.last_error || null,
  proof_status: apiData.proof_status || null,
  missing_requirements: Array.isArray(apiData.missing_requirements) ? apiData.missing_requirements : null,
  manual_review_reason: apiData.manual_review_reason || null,
  payout_proof_status: apiData.payout_proof_status || null,
  quarantine_reason: apiData.quarantine_reason || null,
  updated_at: apiData.updated_at || apiData.created_at || apiData.createdDate || null,
  guaranteedAmount: claimAmountUnknown ? null : (apiData.guaranteedAmount ?? apiData.requested_amount ?? apiData.claim_amount ?? apiData.estimated_claim_value ?? apiData.estimated_value ?? null),
  estimated_claim_value: claimAmountUnknown ? null : (apiData.estimated_claim_value ?? apiData.estimated_recovery_amount ?? apiData.estimated_value ?? apiData.guaranteedAmount ?? null),
  requested_amount: claimAmountUnknown ? null : (apiData.requested_amount ?? apiData.claim_amount ?? apiData.guaranteedAmount ?? null),
  approved_amount: apiData.approved_amount ?? null,
  recovered_amount: apiData.recovered_amount ?? apiData.actual_payout_amount ?? null,
  actual_payout_amount: apiData.actual_payout_amount ?? apiData.recovered_amount ?? null,
  billed_amount: apiData.billed_amount ?? null,
  expectedPayoutDate: apiData.expectedPayoutDate || apiData.expected_payout_date || null,
  createdDate: apiData.createdDate || apiData.created_at || apiData.discovery_date || null,
  sku: (apiData.sku && apiData.sku !== 'N/A') ? apiData.sku :
    (apiData.evidence?.sku && apiData.evidence?.sku !== 'N/A') ? apiData.evidence.sku : '-',
  asin: apiData.asin || apiData.evidence?.asin || null,
  productName: apiData.productName || apiData.details || apiData.anomaly_type || 'Unknown Product',
  facility: apiData.facility || apiData.evidence?.fulfillment_center || apiData.warehouse || null,
  unitsLost: apiData.unitsLost ?? apiData.units_lost ?? apiData.evidence?.quantity ?? null,
  units_is_verified: apiData.units_is_verified === true,
  unitCost: apiData.unitCost ?? apiData.unit_cost ?? null,
  confidence: typeof apiData.confidence === 'number' ? apiData.confidence : null,
  evidenceStatus: apiData.evidenceStatus || apiData.evidence_status || null,
  amazon_thread_linked: apiData.amazon_thread_linked === true,
  can_reply_to_thread: apiData.can_reply_to_thread === true,
  documents: Array.isArray(apiData.documents) ? apiData.documents : [],
  events: Array.isArray(apiData.events) ? apiData.events : [],
  case_messages: Array.isArray(apiData.case_messages) ? apiData.case_messages : [],
  evidence: apiData.evidence || {},
  evidence_summary: apiData.evidence_summary || {},
  evidence_attachments: apiData.evidence_attachments || null,
  finding_truth: apiData.finding_truth || null,
  seller_summary: apiData.finding_truth?.seller_summary || apiData.seller_summary || null,
  policy_basis: apiData.finding_truth?.policy_basis || apiData.policy_basis || null,
  filing_movement: apiData.finding_truth?.filing_movement || apiData.filing_movement || null,
  review_tier: apiData.finding_truth?.review_tier || apiData.review_tier || null,
  claim_readiness: apiData.finding_truth?.claim_readiness || apiData.claim_readiness || null,
  recommended_action: apiData.finding_truth?.recommended_action || apiData.recommended_action || null,
  value_label: apiData.finding_truth?.value_label || apiData.value_label || null,
  why_not_claim_ready: apiData.finding_truth?.why_not_claim_ready || apiData.why_not_claim_ready || null,
  coverage_family: apiData.finding_truth?.coverage_family || apiData.coverage_family || null,
  claim_number: apiData.claim_number || apiData.evidence?.claim_number || null,
  generated_context: apiData.generated_context || null,
  next_step_context: apiData.next_step_context || null,
  rejection_category: apiData.rejection_category || apiData.evidence_attachments?.rejection_category || null,
  rejection_reason: apiData.rejection_reason || null,
  };
};

const isEvidenceRelatedEvent = (event: any) => {
  const type = String(event?.type || '').toLowerCase();
  const status = String(event?.status || '').toLowerCase();
  const eventType = String(event?.eventType || '').toLowerCase();
  return Boolean(
    (Array.isArray(event?.docIds) && event.docIds.length > 0) ||
    type === 'evidence' ||
    status === 'verified' ||
    status === 'matched' ||
    eventType.includes('evidence') ||
    eventType.includes('matching') ||
    eventType.includes('parsing') ||
    eventType.includes('ingestion')
  );
};

// Get required documents based on claim type
const getRequiredDocsForClaimType = (claimType?: string): string[] => {
  const type = (claimType || '').toLowerCase();

  if (type.includes('lost') || type.includes('missing')) {
    return [
      'Inventory report showing missing units',
      'Shipment confirmation or BOL',
      'Proof of purchase/invoice for lost items'
    ];
  }
  if (type.includes('damaged') || type.includes('damage')) {
    return [
      'Photos of damaged products',
      'Original invoice/receipt',
      'Carrier damage report (if applicable)'
    ];
  }
  if (type.includes('return') || type.includes('refund')) {
    return [
      'Return tracking confirmation',
      'Original order invoice',
      'Proof of item condition before return'
    ];
  }
  if (type.includes('fee') || type.includes('overcharge')) {
    return [
      'Fee breakdown statement',
      'Product dimension/weight documentation',
      'Original listing details'
    ];
  }
  if (type.includes('inbound') || type.includes('shipment')) {
    return [
      'Shipment tracking/BOL',
      'Packing list with quantities',
      'Supplier invoice'
    ];
  }
  // Default fallback
  return [
  ];
};

// Generate narrative "What Happened" story for a claim
const generateNarrative = (claim: any): string => {
  const caseType = (claim.anomaly_type || claim.claim_type || claim.case_type || '').toLowerCase();
  const amount = claim.guaranteedAmount || claim.amount || claim.estimated_value || claim.claim_amount || 0;
  const formattedAmount = `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const sku = claim.sku || claim.evidence?.sku || 'N/A';
  const asin = claim.asin || claim.evidence?.asin || 'N/A';
  const orderId = claim.order_id || claim.evidence?.order_id || '';
  const facility = claim.facility || claim.evidence?.fulfillment_center || '';
  const units = claim.units_lost || claim.unitsLost || claim.quantity || claim.units || '';
  const dateStr = claim.discovery_date || claim.created_at || claim.createdDate;
  const detectionDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // Determine case category for professional narrative
  const isFeeCase = caseType.includes('fee') || caseType.includes('overcharge') || caseType.includes('commission') || caseType.includes('storage') || caseType.includes('lts');
  const isLostCase = caseType.includes('lost') || caseType.includes('missing') || caseType.includes('shipment') || caseType.includes('shortage') || caseType.includes('discrepancy') || caseType.includes('inbound');
  const isDamagedCase = caseType.includes('damaged') || caseType.includes('damage') || caseType.includes('carrier');
  const isRefundCase = caseType.includes('refund') || caseType.includes('return') || caseType.includes('switcheroo') || caseType.includes('wrong_item') || caseType.includes('empty_box');
  const isChargebackCase = caseType.includes('chargeback') || caseType.includes('dispute') || caseType.includes('atoz');

  // Build professional executive summary based on case type
  let narrative = '';

  if (isFeeCase) {
    narrative = `Amazon FBA has applied incorrect fulfillment fees to ASIN ${asin}`;
    if (caseType.includes('storage') || caseType.includes('lts')) {
      narrative += ` based on erroneous storage fee calculations. The product has been consistently overcharged for storage fees`;
    } else if (caseType.includes('commission')) {
      narrative += ` resulting in referral fee overcharges. Amazon's system has applied incorrect commission rates`;
    } else {
      narrative += ` based on incorrect dimensional/weight data in Amazon's catalog system. The product has been consistently mis-measured`;
    }
    narrative += `, resulting in oversized/overweight fee categorization when the product should fall within standard rates. `;
    narrative += `This systematic measurement error has resulted in cumulative overcharges totaling ${formattedAmount}.`;
  } else if (isLostCase) {
    const unitText = units ? `${units} units` : 'inventory';
    if (caseType.includes('inbound') || caseType.includes('shipment')) {
      narrative = `Amazon received an inbound shipment containing ${unitText} of SKU ${sku}`;
      if (facility) narrative += ` at fulfillment center ${facility}`;
      if (detectionDate) narrative += ` on ${detectionDate}`;
      narrative += `, but the full quantity was not checked into available inventory. `;
      narrative += `The shipment shows as "Receiving Discrepancy" with ${unitText} remaining unaccounted for after 30+ days. `;
    } else {
      narrative = `Amazon's inventory management system shows ${unitText} of SKU ${sku} as missing from fulfillment center${facility ? ` ${facility}` : ''}. `;
      narrative += `These units were properly received but have since disappeared from available inventory without corresponding customer orders or removals. `;
    }
    narrative += `This inventory discrepancy represents a recoverable value of ${formattedAmount}.`;
  } else if (isDamagedCase) {
    const unitText = units ? `${units} units` : 'inventory';
    narrative = `Amazon FBA has reported ${unitText} of SKU ${sku} as damaged while in Amazon's possession`;
    if (facility) narrative += ` at fulfillment center ${facility}`;
    narrative += `. The damage occurred during `;
    if (caseType.includes('carrier')) {
      narrative += `carrier transit to the fulfillment center, `;
    } else if (caseType.includes('inbound')) {
      narrative += `the inbound receiving process, `;
    } else {
      narrative += `warehouse handling and storage, `;
    }
    narrative += `which falls under Amazon's responsibility for product care. `;
    narrative += `This damage has resulted in a loss of ${formattedAmount} that qualifies for seller reimbursement.`;
  } else if (isRefundCase) {
    narrative = `Amazon issued a customer refund for Order ${orderId || 'N/A'}`;
    if (caseType.includes('switcheroo')) {
      narrative += `, but the customer returned a different item than what was originally purchased. This "switcheroo" fraud `;
    } else if (caseType.includes('wrong_item')) {
      narrative += `, but the returned item does not match the original product. The wrong item `;
    } else if (caseType.includes('empty_box')) {
      narrative += `, but the return package was received empty or with missing contents. This `;
    } else {
      narrative += `, however the return was never received at the fulfillment center. After the standard return window (45+ days), this `;
    }
    narrative += `qualifies for seller reimbursement under Amazon's FBA policy. `;
    narrative += `The unrecovered value totals ${formattedAmount}.`;
  } else if (isChargebackCase) {
    narrative = `A payment chargeback/claim was filed against Order ${orderId || 'N/A'}`;
    if (caseType.includes('atoz')) {
      narrative += ` through Amazon's A-to-Z Guarantee program. `;
    } else {
      narrative += ` that was not properly defended. `;
    }
    narrative += `Delivery confirmation and tracking data show the order was successfully delivered to the customer, making this claim eligible for dispute. `;
    narrative += `The contested amount is ${formattedAmount}.`;
  } else {
    // Fallback for unknown case types
    const typeDisplay = caseType.replace(/_/g, ' ') || 'discrepancy';
    narrative = `Margin's audit engine detected a ${typeDisplay} affecting SKU ${sku}`;
    if (asin !== 'N/A') narrative += ` (ASIN: ${asin})`;
    if (detectionDate) narrative += ` on ${detectionDate}`;
    narrative += `. `;
    narrative += `Based on automated analysis of fulfillment records, this ${typeDisplay} represents a recoverable value of ${formattedAmount}. `;
    narrative += `The case has been flagged for review and submission to Amazon Seller Support.`;
  }

  return narrative;
};

export default function CaseDetail() {
  const { caseId, tenantSlug } = useParams<{ caseId: string; tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const { isAuthReady, isSessionValid } = useSession();
  const activeSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);
  const aiExplainEnabled = activeSlug === 'demo-workspace';
  const navigate = useNavigate();

  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const seedCaseData = useMemo(() => (
    passedClaim ? normalizeCaseDetailData(passedClaim, caseId) : null
  ), [caseId, passedClaim]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('PDF Preview');
  const [pdfPreviewLabel, setPdfPreviewLabel] = useState('Document Preview');
  const [caseData, setCaseData] = useState<any | null>(null);
  const { toast } = useToast();
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('payout');
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PROTOCOL'>('RECORD');
  const [statusFeedUnavailable, setStatusFeedUnavailable] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedReplyAttachmentIds, setSelectedReplyAttachmentIds] = useState<string[]>([]);
  const [caseEvents, setCaseEvents] = useState<any[]>([]);
  const [eventsResolvedForCaseId, setEventsResolvedForCaseId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const activeTabRef = useRef(activeTab);
  const eventsResolvedForCaseIdRef = useRef<string | null>(null);
  const resolvedIdentityIdsRef = useRef<string[]>([]);
  const caseExplanation = useAiExplanation((id) => api.explainCase(id, activeSlug), aiExplainEnabled);

  useEffect(() => {
    caseExplanation.reset();
  }, [activeSlug, caseId]);

  const formatDateOrDash = (value?: string | null) => {
    if (!value) return NOT_AVAILABLE;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrencyOrDash = (value?: number | null, currency: string = 'USD') => {
    if (typeof value !== 'number' || Number.isNaN(value)) return NOT_AVAILABLE;
    return value.toLocaleString('en-US', { style: 'currency', currency });
  };

  const normalizeStatus = (s?: string): 'Open' | 'In Progress' | 'Approved' | 'Denied' | 'Unknown' => {
    const v = (s || '').toLowerCase();
    if (['denied', 'rejected'].includes(v)) return 'Denied';
    if (['paid', 'paid out', 'approved'].includes(v)) return 'Approved';
    if (['submitted', 'under review', 'in progress', 'processing'].includes(v)) return 'In Progress';
    if (['guaranteed', 'awaiting approval', 'new', 'open'].includes(v)) return 'Open';
    return 'Unknown';
  };

  const refreshCaseDetail = useCallback(async (currentCaseId: string, { showLoading = false }: { showLoading?: boolean } = {}) => {
    if (!currentCaseId || !activeSlug || !isAuthReady || !isSessionValid) return;
    if (showLoading) setLoading(true);
    try {
      const res = await api.getRecoveryDetail(currentCaseId, activeSlug, { includeEvents: false });
      if (res.ok && res.data) {
        const apiData = res.data as any;
        const normalized = normalizeCaseDetailData(apiData, currentCaseId);
        setCaseData(normalized);
        if (Array.isArray((res.data as any)?.documents)) {
          setMatchedDocs((res.data as any).documents);
        } else {
          setMatchedDocs([]);
        }
        setStatusFeedUnavailable(false);
        setError(null);
      } else {
        const failureReason = res.error || 'Case details unavailable';
        setCaseData(buildUnavailableCaseDetail(currentCaseId, failureReason));
        setMatchedDocs([]);
        setError(failureReason);
      }
    } catch (err: any) {
      const failureReason = err?.message || 'Case details unavailable';
      setCaseData(buildUnavailableCaseDetail(currentCaseId, failureReason));
      setMatchedDocs([]);
      setError(failureReason);
    } finally {
      setHasResolvedBackend(true);
      if (showLoading) setLoading(false);
    }
  }, [activeSlug, isAuthReady, isSessionValid]);

  const loadCaseEvents = useCallback(async (currentCaseId: string, { force = false }: { force?: boolean } = {}) => {
    if (!currentCaseId || !activeSlug || !isAuthReady || !isSessionValid) return;
    if (!force && eventsResolvedForCaseIdRef.current === currentCaseId) return;

    setEventsLoading(true);
    try {
      const response = await api.getRecoveryEvents(currentCaseId, activeSlug);
      if (response.ok && Array.isArray(response.data)) {
        setCaseEvents(response.data);
        eventsResolvedForCaseIdRef.current = currentCaseId;
        setEventsResolvedForCaseId(currentCaseId);
      } else {
        setCaseEvents([]);
      }
    } catch {
      setCaseEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [activeSlug, isAuthReady, isSessionValid]);

  const effectiveCase = hasResolvedBackend ? caseData : seedCaseData;

  const resolvedIdentityIds = useMemo(() => {
    return Array.from(new Set([
      caseId,
      effectiveCase?.id,
      effectiveCase?.dispute_case_id,
      effectiveCase?.detection_result_id,
    ].filter(Boolean)));
  }, [caseId, effectiveCase?.detection_result_id, effectiveCase?.dispute_case_id, effectiveCase?.id]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    eventsResolvedForCaseIdRef.current = eventsResolvedForCaseId;
  }, [eventsResolvedForCaseId]);

  useEffect(() => {
    resolvedIdentityIdsRef.current = resolvedIdentityIds;
  }, [resolvedIdentityIds]);

  const matchesRealtimeEvent = useCallback((payload: any) => {
    const ids = new Set([
      payload?.entity_id,
      payload?.dispute_case_id,
      payload?.case_id,
      payload?.disputeId,
      payload?.dispute_id,
      payload?.detection_id,
      payload?.claim_id,
      payload?.claimId,
      payload?.data?.entity_id,
      payload?.data?.dispute_case_id,
      payload?.data?.case_id,
      payload?.data?.disputeId,
      payload?.data?.dispute_id,
      payload?.data?.detection_id,
      payload?.data?.claim_id,
      payload?.data?.claimId
    ].filter(Boolean));

    const currentIdentityIds = resolvedIdentityIdsRef.current.length
      ? resolvedIdentityIdsRef.current
      : [caseId].filter(Boolean);

    return currentIdentityIds.some((id) => ids.has(id));
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;
    setHasResolvedBackend(false);
    setCaseData(null);
    setMatchedDocs([]);
    setCaseEvents([]);
    eventsResolvedForCaseIdRef.current = null;
    setEventsResolvedForCaseId(null);
    setError(null);
    (async () => {
      if (!caseId || !activeSlug || !isAuthReady || !isSessionValid) return;
      await refreshCaseDetail(caseId, { showLoading: true });
    })();

    let es: ReturnType<typeof createAuthenticatedEventStream> | null = null;
    try {
      if (!activeSlug || !isAuthReady || !isSessionValid) return;
      es = createAuthenticatedEventStream(
        api.buildApiUrl(`/api/sse/status?tenantSlug=${activeSlug}`),
        { autoReconnect: true, reconnectDelayMs: 3000 }
      );
      es.onopen = () => setStatusFeedUnavailable(false);
      const handleRealtimePayload = (payload: any) => {
        if (!caseId || !matchesRealtimeEvent(payload)) {
          return;
        }
        refreshCaseDetail(caseId);
        if (activeTabRef.current === 'PROTOCOL' || eventsResolvedForCaseIdRef.current === caseId) {
          loadCaseEvents(caseId, { force: true });
        }
      };

      const removeNamedListeners = registerNamedSSEListeners(
        es,
        ['notification', 'message', 'matching_completed', 'parsing_completed', 'evidence_upload_completed', 'evidence_ingestion_completed', 'payment_approved', 'payment_reconciled'],
        (_eventName, payload) => handleRealtimePayload(payload)
      );

      es.onmessage = (event) => {
        handleRealtimePayload(parseDefaultSSEMessage(event));
      };

      es.onerror = () => {
        setStatusFeedUnavailable(true);
      };

      const originalClose = es.close.bind(es);
      es.close = () => {
        removeNamedListeners();
        originalClose();
      };
    } catch {
      // Keep the existing page state when the live status stream cannot initialize.
    }
    return () => { cancelled = true; if (es) es.close(); };
  }, [activeSlug, caseId, isAuthReady, isSessionValid, loadCaseEvents, matchesRealtimeEvent, refreshCaseDetail]);

  useEffect(() => {
    if (!statusFeedUnavailable || !caseId || !activeSlug || !isAuthReady || !isSessionValid) return;
    const intervalId = setInterval(() => {
      void refreshCaseDetail(caseId);
    }, 15000);
    return () => clearInterval(intervalId);
  }, [activeSlug, caseId, isAuthReady, isSessionValid, refreshCaseDetail, statusFeedUnavailable]);

  useEffect(() => {
    if (activeTab !== 'PROTOCOL' || !caseId || !activeSlug || !isAuthReady || !isSessionValid) return;
    void loadCaseEvents(caseId);
  }, [activeSlug, activeTab, caseId, isAuthReady, isSessionValid, loadCaseEvents]);

  // Attempt to fetch matched documents for this case
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId || !activeSlug || !isAuthReady || !isSessionValid) return;
      try {
        // First check if case data has evidence_attachments with document_id
        const docIdFromCase = caseData?.evidence_attachments?.document_id;

        if (docIdFromCase) {
          // Fetch the specific matched document by ID
          const docRes = await api.getDocument(docIdFromCase, activeSlug);
          if (!cancelled && docRes.ok && docRes.data) {
            // Add match info from the case's evidence_attachments
            const docWithMatchInfo = {
              ...docRes.data,
              matchConfidence: caseData?.evidence_attachments?.match_confidence,
              matchType: caseData?.evidence_attachments?.match_type,
              matchedFields: caseData?.evidence_attachments?.matched_fields,
              matchedAt: caseData?.evidence_attachments?.matched_at,
            };
            const existingDocs = Array.isArray(caseData?.documents) ? caseData.documents : [];
            const mergedDocs = existingDocs.some((doc: any) => doc.id === docWithMatchInfo.id)
              ? existingDocs.map((doc: any) => doc.id === docWithMatchInfo.id ? { ...doc, ...docWithMatchInfo } : doc)
              : [...existingDocs, docWithMatchInfo];
            setMatchedDocs(mergedDocs);
            return;
          }
        }

        if (!cancelled) {
          setMatchedDocs(Array.isArray(caseData?.documents) ? caseData.documents : []);
        }
      } catch {
        // If the matched document lookup fails, fall back to the documents already present on the case payload.
      }
    })();
    return () => { cancelled = true; };
  }, [activeSlug, caseData?.documents, caseData?.evidence_attachments?.document_id, caseId, isAuthReady, isSessionValid]);

  const entityTypeLabel = useMemo(() => (
    effectiveCase?.truth_unavailable ? NOT_AVAILABLE : toEntityLabel(effectiveCase?.entity_type)
  ), [effectiveCase]);

  const backendTruthCase = hasResolvedBackend ? caseData : null;
  const hasBackendActionTruth = Boolean(hasResolvedBackend && backendTruthCase && !backendTruthCase.truth_unavailable);
  const confirmedLinkedDisputeCaseId = hasBackendActionTruth &&
    backendTruthCase?.has_linked_dispute_case === true &&
    typeof backendTruthCase?.linked_dispute_case_id === 'string' &&
    backendTruthCase.linked_dispute_case_id.trim()
    ? backendTruthCase.linked_dispute_case_id
    : null;
  const canPreviewBrief = Boolean(activeSlug && confirmedLinkedDisputeCaseId);
  const backendEligibilityStatus = String(backendTruthCase?.eligibility_status || '').toUpperCase();
  const canOpenCanonicalFiling = Boolean(activeSlug && confirmedLinkedDisputeCaseId && backendEligibilityStatus === 'READY');
  const caseThreadMessages = Array.isArray(backendTruthCase?.case_messages) ? backendTruthCase.case_messages : [];
  const amazonThreadLinked = Boolean(backendTruthCase?.amazon_thread_linked);
  const isAmazonThreadBackfillCase = backendTruthCase?.case_origin === 'amazon_thread_backfill';
  const threadBackfilledAt = backendTruthCase?.thread_backfilled_at || null;
  const canReplyToAmazonThread = Boolean(
    backendTruthCase?.can_reply_to_thread &&
    activeSlug &&
    confirmedLinkedDisputeCaseId &&
    backendEligibilityStatus === 'READY'
  );
  const openCanonicalFilingScreen = useCallback((intent: 'submit' | 'resubmit') => {
    if (confirmedLinkedDisputeCaseId && activeSlug) {
      toast({
        title: intent === 'resubmit' ? 'Use Dispute Cases to retry filing' : 'Use Dispute Cases to file',
        description: `Opening the canonical Agent 7 filing screen for dispute case ${confirmedLinkedDisputeCaseId}.`
      });
      navigate(tenantRoute(activeSlug, '/dispute-cases'), {
        state: {
          highlightDisputeId: confirmedLinkedDisputeCaseId,
          sourceRecoveryId: caseData?.id || caseId
        }
      });
      return;
    }

    toast({
      title: intent === 'resubmit' ? 'Retry blocked' : 'Filing blocked',
      description: NOT_AVAILABLE
    });
  }, [activeSlug, caseData?.id, caseId, confirmedLinkedDisputeCaseId, navigate, toast]);
  const replyEligibleDocuments = Array.isArray(backendTruthCase?.documents) ? backendTruthCase.documents : [];
  const backendConfidencePct = useMemo<number | null>(() => {
    if (!backendTruthCase || backendTruthCase.truth_unavailable) return null;
    const backendValue = typeof backendTruthCase?.confidence_score === 'number'
      ? (backendTruthCase.confidence_score > 1 ? backendTruthCase.confidence_score : backendTruthCase.confidence_score * 100)
      : (typeof backendTruthCase?.confidence === 'number'
        ? (backendTruthCase.confidence > 1 ? backendTruthCase.confidence : backendTruthCase.confidence * 100)
        : null);
    if (backendValue === null) return null;
    return Math.max(0, Math.min(100, Math.round(backendValue)));
  }, [backendTruthCase]);

  useEffect(() => {
    const allowedIds = new Set(replyEligibleDocuments.map((doc: any) => String(doc?.id || '').trim()).filter(Boolean));
    setSelectedReplyAttachmentIds((current) => current.filter((id) => allowedIds.has(id)));
  }, [replyEligibleDocuments]);

  const backendEvidenceStatus = typeof backendTruthCase?.evidenceStatus === 'string' && backendTruthCase.evidenceStatus.trim()
    ? backendTruthCase.evidenceStatus
    : NOT_AVAILABLE;

  const matchedCount = effectiveCase?.truth_unavailable
    ? null
    : (matchedDocs.length || (Array.isArray(effectiveCase?.documents) ? effectiveCase.documents.length : 0));
  const resolvedUnitsAffected = effectiveCase?.unitsLost ?? effectiveCase?.units_lost ?? effectiveCase?.quantity ?? effectiveCase?.units ?? null;
  const backendUnitsAffected = typeof backendTruthCase?.unitsLost === 'number'
    ? backendTruthCase.unitsLost
    : (typeof backendTruthCase?.units_lost === 'number' ? backendTruthCase.units_lost : null);
  const estimatedClaimValue = typeof backendTruthCase?.estimated_claim_value === 'number' ? backendTruthCase.estimated_claim_value : null;
  const requestedAmount = typeof backendTruthCase?.requested_amount === 'number' ? backendTruthCase.requested_amount : null;
  const approvedAmount = typeof backendTruthCase?.approved_amount === 'number' ? backendTruthCase.approved_amount : null;
  const recoveredAmount = typeof backendTruthCase?.actual_payout_amount === 'number'
    ? backendTruthCase.actual_payout_amount
    : (typeof backendTruthCase?.recovered_amount === 'number' ? backendTruthCase.recovered_amount : null);
  const billedAmount = typeof backendTruthCase?.billed_amount === 'number' ? backendTruthCase.billed_amount : null;
  const trustedApprovedAmount = hasTrustedApprovalTruth(backendTruthCase) ? approvedAmount : null;
  const trustedRecoveredAmount = hasTrustedPayoutTruth(backendTruthCase) ? recoveredAmount : null;
  const trustedBilledAmount = hasTrustedPayoutTruth(backendTruthCase) && positiveAmount(billedAmount) !== null ? billedAmount : null;
  const explicitValuePerUnit = typeof backendTruthCase?.value_per_unit === 'number' ? backendTruthCase.value_per_unit : null;
  const backendUnitCost = typeof backendTruthCase?.unitCost === 'number'
    ? backendTruthCase.unitCost
    : (typeof backendTruthCase?.unit_cost === 'number' ? backendTruthCase.unit_cost : null);
  const resolvedClaimType = effectiveCase?.anomaly_type ? String(effectiveCase.anomaly_type).replace(/_/g, ' ') : NOT_AVAILABLE;
  const resolvedMatchMethod = effectiveCase?.evidence_summary?.match_type || effectiveCase?.evidence_attachments?.match_type || effectiveCase?.match_type
    ? String(effectiveCase?.evidence_summary?.match_type || effectiveCase?.evidence_attachments?.match_type || effectiveCase?.match_type).replace(/_/g, ' ')
    : NOT_AVAILABLE;
  const resolvedFacility = effectiveCase?.facility || effectiveCase?.evidence?.fulfillment_center || effectiveCase?.warehouse || null;
  const resolvedStoreName = effectiveCase?.store_name || effectiveCase?.seller_name || null;
  const nextStep = effectiveCase?.next_step_context || null;
  const generatedContext = effectiveCase?.generated_context || null;
  const findingTruth = effectiveCase?.finding_truth || null;
  const sellerSummary = findingTruth?.seller_summary || effectiveCase?.seller_summary || null;
  const policyBasis = findingTruth?.policy_basis || effectiveCase?.policy_basis || null;
  const filingMovement = findingTruth?.filing_movement || effectiveCase?.filing_movement || null;
  const hasFindingTruth = Boolean(findingTruth || sellerSummary || policyBasis || filingMovement);
  const reviewTier = String(findingTruth?.review_tier || effectiveCase?.review_tier || '').trim();
  const claimReadiness = String(findingTruth?.claim_readiness || effectiveCase?.claim_readiness || '').trim();
  const valueLabel = String(findingTruth?.value_label || effectiveCase?.value_label || '').trim();
  const whyNotClaimReady = findingTruth?.why_not_claim_ready || effectiveCase?.why_not_claim_ready || null;
  const isReviewOnlyFinding = ['review_only', 'monitoring'].includes(reviewTier) || claimReadiness === 'not_claim_ready';
  const findingReadinessLabel = !hasFindingTruth
    ? null
    : reviewTier === 'monitoring'
    ? 'Monitoring'
    : isReviewOnlyFinding
      ? 'Review only'
      : 'Claim candidate';
  const findingAmount = requestedAmount ?? estimatedClaimValue ?? (
    typeof effectiveCase?.guaranteedAmount === 'number' ? effectiveCase.guaranteedAmount : null
  );
  const findingAmountCopy = !hasFindingTruth
    ? (typeof findingAmount === 'number'
      ? `Current recorded case value is ${formatCurrencyOrDash(findingAmount, effectiveCase?.currency || 'USD')}.`
      : 'Current recoverable amount is not available on this case record yet.')
    : claimReadiness === 'claim_ready' && typeof findingAmount === 'number'
    ? `Margin is tracking ${formatCurrencyOrDash(findingAmount, effectiveCase?.currency || 'USD')} as the current recoverable amount for this case.`
    : valueLabel === 'no_recovery_value'
      ? 'Margin is not treating this as recoverable value. It is being kept visible for monitoring and reconciliation.'
      : 'Margin is not treating this as claim-ready recovery yet. Financial context is being reviewed before any filing decision.';
  const findingNarrative = sellerSummary?.summary
    || (effectiveCase?.truth_unavailable ? NOT_AVAILABLE : generateNarrative(effectiveCase));
  const findingPolicyEvidence = Array.isArray(policyBasis?.required_evidence)
    ? policyBasis.required_evidence.filter(Boolean)
    : [];
  const proofStatus = typeof backendTruthCase?.proof_status === 'string' && backendTruthCase.proof_status.trim()
    ? backendTruthCase.proof_status
    : null;
  const missingRequirements = Array.isArray(backendTruthCase?.missing_requirements) ? backendTruthCase.missing_requirements : null;
  const manualReviewReason = typeof backendTruthCase?.manual_review_reason === 'string' && backendTruthCase.manual_review_reason.trim()
    ? backendTruthCase.manual_review_reason
    : null;
  const payoutProofStatus = typeof backendTruthCase?.payout_proof_status === 'string' && backendTruthCase.payout_proof_status.trim()
    ? backendTruthCase.payout_proof_status
    : null;
  const quarantineReason = typeof backendTruthCase?.quarantine_reason === 'string' && backendTruthCase.quarantine_reason.trim()
    ? sellerSafeOperationalText(backendTruthCase.quarantine_reason)
    : null;
  const approvalGuidance = useMemo(() => {
    const hasMatchedDocs = typeof matchedCount === 'number' && matchedCount > 0;
    const matchedDocsLabel = matchedCount === null
      ? NOT_AVAILABLE
      : `${matchedCount} matched ${matchedCount === 1 ? 'doc' : 'docs'}`;
    const formattedRequirements = missingRequirements?.length ? formatRequirementList(missingRequirements, 2) : null;
    const formattedManualReviewReason = manualReviewReason ? formatDisputeReason(manualReviewReason) : null;
    const normalizedProofStatus = String(proofStatus || '').toLowerCase();
    const normalizedPayoutProofStatus = String(payoutProofStatus || '').toLowerCase();
    const normalizedEligibilityStatus = String(effectiveCase?.eligibility_status || backendTruthCase?.eligibility_status || '').toLowerCase();

    if (formattedRequirements) {
      return {
        description: `Still needed for approval: ${formattedRequirements}.`,
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} already linked to support review.`
          : 'No matched documents are linked yet, so adding support docs will help this case move forward.',
        chips: [
          `Still needed: ${formattedRequirements}`,
          `Docs linked: ${matchedDocsLabel}`,
          proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (normalizedProofStatus === 'manual_review') {
      return {
        description: formattedManualReviewReason
          ? `This case needs reviewer confirmation for ${formattedManualReviewReason.toLowerCase()} before it can move toward approval.`
          : 'This case still needs manual review before it can move toward approval.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are already linked for review.`
          : 'Linking supporting documents will make the review step easier.',
        chips: [
          'Needs manual review',
          `Docs linked: ${matchedDocsLabel}`,
          formattedManualReviewReason ? `Review reason: ${formattedManualReviewReason}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (normalizedProofStatus === 'ineligible') {
      return {
        description: formattedManualReviewReason
          ? `This case is currently blocked by ${formattedManualReviewReason.toLowerCase()}. That needs to be cleared before approval can happen.`
          : 'This case is currently blocked and needs the filing blocker cleared before approval can happen.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are linked, but the blocker still needs to be cleared.`
          : 'Supporting documents can help later, but the blocker must be cleared first.',
        chips: [
          'Currently blocked',
          `Docs linked: ${matchedDocsLabel}`,
          formattedManualReviewReason ? `Blocker: ${formattedManualReviewReason}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (normalizedEligibilityStatus === 'insufficient_data') {
      return {
        description: 'This case still needs verified identifiers before it can move cleanly toward approval.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are linked, so the main gap is identifier verification.`
          : 'Linking supporting documents can help, but verified identifiers are still the main gap.',
        chips: [
          'Awaiting verified identifiers',
          `Docs linked: ${matchedDocsLabel}`,
          proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (normalizedEligibilityStatus === 'duplicate_blocked') {
      return {
        description: 'A prior reimbursement or duplicate claim signal needs to be cleared before this case can move toward approval.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are linked, but the duplicate block still has to be resolved first.`
          : 'This case is blocked by duplicate history rather than missing paperwork.',
        chips: [
          'Duplicate block detected',
          `Docs linked: ${matchedDocsLabel}`,
        ],
      };
    }

    if (normalizedEligibilityStatus === 'thread_only') {
      return {
        description: 'Thread-only case — an Amazon support thread already exists and a new filing is not safe.',
        helper: 'Next step: link verified identifiers or wait for a clean filing path before submitting another claim.',
        chips: [
          'Thread-only case',
          `Docs linked: ${matchedDocsLabel}`,
        ],
      };
    }

    if (normalizedEligibilityStatus === 'safety_hold') {
      return {
        description: formattedManualReviewReason
          ? `Safety hold — ${formattedManualReviewReason.toLowerCase()} must be cleared before filing.`
          : 'Safety hold — verification is required before this case can move toward approval.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are linked, but verification is still required.`
          : 'Add required evidence and complete verification to clear the hold.',
        chips: [
          'Safety hold',
          `Docs linked: ${matchedDocsLabel}`,
        ],
      };
    }

    if (normalizedPayoutProofStatus === 'quarantined') {
      return {
        description: 'The case is far enough along that payout proof is now the main thing that needs attention.',
        helper: quarantineReason
          ? `Current hold: ${quarantineReason}.`
          : 'Payout proof is quarantined and needs review before the case can close cleanly.',
        chips: [
          `Payout proof: ${formatPayoutProofStatus(payoutProofStatus)}`,
          `Docs linked: ${matchedDocsLabel}`,
        ],
      };
    }

    if (effectiveCase?.safety_audit || normalizedProofStatus === 'filing_ready' || normalizedEligibilityStatus === 'ready') {
      return {
        description: 'This case has the core evidence and identifiers in place. If it has not been filed yet, the next step is submission; after filing, Margin tracks Amazon review and payout movement.',
        helper: hasMatchedDocs
          ? `${matchedDocsLabel} are already linked behind the case. Margin files only when proof requirements are met.`
          : 'The case is passing core checks, even though no matched documents are currently surfaced here.',
        chips: [
          proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : 'Proof: Filing ready',
          `Docs linked: ${matchedDocsLabel}`,
          payoutProofStatus ? `Payout: ${formatPayoutProofStatus(payoutProofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (formattedManualReviewReason) {
      return {
        description: `Blocked by ${formattedManualReviewReason.toLowerCase()}.`,
        helper: 'Next step: resolve the blocker shown above before filing can proceed.',
        chips: [
          `Blocker: ${formattedManualReviewReason}`,
          `Docs linked: ${matchedDocsLabel}`,
          proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (formattedRequirements) {
      return {
        description: `Missing: ${formattedRequirements}.`,
        helper: `Next step: add ${formattedRequirements.toLowerCase()} so filing review can continue.`,
        chips: [
          `Missing: ${formattedRequirements}`,
          `Docs linked: ${matchedDocsLabel}`,
        ],
      };
    }

    return {
      description: proofStatus
        ? `Proof state: ${formatProofStatus(proofStatus)}.`
        : 'This case has an unknown blocker that must be resolved before filing.',
      helper: proofStatus
        ? 'Next step: resolve the proof state shown above.'
        : 'Next step: review the case signals and clear the blocker before filing.',
      chips: [
        `Docs linked: ${matchedDocsLabel}`,
        proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : null,
        payoutProofStatus ? `Payout: ${formatPayoutProofStatus(payoutProofStatus)}` : null,
      ].filter(Boolean) as string[],
    };
  }, [
    backendTruthCase?.eligibility_status,
    effectiveCase?.eligibility_status,
    effectiveCase?.safety_audit,
    manualReviewReason,
    matchedCount,
    missingRequirements,
    payoutProofStatus,
    proofStatus,
    quarantineReason,
  ]);
  const evidenceEvents = useMemo(
    () => (Array.isArray(caseEvents) ? caseEvents.filter(isEvidenceRelatedEvent) : []),
    [caseEvents]
  );
  const rejectionPlaybookReason = useMemo<RejectionReason | null>(() => {
    if (effectiveCase?.truth_unavailable) return null;
    const category = effectiveCase?.rejection_category;
    if (category && REJECTION_CATEGORY_TO_PLAYBOOK[category]) {
      return REJECTION_CATEGORY_TO_PLAYBOOK[category];
    }
    const legacy = effectiveCase?.rejection_code;
    return legacy && escalationPlaybooks[legacy as RejectionReason] ? legacy as RejectionReason : null;
  }, [effectiveCase?.rejection_category, effectiveCase?.rejection_code]);
  const lifecycleSteps = useMemo(() => {
    if (!hasResolvedBackend || effectiveCase?.truth_unavailable || !backendTruthCase) {
      return [
        { label: 'Detected', active: Boolean(caseId) },
        { label: 'Evidence', active: false },
        { label: 'Filed', active: false },
        { label: 'Approved', active: false },
        { label: 'Recovered', active: false },
        { label: 'Legacy Billed', active: false }
      ];
    }
    const billingStatus = String(effectiveCase?.billing_status || '').toLowerCase();
    const backendMatchedCount = Number(backendTruthCase?.evidence_summary?.matched_document_count ?? backendTruthCase?.evidence_summary?.linked_document_count ?? 0);
    const hasEvidence = backendTruthCase?.evidence_summary?.has_documents === true
      || backendMatchedCount > 0
      || (Array.isArray(backendTruthCase?.documents) && backendTruthCase.documents.length > 0)
      || matchedDocs.length > 0;
    const hasSubmission = hasTrustedFilingTruth(backendTruthCase);
    const hasPayout = hasTrustedPayoutTruth(backendTruthCase);
    const hasApproval = hasTrustedApprovalTruth(backendTruthCase) || hasPayout;
    const hasLegacyBilling = hasPayout && ['pending', 'completed'].includes(billingStatus) && positiveAmount(billedAmount) !== null;
    return [
      { label: 'Detected', active: Boolean(effectiveCase?.id) },
      { label: 'Evidence', active: hasEvidence },
      { label: 'Filed', active: hasSubmission },
      { label: 'Approved', active: hasApproval },
      { label: 'Recovered', active: hasPayout },
      { label: 'Legacy Billed', active: hasLegacyBilling }
    ];
  }, [backendTruthCase, billedAmount, caseId, effectiveCase?.billing_status, effectiveCase?.id, effectiveCase?.truth_unavailable, hasResolvedBackend, matchedDocs.length]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewOpen(false);
    setPdfPreviewLoading(false);
    setPdfPreviewTitle('PDF Preview');
    setPdfPreviewLabel('Document Preview');
    setPdfPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, []);

  const openPdfPreview = useCallback((title: string, label: string) => {
    setPdfPreviewTitle(title);
    setPdfPreviewLabel(label);
    setPdfPreviewOpen(true);
    setPdfPreviewLoading(true);
  }, []);

  const handleBriefPreview = useCallback(async () => {
    if (!activeSlug || !confirmedLinkedDisputeCaseId) {
      toast({
        variant: 'destructive',
        title: 'Brief preview unavailable',
        description: NOT_AVAILABLE,
      });
      return;
    }
    openPdfPreview(effectiveCase.case_number || effectiveCase.claim_number || 'Dispute Brief', 'Brief PDF Preview');

    try {
      const response = await api.fetchDisputeBriefPdf(String(confirmedLinkedDisputeCaseId), activeSlug);
      if (!response.ok || !response.blob) {
        throw new Error(response.error || 'Unable to load dispute brief preview.');
      }

      setPdfPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(response.blob);
      });
    } catch (err: any) {
      closePdfPreview();
      toast({
        variant: 'destructive',
        title: 'Brief preview failed',
        description: err?.message || 'Unable to load the dispute brief PDF.',
      });
    } finally {
      setPdfPreviewLoading(false);
    }
  }, [activeSlug, closePdfPreview, confirmedLinkedDisputeCaseId, effectiveCase, openPdfPreview, toast]);

  const handleCasePdfPreview = useCallback(async () => {
    if (!effectiveCase) return;
    openPdfPreview(effectiveCase.case_number || effectiveCase.claim_number || 'Case PDF Export', 'Browser-Generated PDF Preview');

    try {
      const { ClaimPdfService } = await import('@/services/ClaimPdfService');
      const pdfBlob = await ClaimPdfService.generate(effectiveCase, { mode: 'blob' });
      if (!pdfBlob) {
        throw new Error('Unable to generate the case PDF preview.');
      }

      setPdfPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(pdfBlob);
      });
    } catch (err: any) {
      closePdfPreview();
      toast({
        variant: 'destructive',
        title: 'Case PDF preview failed',
        description: err?.message || 'Unable to generate the case PDF preview.',
      });
    } finally {
      setPdfPreviewLoading(false);
    }
  }, [closePdfPreview, effectiveCase, openPdfPreview, toast]);

  const downloadPdfPreview = useCallback(() => {
    if (!pdfPreviewUrl) return;
    const anchor = document.createElement('a');
    anchor.href = pdfPreviewUrl;
    anchor.download = `${pdfPreviewTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'document'}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [pdfPreviewTitle, pdfPreviewUrl]);

  const isReviewPdfPreview = pdfPreviewLabel === 'Browser-Generated PDF Preview' || pdfPreviewLabel === 'Brief PDF Preview';

  const toggleReplyAttachment = useCallback((documentId: string, checked: boolean) => {
    setSelectedReplyAttachmentIds((current) => {
      if (checked) {
        return current.includes(documentId) ? current : [...current, documentId];
      }
      return current.filter((id) => id !== documentId);
    });
  }, []);

  const handleSendCaseReply = useCallback(async () => {
    if (!activeSlug || !confirmedLinkedDisputeCaseId) {
      toast({
        variant: 'destructive',
        title: 'Reply unavailable',
        description: 'Amazon thread not yet linked'
      });
      return;
    }

    const message = replyBody.trim();
    if (!message) {
      toast({
        variant: 'destructive',
        title: 'Reply required',
        description: 'Write a reply before sending it to Amazon.'
      });
      return;
    }

    setSendingReply(true);
    try {
      const response = await api.sendCaseReply(
        confirmedLinkedDisputeCaseId,
        {
          message,
          attachmentDocumentIds: selectedReplyAttachmentIds
        },
        activeSlug
      );

      if (!response.ok) {
        throw new Error(response.error || 'Failed to send Amazon thread reply.');
      }

      setReplyBody('');
      setSelectedReplyAttachmentIds([]);
      toast({
        title: 'Reply sent',
        description: 'The reply was sent to the linked Amazon case thread.'
      });
      await refreshCaseDetail(caseId, { showLoading: false });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Reply failed',
        description: err?.message || 'Failed to send the Amazon thread reply.'
      });
    } finally {
      setSendingReply(false);
    }
  }, [activeSlug, caseId, confirmedLinkedDisputeCaseId, refreshCaseDetail, replyBody, selectedReplyAttachmentIds, toast]);

  // Early return guards (all hooks must be called before these)
  if (!caseId) {
    return (
      <PageLayout title="Case Not Found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Case not found</h2>
          <Button asChild>
            <Link to={tenantRoute(activeSlug, '/recoveries')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!activeSlug && isReady) {
    return (
      <PageLayout title="Workspace Required">
        <div className="platform-vitality-page flex items-center justify-center min-h-[60vh] bg-[#F9FAFB] text-[#111827]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Workspace context required</h2>
            <p className="text-white/40 mb-6">This case detail link needs a tenant-scoped route.</p>
            <Button asChild className="bg-white/10 border border-white/10 hover:bg-white/20 text-white">
              <Link to={tenantRoute(activeSlug, '/recoveries')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recoveries
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Guard: show loading or error if no data
  if (!effectiveCase && (loading || !hasResolvedBackend)) {
    return (
      <PageLayout title="Opening Case...">
        <div className="platform-vitality-page relative -m-4 bg-[#F9FAFB] text-[#111827] lg:-m-6">
          <div className="relative w-full bg-background min-h-[calc(100vh+96px)] -mt-24 pt-24 text-[13px]">
            <div className="relative container mx-auto px-8 pt-8 pb-10 text-white/80">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-6">
                  <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/[0.03]" />
                  <div className="max-w-[680px] space-y-4">
                    <Skeleton className="h-6 w-[280px] bg-white/[0.08]" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28 bg-white/[0.06]" />
                      <Skeleton className="h-4 w-[420px] max-w-full bg-white/[0.08]" />
                      <Skeleton className="h-4 w-[360px] max-w-full bg-white/[0.06]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-32 rounded-md bg-white/[0.06]" />
                  <Skeleton className="h-8 w-36 rounded-md bg-white/[0.06]" />
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 text-white/55">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-500/60" />
                  <div>
                    <p className="text-[11px] font-sans font-bold uppercase tracking-tight text-white/48">Opening case record</p>
                    <p className="mt-1 text-sm text-white/62">Loading evidence, filing history, and payout activity in the background.</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex border-b border-white/10">
                <div className="px-8 py-4 text-[12px] font-bold uppercase text-white">Claim record</div>
                <div className="px-8 py-4 text-[12px] font-bold uppercase text-white/35">Resolution steps</div>
              </div>

              <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-white/10 divide-y divide-white/10">
                <div className="bg-white/[0.02] p-8 space-y-5">
                  <Skeleton className="h-5 w-48 bg-white/[0.08]" />
                  <Skeleton className="h-4 w-full bg-white/[0.05]" />
                  <Skeleton className="h-4 w-[92%] bg-white/[0.05]" />
                  <Skeleton className="h-4 w-[76%] bg-white/[0.05]" />
                </div>
                <div className="bg-[#0a0a0a] p-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-28 bg-white/[0.06]" />
                      <Skeleton className="h-3 w-full bg-white/[0.05]" />
                      <Skeleton className="h-3 w-[88%] bg-white/[0.05]" />
                      <Skeleton className="h-3 w-[80%] bg-white/[0.05]" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-28 bg-white/[0.06]" />
                      <Skeleton className="h-3 w-full bg-white/[0.05]" />
                      <Skeleton className="h-3 w-[86%] bg-white/[0.05]" />
                      <Skeleton className="h-3 w-[72%] bg-white/[0.05]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!effectiveCase) {
    return (
      <PageLayout title="Case Not Found">
        <div className="platform-vitality-page flex items-center justify-center min-h-[60vh] bg-[#F9FAFB] text-[#111827]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Case not found</h2>
            <p className="text-white/40 mb-6 font-mono">Case ID: {caseId}</p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <Button asChild className="bg-white/10 border border-white/10 hover:bg-white/20 text-white">
              <Link to={tenantRoute(activeSlug, '/recoveries')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cases
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Case ID: ${effectiveCase.id}`}>
      <div className="platform-vitality-page relative -m-4 bg-[#F9FAFB] text-[#111827] lg:-m-6">
        <div className="relative w-full bg-background min-h-[calc(100vh+96px)] -mt-24 pt-24 text-[13px]">
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-white/80">
            {/* Header - Case Information */}
            <div className="mb-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-6">
                <Link to={`/app/${activeSlug}/recoveries`} className="h-10 w-10 flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors rounded-lg">
                  <ArrowLeft className="h-4 w-4 text-white/40" />
                </Link>
                <div className="max-w-[680px]">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-white tracking-tight font-sans">{effectiveCase.case_number || effectiveCase.claim_number || effectiveCase.evidence?.claim_number || effectiveCase.id?.slice(0, 12)}</h1>
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70 text-[9px] uppercase tracking-tight">
                      {entityTypeLabel}
                    </Badge>
                    {statusFeedUnavailable && (
                      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400 text-[9px] uppercase tracking-tight">
                        Live Updates Unavailable
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 max-w-[620px]">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                      What this case needs next
                    </p>
                    <p className="mt-1 text-[12px] font-sans leading-5 tracking-tight text-white/78">
                      {approvalGuidance.description}
                    </p>
                    <p className="mt-1.5 text-[11px] font-sans leading-5 tracking-tight text-white/48">
                      {approvalGuidance.helper}
                    </p>
                    {approvalGuidance.chips.filter((chip) => !chip.toLowerCase().startsWith('docs linked:')).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {approvalGuidance.chips
                          .filter((chip) => !chip.toLowerCase().startsWith('docs linked:'))
                          .map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-sans font-medium tracking-tight text-white/62"
                            >
                              {chip}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-white/30 transition-colors bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleBriefPreview}
                    disabled={!canPreviewBrief}
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    {canPreviewBrief ? 'Brief PDF' : 'Brief PDF · Not Available'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-white/30 transition-colors bg-transparent"
                    onClick={handleCasePdfPreview}
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Case PDF Export
                  </Button>
                </div>
              </div>
            </div>

            {error && hasResolvedBackend && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
                {error}
              </div>
            )}

            {/* Trust Banner - Policy & Confidence */}
            {(POLICY_MAP[effectiveCase.anomaly_type] || effectiveCase.safety_audit || matchedCount > 0 || nextStep) && (
              <div className="flex flex-wrap items-center gap-6 py-2 mb-4">
                {POLICY_MAP[effectiveCase.anomaly_type] && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                        Generated Policy Reference
                      </span>
                      <a
                        href={POLICY_MAP[effectiveCase.anomaly_type].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                      >
                        <Scale className="h-3 w-3" />
                        {POLICY_MAP[effectiveCase.anomaly_type].code}
                        {POLICY_MAP[effectiveCase.anomaly_type].clause && (
                          <span className="ml-1 opacity-60 font-medium">({POLICY_MAP[effectiveCase.anomaly_type].clause})</span>
                        )}
                      </a>
                    </div>
                  </div>
                )}

                {effectiveCase.safety_audit && (
                  <>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded group cursor-help transition-all hover:bg-emerald-500/20" title={`Safety Score: ${effectiveCase.safety_audit.score}%\nRisk of Warning: ${effectiveCase.safety_audit.risk_of_warning}\nVerified by: ${effectiveCase.safety_audit.verified_by}`}>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-1.5">
                        Submission Safety Audit Passed
                      </span>
                    </div>
                  </>
                )}

                {!effectiveCase.safety_audit && (
                  <>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded">
                      <Info className="h-3.5 w-3.5 text-white/40" />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
                        {generatedContext?.trustLabel || 'Generated risk guidance'}
                      </span>
                    </div>
                  </>
                )}

                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded">
                  <FileText className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-tight">
                    {matchedCount === null ? NOT_AVAILABLE : `${matchedCount} matched docs`}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('RECORD')}
                className={cn(
                  "px-8 py-4 text-[12px] font-bold transition-all duration-300 relative uppercase",
                  activeTab === 'RECORD' ? "text-white" : "text-white/40 hover:text-white/60"
                )}>
                CLAIM RECORD
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] bg-white transition-all duration-300 transform origin-left",
                  activeTab === 'RECORD' ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                )} />
              </button>
              <button
                onClick={() => setActiveTab('PROTOCOL')}
                className={cn(
                  "px-8 py-4 text-[12px] font-bold transition-all duration-300 relative uppercase",
                  activeTab === 'PROTOCOL' ? "text-white" : "text-white/40 hover:text-white/60"
                )}>
                RESOLUTION STEPS
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] bg-white transition-all duration-300 transform origin-left",
                  activeTab === 'PROTOCOL' ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                )} />
              </button>
            </div>

            {activeTab === 'RECORD' && (
              <div className="flex flex-col gap-0 border border-white/10 divide-y divide-white/10 rounded-2xl overflow-hidden">
                {/* Tile 1: Audit Narrative & Logistics */}
                <div className="p-5 sm:p-6 bg-white/[0.02]">
                  <div className="border-b border-white/10 pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-[15px] font-sans font-medium tracking-tight text-white">Why This Case Exists</h3>
                        <p className="mt-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.32]">
                          Detection, evidence, policy basis, and current filing movement.
                        </p>
                        {aiExplainEnabled && caseId ? (
                          <button
                            type="button"
                            onClick={() => { void caseExplanation.openFor(caseId); }}
                            className="mt-2 text-[11px] font-sans font-medium tracking-tight text-white/[0.62] underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
                          >
                            Explain
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasResolvedBackend && findingReadinessLabel && (
                          <Badge variant="outline" className={cn(
                            "rounded-full px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight",
                            isReviewOnlyFinding
                              ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                              : "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                          )}>
                            {findingReadinessLabel}
                          </Badge>
                        )}
                        {hasResolvedBackend && claimReadiness === 'not_claim_ready' && (
                          <Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/45">
                            Not claim-ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!hasResolvedBackend ? (
                    <div className="mt-4 flex items-start gap-3 border border-white/10 bg-white/[0.025] px-4 py-3">
                      <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-white/45" />
                      <div>
                        <p className="text-[12px] font-sans font-medium tracking-tight text-white/80">Loading backend case basis</p>
                        <p className="mt-1 max-w-2xl text-[11px] font-sans leading-5 tracking-tight text-white/45">
                          Waiting for verified detection, evidence, policy, and filing movement before showing this explanation.
                        </p>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="border-b border-white/10">
                      <div className="py-4">
                        <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.32]">What Margin found</p>
                        <p className="mt-2 max-w-5xl text-[15px] font-sans font-normal leading-6 tracking-tight text-white/[0.74]">
                          {findingNarrative || NOT_AVAILABLE}
                        </p>
                      </div>

                      <div className="grid border-t border-white/8 lg:grid-cols-2">
                        <div className="border-b border-white/8 py-4 lg:border-r lg:pr-6">
                          <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.28]">Evidence used</p>
                          <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                            {sellerSummary?.evidence_summary || 'Structured backend evidence is attached to this case record.'}
                          </p>
                        </div>
                        <div className="border-b border-white/8 py-4 lg:pl-6">
                          <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.28]">Why this may be recoverable</p>
                          <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                            {sellerSummary?.recoverability_reason || 'Amazon records do not reconcile with the expected seller outcome. Margin is verifying identifiers, evidence, and policy support before filing.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <div className="border-b border-white/8 py-4 lg:border-r lg:pr-6">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.28]">Policy basis</p>
                            {policyBasis?.verification_status === 'policy_basis_pending_verification' && (
                              <span className="text-[9px] font-sans font-medium uppercase tracking-tight text-amber-100/80">Pending verification</span>
                            )}
                          </div>
                          <p className="mt-2 text-[13px] font-sans font-medium leading-tight tracking-tight text-white/[0.86]">
                            {policyBasis?.title || 'Policy basis pending verification'}
                          </p>
                          <p className="mt-2 text-[12px] font-sans leading-5 tracking-tight text-white/[0.52]">
                            {policyBasis?.summary || 'Margin has not mapped this detector to a curated policy reference yet.'}
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
                            <span>{policyBasis?.last_verified_at ? `Verified ${formatDateOrDash(policyBasis.last_verified_at)}` : 'Verification unavailable'}</span>
                          </div>
                          {findingPolicyEvidence.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {findingPolicyEvidence.slice(0, 4).map((item: string) => (
                                <span key={item} className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-sans font-medium tracking-tight text-white/[0.48]">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="border-b border-white/8 py-4 lg:pl-6">
                          <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.28]">What may be owed</p>
                          <p className="mt-2 text-[13px] font-sans leading-6 tracking-tight text-white/[0.62]">
                            {findingAmountCopy}
                          </p>
                          {whyNotClaimReady && (
                            <p className="mt-3 border-t border-white/8 pt-3 text-[12px] font-sans leading-5 tracking-tight text-amber-100/70">
                              {whyNotClaimReady}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.28]">Current filing movement</p>
                          <p className="mt-1.5 text-[13px] font-sans font-medium tracking-tight text-white/[0.82]">
                            {filingMovement?.label || nextStep?.title || NOT_AVAILABLE}
                          </p>
                          <p className="mt-2 max-w-3xl text-[12px] font-sans leading-5 tracking-tight text-white/[0.52]">
                            {sellerSafeOperationalText(
                              filingMovement?.detail || nextStep?.description,
                              'Margin is tracking this case through the filing workflow.'
                            )}
                          </p>
                        </div>
                        {filingMovement?.next_action_label && (
                          <span className="shrink-0 border border-white/10 px-3 py-1.5 text-[10px] font-sans font-medium uppercase tracking-tight text-white/[0.5]">
                            {filingMovement.next_action_label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="text-xs text-white/30 font-bold mb-6 flex items-center gap-2">
                        Product & Facility Details
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Product</p>
                          <p className="text-sm font-semibold text-white leading-tight" title={effectiveCase.productName || effectiveCase.title || 'Unknown Product'}>
                            {effectiveCase.productName || effectiveCase.title || 'Unknown Product'}
                          </p>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">ASIN / SKU</p>
                          <p className="text-sm font-sans font-bold text-white">
                            {effectiveCase.asin && effectiveCase.asin !== 'N/A' ? effectiveCase.asin : <span className="text-white/20">-</span>}
                            <span className="mx-2 text-white/10">/</span>
                            {effectiveCase.sku && effectiveCase.sku !== 'N/A' ? effectiveCase.sku : <span className="text-white/20">-</span>}
                          </p>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Warehouse</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-white/30" />
                            <p className="text-sm font-bold text-white">
                              {resolvedFacility && !String(resolvedFacility).includes('UNKNOWN')
                                ? resolvedFacility
                                : <span className="text-white/20">-</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Amazon Case ID</p>
                          <div className="flex flex-col gap-1">
                            {effectiveCase.amazonCaseId ? (
                              <a href={`https://sellercentral.amazon.com/case-log/${effectiveCase.amazonCaseId}`} target="_blank" rel="noreferrer" className="text-xs font-sans font-bold text-emerald-500 hover:underline flex items-center gap-1">
                                {effectiveCase.amazonCaseId} <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : <span className="text-xs text-white/20">-</span>}
                            {effectiveCase.prior_case_id && (
                              <div className="text-xs text-white/40 font-sans font-bold">Prior: {effectiveCase.prior_case_id}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Double-Dip Protection Alert */}
                      {(effectiveCase.prior_reimbursement_detected || effectiveCase.inventory_adjustment_applied || effectiveCase.duplicate_blocked) && (
                        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-blue-400 mb-1">Account Protection Active</div>
                            <p className="text-xs text-blue-300/70 leading-relaxed font-bold">
                              {effectiveCase.prior_reimbursement_detected
                                ? `We detected a prior reimbursement for ${effectiveCase.sku}. This claim was blocked to prevent a duplicate filing.`
                                : effectiveCase.inventory_adjustment_applied
                                  ? 'Amazon already processed an inventory adjustment. Claim was suppressed to protect your account.'
                                  : 'This claim was blocked by our protection system to keep your account safe.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>

                {/* Tile 2: Transaction Details */}
                <div className="p-8 bg-[#0a0a0a]">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white">Transaction Details</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Case Details */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-emerald-500 rounded-full" /> Case Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Units Affected</dt>
                          <dd className="flex items-center gap-2 text-xs font-sans font-bold text-white">
                            {typeof resolvedUnitsAffected === 'number' ? resolvedUnitsAffected : <span className="text-white/20">-</span>}
                            {typeof resolvedUnitsAffected === 'number' && effectiveCase.units_is_verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] h-3.5 font-bold uppercase tracking-tight px-1.5">Verified</Badge>
                            ) : typeof resolvedUnitsAffected === 'number' ? (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-3.5 font-bold uppercase tracking-tight px-1.5">Estimated</Badge>
                            ) : null}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Value Per Unit</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {explicitValuePerUnit === null
                              ? NOT_AVAILABLE
                              : `$${explicitValuePerUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Confidence Score</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {backendConfidencePct !== null ? `${backendConfidencePct}%` : NOT_AVAILABLE}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Lifecycle */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-blue-500 rounded-full" /> Lifecycle State
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Current Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {toStatusLabel(effectiveCase.status || (statusFeedUnavailable ? 'unavailable' : '-'))}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Amazon Thread State</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatThreadStateLabel(effectiveCase.case_state)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Filing Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatSellerCaseFilingStatus(effectiveCase, proofStatus)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Filing Truth</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {getCaseFilingTruthLine(effectiveCase, proofStatus)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Eligibility</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatEligibilityStatus(effectiveCase.eligibility_status)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Filing Strategy</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {effectiveCase.filing_strategy ? formatAutonomyLabel(effectiveCase.filing_strategy) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Runtime State</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {effectiveCase.operational_state ? formatAutonomyLabel(effectiveCase.operational_state) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Recovery Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">{toStatusLabel(effectiveCase.recovery_status)}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Billing Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">{toStatusLabel(effectiveCase.billing_status)}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Proof Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {proofStatus ? formatProofStatus(proofStatus) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Payout Proof</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {payoutProofStatus ? formatPayoutProofStatus(payoutProofStatus) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Issue Identified</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatDateOrDash(effectiveCase.created_at || effectiveCase.createdDate || effectiveCase.discovery_date)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Last Updated</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatDateOrDash(effectiveCase.updated_at || effectiveCase.created_at || effectiveCase.createdDate)}
                          </dd>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-white/50 rounded-full" /> Proof & Review
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Missing Requirements</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {missingRequirements ? formatRequirementList(missingRequirements) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Manual Review Reason</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {manualReviewReason ? formatDisputeReason(manualReviewReason) : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Decision Explanation</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {summarizeExplanationPayload(effectiveCase.explanation_payload) || NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Runtime Explanation</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {summarizeOperationalExplanation(effectiveCase.operational_explanation) || NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Block Reasons</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {Array.isArray(effectiveCase?.block_reasons) && effectiveCase.block_reasons.length
                              ? effectiveCase.block_reasons.map((reason: string) => formatDisputeReason(reason)).join(', ')
                              : NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Quarantine Reason</dt>
                          <dd className="text-xs font-sans font-bold text-white max-w-[65%] text-right">
                            {quarantineReason || NOT_AVAILABLE}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Shipment */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-white/40 rounded-full" /> Shipment Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Warehouse</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || NOT_AVAILABLE}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Product Match</dt>
                          <dd className="text-xs font-sans font-bold text-white">{backendEvidenceStatus}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Order Reference</dt>
                          <dd className="text-xs font-sans font-bold text-white underline underline-offset-2 decoration-white/20">
                            {effectiveCase.order_id || NOT_AVAILABLE}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Recovery Info */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight uppercase">
                        <div className="h-1 w-2 bg-indigo-500 rounded-full" /> Recovery Info
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Claim Type</dt>
                          <dd className="text-xs font-sans font-bold text-white capitalize">{resolvedClaimType}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Match Method</dt>
                          <dd className="text-xs font-sans font-bold text-white capitalize">{resolvedMatchMethod}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Detection</dt>
                          <dd className="text-xs font-bold text-white/70">{AGENT_NAMES['detection'] || 'Automatic'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* Historical Context / Platform Insights */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight uppercase">
                        <History className="h-3 w-3 text-amber-500" /> Platform Insights
                      </h4>
                      <div className="space-y-3">
                        {effectiveCase.warehouse_history ? (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              <span className="text-[11px] font-bold text-amber-500">Recurring Pattern Detected</span>
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                              Warehouse <span className="text-white font-semibold">{resolvedFacility ? String(resolvedFacility).split(' ')[0] : '-'}</span> has recorded <span className="text-white font-semibold">{effectiveCase.warehouse_history.occurrence_count} similar discrepancies</span> for you, totaling <span className="text-white font-semibold">${effectiveCase.warehouse_history.total_value_lost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> in at-risk value.
                            </p>
                            <div className="mt-2 text-[9px] text-white/30 font-sans font-bold">
                              {effectiveCase.warehouse_history.source || '-'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center py-4">
                            <span className="text-[10px] text-white/20 font-medium">-</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Audit Calculation Breakdown */}
                    {effectiveCase.evidence && (effectiveCase.evidence.total_input || effectiveCase.evidence.total_output) && (
                      <div className="col-span-1 md:col-span-2 mt-4">
                        <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-2">
                              <BarChart3 className="h-3.5 w-3.5" />
                              Audit Calculation Breakdown
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-white/30 font-sans">
                              <Database className="h-3 w-3" />
                              Real-time FBA Logs
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="space-y-3">
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-2">Inventory In (Input)</div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Total Receipts</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_receipts || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Customer Returns</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_returns || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Adjustments (In)</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_adjustments || 0}</span>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold">
                                <span className="text-white/60 uppercase tracking-tight">Total Verified In</span>
                                <span className="text-emerald-400 font-sans font-bold">{effectiveCase.evidence.total_input || 0}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-2">Inventory Out (Output)</div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Customer Shipments</span>
                                <span className="text-white font-sans font-bold">-{effectiveCase.evidence.total_shipments || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Removals & Disposals</span>
                                <span className="text-white font-sans font-bold">-{effectiveCase.evidence.total_removals || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Adjustments (Out)</span>
                                <span className="text-white font-sans font-bold">-0</span>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold">
                                <span className="text-white/60 uppercase tracking-tight">Total Verified Out</span>
                                <span className="text-amber-400 font-sans font-bold">{effectiveCase.evidence.total_output || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-x-16 gap-y-6">
                            <div>
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1.5">Expected Stock</div>
                              <div className="text-lg font-sans font-bold text-white">{effectiveCase.evidence.calculated_stock || (effectiveCase.evidence.total_input - effectiveCase.evidence.total_output) || 0}</div>
                            </div>
                            <div className="text-white/10 text-xl font-bold pt-2">vs</div>
                            <div>
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1.5">Warehouse Balance</div>
                              <div className="text-lg font-sans font-bold text-white">{effectiveCase.evidence.ending_warehouse_balance || 0}</div>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                            <div>
                              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight mb-1.5">Detected Gap</div>
                              <div className="text-lg font-sans font-bold text-emerald-500">
                                {effectiveCase.evidence.discrepancy || (Math.max(0, (effectiveCase.evidence.calculated_stock || (effectiveCase.evidence.total_input - effectiveCase.evidence.total_output) || 0) - (effectiveCase.evidence.ending_warehouse_balance || 0)))} Units
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tile 3: Recovery Value */}
                <div className="p-8 bg-white/[0.02]">
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-white">Recovery Value</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="min-w-[240px]">
                      <div className="text-[10px] text-white/30 font-bold mb-3 tracking-tight">Requested Claim Amount</div>
                      <div className="text-2xl font-bold text-white font-sans tracking-tight">
                        {formatCurrencyOrDash(requestedAmount, effectiveCase?.currency || 'USD')}
                      </div>

                      <div className="mt-4 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-white/60">
                          <span>Estimated Claim Value</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(estimatedClaimValue, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Approved Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(trustedApprovedAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Recovered Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(trustedRecoveredAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Legacy Billed Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(trustedBilledAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                      </div>

                      {typeof trustedRecoveredAmount === 'number' && (
                        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg inline-block min-w-[200px]">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] text-white/40 font-bold uppercase">Actual Payout</span>
                            <span className="text-xs font-sans font-bold text-blue-400">{formatCurrencyOrDash(trustedRecoveredAmount, effectiveCase?.currency || 'USD')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold tracking-tight">
                            <CheckCircle className="h-3 w-3" /> {toStatusLabel(effectiveCase.recovery_status || 'reconciled')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 max-w-sm">
                      <div className="border border-white/10 bg-white/5 rounded-lg hover:bg-white/[0.06] transition-all duration-300">
                        <div className="px-4 pt-4 border-b border-white/5">
                          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                            <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-[10px] font-bold text-white/40 focus:ring-0 shadow-none tracking-tight">
                              <SelectValue placeholder="Metric View" />
                            </SelectTrigger>
                            <SelectContent className="platform-vitality-page rounded-lg border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                              <SelectItem value="payout" className="text-xs text-white/70">Expected Payout</SelectItem>
                              <SelectItem value="confidence" className="text-xs text-white/70">Confidence Score</SelectItem>
                              <SelectItem value="units" className="text-xs text-white/70">Units Affected</SelectItem>
                              <SelectItem value="cost" className="text-xs text-white/70">Cost Per Unit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-6">
                          <div className="text-lg font-bold text-white tabular-nums font-sans tracking-tight">
                            {selectedMetric === 'payout' && (
                              effectiveCase.expectedPayoutDate ? (
                                (() => {
                                  const d = new Date(effectiveCase.expectedPayoutDate);
                                  return isNaN(d.getTime()) ? NOT_AVAILABLE : d.toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  });
                                })()
                            ) : NOT_AVAILABLE
                          )}
                            {selectedMetric === 'confidence' && (backendConfidencePct === null ? NOT_AVAILABLE : `${backendConfidencePct}%`)}
                            {selectedMetric === 'units' && (backendUnitsAffected == null ? NOT_AVAILABLE : `${backendUnitsAffected} units`)}
                            {selectedMetric === 'cost' && (
                              typeof backendUnitCost === 'number' ? `$${backendUnitCost.toFixed(2)}` : NOT_AVAILABLE
                            )}
                          </div>
                          <div className="text-[10px] text-white/30 mt-2 font-bold tracking-tight">
                            {selectedMetric === 'payout' && 'Expected Payout Date'}
                            {selectedMetric === 'confidence' && 'Analysis Precision'}
                            {selectedMetric === 'units' && 'Inventory Units'}
                            {selectedMetric === 'cost' && 'Verified Cost Basis'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PROTOCOL' && (
              <div className="flex flex-col gap-0 border border-white/10 divide-y divide-white/10 rounded-2xl overflow-hidden">
                {/* Row 1: Case Progress */}
                <div className="py-5 px-8 bg-white/[0.02]">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white">Case Progress</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Horizontal Progress bar */}
                    <div className="relative pt-2 pb-2 px-4">
                      <div className="absolute top-[18px] left-0 right-0 h-[1px] bg-white/10" />
                      <div className="flex justify-between relative z-10">
                        {lifecycleSteps.map((step, idx) => {
                          return (
                            <div key={step.label} className="flex flex-col items-center gap-2">
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all shrink-0",
                                step.active ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-[#0a0a0a] border-white/10 text-white/30"
                              )}>
                                {idx + 1}
                              </div>
                              <span className={cn(
                                "text-[11px] font-bold tracking-tight uppercase",
                                step.active ? "text-blue-500" : "text-white/20"
                              )}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                      <div className="text-[10px] text-white/30 font-bold uppercase tracking-tight mb-2">Next System Step</div>
                      <div className="text-sm font-bold text-white">{nextStep?.title || 'Unknown next step'}</div>
                      <div className="text-[11px] text-white/60 mt-1 leading-relaxed">
                        {sellerSafeOperationalText(nextStep?.description, 'The backend did not return next-step context for this case.')}
                      </div>
                    </div>

                    {/* Timeline View */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
                      <Timeline claimId={effectiveCase.id} tenantSlug={activeSlug} liveUpdatesUnavailable={statusFeedUnavailable} />
                    </div>

                    <div className="space-y-4">
                      {isAmazonThreadBackfillCase ? (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-4 text-sm text-amber-100">
                          <div className="text-[10px] font-bold uppercase tracking-tight text-amber-300/80">Amazon Thread Backfill</div>
                          <div className="mt-1 font-semibold text-amber-50">
                            Margin linked an existing Amazon support thread to this case. Margin did not create the original filing.
                          </div>
                          <div className="mt-2 text-[11px] leading-relaxed text-amber-100/75">
                            Unknown filing details remain Not Available until real seller-side proof exists.
                            {threadBackfilledAt ? ` Backfilled ${formatEventTimestamp(threadBackfilledAt)}.` : ''}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-white">Amazon Thread</h4>
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tight border", getThreadStateTone(backendTruthCase?.case_state))}>
                          {formatThreadStateLabel(backendTruthCase?.case_state)}
                        </Badge>
                      </div>

                      {!amazonThreadLinked ? (
                        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-white/55">
                          Amazon thread not yet linked
                        </div>
                      ) : caseThreadMessages.length === 0 ? (
                        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-white/55">
                          No thread activity yet
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {caseThreadMessages.map((message: any) => {
                            const attachmentRows = Array.isArray(message.attachments) ? message.attachments : [];
                            const eventAt = message.received_at || message.sent_at || message.created_at;
                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  "rounded-lg border px-4 py-4 space-y-3",
                                  message.direction === 'inbound'
                                    ? 'border-blue-500/20 bg-blue-500/[0.05]'
                                    : 'border-emerald-500/20 bg-emerald-500/[0.05]'
                                )}
                              >
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                                  <Badge variant="outline" className={cn("border text-[10px] uppercase tracking-tight", message.direction === 'inbound' ? 'border-blue-500/20 text-blue-300 bg-blue-500/10' : 'border-emerald-500/20 text-emerald-300 bg-emerald-500/10')}>
                                    {message.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                                  </Badge>
                                  <span className="text-white/40">{formatEventTimestamp(eventAt)}</span>
                                  {message.state_signal ? (
                                    <Badge variant="outline" className={cn("border text-[10px] uppercase tracking-tight", getThreadStateTone(message.state_signal))}>
                                      {formatThreadStateLabel(message.state_signal)}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold text-white">{message.subject || NOT_AVAILABLE}</div>
                                  <div className="text-[11px] text-white/45">
                                    {message.direction === 'inbound'
                                      ? `From ${message.sender || NOT_AVAILABLE}`
                                      : `To ${(Array.isArray(message.recipients) && message.recipients.length ? message.recipients.join(', ') : NOT_AVAILABLE)}`}
                                  </div>
                                </div>
                                <div className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                                  {message.body_text || NOT_AVAILABLE}
                                </div>
                                {attachmentRows.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-tight text-white/35">Attachments</div>
                                    <div className="flex flex-wrap gap-2">
                                      {attachmentRows.map((attachment: any, attachmentIdx: number) => {
                                        const linkedDocumentId = String(attachment?.evidence_document_id || '').trim();
                                        const label = attachment?.filename || `Attachment ${attachmentIdx + 1}`;
                                        return linkedDocumentId && activeSlug ? (
                                          <Button
                                            key={`${message.id}-attachment-${attachmentIdx}`}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 rounded-md border border-white/10 bg-white/[0.03] px-2 text-[10px] font-bold text-white/70 hover:text-white"
                                            onClick={() => window.open(`/app/${activeSlug}/documents/${encodeURIComponent(linkedDocumentId)}`, '_blank')}
                                          >
                                            {label}
                                          </Button>
                                        ) : (
                                          <span
                                            key={`${message.id}-attachment-${attachmentIdx}`}
                                            className="inline-flex h-7 items-center rounded-md border border-white/10 bg-white/[0.03] px-2 text-[10px] font-bold text-white/55"
                                          >
                                            {label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {amazonThreadLinked ? (
                        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-4">
                          <div>
                            <div className="text-xs font-bold text-white">Reply to Amazon</div>
                            <div className="text-[11px] text-white/45 mt-1">
                              {canReplyToAmazonThread
                                ? 'Continue the linked Amazon support thread from inside Margin.'
                                : backendEligibilityStatus === 'THREAD_ONLY'
                                  ? 'Amazon thread detected. Reply stays disabled until verified identifiers support a safe case path.'
                                  : 'Reply stays disabled until this case is filing-ready.'}
                            </div>
                          </div>

                          {canReplyToAmazonThread ? (
                            <>
                              <Textarea
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder="Write the evidence-backed reply you want Amazon to receive."
                                disabled={sendingReply}
                                className="min-h-[140px] rounded-lg border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/25"
                              />

                              {replyEligibleDocuments.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                                    Attach linked evidence
                                  </div>
                                  <div className="space-y-2">
                                    {replyEligibleDocuments.map((doc: any) => {
                                      const documentId = String(doc?.id || '').trim();
                                      if (!documentId) return null;
                                      const isChecked = selectedReplyAttachmentIds.includes(documentId);
                                      return (
                                        <label
                                          key={documentId}
                                          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75"
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => toggleReplyAttachment(documentId, checked === true)}
                                            disabled={sendingReply}
                                          />
                                          <span className="font-sans font-bold">{doc?.filename || doc?.name || documentId}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between gap-4">
                                <div className="text-[11px] text-white/40">
                                  Thread linkage is confirmed. This reply will stay on the stored Amazon conversation.
                                </div>
                                <Button
                                  type="button"
                                  onClick={handleSendCaseReply}
                                  disabled={sendingReply || !replyBody.trim()}
                                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                >
                                  {sendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Send Reply
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] text-white/55">
                              {backendEligibilityStatus === 'THREAD_ONLY'
                                ? 'Amazon thread detected. Margin will not expose a reply action here until verified identifiers support a safe case path.'
                                : 'Reply is not available from the browser while this case is blocked from filing.'}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                  </div>
                </div>

                {/* Row 2: Evidence & Verification */}
                <div className="p-8 bg-[#0a0a0a]">
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-white">Evidence & Verification</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="text-xs text-white/30 font-bold flex items-center gap-2">
                        Matched Documents ({matchedCount === null ? NOT_AVAILABLE : matchedCount})
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      {matchedDocs.length > 0 ? (
                        <div className="space-y-3">
                          {matchedDocs.map((doc: any, idx: number) => {
                            const confidencePct = typeof doc.matchConfidence === 'number'
                              ? Math.round(doc.matchConfidence * 100)
                              : (typeof doc.confidence_score === 'number'
                                ? Math.round((doc.confidence_score > 1 ? doc.confidence_score : doc.confidence_score * 100))
                                : null);
                            const evidenceTitle = getDocumentEvidenceTitle(doc, idx);
                            const evidenceSubtitle = getDocumentEvidenceSubtitle(doc);
                            const filename = doc.name || doc.filename || doc.original_filename || null;
                            return (
                              <div key={doc.id || idx} className="p-4 bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group rounded-lg">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <FileText className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-emerald-500" />
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-bold text-white font-sans" title={evidenceTitle}>
                                        {evidenceTitle}
                                      </p>
                                      <p className="mt-1 truncate text-[10px] text-white/45" title={evidenceSubtitle || undefined}>
                                        {evidenceSubtitle || doc.matchType || 'Attached evidence'}
                                      </p>
                                      {filename && filename !== evidenceTitle ? (
                                        <p className="mt-1 truncate text-[10px] text-white/25" title={filename}>
                                          File: {filename}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] h-4.5 px-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                                      {confidencePct !== null ? `${confidencePct}%` : '-'}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 p-0"
                                      onClick={() => window.open(`/app/${activeSlug}/documents/${encodeURIComponent(doc.id)}`, '_blank')}>
                                      View <ArrowRight className="h-2.5 w-2.5 ml-1" />
                                    </Button>
                                  </div>
                                </div>
                                {effectiveCase.evidence?.snippets?.length > 0 && (
                                  <div className="mt-3 ml-6 pr-4 py-2 bg-emerald-500/[0.03] rounded border border-emerald-500/10 space-y-1.5">
                                    {effectiveCase.evidence.snippets.map((snippet: any, sIdx: number) => (
                                      <div key={sIdx} className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1 h-1 bg-emerald-500/40 rounded-full" />
                                          <span className="text-white/40 font-bold uppercase tracking-tight">{snippet.label}</span>
                                        </div>
                                        <span className="text-white/80 font-sans font-bold truncate max-w-[280px] italic bg-white/5 px-1.5 rounded">"{snippet.text}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-lg">
                          <Database className="h-8 w-8 text-white/10 mb-4" />
                          <p className="text-[10px] font-bold text-white/30 tracking-tight">No documents matched yet</p>
                        </div>
                      )}
                    </div>

                    {/* EVIDENCE LOG */}
                    <div className="space-y-4 pt-4">
                      <div className="text-xs text-white/30 font-bold flex items-center gap-2">
                        Evidence Log
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="text-[10px] text-white/35 font-medium">
                        Reconstructed evidence-related history from notifications and agent events.
                      </div>

                      <div className="overflow-hidden border border-white/5 rounded-lg bg-white/[0.02]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Timestamp</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Event Type</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Reference</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Event Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {eventsLoading && evidenceEvents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-[10px] font-sans font-bold text-white/32">
                                  Loading evidence history...
                                </td>
                              </tr>
                            )}
                            {evidenceEvents.map((event: any, idx: number) => {
                              const statusLabel = toStatusLabel(event.status || event.eventType || event.type);
                              const eventSourceLabel = toEventSourceLabel(event.source);

                              return (
                                <tr key={event.id || idx} className="hover:bg-white/[0.04] transition-colors group">
                                  <td className="px-4 py-3 text-[10px] font-sans font-bold text-white/60">
                                    {formatEventTimestamp(event.at)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                      <span className="text-[10px] font-bold text-white/80 font-sans uppercase tracking-tight">
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-sans">
                                    <div className="text-[10px] font-bold text-white/45">
                                      {event.claimId || event.id || NOT_AVAILABLE}
                                    </div>
                                    {event.message ? (
                                      <div className="mt-1 max-w-[520px] text-[11px] font-medium normal-case leading-relaxed text-white/65">
                                        {event.message}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-[9px] h-4.5 px-2 border-white/10 font-sans font-bold uppercase tracking-tight bg-white/5 text-white/40">
                                      {eventSourceLabel}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                            {!eventsLoading && evidenceEvents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-[10px] font-sans font-bold text-white/28">
                                  No evidence history recorded for this case yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Seller Identity
                          <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 border border-white/10 rounded-lg">
                          <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                            <ShieldCheck className="h-4 w-4 text-white/60" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-white tracking-tight">Seller Identity</h4>
                            <p className="text-[10px] text-white/30 font-sans font-bold uppercase tracking-tight">{entityTypeLabel}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Seller ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">{effectiveCase.seller_id || effectiveCase.user_id || NOT_AVAILABLE}</dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Store Name</dt>
                            <dd className="text-xs font-bold text-white truncate" title={resolvedStoreName || NOT_AVAILABLE}>
                              {resolvedStoreName || NOT_AVAILABLE}
                            </dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">User ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">{effectiveCase.user_id || effectiveCase.seller_id || NOT_AVAILABLE}</dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Permission Status</dt>
                            <dd className="text-xs font-bold text-white uppercase tracking-tight">{NOT_AVAILABLE}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Contact Method</dt>
                            <dd className="text-xs font-bold text-white uppercase tracking-tight">{NOT_AVAILABLE}</dd>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Reference Data
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="space-y-3">
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Amazon Case ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">
                              {effectiveCase.amazonCaseId || <span className="text-white/40 font-normal">{NOT_AVAILABLE}</span>}
                            </dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Prior Case</dt>
                            <dd className="text-xs font-bold text-white font-sans font-bold uppercase tracking-tight">{effectiveCase.prior_case_id || NOT_AVAILABLE}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Claim Reference</dt>
                            <dd className="text-xs font-sans font-bold text-white uppercase tracking-tight">
                              {effectiveCase.claim_number || effectiveCase.claim_id || effectiveCase.id?.slice(0, 12)}
                            </dd>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Generated System Guidance
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 tracking-tight uppercase mb-2">
                            {generatedContext?.strategyLabel || NOT_AVAILABLE}
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-bold">
                            {effectiveCase.autonomous_logic_summary || nextStep?.description || NOT_AVAILABLE}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Autonomous Strategy & Recovery Path */}
                <div className="p-8 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Autonomous Strategy & Recovery Path</h3>
                      <p className="text-[10px] text-white/30 font-sans font-bold uppercase tracking-tight">Patient Zero → Settlement Ledger v4.2</p>
                    </div>

                    {/* Active Council Icons */}
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="px-2 border-r border-white/10 mr-1">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-tight">Active Council</span>
                      </div>
                      {(caseData?.playbook?.council || []).map((agent: any) => (
                        <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-all cursor-crosshair">
                          <div className={cn(
                            "w-1 h-1 rounded-full animate-pulse",
                            agent.status === 'SETTLED' ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className="text-[10px] font-bold text-white/60 font-sans font-bold">{agent.agent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Rejection Master / Escalation Playbook */}
                    {['rejected', 'denied'].includes((effectiveCase.status || '').toLowerCase()) && rejectionPlaybookReason && escalationPlaybooks[rejectionPlaybookReason] && (
                      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldAlert className="h-24 w-24 text-red-500" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                              <Zap className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white tracking-tight">Escalation Playbook: {escalationPlaybooks[rejectionPlaybookReason].label}</h4>
                              <p className="text-[10px] text-red-400 font-sans font-bold uppercase tracking-tight mt-0.5">Generated guidance from stored rejection memory</p>
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mb-6 leading-relaxed max-w-lg font-bold tracking-tight">
                            {effectiveCase.rejection_reason || escalationPlaybooks[rejectionPlaybookReason].description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-tight">Required Maneuver</h5>
                              <ul className="space-y-2.5">
                                {escalationPlaybooks[rejectionPlaybookReason].actions.map((action, aIdx) => (
                                  <li key={aIdx} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[9px] font-bold text-red-500 shrink-0 mt-0.5">{aIdx + 1}</div>
                                    <span className="text-[11px] text-white/80 font-medium">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex flex-col justify-end gap-3">
                              {canOpenCanonicalFiling ? (
                                <button
                                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs h-9 transition-all rounded-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-500"
                                  onClick={() => openCanonicalFilingScreen('resubmit')}
                                >
                                  {escalationPlaybooks[rejectionPlaybookReason].autoTriggerable ? 'Auto-Trigger Escalation' : 'Confirm Manual Escalation'}
                                </button>
                              ) : (
                                <div className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-tight text-white/40">
                                  Not available while filing is blocked
                                </div>
                              )}
                              <p className="text-[9px] text-white/30 text-center">
                                {canOpenCanonicalFiling ? `Escalation managed by ${AGENT_NAMES['refund_filing']}` : NOT_AVAILABLE}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TWO-COLUMN STRATEGY GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left: Tactical Playbook */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Tactical Playbook</h4>
                            <p className="text-[9px] text-white/30 font-sans font-bold">{generatedContext?.strategyLabel || 'Generated strategy from backend state'}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(caseData?.playbook?.steps || []).map((action: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 group">
                              <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-sans font-bold text-white/40 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all shrink-0 mt-0.5 italic">
                                0{idx + 1}
                              </div>
                              <span className="text-xs text-white/70 leading-relaxed font-bold tracking-tight">{action}</span>
                            </div>
                          ))}
                          {(!caseData?.playbook?.steps || caseData.playbook.steps.length === 0) && (
                            <div className="py-4 text-[11px] text-white/20 font-sans font-bold">-</div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white/60">Requested Claim Amount</span>
                            </div>
                            <span className="text-sm font-sans font-bold text-emerald-500">
                              {formatCurrencyOrDash(requestedAmount, effectiveCase?.currency || 'USD')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Protection Protocols */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Continuous Protection</h4>
                            <p className="text-[9px] text-white/30 font-sans font-bold">{generatedContext?.trustLabel || 'Generated risk guidance from backend signals'}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(caseData?.protection_protocol || []).map((measure: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 group">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 mt-1.5 ring-4 ring-blue-500/5" />
                              <span className="text-xs text-white/70 leading-relaxed font-bold tracking-tight">{measure}</span>
                            </div>
                          ))}
                          {(!caseData?.protection_protocol || caseData.protection_protocol.length === 0) && (
                            <div className="py-4 text-[11px] text-white/20 font-sans font-bold">-</div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <div className="flex items-center gap-3 p-4 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl">
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/60 uppercase tracking-tight">Current Next Step</span>
                              <span className="text-[9px] text-white/30 font-sans font-bold uppercase">{nextStep?.title || 'Generated context unavailable'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={pdfPreviewOpen} onOpenChange={(open) => (open ? setPdfPreviewOpen(true) : closePdfPreview())}>
        <DialogContent className="platform-vitality-page grid h-[94vh] w-[98vw] max-w-none gap-0 overflow-hidden border-0 bg-transparent p-0 text-[#111827] shadow-none sm:rounded-none [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{pdfPreviewTitle}</DialogTitle>
          </DialogHeader>

          <div className="relative h-full w-full">
            <div className="pointer-events-none absolute left-6 top-5 z-10 max-w-[60vw] space-y-2">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">{pdfPreviewLabel}</div>
              {isReviewPdfPreview && (
                <p className="max-w-2xl text-[11px] font-sans font-medium leading-snug tracking-tight text-white/60">
                  For seller review only. This preview lets you review the case materials; Margin does not submit this browser-generated PDF to Amazon.
                </p>
              )}
              <div className={cn(
                "truncate font-sans font-light tracking-tight text-white",
                isReviewPdfPreview ? "text-lg" : "text-2xl"
              )}>
                {pdfPreviewTitle}
              </div>
            </div>

            <div className="absolute right-6 top-5 z-10 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!pdfPreviewUrl}
                onClick={downloadPdfPreview}
                className="h-11 rounded-full border-white/15 bg-black/25 px-3 text-white backdrop-blur-md hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closePdfPreview}
                className="h-11 rounded-full border-white/15 bg-black/25 px-3 text-white backdrop-blur-md hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex h-full items-center justify-center px-3 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
              {pdfPreviewLoading ? (
                <div className="flex h-full w-full items-center justify-center gap-3 text-sm font-sans text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading PDF preview...
                </div>
              ) : pdfPreviewUrl ? (
                <div className="h-full w-full overflow-hidden rounded-[10px] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.40)]">
                  <iframe
                    title={pdfPreviewTitle}
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
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
      <AiExplanationDialog
        open={caseExplanation.open}
        onOpenChange={caseExplanation.setOpen}
        title="Explain this case"
        description="Margin is translating the current backend case truth into seller-friendly language."
        loading={caseExplanation.loading}
        error={caseExplanation.error}
        explanation={caseExplanation.explanation}
        onRetry={() => { void caseExplanation.retry(); }}
      />
    </PageLayout>
  );
}
