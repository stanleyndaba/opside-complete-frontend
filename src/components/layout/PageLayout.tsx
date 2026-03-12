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
  noPadding?: boolean;
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
  hideLogo,
  noPadding
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };
  const isAuthView = !!hideNavbar && !!hideSidebar;
  const shouldShowMidnightBg = !plainBackground && (isAuthView || midnight);
  const mainIndent = hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-60');
  return <div className={`min-h-screen h-full flex flex-col platform ${shouldShowMidnightBg ? 'relative bg-[#070707]' : plainBackground ? 'bg-white' : 'bg-[#070707]'}`}>
    {shouldShowMidnightBg && (
      <>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
      </>
    )}
    {!hideNavbar && (
      <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} forceTransparent={forceTransparent} />
    )}

    <div className={`flex-1 flex ${shouldShowMidnightBg ? 'bg-[#070707]' : ''}`}>
      {!hideSidebar && (
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      )}

      <main className={`flex-1 transition-all duration-300 ${mainIndent} overflow-hidden ${shouldShowMidnightBg ? 'bg-[#070707]' : ''}`}>
        <div className={`w-full max-w-full mx-auto ${noPadding ? '' : 'px-4 lg:px-6 pb-4 lg:pb-6'} animate-fade-in overflow-x-hidden ${shouldShowMidnightBg ? 'bg-[#070707] min-h-screen' : ''}`}>
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
