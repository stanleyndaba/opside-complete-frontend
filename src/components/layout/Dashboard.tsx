import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, FolderOpen, CheckCircle, DollarSign, Search, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [detectOpen, setDetectOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectResults, setDetectResults] = useState<Array<{ id: string; amount: number; reason: string; sku: string; asin: string }>>([]);
  const [metrics, setMetrics] = useState<{ total_recovered: number; expected_approved: number; upcoming_payouts: Array<{ amount: number; date: string }> } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [detectionId, setDetectionId] = useState<string | null>(null);
  const [detectionNotified, setDetectionNotified] = useState<boolean>(false);
  // Real-time stream: update detection status and show toasts; disable polling via status stream
  useStatusStream({
    onDetection: (e) => {
      // If this detection matches current detectionId, reset so we don't poll or duplicate toasts
      if (detectionId && e.id === detectionId) {
        setDetectionId(null);
        setDetectionNotified(true);
      }
    }
  });

  // Mock data for the dashboard
  const nextPayout = {
    amount: 1850.00,
    expectedDate: "Sept 15, 2025"
  };
  const recoveredValue = {
    total: 11200.50,
    pending: 1850.00,
    lastMonth: 2100.00
  };
  const upcomingPayouts = [{
    amount: 1850.00,
    date: "Sept 15, 2025",
    status: "confirmed"
  }, {
    amount: 2100.00,
    date: "Oct 12, 2025",
    status: "pending"
  }, {
    amount: 950.00,
    date: "Nov 8, 2025",
    status: "estimated"
  }];
  const activityFeed = [{
    id: 1,
    type: 'claim_submitted',
    icon: CheckCircle,
    description: 'New: Claim #1234 ($250) for lost inventory submitted.',
    timestamp: '2 minutes ago',
    color: 'text-success',
    read: false
  }, {
    id: 2,
    type: 'payout_completed',
    icon: DollarSign,
    description: 'Paid: Claim #1198 ($150) has been successfully paid out.',
    timestamp: '8 hours ago',
    color: 'text-success',
    read: true
  }, {
    id: 3,
    type: 'evidence_added',
    icon: Search,
    description: 'Evidence added: Invoice #INV-5678 linked to Claim #1235.',
    timestamp: 'Yesterday',
    color: 'text-primary',
    read: true
  }, {
    id: 4,
    type: 'sync_complete',
    icon: RefreshCw,
    description: 'Sync complete: Your account was successfully synced.',
    timestamp: 'Yesterday',
    color: 'text-muted-foreground',
    read: true
  }, {
    id: 5,
    type: 'claim_approved',
    icon: CheckCircle,
    description: 'Approved: Claim #1199 ($380) has been approved by Amazon.',
    timestamp: '2 days ago',
    color: 'text-success',
    read: true
  }];

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-56';

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden platform">
      <Navbar sidebarCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={'flex-1 transition-all duration-300 overflow-y-auto ' + mainClass}>
          <div className="container max-w-full p-6 bg-white/[0.31]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-2 space-y-8">
                {/* Hero Metrics & CTAs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Recovered to date</div>
                      <div className="text-2xl font-semibold">{formatCurrency(metrics?.total_recovered ?? 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Expected (approved)</div>
                      <div className="text-2xl font-semibold">{formatCurrency(metrics?.expected_approved ?? 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Next payout</div>
                      <div className="text-2xl font-semibold">{formatCurrency(metrics?.upcoming_payouts?.[0]?.amount ?? 0)} <span className="text-base text-muted-foreground">on {metrics?.upcoming_payouts?.[0]?.date ?? '-'}</span></div>
                    </CardContent>
                  </Card>
                </div>

                {/* Module 2: ROI & Cash Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Total Recovered</div>
                      <div className="text-2xl font-semibold">{formatCurrency(metrics?.totalRecovered ?? 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Expected Payouts</div>
                      <div className="text-2xl font-semibold text-emerald-700">{formatCurrency(metrics?.expectedPayouts ?? 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Pending Submissions</div>
                      <div className="text-2xl font-semibold">{metrics?.pendingSubmissions ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Last 30 Days</div>
                      <div className="text-2xl font-semibold">{formatCurrency(metrics?.last30Days ?? 0)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Module 3: Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-9 flex items-center gap-2 transition-colors bg-gray-200 hover:bg-gray-100 text-black"
                    onClick={() => navigate('/recoveries')}
                    title="View all current and historical claims"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-montserrat">View All Claims</span>
                  </Button>
                  <Button 
                    className="h-9 flex items-center gap-2"
                    title="Run detection and surface potential missed claims"
                    onClick={() => runDetection.mutate()}
                  >
                    Detect Missed Claims
                  </Button>
                  <Button 
                    className="h-9 flex items-center gap-2"
                    title="Start inventory sync now"
                    onClick={() => startSync.mutate()}
                    disabled={startSync.isPending}
                  >
                    {startSync.isPending ? 'Starting…' : 'Start Sync'}
                  </Button>
                </div>
              </div>
              <Dialog open={detectOpen} onOpenChange={setDetectOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Detecting Missed Claims</DialogTitle>
                    <DialogDescription>
                      We’re scanning your account for potential reimbursements. This may take up to 1–2 minutes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="text-sm">
                    Status: <span className="font-medium">{detectionState || (runDetection.isPending ? 'starting' : 'queued')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {typeof detectionProgress === 'number' ? `${detectionProgress}% complete` : 'Preparing datasets...'}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDetectOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h2 className="text-base font-semibold font-montserrat">Notifications</h2>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {activityFeed.length === 0 && (
                        <div className="text-sm text-muted-foreground">No recent activity yet</div>
                      )}
                      {activityFeed.map(item => {
                        const IconComponent = item.icon;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${!item.read ? 'bg-muted/50 border-primary/20' : 'bg-background hover:bg-muted/30'}`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground mb-1 font-montserrat">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>{item.timestamp}</span>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-[10px] capitalize">
                                    {item.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {!item.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
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
    </div>
  );
}
