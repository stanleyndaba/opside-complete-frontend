import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, BarChart3, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud, ArrowRight, Plus, CheckCircle, RefreshCw, RotateCcw, Download, Bell, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Live dashboard recoveries metrics (Continuous Sync UX)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const [submittedClaimsCount, setSubmittedClaimsCount] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);
  const [pendingRecoveryAmount, setPendingRecoveryAmount] = useState<number | null>(null);
  const [approvedRecoveryAmount, setApprovedRecoveryAmount] = useState<number | null>(null);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [approvedClaimsThisMonth, setApprovedClaimsThisMonth] = useState<number | null>(null);
  const [showEvidencePrompt, setShowEvidencePrompt] = useState<boolean>(false);
  const [quickActionsEditOpen, setQuickActionsEditOpen] = useState<boolean>(false);
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const { toast } = useToast();
  const [selectedQuickActions, setSelectedQuickActions] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clario.quickActions') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['ingest_now', 'invite_teammate'];
    } catch { return ['ingest_now', 'invite_teammate']; }
  });
  const QUICK_ACTIONS: Array<{ id: string; label: string }> = [
    { id: 'connect_evidence', label: 'Connect evidence sources' },
    { id: 'review_high_conf', label: 'Review high‑confidence cases' },
    { id: 'resolve_new', label: 'Resolve new opportunities' },
    { id: 'run_detector', label: 'Run detector' },
    { id: 'ingest_now', label: 'Ingest documents now' },
    { id: 'smart_sync', label: 'Smart Inventory Sync' },
    { id: 'upcoming_payments', label: 'Upcoming payments' },
    { id: 'export_history', label: 'Export recovery & payout history' },
    { id: 'evidence_locker', label: 'Evidence Locker' },
    { id: 'invite_teammate', label: 'Invite a teammate' },
    { id: 'configure_alerts', label: 'Configure alerts' },
    { id: 'security_setup', label: 'Security quick setup' },
  ];

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;

    async function fetchRecoveriesOnce() {
      const res = await api.getAmazonRecoveries();
      if (!active) return;
      if (res.ok && res.data) {
        setRecoveredTotal(res.data.totalAmount ?? 0);
        if (res.data.currency) setRecoveredCurrency(res.data.currency);
        if (typeof (res.data as any).claimCount === 'number') setSubmittedClaimsCount((res.data as any).claimCount);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    }

    async function fetchMetrics() {
      const res = await api.getRecoveriesMetrics();
      if (!active) return;
      if (res.ok && res.data) {
        const d: any = res.data;
        // Prefer backend fields if present; otherwise fallback to existing placeholders
        const pending = typeof d.valueInProgress === 'number' ? d.valueInProgress : (typeof d.pendingAmount === 'number' ? d.pendingAmount : null);
        const rate = typeof d.successRate === 'number' ? d.successRate : (typeof d.successRate30d === 'number' ? d.successRate30d : null);
        const approved = (
          typeof d.approvedValue === 'number' ? d.approvedValue :
          typeof d.valueApproved === 'number' ? d.valueApproved :
          typeof d.paidValue === 'number' ? d.paidValue :
          typeof d.valuePaid === 'number' ? d.valuePaid :
          typeof d.approvedAmount === 'number' ? d.approvedAmount :
          typeof d.amountApproved === 'number' ? d.amountApproved :
          null
        );
        const nextPay = (
          typeof d.nextPaymentAmount === 'number' ? d.nextPaymentAmount :
          typeof d.nextPayoutAmount === 'number' ? d.nextPayoutAmount :
          typeof d.nextPayout === 'number' ? d.nextPayout :
          typeof d.expectedPayoutAmount === 'number' ? d.expectedPayoutAmount :
          typeof d.payoutDue === 'number' ? d.payoutDue :
          null
        );
        const approvedClaimsMonth = (
          typeof d.approvedClaimsThisMonth === 'number' ? d.approvedClaimsThisMonth :
          typeof d.claimsApprovedThisMonth === 'number' ? d.claimsApprovedThisMonth :
          typeof d.approvedCountThisMonth === 'number' ? d.approvedCountThisMonth :
          typeof d.claimsApproved === 'number' ? d.claimsApproved :
          null
        );
        if (pending !== null) setPendingRecoveryAmount(pending);
        if (rate !== null) setSuccessRate(rate);
        if (approved !== null) setApprovedRecoveryAmount(approved);
        if (nextPay !== null) setNextPaymentAmount(nextPay);
        if (approvedClaimsMonth !== null) setApprovedClaimsThisMonth(approvedClaimsMonth);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    }

    // Initial fetch immediately on mount
    fetchRecoveriesOnce();
    fetchMetrics();
    // Decide whether to prompt evidence connections (Gmail/Outlook/Drive/Dropbox)
    (async () => {
      try {
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('clario.evidencePromptDismissed') === 'true' : false;
        if (dismissed) return;
        const s = await api.getIntegrationsStatus();
        if (s.ok) {
          const prov = (s.data as any)?.providerIngest || {};
          const anyConnected = Boolean(prov.gmail?.connected || prov.outlook?.connected || prov.gdrive?.connected || prov.dropbox?.connected);
          if (!anyConnected) setShowEvidencePrompt(true);
        } else {
          // If status unknown, still prompt once
          setShowEvidencePrompt(true);
        }
      } catch {
        setShowEvidencePrompt(true);
      }
    })();
    hasFetchedRef.current = true;

    // Short burst polling to show numbers populate quickly
    let polls = 0;
    pollTimer = window.setInterval(async () => {
      polls += 1;
      await fetchRecoveriesOnce();
      await fetchMetrics();
      if (polls >= 12) { // ~1 minute at 5s cadence
        if (pollTimer) window.clearInterval(pollTimer);
      }
    }, 5000) as unknown as number;

    // Listen for backend sync/detection events to refresh immediately
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/sse/status');
      es.onmessage = async (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'sync' || evt?.type === 'detection') {
            await fetchRecoveriesOnce();
            await fetchMetrics();
          }
        } catch {}
      };
    } catch {}

    return () => {
      active = false;
      if (pollTimer) window.clearInterval(pollTimer);
      if (es) es.close();
    };
  }, []);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-64';

  const computedApproved = approvedRecoveryAmount != null
    ? approvedRecoveryAmount
    : Math.max((recoveredTotal ?? 0) - (pendingRecoveryAmount ?? 0), 0);

  return (
    <div className="relative min-h-screen flex flex-col h-screen overflow-hidden platform" style={{ backgroundColor: '#0B1220' }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
      <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={'flex-1 transition-all duration-300 overflow-y-auto ' + mainClass}>
          <div className="relative pt-24">
              <div className="relative container mx-auto px-6 md:px-10 lg:px-12 pb-10 text-gray-300 space-y-8">
            <div className="rounded-2xl bg-[#111827] p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-full">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-white/5 border-white/10 text-gray-300">
                  <CardContent className="p-6">
                    <h2 className="font-brand text-lg text-gray-100 font-semibold">Welcome to Clario!</h2>
                    <p className="text-sm text-gray-400 mt-1">Your Amazon account has been connected successfully.</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-gray-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-brand text-lg text-gray-100 font-semibold">Your Recovered Value</h2>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="About recovered value"
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black text-white text-xs">
                              Your recovered profits from claim xyz.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-[24px] md:text-[28px] font-semibold mt-1 text-[#66ff99]">
                          {formatCurrency(recoveredTotal ?? 0, recoveredCurrency)}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">From approved Claims submitted</div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Next Payment</div>
                        <div className="text-xl font-semibold text-gray-100 mt-1">{formatCurrency(nextPaymentAmount ?? 0, recoveredCurrency)}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Estimated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-blue-400 mt-1 underline-offset-2 hover:underline"
                          onClick={() => navigate('/upcoming-payments')}
                          aria-label="View upcoming payments"
                        >
                          upcoming payments
                        </button>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Pending Recovery</div>
                        <div className="text-xl font-semibold text-blue-400 mt-1">{formatCurrency(pendingRecoveryAmount ?? 0, recoveredCurrency)}</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          No. of Claims: {submittedClaimsCount != null ? submittedClaimsCount : 0}
                        </div>
                        {submittedClaimsCount != null && (
                          <div className="text-[11px] text-gray-400 mt-1">{submittedClaimsCount} claims submitted</div>
                        )}
                        <div className="text-[11px] mt-1">
                          <span className="text-gray-400">Total: </span>
                          <span className="text-[#66ff99]">{formatCurrency(recoveredTotal ?? 0, recoveredCurrency)}</span>
                        </div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Approved</div>
                        <div className="text-xl font-semibold text-emerald-400 mt-1">{formatCurrency(computedApproved ?? 0, recoveredCurrency)}</div>
                        <div className="text-[11px] mt-1">
                          <span className="text-gray-400">Total this Month: </span>
                          <span className="text-blue-400">{approvedClaimsThisMonth != null ? approvedClaimsThisMonth : 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Submit button removed per request */}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-gray-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-brand text-lg text-gray-100 font-semibold">Quick Actions</h2>
                      <button aria-label="Customize quick actions" className="text-gray-300 hover:text-gray-100" onClick={() => setQuickActionsEditOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {selectedQuickActions.includes('connect_evidence') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => setShowEvidencePrompt(true)}>
                          <Mail className="h-4 w-4" />
                          Connect evidence sources
                        </Button>
                      )}
                      {selectedQuickActions.includes('review_high_conf') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/recoveries', { state: { filter: 'high_confidence' } })}>
                          <CheckCircle className="h-4 w-4" />
                          Review high‑confidence cases
                        </Button>
                      )}
                      {selectedQuickActions.includes('resolve_new') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/recoveries', { state: { filter: 'new_pending' } })}>
                          <RotateCcw className="h-4 w-4" />
                          Resolve new opportunities
                        </Button>
                      )}
                      {selectedQuickActions.includes('run_detector') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={async () => {
                          try { await api.post('/api/detections/run'); toast({ title: 'Detector started', description: 'Scanning new opportunities…' }); } catch(e:any){ toast({ title: 'Detector failed', description: e?.message || 'Please try again.', variant: 'destructive' }); }
                        }}>
                          <RefreshCw className="h-4 w-4" />
                          Run detector
                        </Button>
                      )}
                      {selectedQuickActions.includes('ingest_now') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={async () => {
                          const r = await api.startEvidenceIngest();
                          if ((r as any)?.ok) toast({ title: 'Ingestion started', description: 'We will notify you when new docs arrive.' });
                          else toast({ title: 'Ingestion failed', description: (r as any)?.error || 'Try again.', variant: 'destructive' });
                        }}>
                          <Cloud className="h-4 w-4" />
                          Ingest documents now
                        </Button>
                      )}
                      {selectedQuickActions.includes('smart_sync') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/smart-inventory-sync')}>
                          <RefreshCw className="h-4 w-4" />
                          Smart Inventory Sync
                        </Button>
                      )}
                      {selectedQuickActions.includes('upcoming_payments') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/upcoming-payments')}>
                          <CircleDollarSign className="h-4 w-4" />
                          Upcoming payments
                        </Button>
                      )}
                      {selectedQuickActions.includes('export_history') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/export-center')}>
                          <Download className="h-4 w-4" />
                          Export recovery & payout history
                        </Button>
                      )}
                      {selectedQuickActions.includes('evidence_locker') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/evidence-locker')}>
                          <FileText className="h-4 w-4" />
                          Evidence Locker
                        </Button>
                      )}
                      {selectedQuickActions.includes('invite_teammate') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => setInviteOpen(true)}>
                          <Link2 className="h-4 w-4" />
                          Invite a teammate
                        </Button>
                      )}
                      {selectedQuickActions.includes('configure_alerts') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/notifications')}>
                          <Bell className="h-4 w-4" />
                          Configure alerts
                        </Button>
                      )}
                      {selectedQuickActions.includes('security_setup') && (
                        <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10" onClick={() => navigate('/settings')}>
                          <Shield className="h-4 w-4" />
                          Security quick setup
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="h-full bg-white/5 border-white/10 text-gray-300">
                  <CardContent className="p-0">
                    <div className="p-3 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-100">Recent Activity</h3>
                        <span className="text-xs rounded px-2 py-0.5 bg-white/10 text-gray-200 border border-white/20">3 new</span>
                      </div>
                    </div>
                    <div className="py-2 max-h-[600px] overflow-y-auto">
                      <div className="relative px-4 max-w-[360px] mx-auto text-[12px] divide-y divide-white/10">
                        {(() => {
                          const events = [
                            { id: 'evt-1', unread: true, title: 'Connection Established', details: 'Amazon connection established', time: 'Just now' },
                            { id: 'evt-2', unread: true, title: 'Claims Identified', details: `23 potential claims identified, valued at ~${formatCurrency(14228)}` , time: '2 minutes ago' },
                            { id: 'evt-3', unread: false, title: 'Claim Submitted', details: 'Auto-submitted 5 verified claims', time: 'Yesterday' },
                            { id: 'evt-4', unread: false, title: 'Funds Recovered', details: `Payout confirmed: ${formatCurrency(850.75)}`, time: '2 days ago' },
                          ];
                          return events.map((evt, idx) => (
                            <div key={evt.id} className={"group relative flex items-start gap-3 py-3 overflow-hidden"}>
                              {/* Read/Unread dot only */}
                              <div className="pt-1">
                                <span className={"inline-block h-2 w-2 rounded-full " + (evt.unread ? 'bg-blue-500' : 'bg-gray-500')} />
                              </div>
                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className={"text-[12px] truncate " + (evt.unread ? 'text-gray-100 font-semibold' : 'text-gray-400 font-medium')}>{evt.title}</p>
                                  <span className={"ml-3 shrink-0 text-[11px] " + (evt.unread ? 'text-gray-100 font-semibold' : 'text-gray-400')}>{evt.time}</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate">{evt.details}</p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
            </div>
            </div>
          </div>
        </main>
      </div>
      {/* Evidence Connections Prompt on Dashboard as fallback */}
      <Dialog open={showEvidencePrompt} onOpenChange={setShowEvidencePrompt}>
        <DialogContent className="max-w-lg bg-[#0B1220]/80 backdrop-blur-2xl border border-white/10 text-gray-100 shadow-[0_20px_80px_rgba(0,0,0,0.6)] rounded-2xl">
          <DialogHeader>
              <DialogTitle className="text-lg text-gray-100">
                <div className="flex flex-col items-start gap-1">
                  <span className="inline-flex">
                    <span className="relative inline-flex">
                      <span className="absolute -inset-2 rounded-full bg-emerald-400/25 blur-lg" />
                      <img
                        src="/donelogo.png"
                        alt="Clario"
                        className="relative h-8 w-8 rounded-full object-cover shadow-lg shadow-emerald-500/25"
                      />
                    </span>
                  </span>
                  <span>Connect Evidence Sources</span>
                </div>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Link Gmail/Outlook and Drive/Dropbox to auto‑collect invoices and receipts (read‑only).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button className="w-full bg-red-600/90 hover:bg-red-600 text-white border border-white/10" onClick={async () => {
              try {
                const r = await api.post(`/api/v1/integrations/gmail/connect`);
                const url = (r as any)?.data?.auth_url as string | undefined;
                window.location.href = url || '/auth/gmail-sandbox';
              } catch {
                window.location.href = '/auth/gmail-sandbox';
              }
            }}>
              <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 mr-2 object-contain" /> Gmail
            </Button>
            <Button className="w-full bg-blue-600/90 hover:bg-blue-600 text-white border border-white/10" onClick={async () => {
              try {
                const r = await api.post(`/api/v1/integrations/outlook/connect`);
                const url = (r as any)?.data?.auth_url as string | undefined;
                window.location.href = url || '/auth/outlook-sandbox';
              } catch {
                window.location.href = '/auth/outlook-sandbox';
              }
            }}>
              <img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 mr-2 object-contain" /> Outlook
            </Button>
            <Button className="w-full bg-emerald-600/90 hover:bg-emerald-600 text-white border border-white/10" onClick={async () => {
              try {
                const r = await api.post(`/api/v1/integrations/gdrive/connect`);
                const url = (r as any)?.data?.auth_url as string | undefined;
                window.location.href = url || '/auth/gdrive-sandbox';
              } catch {
                window.location.href = '/auth/gdrive-sandbox';
              }
            }}>
              <img src="/gd.png" alt="Google Drive" className="h-4 w-4 mr-2 object-contain" /> Google Drive
            </Button>
            <Button className="w-full bg-sky-600/90 hover:bg-sky-600 text-white border border-white/10" onClick={async () => {
              try {
                const r = await api.post(`/api/v1/integrations/dropbox/connect`);
                const url = (r as any)?.data?.auth_url as string | undefined;
                window.location.href = url || '/auth/dropbox-sandbox';
              } catch {
                window.location.href = '/auth/dropbox-sandbox';
              }
            }}>
              <img src="/db.png" alt="Dropbox" className="h-4 w-4 mr-2 object-contain" /> Dropbox
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-gray-300 hover:text-gray-100" onClick={() => { setShowEvidencePrompt(false); try { localStorage.setItem('clario.evidencePromptDismissed', 'true'); } catch {} }}>Maybe later</Button>
            <Button onClick={() => setShowEvidencePrompt(false)} className="gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-gray-100">
              <ArrowRight className="h-4 w-4" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Quick Actions Editor */}
      <Dialog open={quickActionsEditOpen} onOpenChange={setQuickActionsEditOpen}>
        <DialogContent className="max-w-md bg-[#0B1220]/80 backdrop-blur-2xl border border-white/10 text-gray-100 shadow-[0_20px_80px_rgba(0,0,0,0.6)] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-100">Customize Quick Actions</DialogTitle>
            <DialogDescription className="text-gray-400">Select which actions to show.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {QUICK_ACTIONS.map(a => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={selectedQuickActions.includes(a.id)} onCheckedChange={(c) => {
                  setSelectedQuickActions(prev => {
                    const next = new Set(prev);
                    if (c) next.add(a.id); else next.delete(a.id);
                    return Array.from(next);
                  });
                }} />
                {a.label}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-gray-300 hover:text-gray-100" onClick={() => setQuickActionsEditOpen(false)}>Cancel</Button>
            <Button className="bg-white/10 hover:bg-white/20 border border-white/10 text-gray-100" onClick={() => { try { localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions)); toast({ title: 'Saved', description: 'Quick actions updated.' }); } catch {} setQuickActionsEditOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite teammate dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite a Teammate</DialogTitle>
            <DialogDescription>Send a read‑only invite to finance/ops.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="email" placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={async () => { if (!inviteEmail) return; try { await api.post('/api/team/invite', { email: inviteEmail }); toast({ title: 'Invite sent', description: inviteEmail }); } catch (e: any) { toast({ title: 'Invite failed', description: e?.message || 'Please try again.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}>Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
