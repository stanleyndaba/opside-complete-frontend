export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export const getApiBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
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
    const startPath = (import.meta.env.VITE_OAUTH_START_PATH as string) || '/auth/amazon/start';
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
  getRecoveries: () => requestJson<Array<{ id: string; created: string; type: string; details: string; status: string; guaranteedAmount: number; predictedPayout?: string | null; sku: string; asin?: string }>>(`/recoveries`),
  resolveRecovery: (id: string) => requestJson<{ id: string; status: string }>(`/recoveries/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
  getRecoveryDetail: (id: string) => requestJson<{ id: string; title: string; status: string; guaranteedAmount: number; payoutDate?: string; createdDate: string; amazonCaseId?: string; sku: string; productName: string; facility?: string; confidence?: number; unitsLost?: number; unitCost?: number; events?: Array<{ timestamp: string; title: string; description: string; type: string; }> }>(`/recoveries/${encodeURIComponent(id)}`),
  getRecoveryDocumentUrl: (id: string) => buildApiUrl(`/recoveries/${encodeURIComponent(id)}/document`),
};

