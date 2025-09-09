import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, FolderOpen, CheckCircle, DollarSign, Search, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

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
    color: 'text-success'
  }, {
    id: 2,
    type: 'payout_completed',
    icon: DollarSign,
    description: 'Paid: Claim #1198 ($150) has been successfully paid out.',
    timestamp: '8 hours ago',
    color: 'text-success'
  }, {
    id: 3,
    type: 'evidence_added',
    icon: Search,
    description: 'Evidence added: Invoice #INV-5678 linked to Claim #1235.',
    timestamp: 'Yesterday',
    color: 'text-primary'
  }, {
    id: 4,
    type: 'sync_complete',
    icon: RefreshCw,
    description: 'Sync complete: Your account was successfully synced.',
    timestamp: 'Yesterday',
    color: 'text-muted-foreground'
  }, {
    id: 5,
    type: 'claim_approved',
    icon: CheckCircle,
    description: 'Approved: Claim #1199 ($380) has been approved by Amazon.',
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
                

                {/* Module 2: Your Recovered Value */}
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
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold font-montserrat">Notifications</h2>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {activityFeed.map(item => {
                        const IconComponent = item.icon;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground mb-1 font-montserrat">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{item.timestamp}</span>
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-[10px] capitalize">
                                    {item.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
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
    </div>;
}