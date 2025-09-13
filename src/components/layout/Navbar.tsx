import React from 'react';
import { Search, User, Settings, Users, CreditCard, Zap, HelpCircle, Sparkles, MessageSquare, LogOut, Building2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
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
      <div className="container flex items-center justify-end h-16 px-4">
        {/* Right side - Sync action, Notification Bell and Profile Icon */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Subtle sync button with tooltip-like title */}
          <button title="Last synced: 2 hours ago. Click to refresh." className="h-8 w-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-100" onClick={() => {
            // Fire a background sync start; non-blocking
            fetch('/api/sync/start', { method: 'POST', credentials: 'include' }).catch(() => {});
          }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105 cursor-pointer">
                <AvatarFallback className="bg-transparent text-black">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-64 bg-white border border-gray-200 shadow-lg">
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
        </div>
      </div>
    </header>;
}