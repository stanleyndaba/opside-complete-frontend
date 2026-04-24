export type RequestFailureKind = 'server' | 'timeout' | 'network' | 'cors';

function normalizeMethod(method?: string | null) {
  return String(method || 'GET').trim().toUpperCase();
}

function isReadMethod(method?: string | null) {
  const normalized = normalizeMethod(method);
  return normalized === 'GET' || normalized === 'HEAD';
}

export function getGentleRequestErrorMessage(kind: RequestFailureKind, method?: string | null) {
  const read = isReadMethod(method);

  if (kind === 'timeout') {
    return read
      ? 'This page is taking a little longer than usual to load. Please refresh in a moment.'
      : 'That request is taking a little longer than usual. Please try again in a moment.';
  }

  if (kind === 'network') {
    return read
      ? 'We could not load the latest data right now. Please check your connection and refresh in a moment.'
      : 'We could not complete that right now. Please check your connection and try again in a moment.';
  }

  return read
    ? 'Margin is having trouble reaching live data right now. Please refresh in a moment.'
    : 'Margin could not complete that just now. Please try again in a moment.';
}

export function isLikelyCorsTransportError(errorMessage: string, url: string) {
  const normalized = String(errorMessage || '').toLowerCase();

  if (
    normalized.includes('cors') ||
    normalized.includes('access-control') ||
    normalized.includes('cross-origin')
  ) {
    return true;
  }

  if (normalized.includes('failed to fetch') && typeof window !== 'undefined') {
    try {
      return window.location.origin !== new URL(url, window.location.origin).origin;
    } catch {
      return false;
    }
  }

  return false;
}
