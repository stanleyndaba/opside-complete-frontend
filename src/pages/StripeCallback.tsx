import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageLayout } from '@/components/layout/PageLayout';

export default function StripeCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const res = await api.postLoginStripe();
        if (isCancelled) return;
        if (res.ok) {
          const url = (res.data as any)?.redirect_url || (res.data as any)?.onboarding_url || (res.data as any)?.manage_billing_url;
          if (url) {
            window.location.href = url as string;
            return;
          }
        }
      } catch (_) {}
      if (!isCancelled) navigate('/billing');
    })();
    return () => { isCancelled = true };
  }, [navigate]);

  return (
    <PageLayout title="Stripe Login">
      <div className="max-w-xl mx-auto py-12 text-center text-sm text-gray-600">
        Processing Stripe login...
      </div>
    </PageLayout>
  );
}

