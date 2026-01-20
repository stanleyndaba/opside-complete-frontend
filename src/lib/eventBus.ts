/**
 * Global Event Bus
 * 
 * Unified SSE event handling for the entire frontend.
 * All components subscribe to a single event stream.
 * Provides optimistic UI updates and instant state hydration.
 */

type EventCallback = (data: any) => void;
type UnsubscribeFunction = () => void;

interface PlatformEvent {
    type: string;
    data: any;
    timestamp: string;
}

class GlobalEventBus {
    private eventSource: EventSource | null = null;
    private listeners: Map<string, Set<EventCallback>> = new Map();
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts = 10;
    private readonly reconnectDelay = 3000;
    private eventHistory: PlatformEvent[] = [];
    private readonly maxHistorySize = 100;

    /**
     * Connect to SSE stream
     */
    connect(userId?: string): void {
        if (this.eventSource?.readyState === EventSource.OPEN) {
            return; // Already connected
        }

        const url = userId
            ? `/api/sse/stream?userId=${userId}`
            : '/api/sse/stream';

        try {
            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('[EventBus] Connected to SSE stream');
                this.emit('connection', { connected: true });
            };

            this.eventSource.onerror = () => {
                this.isConnected = false;
                this.emit('connection', { connected: false });
                this.handleReconnect();
            };

            // Listen for all event types
            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleEvent(data);
                } catch (e) {
                    // Ignore parse errors
                }
            };

            // Also listen for named events
            const eventTypes = [
                'message', 'impact', 'metrics', 'sync.log',
                'job.queued', 'job.started', 'job.completed', 'job.failed',
                'agent.invoked', 'agent.completed',
                'detection.anomaly_detected', 'detection.claim_filed',
                'detection.payout_received',
                'system.health'
            ];

            eventTypes.forEach(type => {
                this.eventSource?.addEventListener(type, (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleEvent({ ...data, type });
                    } catch (e) {
                        // Ignore parse errors
                    }
                });
            });

        } catch (error) {
            console.error('[EventBus] Failed to connect:', error);
        }
    }

    /**
     * Disconnect from SSE stream
     */
    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.isConnected = false;
            console.log('[EventBus] Disconnected');
        }
    }

    /**
     * Subscribe to an event type
     */
    on(eventType: string, callback: EventCallback): UnsubscribeFunction {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(eventType)?.delete(callback);
        };
    }

    /**
     * Subscribe to all events
     */
    onAll(callback: EventCallback): UnsubscribeFunction {
        return this.on('*', callback);
    }

    /**
     * Emit a local event (for optimistic updates)
     */
    emit(eventType: string, data: any): void {
        const event: PlatformEvent = {
            type: eventType,
            data,
            timestamp: new Date().toISOString()
        };

        this.handleEvent(event);
    }

    private handleEvent(event: PlatformEvent): void {
        // Store in history
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Notify type-specific listeners
        const typeListeners = this.listeners.get(event.type);
        if (typeListeners) {
            typeListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (e) {
                    console.error('[EventBus] Listener error:', e);
                }
            });
        }

        // Notify wildcard listeners
        const wildcardListeners = this.listeners.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (e) {
                    console.error('[EventBus] Wildcard listener error:', e);
                }
            });
        }
    }

    private handleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[EventBus] Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[EventBus] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * Get recent events
     */
    getRecentEvents(limit: number = 50): PlatformEvent[] {
        return this.eventHistory.slice(-limit);
    }

    /**
     * Get events by type
     */
    getEventsByType(type: string, limit: number = 20): PlatformEvent[] {
        return this.eventHistory
            .filter(e => e.type === type)
            .slice(-limit);
    }
}

// Create singleton instance
export const eventBus = new GlobalEventBus();

// React hook for using event bus
export function useEventBus() {
    return eventBus;
}

export default eventBus;
