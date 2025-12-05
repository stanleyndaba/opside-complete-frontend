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
  plainBackground?: boolean;
  logoFontFamily?: string;
}
export function PageLayout({
  children,
  title,
  hideNavbar,
  hideSidebar,
  forceTransparent,
  midnight,
  plainBackground,
  logoFontFamily
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const isAuthView = !!hideNavbar && !!hideSidebar;
  const shouldShowMidnightBg = !plainBackground && (isAuthView || midnight);
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-60');
  return <div className={`min-h-screen flex flex-col platform ${shouldShowMidnightBg ? 'relative bg-[#0B1220]' : plainBackground ? 'bg-white' : ''}`}>
    {shouldShowMidnightBg && (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
    )}
    {!hideNavbar && (
      <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} forceTransparent={forceTransparent} />
    )}

    <div className="flex-1 flex">
      {!hideSidebar && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      )}

      <main className={`flex-1 transition-all duration-300 ${mainIndent} overflow-hidden`}>
        <div className="w-full max-w-full mx-auto p-4 lg:p-6 animate-fade-in overflow-x-hidden">
          {(hideNavbar && hideSidebar) && (
            <div className="fixed top-3 left-4 z-50 pointer-events-none">
              <span
                className={`tracking-tight text-xl select-none bg-gradient-to-r from-[#1e3a5f] via-[#4a90a4] to-[#2d5a7b] bg-clip-text text-transparent ${logoFontFamily ? 'clario-logo-nunito' : ''}`}
              >
                CLARIO
              </span>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  </div>;
}