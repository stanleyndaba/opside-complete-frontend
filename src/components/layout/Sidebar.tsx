import React from 'react';
import { Home, Shield, Settings, HelpCircle, Sparkles, BarChart3, Plug, Edit3, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  const sections: NavSection[] = [{
    title: 'Seller Tools',
    items: [{
      title: 'Command Center',
      icon: Home,
      href: '/'
    }, {
      title: 'Claims',
      icon: FileText,
      href: '/claims'
    }, {
      title: 'Validation',
      icon: Shield,
      href: '/validation'
    }, {
      title: 'Monitoring',
      icon: BarChart3,
      href: '/monitoring'
    }, {
      title: 'Recoveries',
      icon: Shield,
      href: '/recoveries'
    }, {
      title: 'Reports',
      icon: BarChart3,
      href: '/reports'
    }, {
      title: 'Claim Documents',
      icon: Factory,
      href: '/evidence-locker'
    }, {
      title: 'Connections',
      icon: Settings,
      href: '/integrations-hub'
    }]
  }, {
    title: 'My Account',
    items: [{
      title: 'Settings',
      icon: Settings,
      href: '/settings'
    }, {
      title: 'Billing',
      icon: CreditCard,
      href: '/billing'
    }]
  }, {
    title: 'System',
    items: [{
      title: 'Export Data',
      icon: Download,
      href: '/export'
    }, {
      title: 'API Access',
      icon: Key,
      href: '/api'
    }]
  }, {
    title: 'Support',
    items: [{
      title: 'Help Centre',
      icon: HelpCircle,
      href: '/help'
    }, {
      title: 'What\'s new',
      icon: Sparkles,
      href: '/whats-new'
    }]
  }];
  const NavItemComponent = ({
    item
  }: {
    item: NavItem;
  }) => {
    const isActive = location.pathname === item.href;
    if (isCollapsed) {
      return <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={item.href} className={cn("flex items-center justify-center w-12 h-12 rounded-md transition-colors", isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100")}>
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-black text-white">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>;
    }
    return <Link to={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md transition-colors", isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100")}>
        <item.icon strokeWidth={1.5} className="h-5 w-5 shrink-0 text-sm font-extralight" />
        <span className="text-sm font-normal">{item.title}</span>
      </Link>;
  };
  return <aside className={cn("bg-white fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200 h-screen z-40", isCollapsed ? "w-16" : "w-56", className)}>
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-10">
        <Button onClick={onToggle} variant="outline" size="icon" className="h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50">
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

			

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
										<button className="text-gray-500 hover:text-gray-700" title="Edit profile" onClick={() => (window.location.href = '/settings')}>
											<Edit3 className="h-4 w-4" />
										</button>
									</div>
									<button className="text-slate-400 hover:text-slate-200" title="Edit profile" onClick={() => (window.location.href = '/settings')}>
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
        {!isCollapsed && <div className="h-px bg-gray-100" />}
        <div className="space-y-1 pb-4">
          {!isCollapsed && <div className="text-xs font-semibold text-gray-700 px-1">Automation</div>}
          {automationItems.map((item, idx) => <React.Fragment key={`auto-${idx}`}><NavItemComponent item={item} /></React.Fragment>)}
        </div>
                            {/* CTA card at the bottom */}
								{!isCollapsed && !ctaDismissed && (
                                <div className="pb-4">
										<div className="relative rounded-2xl border border-gray-200 bg-white text-black p-4 shadow-sm">
                                        <button
                                            aria-label="Dismiss"
                                            onClick={handleDismissCta}
												className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="text-sm font-semibold pr-6">Your Inbox, Supercharged.</div>
											<p className="mt-1 text-xs text-gray-700">
												Automate personalized candidate feedback instantly. Just connect your email and go.
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
			{/* Bottom Logout control */}
			{!isCollapsed && (
				<div className="mt-auto p-3 border-t border-gray-200">
					<button
						className="w-full flex items-center gap-2 text-left text-gray-700 hover:text-red-600 hover:bg-gray-50 px-3 py-2 rounded-md"
						onClick={() => setShowLogout(prev => !prev)}
					>
						<LogOut className="h-4 w-4" />
						<span className="text-sm">Logout</span>
					</button>
					{showLogout && (
						<div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
							<div className="flex items-center gap-2">
								<div className="h-8 w-8 rounded-full bg-white flex items-center justify-center border border-red-200">
									<User className="h-4 w-4 text-red-600" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium text-red-700 truncate">Martin Links</p>
									<p className="text-xs text-red-600 truncate flex items-center gap-1">
										<Building2 className="h-3 w-3" /> John's Amazon Store
									</p>
								</div>
							</div>
							<button
								className="mt-3 w-full inline-flex items-center justify-center gap-2 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
								onClick={async () => { try { await api.logout(); } catch (_) {} window.location.href = '/'; }}
							>
								<LogOut className="h-4 w-4" />
								<span>Log out</span>
							</button>
						</div>
					)}
				</div>
			)}
		</aside>;
}