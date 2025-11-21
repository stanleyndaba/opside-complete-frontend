import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, Search, Gift, Link2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const pathTransparent =
    location.pathname === '/' ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/integrations-hub') ||
    location.pathname.startsWith('/integrations/reconnect') ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/upcoming-payments') ||
    location.pathname.startsWith('/revenue-model') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help') ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/smart-inventory-sync') ||
    location.pathname.startsWith('/sync');
  const isTransparent = !!forceTransparent || pathTransparent;
  
  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  // State for referral popup
  const [showReferralPopup, setShowReferralPopup] = useState(false);

  // Language preference removed on platform navbar per design

  // Sandbox badge: show in non-production or when VITE_SANDBOX=true
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
  const isSandbox = String(env.VITE_SANDBOX || '') === 'true' || String(env.MODE || env.NODE_ENV || '') !== 'production';
  return <header className={cn(
    "sticky top-0 z-30 transition-all duration-300",
    sidebarCollapsed ? "ml-16" : "ml-60",
    isTransparent ? "!bg-transparent !border-transparent backdrop-blur-none shadow-none" : "bg-background/60 backdrop-blur-sm border-b",
    className
  )}>
        <div className="container flex items-center h-16 px-4 font-body">
          {/* Center - Search */}
          <div className="flex-1 max-w-xl hidden md:block md:mx-4">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-[2]',
                  isDashboard ? 'text-gray-400' : (isTransparent ? 'text-gray-400' : 'text-gray-600')
                )} />
                <Input
                  aria-label="Search"
                  placeholder="search invoices, products, documents, and more"
                  variant={isTransparent ? 'dark' : 'default'}
                  className={cn(
                    "pl-9 h-9 rounded-md",
                    isDashboard && "!bg-white/5 !border-white/10 !text-gray-200 !placeholder:text-gray-400 backdrop-blur-sm",
                    isTransparent && !isDashboard && "!bg-white/10 !border-white/20 !text-gray-200 !placeholder:text-gray-400 backdrop-blur-sm"
                  )}
                />
              </div>
              {/* Message icon - visible on all pages */}
              <NotificationBell
                label="Messages"
                iconOverride={Mail}
                showLabel={false}
                className={cn(
                  "group h-9 w-9 flex items-center justify-center rounded-md transition-colors",
                  isDashboard 
                    ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                    : isTransparent 
                      ? "text-gray-200 hover:text-white hover:bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                iconClassName={cn(
                  isDashboard 
                    ? "text-emerald-500 group-hover:text-emerald-600"
                    : isTransparent 
                      ? "text-gray-200 group-hover:text-white"
                      : ""
                )}
              />
              {/* Gift icon - only on dashboard */}
              {isDashboard && (
                <button
                  onClick={() => setShowReferralPopup(true)}
                  className="flex items-center gap-2 h-9 px-3 rounded-md text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  aria-label="Referral program"
                >
                  <Gift className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          {/* Right side - Theme Toggle, Connect Platform button and Sandbox badge */}
          <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle 
            className={cn(
              isDashboard && theme === 'dark' 
                ? "text-gray-200 hover:text-white hover:bg-white/10" 
                : isTransparent && theme === 'dark'
                  ? "text-gray-200 hover:text-white hover:bg-white/10"
                  : ""
            )}
          />
          <Button
            onClick={() => navigate('/integrations-hub')}
            variant="ghost"
            className={cn(
              "flex items-center gap-2 h-9 px-3",
              isDashboard && theme === 'dark' ? 'bg-transparent text-[#F5F5F5] hover:bg-white/10 hover:text-[#F5F5F5]' : 
              isTransparent && theme === 'dark' ? 'text-gray-200 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Link2 className={cn("h-4 w-4", isDashboard && theme === 'dark' && "text-[#F5F5F5]")} />
            <span className="hidden sm:inline">Connect Platform</span>
          </Button>
          {isSandbox && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded border',
              isTransparent ? 'border-amber-300/30 text-amber-200 bg-amber-500/10' : 'border-amber-600/30 text-amber-700 bg-amber-50'
            )}>
              Sandbox
            </span>
        )}
          {/* Language selector removed */}
      </div>
    </div>
    
    {/* Referral Popup */}
    <Dialog open={showReferralPopup} onOpenChange={setShowReferralPopup}>
      <DialogContent className="max-w-sm bg-emerald-50/95 border border-emerald-200/80 shadow-lg rounded-lg p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
            <Gift className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-900">
              No commission on referrals
            </h3>
            <p className="text-sm text-emerald-700">
              Bring new sellers to Clario and keep 100% of their recovered funds.
            </p>
          </div>
          <Button
            onClick={() => {
              // TODO: Implement invite friend functionality
              setShowReferralPopup(false);
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md transition-colors shadow-md hover:shadow-lg"
          >
            Invite Friend +
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </header>;
}