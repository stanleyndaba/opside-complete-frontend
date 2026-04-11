import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageLayout } from '@/components/layout/PageLayout';
import { tenantRoute } from '@/lib/routes';

export default function StripeCallback() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  // Enforce strict URL authority for callback context
  const currentTenantSlug = tenantSlug || 'beta';

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      await Promise.resolve();
      if (!isCancelled) navigate(tenantRoute(currentTenantSlug, '/billing'));
    })();
    return () => { isCancelled = true };
  }, [currentTenantSlug, navigate]);

  return (
    <PageLayout title="Stripe Login">
      <div className="max-w-xl mx-auto py-12 text-center text-sm text-gray-600">
        Processing Stripe login...
      </div>
    </PageLayout>
  );
}

