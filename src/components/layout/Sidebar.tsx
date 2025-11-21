import React, { useState, useCallback, useMemo } from 'react';
import { LayoutDashboard, ShieldCheck, Settings2, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, FileText, LifeBuoy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

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
			default:
				break;
		}
	} catch {}
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
	const { theme } = useTheme();
	const location = useLocation();
  const queryClient = useQueryClient();
  const [showLogout, setShowLogout] = useState(false);
  
  // Check if we're on the Dashboard (Command Center) page
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/app' || location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');

  const primaryItems: NavItem[] = [
    { title: 'Command Center', icon: LayoutDashboard, href: '/app' },
    { title: 'Recoveries', icon: ShieldCheck, href: '/recoveries' },
    { title: 'Doc Locker', icon: FileText, href: '/evidence-locker' },
    { title: 'Reports', icon: BarChart3, href: '/reports' }
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
        queryClient.prefetchQuery({ queryKey: ['dashboard-aggregates', '30d'], queryFn: async () => {
          const r = await api.getDashboardAggregates('30d');
          if (!r.ok || !r.data) throw new Error('aggregate prefetch');
          return r.data;
        }});
        queryClient.prefetchQuery({ queryKey: ['recoveries-metrics'], queryFn: async () => {
          const r = await api.getRecoveriesMetrics();
          if (!r.ok || !r.data) throw new Error('metrics prefetch');
          return r.data;
        }});
      }
      if (item.href === '/recoveries') {
        queryClient.prefetchQuery({ queryKey: ['recoveries-metrics'], queryFn: async () => {
          const r = await api.getRecoveriesMetrics();
          if (!r.ok || !r.data) throw new Error('metrics prefetch');
          return r.data;
        }});
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
                  theme === 'dark'
                    ? isActive
                      ? "bg-white/10 text-gray-100"
                      : "text-gray-400 hover:bg-white/10 hover:text-gray-100"
                    : isActive
                      ? "bg-gray-200 text-[#172B4D]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-[#172B4D]"
                )}
                style={{ willChange: 'background-color' }}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className={cn(
              theme === 'dark' ? "bg-black text-white" : "bg-gray-900 text-white"
            )}>
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
          theme === 'dark'
            ? isActive
              ? "bg-white/5 text-gray-100"
              : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
            : isActive
              ? "bg-gray-200 text-[#172B4D]"
              : "text-gray-600 hover:bg-gray-100 hover:text-[#172B4D]"
        )}
        style={{ willChange: 'background-color' }}
      >
        {isActive && (
          <span className="absolute left-0 h-5 w-[3px] rounded-r bg-emerald-400" />
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
          theme === 'dark'
            ? "text-gray-300 border-r border-white/10 bg-[#0B1220]"
            : "text-[#172B4D] border-r border-gray-200 bg-[#F4F5F7]",
          className
        )}
        style={{ willChange: 'width' }}
      >
        {/* Branding + Collapse */}
        <div
          className={cn(
            "border-b flex items-center",
            theme === 'dark' ? "border-white/10" : "border-gray-200",
            isCollapsed ? "p-2 justify-center" : "p-4 justify-between"
          )}
        >
          {!isCollapsed ? (
            <>
                <div className="select-none flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Connected, secured
                  </span>
                </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Connected, secured" />
            </div>
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
                  {!isCollapsed && <div className={cn(
                    "h-px w-full",
                    theme === 'dark' ? "bg-white/10" : "bg-gray-200"
                  )} />}
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
        <div className="mt-auto border-t border-white/10 p-2 flex flex-col items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings"
                  aria-label="Account"
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    theme === 'dark'
                      ? "text-gray-400 hover:bg-white/10 hover:text-emerald-500"
                      : "text-gray-600 hover:bg-gray-100 hover:text-emerald-500"
                  )}
                >
                  <User className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn(
                theme === 'dark' ? "bg-black text-white" : "bg-gray-900 text-white"
              )}>
                Account
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Logout"
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                    theme === 'dark'
                      ? "text-gray-400 hover:bg-white/10 hover:text-red-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-red-500"
                  )}
                  onClick={async () => {
                    const ok = window.confirm('Log out of Clario?');
                    if (!ok) return;
                    try { await api.logout(); } catch (_) {}
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn(
                theme === 'dark' ? "bg-black text-white" : "bg-gray-900 text-white"
              )}>
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mt-auto border-t border-white/10 p-4 space-y-3">
            <Link
              to="/settings"
              className={cn(
                "w-full flex items-center gap-2 text-left px-3 py-2 rounded-md transition-colors",
                theme === 'dark'
                  ? "hover:text-emerald-500 hover:bg-white/5 text-gray-400"
                  : "hover:text-emerald-500 hover:bg-gray-100 text-gray-600"
              )}
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Account</span>
            </Link>
            <button
              className={cn(
                "w-full flex items-center gap-2 text-left px-3 py-2 rounded-md",
                theme === 'dark'
                  ? "hover:text-red-300 hover:bg-white/5 text-gray-400"
                  : "hover:text-red-500 hover:bg-gray-100 text-gray-600"
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
                onClick={async () => { try { await api.logout(); } catch (_) {} window.location.href = '/'; }}
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
          'absolute top-16 -right-3 z-50 h-8 w-8 rounded-full backdrop-blur-sm flex items-center justify-center',
          theme === 'dark'
            ? "border border-white/10 bg-white/10 text-gray-300 hover:bg-white/20"
            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100",
        )}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}