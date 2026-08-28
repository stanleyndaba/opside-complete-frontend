export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_CONSENT_STORAGE_KEY = 'Margin.cookieConsent';
export const COOKIE_CONSENT_CHANGED_EVENT = 'margin:cookie-consent-changed';

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  analytics: false,
  marketing: false,
};

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
      return null;
    }

    return {
      analytics: parsed.analytics,
      marketing: parsed.marketing,
    };
  } catch {
    try {
      window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    } catch {
      // Consent must never interrupt the page.
    }
    return null;
  }
}

export function hasAnalyticsConsent() {
  return readCookiePreferences()?.analytics === true;
}

export function saveCookiePreferences(preferences: CookiePreferences) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Consent must remain usable even when browser storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent<CookiePreferences>(COOKIE_CONSENT_CHANGED_EVENT, {
    detail: preferences,
  }));
}

export function subscribeToCookieConsent(listener: (preferences: CookiePreferences) => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handleChange = (event: Event) => {
    const preferences = (event as CustomEvent<CookiePreferences>).detail;
    if (preferences && typeof preferences.analytics === 'boolean' && typeof preferences.marketing === 'boolean') {
      listener(preferences);
    }
  };

  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleChange);
  return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleChange);
}
