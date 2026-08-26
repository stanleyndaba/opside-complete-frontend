import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ChevronRight, Search, Settings, Bell, AlertCircle, RefreshCw,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isAfter, subDays, isToday, isYesterday } from 'date-fns';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getSystemSignalActionLabel, getSystemSignalMeta, resolveSystemSignalHref } from '@/lib/systemSignalRoutes';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  created_at: Date;
  channels: string[];
  read: boolean;
  payload?: any;
  href?: string;
  actionLabel?: string | null;
  systemSignal?: ReturnType<typeof getSystemSignalMeta>;
}

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  category: string;
  email: boolean;
  inApp: boolean;
  supported: boolean;
  supportNote?: string;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    id: 'case_filed',
    title: 'Case Filed',
    description: 'When Margin submits a case to Amazon.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'needs_evidence',
    title: 'Amazon Needs Evidence',
    description: 'High-priority thread updates requesting more information.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'approved',
    title: 'Case Approved',
    description: 'When Amazon resolves a case in your favor.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'rejected',
    title: 'Case Rejected',
    description: 'When Amazon denies or closes a case without reimbursement.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'paid',
    title: 'Reimbursement Issued',
    description: 'When Amazon confirms reimbursement on a case thread.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'funds_deposited',
    title: 'Funds Deposited',
    description: 'When recovered funds are confirmed in payout flows.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'claim_detected',
    title: 'Recovery Opportunity Detected',
    description: 'High-value discrepancy and detection alerts.',
    category: 'Evidence & Sync',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'evidence_found',
    title: 'Evidence Linked',
    description: 'When a document is linked into case review. This does not imply filing-ready proof on its own.',
    category: 'Evidence & Sync',
    email: false,
    inApp: true,
    supported: true
  },
  {
    id: 'amazon_challenge',
    title: 'Amazon Challenge',
    description: 'When Amazon pushes back on a case and escalation begins.',
    category: 'Cases & Recoveries',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'sync_started',
    title: 'Amazon Sync Started',
    description: 'When Margin begins refreshing Amazon data.',
    category: 'Evidence & Sync',
    email: false,
    inApp: true,
    supported: true
  },
  {
    id: 'sync_completed',
    title: 'Amazon Sync Completed',
    description: 'When a data refresh completes successfully.',
    category: 'Evidence & Sync',
    email: false,
    inApp: true,
    supported: true
  },
  {
    id: 'sync_failed',
    title: 'Amazon Sync Failed',
    description: 'When a refresh run hits a real error and needs attention.',
    category: 'Evidence & Sync',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'weekly_summary',
    title: 'Weekly Recovery Summary',
    description: 'Curated digest of detections, cases, and recovered funds.',
    category: 'Platform Learning',
    email: true,
    inApp: false,
    supported: true
  },
  {
    id: 'product_update',
    title: 'Product Updates',
    description: 'New product improvements and rollout notes published by Margin.',
    category: 'Margin Updates',
    email: true,
    inApp: true,
    supported: true
  },
  {
    id: 'learning_insight',
    title: 'Learning Insight',
    description: 'Model and pattern-learning improvements from Agent 11.',
    category: 'Platform Learning',
    email: false,
    inApp: true,
    supported: true
  }
];

const mergePreferencesWithDefaults = (
  saved: Record<string, { email?: boolean; inApp?: boolean }>
): NotificationPreference[] => {
  return DEFAULT_PREFERENCES.map((pref) => {
    const persisted =
      saved[pref.id] ||
      (pref.id === 'weekly_summary' ? saved['weekly-summary'] || saved['monthly-summary'] : undefined) ||
      (pref.id === 'product_update' ? saved['product-updates'] : undefined);
    if (!persisted) {
      return pref;
    }
    return {
      ...pref,
      email: persisted.email ?? pref.email,
      inApp: persisted.inApp ?? pref.inApp
    };
  });
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Cases & Recoveries': 'Case filing, approvals, thread responses, and payout milestones.',
  'Evidence & Sync': 'Evidence readiness, sync progress, and detection movement.',
  'Margin Updates': 'Product improvements and rollout announcements from Margin.',
  'Platform Learning': 'Digest and platform-learning updates from Margin.'
};

const formatTimestamp = (createdAt: string): string => {
  try {
    const date = new Date(createdAt);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

const renderNotificationMessage = (message: string) => {
  if (!message) return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-[#111827]">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function NotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { tenant } = useTenant();
  const { notifications: providerNotifications, isLoading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const location = useLocation();
  const routeSlugMatch = location.pathname.match(/^\/app\/([^/]+)/);
  const activeSlug =
    normalizeTenantSlug(tenant?.slug) ||
    normalizeTenantSlug(tenantSlug) ||
    normalizeTenantSlug(routeSlugMatch?.[1]) ||
    '';
  const loading = isLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const mappedNotifications: Notification[] = providerNotifications.map((notif: any) => {
      const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());
      const channel = notif.channel || notif.payload?.channel || 'in_app';
      const channels: string[] = [];
      if (channel === 'in_app' || channel === 'both') channels.push('In-App');
      if (channel === 'email' || channel === 'both' || notif.email_sent || notif.sent_via_email || notif.payload?.email_sent) channels.push('Email');
      if (channels.length === 0) channels.push('In-App');
      
      return {
        id: notif.id,
        type: notif.type || 'general',
        title: notif.title || notif.message || 'New notification',
        message: notif.message || '',
        timestamp,
        created_at: new Date(notif.created_at || new Date().toISOString()),
        channels,
        read: notif.status === 'read' || notif.read || notif.is_read || notif.seller_state === 'read' || notif.seller_state === 'acknowledged' || false,
        payload: notif.payload || {},
        href: getSystemSignalMeta(notif) ? resolveSystemSignalHref(notif, activeSlug) : undefined,
        actionLabel: getSystemSignalActionLabel(notif),
        systemSignal: getSystemSignalMeta(notif)
      };
    });

    setNotifications(mappedNotifications);
    setError(null);
  }, [activeSlug, providerNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchBlob = `${notification.title} ${notification.message}`.toLowerCase();
        if (!searchBlob.includes(query)) return false;
      }
      if (typeFilter !== 'all') {
        const typeLower = notification.type.toLowerCase();
        if (typeFilter === 'financial' && !typeLower.includes('payout') && !typeLower.includes('payment') && !typeLower.includes('funds') && !typeLower.includes('claim') && !typeLower.includes('recovery')) return false;
        if (typeFilter === 'document' && !typeLower.includes('document') && !typeLower.includes('invoice') && !typeLower.includes('file') && !typeLower.includes('evidence')) return false;
        if (typeFilter === 'system' && !typeLower.includes('security') && !typeLower.includes('update') && !typeLower.includes('feature') && !typeLower.includes('team') && !typeLower.includes('user')) return false;
      }
      if (dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === 'today' && !isToday(notification.created_at)) return false;
        if (dateFilter === 'week' && !isAfter(notification.created_at, subDays(now, 7))) return false;
        if (dateFilter === 'month' && !isAfter(notification.created_at, subDays(now, 30))) return false;
      }
      if (statusFilter === 'unread' && notification.read) return false;
      if (statusFilter === 'read' && !notification.read) return false;
      return true;
    });
  }, [notifications, searchQuery, typeFilter, dateFilter, statusFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      'Today': [],
      'Yesterday': [],
      'Older': []
    };

    filteredNotifications.forEach(notif => {
      if (isToday(notif.created_at)) groups['Today'].push(notif);
      else if (isYesterday(notif.created_at)) groups['Yesterday'].push(notif);
      else groups['Older'].push(notif);
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Success', description: 'All notifications marked as read' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' });
    }
  };

  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshNotifications();
      toast({ title: 'Refreshed', description: 'Notifications updated' });
    } catch (err: any) {
      setError(err.message || 'Failed to refresh notifications');
    }
  };

  const loadPreferences = async () => {
    if (!activeSlug) {
      setPreferencesLoaded(false);
      return false;
    }
    try {
      setPreferencesError(null);
      const response = await api.getNotificationPreferences(activeSlug);
      if (response.ok && response.data) {
        setPreferences(mergePreferencesWithDefaults(response.data.data));
        setPreferencesLoaded(true);
        return true;
      }
      setPreferencesLoaded(false);
      setPreferences(DEFAULT_PREFERENCES);
      return false;
    } catch (err: any) {
      setPreferencesLoaded(false);
      setPreferences(DEFAULT_PREFERENCES);
      return false;
    }
  };

  useEffect(() => {
    void loadPreferences();
  }, [activeSlug]);

  const updatePreference = async (id: string, channel: 'email' | 'inApp', value: boolean) => {
    if (!activeSlug) {
      toast({ title: 'Workspace unavailable', description: 'Preferences require an active workspace.', variant: 'destructive' });
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = preferences.map(pref => pref.id === id ? { ...pref, [channel]: value } : pref);

    setPreferences(nextPreferences);
    const prefsToSave: Record<string, { email: boolean; inApp: boolean }> = {};
    nextPreferences.forEach(pref => {
      prefsToSave[pref.id] = { email: pref.email, inApp: pref.inApp };
    });

    try {
      const response = await api.saveNotificationPreferences(prefsToSave, activeSlug);
      if (response.ok) {
        await loadPreferences();
        toast({ title: 'Preferences saved' });
      } else {
        setPreferences(previousPreferences);
        toast({ title: 'Failed to save preferences', variant: 'destructive' });
      }
    } catch (err: any) {
      setPreferences(previousPreferences);
      toast({ title: 'Error saving preferences', variant: 'destructive' });
    }
  };

  const activePreferenceCount = preferences.filter(p => p.email || p.inApp).length;

  return (
    <PageLayout title="Notifications" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Workspace activity</p>
                <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">Notifications</h1>
                <p className="mt-2.5 max-w-xl text-[14px] leading-6 text-[#66737F]">Review system events, recovery activity, and actions that need your attention.</p>
              </div>
              <Sheet open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                    <Settings className="h-3.5 w-3.5" />
                    Preferences
                  </Button>
                </SheetTrigger>
                  <SheetContent side="right" className="w-full border-l border-[#DCE8EE] bg-white p-0 text-[#111827] sm:max-w-[450px]">
                  <SheetHeader className="border-b border-[#DCE8EE] px-6 py-6 text-left">
                    <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Delivery settings</p>
                    <SheetTitle className="mt-1.5 font-lora text-2xl font-normal tracking-tight text-[#182026]">Notification settings</SheetTitle>
                    <p className="mt-2 text-[13px] leading-5 text-[#66737F]">Manage how and where you receive operational updates.</p>
                  </SheetHeader>
                  <div className="h-[calc(100vh-154px)] overflow-y-auto px-6 py-6">
                    <div className="space-y-7">
                      {Object.keys(CATEGORY_DESCRIPTIONS).map(category => (
                        <div key={category}>
                          <h3 className="mb-1 text-[14px] font-semibold tracking-tight text-[#182026]">{category}</h3>
                          <p className="mb-3 text-[12px] leading-5 text-[#66737F]">{CATEGORY_DESCRIPTIONS[category]}</p>
                          <div className="divide-y divide-[#E7EEF2] border-y border-[#E7EEF2]">
                            {preferences.filter(p => p.category === category).map(pref => (
                              <div key={pref.id} className="py-3.5">
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-[13px] font-semibold tracking-tight text-[#182026]">{pref.title}</span>
                                </div>
                                <p className="mb-3 text-[12px] leading-5 text-[#66737F]">{pref.description}</p>
                                <div className="flex items-center gap-5">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={pref.inApp} onCheckedChange={(v) => updatePreference(pref.id, 'inApp', v)} className="scale-75" />
                                    <span className="text-[12px] font-medium text-[#66737F]">In-app</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch checked={pref.email} onCheckedChange={(v) => updatePreference(pref.id, 'email', v)} className="scale-75" />
                                    <span className="text-[12px] font-medium text-[#66737F]">Email</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

          </div>
        </div>

        {/* Readiness Strip */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", unreadCount > 0 ? "bg-[#0B74DE]" : "bg-[#AAB6BE]")} />
                <span className="text-[13px] text-[#66737F]">Unread</span>
                <span className="text-[13px] font-semibold tracking-tight text-[#182026]">{unreadCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#66737F]" aria-hidden="true" />
                <span className="text-[13px] text-[#66737F]">Inbox status</span>
                <span className="text-[13px] font-semibold tracking-tight text-[#182026]">{loading ? 'Updating' : 'Live'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="text-[13px] font-medium tracking-tight text-[#0B74DE] hover:text-[#005FBA] disabled:cursor-not-allowed disabled:opacity-40">Mark all read</button>
                <span className="h-3 w-px bg-[#DCE8EE]" />
                <button onClick={handleRefresh} disabled={loading} className="text-[13px] font-medium tracking-tight text-[#4D5B66] hover:text-[#182026] disabled:cursor-not-allowed disabled:opacity-40">Refresh</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[190px] flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#66737F]" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search notifications"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#DCE8EE] bg-[#FAFAF7] pl-8.5 pr-3 text-[13px] tracking-tight text-[#182026] outline-none placeholder:text-[#8A97A2] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15 sm:w-[210px]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterSelect value={typeFilter} onChange={setTypeFilter} options={[
                  { value: 'all', label: 'All types' },
                  { value: 'financial', label: 'Financial' },
                  { value: 'document', label: 'Evidence' },
                  { value: 'system', label: 'System' }
                ]} />
                <FilterSelect value={dateFilter} onChange={setDateFilter} options={[
                  { value: 'all', label: 'All time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'This week' },
                  { value: 'month', label: 'This month' }
                ]} />
                <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
                  { value: 'all', label: 'All status' },
                  { value: 'unread', label: 'Unread' },
                  { value: 'read', label: 'Read' }
                ]} />
                {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setTypeFilter('all'); setDateFilter('all'); setStatusFilter('all'); }}
                    className="h-9 rounded-md border border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3.5 text-[13px] leading-5 text-rose-800" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold tracking-tight">Notifications could not refresh</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          ) : null}

          {filteredNotifications.length === 0 ? (
            <div className="rounded-[10px] border border-[#DCE8EE] bg-white px-5 py-14 text-center shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
              <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#DCE8EE] bg-[#F7FAFC]">
                <Bell className="h-4 w-4 text-[#66737F]" aria-hidden="true" />
              </div>
              <h2 className="text-[16px] font-semibold tracking-tight text-[#182026]">No notifications found</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-[#66737F]">Try adjusting your filters or check back when new workspace activity arrives.</p>
              {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setTypeFilter('all'); setDateFilter('all'); setStatusFilter('all'); }} className="mt-5 h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="space-y-7">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                items.length > 0 && (
                  <div key={group}>
                    <h2 className="mb-3 text-[13px] font-medium tracking-tight text-[#66737F]">{group}</h2>
                    <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                      {items.map((notif) => (
                        <ActivityRow 
                          key={notif.id} 
                          notification={notif} 
                          onRead={() => !notif.read && handleMarkAsRead(notif.id)}
                          onNavigate={() => {
                            if (!notif.read) handleMarkAsRead(notif.id);
                            if (notif.href) {
                              navigate(notif.href);
                              return;
                            }
                            // Legacy rows retain their pre-existing broad routing.
                            if (notif.type.includes('case')) navigate(tenantRoute(activeSlug, '/dispute-cases'));
                            else if (notif.type.includes('evidence')) navigate(tenantRoute(activeSlug, '/evidence-locker'));
                            else navigate(tenantRoute(activeSlug, '/notifications'));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </main>

        {/* Delivery record */}
        <div className="mx-auto max-w-[1180px] px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          <p className="border-t border-[#DCE8EE] pt-5 text-[12px] leading-5 text-[#66737F]">Notification delivery and read state are recorded separately. Opening a notification does not complete a required case or audit action.</p>
        </div>
      </div>
    </PageLayout>
  );
}

const SELLER_EVENT_LABELS: Record<string, string> = {
  'audit.completed_findings': 'Audit completed — opportunities available for review',
  'audit.completed_no_findings': 'Audit completed — no supported opportunities',
  'audit.data_incomplete': 'Audit needs additional data',
  'audit.failed_action_required': 'Audit needs attention',
  'integration.amazon.authentication_invalid': 'Amazon connection needs attention',
  'integration.amazon.sync_paused': 'Amazon sync is paused',
  'integration.amazon.restored': 'Amazon connection restored',
};

function formatSellerEventLabel(notification: Notification) {
  const rawEvent = String(notification.systemSignal?.eventType || notification.type || '').trim();
  if (SELLER_EVENT_LABELS[rawEvent]) return SELLER_EVENT_LABELS[rawEvent];

  return rawEvent
    .replace(/[._]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ActivityRow({ notification, onRead, onNavigate }: {
  notification: Notification,
  onRead: () => void,
  onNavigate: () => void
}) {
  const eventLabel = formatSellerEventLabel(notification);

  return (
    <div
      className={cn(
        'group flex flex-col gap-4 px-4 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:px-5',
        notification.read ? 'bg-white hover:bg-[#F7FAFC]' : 'bg-[#FBFDFF] hover:bg-[#F4F9FE]'
      )}
      onClick={onRead}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2.5">
          {!notification.read ? <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B74DE]" aria-label="Unread" /> : <span className="mt-2 h-1.5 w-1.5 shrink-0" aria-hidden="true" />}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-5 tracking-tight text-[#182026]">
              {renderNotificationMessage(notification.title)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-5 text-[#66737F]">
              <span className="capitalize">{eventLabel}</span>
              <span className="h-1 w-1 rounded-full bg-[#DCE8EE]" aria-hidden="true" />
              <span>{notification.timestamp}</span>
            </div>
            {notification.message ? (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#4D5B66]">
                {renderNotificationMessage(notification.message)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={(event) => { event.stopPropagation(); onNavigate(); }}
        className="h-8 w-fit shrink-0 gap-1 rounded-md border-[#DCE8EE] bg-white px-3 text-[12px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC] hover:text-[#005FBA]"
      >
        {notification.actionLabel || 'View'}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[104px] rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-md border-[#DCE8EE] bg-white shadow-[0_14px_30px_rgba(24,32,38,0.10)]">
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-[13px] font-medium text-[#182026] focus:bg-[#F7FAFC]">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
