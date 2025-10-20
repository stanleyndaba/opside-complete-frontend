import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  hideNavbar?: boolean;
  hideSidebar?: boolean;
}
export function PageLayout({
  children,
  title,
  hideNavbar,
  hideSidebar
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-64');
  return <div className="min-h-screen flex flex-col platform">
      {!hideNavbar && (
        <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} />
      )}

      <div className="flex-1 flex">
        {!hideSidebar && (
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        )}

        <main className={`flex-1 transition-all duration-300 ${mainIndent}`}>
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            {(hideNavbar && hideSidebar) && (
              <div className="sticky top-0 md:static z-50 -mx-2 px-2 py-2 bg-transparent">
                <div className="inline-flex items-center gap-2 select-none">
                  <img src="/logo-abstract.svg" alt="Clario" className="h-6 w-6" />
                  <span className="text-white font-medium">Clario</span>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>;
}