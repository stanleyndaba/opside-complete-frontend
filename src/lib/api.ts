const DEFAULT_TIMEOUT_MS = Number((import.meta as any).env?.VITE_API_TIMEOUT_MS || 15000);
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

export type ApiErrorShape = {
  message: string;
  code?: string | number;
  details?: unknown;
  status?: number;
};

export class ApiError extends Error {
  public status?: number;
  public code?: string | number;
  public details?: unknown;

  constructor(err: ApiErrorShape) {
    super(err.message);
    this.name = "ApiError";
    this.status = err.status;
    this.code = err.code;
    this.details = err.details;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, abortController: AbortController): Promise<T> {
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);
  return promise.finally(() => clearTimeout(timeout));
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options?: { timeoutMs?: number; retries?: number; backoffMs?: number }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.retries ?? 0;
  const backoffMs = options?.backoffMs ?? 400;

  const headers = new Headers(init.headers || {});
  const token = localStorage.getItem("auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && typeof init.body !== "string") {
    headers.set("Content-Type", "application/json");
  }

  async function doFetchWithRetry(): Promise<Response> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await fetch(`${API_BASE_URL}${path}`, {
          ...init,
          headers,
          signal: controller.signal,
          credentials: "include",
        });
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
        attempt++;
      }
    }
  }

  let pendingRefresh: Promise<string> | null = (window as any).__pending_token_refresh__ || null;
  const request = (async () => {
    let res = await doFetchWithRetry();
    if (res.status === 401) {
      try {
        if (!pendingRefresh) {
          const { refreshToken } = await import("@/lib/auth");
          pendingRefresh = refreshToken();
          (window as any).__pending_token_refresh__ = pendingRefresh;
        }
        const newToken = await pendingRefresh;
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await doFetchWithRetry();
        // clear refresh after success
        (window as any).__pending_token_refresh__ = null;
      } catch (_) {
        // clear and let below handle persistent 401
        (window as any).__pending_token_refresh__ = null;
      }
    }
    return res;
  })().then(async (res) => {
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      if (res.status === 401) {
        try {
          const { logout } = await import("@/lib/auth");
          logout();
        } catch {}
      }
      const apiErr: ApiErrorShape = {
        message: (isJson && body && (body.message || body.error)) || res.statusText || "Request failed",
        status: res.status,
        code: isJson ? (body.code ?? res.status) : res.status,
        details: isJson ? body : undefined,
      };
      throw new ApiError(apiErr);
    }
    return body as T;
  });

  return withTimeout(request, timeoutMs, controller);
}

export function getQueryHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function toDate(value: unknown): Date | null {
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) return value;
  return null;
}

export function mapDates<T extends object>(obj: T, keys: (keyof T)[]): T {
  const clone = { ...obj } as any;
  for (const key of keys) {
    clone[key as string] = toDate(clone[key as string]);
  }
  return clone as T;
}

