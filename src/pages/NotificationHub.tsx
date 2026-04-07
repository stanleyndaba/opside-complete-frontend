import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ChevronRight, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isAfter, subDays, subHours } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  created_at: Date;
  channels: string[];
  read: boolean;
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
    title: 'Evidence Ready',
    description: 'When useful evidence enters the recovery lane.',
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
    const persisted = saved[pref.id] || (pref.id === 'weekly-summary' ? saved['monthly-summary'] : undefined);
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
  'Platform Learning': 'Digest and platform-learning updates from Margin.'
};

// Format timestamp to relative time
const formatTimestamp = (createdAt: string): string => {
  try {
    const date = new Date(createdAt);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

// Helper to render bold text from "**text**" markdown
const renderNotificationMessage = (message: string) => {
  if (!message) return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function NotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { toast } = useToast();

  const { tenant } = useTenant();
  const activeSlug = tenant?.slug || '';

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load notifications from API
  useEffect(() => {
    if (!activeSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getNotifications({ limit: 100 }, activeSlug);
        if (!cancelled) {
          const notifData = response.ok
            ? (response.data?.notifications || response.data?.data || response.data || [])
            : [];

          if (response.ok && Array.isArray(notifData)) {
            const mappedNotifications: Notification[] = notifData.map((notif: any) => {
              const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());
              const channel = notif.channel || 'in_app';
              const channels: string[] = [];
              if (channel === 'in_app' || channel === 'both') {
                channels.push('In-App');
              }
              if (channel === 'email' || channel === 'both' || notif.email_sent || notif.sent_via_email) {
                channels.push('Email');
              }
              return {
                id: notif.id,
                type: notif.type || 'general',
                message: notif.message || notif.title || 'New notification',
                timestamp,
                created_at: new Date(notif.created_at || new Date().toISOString()),
                channels,
                read: notif.read || notif.is_read || notif.status === 'read' || false
              };
            });
            setNotifications(mappedNotifications);
            setError(null);
          } else {
            setNotifications([]);
            if (!response.ok) {
              setError(response.error || 'Failed to load notifications');
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load notifications:', err);
          setNotifications([]);
          setError(err.message || 'Failed to load notifications');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [activeSlug]);

  // Filter notifications based on search and filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!notification.message.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all') {
        const typeLower = notification.type.toLowerCase();
        if (typeFilter === 'financial' && !typeLower.includes('payout') && !typeLower.includes('payment') && !typeLower.includes('funds') && !typeLower.includes('claim') && !typeLower.includes('recovery')) {
          return false;
        }
        if (typeFilter === 'document' && !typeLower.includes('document') && !typeLower.includes('invoice') && !typeLower.includes('file') && !typeLower.includes('evidence')) {
          return false;
        }
        if (typeFilter === 'system' && !typeLower.includes('security') && !typeLower.includes('update') && !typeLower.includes('feature') && !typeLower.includes('team') && !typeLower.includes('user')) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === 'today' && !isAfter(notification.created_at, subDays(now, 1))) {
          return false;
        }
        if (dateFilter === 'week' && !isAfter(notification.created_at, subDays(now, 7))) {
          return false;
        }
        if (dateFilter === 'month' && !isAfter(notification.created_at, subDays(now, 30))) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'unread' && notification.read) {
        return false;
      }
      if (statusFilter === 'read' && !notification.read) {
        return false;
      }

      return true;
    });
  }, [notifications, searchQuery, typeFilter, dateFilter, statusFilter]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDateFilter('all');
    setStatusFilter('all');
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await api.markNotificationRead(notificationId, activeSlug);
      if (response.ok) {
        setNotifications(prev => prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ));
      } else {
        toast({
          title: 'Failed to mark as read',
          description: response.error || 'Could not update notification',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const response = await api.markAllNotificationsRead(activeSlug);
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({ title: 'Success', description: 'All notifications marked as read' });
      } else {
        toast({
          title: 'Failed',
          description: response.error || 'Could not mark all as read',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to mark notifications as read',
        variant: 'destructive'
      });
    }
  };

  // Refresh notifications
  const handleRefresh = () => {
    setLoading(true);
    api.getNotifications({ limit: 100 }, activeSlug).then(response => {
      const notifData = response.ok
        ? (response.data?.notifications || response.data?.data || response.data || [])
        : [];

      if (response.ok && Array.isArray(notifData)) {
        const mappedNotifications: Notification[] = notifData.map((notif: any) => {
          const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());
          const channel = notif.channel || 'in_app';
          const channels: string[] = [];
          if (channel === 'in_app' || channel === 'both') {
            channels.push('In-App');
          }
          if (channel === 'email' || channel === 'both' || notif.email_sent || notif.sent_via_email) {
            channels.push('Email');
          }
          return {
            id: notif.id,
            type: notif.type || 'general',
            message: notif.message || notif.title || 'New notification',
            timestamp,
            created_at: new Date(notif.created_at || new Date().toISOString()),
            channels,
            read: notif.read || notif.is_read || notif.status === 'read' || false
          };
        });
        setNotifications(mappedNotifications);
        setError(null);
        toast({ title: 'Refreshed', description: 'Notifications updated' });
      } else if (!response.ok) {
        setError(response.error || 'Failed to refresh notifications');
      }
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'Failed to refresh notifications');
      setLoading(false);
    });
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
        setPreferences(mergePreferencesWithDefaults(response.data));
        setPreferencesLoaded(true);
        return true;
      }

      setPreferencesLoaded(false);
      setPreferences(DEFAULT_PREFERENCES);
      setPreferencesError(response.error || 'Failed to load saved preferences');
      return false;
    } catch (err: any) {
      console.warn('Failed to load notification preferences:', err);
      setPreferencesLoaded(false);
      setPreferences(DEFAULT_PREFERENCES);
      setPreferencesError(err.message || 'Failed to load saved preferences');
      return false;
    }
  };

  // Load preferences from backend on mount
  useEffect(() => {
    void loadPreferences();
  }, [activeSlug]);

  const updatePreference = async (id: string, channel: 'email' | 'inApp', value: boolean) => {
    if (!activeSlug) {
      toast({ title: 'Workspace unavailable', description: 'Notification preferences require an active workspace.', variant: 'destructive' });
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = preferences.map(pref =>
      pref.id === id ? { ...pref, [channel]: value } : pref
    );

    setPreferences(nextPreferences);
    setPreferencesError(null);

    const prefsToSave: Record<string, { email: boolean; inApp: boolean }> = {};
    nextPreferences.forEach(pref => {
      prefsToSave[pref.id] = { email: pref.email, inApp: pref.inApp };
    });

    try {
      const response = await api.saveNotificationPreferences(prefsToSave, activeSlug);
      if (response.ok) {
        const reloaded = await loadPreferences();
        if (reloaded) {
          toast({ title: 'Preferences saved' });
        } else {
          setPreferences(previousPreferences);
          toast({ title: 'Failed to reload saved preferences', variant: 'destructive' });
        }
      } else {
        setPreferences(previousPreferences);
        setPreferencesError(response.error || 'Failed to save preferences');
        toast({ title: 'Failed to save', description: response.error || 'Please try again', variant: 'destructive' });
      }
    } catch (err: any) {
      setPreferences(previousPreferences);
      setPreferencesError(err.message || 'Failed to save preferences');
      toast({ title: 'Failed to save', description: 'Preferences were not saved', variant: 'destructive' });
    }
  };

  const categories = [
    'Cases & Recoveries',
    'Evidence & Sync',
    'Platform Learning'
  ];

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);
  const activePreferenceCount = useMemo(
    () => preferences.filter((preference) => preference.email || preference.inApp).length,
    [preferences]
  );

  return (
    <PageLayout title="Notifications" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#050505]">
        <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <Sheet open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <div className="relative max-w-[1600px] mx-auto px-8 py-12">
          {/* Analysis Header */}
          <div className="flex flex-col gap-1 mb-8 border-b border-white/5 pb-8">
            <div className="text-[10px] font-sans font-bold text-white/30 tracking-tight uppercase">Communication Registry</div>
            <h1 className="text-4xl font-light text-white tracking-tight font-sans mt-2">Notifications</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
              Review updates clearly, then open preferences only when you need them.
            </p>
          </div>

          <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.02] shadow-2xl backdrop-blur-xl">
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">Preferences</div>
                  <div className="mt-1.5 text-[13px] font-sans font-semibold tracking-tight text-white">
                    Notification preferences
                  </div>
                  <p className="mt-1 text-[11px] font-sans leading-5 text-white/44">
                    Configuration active across {activePreferenceCount} notification lanes. Opens in a side panel so the update log stays readable.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="rounded-full border border-white/8 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/45">
                    {unreadCount} unread
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/38" />
                </div>
              </button>
            </SheetTrigger>
          </div>

          {/* Notification Log */}
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl flex min-h-[72vh] lg:min-h-[calc(100vh-220px)] flex-col mb-12">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                  History
                </h2>
                <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mt-0.5">
                  Your update log
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading || notifications.length === 0 || notifications.every(n => n.read)}
                  className="px-3 py-1.5 text-[10px] font-sans font-bold text-white/40 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:text-white rounded-lg transition-all disabled:opacity-20 uppercase tracking-tight">
                  Mark read
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/20 transition-all text-white/40 hover:text-white disabled:opacity-20">
                  <span className="px-2 text-[10px] font-sans font-bold uppercase tracking-tight">{loading ? 'Loading' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Fixed Search and Filters Row */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 group/search">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/search:text-white transition-colors" />
                  <Input
                    placeholder="Search updates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-10 text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 focus:border-white/20 rounded-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex gap-2">
                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-10 w-[130px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-white/20 rounded-lg uppercase tracking-tight">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                      <SelectItem value="all" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">All Types</SelectItem>
                      <SelectItem value="financial" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Financial</SelectItem>
                      <SelectItem value="document" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Documents</SelectItem>
                      <SelectItem value="system" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">System</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-10 w-[120px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-white/20 rounded-lg uppercase tracking-tight">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                      <SelectItem value="all" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">All Time</SelectItem>
                      <SelectItem value="today" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Today</SelectItem>
                      <SelectItem value="week" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Week</SelectItem>
                      <SelectItem value="month" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Month</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-[110px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-white/20 rounded-lg uppercase tracking-tight">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                      <SelectItem value="all" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">All</SelectItem>
                      <SelectItem value="unread" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Unread</SelectItem>
                      <SelectItem value="read" className="text-[11px] font-sans font-bold text-white/60 focus:bg-white/5 focus:text-white uppercase tracking-tight">Read</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Clear Filters */}
                  {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="px-4 h-10 text-[10px] font-sans font-bold text-white/40 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:text-white rounded-lg transition-all uppercase tracking-tight">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Summary */}
              {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight mt-4">
                  Showing {filteredNotifications.length} of {notifications.length} matches
                </p>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loading && (
                <div className="text-center py-20">
                  <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Loading updates...</p>
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-20">
                  <p className="text-[11px] font-sans font-bold text-rose-500 mb-6 uppercase tracking-tight">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-6 py-2.5 text-[10px] font-sans font-bold text-white/40 border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:text-white rounded-lg transition-all uppercase tracking-tight">
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && filteredNotifications.length === 0 && notifications.length > 0 && (
                <div className="text-center py-20">
                  <p className="text-[11px] font-sans font-bold text-white/20 mb-4 uppercase tracking-tight">No matching results found.</p>
                  <button onClick={clearFilters} className="text-[10px] font-sans font-bold text-white/60 hover:text-white uppercase tracking-tight">
                    Reset filters
                  </button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[11px] font-sans font-bold text-white/20 mb-2 uppercase tracking-tight">Update log empty.</p>
                  <p className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-tight">Notifications will appear here as events occur.</p>
                </div>
              )}

              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border rounded-2xl transition-all cursor-pointer group/item ${!notification.read
                        ? 'bg-white/[0.04] border-white/15'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
                        }`}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1.5 leading-relaxed tracking-tight">
                          {renderNotificationMessage(notification.message)}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/20">
                          <span>{notification.timestamp}</span>
                          <div className="flex gap-2">
                            {notification.channels.map((channel) => (
                              <span key={channel} className="px-2 py-0.5 border border-white/5 text-white/40 bg-white/[0.03] rounded-sm">{channel}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-white/70 rounded-full flex-shrink-0 mt-2.5"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Analysis Footer */}
          <div className="mt-12 text-center border-t border-white/5 pt-8 mb-12">
            <p className="text-[10px] text-gray-600 font-sans font-bold uppercase tracking-tight">
              Communication Registry • Status: Active
            </p>
          </div>
        </div>

        <SheetContent
          side="right"
          className="w-full border-l border-white/10 bg-[#0c0c0c] p-0 text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:max-w-[46vw]"
        >
          <SheetHeader className="border-b border-white/5 bg-white/[0.02] px-8 py-6 text-left">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/34">Settings</div>
            <SheetTitle className="mt-2 text-2xl font-light tracking-tight text-white">
              Notification preferences
            </SheetTitle>
            <p className="max-w-md text-[12px] font-sans leading-5 text-white/48">
              Manage email and in-app delivery without shrinking the update log.
            </p>
          </SheetHeader>

          <div className="h-full overflow-y-auto px-8 py-8">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/34">Configuration active</div>
              <div className="mt-2 text-sm font-sans font-semibold tracking-tight text-white">
                {activePreferenceCount} of {preferences.length} notification lanes enabled
              </div>
              <p className="mt-1 text-[11px] font-sans leading-5 text-white/46">
                Preference changes save back to backend truth as you toggle them.
              </p>
            </div>

            {preferencesError && (
              <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-4">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-rose-300">
                  Saved preferences are unavailable right now. Toggles are locked until the page reloads from backend truth.
                </p>
              </div>
            )}

            <div className="space-y-10 pb-10">
              {categories.map((category) => {
                const categoryPrefs = preferences.filter(pref => pref.category === category);

                return (
                  <div key={category} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-sans font-bold text-white/38 uppercase tracking-tight">
                        {category}
                      </h3>
                      <p className="text-[11px] font-sans leading-5 text-white/42">
                        {CATEGORY_DESCRIPTIONS[category] || 'Notification routing and delivery preferences.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {categoryPrefs.map((pref) => {
                        return (
                          <div key={pref.id} className="rounded-2xl border border-white/6 bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.035]">
                            <div className="flex items-start justify-between gap-5">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[13px] font-sans font-semibold tracking-tight text-white">
                                  {pref.title}
                                </h4>
                                <p className="mt-1 text-[11px] font-sans leading-5 text-white/42">
                                  {pref.description}
                                </p>
                                {!pref.supported && (
                                  <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-amber-300/80">
                                    {pref.supportNote}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-8">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={pref.email}
                                  disabled={!preferencesLoaded || !!preferencesError || !pref.supported}
                                  onCheckedChange={(checked) =>
                                    updatePreference(pref.id, 'email', checked)
                                  }
                                  className="scale-90 data-[state=checked]:bg-white"
                                />
                                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Email</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={pref.inApp}
                                  disabled={!preferencesLoaded || !!preferencesError || !pref.supported}
                                  onCheckedChange={(checked) =>
                                    updatePreference(pref.id, 'inApp', checked)
                                  }
                                  className="scale-90 data-[state=checked]:bg-white"
                                />
                                <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">In-App</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
