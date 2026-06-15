/**
 * TenantContext - Multi-tenant SaaS context provider
 * 
 * Provides tenant/workspace context to all components.
 * Handles tenant resolution, switching, and permission checks.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { api } from '@/lib/api';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { useSession } from '@/contexts/SessionContext';
import { DEMO_TENANT, DEMO_TENANT_SLUG, ensureDemoSessionForDemoWorkspace, isDemoSessionActive } from '@/lib/demoSession';

/**
 * Get the stored tenant slug from localStorage
 */
export const getStoredTenantSlug = (): string | null => {
    const storedSlug = normalizeTenantSlug(localStorage.getItem('active_tenant_slug'));
    if (!storedSlug) {
        localStorage.removeItem('active_tenant_slug');
    }
    return storedSlug;
};

/**
 * Tenant information
 */
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'trialing' | 'suspended' | 'read_only' | 'canceled' | 'deleted';
    role: 'owner' | 'admin' | 'member' | 'viewer';
}

/**
 * Plan limits based on subscription tier
 */
export interface PlanLimits {
    maxAmazonAccounts: number;
    maxMonthlyRecoveries: number;
    maxEvidenceDocs: number;
    autoFilingEnabled: boolean;
    apiAccessEnabled: boolean;
    supportTier: 'community' | 'email' | 'priority' | 'dedicated';
}

/**
 * Tenant context value
 */
interface TenantContextType {
    // Current tenant
    tenant: Tenant | null;
    tenants: Tenant[];

    // Loading state
    isLoading: boolean;
    error: string | null;

    // Actions
    switchTenant: (tenantIdOrSlug: string) => Promise<void>;
    refreshTenant: () => Promise<void>;

    // Permissions
    canWrite: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    isReady: boolean;
    isThrottled: boolean;
    hasRole: (roles: Array<'owner' | 'admin' | 'member' | 'viewer'>) => boolean;

    // Plan limits
    planLimits: PlanLimits | null;
    isUnlimited: (limit: keyof PlanLimits) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Default plan limits
 */
const DEFAULT_LIMITS: PlanLimits = {
    maxAmazonAccounts: 1,
    maxMonthlyRecoveries: 10,
    maxEvidenceDocs: 50,
    autoFilingEnabled: false,
    apiAccessEnabled: false,
    supportTier: 'community'
};

const DEMO_LIMITS: PlanLimits = {
    maxAmazonAccounts: 1,
    maxMonthlyRecoveries: -1,
    maxEvidenceDocs: -1,
    autoFilingEnabled: false,
    apiAccessEnabled: true,
    supportTier: 'priority'
};

interface TenantProviderProps {
    children: ReactNode;
}

/**
 * TenantProvider component
 */
export function TenantProvider({ children }: TenantProviderProps) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { tenantSlug: paramsSlug } = useParams<{ tenantSlug?: string }>();
    const { isAuthReady, isSessionValid, authToken } = useSession();

    // Fallback: Parse slug from URL if useParams is empty (occurs if provider is outside Routes)
    const tenantSlug = useMemo(() => {
        if (paramsSlug) return normalizeTenantSlug(paramsSlug);
        const match = location.pathname.match(/^\/app\/([^\/]+)/);
        return match ? normalizeTenantSlug(match[1]) : null;
    }, [paramsSlug, location.pathname]);
    const isAppRoute = location.pathname.startsWith('/app');

    const applyDemoTenantContext = useCallback(() => {
        setTenant(DEMO_TENANT);
        setTenants([DEMO_TENANT]);
        setPlanLimits(DEMO_LIMITS);
        setError(null);
        setIsThrottled(false);
        localStorage.setItem('active_tenant_id', DEMO_TENANT.id);
        localStorage.setItem('active_tenant_slug', DEMO_TENANT.slug);
        setIsLoading(false);
        setIsReady(true);
    }, []);

    /**
     * Load current tenant context
     */
    const loadTenantContext = useCallback(async () => {
        if (!isAppRoute) {
            setIsLoading(false);
            setIsReady(true);
            setError(null);
            return;
        }

        if (!isAuthReady) {
            setIsReady(false);
            return;
        }

        if ((ensureDemoSessionForDemoWorkspace() || isDemoSessionActive()) && (!tenantSlug || tenantSlug === DEMO_TENANT_SLUG)) {
            applyDemoTenantContext();
            return;
        }

        if (!isSessionValid || !authToken) {
            setIsLoading(false);
            setIsReady(true);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch tenant info. If tenantSlug is in URL, fetch that specific one.
            // Otherwise, get current based on session/storage.
            const url = tenantSlug ? `/api/tenant/current?tenantSlug=${tenantSlug}` : '/api/tenant/current';
            const currentResponse = await api.get(url);

            let fetchedTenantForRecovery: Tenant | null = null;

            if (currentResponse.data.success && currentResponse.data.tenant) {
                const fetchedTenant = currentResponse.data.tenant;
                fetchedTenantForRecovery = fetchedTenant;
                setTenant(fetchedTenant);
                // Persist to localStorage for API header usage
                localStorage.setItem('active_tenant_id', fetchedTenant.id);
                localStorage.setItem('active_tenant_slug', fetchedTenant.slug);
            } else if (tenantSlug) {
                // If specific slug requested but not found/accessible
                setError('Workspace not found or access denied');
            }

            // Get all user's tenants
            const listResponse = await api.get('/api/tenant/list');
            if (listResponse.data.success) {
                const tenantList = listResponse.data.tenants || [];
                setTenants(tenantList);

                if (!fetchedTenantForRecovery && tenantList.length > 0) {
                    fetchedTenantForRecovery = tenantList[0];
                    setTenant(tenantList[0]);
                    localStorage.setItem('active_tenant_id', tenantList[0].id);
                    localStorage.setItem('active_tenant_slug', tenantList[0].slug);
                }
            }

            const invalidRouteSlug = paramsSlug && !normalizeTenantSlug(paramsSlug) && location.pathname.startsWith('/app/');
            const missingWorkspaceRoute = location.pathname === '/app' || location.pathname === '/app/';
            const recoveryTenantSlug = fetchedTenantForRecovery?.slug || null;

            if ((invalidRouteSlug || missingWorkspaceRoute) && recoveryTenantSlug) {
                const correctedPath = invalidRouteSlug
                    ? location.pathname.replace(/^\/app\/[^\/]+/, `/app/${recoveryTenantSlug}`)
                    : tenantRoute(recoveryTenantSlug, '/dashboard');
                const fullPath = invalidRouteSlug
                    ? `${correctedPath}${location.search}${location.hash}`
                    : correctedPath;
                if (fullPath !== `${location.pathname}${location.search}${location.hash}`) {
                    navigate(fullPath, { replace: true });
                }
            }

            // Get plan limits
            const planResponse = await api.get('/api/tenant/plan');
            if (planResponse.data.success) {
                setPlanLimits(planResponse.data.limits);
                
                // Check for tenant-level throttles (e.g. from session or backend)
                if (planResponse.data.is_throttled || planResponse.data.throttle_active) {
                    setIsThrottled(true);
                }
            }
        } catch (err: any) {
            console.error('Failed to load tenant context:', err);
            setError(err.response?.data?.error || 'Failed to load workspace');
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, [applyDemoTenantContext, authToken, isAppRoute, isAuthReady, isSessionValid, location.hash, location.pathname, location.search, navigate, paramsSlug, tenantSlug]);

    /**
     * Handle URL-based tenant switching
     */
    useEffect(() => {
        if (isReady && tenantSlug && tenant && tenant.slug !== tenantSlug) {
            // URL has different tenant than current - switch
            switchTenant(tenantSlug);
        }
    }, [tenantSlug, tenant, isReady]);

    /**
     * Initial load
     */
    useEffect(() => {
        loadTenantContext();
    }, [loadTenantContext]);

    /**
     * Switch to a different tenant
     */
    const switchTenant = useCallback(async (tenantIdOrSlug: string) => {
        if ((ensureDemoSessionForDemoWorkspace() || isDemoSessionActive()) && normalizeTenantSlug(tenantIdOrSlug) === DEMO_TENANT_SLUG) {
            applyDemoTenantContext();
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSlug);

            const response = await api.post('/api/tenant/switch', {
                ...(isUuid ? { tenantId: tenantIdOrSlug } : { tenantSlug: tenantIdOrSlug })
            });

            if (response.data.success) {
                setTenant(response.data.tenant);

                // Persist tenant ID to localStorage for API header usage
                // This allows api.ts to send x-tenant-id header on all requests
                localStorage.setItem('active_tenant_id', response.data.tenant.id);
                localStorage.setItem('active_tenant_slug', response.data.tenant.slug);

                // Navigate to new tenant URL
                const currentPath = window.location.pathname;
                const newPath = currentPath.replace(
                    /^\/app\/[^\/]+/,
                    `/app/${response.data.tenant.slug}`
                );

                if (newPath !== currentPath) {
                    navigate(newPath, { replace: true });
                }

                // Reload plan limits for new tenant
                const planResponse = await api.get('/api/tenant/plan');
                if (planResponse.data.success) {
                    setPlanLimits(planResponse.data.limits);
                }

                // Invalidate all queries to ensure cache isolation
                await queryClient.invalidateQueries();
            }
        } catch (err: any) {
            console.error('Failed to switch tenant:', err);
            setError(err.response?.data?.error || 'Failed to switch workspace');
            throw err;
        } finally {
            setIsLoading(false);
            setIsReady(true);
        }
    }, [applyDemoTenantContext, navigate, queryClient]);

    /**
     * Refresh tenant data
     */
    const refreshTenant = useCallback(async () => {
        await loadTenantContext();
    }, [loadTenantContext]);

    /**
     * Check if tenant can write (active state)
     */
    const canWrite = tenant?.status === 'active' || tenant?.status === 'trialing';

    /**
     * Check if user is owner
     */
    const isOwner = tenant?.role === 'owner';

    /**
     * Check if user is admin or higher
     */
    const isAdmin = tenant?.role === 'owner' || tenant?.role === 'admin';

    /**
     * Check if user has one of the required roles
     */
    const hasRole = useCallback((roles: Array<'owner' | 'admin' | 'member' | 'viewer'>) => {
        return tenant ? roles.includes(tenant.role) : false;
    }, [tenant]);

    /**
     * Check if a limit is unlimited (-1)
     */
    const isUnlimited = useCallback((limit: keyof PlanLimits) => {
        const value = planLimits?.[limit];
        return typeof value === 'number' && value === -1;
    }, [planLimits]);

    const value: TenantContextType = {
        tenant,
        tenants,
        isLoading,
        error,
        switchTenant,
        refreshTenant,
        canWrite,
        isOwner,
        isAdmin,
        hasRole,
        planLimits: planLimits || DEFAULT_LIMITS,
        isUnlimited,
        isReady,
        isThrottled
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * Hook to access tenant context
 */
export function useTenant(): TenantContextType {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

/**
 * Hook to require write access
 * Returns null if tenant cannot write, otherwise returns tenant context
 */
export function useRequireWrite(): TenantContextType | null {
    const context = useTenant();
    if (!context.canWrite) {
        return null;
    }
    return context;
}

/**
 * Hook to require specific roles
 */
export function useRequireRole(roles: Array<'owner' | 'admin' | 'member' | 'viewer'>): TenantContextType | null {
    const context = useTenant();
    if (!context.hasRole(roles)) {
        return null;
    }
    return context;
}

export default TenantContext;
