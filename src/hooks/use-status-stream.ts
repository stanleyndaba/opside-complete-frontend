import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { getApiBaseUrl } from '@/lib/api';

export type StatusEvent =
  | { type: 'detection'; id: string; status: 'in_progress' | 'complete' | 'failed' }
  | { type: 'sync'; id: string; status: 'in_progress' | 'complete' | 'failed'; progress?: number }
  | { type: 'recovery'; id: string; status: string };

/**
 * useStatusStream connects to the backend WebSocket stream for real-time status updates.
 * Falls back gracefully if WS fails; caller can keep polling as a backup.
 */
export function useStatusStream(onEvent: (evt: StatusEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const base = getApiBaseUrl();
    if (!('WebSocket' in window)) return; // no WS support

    const wsUrl = (() => {
      const origin = base || window.location.origin;
      const url = new URL(origin.replace(/^http/, 'ws'));
      url.pathname = (url.pathname.replace(/\/$/, '')) + '/ws/status';
      return url.toString();
    })();

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Connected; credentials via cookie for same-origin; else backend must accept token query param
        };
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data && data.type) {
              onEvent(data as StatusEvent);
              if (data.type === 'detection') {
                if (data.status === 'complete') toast({ title: 'Detection completed' });
                if (data.status === 'failed') toast({ title: 'Detection failed' });
              }
              if (data.type === 'sync') {
                if (data.status === 'complete') toast({ title: 'Sync completed' });
                if (data.status === 'failed') toast({ title: 'Sync failed' });
              }
              if (data.type === 'recovery') {
                // Notify on transitions to Paid/Denied/Submitted
                if (['Paid Out','Denied','Submitted'].includes(data.status)) {
                  toast({ title: `Claim ${data.id} ${data.status}` });
                }
              }
            }
          } catch (_) {
            // ignore invalid event
          }
        };
        ws.onclose = () => {
          // Auto-reconnect with backoff
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect();
            }, 3000);
          }
        };
        ws.onerror = () => {
          try { ws.close(); } catch {}
        };
      } catch {
        // ignore
      }
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      wsRef.current = null;
    };
  }, [onEvent]);
}

