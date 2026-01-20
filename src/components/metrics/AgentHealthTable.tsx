/**
 * Agent Health Table Component
 * 
 * Displays performance metrics for all agents.
 */

import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface AgentMetrics {
    agent: string;
    totalExecutions: number;
    successRate: number;
    avgRuntimeMs: number;
    avgRecoveryPerRun: number;
    lastExecutedAt: string | null;
}

export function AgentHealthTable() {
    const [agents, setAgents] = useState<AgentMetrics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgentMetrics = async () => {
            try {
                const response = await fetch('/api/metrics/agents?days=30');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAgents(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch agent metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgentMetrics();
    }, []);

    const formatAgentName = (name: string) => {
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 95) return 'text-emerald-600';
        if (rate >= 80) return 'text-amber-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No agent metrics available yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-gray-400" />
                    Agent Performance
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs text-gray-500 border-b border-gray-100">
                            <th className="px-4 py-2 text-left font-medium">Agent</th>
                            <th className="px-4 py-2 text-right font-medium">Runs</th>
                            <th className="px-4 py-2 text-right font-medium">Success</th>
                            <th className="px-4 py-2 text-right font-medium">Avg Time</th>
                            <th className="px-4 py-2 text-right font-medium">Avg Recovery</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agents.map((agent) => (
                            <tr key={agent.agent} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        {agent.successRate >= 95 ? (
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : agent.successRate >= 80 ? (
                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        ) : (
                                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatAgentName(agent.agent)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5 text-right text-sm text-gray-600">
                                    {agent.totalExecutions.toLocaleString()}
                                </td>
                                <td className={`px-4 py-2.5 text-right text-sm font-medium ${getSuccessRateColor(agent.successRate)}`}>
                                    {agent.successRate.toFixed(1)}%
                                </td>
                                <td className="px-4 py-2.5 text-right text-sm text-gray-600">
                                    {agent.avgRuntimeMs < 1000
                                        ? `${agent.avgRuntimeMs.toFixed(0)}ms`
                                        : `${(agent.avgRuntimeMs / 1000).toFixed(1)}s`
                                    }
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    {agent.avgRecoveryPerRun > 0 ? (
                                        <span className="text-sm text-emerald-600 font-medium flex items-center justify-end gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            ${agent.avgRecoveryPerRun.toFixed(0)}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AgentHealthTable;
