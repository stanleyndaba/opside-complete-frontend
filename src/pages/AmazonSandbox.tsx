import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function AmazonSandboxPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'connecting' | 'success' | 'error'>('connecting');
  const [statusMessage, setStatusMessage] = useState('Completing sandbox authorization…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const markSandboxMode = () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('amazon_sandbox_mode', 'true');
      localStorage.setItem('amazon_sandbox_mode', 'true');
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const stateParam =
      searchParams.get('state') ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('amazon_sandbox_state') || localStorage.getItem('amazon_sandbox_state')
        : null);

    if (!stateParam) {
      setStatus('error');
      setErrorMessage('Missing sandbox state parameter. Please restart the connection flow.');
      toast({
        title: 'Sandbox state missing',
        description: 'We were redirected without a sandbox state token. Please reconnect your Amazon account.',
        variant: 'destructive'
      });
      setTimeout(() => {
        if (!cancelled) navigate('/integrations-hub');
      }, 2500);
      return () => {
        cancelled = true;
      };
    }

    markSandboxMode();
    try {
      sessionStorage.setItem('amazon_sandbox_state', stateParam);
      localStorage.setItem('amazon_sandbox_state', stateParam);
    } catch {}

    (async () => {
      try {
        setStatus('connecting');
        setStatusMessage('Establishing a secure sandbox session…');
        console.log('[AmazonSandbox] Completing sandbox auth with state:', stateParam);
        const response = await api.completeAmazonSandboxAuth(stateParam);

        if (cancelled) return;

        if (response.ok && (response.data?.connected ?? true)) {
          setStatus('success');
          setStatusMessage('Sandbox session established. Redirecting to analysis…');
          toast({
            title: 'Sandbox connected',
            description: 'We created a sandbox session and started analyzing your account.'
          });
          setTimeout(() => {
            if (!cancelled) {
              navigate('/auth/analyzing?source=amazon&sandbox=true');
            }
          }, 1500);
        } else {
          const failureMessage = response.error || response.data?.message || 'Sandbox callback failed. Please try again.';
          console.error('[AmazonSandbox] Sandbox callback failed:', failureMessage, response);
          setStatus('error');
          setErrorMessage(failureMessage);
          toast({
            title: 'Sandbox connection failed',
            description: failureMessage,
            variant: 'destructive'
          });
          setTimeout(() => {
            if (!cancelled) {
              navigate('/integrations-hub?amazon_connected=false');
            }
          }, 2500);
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error('[AmazonSandbox] Sandbox auth exception:', e);
        const message = e?.message || 'Unexpected error completing sandbox authentication';
        setStatus('error');
        setErrorMessage(message);
        toast({
          title: 'Sandbox connection error',
          description: message,
          variant: 'destructive'
        });
        setTimeout(() => {
          if (!cancelled) {
            navigate('/integrations-hub?amazon_connected=false');
          }
        }, 2500);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, toast]);

    return (
      <PageLayout title="Connecting to Amazon" hideNavbar hideSidebar>
        <div className="relative -m-4 lg:-m-6">
          <div className="relative w-full bg-transparent min-h-screen text-gray-300 flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
            <div className="relative max-w-md w-full mx-auto text-center space-y-6 rounded-3xl border border-white/10 bg-white/5 px-8 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              {status === 'connecting' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-gray-100">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg font-medium">Finalizing sandbox sign-in…</span>
                  </div>
                  <p className="text-sm text-gray-300">{statusMessage}</p>
                  <p className="text-xs text-gray-400">
                    This step issues a secure sandbox session so we can analyze your account with demo data.
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-emerald-300">
                    <ShieldCheck className="h-7 w-7" />
                    <span className="text-lg font-semibold">Sandbox session ready</span>
                  </div>
                  <p className="text-sm text-gray-200">{statusMessage}</p>
                  <p className="text-xs text-gray-400">
                    Hang tight—we&apos;re loading your potential recoveries and will move you forward automatically.
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="flex items-center justify-center gap-2 text-red-300">
                    <AlertTriangle className="h-7 w-7" />
                    <span className="text-lg font-semibold">Sandbox connection failed</span>
                  </div>
                  <p className="text-sm text-red-200">{errorMessage}</p>
                  <p className="text-xs text-gray-400">
                    We&apos;ll take you back to the integrations hub shortly so you can retry.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
}
