import React from 'react';
import { User, LogOut, Building2, RefreshCw, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
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
        {/* Left: Toggle + Spacer */}
        <div className="flex items-center gap-3">
          <button title="Toggle sidebar" className="h-8 w-8 rounded-md flex items-center justify-center border border-gray-200 text-gray-700 hover:bg-gray-100" onClick={onToggleSidebar}>
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
        {/* Right side - Sync action, Notification Bell and Profile Icon */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Subtle sync button with tooltip-like title */}
          <button title="Start sync now" className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-100" onClick={async () => {
            try {
              const { startSync } = await import('@/lib/inventoryApi');
              await startSync();
            } catch {}
          }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105 cursor-pointer">
                <AvatarFallback className="bg-transparent text-black">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-64 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuLabel className="pb-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-black">John Smith</p>
                  <p className="text-xs text-gray-600">john.smith@example.com</p>
                  <div className="flex items-center gap-1 pt-1">
                    <Building2 className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Viewing: John's Amazon Store</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600" onClick={async () => { try { await api.logout(); } catch (_) {} window.location.href = '/'; }}>
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
}