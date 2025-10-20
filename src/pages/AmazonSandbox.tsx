import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AmazonSandboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = searchParams.get('state');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Establish sandbox session/tenant on backend; ignore errors to keep UX flowing
        await api.completeAmazonSandboxAuth(state || 'demo');
      } catch {}
      if (!cancelled) {
        // Small pause for UX, then continue
        setTimeout(() => navigate('/auth/analyzing?source=amazon'), 800);
      }
    })();
    return () => { cancelled = true; };
  }, [state, navigate]);

  return (
    <PageLayout title="Connecting to Amazon" hideNavbar>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-screen pt-16 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          {/* Subtle grid overlay for depth */}
          <div className="pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_bottom,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%),linear-gradient(to_right,transparent_0,transparent_95%,rgba(255,255,255,0.08)_96%)] bg-[length:36px_36px]" />
          {/* Soft brand glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative max-w-md mx-auto mt-16 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-gray-100">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg font-medium">Connecting to Amazon...</span>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-emerald-400/20 blur-2xl animate-pulse" />
                <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_10px_30px_rgba(0,0,0,0.35)]">
                  <img src="/logo-abstract.svg" alt="Clario cube" className="h-8 w-8 opacity-90" />
                </div>
              </div>
            </div>
            <p className="text-gray-400">
              Simulating Amazon Seller Central authentication...
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Requesting permissions...</span>
                <span className="text-emerald-400">✓</span>
              </div>
              <div className="flex justify-between">
                <span>Verifying account...</span>
                <span className="text-emerald-400">✓</span>
              </div>
              <div className="flex justify-between">
                <span>Connecting to SP-API...</span>
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              </div>
            </div>

            <div className="max-w-md mx-auto text-left">
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-4">
                <p className="text-xs font-medium text-gray-200 mb-1">Security & privacy</p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
                  <li>Read-only access — we never modify your Amazon data.</li>
                  <li>Tokens encrypted at rest; you can revoke access any time.</li>
                  <li>Data purged on disconnect. SOC 2 journey underway.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
