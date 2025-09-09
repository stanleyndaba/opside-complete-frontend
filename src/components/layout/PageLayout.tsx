import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/use-auth';
interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}
export function PageLayout({
  children,
  title
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isDemo, exitDemo } = useAuth();
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar sidebarCollapsed={isSidebarCollapsed} />
      
      <div className="flex-1 flex">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            {isDemo && (
              <div className="mb-4 p-3 border bg-yellow-50 text-yellow-800 text-sm flex items-center justify-between">
                <span>Demo Mode: Data is simulated for preview. Connect Amazon to see live data.</span>
                <button onClick={exitDemo} className="underline">Exit Demo</button>
              </div>
            )}
            
            {children}
          </div>
        </main>
      </div>
    </div>;
}