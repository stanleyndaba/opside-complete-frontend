import React from 'react';
import { 
  Home, BarChart3, Shield, FileText, Factory, Zap, Settings, 
  CreditCard, Users, HelpCircle, MessageSquare, Sparkles, 
  Palette, Download, Key, ChevronLeft, ChevronRight, User, Search 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';

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

  const sections: NavSection[] = [
    {
      title: 'Dashboard',
      items: [
        { title: 'Overview', icon: Home, href: '/' },
        { title: 'Analytics', icon: BarChart3, href: '/analytics' }
      ]
    },
    {
      title: 'Core Features',
      items: [
        { title: 'Recoveries', icon: Shield, href: '/recoveries' },
        { title: 'Amazon Fee Dispute', icon: FileText, href: '/amazon-fee-dispute' },
        { title: 'Evidence Locker & Value Engine', icon: Factory, href: '/evidence-locker' },
        { title: 'Smart Inventory Sync', icon: Zap, href: '/smart-inventory-sync' },
        { title: 'Integrations Hub', icon: Settings, href: '/integrations-hub' }
      ]
    },
    {
      title: 'Account',
      items: [
        { title: 'Settings', icon: Settings, href: '/settings' },
        { title: 'Billing & Value Report', icon: CreditCard, href: '/billing' },
        { title: 'Team', icon: Users, href: '/team' }
      ]
    },
    {
      title: 'Support',
      items: [
        { title: 'Help Centre', icon: HelpCircle, href: '/help' },
        { title: 'Contact Support', icon: MessageSquare, href: '/contact' },
        { title: 'What\'s new', icon: Sparkles, href: '/whats-new' }
      ]
    },
    {
      title: 'System',
      items: [
        { title: 'Theme', icon: Palette, href: '/theme' },
        { title: 'Export Data', icon: Download, href: '/export' },
        { title: 'API Access', icon: Key, href: '/api' }
      ]
    }
  ];

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-md transition-colors",
                  isActive 
                    ? "bg-black text-white" 
                    : "text-black hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={2.5} />
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
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          isActive 
            ? "bg-black text-white" 
            : "text-black hover:bg-gray-100"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        <span className="text-sm font-normal">{item.title}</span>
      </Link>
    );
  };

  return (
    <aside className={cn(
      "bg-white relative transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200 h-screen",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-10">
        <Button
          onClick={onToggle}
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Profile Section */}
      {!isCollapsed ? (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-black text-white text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">John Smith</p>
              <p className="text-xs text-gray-600 truncate">Premium Plan</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-8 text-sm bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-gray-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-12 h-12 rounded-md">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-black text-white text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-black text-white">
                <div className="text-xs">
                  <p className="font-medium">John Smith</p>
                  <p className="text-gray-300">Premium Plan</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <ScrollArea className="flex-1">
        <nav className={cn("space-y-6 py-6", isCollapsed ? "px-2" : "px-4")}>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!isCollapsed && (
                <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <NavItemComponent key={itemIndex} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}