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
    <PageLayout title="Revenue Model (2026)">
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* INPUTS CARD */}
            <Card className="xl:col-span-4 h-fit border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Model Inputs</CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-0.5">Adjust funnel and economics</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={reset} title="Reset to defaults" className="h-7 w-7">
                    <RefreshCw className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <Tabs defaultValue="growth" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4 h-8">
                    <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
                    <TabsTrigger value="funnel" className="text-xs">Funnel</TabsTrigger>
                    <TabsTrigger value="economics" className="text-xs">Economics</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: MARKET & GROWTH */}
                  <TabsContent value="growth" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-gray-700 tracking-wide flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-gray-500" />
                        Market Dynamics
                      </h3>

                      <div className="grid gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Start Active Sellers</Label>
                          <Input
                            type="number"
                            value={startActiveSellers}
                            onChange={e => setStartActiveSellers(clamp(parseInt(e.target.value || '0', 10), 0, 200000))}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Monthly Retention</Label>
                            <span className="text-xs font-medium text-gray-900">{monthlyRetentionPct}%</span>
                          </div>
                          <Slider
                            value={[monthlyRetentionPct]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setMonthlyRetentionPct(vals[0])}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Monthly Sessions</Label>
                          <Input
                            type="number"
                            value={monthlySessions}
                            onChange={e => setMonthlySessions(clamp(parseInt(e.target.value || '0', 10), 0, 10_000_000))}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Mo. Growth Rate</Label>
                            <span className="text-xs font-medium text-gray-900">{monthlySessionsGrowthPct}%</span>
                          </div>
                          <Slider
                            value={[monthlySessionsGrowthPct]}
                            max={50}
                            step={0.5}
                            onValueChange={(vals) => setMonthlySessionsGrowthPct(vals[0])}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: FUNNEL */}
                  <TabsContent value="funnel" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-semibold text-gray-700 tracking-wide flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                          Conversion Steps
                        </h3>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          Total: <span className="text-gray-900 ml-0.5 font-mono">{(conversionFactor * 100).toFixed(2)}%</span>
                        </span>
                      </div>

                      <div className="space-y-4 pt-1">
                        {[
                          { l: 'Visit → Signup', v: visitToSignupPct, s: setVisitToSignupPct },
                          { l: 'Signup → Amazon', v: signupToAmazonPct, s: setSignupToAmazonPct },
                          { l: 'Amazon → Evidence', v: amazonToEvidencePct, s: setAmazonToEvidencePct },
                          { l: 'Evidence → Findings', v: evidenceToFindingsPct, s: setEvidenceToFindingsPct },
                          { l: 'Findings → Payout', v: findingsToPayoutPct, s: setFindingsToPayoutPct }
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">{item.l}</span>
                              <span className="text-xs font-medium text-gray-900 w-10 text-right">{item.v}%</span>
                            </div>
                            <Slider
                              value={[item.v]}
                              max={100}
                              step={1}
                              onValueChange={(vals) => item.s(vals[0])}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 3: ECONOMICS */}
                  <TabsContent value="economics" className="space-y-4">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-semibold text-gray-700 tracking-wide">
                        Unit Economics
                      </h3>

                      <div className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Recovered / Seller / Mo ($)</Label>
                          <Input
                            type="number"
                            value={avgRecoveredPerSeller}
                            onChange={e => setAvgRecoveredPerSeller(clamp(parseFloat(e.target.value || '0'), 0, 1_000_000))}
                            className="font-mono bg-emerald-50/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-medium text-gray-500 tracking-wide">Take Rate</Label>
                            <span className="text-xs font-medium text-gray-900">{takeRatePct}%</span>
                          </div>
                          <Slider
                            value={[takeRatePct]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setTakeRatePct(vals[0])}
                          />
                        </div>

                        <Separator />

                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 font-medium">ARPS (Rev/Seller/Mo)</span>
                            <span className="font-mono text-base font-semibold text-emerald-700">${arps.toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">Average Revenue Per Seller based on recovery and take rate.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>


            {/* PROJECTION TABLE */}
            <Card className="xl:col-span-8 border-gray-200 shadow-sm bg-white h-fit">
              <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900">Revenue Projection (2026)</CardTitle>
                  <CardDescription className="text-xs text-gray-500 mt-0.5">Based on current inputs</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 text-gray-700 border-gray-200 text-xs h-7">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200">
                        <th className="py-2 px-3 text-left text-[10px] font-semibold text-gray-500 tracking-wide">Month</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-500 tracking-wide">Traffic</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-500 tracking-wide">New Paid</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-500 tracking-wide">Active</th>
                        <th className="py-2 px-3 text-right text-[10px] font-semibold text-gray-700 tracking-wide">Revenue (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r, i) => (
                        <tr key={r.month} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-2 px-3 text-xs text-gray-900 font-medium">{r.month}</td>
                          <td className="py-2 px-3 text-right text-xs text-gray-600 font-mono">{r.sessions.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-xs text-emerald-600 font-mono">+{r.newPaid.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-xs text-gray-700 font-mono">{r.activeSellers.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-xs text-gray-900 font-mono font-medium">
                            ${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-medium">
                      <tr>
                        <td className="py-3 px-3 text-xs text-gray-900" colSpan={4}>Total Projected Revenue</td>
                        <td className="py-3 px-3 text-right text-base font-semibold text-emerald-700">
                          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="px-1">
                    <div className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Total Active Sellers (Dec)</div>
                    <div className="text-base text-gray-900 font-semibold">{rows[11].activeSellers.toLocaleString()}</div>
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Annual Revenue (USD)</div>
                    <div className="text-base text-gray-900 font-semibold">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] text-gray-500 font-medium tracking-wide mb-0.5">Annual Revenue (ZAR)</div>
                    <div className="text-base text-gray-900 font-semibold">R {totalRevenueZar.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
