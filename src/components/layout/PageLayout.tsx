import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
}
export function PageLayout({
  children,
  title
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  return <div className="min-h-screen flex flex-col">
      <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            
            {children}
          </div>
        </main>
      </div>
    </div>;
}