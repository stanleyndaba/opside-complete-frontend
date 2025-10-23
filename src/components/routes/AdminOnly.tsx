import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminOnly({ children }: PropsWithChildren<{}>) {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem('clario.admin') : null;
      setIsAdmin(v === 'true');
    } catch {
      setIsAdmin(false);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-12 text-center text-gray-300">
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-xl font-semibold text-gray-100 mb-2">Not authorized</h1>
          <p className="text-gray-400 mb-6">This page is restricted to admins. Enable admin mode from the Admin page.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/" className="text-blue-400 hover:underline">Go Home</a>
            <Button asChild className="bg-white/10 hover:bg-white/20 border border-white/10 text-gray-100">
              <a href="/admin">Open Admin</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
