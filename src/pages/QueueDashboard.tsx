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
            case 'healthy': return '#059669';
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

    const activeAlertCount = stats?.alerts
        ? [stats.alerts.highFailureRate, stats.alerts.backlogBuilding, stats.alerts.workersOverloaded].filter(Boolean).length
        : 0;

    return (
        <PageLayout title="Queue Dashboard" midnight>
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes subtle-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.1); }
          50% { box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1); }
        }
      `}</style>

            <div style={{
                minHeight: '100vh',
                backgroundColor: '#F8FAFC',
                color: '#1E293B',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                {/* Premium Header */}
                <div style={{
                    background: 'linear-gradient(to bottom, #FFFFFF, #F8FAFC)',
                    borderBottom: '1px solid #E2E8F0',
                    padding: '32px 48px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: stats?.status === 'healthy' ? '#059669' : stats?.status === 'error' ? '#DC2626' : '#D97706',
                                animation: stats?.status === 'healthy' ? 'pulse 2s ease-in-out infinite' : 'none'
                            }} />
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                color: '#64748B'
                            }}>
                                Operations Center
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#0F172A',
                            margin: 0,
                            letterSpacing: '-0.02em'
                        }}>
                            Queue Processing Status
                        </h1>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748B',
                            margin: '8px 0 0 0'
                        }}>
                            Real-time monitoring of background job processing
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#94A3B8',
                            marginBottom: '6px'
                        }}>
                            Last Synchronized
                        </div>
                        <div style={{
                            fontSize: '15px',
                            fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                            color: '#334155',
                            fontWeight: 500
                        }}>
                            {formatTimestamp(lastRefresh.toISOString())}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ padding: '32px 48px' }}>
                    {/* Status Banner - Enhanced */}
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '28px 36px',
                        marginBottom: '28px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Subtle accent line */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: stats?.status === 'healthy'
                                ? 'linear-gradient(90deg, #059669, #10B981)'
                                : stats?.status === 'error'
                                    ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                                    : 'linear-gradient(90deg, #D97706, #F59E0B)'
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            <div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '6px'
                                }}>
                                    System Status
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: stats ? getStatusColor(stats.status) : '#6B7280',
                                        animation: stats?.status === 'healthy' ? 'subtle-pulse 2s ease-in-out infinite' : 'none'
                                    }} />
                                    <span style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: stats ? getStatusColor(stats.status) : '#6B7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {loading ? 'Connecting' : stats?.status?.toUpperCase() || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '48px', backgroundColor: '#E2E8F0' }} />

                            <div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '6px'
                                }}>
                                    Alert Level
                                </div>
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: getAlertLevel() === 'NOMINAL' ? '#059669' : '#D97706',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {getAlertLevel()}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '48px', backgroundColor: '#E2E8F0' }} />

                            <div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '6px'
                                }}>
                                    Queue Instance
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#475569',
                                    fontWeight: 500
                                }}>
                                    {stats?.queueName || 'onboarding-sync'}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '48px', backgroundColor: '#E2E8F0' }} />

                            <div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '6px'
                                }}>
                                    Active Alerts
                                </div>
                                <div style={{
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: activeAlertCount > 0 ? '#DC2626' : '#059669'
                                }}>
                                    {activeAlertCount}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            style={{
                                backgroundColor: autoRefresh ? '#ECFDF5' : '#F8FAFC',
                                border: autoRefresh ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '12px 24px',
                                color: autoRefresh ? '#047857' : '#64748B',
                                fontSize: '12px',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Live Updates: {autoRefresh ? 'Active' : 'Paused'}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderLeft: '4px solid #DC2626',
                            borderRadius: '6px',
                            padding: '16px 24px',
                            marginBottom: '28px',
                            color: '#991B1B',
                            fontSize: '14px'
                        }}>
                            <span style={{ fontWeight: 700 }}>Connection Error:</span> {error}
                        </div>
                    )}

                    {/* Metrics Grid - Enhanced */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '16px',
                        marginBottom: '28px'
                    }}>
                        {[
                            { label: 'Waiting', value: stats?.metrics.waiting ?? 0, desc: 'Jobs in queue', color: '#3B82F6' },
                            { label: 'Active', value: stats?.metrics.active ?? 0, desc: 'Currently processing', color: '#8B5CF6' },
                            { label: 'Completed', value: stats?.metrics.completed ?? 0, desc: 'Successfully finished', color: '#059669' },
                            { label: 'Failed', value: stats?.metrics.failed ?? 0, desc: 'Requires attention', color: '#DC2626' },
                            { label: 'Delayed', value: stats?.metrics.delayed ?? 0, desc: 'Scheduled for later', color: '#64748B' },
                        ].map((metric) => (
                            <div
                                key={metric.label}
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Accent line */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '20%',
                                    right: '20%',
                                    height: '3px',
                                    backgroundColor: metric.value > 0 || metric.label === 'Completed' ? metric.color : '#E2E8F0',
                                    borderRadius: '3px 3px 0 0',
                                    opacity: metric.value > 0 ? 1 : 0.3
                                }} />

                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '12px'
                                }}>
                                    {metric.label}
                                </div>
                                <div style={{
                                    fontSize: '40px',
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: metric.label === 'Failed' && metric.value > 0 ? '#DC2626' : '#0F172A',
                                    lineHeight: 1,
                                    marginBottom: '10px',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {loading ? '—' : metric.value.toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#94A3B8',
                                    fontWeight: 500
                                }}>
                                    {metric.desc}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two Column Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '28px' }}>
                        {/* Alerts Section - Enhanced */}
                        <div style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '18px 24px',
                                borderBottom: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC'
                            }}>
                                <h3 style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: '#475569',
                                    margin: 0
                                }}>
                                    System Alerts
                                </h3>
                            </div>
                            <div style={{ padding: '8px 0' }}>
                                {stats?.alerts ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{
                                                    textAlign: 'left',
                                                    padding: '12px 24px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    color: '#94A3B8',
                                                    borderBottom: '1px solid #F1F5F9'
                                                }}>
                                                    Condition
                                                </th>
                                                <th style={{
                                                    textAlign: 'left',
                                                    padding: '12px 24px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    color: '#94A3B8',
                                                    borderBottom: '1px solid #F1F5F9'
                                                }}>
                                                    Threshold
                                                </th>
                                                <th style={{
                                                    textAlign: 'right',
                                                    padding: '12px 24px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.1em',
                                                    textTransform: 'uppercase',
                                                    color: '#94A3B8',
                                                    borderBottom: '1px solid #F1F5F9'
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
                                            ].map((alert, idx) => (
                                                <tr key={alert.name} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
                                                    <td style={{
                                                        padding: '16px 24px',
                                                        fontSize: '14px',
                                                        color: '#1E293B',
                                                        fontWeight: 500
                                                    }}>
                                                        {alert.name}
                                                    </td>
                                                    <td style={{
                                                        padding: '16px 24px',
                                                        fontSize: '13px',
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                        color: '#64748B'
                                                    }}>
                                                        {alert.threshold}
                                                    </td>
                                                    <td style={{
                                                        padding: '16px 24px',
                                                        textAlign: 'right'
                                                    }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '5px 14px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            letterSpacing: '0.05em',
                                                            textTransform: 'uppercase',
                                                            backgroundColor: alert.active ? '#FEE2E2' : '#DCFCE7',
                                                            color: alert.active ? '#B91C1C' : '#166534'
                                                        }}>
                                                            {alert.active ? 'Triggered' : 'Clear'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '32px',
                                        color: '#94A3B8'
                                    }}>
                                        No alert data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Throughput Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Success Rate */}
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                flex: 1
                            }}>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '12px'
                                }}>
                                    Success Rate
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#059669',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {stats?.metrics.completed && stats?.metrics.failed !== undefined && (stats.metrics.completed + stats.metrics.failed) > 0
                                        ? ((stats.metrics.completed / (stats.metrics.completed + stats.metrics.failed)) * 100).toFixed(1)
                                        : '100.0'}%
                                </div>
                                <div style={{
                                    marginTop: '16px',
                                    height: '6px',
                                    backgroundColor: '#E2E8F0',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: stats?.metrics.completed && stats?.metrics.failed !== undefined && (stats.metrics.completed + stats.metrics.failed) > 0
                                            ? `${(stats.metrics.completed / (stats.metrics.completed + stats.metrics.failed)) * 100}%`
                                            : '100%',
                                        background: 'linear-gradient(90deg, #059669, #10B981)',
                                        transition: 'width 0.3s ease',
                                        borderRadius: '3px'
                                    }} />
                                </div>
                            </div>

                            {/* Queue Utilization */}
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                flex: 1
                            }}>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '12px'
                                }}>
                                    Queue Utilization
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#2563EB',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {stats?.metrics.active ?? 0}<span style={{ color: '#94A3B8', fontWeight: 500 }}> / 5</span>
                                </div>
                                <div style={{
                                    marginTop: '16px',
                                    height: '6px',
                                    backgroundColor: '#E2E8F0',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${((stats?.metrics.active ?? 0) / 5) * 100}%`,
                                        background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                                        transition: 'width 0.3s ease',
                                        borderRadius: '3px'
                                    }} />
                                </div>
                            </div>

                            {/* Total Processed */}
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '24px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                flex: 1
                            }}>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#94A3B8',
                                    marginBottom: '12px'
                                }}>
                                    Total Processed
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 800,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: '#0F172A',
                                    letterSpacing: '-0.02em'
                                }}>
                                    {((stats?.metrics.completed ?? 0) + (stats?.metrics.failed ?? 0)).toLocaleString()}
                                </div>
                                <div style={{
                                    marginTop: '12px',
                                    fontSize: '12px',
                                    color: '#94A3B8',
                                    fontWeight: 500
                                }}>
                                    Lifetime job count
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        marginTop: '32px',
                        paddingTop: '20px',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            fontSize: '11px',
                            color: '#94A3B8',
                            fontWeight: 600,
                            letterSpacing: '0.05em'
                        }}>
                            Queue Monitoring System v1.0 — Margin Operations
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#94A3B8'
                        }}>
                            Refresh interval: 5 seconds when live updates enabled
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
