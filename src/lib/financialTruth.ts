export type FinancialTruthSummary = {
  input_id: string;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  requested_amount: number | null;
  approved_amount: number | null;
  verified_paid_amount: number;
  outstanding_amount: number | null;
  variance_amount: number | null;
  payout_status: 'not_paid' | 'partially_paid' | 'paid';
  financial_event_count: number;
  reimbursement_event_count: number;
  settlement_event_count: number;
  latest_event_date: string | null;
  proof_of_payment: {
    amount: number;
    currency: string;
    event_date: string | null;
    reference_id: string | null;
    settlement_id: string | null;
    payout_batch_id: string | null;
    source: string | null;
  } | null;
  source_types: string[];
};

export type FinancialTruthEvent = {
  event_id: string;
  event_type: string | null;
  event_subtype: string | null;
  amount: number;
  currency: string;
  event_date: string | null;
  reference_id: string | null;
  settlement_id: string | null;
  payout_batch_id: string | null;
  amazon_event_id: string | null;
  amazon_order_id: string | null;
  sku: string | null;
  asin: string | null;
  source: string | null;
  raw_payload: Record<string, any> | null;
  linked_detection_result_id: string | null;
  linked_dispute_case_id: string | null;
};

export function financialStatusLabel(status: FinancialTruthSummary['payout_status'] | null | undefined) {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'partially_paid':
      return 'Partial';
    case 'not_paid':
    default:
      return 'Not Verified';
  }
}

export function financialStatusDetail(summary?: FinancialTruthSummary | null) {
  if (!summary || summary.financial_event_count === 0 || summary.verified_paid_amount <= 0) {
    return 'No payout recorded yet';
  }
  if (summary.payout_status === 'partially_paid') {
    return 'Partial payment confirmed';
  }
  return 'Payment confirmed from financial events';
}

export function financialStatusTone(status: FinancialTruthSummary['payout_status'] | null | undefined) {
  switch (status) {
    case 'paid':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    case 'partially_paid':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    case 'not_paid':
    default:
      return 'border-white/10 bg-white/[0.04] text-white/60';
  }
}

export function labelFinancialEventType(eventType: string | null | undefined, eventSubtype?: string | null | undefined) {
  const base = String(eventType || 'unknown').replace(/[_-]+/g, ' ').trim();
  const subtype = String(eventSubtype || '').replace(/[_-]+/g, ' ').trim();
  const normalizedBase = base ? base.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Unknown';
  if (!subtype) return normalizedBase;
  return `${normalizedBase} · ${subtype.replace(/\b\w/g, (char) => char.toUpperCase())}`;
}

export function financialSourceLabel(source: string | null | undefined) {
  const normalized = String(source || '').trim().toLowerCase();
  if (normalized === 'sp_api') return 'SP-API';
  if (normalized === 'csv_upload') return 'CSV Upload';
  return normalized ? normalized.replace(/[_-]+/g, ' ') : 'Unknown';
}
