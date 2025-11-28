import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Loader2, TrendingUp, TrendingDown, Activity, Brain, Target, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem('clario.admin') : null;
      setIsAdmin(v === 'true');
    } catch {}
  }, []);

  // Load learning metrics
  useEffect(() => {
    if (!isAdmin) return;
    
    let cancelled = false;
    (async () => {
      setLoadingMetrics(true);
      setMetricsError(null);
      try {
        const [metricsRes, insightsRes] = await Promise.all([
          api.getLearningMetrics({ window: timeWindow }),
          api.getLearningInsights({ limit: 20 })
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
    try { localStorage.setItem('clario.admin', value ? 'true' : 'false'); } catch {}
  };

  const refreshMetrics = () => {
    setTimeWindow(timeWindow); // Trigger useEffect
  };

  return (
    <PageLayout title="Admin">
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 md:px-10 lg:px-12 py-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Admin Mode</CardTitle>
            <CardDescription className="text-gray-600">Enable admin access to internal tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-gray-900 font-medium">Admin access</div>
                <div className="text-gray-600 text-sm">Controls visibility of internal pages e.g. revenue model.</div>
              </div>
              <Switch checked={isAdmin} onCheckedChange={toggle} />
            </div>
            <div className="pt-4 flex gap-3 flex-wrap">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <a href="/revenue-model">Open Revenue Model</a>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <a href="/admin/users-integrations">Users & Integrations</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Learning & Analytics Section (Admin Only) */}
        {isAdmin && (
          <Card className="bg-white border-gray-200 shadow-sm mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-600" />
                    System Performance & Learning Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-600">Track agent performance, model accuracy, and system optimization insights</CardDescription>
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
                    className="bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  >
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
                  <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 mb-2">{metricsError}</p>
                  <Button
                    variant="outline"
                    onClick={refreshMetrics}
                    className="bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!loadingMetrics && !metricsError && learningMetrics && (
                <div className="space-y-6">
                  {/* Overall Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Events</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {learningMetrics.total_events?.toLocaleString() || 0}
                            </p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                            <p className="text-2xl font-semibold text-gray-900">
                              {learningMetrics.success_rate 
                                ? `${(learningMetrics.success_rate * 100).toFixed(1)}%`
                                : 'N/A'}
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Improvement Rate</p>
                            <p className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                              {learningMetrics.improvement_rate 
                                ? (
                                  <>
                                    {learningMetrics.improvement_rate > 0 ? (
                                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                      <TrendingDown className="h-5 w-5 text-red-600" />
                                    )}
                                    {Math.abs(learningMetrics.improvement_rate * 100).toFixed(1)}%
                                  </>
                                )
                                : 'N/A'}
                            </p>
                          </div>
                          <Brain className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Agent Performance Table */}
                  {learningMetrics.by_agent && Object.keys(learningMetrics.by_agent).length > 0 && (
                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-gray-900 text-lg">Agent Performance</CardTitle>
                        <CardDescription className="text-gray-600">Success rates and event counts by agent</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-gray-200">
                                <TableHead className="text-gray-900">Agent</TableHead>
                                <TableHead className="text-gray-900">Events</TableHead>
                                <TableHead className="text-gray-900">Success Rate</TableHead>
                                <TableHead className="text-gray-900">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(learningMetrics.by_agent).map(([agent, data]: [string, any]) => {
                                const successRate = data.success_rate || 0;
                                const isHealthy = successRate >= 0.8;
                                const isWarning = successRate >= 0.5 && successRate < 0.8;
                                
                                return (
                                  <TableRow key={agent} className="border-gray-200 hover:bg-gray-50">
                                    <TableCell className="text-gray-900 font-medium">
                                      {agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </TableCell>
                                    <TableCell className="text-gray-700">
                                      {data.events?.toLocaleString() || 0}
                                    </TableCell>
                                    <TableCell className="text-gray-700">
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
                                          }
                                        >
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

                  {/* Learning Insights */}
                  {learningInsights && learningInsights.length > 0 && (
                    <Card className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-gray-900 text-lg">Optimization Insights</CardTitle>
                        <CardDescription className="text-gray-600">AI-generated recommendations for system improvement</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {learningInsights.slice(0, 10).map((insight: any) => (
                            <div
                              key={insight.id}
                              className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                            >
                              <div className="flex items-start gap-3">
                                <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                                    {insight.title || 'Optimization Insight'}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {insight.description || 'No description available'}
                                  </p>
                                  {insight.impact && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Impact: {insight.impact}
                                    </p>
                                  )}
                                  {insight.priority && (
                                    <Badge 
                                      className={`mt-2 ${
                                        insight.priority === 'high'
                                          ? 'bg-red-100 text-red-800 border-red-200'
                                          : insight.priority === 'medium'
                                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                                          : 'bg-blue-100 text-blue-800 border-blue-200'
                                      }`}
                                    >
                                      {insight.priority} priority
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(!learningMetrics.by_agent || Object.keys(learningMetrics.by_agent).length === 0) && 
                   (!learningInsights || learningInsights.length === 0) && (
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
