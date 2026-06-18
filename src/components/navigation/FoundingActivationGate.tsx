import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { buildFoundingStatusPath, isFoundingReservedButNotActivated } from '@/lib/foundingActivation';

type FoundingActivationGateProps = {
  children: React.ReactNode;
};

export function FoundingActivationGate({ children }: FoundingActivationGateProps) {
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();

  if (isFoundingReservedButNotActivated()) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={buildFoundingStatusPath(from, tenantSlug)} replace />;
  }

  return <>{children}</>;
}
