/**
 * Centralized route utility for tenant-aware navigation
 */

const INVALID_TENANT_SLUGS = new Set(['default', 'beta', 'null', 'undefined']);

export const normalizeTenantSlug = (tenantSlug?: string | null): string | null => {
    const slug = String(tenantSlug || '').trim();
    if (!slug) return null;
    return INVALID_TENANT_SLUGS.has(slug.toLowerCase()) ? null : slug;
};

/**
 * Generates a tenant-prefixed route
 * @param tenantSlug The current tenant slug
 * @param path The relative path (e.g., '/dashboard' or 'dashboard')
 * @returns The full tenant-prefixed path (e.g., '/app/beta/dashboard')
 */
export const tenantRoute = (tenantSlug: string | null | undefined, path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Public routes or already prefixed routes should not be changed
    if (path.startsWith('/auth') || path.startsWith('/app/')) {
        return path;
    }

    const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
    if (!normalizedTenantSlug) {
        return cleanPath;
    }

    return `/app/${normalizedTenantSlug}${cleanPath}`;
};

/**
 * Common app routes
 */
export const ROUTES = {
    DASHBOARD: '/dashboard',
    RECOVERIES: '/recoveries',
    SYNC: '/sync',
    INTEGRATIONS: '/integrations',
    SETTINGS: '/settings',
    REPORTS: '/reports',
    BILLING: '/billing',
    TEAM: '/team',
    HELP: '/help',
    API: '/api-access',
    WHATS_NEW: '/whats-new',
    CASE_DETAIL: '/recoveries/:caseId',
    RESOLVE_CASE: '/resolve/:id',
    PRICING_ADJUST: '/pricing-adjust',
};
