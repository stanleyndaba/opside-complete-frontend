import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useStatusStream } from '@/hooks/use-status-stream';
import { usePhase3Notifications } from '@/hooks/use-phase3-notifications';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
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
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthReady, authToken } = useSession();

  const { tenant } = useTenant();
  const location = useLocation();
  const routeSlugMatch = location.pathname.match(/^\/app\/([^/]+)/);
  const activeSlug = tenant?.slug || routeSlugMatch?.[1] || '';

  // Initialize SSE streams
  const { close: closeStatusStream } = useStatusStream(undefined, activeSlug);
  const { close: closePhase3Notifications, lastEvent } = usePhase3Notifications(undefined, activeSlug);

  const fetchNotifications = useCallback(async () => {
    if (!activeSlug || !isAuthReady || !authToken) return;
    try {
      const response = await api.getNotifications({ limit: 50 }, activeSlug);
      if (response.ok && response.data) {
        const responseData = response.data as any;
        const items = responseData.data || responseData.notifications || [];
        if (Array.isArray(items)) {
          setNotifications(items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSlug, authToken, isAuthReady]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle real-time updates from SSE
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'notification') {
      const newNotification = lastEvent.data;
      // Add to list if not already present
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
    }
  }, [lastEvent]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      closeStatusStream();
      closePhase3Notifications();
    };
  }, [closeStatusStream, closePhase3Notifications]);

  const markAsRead = async (id: string) => {
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

  const markAllAsRead = async () => {
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
