import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Loader2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  icon: React.ElementType;
  message: string;
  timestamp: string;
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
  if (typeLower.includes('payout') || typeLower.includes('payment')) return DollarSign;
  if (typeLower.includes('recovery') || typeLower.includes('claim')) return CheckCircle;
  if (typeLower.includes('document') || typeLower.includes('invoice') || typeLower.includes('file')) return FileCheck;
  if (typeLower.includes('team') || typeLower.includes('user')) return Users;
  if (typeLower.includes('security') || typeLower.includes('login')) return Shield;
  if (typeLower.includes('performance') || typeLower.includes('summary')) return TrendingUp;
  if (typeLower.includes('update') || typeLower.includes('feature')) return Sparkles;
  return FileText; // Default icon
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

export default function NotificationHub() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load notifications from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getNotifications({ limit: 100 });
        if (!cancelled) {
          // Support multiple response formats: {notifications: []}, {data: []}, or direct array
          const notifData = response.ok
            ? (response.data?.notifications || response.data?.data || response.data || [])
            : [];

          if (response.ok && Array.isArray(notifData)) {
            // Map API response to frontend format
            const mappedNotifications: Notification[] = notifData.map((notif: any) => {
              const icon = getNotificationIcon(notif.type || '');
              const timestamp = formatTimestamp(notif.created_at || new Date().toISOString());

              // Determine channels based on notification data
              // Default to In-App, add Email if email_sent is true
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
                channels,
                read: notif.read || notif.is_read || notif.status === 'read' || false
              };
            });
            setNotifications(mappedNotifications);
            setError(null);
          } else {
            setNotifications([]);
            // Only show error if the response was not OK
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

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await api.markNotificationRead(notificationId);
      if (response.ok) {
        // Update local state
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

  // Refresh notifications
  const handleRefresh = () => {
    setLoading(true);
    api.getNotifications({ limit: 100 }).then(response => {
      // Support multiple response formats: {notifications: []}, {data: []}, or direct array
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
          // Merge backend preferences with default state
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
    // Update local state immediately for responsive UI
    setPreferences(prev => prev.map(pref =>
      pref.id === id ? { ...pref, [channel]: value } : pref
    ));

    // Build preferences object to save
    const prefsToSave: Record<string, { email: boolean; inApp: boolean }> = {};
    preferences.forEach(pref => {
      if (pref.id === id) {
        prefsToSave[pref.id] = { ...{ email: pref.email, inApp: pref.inApp }, [channel]: value };
      } else {
        prefsToSave[pref.id] = { email: pref.email, inApp: pref.inApp };
      }
    });

    // Save to backend
    try {
      const response = await api.saveNotificationPreferences(prefsToSave);
      if (response.ok) {
        toast({ title: 'Preferences saved' });
      }
    } catch (err) {
      console.warn('Failed to save notification preferences:', err);
      // Preferences are already saved locally, so no need to revert
    }
  };

  const categories = [
    'Financial Milestones',
    'Account & Security',
    'Platform & Performance'
  ];

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge key={channel} variant="secondary" className="text-xs">
        {channel}
      </Badge>
    ));
  };

  return (
    <PageLayout title="Notification Hub & Preferences">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-700">
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-700 space-y-8">
            {/* Notification Log */}
            <Card className="p-6 bg-white border-gray-200 text-gray-700 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Notification Log
                  </h2>
                  <p className="text-sm text-gray-600">
                    Complete history of all notifications sent to you. Nothing hidden.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>

              {loading && (
                <div className="text-center py-8 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Loading notifications...</p>
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">{error}</p>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p className="mb-2">No notifications found.</p>
                  <p className="text-sm">Notifications will appear here as events occur.</p>
                </div>
              )}

              {!loading && !error && notifications.length > 0 && (
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${!notification.read
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{notification.timestamp}</span>
                            <div className="flex gap-1">
                              {notification.channels.map((channel) => (
                                <Badge key={channel} variant="outline" className="text-[10px] border-gray-300 text-gray-700 bg-gray-50">{channel}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {!notification.read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Notification Preferences */}
            <Card className="p-6 bg-white border-gray-200 text-gray-700 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-600">
                  Complete control over how and when you hear from us. Respect for your attention.
                </p>
              </div>

              <div className="space-y-8">
                {categories.map((category) => {
                  const categoryPrefs = preferences.filter(pref => pref.category === category);

                  return (
                    <div key={category}>
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {category}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {category === 'Financial Milestones' && 'High-signal, essential updates about your money'}
                          {category === 'Account & Security' && 'Important account and security notifications'}
                          {category === 'Platform & Performance' && 'Updates about platform features and performance'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        {categoryPrefs.map((pref) => {
                          const IconComponent = pref.icon;
                          return (
                            <div key={pref.id} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50 border-gray-200">
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <IconComponent className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                  {pref.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-3">
                                  {pref.description}
                                </p>

                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={pref.email}
                                      onCheckedChange={(checked) =>
                                        updatePreference(pref.id, 'email', checked)
                                      }
                                    />
                                    <span className="text-xs text-gray-600">Email</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={pref.inApp}
                                      onCheckedChange={(checked) =>
                                        updatePreference(pref.id, 'inApp', checked)
                                      }
                                    />
                                    <span className="text-xs text-gray-600">In-App</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {category !== 'Platform & Performance' && (
                        <Separator className="mt-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}