import React from 'react';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from './NotificationBell';
interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
}
export function Navbar({
  className,
  sidebarCollapsed = false
}: NavbarProps) {
  return <header className={cn("bg-background/95 backdrop-blur-sm sticky top-0 z-30 border-b transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-56", className)}>
      <div className="container flex items-center justify-between h-16 px-4">
        
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          
          <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105">
            
          </Avatar>
        </div>
      </div>
    </header>;
}