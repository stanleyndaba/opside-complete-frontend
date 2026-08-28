export const SUPPORTED_OAUTH_PROVIDERS = [
  'amazon',
  'gmail',
  'outlook',
  'gdrive',
  'dropbox',
  'slack',
  'adobe_sign',
  'onedrive',
  'quickbooks',
  'xero',
] as const;

export type SupportedOAuthProvider = typeof SUPPORTED_OAUTH_PROVIDERS[number];

export type ProviderConnectionStatus = {
  connected?: boolean;
  auth_valid?: boolean;
  needs_reconnect?: boolean;
};

export type IntegrationStatusForCallback = {
  amazon_connected?: boolean;
  providers?: Record<string, ProviderConnectionStatus | undefined>;
};

export type ProviderConnectionContext = {
  provider: string | null;
  supported: boolean;
  source: 'provider' | 'connected_marker' | 'provider_marker' | 'fallback' | 'none';
};

export type ProviderConnectionResolution = ProviderConnectionContext & {
  confirmed: boolean;
};

const PROVIDER_MARKER_KEYS: Array<[string, SupportedOAuthProvider]> = [
  ['gmail_connected', 'gmail'],
  ['outlook_connected', 'outlook'],
  ['gdrive_connected', 'gdrive'],
  ['dropbox_connected', 'dropbox'],
  ['quickbooks_connected', 'quickbooks'],
  ['xero_connected', 'xero'],
  ['slack_connected', 'slack'],
  ['adobe_sign_connected', 'adobe_sign'],
  ['onedrive_connected', 'onedrive'],
  ['amazon_connected', 'amazon'],
];

export function normalizeCallbackProvider(value: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function isSupportedOAuthProvider(provider: string): provider is SupportedOAuthProvider {
  return (SUPPORTED_OAUTH_PROVIDERS as readonly string[]).includes(provider);
}

/**
 * Reads a provider identifier from browser callback context. It deliberately
 * does not infer a successful connection from any URL value or marker.
 */
export function getProviderConnectionContext(
  search: string | URLSearchParams,
  fallbackProvider: string | null = null,
): ProviderConnectionContext {
  const params = typeof search === 'string'
    ? new URLSearchParams(search)
    : search;
  const explicitProvider = normalizeCallbackProvider(params.get('provider'));
  if (explicitProvider) {
    return {
      provider: explicitProvider,
      supported: isSupportedOAuthProvider(explicitProvider),
      source: 'provider',
    };
  }

  const connectedMarkerProvider = normalizeCallbackProvider(params.get('connected'));
  if (connectedMarkerProvider) {
    return {
      provider: connectedMarkerProvider,
      supported: isSupportedOAuthProvider(connectedMarkerProvider),
      source: 'connected_marker',
    };
  }

  for (const [marker, provider] of PROVIDER_MARKER_KEYS) {
    if (params.has(marker)) {
      return {
        provider,
        supported: true,
        source: 'provider_marker',
      };
    }
  }

  const normalizedFallback = normalizeCallbackProvider(fallbackProvider);
  if (normalizedFallback) {
    return {
      provider: normalizedFallback,
      supported: isSupportedOAuthProvider(normalizedFallback),
      source: 'fallback',
    };
  }

  return { provider: null, supported: false, source: 'none' };
}

/**
 * Browser callback/query values are context only. A provider becomes
 * confirmed only when tenant-scoped integration status names the same
 * provider as connected, valid, and not reconnect-required.
 */
export function hasAuthoritativeCallbackConfirmation(
  provider: string,
  status: IntegrationStatusForCallback | null | undefined,
): boolean {
  if (!isSupportedOAuthProvider(provider) || !status) return false;

  if (provider === 'amazon') {
    return status.amazon_connected === true;
  }

  const providerStatus = status.providers?.[provider];
  return Boolean(
    providerStatus?.connected
    && providerStatus.auth_valid
    && !providerStatus.needs_reconnect,
  );
}

/**
 * Resolves browser callback/marker context against canonical tenant-scoped
 * status. Consumers must use `confirmed`, never URL fields, for success UI,
 * analytics, markers, or automatic continuation.
 */
export function resolveProviderConnectionContext(
  search: string | URLSearchParams,
  status: IntegrationStatusForCallback | null | undefined,
  fallbackProvider: string | null = null,
): ProviderConnectionResolution {
  const context = getProviderConnectionContext(search, fallbackProvider);
  return {
    ...context,
    confirmed: Boolean(
      context.provider
      && context.supported
      && hasAuthoritativeCallbackConfirmation(context.provider, status),
    ),
  };
}
