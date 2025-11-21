import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { recoveryApi } from '@/lib/recoveryApi';

interface RecoveryClaim {
  id: string;
  created: string;
  type: string;
  status: string;
  guaranteedAmount: number;
  expectedPayoutDate: string | null;
  currency?: string;
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function UpcomingPayments() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<RecoveryClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await recoveryApi.getRecoveries();
        if (!cancelled) {
          if (Array.isArray(res) && res.length > 0) {
            // Map API response to frontend format
            // API returns: amount, expected_payout_date, created_at
            // Frontend expects: guaranteedAmount, expectedPayoutDate, created
            const mapped = (res as any[]).map((c) => ({
              id: c.id || c.claim_id,
              created: c.created || c.created_at,
              type: c.type || c.dispute_type || 'unknown',
              status: c.status,
              // Map amount fields (API may use 'amount' or 'guaranteedAmount')
              guaranteedAmount: c.guaranteedAmount ?? c.amount ?? 0,
              // Map payout date fields (API may use 'expected_payout_date' or 'expectedPayoutDate')
              expectedPayoutDate: (c.expectedPayoutDate ?? c.expected_payout_date ?? null) as string | null,
              currency: (c.currency ?? 'USD') as string,
            })) as RecoveryClaim[];
            setClaims(mapped);
            const firstWithCurrency = (mapped.find(c => !!c.currency)?.currency) || 'USD';
            setCurrency(firstWithCurrency);
          } else {
            // No data - set empty array
            setClaims([]);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load upcoming payments:', error);
          toast({ 
            title: 'Could not load upcoming payments', 
            description: error?.message || 'Please try again later.' 
          });
          setClaims([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const upcomingGroups = useMemo(() => {
    const groups: Record<string, RecoveryClaim[]> = {};
    const today = new Date();
    for (const c of claims) {
      // Consider claims scheduled for the future or not yet paid as "upcoming"
      const isPaid = c.status?.toLowerCase() === 'paid';
      const dt = c.expectedPayoutDate ? new Date(c.expectedPayoutDate) : null;
      const isUpcomingDate = dt ? dt >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;
      if (!isPaid && (isUpcomingDate || dt === null)) {
        const key = dt ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).toISOString() : 'TBD';
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      }
    }
    // Turn into sorted list of [dateKey, arr]
    const entries = Object.entries(groups).sort((a, b) => {
      if (a[0] === 'TBD') return 1;
      if (b[0] === 'TBD') return -1;
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });
    return entries.map(([key, arr]) => {
      const gross = arr.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);
      const commission = gross * 0.2;
      const net = Math.max(gross - commission, 0);
      const label = key === 'TBD' ? 'TBD' : new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return { key, label, gross, commission, net, count: arr.length, claims: arr };
    });
  }, [claims]);

  const nextPayout = upcomingGroups[0];
  const monthTotals = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let gross = 0;
    let count = 0;
    for (const g of upcomingGroups) {
      if (g.key === 'TBD') continue;
      const d = new Date(g.key);
      if (d.getMonth() === month && d.getFullYear() === year) {
        gross += g.gross;
        count += g.count;
      }
    }
    return { gross, count, commission: gross * 0.2, net: Math.max(gross * 0.8, 0) };
  }, [upcomingGroups]);

  const exportCsv = () => {
    const rows = upcomingGroups.map(g => ({
      payoutDate: g.label,
      claims: g.count,
      gross: g.gross.toFixed(2),
      commission: g.commission.toFixed(2),
      net: g.net.toFixed(2),
    }));
    const header = ['Payout Date', 'Claims', 'Gross', 'Commission', 'Net'];
    const csv = [header.join(','), ...rows.map(r => `${r.payoutDate},${r.claims},${r.gross},${r.commission},${r.net}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'upcoming-payments.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'upcoming-payments.csv downloaded.' });
  };

  return (
    <PageLayout title="Upcoming Payments">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300 space-y-8">

            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Upcoming Payments</CardTitle>
                <CardDescription className="text-gray-400">Projected Amazon payouts based on claim status and expected payout dates</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">Next Expected Payout</div>
                    <div className="text-xl font-semibold text-gray-100 mt-1">{nextPayout ? formatCurrency(nextPayout.gross, currency) : formatCurrency(0, currency)}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{nextPayout ? nextPayout.label : '—'}</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">This Month (Projected)</div>
                    <div className="text-xl font-semibold text-emerald-400 mt-1">{formatCurrency(monthTotals.gross, currency)}</div>
                    <div className="text-[11px] text-gray-400 mt-1">Across {monthTotals.count} claims</div>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-gray-400">Net To You (Projected)</div>
                    <div className="text-xl font-semibold text-[#66ff99] mt-1">{formatCurrency(monthTotals.net, currency)}</div>
                    <div className="text-[11px] text-gray-400 mt-1">After 20% commission</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={exportCsv}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Schedule</CardTitle>
                <CardDescription className="text-gray-400">Daily rollup of expected payouts; dates may change based on Amazon processing</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">Payout Date</TableHead>
                      <TableHead className="text-gray-300">Claims</TableHead>
                      <TableHead className="text-gray-300">Gross</TableHead>
                      <TableHead className="text-gray-300">Commission (20%)</TableHead>
                      <TableHead className="text-gray-300">Net To You</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground p-4">Loading…</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-gray-400 p-4">No upcoming payments yet. Once claims are approved with payout dates, they will appear here.</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.map((g) => (
                      <TableRow key={g.key} className="hover:bg-white/5">
                        <TableCell className="whitespace-nowrap font-medium text-gray-100">{g.label}</TableCell>
                        <TableCell>{g.count}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(g.gross, currency)}</TableCell>
                        <TableCell>{formatCurrency(g.commission, currency)}</TableCell>
                        <TableCell className="text-[#66ff99] font-semibold">{formatCurrency(g.net, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
