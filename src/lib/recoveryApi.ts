import { api } from './api';

export const recoveryApi = {
  getRecoveries: async () => {
    const response = await api.get('/api/recoveries');
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recoveries');
    }
    return response.data;
  },

  getRecoveryMetrics: async () => {
    const response = await api.get('/api/metrics/recoveries');
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery metrics');
    }
    return response.data;
  },

  submitRecovery: async (data: any) => {
    const response = await api.post('/api/recoveries/submit', data);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to submit recovery');
    }
    return response.data;
  },

  getRecoveryStatus: async (recoveryId: string) => {
    const response = await api.get(`/api/recoveries/status/${recoveryId}`);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to fetch recovery status');
    }
    return response.data;
  }
};
