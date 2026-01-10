/**
 * TenantContext - Multi-tenant SaaS context provider
 * 
 * Provides tenant/workspace context to all components.
 * Handles tenant resolution, switching, and permission checks.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useNavigate, useParams } from 'react-router-dom';

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
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { tenantSlug } = useParams<{ tenantSlug?: string }>();

    /**
     * Load current tenant context
     */
    const loadTenantContext = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get current tenant
            const currentResponse = await api.get('/api/tenant/current');
            if (currentResponse.data.success) {
                setTenant(currentResponse.data.tenant);
            }

            // Get all user's tenants
            const listResponse = await api.get('/api/tenant/list');
            if (listResponse.data.success) {
                setTenants(listResponse.data.tenants);
            }

            // Get plan limits
            const planResponse = await api.get('/api/tenant/plan');
            if (planResponse.data.success) {
                setPlanLimits(planResponse.data.limits);
            }
        } catch (err: any) {
            console.error('Failed to load tenant context:', err);
            setError(err.response?.data?.error || 'Failed to load workspace');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Handle URL-based tenant switching
     */
    useEffect(() => {
        if (tenantSlug && tenant && tenant.slug !== tenantSlug) {
            // URL has different tenant than current - switch
            switchTenant(tenantSlug);
        }
    }, [tenantSlug, tenant]);

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
        try {
            setIsLoading(true);
            setError(null);

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdOrSlug);

            const response = await api.post('/api/tenant/switch', {
                ...(isUuid ? { tenantId: tenantIdOrSlug } : { tenantSlug: tenantIdOrSlug })
            });

            if (response.data.success) {
                setTenant(response.data.tenant);

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
            }
        } catch (err: any) {
            console.error('Failed to switch tenant:', err);
            setError(err.response?.data?.error || 'Failed to switch workspace');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

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
        isUnlimited
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
