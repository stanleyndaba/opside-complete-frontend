import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  // Mock data for the dashboard
  const nextPayout = {
    amount: 1850.00,
    expectedDate: "Sept 15, 2025"
  };
  const { data: metrics } = useQuery<{ totalRecovered:number; expectedPayouts:number; pendingSubmissions:number; last30Days:number }>({
    queryKey: ['metrics','recoveries'],
    queryFn: () => apiFetch('/api/metrics/recoveries')
  });
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

  const queryClient = useQueryClient();
  const runDetection = useMutation({
    mutationFn: async () => apiFetch<{ detection_id: string }>(`/api/detections/run`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      // refresh metrics/recoveries soon after detection starts
      queryClient.invalidateQueries({ queryKey: ['metrics','recoveries'] });
    }
  });

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
                
                {/* Module 1: Promise of Time - Your Next Payout (Hero) */}
                

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
                    variant="outline"
                    className="h-9"
                    title="Auto-claim selected opportunities"
                    disabled
                  >
                    Auto-Claim Selected
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