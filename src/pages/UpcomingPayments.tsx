import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  BarChart3,
  FileText,
  ArrowUpRight,
  Shield,
  Activity,
  Lock,
  Cpu,
  TrendingUp,
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
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const [claims, setClaims] = useState<RecoveryClaim[]>([]);
  const [disputeCases, setDisputeCases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('USD');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

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
    <div className="flex min-h-screen bg-[#070707] text-white selection:bg-emerald-500/30 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar
          sidebarCollapsed={isSidebarCollapsed}
        />

        <main className={cn(
          "flex-1 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out",
          isSidebarCollapsed ? "ml-20" : "ml-64"
        )}>
          <div className="p-8 max-w-[1600px] mx-auto space-y-8">

            {/* Analysis Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-serif font-medium tracking-tight text-white uppercase">Execution_Summary</h1>
              </div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] ml-12">
                Operational_Liquidity // Settlement_Projection_v4.2
              </p>
            </div>

            {/* Execution Panels (Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative bg-[#0c0c0c] border border-white/5 rounded-xl p-6 transition-all hover:border-emerald-500/30 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-widest">NEXT_EXPECTED_PAYOUT</span>
                    <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                      {nextPayout ? nextPayout.label.toUpperCase() : 'NO_PENDING_SETTLEMENT'}
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

              <div className="group relative bg-[#0c0c0c] border border-white/5 rounded-xl p-6 transition-all hover:border-emerald-500/30 overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-widest">MONTH_PROJECTION</span>
                    <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                      CURRENT_BILLING_CYCLE
                    </span>
                  </div>
                  <div className="text-3xl font-mono font-bold tracking-tighter text-white">
                    {formatCurrency(monthTotals.gross, currency)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    VOL.{monthTotals.count}_CLAIMS_SAMPLED
                  </div>
                </div>
              </div>

              <div className="group relative bg-[#0c0c0c] border border-white/5 rounded-xl p-6 transition-all hover:border-emerald-500/40 overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Shield className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">NET_RECOVERY_LIQUIDITY</span>
                    <span className="text-xs font-mono text-white/40 uppercase tracking-tighter">
                      AFTER_SERVICE_FEE_OPTIMIZATION
                    </span>
                  </div>
                  <div className="text-3xl font-mono font-bold tracking-tighter text-emerald-500">
                    {formatCurrency(monthTotals.net, currency)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded inline-block">
                    PROJECTION_STABLE_80%_RETENTION
                  </div>
                </div>
              </div>
            </div>

            {/* Capital Flow Control (Pipeline Summary) */}
            <div className="relative bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-[0.3em]">PIPELINE_LIQUIDITY_MAP</span>
                    <h2 className="text-lg font-serif font-medium text-white uppercase tracking-wider italic">Capital_Flow_Velocity</h2>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">TOTAL_IN_PIPELINE</div>
                      <div className="text-2xl font-mono font-bold text-white tracking-tighter italic">{formatCurrency(pipelineStages.totalInPipeline, currency)}</div>
                    </div>
                    <div className="h-10 w-[1px] bg-white/5" />
                    <button
                      onClick={exportCsv}
                      className="p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all text-white/40 hover:text-emerald-500"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 border border-white/5 rounded-xl overflow-hidden">
                  {[
                    { label: 'DETECTED', stage: pipelineStages.detected, icon: Cpu },
                    { label: 'READY', stage: pipelineStages.ready, icon: Lock },
                    { label: 'PENDING', stage: pipelineStages.pending, icon: Activity },
                    { label: 'APPROVED', stage: pipelineStages.approved, icon: ArrowUpRight },
                    { label: 'PAID', stage: pipelineStages.paid, icon: Shield, highlight: true },
                  ].map((item, idx) => (
                    <div
                      key={item.label}
                      className={cn(
                        "p-6 flex flex-col gap-3 group transition-all",
                        idx !== 4 && "border-r border-white/5",
                        item.highlight ? "bg-emerald-500/[0.03]" : "hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <item.icon className={cn("h-4 w-4", item.highlight ? "text-emerald-500" : "text-white/20 group-hover:text-white/40")} />
                        <span className="text-[9px] font-mono text-white/10 uppercase font-bold tracking-widest">STEP_0{idx + 1}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                        <div className={cn("text-lg font-mono font-bold tracking-tighter", item.highlight ? "text-emerald-500" : "text-white")}>
                          {formatCurrency(item.stage.amount, currency)}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                        {item.stage.count}_ENTITY_NODES
                      </div>
                    </div>
                  ))}
                </div>

                {errorMessage && (
                  <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                      <span className="text-xs font-mono text-rose-200 uppercase tracking-tighter">
                        FAULT_DETECTED: {errorMessage}
                      </span>
                    </div>
                    <button
                      onClick={() => setReloadToken((token) => token + 1)}
                      className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-white hover:bg-rose-500/40 transition-all"
                    >
                      REBOOT_FEED
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Settlement Ledger (Table) */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-500/50 uppercase tracking-[0.2em]">SETTLEMENT_LEDGER</span>
                  <h3 className="text-sm font-serif font-medium text-white tracking-wide uppercase">Audit_Registry</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">PAYOUT_DATE</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest text-center">CLAIM_COUNT</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">GROSS_VALUE</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">SERVICE_FEE</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">NET_CREDIT</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">NODE_STATUS</TableHead>
                      <TableHead className="py-4 px-6 text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest text-right">ACTION_OVERRIDE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="hover:bg-transparent border-0">
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin text-emerald-500/30" />
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">SYNCHRONIZING_FED_REGISTRY...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : upcomingGroups.length === 0 ? (
                      <TableRow className="hover:bg-transparent border-0">
                        <TableCell colSpan={7} className="h-32 text-center font-mono text-[11px] text-white/20 uppercase tracking-widest">
                          ZERO_SETTLEMENT_NODES_IDENTIFIED_IN_LOCAL_BUFFER
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
                                  + {g.claims.length - 1} ADDITIONAL_NODES
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
                              <Link to="/recoveries?tab=cases">DISPUTE_CONSOLE</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
