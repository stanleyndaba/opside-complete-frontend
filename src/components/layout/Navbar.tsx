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
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/15af441d-81d1-4a51-932f-382e12379bca.png" 
            alt="Opside Logo" 
            className="h-8 w-auto"
          />
        </div>
        
        {/* Right side - Notification Bell and Profile Icon */}
        <div className="flex items-center gap-4">
          <NotificationBell />
          <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>;
}