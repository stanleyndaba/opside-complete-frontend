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

  // Production backend URL - use the new consolidated Node.js API
  // IMPORTANT: This is the correct backend URL. Do not change unless migrating to a new backend.
  const productionBackend = 'https://opside-node-api.onrender.com';
  
  // List of deprecated/old backend URLs that should be rejected
  const deprecatedBackends = [
    'clario-complete-backend-y5cd.onrender.com',
    'https://clario-complete-backend-y5cd.onrender.com',
  ];

  // Check for environment variable override (Vite exposes VITE_ prefixed vars via import.meta.env)
  // In Vite, environment variables are available at build time and are injected into the bundle
  let envBase: string | undefined;
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Vite environment variables are directly on import.meta.env
    envBase = import.meta.env.VITE_API_BASE_URL;
  }

  // If environment variable is set, validate it before using
  if (envBase && envBase.trim() !== '') {
    const baseUrl = String(envBase).trim().replace(/\/$/, '');
    
    // Reject deprecated/old backend URLs
    const isDeprecated = deprecatedBackends.some(deprecated => 
      baseUrl.includes(deprecated)
    );
    
    if (isDeprecated) {
      console.warn(
        `[API] Rejected deprecated backend URL from VITE_API_BASE_URL: ${baseUrl}. ` +
        `Using correct backend URL instead: ${productionBackend}`
      );
    } else {
      // Valid environment variable - use it
      console.log(`[API] Using environment variable VITE_API_BASE_URL: ${baseUrl}`);
      return baseUrl + normalizedPath;
    }
  }

  // In development, check for localhost override
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (isDev) {
    // In development, you can still use env var, but also allow localhost:3000 fallback
    const devBackend = 'http://localhost:3000';
    console.log(`[API] Development mode - using: ${devBackend}`);
    return devBackend + normalizedPath;
  }

  // Production: Use the production backend URL
  // This ensures the correct backend is always used even if env vars aren't set
  console.log(`[API] Production mode - using backend: ${productionBackend}`);
  return productionBackend + normalizedPath;
}

/**
 * Make a request with retry logic for sleeping backends (e.g., Render free tier)
 * Retries up to 3 times with exponential backoff for network errors
 */
async function requestJsonWithRetry<T>(
  path: string,
  options?: RequestInit,
  retryCount = 0,
  maxRetries = 3
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  
  // Use a longer timeout for the first request to allow backend wake-up time
  // But not too long to avoid hanging the UI when backend is responsive
  const timeout = retryCount === 0 ? 20000 : 15000; // 20s first request (enough for wake-up), 15s retries
  
  try {
    console.log(`[API] Requesting: ${url}${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ''}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const res = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    clearTimeout(timeoutId);

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
    const url = buildApiUrl(path);
    const errorMsg = error instanceof Error ? error.message : 'Network error';
    
    // Check if this is a network error that might benefit from retry
    const isNetworkError = 
      error instanceof TypeError || // Fetch failed
      errorMsg.includes('fetch') ||
      errorMsg.includes('network') ||
      errorMsg.includes('Failed to fetch') ||
      error instanceof DOMException; // AbortError
    
    const isAbortError = error instanceof DOMException && error.name === 'AbortError';
    
    // Retry on network errors or timeout (but not on CORS or other errors)
    if (isNetworkError && !isAbortError && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff: 1s, 2s, 4s, max 10s
      console.warn(`[API] Network error, retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return requestJsonWithRetry<T>(path, options, retryCount + 1, maxRetries);
    }
    
    // Provide detailed error information
    let details: string;
    if (isAbortError) {
      details = `Request timed out after ${timeout}ms. The backend may be sleeping (free tier services can take 30-60 seconds to wake up). Please wait a moment and try again.`;
    } else if (isNetworkError && retryCount >= maxRetries) {
      details = `Cannot connect to backend at ${url} after ${maxRetries} retries. The backend may be down, sleeping (free tier services can take 30-60 seconds to wake up), or blocked by CORS. Please check your internet connection and try again in a moment.`;
    } else if (errorMsg.includes('CORS') || errorMsg.includes('cors')) {
      details = `CORS error: Cannot connect to backend at ${url}. The backend may not be configured to allow requests from this origin.`;
    } else {
      details = `Cannot connect to backend at ${url}. The backend may be down, sleeping, or blocked by CORS. Error: ${errorMsg}`;
    }
    
    console.error(`[API] Request failed for ${path}:`, {
      error: errorMsg,
      url,
      details,
      retryCount
    });
    
    return {
      ok: false,
      status: 0,
      error: details,
    };
  }
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return requestJsonWithRetry<T>(path, options);
}

/**
 * Get the current frontend URL dynamically.
 * This is used to pass to the backend so it can configure OAuth redirects correctly,
 * even when the deployment domain changes (e.g., Vercel preview deployments).
 */
function getFrontendUrl(): string {
  if (typeof window !== 'undefined') {
    // Use current browser location
    return window.location.origin;
  }
  
  // Fallback: Check for Vercel's VERCEL_URL environment variable (includes protocol)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const vercelUrl = import.meta.env.VERCEL_URL;
    if (vercelUrl) {
      // VERCEL_URL doesn't include protocol, so add https
      return `https://${vercelUrl}`;
    }
    
    // Check for custom frontend URL env var
    const customUrl = import.meta.env.VITE_FRONTEND_URL;
    if (customUrl) {
      return String(customUrl).trim().replace(/\/$/, '');
    }
  }
  
  // Last resort: use a default (this shouldn't happen in production)
  return 'https://opside.com';
}

export const api = {
  // Export buildApiUrl for use in other modules
  buildApiUrl,
  
  // Export getFrontendUrl for use in other modules
  getFrontendUrl,
  
  // Generic helpers
  get: <T = any>(path: string) => requestJson<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: unknown) => requestJson<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  
  // Helper for OAuth connection endpoints that need redirect_uri
  connectIntegration: (provider: string) => {
    const frontendUrl = getFrontendUrl();
    const redirectUri = `${frontendUrl}/auth/callback`;
    return requestJson<{ auth_url?: string; redirect_url?: string }>(
      `/api/v1/integrations/${encodeURIComponent(provider)}/connect?redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: 'POST' }
    );
  },

  // Auth endpoints
  getMe: () => requestJson<any>('/api/auth/me'),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  postLoginStripe: () => requestJson<any>('/api/auth/post-login/stripe', { method: 'POST' }),

  // Amazon SP-API endpoints (Step 1 Auth Process)
  connectAmazon: async () => {
    // Get current frontend URL and pass it to backend for OAuth redirect configuration
    const frontendUrl = getFrontendUrl();
    const response = await requestJson<{
      auth_url?: string;
      authUrl?: string;
      state?: string;
      success?: boolean;
      message?: string;
    }>(`/api/v1/integrations/amazon/auth/start?redirect_uri=${encodeURIComponent(frontendUrl)}/auth/callback`);

    if (response.ok && response.data) {
      const normalizedAuthUrl = response.data.auth_url ?? response.data.authUrl;

      if (normalizedAuthUrl) {
        response.data = {
          ...response.data,
          auth_url: normalizedAuthUrl,
        };
      }
    }

    return response;
  },
  completeAmazonSandboxAuth: (state: string) => requestJson<{ ok: boolean; connected: boolean }>('/api/v1/integrations/amazon/sandbox/callback', { method: 'POST', body: JSON.stringify({ state }) }),
  getAmazonRecoveries: () => requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries'),

  // Auth-adjacent helpers for flows
  connectDocs: (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => {
    // Get current frontend URL and pass it to backend for OAuth redirect configuration
    const frontendUrl = getFrontendUrl();
    return requestJson<{ auth_url?: string; redirect_url?: string }>(
      `/api/v1/integrations/connect-docs?provider=${encodeURIComponent(provider)}&redirect_uri=${encodeURIComponent(frontendUrl)}/auth/callback`,
      { method: 'GET' }
    );
  },
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
