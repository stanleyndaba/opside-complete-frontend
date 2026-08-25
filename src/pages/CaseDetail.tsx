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
import { RecoveryTruthRecord } from '@/components/cases/RecoveryTruthRecord';
import { RecoveryProgressControl } from '@/components/cases/RecoveryProgressControl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AiExplanationDialog } from '@/components/ai/AiExplanationDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { documentReferenceLabel } from '@/lib/displayReferences';
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
import {
  isCaseDetailDemoWorkspace,
  selectCaseDetailEventFailureState,
  selectCaseDetailFailureState,
} from '@/lib/caseDetailTruthSafety';
import {
  buildRecoveryTruthPresentation,
  getAccountingClaimBoundary,
  getRequestedRecoveryLanguage,
} from '@/lib/caseDetailTruthPresentation';

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
      return 'bg-blue-100 text-blue-800 border-blue-200';
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
      return 'text-blue-600';
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

const hasTrustedPayoutTruth = (caseData: any) => {
  const verifiedPaid = Number(caseData?.verified_paid_amount);
  return Boolean(
    caseData?.payout_proof_status === 'verified' &&
    Number.isFinite(verifiedPaid) &&
    verifiedPaid > 0 &&
    ['paid', 'partially_paid'].includes(normalizeLifecycleValue(caseData?.financial_payout_status))
  );
};

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
  if (normalized === 'agent_event') return 'Recovery event';
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

const isPdfArtifact = (doc: any) => {
  const metadata = asPlainObject(doc?.metadata);
  const filename = String(doc?.name || doc?.filename || doc?.original_filename || metadata?.original_filename || '').toLowerCase();
  const mimeType = String(doc?.mime_type || doc?.content_type || metadata?.mime_type || metadata?.content_type || '').toLowerCase();
  return mimeType.includes('pdf') || filename.endsWith('.pdf');
};

const formatThreadStateLabel = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return NOT_AVAILABLE;
  if (normalized === 'paid') return 'Reimbursement recorded in thread';
  return normalized.replace(/_/g, ' ');
};

const getThreadStateTone = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'paid') return 'text-[#4D5B66] border-[#D8E3E8] bg-[#F8FAFB]';
  if (normalized === 'approved') return 'text-[#07111A] border-[#D8E3E8] bg-[#F8FAFB]';
  if (normalized === 'needs_evidence') return 'text-blue-800 border-blue-200 bg-blue-50';
  if (normalized === 'rejected') return 'text-red-800 border-red-200 bg-red-50';
  if (normalized === 'unlinked') return 'text-[#6B7C88] border-[#D8E3E8] bg-[#F8FAFB]';
  return 'text-[#4D5B66] border-[#D8E3E8] bg-[#F8FAFB]';
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

const isDemoWorkspaceSlug = (slug?: string | null) => isCaseDetailDemoWorkspace(slug);

const isMissingDemoValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return !normalized || normalized === '-' || normalized === 'n/a' || normalized === 'not available' || normalized.includes('unknown');
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const fallbackIfMissing = <T,>(value: T, fallback: T): T => (
  isMissingDemoValue(value) ? fallback : value
);

const buildDemoCaseDocuments = (caseId?: string | null) => [
  {
    id: `demo-invoice-${caseId || 'case'}`,
    name: 'Supplier invoice INV-2026-1842.pdf',
    doc_type: 'supplier_invoice',
    status: 'matched',
    quantity: 18,
    unit_cost: 71.37,
    total_amount: 1284.66,
    confidence: 0.94,
  },
  {
    id: `demo-shipment-${caseId || 'case'}`,
    name: 'FBA shipment reconciliation FBA17XJ4K2.pdf',
    doc_type: 'shipment_report',
    status: 'matched',
    quantity: 18,
    confidence: 0.91,
  },
  {
    id: `demo-ledger-${caseId || 'case'}`,
    name: 'Amazon inventory ledger excerpt.csv',
    doc_type: 'inventory_report',
    status: 'matched',
    quantity: 18,
    confidence: 0.89,
  },
];

const buildDemoCaseEvents = (caseId?: string | null) => [
  {
    id: `demo-event-detected-${caseId || 'case'}`,
    timestamp: '2026-05-06T09:18:00Z',
    title: 'Amazon loss event detected',
    description: 'Inbound shortage signal found during FBA reconciliation.',
    type: 'detection',
    status: 'detected',
  },
  {
    id: `demo-event-evidence-${caseId || 'case'}`,
    timestamp: '2026-05-06T09:22:00Z',
    title: 'Evidence matched',
    description: 'Supplier invoice, shipment report, and inventory ledger were linked to the case.',
    type: 'analysis',
    status: 'matched',
  },
  {
    id: `demo-event-ready-${caseId || 'case'}`,
    timestamp: '2026-05-06T09:31:00Z',
    title: 'Case moved to filing review',
    description: 'Claim-ready packet prepared for seller approval before filing.',
    type: 'generation',
    status: 'filing_ready',
  },
];

const formatDemoCurrency = (amount: number, currency = 'USD') => (
  Number(amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

const resolveDemoCaseReference = (caseData: any, caseId?: string | null) => fallbackIfMissing(
  caseData.claim_number || caseData.evidence?.claim_number || caseId,
  'ACME-CASE-2005'
);

const isRejectedDemoCaseReference = (value?: string | null) => {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'ACME-2007' || normalized === 'ACME-CASE-2007' || normalized.endsWith('2007');
};

const isDemoFilingReceiptCaseReference = (value?: string | null) => {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'ACME-2003' || normalized === 'ACME-CASE-2003' || normalized.endsWith('2003');
};

const isApprovedDemoCaseReference = (value?: string | null) => {
  const normalized = String(value || '').trim().toUpperCase();
  return ['2004', '2005', '2006'].some((suffix) => (
    normalized === `ACME-${suffix}` ||
    normalized === `ACME-CASE-${suffix}` ||
    normalized.endsWith(suffix)
  ));
};

const hasDemoFilingReceiptThread = (caseData: any, caseReference?: string | null) => {
  if (isDemoFilingReceiptCaseReference(caseReference)) return true;

  const messages = Array.isArray(caseData?.case_messages) ? caseData.case_messages : [];
  return messages.some((message: any) => {
    const threadText = `${message?.subject || ''} ${message?.body_text || ''}`;
    return isDemoFilingReceiptCaseReference(threadText);
  });
};

const buildDemoAmazonThreadMessages = (caseData: any, caseId?: string | null) => {
  const caseReference = resolveDemoCaseReference(caseData, caseId);
  const threadCaseReference = caseReference === 'ACME-CASE-2005' ? '19822888381' : caseReference;
  const shipmentReference = fallbackIfMissing(caseData.order_id || caseData.evidence?.shipment_id, 'FBA17XJ4K2');
  const currency = fallbackIfMissing(caseData.currency, 'USD');
  const reimbursementAmount = fallbackIfMissing(
    caseData.actual_payout_amount ?? caseData.recovered_amount ?? caseData.approved_amount ?? caseData.requested_amount,
    1284.66
  );
  const normalizedReimbursementAmount = Number(reimbursementAmount);
  const acmeVerifiedOutcomeAmount = Number(caseData?.verified_paid_amount ?? caseData?.approved_amount ?? reimbursementAmount);
  const demoThreadAmount = caseReference === 'ACME-CASE-2005' && Number.isFinite(acmeVerifiedOutcomeAmount) && acmeVerifiedOutcomeAmount > 0
    ? acmeVerifiedOutcomeAmount
    : normalizedReimbursementAmount;
  const normalizedState = String(caseData.case_state || caseData.recovery_status || '').toLowerCase();
  const isRejected = normalizedState.includes('reject') || isRejectedDemoCaseReference(caseReference);
  const isFilingReceipt = hasDemoFilingReceiptThread(caseData, caseReference);
  const isApprovedDemo = !isRejected && !isFilingReceipt && isApprovedDemoCaseReference(caseReference);
  const isPaid = !isRejected && (normalizedState.includes('paid') || normalizedState.includes('payout') || caseReference === 'ACME-CASE-2005');
  const approvedBody = `Hello,\n\nWe have completed our review of the reimbursement request for the FBA inbound shipment discrepancy listed below. Based on the shipment reconciliation, receiving records, and inventory ledger information available to us, this request has been APPROVED.\n\nWe have issued a reimbursement of ${formatDemoCurrency(demoThreadAmount, currency)} for the affected units. The reimbursement will appear in your seller account payments reporting after normal settlement processing completes.\n\nCase ID: ${threadCaseReference}\nShipment ID: ${shipmentReference}\nReason: Inbound received quantity discrepancy\nApproved amount: ${formatDemoCurrency(demoThreadAmount, currency)}\nStatus: APPROVED\n\nThank you,\nAmazon Selling Partner Support`;

  if (isApprovedDemo) {
    if (caseReference === 'ACME-CASE-2005') {
      return [
        {
          id: `demo-amazon-followup-${caseId || 'case'}`,
          direction: 'inbound',
          sender: 'seller.service05@amazon.com',
          subject: '[Case ID:19822888381] Your Help Needed - Inventory lost in FBA warehouse',
          body_text: `Inbox\n\nseller.service05@amazon.com <seller.service05@amazon.com>\n31 Mar 2026, 18:31\n\nto me\n\nThis is a reminder to let you know that we need more information to resolve your case. If you still need assistance, respond to this message and provide the details we’ve requested below.\n\nIf we’ve resolved your issue, no further action is needed, and we’ll close your case.\n\nAmazon Support\n\n-- Original Message --\n\nHello from Amazon Selling Partner Support,\n\nWe are following up on your reimbursement request for lost units in FBA warehouse processing.\n\nTo proceed, please provide the following:\n• ASIN or FNSKU associated with the lost units.\n• Transaction ID.\n• Any supporting documents that further support our investigation.\n\nPlease use the Contact Us form in Seller Central to continue this case.\n\nCase ID: 19822888381\nShipment ID: ${shipmentReference}\nStatus: Waiting for more evidence\n\nThank you,\nAmazon Selling Partner Support`,
          received_at: '2026-03-31T18:31:00Z',
          state_signal: 'pending',
          attachments: [],
        },
        {
          id: `demo-margin-response-${caseId || 'case'}`,
          direction: 'outbound',
          recipients: ['Amazon Selling Partner Support'],
          subject: `Re: [Case ID:19822888381] Your Help Needed - Inventory lost in FBA warehouse`,
          body_text: `Hello Amazon Selling Partner Support,\n\nMargin has updated the evidence pack for this case and attached the requested materials below.\n\nShipment ID: ${shipmentReference}\nCase reference: ${threadCaseReference}\nASIN/FNSKU: ${fallbackIfMissing(caseData.evidence?.asin || caseData.sku, 'ACME-YOGA-MAT-SAGE')}\nTransaction ID: ${fallbackIfMissing(caseData.evidence?.transaction_id || caseData.transaction_id, 'TXN-19822888381')}\nClaimed amount: ${formatDemoCurrency(demoThreadAmount, currency)}\n\nThe response is now aligned to the shipment, receipt, and supporting records requested in your message. Please review the updated evidence package and continue the investigation.\n\nThank you,\nMargin`,
          sent_at: '2026-03-31T19:04:00Z',
          state_signal: 'submitted',
          attachments: [
            { filename: 'Supplier invoice INV-2026-1842.pdf' },
            { filename: 'FBA shipment reconciliation FBA17XJ4K2.pdf' },
            { filename: 'Amazon inventory ledger excerpt.csv' },
            { filename: 'ASIN-FNSKU evidence note.txt' },
          ],
        },
        {
          id: `demo-amazon-approved-${caseId || 'case'}`,
          direction: 'inbound',
          sender: 'Amazon Selling Partner Support',
          subject: `APPROVED: Reimbursement issued for shipment ${shipmentReference}`,
          body_text: approvedBody,
          received_at: '2026-05-08T14:37:00Z',
          state_signal: isPaid ? 'paid' : 'approved',
          attachments: [],
        },
      ];
    }

    return [
      {
        id: `demo-amazon-filing-${caseId || 'case'}`,
        direction: 'outbound',
        recipients: ['Amazon Selling Partner Support'],
        subject: `Reimbursement request for shipment ${shipmentReference}`,
        body_text: `Hello Amazon Selling Partner Support,\n\nWe are requesting reimbursement review for an inbound shipment discrepancy identified during reconciliation.\n\nShipment ID: ${shipmentReference}\nCase reference: ${threadCaseReference}\nSKU: ${fallbackIfMissing(caseData.sku || caseData.evidence?.sku, 'MGRN-BTL-18')}\nUnits affected: ${fallbackIfMissing(caseData.units_lost || caseData.evidence?.quantity, 18)}\nClaimed amount: ${formatDemoCurrency(demoThreadAmount, currency)}\n\nAttached evidence includes the shipment reconciliation, supplier invoice, and inventory ledger excerpt supporting the missing quantity.\n\nThank you,\nDemo Workspace Store`,
        sent_at: '2026-05-07T10:14:00Z',
        state_signal: 'submitted',
        attachments: [
          { filename: 'Supplier invoice INV-2026-1842.pdf' },
          { filename: 'FBA shipment reconciliation FBA17XJ4K2.pdf' },
          { filename: 'Amazon inventory ledger excerpt.csv' },
        ],
      },
      {
        id: `demo-amazon-ack-${caseId || 'case'}`,
        direction: 'inbound',
        sender: 'Amazon Selling Partner Support',
        subject: `Case opened for FBA reimbursement review - ${shipmentReference}`,
        body_text: `Hello,\n\nThank you for contacting Amazon Selling Partner Support. We have opened a case to review the FBA inbound shipment discrepancy for shipment ${shipmentReference}.\n\nWe are reviewing the shipment plan, fulfillment center receiving records, and the documentation provided with your request. If additional information is required, we will reply on this case thread.\n\nCase ID: ${threadCaseReference}\nShipment ID: ${shipmentReference}\nCurrent status: Under review\n\nThank you,\nAmazon Selling Partner Support`,
        received_at: '2026-05-07T16:42:00Z',
        state_signal: 'pending',
        attachments: [],
      },
      {
        id: `demo-amazon-followup-${caseId || 'case'}`,
        direction: 'inbound',
        sender: 'seller.service05@amazon.com',
        subject: '[Case ID:19822888381] Your Help Needed - Inventory lost in FBA warehouse',
        body_text: `Inbox\n\nseller.service05@amazon.com <seller.service05@amazon.com>\n31 Mar 2026, 18:31\n\nThis is a reminder to let you know that we need more information to resolve your case. If you still need assistance, respond to this message and provide the details we’ve requested below.\n\nIf we’ve resolved your issue, no further action is needed, and we’ll close your case.\n\nAmazon Support\n\n-- Original Message --\n\nHello from Amazon Selling Partner Support,\n\nWe are following up on your reimbursement request for lost units in FBA warehouse processing.\n\nTo proceed, please provide the following:\n• ASIN or FNSKU associated with the lost units.\n• Transaction ID.\n• Any supporting documents that further support our investigation.\n\nPlease use the Contact Us form in Seller Central to continue this case.\n\nCase ID: 19822888381\nShipment ID: ${shipmentReference}\nStatus: Waiting for more evidence\n\nThank you,\nAmazon Selling Partner Support`,
        received_at: '2026-03-31T18:31:00Z',
        state_signal: 'pending',
        attachments: [],
      },
      {
        id: `demo-amazon-approved-${caseId || 'case'}`,
        direction: 'inbound',
        sender: 'Amazon Selling Partner Support',
        subject: `APPROVED: Reimbursement issued for shipment ${shipmentReference}`,
        body_text: approvedBody,
        received_at: '2026-05-08T14:37:00Z',
        state_signal: isPaid ? 'paid' : 'approved',
        attachments: [],
      },
    ];
  }

  const responseBody = isRejected
    ? `Hello,\n\nWe reviewed the information provided for this FBA inventory reimbursement request. At this time, we are unable to approve reimbursement for the affected units because the available shipment and inventory records do not confirm an eligible discrepancy under the current FBA reimbursement criteria.\n\nNo reimbursement has been issued for this case. If you have additional documentation, such as carrier confirmation, shipment reconciliation records, or supplier invoice detail that was not included in the original request, you may reply to this case for further review.\n\nCase ID: ${caseReference}\nShipment ID: ${shipmentReference}\nReason: Inbound received quantity discrepancy not confirmed\n\nThank you,\nAmazon Selling Partner Support`
    : isFilingReceipt
    ? `Hello,\n\nWe received the reimbursement filing submitted on your behalf for this FBA inventory discrepancy. The request is now open with Amazon Selling Partner Support and is pending review.\n\nOur team will review the shipment and inventory records attached to the filing. If additional information is required, we will reply on this case thread with the next steps.\n\nCase ID: ${caseReference}\nShipment ID: ${shipmentReference}\nReason: Inbound received quantity discrepancy\n\nThank you,\nAmazon Selling Partner Support`
    : isPaid
    ? `Hello,\n\nWe reviewed the information provided for this FBA inventory reimbursement request. Based on the shipment and inventory records available, we have approved reimbursement for the affected units.\n\nA reimbursement of ${formatDemoCurrency(Number(reimbursementAmount), currency)} has been issued to your seller account and will appear in your payments reporting once processing completes. Please allow the normal settlement cycle for the amount to be reflected in your account.\n\nCase ID: ${caseReference}\nShipment ID: ${shipmentReference}\nReason: Inbound received quantity discrepancy\n\nThank you,\nAmazon Selling Partner Support`
    : `Hello,\n\nWe reviewed the information provided for this FBA inventory reimbursement request. Based on the shipment and inventory records available, we have approved reimbursement for the affected units.\n\nThe approved reimbursement amount is ${formatDemoCurrency(Number(reimbursementAmount), currency)} and is pending payment processing. Please allow the normal settlement cycle for the amount to be reflected in your account.\n\nCase ID: ${caseReference}\nShipment ID: ${shipmentReference}\nReason: Inbound received quantity discrepancy\n\nThank you,\nAmazon Selling Partner Support`;

  return [
    {
      id: `demo-amazon-response-${caseId || 'case'}`,
      direction: 'inbound',
      sender: 'Amazon Selling Partner Support',
      subject: isRejected
        ? 'Reimbursement request not approved for FBA inventory discrepancy'
        : isFilingReceipt
        ? 'Reimbursement filing received for FBA inventory discrepancy'
        : isPaid
        ? 'Reimbursement issued for FBA inventory discrepancy'
        : 'Reimbursement approved for FBA inventory discrepancy',
      body_text: responseBody.replaceAll(`Case ID: ${caseReference}`, `Case ID: ${threadCaseReference}`),
      received_at: '2026-05-08T14:37:00Z',
      state_signal: isRejected ? 'rejected' : isFilingReceipt ? 'pending' : isPaid ? 'paid' : 'approved',
      attachments: [],
    },
  ];
};

const hydrateDemoCaseDetail = (caseData: any, fallbackId?: string | null) => {
  if (!caseData) return caseData;

  const caseId = caseData.id || fallbackId || 'demo-case';
  const demoCaseReference = resolveDemoCaseReference(caseData, caseId);
  const isRejectedDemoCase = isRejectedDemoCaseReference(demoCaseReference);
  const shouldForceApprovedDemoThread = isApprovedDemoCaseReference(demoCaseReference);
  const documents = isMissingDemoValue(caseData.documents) ? buildDemoCaseDocuments(caseId) : caseData.documents;
  const events = isMissingDemoValue(caseData.events) ? buildDemoCaseEvents(caseId) : caseData.events;
  const shouldUseDemoFilingReceipt = hasDemoFilingReceiptThread(caseData, demoCaseReference);
  const caseMessages = shouldForceApprovedDemoThread || shouldUseDemoFilingReceipt || isMissingDemoValue(caseData.case_messages)
    ? buildDemoAmazonThreadMessages(caseData, caseId)
    : caseData.case_messages;
  const evidence = {
    ...(caseData.evidence || {}),
    sku: fallbackIfMissing(caseData.evidence?.sku, 'MGRN-BTL-18'),
    asin: fallbackIfMissing(caseData.evidence?.asin, 'B0DMRGN184'),
    fulfillment_center: fallbackIfMissing(caseData.evidence?.fulfillment_center, 'ABE8'),
    quantity: fallbackIfMissing(caseData.evidence?.quantity, 18),
    claim_number: fallbackIfMissing(caseData.evidence?.claim_number, demoCaseReference),
    total_receipts: fallbackIfMissing(caseData.evidence?.total_receipts, 240),
    total_returns: fallbackIfMissing(caseData.evidence?.total_returns, 6),
    total_adjustments: fallbackIfMissing(caseData.evidence?.total_adjustments, 0),
    total_shipments: fallbackIfMissing(caseData.evidence?.total_shipments, 211),
    total_removals: fallbackIfMissing(caseData.evidence?.total_removals, 17),
    total_input: fallbackIfMissing(caseData.evidence?.total_input, 246),
    total_output: fallbackIfMissing(caseData.evidence?.total_output, 228),
    calculated_stock: fallbackIfMissing(caseData.evidence?.calculated_stock, 18),
    ending_warehouse_balance: fallbackIfMissing(caseData.evidence?.ending_warehouse_balance, 0),
    discrepancy: fallbackIfMissing(caseData.evidence?.discrepancy, 18),
  };
  const evidenceSummary = {
    ...(caseData.evidence_summary || {}),
    has_documents: fallbackIfMissing(caseData.evidence_summary?.has_documents, true),
    matched_document_count: fallbackIfMissing(caseData.evidence_summary?.matched_document_count, documents.length),
    linked_document_count: fallbackIfMissing(caseData.evidence_summary?.linked_document_count, documents.length),
    match_type: fallbackIfMissing(caseData.evidence_summary?.match_type, 'invoice_shipment_inventory_match'),
  };

  return {
    ...caseData,
    truth_unavailable: false,
    id: caseId,
    entity_type: fallbackIfMissing(caseData.entity_type, 'recovery_case'),
    title: fallbackIfMissing(caseData.title, 'Inbound shipment shortage recovery'),
    details: fallbackIfMissing(caseData.details, 'Inbound shipment shortage recovery'),
    anomaly_type: fallbackIfMissing(caseData.anomaly_type, 'inbound_shipment_shortage'),
    status: fallbackIfMissing(caseData.status, 'Claim Ready'),
    filing_status: fallbackIfMissing(caseData.filing_status, 'filing_ready'),
    filing_strategy: fallbackIfMissing(caseData.filing_strategy, 'seller_approval_before_filing'),
    operational_state: fallbackIfMissing(caseData.operational_state, 'awaiting_seller_approval'),
    recovery_status: fallbackIfMissing(caseData.recovery_status, isRejectedDemoCase ? 'rejected' : 'awaiting_payout'),
    billing_status: fallbackIfMissing(caseData.billing_status, 'no_commission_due'),
    eligibility_status: fallbackIfMissing(caseData.eligibility_status, 'ready'),
    proof_status: fallbackIfMissing(caseData.proof_status, 'filing_ready'),
    payout_proof_status: fallbackIfMissing(caseData.payout_proof_status, 'tracked'),
    missing_requirements: Array.isArray(caseData.missing_requirements) ? caseData.missing_requirements : ['Seller approval before filing'],
    manual_review_reason: fallbackIfMissing(caseData.manual_review_reason, 'seller_approval_required'),
    quarantine_reason: fallbackIfMissing(caseData.quarantine_reason, 'none'),
    block_reasons: Array.isArray(caseData.block_reasons) && caseData.block_reasons.length ? caseData.block_reasons : ['seller_approval_required'],
    has_linked_dispute_case: fallbackIfMissing(caseData.has_linked_dispute_case, true),
    dispute_case_id: fallbackIfMissing(caseData.dispute_case_id, `demo-dispute-${String(caseId).slice(-6)}`),
    linked_dispute_case_id: fallbackIfMissing(caseData.linked_dispute_case_id, `demo-dispute-${String(caseId).slice(-6)}`),
    has_submission: fallbackIfMissing(caseData.has_submission, true),
    has_submission_proof: fallbackIfMissing(caseData.has_submission_proof, true),
    has_amazon_reference: fallbackIfMissing(caseData.has_amazon_reference, true),
    has_filing_truth: fallbackIfMissing(caseData.has_filing_truth, true),
    has_approval_truth: fallbackIfMissing(caseData.has_approval_truth, !isRejectedDemoCase),
    has_payout: fallbackIfMissing(caseData.has_payout, !isRejectedDemoCase),
    amazonCaseId: fallbackIfMissing(caseData.amazonCaseId || caseData.amazon_case_id, '173-8849921-4524317'),
    prior_case_id: fallbackIfMissing(caseData.prior_case_id, 'None detected'),
    case_state: fallbackIfMissing(caseData.case_state, isRejectedDemoCase ? 'rejected' : 'paid'),
    amazon_thread_linked: fallbackIfMissing(caseData.amazon_thread_linked, true),
    can_reply_to_thread: fallbackIfMissing(caseData.can_reply_to_thread, true),
    case_origin: fallbackIfMissing(caseData.case_origin, 'demo_recovery_audit'),
    origin_metadata: {
      ...(caseData.origin_metadata || {}),
      demo_fallback: true,
      claim_clock_days_remaining: fallbackIfMissing(caseData.origin_metadata?.claim_clock_days_remaining, 42),
    },
    generated_context: caseData.generated_context || {
      summaryLabel: 'Claim-ready recovery case',
      strategyLabel: 'Seller approval before filing',
      trustLabel: 'Read-only evidence review complete',
      generated: true,
    },
    next_step_context: caseData.next_step_context || {
      key: 'seller_approval',
      title: 'Seller approval before filing',
      description: 'Review the matched evidence packet and approve the prepared filing workflow.',
      generated: true,
    },
    finding_truth: caseData.finding_truth || {
      review_tier: 'claim_candidate',
      claim_readiness: 'claim_ready',
      value_label: 'recoverable_value',
      seller_summary: {
        summary: 'Margin found an inbound shortage where Amazon received fewer units than the shipment plan and matched the invoice, shipment report, and inventory ledger needed for review.',
      },
      policy_basis: {
        required_evidence: ['Supplier invoice', 'FBA shipment report', 'Inventory ledger'],
      },
      filing_movement: {
        label: 'Ready for seller approval',
        detail: 'The evidence packet is prepared. Filing should move forward only after seller approval.',
        next_action_label: 'Review and approve',
      },
    },
    seller_summary: caseData.seller_summary || {
      summary: 'Margin found an inbound shortage where Amazon received fewer units than the shipment plan and matched the invoice, shipment report, and inventory ledger needed for review.',
    },
    policy_basis: caseData.policy_basis || {
      required_evidence: ['Supplier invoice', 'FBA shipment report', 'Inventory ledger'],
    },
    filing_movement: caseData.filing_movement || {
      label: 'Ready for seller approval',
      detail: 'The evidence packet is prepared. Filing should move forward only after seller approval.',
      next_action_label: 'Review and approve',
    },
    review_tier: fallbackIfMissing(caseData.review_tier, 'claim_candidate'),
    claim_readiness: fallbackIfMissing(caseData.claim_readiness, 'claim_ready'),
    recommended_action: fallbackIfMissing(caseData.recommended_action, 'Review matched evidence and approve filing'),
    value_label: fallbackIfMissing(caseData.value_label, 'recoverable_value'),
    why_not_claim_ready: fallbackIfMissing(caseData.why_not_claim_ready, ''),
    coverage_family: fallbackIfMissing(caseData.coverage_family, 'inbound_shortage'),
    claim_number: fallbackIfMissing(caseData.claim_number, demoCaseReference),
    guaranteedAmount: fallbackIfMissing(caseData.guaranteedAmount, 1284.66),
    estimated_claim_value: fallbackIfMissing(caseData.estimated_claim_value, 1284.66),
    requested_amount: fallbackIfMissing(caseData.requested_amount, 1284.66),
    approved_amount: fallbackIfMissing(caseData.approved_amount, isRejectedDemoCase ? 0 : 1284.66),
    recovered_amount: fallbackIfMissing(caseData.recovered_amount, isRejectedDemoCase ? 0 : 1284.66),
    actual_payout_amount: fallbackIfMissing(caseData.actual_payout_amount, isRejectedDemoCase ? 0 : 1284.66),
    billed_amount: fallbackIfMissing(caseData.billed_amount, 0),
    value_per_unit: fallbackIfMissing(caseData.value_per_unit, 71.37),
    unitCost: fallbackIfMissing(caseData.unitCost, 71.37),
    unit_cost: fallbackIfMissing(caseData.unit_cost, 71.37),
    confidence: fallbackIfMissing(caseData.confidence, 0.93),
    confidence_score: fallbackIfMissing(caseData.confidence_score, 0.93),
    evidenceStatus: fallbackIfMissing(caseData.evidenceStatus, isRejectedDemoCase ? 'Rejected by Amazon' : 'Matched evidence packet'),
    expectedPayoutDate: fallbackIfMissing(caseData.expectedPayoutDate, '2026-05-23T00:00:00Z'),
    createdDate: fallbackIfMissing(caseData.createdDate, '2026-05-06T09:18:00Z'),
    created_at: fallbackIfMissing(caseData.created_at, '2026-05-06T09:18:00Z'),
    discovery_date: fallbackIfMissing(caseData.discovery_date, '2026-05-06T09:18:00Z'),
    updated_at: fallbackIfMissing(caseData.updated_at, '2026-05-08T15:42:00Z'),
    sku: fallbackIfMissing(caseData.sku, 'MGRN-BTL-18'),
    asin: fallbackIfMissing(caseData.asin, 'B0DMRGN184'),
    productName: fallbackIfMissing(caseData.productName, 'Stainless Steel Water Bottle - 18 oz'),
    facility: fallbackIfMissing(caseData.facility, 'ABE8'),
    warehouse: fallbackIfMissing(caseData.warehouse, 'ABE8'),
    unitsLost: fallbackIfMissing(caseData.unitsLost, 18),
    units_lost: fallbackIfMissing(caseData.units_lost, 18),
    units_is_verified: fallbackIfMissing(caseData.units_is_verified, true),
    order_id: fallbackIfMissing(caseData.order_id, 'FBA17XJ4K2'),
    seller_id: fallbackIfMissing(caseData.seller_id, 'A2DEMOSELLER9'),
    user_id: fallbackIfMissing(caseData.user_id, 'demo-operator'),
    store_name: fallbackIfMissing(caseData.store_name, 'Demo Workspace Store'),
    documents,
    events,
    case_messages: caseMessages,
    evidence,
    evidence_summary: evidenceSummary,
    evidence_attachments: caseData.evidence_attachments || {
      match_type: 'invoice_shipment_inventory_match',
      decision_intelligence: {
        filing_strategy: 'seller_approval_before_filing',
        operational_state: 'awaiting_seller_approval',
        eligibility_status: 'ready',
      },
    },
    warehouse_history: caseData.warehouse_history || {
      occurrence_count: 3,
      total_value_lost: 3748.92,
      source: 'Demo FBA reconciliation history',
    },
    currency: fallbackIfMissing(caseData.currency, 'USD'),
  };
};

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
  recorded_payout_amount: apiData.recorded_payout_amount ?? apiData.actual_payout_amount ?? apiData.recovered_amount ?? null,
  recovered_amount: apiData.recovered_amount ?? apiData.actual_payout_amount ?? null,
  actual_payout_amount: apiData.actual_payout_amount ?? apiData.recovered_amount ?? null,
  verified_paid_amount: apiData.verified_paid_amount ?? null,
  outstanding_amount: apiData.outstanding_amount ?? null,
  variance_amount: apiData.variance_amount ?? null,
  financial_payout_status: apiData.financial_payout_status ?? null,
  financial_reversal_state: apiData.financial_reversal_state ?? null,
  financial_truth_limitation: apiData.financial_truth_limitation ?? null,
  financial_payout_proof: apiData.financial_payout_proof ?? null,
  accounting_truth: apiData.accounting_truth ?? null,
  closure_truth: apiData.closure_truth ?? null,
  safety_evaluations: apiData.safety_evaluations ?? null,
  unit_quantity_source: apiData.unit_quantity_source ?? 'unavailable',
  unit_value_provenance: apiData.unit_value_provenance ?? 'unavailable',
  billed_amount: apiData.billed_amount ?? null,
  expectedPayoutDate: apiData.expectedPayoutDate || apiData.expected_payout_date || null,
  createdDate: apiData.createdDate || apiData.created_at || apiData.discovery_date || null,
  sku: (apiData.sku && apiData.sku !== 'N/A') ? apiData.sku :
    (apiData.evidence?.sku && apiData.evidence?.sku !== 'N/A') ? apiData.evidence.sku : '-',
  asin: apiData.asin || apiData.evidence?.asin || null,
  fnsku: apiData.fnsku || apiData.evidence?.fnsku || apiData.evidence?.FNSKU || null,
  identity_truth: apiData.identity_truth ?? null,
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

// Generated context is intentionally conservative. Structured backend finding truth remains the only
// source permitted to state a specific Amazon event, eligibility, filing, approval, or recovery outcome.
const generateNarrative = (claim: any): string => {
  const caseType = String(claim?.anomaly_type || claim?.claim_type || claim?.case_type || 'discrepancy')
    .replace(/[_-]+/g, ' ')
    .trim() || 'discrepancy';
  const sku = String(claim?.sku || claim?.evidence?.sku || '').trim();
  const asin = String(claim?.asin || claim?.evidence?.asin || '').trim();
  const candidateAmount = [
    claim?.estimated_claim_value,
    claim?.estimated_recovery_amount,
    claim?.estimated_value,
    claim?.claim_amount,
    claim?.requested_amount,
  ].find((value) => typeof value === 'number' && Number.isFinite(value));
  const estimateText = typeof candidateAmount === 'number'
    ? ` The current estimated claim value is ${candidateAmount.toLocaleString('en-US', { style: 'currency', currency: claim?.currency || 'USD' })}; it is not an approval or payment.`
    : ' No monetary estimate is currently available.';
  const identity = [sku ? `SKU ${sku}` : null, asin ? `ASIN ${asin}` : null].filter(Boolean).join(' / ');

  return `Margin generated this context from the current ${caseType} case fields${identity ? ` for ${identity}` : ''}. It is not independent proof of an Amazon event, eligibility, filing, approval, or reimbursement.${estimateText} Review the linked evidence and current filing status before taking action.`;
};

function ClaimRecordSection({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5', className)}>
      <div className="mb-4 border-b border-[#E7EEF2] pb-3">
        {eyebrow ? <p className="text-[12px] font-medium tracking-tight text-[#66737F]">{eyebrow}</p> : null}
        <h3 className="mt-1 font-lora text-[18px] font-normal tracking-tight text-[#182026]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ClaimRecordField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-[#E7EEF2] pb-2.5', className)}>
      <dt className="text-[12px] font-medium tracking-tight text-[#66737F]">{label}</dt>
      <dd className="mt-1.5 text-[13px] font-medium leading-5 tracking-tight text-[#182026]">{children}</dd>
    </div>
  );
}

function ClaimRecordMetric({
  label,
  value,
  detail,
  tone = 'default',
  className,
  valueClassName,
  detailClassName,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: 'default' | 'money' | 'safe' | 'warning';
  className?: string;
  valueClassName?: string;
  detailClassName?: string;
}) {
  const toneClass = 'text-[#111827]';

  return (
    <div className={cn('rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3', className)}>
      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">{label}</p>
      <div className={cn('mt-2 text-[14px] font-medium tracking-tight tabular-nums', toneClass, valueClassName)}>{value}</div>
      {detail ? <div className={cn('mt-1 text-[11px] font-medium leading-4 tracking-tight text-[#66737F]', detailClassName)}>{detail}</div> : null}
    </div>
  );
}

function ClaimRecordStatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-md border border-[#DCE8EE] bg-white px-2 py-1 text-[11px] font-medium leading-none tracking-tight text-[#182026]">
      {children}
    </span>
  );
}

function AccountingReconciliationWidget({ caseId, tenantSlug }: { caseId: string; tenantSlug?: string }) {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('quickbooks');
  const { toast } = useToast();

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRecoveryReconciliation(caseId, tenantSlug);
      if (res.success) {
        setReconciliation(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch reconciliation status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchReconciliation();
    }
  }, [caseId, tenantSlug]);

  const handleRunReconciliation = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runRecoveryReconciliation(caseId, provider, tenantSlug);
      if (res.success) {
        setReconciliation(res.data);
        toast({
          title: 'Reconciliation Completed',
          description: `Successfully reconciled against ${provider.toUpperCase()}`
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Reconciliation failed due to provider or API error');
      toast({
        title: 'Reconciliation Error',
        description: err?.message || 'Failed to run reconciliation',
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <ClaimRecordSection title="Accounting Reconciliation" eyebrow="QuickBooks & Xero Audit Trail">
        <div className="flex items-center gap-3 py-4 text-[#6B7C88]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Checking accounting records...</span>
        </div>
      </ClaimRecordSection>
    );
  }

  return (
    <ClaimRecordSection title="Accounting Reconciliation" eyebrow="QuickBooks & Xero Audit Trail">
      <div className="space-y-4">
        {error && (
          <div className="rounded-[2px] border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        {!reconciliation ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-dashed border-[#D8E3E8] bg-[#FAFAF7] p-4">
            <div>
              <p className="text-xs font-semibold text-[#07111A]">No accounting reconciliation performed yet</p>
              <p className="mt-1 text-[11px] text-[#6B7C88]">
                Match this recovery against authoritative purchasing invoices, bills, or bank transactions in QuickBooks or Xero.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="h-8 w-[140px] border-[#D8E3E8] bg-white text-xs">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="quickbooks">QuickBooks</SelectItem>
                  <SelectItem value="xero">Xero</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleRunReconciliation}
                disabled={running}
                className="h-8 rounded-md bg-[#0B74DE] text-xs font-medium text-white hover:bg-[#075EAF]"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Run Reconciliation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4EDF1] pb-3">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight",
                  reconciliation.status === 'RECONCILED' && "bg-emerald-100 text-emerald-800 border-emerald-300",
                  reconciliation.status === 'PARTIAL_MATCH' && "bg-blue-100 text-blue-800 border-blue-300",
                  reconciliation.status === 'NEEDS_REVIEW' && "bg-blue-100 text-blue-800 border-blue-300",
                  reconciliation.status === 'UNMATCHED' && "bg-slate-100 text-slate-800 border-slate-300"
                )}>
                  {reconciliation.status === 'RECONCILED' && 'Reconciled'}
                  {reconciliation.status === 'PARTIAL_MATCH' && 'Partial Match (Review Required)'}
                  {reconciliation.status === 'NEEDS_REVIEW' && 'Multiple Candidates (Needs Review)'}
                  {reconciliation.status === 'UNMATCHED' && 'Unreconciled / No Record Found'}
                </Badge>
                <span className="text-[11px] font-medium text-[#6B7C88] uppercase tracking-tight">
                  Provider: {reconciliation.provider || provider}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunReconciliation}
                  disabled={running}
                  className="h-7 border-[#D8E3E8] bg-white text-[11px] font-medium text-[#4D5B66]"
                >
                  {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Rerun
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ClaimRecordMetric
                label="Expected Amount"
                value={formatCurrencyOrDash(reconciliation.expectedAmount, reconciliation.currency || 'USD')}
              />
              <ClaimRecordMetric
                label="Matched Amount"
                value={reconciliation.matchedAmount != null ? formatCurrencyOrDash(reconciliation.matchedAmount, reconciliation.currency || 'USD') : 'Not available'}
              />
              <ClaimRecordMetric
                label="Difference"
                value={reconciliation.difference != null ? formatCurrencyOrDash(reconciliation.difference, reconciliation.currency || 'USD') : 'Not available'}
              />
            </div>

            <div className="border-t border-[#E4EDF1] pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Reconciliation Analysis & Reasons</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(reconciliation.matchReasons) && reconciliation.matchReasons.map((reason: string) => (
                  <span key={reason} className="inline-flex items-center bg-[#F8FAFB] border border-[#D8E3E8] px-2.5 py-1 text-[11px] font-medium text-[#4D5B66]">
                    {reason.replace(/[_-]+/g, ' ')}
                  </span>
                ))}
              </div>
              {reconciliation.status === 'NEEDS_REVIEW' && (
                <p className="mt-2 text-[11px] text-blue-700 font-medium">
                  Margin found multiple plausible accounting candidates and has NOT automatically reconciled this recovery. Please review manually.
                </p>
              )}
              {reconciliation.status === 'UNMATCHED' && (
                <p className="mt-2 text-[11px] text-slate-700 font-medium">
                  Margin successfully retrieved the relevant accounting dataset and found no credible candidate matching this recovery.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ClaimRecordSection>
  );
}

export default function CaseDetail() {
  const { caseId, tenantSlug } = useParams<{ caseId: string; tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const { isAuthReady, isSessionValid } = useSession();
  const activeSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);
  const aiExplainEnabled = activeSlug === 'demo-workspace';
  const navigate = useNavigate();

  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const seedCaseData = useMemo(() => {
    if (!passedClaim) return null;
    const normalized = normalizeCaseDetailData(passedClaim, caseId);
    return isDemoWorkspaceSlug(activeSlug) ? hydrateDemoCaseDetail(normalized, caseId) : normalized;
  }, [activeSlug, caseId, passedClaim]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasResolvedBackend, setHasResolvedBackend] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('PDF Preview');
  const [pdfPreviewLabel, setPdfPreviewLabel] = useState('Document Preview');
  const [caseData, setCaseData] = useState<any | null>(null);
  const caseDataRef = useRef<any | null>(null);
  const { toast } = useToast();
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('payout');
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PROTOCOL'>('RECORD');
  const [statusFeedUnavailable, setStatusFeedUnavailable] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedReplyAttachmentIds, setSelectedReplyAttachmentIds] = useState<string[]>([]);
  const [caseEvents, setCaseEvents] = useState<any[]>([]);
  const caseEventsRef = useRef<any[]>([]);
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

  const formatQuantityOrDash = (value?: number | null) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return NOT_AVAILABLE;
    return value.toLocaleString('en-US');
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
        const displayCase = isDemoWorkspaceSlug(activeSlug)
          ? hydrateDemoCaseDetail(normalized, currentCaseId)
          : normalized;
        caseDataRef.current = displayCase;
        setCaseData(displayCase);
        if (Array.isArray(displayCase?.documents)) {
          setMatchedDocs(displayCase.documents);
        } else {
          setMatchedDocs([]);
        }
        setStatusFeedUnavailable(false);
        setError(null);
      } else {
        const failureReason = res.error || 'Case details unavailable';
        const failureState = selectCaseDetailFailureState({
          tenantSlug: activeSlug,
          caseId: currentCaseId,
          failureReason,
          lastKnownCase: caseDataRef.current,
          buildUnavailableCase: buildUnavailableCaseDetail,
          hydrateDemoCase: hydrateDemoCaseDetail,
        });
        caseDataRef.current = failureState.caseData;
        setCaseData(failureState.caseData);
        setMatchedDocs(Array.isArray(failureState.caseData?.documents) ? failureState.caseData.documents : []);
        setStatusFeedUnavailable(true);
        setError(failureState.error);
      }
    } catch (err: any) {
      const failureReason = err?.message || 'Case details unavailable';
      const failureState = selectCaseDetailFailureState({
        tenantSlug: activeSlug,
        caseId: currentCaseId,
        failureReason,
        lastKnownCase: caseData,
        buildUnavailableCase: buildUnavailableCaseDetail,
        hydrateDemoCase: hydrateDemoCaseDetail,
      });
      setCaseData(failureState.caseData);
      setMatchedDocs(Array.isArray(failureState.caseData?.documents) ? failureState.caseData.documents : []);
      setStatusFeedUnavailable(true);
      setError(failureState.error);
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
        const resolvedEvents = response.data.length || !isDemoWorkspaceSlug(activeSlug)
          ? response.data
          : buildDemoCaseEvents(currentCaseId);
        caseEventsRef.current = resolvedEvents;
        setCaseEvents(resolvedEvents);
        eventsResolvedForCaseIdRef.current = currentCaseId;
        setEventsResolvedForCaseId(currentCaseId);
      } else {
        const failureState = selectCaseDetailEventFailureState({
          tenantSlug: activeSlug,
          caseId: currentCaseId,
          lastKnownEvents: caseEventsRef.current,
          buildDemoEvents: buildDemoCaseEvents,
        });
        caseEventsRef.current = failureState.events;
        setCaseEvents(failureState.events);
        setStatusFeedUnavailable(true);
      }
    } catch {
      const failureState = selectCaseDetailEventFailureState({
        tenantSlug: activeSlug,
        caseId: currentCaseId,
        lastKnownEvents: caseEventsRef.current,
        buildDemoEvents: buildDemoCaseEvents,
      });
      caseEventsRef.current = failureState.events;
      setCaseEvents(failureState.events);
      setStatusFeedUnavailable(true);
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
  const replyDisabledReason = (() => {
    if (backendTruthCase?.truth_unavailable) {
      return 'Reply is unavailable until Margin restores authoritative case truth and can confirm a safe evidence-backed action.';
    }
    if (backendEligibilityStatus === 'THREAD_ONLY') {
      return 'Amazon thread detected. Reply stays disabled until verified identifiers support a safe case path.';
    }
    if (hasTrustedPayoutTruth(backendTruthCase)) {
      return 'Reply is unavailable while this recovery is in payment and closure review. Margin will only reopen the Amazon thread if a new evidence-backed action is justified.';
    }
    if (hasTrustedApprovalTruth(backendTruthCase)) {
      return 'Reply is unavailable while Margin verifies the approved outcome and the related payment evidence.';
    }
    if (hasTrustedFilingTruth(backendTruthCase)) {
      return 'Reply is unavailable while Margin waits for Amazon’s outcome or a supported evidence request on the linked case.';
    }
    return 'Reply is unavailable until the current case truth supports a safe evidence-backed action.';
  })();
  const openCanonicalFilingScreen = useCallback((intent: 'submit' | 'resubmit') => {
    if (confirmedLinkedDisputeCaseId && activeSlug) {
      toast({
        title: intent === 'resubmit' ? 'Use Dispute Cases to retry filing' : 'Use Dispute Cases to file',
        description: `Opening the linked filing workspace for dispute case ${confirmedLinkedDisputeCaseId}.`
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
  const recordedPayoutAmount = typeof backendTruthCase?.recorded_payout_amount === 'number'
    ? backendTruthCase.recorded_payout_amount
    : (typeof backendTruthCase?.actual_payout_amount === 'number'
      ? backendTruthCase.actual_payout_amount
      : (typeof backendTruthCase?.recovered_amount === 'number' ? backendTruthCase.recovered_amount : null));
  const verifiedPaidAmount = typeof backendTruthCase?.verified_paid_amount === 'number'
    ? backendTruthCase.verified_paid_amount
    : null;
  const outstandingAmount = typeof backendTruthCase?.outstanding_amount === 'number'
    ? backendTruthCase.outstanding_amount
    : null;
  const varianceAmount = typeof backendTruthCase?.variance_amount === 'number'
    ? backendTruthCase.variance_amount
    : null;
  const financialPayoutStatus = typeof backendTruthCase?.financial_payout_status === 'string'
    ? backendTruthCase.financial_payout_status
    : null;
  const financialReversalState = typeof backendTruthCase?.financial_reversal_state === 'string'
    ? backendTruthCase.financial_reversal_state
    : null;
  const financialTruthLimitation = typeof backendTruthCase?.financial_truth_limitation === 'string'
    ? backendTruthCase.financial_truth_limitation
    : null;
  const accountingTruth = backendTruthCase?.accounting_truth && typeof backendTruthCase.accounting_truth === 'object'
    ? backendTruthCase.accounting_truth
    : null;
  const closureTruth = backendTruthCase?.closure_truth && typeof backendTruthCase.closure_truth === 'object'
    ? backendTruthCase.closure_truth
    : null;
  const safetyEvaluations = backendTruthCase?.safety_evaluations && typeof backendTruthCase.safety_evaluations === 'object'
    ? backendTruthCase.safety_evaluations
    : {};
  const safetyEvaluationLabel = (key: 'prior_reimbursement' | 'inventory_adjustment' | 'duplicate_claim', yesLabel: string, noLabel: string) => {
    const state = safetyEvaluations?.[key]?.state;
    if (state === 'yes') return yesLabel;
    if (state === 'no') return noLabel;
    return 'Not assessed';
  };
  const hasSafetyBlock = ['prior_reimbursement', 'inventory_adjustment', 'duplicate_claim']
    .some((key) => safetyEvaluations?.[key]?.state === 'yes');
  const hasUnassessedSafety = ['prior_reimbursement', 'inventory_adjustment', 'duplicate_claim']
    .some((key) => safetyEvaluations?.[key]?.state === 'not_assessed');
  const unitValueProvenance = typeof backendTruthCase?.unit_value_provenance === 'string'
    ? backendTruthCase.unit_value_provenance
    : 'unavailable';
  const billedAmount = typeof backendTruthCase?.billed_amount === 'number' ? backendTruthCase.billed_amount : null;
  const trustedApprovedAmount = hasTrustedApprovalTruth(backendTruthCase) ? approvedAmount : null;
  const trustedRecoveredAmount = hasTrustedPayoutTruth(backendTruthCase) ? verifiedPaidAmount : null;
  const trustedBilledAmount = hasTrustedPayoutTruth(backendTruthCase) && positiveAmount(billedAmount) !== null ? billedAmount : null;
  const explicitValuePerUnit = typeof backendTruthCase?.value_per_unit === 'number' ? backendTruthCase.value_per_unit : null;
  const backendUnitCost = typeof backendTruthCase?.unitCost === 'number'
    ? backendTruthCase.unitCost
    : (typeof backendTruthCase?.unit_cost === 'number' ? backendTruthCase.unit_cost : null);
  const firstPositiveAmount = (...values: unknown[]) => {
    for (const value of values) {
      const amount = positiveAmount(value);
      if (amount !== null) return amount;
    }
    return null;
  };
  const claimRecordUnitValue = firstPositiveAmount(
    explicitValuePerUnit,
    backendUnitCost,
    effectiveCase?.value_per_unit,
    effectiveCase?.unitCost,
    effectiveCase?.unit_cost
  );
  const claimRecordUnitCount = firstPositiveAmount(resolvedUnitsAffected, backendUnitsAffected);
  const claimRecordUnitDerivedAmount = claimRecordUnitValue !== null && claimRecordUnitCount !== null
    ? Number((claimRecordUnitValue * claimRecordUnitCount).toFixed(2))
    : null;
  // Phase B preserves certified backend truth values; Tab 1 must not substitute a scenario amount for an observed, requested, approved, or verified financial fact.
  const claimRecordDemoAmount: number | null = null;
  const firstFiniteAmount = (...values: unknown[]) => {
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      const amount = Number(value);
      if (Number.isFinite(amount)) return Number(amount.toFixed(2));
    }
    return null;
  };
  const claimRecordRequestedAmount = claimRecordDemoAmount ?? firstFiniteAmount(requestedAmount, effectiveCase?.requested_amount, effectiveCase?.claim_amount);
  const claimRecordEstimatedClaimValue = claimRecordDemoAmount ?? firstFiniteAmount(estimatedClaimValue, effectiveCase?.estimated_claim_value, effectiveCase?.estimated_recovery_amount, effectiveCase?.estimated_value, claimRecordUnitDerivedAmount);
  const claimRecordApprovedAmount = claimRecordDemoAmount ?? firstFiniteAmount(trustedApprovedAmount);
  const claimRecordRecordedPayoutAmount = claimRecordDemoAmount ?? firstFiniteAmount(recordedPayoutAmount);
  const claimRecordVerifiedPaidAmount = claimRecordDemoAmount ?? firstFiniteAmount(trustedRecoveredAmount);
  const claimRecordLegacyBilledAmount = claimRecordDemoAmount ?? firstFiniteAmount(trustedBilledAmount, billedAmount, effectiveCase?.billed_amount);
  const inventoryQuantity = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const inventoryEvidence = effectiveCase?.evidence || {};
  const inventoryTotalInput = inventoryQuantity(inventoryEvidence.total_input);
  const inventoryTotalOutput = inventoryQuantity(inventoryEvidence.total_output);
  const inventoryCalculatedStock = inventoryQuantity(inventoryEvidence.calculated_stock)
    ?? (inventoryTotalInput !== null && inventoryTotalOutput !== null ? inventoryTotalInput - inventoryTotalOutput : null);
  const inventoryWarehouseBalance = inventoryQuantity(inventoryEvidence.ending_warehouse_balance);
  const inventoryDiscrepancy = inventoryQuantity(inventoryEvidence.discrepancy)
    ?? (inventoryCalculatedStock !== null && inventoryWarehouseBalance !== null
      ? Math.max(0, inventoryCalculatedStock - inventoryWarehouseBalance)
      : null);
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
  const findingAmount = claimRecordDemoAmount ?? firstPositiveAmount(requestedAmount, estimatedClaimValue, effectiveCase?.guaranteedAmount, claimRecordRequestedAmount);
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
  const displayedMatchedDocs = useMemo(() => {
    if (!isDemoWorkspaceSlug(activeSlug) || caseId !== 'ACME-CASE-2005') return matchedDocs;
    const baseDocs = Array.isArray(matchedDocs) ? matchedDocs.slice(0, 3).map((doc: any, idx: number) => {
      const docText = String(doc?.matchType || doc?.type || '').toLowerCase();
      if (idx === 0 || docText.includes('ship')) {
        return {
          ...doc,
          id: `${doc?.id || 'ship'}-acme-2005`,
          name: 'SHIP-ACME-2005.pdf',
          filename: 'SHIP-ACME-2005.pdf',
          original_filename: 'SHIP-ACME-2005.pdf',
          matchType: 'shipping',
        };
      }
      if (idx === 1 || docText.includes('inv')) {
        return {
          ...doc,
          id: `${doc?.id || 'inv'}-acme-2005`,
          name: 'INV-ACME-2005.pdf',
          filename: 'INV-ACME-2005.pdf',
          original_filename: 'INV-ACME-2005.pdf',
          matchType: 'invoice',
        };
      }
      return {
        ...doc,
        id: `${doc?.id || 'po'}-acme-2005`,
        name: 'PO-ACME-2005.pdf',
        filename: 'PO-ACME-2005.pdf',
        original_filename: 'PO-ACME-2005.pdf',
        matchType: 'purchase order',
      };
    }) : [];

    return [
      ...baseDocs,
      {
        id: 'acme-2005-ledger',
        name: 'ACME-2005-ledger.pdf',
        filename: 'ACME-2005-ledger.pdf',
        original_filename: 'ACME-2005-ledger.pdf',
        matchType: 'ledger',
        confidence_score: 0.95,
        evidence: 'Accounting ledger excerpt tied to the reimbursement trail.',
      }
    ];
  }, [activeSlug, caseId, matchedDocs]);
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
  const recoveryTruthPresentation = buildRecoveryTruthPresentation({
    truthUnavailable: effectiveCase?.truth_unavailable === true,
    hasTrustedFiling: hasTrustedFilingTruth(backendTruthCase),
    hasTrustedApproval: hasTrustedApprovalTruth(backendTruthCase),
    hasTrustedPayout: hasTrustedPayoutTruth(backendTruthCase),
    filingStatus: backendTruthCase?.filing_status,
    filingTruthLine: getCaseFilingTruthLine(effectiveCase, proofStatus),
    claimReadiness,
    financialPayoutStatus,
    financialReversalState,
    financialTruthLimitation,
    verifiedPaidAmount,
    outstandingAmount,
    varianceAmount,
    accountingStatus: accountingTruth?.status,
    accountingLimitation: accountingTruth?.limitation,
    closureState: closureTruth?.state,
    closureReason: closureTruth?.reason,
    hasSafetyBlock,
    hasUnassessedSafety,
    statusFeedUnavailable,
  });
  const requestedRecoveryLanguage = getRequestedRecoveryLanguage(claimRecordRequestedAmount);
  const accountingClaimBoundary = getAccountingClaimBoundary({
    status: accountingTruth?.status,
    limitation: accountingTruth?.limitation,
  });
  const quarantineReason = typeof backendTruthCase?.quarantine_reason === 'string' && backendTruthCase.quarantine_reason.trim()
    ? sellerSafeOperationalText(backendTruthCase.quarantine_reason)
    : null;
  const approvalGuidance = useMemo(() => {
    const hasMatchedDocs = typeof matchedCount === 'number' && matchedCount > 0;
    const hasCurrentFiling = hasTrustedFilingTruth(backendTruthCase);
    const hasCurrentApproval = hasTrustedApprovalTruth(backendTruthCase);
    const hasCurrentPayout = hasTrustedPayoutTruth(backendTruthCase);
    const isFinanciallyClosed = recoveryTruthPresentation.label === 'Financially closed';
    const matchedDocsLabel = matchedCount === null
      ? NOT_AVAILABLE
      : `${matchedCount} matched ${matchedCount === 1 ? 'doc' : 'docs'}`;
    const formattedRequirements = missingRequirements?.length ? formatRequirementList(missingRequirements, 2) : null;
    const formattedManualReviewReason = manualReviewReason ? formatDisputeReason(manualReviewReason) : null;
    const normalizedProofStatus = String(proofStatus || '').toLowerCase();
    const normalizedPayoutProofStatus = String(payoutProofStatus || '').toLowerCase();
    const normalizedEligibilityStatus = String(effectiveCase?.eligibility_status || backendTruthCase?.eligibility_status || '').toLowerCase();

    if (hasCurrentPayout) {
      return {
        description: isFinanciallyClosed
          ? 'Payment is verified and the available closure checks establish financial closure for this recovery.'
          : recoveryTruthPresentation.explanation,
        helper: isFinanciallyClosed
          ? 'No further recovery action is established from the current record unless a new linked event changes it.'
          : 'Filing approval is a historical step for this recovery. Use Recovery progress to follow the remaining closure condition.',
        chips: [
          `Current state: ${recoveryTruthPresentation.label}`,
          `Docs linked: ${matchedDocsLabel}`,
          payoutProofStatus ? `Payout: ${formatPayoutProofStatus(payoutProofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (hasCurrentApproval) {
      return {
        description: 'Amazon approval is established, but Margin has not yet verified the corresponding payment event.',
        helper: 'Filing approval is complete. Margin is monitoring settlement activity and will verify the payment against this recovery when it appears.',
        chips: [
          'Current state: Approved — payment not verified',
          `Docs linked: ${matchedDocsLabel}`,
          payoutProofStatus ? `Payout: ${formatPayoutProofStatus(payoutProofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

    if (hasCurrentFiling) {
      return {
        description: 'Submission proof is recorded. Margin is waiting for Amazon’s outcome or an evidence request on the linked case.',
        helper: 'Filing is already established for this recovery; seller approval is not the current action unless Margin requests additional evidence.',
        chips: [
          'Current state: Filed — awaiting Amazon outcome',
          `Docs linked: ${matchedDocsLabel}`,
          proofStatus ? `Proof: ${formatProofStatus(proofStatus)}` : null,
        ].filter(Boolean) as string[],
      };
    }

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
    backendTruthCase,
    backendTruthCase?.eligibility_status,
    effectiveCase?.eligibility_status,
    effectiveCase?.safety_audit,
    manualReviewReason,
    matchedCount,
    missingRequirements,
    payoutProofStatus,
    proofStatus,
    quarantineReason,
    recoveryTruthPresentation,
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
        { label: 'Payment verified', active: false }
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
    return [
      { label: 'Detected', active: Boolean(effectiveCase?.id) },
      { label: 'Evidence', active: hasEvidence },
      { label: 'Filed', active: hasSubmission },
      { label: 'Approved', active: hasApproval },
      { label: 'Payment verified', active: hasPayout }
    ];
  }, [activeSlug, backendTruthCase, caseId, effectiveCase?.id, effectiveCase?.truth_unavailable, hasResolvedBackend, matchedDocs.length]);

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
        <div className="platform-vitality-page flex min-h-[60vh] items-center justify-center bg-[#FAFAF7] text-[#111827]">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-[#07111A]">Workspace context required</h2>
            <p className="mb-6 text-[#6B7C88]">This case detail link needs a tenant-scoped route.</p>
            <Button asChild className="border border-[#D8E3E8] bg-white text-[#111827] hover:bg-[#F8FAFB]">
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
          <div className="relative w-full bg-[#F9FAFB] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-[13px]">
            <div className="relative container mx-auto px-8 pt-8 pb-10 text-[#26333D]">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-6">
                  <div className="h-10 w-10 rounded-[2px] border border-[#D8E3E8] bg-[#F8FAFB]" />
                  <div className="max-w-[680px] space-y-4">
                    <Skeleton className="h-6 w-[280px] bg-[#F8FAFB]" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28 bg-[#F8FAFB]" />
                      <Skeleton className="h-4 w-[420px] max-w-full bg-[#F8FAFB]" />
                      <Skeleton className="h-4 w-[360px] max-w-full bg-[#F8FAFB]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-32 rounded-md bg-[#F8FAFB]" />
                  <Skeleton className="h-8 w-36 rounded-md bg-[#F8FAFB]" />
                </div>
              </div>

              <div className="mb-4 rounded-[2px] border border-[#D8E3E8] bg-white p-6">
                <div className="flex items-center gap-3 text-[#6B7C88]">
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-500/60" />
                  <div>
                    <p className="text-[11px] font-sans font-bold uppercase tracking-tight text-[#6B7C88]">Opening case record</p>
                    <p className="mt-1 text-sm text-[#6B7C88]">Loading evidence, filing history, and payout activity in the background.</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex border-b border-[#D8E3E8]">
                <div className="px-8 py-4 text-[12px] font-bold uppercase text-[#07111A]">What we found</div>
                <div className="px-8 py-4 text-[12px] font-bold uppercase text-[#6B7C88]">Recovery progress</div>
              </div>

              <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-[2px] border border-[#D8E3E8] divide-y divide-[#D8E3E8]">
                <div className="bg-white p-8 space-y-5">
                  <Skeleton className="h-5 w-48 bg-[#F8FAFB]" />
                  <Skeleton className="h-4 w-full bg-[#F8FAFB]" />
                  <Skeleton className="h-4 w-[92%] bg-[#F8FAFB]" />
                  <Skeleton className="h-4 w-[76%] bg-[#F8FAFB]" />
                </div>
                <div className="bg-white p-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-28 bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-full bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-[88%] bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-[80%] bg-[#F8FAFB]" />
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-28 bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-full bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-[86%] bg-[#F8FAFB]" />
                      <Skeleton className="h-3 w-[72%] bg-[#F8FAFB]" />
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
        <div className="platform-vitality-page flex min-h-[60vh] items-center justify-center bg-[#FAFAF7] text-[#111827]">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-[#07111A]">Case not found</h2>
            <p className="mb-6 font-mono text-[#6B7C88]">Case ID: {caseId}</p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <Button asChild className="border border-[#D8E3E8] bg-white text-[#111827] hover:bg-[#F8FAFB]">
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
      <div className="platform-vitality-page relative -m-4 bg-[#FAFAF7] text-[#111827] lg:-m-6">
        <div className="relative min-h-[calc(100vh+96px)] w-full bg-[#FAFAF7] -mt-24 pt-24 text-[13px]">
          <div className="relative mx-auto max-w-[1280px] px-5 pt-6 pb-10 sm:px-6 lg:px-8">
            {/* Header - Case Information */}
            <div className="mb-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-6">
                <Link to={`/app/${activeSlug}/recoveries`} className="flex h-9 w-9 items-center justify-center border border-[#D8E3E8] bg-white text-[#6B7C88] transition-colors hover:bg-[#F8FAFB]">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="max-w-[680px]">
                  <div className="flex items-center gap-3">
                    <h1 className="font-lora text-[24px] font-normal tracking-tight text-[#182026]">{effectiveCase.case_number || effectiveCase.claim_number || effectiveCase.evidence?.claim_number || effectiveCase.id?.slice(0, 12)}</h1>
                    <Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F7FAFC] text-[12px] font-medium tracking-tight text-[#4D5B66]">
                      {entityTypeLabel}
                    </Badge>
                    {statusFeedUnavailable && (
                      <Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F6FAFE] text-[12px] font-medium tracking-tight text-[#0B74DE]">
                        Live Updates Unavailable
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 max-w-[620px]">
                    <p className="text-[12px] font-medium tracking-tight text-[#66737F]">
                      What this case needs next
                    </p>
                    <p className="mt-1 font-sans text-[12px] leading-5 tracking-tight text-[#26333D]">
                      {approvalGuidance.description}
                    </p>
                    <p className="mt-1.5 font-sans text-[11px] leading-5 tracking-tight text-[#6B7C88]">
                      {approvalGuidance.helper}
                    </p>
                    {approvalGuidance.chips.filter((chip) => !chip.toLowerCase().startsWith('docs linked:')).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {approvalGuidance.chips
                          .filter((chip) => !chip.toLowerCase().startsWith('docs linked:'))
                          .map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center bg-[#F8FAFB] px-2.5 py-1 font-sans text-[10px] font-medium tracking-tight text-[#4D5B66]"
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
                    className="h-8 border-[#D8E3E8] bg-white text-xs font-semibold text-[#4D5B66] transition-colors hover:border-[#B8C9D2] hover:bg-[#F8FAFB] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleBriefPreview}
                    disabled={!canPreviewBrief}
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    {canPreviewBrief ? 'Brief PDF' : 'Brief PDF · Not Available'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-[#D8E3E8] bg-white text-xs font-semibold text-[#4D5B66] transition-colors hover:border-[#B8C9D2] hover:bg-[#F8FAFB]"
                    onClick={handleCasePdfPreview}
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Case PDF Export
                  </Button>
                </div>
              </div>
            </div>

            {error && hasResolvedBackend && (
              <div className="mb-4 rounded-[2px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300">
                {error}
              </div>
            )}

            <div className="mb-5 flex gap-1 border-b border-[#DCE8EE]" role="tablist" aria-label="Case detail views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'RECORD'}
                onClick={() => setActiveTab('RECORD')}
                className={cn(
                  "relative px-4 py-3 text-[13px] font-medium tracking-tight transition-colors sm:px-5",
                  activeTab === 'RECORD' ? "bg-[#F7FAFC] text-[#182026]" : "text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]"
                )}
              >
                What we found
                <span className={cn("absolute inset-x-3 bottom-0 h-[2px] bg-[#0B74DE] transition-transform duration-200", activeTab === 'RECORD' ? "scale-x-100" : "scale-x-0")} />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'PROTOCOL'}
                onClick={() => setActiveTab('PROTOCOL')}
                className={cn(
                  "relative px-4 py-3 text-[13px] font-medium tracking-tight transition-colors sm:px-5",
                  activeTab === 'PROTOCOL' ? "bg-[#F7FAFC] text-[#182026]" : "text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]"
                )}
              >
                Recovery progress
                <span className={cn("absolute inset-x-3 bottom-0 h-[2px] bg-[#0B74DE] transition-transform duration-200", activeTab === 'PROTOCOL' ? "scale-x-100" : "scale-x-0")} />
              </button>
            </div>

            {activeTab === 'RECORD' && (
              <RecoveryTruthRecord
                caseData={effectiveCase}
                tenantSlug={activeSlug}
                truthPresentation={recoveryTruthPresentation}
                requestedLanguage={requestedRecoveryLanguage}
                accountingBoundary={accountingClaimBoundary}
                currency={effectiveCase?.currency || 'USD'}
                requestedAmount={claimRecordRequestedAmount}
                estimatedClaimValue={claimRecordEstimatedClaimValue}
                approvedAmount={claimRecordApprovedAmount}
                recordedPayoutAmount={claimRecordRecordedPayoutAmount}
                verifiedPaidAmount={claimRecordVerifiedPaidAmount}
                outstandingAmount={outstandingAmount}
                varianceAmount={varianceAmount}
                trustedApproval={hasTrustedApprovalTruth(backendTruthCase)}
                trustedPayout={hasTrustedPayoutTruth(backendTruthCase)}
                hasResolvedBackend={hasResolvedBackend}
                hasSafetyBlock={hasSafetyBlock}
                hasUnassessedSafety={hasUnassessedSafety}
                proofStatus={proofStatus}
                payoutProofStatus={payoutProofStatus}
                filingStatus={formatSellerCaseFilingStatus(effectiveCase, proofStatus)}
                filingTruthLine={getCaseFilingTruthLine(effectiveCase, proofStatus)}
                nextStep={nextStep}
                sellerSummary={sellerSummary}
                policyBasis={policyBasis}
                matchedDocuments={displayedMatchedDocs}
                inventory={{
                  totalInput: inventoryTotalInput,
                  totalOutput: inventoryTotalOutput,
                  calculatedStock: inventoryCalculatedStock,
                  warehouseBalance: inventoryWarehouseBalance,
                  discrepancy: inventoryDiscrepancy,
                }}
                findingNarrative={findingNarrative || NOT_AVAILABLE}
                generatedNarrative={!sellerSummary?.summary}
                financialTruthLimitation={financialTruthLimitation}
                accountingTruth={accountingTruth}
                closureTruth={closureTruth}
                onOpenDocument={(documentId) => window.open(`/app/${activeSlug}/documents/${encodeURIComponent(documentId)}`, '_blank')}
              />
            )}

            {activeTab === 'PROTOCOL' && (
              <div className="space-y-4">
                <RecoveryProgressControl
                  truthPresentation={recoveryTruthPresentation}
                  lifecycleSteps={lifecycleSteps}
                  nextStep={nextStep}
                  missingRequirements={missingRequirements}
                  proofStatus={proofStatus}
                  financialPayoutStatus={financialPayoutStatus}
                  financialReversalState={financialReversalState}
                  accountingStatus={accountingTruth?.status}
                  accountingLimitation={accountingTruth?.limitation}
                  closureState={closureTruth?.state}
                  closureReason={closureTruth?.reason}
                  hasTrustedFiling={hasTrustedFilingTruth(backendTruthCase)}
                  hasTrustedApproval={hasTrustedApprovalTruth(backendTruthCase)}
                  hasTrustedPayout={hasTrustedPayoutTruth(backendTruthCase)}
                  hasSafetyBlock={hasSafetyBlock}
                  hasUnassessedSafety={hasUnassessedSafety}
                  truthUnavailable={effectiveCase?.truth_unavailable === true}
                  statusFeedUnavailable={statusFeedUnavailable}
                />

                {requestedAmount !== null ? (
                  <section className="rounded-[10px] border border-[#DCE8EE] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:px-5">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Original requested recovery</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#66737F]">This is the amount originally requested. It is not, by itself, a verified payment or final financial outcome.</p>
                      </div>
                      <p className="shrink-0 text-[16px] font-semibold tracking-tight text-[#182026]">{formatCurrencyOrDash(requestedAmount, effectiveCase?.currency || 'USD')}</p>
                    </div>
                  </section>
                ) : null}

                {['rejected', 'denied'].includes((effectiveCase.status || '').toLowerCase()) && rejectionPlaybookReason ? (
                  <section className="rounded-[10px] border border-red-200 bg-red-50 p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-tight text-red-700">Amazon outcome requires attention</p>
                    <h3 className="mt-1 font-lora text-[18px] font-normal tracking-tight text-red-950">{effectiveCase.rejection_reason || 'Amazon did not support the current recovery request.'}</h3>
                    <p className="mt-2 max-w-3xl text-[12px] leading-5 text-red-900">Margin will only continue with a filing action where the existing case truth supports a safe canonical path.</p>
                    <div className="mt-3">
                      {canOpenCanonicalFiling ? (
                        <Button type="button" variant="outline" className="border-red-300 bg-white text-red-900 hover:bg-red-100" onClick={() => openCanonicalFilingScreen('resubmit')}>Review filing action</Button>
                      ) : (
                        <p className="text-[11px] leading-5 text-red-800">No filing action is available from this record yet. The current proof and eligibility state must support it first.</p>
                      )}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
                  <div className="mb-4 border-b border-[#E7EEF2] pb-3">
                    <p className="text-[11px] font-medium tracking-tight text-[#66737F]">What happened</p>
                    <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">Operational history</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#66737F]">These are recorded operational events. They support the history of this recovery but do not, by themselves, establish financial closure.</p>
                  </div>
                  <Timeline claimId={effectiveCase.id} tenantSlug={activeSlug} liveUpdatesUnavailable={statusFeedUnavailable} />
                </section>

                <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
                  <div className="mb-4 border-b border-[#E7EEF2] pb-3">
                    <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Amazon record</p>
                    <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">What Amazon said and what Margin sent</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Inspect Amazon’s case state, messages, attachments, and any eligible evidence-backed reply from this recovery record.</p>
                  </div>
                    <div className="space-y-4">
                      {isAmazonThreadBackfillCase ? (
                        <div className="border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
                          <div className="text-[10px] font-semibold uppercase tracking-tight text-blue-700">Amazon Thread Backfill</div>
                          <div className="mt-1 font-semibold text-blue-950">
                            Margin linked an existing Amazon support thread to this case. Margin did not create the original filing.
                          </div>
                          <div className="mt-2 text-[11px] leading-relaxed text-blue-800">
                            Unknown filing details remain Not Available until real seller-side proof exists.
                            {threadBackfilledAt ? ` Backfilled ${formatEventTimestamp(threadBackfilledAt)}.` : ''}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-sm font-semibold tracking-tight text-[#07111A]">Amazon Thread</h4>
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tight border", getThreadStateTone(backendTruthCase?.case_state))}>
                          {formatThreadStateLabel(backendTruthCase?.case_state)}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-5 text-[#6B7C88]">Thread states describe Amazon communication records. They do not, by themselves, establish verified payment or financial closure.</p>

                      {!amazonThreadLinked ? (
                        <div className="border border-dashed border-[#D8E3E8] bg-[#F8FAFB] px-4 py-5 text-sm text-[#6B7C88]">
                          Amazon thread not yet linked
                        </div>
                      ) : caseThreadMessages.length === 0 ? (
                        <div className="border border-[#D8E3E8] bg-[#F8FAFB] px-4 py-5 text-sm text-[#6B7C88]">
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
                                  "border px-4 py-4 space-y-3",
                                  message.direction === 'inbound'
                                    ? 'border-blue-500/20 bg-blue-500/[0.05]'
                                    : 'border-emerald-500/20 bg-emerald-500/[0.05]'
                                )}
                              >
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-tight">
                                  <Badge variant="outline" className={cn("border text-[10px] uppercase tracking-tight", message.direction === 'inbound' ? 'border-blue-500/20 text-blue-300 bg-blue-500/10' : 'border-emerald-500/20 text-emerald-300 bg-emerald-500/10')}>
                                    {message.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                                  </Badge>
                                  <span className="text-[#6B7C88]">{formatEventTimestamp(eventAt)}</span>
                                  {message.state_signal ? (
                                    <Badge variant="outline" className={cn("border text-[10px] uppercase tracking-tight", getThreadStateTone(message.state_signal))}>
                                      {formatThreadStateLabel(message.state_signal)}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold tracking-tight text-[#07111A]">{message.subject || NOT_AVAILABLE}</div>
                                  <div className="text-[11px] text-[#6B7C88]">
                                    {message.direction === 'inbound'
                                      ? `From ${message.sender || NOT_AVAILABLE}`
                                      : `To ${(Array.isArray(message.recipients) && message.recipients.length ? message.recipients.join(', ') : NOT_AVAILABLE)}`}
                                  </div>
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#4D5B66]">
                                  {message.body_text || NOT_AVAILABLE}
                                </div>
                                {attachmentRows.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Attachments</div>
                                    <div className="flex flex-wrap gap-2">
                                      {attachmentRows.map((attachment: any, attachmentIdx: number) => {
                                        const linkedDocumentId = String(attachment?.evidence_document_id || '').trim();
                                        const label = documentReferenceLabel(attachment, linkedDocumentId || `Attachment ${attachmentIdx + 1}`);
                                        return linkedDocumentId && activeSlug ? (
                                          <Button
                                            key={`${message.id}-attachment-${attachmentIdx}`}
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 border border-[#D8E3E8] bg-white px-2 text-[10px] font-semibold text-[#4D5B66] hover:bg-[#F8FAFB]"
                                            onClick={() => window.open(`/app/${activeSlug}/documents/${encodeURIComponent(linkedDocumentId)}`, '_blank')}
                                          >
                                            {label}
                                          </Button>
                                        ) : (
                                          <span
                                            key={`${message.id}-attachment-${attachmentIdx}`}
                                            className="inline-flex h-7 items-center border border-[#D8E3E8] bg-white px-2 text-[10px] font-semibold text-[#6B7C88]"
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
                        <div className="space-y-4 border border-[#D8E3E8] bg-[#F8FAFB] p-4">
                          <div>
                            <div className="text-xs font-semibold text-[#07111A]">Reply to Amazon</div>
                            <div className="mt-1 text-[11px] text-[#6B7C88]">
                              {canReplyToAmazonThread
                                ? 'Continue the linked Amazon support thread from inside Margin.'
                                : replyDisabledReason}
                            </div>
                          </div>

                          {canReplyToAmazonThread ? (
                            <>
                              <Textarea
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder="Write the evidence-backed reply you want Amazon to receive."
                                disabled={sendingReply}
                                className="min-h-[140px] border-[#D8E3E8] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                              />

                              {replyEligibleDocuments.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">
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
                                          className="flex items-center gap-3 border border-[#D8E3E8] bg-white px-3 py-2 text-sm text-[#4D5B66]"
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => toggleReplyAttachment(documentId, checked === true)}
                                            disabled={sendingReply}
                                          />
                                          <span className="font-sans font-bold">{documentReferenceLabel(doc, documentId)}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}

                              <div className="flex items-center justify-between gap-4">
                                <div className="text-[11px] text-[#6B7C88]">
                                  Thread linkage is confirmed. This reply will stay on the stored Amazon conversation.
                                </div>
                                <Button
                                  type="button"
                                  onClick={handleSendCaseReply}
                                  disabled={sendingReply || !replyBody.trim()}
                                  className="border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                >
                                  {sendingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Send Reply
                                </Button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                </section>

                <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
                  <div className="mb-4 border-b border-[#E7EEF2] pb-3">
                    <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Supporting evidence</p>
                    <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">Documents and evidence history</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Each item is supporting context for the case record. A document or event is not automatically proof of filing, payment, or closure.</p>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7C88]">
                        Matched Documents ({displayedMatchedDocs.length === 0 ? (matchedCount === null ? NOT_AVAILABLE : matchedCount) : displayedMatchedDocs.length})
                        <div className="h-px flex-1 bg-[#D8E3E8]" />
                      </div>

                      {displayedMatchedDocs.length > 0 ? (
                        <div className="space-y-3">
                          {displayedMatchedDocs.map((doc: any, idx: number) => {
                            const confidencePct = typeof doc.matchConfidence === 'number'
                              ? Math.round(doc.matchConfidence * 100)
                              : (typeof doc.confidence_score === 'number'
                                ? Math.round((doc.confidence_score > 1 ? doc.confidence_score : doc.confidence_score * 100))
                                : null);
                            const evidenceTitle = getDocumentEvidenceTitle(doc, idx);
                            const evidenceSubtitle = String(getDocumentEvidenceSubtitle(doc) || doc.evidence || '');
                            const filename = String(doc.name || doc.filename || doc.original_filename || '') || null;
                            const displayAmount = String(doc.displayAmount || '');
                            const documentIsPdf = isPdfArtifact(doc);
                            return (
                              <div key={doc.id || idx} className="group rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3.5 transition-colors hover:bg-white">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E7EEF2] bg-white">
                                      {documentIsPdf ? <img src="/evidence-pdf-mark.png" alt="PDF" className="h-7 w-7 object-contain" /> : <FileText className="h-4 w-4 text-[#66737F]" strokeWidth={1.75} />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-sans text-xs font-semibold text-[#07111A]" title={evidenceTitle}>
                                        {evidenceTitle}
                                      </p>
                                      <p className="mt-1 truncate text-[10px] text-[#6B7C88]" title={evidenceSubtitle || undefined}>
                                        {displayAmount ? `${evidenceSubtitle || doc.matchType || 'Attached evidence'} · ${displayAmount}` : (evidenceSubtitle || doc.matchType || 'Attached evidence')}
                                      </p>
                                      {filename && filename !== evidenceTitle ? (
                                        <p className="mt-1 truncate text-[10px] text-[#8A98A3]" title={filename}>
                                          File: {filename}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3">
                                    <Badge variant="outline" className="h-5 rounded-md border-[#DCE8EE] bg-white px-2 text-[11px] font-medium text-[#4D5B66]">
                                      {confidencePct !== null ? `${confidencePct}%` : '-'}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-1 text-[12px] font-medium tracking-tight text-[#0B74DE] hover:bg-transparent hover:text-[#075EAF]"
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
                                          <div className="w-1 h-1 bg-emerald-500/40 rounded-[2px]" />
                                          <span className="text-[#6B7C88] font-bold uppercase tracking-tight">{snippet.label}</span>
                                        </div>
                                        <span className="text-[#26333D] font-sans font-bold truncate max-w-[280px] italic bg-[#F8FAFB] px-1.5 rounded">"{snippet.text}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border border-dashed border-[#D8E3E8] bg-[#F8FAFB] py-12 text-center">
                          <Database className="mb-4 h-8 w-8 text-[#B8C9D2]" />
                          <p className="text-[10px] font-semibold tracking-tight text-[#6B7C88]">No documents matched yet</p>
                        </div>
                      )}
                    </div>

                    {/* EVIDENCE LOG */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7C88]">
                        Evidence Log
                        <div className="h-px flex-1 bg-[#D8E3E8]" />
                      </div>
                      <div className="text-[10px] font-medium text-[#6B7C88]">
                        Reconstructed evidence-related history from notifications and recorded recovery events.
                      </div>

                      <div className="overflow-hidden border border-[#D8E3E8] bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#D8E3E8] bg-[#F8FAFB]">
                              <th className="px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Timestamp</th>
                              <th className="px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Event Type</th>
                              <th className="px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Reference</th>
                              <th className="px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-tight text-[#6B7C88]">Event Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E4EDF1]">
                            {eventsLoading && evidenceEvents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-[10px] font-sans font-bold text-[#8A98A3]">
                                  Loading evidence history...
                                </td>
                              </tr>
                            )}
                            {evidenceEvents.map((event: any, idx: number) => {
                              const statusLabel = toStatusLabel(event.status || event.eventType || event.type);
                              const eventSourceLabel = toEventSourceLabel(event.source);

                              return (
                                <tr key={event.id || idx} className="hover:bg-[#F8FAFB] transition-colors group">
                                  <td className="px-4 py-3 text-[10px] font-sans font-bold text-[#4D5B66]">
                                    {formatEventTimestamp(event.at)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-[2px] bg-blue-500/50" />
                                      <span className="text-[10px] font-bold text-[#26333D] font-sans uppercase tracking-tight">
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-sans">
                                    <div className="text-[10px] font-bold text-[#6B7C88]">
                                      {event.claimId || event.id || NOT_AVAILABLE}
                                    </div>
                                    {event.message ? (
                                      <div className="mt-1 max-w-[520px] text-[11px] font-medium normal-case leading-relaxed text-[#4D5B66]">
                                        {event.message}
                                      </div>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-[9px] h-4.5 px-2 border-[#D8E3E8] font-sans font-bold uppercase tracking-tight bg-[#F8FAFB] text-[#6B7C88]">
                                      {eventSourceLabel}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                            {!eventsLoading && evidenceEvents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-10 text-center text-[10px] font-sans font-bold text-[#8A98A3]">
                                  No evidence history recorded for this case yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
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
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-[#6B7C88]">{pdfPreviewLabel}</div>
              {isReviewPdfPreview && (
                <p className="max-w-2xl text-[11px] font-sans font-medium leading-snug tracking-tight text-[#4D5B66]">
                  For seller review only. This preview lets you review the case materials; Margin does not submit this browser-generated PDF to Amazon.
                </p>
              )}
              <div className={cn(
                "truncate font-sans font-light tracking-tight text-[#07111A]",
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
                className="h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[#4D5B66] shadow-[0_1px_2px_rgba(24,32,38,0.03)] hover:bg-[#F7FAFC]"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closePdfPreview}
                className="h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[#4D5B66] shadow-[0_1px_2px_rgba(24,32,38,0.03)] hover:bg-[#F7FAFC]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex h-full items-center justify-center px-3 pb-4 pt-20 md:px-6 md:pb-6 md:pt-24">
              {pdfPreviewLoading ? (
                <div className="flex h-full w-full items-center justify-center gap-3 text-sm font-sans text-[#4D5B66]">
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
                <div className="flex h-full w-full items-center justify-center px-8 text-center text-sm font-sans text-[#8A98A3]">
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
