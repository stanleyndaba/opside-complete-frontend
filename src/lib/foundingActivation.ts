type FoundingReservationRecord = {
  program: 'founding_500';
  status: 'reserved';
  source: string;
  confirmedAt: string;
};

export const FOUNDING_RESERVATION_KEY = 'margin_founding_500_reservation';
export const FOUNDING_ACTIVATION_STATUS_KEY = 'margin_founding_500_activation_status';

const PENDING_CHECKOUT_KEY = 'margin_pending_checkout';

function getStorageValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function parseJsonRecord(value: string | null): Record<string, unknown> | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function markFoundingReservationConfirmed(source = 'payment_success') {
  if (typeof window === 'undefined') return;

  const record: FoundingReservationRecord = {
    program: 'founding_500',
    status: 'reserved',
    source,
    confirmedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(FOUNDING_RESERVATION_KEY, JSON.stringify(record));
}

export function applyFoundingActivationState(state: { reserved?: boolean; activationReady?: boolean }) {
  if (typeof window === 'undefined') return;

  if (state.activationReady) {
    window.localStorage.setItem(FOUNDING_ACTIVATION_STATUS_KEY, 'activated');
    return;
  }

  if (state.reserved) {
    window.localStorage.removeItem(FOUNDING_ACTIVATION_STATUS_KEY);
    markFoundingReservationConfirmed('auth_bootstrap');
  }
}

export function hasFoundingReservationContext() {
  const reservation = parseJsonRecord(getStorageValue(FOUNDING_RESERVATION_KEY));
  if (reservation?.program === 'founding_500' && reservation?.status === 'reserved') {
    return true;
  }

  const pendingCheckout = parseJsonRecord(getStorageValue(PENDING_CHECKOUT_KEY));
  const pendingKind = String(pendingCheckout?.kind || '').toLowerCase();
  const pendingOffer = String(pendingCheckout?.offer || '').toLowerCase();

  return pendingKind.includes('early_access') || pendingOffer.includes('founding 500');
}

export function isFoundingActivationApproved() {
  return getStorageValue(FOUNDING_ACTIVATION_STATUS_KEY) === 'activated';
}

export function isFoundingReservedButNotActivated() {
  return hasFoundingReservationContext() && !isFoundingActivationApproved();
}

export function buildFoundingStatusPath(from?: string, tenantSlug?: string | null) {
  const params = new URLSearchParams();

  if (tenantSlug) {
    params.set('tenant', tenantSlug);
  }

  if (from) {
    params.set('from', from);
  }

  const query = params.toString();
  return query ? `/founding-500/status?${query}` : '/founding-500/status';
}
