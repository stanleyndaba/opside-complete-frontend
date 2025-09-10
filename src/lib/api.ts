export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export const getApiBaseUrl = (): string => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
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
      return { ok: false, status: res.status, error: (payload as any)?.message || res.statusText };
    }
    return { ok: true, status: res.status, data: payload as T };
  } catch (error: any) {
    return { ok: false, status: 0, error: error?.message || 'Network error' };
  }
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

  // Integrations / Sync
  startAmazonSync: () => requestJson<{ syncId: string }>(`/integrations/amazon/sync/start`, { method: 'POST' }),
  getSyncStatus: (syncId?: string) => requestJson<{ status: 'in_progress' | 'complete' | 'failed'; progress?: number; message?: string }>(`/sync/status${syncId ? `?id=${encodeURIComponent(syncId)}` : ''}`),

  // Detections / Dashboard
  getDetectionsSummary: () => requestJson<{ totalPotential: number; newCases: number; valueEstimated: number }>(`/detections/summary`),

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
    const res = await requestJson<Array<any>>(`/recoveries`);
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
  resolveRecovery: (id: string) => requestJson<{ id: string; status: string }>(`/recoveries/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
  getRecoveryStatus: (id: string) => requestJson<{ status: string; expected_payout_date?: string | null; amazonCaseId?: string; events?: Array<{ timestamp: string; title: string; description: string; type: string }> }>(`/recoveries/${encodeURIComponent(id)}/status`),
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
    const res = await requestJson<any>(`/recoveries/${encodeURIComponent(id)}`);
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
  getRecoveryDocumentUrl: (id: string) => buildApiUrl(`/recoveries/${encodeURIComponent(id)}/document`),

  // Detections
  runDetections: () => requestJson<{ newCases: number; totalPotential: number }>(`/detections/run`, { method: 'POST' }),

  // Dashboard aggregates
  getDashboardAggregates: (window?: '7d' | '30d' | '90d') => requestJson<{ totalRecovered: number; totalApproved: number; totalExpected: number; window?: '7d' | '30d' | '90d' }>(`/dashboard/aggregates${window ? `?window=${encodeURIComponent(window)}` : ''}`),

  // Documents
  getDocuments: () => requestJson<Array<{ id: string; name: string; uploadDate: string; status: string; linkedSKUs?: number }>>(`/api/documents`),
  getDocument: (id: string) => requestJson<{ id: string; name: string; uploadDate: string; status: string; processingTime?: string; extractedData?: Array<{ sku: string; productName: string; unitCost: number; quantity: number; coordinates?: { x: number; y: number; width: number; height: number } }> }>(`/api/documents/${encodeURIComponent(id)}`),
  getDocumentDownloadUrl: (id: string) => buildApiUrl(`/api/documents/${encodeURIComponent(id)}/download`),
};

