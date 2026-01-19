import React, { useEffect, useState, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { api } from '@/lib/api';

interface QueueMetrics {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

interface QueueStats {
    status: 'healthy' | 'unavailable' | 'error';
    message?: string;
    timestamp: string;
    queueName?: string;
    metrics: QueueMetrics;
    alerts?: {
        highFailureRate: boolean;
        backlogBuilding: boolean;
        workersOverloaded: boolean;
    };
}

export default function QueueDashboard() {
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get<QueueStats>('/api/admin/queue-stats');
            if (response.ok && response.data) {
                setStats(response.data);
                setError(null);
            } else {
                setError(response.error || 'Failed to fetch queue statistics');
            }
        } catch (e: any) {
            setError(e.message || 'Connection failed');
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats]);

    const formatTimestamp = (ts: string) => {
        return new Date(ts).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return '#0D9488';
            case 'unavailable': return '#D97706';
            case 'error': return '#DC2626';
            default: return '#6B7280';
        }
    };

    const getAlertLevel = () => {
        if (!stats?.alerts) return 'NOMINAL';
        const { highFailureRate, backlogBuilding, workersOverloaded } = stats.alerts;
        if (highFailureRate || backlogBuilding || workersOverloaded) return 'ELEVATED';
        return 'NOMINAL';
    };

    return (
        <PageLayout>
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#0A0A0A',
                color: '#E5E5E5',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                {/* Header */}
                <div style={{
                    borderBottom: '1px solid #262626',
                    padding: '24px 40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#737373',
                            marginBottom: '4px'
                        }}>
                            Operations Center
                        </h1>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#FAFAFA',
                            margin: 0
                        }}>
                            Queue Processing Status
                        </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: '11px',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: '#525252',
                            marginBottom: '4px'
                        }}>
                            Last Updated
                        </div>
                        <div style={{
                            fontSize: '13px',
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            color: '#A3A3A3'
                        }}>
                            {formatTimestamp(lastRefresh.toISOString())}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ padding: '40px' }}>
                    {/* Status Banner */}
                    <div style={{
                        backgroundColor: '#141414',
                        border: '1px solid #262626',
                        borderRadius: '2px',
                        padding: '24px 32px',
                        marginBottom: '32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#525252',
                                    marginBottom: '4px'
                                }}>
                                    System Status
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: stats ? getStatusColor(stats.status) : '#6B7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {loading ? 'CONNECTING' : stats?.status?.toUpperCase() || 'UNKNOWN'}
                                </div>
                            </div>
                            <div style={{
                                width: '1px',
                                height: '40px',
                                backgroundColor: '#262626'
                            }} />
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#525252',
                                    marginBottom: '4px'
                                }}>
                                    Alert Level
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: getAlertLevel() === 'NOMINAL' ? '#0D9488' : '#D97706',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {getAlertLevel()}
                                </div>
                            </div>
                            <div style={{
                                width: '1px',
                                height: '40px',
                                backgroundColor: '#262626'
                            }} />
                            <div>
                                <div style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#525252',
                                    marginBottom: '4px'
                                }}>
                                    Queue Instance
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#A3A3A3'
                                }}>
                                    {stats?.queueName || 'onboarding-sync'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                style={{
                                    backgroundColor: autoRefresh ? '#1C1C1C' : 'transparent',
                                    border: '1px solid #404040',
                                    borderRadius: '2px',
                                    padding: '10px 20px',
                                    color: autoRefresh ? '#10B981' : '#737373',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            backgroundColor: '#1C1917',
                            border: '1px solid #7C2D12',
                            borderRadius: '2px',
                            padding: '16px 24px',
                            marginBottom: '32px',
                            color: '#FCA5A5'
                        }}>
                            <span style={{ fontWeight: 600 }}>CONNECTION ERROR:</span> {error}
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '1px',
                        backgroundColor: '#262626',
                        border: '1px solid #262626',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginBottom: '32px'
                    }}>
                        {[
                            { label: 'Waiting', value: stats?.metrics.waiting ?? 0, desc: 'Jobs in queue' },
                            { label: 'Active', value: stats?.metrics.active ?? 0, desc: 'Currently processing' },
                            { label: 'Completed', value: stats?.metrics.completed ?? 0, desc: 'Successfully finished' },
                            { label: 'Failed', value: stats?.metrics.failed ?? 0, desc: 'Requires attention' },
                            { label: 'Delayed', value: stats?.metrics.delayed ?? 0, desc: 'Scheduled for later' },
                        ].map((metric) => (
                            <div
                                key={metric.label}
                                style={{
                                    backgroundColor: '#141414',
                                    padding: '28px 24px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontSize: '11px',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#525252',
                                    marginBottom: '8px'
                                }}>
                                    {metric.label}
                                </div>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: metric.label === 'Failed' && metric.value > 0 ? '#EF4444' : '#FAFAFA',
                                    lineHeight: 1,
                                    marginBottom: '8px'
                                }}>
                                    {loading ? '—' : metric.value.toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#525252'
                                }}>
                                    {metric.desc}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Alerts Section */}
                    <div style={{
                        backgroundColor: '#141414',
                        border: '1px solid #262626',
                        borderRadius: '2px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid #262626'
                        }}>
                            <h3 style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: '#737373',
                                margin: 0
                            }}>
                                System Alerts
                            </h3>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            {stats?.alerts ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #262626' }}>
                                            <th style={{
                                                textAlign: 'left',
                                                padding: '12px 0',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#525252'
                                            }}>
                                                Condition
                                            </th>
                                            <th style={{
                                                textAlign: 'left',
                                                padding: '12px 0',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#525252'
                                            }}>
                                                Threshold
                                            </th>
                                            <th style={{
                                                textAlign: 'right',
                                                padding: '12px 0',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#525252'
                                            }}>
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { name: 'High Failure Rate', threshold: '> 10 failed jobs', active: stats.alerts.highFailureRate },
                                            { name: 'Backlog Building', threshold: '> 50 waiting jobs', active: stats.alerts.backlogBuilding },
                                            { name: 'Workers Overloaded', threshold: '>= 5 concurrent active', active: stats.alerts.workersOverloaded },
                                        ].map((alert) => (
                                            <tr key={alert.name} style={{ borderBottom: '1px solid #1C1C1C' }}>
                                                <td style={{
                                                    padding: '14px 0',
                                                    fontSize: '13px',
                                                    color: '#E5E5E5'
                                                }}>
                                                    {alert.name}
                                                </td>
                                                <td style={{
                                                    padding: '14px 0',
                                                    fontSize: '13px',
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    color: '#737373'
                                                }}>
                                                    {alert.threshold}
                                                </td>
                                                <td style={{
                                                    padding: '14px 0',
                                                    textAlign: 'right'
                                                }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '2px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.05em',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: alert.active ? '#7C2D12' : '#14532D',
                                                        color: alert.active ? '#FCA5A5' : '#86EFAC'
                                                    }}>
                                                        {alert.active ? 'TRIGGERED' : 'CLEAR'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '24px',
                                    color: '#525252'
                                }}>
                                    No alert data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Throughput Indicators */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '24px'
                    }}>
                        <div style={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '2px',
                            padding: '24px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: '#525252',
                                marginBottom: '12px'
                            }}>
                                Success Rate
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#10B981'
                            }}>
                                {stats?.metrics.completed && stats?.metrics.failed !== undefined
                                    ? ((stats.metrics.completed / (stats.metrics.completed + stats.metrics.failed)) * 100).toFixed(1)
                                    : '100.0'}%
                            </div>
                            <div style={{
                                marginTop: '12px',
                                height: '4px',
                                backgroundColor: '#1C1C1C',
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: stats?.metrics.completed && stats?.metrics.failed !== undefined
                                        ? `${(stats.metrics.completed / (stats.metrics.completed + stats.metrics.failed)) * 100}%`
                                        : '100%',
                                    backgroundColor: '#10B981',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '2px',
                            padding: '24px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: '#525252',
                                marginBottom: '12px'
                            }}>
                                Queue Utilization
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#3B82F6'
                            }}>
                                {stats?.metrics.active ?? 0} / 5
                            </div>
                            <div style={{
                                marginTop: '12px',
                                height: '4px',
                                backgroundColor: '#1C1C1C',
                                borderRadius: '2px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${((stats?.metrics.active ?? 0) / 5) * 100}%`,
                                    backgroundColor: '#3B82F6',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#141414',
                            border: '1px solid #262626',
                            borderRadius: '2px',
                            padding: '24px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: '#525252',
                                marginBottom: '12px'
                            }}>
                                Total Processed
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#FAFAFA'
                            }}>
                                {((stats?.metrics.completed ?? 0) + (stats?.metrics.failed ?? 0)).toLocaleString()}
                            </div>
                            <div style={{
                                marginTop: '12px',
                                fontSize: '12px',
                                color: '#525252'
                            }}>
                                Lifetime job count
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        marginTop: '48px',
                        paddingTop: '24px',
                        borderTop: '1px solid #1C1C1C',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#404040',
                            letterSpacing: '0.05em'
                        }}>
                            QUEUE MONITORING SYSTEM v1.0 — MARGIN OPERATIONS
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#404040'
                        }}>
                            Refresh interval: 5 seconds when auto-refresh enabled
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
