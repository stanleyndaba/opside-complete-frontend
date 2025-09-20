import { buildApiUrl } from '@/lib/api';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error((await res.text()) || 'Request failed');
  return res.json() as Promise<T>;
}


export const automationApi = {
  // Automation Rules
  createRule: async (body: any) => json('/api/automation-rules', { method: 'POST', body: JSON.stringify(body) }),
  listRules: async () => json('/api/automation-rules'),

  // Thresholds
  getThresholds: async () => json('/api/thresholds'),
  setThresholds: async (body: any) => json('/api/thresholds', { method: 'POST', body: JSON.stringify(body) }),

  // Whitelist
  getWhitelist: async () => json('/api/whitelist'),
  updateWhitelist: async (body: any) => json('/api/whitelist', { method: 'POST', body: JSON.stringify(body) }),
};

