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
        <div className="flex items-center gap-2 lg:gap-4">
          <h1 className="tracking-tight lg:text-2xl text-2xl font-extrabold text-blue-600">Opside</h1>
          
          <div className="relative hidden md:flex items-center h-9 rounded-md px-3 text-muted-foreground focus-within:text-foreground bg-muted/50">
            <Search className="h-4 w-4 mr-2" />
            <Input type="search" placeholder="Search stocks, indices..." className="h-9 w-[200px] lg:w-[280px] bg-transparent border-none px-0 py-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          
          <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105">
            
          </Avatar>
        </div>
      </div>
    </header>;
}