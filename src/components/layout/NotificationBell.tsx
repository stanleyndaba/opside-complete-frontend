import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
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
  label = 'Margin Notifications',
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

  const getHrefForType = (type: string) => {
    if (type.includes('claim') || type.includes('refund') || type.includes('funds')) return '/recoveries';
    if (type.includes('integration')) return '/integrations-hub';
    if (type.includes('payment') || type.includes('billing')) return '/billing';
    if (type.includes('evidence')) return '/evidence-locker';
    return '/notifications';
  };

  const displayNotifications = notifications.slice(0, 10).map(n => ({
    id: n.id,
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

      {/* Pentagon/JP Morgan Style - Minimal, Grayscale, Serious */}
      <DropdownMenuContent
        align="end"
        className="w-[340px] max-h-[420px] bg-white border border-gray-200 shadow-lg z-50 rounded-sm flex flex-col overflow-hidden"
      >
        {/* Header - Fixed, Clean, minimal */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <img src="/logoimagetwo.png" alt="" className="h-3.5 w-auto object-contain" />
              {label}
            </h3>
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
                <span className="text-[10px] font-medium text-gray-500">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notification Items - Scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {displayNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">No messages</p>
            </div>
          ) : (
            displayNotifications.map((notification, index) => {
              const content = (
                <div
                  className={cn(
                    'px-4 py-3 transition-colors cursor-pointer border-l-2',
                    !notification.read
                      ? 'bg-gray-50 border-l-gray-400'
                      : 'bg-white border-l-transparent hover:bg-gray-50'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] leading-relaxed',
                        !notification.read ? 'text-gray-800' : 'text-gray-600'
                      )}>
                        {renderFormattedMessage(notification.message)}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {notification.timestamp}
                      </p>
                    </div>

                    {/* Unread indicator - green dot */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
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

        {/* Footer - Fixed, Minimal */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
          <Link to="/notifications" onClick={() => setIsOpen(false)} reloadDocument>
            <button className="w-full text-center text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors">
              View all
            </button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}