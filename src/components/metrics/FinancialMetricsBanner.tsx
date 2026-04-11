/**
 * Financial Metrics Banner Component
 * 
 * Displays real-time financial recovery metrics on the dashboard.
 * Updates via SSE events for live counter experience.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { createAuthenticatedEventStream } from '@/lib/authenticatedSSE';

interface FinancialMetrics {
    totalFound: number;
    totalPending: number;
    totalCollected: number;
    totalApproved: number;
    claimsDetected: number;
    claimsPaid: number;
    roiMultiple: number;
}

interface FinancialMetricsBannerProps {
    userId?: string;
    className?: string;
}

export function FinancialMetricsBanner({ userId, className = '' }: FinancialMetricsBannerProps) {
    const { tenant, isReady } = useTenant();
    const activeTenantSlug = tenant?.slug || 'beta';

    const [metrics, setMetrics] = useState<FinancialMetrics>({
        totalFound: 0,
        totalPending: 0,
        totalCollected: 0,
        totalApproved: 0,
        claimsDetected: 0,
        claimsPaid: 0,
        roiMultiple: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;
        // Fetch initial metrics
        const fetchMetrics = async () => {
            try {
                const response = await fetch(`/api/metrics/financial/${userId || 'demo-user'}?tenantSlug=${activeTenantSlug}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setMetrics(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch financial metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();

        // Listen for real-time updates via SSE
        const eventSource = createAuthenticatedEventStream(
            api.buildApiUrl(`/api/sse/stream?tenantSlug=${activeTenantSlug}`),
            { autoReconnect: true, reconnectDelayMs: 3000 }
        );

        eventSource.addEventListener('metrics', (event) => {
            try {
                const data = JSON.parse((event as MessageEvent).data);
                if (data.type === 'financial_metrics') {
                    setMetrics(data.data);
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        eventSource.addEventListener('impact', (event) => {
            try {
                const data = JSON.parse((event as MessageEvent).data);
                if (data.type === 'financial_impact') {
                    // Increment found on new detection
                    if (data.data.status === 'detected') {
                        setMetrics(prev => ({
                            ...prev,
                            totalFound: prev.totalFound + data.data.amount,
                            claimsDetected: prev.claimsDetected + 1
                        }));
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        return () => {
            eventSource.close();
        };
    }, [userId, isReady, activeTenantSlug]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className={`grid grid-cols-4 gap-4 ${className}`}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-28"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {/* Total Found */}
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Total Found
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalFound)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {metrics.claimsDetected} claims detected
                </div>
            </div>

            {/* Pending */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-4 border border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalPending)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Awaiting Amazon decision
                </div>
            </div>

            {/* Collected */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Collected
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalCollected)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {metrics.claimsPaid} claims paid
                </div>
            </div>

            {/* ROI */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ROI Multiple
                </div>
                <div className="text-2xl font-bold text-gray-900">
                    {metrics.roiMultiple > 0 ? `${metrics.roiMultiple.toFixed(1)}x` : '—'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    Return on platform fee
                </div>
            </div>
        </div>
    );
}

export default FinancialMetricsBanner;
