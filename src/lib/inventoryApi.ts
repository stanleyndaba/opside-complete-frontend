import { api } from './api';

// Type definitions matching the documented API responses
// Note: 'complete' is included for legacy backend compatibility
export type SyncStatus = 'idle' | 'running' | 'completed' | 'complete' | 'failed' | 'cancelled';

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
export const startSync = async (): Promise<{ syncId: string; status: string; message: string }> => {
  const response = await api.post('/api/sync/start');
  if (!response.ok) {
    throw new Error(response.error || 'Failed to start sync');
  }
  return response.data;
};

// Get active sync status (without syncId) - GET /api/sync/status
export const getActiveSyncStatus = async (): Promise<ActiveSyncStatusResponse> => {
  const response = await api.get<ActiveSyncStatusResponse>('/api/sync/status');
  if (!response.ok) {
    throw new Error(response.error || 'Failed to get active sync status');
  }
  return response.data || { hasActiveSync: false, lastSync: null };
};

// Get sync status by ID - GET /api/sync/status/:syncId
export const getSyncStatus = async (syncId: string): Promise<SyncStatusResponse> => {
  const response = await api.get<SyncStatusResponse>(`/api/sync/status/${syncId}`);
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
export const cancelSync = async (syncId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(`/api/sync/cancel/${syncId}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to cancel sync');
  }
  return response.data || { success: true, message: 'Sync cancelled successfully' };
};

// Get sync history - GET /api/sync/history
export const getSyncHistory = async (limit = 20, offset = 0): Promise<SyncHistoryResponse> => {
  const response = await api.get<any>(`/api/sync/history?limit=${limit}&offset=${offset}`);
  
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
export const getSyncStatistics = async (): Promise<SyncStatisticsResponse> => {
  const response = await api.get<SyncStatisticsResponse>('/api/v1/integrations/sync/statistics');
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch sync statistics');
  }
  return response.data;
};

// Subscribe to SSE sync progress - GET /api/sse/sync-progress/:syncId
export const subscribeSyncProgress = (syncId: string, onUpdate: (data: any) => void) => {
  const url = api.buildApiUrl(`/api/sse/sync-progress/${syncId}`);
  const eventSource = new EventSource(url, { withCredentials: true } as any);
  
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onUpdate(data);
      
      // Close connection if sync is complete or failed
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        eventSource.close();
      }
    } catch (err) {
      console.error('Error parsing SSE message:', err);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };
  
  return () => {
    eventSource.close();
  };
};

// Also export as object for convenience
export const inventoryApi = {
  startSync,
  getActiveSyncStatus,
  getSyncStatus,
  cancelSync,
  getSyncHistory,
  getSyncStatistics,
  subscribeSyncProgress
};
