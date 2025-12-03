import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Brain, Target, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
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
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout title="Learning Insights">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Learning Insights"
            description="Your AI continuously learns from every claim to improve accuracy and recovery rates"
        >
            <div className="space-y-6">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Self-Improving Brain</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Automated learning makes recoveries bigger and faster over time
                        </p>
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Top metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Model Performance */}
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-black">
                                <Brain className="h-5 w-5 text-purple-600" />
                                Model Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {performance ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-3xl font-bold text-purple-600">
                                            {(performance.accuracy * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-600">Accuracy</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Model v{performance.modelVersion}
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Precision</span>
                                            <span className="font-medium">{(performance.precision * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Recall</span>
                                            <span className="font-medium">{(performance.recall * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">F1 Score</span>
                                            <span className="font-medium">{(performance.f1Score * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    No performance data available yet
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Success Rates */}
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-black">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                                Agent Success Rates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {insights?.successRates ? (
                                <div className="space-y-2">
                                    {Object.entries(insights.successRates).slice(0, 5).map(([agent, rate]: [string, any]) => {
                                        const percentage = (rate * 100).toFixed(0);
                                        const isGood = rate > 0.7;
                                        return (
                                            <div key={agent} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 capitalize">
                                                    {agent.replace(/_/g, ' ')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {percentage}%
                                                    </span>
                                                    {isGood ? (
                                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                    ) : (
                                                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Collecting data...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Threshold Optimizations */}
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-black">
                                <Target className="h-5 w-5 text-blue-600" />
                                Auto-Optimizations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-3xl font-bold text-blue-600">
                                        {thresholds.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Threshold adjustments</div>
                                    <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
                                </div>
                                {thresholds.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <div className="text-xs text-gray-600">Most recent:</div>
                                        <div className="text-sm font-medium text-gray-900 mt-1">
                                            {thresholds[0].threshold_type.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            {thresholds[0].old_value} → {thresholds[0].new_value}
                                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Threshold History */}
                {thresholds.length > 0 && (
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle className="text-black">Threshold Optimization History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {thresholds.map((threshold, index) => {
                                    const isIncrease = threshold.new_value > threshold.old_value;
                                    return (
                                        <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize">
                                                        {threshold.threshold_type.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(threshold.applied_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 mt-2">{threshold.reason}</div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {isIncrease ? (
                                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-blue-600" />
                                                )}
                                                <div className="text-sm font-medium">
                                                    <span className="text-gray-500">{threshold.old_value}</span>
                                                    <span className="mx-1">→</span>
                                                    <span className={isIncrease ? 'text-emerald-600' : 'text-blue-600'}>
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
                {insights?.patterns?.rejectionPatterns && Object.keys(insights.patterns.rejectionPatterns).length > 0 && (
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle className="text-black">Rejection Pattern Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(insights.patterns.rejectionPatterns).map(([reason, data]: [string, any]) => (
                                    <div key={reason} className="flex justify-between items-center p-3 border rounded-lg">
                                        <span className="text-sm font-medium text-gray-900">{reason}</span>
                                        <div className="flex gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="text-emerald-600">Fixable: {data.fixable}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                                <span className="text-red-600">Unclaimable: {data.unclaimable}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info banner */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <Brain className="h-6 w-6 text-purple-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-gray-900">How Learning Works</h3>
                                <p className="text-sm text-gray-700 mt-1">
                                    Your AI analyzes every claim outcome—approvals, rejections, and payouts. It automatically adjusts
                                    matching thresholds, learns from policy changes, and retrains models to maximize recovery rates.
                                    The system runs every 30 minutes, continuously improving without any manual intervention.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}

export default LearningInsights;
