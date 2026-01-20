import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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
  if (!message || typeof message !== 'string') return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</span>;
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper to strip emojis from text
const stripEmojis = (text: any) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '').trim();
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

  const displayNotifications = notifications.slice(0, 10).map(n => {
    let timeAgo = 'Just now';
    try {
      const date = new Date(n.created_at);
      if (!isNaN(date.getTime())) {
        timeAgo = formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (e) {
      console.error('Invalid date for notification:', n.created_at);
    }

    return {
      id: n.id,
      message: n.message,
      timestamp: timeAgo,
      href: getHrefForType(n.type),
      read: n.status === 'read',
      type: n.type
    };
  });

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
          'absolute rounded-full flex items-center justify-center text-xs font-semibold ' +
          (isSidebarStyle
            ? 'top-2 right-3 w-4 h-4 bg-emerald-500 text-white'
            : '-top-1 -right-1 w-4 h-4 bg-emerald-500 text-white')
        }>
        {unreadCount > 9 ? '9+' : unreadCount}
      </div>
    </>
  );

  return (
    <HoverCard openDelay={100} closeDelay={200} onOpenChange={setIsOpen} open={isOpen}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size={isSidebarStyle ? 'default' : 'icon'}
          className={triggerClassNames}
          onClick={() => setIsOpen(true)}>
          <IconComponent className={cn(
            'h-4 w-4',
            iconClassName || (isSidebarStyle ? '' : isTransparentNavbar ? 'text-gray-200' : 'text-gray-500')
          )} />
          {shouldShowLabel && <span className="text-xs font-bold">{label}</span>}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute flex items-center justify-center bg-gray-900 text-white text-xs font-bold leading-none p-0.5 min-w-[12px] h-[12px]",
              isSidebarStyle ? "top-2 right-3" : "-top-0.5 -right-0.5"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </HoverCardTrigger>

      {/* Pentagon/JP Morgan Style - Minimal, Grayscale, Serious */}
      <HoverCardContent
        align="end"
        sideOffset={8}
        className="w-[340px] max-h-[420px] bg-white border border-gray-200 shadow-lg z-50 rounded-sm flex flex-col overflow-hidden p-0">
        {/* Header - Fixed, Institutional Style */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900">
              {label}
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
                  Clear All
                </button>
              )}
              {unreadCount > 0 && (
                <div className="px-1.5 py-0.5 bg-gray-900 text-white text-xs font-bold tracking-tighter">
                  {unreadCount} NEW
                </div>
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
                    'group relative px-5 py-4 transition-all duration-200 cursor-pointer border-r-2 border-transparent hover:bg-gray-50/50',
                    !notification.read ? 'bg-gray-50/30' : 'bg-white'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}>

                  {/* Hover Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between gap-3 mb-0.5">
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0 transition-colors",
                        notification.type === 'claim_detected' || notification.type === 'case_filed' ? 'bg-blue-500' :
                          notification.type === 'refund_approved' || notification.type === 'funds_deposited' ? 'bg-emerald-500' :
                            notification.type === 'amazon_challenge' || notification.type === 'user_action_required' ? 'bg-amber-500' :
                              notification.type === 'evidence_found' ? 'bg-purple-500' : 'bg-gray-300'
                      )} />
                      <p className={cn(
                        'text-xs truncate flex items-center gap-2',
                        !notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600 group-hover:text-gray-900'
                      )}>
                        {/* We use the type as title since bell notifications don't strictly separate title/body in the object structure passed here same as dashboard, 
                            but looking at the code above, the 'message' seems to be the main content. 
                            Wait, the dashboard used notification.title. NotificationBell uses notification.type or generic "System Update" vs "Action Required".
                            Let's try to match the Dashboard's title logic if possible, or stick to the existing "Action Required" / "System Update" 
                            but honestly the user probably wants the specific titles like "FUNDS DEPOSITED". 
                            The current code just says "Action Required" or "System Update". 
                            Let's try to use the type to make a better title like "FUNDS DEPOSITED" instead of generic "Action Required".
                        */}
                        {notification.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-xs text-gray-300 font-mono text-right shrink-0 pt-0.5 whitespace-nowrap">
                      {notification.timestamp.replace('about ', '').replace(' ago', '').replace('minutes', 'm').replace('minute', 'm').replace('hours', 'h').replace('hour', 'h').replace('days', 'd').replace('day', 'd')}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 ml-3.5">
                    <p className={cn(
                      'text-xs leading-relaxed font-normal truncate',
                      !notification.read ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}>
                      {stripEmojis(notification.message)}
                    </p>
                    {(() => {
                      let statusText = '';
                      if (notification.type === 'funds_deposited') statusText = 'Paid';
                      else if (notification.type === 'case_filed') statusText = 'Open';
                      else if (notification.type === 'claim_detected') statusText = 'Found';

                      if (!statusText) return null;

                      return (
                        <span className={cn(
                          "text-xs font-medium shrink-0 transition-colors",
                          notification.type === 'funds_deposited' ? "text-emerald-500" :
                            notification.type === 'case_filed' ? "text-blue-500" : "text-gray-400"
                        )}>
                          {statusText}
                        </span>
                      );
                    })()}
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

        {/* Footer - Institutional Style */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/20">
          <Link to="/notifications" onClick={() => setIsOpen(false)} reloadDocument>
            <button className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
              Archive // All Records
            </button>
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
