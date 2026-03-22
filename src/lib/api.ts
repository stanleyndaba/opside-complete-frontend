export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export function buildApiUrl(path: string): string {
  // Normalize provided path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If caller passed an absolute URL, return as-is
  if (/^https?:\/\//i.test(path)) return path;

  // Production backend URL - use the new consolidated Node.js API
  // IMPORTANT: This is the correct backend URL. Do not change unless migrating to a new backend.
  const productionBackend = 'https://opside-node-api-woco.onrender.com';

  // Check for environment variable override (Vite exposes VITE_ prefixed vars via import.meta.env)
  let envBase: string | undefined;

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    envBase = import.meta.env.VITE_INTEGRATIONS_URL ||
      import.meta.env.NEXT_PUBLIC_INTEGRATIONS_URL ||
      import.meta.env.VITE_API_BASE_URL;
  }

  // Detect if we're in Vite development mode with proxy configured
  // In dev mode, use relative URLs so Vite's proxy handles the routing
  const isViteDev = typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV === true &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const isLocalhostOrigin = (value?: string): boolean => {
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  };

  if (isViteDev) {
    // In Vite dev mode, use relative URL - proxy will route to backend
    // This eliminates CORS issues during development
    console.log(`[API] Dev mode with proxy - using relative path: ${normalizedPath}`);
    return normalizedPath;
  }

  // If environment variable is set, validate it before using
  if (envBase && envBase.trim() !== '') {
    const baseUrl = String(envBase).trim().replace(/\/$/, '');
    if (!isViteDev && isLocalhostOrigin(baseUrl)) {
      console.warn(`[API] Ignoring localhost API base outside dev mode: ${baseUrl}`);
      return productionBackend + normalizedPath;
    }
    console.log(`[API] Using environment variable: ${baseUrl}`);
    return baseUrl + normalizedPath;
  }

  // Production: Use the production backend URL
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
  const sessionToken = localStorage.getItem('session_token') || '';
  const userId = localStorage.getItem('user_id') || '';
  const tenantId = localStorage.getItem('active_tenant_id') || '';

  const method = (options?.method || 'GET').toUpperCase();
  const callerHeaders = (options?.headers || {}) as Record<string, string>;
  const baseHeaders: Record<string, string> = {
    ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
  };

  // Avoid forcing JSON content-type on GET/HEAD requests. It creates unnecessary preflights
  // and pollutes runtime traces for pages that only need reads.
  if (method !== 'GET' && method !== 'HEAD' && !callerHeaders['Content-Type']) {
    baseHeaders['Content-Type'] = 'application/json';
  }

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
      cache: 'no-store',
      headers: {
        ...baseHeaders,
        ...callerHeaders,
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
        // If backend returned an error message, use it; otherwise show generic
        userFriendlyError = errorMsg && errorMsg !== 'Not Found'
          ? errorMsg
          : `Not found (404): ${path}`;
      } else if (res.status === 401) {
        userFriendlyError = `Unauthorized (401): Please log in or refresh your session.`;
      } else if (res.status === 403) {
        userFriendlyError = `Forbidden (403): You don't have permission to access this resource.`;
      } else if (res.status >= 500) {
        userFriendlyError = `Server error (${res.status}): ${errorMsg}`;
      }

      // Log 404s as warnings (not errors) since they're often expected (endpoint not implemented)
      // Log other errors as errors
      if (res.status === 404) {
        console.warn(`[API] HTTP 404 for ${url}: ${errorMsg} (endpoint may not be implemented)`);
      } else {
        console.error(`[API] HTTP ${res.status} error for ${url}: ${errorMsg}`);
      }

      // For HTTP errors (401, 403, 404, 500, etc.), the backend IS responding
      // These are not network errors and should not be retried
      // Return immediately with the error, but include data in case it has useful info (e.g., existingSyncId for 409)
      return {
        ok: false,
        status: res.status,
        error: userFriendlyError,
        data: data, // Include parsed response body for error responses (e.g., 409 with existingSyncId)
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
        details = `Request timed out after ${Math.round(timeout / 1000)}s. The backend may be sleeping (Render free tier can take 30-60 seconds to wake up). Please wait 30-60 seconds and refresh the page, or try again in a moment.`;
      } else if (isRetryableNetworkError) {
        details = `Cannot connect to backend at ${url} after ${maxRetries} retries (total wait time: ~${Math.round(totalTime / 1000)}s). The backend may be sleeping (Render free tier can take 30-60 seconds to wake up). Please wait 30-60 seconds and refresh the page, or try again in a moment.`;
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
  // Admin: Revenue analytics
  getAdminRevenue: () => requestJson<any>('/api/admin/revenue'),

  // Waitlist
  joinWaitlist: (data: {
    email: string;
    user_type?: string;
    brand_count?: string;
    annual_revenue?: string;
    contact_handle?: string;
    primary_goal?: string;
    // Legacy support
    full_name?: string;
    company_name?: string;
    monthly_volume?: string;
    referral_source?: string;
  }) => requestJson<{ success: boolean; message: string; already_registered?: boolean }>('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Get waitlist entries (admin only)
  getWaitlist: (limit = 100, offset = 0) =>
    requestJson<{ success: boolean; entries: any[]; total: number }>(`/api/waitlist?limit=${limit}&offset=${offset}`),


  // Export buildApiUrl for use in other modules
  buildApiUrl,

  // Export getFrontendUrl for use in other modules
  getFrontendUrl,

  // Notes
  getNotes: () => requestJson<{ success: boolean; data: any[] }>('/api/notes'),
  createNote: (content: string) => requestJson<{ success: boolean; data: any }>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ content })
  }),
  deleteNote: (id: string) => requestJson<{ success: boolean }>('/api/notes/' + id, { method: 'DELETE' }),
  updateNote: (id: string, content: string) => requestJson<{ success: boolean; data: any }>('/api/notes/' + id, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  }),

  // Generic helpers
  get: <T = any>(path: string) => requestJson<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: unknown) => requestJson<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),

  // Helper for OAuth connection endpoints that need redirect_uri
  connectIntegration(provider: string, tenantSlug?: string) {
    if (!tenantSlug) throw new Error("tenantSlug required for connectIntegration");
    const frontendUrl = getFrontendUrl();
    const slug = tenantSlug;
    const redirectUri = `${frontendUrl}/app/${slug}/auth/callback`;
    return requestJson<{ auth_url: string }>(
      `/api/v1/integrations/${provider}/connect?redirect_uri=${encodeURIComponent(redirectUri)}`,
      { method: 'POST' }
    );
  },

  // Auth endpoints
  getMe: (tenantSlug?: string) => requestJson<any>(`/api/auth/me${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`),
  getUserProfile: (tenantSlug?: string) => requestJson<{
    success: boolean;
    user: {
      id: string;
      email?: string;
      amazon_seller_id?: string;
      seller_id?: string;
      company_name?: string;
      created_at: string;
    };
  }>(`/api/auth/me${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  // Amazon SP-API endpoints (Step 1 Auth Process)
  connectAmazon(marketplaceId?: string, bypassOAuth = false, tenantSlug?: string) {
    if (!tenantSlug) throw new Error("tenantSlug required for connectAmazon");
    const frontendUrl = getFrontendUrl();
    const slug = tenantSlug;
    const redirectUri = `${frontendUrl}/app/${slug}/auth/callback`;

    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      frontend_url: frontendUrl,
      ...(bypassOAuth ? { bypass: 'true' } : {}),
      ...(marketplaceId ? { marketplaceId } : {}),
      tenantSlug: slug
    });

    return requestJson<{
      auth_url?: string;
      authUrl?: string;
    }>(`/api/v1/integrations/amazon/auth/start?${params.toString()}`);
  },

  useExistingAmazonConnection(marketplaceId?: string, tenantSlug?: string) {
    if (!tenantSlug) throw new Error("tenantSlug required for useExistingAmazonConnection");
    const frontendUrl = getFrontendUrl();
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    const redirectUri = `${frontendUrl}/app/${slug}/auth/callback`;

    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      frontend_url: frontendUrl,
      bypass: 'true',
      ...(marketplaceId ? { marketplaceId } : {}),
      tenantSlug: slug
    });

    return requestJson<{
      auth_url?: string;
      authUrl?: string;
      bypassed?: boolean;
      redirectUrl?: string;
    }>(`/api/v1/integrations/amazon/auth/start?${params.toString()}`);
  },
  completeAmazonSandboxAuth: (state: string) => {
    console.log('[API] completeAmazonSandboxAuth called with state:', state);
    const body = JSON.stringify({
      state,
      code: 'mock_auth_code', // Explicitly provide mock code for sandbox flow
      spapi_oauth_code: 'mock_auth_code' // Backwards compatibility
    });
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
  
  createStore: (data: { name: string; marketplace: string; seller_id: string }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for createStore");
    return requestJson<{ store: any }>(
      `/api/v1/integrations/amazon/stores?tenantSlug=${tenantSlug}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }
    );
  },
  
  getStores: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getStores");
    return requestJson<{ stores: any[] }>(
      `/api/v1/integrations/amazon/stores?tenantSlug=${tenantSlug}`
    );
  },
  
  deleteStore: (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for deleteStore");
    return requestJson<{ success: boolean; message?: string }>(
      `/api/v1/integrations/amazon/stores/${id}?tenantSlug=${tenantSlug}`,
      {
        method: 'DELETE',
      }
    );
  },
  
  getAmazonRecoveries: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getAmazonRecoveries");
    const startTime = performance.now();
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");

    // DISABLED: Sandbox mode was causing mock data fallback, hiding real CSV data
    // To re-enable mock data, uncomment the sandbox detection below
    const isSandbox = false;
    /* Original sandbox detection:
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
    */

    console.log(`[API] getAmazonRecoveries - Sandbox mode: ${isSandbox}, Tenant: ${slug}, Time: ${performance.now() - startTime}ms`);

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
        const endpoint = `/api/v1/integrations/amazon/recoveries?tenantSlug=${slug}`;
        console.log(`[API] Backend URL: ${buildApiUrl(endpoint)}`);
        const backendPromise = requestJson<{ totalAmount: number; currency: string; claimCount: number }>(endpoint);

        let response: any;
        try {
          response = await Promise.race([backendPromise, timeoutPromise]);
        } catch (raceError: any) {
          if (raceError?.message?.includes('timeout') || raceError?.message?.includes('Backend timeout')) {
            throw new Error('Backend timeout - using mock data');
          }
          throw raceError;
        }
        const backendEndTime = performance.now();
        const backendDuration = backendEndTime - backendStartTime;

        console.log(`[API] Backend request completed in ${backendDuration}ms`);

        let recoveryData = response?.data;
        if (recoveryData?.recoveries) {
          recoveryData = recoveryData.recoveries;
        }

        if (response?.ok && recoveryData) {
          return {
            ...response,
            data: {
              totalAmount: recoveryData.totalAmount ?? 0,
              currency: recoveryData.currency ?? 'USD',
              claimCount: recoveryData.claimCount ?? 0,
              recoveredCount: recoveryData.recoveredCount,
              source: recoveryData.source,
              dataSource: recoveryData.dataSource,
              message: recoveryData.message,
              needsSync: recoveryData.needsSync,
              syncTriggered: recoveryData.syncTriggered,
              _source: 'backend',
              _backendDuration: backendDuration
            }
          };
        }
      } catch (error: any) {
        console.error(`[API] ❌ Backend request FAILED in sandbox mode`);
      }

      // Fallback to mock data
      const mockStartTime = performance.now();
      const { mockAmazonApi } = await import('./mockApi');
      const mockData = mockAmazonApi.getRecoveries();
      return {
        ok: true,
        status: 200,
        data: {
          totalAmount: mockData.totalAmount,
          currency: mockData.currency,
          claimCount: mockData.claimCount,
          source: 'mock',
          _source: 'mock',
          _isMockData: true
        },
      };
    }

    // Production mode: try backend normally
    const response = await requestJson<{
      totalAmount: number;
      currency: string;
      claimCount: number;
      recoveredCount?: number;
      source?: string;
      dataSource?: string;
      message?: string;
      needsSync?: boolean;
      syncTriggered?: boolean;
      recoveries?: {
        totalAmount: number;
        currency: string;
        claimCount: number;
        recoveredCount?: number;
        source?: string;
        dataSource?: string;
        message?: string;
        needsSync?: boolean;
        syncTriggered?: boolean;
      };
    }>(`/api/v1/integrations/amazon/recoveries?tenantSlug=${slug}`);

    let recoveryData = response?.data;
    if (recoveryData?.recoveries) {
      recoveryData = recoveryData.recoveries;
    }

    if (response.ok && recoveryData) {
      return {
        ...response,
        data: {
          totalAmount: recoveryData.totalAmount ?? 0,
          currency: recoveryData.currency ?? 'USD',
          claimCount: recoveryData.claimCount ?? 0,
          recoveredCount: recoveryData.recoveredCount,
          source: recoveryData.source,
          dataSource: recoveryData.dataSource,
          message: recoveryData.message,
          needsSync: recoveryData.needsSync,
          syncTriggered: recoveryData.syncTriggered,
        }
      };
    }

    if (recoveryData && recoveryData !== response.data) {
      return {
        ...response,
        data: {
          totalAmount: recoveryData.totalAmount ?? 0,
          currency: recoveryData.currency ?? 'USD',
          claimCount: recoveryData.claimCount ?? 0,
          recoveredCount: recoveryData.recoveredCount,
          source: recoveryData.source,
          dataSource: recoveryData.dataSource,
          message: recoveryData.message,
          needsSync: recoveryData.needsSync,
          syncTriggered: recoveryData.syncTriggered,
        }
      };
    }
    return response;
  },

  // Disputes
  getDisputeBrief: (id: string, tenantSlug?: string) => buildApiUrl(`/api/disputes/${encodeURIComponent(id)}/brief${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`),

  connectDocs: (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'slack' | 'adobe_sign' | 'onedrive', tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for connectDocs");
    const frontendUrl = getFrontendUrl();
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    const redirectUri = `${frontendUrl}/app/${slug}/auth/callback`;

    // Providers mapping if needed (e.g. gdrive vs google-drive)
    const backendProvider = provider === 'gdrive' ? 'gdrive' : provider;

    return requestJson<{ success?: boolean; authUrl?: string; auth_url?: string; state?: string; message?: string; sandbox?: boolean }>(
      `/api/v1/integrations/${encodeURIComponent(backendProvider)}/connect?frontend_url=${encodeURIComponent(frontendUrl)}&redirect_uri=${encodeURIComponent(redirectUri)}&tenant_slug=${encodeURIComponent(slug)}`,
      { method: 'POST' }
    ).then(response => {
      if (response.ok && response.data) {
        const authUrl = response.data.authUrl || response.data.auth_url;
        return {
          ...response,
          data: { ...response.data, auth_url: authUrl, authUrl }
        };
      }
      return response;
    });
  },
  startAmazonSync: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for startAmazonSync");
    return requestJson<{
      syncId?: string;
      sync_id?: string;
      status?: string;
      message?: string;
    }>(`/api/sync/start?tenantSlug=${tenantSlug}`, { method: 'POST' });
  },
  trackEvent: (name: string, payload?: Record<string, any>) =>
    requestJson<any>('/api/metrics/track', { method: 'POST', body: JSON.stringify({ name, payload }) }),

  getDashboardAggregates: (window?: '7d' | '30d' | '90d', tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDashboardAggregates");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<any>(
      `/api/metrics/dashboard?${new URLSearchParams({
        ...(window ? { window } : {}),
        tenantSlug: slug
      }).toString()}`
    );
  },
  getRecoveriesMetrics: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getRecoveriesMetrics");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<any>(`/api/metrics/recoveries?tenantSlug=${slug}`);
  },
  setAutoClaimEnabled: (enabled: boolean) => requestJson<any>('/api/recoveries/auto-claim', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // Refund Engine endpoints
  submitClaim: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
  resubmitClaim: (id: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/resubmit`, { method: 'POST' }),
  getRecoveryStatus: (id: string, tenantSlug?: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}/status${tenantSlug ? `?tenantSlug=${tenantSlug}` : ''}`),
  getRecoveryDetail: (id: string, tenantSlug?: string) => requestJson<any>(`/api/recoveries/${encodeURIComponent(id)}${tenantSlug ? `?tenantSlug=${tenantSlug}` : ''}`),
  getRecoveryDocumentUrl: (id: string) => buildApiUrl(`/api/recoveries/${encodeURIComponent(id)}/document`),
  getDocumentViewUrl: (docId: string) => buildApiUrl(`/api/documents/${encodeURIComponent(docId)}/view`),

  // Evidence/documents
  getDocuments: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocuments");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<any[]>('/api/documents?tenantSlug=' + slug);
  },
  getDocumentInventory: (params?: {
    q?: string;
    parserStatus?: string;
    provider?: string;
    linked?: 'linked' | 'unlinked';
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentInventory");
    const queryParams = new URLSearchParams();
    queryParams.append('tenantSlug', tenantSlug);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.parserStatus) queryParams.append('parserStatus', params.parserStatus);
    if (params?.provider) queryParams.append('provider', params.provider);
    if (params?.linked) queryParams.append('linked', params.linked);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDir) queryParams.append('sortDir', params.sortDir);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    return requestJson<{
      success: boolean;
      documents: Array<{
        id: string;
        name: string;
        filename: string;
        original_filename?: string | null;
        created_at: string;
        updated_at?: string;
        uploadDate: string;
        status: string;
        processing_status?: string;
        parser_status?: string;
        parser_confidence?: number | null;
        parser_error?: string | null;
        extraction_signal_count?: number;
        source?: string | null;
        provider?: string | null;
        source_display?: string | null;
        content_type?: string | null;
        size_bytes?: number | null;
        supplier?: string | null;
        invoice?: string | null;
        amount?: number | null;
        parsedVia?: string | null;
        parsed_metadata?: any;
        extracted?: any;
        linked_case_count: number;
        linked_case_ids: string[];
        linked_case_refs: string[];
        strongest_match_confidence?: number | null;
        strongest_match_type?: string | null;
        linkage_strength: 'none' | 'weak' | 'strong';
        evidence_state: string;
        usable_as_evidence: boolean;
        usability_reason: string;
        needs_review: boolean;
      }>;
      metrics: {
        totalDocuments: number;
        filteredResults: number;
        parsed: number;
        matched: number;
        failed: number;
        needsReview: number;
      };
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalResults: number;
      };
      recentEvents: Array<{
        id: string;
        documentId: string;
        filename: string;
        eventType: string;
        timestamp: string;
        narrative: string;
      }>;
    }>(`/api/documents/inventory?${queryParams.toString()}`);
  },
  getDocument: (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocument");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<any>(`/api/documents/${encodeURIComponent(id)}?tenantSlug=${slug}`);
  },
  getDocumentDownloadUrl: (id: string) => buildApiUrl(`/api/documents/${encodeURIComponent(id)}/download`),
  getDocumentDownload: (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentDownload");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<{ url: string }>(`/api/documents/${encodeURIComponent(id)}/download?tenantSlug=${slug}`);
  },
  reparseDocument: (id: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for reparseDocument");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<any>(`/api/documents/${encodeURIComponent(id)}/reparse?tenantSlug=${slug}`, { method: 'POST' });
  },

  // PHASE4: Evidence ingestion endpoints (Node.js backend)
  // Gmail ingestion
  ingestGmailEvidence: (options?: { query?: string; maxResults?: number; autoParse?: boolean }) =>
    requestJson<{
      success: boolean;
      documentsIngested: number;
      emailsProcessed: number;
      errors: string[];
      message: string;
    }>('/api/evidence/ingest/gmail', {
      method: 'POST',
      body: JSON.stringify({
        query: options?.query || 'from:amazon.com OR from:amazon.co.uk OR subject:(invoice OR receipt OR "FBA" OR "reimbursement" OR "refund") has:attachment',
        maxResults: options?.maxResults || 50,
        autoParse: options?.autoParse !== false,
      }),
    }),
  // Outlook ingestion
  ingestOutlookEvidence: (options?: { query?: string; maxResults?: number; autoParse?: boolean }) =>
    requestJson<{
      success: boolean;
      documentsIngested: number;
      emailsProcessed: number;
      errors: string[];
      message: string;
    }>('/api/evidence/ingest/outlook', {
      method: 'POST',
      body: JSON.stringify({
        query: options?.query,
        maxResults: options?.maxResults || 50,
        autoParse: options?.autoParse !== false,
      }),
    }),
  // Google Drive ingestion
  ingestGoogleDriveEvidence: (options?: { query?: string; maxResults?: number; autoParse?: boolean; folderId?: string }) =>
    requestJson<{
      success: boolean;
      documentsIngested: number;
      filesProcessed: number;
      errors: string[];
      message: string;
    }>('/api/evidence/ingest/gdrive', {
      method: 'POST',
      body: JSON.stringify({
        query: options?.query,
        maxResults: options?.maxResults || 50,
        autoParse: options?.autoParse !== false,
        folderId: options?.folderId,
      }),
    }),
  // Dropbox ingestion
  ingestDropboxEvidence: (options?: { query?: string; maxResults?: number; autoParse?: boolean; folderPath?: string }) =>
    requestJson<{
      success: boolean;
      documentsIngested: number;
      filesProcessed: number;
      errors: string[];
      message: string;
    }>('/api/evidence/ingest/dropbox', {
      method: 'POST',
      body: JSON.stringify({
        query: options?.query,
        maxResults: options?.maxResults || 50,
        autoParse: options?.autoParse !== false,
        folderPath: options?.folderPath,
      }),
    }),
  // Unified ingestion - RECOMMENDED: Use this for all sources in parallel
  ingestAllEvidence: (options?: { providers?: string[]; query?: string; maxResults?: number; autoParse?: boolean; folderId?: string; folderPath?: string }, tenantSlug?: string) =>
    requestJson<{
      success: boolean;
      totalDocumentsIngested: number;
      totalItemsProcessed: number;
      errors: string[];
      results: {
        gmail?: { success: boolean; documentsIngested: number; emailsProcessed: number; errors: string[] };
        outlook?: { success: boolean; documentsIngested: number; emailsProcessed: number; errors: string[] };
        gdrive?: { success: boolean; documentsIngested: number; filesProcessed: number; errors: string[] };
        dropbox?: { success: boolean; documentsIngested: number; filesProcessed: number; errors: string[] };
      };
      message: string;
    }>(`/api/evidence/ingest/all${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
      method: 'POST',
      body: JSON.stringify({
        providers: options?.providers,
        query: options?.query,
        maxResults: options?.maxResults || 50,
        autoParse: options?.autoParse !== false,
        folderId: options?.folderId,
        folderPath: options?.folderPath,
      }),
    }),
  getEvidenceStatus: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getEvidenceStatus");
    return requestJson<{
      hasConnectedSource: boolean;
      lastIngestion?: string;
      documentsCount: number;
      processingCount: number;
    }>(`/api/evidence/status?tenantSlug=${tenantSlug}`);
  },
  // Evidence source management
  getEvidenceSources: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getEvidenceSources");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<{
      success: boolean;
      sources: Array<{
        id: string;
        provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
        account_email: string;
        status: 'connected' | 'disconnected' | 'error';
        last_sync_at: string | null;
        created_at: string;
        metadata: Record<string, any>;
      }>;
      count: number;
    }>(`/api/evidence/sources?tenantSlug=${slug}`);
  },
  getEvidenceSource: (id: string) => requestJson<{
    success: boolean;
    source: {
      id: string;
      provider: string;
      account_email: string;
      status: string;
      last_sync_at: string | null;
      created_at: string;
      metadata: Record<string, any>;
    };
  }>(`/api/evidence/sources/${encodeURIComponent(id)}`),
  getEvidenceSourceStatus: (id: string) => requestJson<{
    success: boolean;
    status: {
      connected: boolean;
      status: string;
      lastSync: string | null;
      hasToken: boolean;
      provider: string;
    };
  }>(`/api/evidence/sources/${encodeURIComponent(id)}/status`),
  disconnectEvidenceSource: (id: string) => requestJson<{
    success: boolean;
    message: string;
    source: {
      id: string;
      provider: string;
      status: 'disconnected';
    };
  }>(`/api/evidence/sources/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getMatchingMetrics: (days?: number) =>
    requestJson<{
      success: boolean;
      metrics: {
        total_matches: number;
        auto_submitted: number;
        smart_prompts: number;
        approved: number;
        rejected: number;
        pending: number;
      };
    }>(`/api/evidence/matching/metrics${days ? `?days=${days}` : ''}`),

  // PHASE3: Gmail integration endpoints
  getGmailStatus: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getGmailStatus");
    return requestJson<{
      connected: boolean;
      email: string | null;
      last_sync_at: string | null;
      error?: string;
      scopes?: string[];
    }>(`/api/v1/integrations/gmail/status?tenantSlug=${tenantSlug}`);
  },
  disconnectGmail: () => requestJson<any>('/api/v1/integrations/gmail/disconnect', { method: 'DELETE' }),

  // PHASE3: Document parsing endpoints (Python API)
  triggerDocumentParse: (documentId: string) =>
    requestJson<{
      job_id: string;
      status: string;
      message: string;
      estimated_completion?: string;
    }>(`/api/v1/evidence/parse/${encodeURIComponent(documentId)}`, { method: 'POST' }),
  getParserJobStatus: (jobId: string) =>
    requestJson<{
      id: string;
      document_id: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress?: number;
      confidence_score?: number;
      error?: string;
    }>(`/api/v1/evidence/parse/jobs/${encodeURIComponent(jobId)}`),
  getParserJobs: () => requestJson<{
    jobs: Array<{
      id: string;
      document_id: string;
      status: string;
      parser_type: string;
      confidence_score?: number;
    }>;
    total: number;
  }>('/api/v1/evidence/parse/jobs'),
  getDocumentWithParsedData: (documentId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentWithParsedData");
    return requestJson<{
      id: string;
      filename: string;
      original_filename?: string;
      processing_status: 'pending' | 'processing' | 'completed' | 'failed';
      parser_status?: 'pending' | 'processing' | 'completed' | 'failed';
      parser_confidence?: number | null;
      parser_error?: string | null;
      created_at?: string;
      updated_at?: string;
      content_type?: string;
      source?: string | null;
      provider?: string | null;
      seller_id?: string;
      parsed_metadata?: {
        supplier_name?: string;
        invoice_number?: string;
        invoice_date?: string;
        total_amount?: number;
        currency?: string;
        line_items?: Array<{
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
        }>;
        confidence_score?: number | null;
      };
      // Agent 5 extracted data from PDF/OCR
      extracted?: {
        order_ids?: string[];
        asins?: string[];
        skus?: string[];
        fnskus?: string[];
        tracking_numbers?: string[];
        amounts?: string[];
        invoice_numbers?: string[];
        dates?: string[];
        extraction_method?: string;
        extracted_at?: string;
      };
      raw_text_preview?: string;
    }>(`/api/v1/evidence/documents/${encodeURIComponent(documentId)}?tenantSlug=${tenantSlug}`);
  },
  getDocumentLinkedClaims: (documentId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentLinkedClaims");
    return requestJson<{
      success: boolean;
      documentId: string;
      linkedClaimCount: number;
      linkedClaims: Array<{
        claimId: string;
        claimNumber?: string;
        claimType: string;
        amount: number;
        currency: string;
        linkDate: string;
        matchType: string;
        confidence: number;
      }>;
      reuseMessage?: string | null;
    }>(`/api/evidence/documents/${encodeURIComponent(documentId)}/linked-claims?tenantSlug=${tenantSlug}`);
  },
  getDocumentAuditTrail: (documentId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentAuditTrail");
    return requestJson<{
      success: boolean;
      documentId: string;
      filename: string;
      events: Array<{
        id: string;
        documentId: string;
        eventType: string;
        timestamp: string;
        actor?: string;
        details?: Record<string, any>;
        narrative: string;
      }>;
      summary: {
        ingestedAt?: string;
        ingestedFrom?: string;
        parsedAt?: string;
        parserVersion?: string;
        linkedClaims: number;
        lastActivity: string;
      };
    }>(`/api/evidence/documents/${encodeURIComponent(documentId)}/audit?tenantSlug=${tenantSlug}`);
  },

  // Delete a single document
  deleteDocument: (documentId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for deleteDocument");
    return requestJson<{
      success: boolean;
      message: string;
      documentId: string;
    }>(`/api/v1/evidence/documents/${encodeURIComponent(documentId)}?tenantSlug=${tenantSlug}`, { method: 'DELETE' });
  },

  // Delete all documents for the current user
  deleteAllDocuments: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for deleteAllDocuments");
    return requestJson<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`/api/v1/evidence/documents?tenantSlug=${tenantSlug}`, { method: 'DELETE' });
  },

  searchDocuments: (filters?: {
    supplier_name?: string;
    invoice_number?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for searchDocuments");
    const params = new URLSearchParams();
    if (filters?.supplier_name) params.append('supplier_name', filters.supplier_name);
    if (filters?.invoice_number) params.append('invoice_number', filters.invoice_number);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.min_amount) params.append('min_amount', filters.min_amount.toString());
    if (filters?.max_amount) params.append('max_amount', filters.max_amount.toString());
    params.append('tenantSlug', tenantSlug);
    return requestJson<any[]>(`/api/v1/evidence/documents/search?${params.toString()}`);
  },

  // Integrations & Evidence ingestion controls
  getIntegrationsStatus: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getIntegrationsStatus");
    const slug = tenantSlug;
    return requestJson<{
      amazon_connected: boolean;
      docs_connected: boolean;
      lastSync?: string;
      lastIngest?: string;
      evidenceSettings?: {
        autoCollect: boolean;
        schedule: string;
        filters: Record<string, any>;
      };
      providers?: Record<string, {
        provider: string;
        source_id?: string;
        connected: boolean;
        auth_valid: boolean;
        needs_reconnect: boolean;
        last_ingest_at?: string;
        last_success_at?: string;
        error_state?: string;
        error_message?: string;
        ingestion_state: string;
        has_data: boolean;
        account_email?: string;
        scopes?: string[];
      }>;
      providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }>;
    }>(`/api/v1/integrations/status?tenantSlug=${slug}`);
  },

  // Phase 1: Amazon connection status check
  getAmazonConnectionStatus: async (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getAmazonConnectionStatus");
    const slug = tenantSlug;
    const statusResponse = await requestJson<{
      connected: boolean;
      sandboxMode?: boolean;
      useMockGenerator?: boolean;
      useMockData?: boolean;
      lastSync?: string;
      connectionVerified?: boolean;
    }>(`/api/v1/integrations/amazon/status?tenantSlug=${slug}`);

    if (statusResponse.ok && statusResponse.data) {
      return statusResponse;
    }

    const tenantStatusResponse = await requestJson<{
      amazon_connected: boolean;
      lastSync?: string;
      agent2_ready?: boolean;
    }>(`/api/v1/integrations/status?tenantSlug=${slug}`);

    if (!tenantStatusResponse.ok || !tenantStatusResponse.data) {
      return {
        ok: false,
        status: tenantStatusResponse.status || statusResponse.status,
        error: tenantStatusResponse.error || statusResponse.error || 'Failed to get Amazon connection status',
      };
    }

    return {
      ok: true,
      status: tenantStatusResponse.status,
      data: {
        connected: tenantStatusResponse.data.amazon_connected,
        sandboxMode: false,
        useMockGenerator: false,
        useMockData: false,
        lastSync: tenantStatusResponse.data.lastSync,
        connectionVerified: tenantStatusResponse.data.agent2_ready ?? tenantStatusResponse.data.amazon_connected,
      }
    };
  },

  // Phase 1: Fetch Claims (Financial Events)
  // Backend returns: { success: true, claims: [...], isMock?: boolean, mockScenario?: string, message?: string, ... }
  getAmazonClaims: (params?: {
    startDate?: string;
    endDate?: string;
  }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getAmazonClaims");
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      claims: Array<{
        id: string;
        orderId?: string;
        amount: number;
        status: string;
        type: string;
        currency: string;
        createdAt: string;
        description?: string;
        fromApi?: boolean;
        isMock?: boolean;
        mockScenario?: string;
      }>;
      // Also support legacy 'data' format for backward compatibility
      data?: Array<{
        id: string;
        orderId?: string;
        amount: number;
        status: string;
        type: string;
        currency: string;
        createdAt: string;
        description?: string;
        fromApi?: boolean;
        isMock?: boolean;
        mockScenario?: string;
      }>;
      isMock?: boolean;
      mockScenario?: string;
      message?: string;
      dataType?: string;
    }>(`/api/v1/integrations/amazon/claims${query ? `?${query}` : ''}`);
  },

  // Phase 1: Fetch Inventory
  // Backend returns: { success: true, inventory: [...], isMock?: boolean, mockScenario?: string, message?: string, ... }
  getAmazonInventory: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getAmazonInventory");
    const slug = tenantSlug;
    return requestJson<{
      success: boolean;
      inventory: Array<{
        sku: string;
        asin?: string;
        fnsku?: string;
        productName?: string;
        quantityAvailable?: number;
        quantityReserved?: number;
        quantityInbound?: number;
        quantityTotal?: number;
        condition?: string;
        warehouseLocation?: string;
        isMock?: boolean;
        mockScenario?: string;
      }>;
      // Also support legacy 'data' format for backward compatibility
      data?: Array<{
        sku: string;
        asin?: string;
        fnsku?: string;
        productName?: string;
        quantityAvailable?: number;
        quantityReserved?: number;
        quantityInbound?: number;
        quantityTotal?: number;
        condition?: string;
        warehouseLocation?: string;
        isMock?: boolean;
        mockScenario?: string;
      }>;
      isMock?: boolean;
      mockScenario?: string;
      message?: string;
      dataType?: string;
    }>(`/api/v1/integrations/amazon/inventory?tenantSlug=${slug}`);
  },

  // Phase 1: Fetch Orders (already exists but adding for consistency)
  // Note: getOrders already exists above, but this is the Phase 1 specific endpoint
  getAmazonOrdersPhase1: (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      data: Array<{
        id: string;
        order_id: string;
        order_date: string;
        order_status: string;
        fulfillment_channel: string;
        total_amount?: number;
        currency: string;
        items?: Array<{
          sku: string;
          asin: string;
          quantity: number;
          price: number;
        }>;
        isMock?: boolean;
        mockScenario?: string;
      }>;
      isMock?: boolean;
      mockScenario?: string;
      message?: string;
    }>(`/api/v1/integrations/amazon/orders${query ? `?${query}` : ''}`);
  },
  setEvidenceAutoCollect: (enabled: boolean) => requestJson<any>('/api/evidence/auto-collect', { method: 'POST', body: JSON.stringify({ enabled }) }),
  setEvidenceSchedule: (schedule: string) => requestJson<any>('/api/evidence/schedule', { method: 'POST', body: JSON.stringify({ schedule }) }),
  setEvidenceFilters: (filters: { 
    senderPatterns?: string[];
    excludeSenders?: string[];
    subjectKeywords?: string[];
    excludeSubjects?: string[];
    fileTypes?: { pdf: boolean; images: boolean; spreadsheets: boolean; docs: boolean; shipping: boolean }; 
    fileNamePatterns?: string[];
    folders?: string[];
    dateRange?: string;
    skipDuplicates?: boolean;
    skipExisting?: boolean;
  }, tenantSlug?: string) => requestJson<any>(`/api/evidence/filters${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, { method: 'POST', body: JSON.stringify(filters) }),
  // Legacy endpoint - now uses unified orchestrator
  startEvidenceIngest: () => requestJson<any>('/api/evidence/ingest/all', { method: 'POST', body: JSON.stringify({ maxResults: 50, autoParse: true }) }),
  disconnectIntegration: (provider: string, purge = false) =>
    requestJson<any>(
      `/api/v1/integrations/disconnect?provider=${encodeURIComponent(provider)}&purge=${purge ? 1 : 0}`,
      { method: 'POST' }
    ),
  getEvidenceSummary: () => requestJson<any>('/api/evidence/summary'),

  // Inventory/Sync summary endpoints (non-id based)
  getSyncStatus: (params?: { syncId?: string }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getSyncStatus");
    const queryParams = new URLSearchParams();
    if (params?.syncId) queryParams.append('syncId', params.syncId);
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<any>(`/api/sync/status${query ? `?${query}` : ''}`);
  },
  getSyncActivity: () => requestJson<any>('/api/sync/activity'),

  // Agent 3: Claim Detection endpoints
  runClaimDetection: (syncId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for runClaimDetection");
    return requestJson<{
      success: boolean;
      detectionId?: string;
      detection_id?: string;
      message?: string;
    }>(`/api/detections/run?tenantSlug=${tenantSlug}`, {
      method: 'POST',
      body: syncId ? JSON.stringify({ syncId }) : undefined,
    });
  },
  getDetectionStatus: (detectionId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDetectionStatus");
    return requestJson<{
      success: boolean;
      status: 'in_progress' | 'complete' | 'failed';
      detection_id: string;
      total_detected?: number;
      summary?: any;
    }>(`/api/detections/status/${encodeURIComponent(detectionId)}?tenantSlug=${tenantSlug}`);
  },

  // Agent 6: Evidence Matching endpoints
  runEvidenceMatching: (userId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for runEvidenceMatching");
    return requestJson<{
      success: boolean;
      jobId?: string;
      matches?: number;
      message?: string;
    }>('/api/evidence/matching/run', {
      method: 'POST',
      body: JSON.stringify({ userId, tenantSlug }),
    });
  },
  getMatchingResults: (params?: { userId?: string; claimId?: string; limit?: number; offset?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getMatchingResults");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.claimId) queryParams.append('claimId', params.claimId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      results: Array<{
        id: string;
        claim_id: string;
        document_id: string;
        confidence_score: number;
        match_type: string;
        action_taken: string;
        matched_fields?: string[];
        reasoning?: string;
        created_at?: string;
      }>;
      total: number;
    }>(`/api/evidence/matching/results${query ? `?${query}` : ''}`);
  },
  getDocumentMatchingResults: (documentId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDocumentMatchingResults");
    const slug = tenantSlug;
    if (!slug) throw new Error("Tenant slug required for scoped API call");
    return requestJson<{
      success: boolean;
      results: Array<any>;
      document_id: string;
    }>(`/api/evidence/matching/documents/${encodeURIComponent(documentId)}?tenantSlug=${slug}`);
  },
  getMatchingStatus: (jobId: string) => requestJson<{
    success: boolean;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    matches?: number;
    autoSubmitted?: number;
    smartPromptsCreated?: number;
  }>(`/api/evidence/matching/status/${encodeURIComponent(jobId)}`),

  // Agent 6: Smart Prompt actions for medium-confidence matches
  getSmartPrompts: (params?: { userId?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('actionTaken', 'smart_prompt'); // Filter only smart prompts
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      results: Array<{
        id: string;
        claim_id: string;
        document_id: string;
        confidence_score: number;
        match_type: string;
        action_taken: 'smart_prompt';
        matched_fields?: string[];
        reasoning?: string;
        created_at?: string;
        claim_details?: {
          type?: string;
          amount?: number;
          currency?: string;
          sku?: string;
          asin?: string;
        };
        document_details?: {
          filename?: string;
          supplier?: string;
          invoice_number?: string;
          amount?: number;
        };
      }>;
      total: number;
    }>(`/api/evidence/matching/results${query ? `?${query}` : ''}`);
  },
  approveSmartPrompt: (matchId: string, tenantSlug?: string) => requestJson<{
    success: boolean;
    message: string;
    caseId?: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/approve${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
    method: 'POST',
  }),
  rejectSmartPrompt: (matchId: string, reason?: string, tenantSlug?: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/reject${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  requestMoreEvidence: (matchId: string, tenantSlug?: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/request-more-evidence${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
    method: 'POST',
  }),

  // Agent 7: Refund Filing endpoints (dispute cases)
  getDisputeCases: (params?: { userId?: string; status?: string; limit?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDisputeCases");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      cases: Array<{
        id: string;
        case_number: string;
        claim_id: string;
        status: string;
        amount: number;
        currency: string;
        created_at: string;
        expected_payout_date?: string;
        expectedPayoutDate?: string;
      }>;
      total: number;
    }>(`/api/disputes?tenantSlug=${tenantSlug}${query ? `&${query}` : ''}`);
  },
  getDisputeCase: (caseId: string) => requestJson<{
    success: boolean;
    case: {
      id: string;
      case_number: string;
      claim_id: string;
      status: string;
      amount: number;
      currency: string;
      created_at: string;
      updated_at: string;
    };
  }>(`/api/disputes/${encodeURIComponent(caseId)}`),

  // Agent 8: Recoveries endpoints (additional methods)
  getRecoveryRecords: (params?: { userId?: string; status?: string; limit?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getRecoveryRecords");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      records: Array<{
        id: string;
        case_id: string;
        recovery_status: string;
        amount: number;
        currency: string;
        detected_at: string;
      }>;
      total: number;
    }>(`/api/recoveries/records?tenantSlug=${tenantSlug}${query ? `&${query}` : ''}`);
  },
  getReconciliationStatus: (recoveryId: string) => requestJson<{
    success: boolean;
    status: 'pending' | 'reconciled' | 'discrepancy';
    amount: number;
    expected_amount: number;
    discrepancy?: number;
  }>(`/api/recoveries/${encodeURIComponent(recoveryId)}/reconciliation`),

  // Agent 9: Billing endpoints
  getBillingTransactions: (params?: { userId?: string; status?: string; limit?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getBillingTransactions");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      transactions: Array<{
        id: string;
        recovery_id: string;
        amount: number;
        confirmed_recovered_amount: number;
        platform_fee: number;
        credit_applied: number;
        amount_due: number;
        credit_balance_remaining: number;
        seller_payout: number;
        status: string;
        paypal_invoice_id?: string | null;
        created_at: string;
      }>;
      total: number;
    }>(`/api/billing/transactions?tenantSlug=${tenantSlug}${query ? `&${query}` : ''}`);
  },
  getBillingInvoices: (params?: { userId?: string; limit?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getBillingInvoices");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      invoices: Array<{
        id: string;
        period_start: string;
        period_end: string;
        total_amount: number;
        confirmed_recovered_amount: number;
        platform_fee: number;
        credit_applied: number;
        amount_due: number;
        available_credit_balance: number;
        status: string;
        paypal_invoice_id?: string | null;
      }>;
      total: number;
    }>(`/api/billing/invoices${query ? `?${query}` : ''}`);
  },
  downloadInvoicePdf: async (invoiceId: string, tenantSlug?: string, userId?: string): Promise<void> => {
    if (!tenantSlug) throw new Error("tenantSlug required for downloadInvoicePdf");
    const queryParams = new URLSearchParams();
    queryParams.append('tenantSlug', tenantSlug);
    if (userId) queryParams.append('userId', userId);
    const query = queryParams.toString();
    const url = buildApiUrl(`/api/billing/invoices/${encodeURIComponent(invoiceId)}/pdf${query ? `?${query}` : ''}`);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice PDF');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
  getBillingStatus: (userId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getBillingStatus");
    const queryParams = new URLSearchParams();
    queryParams.append('tenantSlug', tenantSlug);
    if (userId) queryParams.append('userId', userId);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      status: {
        total_recovered: number;
        total_fees: number;
        total_credit_applied: number;
        total_amount_due: number;
        pending_billing: number;
        available_credit_balance: number;
        last_billing_date?: string;
        current_recovery_cycle_id?: string | null;
        current_recovery_cycle_type?: string | null;
        current_recovery_cycle_started_at?: string | null;
      };
    }>(`/api/billing/status?${query}`);
  },

  // Agent 10: Notifications endpoints
  getNotifications: (params?: { userId?: string; unreadOnly?: boolean; limit?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getNotifications");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        read: boolean;
        created_at: string;
      }>;
      total: number;
    }>(`/api/notifications?${query}`);
  },
  markNotificationRead: (notificationId: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for markNotificationRead");
    return requestJson<{
      success: boolean;
      message: string;
    }>(`/api/notifications/mark-read?tenantSlug=${tenantSlug}`, {
      method: 'POST',
      body: JSON.stringify({ notificationIds: notificationId })
    });
  },
  markAllNotificationsRead: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for markAllNotificationsRead");
    return requestJson<{
      success: boolean;
      message: string;
      meta: { count: number };
    }>(`/api/notifications/mark-all-read?tenantSlug=${tenantSlug}`, { method: 'POST' });
  },
  getUnreadCount: (userId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getUnreadCount");
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    queryParams.append('tenantSlug', tenantSlug);
    return requestJson<{
      success: boolean;
      count: number;
    }>(`/api/notifications/unread?${queryParams.toString()}`);
  },
  getNotificationPreferences: () => requestJson<{
    success: boolean;
    data: Record<string, { email: boolean; inApp: boolean }>;
  }>('/api/notifications/preferences'),
  saveNotificationPreferences: (preferences: Record<string, { email: boolean; inApp: boolean }>) =>
    requestJson<{ success: boolean; message: string }>('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),


  // Agent 11: Learning endpoints
  getLearningMetrics: (params?: { userId?: string; window?: '7d' | '30d' | '90d' }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.window) queryParams.append('window', params.window);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      metrics: {
        total_events: number;
        success_rate: number;
        improvement_rate: number;
        by_agent: Record<string, {
          events: number;
          success_rate: number;
        }>;
      };
    }>(`/api/learning/metrics${query ? `?${query}` : ''}`);
  },
  getLearningInsights: (params?: { userId?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      insights: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        impact: string;
        created_at: string;
      }>;
      total: number;
    }>(`/api/learning/insights${query ? `?${query}` : ''}`);
  },
  getThresholdOptimizations: (params?: { userId?: string; agent?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.agent) queryParams.append('agent', params.agent);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      optimizations: Array<{
        id: string;
        agent: string;
        threshold_type: string;
        old_value: number;
        new_value: number;
        improvement: number;
        created_at: string;
      }>;
      total: number;
    }>(`/api/learning/threshold-history${query ? `?${query}` : ''}`);
  },

  // Phase 2: Orders, Shipments, Returns, Settlements endpoints
  getOrders: (params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    fulfillmentChannel?: 'FBA' | 'FBM';
    limit?: number;
    offset?: number;
  }, tenantSlug?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fulfillmentChannel) queryParams.append('fulfillmentChannel', params.fulfillmentChannel);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (!tenantSlug) throw new Error("tenantSlug required for getOrders");
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<any>(`/api/v1/integrations/amazon/orders${query ? `?${query}` : ''}`);
  },

  getShipments: (params?: {
    userId?: string;
    orderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }, tenantSlug?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (!tenantSlug) throw new Error("tenantSlug required for getShipments");
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<any>(`/api/v1/integrations/amazon/shipments${query ? `?${query}` : ''}`);
  },

  getReturns: (params?: {
    userId?: string;
    orderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }, tenantSlug?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (!tenantSlug) throw new Error("tenantSlug required for getReturns");
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<any>(`/api/v1/integrations/amazon/returns${query ? `?${query}` : ''}`);
  },

  getSettlements: (params?: {
    userId?: string;
    orderId?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }, tenantSlug?: string) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (!tenantSlug) throw new Error("tenantSlug required for getSettlements");
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<any>(`/api/v1/integrations/amazon/settlements${query ? `?${query}` : ''}`);
  },

  // Trigger manual sync (Phase 1 - no body required, uses session auth)
  triggerSync: (params?: {
    userId?: string;
    syncTypes?: Array<'orders' | 'shipments' | 'returns' | 'settlements'>;
  }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for triggerSync");
    const slug = tenantSlug;
    const hasParams = params?.userId || params?.syncTypes;
    const body = hasParams
      ? JSON.stringify({
        ...(params?.userId && { userId: params.userId }),
        ...(params?.syncTypes && { syncTypes: params.syncTypes }),
        tenantSlug: slug
      })
      : JSON.stringify({ tenantSlug: slug }); // Send tenantSlug in body

    return requestJson<{
      success: boolean;
      syncId?: string;
      message: string;
      status?: 'in_progress' | 'running' | 'completed' | 'failed';
      estimatedDuration?: string;
      error?: string;
      existingSyncId?: string;
    }>(`/api/v1/integrations/amazon/sync?tenantSlug=${slug}`, {
      method: 'POST',
      body: body,
    });
  },

  // Get detailed sync status
  getSyncStatusDetailed: (params?: { userId?: string; syncId?: string }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getSyncStatusDetailed");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.syncId) queryParams.append('syncId', params.syncId);
    const slug = tenantSlug;
    queryParams.append('tenantSlug', slug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      status: 'running' | 'in_progress' | 'completed' | 'failed';
      syncId: string;
      progress: number;
      results: {
        orders?: { count: number; status: string };
        shipments?: { count: number; status: string };
        returns?: { count: number; status: string };
        settlements?: { count: number; status: string };
      };
      startedAt?: string;
      completedAt?: string;
      duration?: number;
    }>(`/api/v1/integrations/amazon/sync/status${query ? `?${query}` : ''}`);
  },

  // Admin: Users management
  getAdminUsers: () => requestJson<{
    success: boolean;
    users: Array<{
      id: string;
      email: string;
      role: 'user' | 'admin';
      status: 'active' | 'locked';
      created_at?: string;
      last_login?: string;
    }>;
  }>('/api/admin/users'),

  updateAdminUser: (userId: string, updates: { role?: string; status?: string }) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),

  impersonateUser: (userId: string) => requestJson<{
    success: boolean;
    token?: string;
    message: string;
  }>(`/api/admin/users/${encodeURIComponent(userId)}/impersonate`, { method: 'POST' }),
};

// Phase 3: Detection/Claims API methods
export const detectionApi = {
  // Get all detection results
  getDetectionResults: async (params?: { status?: string; limit?: number; offset?: number; userId?: string }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDetectionResults");
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      results: Array<{
        id: string;
        seller_id: string;
        sync_id: string;
        anomaly_type: string;
        severity: string;
        estimated_value: number;
        currency: string;
        confidence_score: number;
        evidence: any;
        status: string;
        discovery_date: string;
        deadline_date: string;
        days_remaining: number;
      }>;
      total: number;
    }>(`/api/detections/results${query ? `?${query}` : ''}`);
  },

  // Get detection statistics (full format from Phase 3 guide)
  getDetectionStatistics: async (userId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getDetectionStatistics");
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      statistics: {
        total_anomalies?: number;
        totalDetections?: number; // Fallback for backward compatibility
        total_value?: number;
        estimatedRecovery?: number; // Fallback
        by_severity?: {
          high?: { count: number; value: number };
          medium?: { count: number; value: number };
          low?: { count: number; value: number };
        };
        by_type?: Record<string, { count: number; value: number }>;
        by_confidence?: {
          high: number;
          medium: number;
          low: number;
        };
        highConfidence?: number; // Fallback
        mediumConfidence?: number; // Fallback
        lowConfidence?: number; // Fallback
        expiring_soon?: number;
        expired_count?: number;
        averageConfidence?: number;
      };
    }>(`/api/detections/statistics${query ? `?${query}` : ''}`);
  },

  // Get confidence distribution
  getConfidenceDistribution: async (userId?: string, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getConfidenceDistribution");
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      distribution: {
        total_detections: number;
        by_confidence: {
          high: number;
          medium: number;
          low: number;
        };
        by_anomaly_type?: Record<string, {
          high: number;
          medium: number;
          low: number;
          total: number;
        }>;
        confidence_ranges?: Record<string, number>;
        recovery_rates?: {
          high: number;
          medium: number;
          low: number;
        };
        average_confidence: number;
      };
    }>(`/api/detections/confidence-distribution${query ? `?${query}` : ''}`);
  },

  // Resolve a detection
  resolveDetection: async (id: string, body: { notes?: string; resolution_amount?: number }) => {
    return requestJson<{
      success: boolean;
      message: string;
      detection: any;
    }>(`/api/detections/${encodeURIComponent(id)}/resolve`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Update detection status
  updateDetectionStatus: async (id: string, body: { status: string; notes?: string }) => {
    return requestJson<{
      success: boolean;
      message: string;
      detection: any;
    }>(`/api/detections/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Get timeline events for a claim
  getClaimTimeline: async (claimId: string, table: 'detection_results' | 'claims' = 'detection_results') => {
    return requestJson<{
      success: boolean;
      timeline: Array<{
        id: string;
        date: string;
        action: string;
        description: string;
        amount?: number;
        rejectionReason?: string;
        escalationRound?: number;
      }>;
      count: number;
    }>(`/api/claims/${encodeURIComponent(claimId)}/timeline?table=${table}`);
  },

  // Get claims approaching deadline
  getClaimsApproachingDeadline: async (params?: { userId?: string; days?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getClaimsApproachingDeadline");
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.days) queryParams.append('days', params.days.toString());
    else queryParams.append('days', '7'); // Default to 7 days
    queryParams.append('tenantSlug', tenantSlug);
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      claims: Array<{
        id: string;
        anomaly_type: string;
        estimated_value: number;
        days_remaining: number;
        deadline_date: string;
        severity: string;
        confidence_score: number;
      }>;
      count: number;
      threshold_days: number;
    }>(`/api/detections/deadlines${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: (params?: { unread_only?: boolean; limit?: number; offset?: number }, tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getNotifications");
    const query = new URLSearchParams();
    if (params?.unread_only) query.append('unread_only', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    query.append('tenantSlug', tenantSlug);
    return requestJson<{ success: boolean; data: any[]; meta: any }>(`/api/notifications?${query.toString()}`);
  },
  markNotificationsRead: (notificationIds: string[]) =>
    requestJson<{ success: boolean; data: any[] }>('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds })
    }),

  // Admin: Evidence collection settings
  getEvidenceSummary: () => requestJson<{
    success: boolean;
    autoCollect: boolean;
    schedule: string;
    lastRun?: string;
    totalDocuments?: number;
  }>('/api/admin/evidence/settings'),

  setEvidenceAutoCollect: (enabled: boolean, tenantSlug?: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/auto-collect${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
    method: 'POST',
    body: JSON.stringify({ enabled })
  }),

  setEvidenceSchedule: (schedule: string, tenantSlug?: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/schedule${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
    method: 'POST',
    body: JSON.stringify({ schedule })
  }),

  // Admin: Users management
  getAdminUsers: () => requestJson<{
    success: boolean;
    users: Array<{
      id: string;
      email: string;
      role: 'user' | 'admin';
      status: 'active' | 'locked';
      created_at: string;
      last_login?: string;
    }>;
  }>('/api/admin/users'),

  updateAdminUser: (userId: string, updates: { role?: string; status?: string }) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  }),

  impersonateUser: (userId: string) => requestJson<{
    success: boolean;
    token?: string;
    message: string;
  }>(`/api/admin/users/${encodeURIComponent(userId)}/impersonate`, { method: 'POST' }),
  // Store Management
  getStores: (tenantSlug?: string) => {
    if (!tenantSlug) throw new Error("tenantSlug required for getStores");
    return requestJson<{ success: boolean; stores: any[] }>(`/api/v1/stores?tenantSlug=${tenantSlug}`);
  },
  createStore: (data: { name: string; marketplace: string; seller_id?: string }, tenantSlug?: string) =>
    requestJson<{ success: boolean; store: any }>(`/api/v1/stores${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteStore: (id: string, tenantSlug?: string) => requestJson<{ success: boolean }>(`/api/v1/stores/${encodeURIComponent(id)}${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`, { method: 'DELETE' }),
  getStore: (id: string, tenantSlug?: string) => requestJson<{ success: boolean; store: any }>(`/api/v1/stores/${encodeURIComponent(id)}${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ''}`),


  getRevenueInvoices: (params?: { status?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    const qs = q.toString();
    return requestJson<{ success: boolean; data: { invoices: any[]; total: number } }>(`/api/revenue/invoices${qs ? `?${qs}` : ''}`);
  },

  getRevenueMetrics: () =>
    requestJson<{ success: boolean; data: any }>('/api/revenue/metrics'),

  getVaultSetupToken: () => requestJson<{ success: boolean; setupToken: any }>('/api/revenue/vault/setup', { method: 'POST' }),
  
  finalizeVaulting: (setupTokenId: string, sellerId: string) => 
    requestJson<{ success: boolean; paymentTokenId: string; paypalEmail?: string }>('/api/revenue/vault/finalize', {
      method: 'POST',
      body: JSON.stringify({ setupTokenId, sellerId })
    }),
};
