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

const firstValue = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const getNotificationPreview = (notification: any) => {
  const payload = notification.payload || {};
  const type = String(notification.type || '').toLowerCase();
  const rawTitle = stripEmojis(notification.title || '');
  const rawMessage = stripEmojis(notification.message || '');
  const messageBlob = `${rawTitle} ${rawMessage}`.toLowerCase();
  const caseIdentifier = firstValue(payload.case_number, payload.amazon_case_id, payload.case_id, payload.dispute_case_id, payload.disputeId);
  const documentLabel = firstValue(payload.document_label, payload.document_type, payload.file_name, payload.fileName);
  const requestType = firstValue(payload.request_type, Array.isArray(payload.requested_documents) ? payload.requested_documents[0] : '');
  const syncIdentifier = firstValue(payload.sync_id, payload.syncId);
  const status = String(payload.status || '').toLowerCase();
  const entityType = String(payload.entity_type || payload.entityType || '').toLowerCase();
  const payoutTruthSource = String(payload.payout_truth_source || payload.payoutTruthSource || '').toLowerCase();
  const recoveryIdentifier = firstValue(payload.recovery_id, payload.recoveryId);
  const hasRecoveryPayoutTruth = Boolean(
    recoveryIdentifier ||
    entityType === 'recovery' ||
    payoutTruthSource === 'recovery_reconciliation'
  );
  const amount =
    payload.amount ||
    payload.recovery_amount ||
    payload.resolution_amount ||
    payload.estimated_value ||
    payload.totalValue ||
    payload.total_value ||
    payload.approved_amount;
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

  if (type === 'product_update') {
    return {
      eyebrow: 'Product update',
      header: rawTitle || (payload.title ? `New in Margin: ${payload.title}` : 'New in Margin'),
      message: rawMessage || payload.summary || 'A new Margin rollout is available.',
      tone: 'neutral' as NotificationTone,
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
    const findingsCount = Number(payload.count || 0);
    const claimReadyCount = Number(payload.claimReadyCount || payload.claim_ready_count || 0);
    const reviewNeededCount = Number(payload.reviewNeededCount || payload.review_needed_count || 0);
    return {
      eyebrow: 'Recovery found',
      header: rawTitle || (formattedAmount ? `${formattedAmount} opportunity found` : 'Recovery opportunity found'),
      message: rawMessage || `${findingsCount || 1} finding${findingsCount === 1 ? '' : 's'} recorded${claimReadyCount || reviewNeededCount ? ` · ${claimReadyCount} claim-ready · ${reviewNeededCount} review-needed` : ''}${syncIdentifier ? ` · ${syncIdentifier}` : ''}.`,
      tone: 'neutral' as NotificationTone,
    };
  }

  if (type === 'refund_approved' || type === 'approved') {
    return {
      eyebrow: 'Approval',
      header: rawTitle || (formattedAmount ? `${formattedAmount} approved` : 'Reimbursement approved'),
      message: rawMessage || 'Amazon approval is recorded. Margin will keep tracking until payout proof confirms payment.',
      tone: 'success' as NotificationTone,
    };
  }

  if (type === 'paid') {
    return {
      eyebrow: 'Payout',
      header: rawTitle || (formattedAmount ? `${formattedAmount} payout issued` : 'Payout issued'),
      message: rawMessage || 'Amazon confirmed reimbursement on the linked case.',
      tone: 'success' as NotificationTone,
    };
  }

  if (type === 'funds_deposited' || type === 'reimbursement_payout') {
    if (hasRecoveryPayoutTruth) {
      return {
        eyebrow: 'Payout',
        header: formattedAmount ? `${formattedAmount} recovery payout confirmed` : 'Recovery payout confirmed',
        message: rawMessage || 'A payout was matched to a recovery record and verified against the settlement trail.',
        tone: 'success' as NotificationTone,
      };
    }

    return {
      eyebrow: 'Financial record',
      header: formattedAmount ? `${formattedAmount} settlement activity` : 'Settlement activity recorded',
      message: 'Amazon financial activity was imported. Margin will only call it recovered after it matches a filed recovery and verified payout proof.',
      tone: 'neutral' as NotificationTone,
    };
  }

  if (type === 'case_filed') {
    if (status === 'pending') {
      return {
        eyebrow: 'Case movement',
        header: rawTitle || `${caseIdentifier ? `(${caseIdentifier}) ` : ''}Preparing case`,
        message: rawMessage || 'Margin is preparing this case for Amazon filing.',
        tone: 'progress' as NotificationTone,
      };
    }

    if (status === 'in_progress') {
      return {
        eyebrow: 'Case movement',
        header: rawTitle || `${caseIdentifier ? `(${caseIdentifier}) ` : ''}Queued for filing`,
        message: rawMessage || 'This case is queued for Amazon submission.',
        tone: 'progress' as NotificationTone,
      };
    }

    return {
      eyebrow: 'Case movement',
      header: rawTitle || `${caseIdentifier ? `(${caseIdentifier}) ` : ''}Filed to Amazon`,
      message: rawMessage || 'Margin submitted this case to Amazon and is now tracking the thread.',
      tone: 'progress' as NotificationTone,
    };
  }

  if (type === 'evidence_found') {
    return {
      eyebrow: 'Evidence',
      header: rawTitle || `${documentLabel ? `(${documentLabel}) ` : ''}${payload.matchFound || payload.match_found ? 'Evidence linked' : 'Evidence found'}`,
      message: rawMessage || `${documentLabel || 'A document'} was added to the evidence trail.`,
      tone: payload.matchFound || payload.match_found ? ('success' as NotificationTone) : ('neutral' as NotificationTone),
    };
  }

  if (type === 'needs_evidence') {
    return {
      eyebrow: 'Amazon request',
      header: rawTitle || `${requestType ? `(${toTitleCase(requestType)}) ` : ''}Amazon requested`,
      message: rawMessage || `Amazon asked for ${requestType || 'additional evidence'} on this case.`,
      tone: 'warning' as NotificationTone,
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
    if (type.includes('product_update')) return tenantRoute(activeSlug, '/whats-new');
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
              "pointer-events-none absolute z-10 flex h-4 min-w-4 select-none items-center justify-center rounded-full border border-white bg-[#0052FF] px-[3px] text-center font-sans text-[9px] font-bold leading-4 text-[#FFFFFF] tabular-nums shadow-[0_8px_18px_rgba(0,82,255,0.22)]",
              isSidebarStyle ? "right-2 top-1" : "right-0 top-0 translate-x-1/4 -translate-y-1/4"
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
        className="platform-vitality-page z-50 flex max-h-[520px] w-[428px] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-[0_24px_70px_rgba(17,24,39,0.12)] backdrop-blur-xl">
        <div className="bg-[#F9FAFB] px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
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
                  className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#4B5563] transition-colors hover:text-[#0052FF]">
                  Mark all read
                </button>
              )}
              <div className="inline-flex min-w-[88px] items-center justify-center whitespace-nowrap rounded-full border border-[#D8E7FF] bg-[#F3F7FF] px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-tight text-[#0052FF]">
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
                    !notification.read ? 'bg-[#F3F7FF]' : 'bg-transparent'
                  )}
                  onClick={() => handleNotificationClick(notification.id)}>
                  <div
                    className={cn(
                      'absolute left-0 top-3 bottom-3 w-[2px] rounded-full transition-opacity',
                      !notification.read ? 'bg-[#0052FF] opacity-100' : 'bg-[#0052FF]/20 opacity-0 group-hover:opacity-100'
                    )}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-tight',
                            notification.tone === 'success'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
                              : notification.tone === 'warning'
                                ? 'border-amber-500/20 bg-amber-500/10 text-amber-700'
                                : notification.tone === 'progress'
                                  ? 'border-[#D8E7FF] bg-[#F3F7FF] text-[#0052FF]'
                                  : 'border-[#E5E7EB] bg-white text-[#4B5563]'
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

        <div className="bg-[#F9FAFB] px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
          <Link to={tenantRoute(activeSlug, '/notifications')} onClick={() => setIsOpen(false)}>
            <button className="w-full rounded-full border border-[#D8E7FF] bg-[#F3F7FF] px-4 py-2 text-center text-[10px] font-sans font-medium uppercase tracking-tight text-[#0052FF] transition-colors hover:border-[#0052FF]/30 hover:bg-white">
              View all updates
            </button>
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
