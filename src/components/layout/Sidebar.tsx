import React from 'react';
import { Home, Shield, Settings, HelpCircle, Sparkles, PanelLeftClose, PanelLeftOpen, BarChart3, Plug, Edit3, X } from 'lucide-react';
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
    const [ctaDismissed, setCtaDismissed] = React.useState<boolean>(() => {
        try {
            return localStorage.getItem('cta:inbox-supercharged:dismissed') === 'true';
        } catch {
            return false;
        }
    });
    const handleDismissCta = () => {
        try {
            localStorage.setItem('cta:inbox-supercharged:dismissed', 'true');
        } catch {}
        setCtaDismissed(true);
    };
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
			{/* Internal Header with Collapse Control */}
			<div className={cn("border-b border-gray-200 flex items-center", isCollapsed ? "p-2 justify-between" : "p-3 justify-between") }>
				<div className={cn("select-none", isCollapsed ? "text-base" : "text-xl")}
					style={{ fontFamily: 'Montserrat, sans-serif' }}>
					<span className="font-black text-black">{isCollapsed ? 'C' : 'Clario'}</span>
				</div>
				<Button onClick={onToggle} variant="outline" size="icon" className="h-8 w-8 rounded-md bg-transparent border border-gray-200 hover:bg-gray-100 text-gray-700">
					{isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
				</Button>
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
                            {/* CTA card at the bottom */}
								{!isCollapsed && !ctaDismissed && (
                                <div className="pb-4">
										<div className="relative rounded-xl bg-white text-black shadow-sm ring-1 ring-gray-200 p-3">
                                        <button
                                            aria-label="Dismiss"
                                            onClick={handleDismissCta}
												className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="text-sm font-semibold pr-6">Your Inbox, Supercharged.</div>
                                        <p className="mt-1 text-xs text-gray-700">
                                            Go beyond generic emails. Clario.ai automates personalized feedback for every candidate by seamlessly connecting to your email and cloud storage. The best part? It takes almost no time to set up.
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <Link to="/settings" className="flex-1">
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                                                    Connect & Automate
                                                </Button>
                                            </Link>
                                            <Link to="/help" className="flex-1">
													<Button variant="outline" className="w-full bg-gray-100 hover:bg-gray-200 text-black border-0" size="sm">
                                                    See How
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
						</nav>
					</div>
				</div>
			</ScrollArea>
		</aside>;
}