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

// Lightweight localStorage-backed mocks that activate when backend endpoints are missing
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    if (!isBrowser()) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    if (!isBrowser()) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const automationApi = {
  // Automation Rules
  createRule: async (body: any) => {
    try {
      return await json('/api/automation-rules', { method: 'POST', body: JSON.stringify(body) });
    } catch (e: any) {
      // Fallback to local mock store
      const key = 'mock:automation_rules';
      const rules = readLocal<any[]>(key, []);
      const newRule = { id: `rule_${Date.now()}`, createdAt: new Date().toISOString(), ...body };
      const next = [newRule, ...rules];
      writeLocal(key, next);
      return newRule as any;
    }
  },
  listRules: async () => {
    try {
      return await json('/api/automation-rules');
    } catch (e: any) {
      return readLocal<any[]>('mock:automation_rules', []);
    }
  },

  // Thresholds
  getThresholds: async () => {
    try {
      return await json('/api/thresholds');
    } catch (e: any) {
      return readLocal<Record<string, any>>('mock:thresholds', { detectionSensitivity: 0.8, minClaimAmount: 25 });
    }
  },
  setThresholds: async (body: any) => {
    try {
      return await json('/api/thresholds', { method: 'POST', body: JSON.stringify(body) });
    } catch (e: any) {
      const current = (await automationApi.getThresholds()) as Record<string, any>;
      const updates = (body || {}) as Record<string, any>;
      const next = { ...current, ...updates };
      writeLocal('mock:thresholds', next);
      return next as any;
    }
  },

  // Whitelist
  getWhitelist: async () => {
    try {
      return await json('/api/whitelist');
    } catch (e: any) {
      return readLocal<any[]>('mock:whitelist', []);
    }
  },
  updateWhitelist: async (body: any) => {
    try {
      return await json('/api/whitelist', { method: 'POST', body: JSON.stringify(body) });
    } catch (e: any) {
      const list = Array.isArray(body) ? body : readLocal<any[]>('mock:whitelist', []);
      writeLocal('mock:whitelist', list);
      return list as any;
    }
  },
};

