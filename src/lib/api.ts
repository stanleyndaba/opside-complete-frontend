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
  const productionBackend = 'https://opside-node-api-woco.onrender.com';

  // List of deprecated/old backend URLs that should be rejected
  const deprecatedBackends = [
    'clario-complete-backend-y5cd.onrender.com',
    'https://opside-node-api-woco.onrender.com',
  ];

  // Check for environment variable override (Vite exposes VITE_ prefixed vars via import.meta.env)
  // In Vite, environment variables are available at build time and are injected into the bundle
  // Support both VITE_INTEGRATIONS_URL (for Vite) and NEXT_PUBLIC_INTEGRATIONS_URL (for compatibility)
  let envBase: string | undefined;

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Vite environment variables are directly on import.meta.env
    // Check for integrations URL first (Phase 1 requirement), then fall back to API base URL
    envBase = import.meta.env.VITE_INTEGRATIONS_URL ||
      import.meta.env.NEXT_PUBLIC_INTEGRATIONS_URL ||
      import.meta.env.VITE_API_BASE_URL;
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
    // In development, use localhost:3001 (backend port) or env var override
    const devBackend = envBase && envBase.includes('localhost') ? envBase : 'http://localhost:3001';
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
        // Get user ID from localStorage (set by SessionContext) or fallback to demo-user
        // This allows API calls to work with the actual authenticated user
        'x-user-id': localStorage.getItem('user_id') || 'demo-user',
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
  getUserProfile: () => requestJson<{
    success: boolean;
    user: {
      id: string;
      email?: string;
      amazon_seller_id?: string;
      seller_id?: string;
      company_name?: string;
      created_at: string;
    };
  }>('/api/auth/me'),
  logout: () => requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  postLoginStripe: () => requestJson<any>('/api/auth/post-login/stripe', { method: 'POST' }),

  // Amazon SP-API endpoints (Step 1 Auth Process)
  connectAmazon: async (bypassOAuth = false) => {
    // Step 1: Call /auth/start to get OAuth URL
    // Get current frontend URL and pass it to backend for OAuth redirect configuration
    // Backend needs this to know where to redirect after OAuth completes
    // This handles Vercel preview deployments where the URL changes each deploy
    const frontendUrl = getFrontendUrl();
    const bypassParam = bypassOAuth ? '&bypass=true' : '';
    const response = await requestJson<{
      auth_url?: string;
      authUrl?: string;
      state?: string;
      success?: boolean;
      message?: string;
    }>(`/api/v1/integrations/amazon/auth/start?redirect_uri=${encodeURIComponent(frontendUrl)}/auth/callback&frontend_url=${encodeURIComponent(frontendUrl)}${bypassParam}`);

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

  // Use existing Amazon connection (bypass OAuth if refresh token exists)
  useExistingAmazonConnection: async () => {
    // Call the OAuth start endpoint with bypass=true to use existing refresh token
    const frontendUrl = getFrontendUrl();
    const response = await requestJson<{
      auth_url?: string;
      authUrl?: string;
      state?: string;
      success?: boolean;
      message?: string;
      bypassed?: boolean;
      redirectUrl?: string;
    }>(`/api/v1/integrations/amazon/auth/start?redirect_uri=${encodeURIComponent(frontendUrl)}/auth/callback&frontend_url=${encodeURIComponent(frontendUrl)}&bypass=true`);

    // If bypass worked, backend returns JSON with bypassed: true and redirectUrl
    // If not, we'll get the OAuth URL as fallback
    if (response.ok && response.data) {
      // Handle bypass response
      if (response.data.bypassed && response.data.redirectUrl) {
        return response;
      }

      // Handle OAuth URL fallback
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
        console.log(`[API] Backend URL: ${buildApiUrl('/api/v1/integrations/amazon/recoveries')}`);
        const backendPromise = requestJson<{ totalAmount: number; currency: string; claimCount: number }>('/api/v1/integrations/amazon/recoveries');

        let response: any;
        try {
          response = await Promise.race([backendPromise, timeoutPromise]);
        } catch (raceError: any) {
          // Promise.race will reject if timeoutPromise rejects first
          if (raceError?.message?.includes('timeout') || raceError?.message?.includes('Backend timeout')) {
            throw new Error('Backend timeout - using mock data');
          }
          throw raceError;
        }
        const backendEndTime = performance.now();
        const backendDuration = backendEndTime - backendStartTime;

        console.log(`[API] Backend request completed in ${backendDuration}ms`);
        console.log(`[API] Backend response:`, response);

        // Backend returns {success: true, recoveries: {...}} - extract recoveries
        // Handle both structures: {recoveries: {...}} or direct {...}
        let recoveryData = response?.data;
        if (recoveryData?.recoveries) {
          // Backend wraps data in 'recoveries' object
          recoveryData = recoveryData.recoveries;
          console.log(`[API] Extracted recoveries from nested structure:`, recoveryData);
        }

        // Always use backend data if available, even if zeros (to show sync messages)
        // Only fall back to mock data if backend request failed
        if (response?.ok && recoveryData) {
          console.log(`[API] ✅ USING REAL BACKEND DATA (${backendDuration}ms):`, recoveryData);
          console.log(`[API] 📊 Source: ${recoveryData.source || recoveryData.dataSource || 'SP-API Sandbox Backend'}`);
          // Pass through all fields from backend (including message, needsSync, syncTriggered, source, dataSource)
          return {
            ...response,
            data: {
              totalAmount: recoveryData.totalAmount ?? 0,
              currency: recoveryData.currency ?? 'USD',
              claimCount: recoveryData.claimCount ?? 0,
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
        const backendEndTime = performance.now();
        const backendDuration = backendEndTime - backendStartTime;
        console.error(`[API] ❌ Backend request FAILED in sandbox mode (took ${backendDuration}ms)`);
        console.error(`[API] Error details:`, {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
          response: error?.response,
          status: error?.status,
          statusText: error?.statusText
        });
        console.error(`[API] Full error object:`, error);

        // If it's a timeout, show that clearly
        if (error?.message?.includes('timeout')) {
          console.error(`[API] ⏱️ BACKEND TIMEOUT: Backend took longer than 3 seconds to respond`);
          console.error(`[API] 💡 SOLUTION: Backend needs to respond faster or increase timeout`);
        }

        // If it's a network error
        if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
          console.error(`[API] 🌐 NETWORK ERROR: Cannot reach backend`);
          console.error(`[API] 💡 SOLUTION: Check backend URL and CORS configuration`);
        }

        // If it's a 401
        if (error?.status === 401 || error?.response?.status === 401) {
          console.error(`[API] 🔒 AUTH ERROR: Backend returned 401 Unauthorized`);
          console.error(`[API] 💡 SOLUTION: Check authentication cookie/session`);
        }

        // If it's a 404
        if (error?.status === 404 || error?.response?.status === 404) {
          console.error(`[API] 📍 NOT FOUND: Endpoint /api/v1/integrations/amazon/recoveries doesn't exist`);
          console.error(`[API] 💡 SOLUTION: Backend needs to implement this endpoint`);
        }

        // If it's a 500
        if (error?.status === 500 || error?.response?.status === 500) {
          console.error(`[API] 💥 SERVER ERROR: Backend returned 500 Internal Server Error`);
          console.error(`[API] 💡 SOLUTION: Check backend logs for error details`);
        }
      }

      // Only use mock data if backend request completely failed (not just zeros)
      // If backend returned zeros with sync info, we should show that instead
      const mockStartTime = performance.now();
      console.log('[API] 🎭 Backend request failed or timed out - Using MOCK DATA for Amazon recoveries (sandbox mode)');
      const { mockAmazonApi } = await import('./mockApi');
      const mockData = mockAmazonApi.getRecoveries();
      const totalTime = performance.now() - startTime;
      console.log(`[API] Mock data loaded in ${performance.now() - mockStartTime}ms, total time: ${totalTime}ms`);
      console.log(`[API] 📊 Mock data values:`, mockData);
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

    // Production mode: try backend normally with timing
    const prodStartTime = performance.now();
    console.log('[API] Production mode - calling backend');
    const response = await requestJson<{
      totalAmount: number;
      currency: string;
      claimCount: number;
      source?: string;
      dataSource?: string;
      message?: string;
      needsSync?: boolean;
      syncTriggered?: boolean;
      recoveries?: {
        totalAmount: number;
        currency: string;
        claimCount: number;
        source?: string;
        dataSource?: string;
        message?: string;
        needsSync?: boolean;
        syncTriggered?: boolean;
      };
    }>('/api/v1/integrations/amazon/recoveries');
    const prodDuration = performance.now() - prodStartTime;
    console.log(`[API] Production backend request took ${prodDuration}ms`);

    // Backend returns {success: true, recoveries: {...}} - extract recoveries
    // Handle both structures: {recoveries: {...}} or direct {...}
    let recoveryData = response?.data;
    if (recoveryData?.recoveries) {
      // Backend wraps data in 'recoveries' object
      recoveryData = recoveryData.recoveries;
      console.log(`[API] Extracted recoveries from nested structure:`, recoveryData);
    }

    // Always return backend data if available (even if zeros), to show sync messages
    if (response.ok && recoveryData) {
      // Pass through all fields from backend (including message, needsSync, syncTriggered, source, dataSource)
      return {
        ...response,
        data: {
          totalAmount: recoveryData.totalAmount ?? 0,
          currency: recoveryData.currency ?? 'USD',
          claimCount: recoveryData.claimCount ?? 0,
          source: recoveryData.source,
          dataSource: recoveryData.dataSource,
          message: recoveryData.message,
          needsSync: recoveryData.needsSync,
          syncTriggered: recoveryData.syncTriggered,
        }
      };
    }

    // Return the original response (even if it failed or returned zeros)
    if (recoveryData && recoveryData !== response.data) {
      // We extracted recoveries, normalize the response with all fields
      return {
        ...response,
        data: {
          totalAmount: recoveryData.totalAmount ?? 0,
          currency: recoveryData.currency ?? 'USD',
          claimCount: recoveryData.claimCount ?? 0,
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

  // Auth-adjacent helpers for flows
  connectDocs: (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => {
    // Use the /auth endpoint for OAuth initiation
    // Backend routes: /api/v1/integrations/{provider}/auth returns { authUrl, state }
    const frontendUrl = getFrontendUrl();
    return requestJson<{ success?: boolean; authUrl?: string; auth_url?: string; state?: string; message?: string; sandbox?: boolean }>(
      `/api/v1/integrations/${encodeURIComponent(provider)}/auth?frontend_url=${encodeURIComponent(frontendUrl)}`,
      { method: 'GET' }
    ).then(response => {
      // Normalize auth_url to authUrl for consistency
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
  startAmazonSync: () => requestJson<{
    syncId?: string;
    sync_id?: string;
    status?: string;
    message?: string;
  }>('/api/sync/start', { method: 'POST' }),
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
  getDocumentDownload: (id: string) => requestJson<{ success: boolean; url: string; filename: string }>(`/api/documents/${encodeURIComponent(id)}/download`),
  reparseDocument: (id: string) => requestJson<{ success: boolean; message: string }>(`/api/documents/${encodeURIComponent(id)}/reparse`, { method: 'POST' }),

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
  ingestAllEvidence: (options?: { providers?: string[]; query?: string; maxResults?: number; autoParse?: boolean; folderId?: string; folderPath?: string }) =>
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
    }>('/api/evidence/ingest/all', {
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
  getEvidenceStatus: () => requestJson<{
    hasConnectedSource: boolean;
    lastIngestion?: string;
    documentsCount: number;
    processingCount: number;
  }>('/api/evidence/status'),
  // Evidence source management
  getEvidenceSources: () => requestJson<{
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
  }>('/api/evidence/sources'),
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
  getGmailStatus: () => requestJson<{
    connected: boolean;
    lastSync?: string;
    email?: string;
  }>('/api/v1/integrations/gmail/status'),
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
  getDocumentWithParsedData: (documentId: string) =>
    requestJson<{
      id: string;
      filename: string;
      processing_status: 'pending' | 'processing' | 'completed' | 'failed';
      parser_status?: 'pending' | 'processing' | 'completed' | 'failed';
      parser_confidence?: number;
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
        confidence_score?: number;
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
    }>(`/api/v1/evidence/documents/${encodeURIComponent(documentId)}`),

  // Delete a single document
  deleteDocument: (documentId: string) =>
    requestJson<{
      success: boolean;
      message: string;
      documentId: string;
    }>(`/api/v1/evidence/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' }),

  // Delete all documents for the current user
  deleteAllDocuments: () =>
    requestJson<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>('/api/v1/evidence/documents', { method: 'DELETE' }),

  searchDocuments: (filters?: {
    supplier_name?: string;
    invoice_number?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.supplier_name) params.append('supplier_name', filters.supplier_name);
    if (filters?.invoice_number) params.append('invoice_number', filters.invoice_number);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.min_amount) params.append('min_amount', filters.min_amount.toString());
    if (filters?.max_amount) params.append('max_amount', filters.max_amount.toString());
    return requestJson<any[]>(`/api/v1/evidence/documents/search?${params.toString()}`);
  },

  // Integrations & Evidence ingestion controls
  getIntegrationsStatus: () => requestJson<{
    amazon_connected: boolean;
    docs_connected: boolean;
    lastSync?: string;
    lastIngest?: string;
    providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }>;
  }>('/api/v1/integrations/status'),

  // Phase 1: Amazon connection status check
  getAmazonConnectionStatus: () => requestJson<{
    connected: boolean;
    sandboxMode?: boolean;
    useMockGenerator?: boolean;
    useMockData?: boolean;
    lastSync?: string;
    connectionVerified?: boolean;
  }>('/api/v1/integrations/amazon/status'),

  // Phase 1: Fetch Claims (Financial Events)
  // Backend returns: { success: true, claims: [...], isMock?: boolean, mockScenario?: string, message?: string, ... }
  getAmazonClaims: (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
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
  getAmazonInventory: () => requestJson<{
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
  }>('/api/v1/integrations/amazon/inventory'),

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
  setEvidenceFilters: (filters: { includeSenders?: string[]; excludeSenders?: string[]; fileTypes?: string[]; folders?: string[] }) => requestJson<any>('/api/evidence/filters', { method: 'POST', body: JSON.stringify(filters) }),
  // Legacy endpoint - now uses unified orchestrator
  startEvidenceIngest: () => requestJson<any>('/api/evidence/ingest/all', { method: 'POST', body: JSON.stringify({ maxResults: 50, autoParse: true }) }),
  disconnectIntegration: (provider: string, purge = false) =>
    requestJson<any>(
      `/api/v1/integrations/disconnect?provider=${encodeURIComponent(provider)}&purge=${purge ? 1 : 0}`,
      { method: 'POST' }
    ),
  getEvidenceSummary: () => requestJson<any>('/api/evidence/summary'),

  // Inventory/Sync summary endpoints (non-id based)
  getSyncStatus: (params?: { syncId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.syncId) queryParams.append('syncId', params.syncId);
    const query = queryParams.toString();
    return requestJson<any>(`/api/sync/status${query ? `?${query}` : ''}`);
  },
  getSyncActivity: () => requestJson<any>('/api/sync/activity'),

  // Agent 3: Claim Detection endpoints
  runClaimDetection: (syncId?: string) => requestJson<{
    success: boolean;
    detectionId?: string;
    detection_id?: string;
    message?: string;
  }>('/api/detections/run', {
    method: 'POST',
    body: syncId ? JSON.stringify({ syncId }) : undefined,
  }),
  getDetectionStatus: (detectionId: string) => requestJson<{
    success: boolean;
    status: 'in_progress' | 'complete' | 'failed';
    detection_id: string;
    total_detected?: number;
    summary?: any;
  }>(`/api/detections/status/${encodeURIComponent(detectionId)}`),

  // Agent 6: Evidence Matching endpoints
  runEvidenceMatching: (userId?: string) => requestJson<{
    success: boolean;
    jobId?: string;
    matches?: number;
    message?: string;
  }>('/api/evidence/matching/run', {
    method: 'POST',
    body: userId ? JSON.stringify({ userId }) : undefined,
  }),
  getMatchingResults: (params?: { userId?: string; claimId?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.claimId) queryParams.append('claimId', params.claimId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
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
  getDocumentMatchingResults: (documentId: string) => {
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
      document_id: string;
    }>(`/api/evidence/matching/results/by-document/${encodeURIComponent(documentId)}`);
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
  approveSmartPrompt: (matchId: string) => requestJson<{
    success: boolean;
    message: string;
    caseId?: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/approve`, {
    method: 'POST',
  }),
  rejectSmartPrompt: (matchId: string, reason?: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  requestMoreEvidence: (matchId: string) => requestJson<{
    success: boolean;
    message: string;
  }>(`/api/evidence/matching/${encodeURIComponent(matchId)}/request-more-evidence`, {
    method: 'POST',
  }),

  // Agent 7: Refund Filing endpoints (dispute cases)
  getDisputeCases: (params?: { userId?: string; status?: string; limit?: number }) => {
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
      }>;
      total: number;
    }>(`/api/disputes${query ? `?${query}` : ''}`);
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
  getRecoveryRecords: (params?: { userId?: string; status?: string; limit?: number }) => {
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
    }>(`/api/recoveries/records${query ? `?${query}` : ''}`);
  },
  getReconciliationStatus: (recoveryId: string) => requestJson<{
    success: boolean;
    status: 'pending' | 'reconciled' | 'discrepancy';
    amount: number;
    expected_amount: number;
    discrepancy?: number;
  }>(`/api/recoveries/${encodeURIComponent(recoveryId)}/reconciliation`),

  // Agent 9: Billing endpoints
  getBillingTransactions: (params?: { userId?: string; status?: string; limit?: number }) => {
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
        platform_fee: number;
        seller_payout: number;
        status: string;
        created_at: string;
      }>;
      total: number;
    }>(`/api/billing/transactions${query ? `?${query}` : ''}`);
  },
  getBillingInvoices: (params?: { userId?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return requestJson<{
      success: boolean;
      invoices: Array<{
        id: string;
        period_start: string;
        period_end: string;
        total_amount: number;
        platform_fee: number;
        status: string;
      }>;
      total: number;
    }>(`/api/billing/invoices${query ? `?${query}` : ''}`);
  },
  getBillingStatus: (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return requestJson<{
      success: boolean;
      status: {
        total_recovered: number;
        total_fees: number;
        pending_billing: number;
        last_billing_date?: string;
      };
    }>(`/api/billing/status${query}`);
  },

  // Agent 10: Notifications endpoints
  getNotifications: (params?: { userId?: string; unreadOnly?: boolean; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.limit) queryParams.append('limit', params.limit.toString());
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
    }>(`/api/notifications${query ? `?${query}` : ''}`);
  },
  markNotificationRead: (notificationId: string) => requestJson<{
    success: boolean;
    message: string;
  }>('/api/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notificationIds: notificationId })
  }),
  markAllNotificationsRead: () => requestJson<{
    success: boolean;
    message: string;
    meta: { count: number };
  }>('/api/notifications/mark-all-read', { method: 'POST' }),
  getUnreadCount: (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return requestJson<{
      success: boolean;
      count: number;
    }>(`/api/notifications/unread${query}`);
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
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fulfillmentChannel) queryParams.append('fulfillmentChannel', params.fulfillmentChannel);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
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
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
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
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
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
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.orderId) queryParams.append('orderId', params.orderId);
    if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    const query = queryParams.toString();
    return requestJson<any>(`/api/v1/integrations/amazon/settlements${query ? `?${query}` : ''}`);
  },

  // Trigger manual sync (Phase 1 - no body required, uses session auth)
  triggerSync: (params?: {
    userId?: string;
    syncTypes?: Array<'orders' | 'shipments' | 'returns' | 'settlements'>;
  }) => {
    // Phase 1 endpoint: POST /api/v1/integrations/amazon/sync
    // According to Phase 1 requirements (line 151-164), this should work with NO body
    // Uses session-based authentication via cookies
    // If backend requires body, we'll send minimal body
    const hasParams = params?.userId || params?.syncTypes;
    const body = hasParams
      ? JSON.stringify({
        ...(params?.userId && { userId: params.userId }),
        ...(params?.syncTypes && { syncTypes: params.syncTypes }),
      })
      : JSON.stringify({}); // Send empty body as per Phase 1 requirements

    return requestJson<{
      success: boolean;
      syncId?: string;
      message: string;
      status?: 'in_progress' | 'running' | 'completed' | 'failed';
      estimatedDuration?: string;
      error?: string;
      existingSyncId?: string;
    }>('/api/v1/integrations/amazon/sync', {
      method: 'POST',
      body: body,
    });
  },

  // Get detailed sync status
  getSyncStatusDetailed: (params?: { userId?: string; syncId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.syncId) queryParams.append('syncId', params.syncId);
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
};

// Phase 3: Detection/Claims API methods
export const detectionApi = {
  // Get all detection results
  getDetectionResults: async (params?: { status?: string; limit?: number; offset?: number; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
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
  getDetectionStatistics: async (userId?: string) => {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
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
  getConfidenceDistribution: async (userId?: string) => {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
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
  getClaimsApproachingDeadline: async (params?: { userId?: string; days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.days) queryParams.append('days', params.days.toString());
    else queryParams.append('days', '7'); // Default to 7 days
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
  getNotifications: (params?: { unread_only?: boolean; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.unread_only) query.append('unread_only', 'true');
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
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

  setEvidenceAutoCollect: (enabled: boolean) => requestJson<{
    success: boolean;
    message: string;
  }>('/api/admin/evidence/auto-collect', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  }),

  setEvidenceSchedule: (schedule: string) => requestJson<{
    success: boolean;
    message: string;
  }>('/api/admin/evidence/schedule', {
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
};
