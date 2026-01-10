import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdHistory[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem('clario.admin') : null;
      setIsAdmin(v === 'true');
    } catch { }
  }, []);

  // Load learning metrics
  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    (async () => {
      setLoadingMetrics(true);
      setMetricsError(null);
      try {
        const [metricsRes, insightsRes, perfRes, thresholdRes] = await Promise.all([
          api.getLearningMetrics({ window: timeWindow }),
          api.getLearningInsights({ limit: 20 }),
          api.get('/api/learning/model-performance').catch(() => ({ ok: false })),
          api.get('/api/learning/threshold-history?limit=10').catch(() => ({ ok: false }))
        ]);

        if (!cancelled) {
          if (metricsRes.ok && metricsRes.data) {
            setLearningMetrics(metricsRes.data.metrics);
          } else {
            setMetricsError(metricsRes.error || 'Failed to load metrics');
          }

          if (insightsRes.ok && insightsRes.data) {
            setLearningInsights(insightsRes.data.insights);
          }

          if (perfRes.ok && 'data' in perfRes && perfRes.data) {
            setModelPerformance((perfRes.data as any).performance);
          }

          if (thresholdRes.ok && 'data' in thresholdRes && thresholdRes.data) {
            setThresholds((thresholdRes.data as any).thresholds || []);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load learning data:', err);
          setMetricsError(err.message || 'Failed to load learning data');
        }
      } finally {
        if (!cancelled) {
          setLoadingMetrics(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, timeWindow]);

  const toggle = (value: boolean) => {
    setIsAdmin(value);
    try { localStorage.setItem('clario.admin', value ? 'true' : 'false'); } catch { }
  };

  const refreshMetrics = () => {
    setTimeWindow(timeWindow); // Trigger useEffect
  };

  return (
    <PageLayout title="Admin">
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 md:px-10 lg:px-12 py-6 space-y-6">
          {/* Mission Promise - For Founder Reminder */}
          <div className="bg-white border border-gray-200 rounded-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">The Promise</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Read this when you drift off mission</p>
            </div>
            <div className="p-6">
              <blockquote className="border-l-2 border-gray-300 pl-4 py-2 mb-6">
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  "Margin tirelessly finds, proves, and recovers every dollar Amazon owes you, with almost zero work or risk on your side—and shows you exactly how it did it."
                </p>
              </blockquote>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.15em] mb-3">What We Do</h4>
                  <ul className="text-xs text-gray-600 space-y-2">
                    <li className="flex"><span className="text-gray-400 mr-2">1.</span>Find everything: Always-on scan for lost/damaged inventory, fee errors, underpaid reimbursements</li>
                    <li className="flex"><span className="text-gray-400 mr-2">2.</span>Prove everything: Auto-grab invoices/PODs, build clean claim packets, keep full audit trails</li>
                    <li className="flex"><span className="text-gray-400 mr-2">3.</span>Recover safely: Only strong, policy-compliant claims auto-filed; double-dip guard</li>
                    <li className="flex"><span className="text-gray-400 mr-2">4.</span>Zero cognitive load: Sellers don't chase docs, fill forms, or project manage tickets</li>
                    <li className="flex"><span className="text-gray-400 mr-2">5.</span>Radical transparency: Every claim, amount, status, and payout is visible</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.15em] mb-3">Competitive Differentiation</h4>
                  <p className="text-xs text-gray-600 italic mb-3">
                    "Margin is the one place where your Amazon money is never forgotten, never guessed, and never risky—just automatically found, fought for, and deposited."
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li><span className="text-gray-400">Others sell "we file claims"</span> — we remove the entire burden</li>
                    <li><span className="text-gray-400">Others show numbers</span> — we give certainty + receipts</li>
                    <li><span className="text-gray-400">Others need you to work</span> — we're the 24/7 finance agent</li>
                  </ul>
                  <p className="text-[10px] text-gray-400 mt-4 italic">Keep this promise at scale, and everyone else becomes toys.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Administration */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">Platform Administration</CardTitle>
              <CardDescription className="text-xs text-gray-500">Enable admin access to internal tools.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-xs font-medium text-gray-900">Admin access</div>
                  <div className="text-[10px] text-gray-500">Controls visibility of internal pages e.g. revenue model.</div>
                </div>
                <Switch checked={isAdmin} onCheckedChange={toggle} />
              </div>
              <div className="pt-3 flex gap-2 flex-wrap">
                <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-xs">
                  <a href="/revenue-model">Open Revenue Model</a>
                </Button>
                <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white text-xs">
                  <a href="/admin/users-integrations">Users</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning & Analytics Section (Admin Only) */}
          {isAdmin && (
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      System Performance
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">Track agent performance, model accuracy, and system optimization insights</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={timeWindow} onValueChange={(v) => setTimeWindow(v as '7d' | '30d' | '90d')}>
                      <SelectTrigger className="w-[120px] bg-white text-gray-900 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshMetrics}
                      disabled={loadingMetrics}
                      className="bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                      {loadingMetrics ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMetrics && (
                  <div className="text-center py-8 text-gray-600">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p>Loading system metrics...</p>
                  </div>
                )}

                {metricsError && !loadingMetrics && (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-2">{metricsError}</p>
                    <Button
                      variant="outline"
                      onClick={refreshMetrics}
                      className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                      Retry
                    </Button>
                  </div>
                )}

                {!loadingMetrics && !metricsError && learningMetrics && (
                  <div className="space-y-6">
                    {/* Model Performance & Detailed Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Model Performance */}
                      {modelPerformance && (
                        <Card className="bg-white border-gray-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                              Model Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="text-xl font-semibold text-gray-900">
                                  {(modelPerformance.accuracy * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-500">Accuracy</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Model v{modelPerformance.modelVersion}
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Precision</span>
                                  <span className="font-normal text-gray-600">{(modelPerformance.precision * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Recall</span>
                                  <span className="font-normal text-gray-600">{(modelPerformance.recall * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">F1 Score</span>
                                  <span className="font-normal text-gray-600">{(modelPerformance.f1Score * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Overall Metrics */}
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Total Events</p>
                              <p className="text-2xl font-normal text-gray-700">
                                {learningMetrics.total_events?.toLocaleString() || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                              <p className="text-2xl font-normal text-gray-700">
                                {learningMetrics.success_rate
                                  ? `${(learningMetrics.success_rate * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Improvement Rate</p>
                              <p className="text-2xl font-normal text-gray-700">
                                {learningMetrics.improvement_rate
                                  ? `${Math.abs(learningMetrics.improvement_rate * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Agent Performance Table */}
                    {learningMetrics.by_agent && Object.keys(learningMetrics.by_agent).length > 0 && (
                      <Card className="bg-white border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Agent Performance</CardTitle>
                          <CardDescription className="text-[10px] text-gray-500">Success rates and event counts by agent</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-gray-200 bg-gray-50">
                                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Agent</TableHead>
                                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Events</TableHead>
                                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Success Rate</TableHead>
                                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(learningMetrics.by_agent).map(([agent, data]: [string, any]) => {
                                  const successRate = data.success_rate || 0;
                                  const isHealthy = successRate >= 0.8;
                                  const isWarning = successRate >= 0.5 && successRate < 0.8;

                                  return (
                                    <TableRow key={agent} className="border-gray-200 hover:bg-gray-50">
                                      <TableCell className="text-gray-700 font-normal">
                                        {agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {data.events?.toLocaleString() || 0}
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {successRate > 0 ? `${(successRate * 100).toFixed(1)}%` : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {successRate > 0 && (
                                          <Badge
                                            className={
                                              isHealthy
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                : isWarning
                                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                  : 'bg-red-100 text-red-800 border-red-200'
                                            }>
                                            {isHealthy ? 'Healthy' : isWarning ? 'Warning' : 'Critical'}
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Threshold Optimization History */}
                    {thresholds.length > 0 && (
                      <Card className="bg-white border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Threshold Optimization History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {thresholds.map((threshold, index) => (
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
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Rejection Pattern Analysis */}
                    {learningInsights?.patterns?.rejectionPatterns && Object.keys(learningInsights.patterns.rejectionPatterns).length > 0 && (
                      <Card className="bg-white border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Rejection Pattern Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(learningInsights.patterns.rejectionPatterns).map(([reason, data]: [string, any]) => (
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

                    {/* Learning Insights */}
                    {learningInsights && learningInsights.length > 0 && (
                      <Card className="bg-white border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Optimization Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {learningInsights.slice(0, 10).map((insight: any) => (
                              <div
                                key={insight.id}
                                className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <div className="flex-1">
                                  <h4 className="text-sm font-normal text-gray-700 mb-1">
                                    {insight.title || 'Optimization Insight'}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {insight.description || 'No description available'}
                                  </p>
                                  {insight.impact && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Impact: {insight.impact}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(!learningMetrics.by_agent || Object.keys(learningMetrics.by_agent).length === 0) &&
                      (!learningInsights || learningInsights.length === 0) &&
                      (!modelPerformance) &&
                      (thresholds.length === 0) && (
                        <div className="text-center py-8 text-gray-600">
                          <p>No learning data available yet.</p>
                          <p className="text-sm mt-1 text-gray-500">Data will appear as agents process events.</p>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
