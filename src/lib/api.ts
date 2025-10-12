export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = (options?.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    };
  }

  private buildUrl(path: string): string {
    if (!this.baseUrl) return path; // allow relative URLs via Vite proxy during dev
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const url = this.buildUrl(path);
    // Include dynamic auth token if present
    const token = (typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : undefined) || undefined;
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    };
    const response = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      credentials: "include",
      ...init,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }
    // Try JSON; if empty, return as any
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("GET", path, undefined, init);
  }

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>("POST", path, body, init);
  }

  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>("PUT", path, body, init);
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>("PATCH", path, body, init);
  }

  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>("DELETE", path, undefined, init);
  }
}

export const apiClient = new ApiClient();

export function buildApiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

// Lightweight helper compatible with legacy callers expecting apiFetch(path, init)
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { method, body, ...rest } = init ?? {};
  const httpMethod = ((method ?? 'GET') as HttpMethod);
  return apiClient.request<T>(httpMethod, path, body, rest);
}

// --- Legacy helpers & facade for higher-level API calls ---

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

function ok<T>(data: T): ApiEnvelope<T> { return { ok: true, data }; }
function err<T = never>(e: unknown): ApiEnvelope<T> {
  const message = e instanceof Error ? e.message : String(e);
  return { ok: false, error: message };
}

// Plain request returning parsed JSON, throwing on HTTP errors
export async function apiRequest<T>(path: string, init?: RequestInit, _opts?: { retries?: number }): Promise<T> {
  return await apiClient.request<T>((init?.method as HttpMethod) ?? 'GET', path, (init as any)?.body, init);
}

let inMemoryToken: string | null = null;
export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) window.localStorage.setItem('auth_token', token);
    else window.localStorage.removeItem('auth_token');
  } catch {}
}

export async function fetchCurrentUser<T = any>(): Promise<ApiEnvelope<T>> {
  try {
    const data = await apiClient.get<T>('/api/auth/me');
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export function getAmazonLoginUrl(): string {
  return buildApiUrl('/auth/amazon/start');
}

// Named exports used by Sync.tsx
export async function startInventorySync(): Promise<ApiEnvelope<any>> {
  try {
    const data = await apiClient.post<any>('/api/sync/start');
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

export async function fetchSyncStatus<T = any>(): Promise<ApiEnvelope<T>> {
  try {
    const data = await apiClient.get<T>('/api/sync/status');
    return ok(data);
  } catch (e) {
    return err(e);
  }
}

// Facade used throughout the app
export const api = {
  // Generic envelope helpers
  async get<T = any>(path: string): Promise<ApiEnvelope<T>> {
    try { return ok(await apiClient.get<T>(path)); } catch (e) { return err(e); }
  },
  async post<T = any>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    try { return ok(await apiClient.post<T>(path, body)); } catch (e) { return err(e); }
  },

  // Metrics
  async getDashboardAggregates(window?: '7d' | '30d' | '90d'): Promise<ApiEnvelope<any>> {
    const q = window ? `?window=${encodeURIComponent(window)}` : '';
    try { return ok(await apiClient.get(`/api/metrics/dashboard${q}`)); } catch (e) { return err(e); }
  },
  async getRecoveriesMetrics(): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.get('/api/metrics/recoveries')); } catch (e) { return err(e); }
  },
  async trackEvent(name: string, payload?: Record<string, any>): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.post('/api/metrics/track', { name, payload })); } catch (e) { return err(e); }
  },

  // Integrations
  async getIntegrationsStatus(): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.get('/api/v1/integrations/status')); } catch (e) { return err(e); }
  },
  async connectAmazon(): Promise<ApiEnvelope<{ redirect_url?: string; auth_url?: string }>> {
    try { return ok(await apiClient.get('/api/v1/integrations/connect-amazon')); } catch (e) { return err(e); }
  },
  async connectDocs(provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox'): Promise<ApiEnvelope<{ redirect_url?: string }>> {
    const q = `?provider=${encodeURIComponent(provider)}`;
    try { return ok(await apiClient.get(`/api/v1/integrations/connect-docs${q}`)); } catch (e) { return err(e); }
  },
  async disconnectIntegration(provider: string, purge: boolean): Promise<ApiEnvelope<any>> {
    const q = `?provider=${encodeURIComponent(provider)}&purge=${purge ? 1 : 0}`;
    try { return ok(await apiClient.post(`/api/v1/integrations/disconnect${q}`)); } catch (e) { return err(e); }
  },

  // Sync
  async startAmazonSync(): Promise<ApiEnvelope<{ syncId?: string }>> {
    try { return ok(await apiClient.post('/api/sync/start')); } catch (e) { return err(e); }
  },

  // Recoveries
  async getAmazonRecoveries(): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.get('/api/recoveries')); } catch (e) { return err(e); }
  },
  getRecoveryDocumentUrl(recoveryId: string): string {
    return buildApiUrl(`/api/recoveries/${encodeURIComponent(recoveryId)}/document`);
  },

  // Detections
  async runDetections(): Promise<ApiEnvelope<{ detection_id: string }>> {
    try { return ok(await apiClient.post('/api/detections/run')); } catch (e) { return err(e); }
  },
  async getDetectionStatus(detectionId: string): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.get(`/api/detections/status/${encodeURIComponent(detectionId)}`)); } catch (e) { return err(e); }
  },

  // Billing & Stripe
  async postLoginStripe(): Promise<ApiEnvelope<any>> {
    try { return ok(await apiClient.post('/api/auth/post-login/stripe', {})); } catch (e) { return err(e); }
  },
};

export default api;
