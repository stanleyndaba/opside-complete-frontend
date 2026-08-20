import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { api } from '@/lib/api';
import { parseDefaultSSEMessage, registerNamedSSEListeners } from '@/lib/sse';
import { createAuthenticatedEventStream, type EventStreamLike } from '@/lib/authenticatedSSE';
import { isSessionRecoveryPending } from '@/lib/sessionRecovery';

export type Phase3NotificationEvent =
  | { type: 'claim_expiring'; data: Phase3ClaimExpiringEvent }
  | { type: 'detection_resolved'; data: Phase3DetectionResolvedEvent }
  | { type: 'detection_status_changed'; data: Phase3DetectionStatusChangedEvent }
  | { type: 'sync_complete'; data: Phase3SyncCompleteEvent }
  | { type: 'sync_failed'; data: Phase3SyncFailedEvent }
  | { type: 'notification'; data: any }
  | { type: 'heartbeat'; data: { timestamp: string } };

export interface Phase3ClaimExpiringEvent {
  claim_id: string;
  anomaly_type: string;
  estimated_value: number;
  days_remaining: number;
  deadline_date: string;
  urgency: 'critical' | 'warning' | 'info';
  message: string;
}

export interface Phase3DetectionResolvedEvent {
  detection_id: string;
  previous_status: string;
  new_status: 'resolved';
  estimated_value: number;
  resolution_amount?: number;
  message: string;
  timestamp: string;
}

export interface Phase3DetectionStatusChangedEvent {
  detection_id: string;
  previous_status: string;
  new_status: string;
  message: string;
  timestamp: string;
}

export interface Phase3SyncCompleteEvent {
  sync_id: string;
  orders_processed: number;
  claims_detected: number;
  message: string;
  timestamp: string;
}

export interface Phase3SyncFailedEvent {
  sync_id: string;
  error: string;
  message: string;
  timestamp: string;
}

export const usePhase3Notifications = (onEvent?: (event: Phase3NotificationEvent) => void, tenantSlug?: string) => {
  const [lastEvent, setLastEvent] = useState<Phase3NotificationEvent | null>(null);
  const eventSourceRef = useRef<EventStreamLike | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  const handledPayloadsRef = useRef<Set<string>>(new Set());
  const { isAuthReady, authToken, isSessionValid } = useSession();

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const slug = tenantSlug;
      if (!slug || !isAuthReady || !authToken || !isSessionValid || isSessionRecoveryPending()) return;
      const url = api.buildApiUrl(`/api/sse/notifications?tenantSlug=${slug}`);
      const eventSource = createAuthenticatedEventStream(url);

      const processIncomingEvent = (rawType: string, data: any) => {
        const eventType = rawType === 'message' ? (data?.event_type || data?.type || 'unknown') : rawType;
        const dedupeKey = `${eventType}:${data?.id || data?.notification_id || data?.timestamp || ''}`;
        if (handledPayloadsRef.current.has(dedupeKey)) {
          return;
        }
        handledPayloadsRef.current.add(dedupeKey);
        if (handledPayloadsRef.current.size > 200) {
          const values = Array.from(handledPayloadsRef.current).slice(-100);
          handledPayloadsRef.current = new Set(values);
        }

          let notificationEvent: Phase3NotificationEvent | null = null;

          // Handle different event types
          switch (eventType) {
            case 'claim_expiring':
              notificationEvent = {
                type: 'claim_expiring',
                data: data as Phase3ClaimExpiringEvent
              };
              break;
            case 'detection_resolved':
              notificationEvent = {
                type: 'detection_resolved',
                data: data as Phase3DetectionResolvedEvent
              };
              break;
            case 'detection_status_changed':
              notificationEvent = {
                type: 'detection_status_changed',
                data: data as Phase3DetectionStatusChangedEvent
              };
              break;
            case 'sync_complete':
              notificationEvent = {
                type: 'sync_complete',
                data: data as Phase3SyncCompleteEvent
              };
              break;
            case 'sync_failed':
              notificationEvent = {
                type: 'sync_failed',
                data: data as Phase3SyncFailedEvent
              };
              break;
            case 'notification':
              notificationEvent = {
                type: 'notification',
                data: data
              };
              break;
            case 'heartbeat':
              notificationEvent = {
                type: 'heartbeat',
                data: { timestamp: data.timestamp || new Date().toISOString() }
              };
              break;
            default:
              // Try to infer type from data structure
              if (data.claim_id && data.days_remaining !== undefined) {
                notificationEvent = { type: 'claim_expiring', data: data as Phase3ClaimExpiringEvent };
              } else if (data.detection_id && data.new_status === 'resolved') {
                notificationEvent = { type: 'detection_resolved', data: data as Phase3DetectionResolvedEvent };
              } else if (data.detection_id && data.new_status) {
                notificationEvent = { type: 'detection_status_changed', data: data as Phase3DetectionStatusChangedEvent };
              } else if (data.sync_id && data.error) {
                notificationEvent = { type: 'sync_failed', data: data as Phase3SyncFailedEvent };
              } else if (data.sync_id && data.orders_processed !== undefined) {
                notificationEvent = { type: 'sync_complete', data: data as Phase3SyncCompleteEvent };
              }
          }

          if (notificationEvent) {
            setLastEvent(notificationEvent);
            onEvent?.(notificationEvent);

            // Transport receipt is only recorded after this authenticated client has parsed
            // a canonical notification event. It is deliberately not read, acknowledgement,
            // or action completion, and server-side writes are idempotent for replay.
            if (notificationEvent.type === 'notification') {
              const notificationId = String(data?.id || data?.notification_id || '').trim();
              const systemSignalId = String(
                data?.payload?.system_signal?.signal_id ||
                data?.data?.system_signal?.signal_id ||
                data?.system_signal_id ||
                ''
              ).trim();
              if (notificationId && systemSignalId && tenantSlug) {
                void api.recordSystemSignalReceipt(notificationId, tenantSlug).catch((error) => {
                  console.warn('[Phase3 Notifications] Failed to record transport receipt', {
                    notificationId,
                    error: error instanceof Error ? error.message : String(error)
                  });
                });
              }
            }

            // Show toast notifications
            switch (notificationEvent.type) {
              case 'claim_expiring':
                const expiringData = notificationEvent.data;
                toast({
                  title: expiringData.urgency === 'critical' ? 'Urgent: Claim Expiring Soon!' : 'Claim Expiring Soon',
                  description: expiringData.message || `Claim expires in ${expiringData.days_remaining} days. ${formatCurrency(expiringData.estimated_value)} at risk.`,
                  variant: expiringData.urgency === 'critical' ? 'destructive' : 'default',
                  duration: 8000,
                });
                break;

              case 'detection_resolved':
                const resolvedData = notificationEvent.data;
                toast({
                  title: 'Detection Resolved',
                  description: resolvedData.message || `Detection ${resolvedData.detection_id} has been resolved.`,
                  duration: 5000,
                });
                break;

              case 'detection_status_changed':
                const statusData = notificationEvent.data;
                toast({
                  title: 'Status Updated',
                  description: statusData.message || `Detection status changed from ${statusData.previous_status} to ${statusData.new_status}.`,
                  duration: 4000,
                });
                break;

              case 'sync_complete':
                toast({
                  title: 'Amazon Update Complete',
                  description: 'Your latest Amazon records are ready to review.',
                  duration: 5000,
                });
                break;

              case 'sync_failed':
                const failedData = notificationEvent.data;
                toast({
                  title: 'Amazon Update Paused',
                  description: failedData.message || 'We hit a temporary issue while updating your Amazon records.',
                  variant: 'destructive',
                  duration: 6000,
                });
                break;

              case 'notification':
                // Persisted notifications are re-fetched by NotificationsProvider.
                // Avoid rendering raw SSE payloads as source-of-truth UI records here.
                break;

              case 'heartbeat':
                // Silent - just keep connection alive
                break;
            }
        }
      };

      eventSource.onopen = () => {
        console.log('[Phase3 Notifications] SSE connection opened');
        reconnectAttemptsRef.current = 0;
      };

      const removeNamedListeners = registerNamedSSEListeners(
        eventSource,
        [
          'notification',
          'claim_expiring',
          'detection_resolved',
          'detection_status_changed',
          'sync_complete',
          'sync_failed',
          'heartbeat',
          'connected'
        ],
        (eventName, payload) => processIncomingEvent(eventName, payload)
      );

      eventSource.onmessage = (event) => {
        try {
          const data = parseDefaultSSEMessage(event);
          processIncomingEvent('message', data);
        } catch (error) {
          console.error('[Phase3 Notifications] Failed to parse event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Phase3 Notifications] SSE error:', error);

        if (isSessionRecoveryPending() || !isAuthReady || !authToken || !isSessionValid) {
          eventSource.close();
          return;
        }

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[Phase3 Notifications] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current); // Exponential backoff
        } else {
          console.error('[Phase3 Notifications] Max reconnect attempts reached. Connection failed.');
          toast({
            title: 'Connection Lost',
            description: 'Real-time notifications are unavailable. Please refresh the page.',
            variant: 'destructive',
            duration: 10000,
          });
        }
      };

      eventSourceRef.current = eventSource;

      const originalClose = eventSource.close.bind(eventSource);
      eventSource.close = () => {
        removeNamedListeners();
        originalClose();
      };
    } catch (error) {
      console.error('[Phase3 Notifications] Failed to create EventSource:', error);
    }
  }, [authToken, isAuthReady, isSessionValid, onEvent, tenantSlug]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return {
    close: () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    },
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      connect();
    },
    lastEvent
  };
};
