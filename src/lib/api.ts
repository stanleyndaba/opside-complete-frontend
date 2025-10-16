export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export function buildApiUrl(path: string): string {
  const envBase = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
                  (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL);
  const base = (envBase && String(envBase)) || 'http://localhost:3001';
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(buildApiUrl(path), {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

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
      return {
        ok: false,
        status: res.status,
        error: data?.error || data?.message || res.statusText || 'Request failed',
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export const api = {
  // Generic helpers
  get: <T = any>(path: string) => requestJson<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: unknown) => requestJson<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),

  connectAmazon: () => requestJson<{ auth_url?: string; redirect_url?: string }>(`/auth/amazon/start`, { method: 'GET' }),
  completeAmazonSandboxAuth: (state: string) => requestJson<any>('/api/v1/integrations/amazon/sandbox/callback', { 
    method: 'POST', 
    body: JSON.stringify({ state }) 
  }),

  getAmazonRecoveries: () => requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries'),

  getDashboardAggregates: () => requestJson<any>('/api/metrics/dashboard'),
  getRecoveriesMetrics: () => requestJson<any>('/api/metrics/recoveries'),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

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
  getIntegrationsStatus: () => requestJson<any>('/api/integrations/status'),
  setEvidenceAutoCollect: (enabled: boolean) => requestJson<any>('/api/evidence/auto-collect', { method: 'POST', body: JSON.stringify({ enabled }) }),
  setEvidenceSchedule: (schedule: string) => requestJson<any>('/api/evidence/schedule', { method: 'POST', body: JSON.stringify({ schedule }) }),
  setEvidenceFilters: (filters: { includeSenders?: string[]; excludeSenders?: string[]; fileTypes?: string[]; folders?: string[] }) => requestJson<any>('/api/evidence/filters', { method: 'POST', body: JSON.stringify(filters) }),
  startEvidenceIngest: () => requestJson<any>('/api/evidence/sync', { method: 'POST' }),
  disconnectIntegration: (provider: string, purge = false) => requestJson<any>(`/api/integrations/${encodeURIComponent(provider)}/disconnect`, { method: 'POST', body: JSON.stringify({ purge }) }),
  getEvidenceSummary: () => requestJson<any>('/api/evidence/summary'),
};
