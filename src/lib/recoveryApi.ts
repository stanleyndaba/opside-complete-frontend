import { api } from './api';

export const recoveryApi = {
  getRecoveries: async () => {
    // Try new upcoming-payments endpoint first (gets real data from dispute_cases)
    try {
      const upcomingResponse = await api.get('/api/v1/integrations/amazon/upcoming-payments');
      if (upcomingResponse.ok && upcomingResponse.data?.recoveries) {
        return upcomingResponse.data.recoveries;
      }
    } catch (e) {
      console.warn('Upcoming payments endpoint failed, falling back to recoveries:', e);
    }
    
    // Fallback to old endpoint
    const response = await api.get('/api/recoveries');
    if (!response.ok) {
      const err: any = new Error(response.error || 'Failed to fetch recoveries');
      err.status = response.status;
      throw err;
    }
    // Handle both old format (direct array) and new format (with recoveries array)
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.recoveries) {
      return response.data.recoveries;
    }
    return [];
  },

  getRecoveryMetrics: async () => {
    const response = await api.get('/api/metrics/recoveries');
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery metrics');
    }
    return response.data;
  },

  submitClaim: async (id: string) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/submit`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit claim');
    }
    return response.data;
  },

  resubmitClaim: async (id: string) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/resubmit`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to resubmit claim');
    }
    return response.data;
  },

  getRecoveryStatus: async (recoveryId: string) => {
    const response = await api.get(`/api/recoveries/${encodeURIComponent(recoveryId)}/status`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery status');
    }
    return response.data;
  },

  submitRecoveryAnswer: async (id: string, body: { answer: string }) => {
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/answer`, body);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit answer');
    }
    return response.data;
  },

  uploadRecoveryDocuments: async (id: string, files: File[]) => {
    // This helper uses fetch directly because multipart is easier without the JSON helper
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await fetch(api.buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/documents/upload`), {
      method: 'POST',
      credentials: 'include',
      body: form as any,
    } as any);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
