import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface ModelPerformance {
    modelVersion: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastUpdated: string;
}

interface ThresholdHistory {
    threshold_type: string;
    old_value: number;
    new_value: number;
    reason: string;
    expected_improvement: number;
    applied_at: string;
}

export function LearningInsights() {
    const [insights, setInsights] = useState<any>(null);
    const [performance, setPerformance] = useState<ModelPerformance | null>(null);
    const [thresholds, setThresholds] = useState<ThresholdHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch learning insights
            const insightsRes = await api.get('/api/learning/insights?days=30');
            if (insightsRes.ok && insightsRes.data) {
                setInsights((insightsRes.data as any).insights);
            }

            // Fetch model performance
            const perfRes = await api.get('/api/learning/model-performance');
            if (perfRes.ok && perfRes.data) {
                setPerformance((perfRes.data as any).performance);
            }

            // Fetch threshold history
            const thresholdRes = await api.get('/api/learning/threshold-history?limit=10');
            if (thresholdRes.ok && thresholdRes.data) {
                setThresholds((thresholdRes.data as any).thresholds || []);
            }

        } catch (err: any) {
            console.error('Error fetching learning data:', err);
            setError(err.message || 'Failed to load learning insights');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <PageLayout title="Learning Insights">
                <div className="flex items-center justify-center h-64">
                    <div className="text-sm text-gray-400">Loading...</div>
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout title="Learning Insights">
                <Card className="bg-white">
                    <CardContent className="p-6">
                        <div className="text-red-600 text-sm">
                            {error}
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Learning Insights">
            <div className="space-y-6">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-normal text-gray-700">Self-Improving Brain</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Automated learning makes recoveries bigger and faster over time
                        </p>
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm" className="bg-white text-gray-700">
                        Refresh
                    </Button>
                </div>

                {/* Top metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Model Performance */}
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base font-normal text-gray-700">
                                Model Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {performance ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-2xl font-normal text-gray-700">
                                            {(performance.accuracy * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-500">Accuracy</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Model v{performance.modelVersion}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Precision</span>
                                            <span className="font-normal text-gray-600">{(performance.precision * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Recall</span>
                                            <span className="font-normal text-gray-600">{(performance.recall * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">F1 Score</span>
                                            <span className="font-normal text-gray-600">{(performance.f1Score * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">
                                    No performance data available yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Success Rates */}
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base font-normal text-gray-700">
                                Agent Success Rates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {insights?.successRates ? (
                                <div className="space-y-2">
                                    {Object.entries(insights.successRates).slice(0, 5).map(([agent, rate]: [string, any]) => {
                                        const percentage = (rate * 100).toFixed(0);
                                        const isGood = rate> 0.7;
                                        return (
                                            <div key={agent} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 capitalize">
                                                    {agent.replace(/_/g, ' ')}
                                                </span>
                                                <span className={`font-normal ${isGood ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {percentage}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">
                                    Collecting data...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Threshold Optimizations */}
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base font-normal text-gray-700">
                                Auto-Optimizations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-2xl font-normal text-gray-700">
                                        {thresholds.length}
                                    </div>
                                    <div className="text-sm text-gray-500">Threshold adjustments</div>
                                    <div className="text-xs text-gray-400 mt-1">Last 30 days</div>
                                </div>
                                {thresholds.length> 0 && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <div className="text-xs text-gray-500">Most recent:</div>
                                        <div className="text-sm font-normal text-gray-600 mt-1">
                                            {thresholds[0].threshold_type.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {thresholds[0].old_value} → {thresholds[0].new_value}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Threshold History */}
                {thresholds.length> 0 && (
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base font-normal text-gray-700">Threshold Optimization History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {thresholds.map((threshold, index) => {
                                    const isIncrease = threshold.new_value> threshold.old_value;
                                    return (
                                        <div key={index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize bg-white text-gray-600 border-gray-300">
                                                        {threshold.threshold_type.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <span className="text-sm text-gray-400">
                                                        {new Date(threshold.applied_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2">{threshold.reason}</div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <div className="text-sm font-normal">
                                                    <span className="text-gray-500">{threshold.old_value}</span>
                                                    <span className="mx-1 text-gray-400">→</span>
                                                    <span className="text-gray-600">
                                                        {threshold.new_value}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rejection Patterns */}
                {insights?.patterns?.rejectionPatterns && Object.keys(insights.patterns.rejectionPatterns).length> 0 && (
                    <Card className="bg-white border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-base font-normal text-gray-700">Rejection Pattern Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(insights.patterns.rejectionPatterns).map(([reason, data]: [string, any]) => (
                                    <div key={reason} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                                        <span className="text-sm font-normal text-gray-600">{reason}</span>
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-gray-600">Fixable: {data.fixable}</span>
                                            <span className="text-gray-500">Unclaimable: {data.unclaimable}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info banner */}
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-6">
                        <div>
                            <h3 className="text-base font-normal text-gray-700">How Learning Works</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Your AI analyzes every claim outcome—approvals, rejections, and payouts. It automatically adjusts
                                matching thresholds, learns from policy changes, and retrains models to maximize recovery rates.
                                The system runs every 30 minutes, continuously improving without any manual intervention.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export default LearningInsights;
