const APPROVED_CASE_STATUSES = new Set(['approved', 'won']);
const VERIFIED_PAYOUT_STATUSES = new Set(['paid', 'partially_paid']);
const VERIFIED_RECONCILIATION_STATUSES = new Set(['reconciled', 'partial_recovery']);

export type ApprovedReimbursementViewRow = {
  routeId: string;
  caseReference: string;
  amount: number | null;
  amountNote: string;
  payoutTruth: string;
  payoutStatus: string | null;
  reconciliationStatus: string | null;
  lastUpdatedAt: string | null;
  currency: string;
};

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function finiteAmount(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveCount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function hasRealDisputeCase(row: any) {
  return row?.has_real_dispute_case === true
    || normalize(row?.entity_type) === 'dispute_case'
    || normalize(row?.row_type) === 'dispute_case_projection';
}

function isDetectionProjection(row: any) {
  return normalize(row?.entity_type) === 'detection'
    || normalize(row?.row_type) === 'detection_projection';
}

function explicitApprovedAmount(row: any): number | null {
  if (normalize(row?.approved_amount_source) !== 'approved_amount') return null;
  return finiteAmount(row?.approved_amount);
}

function verifiedPaidAmount(row: any): number | null {
  return finiteAmount(row?.verified_paid_amount) ?? finiteAmount(row?.actual_payout_amount);
}

export function isProductionApprovedReimbursementRow(row: any) {
  if (!hasRealDisputeCase(row) || isDetectionProjection(row)) return false;

  const status = normalize(row?.status);
  const payoutStatus = normalize(row?.payout_status);
  const reconciliationStatus = normalize(row?.reconciliation_status);
  const hasApprovalStatus = APPROVED_CASE_STATUSES.has(status);
  const hasVerifiedPayment = positiveCount(row?.reimbursement_event_count) > 0
    || (verifiedPaidAmount(row) ?? 0) > 0
    || VERIFIED_PAYOUT_STATUSES.has(payoutStatus)
    || VERIFIED_RECONCILIATION_STATUSES.has(reconciliationStatus);

  return hasApprovalStatus || hasVerifiedPayment;
}

function payoutTruthLabel(row: any) {
  const status = normalize(row?.status);
  const payoutStatus = normalize(row?.payout_status);
  const reconciliationStatus = normalize(row?.reconciliation_status);
  const hasReimbursementEvents = positiveCount(row?.reimbursement_event_count) > 0;
  const hasVerifiedPaidAmount = (verifiedPaidAmount(row) ?? 0) > 0;

  if (payoutStatus === 'partially_paid' || reconciliationStatus === 'partial_recovery') {
    return 'Partial payout verified';
  }

  if (payoutStatus === 'paid' || reconciliationStatus === 'reconciled' || hasReimbursementEvents || hasVerifiedPaidAmount) {
    return 'Payment verified';
  }

  if (APPROVED_CASE_STATUSES.has(status) && explicitApprovedAmount(row) !== null) {
    return 'Approved, awaiting payout';
  }

  if (APPROVED_CASE_STATUSES.has(status)) {
    return 'Approved, amount unverified';
  }

  return 'Reimbursement verified';
}

function amountForDisplay(row: any) {
  const approved = explicitApprovedAmount(row);
  if (approved !== null) {
    return {
      amount: approved,
      amountNote: 'Approved amount'
    };
  }

  const paid = verifiedPaidAmount(row);
  if (paid !== null && paid > 0) {
    return {
      amount: paid,
      amountNote: 'Verified paid amount'
    };
  }

  if (normalize(row?.approved_amount_source) === 'claim_amount_fallback') {
    return {
      amount: null,
      amountNote: 'Claim amount fallback hidden'
    };
  }

  return {
    amount: null,
    amountNote: 'Amount unavailable'
  };
}

export function toApprovedReimbursementViewRow(row: any): ApprovedReimbursementViewRow | null {
  if (!isProductionApprovedReimbursementRow(row)) return null;

  const amountTruth = amountForDisplay(row);

  return {
    routeId: String(row?.recovery_record_id || row?.dispute_case_id || row?.linked_dispute_case_id || row?.case_number || ''),
    caseReference: String(row?.case_number || row?.provider_case_id || row?.merchant_reference || 'Not Available'),
    amount: amountTruth.amount,
    amountNote: amountTruth.amountNote,
    payoutTruth: payoutTruthLabel(row),
    payoutStatus: typeof row?.payout_status === 'string' ? row.payout_status : null,
    reconciliationStatus: typeof row?.reconciliation_status === 'string' ? row.reconciliation_status : null,
    lastUpdatedAt: typeof row?.last_updated_at === 'string' ? row.last_updated_at : null,
    currency: typeof row?.currency === 'string' && row.currency.trim() ? row.currency : 'USD',
  };
}

export function selectApprovedReimbursementRows(rows: any[]) {
  return rows
    .map(toApprovedReimbursementViewRow)
    .filter((row): row is ApprovedReimbursementViewRow => row !== null);
}
