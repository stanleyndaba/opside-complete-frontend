import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api, RecoveryWorkspaceSubscriptionStatus } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

type VerifyState = 'verifying' | 'subscription_pending' | 'active' | 'recover_once_active' | 'failed' | 'error';

function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function getReference(searchParams: URLSearchParams): string | null {
  return searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('payment_reference');
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantSlug = searchParams.get('tenant') || readLocalStorage('active_tenant_slug');
  const reference = useMemo(() => getReference(searchParams), [searchParams]);
  const trackedPurchaseRef = useRef(false);

  const [state, setState] = useState<VerifyState>('verifying');
  const [message, setMessage] = useState('Margin is verifying your Recovery Workspace subscription.');
  const [subscriptionStatus, setSubscriptionStatus] = useState<RecoveryWorkspaceSubscriptionStatus | null>(null);
  const isRecoverOnceReference = Boolean(reference?.startsWith('MGN-RO-'));

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!reference) {
        setState('error');
        setMessage('Payment reference is missing. Open Billing to refresh your subscription status.');
        return;
      }

      if (isRecoverOnceReference) {
        const recoverOnceResponse = await api.verifyRecoverOncePayment(reference, tenantSlug || undefined);
        if (cancelled) return;

        if (!recoverOnceResponse.ok || !recoverOnceResponse.data?.success) {
          setState('failed');
          setMessage(recoverOnceResponse.error || 'Recover Once payment verification failed.');
          trackEvent('recover_once_payment_failed', {
            payment_provider: 'paystack_one_time',
            reference_present: true,
          });
          return;
        }

        setState('recover_once_active');
        setMessage('Your Recover Once engagement is active.');
        trackEvent('recover_once_payment_verified', {
          payment_provider: 'paystack_one_time',
          reference_present: true,
        });
        trackEvent('recover_once_engagement_created', {
          payment_provider: 'paystack_one_time',
          reference_present: true,
        });
        return;
      }

      const verifyResponse = await api.verifyPaystackPayment(reference, tenantSlug || undefined);
      if (cancelled) return;

      if (!verifyResponse.ok || !verifyResponse.data?.success) {
        setState('failed');
        setMessage(verifyResponse.error || 'Paystack payment verification failed.');
        trackEvent(ANALYTICS_EVENTS.paymentFailed, {
          offer: 'recovery_workspace',
          payment_provider: 'paystack_subscription',
          reference_present: true,
        });
        return;
      }

      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (!tenantSlug) break;
        const statusResponse = await api.getRecoveryWorkspaceSubscription(tenantSlug);
        if (cancelled) return;

        if (statusResponse.ok && statusResponse.data) {
          setSubscriptionStatus(statusResponse.data);
          if (statusResponse.data.entitlement?.active) {
            setState('active');
            setMessage('Your Recovery Workspace subscription is active.');
            if (!trackedPurchaseRef.current) {
              trackedPurchaseRef.current = true;
              trackEvent(ANALYTICS_EVENTS.purchase, {
                offer: 'recovery_workspace',
                value: 1799,
                currency: 'ZAR',
                payment_provider: 'paystack_subscription',
              });
              trackEvent(ANALYTICS_EVENTS.paymentSuccess, {
                offer: 'recovery_workspace',
                value: 1799,
                currency: 'ZAR',
                payment_provider: 'paystack_subscription',
              });
              trackEvent(ANALYTICS_EVENTS.subscriptionCreated, {
                offer: 'recovery_workspace',
                currency: 'ZAR',
              });
            }
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      setState('subscription_pending');
      setMessage('Payment was received. Margin is waiting for Paystack subscription confirmation.');
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [isRecoverOnceReference, reference, tenantSlug]);

  usePageMeta({
    title: 'Payment Verification | Margin',
    description: 'Margin verifies Paystack subscription payments against backend subscription truth before opening Recovery Workspace access.',
  });

  const isLoading = state === 'verifying' || state === 'subscription_pending';
  const icon = state === 'active' || state === 'recover_once_active'
    ? <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
    : state === 'failed' || state === 'error'
      ? <XCircle className="h-6 w-6" strokeWidth={1.8} />
      : <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.8} />;

  return (
    <PageLayout title="Payment Verification" noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <PublicNavbar variant="light" />
        <main className="relative overflow-hidden pt-32 md:pt-40">
          <section className="relative mx-auto flex min-h-[calc(100vh-220px)] max-w-5xl flex-col items-center justify-center px-6 pb-24 text-center">
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full border bg-white shadow-[0_12px_30px_rgba(37,49,58,0.08)] ${
              state === 'active' ? 'border-emerald-100 text-[#2E7D5B]' : state === 'failed' || state === 'error' ? 'border-rose-100 text-rose-600' : 'border-[#E4EDF1] text-[#0B74DE]'
            }`}>
              {icon}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#182026] md:text-6xl">
              {state === 'recover_once_active' ? 'Recover Once is active.' : state === 'active' ? 'Recovery Workspace is active.' : isLoading ? 'Verifying payment.' : 'Payment needs attention.'}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 tracking-tight text-[#66737F] md:text-base">
              {message}
            </p>

            {subscriptionStatus?.subscription ? (
              <div className="mt-6 grid w-full max-w-xl grid-cols-2 border border-[#DCE8EE] bg-white text-left">
                <div className="border-r border-[#DCE8EE] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">Status</div>
                  <div className="mt-1 text-sm font-semibold text-[#182026]">{subscriptionStatus.subscription.status}</div>
                </div>
                <div className="p-4">
                  <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">Access until</div>
                  <div className="mt-1 text-sm font-semibold text-[#182026]">{subscriptionStatus.entitlement?.access_until || 'Pending'}</div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  if (state === 'active' && tenantSlug) navigate(`/app/${tenantSlug}/dashboard`);
                  else if (state === 'recover_once_active') navigate('/audit');
                  else if (tenantSlug) navigate(`/app/${tenantSlug}/billing`);
                  else navigate('/audit');
                }}
                className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
              >
                {state === 'active' ? 'Open Recovery Workspace' : state === 'recover_once_active' ? 'Return to Audit' : 'Open Billing'}
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
