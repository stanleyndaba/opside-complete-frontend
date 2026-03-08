import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  CheckCircle,
  FileText,
  Users,
  FileCheck,
  Shield,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCheck,
  Search,
  X,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isAfter, subDays, subHours } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  icon: React.ElementType;
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
  icon: React.ElementType;
  email: boolean;
  inApp: boolean;
}

// Map notification type to icon component
const getNotificationIcon = (type: string): React.ElementType => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('payout') || typeLower.includes('payment') || typeLower.includes('funds')) return DollarSign;
  if (typeLower.includes('recovery') || typeLower.includes('claim')) return CheckCircle;
  if (typeLower.includes('document') || typeLower.includes('invoice') || typeLower.includes('file')) return FileCheck;
  if (typeLower.includes('team') || typeLower.includes('user')) return Users;
  if (typeLower.includes('security') || typeLower.includes('login')) return Shield;
  if (typeLower.includes('performance') || typeLower.includes('summary')) return TrendingUp;
  if (typeLower.includes('update') || typeLower.includes('feature')) return Sparkles;
  return FileText;
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
  const { toast } = useToast();

  const { tenant } = useTenant();
  const activeSlug = tenant?.slug || 'beta';

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load notifications from API
  useEffect(() => {
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
              const icon = getNotificationIcon(notif.type || '');
              const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());
              const channels: string[] = ['In-App'];
              if (notif.email_sent || notif.sent_via_email) {
                channels.push('Email');
              }
              return {
                id: notif.id,
                type: notif.type || 'general',
                icon,
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
  }, []);

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
          const icon = getNotificationIcon(notif.type || '');
          const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());
          const channels: string[] = ['In-App'];
          if (notif.email_sent || notif.sent_via_email) {
            channels.push('Email');
          }
          return {
            id: notif.id,
            type: notif.type || 'general',
            icon,
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

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'recovery-guaranteed',
      title: 'New Recovery is Guaranteed',
      description: 'When our system files a claim and guarantees its value',
      category: 'Financial Milestones',
      icon: CheckCircle,
      email: true,
      inApp: true
    },
    {
      id: 'payout-confirmed',
      title: 'Payout is Confirmed',
      description: 'When Amazon confirms funds have been disbursed',
      category: 'Financial Milestones',
      icon: DollarSign,
      email: true,
      inApp: true
    },
    {
      id: 'invoice-issued',
      title: 'New Invoice is Issued',
      description: 'When we bill for our performance fee',
      category: 'Financial Milestones',
      icon: FileText,
      email: true,
      inApp: true
    },
    {
      id: 'team-member-joins',
      title: 'New Team Member Joins',
      description: 'When an invited user accepts their invitation',
      category: 'Account & Security',
      icon: Users,
      email: true,
      inApp: true
    },
    {
      id: 'document-processed',
      title: 'Document Successfully Processed',
      description: 'Confirmation that uploaded invoice has been verified',
      category: 'Account & Security',
      icon: FileCheck,
      email: false,
      inApp: true
    },
    {
      id: 'device-login',
      title: 'New Device Logs In',
      description: 'Critical security alert for account access',
      category: 'Account & Security',
      icon: Shield,
      email: true,
      inApp: true
    },
    {
      id: 'monthly-summary',
      title: 'Monthly Performance Summary',
      description: 'Curated digest of total value delivered',
      category: 'Platform & Performance',
      icon: TrendingUp,
      email: true,
      inApp: false
    },
    {
      id: 'product-updates',
      title: 'Product News & Updates',
      description: 'Alerts about new features and improvements',
      category: 'Platform & Performance',
      icon: Sparkles,
      email: false,
      inApp: true
    }
  ]);

  // Load preferences from backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.getNotificationPreferences();
        if (!cancelled && response.ok && response.data) {
          setPreferences(prev => prev.map(pref => {
            const saved = response.data[pref.id];
            if (saved) {
              return {
                ...pref,
                email: saved.email ?? pref.email,
                inApp: saved.inApp ?? pref.inApp
              };
            }
            return pref;
          }));
        }
      } catch (err) {
        console.warn('Failed to load notification preferences:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updatePreference = async (id: string, channel: 'email' | 'inApp', value: boolean) => {
    setPreferences(prev => prev.map(pref =>
      pref.id === id ? { ...pref, [channel]: value } : pref
    ));

    const prefsToSave: Record<string, { email: boolean; inApp: boolean }> = {};
    preferences.forEach(pref => {
      if (pref.id === id) {
        prefsToSave[pref.id] = { ...{ email: pref.email, inApp: pref.inApp }, [channel]: value };
      } else {
        prefsToSave[pref.id] = { email: pref.email, inApp: pref.inApp };
      }
    });

    try {
      const response = await api.saveNotificationPreferences(prefsToSave);
      if (response.ok) {
        toast({ title: 'Preferences saved' });
      } else {
        toast({ title: 'Failed to save', description: response.error || 'Please try again', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Failed to save', description: 'Network error - preferences saved locally only', variant: 'destructive' });
    }
  };

  const categories = [
    'Financial Milestones',
    'Account & Security',
    'Platform & Performance'
  ];

  return (
    <PageLayout title="Notifications" midnight>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-[1600px] mx-auto px-8 py-12">
          {/* Analysis Header */}
          <div className="flex flex-col gap-1 mb-12 border-b border-white/5 pb-10">
            <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-4xl font-light text-white tracking-tight font-sans">Notifications <span className="text-white/40">and settings</span></h1>
            </div>
            <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
              Updates and communication preferences.
            </p>
          </div>

          {/* Notification Log */}
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col mb-12" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-3 w-3 text-emerald-500/50" />
                <div>
                  <h2 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                    History
                  </h2>
                  <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mt-0.5">
                    Your update log
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading || notifications.length === 0 || notifications.every(n => n.read)}
                  className="px-3 py-1.5 text-[10px] font-sans font-bold text-white/40 border border-white/5 bg-white/[0.02] hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-20 uppercase tracking-tight">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark read
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg hover:border-emerald-500/30 transition-all text-white/40 hover:text-emerald-500 disabled:opacity-20">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
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
                    className="pl-10 pr-10 h-10 text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white placeholder:text-white/10 focus:border-emerald-500/30 rounded-lg"
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
                    <SelectTrigger className="h-10 w-[130px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-emerald-500/30 rounded-lg uppercase tracking-tight">
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
                    <SelectTrigger className="h-10 w-[120px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-emerald-500/30 rounded-lg uppercase tracking-tight">
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
                    <SelectTrigger className="h-10 w-[110px] text-[11px] font-sans font-bold bg-white/[0.03] border-white/10 text-white focus:border-emerald-500/30 rounded-lg uppercase tracking-tight">
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
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-500" />
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
                  <button onClick={clearFilters} className="text-[10px] font-sans font-bold text-emerald-500 hover:underline uppercase tracking-tight">
                    Reset filters
                  </button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[11px] font-sans font-bold text-white/20 mb-2 uppercase tracking-tight">Update log empty.</p>
                  <p className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-tight italic">Notifications will appear here as events occur.</p>
                </div>
              )}

              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const IconComponent = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border rounded-2xl transition-all cursor-pointer group/item ${!notification.read
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
                        }`}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}>
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${!notification.read ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-white/40 group-hover/item:text-white'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1.5 leading-relaxed tracking-tight">
                          {renderNotificationMessage(notification.message)}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/20">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {notification.timestamp}
                          </span>
                          <div className="flex gap-2">
                            {notification.channels.map((channel) => (
                              <span key={channel} className="px-2 py-0.5 border border-white/5 text-white/40 bg-white/[0.03] rounded-sm">{channel}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {!notification.read && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="h-3 w-3 text-emerald-500/50" />
                <h2 className="text-[11px] font-sans font-bold text-white/40 uppercase tracking-tight">
                  Settings
                </h2>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm font-sans font-medium text-white tracking-tight uppercase">Preferences</span>
                <div className="h-1.5 w-[1px] bg-white/10" />
                <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-tight">Configuration Active</span>
              </div>
            </div>

            <div className="p-8 space-y-12">
              {categories.map((category, catIdx) => {
                const categoryPrefs = preferences.filter(pref => pref.category === category);

                return (
                  <div key={category} className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-sans font-bold text-emerald-500/60 uppercase tracking-tight">
                        {category}
                      </h3>
                      <p className="text-xs text-white/40 italic font-sans font-bold uppercase tracking-tight">
                        {category === 'Financial Milestones' && '// High-signal, essential updates about your money'}
                        {category === 'Account & Security' && '// Important account and security notifications'}
                        {category === 'Platform & Performance' && '// Updates about platform features and performance'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {categoryPrefs.map((pref) => {
                        const IconComponent = pref.icon;
                        return (
                          <div key={pref.id} className="flex items-start gap-5 p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl group/pref">
                            <div className="flex-shrink-0 mt-1">
                              <div className="w-10 h-10 bg-white/5 flex items-center justify-center rounded-xl group-hover/pref:bg-emerald-500/10 transition-colors">
                                <IconComponent className="w-5 h-5 text-white/40 group-hover/pref:text-emerald-500 transition-colors" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white mb-1 uppercase tracking-tight font-sans">
                                {pref.title}
                              </h4>
                              <p className="text-[11px] font-sans font-bold text-white/20 uppercase tracking-tight mb-4 leading-relaxed">
                                {pref.description}
                              </p>

                              <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={pref.email}
                                    onCheckedChange={(checked) =>
                                      updatePreference(pref.id, 'email', checked)
                                    }
                                    className="scale-90 data-[state=checked]:bg-emerald-500"
                                  />
                                  <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Email</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={pref.inApp}
                                    onCheckedChange={(checked) =>
                                      updatePreference(pref.id, 'inApp', checked)
                                    }
                                    className="scale-90 data-[state=checked]:bg-emerald-500"
                                  />
                                  <span className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">In-App</span>
                                </div>
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

          {/* Analysis Footer */}
          <div className="mt-12 text-center border-t border-white/5 pt-8 mb-12">
            <p className="text-[10px] text-gray-600 font-sans font-bold uppercase tracking-tight">
              Communication Registry • Status: Active
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
