import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from '@/hooks/usePageMeta';
import { markFoundingReservationConfirmed } from '@/lib/foundingActivation';
import { getPendingYocoCheckoutContext, getSafeYocoReturnPath } from '@/lib/yocoCheckout';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

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
  const checkoutKind = String(searchParams.get('kind') || pending.kind || '');
  const source = String(searchParams.get('source') || '').toLowerCase();
  const offer = searchParams.get('offer') || pending.offer || 'Margin checkout';
  const price = searchParams.get('price') || pending.price || null;
  const invoiceId = searchParams.get('invoice') || pending.invoiceId || null;
  const returnPath = resolveReturnPath(searchParams, tenantSlug);
  const isScan = checkoutKind.includes('scan');
  const isEarlyAccess = checkoutKind.includes('early_access');
  const isPayPal = source === 'paypal' || isEarlyAccess;

  const pageTitle = isEarlyAccess ? 'Founding 500 Reservation Confirmed | Margin' : 'Payment Submitted | Margin';
  const pageDescription = isEarlyAccess
    ? 'Your Founding 500 reservation is confirmed. Founder pricing is locked and priority activation is reserved.'
    : `Your ${isPayPal ? 'PayPal' : 'Yoco'} payment return page for Margin. Continue setup while payment confirmation is verified.`;
  const badgeLabel = isEarlyAccess ? 'Founding 500 Reservation' : isPayPal ? 'PayPal Return' : 'Yoco Return';
  const heading = isEarlyAccess
    ? 'Founding 500 reservation confirmed.'
    : 'Payment submitted. Continue into Margin.';
  const body = isEarlyAccess
    ? `You are back from PayPal for ${offer}${price ? ` (${price})` : ''}. Your seat is secured, founder pricing is locked, and priority activation is reserved. A founder or team member will contact you with the next setup step.`
    : `You are back from ${isPayPal ? 'PayPal' : 'Yoco'} for ${offer}${price ? ` (${price})` : ''}. Margin will verify the payment before activating billing or starting the recovery scan.`;
  const nextStepLabel = isEarlyAccess ? 'Next step' : 'Next step';
  const nextStepValue = isEarlyAccess ? 'Founder onboarding begins soon' : isScan ? 'Start scan setup' : 'Open workspace';
  const referenceValue = invoiceId || (isEarlyAccess ? 'Early access reservation' : `${isPayPal ? 'PayPal' : 'Yoco'} receipt`);
  const primaryButtonLabel = isEarlyAccess ? 'Back to Founding 500' : 'Continue to Margin';
  const secondaryHref = isEarlyAccess ? '/' : '/pricing';
  const secondaryLabel = isEarlyAccess ? 'Back to homepage' : 'Return to Pricing';
  const infoCopy = isEarlyAccess
    ? 'A redirect confirms that PayPal sent you back to Margin. Payment confirmation is reconciled separately before infrastructure activation and platform access.'
    : `A redirect confirms that ${isPayPal ? 'PayPal' : 'Yoco'} sent you back to Margin. The payment record itself is verified separately before Margin treats it as paid.`;

  useEffect(() => {
    if (isEarlyAccess) {
      if (typeof window !== 'undefined') {
        const guardKey = 'margin_ga_payment_success_founding_500';
        if (!window.sessionStorage.getItem(guardKey)) {
          window.sessionStorage.setItem(guardKey, '1');
          trackEvent(ANALYTICS_EVENTS.paymentSuccess, {
            offer: 'founding_500',
            value: 99,
            currency: 'USD',
          });
        }
      }
      markFoundingReservationConfirmed('payment_success');
    }
  }, [isEarlyAccess]);

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
  });

  return (
    <PageLayout title={isEarlyAccess ? 'Founding 500 Reservation Confirmed' : 'Payment Submitted'} noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <PublicNavbar variant="light" />
        <main className="relative overflow-hidden pt-32 md:pt-40">
          <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

          <section className="relative mx-auto flex min-h-[calc(100vh-220px)] max-w-5xl flex-col items-center justify-center px-6 pb-24 text-center">
            <Badge variant="outline" className="mb-5 border-[#DCE8EE] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">
              {badgeLabel}
            </Badge>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#E4EDF1] bg-white text-[#2E7D5B] shadow-[0_12px_30px_rgba(37,49,58,0.08)]">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] md:text-6xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 tracking-tight text-[#66737F] md:text-base">
              {body}
            </p>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-[24px] border border-[#DCE8EE] bg-white text-left shadow-[0_24px_80px_rgba(37,49,58,0.08)] md:grid-cols-3">
              {[
                ['Payment path', `Processed by ${isPayPal ? 'PayPal' : 'Yoco'}`],
                [nextStepLabel, nextStepValue],
                ['Status', isEarlyAccess ? 'Seat secured' : referenceValue],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-[#E4EDF1] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A98A3]">{label}</div>
                  <div className="mt-3 text-sm font-semibold leading-6 text-[#182026]">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  navigate(isEarlyAccess ? '/founding-500/status' : returnPath);
                }}
                className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
              >
                {primaryButtonLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-[#DCE8EE] bg-white px-6 text-sm font-semibold text-[#25313A] hover:bg-[#F3F6F8]"
              >
                <Link to={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>

            <div className="mt-10 flex max-w-2xl items-start gap-3 rounded-2xl border border-[#DCE8EE] bg-white p-5 text-left shadow-[0_16px_48px_rgba(37,49,58,0.05)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2E7D5B]" strokeWidth={1.8} />
              <p className="text-xs leading-6 text-[#66737F]">
                {infoCopy}
                {isEarlyAccess ? ' Priority onboarding is included. Activation begins after onboarding readiness is confirmed.' : ''}
              </p>
            </div>
          </section>
        </main>
        <BrandFooter />
      </div>
    </PageLayout>
  );
}
