import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CreditCard, RefreshCw } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { api, RecoveryWorkspaceSubscriptionStatus } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

const NOT_AVAILABLE = 'Not available';

type BillingViewState =
  | 'loading'
  | 'unavailable'
  | 'none'
  | 'pending'
  | 'active'
  | 'non_renewing'
  | 'past_due_grace'
  | 'past_due'
  | 'suspended'
  | 'cancelled'
  | 'expired'
  | 'unknown';

type LoadOptions = {
  clearDisplayedTruth?: boolean;
};

function formatSubscriptionPrice(amountSubunits?: number | null, currency?: string | null) {
  const amount = Number(amountSubunits);
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0 || !normalizedCurrency) return null;

  const majorAmount = amount / 100;
  if (normalizedCurrency === 'ZAR') {
    return `R${majorAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month`;
  }

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(majorAmount);
    return `${formatted}/month`;
  } catch {
    return null;
  }
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

function deriveViewState(
  status: RecoveryWorkspaceSubscriptionStatus | null,
  loading: boolean,
  error: string | null,
): BillingViewState {
  if (loading && !status) return 'loading';
  if (error) return 'unavailable';
  if (!status) return 'unknown';

  const subscriptionState = status.subscription?.status;
  if (!subscriptionState) {
    return status.entitlement?.state === 'none' ? 'none' : 'unknown';
  }

  if (subscriptionState === 'past_due') {
    return status.entitlement?.entitled ? 'past_due_grace' : 'past_due';
  }

  if (['pending', 'active', 'non_renewing', 'suspended', 'cancelled', 'expired'].includes(subscriptionState)) {
    return subscriptionState;
  }

  return 'unknown';
}

function subscriptionLabel(viewState: BillingViewState) {
  switch (viewState) {
    case 'loading': return 'Loading billing status';
    case 'unavailable': return 'Billing status unavailable';
    case 'none': return 'No current subscription';
    case 'pending': return 'Pending confirmation';
    case 'active': return 'Active';
    case 'non_renewing': return 'Non-renewing';
    case 'past_due_grace': return 'Past due — grace access';
    case 'past_due': return 'Past due';
    case 'suspended': return 'Suspended';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return 'Unknown subscription state';
  }
}

function toneForState(viewState: BillingViewState) {
  if (viewState === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (viewState === 'non_renewing' || viewState === 'pending') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (viewState === 'past_due' || viewState === 'past_due_grace' || viewState === 'suspended') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#586672]';
}

function accessLabel(status: RecoveryWorkspaceSubscriptionStatus | null, viewState: BillingViewState) {
  if (viewState === 'loading' || viewState === 'unavailable' || viewState === 'unknown') return NOT_AVAILABLE;
  if (status?.entitlement?.entitled) return 'Workspace access active';
  return 'Workspace access inactive';
}

function stateContext(viewState: BillingViewState) {
  switch (viewState) {
    case 'pending':
      return 'Margin is waiting for payment or provider subscription confirmation.';
    case 'non_renewing':
      return 'Cancellation is scheduled. Workspace access remains available through the paid period shown below.';
    case 'past_due_grace':
      return 'A payment issue exists. Workspace access remains available temporarily through the grace/access date shown below.';
    case 'past_due':
      return 'A payment issue exists and Workspace access is no longer active.';
    case 'suspended':
      return 'This Workspace subscription is suspended. No self-service recovery action is currently available.';
    case 'none':
      return 'There is no current Recovery Workspace subscription and no renewal is scheduled.';
    case 'cancelled':
    case 'expired':
      return 'There is no current Recovery Workspace access from this subscription.';
    case 'unknown':
      return 'Margin could not determine a recognized subscription state from the current backend response.';
    case 'active':
      return 'Recovery Workspace is active and billed monthly from the current backend subscription record.';
    default:
      return null;
  }
}

export default function Billing() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || '';
  const { toast } = useToast();

  const [status, setStatus] = useState<RecoveryWorkspaceSubscriptionStatus | null>(null);
  const [statusTenantSlug, setStatusTenantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const inFlightRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadStatus = useCallback(async (options: LoadOptions = {}): Promise<RecoveryWorkspaceSubscriptionStatus | null> => {
    if (inFlightRef.current) {
      pendingRefreshRef.current = true;
      return null;
    }

    const requestId = ++requestIdRef.current;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    if (!activeSlug) {
      setStatus(null);
      setStatusTenantSlug(null);
      setError('Workspace context is not available.');
      setLoading(false);
      inFlightRef.current = false;
      return null;
    }

    if (options.clearDisplayedTruth) {
      setStatus(null);
      setStatusTenantSlug(null);
    }

    try {
      const response = await api.getRecoveryWorkspaceSubscription(activeSlug);
      if (requestId !== requestIdRef.current) return null;

      if (!response.ok || !response.data?.success) {
        setError(response.error || 'Subscription status is not available.');
        return null;
      }

      setStatus(response.data);
      setStatusTenantSlug(activeSlug);
      return response.data;
    } catch (loadError: unknown) {
      if (requestId === requestIdRef.current) {
        setError(loadError instanceof Error ? loadError.message : 'Subscription status is not available.');
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        inFlightRef.current = false;
        if (pendingRefreshRef.current) {
          pendingRefreshRef.current = false;
          setRefreshVersion((value) => value + 1);
        }
      }
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!isReady) return;
    void loadStatus({ clearDisplayedTruth: true });
  }, [isReady, activeSlug, loadStatus, refreshVersion]);

  const statusMatchesTenant = Boolean(status && statusTenantSlug === activeSlug);
  const displayedStatus = statusMatchesTenant ? status : null;
  const effectiveLoading = loading || (!statusMatchesTenant && Boolean(activeSlug) && isReady);
  const viewState = deriveViewState(displayedStatus, effectiveLoading, error);
  const product = displayedStatus?.product;
  const subscription = displayedStatus?.subscription;
  const entitlement = displayedStatus?.entitlement;
  const actions = displayedStatus?.actions;
  const productPrice = formatSubscriptionPrice(product?.amount_subunits, product?.currency);
  const productKnown = Boolean(product?.name && product?.interval && productPrice);
  const actionDisabled = busyAction !== null || loading || Boolean(error) || !displayedStatus;
  const context = stateContext(viewState);

  async function refreshStatus() {
    if (loading || busyAction) return;
    await loadStatus();
  }

  async function runAction(action: 'cancel' | 'resume' | 'manage') {
    if (!activeSlug || actionDisabled) return;
    setBusyAction(action);

    try {
      if (action === 'cancel') {
        const response = await api.cancelRecoveryWorkspaceSubscription(activeSlug);
        if (!response.ok || !response.data?.success) {
          throw new Error(response.error || 'Unable to cancel subscription');
        }

        const reconciled = await loadStatus();
        if (!reconciled) {
          throw new Error('Cancellation request was accepted, but Margin could not refresh billing truth. Please refresh billing status.');
        }

        if (reconciled.subscription?.status === 'non_renewing') {
          trackEvent(ANALYTICS_EVENTS.subscriptionCancelled, { offer: 'recovery_workspace' });
          toast({ title: 'Cancellation scheduled', description: 'Paid-through access remains available until the backend access date.' });
        } else {
          toast({ title: 'Billing status refreshed', description: 'Margin is showing the current backend subscription state.' });
        }
        return;
      }

      if (action === 'resume') {
        const response = await api.resumeRecoveryWorkspaceSubscription(activeSlug);
        if (!response.ok || !response.data?.success) {
          throw new Error(response.error || 'Unable to resume subscription');
        }

        const reconciled = await loadStatus();
        if (!reconciled) {
          throw new Error('Resume request was accepted, but Margin could not refresh billing truth. Please refresh billing status.');
        }

        if (response.data?.new_checkout_required) {
          toast({
            title: 'Subscription was not resumed',
            description: 'The current subscription requires a new qualified checkout path. Billing does not create one directly.',
          });
        } else if (reconciled.subscription?.status === 'active') {
          trackEvent(ANALYTICS_EVENTS.subscriptionResumed, { offer: 'recovery_workspace' });
          toast({ title: 'Subscription resumed', description: 'Margin confirmed the current backend subscription is active.' });
        } else {
          toast({ title: 'Billing status refreshed', description: 'Margin is showing the current backend subscription state.' });
        }
        return;
      }

      const response = await api.getRecoveryWorkspaceManageLink(activeSlug);
      if (!response.ok || !response.data?.url) {
        throw new Error(response.error || 'Manage link is not available');
      }
      window.location.assign(response.data.url);
    } catch (actionError: unknown) {
      toast({
        title: 'Billing action failed',
        description: actionError instanceof Error ? actionError.message : 'Please refresh billing status and try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction(null);
    }
  }

  const details = [
    { label: 'Subscription status', value: subscriptionLabel(viewState) },
    { label: 'Workspace access', value: accessLabel(displayedStatus, viewState) },
    { label: 'Access until', value: formatDate(entitlement?.access_until) },
  ];

  if (viewState === 'active') {
    details.push(
      { label: 'Current period ends', value: formatDate(subscription?.current_period_end) },
      { label: 'Next payment', value: formatDate(subscription?.next_payment_at) },
    );
  } else if (viewState === 'non_renewing') {
    details.push({ label: 'Current period ends', value: formatDate(subscription?.current_period_end) });
  } else if (viewState === 'past_due_grace') {
    details.push({ label: 'Grace/access until', value: formatDate(entitlement?.access_until || subscription?.grace_expires_at) });
  } else if (viewState === 'cancelled' || viewState === 'expired') {
    details.push({ label: 'Subscription ended', value: formatDate(subscription?.ended_at || subscription?.cancelled_at) });
  }

  return (
    <PageLayout title="Billing">
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-5 border-b border-[#DCE8EE] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Recovery Workspace</p>
              <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">
                Billing
              </h1>
              <p className="mt-2.5 max-w-xl text-[14px] leading-6 text-[#66737F]">
                Review your current subscription, workspace access, and payment controls from Margin’s billing record.
              </p>
            </div>
            <Badge
              variant="outline"
              className={`w-fit rounded-full px-3 py-1 text-[12px] font-medium tracking-tight ${toneForState(viewState)}`}
            >
              {subscriptionLabel(viewState)}
            </Badge>
          </header>

          <div className="mt-6 space-y-5">
            {effectiveLoading && !displayedStatus ? (
              <div className="flex items-center gap-3 rounded-[10px] border border-[#DCE8EE] bg-white px-4 py-3.5 text-[14px] text-[#66737F] shadow-[0_1px_2px_rgba(24,32,38,0.03)]" role="status">
                <RefreshCw className="h-4 w-4 animate-spin text-[#66737F]" aria-hidden="true" />
                Loading billing status...
              </div>
            ) : error ? (
              <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-4 text-[14px] text-rose-800 shadow-[0_1px_2px_rgba(24,32,38,0.02)]" role="alert">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-semibold tracking-tight">Billing status unavailable</div>
                    <p className="mt-1 leading-5">{error}</p>
                    {displayedStatus ? (
                      <p className="mt-2 text-[13px] leading-5 text-rose-700">
                        The previous billing record remains visible below, but it may no longer be current.
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-3 h-9 rounded-md border-rose-200 bg-white px-3 text-[13px] font-medium tracking-tight text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                  onClick={() => void refreshStatus()}
                  disabled={loading || busyAction !== null}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Refresh billing status
                </Button>
              </div>
            ) : null}

            {displayedStatus ? (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]" aria-labelledby="plan-overview-heading">
                    <div className="flex flex-col gap-3 border-b border-[#DCE8EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Current plan</p>
                        <h2 id="plan-overview-heading" className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">
                          {product?.name || 'Recovery Workspace'}
                        </h2>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Current price</p>
                        <p className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">
                          {productPrice || 'Unavailable'}
                        </p>
                      </div>
                    </div>

                    <dl className="grid sm:grid-cols-2">
                      {[
                        { label: 'Product', value: product?.name || 'Product truth unavailable' },
                        { label: 'Price', value: productPrice || 'Unavailable from billing service' },
                        { label: 'Billing interval', value: product?.interval || NOT_AVAILABLE },
                        { label: 'Recovery commission', value: productKnown ? '0%' : NOT_AVAILABLE },
                      ].map((item, index) => (
                        <div
                          key={item.label}
                          className={`min-w-0 px-5 py-4 ${index > 0 ? 'border-t border-[#E7EEF2]' : ''} ${index % 2 === 1 ? 'sm:border-l sm:border-t-0' : ''} ${index >= 2 ? 'sm:border-t' : ''}`}
                        >
                          <dt className="text-[12px] font-medium tracking-tight text-[#66737F]">{item.label}</dt>
                          <dd className="mt-1.5 break-words text-[15px] font-medium tracking-tight text-[#182026]">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section className="rounded-[10px] border border-[#DCE8EE] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]" aria-labelledby="access-heading">
                    <div className="flex flex-col gap-2 border-b border-[#DCE8EE] pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Account state</p>
                        <h2 id="access-heading" className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Subscription and access</h2>
                      </div>
                      <Badge
                        variant="outline"
                        className={`w-fit rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-tight ${toneForState(viewState)}`}
                      >
                        {subscriptionLabel(viewState)}
                      </Badge>
                    </div>

                    {context ? (
                      <div className="mt-4 border-l-2 border-[#0B74DE] bg-[#F6FAFE] px-3.5 py-3 text-[13px] leading-5 text-[#4D5B66]">
                        {context}
                      </div>
                    ) : null}

                    <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                      {details.map((item, index) => (
                        <div
                          key={item.label}
                          className={`py-3.5 ${index > 0 ? 'border-t border-[#E7EEF2]' : ''} ${index < 2 ? 'sm:border-t-0 sm:pt-0' : ''}`}
                        >
                          <dt className="text-[12px] font-medium tracking-tight text-[#66737F]">{item.label}</dt>
                          <dd className="mt-1 text-[14px] font-medium tracking-tight text-[#182026]">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>

                <aside className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]" aria-labelledby="billing-controls-heading">
                  <div className="border-b border-[#DCE8EE] pb-4">
                    <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Billing controls</p>
                    <h2 id="billing-controls-heading" className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Manage your subscription</h2>
                    <p className="mt-2 text-[13px] leading-5 text-[#66737F]">
                      Review the current record before making a subscription or payment change.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-start rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#34414B] hover:bg-[#F7FAFC] hover:text-[#182026]"
                      onClick={() => void refreshStatus()}
                      disabled={loading || busyAction !== null}
                    >
                      <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                      Refresh billing status
                    </Button>

                    {actions?.manage ? (
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#34414B] hover:bg-[#F7FAFC] hover:text-[#182026]"
                        onClick={() => void runAction('manage')}
                        disabled={actionDisabled}
                      >
                        <CreditCard className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Manage payment method
                      </Button>
                    ) : null}

                    {actions?.resume ? (
                      <Button
                        className="h-9 w-full justify-start rounded-md bg-[#0B74DE] px-3 text-[13px] font-medium tracking-tight text-white hover:bg-[#005FBA]"
                        onClick={() => void runAction('resume')}
                        disabled={actionDisabled}
                      >
                        {busyAction === 'resume' ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                        Resume plan
                      </Button>
                    ) : null}
                  </div>

                  {actions?.cancel ? (
                    <div className="mt-5 border-t border-[#E7EEF2] pt-4">
                      <p className="mb-2.5 text-[12px] leading-5 text-[#66737F]">
                        Cancellation preserves access until the paid-through date shown in your subscription record.
                      </p>
                      <Button
                        variant="outline"
                        className="h-9 w-full justify-start rounded-md border-rose-200 bg-white px-3 text-[13px] font-medium tracking-tight text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => void runAction('cancel')}
                        disabled={actionDisabled}
                      >
                        {busyAction === 'cancel' ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                        Cancel plan
                      </Button>
                    </div>
                  ) : null}
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
