import { api } from './api';

// Individual exports for Sync.tsx
export const startSync = async (): Promise<{ syncId: string }> => {
  const response = await api.post('/api/sync/start');
  if (!response.ok) {
    throw new Error(response.error || 'Failed to start sync');
  }
  return response.data;
};

export const getSyncStatus = async (syncId: string): Promise<{ status: string; progress?: number }> => {
  const response = await api.get(`/api/sync/status/${syncId}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to get sync status');
  }
  return response.data;
};

export const cancelSync = async (syncId: string): Promise<void> => {
  const response = await api.post(`/api/sync/cancel/${syncId}`);
  if (!response.ok) {
    throw new Error(response.error || 'Failed to cancel sync');
  }
};

export const getSyncHistory = async () => {
  const response = await api.get('/api/sync/history');
  if (!response.ok) {
    throw new Error(response.error || 'Failed to fetch sync history');
  }
  return response.data;
};

export const subscribeSyncProgress = (syncId: string, onUpdate: (data: any) => void) => {
  const url = api.buildApiUrl(`/api/sse/sync-progress/${syncId}`);
  const eventSource = new EventSource(url, { withCredentials: true } as any);
  eventSource.onmessage = (e) => {
    try { onUpdate(JSON.parse(e.data)); } catch { /* noop */ }
  };
  return () => eventSource.close();
};

// Also export as object for convenience
export const inventoryApi = {
  startSync,
  getSyncStatus,
  cancelSync,
  getSyncHistory,
  subscribeSyncProgress
};
