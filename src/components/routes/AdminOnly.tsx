import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type AdminAccessState = 'checking' | 'allowed' | 'denied';

/**
 * This prevents non-admin users from loading admin surfaces. Every sensitive
 * backend mutation independently enforces the same platform-admin authority.
 */
export default function AdminOnly({ children }: PropsWithChildren<{}>) {
  const [access, setAccess] = useState<AdminAccessState>('checking');

  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      const response = await api.checkProductUpdateAdminAccess();
      if (!isMounted) return;

      setAccess(
        response.ok && response.data?.success && response.data.data?.allowed
          ? 'allowed'
          : 'denied'
      );
    };

    void verifyAdminAccess();
    return () => {
      isMounted = false;
    };
  }, []);

  if (access === 'checking') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 text-[#66737F]">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying admin access…
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAFAF7] px-6 text-center">
        <div className="max-w-md border border-[#DCE8EE] bg-white p-7 shadow-[0_8px_24px_rgba(24,32,38,0.04)]">
          <ShieldCheck className="mx-auto h-5 w-5 text-[#66737F]" />
          <h1 className="mt-4 font-lora text-xl font-normal tracking-tight text-[#182026]">Admin access required</h1>
          <p className="mt-2 text-sm leading-6 text-[#66737F]">
            This area is available only to active Margin platform administrators.
          </p>
          <Button asChild variant="outline" className="mt-5 border-[#DCE8EE] bg-white text-[#182026] hover:bg-[#F4F8FA]">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
