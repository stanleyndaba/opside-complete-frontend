import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export type Phase3NotificationEvent = 
  | { type: 'claim_expiring'; data: Phase3ClaimExpiringEvent }
  | { type: 'detection_resolved'; data: Phase3DetectionResolvedEvent }
  | { type: 'detection_status_changed'; data: Phase3DetectionStatusChangedEvent }
  | { type: 'sync_complete'; data: Phase3SyncCompleteEvent }
  | { type: 'sync_failed'; data: Phase3SyncFailedEvent }
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

export const usePhase3Notifications = (onEvent?: (event: Phase3NotificationEvent) => void) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

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
      const url = api.buildApiUrl('/api/sse/notifications');
      const eventSource = new EventSource(url, { withCredentials: true } as any);
      
      eventSource.onopen = () => {
        console.log('[Phase3 Notifications] SSE connection opened');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = event.type || data.type || 'unknown';
          
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
            onEvent?.(notificationEvent);

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
                const syncData = notificationEvent.data;
                toast({
                  title: 'Sync Completed',
                  description: syncData.message || `Sync completed. ${syncData.claims_detected || 0} claims detected from ${syncData.orders_processed || 0} orders.`,
                  duration: 6000,
                });
                break;

              case 'sync_failed':
                const failedData = notificationEvent.data;
                toast({
                  title: 'Sync Failed',
                  description: failedData.message || failedData.error || 'Sync encountered an error.',
                  variant: 'destructive',
                  duration: 6000,
                });
                break;

              case 'heartbeat':
                // Silent - just keep connection alive
                break;
            }
          }
        } catch (error) {
          console.error('[Phase3 Notifications] Failed to parse event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Phase3 Notifications] SSE error:', error);
        
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
    } catch (error) {
      console.error('[Phase3 Notifications] Failed to create EventSource:', error);
    }
  }, [onEvent]);

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
    }
  };
};

