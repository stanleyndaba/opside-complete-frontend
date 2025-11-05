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
  const requestStartTime = performance.now();
  const url = buildApiUrl(path);
  
  // Use a longer timeout for the first request to allow backend wake-up time
  // Render free tier can take 30-60 seconds to wake up, so we need generous timeouts
  // But we also want to avoid hanging the UI when backend is responsive
  const timeout = retryCount === 0 ? 45000 : 20000; // 45s first request (allows full wake-up), 20s retries
  
  try {
    console.log(`[API] Requesting: ${url}${retryCount > 0 ? ` (retry ${retryCount}/${maxRetries})` : ''} - Timeout: ${timeout}ms`);
    
    const fetchStartTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      const elapsed = performance.now() - fetchStartTime;
      console.warn(`[API] Request timeout after ${Math.round(elapsed)}ms for ${url}`);
      controller.abort();
    }, timeout);
    
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
    const fetchDuration = performance.now() - fetchStartTime;
    console.log(`[API] Fetch completed in ${Math.round(fetchDuration)}ms - Status: ${res.status} for ${url}`);
    
    // Log response details for debugging
    if (!res.ok) {
      console.warn(`[API] Backend responded with error status ${res.status} for ${url}`, {
        statusText: res.statusText,
        hasCorsHeaders: res.headers.get('access-control-allow-origin') !== null
      });
    }

    const parseStartTime = performance.now();
    let data;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    const parseDuration = performance.now() - parseStartTime;
    const totalDuration = performance.now() - requestStartTime;
    console.log(`[API] Response parsing took ${Math.round(parseDuration)}ms, total request time: ${Math.round(totalDuration)}ms`);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || res.statusText || 'Request failed';
      
      // Provide specific error messages based on status code
      let userFriendlyError = errorMsg;
      if (res.status === 404) {
        userFriendlyError = `Endpoint not found (404): ${path} - The backend may not have implemented this endpoint yet, or the path is incorrect.`;
      } else if (res.status === 401) {
        userFriendlyError = `Unauthorized (401): Please log in or refresh your session.`;
      } else if (res.status === 403) {
        userFriendlyError = `Forbidden (403): You don't have permission to access this resource.`;
      } else if (res.status >= 500) {
        userFriendlyError = `Server error (${res.status}): ${errorMsg}`;
      }
      
      console.error(`[API] HTTP ${res.status} error for ${url}: ${errorMsg}`);
      
      // For HTTP errors (401, 403, 404, 500, etc.), the backend IS responding
      // These are not network errors and should not be retried
      // Return immediately with the error
      return {
        ok: false,
        status: res.status,
        error: userFriendlyError,
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
    
    // Check error type to determine if retry is appropriate
    const isAbortError = error instanceof DOMException && error.name === 'AbortError';
    
    // CORS errors are network errors but retrying won't help - they need backend configuration fix
    // CORS errors typically show as "Failed to fetch" or "NetworkError" but are actually CORS preflight failures
    const isCorsError = 
      errorMsg.includes('CORS') || 
      errorMsg.includes('cors') ||
      errorMsg.includes('Access-Control') ||
      errorMsg.includes('Cross-Origin') ||
      (errorMsg.includes('Failed to fetch') && typeof window !== 'undefined' && 
       // Additional CORS detection: if we get "Failed to fetch" but it's likely CORS
       // (we can't perfectly detect this, but we can check if it's a common pattern)
       window.location.origin !== new URL(url).origin);
    
    // Network errors that might benefit from retry (backend might be waking up)
    // But NOT CORS errors - those need backend configuration, not retries
    const isRetryableNetworkError = 
      !isCorsError && (
        error instanceof TypeError || // Fetch failed (network error)
        (errorMsg.includes('fetch') && !errorMsg.includes('CORS')) ||
        (errorMsg.includes('network') && !errorMsg.includes('CORS')) ||
        (errorMsg.includes('Failed to fetch') && !isCorsError) ||
        isAbortError // Timeout - backend might be waking up
      );
    
    // Only retry on retryable network errors (not CORS, not HTTP errors)
    if (isRetryableNetworkError && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff: 1s, 2s, 4s, max 10s
      const retryType = isAbortError ? 'timeout' : 'network error';
      console.warn(`[API] ${retryType}, retrying in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return requestJsonWithRetry<T>(path, options, retryCount + 1, maxRetries);
    }
    
    // Provide detailed error information
    let details: string;
    
    if (isCorsError) {
      // CORS is a configuration issue on the backend, not a network problem
      details = `CORS error: The backend at ${url} is not configured to allow requests from ${typeof window !== 'undefined' ? window.location.origin : 'this origin'}. This is a backend configuration issue - the backend needs to allow your frontend domain in its CORS settings.`;
    } else if (retryCount >= maxRetries) {
      // Calculate approximate total wait time
      const totalTime = timeout + (retryCount * 20000) + (1000 * (Math.pow(2, retryCount) - 1));
      if (isAbortError) {
        details = `Request timed out after ${Math.round(timeout/1000)}s. The backend may be sleeping (Render free tier can take 30-60 seconds to wake up). Please wait 30-60 seconds and refresh the page, or try again in a moment.`;
      } else if (isRetryableNetworkError) {
        details = `Cannot connect to backend at ${url} after ${maxRetries} retries (total wait time: ~${Math.round(totalTime/1000)}s). The backend may be sleeping (Render free tier can take 30-60 seconds to wake up). Please wait 30-60 seconds and refresh the page, or try again in a moment.`;
      } else {
        details = `Cannot connect to backend at ${url}. Error: ${errorMsg}. Check your internet connection and verify the backend is running.`;
      }
    } else {
      details = `Cannot connect to backend at ${url}. Error: ${errorMsg}`;
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
    // Step 1: Call /auth/start to get OAuth URL
    // Get current frontend URL and pass it to backend for OAuth redirect configuration
    // Backend needs this to know where to redirect after OAuth completes
    // This handles Vercel preview deployments where the URL changes each deploy
    const frontendUrl = getFrontendUrl();
    const response = await requestJson<{
      auth_url?: string;
      authUrl?: string;
      state?: string;
      success?: boolean;
      message?: string;
    }>(`/api/v1/integrations/amazon/auth/start?redirect_uri=${encodeURIComponent(frontendUrl)}/auth/callback&frontend_url=${encodeURIComponent(frontendUrl)}`);

    if (response.ok && response.data) {
      const normalizedAuthUrl = response.data.auth_url ?? response.data.authUrl;

      if (normalizedAuthUrl) {
        response.data = {
          ...response.data,
          auth_url: normalizedAuthUrl,
        };
      }
    }

    // Step 2: Redirect user to Amazon (DO NOT call callback directly!)
    // Step 3: Amazon will automatically redirect to /auth/callback?code=...
    // (This happens automatically - frontend shouldn't call this)
    return response;
  },
  completeAmazonSandboxAuth: (state: string) => {
    console.log('[API] completeAmazonSandboxAuth called with state:', state);
    const body = JSON.stringify({ state });
    console.log('[API] Request body:', body);
    return requestJson<{ ok: boolean; connected: boolean }>(
      '/api/v1/integrations/amazon/sandbox/callback',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      }
    );
  },
  getAmazonRecoveries: async () => {
    const startTime = performance.now();
    
    // Check if we're in sandbox mode FIRST (for faster response)
    // Sandbox mode is detected if:
    // 1. We're on localhost
    // 2. VITE_SANDBOX env var is set to 'true'
    // 3. We're in development mode
    // 4. We came from sandbox auth flow (check sessionStorage/localStorage)
    const isSandbox = 
      (typeof window !== 'undefined' && (
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1') ||
        sessionStorage.getItem('amazon_sandbox_mode') === 'true' ||
        localStorage.getItem('amazon_sandbox_mode') === 'true'
      )) ||
      (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_SANDBOX === 'true' ||
        import.meta.env.MODE === 'development' ||
        import.meta.env.DEV === true
      ));
    
    console.log(`[API] getAmazonRecoveries - Sandbox mode: ${isSandbox}, Time: ${performance.now() - startTime}ms`);
    
    // In sandbox mode, try backend but don't wait too long - use mock data quickly
    if (isSandbox) {
      console.log('[API] Sandbox mode detected - will use mock data if backend is slow');
      
      // Try backend with shorter timeout in sandbox mode (3 seconds)
      const backendStartTime = performance.now();
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend timeout - using mock data')), 3000)
        );
        
        console.log(`[API] Starting backend request at ${backendStartTime}ms`);
        const backendPromise = requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries');
        
        const response = await Promise.race([backendPromise, timeoutPromise]) as any;
        const backendEndTime = performance.now();
        const backendDuration = backendEndTime - backendStartTime;
        
        console.log(`[API] Backend request completed in ${backendDuration}ms`);
        
        // If backend returns valid data quickly (> 0), use it
        // But if backend returns zeros, use mock data instead (sandbox should show demo data)
        if (response?.ok && response?.data && (response.data.totalAmount > 0 || response.data.claimCount > 0)) {
          console.log(`[API] Backend returned data quickly (${backendDuration}ms):`, response.data);
          return response;
        } else if (response?.ok && response?.data) {
          // Backend returned zeros - use mock data in sandbox mode
          console.log(`[API] Backend returned zeros in sandbox mode (${backendDuration}ms), using mock data instead:`, response.data);
        }
      } catch (error) {
        const backendEndTime = performance.now();
        const backendDuration = backendEndTime - backendStartTime;
        console.log(`[API] Backend slow or failed in sandbox mode (took ${backendDuration}ms), using mock data:`, error);
      }
      
      // Use mock data immediately for sandbox mode
      const mockStartTime = performance.now();
      console.log('[API] Using mock data for Amazon recoveries (sandbox mode)');
      const { mockAmazonApi } = await import('./mockApi');
      const mockData = mockAmazonApi.getRecoveries();
      const totalTime = performance.now() - startTime;
      console.log(`[API] Mock data loaded in ${performance.now() - mockStartTime}ms, total time: ${totalTime}ms`);
      return {
        ok: true,
        status: 200,
        data: {
          totalAmount: mockData.totalAmount,
          currency: mockData.currency,
          claimCount: mockData.claimCount,
        },
      };
    }
    
    // Production mode: try backend normally with timing
    const prodStartTime = performance.now();
    console.log('[API] Production mode - calling backend');
    const response = await requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries');
    const prodDuration = performance.now() - prodStartTime;
    console.log(`[API] Production backend request took ${prodDuration}ms`);
    
    // If backend returns valid data, use it
    if (response.ok && response.data && (response.data.totalAmount > 0 || response.data.claimCount > 0)) {
      return response;
    }
    
    // Return the original response (even if it failed)
    return response;
  },

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
