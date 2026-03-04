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
    <PageLayout title="Admin Command Center" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden -m-4 lg:-m-6">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12 space-y-8">
          {/* Header section */}
          <div className="flex flex-col mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-emerald-500/50" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">CORE_SYSTEM // ROOT_ACCESS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
              Command Center
            </h1>
            <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
              Global system monitoring, machine learning performance, and platform access control.
            </p>
          </div>

          {/* Mission Promise - For Founder Reminder */}
          <Card className="bg-[#0c0c0c] border-emerald-500/20 shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
              <CardTitle className="text-[10px] font-mono font-bold text-emerald-500/80 uppercase tracking-[0.3em]">The Promise</CardTitle>
              <CardDescription className="text-xs text-white/40 italic">Read this when you drift off mission</CardDescription>
            </CardHeader>
            <CardContent className="p-8 relative z-10">
              <blockquote className="border-l-2 border-emerald-500/50 pl-6 py-2 mb-8 bg-emerald-500/[0.02] rounded-r-lg">
                <p className="text-base text-white/90 italic font-serif leading-relaxed">
                  "Margin tirelessly finds, proves, and recovers every dollar Amazon owes you, with almost zero work or risk on your side—and shows you exactly how it did it."
                </p>
              </blockquote>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">What We Do</h4>
                  <ul className="text-sm text-white/70 space-y-3 font-sans">
                    <li className="flex items-start"><span className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest mr-3 mt-1">1_</span>Find everything: Always-on scan for lost/damaged inventory, fee errors, underpaid reimbursements</li>
                    <li className="flex items-start"><span className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest mr-3 mt-1">2_</span>Prove everything: Auto-grab invoices/PODs, build clean claim packets, keep full audit trails</li>
                    <li className="flex items-start"><span className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest mr-3 mt-1">3_</span>Recover safely: Only strong, policy-compliant claims auto-filed; double-dip guard</li>
                    <li className="flex items-start"><span className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest mr-3 mt-1">4_</span>Zero cognitive load: Sellers don't chase docs, fill forms, or project manage tickets</li>
                    <li className="flex items-start"><span className="text-emerald-500/50 font-mono text-[10px] uppercase tracking-widest mr-3 mt-1">5_</span>Radical transparency: Every claim, amount, status, and payout is visible</li>
                  </ul>
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Competitive Differentiation</h4>
                  <p className="text-sm text-emerald-500/80 italic font-serif">
                    "Margin is the one place where your Amazon money is never forgotten, never guessed, and never risky—just automatically found, fought for, and deposited."
                  </p>
                  <ul className="text-sm text-white/70 space-y-2.5 font-sans">
                    <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500/50" /> <span className="text-white/40">Others sell "we file claims"</span> — we remove the entire burden</li>
                    <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500/50" /> <span className="text-white/40">Others show numbers</span> — we give certainty + receipts</li>
                    <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500/50" /> <span className="text-white/40">Others need you to work</span> — we're the 24/7 finance agent</li>
                  </ul>
                  <div className="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <p className="text-xs text-white/30 font-mono uppercase tracking-[0.1em]">Keep this promise at scale, and everyone else becomes toys.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Administration */}
          <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
              <CardTitle className="text-xs font-mono font-bold text-white/30 uppercase tracking-[0.3em]">Platform Administration</CardTitle>
              <CardDescription className="text-xs text-white/40 pt-1 font-serif italic">Enable admin access to internal routing and protocols.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-center justify-between py-4 mb-4 bg-white/[0.02] border border-white/5 rounded-xl px-4 hover:border-emerald-500/20 transition-all">
                <div>
                  <div className="text-sm font-serif font-medium text-white/90">God Mode</div>
                  <div className="text-xs font-mono tracking-widest text-emerald-500/60 uppercase mt-1">OVERRIDE_AUTHORIZATION_LOCKS</div>
                </div>
                <Switch checked={isAdmin} onCheckedChange={toggle} className="data-[state=checked]:bg-emerald-500" />
              </div>
              <div className="flex gap-4 flex-wrap">
                <Button asChild className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-10 px-6 font-mono uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <a href="/revenue-model">Launch Revenue Model</a>
                </Button>
                <Button variant="outline" asChild className="border-white/10 hover:border-white/20 hover:bg-white/5 text-white h-10 px-6 font-mono uppercase tracking-widest text-[10px] rounded-xl">
                  <a href="/admin/users-integrations">Manage User Terminals</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning & Analytics Section (Admin Only) */}
          {isAdmin && (
            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-mono font-bold text-emerald-500/80 uppercase tracking-[0.3em]">
                      Neural Engine Performance
                    </CardTitle>
                    <CardDescription className="text-xs text-white/40 pt-1 font-serif italic">Track agent performance, model accuracy, and system optimization telemetry</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={timeWindow} onValueChange={(v) => setTimeWindow(v as '7d' | '30d' | '90d')}>
                      <SelectTrigger className="w-[140px] bg-white/[0.03] text-white border-white/10 font-mono text-[10px] uppercase tracking-widest h-9 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c0c] border-white/10 text-white">
                        <SelectItem value="7d" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 cursor-pointer">Last 7 days</SelectItem>
                        <SelectItem value="30d" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 cursor-pointer">Last 30 days</SelectItem>
                        <SelectItem value="90d" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 cursor-pointer">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={refreshMetrics}
                      disabled={loadingMetrics}
                      className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-500 h-9 px-4 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all">
                      {loadingMetrics ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Sync Telemetry'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {loadingMetrics && (
                  <div className="text-center py-12 text-white/50 space-y-4">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500/50 animate-spin flex items-center justify-center delay-75" />
                      <div className="absolute inset-4 rounded-full border-b-2 border-emerald-500/20 animate-spin flex items-center justify-center delay-150" />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500/70 animate-pulse">Establishing Handshake...</p>
                  </div>
                )}

                {metricsError && !loadingMetrics && (
                  <div className="text-center py-12 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                    <p className="text-red-400 font-mono text-xs uppercase tracking-widest mb-4">ERR_TELEMETRY: {metricsError}</p>
                    <Button
                      variant="outline"
                      onClick={refreshMetrics}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-400 font-mono text-[10px] uppercase tracking-widest">
                      Re-Initialize Link
                    </Button>
                  </div>
                )}

                {!loadingMetrics && !metricsError && learningMetrics && (
                  <div className="space-y-8">
                    {/* Model Performance & Detailed Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Model Performance */}
                      {modelPerformance && (
                        <Card className="bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all group">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">
                              Model Integrity
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-5">
                              <div>
                                <div className="text-4xl font-serif text-white tracking-tighter shadow-sm">
                                  {(modelPerformance.accuracy * 100).toFixed(1)}%
                                </div>
                                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-500/70 mt-1">Global Accuracy</div>
                                <div className="text-[9px] font-mono uppercase text-white/20 mt-2 bg-white/5 inline-block px-2 py-0.5 rounded">
                                  KERNEL_v{modelPerformance.modelVersion}
                                </div>
                              </div>
                              <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Precision</span>
                                  <span className="font-serif text-white/90">{(modelPerformance.precision * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Recall</span>
                                  <span className="font-serif text-white/90">{(modelPerformance.recall * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/50">F1 Score</span>
                                  <span className="font-serif text-emerald-500">{(modelPerformance.f1Score * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Overall Metrics */}
                      <Card className="bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all group p-6 flex flex-col justify-center">
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Total Processes</p>
                          <p className="text-5xl font-serif text-white tracking-tighter">
                            {learningMetrics.total_events?.toLocaleString() || 0}
                          </p>
                          <span className="text-[9px] font-mono uppercase text-emerald-500/50 mt-2 bg-emerald-500/5 inline-block px-2 py-0.5 rounded border border-emerald-500/10">
                            EVENTS_PROCESSED
                          </span>
                        </div>
                      </Card>

                      <div className="space-y-6 flex flex-col">
                        <Card className="bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all flex-1 flex items-center p-6">
                          <div className="w-full flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Execution Rate</p>
                              <span className="text-[9px] font-mono uppercase text-emerald-500/50">SUCCESS_RATIO</span>
                            </div>
                            <p className="text-3xl font-serif text-white">
                              {learningMetrics.success_rate
                                ? `${(learningMetrics.success_rate * 100).toFixed(1)}%`
                                : 'N/A'}
                            </p>
                          </div>
                        </Card>

                        <Card className="bg-white/[0.02] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all flex-1 flex items-center p-6">
                          <div className="w-full flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">Optimization Delta</p>
                              <span className="text-[9px] font-mono uppercase text-emerald-500/50">LEARNING_GAIN</span>
                            </div>
                            <p className="text-3xl font-serif text-emerald-500">
                              {learningMetrics.improvement_rate
                                ? `+${Math.abs(learningMetrics.improvement_rate * 100).toFixed(1)}%`
                                : 'N/A'}
                            </p>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Agent Performance Table */}
                    {learningMetrics.by_agent && Object.keys(learningMetrics.by_agent).length > 0 && (
                      <Card className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                        <CardHeader className="bg-white/[0.01] border-b border-white/5 px-8 pt-6 pb-5">
                          <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Sub-Agent Telemetry</CardTitle>
                          <CardDescription className="text-xs text-white/30 font-serif italic pt-1">Process throughput and success ratios grouped by autonomous agent modules</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto select-none">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-white/5 hover:bg-transparent bg-transparent">
                                  <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Agent Node</TableHead>
                                  <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8 text-right">CYCLES</TableHead>
                                  <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8 text-right">EFFICIENCY</TableHead>
                                  <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8 text-right">STATE</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(learningMetrics.by_agent).map(([agent, data]: [string, any]) => {
                                  const successRate = data.success_rate || 0;
                                  const isHealthy = successRate >= 0.8;
                                  const isWarning = successRate >= 0.5 && successRate < 0.8;

                                  return (
                                    <TableRow key={agent} className="border-b border-white/5 border-dashed hover:bg-white/[0.02] transition-colors group">
                                      <TableCell className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                          <div className={`h-1.5 w-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'}`} />
                                          <span className="text-xs font-mono tracking-widest uppercase text-white/80 group-hover:text-emerald-400 transition-colors">
                                            {agent.replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="px-8 py-5 text-right font-serif text-sm text-white/70">
                                        {data.events?.toLocaleString() || 0}
                                      </TableCell>
                                      <TableCell className="px-8 py-5 text-right font-serif text-sm">
                                        <span className={isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-red-500'}>
                                          {successRate > 0 ? `${(successRate * 100).toFixed(1)}%` : 'N/A'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="px-8 py-5 text-right">
                                        {successRate > 0 && (
                                          <Badge
                                            variant="outline"
                                            className={
                                              isHealthy
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[9px] uppercase tracking-widest'
                                                : isWarning
                                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[9px] uppercase tracking-widest'
                                                  : 'bg-red-500/10 text-red-500 border-red-500/20 font-mono text-[9px] uppercase tracking-widest'
                                            }>
                                            {isHealthy ? 'NOMINAL' : isWarning ? 'DEGRADED' : 'CRITICAL'}
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
                      <Card className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/[0.01] border-b border-white/5 px-8 pt-6 pb-5">
                          <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Threshold Calibrations</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="space-y-4">
                            {thresholds.map((threshold, index) => (
                              <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-white/5 rounded-xl bg-white/[0.01] hover:border-emerald-500/20 transition-all">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono uppercase tracking-widest text-[9px] bg-white/5 text-emerald-500/80 border-white/10">
                                      {threshold.threshold_type.replace(/_/g, ' ')}
                                    </Badge>
                                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                                      {new Date(threshold.applied_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="text-sm text-white/60 mt-3 font-serif italic">"{threshold.reason}"</div>
                                </div>
                                <div className="flex items-center gap-3 mt-4 md:mt-0 px-4 py-2 bg-black/40 rounded-lg border border-white/5">
                                  <div className="text-xl font-serif text-white/40">{threshold.old_value}</div>
                                  <span className="text-emerald-500/50">→</span>
                                  <div className="text-xl font-serif text-emerald-400">{threshold.new_value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Rejection Pattern Analysis */}
                    {learningInsights?.patterns?.rejectionPatterns && Object.keys(learningInsights.patterns.rejectionPatterns).length > 0 && (
                      <Card className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/[0.01] border-b border-white/5 px-8 pt-6 pb-5">
                          <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Rejection Vectors</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="space-y-3">
                            {Object.entries(learningInsights.patterns.rejectionPatterns).map(([reason, data]: [string, any]) => (
                              <div key={reason} className="flex justify-between items-center p-4 border border-white/5 rounded-xl bg-white/[0.01] hover:border-white/10 transition-colors">
                                <span className="text-sm font-sans text-white/80">{reason}</span>
                                <div className="flex gap-6 text-sm font-mono tracking-widest text-[10px] uppercase">
                                  <span className="text-emerald-500/80"><span className="text-white/30 mr-2">FIXABLE_NODE</span>{data.fixable}</span>
                                  <span className="text-red-500/60"><span className="text-white/30 mr-2">UNCLAIMABLE</span>{data.unclaimable}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Learning Insights */}
                    {learningInsights && learningInsights.length > 0 && (
                      <Card className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/[0.01] border-b border-white/5 px-8 pt-6 pb-5">
                          <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Autonomous Optimization Signals</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningInsights.slice(0, 10).map((insight: any) => (
                              <div
                                key={insight.id}
                                className="p-5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 transition-all flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-serif text-white/90 mb-2">
                                    {insight.title || 'Optimization Insight'}
                                  </h4>
                                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                                    {insight.description || 'No description available'}
                                  </p>
                                </div>
                                {insight.impact && (
                                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500/50">PROJECTED_IMPACT:</span>
                                    <span className="text-xs font-serif text-emerald-400">
                                      {insight.impact}
                                    </span>
                                  </div>
                                )}
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
                        <div className="text-center py-16 text-white/30 border border-white/5 border-dashed rounded-2xl">
                          <p className="font-mono text-xs uppercase tracking-widest">Awaiting Initial Telemetry...</p>
                          <p className="text-sm mt-3 font-serif italic text-white/20">System logs will mount once nodes begin processing payload data.</p>
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
