import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Link2, Search, Send, CircleDollarSign } from 'lucide-react';
import { api } from '@/lib/api';

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
  const hasFetchedRef = useRef(false);
  const [pendingRecoveryAmount, setPendingRecoveryAmount] = useState<number | null>(null);
  const [approvedRecoveryAmount, setApprovedRecoveryAmount] = useState<number | null>(null);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;

    async function fetchRecoveriesOnce() {
      const res = await api.getAmazonRecoveries();
      if (!active) return;
      if (res.ok && res.data) {
        setRecoveredTotal(res.data.totalAmount ?? 0);
        if (res.data.currency) setRecoveredCurrency(res.data.currency);
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
        if (pending !== null) setPendingRecoveryAmount(pending);
        if (rate !== null) setSuccessRate(rate);
        if (approved !== null) setApprovedRecoveryAmount(approved);
        if (nextPay !== null) setNextPaymentAmount(nextPay);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    }

    // Initial fetch immediately on mount
    fetchRecoveriesOnce();
    fetchMetrics();
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
                        <h2 className="font-brand text-lg text-gray-100 font-semibold">Your Recovered Value</h2>
                        <div className="text-[32px] md:text-[36px] font-extrabold mt-1 text-emerald-400">
                          {formatCurrency(recoveredTotal ?? 0, recoveredCurrency)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Next Payment</div>
                        <div className="text-xl font-semibold text-gray-100 mt-1">{formatCurrency(nextPaymentAmount ?? 0, recoveredCurrency)}</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Pending Recovery</div>
                        <div className="text-xl font-semibold text-blue-400 mt-1">{formatCurrency(pendingRecoveryAmount ?? 0, recoveredCurrency)}</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-gray-400">Approved</div>
                        <div className="text-xl font-semibold text-emerald-400 mt-1">{formatCurrency(computedApproved ?? 0, recoveredCurrency)}</div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-gray-100 hover:bg-white/10"
                        onClick={() => navigate('/recoveries')}
                      >
                        Auto-Submit
                      </Button>
                      <div className="mt-2 text-xs text-blue-400">Submit claim. clario auto files new</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-gray-300">
                  <CardContent className="p-6">
                    <h2 className="font-brand text-lg text-gray-100 font-semibold">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10">
                        <FileText className="h-4 w-4" />
                        View Reports
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2 bg-white/5 border-white/10 text-gray-100 hover:bg-white/10">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
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
    </div>
  );
}
