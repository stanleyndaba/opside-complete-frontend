export type PendingYocoCheckoutContext = {
  kind?: 'recovery_scan' | 'subscription' | 'invoice' | string;
  offer?: string | null;
  plan?: string | null;
  price?: string | null;
  tenantSlug?: string | null;
  invoiceId?: string | null;
  returnPath?: string | null;
  checkoutUrl?: string | null;
};

const STORAGE_PREFIX = 'pending_yoco_';

function safeLocalPath(value?: string | null): string | null {
  const path = String(value || '').trim();
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  if (/^\/\\/.test(path)) return null;
  return path;
}

function setStorageValue(key: string, value?: string | null) {
  if (typeof window === 'undefined') return;
  const normalized = String(value || '').trim();
  if (!normalized) {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return;
  }
  window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, normalized);
}

export function storePendingYocoCheckoutContext(context: PendingYocoCheckoutContext) {
  if (typeof window === 'undefined') return;

  setStorageValue('kind', context.kind);
  setStorageValue('offer', context.offer);
  setStorageValue('plan', context.plan);
  setStorageValue('price', context.price);
  setStorageValue('tenant_slug', context.tenantSlug);
  setStorageValue('invoice_id', context.invoiceId);
  setStorageValue('return_path', safeLocalPath(context.returnPath));
  setStorageValue('checkout_url', context.checkoutUrl);
  setStorageValue('started_at', new Date().toISOString());
}

export function getPendingYocoCheckoutContext(): PendingYocoCheckoutContext {
  if (typeof window === 'undefined') return {};
  return {
    kind: window.localStorage.getItem(`${STORAGE_PREFIX}kind`) || undefined,
    offer: window.localStorage.getItem(`${STORAGE_PREFIX}offer`),
    plan: window.localStorage.getItem(`${STORAGE_PREFIX}plan`),
    price: window.localStorage.getItem(`${STORAGE_PREFIX}price`),
    tenantSlug: window.localStorage.getItem(`${STORAGE_PREFIX}tenant_slug`),
    invoiceId: window.localStorage.getItem(`${STORAGE_PREFIX}invoice_id`),
    returnPath: safeLocalPath(window.localStorage.getItem(`${STORAGE_PREFIX}return_path`)),
    checkoutUrl: window.localStorage.getItem(`${STORAGE_PREFIX}checkout_url`),
  };
}

export function buildPaymentSuccessUrl(context: PendingYocoCheckoutContext = {}): string {
  if (typeof window === 'undefined') return '/payment/success';

  const url = new URL('/payment/success', window.location.origin);
  url.searchParams.set('source', 'yoco');

  if (context.kind) url.searchParams.set('kind', context.kind);
  if (context.offer) url.searchParams.set('offer', context.offer);
  if (context.plan) url.searchParams.set('plan', context.plan);
  if (context.price) url.searchParams.set('price', context.price);
  if (context.tenantSlug) url.searchParams.set('tenant', context.tenantSlug);
  if (context.invoiceId) url.searchParams.set('invoice', context.invoiceId);
  const returnPath = safeLocalPath(context.returnPath);
  if (returnPath) url.searchParams.set('return', returnPath);

  return url.toString();
}

export function buildYocoCheckoutUrl(rawUrl: string, context: PendingYocoCheckoutContext = {}): string {
  const checkoutUrl = String(rawUrl || '').trim();
  if (!checkoutUrl || typeof window === 'undefined') return checkoutUrl;

  const storedContext = { ...context, checkoutUrl };
  storePendingYocoCheckoutContext(storedContext);

  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('redirectOnPaymentSuccess', buildPaymentSuccessUrl(storedContext));
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

export function getSafeYocoReturnPath(value?: string | null): string | null {
  return safeLocalPath(value);
}
