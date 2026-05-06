import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { buildYocoCheckoutUrl } from '@/lib/yocoCheckout';

type BillingRecordStatus =
  | 'draft'
  | 'pending'
  | 'scheduled'
  | 'pending_payment_method'
  | 'sent'
  | 'paid'
  | 'failed'
  | 'void'
  | 'charged'
  | 'credited'
  | 'refunded'
  | 'legacy';

type InvoiceRecord = {
  id: string;
  invoiceId: string;
  paymentReference: string | null;
  paymentReferenceStatus: 'available' | 'missing' | 'not_applicable';
  confirmationRequiresReference: boolean;
  invoiceType: 'subscription_invoice' | 'legacy_recovery_fee_invoice';
  invoiceModel: 'subscription' | 'legacy_recovery_fee';
  billingModel: 'flat_subscription' | 'legacy_recovery_fee';
  legacyLabel: string | null;
  planTierLabel: string | null;
  billingIntervalLabel: string | null;
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  totalAmount: number | null;
  amountCharged: number | null;
  status: BillingRecordStatus | null;
  createdAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  promoNote: string | null;
  paymentProvider: 'yoco' | null;
  paymentLinkKey: string | null;
  paymentLinkUrl: string | null;
  paymentConfirmationSource: 'manual_dashboard' | 'manual_api' | 'legacy_status_backfill' | null;
  paymentConfirmationNote: string | null;
  canConfirmPayment: boolean;
  providerInvoiceId: string | null;
  providerChargeId: string | null;
  summaryLabel: string | null;
};

type BillingSummary = {
  billingModel: 'flat_subscription';
  planTier: string | null;
  planTierLabel: string | null;
  billingInterval: string | null;
  billingIntervalLabel: string | null;
  monthlyPrice: number | null;
  annualMonthlyEquivalentPrice: number | null;
  subscriptionAmount: number | null;
  summaryCurrency: string | null;
  promoStartAt: string | null;
  promoEndAt: string | null;
  promoType: string | null;
  promoNote: string | null;
  promoActive: boolean;
  subscriptionStatus: string | null;
  nextBillingDate: string | null;
  currentPeriodStartAt: string | null;
  currentPeriodEndAt: string | null;
  billingProvider: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  legacyRecoveryBillingDisabledAt: string | null;
  invoicesTotal: number | null;
  paidInvoiceTotal: number | null;
  pendingInvoiceTotal: number | null;
  paidInvoiceCount: number | null;
  pendingInvoiceCount: number | null;
  lastInvoiceDate: string | null;
  lastPaidInvoiceDate: string | null;
  legacyRecoveryFeeCount: number | null;
  legacyRecoveryFeeTotal: number | null;
};

const NOT_AVAILABLE = 'Not Available';

const statusLabels: Record<BillingRecordStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  scheduled: 'Scheduled',
  pending_payment_method: 'Payment Method Needed',
  sent: 'Sent',
  paid: 'Paid',
  failed: 'Failed',
  void: 'Void',
  charged: 'Charged',
  credited: 'Credited',
  refunded: 'Refunded',
  legacy: 'Legacy',
};

const statusClasses: Record<BillingRecordStatus, string> = {
  draft: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  scheduled: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  pending_payment_method: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
  sent: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  paid: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  failed: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  void: 'border-stone-500/20 bg-stone-500/10 text-stone-300',
  charged: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  credited: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  refunded: 'border-stone-500/20 bg-stone-500/10 text-stone-300',
  legacy: 'border-yellow-600/20 bg-yellow-500/10 text-yellow-300',
};

function toOptionalString(value: unknown): string | null {
  const normalized = typeof value === 'string' ? value.trim() : String(value || '').trim();
  return normalized ? normalized : null;
}

function toOptionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed) : null;
}

function toStatus(value: unknown): BillingRecordStatus | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized in statusLabels) return normalized as BillingRecordStatus;
  return null;
}

function formatMoney(value: number | null | undefined, currency?: string | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || !currency) return NOT_AVAILABLE;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatConfirmationSource(value: InvoiceRecord['paymentConfirmationSource']): string {
  if (value === 'manual_dashboard') return 'Manual dashboard';
  if (value === 'manual_api') return 'Manual API';
  if (value === 'legacy_status_backfill') return 'Legacy backfill';
  return NOT_AVAILABLE;
}

function renderBadge(status: BillingRecordStatus | null) {
  if (!status) {
    return (
      <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/55">
        {NOT_AVAILABLE}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`rounded-none px-3 py-1 text-[11px] font-sans font-bold tracking-tight ${statusClasses[status]}`}>
      {statusLabels[status]}
    </Badge>
  );
}

function canShowPayAction(record: InvoiceRecord): boolean {
  if (record.invoiceModel !== 'subscription') return false;
  if (!record.paymentLinkUrl) return false;
  if (record.paymentReferenceStatus !== 'available') return false;
  return ['draft', 'pending', 'scheduled', 'pending_payment_method', 'sent'].includes(record.status || '');
}

export default function Billing() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || '';
  const { toast } = useToast();

  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BillingRecordStatus>('all');
  const [confirmingInvoiceId, setConfirmingInvoiceId] = useState<string | null>(null);
  const [paymentReferenceInputs, setPaymentReferenceInputs] = useState<Record<string, string>>({});

  async function loadBillingData(slug: string) {
    const [invoiceRes, statusRes] = await Promise.all([
      api.getBillingInvoices({ limit: 100 }, slug),
      api.getBillingStatus(undefined, slug),
    ]);

    if (!invoiceRes.ok) throw new Error(invoiceRes.error || 'Failed to load billing records');
    if (!statusRes.ok) throw new Error(statusRes.error || 'Failed to load billing summary');

    setRecords((invoiceRes.data?.invoices || []).map((invoice) => ({
      id: String(invoice.id || ''),
      invoiceId: String(invoice.invoice_id || invoice.id || ''),
      paymentReference: toOptionalString(invoice.payment_reference),
      paymentReferenceStatus: invoice.payment_reference_status || (
        toOptionalString(invoice.payment_reference)
          ? 'available'
          : invoice.invoice_model === 'subscription'
            ? 'missing'
            : 'not_applicable'
      ),
      confirmationRequiresReference: Boolean(invoice.confirmation_requires_reference),
      invoiceType: invoice.invoice_type,
      invoiceModel: invoice.invoice_model,
      billingModel: invoice.billing_model,
      legacyLabel: invoice.legacy_label || null,
      planTierLabel: invoice.plan_tier_label || null,
      billingIntervalLabel: invoice.billing_interval_label || null,
      currency: invoice.currency || null,
      periodStart: invoice.period_start || null,
      periodEnd: invoice.period_end || null,
      totalAmount: toOptionalNumber(invoice.total_amount),
      amountCharged: toOptionalNumber(invoice.amount_charged),
      status: toStatus(invoice.status),
      createdAt: toOptionalString(invoice.created_at),
      dueDate: toOptionalString(invoice.due_date),
      paidAt: toOptionalString(invoice.paid_at),
      promoNote: invoice.promo_note || null,
      paymentProvider: invoice.payment_provider || null,
      paymentLinkKey: invoice.payment_link_key || null,
      paymentLinkUrl: invoice.payment_link_url || null,
      paymentConfirmationSource: invoice.payment_confirmation_source || null,
      paymentConfirmationNote: invoice.payment_confirmation_note || null,
      canConfirmPayment: Boolean(invoice.can_confirm_payment),
      providerInvoiceId: invoice.provider_invoice_id || null,
      providerChargeId: invoice.provider_charge_id || null,
      summaryLabel: invoice.summary_label || null,
    })));

    const status = statusRes.data?.status;
    setSummary(status ? {
      billingModel: 'flat_subscription',
      planTier: status.plan_tier || null,
      planTierLabel: status.plan_tier_label || null,
      billingInterval: status.billing_interval || null,
      billingIntervalLabel: status.billing_interval_label || null,
      monthlyPrice: toOptionalNumber(status.monthly_price),
      annualMonthlyEquivalentPrice: toOptionalNumber(status.annual_monthly_equivalent_price),
      subscriptionAmount: toOptionalNumber(status.subscription_amount),
      summaryCurrency: status.summary_currency || null,
      promoStartAt: status.promo_start_at || null,
      promoEndAt: status.promo_end_at || null,
      promoType: status.promo_type || null,
      promoNote: status.promo_note || null,
      promoActive: Boolean(status.promo_active),
      subscriptionStatus: status.subscription_status || null,
      nextBillingDate: status.next_billing_date || null,
      currentPeriodStartAt: status.current_period_start_at || null,
      currentPeriodEndAt: status.current_period_end_at || null,
      billingProvider: status.billing_provider || null,
      billingCustomerId: status.billing_customer_id || null,
      billingSubscriptionId: status.billing_subscription_id || null,
      legacyRecoveryBillingDisabledAt: status.legacy_recovery_billing_disabled_at || null,
      invoicesTotal: toOptionalNumber(status.invoices_total),
      paidInvoiceTotal: toOptionalNumber(status.paid_invoice_total),
      pendingInvoiceTotal: toOptionalNumber(status.pending_invoice_total),
      paidInvoiceCount: toOptionalNumber(status.paid_invoice_count),
      pendingInvoiceCount: toOptionalNumber(status.pending_invoice_count),
      lastInvoiceDate: status.last_invoice_date || null,
      lastPaidInvoiceDate: status.last_paid_invoice_date || null,
      legacyRecoveryFeeCount: toOptionalNumber(status.legacy_recovery_fee_count),
      legacyRecoveryFeeTotal: toOptionalNumber(status.legacy_recovery_fee_total),
    } : null);
  }

  useEffect(() => {
    if (!isReady) return;
    if (!activeSlug) {
      setRecords([]);
      setSummary(null);
      setLoading(false);
      setError('Billing tenant context is Not Available.');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        if (cancelled) return;
        await loadBillingData(activeSlug);
      } catch (fetchError: unknown) {
        const message = fetchError instanceof Error ? fetchError.message : 'Billing information is Not Available.';
        if (!cancelled) {
          setRecords([]);
          setSummary(null);
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSlug, isReady]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !term
        || record.invoiceId.toLowerCase().includes(term)
        || (record.paymentReference || '').toLowerCase().includes(term)
        || (record.summaryLabel || '').toLowerCase().includes(term)
        || (record.paymentLinkKey || '').toLowerCase().includes(term)
        || (record.providerInvoiceId || '').toLowerCase().includes(term)
        || (record.legacyLabel || '').toLowerCase().includes(term)
        || (record.status ? statusLabels[record.status] : NOT_AVAILABLE).toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  async function handleConfirmPayment(record: InvoiceRecord) {
    if (!activeSlug) return;
    const enteredPaymentReference = (paymentReferenceInputs[record.id] || '').trim();

    if (record.confirmationRequiresReference && !enteredPaymentReference) {
      toast({
        title: 'Payment reference required',
        description: 'Enter the invoice payment reference before confirming payment.',
        variant: 'destructive',
      });
      return;
    }

    setConfirmingInvoiceId(record.id);
    try {
      const response = await api.confirmBillingInvoicePayment(
        record.invoiceId || record.id,
        {
          confirmation_source: 'manual_dashboard',
          payment_reference: enteredPaymentReference,
        },
        activeSlug,
      );

      if (!response.ok) {
        throw new Error(response.error || 'Unable to confirm payment');
      }

      await loadBillingData(activeSlug);
      setPaymentReferenceInputs((current) => {
        const next = { ...current };
        delete next[record.id];
        return next;
      });
      toast({
        title: response.data?.already_confirmed ? 'Payment already confirmed' : 'Payment confirmed',
        description: `Invoice ${record.invoiceId || record.id} is now using backend-confirmed paid status.`,
      });
    } catch (confirmError: unknown) {
      toast({
        title: 'Unable to confirm payment',
        description: confirmError instanceof Error ? confirmError.message : 'Payment confirmation is Not Available.',
        variant: 'destructive',
      });
    } finally {
      setConfirmingInvoiceId(null);
    }
  }

  return (
    <PageLayout title="Billing">
      <div className="platform-vitality-page min-h-screen bg-[#F9FAFB] text-[#111827]">
        <div className="relative container mx-auto space-y-10 px-8 pb-20 pt-10">
          <div className="border-b border-white/10 pb-10">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/20">Subscription Billing // Backend Truth</div>
            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl space-y-3">
                <h1 className="text-4xl font-sans font-light tracking-tight text-white">Billing</h1>
                <p className="text-sm font-sans leading-6 text-white/55">
                  Billing now reflects flat subscription truth: plan, interval, invoice state, promo window, YOCO checkout execution, and historical legacy records. Recoveries remain proof of value, but they do not create new charges.
                </p>
                <p className="text-sm font-sans leading-6 text-white/42">
                  If subscription, invoice, payment-link, provider, or payment-confirmation truth is absent, this page renders {NOT_AVAILABLE} instead of inferring a paid state.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Tenant: {activeSlug || NOT_AVAILABLE}</Badge>
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Plan: {summary?.planTierLabel || NOT_AVAILABLE}</Badge>
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Status: {summary?.subscriptionStatus || NOT_AVAILABLE}</Badge>
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Next billing: {formatDate(summary?.nextBillingDate)}</Badge>
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Promo ends: {formatDate(summary?.promoEndAt)}</Badge>
                <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 text-white/60">Legacy fee records: {summary?.legacyRecoveryFeeCount ?? NOT_AVAILABLE}</Badge>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10 xl:grid-cols-6">
            {[
              { label: 'Subscription price', value: formatMoney(summary?.subscriptionAmount, summary?.summaryCurrency) },
              { label: 'Paid invoices', value: formatMoney(summary?.paidInvoiceTotal, summary?.summaryCurrency) },
              { label: 'Pending invoices', value: formatMoney(summary?.pendingInvoiceTotal, summary?.summaryCurrency) },
              { label: 'Last invoice', value: formatDate(summary?.lastInvoiceDate) },
              { label: 'Last paid invoice', value: formatDate(summary?.lastPaidInvoiceDate) },
              { label: 'Legacy fee total', value: formatMoney(summary?.legacyRecoveryFeeTotal, summary?.summaryCurrency) },
            ].map((card) => (
              <div key={card.label} className="space-y-2">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{card.label}</p>
                <p className="text-2xl font-sans font-bold tracking-tight text-white">{card.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-2">
            <section className="space-y-6">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Subscription truth</div>
              <div className="space-y-4 text-[13px] font-sans text-white/70">
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Plan tier</span><span className="text-right font-bold text-white/90">{summary?.planTierLabel || NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Billing interval</span><span className="text-right font-bold text-white/90">{summary?.billingIntervalLabel || NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Monthly price</span><span className="text-right font-bold text-white/90">{formatMoney(summary?.monthlyPrice, summary?.summaryCurrency)}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Annual monthly equivalent</span><span className="text-right font-bold text-white/90">{formatMoney(summary?.annualMonthlyEquivalentPrice, summary?.summaryCurrency)}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Current period</span><span className="text-right font-bold text-white/90">{summary?.currentPeriodStartAt && summary?.currentPeriodEndAt ? `${formatDate(summary.currentPeriodStartAt)} - ${formatDate(summary.currentPeriodEndAt)}` : NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Promo note</span><span className="max-w-[24rem] text-right font-bold text-white/90">{summary?.promoNote || NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Legacy fee billing disabled</span><span className="text-right font-bold text-white/90">{formatDate(summary?.legacyRecoveryBillingDisabledAt)}</span></div>
              </div>
            </section>

            <section className="space-y-6 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Billing settings</div>
              <div className="space-y-4 text-[13px] font-sans text-white/70">
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Billing model</span><span className="text-right font-bold text-white/90">Flat subscription</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Payment execution layer</span><span className="text-right font-bold text-white/90">{summary?.billingProvider === 'yoco' ? 'YOCO checkout links' : NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Provider customer ID</span><span className="text-right font-bold text-white/90">{summary?.billingCustomerId || NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Provider subscription ID</span><span className="text-right font-bold text-white/90">{summary?.billingSubscriptionId || NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Invoice count</span><span className="text-right font-bold text-white/90">{summary?.invoicesTotal ?? NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Pending invoice count</span><span className="text-right font-bold text-white/90">{summary?.pendingInvoiceCount ?? NOT_AVAILABLE}</span></div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4"><span className="text-white/40">Paid invoice count</span><span className="text-right font-bold text-white/90">{summary?.paidInvoiceCount ?? NOT_AVAILABLE}</span></div>
                <p className="pt-2 text-[13px] leading-6 text-white/50">
                  YOCO is the checkout execution layer. A checkout click is not payment truth. Invoice status stays backend-owned until an explicit backend confirmation marks the invoice paid, and missing payment-link or confirmation truth renders as {NOT_AVAILABLE}.
                </p>
              </div>
            </section>
          </div>

          <section className="border-t border-white/10 pt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-sans font-bold tracking-tight text-white">Billing records</h2>
                <p className="text-[13px] font-sans leading-6 text-white/50">
                  Subscription invoices are the active billing truth. Historical recovery-fee rows remain visible only as legacy records and do not affect current subscription billing.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by invoice ID, payment reference, status, or link key" className="h-10 min-w-[280px] rounded-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-sans" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | BillingRecordStatus)}>
                  <SelectTrigger className="h-10 min-w-[180px] rounded-none border-white/10 bg-white/5 text-white font-sans">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="platform-vitality-page border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10">
              {loading && <div className="py-16 text-sm font-sans text-white/50">Loading subscription billing records...</div>}
              {error && !loading && (
                <div className="space-y-3 py-16">
                  <div className="text-sm font-sans text-rose-300">{error}</div>
                  <Button variant="outline" className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              )}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="px-0 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Billing record</TableHead>
                        <TableHead className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Date</TableHead>
                        <TableHead className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Status</TableHead>
                        <TableHead className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Billing model</TableHead>
                        <TableHead className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Plan</TableHead>
                        <TableHead className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Interval</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Invoice total</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Charged</TableHead>
                        <TableHead className="pr-0 text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                        <TableRow key={`${record.id}-${record.invoiceId}`} className="border-white/10">
                          <TableCell className="px-0 py-5 text-[13px] font-sans text-white/85">
                            <div className="font-bold tracking-tight">{record.invoiceId || NOT_AVAILABLE}</div>
                            <div className="mt-1 text-[11px] text-white/45">{record.summaryLabel || record.legacyLabel || NOT_AVAILABLE}</div>
                            <div className="mt-2 space-y-1 text-[11px] text-white/50">
                              <div>Invoice type: {record.invoiceType === 'subscription_invoice' ? 'Subscription Invoice' : 'Legacy Recovery Fee Invoice'}</div>
                              <div>Payment provider: {record.paymentProvider === 'yoco' ? 'YOCO' : NOT_AVAILABLE}</div>
                              <div>Payment reference: {record.paymentReference || NOT_AVAILABLE}</div>
                              <div>Payment link key: {record.paymentLinkKey || NOT_AVAILABLE}</div>
                              <div>Period: {record.periodStart && record.periodEnd ? `${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}` : NOT_AVAILABLE}</div>
                              <div>Paid at: {formatDateTime(record.paidAt)}</div>
                              <div>Confirmation source: {formatConfirmationSource(record.paymentConfirmationSource)}</div>
                              {record.paymentConfirmationNote ? <div>Confirmation note: {record.paymentConfirmationNote}</div> : null}
                              {record.invoiceModel === 'legacy_recovery_fee' ? <div>Provider invoice: {record.providerInvoiceId || NOT_AVAILABLE}</div> : null}
                              {record.invoiceModel === 'legacy_recovery_fee' ? <div>Provider charge: {record.providerChargeId || NOT_AVAILABLE}</div> : null}
                              {record.promoNote ? <div>{record.promoNote}</div> : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-[13px] font-sans text-white/65">{formatDate(record.createdAt)}</TableCell>
                          <TableCell>{renderBadge(record.status)}</TableCell>
                          <TableCell className="text-[13px] font-sans text-white/70">{record.billingModel === 'flat_subscription' ? 'Flat Subscription' : 'Legacy Recovery Fee'}</TableCell>
                          <TableCell className="text-[13px] font-sans text-white/70">{record.planTierLabel || (record.billingModel === 'legacy_recovery_fee' ? 'Not Available' : NOT_AVAILABLE)}</TableCell>
                          <TableCell className="text-[13px] font-sans text-white/70">{record.billingIntervalLabel || (record.billingModel === 'legacy_recovery_fee' ? 'Not Available' : NOT_AVAILABLE)}</TableCell>
                          <TableCell className="text-right text-[13px] font-sans font-bold text-white">{formatMoney(record.totalAmount, record.currency)}</TableCell>
                          <TableCell className="text-right text-[13px] font-sans text-white/70">{formatMoney(record.amountCharged, record.currency)}</TableCell>
                          <TableCell className="pr-0 text-right">
                            <div className="flex flex-col items-end gap-2">
                              {record.invoiceModel === 'subscription' ? (
                                <div className="max-w-[16rem] text-right text-[11px] font-sans leading-5 text-white/45">
                                  {record.paymentReferenceStatus === 'available'
                                    ? 'Use this payment reference when completing your YOCO payment.'
                                    : NOT_AVAILABLE}
                                </div>
                              ) : null}
                              {canShowPayAction(record) ? (
                                <Button
                                  variant="outline"
                                  className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                                  onClick={() => {
                                    const checkoutUrl = buildYocoCheckoutUrl(record.paymentLinkUrl || '', {
                                      kind: 'invoice',
                                      offer: record.planTierLabel || record.summaryLabel || 'Subscription Invoice',
                                      price: formatMoney(record.totalAmount, record.currency),
                                      tenantSlug: activeSlug || null,
                                      invoiceId: record.invoiceId || record.id,
                                      returnPath: activeSlug ? `/app/${activeSlug}/billing` : '/app',
                                    });
                                    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  Pay Subscription Invoice
                                </Button>
                              ) : record.invoiceModel === 'subscription' && record.status === 'paid' ? (
                                <div className="text-[11px] font-sans text-white/45">Paid</div>
                              ) : record.invoiceModel === 'subscription' && record.paymentLinkUrl && record.paymentReferenceStatus === 'available' ? (
                                <div className="text-[11px] font-sans text-white/45">Not Payable</div>
                              ) : (
                                <div className="text-[11px] font-sans text-white/45">{record.invoiceModel === 'subscription' ? NOT_AVAILABLE : 'Legacy Record'}</div>
                              )}
                              {record.canConfirmPayment ? (
                                <>
                                  <Input
                                    value={paymentReferenceInputs[record.id] || ''}
                                    onChange={(event) => setPaymentReferenceInputs((current) => ({
                                      ...current,
                                      [record.id]: event.target.value,
                                    }))}
                                    placeholder="Enter payment reference"
                                    className="h-9 w-[220px] rounded-none border-white/10 bg-white/5 text-right text-[11px] text-white placeholder:text-white/25 font-sans"
                                  />
                                  <Button
                                    variant="outline"
                                    disabled={confirmingInvoiceId === record.id || (record.confirmationRequiresReference && !(paymentReferenceInputs[record.id] || '').trim())}
                                    className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight disabled:opacity-50"
                                    onClick={() => void handleConfirmPayment(record)}
                                  >
                                    {confirmingInvoiceId === record.id ? 'Confirming...' : 'Confirm Payment'}
                                  </Button>
                                </>
                              ) : null}
                              <Button
                                variant="outline"
                                className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                                onClick={async () => {
                                  try {
                                    await api.downloadInvoicePdf(record.invoiceId || record.id, activeSlug);
                                    toast({
                                      title: 'Invoice download started',
                                      description: `Invoice ${record.invoiceId || record.id} is being downloaded.`,
                                    });
                                  } catch {
                                    toast({
                                      title: 'Unable to download invoice PDF',
                                      description: 'The invoice PDF could not be generated.',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                              >
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow className="border-white/10">
                          <TableCell colSpan={9} className="px-0 py-16 text-center text-[13px] font-sans text-white/45">
                            No billing records match the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </section>

          <section className="border-t border-white/10 pt-10">
            <div className="mb-6 space-y-2">
              <Badge variant="outline" className="rounded-none border-white/10 bg-white/5 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">Billing FAQ</Badge>
              <h2 className="text-[28px] font-sans font-light tracking-tight text-white">Subscription model</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-0 border-t border-white/10">
              {[
                {
                  q: 'What creates a billing record now?',
                  a: 'New billing records come from subscription billing truth only: plan tier, billing interval, invoice state, and YOCO checkout-link execution truth. Recoveries do not create new Margin charges.',
                },
                {
                  q: 'What does the 30-day promo mean?',
                  a: 'For the first 30 days you keep 100% of recoveries. The pricing model remains flat subscription billing, and there is no commission model after the promo ends.',
                },
                {
                  q: 'What are legacy recovery-fee rows?',
                  a: 'They are historical records from before the flat subscription migration. They remain visible for historical truth only and do not affect current subscription totals.',
                },
                {
                  q: 'What if a YOCO payment link is missing?',
                  a: 'This page fails closed. If the backend cannot resolve the exact YOCO link for a subscription invoice, the invoice still renders but the Pay action shows Not Available.',
                },
                {
                  q: 'Does this page auto-confirm payment after checkout?',
                  a: 'No automatic settlement is implied here. A YOCO link click does not mark an invoice paid. Invoice status stays backend-owned until an explicit backend confirmation marks that invoice paid.',
                },
              ].map((item, index) => (
                <AccordionItem key={item.q} value={`item-${index}`} className="border-b border-white/10">
                  <AccordionTrigger className="py-6 text-left text-[13px] font-sans font-bold tracking-tight text-white/85 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-[13px] font-sans leading-6 text-white/55">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <div className="border-t border-white/10 pt-10 text-sm font-sans text-white/45">
            Need billing help? billing@margin-finance.com
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
