import React from 'react';
import { Home, Shield, Settings, HelpCircle, Sparkles, ChevronLeft, ChevronRight, BarChart3, Plug, Edit3 } from 'lucide-react';
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
	const primaryItems: NavItem[] = [
		{ title: 'Command Center', icon: Home, href: '/app' },
		{ title: 'Reports', icon: BarChart3, href: '/reports' },
		{ title: 'Recoveries', icon: Shield, href: '/recoveries' },
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
			return <TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link to={item.href} onMouseEnter={handlePrefetch} className={cn("flex items-center justify-center w-12 h-12 rounded-md transition-colors", isActive ? "bg-slate-800 text-emerald-400" : "text-slate-200 hover:bg-slate-800") }>
								<item.icon className="h-5 w-5" strokeWidth={1.5} />
							</Link>
						</TooltipTrigger>
						<TooltipContent side="right" className="bg-black text-white">
							{item.title}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>;
		}
		return <Link to={item.href} onMouseEnter={handlePrefetch} className={cn("flex items-center gap-3 px-3 py-2 rounded-md transition-colors", isActive ? "bg-slate-800 text-emerald-400" : "text-slate-200 hover:bg-slate-800")}>
				<item.icon strokeWidth={1.5} className="h-5 w-5 shrink-0 text-sm font-extralight" />
				<span className="text-sm font-normal">{item.title}</span>
			</Link>;
	};
	return <aside className={cn("bg-slate-950 fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800 h-screen z-40", isCollapsed ? "w-16" : "w-56", className)}>
			{/* Toggle Button */}
			<div className="absolute -right-3 top-6 z-10">
				<Button onClick={onToggle} variant="outline" size="icon" className="h-6 w-6 rounded-full bg-slate-900 border border-slate-700 shadow-sm hover:bg-slate-800 text-slate-200">
					{isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
				</Button>
			</div>

			{/* Logo Section */}
			{!isCollapsed ? <div className="p-4 border-b border-slate-800 flex justify-center">
					<img src="/clario-logo-dark.svg" alt="Clario" className="h-10 w-10" />
				</div> : <div className="p-2 border-b border-slate-800 flex justify-center">
					<img src="/clario-logo-dark.svg" alt="Clario" className="h-8 w-8" />
				</div>}

			<ScrollArea className="flex-1">
				<div className={cn("h-full flex", isCollapsed ? "px-2" : "px-4")}> 
					<div className="my-auto w-full">
						{!isCollapsed && (
							<div className="pt-3 pb-2">
								<div className="flex items-center justify-between">
									<div>
										<div className="text-sm font-semibold text-slate-100">Martin Links</div>
										<div className="text-xs text-slate-400">martin@example.com</div>
										<div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
										</div>
									</div>
									<button className="text-slate-400 hover:text-slate-200" title="Edit profile" onClick={() => (window.location.href = '/settings')}>
										<Edit3 className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
						<nav className="space-y-4 py-2 w-full text-slate-200">
							<div className="space-y-1">
								{primaryItems.map((item, idx) => <NavItemComponent key={`p-${idx}`} item={item} />)}
							</div>
							{!isCollapsed && <div className="h-px bg-slate-800" />}
							<div className="space-y-1">
								{accountItems.map((item, idx) => <NavItemComponent key={`a-${idx}`} item={item} />)}
							</div>
							{!isCollapsed && <div className="h-px bg-slate-800" />}
							<div className="space-y-1 pb-4">
								{supportItems.map((item, idx) => <NavItemComponent key={`s-${idx}`} item={item} />)}
							</div>
						</nav>
					</div>
				</div>
			</ScrollArea>
		</aside>;
}