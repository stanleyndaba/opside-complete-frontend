import { api } from '@/lib/api';

export const gmailApi = {
  // Initiate Gmail OAuth connection
  connectGmail: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for connectGmail");
    const res = await api.connectIntegration('gmail', tenantSlug);
    if (!res.ok) throw new Error(res.error || 'Failed to connect Gmail');
    return res.data as { auth_url: string };
  },

  // Handle OAuth callback
  handleCallback: async (code: string, state: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for handleCallback");
    const res = await api.get(`/api/v1/integrations/gmail/callback?code=${code}&state=${state}&tenantSlug=${tenantSlug}`);
    return res.ok;
  },

  // Get Gmail connection status
  getStatus: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getStatus");
    const res = await api.get(`/api/v1/integrations/gmail/status?tenantSlug=${tenantSlug}`);
    return res.data as { connected: boolean; email?: string };
  },

  // Search Gmail for evidence
  searchEmails: async (query: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for searchEmails");
    const res = await api.post(`/api/v1/integrations/gmail/search?tenantSlug=${tenantSlug}`, { query });
    if (!res.ok) throw new Error(res.error || 'Failed to search emails');
    return res.data as { emails: any[] };
  }
};
