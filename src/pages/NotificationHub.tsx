import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  ChevronRight, Search, X, Settings, Bell, 
  FileText, Zap, Shield, AlertCircle, RefreshCw, DollarSign,
  CheckCircle2, Clock, Filter, Mail, Database,
  ArrowUpRight, Info
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
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Forensic Identity Header */}
        <div className="border-b border-[#E5E7EB] bg-white px-8 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-[#0B74DE]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B74DE]">Activity Hub</span>
              </div>
              <Sheet open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-[11px] font-semibold tracking-tight text-[#6B7280] hover:bg-[#F3F5F4] hover:text-[#111827]">
                    <Settings className="h-3.5 w-3.5" />
                    Preferences
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full border-l border-[#E5E7EB] bg-white p-0 text-[#111827] sm:max-w-[450px]">
                  <SheetHeader className="border-b border-[#E5E7EB] px-6 py-6 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Configuration</div>
                    <SheetTitle className="mt-2 font-lora text-2xl font-normal tracking-tight">Notification settings</SheetTitle>
                    <p className="text-[13px] text-[#6B7280] leading-relaxed">Manage how and where you receive operational updates.</p>
                  </SheetHeader>
                  <div className="h-[calc(100vh-140px)] overflow-y-auto px-6 py-8">
                    <div className="space-y-8">
                      {Object.keys(CATEGORY_DESCRIPTIONS).map(category => (
                        <div key={category}>
                          <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#111827]">{category}</h3>
                          <p className="mb-4 text-[11px] text-[#6B7280]">{CATEGORY_DESCRIPTIONS[category]}</p>
                          <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                            {preferences.filter(p => p.category === category).map(pref => (
                              <div key={pref.id} className="py-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[13px] font-semibold tracking-tight">{pref.title}</span>
                                </div>
                                <p className="mb-4 text-[11px] text-[#6B7280] leading-relaxed">{pref.description}</p>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <Switch checked={pref.inApp} onCheckedChange={(v) => updatePreference(pref.id, 'inApp', v)} className="scale-75" />
                                    <span className="text-[11px] font-medium text-[#6B7280]">In-App</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch checked={pref.email} onCheckedChange={(v) => updatePreference(pref.id, 'email', v)} className="scale-75" />
                                    <span className="text-[11px] font-medium text-[#6B7280]">Email</span>
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
            <h1 className="mb-4 font-lora text-[32px] font-normal leading-tight tracking-tight text-[#111827]">
              System events and recovery activity
            </h1>
            <p className="max-w-2xl text-[15px] font-normal leading-relaxed tracking-tight text-[#6B7280]">
              Forensic activity log for the Margin workspace. Track automated sync progress, evidence readiness, and case-payout milestones.
            </p>
          </div>
        </div>

        {/* Readiness Strip */}
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-8 py-3">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", unreadCount > 0 ? "bg-[#0B74DE]" : "bg-[#9CA3AF]")} />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Unread:</span>
                <span className="text-[11px] font-bold text-[#111827]">{unreadCount} Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Last Refresh:</span>
                <span className="text-[11px] font-bold text-[#111827]">{loading ? "Updating..." : "Live"}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleMarkAllRead} disabled={unreadCount === 0} className="text-[11px] font-bold text-[#0B74DE] hover:underline disabled:opacity-40 disabled:no-underline">Mark all read</button>
                <div className="h-3 w-px bg-[#E5E7EB]" />
                <button onClick={handleRefresh} disabled={loading} className="text-[11px] font-bold text-[#6B7280] hover:text-[#111827]">Refresh</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
                <input 
                  type="text" 
                  placeholder="Filter activity..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-[11px] font-medium tracking-tight outline-none focus:border-[#0B74DE] focus:ring-0"
                />
              </div>
              <div className="flex flex-wrap gap-1">
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
                    className="h-8 rounded-md border border-[#E5E7EB] px-3 text-[11px] font-semibold tracking-tight text-[#6B7280] hover:bg-[#F3F5F4] hover:text-[#111827]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-8 py-12">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4]">
                <Bell className="h-6 w-6 text-[#9CA3AF]" />
              </div>
              <h3 className="text-[14px] font-semibold text-[#111827]">No activity detected</h3>
              <p className="mt-1 text-[12px] text-[#6B7280]">Try adjusting your filters or check back later.</p>
              {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setTypeFilter('all'); setDateFilter('all'); setStatusFilter('all'); }} className="mt-6 h-8 text-[11px] font-bold uppercase tracking-tight">Clear all filters</Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                items.length > 0 && (
                  <div key={group}>
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{group}</h3>
                    <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
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
        </div>

        {/* Registry Footer */}
        <div className="mx-auto max-w-5xl px-8 pb-20 pt-10">
          <div className="border-t border-[#E5E7EB] pt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              <Shield className="h-3 w-3" />
              Communication Registry • US-EAST-1
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function ActivityRow({ notification, onRead, onNavigate }: { 
  notification: Notification, 
  onRead: () => void,
  onNavigate: () => void
}) {
  const Icon = useMemo(() => {
    const type = notification.type.toLowerCase();
    if (type.includes('payout') || type.includes('payment') || type.includes('funds') || type.includes('paid')) return DollarSign;
    if (type.includes('claim') || type.includes('recovery') || type.includes('case')) return FileText;
    if (type.includes('evidence') || type.includes('document') || type.includes('invoice')) return Shield;
    if (type.includes('sync')) return RefreshCw;
    if (type.includes('security') || type.includes('update')) return Zap;
    return Bell;
  }, [notification.type]);

  return (
    <div 
      className={cn(
        "group flex items-center justify-between py-5 transition-colors",
        notification.read ? "opacity-75 hover:bg-[#F3F5F4]/30" : "bg-white hover:bg-[#F8FAFB]"
      )}
      onClick={onRead}
    >
      <div className="flex items-start gap-5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          <Icon className="h-4.5 w-4.5 text-[#4B5563]" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold tracking-tight text-[#111827]">
              {renderNotificationMessage(notification.title)}
            </span>
            {!notification.read && <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">
              {notification.systemSignal?.eventType.replace(/\./g, ' ') || notification.type.replace(/_/g, ' ')}
            </span>
            <div className="h-1 w-1 rounded-full bg-[#E5E7EB]" />
            <span className="text-[11px] font-medium text-[#6B7280]">{notification.timestamp}</span>
          </div>
          {notification.message && (
            <p className="mt-2 max-w-2xl text-[12px] leading-relaxed tracking-tight text-[#6B7280]">
              {renderNotificationMessage(notification.message)}
            </p>
          )}
          {notification.actionLabel && (
            <p className="mt-3 text-[11px] font-semibold tracking-tight text-[#0B74DE]">
              {notification.actionLabel} →
            </p>
          )}
        </div>
      </div>
      
      <div className="flex shrink-0 items-center gap-4 px-4 opacity-0 transition-opacity group-hover:opacity-100">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          className="h-8 gap-1.5 border-[#E5E7EB] px-3 text-[11px] font-bold uppercase tracking-tight text-[#111827] hover:bg-[#F3F5F4]"
        >
          {notification.actionLabel || 'View'}
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[100px] border-[#E5E7EB] bg-white px-3 text-[11px] font-semibold tracking-tight text-[#6B7280] focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-[#E5E7EB] bg-white shadow-xl">
        {options.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-[11px] font-medium text-[#111827] focus:bg-[#F3F5F4]">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
