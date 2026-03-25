import { api } from './api';
import { createAuthenticatedEventStream } from './authenticatedSSE';

// Type definitions matching the documented API responses
// Note: 'complete' is included for legacy backend compatibility
// 'detecting' is the phase where AI analyzes synced data for discrepancies
export type SyncStatus = 'idle' | 'running' | 'detecting' | 'completed' | 'complete' | 'failed' | 'cancelled';

export interface SyncStatusResponse {
  success?: boolean;
  syncId: string;
  status: SyncStatus;
  progress: number;
  message: string;
  startedAt: string;
  completedAt?: string | null;
  estimatedCompletion?: string;
  ordersProcessed?: number;
  totalOrders?: number;
  inventoryCount?: number;      // ⭐ NEW - Inventory items synced
  shipmentsCount?: number;       // ⭐ NEW - Shipments synced
  returnsCount?: number;         // ⭐ NEW - Returns synced
  settlementsCount?: number;     // ⭐ NEW - Settlements synced
  feesCount?: number;            // ⭐ NEW - Fees synced
  claimsDetected?: number;       // ⭐ NEW - Claims detected
  inventoryValue?: number;       // ⭐ NEW - Total value of inventory synced
  totalRecoverableValue?: number; // ⭐ NEW - Total $ value of potential recoveries
  error?: string | null;
}

export interface ActiveSyncStatusResponse {
  hasActiveSync: boolean;
  lastSync: {
    syncId: string;
    status: string;
    progress?: number;
    message?: string;
    startedAt?: string;
    completedAt?: string;
    ordersProcessed?: number;
    totalOrders?: number;
    inventoryCount?: number;
    shipmentsCount?: number;
    returnsCount?: number;
    settlementsCount?: number;
    feesCount?: number;
    claimsDetected?: number;
  } | null;
}

export interface SyncHistoryResponse {
  success: boolean;
  history: Array<{
    syncId: string;
    status: SyncStatus;
    startedAt: string;
    completedAt?: string | null;
    ordersProcessed?: number;
    totalOrders?: number;
    inventoryCount?: number;      // ⭐ NEW
    shipmentsCount?: number;       // ⭐ NEW
    returnsCount?: number;         // ⭐ NEW
    settlementsCount?: number;     // ⭐ NEW
    feesCount?: number;            // ⭐ NEW
    claimsDetected?: number;
    duration?: number;
    error?: string | null;
  }>;
  total: number;
}

export interface SyncStatisticsResponse {
  success: boolean;
  statistics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    cancelledSyncs: number;
    runningSyncs: number;
    totalOrdersProcessed: number;
    totalClaimsDetected: number;
  };
}

// Individual exports for Sync.tsx
export const startSync = async (tenantSlug?: string): Promise<{ syncId: string; status: string; message: string }> => {
  if (!tenantSlug) throw new Error("tenantSlug required for startSync");
  const slug = tenantSlug;
  const response = await api.post(`/api/sync/start?tenantSlug=${slug}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to start sync');
  }
  return response.data;
};

// Get active sync status (without syncId) - GET /api/sync/status
export const getActiveSyncStatus = async (tenantSlug?: string): Promise<ActiveSyncStatusResponse> => {
  if (!tenantSlug) throw new Error("tenantSlug required for getActiveSyncStatus");
  const slug = tenantSlug;
  const response = await api.get<ActiveSyncStatusResponse>(`/api/sync/status?tenantSlug=${slug}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to get active sync status');
  }
  return response.data || { hasActiveSync: false, lastSync: null };
};

// Get sync status by ID - GET /api/sync/status/:syncId
export const getSyncStatus = async (syncId: string, tenantSlug?: string): Promise<SyncStatusResponse> => {
  if (!tenantSlug) throw new Error("tenantSlug required for getSyncStatus");
  const slug = tenantSlug;
  const response = await api.get<SyncStatusResponse>(`/api/sync/status/${syncId}?tenantSlug=${slug}`);
  if (!response.ok) {
    // Check if it's a "not found" error
    if (response.status === 404 || response.error?.includes('not found') || response.error?.includes('Sync not found')) {
      throw new Error('Sync not found');
    }
    throw new Error(response.error || 'Failed to get sync status');
  }

  // Debug: Log the response
  console.log('[getSyncStatus] API Response:', {
    syncId: response.data?.syncId,
    status: response.data?.status,
    ordersProcessed: response.data?.ordersProcessed,
    totalOrders: response.data?.totalOrders,
    inventoryCount: response.data?.inventoryCount,
    shipmentsCount: response.data?.shipmentsCount,
    returnsCount: response.data?.returnsCount,
    settlementsCount: response.data?.settlementsCount,
    feesCount: response.data?.feesCount,
    claimsDetected: response.data?.claimsDetected
  });

  return response.data;
};

// Cancel sync - POST /api/sync/cancel/:syncId
export const cancelSync = async (syncId: string, tenantSlug?: string): Promise<{ success: boolean; message: string }> => {
  if (!tenantSlug) throw new Error("tenantSlug required for cancelSync");
  const slug = tenantSlug;
  const response = await api.post<{ success: boolean; message: string }>(`/api/sync/cancel/${syncId}?tenantSlug=${slug}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to cancel sync');
  }
  return response.data || { success: true, message: 'Sync cancelled successfully' };
};

// Force clear stuck syncs - POST /api/sync/force-clear
export const forceClearSync = async (tenantSlug?: string): Promise<{ success: boolean; message: string; clearedCount: number }> => {
  if (!tenantSlug) throw new Error("tenantSlug required for forceClearSync");
  const slug = tenantSlug;
  const response = await api.post<{ success: boolean; message: string; clearedCount: number }>(`/api/sync/force-clear?tenantSlug=${slug}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to clear stuck syncs');
  }
  return response.data || { success: true, message: 'Stuck syncs cleared', clearedCount: 0 };
};

// Get sync history - GET /api/sync/history
export const getSyncHistory = async (limit = 20, offset = 0, tenantSlug?: string): Promise<SyncHistoryResponse> => {
  if (!tenantSlug) throw new Error("tenantSlug required for getSyncHistory");
  const slug = tenantSlug;
  const response = await api.get<any>(`/api/sync/history?limit=${limit}&offset=${offset}&tenantSlug=${slug}`);

  // Debug logging
  console.log('[getSyncHistory] API Response:', response);
  console.log('[getSyncHistory] Response OK?', response.ok);
  console.log('[getSyncHistory] Response data:', response.data);
  console.log('[getSyncHistory] Response data type:', typeof response.data);
  console.log('[getSyncHistory] Is array?', Array.isArray(response.data));

  if (!response.ok) {
    console.error('[getSyncHistory] API Error:', response.error);
    throw new Error(response.error || 'Failed to fetch sync history');
  }

  // Handle both old format (syncs array) and new format (history array)
  // Also handle direct array response
  if (response.data) {
    // Check if response.data is directly an array
    if (Array.isArray(response.data)) {
      console.log('[getSyncHistory] Response is direct array, length:', response.data.length);
      return {
        success: true,
        history: response.data as any,
        total: response.data.length
      };
    }

    // Check for syncs array (legacy format)
    if ('syncs' in response.data && Array.isArray((response.data as any).syncs)) {
      console.log('[getSyncHistory] Using syncs array (legacy), length:', (response.data as any).syncs.length);
      return {
        success: true,
        history: (response.data as any).syncs,
        total: (response.data as any).syncs.length
      };
    }

    // Check for history array (new format)
    if ('history' in response.data && Array.isArray((response.data as any).history)) {
      console.log('[getSyncHistory] Using history array, length:', (response.data as any).history.length);
      return response.data as SyncHistoryResponse;
    }
  }

  console.warn('[getSyncHistory] No valid history found, returning empty');
  return { success: true, history: [], total: 0 };
};

// Get sync statistics - GET /api/v1/integrations/sync/statistics
export const getSyncStatistics = async (tenantSlug?: string): Promise<SyncStatisticsResponse> => {
  if (!tenantSlug) throw new Error("tenantSlug required for getSyncStatistics");
  const slug = tenantSlug;
  const response = await api.get<SyncStatisticsResponse>(`/api/v1/integrations/sync/statistics?tenantSlug=${slug}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch sync statistics');
  }
  return response.data;
};

// SSE Connection state type
export type SSEConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Subscribe to SSE sync progress - GET /api/sse/sync-progress/:syncId
// Returns an unsubscribe function
export const subscribeSyncProgress = (
  syncId: string,
  onUpdate: (data: any) => void,
  onConnectionChange?: (state: SSEConnectionState) => void,
  tenantSlug?: string
) => {
  if (!tenantSlug) throw new Error("tenantSlug required for subscribeSyncProgress");
  const slug = tenantSlug;
  const url = api.buildApiUrl(`/api/sse/sync-progress/${syncId}?tenantSlug=${slug}`);

  // Report connecting state
  onConnectionChange?.('connecting');

  const eventSource = createAuthenticatedEventStream(url);

  // Track if we've successfully connected
  let hasConnected = false;

  // Handle open event - SSE connected
  eventSource.onopen = () => {
    hasConnected = true;
    onConnectionChange?.('connected');
    console.log('[SSE] Connection established');
  };

  // Handle default 'message' events (sync status updates)
  eventSource.onmessage = (e) => {
    // If this is first message, connection is established
    if (!hasConnected) {
      hasConnected = true;
      onConnectionChange?.('connected');
    }

    try {
      const data = JSON.parse(e.data);
      onUpdate(data);

      // Keep the stream open after sync completion so downstream detection events can arrive.
      // Only terminal failures/cancellations should close immediately here.
      if (data.status === 'failed' || data.status === 'cancelled') {
        eventSource.close();
        onConnectionChange?.('disconnected');
      }
    } catch (err) {
      console.error('Error parsing SSE message:', err);
    }
  };

  // Handle custom 'sync.log' events from Agent 2
  eventSource.addEventListener('sync.log', (e: any) => {
    if (!hasConnected) {
      hasConnected = true;
      onConnectionChange?.('connected');
    }
    try {
      const data = JSON.parse(e.data);
      console.log('[SSE] Received sync.log event:', data);
      onUpdate(data);
    } catch (err) {
      console.error('Error parsing sync.log SSE event:', err);
    }
  });

  // Handle 'sync_progress' events from sseLogEmitter (Agents 2, 3, etc.)
  eventSource.addEventListener('sync_progress', (e: any) => {
    if (!hasConnected) {
      hasConnected = true;
      onConnectionChange?.('connected');
    }
    try {
      const data = JSON.parse(e.data);
      console.log('[SSE] Received sync_progress event:', data);
      onUpdate(data);
    } catch (err) {
      console.error('Error parsing sync_progress SSE event:', err);
    }
  });

  // Handle 'message' events (backward compatibility)
  eventSource.addEventListener('message', (e: any) => {
    if (!hasConnected) {
      hasConnected = true;
      onConnectionChange?.('connected');
    }
    try {
      const data = JSON.parse(e.data);
      console.log('[SSE] Received message event:', data);
      onUpdate(data);
    } catch (err) {
      console.error('Error parsing message SSE event:', err);
    }
  });

  // Handle connection errors
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    onConnectionChange?.('error');
    eventSource.close();
  };

  return () => {
    eventSource.close();
    onConnectionChange?.('disconnected');
  };
};

// Also export as object for convenience
export const inventoryApi = {
  startSync,
  getActiveSyncStatus,
  getSyncStatus,
  cancelSync,
  forceClearSync,
  getSyncHistory,
  getSyncStatistics,
  subscribeSyncProgress
};
