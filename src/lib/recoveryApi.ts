import { api } from './api';

export const recoveryApi = {
  getRecoveries: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getRecoveries");
    const slug = tenantSlug;
    let recoveries: any[] = [];

    // 1. Try new upcoming-payments endpoint first (gets real data from dispute_cases)
    try {
      const upcomingResponse = await api.get(`/api/v1/integrations/amazon/upcoming-payments?tenantSlug=${slug}`);
      if (upcomingResponse.ok && upcomingResponse.data?.recoveries) {
        recoveries = upcomingResponse.data.recoveries;
      }
    } catch (e) {
      console.warn('Upcoming payments endpoint failed:', e);
    }

    return recoveries;
  },

  getRecoveryMetrics: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getRecoveryMetrics");
    const response = await api.get(`/api/metrics/recoveries?tenantSlug=${tenantSlug}`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery metrics');
    }
    return response.data;
  },

  submitClaim: async (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for submitClaim");
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/submit?tenantSlug=${tenantSlug}`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit claim');
    }
    return response.data;
  },

  resubmitClaim: async (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for resubmitClaim");
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/resubmit?tenantSlug=${tenantSlug}`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to resubmit claim');
    }
    return response.data;
  },

  getRecoveryStatus: async (recoveryId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getRecoveryStatus");
    const response = await api.get(`/api/recoveries/${encodeURIComponent(recoveryId)}/status?tenantSlug=${tenantSlug}`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery status');
    }
    return response.data;
  },

  submitRecoveryAnswer: async (id: string, body: { answer: string }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for submitRecoveryAnswer");
    const response = await api.post(`/api/recoveries/${encodeURIComponent(id)}/answer?tenantSlug=${tenantSlug}`, body);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit answer');
    }
    return response.data;
  },

  uploadRecoveryDocuments: async (id: string, files: File[], tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for uploadRecoveryDocuments");
    // This helper uses fetch directly because multipart is easier without the JSON helper
    const form = new FormData();
    for (const f of files) form.append('files', f);
    const res = await fetch(api.buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/documents/upload?tenantSlug=${tenantSlug}`), {
      method: 'POST',
      credentials: 'include',
      body: form as any,
    } as any);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
