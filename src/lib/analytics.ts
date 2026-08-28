import { ANALYTICS_EVENTS, type AnalyticsEventName } from './analyticsEvents';
import { DEMO_SESSION_TOKEN } from './demoSession';
import {
  hasAnalyticsConsent,
  subscribeToCookieConsent,
  type CookiePreferences,
} from './cookieConsent';

type GtagCommand = 'config' | 'event' | 'js' | string;

type GtagConfigParams = Record<string, unknown>;

type AnalyticsParams = Record<string, unknown>;

export const GA4_MEASUREMENT_ID = 'G-KKCKWRFS3H';
export const EARLY_ACCESS_OFFER = 'early_access';
export const EARLY_ACCESS_VALUE_ZAR = 1799;
export const EARLY_ACCESS_CURRENCY = 'ZAR';
export const PAYSTACK_PAYMENT_PROVIDER = 'paystack_payment_page';
export const PAYSTACK_CHECKOUT_URL_TYPE = 'external_paystack_payment_page';
export const PAYSTACK_EARLY_ACCESS_URL = 'https://paystack.shop/pay/margin-early-access';

const INTERNAL_TEST_STORAGE_KEY = 'margin_analytics_internal_test';
const ANALYTICS_DEBUG_STORAGE_KEY = 'margin_analytics_debug';
const FIRST_PARTY_QUEUE_STORAGE_KEY = 'margin_first_party_analytics_queue';
const ANALYTICS_ANONYMOUS_ID_STORAGE_KEY = 'margin_analytics_anonymous_id';
const ANALYTICS_SESSION_ID_STORAGE_KEY = 'margin_analytics_session_id';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const MAX_GTAG_RETRIES = 8;
const GTAG_RETRY_DELAY_MS = 250;
const MAX_FIRST_PARTY_QUEUE_SIZE = 40;

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
let isFlushingFirstPartyQueue = false;

function getGtag() {
  if (typeof window === 'undefined') return undefined;
  return window.gtag;
}

function syncInternalTestFlagFromLocation() {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const testFlag = params.get('test');
    const debugFlag = params.get('debug_analytics');

    if (testFlag === '0' || debugFlag === '0') {
      window.localStorage.removeItem(INTERNAL_TEST_STORAGE_KEY);
      window.localStorage.removeItem(ANALYTICS_DEBUG_STORAGE_KEY);
      return;
    }

    if (testFlag === '1') {
      window.localStorage.setItem(INTERNAL_TEST_STORAGE_KEY, '1');
      return;
    }

    if (debugFlag === '1') {
      window.localStorage.setItem(INTERNAL_TEST_STORAGE_KEY, '1');
      window.localStorage.setItem(ANALYTICS_DEBUG_STORAGE_KEY, '1');
    }
  } catch {
    // Analytics must never interrupt the page.
  }
}

export function isInternalAnalyticsTest() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(INTERNAL_TEST_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function isAnalyticsDebugEnabled() {
  if (import.meta.env?.DEV) return true;
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(ANALYTICS_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function getCurrentPath() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

function getTrafficSourceHint(searchParams: URLSearchParams) {
  const source = searchParams.get('utm_source');
  const medium = searchParams.get('utm_medium');
  const campaign = searchParams.get('utm_campaign');

  if (source || medium || campaign) {
    return [source, medium, campaign].filter(Boolean).join(' / ');
  }

  if (typeof document === 'undefined' || !document.referrer) return undefined;

  try {
    return `referrer:${new URL(document.referrer).hostname}`;
  } catch {
    return 'referrer:unknown';
  }
}

function createClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getStoredClientId(storage: Storage | undefined, key: string) {
  if (!storage) return createClientId();

  try {
    const existing = storage.getItem(key);
    if (existing) return existing;

    const nextId = createClientId();
    storage.setItem(key, nextId);
    return nextId;
  } catch {
    return createClientId();
  }
}

function getEmailDomain(value?: string | null) {
  const email = String(value || '').trim().toLowerCase();
  const domain = email.split('@')[1];
  return domain || undefined;
}

function getFirstPartyMetricsEndpoint() {
  if (typeof window === 'undefined') return '';

  const productionBackend = 'https://opside-node-api-woco.onrender.com';
  const envBase = import.meta.env?.VITE_INTEGRATIONS_URL ||
    import.meta.env?.NEXT_PUBLIC_INTEGRATIONS_URL ||
    import.meta.env?.VITE_API_BASE_URL;

  const isViteDev = import.meta.env?.DEV === true &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (isViteDev) return '/api/metrics/track';
  if (envBase && String(envBase).trim()) {
    return `${String(envBase).trim().replace(/\/$/, '')}/api/metrics/track`;
  }

  return `${productionBackend}/api/metrics/track`;
}

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export function buildAnalyticsContext(params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return cleanParams(params);

  syncInternalTestFlagFromLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const utmParams = Object.fromEntries(
    UTM_KEYS.map((key) => [key, searchParams.get(key) || undefined])
  );

  return cleanParams({
    page_path: params.page_path || getCurrentPath(),
    page_title: params.page_title || document.title,
    page_location: params.page_location || window.location.href,
    traffic_source_hint: params.traffic_source_hint || getTrafficSourceHint(searchParams),
    ...utmParams,
    ...(isInternalAnalyticsTest() ? { is_internal_test: true } : {}),
    ...params,
  });
}

function logAnalyticsDebug(kind: 'page_view' | 'event', name: string, params: AnalyticsParams) {
  if (!isAnalyticsDebugEnabled()) return;

  if (kind === 'page_view') {
    console.info('[GA4] page_view sent', params);
    return;
  }

  console.info(`[GA4] event sent: ${name}`, params);
}

function logFirstPartyDebug(name: string, params: AnalyticsParams) {
  if (!isAnalyticsDebugEnabled()) return;
  console.info(`[Analytics] first-party event queued: ${name}`, params);
}

function getFirstPartyIdentityContext() {
  if (typeof window === 'undefined') return {};

  try {
    const userEmail = window.localStorage.getItem('user_email');
    const sessionToken = window.localStorage.getItem('session_token');

    return cleanParams({
      anonymous_id: getStoredClientId(window.localStorage, ANALYTICS_ANONYMOUS_ID_STORAGE_KEY),
      analytics_session_id: getStoredClientId(window.sessionStorage, ANALYTICS_SESSION_ID_STORAGE_KEY),
      user_id: window.localStorage.getItem('user_id'),
      user_email_domain: getEmailDomain(userEmail),
      active_tenant_slug: window.localStorage.getItem('active_tenant_slug'),
      is_demo_session: sessionToken === DEMO_SESSION_TOKEN,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      language: window.navigator.language,
      referrer: document.referrer || undefined,
    });
  } catch {
    return {};
  }
}

function buildFirstPartyPayload(eventName: string, params: AnalyticsParams) {
  return {
    name: eventName,
    payload: cleanParams({
      ...getFirstPartyIdentityContext(),
      ...params,
      event_name: eventName,
      event_id: createClientId(),
      client_event_time: new Date().toISOString(),
      user_agent: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
    }),
  };
}

export function buildFirstPartyAnalyticsPayload(eventName: string, params: AnalyticsParams = {}) {
  return buildFirstPartyPayload(eventName, buildAnalyticsContext(params));
}

function readFirstPartyQueue() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(FIRST_PARTY_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_FIRST_PARTY_QUEUE_SIZE) : [];
  } catch {
    return [];
  }
}

function writeFirstPartyQueue(events: unknown[]) {
  if (typeof window === 'undefined') return;

  try {
    const boundedEvents = events.slice(-MAX_FIRST_PARTY_QUEUE_SIZE);
    window.localStorage.setItem(FIRST_PARTY_QUEUE_STORAGE_KEY, JSON.stringify(boundedEvents));
  } catch {
    // Analytics must never interrupt the page.
  }
}

function enqueueFirstPartyEvent(payload: ReturnType<typeof buildFirstPartyPayload>) {
  const queued = readFirstPartyQueue();
  queued.push(payload);
  writeFirstPartyQueue(queued);
}

function postFirstPartyPayload(payload: ReturnType<typeof buildFirstPartyPayload>, allowQueue = true) {
  if (typeof window === 'undefined') return;

  const endpoint = getFirstPartyMetricsEndpoint();
  if (!endpoint) return;

  const body = JSON.stringify(payload);
  logFirstPartyDebug(payload.name, payload.payload);

  if (navigator.sendBeacon) {
    const queued = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    if (queued) return;
  }

  void fetch(endpoint, {
    method: 'POST',
    credentials: 'omit',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body,
  }).then((response) => {
    if (!response.ok && allowQueue) {
      enqueueFirstPartyEvent(payload);
    }
  }).catch(() => {
    if (allowQueue) {
      enqueueFirstPartyEvent(payload);
    }
  });
}

function flushFirstPartyAnalyticsQueue() {
  if (typeof window === 'undefined' || isFlushingFirstPartyQueue) return;

  const queued = readFirstPartyQueue();
  if (!queued.length) return;

  isFlushingFirstPartyQueue = true;
  writeFirstPartyQueue([]);
  queued.forEach((payload) => {
    if (payload && typeof payload === 'object' && 'name' in payload && 'payload' in payload) {
      postFirstPartyPayload(payload as ReturnType<typeof buildFirstPartyPayload>, false);
    }
  });
  window.setTimeout(() => {
    isFlushingFirstPartyQueue = false;
  }, 1000);
}

function trackFirstPartyEvent(eventName: string, params: AnalyticsParams) {
  flushFirstPartyAnalyticsQueue();
  postFirstPartyPayload(buildFirstPartyPayload(eventName, params));
}

function sendGa4Event(eventName: string, params: AnalyticsParams, attempt = 0) {
  if (typeof window === 'undefined') return;

  const gtag = getGtag();
  if (gtag) {
    gtag('event', eventName, params);
    logAnalyticsDebug(eventName === 'page_view' ? 'page_view' : 'event', eventName, params);
    return;
  }

  if (attempt >= MAX_GTAG_RETRIES) return;

  window.setTimeout(() => {
    sendGa4Event(eventName, params, attempt + 1);
  }, GTAG_RETRY_DELAY_MS);
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  if (!path || lastTrackedPageView === path) return;

  syncInternalTestFlagFromLocation();

  const params = buildAnalyticsContext({
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });

  lastTrackedPageView = path;
  sendGa4Event('page_view', params);
  trackFirstPartyEvent('page_view', params);
}

export function trackEvent(eventName: AnalyticsEventName | string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;

  const eventParams = buildAnalyticsContext(params);
  sendGa4Event(eventName, eventParams);
  trackFirstPartyEvent(eventName, eventParams);
}

export function trackEarlyAccessCtaClicked(params: AnalyticsParams = {}) {
  trackEvent(ANALYTICS_EVENTS.earlyAccessCtaClicked, {
    offer: EARLY_ACCESS_OFFER,
    destination: '/early-access',
    ...params,
  });
}

export function trackClaimAccessClicked(params: AnalyticsParams = {}) {
  trackEvent(ANALYTICS_EVENTS.claimAccessClicked, {
    offer: EARLY_ACCESS_OFFER,
    value: EARLY_ACCESS_VALUE_ZAR,
    currency: EARLY_ACCESS_CURRENCY,
    ...params,
  });
}

export function trackCheckoutStarted(params: AnalyticsParams = {}) {
  trackEvent(ANALYTICS_EVENTS.checkoutStarted, {
    offer: EARLY_ACCESS_OFFER,
    value: EARLY_ACCESS_VALUE_ZAR,
    currency: EARLY_ACCESS_CURRENCY,
    payment_provider: PAYSTACK_PAYMENT_PROVIDER,
    checkout_url_type: PAYSTACK_CHECKOUT_URL_TYPE,
    ...params,
  });
}

function clearFirstPartyAnalyticsQueue() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(FIRST_PARTY_QUEUE_STORAGE_KEY);
  } catch {
    // Consent must never interrupt the page.
  }
}

function updateGoogleConsent(preferences: CookiePreferences) {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('consent', 'update', {
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
  });
}

if (typeof window !== 'undefined') {
  subscribeToCookieConsent((preferences) => {
    updateGoogleConsent(preferences);

    if (!preferences.analytics) {
      clearFirstPartyAnalyticsQueue();
      return;
    }

    trackPageView(`${window.location.pathname}${window.location.search}`);
  });
}

export function trackOutboundPaymentClicked(params: AnalyticsParams = {}) {
  trackEvent(ANALYTICS_EVENTS.outboundPaymentClicked, {
    offer: EARLY_ACCESS_OFFER,
    value: EARLY_ACCESS_VALUE_ZAR,
    currency: EARLY_ACCESS_CURRENCY,
    payment_provider: PAYSTACK_PAYMENT_PROVIDER,
    ...params,
  });
}
