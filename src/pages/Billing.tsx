import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, CreditCard, RefreshCw } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { api, RecoveryWorkspaceSubscriptionStatus } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

const NOT_AVAILABLE = 'Not Available';

function formatMoneyUSD(value?: number | null) {
  if (!Number.isFinite(Number(value))) return '$99/mo';
  return `$${(Number(value) / 100).toFixed(0)}/mo`;
}

function formatDate(value?: string | null) {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function labelForState(state?: string | null) {
  if (state === 'active') return 'Active';
  if (state === 'non_renewing') return 'Cancels at period end';
  if (state === 'past_due') return 'Payment failed';
  if (state === 'pending') return 'Pending confirmation';
  if (state === 'suspended') return 'Suspended';
  if (state === 'cancelled') return 'Cancelled';
  if (state === 'expired') return 'Expired';
  return 'Not active';
}

function toneForState(state?: string | null) {
  if (state === 'active') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
  if (state === 'non_renewing') return 'border-amber-500/20 bg-amber-500/10 text-amber-700';
  if (state === 'past_due') return 'border-rose-500/20 bg-rose-500/10 text-rose-700';
  return 'border-[#DCE8EE] bg-white text-[#66737F]';
}

export default function Billing() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const { toast } = useToast();

  const [status, setStatus] = useState<RecoveryWorkspaceSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    if (!activeSlug) {
      setStatus(null);
      setError('Workspace context is not available.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await api.getRecoveryWorkspaceSubscription(activeSlug);
    setLoading(false);

    if (!response.ok || !response.data?.success) {
      setStatus(null);
      setError(response.error || 'Subscription status is not available.');
      return;
    }

    setStatus(response.data);
  }

  useEffect(() => {
    if (!isReady) return;
    void loadStatus();
  }, [isReady, activeSlug]);

  async function runAction(action: 'cancel' | 'resume' | 'manage') {
    if (!activeSlug) return;
    setBusyAction(action);
    try {
      if (action === 'cancel') {
        const response = await api.cancelRecoveryWorkspaceSubscription(activeSlug);
        if (!response.ok) throw new Error(response.error || 'Unable to cancel subscription');
        trackEvent(ANALYTICS_EVENTS.subscriptionCancelled, { offer: 'recovery_workspace' });
        toast({ title: 'Subscription cancellation scheduled', description: 'Paid-through access remains until the current period ends.' });
      }

      if (action === 'resume') {
        const response = await api.resumeRecoveryWorkspaceSubscription(activeSlug);
        if (!response.ok) throw new Error(response.error || 'Unable to resume subscription');
        trackEvent(ANALYTICS_EVENTS.subscriptionResumed, { offer: 'recovery_workspace' });
        toast({ title: 'Subscription resumed', description: response.data?.new_checkout_required ? 'A new checkout may be required.' : 'Monthly renewal is active again.' });
      }

      if (action === 'manage') {
        const response = await api.getRecoveryWorkspaceManageLink(activeSlug);
        if (!response.ok || !response.data?.url) throw new Error(response.error || 'Manage link is not available');
        window.location.assign(response.data.url);
        return;
      }

      await loadStatus();
    } catch (actionError: unknown) {
      toast({
        title: 'Billing action failed',
        description: actionError instanceof Error ? actionError.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }

  const product = status?.product;
  const subscription = status?.subscription;
  const entitlement = status?.entitlement;
  const state = entitlement?.state || subscription?.status || 'none';
  const isActive = Boolean(entitlement?.active);

  return (
    <PageLayout title="Billing">
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
          <header className="border-b border-[#DCE8EE] pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tight text-[#0B74DE]">Recovery OS</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#182026] md:text-5xl">
                  Billing
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66737F]">
                  Recovery OS is billed at $99/month with 0% recovery commission.
                </p>
              </div>
              <Badge variant="outline" className={`w-fit rounded-none px-3 py-1 text-[11px] font-semibold ${toneForState(state)}`}>
                {labelForState(state)}
              </Badge>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center gap-3 border border-[#DCE8EE] bg-white p-6 text-sm text-[#66737F]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading subscription truth...
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <div className="font-semibold">Subscription status unavailable</div>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Product', value: product?.name || 'Recovery OS' },
                  { label: 'Price', value: formatMoneyUSD(product?.amount_subunits ?? 9900) },
                  { label: 'Interval', value: product?.interval || 'monthly' },
                  { label: 'Commission', value: '0%' },
                ].map((item) => (
                  <div key={item.label} className="border border-[#DCE8EE] bg-white p-5">
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-[#182026]">{item.value}</div>
                  </div>
                ))}
              </section>

              <section className="border border-[#DCE8EE] bg-white p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#DCE8EE] pb-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-[#182026]">Subscription Details</h2>
                    <p className="text-xs text-[#66737F]">Flat-fee recovery operations with no hidden success fees.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-none border-[#DCE8EE] text-xs font-semibold uppercase tracking-tight"
                      onClick={() => void runAction('manage')}
                      disabled={busyAction !== null}
                    >
                      <CreditCard className="mr-2 h-3.5 w-3.5" />
                      Manage Payment Method
                    </Button>
                    {isActive ? (
                      <Button
                        variant="outline"
                        className="rounded-none border-rose-200 text-xs font-semibold uppercase tracking-tight text-rose-700 hover:bg-rose-50"
                        onClick={() => void runAction('cancel')}
                        disabled={busyAction !== null}
                      >
                        Cancel Plan
                      </Button>
                    ) : (
                      <Button
                        className="rounded-none bg-[#0B74DE] text-xs font-semibold uppercase tracking-tight text-white hover:bg-[#005FBA]"
                        onClick={() => void runAction('resume')}
                        disabled={busyAction !== null}
                      >
                        Resume Plan
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3 text-sm">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">Current Status</div>
                    <div className="mt-1 font-semibold text-[#182026]">{labelForState(state)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">Current Period Ends</div>
                    <div className="mt-1 font-semibold text-[#182026]">{formatDate(subscription?.current_period_end)}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">Auto Renewal</div>
                    <div className="mt-1 font-semibold text-[#182026]">{subscription?.cancel_at_period_end ? 'Scheduled for cancellation' : 'Active (renews monthly)'}</div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
