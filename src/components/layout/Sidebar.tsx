import React, { useState, useCallback, useMemo } from 'react';
import { LayoutDashboard, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User, Plug, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Lightweight prefetch using dynamic import hints matching route chunks
const prefetchRoute = (path: string) => {
  try {
    switch (path) {
      case '/app':
        import('@/components/layout/Dashboard');
        break;
      case '/reports':
        import('@/pages/Reports');
        break;
      case '/upcoming-payments':
        import('@/pages/UpcomingPayments');
        break;
      case '/recoveries':
        import('@/pages/Recoveries');
        break;
      case '/settings':
        import('@/pages/Settings');
        break;
      case '/help':
        import('@/pages/Help');
        break;
      case '/whats-new':
        import('@/pages/WhatsNew');
        break;
      case '/integrations-hub':
        import('@/pages/IntegrationsHub');
        break;
      default:
        break;
    }
  } catch { }
};
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}
interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}
interface NavSection {
  title: string;
  items: NavItem[];
}
export function Sidebar({
  isCollapsed,
  onToggle,
  className
}: SidebarProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [claimCount, setClaimCount] = useState<number | null>(null);

  // Fetch connected email from evidence sources
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.getEvidenceSources();
        if (r.ok && r.data?.sources) {
          const gmailSource = r.data.sources.find((s: any) => s.provider === 'gmail' && s.status === 'connected');
          if (gmailSource?.account_email) {
            setConnectedEmail(gmailSource.account_email);
          }
        }
      } catch { }
    })();
  }, []);

  // Fetch claim count
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.getRecoveriesMetrics();
        if (r.ok && r.data?.totalClaimsFound !== undefined) {
          setClaimCount(r.data.totalClaimsFound);
        }
      } catch { }
    })();
  }, []);

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  const primaryItems: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: '/app' },
    { title: 'Claims', icon: ShieldCheck, href: '/recoveries' },
    { title: 'Documents and Files', icon: FileText, href: '/evidence-locker' },
    // { title: 'Reports', icon: BarChart3, href: '/reports' }, // Hidden for MVP
    { title: 'Refund Recoveries', icon: Plug, href: '/upcoming-payments' },
    { title: 'Transaction History', icon: BarChart3, href: '/transaction-history' },
    { title: 'Integrations', icon: Box, href: '/integrations-hub' }
  ];

  const secondaryItems: NavItem[] = [
    { title: 'Settings', icon: Settings2, href: '/settings' },
    { title: 'Help Centre', icon: LifeBuoy, href: '/help' },
    // { title: "What's New", icon: Sparkles, href: '/whats-new' } // Hidden for now
  ];
  const NavItemComponent = React.memo(({
    item
  }: {
    item: NavItem;
  }) => {
    const isActive = location.pathname === item.href;
    const handlePrefetch = useCallback(() => {
      prefetchRoute(item.href);
      if (item.href === '/app') {
        queryClient.prefetchQuery({
          queryKey: ['dashboard-aggregates', '30d'], queryFn: async () => {
            const r = await api.getDashboardAggregates('30d');
            if (!r.ok || !r.data) throw new Error('aggregate prefetch');
            return r.data;
          }
        });
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics'], queryFn: async () => {
            const r = await api.getRecoveriesMetrics();
            if (!r.ok || !r.data) throw new Error('metrics prefetch');
            return r.data;
          }
        });
      }
      if (item.href === '/recoveries') {
        queryClient.prefetchQuery({
          queryKey: ['recoveries-metrics'], queryFn: async () => {
            const r = await api.getRecoveriesMetrics();
            if (!r.ok || !r.data) throw new Error('metrics prefetch');
            return r.data;
          }
        });
      }
    }, [item.href, queryClient]);
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                onMouseEnter={handlePrefetch}
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 transition-colors duration-200",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
                style={{ willChange: 'background-color' }}>
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white text-xs">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Link
        to={item.href}
        onMouseEnter={handlePrefetch}
        className={cn(
          "relative flex items-center gap-2.5 w-full px-3 py-2 transition-colors duration-200",
          isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
        style={{ willChange: 'background-color' }}>
        {isActive && (
          <span className="absolute left-0 h-4 w-[2px] bg-gray-900" />
        )}
        <item.icon strokeWidth={1.5} className="h-4 w-4 shrink-0" />
        <span className="text-[11px] font-medium">{item.title}</span>
        {item.title === 'Claims' && claimCount !== null && !isCollapsed && (
          <span className="ml-auto text-[10px] text-gray-600 font-medium tabular-nums">
            {claimCount}
          </span>
        )}
      </Link>
    );
  });
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col h-screen z-40 gpu-accelerated",
        isCollapsed ? "w-16" : "w-56",
        "text-gray-700 border-r border-gray-200",
        "bg-white",
        className
      )}
      style={{ willChange: 'width' }}>
      {/* Branding + Collapse */}
      <div
        className={cn(
          "border-b border-gray-200 flex flex-col",
          isCollapsed ? "p-2 items-center justify-center" : "px-4 py-3 items-start justify-center"
        )}>
        <div className="flex items-center gap-2">
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            className={cn(isCollapsed ? "h-3" : "h-4", "w-auto object-contain")}
          />
          {!isCollapsed && (
            <span className="font-montserrat text-gray-900 text-sm tracking-tight" style={{ fontWeight: 600 }}>
              Margin
            </span>
          )}
        </div>
        {!isCollapsed && (
          <div className="select-none flex flex-col mt-1 ml-0">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span className="text-[9px] text-gray-500 tracking-[0.1em]">Secured</span>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div
          className={cn(
            "h-full flex",
            isCollapsed ? "px-2" : "px-3"
          )}>
          <nav className={cn("w-full flex flex-col items-center pt-6 pb-4 space-y-1", isCollapsed ? "space-y-0.5" : "space-y-3")}>
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-0.5" : "items-start space-y-0.5")}>
              {primaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
            {!isCollapsed && <div className="h-px bg-gray-200 w-full" />}
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-0.5" : "items-start space-y-0.5")}>
              {secondaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
          </nav>
        </div>
      </ScrollArea>

      {/* Profile + Status + Logout */}
      {isCollapsed ? (
        <div className="mt-auto border-t border-gray-200 p-2 flex flex-col items-center justify-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  aria-label="Account"
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 transition-colors",
                    "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                  <User className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white text-xs">
                Account
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mt-auto border-t border-gray-200 px-3 py-3 space-y-1">
          <Link
            to="/settings"
            className={cn(
              "w-full flex flex-col text-left hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 transition-colors",
              "text-gray-600"
            )}>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs">Account</span>
            </div>
            <div className="select-none flex flex-col mt-0.5">
              {connectedEmail && (
                <span className="text-[9px] text-gray-500 truncate max-w-[130px] ml-5" title={connectedEmail}>
                  {connectedEmail}
                </span>
              )}
            </div>
          </Link>
        </div>
      )}
      {/* Edge toggle handle */}
      <button
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        className={cn(
          'absolute top-14 -right-2.5 z-50 h-6 w-6 rounded-full border border-gray-300 bg-white backdrop-blur-sm flex items-center justify-center text-[#36454F] hover:bg-gray-200 shadow-sm',
        )}>
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
