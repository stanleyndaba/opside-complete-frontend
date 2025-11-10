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
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-60');
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
                  <div className="inline-flex items-center select-none">
                    <span className="relative inline-flex">
                      <span className="absolute -inset-1 rounded-full bg-emerald-400/20 blur-lg" />
                      <img
                        src="/donelogo.png"
                        alt="Clario"
                        className="relative h-10 w-10 rounded-full object-cover shadow-lg shadow-emerald-500/30"
                      />
                    </span>
                  </div>
                </div>
              )}
            {children}
          </div>
        </main>
      </div>
    </div>;
}