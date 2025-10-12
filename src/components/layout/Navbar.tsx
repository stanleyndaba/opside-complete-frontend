import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Search, User, Settings, Users, CreditCard, Zap, HelpCircle, Sparkles, MessageSquare, LogOut, Building2, RefreshCw, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useApiHealth } from '@/hooks/use-api-health';
import { NotificationBell } from './NotificationBell';
import { useAuth as useAuthCtx } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface NavbarProps {
  className?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({
  className,
  sidebarCollapsed = false,
  onToggleSidebar
}: NavbarProps) {
  const { user, signInWithAmazon, signOut } = useAuth();
  const { data: health, isLoading } = useApiHealth();
  const authCtx = useAuthCtx();
  const startSync = useMutation({
    mutationFn: async () => { await apiClient.post('/api/sync/start'); },
  });
  return <header className={cn("bg-background/95 backdrop-blur-sm sticky top-0 z-30 border-b transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-56", className)}>
      <div className="container flex items-center justify-end h-16 px-4">
        {/* Right side - Notification Bell and Profile Icon */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1 text-xs">
            <Activity className={`h-4 w-4 ${isLoading ? 'text-yellow-500' : (health?.status === 'ok' ? 'text-green-600' : 'text-red-600')}`} />
            <span className="text-muted-foreground hidden md:inline">
              {isLoading ? 'Checking' : (health?.status === 'ok' ? 'All systems' : 'Degraded')}
            </span>
          </div>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 transition-transform duration-200 hover:scale-105 cursor-pointer">
                <AvatarFallback className="bg-black text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-64 bg-white border border-gray-200 shadow-lg">
              {isDemo && (
                <>
                  <DropdownMenuItem onClick={exitDemo} className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4" />
                    <span>Exit Demo Mode</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Section 1: Identity */}
              <DropdownMenuLabel className="pb-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-black">{user?.name ?? 'Guest'}</p>
                  <p className="text-xs text-gray-600">{user?.email ?? ''}</p>
                  <div className="flex items-center gap-1 pt-1">
                    <Building2 className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-500">Viewing: {user ? "Your Amazon Store" : "Demo Store"}</p>
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
              <DropdownMenuItem onClick={() => startSync.mutate()} className="flex items-center gap-2 cursor-pointer">
                <RefreshCw className="h-4 w-4" />
                <span>{startSync.isPending ? 'Starting…' : 'Start Sync'}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Section 3: Resources & Support */}
              {/* Trim non-essential menu items for MVP focus */}
              
              <DropdownMenuSeparator />
              
              {/* Section 4: Session Control */}
              {user ? (
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={signInWithAmazon} className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4" />
                  <span>Sign in with Amazon</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
}

