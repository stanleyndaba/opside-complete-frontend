import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, RefreshCw, Download, DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MonthRow {
  month: string;
  sessions: number;
  newPaid: number;
  activeSellers: number;
  revenue: number;
  revenueZar: number;
}

const DEFAULTS = {
  startActiveSellers: 150,
  monthlyRetentionPct: 94,
  monthlySessions: 2600,
  monthlySessionsGrowthPct: 8,
  visitToSignupPct: 6,
  signupToAmazonPct: 70,
  amazonToEvidencePct: 60,
  evidenceToFindingsPct: 75,
  findingsToPayoutPct: 55,
  avgRecoveredPerSeller: 800,
  takeRatePct: 20,
};

function pctToFactor(p: number): number { return Math.max(0, p) / 100; }
function clamp(n: number, min: number, max: number): number { return Math.min(max, Math.max(min, n)); }

export default function RevenueModel() {
  const [startActiveSellers, setStartActiveSellers] = useState<number>(DEFAULTS.startActiveSellers);
  const [monthlyRetentionPct, setMonthlyRetentionPct] = useState<number>(DEFAULTS.monthlyRetentionPct);
  const [monthlySessions, setMonthlySessions] = useState<number>(DEFAULTS.monthlySessions);
  const [monthlySessionsGrowthPct, setMonthlySessionsGrowthPct] = useState<number>(DEFAULTS.monthlySessionsGrowthPct);

  const [visitToSignupPct, setVisitToSignupPct] = useState<number>(DEFAULTS.visitToSignupPct);
  const [signupToAmazonPct, setSignupToAmazonPct] = useState<number>(DEFAULTS.signupToAmazonPct);
  const [amazonToEvidencePct, setAmazonToEvidencePct] = useState<number>(DEFAULTS.amazonToEvidencePct);
  const [evidenceToFindingsPct, setEvidenceToFindingsPct] = useState<number>(DEFAULTS.evidenceToFindingsPct);
  const [findingsToPayoutPct, setFindingsToPayoutPct] = useState<number>(DEFAULTS.findingsToPayoutPct);

  const [avgRecoveredPerSeller, setAvgRecoveredPerSeller] = useState<number>(DEFAULTS.avgRecoveredPerSeller);
  const [takeRatePct, setTakeRatePct] = useState<number>(DEFAULTS.takeRatePct);

  const months = useMemo(() => [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ], []);

  const conversionFactor = useMemo(() => (
    pctToFactor(visitToSignupPct) *
    pctToFactor(signupToAmazonPct) *
    pctToFactor(amazonToEvidencePct) *
    pctToFactor(evidenceToFindingsPct) *
    pctToFactor(findingsToPayoutPct)
  ), [visitToSignupPct, signupToAmazonPct, amazonToEvidencePct, evidenceToFindingsPct, findingsToPayoutPct]);

  const arps = useMemo(() => avgRecoveredPerSeller * pctToFactor(takeRatePct), [avgRecoveredPerSeller, takeRatePct]);
  const retentionFactor = useMemo(() => pctToFactor(monthlyRetentionPct), [monthlyRetentionPct]);
  const sessionsGrowthFactor = useMemo(() => 1 + pctToFactor(monthlySessionsGrowthPct), [monthlySessionsGrowthPct]);

  const rows: MonthRow[] = useMemo(() => {
    let sellers = Math.max(0, Math.floor(startActiveSellers));
    let sessions = Math.max(0, Math.floor(monthlySessions));
    const result: MonthRow[] = [];
    for (let i = 0; i < 12; i++) {
      const newPaid = Math.floor(sessions * conversionFactor);
      if (i === 0) {
        sellers = sellers + newPaid;
      } else {
        sellers = Math.floor(sellers * retentionFactor) + newPaid;
      }
      const revenue = sellers * arps;
      const revenueZar = revenue * 18.5;

      result.push({
        month: months[i],
        sessions,
        newPaid,
        activeSellers: sellers,
        revenue,
        revenueZar,
      });

      // Next month sessions grow
      sessions = Math.floor(sessions * sessionsGrowthFactor);
    }
    return result;
  }, [startActiveSellers, monthlySessions, sessionsGrowthFactor, conversionFactor, retentionFactor, arps, months]);

  const totalRevenue = useMemo(() => rows.reduce((sum, r) => sum + r.revenue, 0), [rows]);
  const totalRevenueZar = useMemo(() => rows.reduce((sum, r) => sum + r.revenueZar, 0), [rows]);

  const exportCsv = () => {
    const headers = ['Month', 'Sessions', 'NewPaid', 'ActiveSellers', 'RevenueUSD', 'RevenueZAR'];
    const lines = rows.map(r => [r.month, r.sessions, r.newPaid, r.activeSellers, r.revenue.toFixed(2), r.revenueZar.toFixed(2)].join(','));
    const csv = [headers.join(','), ...lines, '', `Total,, , ,${totalRevenue.toFixed(2)},${totalRevenueZar.toFixed(2)}`].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-model-2026.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStartActiveSellers(DEFAULTS.startActiveSellers);
    setMonthlyRetentionPct(DEFAULTS.monthlyRetentionPct);
    setMonthlySessions(DEFAULTS.monthlySessions);
    setMonthlySessionsGrowthPct(DEFAULTS.monthlySessionsGrowthPct);
    setVisitToSignupPct(DEFAULTS.visitToSignupPct);
    setSignupToAmazonPct(DEFAULTS.signupToAmazonPct);
    setAmazonToEvidencePct(DEFAULTS.amazonToEvidencePct);
    setEvidenceToFindingsPct(DEFAULTS.evidenceToFindingsPct);
    setFindingsToPayoutPct(DEFAULTS.findingsToPayoutPct);
    setAvgRecoveredPerSeller(DEFAULTS.avgRecoveredPerSeller);
    setTakeRatePct(DEFAULTS.takeRatePct);
  };

  return (
    <PageLayout title="Revenue Model (2026)" midnight>
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-[#050505] overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* INPUTS CARD */}
            <Card className="xl:col-span-4 h-fit bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl shadow-none rounded-xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <CardHeader className="border-b border-white/5 pb-4 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-mono tracking-[0.2em] uppercase text-emerald-500/80">Model Inputs</CardTitle>
                    <CardDescription className="text-xs text-white/40 mt-1 font-serif italic">Adjust funnel and economics</CardDescription>
                  </div>
                  <Button variant="outline" size="icon" onClick={reset} title="Reset to defaults" className="h-8 w-8 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-white/50 hover:text-emerald-400">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6 relative z-10">
                <Tabs defaultValue="growth" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/[0.02] border border-white/5 rounded-lg p-1 h-10">
                    <TabsTrigger value="growth" className="text-[10px] uppercase tracking-widest font-mono data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none rounded-md transition-all">Growth</TabsTrigger>
                    <TabsTrigger value="funnel" className="text-[10px] uppercase tracking-widest font-mono data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none rounded-md transition-all">Funnel</TabsTrigger>
                    <TabsTrigger value="economics" className="text-[10px] uppercase tracking-widest font-mono data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none rounded-md transition-all">Economics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="growth" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-emerald-500/80 flex items-center gap-2 mb-4">
                        <Users className="h-3.5 w-3.5" />
                        Market Dynamics
                      </h3>

                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Start Active Sellers</Label>
                          <Input
                            type="number"
                            value={startActiveSellers}
                            onChange={e => setStartActiveSellers(clamp(parseInt(e.target.value || '0', 10), 0, 200000))}
                            className="bg-white/[0.03] border-white/10 text-emerald-400 font-mono text-xs w-full h-10 rounded-lg focus:border-emerald-500/50"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Monthly Retention</Label>
                            <span className="text-xs font-mono text-emerald-400">{monthlyRetentionPct}%</span>
                          </div>
                          <Slider
                            value={[monthlyRetentionPct]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setMonthlyRetentionPct(vals[0])}
                            className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&>span>span]:bg-emerald-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Monthly Sessions</Label>
                          <Input
                            type="number"
                            value={monthlySessions}
                            onChange={e => setMonthlySessions(clamp(parseInt(e.target.value || '0', 10), 0, 10_000_000))}
                            className="bg-white/[0.03] border-white/10 text-emerald-400 font-mono text-xs w-full h-10 rounded-lg focus:border-emerald-500/50"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Mo. Growth Rate</Label>
                            <span className="text-xs font-mono text-emerald-400">{monthlySessionsGrowthPct}%</span>
                          </div>
                          <Slider
                            value={[monthlySessionsGrowthPct]}
                            max={50}
                            step={0.5}
                            onValueChange={(vals) => setMonthlySessionsGrowthPct(vals[0])}
                            className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&>span>span]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: FUNNEL */}
                  <TabsContent value="funnel" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-emerald-500/80 flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Conversion Steps
                        </h3>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          Total: <span className="text-white ml-1">{(conversionFactor * 100).toFixed(2)}%</span>
                        </span>
                      </div>

                      <div className="space-y-6 pt-2">
                        {[
                          { l: 'Visit → Signup', v: visitToSignupPct, s: setVisitToSignupPct },
                          { l: 'Signup → Amazon', v: signupToAmazonPct, s: setSignupToAmazonPct },
                          { l: 'Amazon → Evidence', v: amazonToEvidencePct, s: setAmazonToEvidencePct },
                          { l: 'Evidence → Findings', v: evidenceToFindingsPct, s: setEvidenceToFindingsPct },
                          { l: 'Findings → Payout', v: findingsToPayoutPct, s: setFindingsToPayoutPct }
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">{item.l}</span>
                              <span className="text-xs font-mono text-emerald-400 w-10 text-right">{item.v}%</span>
                            </div>
                            <Slider
                              value={[item.v]}
                              max={100}
                              step={1}
                              onValueChange={(vals) => item.s(vals[0])}
                              className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&>span>span]:bg-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: ECONOMICS */}
                  <TabsContent value="economics" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-mono text-emerald-500/80 mb-4">
                        Unit Economics
                      </h3>

                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Recovered / Seller / Mo ($)</Label>
                          <Input
                            type="number"
                            value={avgRecoveredPerSeller}
                            onChange={e => setAvgRecoveredPerSeller(clamp(parseFloat(e.target.value || '0'), 0, 1_000_000))}
                            className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-mono text-xs w-full h-10 rounded-lg focus:border-emerald-500/50"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Take Rate</Label>
                            <span className="text-xs font-mono text-emerald-400">{takeRatePct}%</span>
                          </div>
                          <Slider
                            value={[takeRatePct]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setTakeRatePct(vals[0])}
                            className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&>span>span]:bg-emerald-500"
                          />
                        </div>

                        <Separator className="bg-white/5 my-4" />

                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">ARPS (Rev/Seller/Mo)</span>
                            <span className="font-serif text-2xl text-emerald-400">${arps.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-white/30 font-serif italic">Average Revenue Per Seller based on recovery and take rate.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>


            {/* PROJECTION TABLE */}
            <Card className="xl:col-span-8 bg-[#0c0c0c] border border-white/5 backdrop-blur-3xl shadow-none rounded-xl overflow-hidden relative group h-fit">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 bg-white/[0.02]">
                <div>
                  <CardTitle className="text-sm font-mono tracking-[0.2em] uppercase text-emerald-500/80">Revenue Projection (2026)</CardTitle>
                  <CardDescription className="text-xs text-white/40 mt-1 font-serif italic">Based on current inputs</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2 text-white/50 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-400 font-mono text-[9px] uppercase tracking-widest h-8 transition-all">
                  <Download className="h-3.5 w-3.5" />
                  Export Data
                </Button>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="py-3 px-4 text-left text-[10px] font-mono tracking-widest uppercase text-white/40">Month</th>
                        <th className="py-3 px-4 text-right text-[10px] font-mono tracking-widest uppercase text-white/40">Traffic</th>
                        <th className="py-3 px-4 text-right text-[10px] font-mono tracking-widest uppercase text-white/40">New Paid</th>
                        <th className="py-3 px-4 text-right text-[10px] font-mono tracking-widest uppercase text-white/40">Active</th>
                        <th className="py-3 px-4 text-right text-[10px] font-mono tracking-widest uppercase text-white/40">Revenue (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {rows.map((r, i) => (
                        <tr key={r.month} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-xs text-white/70 font-mono tracking-widest uppercase">{r.month}</td>
                          <td className="py-3 px-4 text-right text-xs text-white/50 font-mono">{r.sessions.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-xs text-emerald-500/80 font-mono">+{r.newPaid.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-xs text-white/70 font-mono">{r.activeSellers.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-sm text-emerald-400 font-mono">
                            ${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/[0.02] border-t border-white/10">
                      <tr>
                        <td className="py-4 px-4 text-[10px] font-mono tracking-widest uppercase text-white/50" colSpan={4}>Total Projected Revenue</td>
                        <td className="py-4 px-4 text-right text-xl font-serif text-emerald-400">
                          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2">Total Active Sellers (Dec)</div>
                    <div className="text-2xl font-serif text-white/90">{rows[11].activeSellers.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#0c0c0c] rounded-xl p-4 border border-emerald-500/20 text-center shadow-[0_0_15px_rgba(16,185,129,0.05)_inset]">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/70 mb-2">Annual Revenue (USD)</div>
                    <div className="text-2xl font-serif text-emerald-400">
                      ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 text-center">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/70 mb-2">Annual Revenue (ZAR)</div>
                    <div className="text-2xl font-serif text-white/90">
                      R {totalRevenueZar.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between opacity-50 px-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono tracking-[0.3em] text-white uppercase">Margin Internal System // Authorized access only</span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-emerald-500">v2.0.4-STABLE</span>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
