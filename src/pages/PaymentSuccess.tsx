import React, { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getPendingYocoCheckoutContext, getSafeYocoReturnPath } from '@/lib/yocoCheckout';

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function resolveReturnPath(searchParams: URLSearchParams, tenantSlug: string | null): string {
  const explicitReturn = getSafeYocoReturnPath(searchParams.get('return'));
  if (explicitReturn) return explicitReturn;

  const pendingReturn = getPendingYocoCheckoutContext().returnPath;
  if (pendingReturn) return pendingReturn;

  if (tenantSlug) return `/app/${tenantSlug}/billing`;

  return `/login?next=${encodeURIComponent('/app')}`;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pending = useMemo(() => getPendingYocoCheckoutContext(), []);
  const tenantSlug = searchParams.get('tenant') || pending.tenantSlug || readLocalStorage('active_tenant_slug');
  const offer = searchParams.get('offer') || pending.offer || 'Margin checkout';
  const price = searchParams.get('price') || pending.price || null;
  const invoiceId = searchParams.get('invoice') || pending.invoiceId || null;
  const returnPath = resolveReturnPath(searchParams, tenantSlug);
  const isScan = String(searchParams.get('kind') || pending.kind || '').includes('scan');

  usePageMeta({
    title: 'Payment Submitted | Margin',
    description: 'Your Yoco payment return page for Margin. Continue setup while payment confirmation is verified.',
  });

  return (
    <PageLayout title="Payment Submitted" noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#060606] text-white">
        <PublicNavbar />
        <main className="relative overflow-hidden pt-32 md:pt-40">
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.08),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(6,6,6,1)_48%)]" />

          <section className="relative mx-auto flex min-h-[calc(100vh-220px)] max-w-4xl flex-col items-center justify-center px-6 pb-24 text-center">
            <Badge variant="outline" className="mb-6 border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
              Yoco Return
            </Badge>
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-tight text-white md:text-6xl">
              Payment submitted. Continue into Margin.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 tracking-tight text-white/48 md:text-base">
              You are back from Yoco for {offer}{price ? ` (${price})` : ''}. Margin will verify the payment before activating billing or starting the recovery scan.
            </p>

            <div className="mt-10 grid w-full max-w-2xl grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] text-left md:grid-cols-3">
              {[
                ['Payment path', 'Processed by Yoco'],
                ['Next step', isScan ? 'Start scan setup' : 'Open workspace'],
                ['Reference', invoiceId || 'Yoco receipt'],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-white/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">{label}</div>
                  <div className="mt-3 text-sm font-semibold leading-6 text-white/82">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate(returnPath)}
                className="h-12 rounded-xl bg-white px-6 text-sm font-sans font-semibold text-black hover:bg-white/90"
              >
                Continue to Margin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-white/10 bg-transparent px-6 text-sm font-sans font-semibold text-white hover:bg-white/[0.05]"
              >
                <Link to="/pricing">Return to Pricing</Link>
              </Button>
            </div>

            <div className="mt-10 flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
              <p className="text-xs leading-6 text-white/42">
                A redirect confirms that Yoco sent you back to Margin. The payment record itself is verified separately from Yoco before Margin treats it as paid.
              </p>
            </div>
          </section>
        </main>
        <BrandFooter />
      </div>
    </PageLayout>
  );
}
