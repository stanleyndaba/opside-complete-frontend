/**
 * System Health Indicator Component
 * 
 * Displays real-time system health status.
 */

import { useState, useEffect } from 'react';
import { Activity, Server, Wifi, AlertCircle } from 'lucide-react';

interface SystemHealth {
    queueDepth: number;
    activeWorkers: number;
    jobsProcessedLast24h: number;
    failureRateLast24h: number;
    sseConnectionCount: number;
}

interface SystemHealthIndicatorProps {
    showDetails?: boolean;
}

export function SystemHealthIndicator({ showDetails = false }: SystemHealthIndicatorProps) {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy');

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const response = await fetch('/api/metrics/system');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setHealth(data.data);

                        // Determine status
                        if (data.data.failureRateLast24h > 10) {
                            setStatus('degraded');
                        } else if (data.data.failureRateLast24h > 25) {
                            setStatus('down');
                        } else {
                            setStatus('healthy');
                        }
                    }
                }
            } catch (error) {
                setStatus('down');
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();

        // Refresh every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const statusColors = {
        healthy: 'bg-emerald-500',
        degraded: 'bg-amber-500',
        down: 'bg-red-500'
    };

    const statusText = {
        healthy: 'All systems operational',
        degraded: 'Degraded performance',
        down: 'Service disruption'
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-400">
                <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
                <span className="text-xs">Checking...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {/* Status dot */}
            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${statusColors[status]} ${status === 'healthy' ? 'animate-pulse' : ''}`}></div>
                <span className="text-xs text-gray-600">{statusText[status]}</span>
            </div>

            {/* Details panel */}
            {showDetails && health && (
                <div className="flex items-center gap-4 ml-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        <span>{health.activeWorkers} workers</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>{health.jobsProcessedLast24h} jobs/24h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        <span>{health.sseConnectionCount} connections</span>
                    </div>
                    {health.failureRateLast24h > 5 && (
                        <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>{health.failureRateLast24h.toFixed(1)}% failure rate</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SystemHealthIndicator;
