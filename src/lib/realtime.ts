export type RealtimeEvent =
  | { type: 'detection'; id: string; status: string; progress?: number }
  | { type: 'sync'; id: string; status: string; progress?: number }
  | { type: 'recovery'; id: string; status: string };

type EventHandler = (evt: RealtimeEvent) => void;

let socket: WebSocket | null = null;
let eventSource: EventSource | null = null;
const handlers = new Set<EventHandler>();
let connected = false;
let connecting = false;

function getWsUrl(): string {
  const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
  if (base.startsWith('http')) {
    return base.replace(/^http/, 'ws') + '/ws/status';
  }
  // Fallback to same-origin path
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${loc.host}/ws/status`;
}

function getSseUrl(): string {
  const base = (import.meta as any)?.env?.VITE_API_BASE_URL || '';
  if (base.startsWith('http')) {
    return base + '/sse/status';
  }
  return '/sse/status';
}

function dispatch(evt: RealtimeEvent) {
  handlers.forEach((h) => {
    try { h(evt); } catch { /* ignore */ }
  });
}

function connectViaWebSocket() {
  if (socket) return;
  const url = getWsUrl();
  socket = new WebSocket(url);
  connecting = true;
  socket.onopen = () => { connected = true; connecting = false; };
  socket.onclose = () => {
    connected = false; socket = null; connecting = false;
    // Attempt SSE fallback
    if (!eventSource) connectViaSse();
  };
  socket.onerror = () => { /* handled by close */ };
  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data && data.type) dispatch(data as RealtimeEvent);
    } catch { /* ignore */ }
  };
}

function connectViaSse() {
  if (eventSource) return;
  const url = getSseUrl();
  eventSource = new EventSource(url, { withCredentials: true });
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data && data.type) dispatch(data as RealtimeEvent);
    } catch { /* ignore */ }
  };
  eventSource.onerror = () => {
    eventSource?.close();
    eventSource = null;
  };
}

function ensureConnected() {
  if (connecting || connected || socket || eventSource) return;
  try { connectViaWebSocket(); } catch { connectViaSse(); }
}

export function subscribeRealtime(handler: EventHandler): () => void {
  handlers.add(handler);
  ensureConnected();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      try { socket?.close(); } catch { /* ignore */ }
      try { eventSource?.close(); } catch { /* ignore */ }
      socket = null; eventSource = null; connected = false; connecting = false;
    }
  };
}

