const INTERNAL_ORIGIN = 'https://margin.invalid';
const MAX_REDIRECT_LENGTH = 1_000;

function decodePathForValidation(value: string): string | null {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }

  return decoded;
}

/**
 * Returns a canonical same-origin application destination, or null. Query
 * parameters can provide context but never change the destination's origin.
 */
export function getSafeInternalNavigationPath(value: unknown): string | null {
  const raw = typeof value === 'string' ? value : '';
  if (!raw || raw !== raw.trim() || raw.length > MAX_REDIRECT_LENGTH || /[\u0000-\u001F\u007F]/.test(raw)) {
    return null;
  }

  const decoded = decodePathForValidation(raw);
  if (!decoded || /[\\\u0000-\u001F\u007F]/.test(decoded)) {
    return null;
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    /%(?:2f|5c)/i.test(decoded) ||
    /^\/[a-z][a-z0-9+.-]*:/i.test(decoded)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(decoded, INTERNAL_ORIGIN);
  } catch {
    return null;
  }

  if (parsed.origin !== INTERNAL_ORIGIN || parsed.hash) {
    return null;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function safeInternalNavigationOr(value: unknown, fallback: string): string {
  return getSafeInternalNavigationPath(value) || fallback;
}
