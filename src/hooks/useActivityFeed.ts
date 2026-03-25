/**
 * useActivityFeed Hook
 * 
 * Real-time activity feed from platform events.
 * Shows agent actions, detections, claims, payouts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStatusStream, type StatusEvent } from './use-status-stream';

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
    tenantSlug?: string;
    maxItems?: number;
}

export function useActivityFeed(options: UseActivityFeedOptions = {}) {
    const {
        userId = 'demo-user',
        tenantSlug = localStorage.getItem('active_tenant_slug') || undefined,
        maxItems = 50
    } = options;

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
        setLoading(false);
    }, []);

    useStatusStream((event: StatusEvent) => {
        const baseId = event.entityId || event.data?.jobId || event.data?.claimId || event.data?.detection_id || `${event.eventType}:${event.timestamp}`;

        if (event.eventType === 'detection.created') {
            addActivity({
                id: baseId,
                type: 'detection',
                message: event.data?.message || `Detected: $${Number(event.data?.amount || 0).toFixed(2)}`,
                amount: Number(event.data?.amount || 0),
                confidence: event.data?.confidence || event.data?.confidence_score,
                timestamp: event.timestamp,
                icon: 'detection'
            });
            return;
        }

        if (event.eventType === 'filing.submitted') {
            addActivity({
                id: baseId,
                type: 'claim_filed',
                message: event.data?.message || `Claim filed: $${Number(event.data?.amount || 0).toFixed(2)}`,
                amount: Number(event.data?.amount || 0),
                timestamp: event.timestamp,
                icon: 'claim'
            });
            return;
        }

        if (event.eventType === 'payout.detected') {
            addActivity({
                id: baseId,
                type: 'payout',
                message: event.data?.message || `Payout: $${Number(event.data?.amount || 0).toFixed(2)}`,
                amount: Number(event.data?.amount || 0),
                timestamp: event.timestamp,
                icon: 'payout'
            });
            return;
        }

        if (event.eventType === 'agent.invoked') {
            addActivity({
                id: baseId,
                type: 'agent',
                message: event.data?.message || `Agent ${event.data?.agent} started`,
                timestamp: event.timestamp,
                icon: 'agent'
            });
            return;
        }

        if (event.eventType === 'job.completed') {
            addActivity({
                id: baseId,
                type: 'job',
                message: event.data?.message || 'Job completed',
                timestamp: event.timestamp,
                icon: 'system'
            });
            return;
        }

        if (event.eventType === 'sync.log' && event.data?.log?.type === 'success') {
            addActivity({
                id: baseId,
                type: 'sync',
                message: event.data.log.message,
                timestamp: event.data.log.timestamp || event.timestamp,
                icon: 'system'
            });
        }
    }, tenantSlug);

    // Clear all activities
    const clear = useCallback(() => {
        setActivities([]);
    }, []);

    return {
        activities,
        loading,
        clear,
        isConnected: Boolean(tenantSlug)
    };
}

export default useActivityFeed;
