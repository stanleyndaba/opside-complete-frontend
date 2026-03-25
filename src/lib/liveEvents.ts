export interface CanonicalLiveEvent {
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  tenant_id?: string;
  tenant_slug?: string;
  user_id?: string;
  timestamp: string;
  payload: Record<string, any>;
}

export interface StatusStreamEvent {
  type: string;
  status: string;
  data: Record<string, any>;
  timestamp: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
}

const STATUS_OVERRIDES: Record<string, { type: string; status: string }> = {
  'detection.created': { type: 'detection', status: 'created' },
  'detection.completed': { type: 'detection', status: 'completed' },
  'case.created': { type: 'case', status: 'created' },
  'case.status_updated': { type: 'case', status: 'updated' },
  'evidence.linked': { type: 'evidence', status: 'linked' },
  'filing.submitted': { type: 'filing', status: 'submitted' },
  'payout.detected': { type: 'payout', status: 'detected' },
  'recovery.work_created': { type: 'recovery', status: 'work_created' },
  'recovery.quarantined': { type: 'recovery', status: 'quarantined' },
  'recovery.failed': { type: 'recovery', status: 'failed' },
  'billing.work_created': { type: 'billing', status: 'work_created' },
  'billing.processed': { type: 'billing', status: 'processed' },
  'billing.failed': { type: 'billing', status: 'failed' },
  'evidence_ingestion_started': { type: 'evidence', status: 'started' },
  'evidence_ingestion_completed': { type: 'evidence', status: 'completed' },
  'evidence_ingestion_failed': { type: 'evidence', status: 'failed' },
  'parsing_started': { type: 'evidence', status: 'parsing_started' },
  'parsing_completed': { type: 'evidence', status: 'parsing_completed' },
  'matching_completed': { type: 'evidence', status: 'matching_completed' },
  'evidence_matching_completed': { type: 'evidence', status: 'matching_completed' },
  'payment_approved': { type: 'refund', status: 'approved' },
  'payment_reconciled': { type: 'recovery', status: 'reconciled' },
  'recovery_detected': { type: 'recovery', status: 'detected' }
};

function pickFirstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizePayload(rawPayload: any): Record<string, any> {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return { value: rawPayload };
  }

  if (rawPayload.payload && typeof rawPayload.payload === 'object') {
    return { ...rawPayload.payload };
  }

  if (rawPayload.data && typeof rawPayload.data === 'object') {
    return {
      ...rawPayload.data,
      timestamp: rawPayload.timestamp || rawPayload.data.timestamp
    };
  }

  return { ...rawPayload };
}

function inferEntityType(payload: Record<string, any>): string {
  if (payload.recovery_id || payload.recoveryId) return 'recovery';
  if (payload.dispute_case_id || payload.disputeId || payload.caseId || payload.case_id) return 'dispute_case';
  if (payload.document_id || payload.documentId) return 'evidence_document';
  if (payload.detection_id || payload.detectionId || payload.claimId || payload.claim_id) return 'detection_result';
  if (payload.sync_id || payload.syncId) return 'sync_job';
  return 'unknown';
}

function inferEntityId(payload: Record<string, any>): string | undefined {
  return pickFirstString(
    payload.entity_id,
    payload.dispute_case_id,
    payload.disputeId,
    payload.caseId,
    payload.case_id,
    payload.recovery_id,
    payload.recoveryId,
    payload.document_id,
    payload.documentId,
    payload.detection_id,
    payload.detectionId,
    payload.claim_id,
    payload.claimId,
    payload.sync_id,
    payload.syncId,
    payload.id
  );
}

export function normalizeIncomingLiveEvent(rawType: string, rawPayload: any): CanonicalLiveEvent {
  const payload = normalizePayload(rawPayload);
  const eventType = String(
    rawType === 'message'
      ? rawPayload?.event_type || rawPayload?.type || payload.event_type || payload.type || 'message'
      : rawType
  );
  const timestamp = pickFirstString(
    rawPayload?.timestamp,
    payload.timestamp,
    rawPayload?.created_at,
    payload.created_at
  ) || new Date().toISOString();

  const tenantId = pickFirstString(rawPayload?.tenant_id, payload.tenant_id, payload.tenantId);
  const tenantSlug = pickFirstString(rawPayload?.tenant_slug, payload.tenant_slug, payload.tenantSlug, payload.slug);
  const userId = pickFirstString(rawPayload?.user_id, payload.user_id, payload.userId, payload.seller_id, payload.sellerId);
  const entityType = pickFirstString(rawPayload?.entity_type, payload.entity_type) || inferEntityType(payload);
  const entityId = pickFirstString(rawPayload?.entity_id, payload.entity_id) || inferEntityId(payload);

  return {
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    tenant_id: tenantId,
    tenant_slug: tenantSlug,
    user_id: userId,
    timestamp,
    payload: {
      ...payload,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      tenant_id: tenantId,
      tenant_slug: tenantSlug,
      user_id: userId,
      timestamp
    }
  };
}

export function toStatusStreamEvent(event: CanonicalLiveEvent): StatusStreamEvent {
  const override = STATUS_OVERRIDES[event.event_type];
  const split = event.event_type.split(/[.:]/);
  const type = override?.type || split[0] || event.payload.type || 'status_updated';
  const status =
    override?.status ||
    pickFirstString(event.payload.status, split[1]) ||
    'progress';

  return {
    type,
    status,
    data: event.payload,
    timestamp: event.timestamp,
    eventType: event.event_type,
    entityType: event.entity_type,
    entityId: event.entity_id
  };
}

export function getLiveEventAliases(event: CanonicalLiveEvent): string[] {
  const aliases: string[] = [];

  switch (event.event_type) {
    case 'detection.created':
      aliases.push('detection.anomaly_detected');
      break;
    case 'case.created':
      aliases.push('detection.claim_created');
      break;
    case 'filing.submitted':
      aliases.push('detection.claim_filed');
      break;
    case 'payout.detected':
      aliases.push('detection.payout_received');
      break;
    default:
      break;
  }

  if (event.event_type === 'case.status_updated') {
    const status = String(event.payload.status || '').toLowerCase();
    if (status === 'approved') aliases.push('detection.claim_approved');
    if (status === 'rejected' || status === 'failed') aliases.push('detection.claim_rejected');
  }

  return aliases;
}

export function getLiveEventDedupeKey(event: CanonicalLiveEvent): string {
  return [
    event.event_type,
    event.entity_id || event.payload.sync_id || event.payload.id || 'none',
    event.timestamp
  ].join(':');
}
