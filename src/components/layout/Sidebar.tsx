
import React from 'react';
import { 
  Home, BarChart3, TrendingUp, Shield, FileText, Truck, 
  Zap, Settings, ChevronRight, ChevronLeft, Bell, User, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export function Sidebar({ isCollapsed, onToggle, className }: SidebarProps) {
  const location = useLocation();
  
  const navItems = [
    {
      title: 'Overview',
      icon: Home,
      href: '/',
    },
    {
      title: 'Analytics',
      icon: TrendingUp,
      href: '/analytics',
    }
  ];

  const coreFeatures = [
    {
      title: 'FBA Auto-Claim',
      icon: Shield,
      href: '/fba-auto-claim',
    },
    {
      title: 'Amazon Fee Dispute',
      icon: FileText,
      href: '/amazon-fee-dispute',
    },
    {
      title: 'Manufacturing Cost En...',
      icon: Truck,
      href: '/manufacturing-cost',
    },
    {
      title: 'Smart Inventory Sync',
      icon: Zap,
      href: '/smart-inventory',
    },
    {
      title: 'Integrations Hub',
      icon: Settings,
      href: '/integrations-hub',
    }
  ];

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground relative transition-all duration-300 ease-in-out flex flex-col border-r border-sidebar-border",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Op</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-primary">OpSide</h2>
              <p className="text-xs text-muted-foreground">Certainty Guaranteed</p>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium">John Smith</p>
              <p className="text-xs text-muted-foreground">Premium Plan</p>
            </div>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-9" />
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">3</Badge>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-4">
          <div>
            <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2", isCollapsed && "hidden")}>
              Dashboard
            </h3>
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0")} />
                    <span className={cn(
                      "text-sm transition-opacity duration-200",
                      isCollapsed ? "opacity-0 w-0" : "opacity-100"
                    )}>
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2", isCollapsed && "hidden")}>
              Core Features
            </h3>
            <div className="space-y-1">
              {coreFeatures.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0")} />
                  <span className={cn(
                    "text-sm transition-opacity duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  )}>
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>
    </aside>
  );
}
