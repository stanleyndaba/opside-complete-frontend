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
  createRule: (body: any) => json('/api/automation-rules', { method: 'POST', body: JSON.stringify(body) }),
  listRules: () => json('/api/automation-rules'),

  // Thresholds
  getThresholds: () => json('/api/thresholds'),
  setThresholds: (body: any) => json('/api/thresholds', { method: 'POST', body: JSON.stringify(body) }),

  // Whitelist
  getWhitelist: () => json('/api/whitelist'),
  updateWhitelist: (body: any) => json('/api/whitelist', { method: 'POST', body: JSON.stringify(body) }),
};

