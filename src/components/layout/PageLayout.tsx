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
  const isAuthView = !!hideNavbar && !!hideSidebar;
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-64');
  return <div className={`min-h-screen flex flex-col platform ${isAuthView ? 'relative bg-[#0B1220]' : ''}`}>
      {isAuthView && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_bottom,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%),linear-gradient(to_right,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%)] bg-[length:36px_36px]" />
        </>
      )}
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
              <div className="sticky top-0 md:static z-50 -mx-4 px-4 py-2 rounded-lg border border-white/10 bg-white/0 backdrop-blur-md">
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