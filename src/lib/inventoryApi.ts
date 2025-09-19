export const startSync = async (): Promise<{ syncId: string }> => {
  const res = await fetch('/api/v1/integrations/sync/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to start sync');
  return res.json();
};

export const getSyncStatus = async (syncId: string) => {
  const res = await fetch(`/api/v1/integrations/sync/status/${syncId}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch sync status');
  return res.json();
};

export const cancelSync = async (syncId: string) => {
  const res = await fetch(`/api/v1/integrations/sync/cancel/${syncId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to cancel sync');
  return res.json();
};

export const getSyncHistory = async () => {
  const res = await fetch('/api/v1/integrations/sync/history', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch sync history');
  return res.json();
};
