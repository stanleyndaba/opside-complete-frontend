import React from 'react';
import { Link, LinkProps, useParams } from 'react-router-dom';
import { tenantRoute } from '@/lib/routes';

interface TenantLinkProps extends LinkProps {
    to: string;
}

/**
 * A wrapper around react-router-dom's Link that automatically 
 * injects the current tenantSlug into the URL.
 */
export const TenantLink: React.FC<TenantLinkProps> = ({ to, children, ...props }) => {
    const { tenantSlug } = useParams<{ tenantSlug: string }>();
    const storedSlug = typeof window !== 'undefined' ? localStorage.getItem('active_tenant_slug') || '' : '';
    const activeSlug = tenantSlug || storedSlug;
    const href = activeSlug ? tenantRoute(activeSlug, to) : to;

    return (
        <Link to={href} {...props}>
            {children}
        </Link>
    );
};

export default TenantLink;
