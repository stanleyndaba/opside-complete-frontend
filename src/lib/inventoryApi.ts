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
  error?: string | null;
}

export interface ActiveSyncStatusResponse {
  hasActiveSync: boolean;
  lastSync: SyncStatusResponse | null;
}

export interface SyncHistoryResponse {
  success: boolean;
  history: Array<{
    syncId: string;
    status: SyncStatus;
    startedAt: string;
    completedAt?: string | null;
    ordersProcessed?: number;
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
    throw new Error(response.error || 'Failed to get sync status');
  }
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
  const response = await api.get<SyncHistoryResponse>(`/api/sync/history?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch sync history');
  }
  // Handle both old format (syncs array) and new format (history array)
  if (response.data && 'syncs' in response.data && Array.isArray((response.data as any).syncs)) {
    // Convert old format to new format
    return {
      success: true,
      history: (response.data as any).syncs,
      total: (response.data as any).syncs.length
    };
  }
  return response.data || { success: true, history: [], total: 0 };
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
