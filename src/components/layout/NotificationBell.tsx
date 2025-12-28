import React, { useState } from 'react';
import { Bell, DollarSign, CheckCircle, FileCheck, Users, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  label?: string;
  className?: string;
  forceCountStyle?: 'sidebar' | 'default';
  iconOverride?: React.ElementType;
  showLabel?: boolean;
  iconClassName?: string;
}

// Helper to render bold text from "**text**" markdown
const renderFormattedMessage = (message: string): React.ReactNode => {
  if (!message) return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</span>;
    }
    return <span key={index}>{part}</span>;
  });
};

export function NotificationBell({
  label = 'Messages',
  className,
  forceCountStyle = 'default',
  iconOverride,
  showLabel = true,
  iconClassName
}: NotificationBellProps) {
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

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

  const getIconForType = (type: string) => {
    if (type.includes('payment') || type.includes('funds')) return DollarSign;
    if (type.includes('refund') || type.includes('approved')) return CheckCircle;
    if (type.includes('claim') || type.includes('detected')) return AlertCircle;
    if (type.includes('integration')) return FileCheck;
    if (type.includes('discrepancy')) return AlertTriangle;
    if (type.includes('user') || type.includes('team')) return Users;
    return Bell;
  };

  const getHrefForType = (type: string) => {
    if (type.includes('claim') || type.includes('refund') || type.includes('funds')) return '/recoveries';
    if (type.includes('integration')) return '/integrations-hub';
    if (type.includes('payment') || type.includes('billing')) return '/billing';
    if (type.includes('evidence')) return '/evidence-locker';
    return '/notifications';
  };

  const displayNotifications = notifications.slice(0, 10).map(n => ({
    id: n.id,
    icon: getIconForType(n.type),
    message: n.message,
    timestamp: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
    href: getHrefForType(n.type),
    read: n.status === 'read'
  }));

  const IconComponent = iconOverride ?? Bell;
  const isSidebarStyle = forceCountStyle === 'sidebar';
  const shouldShowLabel = isSidebarStyle && showLabel;

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead();
  };

  const baseSidebarClass = showLabel
    ? 'flex items-center gap-3 px-3 py-2 hover:bg-white/5'
    : 'flex items-center justify-center h-10 w-10 hover:bg-white/10';

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
          (isSidebarStyle ? 'top-2 right-3 w-4 h-4 bg-emerald-500/80' : '-top-1 -right-1 w-4 h-4 bg-emerald-500/80')
        }
      />
      <div
        className={
          'absolute rounded-full flex items-center justify-center text-[9px] font-semibold ' +
          (isSidebarStyle
            ? 'top-2 right-3 w-4 h-4 bg-emerald-500 text-white'
            : '-top-1 -right-1 w-4 h-4 bg-emerald-500 text-white')
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
          <IconComponent className={cn(
            'h-4 w-4',
            iconClassName || (isSidebarStyle ? '' : isTransparentNavbar ? 'text-gray-200' : '')
          )} />
          {shouldShowLabel && <span className="text-sm font-medium">{label}</span>}
          {isSidebarStyle && shouldShowLabel && unreadCount > 0 && (
            <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500 text-white bg-emerald-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {!isSidebarStyle && badge}
          {isSidebarStyle && !shouldShowLabel && badge}
        </Button>
      </DropdownMenuTrigger>

      {/* Institutional Banking Design - Clean, Professional, Executive-Level */}
      <DropdownMenuContent
        align="end"
        className="w-[360px] max-h-[480px] overflow-y-auto scrollbar-hide bg-white border border-gray-200 shadow-2xl z-50 rounded-lg"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Header - Clean institutional style */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900 tracking-tight">{label}</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notification Items */}
        <div>
          {displayNotifications.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No messages yet</p>
            </div>
          ) : (
            displayNotifications.map((notification, index) => {
              const NotifIcon = notification.icon;
              const content = (
                <div
                  className={cn(
                    'flex items-start gap-4 px-5 py-4 transition-all cursor-pointer border-l-2',
                    !notification.read
                      ? 'bg-blue-50/50 border-l-blue-500 hover:bg-blue-50'
                      : 'bg-white border-l-transparent hover:bg-gray-50'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    <NotifIcon className={cn(
                      'w-4 h-4',
                      !notification.read ? 'text-blue-600' : 'text-gray-500'
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-[13px] leading-relaxed',
                      !notification.read ? 'text-gray-800' : 'text-gray-600'
                    )}>
                      {renderFormattedMessage(notification.message)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                      {notification.timestamp}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              );

              return (
                <React.Fragment key={notification.id}>
                  {notification.href ? (
                    <Link to={notification.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                  {index < displayNotifications.length - 1 && (
                    <div className="border-b border-gray-100" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <Link to="/notifications" onClick={() => setIsOpen(false)} reloadDocument>
            <button className="w-full text-center text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors py-1">
              View all messages
            </button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}