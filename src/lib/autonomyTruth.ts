export type ParsingStrategy = 'FULL' | 'PARTIAL' | 'FAILED_DURABLE';
export type IngestionStrategy = 'FULL' | 'DEGRADED' | 'REJECTED';
export type FilingStrategy = 'AUTO' | 'SMART' | 'BLOCKED';
export type ReconciliationStrategy = 'AUTO_MATCH' | 'SMART_MATCH' | 'QUARANTINED';
export type OperationalState = 'READY' | 'DEFERRED_EXPLICIT' | 'RETRY_SCHEDULED' | 'BLOCKED_OPERATIONAL' | 'FAILED_DURABLE';

export type ParsingExplanation = {
  reason?: string;
  completed_steps?: string[];
  failed_steps?: string[];
  preserved_outputs?: string[];
};

export type IngestionExplanation = {
  reason?: string;
  preserved_fields?: string[];
  missing_fields?: string[];
};

export type ExplanationPayload = {
  missing_fields?: string[];
  assumptions?: string[];
  justification?: string;
};

export type MatchExplanation = {
  competing_candidates?: number;
  selected_basis?: string;
  confidence?: number;
};

export type OperationalExplanation = {
  reason?: string;
  retry_at?: string;
  blocking_guard?: string;
  next_action?: string;
};

export type ParsingTruth = {
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  strategy: ParsingStrategy | null;
  explanation: ParsingExplanation | null;
  operationalState: OperationalState | null;
  operationalExplanation: OperationalExplanation | null;
  confidence: number | null;
  error: string | null;
  isTerminal: boolean;
};

export function formatAutonomyLabel(value?: string | null) {
  if (!value) return 'Not available';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getParsingTruth(record: any): ParsingTruth {
  const parsedMetadata = record?.parsed_metadata || {};
  const metadata = record?.metadata || {};
  const nestedParsedData = metadata?.parsed_data || metadata?.parsed_metadata || {};
  const strategy = (record?.parsing_strategy ||
    parsedMetadata?.parsing_strategy ||
    nestedParsedData?.parsing_strategy ||
    null) as ParsingStrategy | null;
  const explanation = (record?.parsing_explanation ||
    parsedMetadata?.parsing_explanation ||
    nestedParsedData?.parsing_explanation ||
    null) as ParsingExplanation | null;
  const operationalState = (record?.operational_state ||
    parsedMetadata?.operational_state ||
    nestedParsedData?.operational_state ||
    null) as OperationalState | null;
  const operationalExplanation = (record?.operational_explanation ||
    parsedMetadata?.operational_explanation ||
    nestedParsedData?.operational_explanation ||
    null) as OperationalExplanation | null;
  const rawStatus = String(record?.parser_status || record?.processing_status || 'pending').toLowerCase();
  const confidence =
    typeof record?.parser_confidence === 'number'
      ? record.parser_confidence
      : typeof parsedMetadata?.confidence_score === 'number'
        ? parsedMetadata.confidence_score
        : typeof nestedParsedData?.confidence_score === 'number'
          ? nestedParsedData.confidence_score
          : null;

  let status: ParsingTruth['status'] = 'pending';
  if (strategy === 'FAILED_DURABLE' || rawStatus === 'failed') {
    status = 'failed';
  } else if (strategy === 'PARTIAL' || rawStatus === 'partial') {
    status = 'partial';
  } else if (strategy === 'FULL' || rawStatus === 'completed') {
    status = 'completed';
  } else if (rawStatus === 'processing') {
    status = 'processing';
  }

  return {
    status,
    strategy,
    explanation,
    operationalState,
    operationalExplanation,
    confidence,
    error: record?.parser_error || explanation?.reason || null,
    isTerminal: status === 'completed' || status === 'partial' || status === 'failed'
  };
}

export function getIngestionTruth(record: any) {
  const metadata = record?.metadata || {};
  return {
    strategy: (record?.ingestion_strategy || metadata?.ingestion_strategy || null) as IngestionStrategy | null,
    explanation: (record?.ingestion_explanation || metadata?.ingestion_explanation || null) as IngestionExplanation | null
  };
}

export function getFilingTruth(record: any) {
  const decisionIntelligence = record?.evidence_attachments?.decision_intelligence || {};
  return {
    strategy: (record?.filing_strategy || decisionIntelligence?.filing_strategy || null) as FilingStrategy | null,
    explanation: (record?.explanation_payload || decisionIntelligence?.explanation_payload || null) as ExplanationPayload | null,
    operationalState: (record?.operational_state || decisionIntelligence?.operational_state || null) as OperationalState | null,
    operationalExplanation: (record?.operational_explanation || decisionIntelligence?.operational_explanation || null) as OperationalExplanation | null
  };
}

export function getReconciliationTruth(record: any) {
  const payload = record?.recovery_work_payload || {};
  return {
    strategy: (record?.reconciliation_strategy || payload?.reconciliation_strategy || null) as ReconciliationStrategy | null,
    explanation: (record?.match_explanation || payload?.match_explanation || null) as MatchExplanation | null,
    operationalState: (record?.recovery_operational_state || payload?.operational_state || null) as OperationalState | null,
    operationalExplanation: (record?.recovery_operational_explanation || payload?.operational_explanation || null) as OperationalExplanation | null
  };
}

export function summarizeExplanationPayload(payload?: ExplanationPayload | null) {
  if (!payload) return null;
  if (payload.justification) return payload.justification;
  if (payload.assumptions?.length) return `Assumptions: ${payload.assumptions.join(', ')}`;
  if (payload.missing_fields?.length) return `Missing: ${payload.missing_fields.join(', ')}`;
  return null;
}

export function summarizeMatchExplanation(explanation?: MatchExplanation | null) {
  if (!explanation) return null;
  const parts: string[] = [];
  if (explanation.selected_basis) parts.push(formatAutonomyLabel(explanation.selected_basis));
  if (typeof explanation.competing_candidates === 'number') parts.push(`${explanation.competing_candidates} candidates`);
  if (typeof explanation.confidence === 'number') parts.push(`${(explanation.confidence * 100).toFixed(0)}% confidence`);
  return parts.length ? parts.join(' · ') : null;
}

export function summarizeOperationalExplanation(explanation?: OperationalExplanation | null) {
  if (!explanation) return null;
  const parts: string[] = [];
  if (explanation.reason) parts.push(explanation.reason);
  if (explanation.next_action) parts.push(`Next: ${formatAutonomyLabel(explanation.next_action)}`);
  if (explanation.retry_at) {
    const retryDate = new Date(explanation.retry_at);
    parts.push(`Retry: ${Number.isNaN(retryDate.getTime()) ? explanation.retry_at : retryDate.toLocaleString()}`);
  }
  return parts.length ? parts.join(' · ') : null;
}
