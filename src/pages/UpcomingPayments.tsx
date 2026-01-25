import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { LayoutDashboard, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User, Plug, Box, Gift, NotebookPen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
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
  // Optional properties for pipeline calculations
  amount?: number;
  claim_amount?: number;
  actual_payout_amount?: number;
  estimated_value?: number;
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function getFilingStatusMarker(status?: string) {
  if (!status) return <span className="text-gray-300 text-xs font-mono">—</span>;

  const config: Record<string, { dot: string; label: string }> = {
    filed: { dot: 'bg-blue-500', label: 'FILED' },
    filing: { dot: 'bg-amber-500', label: 'FILING' },
    retrying: { dot: 'bg-purple-500', label: 'RETRYING' },
    failed: { dot: 'bg-red-500', label: 'FAILED' },
    pending: { dot: 'bg-gray-400', label: 'PENDING' }
  };

  const { dot, label } = config[status.toLowerCase()] || config.pending;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="text-xs font-bold text-gray-900 font-mono">{label}</span>
    </div>
  );
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
        // Fetch dispute cases as the PRIMARY data source - no fallbacks/mocks
        const casesRes = await api.getDisputeCases({ limit: 500 });

        if (!cancelled) {
          if (casesRes.ok && casesRes.data?.cases && casesRes.data.cases.length > 0) {
            const cases = casesRes.data.cases;
            setDisputeCases(cases);

            // Map dispute cases to RecoveryClaim format
            const mapped = cases.map((c: any) => ({
              id: c.id,
              created: c.created_at || c.created,
              type: c.case_type || c.dispute_type || 'unknown',
              status: c.status || 'pending',
              guaranteedAmount: parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0,
              expectedPayoutDate: (c.expected_payout_date ?? c.expectedPayoutDate ?? null) as string | null,
              currency: (c.currency ?? 'USD') as string,
              filing_status: c.filing_status,
              amazon_case_id: c.amazon_case_id || c.provider_case_id,
              case_id: c.id,
            })) as RecoveryClaim[];

            setClaims(mapped);
            const firstWithCurrency = (mapped.find(c => !!c.currency)?.currency) || 'USD';
            setCurrency(firstWithCurrency);
            setErrorMessage(null);

            console.log('[UpcomingPayments] Loaded', mapped.length, 'dispute cases');
          } else {
            // No dispute cases found - show empty state (no mock data!)
            console.log('[UpcomingPayments] No dispute cases found');
            setClaims([]);
            setDisputeCases([]);
            setErrorMessage(null);
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error('Failed to load dispute cases:', error);
          const status = error?.status || error?.response?.status;
          if (status === 401) {
            setErrorMessage('Session expired. Please refresh or reconnect your Amazon account.');
          } else {
            toast({
              title: 'Could not load payment recoveries',
              description: error?.message || 'Please try again later.'
            });
            setErrorMessage(error?.message || 'We could not load payment data. Please try again shortly.');
          }
          setClaims([]);
          setDisputeCases([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast, reloadToken]);

  const upcomingGroups = useMemo(() => {
    const groups: Record<string, RecoveryClaim[]> = {};

    for (const c of claims) {
      // Consider claims scheduled for the future or not yet paid as "upcoming"
      const isPaid = c.status?.toLowerCase() === 'paid';
      const dt = c.expectedPayoutDate ? new Date(c.expectedPayoutDate) : null;

      // Show all unpaid claims, even if expected payout date has passed (Overdue)
      if (!isPaid) {
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
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-gray-700">

            {/* Header */}
            <div className="mb-10 flex items-end justify-between border-b border-gray-100 pb-8">
              <div>
                <h1 className="text-xl font-light text-gray-900 tracking-tight">Payment Recoveries</h1>
                <p className="text-xs text-gray-400 mt-1 font-mono">PROJECTED PAYOUTS</p>
              </div>
            </div>

            {/* Payment Recoveries Card */}
            <div className="bg-white border border-gray-200 rounded-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-medium text-gray-900">Recovery Overview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Projected recoveries based on claim status</p>
              </div>
              <div className="p-6">
                {errorMessage && (
                  <div className="mb-4 border border-amber-200 bg-amber-50 text-amber-800 text-xs p-3 flex flex-wrap items-center gap-3">
                    <span className="flex-1">{errorMessage}</span>
                    <button
                      className="px-3 py-1.5 text-xs text-amber-800 border border-amber-300 bg-white hover:bg-amber-50 transition-colors"
                      onClick={() => setReloadToken((token) => token + 1)}
                      disabled={loading}>
                      Retry
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-100 italic-divider">
                  <div className="p-6 bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold mb-2">Next Expected Payout</div>
                    <div className="text-2xl font-light text-gray-900 font-mono tracking-tight">{nextPayout ? formatCurrency(nextPayout.gross, currency) : formatCurrency(0, currency)}</div>
                    <div className="text-xs text-gray-500 mt-2 font-mono">{nextPayout ? nextPayout.label : '—'}</div>
                  </div>
                  <div className="p-6 border-l border-gray-100 bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold mb-2">This Month (Projected)</div>
                    <div className="text-2xl font-light text-gray-900 font-mono tracking-tight">{formatCurrency(monthTotals.gross, currency)}</div>
                    <div className="text-xs text-gray-500 mt-2 font-mono">VOL.{monthTotals.count} CLAIMS</div>
                  </div>
                  <div className="p-6 border-l border-gray-100 bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold mb-2">Net To You (Projected)</div>
                    <div className="text-2xl font-light text-emerald-600 font-mono tracking-tight">{formatCurrency(monthTotals.net, currency)}</div>
                    <div className="text-xs text-gray-500 mt-2 font-mono">AFTR 20% COMM.</div>
                  </div>
                </div>

                {/* Pipeline Summary */}
                {pipelineStages.totalInPipeline > 0 && (
                  <div className="mt-8 p-6 bg-gray-900 text-white relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                      <BarChart3 className="h-32 w-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs text-gray-400 font-bold mb-1">Total Pipeline Liquidity</div>
                      <div className="text-3xl font-light text-white font-mono tracking-tight">{formatCurrency(pipelineStages.totalInPipeline, currency)}</div>
                      <div className="text-xs text-gray-500 mt-2 font-mono">
                        AGGREGATE: {pipelineStages.detected.count + pipelineStages.ready.count + pipelineStages.pending.count + pipelineStages.approved.count} ENTITIES IN PROCESS
                      </div>
                    </div>
                  </div>
                )}

                {/* Pipeline Stage Cards */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-0 border border-gray-100">
                  <div className="p-4 border-r border-gray-100">
                    <div className="text-xs text-gray-400 font-bold mb-1">Detected</div>
                    <div className="text-[13px] font-bold text-gray-900 font-mono">{formatCurrency(pipelineStages.detected.amount, currency)}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono tracking-tighter">{pipelineStages.detected.count} REC</div>
                  </div>
                  <div className="p-4 border-r border-gray-100">
                    <div className="text-xs text-gray-400 font-bold mb-1">Ready</div>
                    <div className="text-[13px] font-bold text-gray-900 font-mono">{formatCurrency(pipelineStages.ready.amount, currency)}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono tracking-tighter">{pipelineStages.ready.count} REC</div>
                  </div>
                  <div className="p-4 border-r border-gray-100">
                    <div className="text-xs text-gray-400 font-bold mb-1">Pending</div>
                    <div className="text-[13px] font-bold text-gray-900 font-mono">{formatCurrency(pipelineStages.pending.amount, currency)}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono tracking-tighter">{pipelineStages.pending.count} REC</div>
                  </div>
                  <div className="p-4 border-r border-gray-100">
                    <div className="text-xs text-gray-400 font-bold mb-1">Approved</div>
                    <div className="text-[13px] font-bold text-gray-900 font-mono">{formatCurrency(pipelineStages.approved.amount, currency)}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono tracking-tighter">{pipelineStages.approved.count} REC</div>
                  </div>
                  <div className="p-4 bg-gray-50/50">
                    <div className="text-xs text-gray-400 font-bold mb-1">Paid</div>
                    <div className="text-[13px] font-bold text-emerald-600 font-mono">{formatCurrency(pipelineStages.paid.amount, currency)}</div>
                    <div className="text-xs text-gray-400 mt-1 font-mono tracking-tighter">{pipelineStages.paid.count} REC</div>
                  </div>
                </div>

                {/* Professional Text Timeline */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="text-sm font-medium text-gray-700 mb-4">Pipeline Status</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-3">
                      <span className="w-24 text-gray-500 flex-shrink-0 text-xs">Detected</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.detected.count > 0
                          ? `${pipelineStages.detected.count} claims (${formatCurrency(pipelineStages.detected.amount, currency)}) awaiting evidence`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-24 text-gray-500 flex-shrink-0 text-xs">Ready</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.ready.count > 0
                          ? `${pipelineStages.ready.count} claims (${formatCurrency(pipelineStages.ready.amount, currency)}) ready for submission`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-24 text-gray-500 flex-shrink-0 text-xs">Pending</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.pending.count > 0
                          ? `${pipelineStages.pending.count} claims (${formatCurrency(pipelineStages.pending.amount, currency)}) awaiting Amazon`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-24 text-gray-500 flex-shrink-0 text-xs">Approved</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.approved.count > 0
                          ? `${pipelineStages.approved.count} claims (${formatCurrency(pipelineStages.approved.amount, currency)}) processing`
                          : 'No claims at this stage'}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-24 text-gray-500 flex-shrink-0 text-xs">Paid</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">
                        {pipelineStages.paid.count > 0
                          ? `${pipelineStages.paid.count} claims (${formatCurrency(pipelineStages.paid.amount, currency)}) recovered`
                          : 'No payments received yet'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button className="px-4 py-2 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors" onClick={exportCsv}>Export CSV</button>
                </div>
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-medium text-gray-900">Payment Schedule</h2>
                <p className="text-xs text-gray-500 mt-0.5">Daily rollup of expected payouts</p>
              </div>
              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-900 hover:bg-gray-900 border-none">
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6">Payout Date</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6 text-center">Claims</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6">Gross</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6">Commission</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6">Net</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6">Status</TableHead>
                      <TableHead className="text-xs font-bold text-gray-400 py-4 px-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm font-mono text-gray-500 p-8 text-center">Initialising Secure Data Feed...</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-sm font-mono text-gray-500 p-8 text-center">Zero (0) Records Detected for Projection</TableCell>
                      </TableRow>
                    )}
                    {!loading && upcomingGroups.map((g) => (
                      <TableRow key={g.key} className="hover:bg-gray-50/50 border-b border-gray-100 group relative transition-colors">
                        <TableCell className="whitespace-nowrap font-bold text-sm text-gray-900 py-4 px-6 font-mono tracking-tighter relative">
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {g.label.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm text-center text-gray-600 py-4 px-6 font-mono font-bold">{g.count}</TableCell>
                        <TableCell className="text-sm font-bold text-gray-900 py-4 px-6 font-mono">{formatCurrency(g.gross, currency)}</TableCell>
                        <TableCell className="text-sm text-gray-500 py-4 px-6 font-mono">{formatCurrency(g.commission, currency)}</TableCell>
                        <TableCell className="text-sm text-emerald-600 font-bold py-4 px-6 font-mono">{formatCurrency(g.net, currency)}</TableCell>
                        <TableCell className="py-4 px-6">
                          {g.claims.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {g.claims.slice(0, 2).map((claim: RecoveryClaim) => (
                                <div key={claim.id}>{getFilingStatusMarker(claim.filing_status)}</div>
                              ))}
                              {g.claims.length > 2 && (
                                <span className="text-xs text-gray-400 font-mono ml-3.5">
                                  + {g.claims.length - 2} ADDTL RECORDS
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          {g.claims.length > 0 && g.claims[0].case_id && (
                            <Button asChild variant="ghost" className="h-8 rounded-none border border-gray-200 text-xs font-bold hover:bg-gray-900 hover:text-white transition-all">
                              <Link to={`/recoveries?tab=cases`}>View Cases</Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
