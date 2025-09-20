export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export const getApiBaseUrl = (): string => {
  const base = ((import.meta as any).env?.VITE_API_URL as string | undefined) || ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined);
  if (!base) {
    return '';
  }
  return base.replace(/\/$/, '');
};

export const buildApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  if (!base) return path; // relative for same-origin during local dev proxy
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export const API_URL = getApiBaseUrl();

async function requestJson<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(buildApiUrl(path), {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json() : undefined;
    if (!res.ok) {
      if (res.status === 401) {
        try {
          // Attempt to log out server-side to clear any session remnants, then redirect
          await fetch(buildApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
        } catch (_) {}
        // Redirect to home for re-auth
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
      return { ok: false, status: res.status, error: (payload as any)?.message || res.statusText };
    }
    return { ok: true, status: res.status, data: payload as T };
  } catch (error: any) {
    return { ok: false, status: 0, error: error?.message || 'Network error' };
  }
}

export async function getStatus() {
  const res = await fetch(buildApiUrl(`/api/services/status`), { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export const api = {
  // Auth / OAuth
  getAmazonOAuthStartUrl: (redirectPath: string = '/app'): string => {
    const startPath = ((import.meta as any).env?.VITE_OAUTH_START_PATH as string) || '/auth/amazon/start';
    const appOrigin = window.location.origin;
    const redirectUri = encodeURIComponent(`${appOrigin}${redirectPath}`);
    const url = new URL(buildApiUrl(startPath));
    url.searchParams.set('redirect_uri', redirectUri);
    return url.toString();
  },
  postLoginStripe: () => requestJson<{ onboarding_url?: string; manage_billing_url?: string }>(`/api/auth/post-login/stripe`),

  // Integrations / Sync
  startAmazonSync: () => requestJson<{ syncId: string }>(`/api/sync/start`, { method: 'POST' }),
  getSyncStatus: (syncId?: string) => requestJson<{ status: 'in_progress' | 'complete' | 'failed'; progress?: number; message?: string }>(`/api/sync/status${syncId ? `?id=${encodeURIComponent(syncId)}` : ''}`),
  getSyncActivity: () => requestJson<Array<{ timestamp: string; message: string; type: 'success' | 'warning' | 'info' }>>(`/api/sync/activity`),
  // Integrations Hub status & connect flows
  getIntegrationsStatus: () => requestJson<{ amazon_connected: boolean; docs_connected: boolean; providers?: Record<string, boolean> }>(`/api/v1/integrations/status`),
  connectAmazon: () => requestJson<{ redirect_url?: string }>(`/api/v1/integrations/connect-amazon`),
  connectDocs: (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => requestJson<{ redirect_url?: string }>(`/api/v1/integrations/connect-docs?provider=${encodeURIComponent(provider)}`),
  disconnectIntegration: (provider: 'amazon' | 'gmail' | 'outlook' | 'gdrive' | 'dropbox', purge: boolean = false) => requestJson<{ ok: boolean }>(`/api/v1/integrations/disconnect?provider=${encodeURIComponent(provider)}&purge=${purge ? '1' : '0'}`, { method: 'POST' }),

  // Detections / Dashboard
  getDetectionsSummary: () => requestJson<{ totalPotential: number; newCases: number; valueEstimated: number }>(`/api/metrics/dashboard`),

  // Recoveries
  getRecoveries: async () => {
    type RecoveryListItem = {
      id: string;
      created: string;
      type: string;
      details: string;
      status: string;
      guaranteedAmount: number;
      expectedPayoutDate?: string | null;
      sku: string;
      asin?: string;
    };
    const res = await requestJson<Array<any>>(`/api/recoveries`);
    if (!res.ok) return res as unknown as ApiResponse<Array<RecoveryListItem>>;
    const mapped = (res.data || []).map((item: any): RecoveryListItem => ({
      id: item.id,
      created: item.created,
      type: item.type,
      details: item.details,
      status: item.status,
      guaranteedAmount: item.guaranteedAmount,
      sku: item.sku,
      asin: item.asin,
      // Prefer backend snake_case expected_payout_date, with fallbacks for older fields
      expectedPayoutDate: item.expected_payout_date ?? item.expectedPayoutDate ?? item.predictedPayout ?? null,
    }));
    return { ok: true, status: res.status, data: mapped } as ApiResponse<Array<RecoveryListItem>>;
  },
  submitClaim: (id: string) => requestJson<{ id: string; status: string }>(`/api/claims/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
  getRecoveryStatus: (id: string) => requestJson<{ status: string; expected_payout_date?: string | null; amazonCaseId?: string; events?: Array<{ timestamp: string; title: string; description: string; type: string }> }>(`/api/recoveries/${encodeURIComponent(id)}/status`),
  getRecoveryDetail: async (id: string) => {
    type RecoveryDetail = {
      id: string;
      title: string;
      status: string;
      guaranteedAmount: number;
      expectedPayoutDate?: string | null;
      createdDate: string;
      amazonCaseId?: string;
      sku: string;
      productName: string;
      facility?: string;
      confidence?: number;
      unitsLost?: number;
      unitCost?: number;
      approvalReason?: string;
      rejectionReason?: string;
      isEvidenceComplete?: boolean;
      submissionStatus?: 'draft' | 'submitted' | 'approved' | 'paid' | 'denied';
      events?: Array<{ timestamp: string; title: string; description: string; type: string }>
    };
    const res = await requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}`);
    if (!res.ok) return res as unknown as ApiResponse<RecoveryDetail>;
    const d = res.data as any;
    const mapped: RecoveryDetail = {
      id: d.id,
      title: d.title,
      status: d.status,
      guaranteedAmount: d.guaranteedAmount,
      expectedPayoutDate: d.expected_payout_date ?? d.expectedPayoutDate ?? d.payoutDate ?? null,
      createdDate: d.createdDate,
      amazonCaseId: d.amazonCaseId,
      sku: d.sku,
      productName: d.productName,
      facility: d.facility,
      confidence: d.confidence,
      unitsLost: d.unitsLost,
      unitCost: d.unitCost,
      approvalReason: d.approval_reason ?? d.approvalReason ?? undefined,
      rejectionReason: d.rejection_reason ?? d.rejectionReason ?? undefined,
      isEvidenceComplete: d.evidence_complete ?? d.isEvidenceComplete ?? undefined,
      submissionStatus: d.submission_status ?? d.submissionStatus ?? undefined,
      events: d.events,
    };
    return { ok: true, status: res.status, data: mapped } as ApiResponse<RecoveryDetail>;
  },
  getRecoveryDocumentUrl: (id: string) => buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/document`),

  // Detections
  runDetections: () => requestJson<{ detection_id: string }>(`/api/detections/run`, { method: 'POST' }),
  getDetectionStatus: (detectionId: string) => requestJson<{ status: 'in_progress' | 'complete' | 'failed'; newCases?: number; totalPotential?: number }>(`/api/detections/status/${encodeURIComponent(detectionId)}`),

  // Dashboard & Recoveries metrics
  getDashboardAggregates: (window?: '7d' | '30d' | '90d') => requestJson<{ totalRecovered: number; totalApproved: number; totalExpected: number; evidenceHealth?: number; window?: '7d' | '30d' | '90d' }>(`/api/metrics/dashboard${window ? `?window=${encodeURIComponent(window)}` : ''}`),
  getRecoveriesMetrics: () => requestJson<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number }>(`/api/metrics/recoveries`),

  // Metrics hooks (frontend only fire-and-forget)
  trackEvent: (name: string, payload?: Record<string, any>) => requestJson<{ ok: true }>(`/api/metrics/track`, { method: 'POST', body: JSON.stringify({ name, payload, ts: Date.now() }) }),

  // Auth
  logout: () => requestJson<{ ok: true }>(`/api/auth/logout`, { method: 'POST' }),

  // Documents
  getDocuments: () => requestJson<Array<{ id: string; name: string; uploadDate: string; status: string; linkedSKUs?: number }>>(`/api/documents`),
  getDocument: (id: string) => requestJson<{ id: string; name: string; uploadDate: string; status: string; processingTime?: string; extractedData?: Array<{ sku: string; productName: string; unitCost: number; quantity: number; coordinates?: { x: number; y: number; width: number; height: number } }> }>(`/api/documents/${encodeURIComponent(id)}`),
  getDocumentViewUrl: (id: string) => buildApiUrl(`/api/documents/${encodeURIComponent(id)}/view`),
  getDocumentDownloadUrl: (id: string) => buildApiUrl(`/api/documents/${encodeURIComponent(id)}/download`),
};

