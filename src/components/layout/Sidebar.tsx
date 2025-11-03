import React, { useState } from 'react';
import { Home, Shield, Settings, HelpCircle, Sparkles, ChevronLeft, ChevronRight, BarChart3, LogOut, User, Building2, FileText } from 'lucide-react';
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
	const location = useLocation();
  const queryClient = useQueryClient();
  const [showLogout, setShowLogout] = useState(false);
    
	const primaryItems: NavItem[] = [
		{ title: 'Command Center', icon: Home, href: '/app' },
		{ title: 'Reports', icon: BarChart3, href: '/reports' },
		{ title: 'Recoveries', icon: Shield, href: '/recoveries' },
		{ title: 'Evidence Locker', icon: FileText, href: '/evidence-locker' },
	];
	const accountItems: NavItem[] = [
		{ title: 'Configure', icon: Settings, href: '/settings' },
	];
	const supportItems: NavItem[] = [
		{ title: 'Help Centre', icon: HelpCircle, href: '/help' },
		{ title: 'What\'s new', icon: Sparkles, href: '/whats-new' },
	];
	const NavItemComponent = ({
		item
	}: {
		item: NavItem;
	}) => {
		const isActive = location.pathname === item.href;
    const handlePrefetch = () => {
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
    };
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                onMouseEnter={handlePrefetch}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-md transition-colors",
                  isActive
                    ? "bg-white/10 text-gray-100"
                    : "text-gray-400 hover:bg-white/10 hover:text-gray-100"
                )}
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
          "relative flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors",
          isActive
            ? "bg-white/5 text-gray-100"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
        )}
      >
        {isActive && (
          <span className="absolute left-0 h-5 w-[3px] rounded-r bg-emerald-400" />
        )}
        <item.icon strokeWidth={1.5} className="h-5 w-5 shrink-0" />
        <span className="text-[13px] font-medium">{item.title}</span>
      </Link>
    );
	};
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col h-screen z-40",
        isCollapsed ? "w-16" : "w-64",
        "bg-[#0B1220] text-gray-300 border-r border-white/10",
        className
      )}
    >
      {/* Branding + Collapse */}
      <div
        className={cn(
          "border-b border-white/10 flex items-center",
          isCollapsed ? "p-2 justify-center" : "p-4 justify-between"
        )}
      >
        {!isCollapsed ? (
          <>
            <div className="select-none flex items-center gap-2">
              <img src="/logo-abstract.svg" alt="Clario" className="h-6 w-6" />
              <span className="font-[500] text-white">Clario</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <img src="/logo-abstract.svg" alt="Clario" className="h-6 w-6" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Connected" />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className={cn("h-full flex", isCollapsed ? "px-2" : "px-3")}> 
          <div className="w-full h-full flex items-center justify-center">
            <nav className="space-y-3 w-full">
              <div className="space-y-1">
                {primaryItems.map((item, idx) => (
                  <React.Fragment key={`p-${idx}`}>
                    <NavItemComponent item={{...item, href: item.href}} />
                  </React.Fragment>
                ))}
              </div>
              {!isCollapsed && <div className="h-px bg-white/10" />}
              <div className="space-y-1">
                {accountItems.map((item, idx) => (
                  <React.Fragment key={`a-${idx}`}>
                    <NavItemComponent item={item} />
                  </React.Fragment>
                ))}
              </div>
              {!isCollapsed && <div className="h-px bg-white/10" />}
              <div className="space-y-1 pb-2">
                {supportItems.map((item, idx) => (
                  <React.Fragment key={`s-${idx}`}>
                    <NavItemComponent item={item} />
                  </React.Fragment>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* Profile + Status + Logout */}
      {isCollapsed ? (
        <div className="mt-auto border-t border-white/10 p-2 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Logout"
                  className="relative flex items-center justify-center w-12 h-12 rounded-md text-gray-400 hover:bg-white/10 hover:text-red-300 transition-colors"
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
              <TooltipContent side="right" className="bg-black text-white">
                Logout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="mt-auto border-t border-white/10 p-4 space-y-3">
          <button
            className="w-full flex items-center gap-2 text-left text-gray-400 hover:text-red-300 hover:bg-white/5 px-3 py-2 rounded-md"
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
          'absolute top-16 -right-3 z-50 h-8 w-8 rounded-full border border-white/10 bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:bg-white/20',
        )}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}