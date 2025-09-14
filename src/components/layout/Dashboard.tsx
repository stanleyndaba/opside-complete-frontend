import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, FolderOpen, CheckCircle, DollarSign, Search, RefreshCw, Calendar, TrendingUp, Radar } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useStatusStream } from '@/hooks/use-status-stream';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  const [detecting, setDetecting] = useState(false);
  const [detectionId, setDetectionId] = useState<string | null>(null);
  const [lastDetection, setLastDetection] = useState<{ newCases: number; totalPotential: number } | null>(null);

  // Aggregates state
  const [windowSel, setWindowSel] = useState<'7d' | '30d' | '90d'>('30d');
  const [aggregates, setAggregates] = useState<{ totalRecovered: number; totalApproved: number; totalExpected: number; evidenceHealth?: number } | null>(null);
  const [recoveriesMetrics, setRecoveriesMetrics] = useState<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.getDashboardAggregates(windowSel);
      if (!cancelled) {
        if (res.ok && res.data) {
          setAggregates({ totalRecovered: res.data.totalRecovered, totalApproved: res.data.totalApproved, totalExpected: res.data.totalExpected, evidenceHealth: (res.data as any).evidenceHealth });
        }
      }
    })();
    return () => { cancelled = true };
  }, [windowSel]);
  const upcomingPayouts = [{
    amount: 1850.00,
    date: "Oct 28, 2025",
    status: "confirmed"
  }, {
    amount: 2100.00,
    date: "Nov 12, 2025",
    status: "pending"
  }, {
    amount: 950.00,
    date: "Dec 8, 2025",
    status: "estimated"
  }];
  const activityFeed = [{
    id: 1,
    type: 'claim_submitted',
    icon: CheckCircle,
    description: 'NEW: Claim #1234 ($250) for Lost Inventory Submitted.',
    timestamp: '2 minutes ago',
    color: 'text-success'
  }, {
    id: 2,
    type: 'payout_completed',
    icon: DollarSign,
    description: 'PAID: Claim #1198 ($150) has been successfully paid out.',
    timestamp: '8 hours ago',
    color: 'text-success'
  }, {
    id: 3,
    type: 'evidence_added',
    icon: Search,
    description: 'EVIDENCE ADDED: Invoice #INV-5678 linked to Claim #1235.',
    timestamp: 'Yesterday',
    color: 'text-primary'
  }, {
    id: 4,
    type: 'sync_complete',
    icon: RefreshCw,
    description: 'SYNC COMPLETE: Your account was successfully synced.',
    timestamp: 'Yesterday',
    color: 'text-muted-foreground'
  }, {
    id: 5,
    type: 'claim_approved',
    icon: CheckCircle,
    description: 'APPROVED: Claim #1199 ($380) has been approved by Amazon.',
    timestamp: '2 days ago',
    color: 'text-success'
  }];

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // On mount, attempt Stripe post-login hook
  useEffect(() => {
    (async () => {
      const res = await api.postLoginStripe();
      if (res.ok && res.data) {
        if ((res.data as any).onboarding_url) {
          window.location.href = (res.data as any).onboarding_url as string;
          return;
        }
        if ((res.data as any).manage_billing_url) {
          // Optionally, surface manage billing CTA
          // For now, keep it silent but could add a banner/button
        }
      }
    })();
  }, []);

  // Fetch recoveries metrics for dashboard second module
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.getRecoveriesMetrics();
      if (!cancelled && res.ok && res.data) setRecoveriesMetrics(res.data);
    })();
    return () => { cancelled = true };
  }, []);

  // Real-time updates via WS/SSE
  useStatusStream((evt) => {
    if (evt.type === 'sync') {
      // Could set a local sync status indicator
    }
    if (evt.type === 'detection') {
      if (evt.status === 'complete') {
        // prompt user that results are ready
      }
    }
    if (evt.type === 'recovery') {
      // update anything dashboard cares about in future
    }
  });
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  return <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      <Navbar sidebarCollapsed={isSidebarCollapsed} />
      
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className={`flex-1 transition-all duration-300 overflow-y-auto ${isSidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="container max-w-full p-6 bg-white/[0.31]">
            {/* Command Center Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              
              {/* Left Column - Main Content (65-70% width) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Empty State Card (appears only if no recoveries yet) */}
                {recoveriesMetrics?.totalClaimsFound === 0 && (
                  <Card className="border border-amber-200 bg-amber-50">
                    <CardContent className="p-6">
                      <h2 className="font-montserrat text-lg text-amber-900 font-semibold">Welcome to Clario</h2>
                      <p className="text-sm text-amber-900 mt-1">Your first sync is complete. We are now scanning for potential recoveries.</p>
                      <div className="mt-3">
                        <Button onClick={() => navigate('/integrations-hub')}>View Sync Status</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                

                {/* Module 2: Your Recovered Value */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Your Recovered Value</h2>
                    <div className="text-3xl font-extrabold mt-2">
                      {aggregates ? formatCurrency(aggregates.totalRecovered) : '—'}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Recovery</span>
                        <span className="text-sm font-semibold">{recoveriesMetrics ? formatCurrency(recoveriesMetrics.valueInProgress) : (aggregates ? formatCurrency(aggregates.totalExpected) : '—')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">30-Day Recovery</span>
                        <span className="text-sm font-semibold">{recoveriesMetrics ? `${Math.round(recoveriesMetrics.successRate30d)}%` : '—'}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button onClick={() => navigate('/recoveries')}>View All Claims</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Notifications (match bell dropdown style) */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                      </div>
                    </div>
                    <div className="py-1 max-h-[600px] overflow-y-auto">
                      {activityFeed.concat([
                        { id: 6, type: 'info', icon: CheckCircle, description: '2 new recoveries ready for approval', timestamp: '5m ago', color: 'text-primary', unread: true },
                        { id: 7, type: 'info', icon: DollarSign, description: 'Expected payout updated', timestamp: '10m ago', color: 'text-primary', unread: true },
                      ] as any).map((notification: any, index: number, arr: any[]) => {
                        const IconComponent = notification.icon;
                        return (
                          <React.Fragment key={notification.id}>
                            <div 
                              className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors ${notification.unread ? 'bg-muted/30' : ''}`}
                            >
                              <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${notification.unread ? 'bg-primary/10' : 'bg-muted'}`}>
                                <IconComponent className={`w-3 h-3 ${notification.unread ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-relaxed ${notification.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                              </div>
                              {notification.unread && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>}
                            </div>
                            {index < arr.length - 1 && <div className="-mx-1 my-1 h-px bg-muted" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>;
}