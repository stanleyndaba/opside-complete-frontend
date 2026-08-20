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
  plainBackground,
  hideLogo,
  noPadding
}: PageLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const isPlatformPage = !hideNavbar || !hideSidebar;

  return (
    <div className={`min-h-screen h-full flex flex-col platform platform-vitality-page ${isPlatformPage ? 'platform-authenticated-shell' : ''} bg-[#FAFAF7] text-[#111827]`}>
      {!hideNavbar && (
        <Navbar sidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} forceTransparent={forceTransparent} />
      )}

      <div className="flex-1 flex bg-[#FAFAF7]">
        {!hideSidebar && (
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        )}

        <main className={`flex-1 transition-all duration-300 ${hideSidebar ? 'ml-0' : (isSidebarCollapsed ? 'ml-16' : 'ml-[282px]')} overflow-hidden bg-[#FAFAF7]`}>
          <div className={`w-full max-w-full mx-auto ${noPadding ? '' : 'px-4 lg:px-6 pb-4 lg:pb-6'} animate-fade-in overflow-x-hidden min-h-screen bg-[#FAFAF7]`}>
            {hideNavbar && hideSidebar && !hideLogo && (
              <div className="fixed top-4 left-5 z-50 pointer-events-none">
                <span className="brand-wordmark font-merriweather text-xl tracking-tight text-[#111827]">Margin</span>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
