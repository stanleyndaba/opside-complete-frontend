import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, FolderOpen, CheckCircle, DollarSign, Search, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
                
                {/* Module 1: Promise of Time - Your Next Payout (Hero) */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-6 bg-white rounded-none">
                    <div className="text-center space-y-3">
                      <h2 className="text-lg text-muted-foreground font-montserrat text-left font-extrabold">Next Payout</h2>
                      
                      {/* Hero Amount */}
                      <div className="text-3xl font-semibold text-sidebar-primary font-montserrat">
                        {formatCurrency(nextPayout.amount)}
                      </div>
                      
                      {/* Expected Date */}
                      <div className="flex items-center justify-center gap-2 text-lg font-medium text-foreground">
                        <Calendar className="h-5 w-5" />
                        <span className="font-montserrat text-left text-zinc-400 text-sm font-normal">Expected by: {nextPayout.expectedDate}</span>
                      </div>
                      
                      {/* Separator */}
                      <div className="pt-4">
                        <div className="h-px bg-border/50 w-full" />
                      </div>
                      
                      {/* Payout Timeline - Compact Table Style */}
                      <div className="pt-4 space-y-2">
                        {upcomingPayouts.map((payout, index) => <div key={index} className="flex justify-between items-center py-1">
                            <span className="text-sm text-muted-foreground font-montserrat">{payout.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm font-montserrat">{formatCurrency(payout.amount)}</span>
                              
                            </div>
                          </div>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Module 2: Promise of Value - Your Financial Health */}
                

                {/* Module 3: Primary Navigation Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/50 transition-colors">
                    <FileText className="h-6 w-6" />
                    <span className="font-montserrat">View All Claims</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/50 transition-colors">
                    <BarChart3 className="h-6 w-6" />
                    <span className="font-montserrat">Recovery Reports</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-accent/50 transition-colors">
                    <FolderOpen className="h-6 w-6" />
                    <span className="font-montserrat">Evidence Locker</span>
                  </Button>
                </div>
              </div>

              {/* Right Column - Live Activity Feed (30-35% width) */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      
                      <h2 className="text-lg font-semibold font-montserrat">Claims</h2>
                    </div>
                    
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {activityFeed.map(item => {
                      const IconComponent = item.icon;
                      return <div key={item.id} className="flex gap-3 p-3 rounded-lg transition-colors bg-stone-50">
                            <div className="flex-shrink-0">
                              <IconComponent className={`h-5 w-5 ${item.color}`} />
                            </div>
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