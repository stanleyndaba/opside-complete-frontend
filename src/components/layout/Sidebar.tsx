import React from 'react';
import { Home, Shield, Settings, HelpCircle, Sparkles, BarChart3, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    onToggle: _onToggle,
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
							<Link to={item.href} onMouseEnter={handlePrefetch} className={cn("flex items-center justify-center w-12 h-12 rounded-md transition-colors", isActive ? "bg-gray-100 text-black" : "text-gray-900 hover:bg-gray-100 hover:text-gray-700")}>
								<item.icon className="h-5 w-5" strokeWidth={1.5} />
							</Link>
						</TooltipTrigger>
						<TooltipContent side="right" className="bg-black text-white">
							{item.title}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>;
		}
    return <Link to={item.href} onMouseEnter={handlePrefetch} className={cn(
			"flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
			isActive ? "bg-gray-100 text-black" : "text-black hover:bg-gray-100 hover:text-gray-700"
		)}>
				<item.icon strokeWidth={1.5} className="h-5 w-5 shrink-0" />
				<span className="text-sm font-medium">{item.title}</span>
			</Link>;
	};
	return <aside className={cn("fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col h-screen z-40",
		isCollapsed ? "w-16" : "w-56",
		"bg-white text-gray-900 border-r border-gray-200",
		className)}>
            {/* Internal Header */}
            <div className={cn("border-b border-gray-200 flex items-center", isCollapsed ? "p-2 justify-start" : "p-3 justify-start") }>
				<div className={cn("select-none", isCollapsed ? "text-base" : "text-xl")}
					style={{ fontFamily: 'Montserrat, sans-serif' }}>
					<span className="font-black text-black">{isCollapsed ? 'C' : 'Clario'}</span>
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className={cn("h-full flex", isCollapsed ? "px-2" : "px-4")}> 
						<div className="my-auto w-full">
						{!isCollapsed && (
							<div className="pt-3 pb-2">
								<div className="flex items-center justify-between">
									<div>
											<div className="text-sm font-semibold text-black">Martin Links</div>
											<div className="text-xs text-gray-500">martin@example.com</div>
											<div className="text-[11px] text-green-700 flex items-center gap-1 mt-1">
											<span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Connected
										</div>
									</div>
										<button className="text-gray-500 hover:text-gray-700" title="Edit profile" onClick={() => (window.location.href = '/settings')}>
										<Edit3 className="h-4 w-4" />
									</button>
								</div>
							</div>
						)}
							<nav className="space-y-4 py-2 w-full">
								<div className="space-y-1">
									{primaryItems.map((item, idx) => <React.Fragment key={`p-${idx}`}><NavItemComponent item={item} /></React.Fragment>)}
								</div>
								{!isCollapsed && <div className="h-px bg-gray-100" />}
								<div className="space-y-1">
									{accountItems.map((item, idx) => <React.Fragment key={`a-${idx}`}><NavItemComponent item={item} /></React.Fragment>)}
								</div>
								{!isCollapsed && <div className="h-px bg-gray-100" />}
								<div className="space-y-1 pb-4">
									{supportItems.map((item, idx) => <React.Fragment key={`s-${idx}`}><NavItemComponent item={item} /></React.Fragment>)}
								</div>
                                
						</nav>
					</div>
				</div>
			</ScrollArea>
		</aside>;
}