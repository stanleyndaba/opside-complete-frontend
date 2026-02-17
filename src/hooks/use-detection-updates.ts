import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export interface DetectionUpdateEvent {
  sync_id: string;
  detection_id?: string;
  anomaly_type?: string;
  estimated_value?: number;
  totalRecoverableValue?: number; // Actual calculated value from backend
  confidence_score?: number;
  status?: 'in_progress' | 'complete' | 'failed';
  message?: string;
  new_detections_count?: number;
  total_detections?: number;
  timestamp: string;
}

export const useDetectionUpdates = (
  syncId: string | null,
  onUpdate?: (event: DetectionUpdateEvent) => void,
  tenantSlug?: string
) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const connect = useCallback(() => {
    if (!syncId) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const slug = tenantSlug;
      if (!slug) return;
      const url = api.buildApiUrl(`/api/sse/detection-updates/${syncId}?tenantSlug=${slug}`);
      const eventSource = new EventSource(url, { withCredentials: true } as any);

      eventSource.onopen = () => {
        console.log(`[Detection Updates] SSE connection opened for sync ${syncId}`);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.addEventListener('detection_updates', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as DetectionUpdateEvent;
          onUpdate?.(data);
          // No toasts - removed per user request
        } catch (error) {
          console.error('[Detection Updates] Failed to parse event:', error);
        }
      });

      eventSource.addEventListener('detection_complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as DetectionUpdateEvent;
          onUpdate?.(data);
          // No toasts - removed per user request

          // Close connection after completion
          eventSource.close();
        } catch (error) {
          console.error('[Detection Updates] Failed to parse completion event:', error);
        }
      });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as DetectionUpdateEvent;
          onUpdate?.(data);
        } catch (error) {
          console.error('[Detection Updates] Failed to parse message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Detection Updates] SSE error:', error);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[Detection Updates] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else {
          console.error('[Detection Updates] Max reconnect attempts reached.');
          eventSource.close();
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[Detection Updates] Failed to create EventSource:', error);
    }
  }, [syncId, onUpdate, tenantSlug]);

  useEffect(() => {
    if (syncId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [syncId, connect]);

  return {
    close: () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
};

