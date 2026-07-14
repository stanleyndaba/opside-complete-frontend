import { ANALYTICS_EVENTS, type AnalyticsEventName } from './analyticsEvents';

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
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const MAX_GTAG_RETRIES = 8;
const GTAG_RETRY_DELAY_MS = 250;

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
  if (typeof window === 'undefined') return;
  if (!path || lastTrackedPageView === path) return;

  syncInternalTestFlagFromLocation();

  const params = buildAnalyticsContext({
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });

  lastTrackedPageView = path;
  sendGa4Event('page_view', params);
}

export function trackEvent(eventName: AnalyticsEventName | string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;

  const eventParams = buildAnalyticsContext(params);
  sendGa4Event(eventName, eventParams);
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

export function trackOutboundPaymentClicked(params: AnalyticsParams = {}) {
  trackEvent(ANALYTICS_EVENTS.outboundPaymentClicked, {
    offer: EARLY_ACCESS_OFFER,
    value: EARLY_ACCESS_VALUE_ZAR,
    currency: EARLY_ACCESS_CURRENCY,
    payment_provider: PAYSTACK_PAYMENT_PROVIDER,
    ...params,
  });
}
