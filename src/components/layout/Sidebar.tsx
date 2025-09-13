import React from 'react';
import { Home, Shield, Settings, CreditCard, HelpCircle, Sparkles, Download, Key, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';
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
  const sections: NavSection[] = [{
    title: 'Seller Tools',
    items: [{
      title: 'Command Center',
      icon: Home,
      href: '/app'
    }, {
      title: 'Integrations',
      icon: Settings,
      href: '/integrations-hub'
    }, {
      title: 'Reports',
      icon: BarChart3,
      href: '/reports'
    }, {
      title: 'Recoveries',
      icon: Shield,
      href: '/recoveries'
    }]
  }, {
    title: 'My Account',
    items: [{
      title: 'Configure',
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

      {/* Logo Section */}
      {!isCollapsed ? <div className="p-4 border-b border-gray-200 flex justify-center">
          <span className="font-brand italic font-black tracking-wide text-xl">Clario</span>
        </div> : <div className="p-2 border-b border-gray-200 flex justify-center">
          <span className="font-brand italic font-black tracking-wide text-lg">C</span>
        </div>}

      <ScrollArea className="flex-1">
        <nav className={cn("space-y-6 py-6", isCollapsed ? "px-2" : "px-4")}>
          {sections.map((section, sectionIndex) => <div key={sectionIndex}>
              {!isCollapsed && <h3 className="text-s text-black lowercase tracking-wider mb-3 text-sm font-semibold">
                  {section.title}
                </h3>}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => <NavItemComponent key={itemIndex} item={item} />)}
              </div>
            </div>)}
        </nav>
        
        {/* Version Number */}
        {!isCollapsed && <div className="px-4 pb-6">
            <div className="text-xs text-gray-400 font-mono">
              v1.0
            </div>
          </div>}
      </ScrollArea>
    </aside>;
}