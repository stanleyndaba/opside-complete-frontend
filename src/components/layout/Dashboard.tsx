import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, DollarSign, Search, RefreshCw, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const [detectOpen, setDetectOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectResults, setDetectResults] = useState<Array<{ id: string; amount: number; reason: string; sku: string; asin: string }>>([]);
  const [metrics, setMetrics] = useState<{ total_recovered: number; expected_approved: number; upcoming_payouts: Array<{ amount: number; date: string }> } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);

  // Mock data for the dashboard
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoadingMetrics(true);
        const data = await apiClient.get<{ total_recovered: number; expected_approved: number; upcoming_payouts: Array<{ amount: number; date: string }> }>(
          '/api/metrics/recoveries'
        );
        setMetrics(data);
      } catch (e) {
        // keep null on error
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchMetrics();
  }, []);
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

                <div className="flex flex-wrap gap-3">
                  <Dialog open={detectOpen} onOpenChange={setDetectOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Search className="h-4 w-4" />
                        Detect Missed Claims
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Detect Missed Claims</DialogTitle>
                        <DialogDescription>
                          We will analyze your FBA data to find missed reimbursements.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        {!detectResults.length ? (
                          <div className="text-sm text-muted-foreground">
                            {detecting ? 'Scanning… this may take up to 1 minute.' : 'Click Run Detection to start.'}
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-medium">Potential Value: {formatCurrency(detectResults.reduce((s, r) => s + r.amount, 0))}</div>
                            <Separator />
                            <div className="max-h-64 overflow-auto space-y-2">
                              {detectResults.map(r => (
                                <div key={r.id} className="flex items-center justify-between text-sm border rounded p-2">
                                  <div>
                                    <div className="font-medium">{r.id} • {r.sku} / {r.asin}</div>
                                    <div className="text-muted-foreground">{r.reason}</div>
                                  </div>
                                  <div className="font-semibold">{formatCurrency(r.amount)}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDetectOpen(false)}>Close</Button>
                        <Button
                          onClick={async () => {
                            try {
                              setDetecting(true);
                              const result = await apiClient.post<{ detection_id: string; claims: Array<{ id: string; amount: number; reason: string; sku: string; asin: string }> }>(
                                '/api/detections/run'
                              );
                              setDetectResults(result.claims ?? []);
                              // Optionally begin polling detection status by id
                              // const statusId = result.detection_id; (store if needed)
                            } catch (e) {
                              setDetectResults([]);
                            } finally {
                              setDetecting(false);
                            }
                          }}
                          disabled={detecting}
                        >
                          {detecting ? 'Running…' : 'Run Detection'}
                        </Button>
                        <Button
                          disabled={!detectResults.length}
                          onClick={() => {
                            setDetectOpen(false);
                            navigate('/recoveries');
                          }}
                        >
                          Auto-Submit All
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="gap-2" onClick={() => navigate('/smart-inventory-sync')}>
                    <RefreshCw className="h-4 w-4" />
                    Reconcile & Sync
                  </Button>
                </div>
                {/* Your Recovered Value */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Your Next Payout</h2>
                      
                      {/* Total Recovered Hero Amount */}
                      <div className="text-xl font-semibold text-sidebar-primary font-montserrat">
                        {formatCurrency(recoveredValue.total)}
                      </div>
                      
                      {/* Subtitle */}
                      <div className="text-sm text-muted-foreground font-montserrat">
                        Total recovered since joining
                      </div>
                      
                      {/* Recovery Metrics */}
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-montserrat">Pending Recovery</span>
                          <span className="font-semibold text-sm font-montserrat">{formatCurrency(recoveredValue.pending)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-montserrat">30-Day Recovery</span>
                          <span className="font-semibold text-sm font-montserrat">{formatCurrency(recoveredValue.lastMonth)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Navigation Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-8 flex items-center gap-2 transition-colors bg-gray-200 hover:bg-gray-100 text-black"
                    onClick={() => navigate('/recoveries')}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-montserrat">View All Claims</span>
                  </Button>
                  
                  
                  
                  
                </div>
              </div>

              {/* Right Column - Live Activity Feed (30-35% width) */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      
                      <h2 className="text-lg font-semibold font-montserrat">Notifications</h2>
                    </div>
                    
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {activityFeed.map(item => {
                      const IconComponent = item.icon;
                      return <div key={item.id} className="flex gap-3 p-3 transition-colors bg-stone-50 rounded-none">
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground mb-1 font-montserrat">
                                {item.description}
                              </p>
                              <p className="text-xs text-muted-foreground font-montserrat">
                                {item.timestamp}
                              </p>
                            </div>
                          </div>;
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