import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
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
  return <header className={cn("bg-background/90 backdrop-blur-sm sticky top-0 z-30 border-b transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-56", className)}>
      <div className="container flex items-center h-16 px-4 font-body">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 ml-2" />
        </div>
        {/* Right side - Sync action and Notification Bell */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Labeled sync button */}
          <button title="Start sync now" className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50" onClick={async () => {
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