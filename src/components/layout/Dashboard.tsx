import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, FolderOpen, CheckCircle, DollarSign, Search, RefreshCw, Calendar, TrendingUp, Radar } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  const [detecting, setDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<{ newCases: number; totalPotential: number } | null>(null);

  // Aggregates state
  const [windowSel, setWindowSel] = useState<'7d' | '30d' | '90d'>('30d');
  const [aggregates, setAggregates] = useState<{ totalRecovered: number; totalApproved: number; totalExpected: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.getDashboardAggregates(windowSel);
      if (!cancelled) {
        if (res.ok && res.data) {
          setAggregates({ totalRecovered: res.data.totalRecovered, totalApproved: res.data.totalApproved, totalExpected: res.data.totalExpected });
        }
      }
    })();
    return () => { cancelled = true };
  }, [windowSel]);
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
                {/* Detection Summary Banner */}
                <div className="border border-amber-200 bg-amber-50 rounded p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-amber-800 font-montserrat">Potential lost reimbursements detected</p>
                      <p className="text-amber-900 font-semibold font-montserrat">View cases and approve submissions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => {
                        setDetecting(true);
                        const res = await api.runDetections();
                        setDetecting(false);
                        if (res.ok && res.data) {
                          setLastDetection(res.data);
                          toast({
                            title: `Detected ${res.data.newCases} new claims`,
                            description: `Estimated value ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(res.data.totalPotential)}`,
                          });
                        } else {
                          toast({ title: 'Detection failed', description: res.error || 'Please try again shortly.' });
                        }
                      }} className={`text-sm px-3 py-2 ${detecting ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded font-montserrat flex items-center gap-2`} disabled={detecting}>
                        <Radar className="h-4 w-4" />
                        {detecting ? 'Detecting…' : 'Detect Missed Claims'}
                      </button>
                      <button onClick={() => navigate('/recoveries')} className="text-sm px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-montserrat">View Recoveries</button>
                    </div>
                  </div>
                  {lastDetection && (
                    <div className="mt-3 text-xs text-amber-900">
                      New actionable claims: <span className="font-semibold">{lastDetection.newCases}</span> • Estimated value: <span className="font-semibold">{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(lastDetection.totalPotential)}</span>
                    </div>
                  )}
                </div>
                
                {/* Module 1: Next Expected Payout (Hero) */}
                <Card className="border bg-gradient-to-br from-emerald-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Next Expected Payout</h2>
                        <div className="text-3xl font-extrabold mt-2">
                          {aggregates ? formatCurrency(aggregates.totalExpected) : '—'}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Estimated from approved and pending claims</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase text-muted-foreground">Auto-Claim</span>
                        <div className="text-sm">Enabled</div>
                        <div className="text-xs text-muted-foreground">Claims auto-submitted once evidence is verified</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 2: Your Recovered Value */}
                <Card className="border">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Your Next Payout</h2>
                      
                      {/* Total Recovered Hero Amount */}
                      <div className="text-xl font-semibold text-sidebar-primary font-montserrat">
                        {aggregates ? formatCurrency(aggregates.totalRecovered) : '—'}
                      </div>
                      
                      {/* Subtitle */}
                      <div className="text-sm text-muted-foreground font-montserrat">
                        Total recovered since joining
                      </div>
                      
                      {/* Recovery Metrics */}
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-montserrat">Pending Recovery</span>
                          <span className="font-semibold text-sm font-montserrat">{aggregates ? formatCurrency(aggregates.totalExpected) : '—'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-montserrat">Approved</span>
                          <span className="font-semibold text-sm font-montserrat">{aggregates ? formatCurrency(aggregates.totalApproved) : '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-muted-foreground">Window:</span>
                          <select className="text-xs border rounded px-2 py-1" value={windowSel} onChange={(e) => setWindowSel(e.target.value as any)}>
                            <option value="7d">7d</option>
                            <option value="30d">30d</option>
                            <option value="90d">90d</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 3: Primary Navigation Links */}
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