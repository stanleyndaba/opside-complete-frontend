import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}
export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar
}: NavbarProps) {
  const location = useLocation();
  const isTransparent =
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing');
  return <header className={cn(
    "sticky top-0 z-30 transition-all duration-300",
    sidebarCollapsed ? "ml-16" : "ml-64",
    isTransparent ? "bg-transparent border-transparent" : "bg-background/90 backdrop-blur-sm border-b",
    className
  )}>
      <div className="container flex items-center h-16 px-4 font-body">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 ml-2" />
        </div>
        {/* Right side - Sync action and Notification Bell */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Labeled sync button */}
          <button title="Start sync now" className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:bg-blue-800 transition-colors" onClick={async () => {
            try {
              const { startSync } = await import('@/lib/inventoryApi');
              await startSync();
            } catch {}
          }}>
            <ArrowUpDown className="h-4 w-4" />
            <span className="text-sm">Sync</span>
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>;
}