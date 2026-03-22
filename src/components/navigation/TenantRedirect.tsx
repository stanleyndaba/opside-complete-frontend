import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeTenantSlug } from '@/lib/routes';

/**
 * TenantRedirect
 * 
 * Deterministically resolves the active tenant and redirects the user
 * from root-level paths (/app, /dashboard) to their scoped tenant dashboard.
 */
export function TenantRedirect({ targetPath = '/dashboard' }: { targetPath?: string }) {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const storedSlug = typeof window !== 'undefined' ? normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) : null;
    const resolvedSlug = normalizeTenantSlug(tenant?.slug) || storedSlug;

    useEffect(() => {
        if (!resolvedSlug) {
            return;
        }

        navigate(`/app/${resolvedSlug}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`, { replace: true });
    }, [navigate, resolvedSlug, targetPath]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                    {resolvedSlug ? 'Resolving Tenant Context...' : 'Waiting For Workspace Context...'}
                </span>
            </div>
        </div>
    );
}
