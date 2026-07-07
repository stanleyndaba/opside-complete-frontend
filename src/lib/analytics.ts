type GtagCommand = 'config' | 'event' | 'js' | string;

type GtagConfigParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (
      command: GtagCommand,
      targetIdOrDate?: string | Date,
      params?: GtagConfigParams
    ) => void;
  }
}

let lastTrackedPageView: string | null = null;

function getGtag() {
  if (typeof window === 'undefined') return undefined;
  return window.gtag;
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  if (!path || lastTrackedPageView === path) return;

  const gtag = getGtag();
  if (!gtag) return;

  lastTrackedPageView = path;
  gtag('config', 'G-KKCKWRFS3H', {
    page_path: path,
  });
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', eventName, params);
}
