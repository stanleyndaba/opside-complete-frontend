/**
 * useRealTimeMetrics Hook
 * 
 * Provides real-time financial metrics with optimistic updates.
 * Automatically hydrates from SSE events.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '../lib/eventBus';

interface FinancialMetrics {
    totalFound: number;
    totalPending: number;
    totalCollected: number;
    totalApproved: number;
    claimsDetected: number;
    claimsFiled: number;
    claimsPaid: number;
    roiMultiple: number;
    lastUpdated: string;
}

interface UseRealTimeMetricsOptions {
    userId?: string;
    tenantId?: string;
    pollInterval?: number;
}

export function useRealTimeMetrics(options: UseRealTimeMetricsOptions = {}) {
    const { userId = 'demo-user', tenantId, pollInterval = 60000 } = options;

    const [metrics, setMetrics] = useState<FinancialMetrics>({
        totalFound: 0,
        totalPending: 0,
        totalCollected: 0,
        totalApproved: 0,
        claimsDetected: 0,
        claimsFiled: 0,
        claimsPaid: 0,
        roiMultiple: 0,
        lastUpdated: new Date().toISOString()
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch initial metrics
    const fetchMetrics = useCallback(async () => {
        try {
            const url = tenantId
                ? `/api/metrics/financial/${userId}?tenantId=${tenantId}`
                : `/api/metrics/financial/${userId}`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setMetrics({ ...data.data, lastUpdated: new Date().toISOString() });
                    setError(null);
                }
            }
        } catch (e) {
            setError('Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    }, [userId, tenantId]);

    // Handle SSE events
    useEffect(() => {
        // Connect event bus
        eventBus.connect(userId);

        // Fetch initial data
        fetchMetrics();

        // Subscribe to metrics updates
        const unsubMetrics = eventBus.on('metrics', (event) => {
            if (event.data?.type === 'financial_metrics') {
                setMetrics({ ...event.data.data, lastUpdated: new Date().toISOString() });
            }
        });

        // Subscribe to impact events for optimistic updates
        const unsubImpact = eventBus.on('impact', (event) => {
            if (event.data?.type === 'financial_impact') {
                const { status, amount } = event.data.data;

                setMetrics(prev => {
                    const updated = { ...prev, lastUpdated: new Date().toISOString() };

                    // Optimistic update based on status
                    if (status === 'detected') {
                        updated.totalFound += amount || 0;
                        updated.claimsDetected += 1;
                    } else if (status === 'filed') {
                        updated.totalPending += amount || 0;
                        updated.claimsFiled += 1;
                    } else if (status === 'approved') {
                        updated.totalApproved += amount || 0;
                    } else if (status === 'paid') {
                        updated.totalCollected += amount || 0;
                        updated.claimsPaid += 1;
                    }

                    return updated;
                });
            }
        });

        // Subscribe to detection events
        const unsubDetection = eventBus.on('detection.anomaly_detected', (event) => {
            const amount = event.data?.amount || 0;
            setMetrics(prev => ({
                ...prev,
                totalFound: prev.totalFound + amount,
                claimsDetected: prev.claimsDetected + 1,
                lastUpdated: new Date().toISOString()
            }));
        });

        // Poll for fresh data periodically
        const pollId = setInterval(fetchMetrics, pollInterval);

        return () => {
            unsubMetrics();
            unsubImpact();
            unsubDetection();
            clearInterval(pollId);
        };
    }, [userId, tenantId, fetchMetrics, pollInterval]);

    // Manual refresh function
    const refresh = useCallback(() => {
        setLoading(true);
        fetchMetrics();
    }, [fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        refresh,
        isConnected: eventBus.getConnectionStatus()
    };
}

export default useRealTimeMetrics;
