/**
 * useActivityFeed Hook
 * 
 * Real-time activity feed from platform events.
 * Shows agent actions, detections, claims, payouts.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../lib/eventBus';

interface ActivityItem {
    id: string;
    type: string;
    message: string;
    amount?: number;
    confidence?: number;
    timestamp: string;
    icon?: 'detection' | 'claim' | 'payout' | 'agent' | 'system';
}

interface UseActivityFeedOptions {
    userId?: string;
    maxItems?: number;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
    const { userId = 'demo-user', maxItems = 50 } = options;

    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Add activity item
    const addActivity = useCallback((item: ActivityItem) => {
        setActivities(prev => {
            const updated = [item, ...prev];
            return updated.slice(0, maxItems);
        });
    }, [maxItems]);

    useEffect(() => {
        // Connect event bus
        eventBus.connect(userId);
        setLoading(false);

        // Subscribe to all relevant events
        const handlers: (() => void)[] = [];

        // Detection events
        handlers.push(eventBus.on('detection.anomaly_detected', (event) => {
            addActivity({
                id: event.data?.detectionId || Date.now().toString(),
                type: 'detection',
                message: event.data?.message || `Detected: $${(event.data?.amount || 0).toFixed(2)}`,
                amount: event.data?.amount,
                confidence: event.data?.confidence,
                timestamp: event.data?.timestamp || new Date().toISOString(),
                icon: 'detection'
            });
        }));

        // Claim filed
        handlers.push(eventBus.on('detection.claim_filed', (event) => {
            addActivity({
                id: event.data?.claimId || Date.now().toString(),
                type: 'claim_filed',
                message: event.data?.message || `Claim filed: $${(event.data?.amount || 0).toFixed(2)}`,
                amount: event.data?.amount,
                timestamp: event.data?.timestamp || new Date().toISOString(),
                icon: 'claim'
            });
        }));

        // Payout received
        handlers.push(eventBus.on('detection.payout_received', (event) => {
            addActivity({
                id: event.data?.claimId || Date.now().toString(),
                type: 'payout',
                message: event.data?.message || `Payout: $${(event.data?.amount || 0).toFixed(2)}`,
                amount: event.data?.amount,
                timestamp: event.data?.timestamp || new Date().toISOString(),
                icon: 'payout'
            });
        }));

        // Agent invoked
        handlers.push(eventBus.on('agent.invoked', (event) => {
            addActivity({
                id: Date.now().toString(),
                type: 'agent',
                message: event.data?.message || `Agent ${event.data?.agent} started`,
                timestamp: event.data?.timestamp || new Date().toISOString(),
                icon: 'agent'
            });
        }));

        // Job events
        handlers.push(eventBus.on('job.completed', (event) => {
            addActivity({
                id: event.data?.jobId || Date.now().toString(),
                type: 'job',
                message: event.data?.message || 'Job completed',
                timestamp: event.data?.timestamp || new Date().toISOString(),
                icon: 'system'
            });
        }));

        // Sync logs (for backward compatibility)
        handlers.push(eventBus.on('message', (event) => {
            if (event.data?.type === 'log' && event.data?.log?.type === 'success') {
                addActivity({
                    id: Date.now().toString(),
                    type: 'sync',
                    message: event.data.log.message,
                    timestamp: event.data.log.timestamp || new Date().toISOString(),
                    icon: 'system'
                });
            }
        }));

        return () => {
            handlers.forEach(unsub => unsub());
        };
    }, [userId, addActivity]);

    // Clear all activities
    const clear = useCallback(() => {
        setActivities([]);
    }, []);

    return {
        activities,
        loading,
        clear,
        isConnected: eventBus.getConnectionStatus()
    };
}

export default useActivityFeed;
