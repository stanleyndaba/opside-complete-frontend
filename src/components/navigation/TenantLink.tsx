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

    // Fallback to 'beta' if no slug is in the URL (should ideally come from context)
    const activeSlug = tenantSlug || 'beta';

    const href = tenantRoute(activeSlug, to);

    return (
        <Link to={href} {...props}>
            {children}
        </Link>
    );
};

export default TenantLink;
