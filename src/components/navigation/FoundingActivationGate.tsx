import React from 'react';
import { useParams } from 'react-router-dom';

import { DEMO_TENANT_SLUG } from '@/lib/demoSession';

type FoundingActivationGateProps = {
  children: React.ReactNode;
};

export function FoundingActivationGate({ children }: FoundingActivationGateProps) {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();

  if (tenantSlug === DEMO_TENANT_SLUG) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
