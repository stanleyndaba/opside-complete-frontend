/**
 * useTenantNavigation - Hook for tenant-scoped navigation
 *
 * Provides navigation functions that automatically include the current tenant slug.
 * Use this instead of useNavigate for in-app navigation.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useCallback } from 'react';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';

/**
 * Hook that provides tenant-aware navigation functions
 */
export function useTenantNavigation() {
    const navigate = useNavigate();
    const { tenantSlug } = useParams<{ tenantSlug?: string }>();
    const { tenant } = useTenant();

    // Get current tenant slug from URL or context
    const currentTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

    /**
     * Navigate to a tenant-scoped path
     * @param path - Path without tenant prefix (e.g., '/recoveries', '/settings')
     * @param options - Navigation options
     */
    const navigateTo = useCallback(
        (path: string, options?: { replace?: boolean; state?: any }) => {
            // Handle paths that should not be tenant-scoped (public routes, auth routes)
            const publicPaths = ['/', '/about', '/careers', '/docs', '/privacy', '/terms', '/contact', '/sales', '/developer-api'];
            const isPublicPath = publicPaths.includes(path) || path.startsWith('/auth/');

            if (isPublicPath) {
                navigate(path, options);
            } else {
                // Ensure path doesn't already have tenant prefix
                const cleanPath = path.startsWith('/app/') ? path.replace(/^\/app\/[^\/]+/, '') : path;
                const tenantPath = tenantRoute(currentTenantSlug, cleanPath);
                navigate(tenantPath, options);
            }
        },
        [navigate, currentTenantSlug]
    );

    /**
     * Get tenant-scoped URL for a path
     * @param path - Path without tenant prefix
     */
    const getTenantPath = useCallback(
        (path: string): string => {
            const publicPaths = ['/', '/about', '/careers', '/docs', '/privacy', '/terms', '/contact', '/sales', '/developer-api'];
            if (publicPaths.includes(path) || path.startsWith('/auth/')) {
                return path;
            }
            const cleanPath = path.startsWith('/app/') ? path.replace(/^\/app\/[^\/]+/, '') : path;
            return tenantRoute(currentTenantSlug, cleanPath);
        },
        [currentTenantSlug]
    );

    /**
     * Navigate to dashboard
     */
    const goToDashboard = useCallback(
        (options?: { replace?: boolean }) => {
            navigateTo('', options);
        },
        [navigateTo]
    );

    /**
     * Navigate to recoveries
     */
    const goToRecoveries = useCallback(
        (options?: { replace?: boolean; state?: any }) => {
            navigateTo('/recoveries', options);
        },
        [navigateTo]
    );

    return {
        navigate: navigateTo,
        getTenantPath,
        goToDashboard,
        goToRecoveries,
        currentTenantSlug
    };
}

export default useTenantNavigation;
