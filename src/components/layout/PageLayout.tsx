import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  hideNavbar?: boolean;
  hideSidebar?: boolean;
  forceTransparent?: boolean;
  midnight?: boolean;
}
export function PageLayout({
  children,
  title,
  hideNavbar,
  hideSidebar,
  forceTransparent,
  midnight
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const isAuthView = !!hideNavbar && !!hideSidebar;
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-64');
  return <div className={`min-h-screen flex flex-col platform ${isAuthView || midnight ? 'relative bg-[#0B1220]' : ''}`}>
      {(isAuthView || midnight) && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
      )}
      {!hideNavbar && (
        <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} forceTransparent={forceTransparent} />
      )}

      <div className="flex-1 flex">
        {!hideSidebar && (
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        )}

        <main className={`flex-1 transition-all duration-300 ${mainIndent}`}>
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            {(hideNavbar && hideSidebar) && (
              <div className="fixed top-3 left-4 z-50 bg-transparent pointer-events-none">
                <div className="inline-flex items-center gap-2 select-none">
                  <img src="/logo-abstract.svg" alt="Clario" className="h-6 w-6" />
                  <span className="text-gray-100 font-medium">Clario</span>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>;
}