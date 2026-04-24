import type { ApiResponse } from '@/lib/api';
import { getGentleRequestErrorMessage, isLikelyCorsTransportError } from '@/lib/requestMessaging';

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

async function requestJson<T>(path: string, tenantSlug?: string, init?: RequestInit, query?: Record<string, unknown>): Promise<ApiResponse<T>> {
  if (!tenantSlug) throw new Error("tenantSlug required for refund engine request");
  try {
    const fullQuery = { ...query, tenantSlug };
    const url = buildRefundEngineUrl(path, fullQuery);
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
      const backendError = (data && (data.error || data.message)) || response.statusText || 'Request failed';
      const userError = response.status >= 500
        ? getGentleRequestErrorMessage('server', init?.method)
        : backendError;
      return { ok: false, status: response.status, error: userError };
    }

    return { ok: true, status: response.status, data };
  } catch (error: any) {
    const url = buildRefundEngineUrl(path, { ...query, tenantSlug });
    const errorMessage = error?.message || 'Network error';
    const isCorsError = isLikelyCorsTransportError(errorMessage, url);
    const isTimeoutError = error?.name === 'AbortError' || String(errorMessage).toLowerCase().includes('timeout');
    const userError = getGentleRequestErrorMessage(
      isCorsError ? 'cors' : isTimeoutError ? 'timeout' : 'network',
      init?.method
    );

    console.error('[refundEngineApi] Request failed', {
      path,
      url,
      error: errorMessage,
      userError,
    });

    return { ok: false, status: 0, error: userError };
  }
}

export const refundEngineApi = {
  // Base
  health: (tenantSlug?: string) => requestJson('/health', tenantSlug, { method: 'GET' }),
  apiHealth: (tenantSlug?: string) => requestJson('/api/health', tenantSlug, { method: 'GET' }),
  root: (tenantSlug?: string) => requestJson('/', tenantSlug, { method: 'GET' }),

  // Claims
  createClaim: (body: any, tenantSlug?: string) => requestJson('/api/v1/claims', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  listClaims: (params?: {
    status?: string;
    product_category?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }, tenantSlug?: string) => requestJson('/api/v1/claims', tenantSlug, { method: 'GET' }, params),
  getClaimStats: (tenantSlug?: string) => requestJson('/api/v1/claims/stats', tenantSlug, { method: 'GET' }),
  searchClaims: (params: { q: string; limit?: number }, tenantSlug?: string) => requestJson('/api/v1/claims/search', tenantSlug, { method: 'GET' }, params),
  getClaimById: (id: string, tenantSlug?: string) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, tenantSlug, { method: 'GET' }),
  getClaimByCaseNumber: (caseNumber: string, tenantSlug?: string) => requestJson(`/api/v1/claims/case/${encodeURIComponent(caseNumber)}`, tenantSlug, { method: 'GET' }),
  updateClaim: (id: string, body: any, tenantSlug?: string) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, tenantSlug, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClaim: (id: string, tenantSlug?: string) => requestJson(`/api/v1/claims/${encodeURIComponent(id)}`, tenantSlug, { method: 'DELETE' }),
  flagInvoiceAnomalies: (body: { case_number: string; claim_amount: number; invoice_text: string; actor_id: string }, tenantSlug?: string) => requestJson('/api/v1/claims/flag', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  flagAndScore: (body: { case_number: string; claim_amount: number; invoice_text: string; actor_id: string }, tenantSlug?: string) => requestJson('/api/v1/claims/flag+score', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  getProofBundle: (id: string, tenantSlug?: string) => requestJson(`/api/v1/proofs/${encodeURIComponent(id)}`, tenantSlug, { method: 'GET' }),

  // Claim Risk (mounted under /api/v1/claims)
  scoreClaim: (body: any, tenantSlug?: string) => requestJson('/api/v1/claims/score', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  batchScore: (body: { claims: any[] }, tenantSlug?: string) => requestJson('/api/v1/claims/batch-score', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  trainModels: (body: { n_samples: number }, tenantSlug?: string) => requestJson('/api/v1/claims/train-models', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  getModelInfo: (tenantSlug?: string) => requestJson('/api/v1/claims/model-info', tenantSlug, { method: 'GET' }),
  checkEnvironment: (tenantSlug?: string) => requestJson('/api/v1/claims/check-environment', tenantSlug, { method: 'GET' }),
  getSampleClaim: (tenantSlug?: string) => requestJson('/api/v1/claims/sample', tenantSlug, { method: 'GET' }),

  // Discrepancies
  listDiscrepancies: (params?: {
    threshold?: number;
    min_confidence?: number;
    product_category?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }, tenantSlug?: string) => requestJson('/api/v1/discrepancies', tenantSlug, { method: 'GET' }, params),
  getDiscrepancyStats: (tenantSlug?: string) => requestJson('/api/v1/discrepancies/stats', tenantSlug, { method: 'GET' }),
  getDiscrepancyTrends: (params: { period: '7d' | '30d' | '90d' }, tenantSlug?: string) => requestJson('/api/v1/discrepancies/trends', tenantSlug, { method: 'GET' }, params),
  getMlHealth: (tenantSlug?: string) => requestJson('/api/v1/discrepancies/ml-health', tenantSlug, { method: 'GET' }),
  batchPredict: (body: { case_ids: string[] }, tenantSlug?: string) => requestJson('/api/v1/discrepancies/batch-predict', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  getCaseAnalysis: (caseId: string, tenantSlug?: string) => requestJson(`/api/v1/discrepancies/case/${encodeURIComponent(caseId)}`, tenantSlug, { method: 'GET' }),

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
  }, tenantSlug?: string) => requestJson('/api/v1/ledger', tenantSlug, { method: 'GET' }, params),
  getLedgerStats: (params?: { date_from?: string; date_to?: string }, tenantSlug?: string) => requestJson('/api/v1/ledger/stats', tenantSlug, { method: 'GET' }, params),
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
  }, tenantSlug?: string) => requestJson('/api/v1/ledger/with-cases', tenantSlug, { method: 'GET' }, params),
  searchLedger: (params: { q: string; limit?: number }, tenantSlug?: string) => requestJson('/api/v1/ledger/search', tenantSlug, { method: 'GET' }, params),
  createLedgerEntry: (body: { case_id: string; entry_type: string; amount: number; description?: string; status?: 'pending' | 'completed' | 'failed' }, tenantSlug?: string) => requestJson('/api/v1/ledger', tenantSlug, { method: 'POST', body: JSON.stringify(body) }),
  getLedgerEntry: (id: string, tenantSlug?: string) => requestJson(`/api/v1/ledger/${encodeURIComponent(id)}`, tenantSlug, { method: 'GET' }),
  updateLedgerEntryStatus: (id: string, body: { status: 'pending' | 'completed' | 'failed' }, tenantSlug?: string) => requestJson(`/api/v1/ledger/${encodeURIComponent(id)}/status`, tenantSlug, { method: 'PUT', body: JSON.stringify(body) }),
  getLedgerEntriesForCase: (caseId: string, tenantSlug?: string) => requestJson(`/api/v1/ledger/case/${encodeURIComponent(caseId)}`, tenantSlug, { method: 'GET' }),

  // Amazon Submissions (feature-gated on backend)
  getAmazonSubmissionsHealth: (tenantSlug?: string) => requestJson('/api/v1/amazon-submissions/health', tenantSlug, { method: 'GET' }),
  getAmazonSubmissionMetrics: (tenantSlug?: string) => requestJson('/api/v1/amazon-submissions/metrics', tenantSlug, { method: 'GET' }),
  getAmazonSubmissionsInProgress: (tenantSlug?: string) => requestJson('/api/v1/amazon-submissions/in-progress', tenantSlug, { method: 'GET' }),
};
