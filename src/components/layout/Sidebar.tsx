import React, { useState, useCallback, useMemo } from 'react';
import { LayoutDashboard, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User, Plug, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';

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
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [claimCount, setClaimCount] = useState<number | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const handleSignOut = async () => {
    try { await api.logout(); } catch (_) { }
    window.location.href = '/';
  };

  // Get tenant slug from URL or context
  const currentTenantSlug = tenantSlug || tenant?.slug || 'default';

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
        const r = await api.getRecoveriesMetrics(currentTenantSlug);
        if (r.ok && r.data?.totalClaimsFound !== undefined) {
          setClaimCount(r.data.totalClaimsFound);
        }
      } catch { }
    })();
  }, [currentTenantSlug]);

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  const primaryItems: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: `/app/${currentTenantSlug}` },
    { title: 'Claims', icon: ShieldCheck, href: `/app/${currentTenantSlug}/recoveries` },
    { title: 'Documents and Files', icon: FileText, href: `/app/${currentTenantSlug}/evidence-locker` },
    { title: 'Reports', icon: BarChart3, href: `/app/${currentTenantSlug}/reports` },
    { title: 'Refund Recoveries', icon: Plug, href: `/app/${currentTenantSlug}/upcoming-payments` },
    { title: 'Transaction History', icon: BarChart3, href: `/app/${currentTenantSlug}/transaction-history` },
    { title: 'Integrations', icon: Box, href: `/app/${currentTenantSlug}/integrations-hub` }
  ];

  const secondaryItems: NavItem[] = [
    { title: 'Settings', icon: Settings2, href: `/app/${currentTenantSlug}/settings` },
    { title: 'Help Centre', icon: LifeBuoy, href: `/app/${currentTenantSlug}/help` },
    // { title: "What's New", icon: Sparkles, href: `/app/${currentTenantSlug}/whats-new` } // Hidden for now
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
                  "relative flex items-center justify-center w-8 h-8 transition-colors duration-200 rounded-none",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-900 hover:bg-gray-50"
                )}
                style={{ willChange: 'background-color' }}>
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900" />
                )}
                <item.icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
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
          "relative flex items-center gap-3 w-full px-4 py-2.5 transition-all duration-200 group rounded-none",
          isActive
            ? "bg-gray-50 text-gray-900"
            : "text-gray-900 hover:bg-gray-50/50"
        )}
        style={{ willChange: 'background-color' }}>
        {isActive && (
          <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900" />
        )}
        {!isActive && (
          <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 opacity-0 group-hover:opacity-20 transition-opacity" />
        )}
        <item.icon strokeWidth={isActive ? 2 : 1.5} className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-900")} />
        <span className={cn(
          "text-[13px] transition-colors",
          isActive ? "font-bold" : "font-medium"
        )}>{item.title}</span>
        {item.title === 'Claims' && claimCount !== null && !isCollapsed && (
          <span className="ml-auto text-[13px] text-gray-400 font-mono tabular-nums">
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
        isCollapsed ? "w-16" : "w-60",
        "text-gray-700 border-r border-gray-100",
        "bg-white",
        className
      )}
      style={{ willChange: 'width' }}>
      {/* Branding Header */}
      <div
        className={cn(
          "border-b border-gray-100 flex items-center h-14",
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
        <div className={cn("flex items-center", isCollapsed ? "gap-0" : "gap-2.5")}>
          <img
            src="/logoimagetwo.png"
            alt="Margin"
            className={cn(isCollapsed ? "h-4" : "h-4", "w-auto object-contain")}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                Margin
              </span>
            </div>
          )}
        </div>
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

      {/* Version Badge */}
      <div className={cn(
        "border-t border-gray-100 py-2",
        isCollapsed ? "px-2 text-center" : "px-4"
      )}>
        <span className={cn(
          "text-[10px] font-mono text-gray-400",
          isCollapsed ? "block" : ""
        )}>
          {isCollapsed ? "v1" : "v1.0.0-GOLD"}
        </span>
      </div>

      {/* Logout Only */}
      {isCollapsed ? (
        <div className="mt-auto border-t border-gray-100 py-4 flex flex-col items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSignOutOpen(true)}
                  aria-label="Sign Out"
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 transition-colors rounded-none",
                    "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                  )}>
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-gray-900 text-white text-xs rounded-none">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mt-auto border-t border-gray-100 py-2">
          <button
            onClick={() => setSignOutOpen(true)}
            className="w-full flex items-center gap-2.5 px-6 py-3 text-left hover:bg-gray-50 transition-all group text-gray-900">
            <LogOut className="h-4 w-4 text-gray-400 group-hover:text-gray-900" strokeWidth={1.5} />
            <span className="text-[13px] font-bold">Sign Out</span>
          </button>
        </div>
      )}

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-gray-200 p-0 gap-0 rounded-none">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-base font-semibold text-gray-900">
              Signing out already?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2 leading-relaxed">
              Margin continues to monitor your margins and recover funds around the clock. Log back in anytime to review the latest recoveries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 bg-gray-50/50 flex gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setSignOutOpen(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-none font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSignOut}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-none font-medium"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
