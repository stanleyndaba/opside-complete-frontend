type ProofSnapshotLike = {
  filingRecommendation?: string | null;
  missingRequirements?: unknown;
  riskFlags?: unknown;
};

type DisputeProofLike = {
  proof_status?: string | null;
  missing_requirements?: unknown;
  manual_review_reason?: string | null;
  payout_proof_status?: string | null;
  quarantine_reason?: string | null;
  block_reasons?: unknown;
  last_error?: string | null;
  actual_payout_amount?: number | null;
  recovered_amount?: number | null;
  approved_amount?: number | null;
  status?: string | null;
  recovery_status?: string | null;
  evidence_attachments?: {
    decision_intelligence?: {
      proof_snapshot?: ProofSnapshotLike | null;
    } | null;
  } | null;
};

const DISPUTE_REASON_LABELS: Record<string, string> = {
  rejected_by_amazon: 'Rejected before',
  rejected_without_reason: 'Rejected before',
  missing_evidence_links: 'Missing evidence',
  missing_required_doc_family: 'Missing required document family',
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
  low_success_probability: 'Low historical success probability',
  user_auto_file_disabled: 'Seller auto-file disabled',
  user_disabled_auto_file: 'Seller auto-file disabled',
  queue_unavailable: 'Queue unavailable',
  missing_required_identifiers: 'Missing required identifiers',
  missing_trustworthy_product_identifier: 'Needs verified product identifier',
  missing_trustworthy_order_identifier: 'Needs verified order identifier',
  missing_trustworthy_shipment_identifier: 'Needs verified shipment identifier',
  awaiting_verified_identifiers: 'Awaiting seller-verified identifiers',
  missing_quantity_value: 'Missing quantity',
  invalid_quantity_value: 'Invalid quantity',
  contradictory_order_identifiers: 'Conflicting order identifiers',
  contradictory_shipment_identifiers: 'Conflicting shipment identifiers',
  contradictory_product_identifiers: 'Conflicting product identifiers',
  contradictory_quantity_values: 'Conflicting quantities',
  duplicate_exact_amazon_case_id: 'Existing case already linked',
  duplicate_claim_signature: 'Duplicate detected - not filed',
  existing_submission_already_recorded: 'Existing submission already recorded',
  existing_amazon_thread_active: 'Amazon thread already active',
  thread_continuation_detected: 'Amazon thread detected',
  submission_explanation_too_short: 'Explanation too short',
  submission_explanation_repetitive: 'Repeated template language',
  outside_claim_window: 'Outside claim window',
};

function normalizeToken(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function humanize(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const normalized = String(value).replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Not available';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

export function formatDisputeReason(value: string | null | undefined): string {
  const normalized = normalizeToken(value);
  return DISPUTE_REASON_LABELS[normalized] || humanize(value);
}

export function formatRequirement(value: string | null | undefined): string {
  return humanize(value);
}

export function formatRequirementList(values: unknown, limit = 3): string {
  const items = normalizeStringArray(values).map(formatRequirement);
  if (!items.length) return 'None recorded';
  if (items.length <= limit) return items.join(', ');
  return `${items.slice(0, limit).join(', ')} +${items.length - limit} more`;
}

export function getProofSnapshot(record: DisputeProofLike | null | undefined): ProofSnapshotLike | null {
  if (!record || typeof record !== 'object') return null;
  return record.evidence_attachments?.decision_intelligence?.proof_snapshot || null;
}

export function getProofStatus(record: DisputeProofLike | null | undefined): string | null {
  const explicit = normalizeToken(record?.proof_status);
  if (explicit) return explicit;
  const snapshotStatus = normalizeToken(getProofSnapshot(record)?.filingRecommendation);
  return snapshotStatus || null;
}

export function getMissingRequirements(record: DisputeProofLike | null | undefined): string[] {
  const direct = normalizeStringArray(record?.missing_requirements);
  if (direct.length) return direct;
  return normalizeStringArray(getProofSnapshot(record)?.missingRequirements);
}

export function getManualReviewReason(record: DisputeProofLike | null | undefined): string | null {
  if (record?.manual_review_reason) return record.manual_review_reason;
  const blockReason = normalizeStringArray(record?.block_reasons)[0];
  if (blockReason) return blockReason;
  const riskFlag = normalizeStringArray(getProofSnapshot(record)?.riskFlags)[0];
  return riskFlag || null;
}

export function getPayoutProofStatus(record: DisputeProofLike | null | undefined): string | null {
  const explicit = normalizeToken(record?.payout_proof_status);
  const actualPayout = Number(record?.actual_payout_amount);
  const recoveredAmount = Number(record?.recovered_amount);
  const hasPositivePayout =
    (Number.isFinite(actualPayout) && actualPayout > 0) ||
    (Number.isFinite(recoveredAmount) && recoveredAmount > 0);

  if (explicit && explicit !== 'verified') return explicit;
  if (explicit === 'verified' && !hasPositivePayout) return null;

  if (hasPositivePayout) {
    return 'verified';
  }
  if (normalizeToken(record?.recovery_status) === 'quarantined') return 'quarantined';
  if (record?.approved_amount != null || ['approved', 'resolved', 'won'].includes(normalizeToken(record?.status))) {
    return 'awaiting_payout';
  }
  return null;
}

export function getQuarantineReason(record: DisputeProofLike | null | undefined): string | null {
  return record?.quarantine_reason || record?.last_error || null;
}

export function formatProofStatus(value: string | null | undefined): string {
  const normalized = normalizeToken(value);
  const labels: Record<string, string> = {
    filing_ready: 'Filing ready',
    manual_review: 'Manual review',
    ineligible: 'Ineligible',
    supportable_but_not_case_eligible: 'Supportable - case not created yet',
  };
  return labels[normalized] || humanize(value);
}

export function proofStatusTone(value: string | null | undefined): string {
  switch (normalizeToken(value)) {
    case 'filing_ready':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    case 'manual_review':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    case 'supportable_but_not_case_eligible':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    case 'ineligible':
      return 'border-red-500/20 bg-red-500/10 text-red-300';
    default:
      return 'border-white/10 bg-white/5 text-white/50';
  }
}

export function formatPayoutProofStatus(value: string | null | undefined): string {
  const normalized = normalizeToken(value);
  const labels: Record<string, string> = {
    verified: 'Verified',
    awaiting_payout: 'Awaiting payout',
    quarantined: 'Quarantined',
    not_applicable: 'Not applicable',
  };
  return labels[normalized] || humanize(value);
}

export function payoutProofTone(value: string | null | undefined): string {
  switch (normalizeToken(value)) {
    case 'verified':
      return 'border-white/15 bg-white/10 text-white/80';
    case 'awaiting_payout':
      return 'border-blue-500/20 bg-blue-500/10 text-blue-300';
    case 'quarantined':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    default:
      return 'border-white/10 bg-white/5 text-white/50';
  }
}

export function formatEligibilityStatus(value: string | null | undefined): string {
  const normalized = normalizeToken(value);
  const labels: Record<string, string> = {
    ready: 'Ready',
    duplicate_blocked: 'Duplicate detected - not filed',
    insufficient_data: 'Awaiting verified identifiers',
    thread_only: 'Amazon thread detected',
    safety_hold: 'Safety hold',
  };
  return labels[normalized] || humanize(value);
}
