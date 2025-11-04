export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function buildApiUrl(path: string): string {
  // Normalize provided path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If caller passed an absolute URL, return as-is
  if (/^https?:\/\//i.test(path)) return path;

  // Prefer explicit base URL when provided via env (but ignore VITE_REFUND_ENGINE_URL for main API)
  const envBase = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
    || (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL);
  
  if (envBase) {
    return String(envBase).replace(/\/$/, '') + normalizedPath;
  }

  // Production backend URL - use the new consolidated Node.js API
  const productionBackend = 'https://opside-node-api.onrender.com';
  
  // In development, you can override with localhost
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (isDev && (import.meta as any).env?.VITE_API_BASE_URL) {
    const devBase = (import.meta as any).env?.VITE_API_BASE_URL;
    return String(devBase).replace(/\/$/, '') + normalizedPath;
  }

  // Use production backend for all deployed environments
  // Ensure we always return the full URL
  return productionBackend + normalizedPath;
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const url = buildApiUrl(path);
    console.log(`[API] Requesting: ${url}`);
    
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    console.log(`[API] Response status: ${res.status} for ${url}`);

    let data;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || res.statusText || 'Request failed';
      console.error(`[API] Error for ${url}: ${errorMsg}`);
      return {
        ok: false,
        status: res.status,
        error: errorMsg,
      };
    }

    console.log(`[API] Success for ${url}:`, data);
    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (error) {
    // Provide detailed error information
    const url = buildApiUrl(path);
    const errorMsg = error instanceof Error ? error.message : 'Network error';
    const details = `Cannot connect to backend at ${url}. The backend may be down, sleeping, or blocked by CORS.`;
    
    console.error(`[API] Request failed for ${path}:`, {
      error: errorMsg,
      url,
      details
    });
    
    return {
      ok: false,
      status: 0,
      error: details,
    };
  }
}

export const api = {
  // Export buildApiUrl for use in other modules
  buildApiUrl,
  
  // Generic helpers
  get: <T = any>(path: string) => requestJson<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: unknown) => requestJson<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),

  // Auth endpoints
  getMe: () => requestJson<any>('/api/auth/me'),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  postLoginStripe: () => requestJson<any>('/api/auth/post-login/stripe', { method: 'POST' }),

  // Amazon SP-API endpoints (Step 1 Auth Process)
  connectAmazon: () => requestJson<{ auth_url: string; authUrl?: string; state: string }>('/api/v1/integrations/amazon/auth/start'),
  completeAmazonSandboxAuth: (state: string) => requestJson<{ ok: boolean; connected: boolean }>('/api/v1/integrations/amazon/sandbox/callback', { method: 'POST', body: JSON.stringify({ state }) }),
  getAmazonRecoveries: () => requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries'),

  // Auth-adjacent helpers for flows
  connectDocs: (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') =>
    requestJson<{ auth_url?: string; redirect_url?: string }>(
      `/api/v1/integrations/connect-docs?provider=${encodeURIComponent(provider)}`,
      { method: 'GET' }
    ),
  startAmazonSync: () => requestJson<{ syncId: string }>('/api/sync/start', { method: 'POST' }),
  trackEvent: (name: string, payload?: Record<string, any>) =>
    requestJson<any>('/api/metrics/track', { method: 'POST', body: JSON.stringify({ name, payload }) }),

  getDashboardAggregates: (window?: '7d' | '30d' | '90d') => requestJson<any>(
    `/api/metrics/dashboard${window ? `?window=${encodeURIComponent(window)}` : ''}`
  ),
  getRecoveriesMetrics: () => requestJson<any>('/api/metrics/recoveries'),
  setAutoClaimEnabled: (enabled: boolean) => requestJson<any>('/api/recoveries/auto-claim', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // Refund Engine endpoints
  submitClaim: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
  resubmitClaim: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/resubmit`, { method: 'POST' }),
  getRecoveryStatus: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/status`),
  getRecoveryDetail: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}`),
  getRecoveryDocumentUrl: (id: string) => buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/document`),
  getDocumentViewUrl: (docId: string) => buildApiUrl(`/api/documents/${encodeURIComponent(docId)}/view`),

  // Evidence/documents
  getDocuments: () => requestJson<any[]>('/api/documents'),
  getDocument: (id: string) => requestJson<any>(`/api/documents/${encodeURIComponent(id)}`),
  getDocumentDownloadUrl: (id: string) => buildApiUrl(`/api/documents/${encodeURIComponent(id)}/download`),

  // Integrations & Evidence ingestion controls
  getIntegrationsStatus: () => requestJson<{
    amazon_connected: boolean;
    docs_connected: boolean;
    lastSync?: string;
    lastIngest?: string;
    providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }>;
  }>('/api/v1/integrations/status'),
  setEvidenceAutoCollect: (enabled: boolean) => requestJson<any>('/api/evidence/auto-collect', { method: 'POST', body: JSON.stringify({ enabled }) }),
  setEvidenceSchedule: (schedule: string) => requestJson<any>('/api/evidence/schedule', { method: 'POST', body: JSON.stringify({ schedule }) }),
  setEvidenceFilters: (filters: { includeSenders?: string[]; excludeSenders?: string[]; fileTypes?: string[]; folders?: string[] }) => requestJson<any>('/api/evidence/filters', { method: 'POST', body: JSON.stringify(filters) }),
  startEvidenceIngest: () => requestJson<any>('/api/evidence/sync', { method: 'POST' }),
  disconnectIntegration: (provider: string, purge = false) =>
    requestJson<any>(
      `/api/v1/integrations/disconnect?provider=${encodeURIComponent(provider)}&purge=${purge ? 1 : 0}`,
      { method: 'POST' }
    ),
  getEvidenceSummary: () => requestJson<any>('/api/evidence/summary'),

  // Inventory/Sync summary endpoints (non-id based)
  getSyncStatus: () => requestJson<any>('/api/sync/status'),
  getSyncActivity: () => requestJson<any>('/api/sync/activity'),
};
