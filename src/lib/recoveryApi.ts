import { buildApiUrl } from '@/lib/api';

export const recoveryApi = {
  // Recoveries
  getRecoveries: async () => {
    const res = await fetch(buildApiUrl('/api/recoveries'), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load recoveries');
    return res.json();
  },
  getRecovery: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load recovery');
    return res.json();
  },
  getRecoveryStatus: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/status`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load recovery status');
    return res.json();
  },
  submitRecoveryAnswer: async (id: string, data: any) => {
    const res = await fetch(buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/answer`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
  },
  uploadRecoveryDocuments: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/documents/upload`), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload documents');
    return res.json();
  },
  getRecoveryDocument: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/document`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.blob();
  },

  // Claims
  submitClaim: async (id: string, data?: any) => {
    const res = await fetch(buildApiUrl(`/api/claims/${encodeURIComponent(id)}/submit`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error('Failed to submit claim');
    return res.json();
  },

  // Documents
  getDocuments: async () => {
    const res = await fetch(buildApiUrl('/api/documents'), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },
  getDocument: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/documents/${encodeURIComponent(id)}`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load document');
    return res.json();
  },
  viewDocument: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/documents/${encodeURIComponent(id)}/view`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to view document');
    return res.blob();
  },
  downloadDocument: async (id: string) => {
    const res = await fetch(buildApiUrl(`/api/documents/${encodeURIComponent(id)}/download`), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to download document');
    return res.blob();
  },
};

