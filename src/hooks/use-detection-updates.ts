import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export interface DetectionUpdateEvent {
  sync_id: string;
  detection_id?: string;
  anomaly_type?: string;
  estimated_value?: number;
  confidence_score?: number;
  status?: 'in_progress' | 'complete' | 'failed';
  message?: string;
  new_detections_count?: number;
  total_detections?: number;
  timestamp: string;
}

export const useDetectionUpdates = (
  syncId: string | null,
  onUpdate?: (event: DetectionUpdateEvent) => void
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
      const url = api.buildApiUrl(`/api/sse/detection-updates/${syncId}`);
      const eventSource = new EventSource(url, { withCredentials: true } as any);
      
      eventSource.onopen = () => {
        console.log(`[Detection Updates] SSE connection opened for sync ${syncId}`);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.addEventListener('detection_updates', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as DetectionUpdateEvent;
          onUpdate?.(data);

          // Show toast for new detections
          if (data.new_detections_count && data.new_detections_count > 0) {
            toast({
              title: '🔍 New Detections Found',
              description: `${data.new_detections_count} new anomaly${data.new_detections_count !== 1 ? 'ies' : ''} detected${data.total_detections ? ` (${data.total_detections} total)` : ''}`,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error('[Detection Updates] Failed to parse event:', error);
        }
      });

      eventSource.addEventListener('detection_complete', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as DetectionUpdateEvent;
          onUpdate?.(data);

          toast({
            title: '✅ Detection Complete',
            description: data.message || `Detection job completed. ${data.total_detections || 0} anomalies found.`,
            duration: 6000,
          });

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
  }, [syncId, onUpdate]);

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

