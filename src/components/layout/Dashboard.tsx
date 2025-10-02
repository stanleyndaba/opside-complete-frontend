import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, CheckCircle, DollarSign } from 'lucide-react';

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

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-56';

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden">
      <Navbar sidebarCollapsed={isSidebarCollapsed} />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={'flex-1 transition-all duration-300 overflow-y-auto ' + mainClass}>
          <div className="container max-w-full p-6 bg-white/[0.31]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-2 space-y-8">
                <Card className="border border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <h2 className="font-montserrat text-lg text-green-900 font-semibold">Welcome to Clario!</h2>
                    <p className="text-sm text-green-900 mt-1">Your Amazon account has been connected successfully.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Your Recovered Value</h2>
                    <div className="text-4xl font-extrabold mt-2 text-green-600">
                      {formatCurrency(14228)}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending Recovery</span>
                        <span className="text-sm font-semibold">{formatCurrency(8560)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-semibold">94%</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button onClick={() => navigate('/recoveries')}>View All Claims</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-montserrat text-lg text-gray-700 font-semibold">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        View Reports
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-0">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-foreground">Recent Activity</h3>
                        <span className="text-xs bg-gray-100 text-black rounded px-2 py-0.5">3 new</span>
                      </div>
                    </div>
                    <div className="py-1 max-h-[600px] overflow-y-auto">
                      <div className="p-3 border-b border-border/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Amazon connection established</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Just now</p>
                      </div>
                      <div className="p-3 border-b border-border/10">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">23 potential claims identified</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                      </div>
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
