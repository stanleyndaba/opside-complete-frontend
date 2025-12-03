import React, { useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  monthlyRetentionPct: 94, // % retained each month
  monthlySessions: 2600,
  monthlySessionsGrowthPct: 8, // % growth in sessions/mo
  visitToSignupPct: 6,
  signupToAmazonPct: 70,
  amazonToEvidencePct: 60,
  evidenceToFindingsPct: 75,
  findingsToPayoutPct: 55,
  avgRecoveredPerSeller: 800, // USD
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
        // January already has starters; add new paid on top
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
    const headers = ['Month','Sessions','NewPaid','ActiveSellers','RevenueUSD','RevenueZAR'];
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
      <div className="relative -m-4 lg:-m-6 min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 md:px-10 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white border-gray-200 shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-normal text-gray-700">Inputs</CardTitle>
              <CardDescription className="text-gray-500">Adjust to simulate your funnel and ARPS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startSellers" className="text-gray-600">Start Sellers (Jan)</Label>
                  <Input id="startSellers" type="number" value={startActiveSellers}
                         onChange={e => setStartActiveSellers(clamp(parseInt(e.target.value || '0', 10), 0, 200000))} className="bg-white border-gray-200 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="retention" className="text-gray-600">Monthly Retention %</Label>
                  <Input id="retention" type="number" value={monthlyRetentionPct}
                         onChange={e => setMonthlyRetentionPct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="sessions" className="text-gray-600">Sessions (Jan)</Label>
                  <Input id="sessions" type="number" value={monthlySessions}
                         onChange={e => setMonthlySessions(clamp(parseInt(e.target.value || '0', 10), 0, 10_000_000))} className="bg-white border-gray-200 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="sessionsGrowth" className="text-gray-600">Sessions Growth % /mo</Label>
                  <Input id="sessionsGrowth" type="number" value={monthlySessionsGrowthPct}
                         onChange={e => setMonthlySessionsGrowthPct(clamp(parseFloat(e.target.value || '0'), 0, 200))} className="bg-white border-gray-200 text-gray-700" />
                </div>
              </div>

              <div>
                <div className="text-sm font-normal text-gray-600 mb-2">Funnel %</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="v2s" className="text-gray-600">Visit → Signup %</Label>
                    <Input id="v2s" type="number" value={visitToSignupPct}
                           onChange={e => setVisitToSignupPct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  <div>
                    <Label htmlFor="s2a" className="text-gray-600">Signup → Amazon %</Label>
                    <Input id="s2a" type="number" value={signupToAmazonPct}
                           onChange={e => setSignupToAmazonPct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  <div>
                    <Label htmlFor="a2e" className="text-gray-600">Amazon → Evidence %</Label>
                    <Input id="a2e" type="number" value={amazonToEvidencePct}
                           onChange={e => setAmazonToEvidencePct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  <div>
                    <Label htmlFor="e2f" className="text-gray-600">Evidence → Findings %</Label>
                    <Input id="e2f" type="number" value={evidenceToFindingsPct}
                           onChange={e => setEvidenceToFindingsPct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  <div>
                    <Label htmlFor="f2p" className="text-gray-600">Findings → Payout %</Label>
                    <Input id="f2p" type="number" value={findingsToPayoutPct}
                           onChange={e => setFindingsToPayoutPct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  <div>
                    <Label className="text-gray-600">Overall conversion</Label>
                    <div className="text-sm text-gray-600">{(conversionFactor * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recovered" className="text-gray-600">Avg Recovered / Seller / Mo ($)</Label>
                  <Input id="recovered" type="number" value={avgRecoveredPerSeller}
                         onChange={e => setAvgRecoveredPerSeller(clamp(parseFloat(e.target.value || '0'), 0, 1_000_000))} className="bg-white border-gray-200 text-gray-700" />
                </div>
                <div>
                  <Label htmlFor="take" className="text-gray-600">Take Rate %</Label>
                  <Input id="take" type="number" value={takeRatePct}
                         onChange={e => setTakeRatePct(clamp(parseFloat(e.target.value || '0'), 0, 100))} className="bg-white border-gray-200 text-gray-700" />
                </div>
                <div>
                  <Label className="text-gray-600">ARPS (rev/seller/mo)</Label>
                  <div className="text-sm text-gray-600">${arps.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={reset} variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">Reset to defaults</Button>
                <Button onClick={exportCsv} className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200">Export CSV</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-normal text-gray-700">Projection (2026)</CardTitle>
              <CardDescription className="text-gray-500">Active sellers and revenue per month.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-2 pr-4 font-normal">Month</th>
                      <th className="py-2 pr-4 font-normal">Sessions</th>
                      <th className="py-2 pr-4 font-normal">New paid</th>
                      <th className="py-2 pr-4 font-normal">Active sellers</th>
                      <th className="py-2 pr-4 font-normal">Revenue (USD)</th>
                      <th className="py-2 font-normal">Revenue (ZAR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.month} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-600">{r.month}</td>
                        <td className="py-2 pr-4 text-gray-600">{r.sessions.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-600">{r.newPaid.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-600">{r.activeSellers.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-gray-700">${r.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2 text-gray-700">R {r.revenueZar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-3 text-gray-500" colSpan={4}>Total</td>
                      <td className="pt-3 pr-4 text-gray-700 font-normal">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="pt-3 text-gray-700 font-normal">R {totalRevenueZar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}
