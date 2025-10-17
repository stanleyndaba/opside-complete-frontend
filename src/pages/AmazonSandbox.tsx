import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
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
    <PageLayout title="Connecting to Amazon">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

          <div className="relative max-w-md mx-auto mt-16 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-gray-100">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg font-medium">Connecting to Amazon...</span>
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
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
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
