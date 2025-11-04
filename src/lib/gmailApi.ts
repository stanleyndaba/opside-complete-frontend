import { api } from '@/lib/api';

export const gmailApi = {
  // Initiate Gmail OAuth connection
  connectGmail: async () => {
    const res = await api.connectIntegration('gmail');
    if (!res.ok) throw new Error(res.error || 'Failed to connect Gmail');
    return res.data as { authUrl: string };
  },

  // Handle OAuth callback
  handleCallback: async (code: string, state: string) => {
    const res = await api.get(`/api/v1/integrations/gmail/callback?code=${code}&state=${state}`);
    return res.ok;
  },

  // Get Gmail connection status
  getStatus: async () => {
    const res = await api.get('/api/v1/integrations/gmail/status');
    return res.data as { connected: boolean; email?: string };
  },

  // Search Gmail for evidence
  searchEmails: async (query: string) => {
    const res = await api.post('/api/v1/integrations/gmail/search', { query });
    if (!res.ok) throw new Error(res.error || 'Failed to search emails');
    return res.data as { emails: any[] };
  }
};
