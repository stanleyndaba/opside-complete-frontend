import { useEffect, useState } from 'react';
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

function formatMoneySubunits(value?: number | null, currency = 'ZAR') {
  if (!Number.isFinite(Number(value))) return NOT_AVAILABLE;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleDateString('en-ZA', {
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
      <div className="min-h-screen bg-[#F9FAFB] text-[#111827]">
        <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
          <header className="border-b border-[#DCE8EE] pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tight text-[#0B74DE]">Recovery Workspace</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#182026] md:text-5xl">
                  Billing
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66737F]">
                  Recovery Workspace is billed through Paystack at R1,799/month in ZAR with 0% recovery commission.
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
                  { label: 'Product', value: product?.name || 'Recovery Workspace' },
                  { label: 'Price', value: formatMoneySubunits(product?.amount_subunits ?? 179900, product?.currency || 'ZAR') },
                  { label: 'Interval', value: product?.interval || 'monthly' },
                  { label: 'Commission', value: '0%' },
                ].map((item) => (
                  <div key={item.label} className="border border-[#DCE8EE] bg-white p-5">
                    <div className="font-mono text-[10px] uppercase tracking-tight text-[#66737F]">{item.label}</div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-[#182026]">{item.value}</div>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="border border-[#DCE8EE] bg-white p-6">
                  <div className="flex items-center gap-3">
                    {isActive ? <CheckCircle2 className="h-5 w-5 text-[#2E7D5B]" /> : <CreditCard className="h-5 w-5 text-[#0B74DE]" />}
                    <h2 className="text-xl font-semibold tracking-tight text-[#182026]">Subscription truth</h2>
                  </div>

                  <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Status</div>
                      <div className="mt-1 font-semibold text-[#182026]">{labelForState(state)}</div>
                    </div>
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Current period</div>
                      <div className="mt-1 font-semibold text-[#182026]">
                        {formatDate(subscription?.current_period_start)} - {formatDate(subscription?.current_period_end)}
                      </div>
                    </div>
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Next payment</div>
                      <div className="mt-1 font-semibold text-[#182026]">{formatDate(subscription?.next_payment_at)}</div>
                    </div>
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Access until</div>
                      <div className="mt-1 font-semibold text-[#182026]">{formatDate(entitlement?.access_until)}</div>
                    </div>
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Grace deadline</div>
                      <div className="mt-1 font-semibold text-[#182026]">{formatDate(subscription?.grace_expires_at)}</div>
                    </div>
                    <div className="border-t border-[#E8EFF3] pt-4">
                      <div className="text-[#66737F]">Cancellation</div>
                      <div className="mt-1 font-semibold text-[#182026]">{subscription?.cancel_at_period_end ? 'Scheduled' : 'Not scheduled'}</div>
                    </div>
                  </div>
                </div>

                <aside className="border border-[#DCE8EE] bg-white p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-[#182026]">Actions</h2>
                  <div className="mt-5 space-y-3">
                    {subscription?.status === 'active' || subscription?.status === 'past_due' ? (
                      <Button className="w-full rounded-none bg-[#182026] text-white hover:bg-[#25313A]" disabled={Boolean(busyAction)} onClick={() => void runAction('manage')}>
                        Manage payment method
                      </Button>
                    ) : null}
                    {subscription?.status === 'active' || subscription?.status === 'past_due' ? (
                      <Button variant="outline" className="w-full rounded-none" disabled={Boolean(busyAction)} onClick={() => void runAction('cancel')}>
                        Cancel subscription
                      </Button>
                    ) : null}
                    {subscription?.status === 'non_renewing' ? (
                      <Button className="w-full rounded-none bg-[#0B74DE] text-white hover:bg-[#0869C9]" disabled={Boolean(busyAction)} onClick={() => void runAction('resume')}>
                        Resume subscription
                      </Button>
                    ) : null}
                    {!subscription || ['cancelled', 'expired', 'suspended'].includes(subscription.status) ? (
                      <div className="text-sm leading-6 text-[#66737F]">
                        Start from the free audit page to activate Recovery Workspace.
                      </div>
                    ) : null}
                  </div>
                </aside>
              </section>

              <section className="border border-[#DCE8EE] bg-white">
                <div className="border-b border-[#DCE8EE] p-5">
                  <h2 className="text-lg font-semibold tracking-tight text-[#182026]">Payment history</h2>
                </div>
                <div className="divide-y divide-[#E8EFF3]">
                  {(status?.payments || []).length > 0 ? status.payments.map((payment, index) => (
                    <div key={`${payment.reference || index}`} className="grid gap-3 p-5 text-sm md:grid-cols-4">
                      <div>
                        <div className="text-[#66737F]">Reference</div>
                        <div className="mt-1 font-mono text-xs text-[#182026]">{String(payment.reference || '').slice(0, 14)}...</div>
                      </div>
                      <div>
                        <div className="text-[#66737F]">Status</div>
                        <div className="mt-1 font-semibold text-[#182026]">{payment.status || NOT_AVAILABLE}</div>
                      </div>
                      <div>
                        <div className="text-[#66737F]">Amount</div>
                        <div className="mt-1 font-semibold text-[#182026]">{formatMoneySubunits(payment.amount_subunits, payment.currency || 'ZAR')}</div>
                      </div>
                      <div>
                        <div className="text-[#66737F]">Paid at</div>
                        <div className="mt-1 font-semibold text-[#182026]">{formatDate(payment.paid_at)}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-sm text-[#66737F]">No Paystack subscription payments recorded yet.</div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
