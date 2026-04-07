import { getFrontendAuthToken } from './authSession';
import { dispatchSessionRecovery } from './sessionRecovery';

export interface EventStreamLike {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  close(): void;
}

type AuthenticatedEventStreamOptions = {
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
};

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 2;

class AuthenticatedEventStream implements EventStreamLike {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState = CONNECTING;

  private readonly url: string;
  private readonly autoReconnect: boolean;
  private readonly reconnectDelayMs: number;
  private readonly listeners = new Map<string, Set<EventListener>>();
  private abortController: AbortController | null = null;
  private reconnectTimer: number | null = null;
  private closedManually = false;
  private reconnectDisabled = false;

  constructor(url: string, options: AuthenticatedEventStreamOptions = {}) {
    this.url = url;
    this.autoReconnect = options.autoReconnect ?? false;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 3000;
    void this.open();
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closedManually = true;
    this.readyState = CLOSED;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
  }

  private async open(): Promise<void> {
    if (this.closedManually || this.reconnectDisabled) {
      return;
    }

    this.abortController?.abort();
    this.abortController = new AbortController();
    this.readyState = CONNECTING;

    try {
      const token = await getFrontendAuthToken();
      const headers: Record<string, string> = {
        Accept: 'text/event-stream'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.url, {
        method: 'GET',
        headers,
        credentials: 'include',
        cache: 'no-store',
        signal: this.abortController.signal
      });

      if (!response.ok || !response.body) {
        if (response.status === 401) {
          const message = await response.text().catch(() => '');
          dispatchSessionRecovery({
            status: response.status,
            source: this.url,
            message: message || 'Authentication is required for live updates.',
          });
          this.handleError({ disableReconnect: true });
          return;
        }

        if (response.status === 403) {
          this.handleError({ disableReconnect: true });
          return;
        }

        this.handleError();
        return;
      }

      this.readyState = OPEN;
      this.onopen?.(new Event('open'));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventName = 'message';
      let currentDataLines: string[] = [];
      let currentEventId = '';

      const flushEvent = () => {
        if (!currentDataLines.length) {
          currentEventName = 'message';
          return;
        }

        const messageEvent = new MessageEvent(currentEventName || 'message', {
          data: currentDataLines.join('\n'),
          lastEventId: currentEventId,
          origin: typeof window !== 'undefined' ? window.location.origin : ''
        });

        this.dispatch(currentEventName || 'message', messageEvent);
        currentEventName = 'message';
        currentDataLines = [];
      };

      while (!this.closedManually) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line === '') {
            flushEvent();
            continue;
          }

          if (line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('event:')) {
            currentEventName = line.slice(6).trim() || 'message';
            continue;
          }

          if (line.startsWith('data:')) {
            currentDataLines.push(line.slice(5).replace(/^ /, ''));
            continue;
          }

          if (line.startsWith('id:')) {
            currentEventId = line.slice(3).trim();
          }
        }
      }

      if (buffer.trim()) {
        currentDataLines.push(buffer.trim());
      }
      flushEvent();

      if (!this.closedManually) {
        this.handleError();
      }
    } catch (error) {
      if (!this.closedManually) {
        this.handleError();
      }
    }
  }

  private dispatch(type: string, event: MessageEvent): void {
    if (type === 'message') {
      this.onmessage?.(event);
    }

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }

  private handleError(options: { disableReconnect?: boolean } = {}): void {
    if (options.disableReconnect) {
      this.reconnectDisabled = true;
    }

    this.readyState = CLOSED;
    this.onerror?.(new Event('error'));

    if (!this.autoReconnect || this.closedManually || this.reconnectDisabled) {
      return;
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      if (!this.closedManually) {
        void this.open();
      }
    }, this.reconnectDelayMs);
  }
}

export function createAuthenticatedEventStream(
  url: string,
  options?: AuthenticatedEventStreamOptions
): EventStreamLike {
  return new AuthenticatedEventStream(url, options);
}
