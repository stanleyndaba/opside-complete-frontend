import type { ApiResponse } from '@/lib/api';

// Configuration for the Refund Engine backend
let inMemoryAuthToken: string | null = null;

export function setRefundEngineAuthToken(token: string | null): void {
  inMemoryAuthToken = token;
}

export function getRefundEngineBaseUrl(): string {
  const fromVite =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_REFUND_ENGINE_URL) ||
    (typeof process !== 'undefined' && (process as any).env?.VITE_REFUND_ENGINE_URL);
  const baseUrl = String(fromVite || '').trim();
  if (baseUrl) return baseUrl.replace(/\/$/, '');
  return '';
}

function getRefundEngineAuthToken(): string | null {
  const fromVite =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_REFUND_ENGINE_TOKEN) ||
    (typeof process !== 'undefined' && (process as any).env?.VITE_REFUND_ENGINE_TOKEN);
  return inMemoryAuthToken ?? (fromVite ? String(fromVite) : null);
}

function buildRefundEngineUrl(path: string, query?: Record<string, unknown>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getRefundEngineBaseUrl();
  const url = new URL(base ? base + normalizedPath : normalizedPath, base || window.location.origin);
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const entry of value) url.searchParams.append(key, String(entry));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function requestJson<T>(path: string, init?: RequestInit, query?: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const url = buildRefundEngineUrl(path, query);
    const token = getRefundEngineAuthToken();
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
      ...init,
    });

    const text = await response.text();
    let data: any = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      return { ok: false, status: response.status, error: (data && (data.error || data.message)) || response.statusText || 'Request failed' };
    }

    return { ok: true, status: response.status, data };
  } catch (error: any) {
    return { ok: false, status: 0, error: error?.message || 'Network error' };
  }
}

export const refundEngineApi = {
  // Base
  health: () => requestJson('/health', { method: 'GET' }),
  apiHealth: () => requestJson('/api/health', { method: 'GET' }),
  root: () => requestJson('/', { method: 'GET' }),

  // Claims
  createClaim: (body: any) => requestJson('/api/v1/claims', { method: 'POST', body: JSON.stringify(body) }),
  listClaims: (params?: {
    status?: string;
    product_category?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => requestJson('/api/v1/claims', { method: 'GET' }, params),
  getClaimStats: () => requestJson('/api/v1/claims/stats', { method: 'GET' }),
  searchClaims: (params: { q: string; limit?: number }) => requestJson('/api/v1/claims/search', { method: 'GET' }, params),
  getClaimById: (id: string) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, { method: 'GET' }),
  getClaimByCaseNumber: (caseNumber: string) => requestJson(`/api/v1/claims/case/${encodeURIComponent(caseNumber)}`, { method: 'GET' }),
  updateClaim: (id: string, body: any) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClaim: (id: string) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  flagInvoiceAnomalies: (body: { case_number: string; claim_amount: number; invoice_text: string; actor_id: string }) => requestJson('/api/v1/claims/flag', { method: 'POST', body: JSON.stringify(body) }),
  flagAndScore: (body: { case_number: string; claim_amount: number; invoice_text: string; actor_id: string }) => requestJson('/api/v1/claims/flag+score', { method: 'POST', body: JSON.stringify(body) }),
  getProofBundle: (id: string) => requestJson(`/api/v1/proofs/${encodeURIComponent(id)}`, { method: 'GET' }),

  // Claim Risk (mounted under /api/v1/claims)
  scoreClaim: (body: any) => requestJson('/api/v1/claims/score', { method: 'POST', body: JSON.stringify(body) }),
  batchScore: (body: { claims: any[] }) => requestJson('/api/v1/claims/batch-score', { method: 'POST', body: JSON.stringify(body) }),
  trainModels: (body: { n_samples: number }) => requestJson('/api/v1/claims/train-models', { method: 'POST', body: JSON.stringify(body) }),
  getModelInfo: () => requestJson('/api/v1/claims/model-info', { method: 'GET' }),
  checkEnvironment: () => requestJson('/api/v1/claims/check-environment', { method: 'GET' }),
  getSampleClaim: () => requestJson('/api/v1/claims/sample', { method: 'GET' }),

  // Discrepancies
  listDiscrepancies: (params?: {
    threshold?: number;
    min_confidence?: number;
    product_category?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }) => requestJson('/api/v1/discrepancies', { method: 'GET' }, params),
  getDiscrepancyStats: () => requestJson('/api/v1/discrepancies/stats', { method: 'GET' }),
  getDiscrepancyTrends: (params: { period: '7d' | '30d' | '90d' }) => requestJson('/api/v1/discrepancies/trends', { method: 'GET' }, params),
  getMlHealth: () => requestJson('/api/v1/discrepancies/ml-health', { method: 'GET' }),
  batchPredict: (body: { case_ids: string[] }) => requestJson('/api/v1/discrepancies/batch-predict', { method: 'POST', body: JSON.stringify(body) }),
  getCaseAnalysis: (caseId: string) => requestJson(`/api/v1/discrepancies/case/${encodeURIComponent(caseId)}`, { method: 'GET' }),

  // Ledger
  listLedger: (params?: {
    status?: string;
    entry_type?: string;
    date_from?: string;
    date_to?: string;
    case_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => requestJson('/api/v1/ledger', { method: 'GET' }, params),
  getLedgerStats: (params?: { date_from?: string; date_to?: string }) => requestJson('/api/v1/ledger/stats', { method: 'GET' }, params),
  getLedgerWithCases: (params?: {
    status?: string;
    entry_type?: string;
    date_from?: string;
    date_to?: string;
    case_id?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => requestJson('/api/v1/ledger/with-cases', { method: 'GET' }, params),
  searchLedger: (params: { q: string; limit?: number }) => requestJson('/api/v1/ledger/search', { method: 'GET' }, params),
  createLedgerEntry: (body: { case_id: string; entry_type: string; amount: number; description?: string; status?: 'pending' | 'completed' | 'failed' }) => requestJson('/api/v1/ledger', { method: 'POST', body: JSON.stringify(body) }),
  getLedgerEntry: (id: string) => requestJson(`/api/v1/ledger/${encodeURIComponent(id)}`, { method: 'GET' }),
  updateLedgerEntryStatus: (id: string, body: { status: 'pending' | 'completed' | 'failed' }) => requestJson(`/api/v1/ledger/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  getLedgerEntriesForCase: (caseId: string) => requestJson(`/api/v1/ledger/case/${encodeURIComponent(caseId)}`, { method: 'GET' }),

  // Amazon Submissions (feature-gated on backend)
  getAmazonSubmissionsHealth: () => requestJson('/api/v1/amazon-submissions/health', { method: 'GET' }),
  getAmazonSubmissionMetrics: () => requestJson('/api/v1/amazon-submissions/metrics', { method: 'GET' }),
  getAmazonSubmissionsInProgress: () => requestJson('/api/v1/amazon-submissions/in-progress', { method: 'GET' }),
};
