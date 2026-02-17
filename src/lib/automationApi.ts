import { api } from '@/lib/api';

async function json<T>(path: string, tenantSlug?: string, init?: RequestInit): Promise<T> {
  if (!tenantSlug) throw new Error("tenantSlug required for automation request");
  const fullPath = path.includes('?') ? `${path}&tenantSlug=${tenantSlug}` : `${path}?tenantSlug=${tenantSlug}`;
  const res = await fetch(api.buildApiUrl(fullPath), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error((await res.text()) || 'Request failed');
  return res.json() as Promise<T>;
}

export const automationApi = {
  // Automation Rules
  createRule: (body: any, tenantSlug?: string) => json('/api/automation-rules', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  listRules: (tenantSlug?: string) => json('/api/automation-rules', tenantSlug),

  // Thresholds
  getThresholds: (tenantSlug?: string) => json('/api/thresholds', tenantSlug),
  setThresholds: (body: any, tenantSlug?: string) => json('/api/thresholds', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),

  // Whitelist
  getWhitelist: (tenantSlug?: string) => json('/api/whitelist', tenantSlug),
  updateWhitelist: (body: any, tenantSlug?: string) => json('/api/whitelist', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
};

