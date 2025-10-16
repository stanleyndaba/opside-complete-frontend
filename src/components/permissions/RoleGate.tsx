import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

type Role = 'admin' | 'operator' | 'auditor';

export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role || 'auditor') as Role;
  if (!allow.includes(role)) return null;
  return <>{children}</>;
}

