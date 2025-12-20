import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { recoveryApi } from '@/lib/recoveryApi';
import { api } from '@/lib/api';
import { detectionApi } from '@/lib/detectionApi';
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
                guaranteedAmount: c.guaranteedAmount ?? c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? c.estimated_value ?? 0,
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
            // Fallback: Try detection results if recoveryApi returns empty
            console.log('[UpcomingPayments] No data from recoveryApi, trying detectionApi...');
            try {
              const detectionRes = await detectionApi.getDetectionResults({ limit: 100 });
              if (detectionRes?.results && detectionRes.results.length > 0) {
                console.log('[UpcomingPayments] Fallback: Got', detectionRes.results.length, 'detection results');
                const mapped = detectionRes.results.map((d: any) => ({
                  id: d.id,
                  created: d.created_at || d.discovery_date,
                  type: d.anomaly_type || 'detection',
                  status: d.status || 'Open',
                  guaranteedAmount: parseFloat(String(d.estimated_value ?? 0)) || 0,
                  expectedPayoutDate: null,
                  currency: d.currency || 'USD',
                  filing_status: null,
                  amazon_case_id: null,
                  case_id: null,
                })) as RecoveryClaim[];
                setClaims(mapped);
                const firstWithCurrency = (mapped.find(c => !!c.currency)?.currency) || 'USD';
                setCurrency(firstWithCurrency);
                setErrorMessage(null);
              } else {
                setClaims([]);
                setErrorMessage(null);
              }
            } catch (detectionErr) {
              console.warn('[UpcomingPayments] Detection fallback also failed:', detectionErr);
              setClaims([]);
              setErrorMessage(null);
            }
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

    // If no claims have dated payouts, use total claims value as projection
    if (gross === 0 && claims.length > 0) {
      gross = claims.reduce((sum, c) => sum + parseFloat(String(c.guaranteedAmount ?? 0)) || 0, 0);
      count = claims.length;
    }

    return { gross, count, commission: gross * 0.2, net: Math.max(gross * 0.8, 0) };
  }, [upcomingGroups, claims]);

  // Pipeline stage calculations for Financial Gravity retention
  const pipelineStages = useMemo(() => {
    const stages = {
      detected: { count: 0, amount: 0, label: 'Detected' },
      ready: { count: 0, amount: 0, label: 'Ready to File' },
      pending: { count: 0, amount: 0, label: 'Pending Amazon' },
      approved: { count: 0, amount: 0, label: 'Approved' },
      paid: { count: 0, amount: 0, label: 'Paid' },
    };

    for (const c of claims) {
      const status = (c.status || '').toLowerCase();
      const filingStatus = (c.filing_status || '').toLowerCase();
      const amount = parseFloat(String(c.guaranteedAmount ?? c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? c.estimated_value ?? 0)) || 0;

      if (status === 'paid' || status === 'paid out') {
        stages.paid.count++;
        stages.paid.amount += amount;
      } else if (status === 'approved') {
        stages.approved.count++;
        stages.approved.amount += amount;
      } else if (status === 'submitted' || status === 'under review' || filingStatus === 'filed') {
        stages.pending.count++;
        stages.pending.amount += amount;
      } else if (filingStatus === 'ready' || status === 'guaranteed' || status === 'ready') {
        stages.ready.count++;
        stages.ready.amount += amount;
      } else {
        // Open, new, or no status = detected
        stages.detected.count++;
        stages.detected.amount += amount;
      }
    }

    // Calculate total in pipeline (not yet paid)
    const totalInPipeline = stages.detected.amount + stages.ready.amount + stages.pending.amount + stages.approved.amount;

    return { ...stages, totalInPipeline };
  }, [claims]);

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

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Payment Recoveries</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-0.5">Projected recoveries based on claim status and expected payout dates</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {errorMessage && (
                  <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-900 text-xs p-3 flex flex-wrap items-center gap-3">
                    <span className="flex-1">{errorMessage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white text-amber-900 border-amber-200 hover:bg-amber-50 text-xs"
                      onClick={() => setReloadToken((token) => token + 1)}
                      disabled={loading}
                    >
                      Retry
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wide">Next Expected Payout</div>
                    <div className="text-base font-medium text-gray-900 mt-1">{nextPayout ? formatCurrency(nextPayout.gross, currency) : formatCurrency(0, currency)}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{nextPayout ? nextPayout.label : '—'}</div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wide">This Month (Projected)</div>
                    <div className="text-base font-medium text-emerald-600 mt-1">{formatCurrency(monthTotals.gross, currency)}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">Across {monthTotals.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wide">Net To You (Projected)</div>
                    <div className="text-base font-medium text-emerald-600 mt-1">{formatCurrency(monthTotals.net, currency)}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">After 20% commission</div>
                  </div>
                </div>

                {/* Pipeline Summary - Total in Processing */}
                {pipelineStages.totalInPipeline > 0 && (
                  <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs text-gray-700">Total Currently Processing</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(pipelineStages.totalInPipeline, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">across {pipelineStages.detected.count + pipelineStages.ready.count + pipelineStages.pending.count + pipelineStages.approved.count} claims in various stages</div>
                  </div>
                )}

                {/* Pipeline Stage Cards */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="rounded-md border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Detected</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(pipelineStages.detected.amount, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pipelineStages.detected.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ready to File</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(pipelineStages.ready.amount, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pipelineStages.ready.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Pending Amazon</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(pipelineStages.pending.amount, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pipelineStages.pending.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">Approved</div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(pipelineStages.approved.amount, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pipelineStages.approved.count} claims</div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-2 bg-emerald-50">
                    <div className="text-[10px] text-gray-600 uppercase tracking-wide">Paid</div>
                    <div className="text-sm font-medium text-emerald-700 mt-1">{formatCurrency(pipelineStages.paid.amount, currency)}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{pipelineStages.paid.count} claims</div>
                  </div>
                </div>

                {/* Professional Text Timeline */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="text-sm font-medium text-gray-700 mb-4">Pipeline Status</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="w-28 text-gray-500 flex-shrink-0">Detected</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.detected.count > 0
                          ? `${pipelineStages.detected.count} claims (${formatCurrency(pipelineStages.detected.amount, currency)}) awaiting evidence`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-28 text-gray-500 flex-shrink-0">Ready to File</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.ready.count > 0
                          ? `${pipelineStages.ready.count} claims (${formatCurrency(pipelineStages.ready.amount, currency)}) ready for submission`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-28 text-gray-500 flex-shrink-0">Pending</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.pending.count > 0
                          ? `${pipelineStages.pending.count} claims (${formatCurrency(pipelineStages.pending.amount, currency)}) awaiting Amazon response`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-28 text-gray-500 flex-shrink-0">Approved</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.approved.count > 0
                          ? `${pipelineStages.approved.count} claims (${formatCurrency(pipelineStages.approved.amount, currency)}) payment processing`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-28 text-gray-500 flex-shrink-0">Paid</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.paid.count > 0
                          ? `${pipelineStages.paid.count} claims (${formatCurrency(pipelineStages.paid.amount, currency)}) recovered`
                          : 'No payments received yet'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Button variant="outline" className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50" onClick={exportCsv}>Export CSV</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Schedule</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-0.5">Daily rollup of expected payouts; dates may change based on Amazon processing</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Payout Date</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Claims</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Gross</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Commission (20%)</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Net To You</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Filing Status</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-xs text-gray-600 p-4">Loading…</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-xs text-gray-600 p-4">No upcoming payments yet. Once claims are approved with payout dates, they will appear here.</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.map((g) => (
                      <TableRow key={g.key} className="hover:bg-gray-50 border-b border-gray-200">
                        <TableCell className="whitespace-nowrap font-medium text-xs text-gray-900 py-2">{g.label}</TableCell>
                        <TableCell className="text-xs text-gray-700 py-2">{g.count}</TableCell>
                        <TableCell className="text-xs font-medium text-gray-900 py-2">{formatCurrency(g.gross, currency)}</TableCell>
                        <TableCell className="text-xs text-gray-700 py-2">{formatCurrency(g.commission, currency)}</TableCell>
                        <TableCell className="text-xs text-emerald-600 font-medium py-2">{formatCurrency(g.net, currency)}</TableCell>
                        <TableCell className="py-2">
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
