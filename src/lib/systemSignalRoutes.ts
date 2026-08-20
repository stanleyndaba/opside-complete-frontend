export type SystemSignalAction =
  | 'none'
  | 'review_audit'
  | 'review_recovery'
  | 'review_evidence'
  | 'certify_evidence'
  | 'approve_filing'
  | 'review_case'
  | 'review_deadline'
  | 'review_reconciliation'
  | 'reconnect_amazon';

export interface SystemSignalRouteDescriptor {
  target: 'notifications' | 'audit' | 'recovery' | 'evidence' | 'case' | 'deadline' | 'reconciliation' | 'integration';
  objectType: string;
  objectId: string;
  action: SystemSignalAction;
  fallbackTarget: 'notifications';
}

export interface SystemSignalMeta {
  id: string;
  eventType: string;
  severity: 'critical' | 'action_required' | 'informational';
  sensitivity: 'operational_private' | 'financial_sensitive' | 'security_sensitive';
  signalState: 'open' | 'resolved' | 'expired' | 'superseded' | 'cancelled';
  sellerState: 'unseen' | 'seen' | 'read' | 'acknowledged';
  actionState: 'none' | 'pending' | 'completed' | 'no_longer_needed' | 'expired';
  actionType: SystemSignalAction;
  actionRoute: SystemSignalRouteDescriptor | null;
}

const actionSet = new Set<SystemSignalAction>([
  'none',
  'review_audit',
  'review_recovery',
  'review_evidence',
  'certify_evidence',
  'approve_filing',
  'review_case',
  'review_deadline',
  'review_reconciliation',
  'reconnect_amazon'
]);

const targetSet = new Set<SystemSignalRouteDescriptor['target']>([
  'notifications', 'audit', 'recovery', 'evidence', 'case', 'deadline', 'reconciliation', 'integration'
]);

const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function signalPayload(notification: any): Record<string, any> {
  const payload = notification?.payload;
  if (!payload || typeof payload !== 'object') return {};
  const direct = payload.system_signal;
  return direct && typeof direct === 'object' ? direct : {};
}

function normalizeSeverity(value: unknown): SystemSignalMeta['severity'] {
  return value === 'critical' || value === 'action_required' || value === 'informational'
    ? value
    : 'informational';
}

function normalizeSensitivity(value: unknown): SystemSignalMeta['sensitivity'] {
  return value === 'financial_sensitive' || value === 'security_sensitive' || value === 'operational_private'
    ? value
    : 'operational_private';
}

function normalizeSignalState(value: unknown): SystemSignalMeta['signalState'] {
  return value === 'resolved' || value === 'expired' || value === 'superseded' || value === 'cancelled' || value === 'open'
    ? value
    : 'open';
}

function normalizeSellerState(value: unknown): SystemSignalMeta['sellerState'] {
  return value === 'seen' || value === 'read' || value === 'acknowledged' || value === 'unseen'
    ? value
    : 'unseen';
}

function normalizeActionState(value: unknown): SystemSignalMeta['actionState'] {
  return value === 'pending' || value === 'completed' || value === 'no_longer_needed' || value === 'expired' || value === 'none'
    ? value
    : 'none';
}

function readValidatedActionRoute(value: unknown): SystemSignalRouteDescriptor | null {
  if (!value || typeof value !== 'object') return null;
  const route = value as Record<string, unknown>;
  if (!isString(route.target) || !targetSet.has(route.target as SystemSignalRouteDescriptor['target'])) return null;
  if (!isString(route.objectType) || !isString(route.objectId)) return null;
  if (!isString(route.action) || !actionSet.has(route.action as SystemSignalAction)) return null;
  if (route.fallbackTarget !== 'notifications') return null;

  return {
    target: route.target as SystemSignalRouteDescriptor['target'],
    objectType: route.objectType,
    objectId: route.objectId,
    action: route.action as SystemSignalAction,
    fallbackTarget: 'notifications'
  };
}

export function getSystemSignalMeta(notification: any): SystemSignalMeta | null {
  const payload = signalPayload(notification);
  const id = notification?.system_signal_id || payload.signal_id;
  const eventType = notification?.signal_event_type || payload.event_type;
  if (!isString(id) || !isString(eventType)) return null;

  const actionTypeValue = notification?.signal_action_type || payload.action_type || 'none';
  const actionType = actionSet.has(actionTypeValue as SystemSignalAction)
    ? actionTypeValue as SystemSignalAction
    : 'none';

  return {
    id,
    eventType,
    severity: normalizeSeverity(notification?.signal_severity || payload.severity),
    sensitivity: normalizeSensitivity(notification?.signal_sensitivity || payload.sensitivity),
    signalState: normalizeSignalState(notification?.signal_state || payload.signal_state),
    sellerState: normalizeSellerState(notification?.seller_state || payload.seller_state),
    actionState: normalizeActionState(notification?.action_state || payload.action_state),
    actionType,
    actionRoute: readValidatedActionRoute(notification?.signal_action_route || payload.action_route)
  };
}

export function resolveSystemSignalHref(notification: any, tenantSlug: string): string {
  const safeSlug = encodeURIComponent(String(tenantSlug || '').trim());
  const fallback = `/app/${safeSlug}/notifications`;
  if (!safeSlug) return '/notifications';

  const meta = getSystemSignalMeta(notification);
  if (!meta || meta.signalState !== 'open' || meta.actionState === 'completed' || !meta.actionRoute) return fallback;
  const route = meta.actionRoute;
  const objectId = encodeURIComponent(route.objectId);

  // Action/data never supplies a raw href. This explicit allow-list preserves
  // workspace scope and makes object routing auditable.
  if (route.target === 'case' && route.objectType === 'dispute_case') {
    return `/app/${safeSlug}/cases/${objectId}`;
  }
  if (route.target === 'audit' && route.objectType === 'audit_run') {
    return `/audit?auditId=${objectId}`;
  }
  if (route.target === 'recovery' && route.objectType === 'detection_result') {
    return `/app/${safeSlug}/resolve/${objectId}`;
  }
  if ((route.target === 'recovery' || route.target === 'reconciliation' || route.target === 'deadline') && route.objectType === 'recovery') {
    return `/app/${safeSlug}/recoveries/${objectId}`;
  }
  if (route.target === 'evidence' && route.objectType === 'evidence_document') {
    return `/app/${safeSlug}/documents/${objectId}`;
  }
  if (route.target === 'integration' && route.action === 'reconnect_amazon' && route.objectType === 'integration_connection' && route.objectId === 'amazon') {
    return `/app/${safeSlug}/integrations/reconnect/amazon`;
  }

  return fallback;
}

export function getSystemSignalActionLabel(notification: any): string | null {
  const meta = getSystemSignalMeta(notification);
  if (!meta || meta.signalState !== 'open' || meta.actionState !== 'pending') return null;

  switch (meta.actionType) {
    case 'approve_filing': return 'Review approval';
    case 'reconnect_amazon': return 'Reconnect Amazon';
    case 'certify_evidence': return 'Review evidence';
    case 'review_evidence': return 'Review case';
    case 'review_reconciliation': return 'Review reconciliation';
    case 'review_deadline': return 'Review deadline';
    case 'review_case': return 'Review case';
    case 'review_recovery': return 'Review recovery';
    case 'review_audit': return 'Review audit';
    default: return null;
  }
}
