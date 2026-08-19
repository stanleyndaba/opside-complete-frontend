import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useStatusStream } from '@/hooks/use-status-stream';
import { usePhase3Notifications } from '@/hooks/use-phase3-notifications';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  payload?: any;
  system_signal_id?: string | null;
  signal_event_type?: string | null;
  signal_severity?: 'critical' | 'action_required' | 'informational' | null;
  signal_sensitivity?: 'operational_private' | 'financial_sensitive' | 'security_sensitive' | null;
  signal_action_type?: string | null;
  signal_action_route?: Record<string, unknown> | null;
  signal_state?: 'open' | 'resolved' | 'expired' | 'superseded' | 'cancelled' | null;
  seller_state?: 'unseen' | 'seen' | 'read' | 'acknowledged' | null;
  action_state?: 'none' | 'pending' | 'completed' | 'no_longer_needed' | 'expired' | null;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  acknowledgeSignal: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthReady, authToken, isSessionValid, userId } = useSession();

  const { tenant, isReady: isTenantReady } = useTenant();
  const location = useLocation();
  const routeSlugMatch = location.pathname.match(/^\/app\/([^/]+)/);
  const activeSlug = routeSlugMatch?.[1] || tenant?.slug || '';
  const notificationScope = `${userId || 'anonymous'}:${activeSlug || 'no-workspace'}:${authToken || 'no-token'}`;
  const latestScopeRef = useRef(notificationScope);

  // Initialize SSE streams
  const streamSlug = isTenantReady && isAuthReady && isSessionValid && authToken && userId ? activeSlug : '';
  const { close: closeStatusStream } = useStatusStream(undefined, streamSlug);
  const { close: closePhase3Notifications, lastEvent } = usePhase3Notifications(undefined, streamSlug);

  useEffect(() => {
    latestScopeRef.current = notificationScope;
    setNotifications([]);
    setIsLoading(Boolean(activeSlug && isTenantReady && isAuthReady && authToken && isSessionValid && userId));
  }, [activeSlug, authToken, isAuthReady, isSessionValid, isTenantReady, notificationScope, userId]);

  const fetchNotifications = useCallback(async () => {
    const requestScope = latestScopeRef.current;
    if (!activeSlug || !isTenantReady || !isAuthReady || !authToken || !isSessionValid || !userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.getNotifications({ limit: 50 }, activeSlug);
      if (latestScopeRef.current !== requestScope) return;
      if (response.ok && response.data) {
        const responseData = response.data as any;
        const items = responseData.data || responseData.notifications || [];
        if (Array.isArray(items)) {
          setNotifications(items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (latestScopeRef.current === requestScope) {
        setNotifications([]);
      }
    } finally {
      if (latestScopeRef.current === requestScope) {
        setIsLoading(false);
      }
    }
  }, [activeSlug, authToken, isAuthReady, isSessionValid, isTenantReady, userId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle real-time updates from SSE
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'notification') {
      fetchNotifications();
    }
  }, [fetchNotifications, lastEvent]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      closeStatusStream();
      closePhase3Notifications();
    };
  }, [closeStatusStream, closePhase3Notifications]);

  const markAsRead = async (id: string) => {
    if (!activeSlug || !userId) return;
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, status: 'read' as const } : n
      ));

      await (api as any).markNotificationRead(id, activeSlug);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error (optional, but good practice)
      fetchNotifications();
    }
  };

  const acknowledgeSignal = async (id: string) => {
    if (!activeSlug || !userId) return;
    try {
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, seller_state: 'acknowledged' as const } : n
      ));
      await (api as any).acknowledgeSystemSignal(id, activeSlug);
    } catch (error) {
      console.error('Failed to acknowledge System Signal:', error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!activeSlug || !userId) return;
    try {
      const unreadIds = notifications
        .filter(n => n.status !== 'read')
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));

      // Use the new markAllNotificationsRead endpoint
      await api.markAllNotificationsRead(activeSlug);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      acknowledgeSignal,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default NotificationsProvider;
