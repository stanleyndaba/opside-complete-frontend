/**
 * Centralized route utility for tenant-aware navigation
 */

/**
 * Generates a tenant-prefixed route
 * @param tenantSlug The current tenant slug
 * @param path The relative path (e.g., '/dashboard' or 'dashboard')
 * @returns The full tenant-prefixed path (e.g., '/app/beta/dashboard')
 */
export const tenantRoute = (tenantSlug: string, path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Public routes or already prefixed routes should not be changed
    if (path.startsWith('/auth') || path.startsWith('/app/')) {
        return path;
    }

    return `/app/${tenantSlug}${cleanPath}`;
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
};
