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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Live dashboard recoveries metrics (Continuous Sync UX)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;

    async function fetchRecoveriesOnce() {
      const res = await api.getAmazonRecoveries();
      if (!active) return;
      if (res.ok && res.data) {
        setRecoveredTotal(res.data.totalAmount ?? 0);
        if (res.data.currency) setRecoveredCurrency(res.data.currency);
      }
    }

    // Initial fetch immediately on mount
    fetchRecoveriesOnce();
    hasFetchedRef.current = true;

    // Short burst polling to show numbers populate quickly
    let polls = 0;
    pollTimer = window.setInterval(async () => {
      polls += 1;
      await fetchRecoveriesOnce();
      if (polls >= 12) { // ~1 minute at 5s cadence
        if (pollTimer) window.clearInterval(pollTimer);
      }
    }, 5000) as unknown as number;

    return () => {
      active = false;
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, []);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-64';

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden platform">
      <Navbar sidebarCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={'flex-1 transition-all duration-300 overflow-y-auto ' + mainClass}>
          <div className="relative">
            <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
              <div className="relative container mx-auto px-6 md:px-10 lg:px-12 pt-6 pb-10 text-gray-300 space-y-8">
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
                    <h2 className="font-brand text-lg text-gray-100 font-semibold">Your Recovered Value</h2>
                    <p className="text-sm text-gray-400 mt-1">Auto-submit your FBA recovery</p>
                    <div className="text-[22px] font-extrabold mt-2 text-gray-100">
                      {recoveredTotal == null ? (
                        <span className="text-muted-foreground">Loading…</span>
                      ) : (
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: recoveredCurrency || 'USD' }).format(recoveredTotal)
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Pending Recovery</span>
                        <span className="text-sm font-semibold text-[#3399ff]">{formatCurrency(8560)}</span>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 border-white/10 text-gray-100 hover:bg-white/10"
                          onClick={() => navigate('/recoveries')}
                        >
                          Auto-Submit
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Success Rate</span>
                        <span className="text-sm font-semibold text-emerald-400">94%</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold" onClick={() => navigate('/recoveries')}>View All Claims</Button>
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
