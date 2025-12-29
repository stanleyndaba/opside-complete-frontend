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
  X
} from 'lucide-react';
import { api } from '@/lib/api';
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
      return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function NotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        const response = await api.getNotifications({ limit: 100 });
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
      const response = await api.markNotificationRead(notificationId);
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
      const response = await api.markAllNotificationsRead();
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
    api.getNotifications({ limit: 100 }).then(response => {
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
    <PageLayout title="Notifications">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-10 space-y-6">
            {/* Page Header */}
            <header>
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">
                Notifications
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">
                Hub & Preferences
              </p>
            </header>

            {/* Notification Log */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                    Notification Log
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Complete history of all notifications sent to you.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    disabled={loading || notifications.length === 0 || notifications.every(n => n.read)}
                    className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filters Row */}
              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex gap-2">
                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-8 w-[120px] text-xs bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Types</SelectItem>
                        <SelectItem value="financial" className="text-xs">Financial</SelectItem>
                        <SelectItem value="document" className="text-xs">Documents</SelectItem>
                        <SelectItem value="system" className="text-xs">System</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Filter */}
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-8 w-[100px] text-xs bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Time</SelectItem>
                        <SelectItem value="today" className="text-xs">Today</SelectItem>
                        <SelectItem value="week" className="text-xs">This Week</SelectItem>
                        <SelectItem value="month" className="text-xs">This Month</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-[100px] text-xs bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All</SelectItem>
                        <SelectItem value="unread" className="text-xs">Unread</SelectItem>
                        <SelectItem value="read" className="text-xs">Read</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        onClick={clearFilters}
                        className="px-2 h-8 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Summary */}
                {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    Showing {filteredNotifications.length} of {notifications.length} notifications
                  </p>
                )}
              </div>

              <div className="p-4">
                {loading && (
                  <div className="text-center py-6 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading notifications...</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-600 mb-2">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!loading && !error && filteredNotifications.length === 0 && notifications.length > 0 && (
                  <div className="text-center py-6 text-gray-600">
                    <p className="text-xs mb-1">No notifications match your filters.</p>
                    <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:text-blue-700">
                      Clear filters
                    </button>
                  </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                  <div className="text-center py-6 text-gray-600">
                    <p className="text-xs mb-1">No notifications found.</p>
                    <p className="text-[10px] text-gray-500">Notifications will appear here as events occur.</p>
                  </div>
                )}

                {!loading && !error && filteredNotifications.length > 0 && (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 border transition-colors cursor-pointer ${!notification.read
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                            }`}
                          onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                        >
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-gray-100 flex items-center justify-center">
                              <IconComponent className="w-3 h-3 text-gray-600" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 mb-0.5">
                              {renderNotificationMessage(notification.message)}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <span>{notification.timestamp}</span>
                              <div className="flex gap-1">
                                {notification.channels.map((channel) => (
                                  <span key={channel} className="px-1 py-0 text-[9px] border border-gray-200 text-gray-600 bg-gray-50">{channel}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {!notification.read && (
                            <div className="w-2 h-2 bg-gray-900 flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                  Notification Preferences
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Control how and when you hear from us.
                </p>
              </div>

              <div className="p-4 space-y-6">
                {categories.map((category, catIdx) => {
                  const categoryPrefs = preferences.filter(pref => pref.category === category);

                  return (
                    <div key={category}>
                      <div className="mb-3">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.1em] mb-0.5">
                          {category}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {category === 'Financial Milestones' && 'High-signal, essential updates about your money'}
                          {category === 'Account & Security' && 'Important account and security notifications'}
                          {category === 'Platform & Performance' && 'Updates about platform features and performance'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {categoryPrefs.map((pref) => {
                          const IconComponent = pref.icon;
                          return (
                            <div key={pref.id} className="flex items-start gap-3 p-3 border border-gray-100 bg-gray-50">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-gray-200 flex items-center justify-center">
                                  <IconComponent className="w-3 h-3 text-gray-600" />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium text-gray-900 mb-0.5">
                                  {pref.title}
                                </h4>
                                <p className="text-[10px] text-gray-500 mb-2">
                                  {pref.description}
                                </p>

                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={pref.email}
                                      onCheckedChange={(checked) =>
                                        updatePreference(pref.id, 'email', checked)
                                      }
                                      className="scale-90"
                                    />
                                    <span className="text-[10px] text-gray-600">Email</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={pref.inApp}
                                      onCheckedChange={(checked) =>
                                        updatePreference(pref.id, 'inApp', checked)
                                      }
                                      className="scale-90"
                                    />
                                    <span className="text-[10px] text-gray-600">In-App</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {catIdx < categories.length - 1 && (
                        <div className="border-t border-gray-200 mt-6"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}