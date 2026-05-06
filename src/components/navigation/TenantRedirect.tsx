import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeTenantSlug } from '@/lib/routes';

/**
 * TenantRedirect
 * 
 * Deterministically resolves the active tenant and redirects the user
 * from root-level paths (/app, /dashboard) to their scoped tenant dashboard.
 */
export function TenantRedirect({ targetPath = '/dashboard', preservePath = false }: { targetPath?: string; preservePath?: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { tenant, tenants, isReady } = useTenant();
    const storedSlug = typeof window !== 'undefined' ? normalizeTenantSlug(localStorage.getItem('active_tenant_slug')) : null;
    const fallbackTenantSlug = tenants.find((item) => normalizeTenantSlug(item.slug))?.slug || null;
    const resolvedSlug = normalizeTenantSlug(tenant?.slug) || storedSlug || fallbackTenantSlug;

    useEffect(() => {
        if (!resolvedSlug) {
            if (isReady) {
                navigate('/', { replace: true });
            }
            return;
        }

        const redirectPath = preservePath
            ? `${location.pathname}${location.search}${location.hash}`
            : (targetPath.startsWith('/') ? targetPath : `/${targetPath}`);

        navigate(`/app/${resolvedSlug}${redirectPath}`, { replace: true });
    }, [isReady, location.hash, location.pathname, location.search, navigate, preservePath, resolvedSlug, targetPath]);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAFAF7] text-[#182026]">
            <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(11,116,222,0.13),transparent_38%)]" />
            <div className="relative flex flex-col items-center gap-5 rounded-[30px] border border-[#CFE0EA] bg-white px-8 py-7 text-center shadow-[0_28px_90px_rgba(37,49,58,0.1)]">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#BFD8EA] border-t-[#0B74DE]" />
                <div className="space-y-2">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                        Preparing workspace
                    </span>
                    <span className="block text-sm font-medium tracking-tight text-[#66737F]">
                        {resolvedSlug ? 'Resolving workspace context...' : isReady ? 'Redirecting to home...' : 'Waiting for workspace context...'}
                    </span>
                </div>
            </div>
        </div>
    );
}
