import React, { useState } from 'react';
import { Bell, DollarSign, CheckCircle, FileCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';

interface RecentNotification {
  id: string;
  icon: React.ElementType;
  message: string;
  timestamp: string;
  href?: string;
  read: boolean;
}

interface NotificationBellProps {
  label?: string;
  className?: string;
  forceCountStyle?: 'sidebar' | 'default';
  iconOverride?: React.ElementType;
  showLabel?: boolean;
}

export function NotificationBell({
  label = 'Notifications',
  className,
  forceCountStyle = 'default',
  iconOverride,
  showLabel = true
}: NotificationBellProps) {
  const location = useLocation();
  const isTransparentNavbar = (
    location.pathname === '/' ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/careers') ||
    location.pathname.startsWith('/api-access') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/evidence-locker') ||
    location.pathname.startsWith('/integrations-hub') ||
    location.pathname.startsWith('/recoveries') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/whats-new') ||
    location.pathname.startsWith('/help')
  );
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<RecentNotification[]>([
    {
      id: '1',
      icon: DollarSign,
      message: 'Payout of $75.50 confirmed',
      timestamp: '2h ago',
      href: '/recoveries',
      read: false
    },
    {
      id: '2',
      icon: CheckCircle,
      message: 'New recovery guaranteed: $125.00',
      timestamp: '1d ago',
      href: '/recoveries',
      read: false
    },
    {
      id: '3',
      icon: FileCheck,
      message: 'Invoice processed successfully',
      timestamp: '2d ago',
      href: '/evidence-locker',
      read: true
    },
    {
      id: '4',
      icon: Users,
      message: 'Sarah Johnson joined your team',
      timestamp: '3d ago',
      href: '/team-management',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const IconComponent = iconOverride ?? Bell;
  const isSidebarStyle = forceCountStyle === 'sidebar';
  const shouldShowLabel = isSidebarStyle && showLabel;

  const handleNotificationClick = () => {
    setIsOpen(false);
  };

  const baseSidebarClass = showLabel
    ? 'flex items-center gap-3 px-3 py-2 text-gray-200 hover:bg-white/5'
    : 'flex items-center justify-center h-10 w-10 text-gray-200 hover:bg-white/10';

  const triggerClassNames = [
    'relative rounded-md transition-colors',
    isSidebarStyle
      ? baseSidebarClass
      : 'h-9 w-9 flex items-center justify-center ' + (isTransparentNavbar ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-muted/50'),
    className
  ].filter(Boolean).join(' ');

  const badge = unreadCount > 0 && (
    <>
      <div
        className={
          'absolute rounded-full animate-pulse ' +
          (isSidebarStyle ? 'top-2 right-3 w-3 h-3 bg-emerald-400/80' : '-top-1 -right-1 w-3 h-3 bg-destructive')
        }
      />
      <div
        className={
          'absolute rounded-full flex items-center justify-center text-[8px] font-semibold ' +
          (isSidebarStyle
            ? 'top-2 right-3 w-3 h-3 bg-emerald-400 text-white'
            : '-top-1 -right-1 w-3 h-3 bg-destructive text-destructive-foreground')
        }
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </div>
    </>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isSidebarStyle ? 'default' : 'icon'}
          className={triggerClassNames}
        >
          <IconComponent className={'h-4 w-4 ' + (isSidebarStyle ? 'text-gray-200' : isTransparentNavbar ? 'text-gray-200' : '')} />
          {shouldShowLabel && <span className="text-sm font-medium text-gray-200">{label}</span>}
          {isSidebarStyle && shouldShowLabel && unreadCount > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px] border-emerald-400/40 text-emerald-200 bg-emerald-500/10">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {!isSidebarStyle && badge}
          {isSidebarStyle && !shouldShowLabel && badge}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto bg-[#0B1220]/95 backdrop-blur-md border border-white/10 shadow-xl z-50 text-gray-200"
      >
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-100">{label}</h3>
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-white/20 text-gray-200">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="py-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => {
              const IconComponent = notification.icon;
              const content = (
                <div 
                  className={`flex items-start gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-white/5' : ''
                  }`}
                  onClick={handleNotificationClick}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                    !notification.read ? 'bg-emerald-500/15' : 'bg-white/10'
                  }`}>
                    <IconComponent className={`w-3 h-3 ${
                      !notification.read ? 'text-emerald-400' : 'text-gray-300'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      !notification.read ? 'font-medium text-gray-100' : 'text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.timestamp}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-1.5"></div>
                  )}
                </div>
              );

              return (
                <React.Fragment key={notification.id}>
                  {notification.href ? (
                    <Link to={notification.href}>
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                  {index < notifications.length - 1 && (
                    <DropdownMenuSeparator className="my-0 bg-white/10" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="bg-white/10" />
        
        <div className="p-2">
          <Link to="/notifications" onClick={handleNotificationClick} reloadDocument>
            <Button 
              variant="ghost" 
              className="w-full justify-center text-xs h-8 hover:bg-white/10 text-gray-200"
            >
              View all {label.toLowerCase()}
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}