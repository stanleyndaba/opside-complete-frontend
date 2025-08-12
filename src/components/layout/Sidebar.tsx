import React from 'react';
import { 
  Home, BarChart3, Shield, FileText, Factory, Zap, Settings, 
  CreditCard, Users, HelpCircle, MessageSquare, Sparkles, 
  Palette, Download, Key, ChevronLeft, ChevronRight, User, Search,
  LogOut, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        { title: 'Reports', icon: BarChart3, href: '/analytics' }
      ]
    },
    {
      title: 'Core Features',
      items: [
        { title: 'Recoveries', icon: Shield, href: '/recoveries' },
        { title: 'FBA Fee Disputes', icon: FileText, href: '/amazon-fee-dispute' },
        { title: 'Cost Documents', icon: Factory, href: '/evidence-locker' },
        { title: 'Inventory Sync', icon: Zap, href: '/smart-inventory-sync' },
        { title: 'Integrations Hub', icon: Settings, href: '/integrations-hub' }
      ]
    },
    {
      title: 'Account',
      items: [
        { title: 'Settings', icon: Settings, href: '/settings' },
        { title: 'Billing', icon: CreditCard, href: '/billing' },
        { title: 'Team Management', icon: Users, href: '/team-management' }
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
      "bg-white fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col border-r border-gray-200 h-screen z-40",
      isCollapsed ? "w-16" : "w-56",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
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
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="right" 
              align="start" 
              className="w-64 bg-white border border-gray-200 shadow-lg"
            >
              {/* Section 1: Identity */}
              <DropdownMenuLabel className="pb-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-black">John Smith</p>
                  <p className="text-xs text-gray-600">john.smith@example.com</p>
                  <div className="flex items-center gap-1 pt-1">
                    <Building2 className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Viewing: John's Amazon Store</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {/* Section 2: Account Management */}
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/team-management" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  <span>Team Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/billing" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>Billing & Value</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/integrations-hub" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4" />
                  <span>Integrations Hub</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Section 3: Resources & Support */}
              <DropdownMenuItem asChild>
                <Link to="/help" className="flex items-center gap-2 cursor-pointer">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Center</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/whats-new" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4" />
                  <span>What's New</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                <span>Contact Support</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Section 4: Session Control */}
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center justify-center w-12 h-12 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-black text-white text-xs">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    side="right" 
                    align="start" 
                    className="w-64 bg-white border border-gray-200 shadow-lg"
                  >
                    {/* Section 1: Identity */}
                    <DropdownMenuLabel className="pb-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-black">John Smith</p>
                        <p className="text-xs text-gray-600">john.smith@example.com</p>
                        <div className="flex items-center gap-1 pt-1">
                          <Building2 className="h-3 w-3 text-gray-500" />
                          <p className="text-xs text-gray-500">Viewing: John's Amazon Store</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Section 2: Account Management */}
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/team-management" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        <span>Team Management</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        <span>Billing & Value</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/integrations-hub" className="flex items-center gap-2 cursor-pointer">
                        <Zap className="h-4 w-4" />
                        <span>Integrations Hub</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Section 3: Resources & Support */}
                    <DropdownMenuItem asChild>
                      <Link to="/help" className="flex items-center gap-2 cursor-pointer">
                        <HelpCircle className="h-4 w-4" />
                        <span>Help Center</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/whats-new" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4" />
                        <span>What's New</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      <span>Contact Support</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Section 4: Session Control */}
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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