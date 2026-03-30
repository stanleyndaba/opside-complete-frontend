import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';
import { format, formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
  label?: string;
  className?: string;
  forceCountStyle?: 'sidebar' | 'default';
  iconOverride?: React.ElementType;
  showLabel?: boolean;
  iconClassName?: string;
}

// Helper to strip emojis from text
const stripEmojis = (text: any) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '').trim();
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatNotificationTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 86_400_000) {
    return formatDistanceToNow(date, { addSuffix: true }).replace(/^about\s+/i, '');
  }
  return format(date, 'MMM d');
};

type NotificationTone = 'neutral' | 'progress' | 'success' | 'warning';

const getNotificationPreview = (notification: any) => {
  const payload = notification.payload || {};
  const type = String(notification.type || '').toLowerCase();
  const rawTitle = stripEmojis(notification.title || '');
  const rawMessage = stripEmojis(notification.message || '');
  const messageBlob = `${rawTitle} ${rawMessage}`.toLowerCase();
  const amount =
    payload.amount ||
    payload.recovery_amount ||
    payload.resolution_amount ||
    payload.estimated_value;
  const formattedAmount =
    typeof amount === 'number' || (!Number.isNaN(Number(amount)) && amount !== '')
      ? `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;
  const anomaly =
    toTitleCase(
      String(payload.anomaly_type || payload.type || '')
    ) || 'Amazon issue';

  if (
    type === 'sync_complete' ||
    messageBlob.includes('finished successfully') ||
    messageBlob.includes('no discrepancies found')
  ) {
    return {
      eyebrow: 'Amazon update',
      header: 'Amazon update complete',
      message: rawMessage || 'Your latest Amazon records are ready to review.',
      tone: 'success' as NotificationTone,
    };
  }

  if (
    type === 'sync_failed' ||
    messageBlob.includes('encountered an issue') ||
    messageBlob.includes('failed') ||
    messageBlob.includes('paused')
  ) {
    return {
      eyebrow: 'Amazon update',
      header: 'Amazon update paused',
      message: rawMessage || 'We hit a temporary issue while updating your Amazon records.',
      tone: 'warning' as NotificationTone,
    };
  }

  if (
    messageBlob.includes('pulling your latest amazon records') ||
    messageBlob.includes('sync has started') ||
    type === 'sync_started'
  ) {
    return {
      eyebrow: 'Amazon update',
      header: 'Amazon update started',
      message: rawMessage || 'We are pulling your latest Amazon records now.',
      tone: 'progress' as NotificationTone,
    };
  }

  if (type === 'claim_detected' || type === 'anomaly_detected') {
    return {
      eyebrow: 'Recovery found',
      header: formattedAmount ? `${formattedAmount} opportunity found` : 'Recovery opportunity found',
      message: rawMessage || `${anomaly} is ready for review and filing.`,
      tone: 'neutral' as NotificationTone,
    };
  }

  if (type === 'funds_deposited' || type === 'reimbursement_payout' || type === 'refund_approved') {
    return {
      eyebrow: 'Payout',
      header: formattedAmount ? `${formattedAmount} payout received` : 'Payout received',
      message: rawMessage || 'Amazon has credited the approved reimbursement to your account.',
      tone: 'success' as NotificationTone,
    };
  }

  if (type === 'case_filed') {
    return {
      eyebrow: 'Claim filed',
      header: 'Claim sent to Amazon',
      message: rawMessage || 'Your reimbursement claim has been submitted and is now awaiting review.',
      tone: 'progress' as NotificationTone,
    };
  }

  if (
    type === 'user_action_required' ||
    type === 'amazon_challenge' ||
    messageBlob.includes('action required')
  ) {
    return {
      eyebrow: 'Action needed',
      header: rawTitle || 'Action needed on your account',
      message: rawMessage || 'Margin needs your input before this item can move forward.',
      tone: 'warning' as NotificationTone,
    };
  }

  return {
    eyebrow: 'Update',
    header: rawTitle || toTitleCase(type || 'notification'),
    message: rawMessage || 'There is a new update waiting in your account.',
    tone: 'neutral' as NotificationTone,
  };
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
  const { tenant } = useTenant();
  const activeSlug = tenant?.slug || 'beta';
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
    if (type.includes('claim') || type.includes('refund') || type.includes('funds')) return tenantRoute(activeSlug, '/recoveries');
    if (type.includes('integration')) return tenantRoute(activeSlug, '/integrations-hub');
    if (type.includes('payment') || type.includes('billing')) return tenantRoute(activeSlug, '/billing');
    if (type.includes('evidence')) return tenantRoute(activeSlug, '/evidence-locker');
    return tenantRoute(activeSlug, '/notifications');
  };

  const displayNotifications = notifications.slice(0, 10).map(n => {
    const preview = getNotificationPreview(n);

    return {
      id: n.id,
      eyebrow: preview.eyebrow,
      header: preview.header,
      message: preview.message,
      timestamp: formatNotificationTimestamp(n.created_at),
      href: getHrefForType(n.type),
      read: n.status === 'read',
      type: n.type,
      tone: preview.tone,
    };
  });

  const IconComponent = iconOverride ?? Mail;
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
  return (
    <HoverCard openDelay={100} closeDelay={200} onOpenChange={setIsOpen} open={isOpen}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size={isSidebarStyle ? 'default' : 'icon'}
          className={triggerClassNames}
          onClick={() => setIsOpen(true)}>
          <IconComponent strokeWidth={2.25} className={cn(
            'h-4.5 w-4.5',
            iconClassName || (isSidebarStyle ? '' : isTransparentNavbar ? 'text-white/20' : 'text-white/40')
          )} />
          {shouldShowLabel && <span className="text-xs font-sans font-bold uppercase tracking-tight">{label}</span>}
          {unreadCount > 0 && (
            <span className={cn(
              "absolute flex items-center justify-center bg-[#262626] text-white text-[9px] font-bold leading-none rounded-full min-w-[14px] h-[14px] px-0.5 border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.45)]",
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
        className="z-50 flex max-h-[520px] w-[428px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] p-0 shadow-3xl backdrop-blur-3xl">
        <div className="bg-white/[0.01] px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <h3 className="text-[11px] font-sans font-bold uppercase tracking-tight text-white">
                Updates
              </h3>
              <p className="mt-1 text-[10px] font-sans leading-4 text-white/38">
                Recent activity across your Amazon account and recoveries.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/34 transition-colors hover:text-white/72">
                  Mark all read
                </button>
              )}
              <div className="inline-flex min-w-[88px] items-center justify-center whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-tight text-white/72">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {displayNotifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[11px] font-sans font-medium uppercase tracking-tight text-white/42">
                No recent updates
              </p>
              <p className="mt-2 text-[11px] font-sans leading-5 text-white/34">
                New account activity will appear here as Margin finds, files, and tracks recoveries.
              </p>
            </div>
          ) : (
            displayNotifications.map((notification, index) => {
              const content = (
                <div
                  className={cn(
                    'group relative cursor-pointer px-6 py-4 transition-colors duration-200 hover:bg-white/[0.025]',
                    !notification.read ? 'bg-white/[0.018]' : 'bg-transparent'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}>
                  <div
                    className={cn(
                      'absolute left-0 top-3 bottom-3 w-[2px] rounded-full transition-opacity',
                      !notification.read ? 'bg-white/45 opacity-100' : 'bg-white/18 opacity-0 group-hover:opacity-100'
                    )}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-tight',
                            notification.tone === 'success'
                              ? 'border-white/12 bg-white/[0.06] text-white/78'
                              : notification.tone === 'warning'
                                ? 'border-white/12 bg-white/[0.04] text-white/64'
                                : notification.tone === 'progress'
                                  ? 'border-white/10 bg-white/[0.03] text-white/58'
                                  : 'border-white/8 bg-transparent text-white/46'
                          )}
                        >
                          {notification.eyebrow}
                        </span>
                      </div>

                      <p
                        className={cn(
                          'mt-3 text-[13px] font-sans font-semibold leading-5 tracking-tight',
                          !notification.read ? 'text-white' : 'text-white/72 group-hover:text-white/84'
                        )}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notification.header}
                      </p>

                      <p
                        className={cn(
                          'mt-2 pr-3 text-[11px] font-sans leading-5 tracking-tight',
                          !notification.read ? 'text-white/60' : 'text-white/38 group-hover:text-white/52'
                        )}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notification.message}
                      </p>
                    </div>

                    <span className="shrink-0 whitespace-nowrap pt-0.5 text-[10px] font-sans font-medium uppercase tracking-tight text-white/34">
                      {notification.timestamp}
                    </span>
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
                    <div className="border-b border-white/6" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        <div className="bg-white/[0.01] px-6 py-4 border-t border-white/5 flex-shrink-0">
          <Link to={tenantRoute(activeSlug, '/notifications')} onClick={() => setIsOpen(false)}>
            <button className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-[10px] font-sans font-medium uppercase tracking-tight text-white/72 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
              View all updates
            </button>
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
