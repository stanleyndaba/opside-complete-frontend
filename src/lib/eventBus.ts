/**
 * Global Event Bus
 * 
 * Unified SSE event handling for the entire frontend.
 * All components subscribe to a single event stream.
 * Provides optimistic UI updates and instant state hydration.
 */

import { api } from './api';
import { createAuthenticatedEventStream, type EventStreamLike } from './authenticatedSSE';
import {
    getLiveEventAliases,
    getLiveEventDedupeKey,
    normalizeIncomingLiveEvent
} from './liveEvents';

type EventCallback = (data: any) => void;
type UnsubscribeFunction = () => void;

interface PlatformEvent {
    type: string;
    data: any;
    timestamp: string;
    entityType?: string;
    entityId?: string;
}

class GlobalEventBus {
    private eventSource: EventStreamLike | null = null;
    private listeners: Map<string, Set<EventCallback>> = new Map();
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly maxReconnectAttempts = 10;
    private readonly reconnectDelay = 3000;
    private eventHistory: PlatformEvent[] = [];
    private readonly maxHistorySize = 100;
    private readonly handledKeys: Set<string> = new Set();
    private activeTenantSlug: string | null = null;
    private activeTenantId: string | null = null;

    private resolveTenantSlug(explicitTenantSlug?: string): string | null {
        if (explicitTenantSlug?.trim()) {
            return explicitTenantSlug.trim();
        }

        const storedSlug = localStorage.getItem('active_tenant_slug');
        if (storedSlug?.trim()) {
            return storedSlug.trim();
        }

        if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/^\/app\/([^/]+)/);
            if (match?.[1]) {
                return decodeURIComponent(match[1]);
            }
        }

        return null;
    }

    private async replayRecentEvents(): Promise<void> {
        if (!this.activeTenantSlug) return;

        try {
            const response = await api.get<{ success: boolean; events: any[] }>(
                `/api/sse/recent?tenantSlug=${encodeURIComponent(this.activeTenantSlug)}&limit=50`
            );
            if (!response.ok || !Array.isArray(response.data?.events)) {
                return;
            }

            response.data.events.forEach((event) => {
                this.handleRawEvent('message', event);
            });
        } catch (error) {
            console.warn('[EventBus] Failed to replay recent events:', error);
        }
    }

    private handleRawEvent(rawType: string, payload: any): void {
        const liveEvent = normalizeIncomingLiveEvent(rawType, payload);
        if (this.activeTenantSlug && liveEvent.tenant_slug && liveEvent.tenant_slug !== this.activeTenantSlug) {
            return;
        }
        if (this.activeTenantId && liveEvent.tenant_id && liveEvent.tenant_id !== this.activeTenantId) {
            return;
        }

        const dedupeKey = getLiveEventDedupeKey(liveEvent);
        if (this.handledKeys.has(dedupeKey)) {
            return;
        }

        this.handledKeys.add(dedupeKey);
        if (this.handledKeys.size > this.maxHistorySize * 3) {
            const recentKeys = Array.from(this.handledKeys).slice(-this.maxHistorySize);
            this.handledKeys.clear();
            recentKeys.forEach((key) => this.handledKeys.add(key));
        }

        const event: PlatformEvent = {
            type: liveEvent.event_type,
            data: liveEvent.payload,
            timestamp: liveEvent.timestamp,
            entityType: liveEvent.entity_type,
            entityId: liveEvent.entity_id
        };

        this.handleEvent(event, getLiveEventAliases(liveEvent));
    }

    /**
     * Connect to SSE stream
     */
    connect(_userId?: string, tenantSlug?: string): void {
        if (this.eventSource?.readyState === EventSource.OPEN) {
            return; // Already connected
        }

        this.activeTenantSlug = this.resolveTenantSlug(tenantSlug);
        this.activeTenantId = localStorage.getItem('active_tenant_id');
        const query = this.activeTenantSlug
            ? `?tenantSlug=${encodeURIComponent(this.activeTenantSlug)}`
            : '';
        const url = api.buildApiUrl(`/api/sse/status${query}`);

        try {
            this.eventSource = createAuthenticatedEventStream(url);

            this.eventSource.onopen = async () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('[EventBus] Connected to SSE stream');
                this.emit('connection', { connected: true });
                await this.replayRecentEvents();
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
                    this.handleRawEvent('message', data);
                } catch (e) {
                    // Ignore parse errors
                }
            };

            // Also listen for named events
            const eventTypes = [
                'message', 'impact', 'metrics', 'sync.log',
                'job.queued', 'job.started', 'job.completed', 'job.failed',
                'agent.invoked', 'agent.completed',
                'detection.created', 'detection.completed',
                'case.created', 'case.status_updated',
                'evidence.linked', 'filing.submitted',
                'payout.detected',
                'detection.anomaly_detected', 'detection.claim_filed',
                'detection.payout_received',
                'system.health',
                'evidence_ingestion_started', 'evidence_ingestion_completed', 'evidence_ingestion_failed',
                'parsing_completed', 'matching_completed'
            ];

            eventTypes.forEach(type => {
                this.eventSource?.addEventListener(type, (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleRawEvent(type, data);
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
            this.activeTenantSlug = null;
            this.activeTenantId = null;
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

    private notifyListeners(eventType: string, event: PlatformEvent): void {
        const typeListeners = this.listeners.get(eventType);
        if (typeListeners) {
            typeListeners.forEach(callback => {
                try {
                    callback(event);
                } catch (e) {
                    console.error('[EventBus] Listener error:', e);
                }
            });
        }
    }

    private handleEvent(event: PlatformEvent, aliases: string[] = []): void {
        // Store in history
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Notify type-specific listeners
        this.notifyListeners(event.type, event);
        aliases.forEach((alias) => this.notifyListeners(alias, { ...event, type: alias }));

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
