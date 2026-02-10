import { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  FileText,
  Download,
  AlertCircle,
  Clock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';

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


export default function UpcomingPayments() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || 'default';
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

  const [downloading, setDownloading] = useState(false);

  const exportPdf = async () => {
    setDownloading(true);
    try {
      const apiUrl = api.buildApiUrl('/api/disputes/payments/report');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || 'demo-user',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
        body: JSON.stringify({
          groups: upcomingGroups.map(g => ({
            label: g.label,
            count: g.count,
            gross: g.gross,
            commission: g.commission,
            net: g.net,
          })),
          pipeline: pipelineStages,
          monthTotals,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'upcoming-payments-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: 'Report Downloaded', description: 'upcoming-payments-report.pdf has been saved.' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: err.message || 'Unable to generate payment report',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageLayout title="Upcoming Payments" midnight>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-[1600px] mx-auto px-8 py-12">
          {/* Analysis Header */}
          <div className="flex flex-col gap-1 mb-12 border-b border-white/5 pb-10">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-4xl font-light text-white tracking-tight font-serif italic">Payment <span className="text-white/40 not-italic">Summary</span></h1>
            </div>
            <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
              Estimated payments and payout projections.
            </p>
          </div>

          {/* Execution Panels (Summary Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-6 transition-all hover:border-emerald-500/30 overflow-hidden backdrop-blur-xl">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Next payout</span>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                    {nextPayout ? nextPayout.label.toUpperCase() : 'No pending settlement'}
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold tracking-tighter text-white">
                  {nextPayout ? formatCurrency(nextPayout.gross, currency) : formatCurrency(0, currency)}
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] w-[65%]" />
                </div>
              </div>
            </div>

            <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-6 transition-all hover:border-emerald-500/30 overflow-hidden text-white backdrop-blur-xl">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Monthly Projection</span>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                    Current billing cycle
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold tracking-tighter text-white">
                  {formatCurrency(monthTotals.gross, currency)}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  {monthTotals.count} claims sampled
                </div>
              </div>
            </div>

            <div className="group relative bg-black/40 border border-white/10 rounded-2xl p-6 transition-all hover:border-emerald-500/40 overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-xl">
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-500/60 uppercase tracking-widest">Net Recovery</span>
                  <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                    After service fee
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold tracking-tighter text-emerald-500">
                  {formatCurrency(monthTotals.net, currency)}
                </div>
                <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded inline-block">
                  Stable projection
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline progress (Pipeline Summary) */}
          <div className="relative bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl mb-12">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em]">Pipeline Progress</span>
                  <h2 className="text-lg font-serif font-medium text-white uppercase tracking-wider italic">Amount by Stage</h2>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Total in pipeline</div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter italic">{formatCurrency(pipelineStages.totalInPipeline, currency)}</div>
                  </div>
                  <div className="h-10 w-[1px] bg-white/5" />
                  <button
                    onClick={exportPdf}
                    disabled={downloading}
                    className="p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all text-white/40 hover:text-emerald-500 disabled:opacity-50"
                  >
                    {downloading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 border border-white/5 rounded-xl overflow-hidden">
                {[
                  { label: 'DETECTED', stage: pipelineStages.detected },
                  { label: 'READY', stage: pipelineStages.ready },
                  { label: 'PENDING', stage: pipelineStages.pending },
                  { label: 'APPROVED', stage: pipelineStages.approved },
                  { label: 'PAID', stage: pipelineStages.paid, highlight: true },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={cn(
                      "p-6 flex flex-col gap-3 group transition-all",
                      idx !== 4 && "border-r border-white/5",
                      item.highlight ? "bg-emerald-500/[0.03]" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                      <div className={cn("text-lg font-mono font-bold tracking-tighter", item.highlight ? "text-emerald-500" : "text-white")}>
                        {formatCurrency(item.stage.amount, currency)}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                      {item.stage.count} claims
                    </div>
                  </div>
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-mono text-rose-200 uppercase tracking-tighter">
                      Connection Error: {errorMessage}
                    </span>
                  </div>
                  <button
                    onClick={() => setReloadToken((token) => token + 1)}
                    className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white hover:bg-rose-500/40 transition-all"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Recoveries (Table) */}
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em]">Recent Recoveries</span>
                <h3 className="text-sm font-serif font-medium text-white tracking-wide uppercase">Payout Details</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/5 hover:bg-transparent">
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Payout Date</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest text-center">Claims</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Gross Value</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Fee</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Net Credit</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-emerald-500/30" />
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">Synchronizing...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : upcomingGroups.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={7} className="h-32 text-center font-mono text-[11px] text-white/20 uppercase tracking-widest">
                        No upcoming payments identified
                      </TableCell>
                    </TableRow>
                  ) : (
                    upcomingGroups.map((g) => (
                      <TableRow key={g.key} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                        <TableCell className="py-4 px-6 font-mono text-[11px] font-bold text-white uppercase tracking-tighter">
                          {g.label}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center font-mono text-[11px] text-white/60">
                          {g.count.toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="py-4 px-6 font-mono text-[11px] font-bold text-white">
                          {formatCurrency(g.gross, currency)}
                        </TableCell>
                        <TableCell className="py-4 px-6 font-mono text-[11px] text-white/40">
                          {formatCurrency(g.commission, currency)}
                        </TableCell>
                        <TableCell className="py-4 px-6 font-mono text-[11px] font-bold text-emerald-500">
                          {formatCurrency(g.net, currency)}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-1.5">
                            {g.claims.slice(0, 1).map((claim: RecoveryClaim) => (
                              <div key={claim.id} className="flex items-center gap-2">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                  claim.filing_status === 'filed' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/30"
                                )} />
                                <span className="text-[9px] font-mono text-white/60 uppercase tracking-widest">
                                  {(claim.filing_status || claim.status || 'UNKNOWN').toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {g.claims.length > 1 && (
                              <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest ml-3.5">
                                + {g.claims.length - 1} Additional claims
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <Button
                            asChild
                            variant="ghost"
                            className="h-8 px-4 border border-white/5 bg-white/[0.02] text-[10px] font-mono font-bold uppercase tracking-widest hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                          >
                            <Link to={tenantRoute(activeTenantSlug, '/recoveries?tab=cases')}>VIEW DETAILS</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center border-t border-white/5 pt-8 mb-12">
            <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
              Account Statement • Sync Status: Active
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
