import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

/**
 * TenantRedirect
 * 
 * Deterministically resolves the active tenant and redirects the user
 * from root-level paths (/app, /dashboard) to their scoped tenant dashboard.
 */
export function TenantRedirect({ targetPath = '/dashboard' }: { targetPath?: string }) {
    const navigate = useNavigate();
    const { tenant } = useTenant();

    useEffect(() => {
        // resolution priority:
        // 1. Current tenant in context
        // 2. active_tenant_slug from localStorage
        // 3. Fallback to 'beta'
        const storedSlug = localStorage.getItem('active_tenant_slug');
        const resolvedSlug = tenant?.slug || storedSlug || 'beta';

        navigate(`/app/${resolvedSlug}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`, { replace: true });
    }, [tenant, navigate, targetPath]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                    Resolving Tenant Context...
                </span>
            </div>
        </div>
    );
}
