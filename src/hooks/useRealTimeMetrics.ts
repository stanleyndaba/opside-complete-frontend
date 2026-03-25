/**
 * useRealTimeMetrics Hook
 * 
 * Provides real-time financial metrics with optimistic updates.
 * Automatically hydrates from SSE events.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStatusStream, type StatusEvent } from './use-status-stream';

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
    tenantSlug?: string;
    pollInterval?: number;
}

export function useRealTimeMetrics(options: UseRealTimeMetricsOptions = {}) {
    const {
        userId = 'demo-user',
        tenantId,
        tenantSlug = localStorage.getItem('active_tenant_slug') || undefined,
        pollInterval = 60000
    } = options;

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

    useStatusStream((event: StatusEvent) => {
        setMetrics(prev => {
            const next = { ...prev, lastUpdated: new Date().toISOString() };

            if (event.eventType === 'metrics' && event.data?.type === 'financial_metrics') {
                const payloadMetrics = event.data?.data || {};
                return {
                    ...next,
                    totalFound: payloadMetrics.totalFound ?? next.totalFound,
                    totalPending: payloadMetrics.totalPending ?? next.totalPending,
                    totalCollected: payloadMetrics.totalCollected ?? next.totalCollected,
                    totalApproved: payloadMetrics.totalApproved ?? next.totalApproved,
                    claimsDetected: payloadMetrics.claimsDetected ?? next.claimsDetected,
                    claimsFiled: payloadMetrics.claimsFiled ?? next.claimsFiled,
                    claimsPaid: payloadMetrics.claimsPaid ?? next.claimsPaid,
                    roiMultiple: payloadMetrics.roiMultiple ?? next.roiMultiple
                };
            }

            const amount = Number(event.data?.amount || event.data?.actual_amount || 0);

            if (event.eventType === 'impact' || event.eventType === 'detection.created') {
                next.totalFound += amount;
                next.claimsDetected += Number(event.data?.count || 1);
            } else if (event.eventType === 'filing.submitted') {
                next.totalPending += Number(event.data?.amount || 0);
                next.claimsFiled += 1;
            } else if (event.eventType === 'case.status_updated') {
                const status = String(event.data?.status || '').toLowerCase();
                if (status === 'approved') {
                    next.totalApproved += Number(event.data?.amount_approved || event.data?.amount || 0);
                }
            } else if (event.eventType === 'payout.detected') {
                next.totalCollected += amount;
                next.claimsPaid += 1;
            }

            return next;
        });
    }, tenantSlug);

    useEffect(() => {
        fetchMetrics();
        const pollId = setInterval(fetchMetrics, pollInterval);
        return () => clearInterval(pollId);
    }, [fetchMetrics, pollInterval]);

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
        isConnected: Boolean(tenantSlug)
    };
}

export default useRealTimeMetrics;
