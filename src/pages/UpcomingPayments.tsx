import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { recoveryApi } from '@/lib/recoveryApi';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

interface RecoveryClaim {
  id: string;
  created: string;
  type: string;
  status: string;
  guaranteedAmount: number;
  expectedPayoutDate: string | null;
  currency?: string;
  filing_status?: string;
  amazon_case_id?: string;
  case_id?: string;
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function getFilingStatusBadge(status?: string) {
  if (!status) return <span className="text-gray-400 text-sm">—</span>;

  if (status === 'filed') return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Filed</Badge>;
  if (status === 'filing') return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Filing...</Badge>;
  if (status === 'retrying') return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Retrying</Badge>;
  if (status === 'failed') return <Badge className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
  return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Pending</Badge>;
}

export default function UpcomingPayments() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<RecoveryClaim[]>([]);
  const [disputeCases, setDisputeCases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('USD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Fetch both recoveries and dispute cases
        const [res, casesRes] = await Promise.all([
          recoveryApi.getRecoveries(),
          api.getDisputeCases({ limit: 100 }).catch(() => ({ ok: false, data: null }))
        ]);

        if (!cancelled) {
          // Store dispute cases
          if (casesRes.ok && casesRes.data?.cases) {
            setDisputeCases(casesRes.data.cases);
          }

          if (Array.isArray(res) && res.length > 0) {
            // Map API response to frontend format
            const mapped = (res as any[]).map((c) => {
              // Find matching dispute case
              const disputeCase = casesRes.ok && casesRes.data?.cases
                ? casesRes.data.cases.find((dc: any) => dc.claim_id === c.id)
                : null;

              return {
                id: c.id || c.claim_id,
                created: c.created || c.created_at,
                type: c.type || c.dispute_type || 'unknown',
                status: c.status,
                guaranteedAmount: c.guaranteedAmount ?? c.amount ?? 0,
                expectedPayoutDate: (c.expectedPayoutDate ?? c.expected_payout_date ?? null) as string | null,
                currency: (c.currency ?? 'USD') as string,
                // Add dispute case data
                filing_status: disputeCase?.filing_status,
                amazon_case_id: disputeCase?.amazon_case_id,
                case_id: disputeCase?.id,
              };
            }) as RecoveryClaim[];
            setClaims(mapped);
            const firstWithCurrency = (mapped.find(c => !!c.currency)?.currency) || 'USD';
            setCurrency(firstWithCurrency);
            setErrorMessage(null);
          } else {
            setClaims([]);
            setErrorMessage(null);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load upcoming payments:', error);
          const status = error?.status || error?.response?.status;
          if (status === 401) {
            setErrorMessage('Session expired. Please refresh or reconnect your Amazon account to see upcoming payouts.');
          } else {
            toast({
              title: 'Could not load upcoming payments',
              description: error?.message || 'Please try again later.'
            });
            setErrorMessage(error?.message || 'We could not load upcoming payouts. Please try again shortly.');
          }
          setClaims([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast, reloadToken]);

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
    <PageLayout title="Payment Recoveries">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-700 space-y-8">

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 font-medium">Payment Recoveries</CardTitle>
                <CardDescription className="text-gray-600">Projected recoveries based on claim status and expected payout dates</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {errorMessage && (
                  <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-900 text-sm p-3 flex flex-wrap items-center gap-3">
                    <span className="flex-1">{errorMessage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-amber-900 border-amber-200 hover:bg-amber-50"
                      onClick={() => setReloadToken((token) => token + 1)}
                      disabled={loading}
                    >
                      Retry
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-600">Next Expected Payout</div>
                    <div className="text-xl font-medium text-gray-900 mt-1">{nextPayout ? formatCurrency(nextPayout.gross, currency) : formatCurrency(0, currency)}</div>
                    <div className="text-[11px] text-gray-600 mt-1">{nextPayout ? nextPayout.label : '—'}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-600">This Month (Projected)</div>
                    <div className="text-xl font-medium text-emerald-600 mt-1">{formatCurrency(monthTotals.gross, currency)}</div>
                    <div className="text-[11px] text-gray-600 mt-1">Across {monthTotals.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <div className="text-xs text-gray-600">Net To You (Projected)</div>
                    <div className="text-xl font-medium text-emerald-600 mt-1">{formatCurrency(monthTotals.net, currency)}</div>
                    <div className="text-[11px] text-gray-600 mt-1">After 20% commission</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={exportCsv}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 font-medium">Schedule</CardTitle>
                <CardDescription className="text-gray-600">Daily rollup of expected payouts; dates may change based on Amazon processing</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[#36454F]">Payout Date</TableHead>
                      <TableHead className="text-[#36454F]">Claims</TableHead>
                      <TableHead className="text-[#36454F]">Gross</TableHead>
                      <TableHead className="text-[#36454F]">Commission (20%)</TableHead>
                      <TableHead className="text-[#36454F]">Net To You</TableHead>
                      <TableHead className="text-[#36454F]">Filing Status</TableHead>
                      <TableHead className="text-[#36454F]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm text-gray-600 p-4">Loading…</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm text-gray-600 p-4">No upcoming payments yet. Once claims are approved with payout dates, they will appear here.</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.map((g) => (
                      <TableRow key={g.key} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="whitespace-nowrap font-medium text-gray-900">{g.label}</TableCell>
                        <TableCell className="text-gray-700">{g.count}</TableCell>
                        <TableCell className="font-medium text-gray-900">{formatCurrency(g.gross, currency)}</TableCell>
                        <TableCell className="text-gray-700">{formatCurrency(g.commission, currency)}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{formatCurrency(g.net, currency)}</TableCell>
                        <TableCell>
                          {g.claims.length > 0 && (
                            <div className="flex flex-col gap-1">
                              {g.claims.slice(0, 2).map((claim: RecoveryClaim) => (
                                <div key={claim.id}>{getFilingStatusBadge(claim.filing_status)}</div>
                              ))}
                              {g.claims.length > 2 && <span className="text-xs text-gray-500">+{g.claims.length - 2} more</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {g.claims.length > 0 && g.claims[0].case_id && (
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/recoveries?tab=cases`}>View Cases</Link>
                            </Button>
                          )}
                        </TableCell>
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
