export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function buildApiUrl(path: string): string {
  const base = 'http://localhost:3001';
  return base + (path.startsWith('/') ? path : '/' + path);
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
  completeAmazonSandboxAuth: (state: string) => requestJson<any>('/api/v1/integrations/amazon/sandbox/callback', { 
    method: 'POST', 
    body: JSON.stringify({ state }) 
  }),

  getAmazonRecoveries: () => requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries'),

  getDashboardAggregates: () => requestJson<any>('/api/metrics/dashboard'),
  getRecoveriesMetrics: () => requestJson<any>('/api/metrics/recoveries'),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
};
