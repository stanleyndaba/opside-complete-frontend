import type { ErrorInfo } from 'react';

const CHUNK_RELOAD_PREFIX = 'margin:chunk-reload-attempted';
const RUNTIME_ERROR_LOG_KEY = 'margin:last-runtime-error';

function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  }

  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function isChunkLoadError(error: unknown): boolean {
  const text = getErrorText(error).toLowerCase();

  return [
    'chunkloaderror',
    'loading chunk',
    'failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'importing a module script failed',
    'failed to load module script',
    'dynamically imported module',
  ].some((pattern) => text.includes(pattern));
}

function getReloadKey(scope: string): string {
  const path = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}`
    : 'unknown';

  return `${CHUNK_RELOAD_PREFIX}:${scope}:${path}`;
}

export function shouldAutoReloadForChunkError(scope: string, error: unknown): boolean {
  if (typeof window === 'undefined') return false;
  if (!isChunkLoadError(error)) return false;

  const key = getReloadKey(scope);
  if (window.sessionStorage.getItem(key) === '1') return false;

  window.sessionStorage.setItem(key, '1');
  return true;
}

export function reportRuntimeError(scope: string, error: unknown, errorInfo?: ErrorInfo) {
  const payload = {
    scope,
    message: getErrorText(error).slice(0, 4000),
    componentStack: errorInfo?.componentStack?.slice(0, 4000) || null,
    path: typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    timestamp: new Date().toISOString(),
    chunkLoadError: isChunkLoadError(error),
  };

  console.error(`[RuntimeError:${scope}]`, payload);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RUNTIME_ERROR_LOG_KEY, JSON.stringify(payload));
    } catch {
      // Best-effort diagnostic breadcrumb only.
    }
  }
}

