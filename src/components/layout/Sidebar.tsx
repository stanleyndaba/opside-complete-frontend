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
  const [showLogout, setShowLogout] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

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

  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  const primaryItems: NavItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: '/app' },
    { title: 'Claims', icon: ShieldCheck, href: '/recoveries' },
    { title: 'Doc Locker', icon: FileText, href: '/evidence-locker' },
    // { title: 'Reports', icon: BarChart3, href: '/reports' }, // Hidden for MVP
    { title: 'Refund Recoveries', icon: Plug, href: '/upcoming-payments' },
    { title: 'Integrations', icon: Box, href: '/integrations-hub' }
  ];

  const secondaryItems: NavItem[] = [
    { title: 'Settings', icon: Settings2, href: '/settings' },
    { title: 'Help Centre', icon: LifeBuoy, href: '/help' },
    { title: "What's New", icon: Sparkles, href: '/whats-new' }
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
                  "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-gray-200 text-[#36454F]"
                    : "text-[#36454F] hover:bg-gray-200 hover:text-[#36454F]"
                )}
                style={{ willChange: 'background-color' }}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-black text-white">
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
          "relative flex items-center gap-3 w-full px-3 py-1.5 rounded-md transition-colors duration-200",
          isActive
            ? "bg-gray-200 text-[#36454F]"
            : "text-[#36454F] hover:bg-gray-200 hover:text-[#36454F]"
        )}
        style={{ willChange: 'background-color' }}
      >
        {isActive && (
          <span className="absolute left-0 h-5 w-[3px] rounded-r bg-emerald-500" />
        )}
        <item.icon strokeWidth={1.5} className="h-5 w-5 shrink-0" />
        <span className="text-[13px] font-medium">{item.title}</span>
      </Link>
    );
  });
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col h-screen z-40 gpu-accelerated",
        isCollapsed ? "w-16" : "w-60",
        "text-[#36454F] border-r border-gray-300",
        "bg-[#EEEEEE]",
        className
      )}
      style={{ willChange: 'width' }}
    >
      {/* Branding + Collapse */}
      <div
        className={cn(
          "border-b border-gray-300 flex items-center",
          isCollapsed ? "p-2 justify-center" : "p-4 justify-start"
        )}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img
              src="/logoimagetwo.png"
              alt="Clario"
              className="h-4 w-auto object-contain"
            />
          </div>
        ) : (
          <img
            src="/logoimagetwo.png"
            alt="Clario"
            className="h-3 w-auto object-contain"
          />
        )}
      </div>

      <ScrollArea className="flex-1">
        <div
          className={cn(
            "h-full flex",
            isCollapsed ? "px-1.5" : "px-2"
          )}
        >
          <nav className={cn("w-full flex flex-col items-center pt-8 pb-4 space-y-1", isCollapsed ? "space-y-1" : "space-y-4")}>
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-1" : "items-start space-y-1")}>
              {primaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
            {!isCollapsed && <div className="h-px bg-gray-300 w-full" />}
            <div className={cn("w-full flex flex-col", isCollapsed ? "items-center space-y-1" : "items-start space-y-1")}>
              {secondaryItems.map((item) => (
                <NavItemComponent key={item.title} item={item} />
              ))}
            </div>
          </nav>
        </div>
      </ScrollArea>

      {/* Profile + Status + Logout */}
      {isCollapsed ? (
        <div className="mt-auto border-t border-gray-300 p-2 flex flex-col items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  aria-label="Account"
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    "text-[#36454F] hover:bg-gray-200 hover:text-emerald-600"
                  )}
                >
                  <User className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white">
                Account
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Logout"
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    "text-[#36454F] hover:bg-gray-200 hover:text-red-600"
                  )}
                  onClick={async () => {
                    const ok = window.confirm('Log out of Clario?');
                    if (!ok) return;
                    try { await api.logout(); } catch (_) { }
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mt-auto border-t border-gray-300 p-4 space-y-3">
          <Link
            to="/settings"
            className={cn(
              "w-full flex flex-col text-left hover:text-emerald-600 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors",
              "text-[#36454F]"
            )}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Account</span>
            </div>
            <div className="select-none flex flex-col mt-1 ml-6">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-[#36454F]">Connected, secured</span>
              </div>
              {connectedEmail && (
                <span className="text-[10px] text-gray-500 ml-2.5 truncate max-w-[140px]" title={connectedEmail}>
                  {connectedEmail}
                </span>
              )}
            </div>
          </Link>
          <button
            className={cn(
              "w-full flex items-center gap-2 text-left hover:text-red-600 hover:bg-gray-200 px-3 py-2 rounded-md",
              "text-[#36454F]"
            )}
            onClick={() => setShowLogout(prev => !prev)}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </button>
          {showLogout && (
            <div className="mt-1 rounded-md border border-red-200/20 bg-red-500/5 p-3">
              <button
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
                onClick={async () => { try { await api.logout(); } catch (_) { } window.location.href = '/'; }}
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
      {/* Edge toggle handle */}
      <button
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={onToggle}
        className={cn(
          'absolute top-16 -right-3 z-50 h-8 w-8 rounded-full border border-gray-300 bg-white backdrop-blur-sm flex items-center justify-center text-[#36454F] hover:bg-gray-200 shadow-md',
        )}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}