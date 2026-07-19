import React, { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { markFoundingReservationConfirmed } from '@/lib/foundingActivation';
import { getPendingYocoCheckoutContext, getSafeYocoReturnPath } from '@/lib/yocoCheckout';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import {
  EARLY_ACCESS_CURRENCY,
  EARLY_ACCESS_VALUE_ZAR,
  PAYSTACK_PAYMENT_PROVIDER,
  trackEvent,
} from '@/lib/analytics';

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
  const paymentStatus = String(searchParams.get('status') || searchParams.get('payment_status') || '').toLowerCase();
  const offer = searchParams.get('offer') || pending.offer || 'Margin checkout';
  const price = searchParams.get('price') || pending.price || null;
  const returnPath = resolveReturnPath(searchParams, tenantSlug);
  const isEarlyAccess = checkoutKind.includes('early_access');
  const isCancelled = ['cancelled', 'canceled', 'cancel'].includes(paymentStatus);
  const isFailed = ['failed', 'failure', 'declined', 'error'].includes(paymentStatus);
  const isPayPal = source === 'paypal' && !isEarlyAccess;
  const paymentProviderLabel = isEarlyAccess || source === 'paystack_payment_page' ? 'Paystack' : isPayPal ? 'PayPal' : 'Paystack';

  const pageTitle = isEarlyAccess ? 'Early Access Reservation Confirmed | Margin' : 'Payment Submitted | Margin';
  const pageDescription = isEarlyAccess
    ? 'Your Early Access reservation is confirmed. Founder pricing is locked and priority activation is reserved.'
    : `Your ${paymentProviderLabel} payment return page for Margin. Continue setup while payment confirmation is verified.`;
  const heading = isEarlyAccess
    ? 'Early Access reservation confirmed.'
    : 'Payment submitted. Continue into Margin.';
  const body = isEarlyAccess
    ? `You are back from Paystack for ${offer}${price ? ` (${price})` : ''}. Your seat is secured, founder pricing is locked, and priority activation is reserved. A founder or team member will contact you with the next setup step.`
    : `You are back from ${paymentProviderLabel} for ${offer}${price ? ` (${price})` : ''}. Margin will verify the payment before activating billing or starting the recovery scan.`;
  const primaryButtonLabel = isEarlyAccess ? 'Back to Early Access' : 'Continue to Margin';

  useEffect(() => {
    if (isCancelled) {
      trackEvent(ANALYTICS_EVENTS.checkoutCancelled, {
        offer: 'early_access',
        value: EARLY_ACCESS_VALUE_ZAR,
        currency: EARLY_ACCESS_CURRENCY,
        payment_provider: PAYSTACK_PAYMENT_PROVIDER,
        payment_status: paymentStatus,
      });
      return;
    }

    if (isFailed) {
      trackEvent(ANALYTICS_EVENTS.paymentFailed, {
        offer: 'early_access',
        value: EARLY_ACCESS_VALUE_ZAR,
        currency: EARLY_ACCESS_CURRENCY,
        payment_provider: PAYSTACK_PAYMENT_PROVIDER,
        payment_status: paymentStatus,
      });
      return;
    }

    if (isEarlyAccess) {
      if (typeof window !== 'undefined') {
        const guardKey = 'margin_ga_payment_success_founding_500';
        if (!window.sessionStorage.getItem(guardKey)) {
          window.sessionStorage.setItem(guardKey, '1');
          // Paystack dashboard remains the source of truth until full Paystack API/webhook integration exists.
          trackEvent(ANALYTICS_EVENTS.paymentSuccess, {
            offer: 'early_access',
            value: EARLY_ACCESS_VALUE_ZAR,
            currency: EARLY_ACCESS_CURRENCY,
            payment_provider: PAYSTACK_PAYMENT_PROVIDER,
          });
        }
      }
      markFoundingReservationConfirmed('payment_success');
    }
  }, [isCancelled, isEarlyAccess, isFailed, paymentProviderLabel, paymentStatus]);

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
  });

  return (
    <PageLayout title={isEarlyAccess ? 'Early Access Reservation Confirmed' : 'Payment Submitted'} noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <PublicNavbar variant="light" />
        <main className="relative overflow-hidden pt-32 md:pt-40">
          <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

          <section className="relative mx-auto flex min-h-[calc(100vh-220px)] max-w-5xl flex-col items-center justify-center px-6 pb-24 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#E4EDF1] bg-white text-[#2E7D5B] shadow-[0_12px_30px_rgba(37,49,58,0.08)]">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] md:text-6xl">
              {heading}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 tracking-tight text-[#66737F] md:text-base">
              {body}
            </p>

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
            </div>
          </section>
        </main>
        <BrandFooter />
      </div>
    </PageLayout>
  );
}
