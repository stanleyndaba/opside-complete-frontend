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
  hideLogo?: boolean;
}
export function PageLayout({
  children,
  title,
  hideNavbar,
  hideSidebar,
  forceTransparent,
  midnight,
  plainBackground,
  logoFontFamily,
  hideLogo
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const isAuthView = !!hideNavbar && !!hideSidebar;
  const shouldShowMidnightBg = !plainBackground && (isAuthView || midnight);
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-60');
  return <div className={`min-h-screen flex flex-col platform ${shouldShowMidnightBg ? 'relative bg-[#050505]' : plainBackground ? 'bg-white' : ''}`}>
    {shouldShowMidnightBg && (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.03),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.03),transparent_35%)]" />
    )}
    {!hideNavbar && (
      <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} forceTransparent={forceTransparent} />
    )}

    <div className={`flex-1 flex ${shouldShowMidnightBg ? 'bg-[#050505]' : ''}`}>
      {!hideSidebar && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      )}

      <main className={`flex-1 transition-all duration-300 ${mainIndent} overflow-hidden ${shouldShowMidnightBg ? 'bg-[#050505]' : ''}`}>
        <div className={`w-full max-w-full mx-auto p-4 lg:p-6 animate-fade-in overflow-x-hidden ${shouldShowMidnightBg ? 'bg-[#050505] min-h-screen' : ''}`}>
          {(hideNavbar && hideSidebar && !hideLogo) && (
            <div className="fixed top-4 left-5 z-50 pointer-events-none">
              <img
                src="/logoimagetwo.png"
                alt="Margin"
                className="h-4 w-auto object-contain invert brightness-0 opacity-80"
              />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  </div>;
}
