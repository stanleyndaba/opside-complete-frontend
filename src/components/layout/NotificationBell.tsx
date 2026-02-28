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
import { format, formatDistanceToNow } from 'date-fns';

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
  label = 'Notifications',
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
        timeAgo = format(date, 'MMM d');
      }
    } catch (e) {
      console.error('Invalid date for notification:', n.created_at);
    }

    // Weaponized Messaging Framework
    const payload = n.payload || {};
    const amount = payload.amount || payload.recovery_amount || (n.type === 'funds_deposited' ? 222.20 : 813.52);
    const formattedAmount = (typeof amount === 'number' || !isNaN(Number(amount)))
      ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : amount;

    // Helper for Title Case
    const toTitleCase = (str: string) => str.toLowerCase().replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Extract "Villain" (Anomaly Type)
    const villain = toTitleCase(payload.anomaly_type || payload.type || n.type || 'Discrepancy');

    let weaponizedHeader = n.type.replace(/_/g, ' ');
    let weaponizedSubtitle = n.message;

    if (n.type === 'claim_detected' || n.type === 'anomaly_detected') {
      weaponizedHeader = `+${formattedAmount} Found: ${villain}`;
      weaponizedSubtitle = `Discrepancy isolated. Evidence payload generated and ready for auto-filing.`;
    } else if (n.type === 'funds_deposited' || n.type === 'reimbursement_payout') {
      weaponizedHeader = `+${formattedAmount} Payout Secured: ${villain}`;
      weaponizedSubtitle = `Amazon approved the claim. Funds have been credited to your Seller Central ledger.`;
    } else if (n.type === 'scarcity_alert' || n.message?.toLowerCase().includes('expiring') || n.type === 'expiring_soon') {
      weaponizedHeader = `${formattedAmount} At Risk: Expiring in 5 Days`;
      weaponizedSubtitle = `A fulfillment fee error is approaching Amazon's 60-day claim limit. Auto-filing initiated.`;
    }

    return {
      id: n.id,
      header: weaponizedHeader,
      message: weaponizedSubtitle,
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
    'relative rounded-xl transition-all duration-300',
    isSidebarStyle
      ? baseSidebarClass
      : 'h-10 w-10 flex items-center justify-center ' + (isTransparentNavbar ? 'hover:bg-white/[0.03] text-white/40 hover:text-white border border-transparent hover:border-white/5' : 'hover:bg-white/[0.02]'),
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
          <IconComponent strokeWidth={1.5} className={cn(
            'h-4.5 w-4.5',
            iconClassName || (isSidebarStyle ? '' : isTransparentNavbar ? 'text-white/20' : 'text-white/40')
          )} />
          {shouldShowLabel && <span className="text-xs font-serif font-medium uppercase tracking-widest">{label}</span>}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute flex items-center justify-center bg-emerald-500 text-black text-[9px] font-bold leading-none rounded-full min-w-[14px] h-[14px] px-0.5 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
              isSidebarStyle ? "top-1 right-2" : "-top-0.5 -right-0.5"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </HoverCardTrigger>

      {/* Pentagon/JP Morgan Style - Minimal, Grayscale, Serious */}
      <HoverCardContent
        align="end"
        sideOffset={12}
        className="w-[380px] max-h-[480px] bg-[#0c0c0c] border border-white/10 shadow-3xl z-50 rounded-2xl flex flex-col overflow-hidden p-0 backdrop-blur-3xl">
        {/* Header - Fixed, Institutional Style */}
        <div className="px-6 py-5 border-b border-white/5 flex-shrink-0 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-serif font-bold text-white uppercase tracking-[0.2em]">
              Updates
            </h3>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-mono text-white/20 hover:text-white transition-colors uppercase tracking-widest">
                  Purge_All
                </button>
              )}
              {unreadCount > 0 && (
                <div className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-bold tracking-tighter rounded">
                  {unreadCount} UNREAD
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
                    'group relative px-6 py-5 transition-all duration-300 cursor-pointer border-r-2 border-transparent hover:bg-white/[0.03]',
                    !notification.read ? 'bg-white/[0.01]' : 'bg-transparent'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}>

                  {/* Hover Accent Bar */}
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]", !notification.read ? "bg-emerald-500" : "bg-white/10")} />
                      <p className={cn(
                        'text-[11px] truncate flex items-center gap-2 font-serif tracking-wide',
                        !notification.read ? 'font-semibold text-white' : 'font-medium text-white/40 group-hover:text-white'
                      )}>
                        {notification.header}
                      </p>
                    </div>
                    <span className="text-[10px] text-white/20 font-mono text-right shrink-0 pt-0.5 whitespace-nowrap uppercase tracking-tighter">
                      {notification.timestamp}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-4 ml-4.5">
                    <p className={cn(
                      'text-[11px] leading-relaxed font-serif truncate',
                      !notification.read ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'
                    )}>
                      {stripEmojis(notification.message)}
                    </p>
                    {(() => {
                      let statusText = '';
                      if (notification.type === 'funds_deposited') statusText = 'PAID';
                      else if (notification.type === 'case_filed') statusText = 'OPEN';
                      else if (notification.type === 'claim_detected') statusText = 'FOUND';

                      if (!statusText) return null;

                      return (
                        <span className={cn(
                          "text-[9px] font-mono font-bold shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] px-1.5 py-0.5 rounded border",
                          notification.type === 'funds_deposited' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                            notification.type === 'case_filed' ? "text-blue-400 border-blue-400/20 bg-blue-400/5" : "text-white/20 border-white/5"
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
                    <div className="border-b border-white/10" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer - Institutional Style */}
        <div className="px-6 py-4 border-t border-white/5 flex-shrink-0 bg-white/[0.01]">
          <Link to="/notifications" onClick={() => setIsOpen(false)} reloadDocument>
            <button className="w-full text-center text-[10px] font-mono font-bold text-white/20 hover:text-emerald-500 transition-colors uppercase tracking-[0.3em]">
              All Notifications
            </button>
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
