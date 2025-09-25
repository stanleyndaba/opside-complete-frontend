import { buildApiUrl } from '@/lib/api';

export const startSync = async (): Promise<{ syncId: string }> => {
  const res = await fetch(buildApiUrl('/api/v1/integrations/sync/start'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to start sync');
  return res.json();
};

export const getSyncStatus = async (syncId: string) => {
  const res = await fetch(buildApiUrl(`/api/v1/integrations/sync/status/${syncId}`), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
};

export const cancelSync = async (syncId: string) => {
  const res = await fetch(buildApiUrl(`/api/v1/integrations/sync/cancel/${syncId}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to cancel sync');
  return res.json();
};

export const getSyncHistory = async () => {
  const res = await fetch(buildApiUrl('/api/v1/integrations/sync/history'), {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch sync history');
  return res.json();
};

export function subscribeSyncProgress(syncId: string, onUpdate: (data: any) => void) {
  const url = buildApiUrl(`/api/sse/sync-progress/${syncId}`);
  const eventSource = new EventSource(url);
  eventSource.onmessage = (e) => {
    try { onUpdate(JSON.parse(e.data)); } catch { /* noop */ }
  };
  return () => eventSource.close();
}
