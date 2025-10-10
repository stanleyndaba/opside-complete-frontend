export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
}

const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
    credentials?: RequestCredentials;
  } = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: options.credentials || 'include'
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await res.json() : undefined;

    if (!res.ok) {
      return { ok: false, status: res.status, error: payload };
    }
    return { ok: true, status: res.status, data: payload as T };
  } catch (error) {
    return { ok: false, status: 0, error };
  }
}

// Auth endpoints
export async function fetchCurrentUser<T = unknown>() {
  return apiRequest<T>('/auth/me');
}

export function getAmazonLoginUrl(): string {
  return `${API_BASE_URL}/auth/amazon`;
}

// Sync endpoints
export async function startInventorySync<T = unknown>() {
  return apiRequest<T>('/sync/start', { method: 'POST' });
}

export async function fetchSyncStatus<T = { status: string; progress?: number; message?: string }>() {
  return apiRequest<T>('/sync/status');
}

