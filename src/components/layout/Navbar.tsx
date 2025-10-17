import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  forceTransparent?: boolean;
}
export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar,
  forceTransparent
}: NavbarProps) {
  const location = useLocation();
  const pathTransparent =
    location.pathname === '/' ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/integrations-hub') ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help') ||
    location.pathname.startsWith('/auth');
  const isTransparent = !!forceTransparent || pathTransparent;

  // Language preference removed on platform navbar per design

  // Sandbox badge: show in non-production or when VITE_SANDBOX=true
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
  const isSandbox = String(env.VITE_SANDBOX || '') === 'true' || String(env.MODE || env.NODE_ENV || '') !== 'production';
  return <header className={cn(
    "sticky top-0 z-30 transition-all duration-300",
    sidebarCollapsed ? "ml-16" : "ml-64",
    isTransparent ? "bg-transparent border-transparent backdrop-blur-0 shadow-none" : "bg-background/60 backdrop-blur-sm border-b",
    className
  )}>
      <div className="container flex items-center h-16 px-4 font-body">
        {/* Left spacer */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 ml-2" />
        </div>
        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4',
              isTransparent ? 'text-gray-300' : 'text-muted-foreground'
            )} />
            <Input
              aria-label="Search"
              placeholder="search invoices, products, documents, and more"
              variant={isTransparent ? 'dark' : 'default'}
              className="pl-9 h-9 rounded-md"
            />
          </div>
        </div>
        {/* Right side - Sandbox badge, Sync, Notifications */}
        <div className="flex items-center gap-4 ml-auto">
          {isSandbox && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded border',
              isTransparent ? 'border-amber-300/30 text-amber-200 bg-amber-500/10' : 'border-amber-600/30 text-amber-700 bg-amber-50'
            )}>
              Sandbox
            </span>
          )}
          {/* Language selector removed */}
          {/* Labeled sync button */}
          <button
            title="Reconcile & Sync"
            className={cn(
              'inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm transition-colors border',
              isTransparent ? 'bg-white/5 border-white/10 text-gray-100 hover:bg-white/10' : 'bg-background border-border hover:bg-accent hover:text-accent-foreground'
            )}
            onClick={() => { window.location.href = '/smart-inventory-sync'; }}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Reconcile & Sync</span>
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>;
}