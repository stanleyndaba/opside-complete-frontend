import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type EventPayload =
  | { type: 'detection'; id: string; status: string }
  | { type: 'sync'; id: string; status: string; progress?: number }
  | { type: 'recovery'; id: string; status: string };

export interface StatusStreamOptions {
  // Optional JWT provider if backend requires token via query param (e.g., ws://.../ws/status?token=...)
  getToken?: () => string | Promise<string>;
  // Callbacks to update local state in pages
  onDetection?: (e: Extract<EventPayload, { type: 'detection' }>) => void;
  onSync?: (e: Extract<EventPayload, { type: 'sync' }>) => void;
  onRecovery?: (e: Extract<EventPayload, { type: 'recovery' }>) => void;
  // Control toast behavior; default true
  toasts?: boolean;
}

function buildWsUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
  // If no base, derive from window.location
  if (!base) {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.host}${path}`;
  }
  try {
    const u = new URL(base);
    const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${u.host}${path}`;
  } catch {
    // Fallback to relative
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.host}${path}`;
  }
}

export function useStatusStream({ getToken, onDetection, onSync, onRecovery, toasts = true }: StatusStreamOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<number>(0);
  const closedRef = useRef<boolean>(false);

  useEffect(() => {
    closedRef.current = false;
    (async () => {
      const token = getToken ? await getToken() : undefined;
      const path = token ? `/ws/status?token=${encodeURIComponent(token)}` : '/ws/status';
      const wsUrl = buildWsUrl(path);

      const connectWs = () => {
        try {
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;
          ws.onopen = () => {
            reconnectRef.current = 0;
          };
          ws.onmessage = (ev) => {
            try {
              const data = JSON.parse(ev.data) as EventPayload;
              handleEvent(data);
            } catch {
              // ignore malformed payloads
            }
          };
          ws.onerror = () => {
            // no-op; will close and reconnect
          };
          ws.onclose = () => {
            wsRef.current = null;
            if (closedRef.current) return;
            // Backoff and try SSE fallback after a few failed attempts
            const delay = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current++));
            window.setTimeout(() => {
              if (reconnectRef.current >= 3) {
                connectSse();
              } else {
                connectWs();
              }
            }, delay);
          };
        } catch {
          connectSse();
        }
      };

      const connectSse = () => {
        try {
          const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
          const url = token
            ? `${base}/sse/status?token=${encodeURIComponent(token)}`
            : `${base}/sse/status`;
          const es = new EventSource(url, { withCredentials: true });
          esRef.current = es;
          es.onmessage = (ev) => {
            try {
              const data = JSON.parse(ev.data) as EventPayload;
              handleEvent(data);
            } catch {
              // ignore
            }
          };
          es.onerror = () => {
            // EventSource auto-reconnects; if it gives up, we can try again
          };
        } catch {
          // give up silently; UI will continue with last known state
        }
      };

      const handleEvent = (evt: EventPayload) => {
        const status = (evt as any).status?.toLowerCase?.();
        if (evt.type === 'detection') {
          onDetection?.(evt);
          if (toasts) {
            if (status === 'completed') toast.success('Detection completed successfully');
            else if (status === 'failed') toast.error('Detection failed. Please try again.');
            else if (status === 'in_progress') toast.info('Detection is in progress');
          }
        } else if (evt.type === 'sync') {
          onSync?.(evt);
          if (toasts) {
            if (status === 'completed') toast.success('Sync completed');
            else if (status === 'failed') toast.error('Sync failed');
          }
        } else if (evt.type === 'recovery') {
          onRecovery?.(evt);
          if (toasts) {
            if (status === 'submitted') toast.success(`Claim ${evt.id} submitted`);
            else if (status === 'paid' || status === 'paid_out') toast.success(`Claim ${evt.id} paid`);
            else if (status === 'denied' || status === 'failed') toast.error(`Claim ${evt.id} ${status}`);
          }
        }
      };

      connectWs();
    })();

    return () => {
      closedRef.current = true;
      try { wsRef.current?.close(); } catch {}
      try { esRef.current?.close?.(); } catch {}
    };
  }, [getToken, onDetection, onSync, onRecovery, toasts]);
}

