import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { api, detectionApi } from '@/lib/api';

type BillingRowStatus =
  | 'pending'
  | 'sent'
  | 'charged'
  | 'credited'
  | 'failed'
  | 'refunded'
  | 'due'
  | 'overdue'
  | 'paid';

interface InvoiceRecord {
  id: string;
  dateIssued: string;
  status: BillingRowStatus;
  totalRecovered: number;
  commission: number;
  creditApplied: number;
  amountDue: number;
  remainingCreditBalance: number;
  amountCharged: number;
  recoveryClaimIds?: string[];
  paypalInvoiceId?: string | null;
  settlementId?: string | null;
  payoutBatchId?: string | null;
  referenceIds?: string[];
  eventIds?: string[];
}

interface BillingSummary {
  totalRecovered: number;
  totalFees: number;
  totalCreditApplied: number;
  totalAmountDue: number;
  pendingBilling: number;
  availableCreditBalance: number;
  lastBillingDate?: string;
  lastPayoutDate?: string | null;
  payoutCount?: number;
  currentRecoveryCycleId?: string | null;
  currentRecoveryCycleType?: string | null;
  currentRecoveryCycleStartedAt?: string | null;
}

const statusLabels: Record<BillingRowStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  charged: 'Paid',
  credited: 'Credited',
  failed: 'Failed',
  refunded: 'Refunded',
  due: 'Due',
  overdue: 'Overdue',
  paid: 'Paid',
};

const statusStyles: Record<BillingRowStatus, string> = {
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  sent: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  charged: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  credited: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  failed: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  refunded: 'border-stone-500/20 bg-stone-500/10 text-stone-300',
  due: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  overdue: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  paid: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

const metricCards = [
  {
    key: 'availableCreditBalance',
    label: 'Credit balance',
  },
  {
    key: 'totalRecovered',
    label: 'Verified recovered',
  },
  {
    key: 'totalFees',
    label: 'Platform fees',
  },
  {
    key: 'totalCreditApplied',
    label: 'Credit applied',
  },
  {
    key: 'totalAmountDue',
    label: 'Total amount due',
  },
  {
    key: 'pendingBilling',
    label: 'Pending billing',
  },
] as const;

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeInvoiceStatus(status: unknown): BillingRowStatus {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'settled') return 'paid';
  if (normalized in statusLabels) return normalized as BillingRowStatus;
  return 'pending';
}

export default function Billing() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady, tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || 'beta';
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vaultedEmail, setVaultedEmail] = useState<string | null>(null);
  const [isVaulting, setIsVaulting] = useState(false);
  const [invoiceRecipients, setInvoiceRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [taxId, setTaxId] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BillingRowStatus>('all');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('clario.billing') || 'null');
      if (saved) {
        setInvoiceRecipients(Array.isArray(saved.recipients) ? saved.recipients : []);
        setTaxId(saved.taxId || '');
      }
    } catch {
      setInvoiceRecipients([]);
      setTaxId('');
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await api.getUserProfile(activeSlug);
        const profile = (res.data as any) || {};
        if (!cancelled && res.ok && profile?.paypal_payment_token) {
          setVaultedEmail(profile.paypal_email || 'Linked PayPal account');
        }
      } catch (fetchError) {
        console.error('Failed to fetch vault status:', fetchError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, activeSlug]);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [invoiceRes, statusRes] = await Promise.all([
          api.getBillingInvoices({ limit: 100 }, activeSlug),
          api.getBillingStatus(undefined, activeSlug),
        ]);

        if (cancelled) return;

        if (!invoiceRes.ok) {
          throw new Error(invoiceRes.error || 'Failed to load billing history');
        }

        if (!statusRes.ok) {
          throw new Error(statusRes.error || 'Failed to load billing summary');
        }

        const mappedInvoices: InvoiceRecord[] = (invoiceRes.data?.invoices || []).map((invoice: any) => ({
          id: String(invoice.id || invoice.invoice_id || ''),
          dateIssued: String(invoice.period_end || invoice.created_at || new Date().toISOString()).split('T')[0],
          status: normalizeInvoiceStatus(invoice.status),
          totalRecovered: Number(invoice.confirmed_recovered_amount || invoice.total_amount || 0),
          commission: Number(invoice.platform_fee || invoice.commission || 0),
          creditApplied: Number(invoice.credit_applied || 0),
          amountDue: Number(invoice.amount_due || 0),
          remainingCreditBalance: Number(invoice.available_credit_balance || 0),
          amountCharged: Number(invoice.amount_due || 0),
          recoveryClaimIds: invoice.recovery_claim_ids || [],
          paypalInvoiceId: invoice.paypal_invoice_id || null,
          settlementId: invoice.settlement_id || null,
          payoutBatchId: invoice.payout_batch_id || null,
          referenceIds: Array.isArray(invoice.reference_ids) ? invoice.reference_ids : [],
          eventIds: Array.isArray(invoice.event_ids) ? invoice.event_ids : [],
        }));

        setInvoices(mappedInvoices);
        setBillingSummary({
          totalRecovered: Number(statusRes.data?.status?.total_recovered || 0),
          totalFees: Number(statusRes.data?.status?.total_fees || 0),
          totalCreditApplied: Number(statusRes.data?.status?.total_credit_applied || 0),
          totalAmountDue: Number(statusRes.data?.status?.total_amount_due || 0),
          pendingBilling: Number(statusRes.data?.status?.pending_billing || 0),
          availableCreditBalance: Number(statusRes.data?.status?.available_credit_balance || 0),
          lastBillingDate: statusRes.data?.status?.last_billing_date,
          lastPayoutDate: statusRes.data?.status?.last_payout_date || null,
          payoutCount: Number(statusRes.data?.status?.payout_count || 0),
          currentRecoveryCycleId: statusRes.data?.status?.current_recovery_cycle_id || null,
          currentRecoveryCycleType: statusRes.data?.status?.current_recovery_cycle_type || null,
          currentRecoveryCycleStartedAt: statusRes.data?.status?.current_recovery_cycle_started_at || null,
        });
      } catch (fetchError: any) {
        console.error('Failed to fetch billing data:', fetchError);
        if (!cancelled) {
          setInvoices([]);
          setBillingSummary(null);
          setError(fetchError.message || 'Billing information is temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, activeSlug]);

  const handleLinkPaymentMethod = async () => {
    setIsVaulting(true);
    try {
      const setupRes = await detectionApi.getVaultSetupToken();
      if (!setupRes.ok) throw new Error(setupRes.error || 'Failed to start PayPal setup');

      const setupTokenId = setupRes.data?.setupToken?.id;
      const sellerId = localStorage.getItem('user_id') || 'demo-user';
      const finalizeRes = await detectionApi.finalizeVaulting(setupTokenId, sellerId);
      if (!finalizeRes.ok) throw new Error(finalizeRes.error || 'Failed to save PayPal billing method');

      setVaultedEmail(finalizeRes.data?.paypalEmail || 'Linked PayPal account');
      toast({
        title: 'Payment method linked',
        description: 'PayPal can now be used for future platform invoices and prepaid credits.',
      });
    } catch (vaultError: any) {
      toast({
        title: 'Unable to link payment method',
        description: vaultError.message || 'PayPal setup failed.',
        variant: 'destructive',
      });
    } finally {
      setIsVaulting(false);
    }
  };

  const saveBillingSettings = () => {
    localStorage.setItem('clario.billing', JSON.stringify({ recipients: invoiceRecipients, taxId }));
    toast({
      title: 'Billing settings saved',
      description: 'Invoice recipients and tax details have been updated locally.',
    });
  };

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch =
        !term ||
        invoice.id.toLowerCase().includes(term) ||
        statusLabels[invoice.status].toLowerCase().includes(term) ||
        (invoice.paypalInvoiceId || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, statusFilter]);

  return (
    <PageLayout title="Billing" midnight>
      <div className="min-h-screen bg-[#070707] text-white relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="relative container mx-auto px-8 pt-10 pb-20 space-y-10">
          <div className="border-b border-white/10 pb-10">
            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/20">Recovery Billing // Live State</div>
            <div className="mt-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div className="space-y-3 max-w-4xl">
                <h1 className="text-4xl font-sans font-light tracking-tight text-white">Billing &amp; Recoveries</h1>
                <p className="text-sm font-sans leading-6 text-white/55">
                  Margin uses software billing tied to verified recovery outcomes. The standard platform fee is 20%, and any $99 prepaid platform credit is applied automatically.
                </p>
                <p className="text-sm font-sans leading-6 text-white/42">
                  Amazon pays your seller account directly. Margin issues separate software invoices after recovery verification, and unused prepaid credit carries forward.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 rounded-none">
                Tenant: {activeSlug || 'Unavailable'}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 rounded-none">
                {billingSummary?.lastBillingDate
                  ? `Last billed ${new Date(billingSummary.lastBillingDate).toLocaleDateString()}`
                  : 'Billing date unavailable'}
                </Badge>
                {billingSummary?.lastPayoutDate ? (
                  <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 rounded-none">
                    Last payout proof {new Date(billingSummary.lastPayoutDate).toLocaleDateString()}
                  </Badge>
                ) : null}
                {typeof billingSummary?.payoutCount === 'number' ? (
                  <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 rounded-none">
                    Proof events: {billingSummary.payoutCount}
                  </Badge>
                ) : null}
                {billingSummary?.currentRecoveryCycleType && billingSummary?.currentRecoveryCycleStartedAt ? (
                  <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5 rounded-none">
                    Cycle: {billingSummary.currentRecoveryCycleType} • Started {new Date(billingSummary.currentRecoveryCycleStartedAt).toLocaleDateString()}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <section className="border-t border-white/10 pt-10">
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-8">
            {metricCards.map((metric) => (
              <div key={metric.key} className="space-y-2">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{metric.label}</p>
                  <p className="text-2xl font-sans font-bold text-white tracking-tight tabular-nums">
                    {billingSummary ? formatMoney(billingSummary[metric.key]) : '—'}
                  </p>
              </div>
            ))}
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-2 border-t border-white/10 pt-10">
            <section className="space-y-6">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Current recovery cycle</div>
              <div className="space-y-4 text-[13px] font-sans text-white/70">
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                  <span className="text-white/40">Recovery cycle ID</span>
                  <span className="text-right text-white/90 font-bold tracking-tight">
                    {billingSummary?.currentRecoveryCycleId || 'No active recovery cycle'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                  <span className="text-white/40">Cycle type</span>
                  <span className="text-right text-white/90 font-bold tracking-tight">
                    {billingSummary?.currentRecoveryCycleType || 'Not available'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-4">
                  <span className="text-white/40">Cycle started</span>
                  <span className="text-right text-white/90 font-bold tracking-tight">
                    {billingSummary?.currentRecoveryCycleStartedAt
                      ? new Date(billingSummary.currentRecoveryCycleStartedAt).toLocaleDateString()
                      : 'Not available'}
                  </span>
                </div>
                <p className="pt-2 text-[13px] leading-6 text-white/50">
                  The prepaid $99 Priority Audit Pass is attached to a recovery cycle. Any unused credit carries forward until it is
                  applied against future platform fees.
                </p>
              </div>
            </section>

            <section className="space-y-6 border-t border-white/10 pt-8 lg:border-t-0 lg:border-l lg:pl-10">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">PayPal billing method</div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Current billing method</div>
                  <div className="text-sm font-sans font-bold text-white tracking-tight">
                    {vaultedEmail || 'No linked PayPal account'}
                  </div>
                </div>
                <div className="text-[13px] font-sans leading-6 text-white/50">
                  The upfront $99 pass uses PayPal checkout. Later software invoices can use PayPal invoicing or an authorized
                  PayPal billing method after a recovery has been verified. Amazon reimbursement funds are always paid directly to your seller account.
                </div>
                <Button
                  onClick={handleLinkPaymentMethod}
                  disabled={isVaulting}
                  className="h-10 rounded-none border border-white/10 bg-white text-black hover:bg-white/90 font-sans font-bold text-[10px] uppercase tracking-tight"
                >
                  {isVaulting ? 'Linking PayPal...' : vaultedEmail ? 'Update PayPal method' : 'Link PayPal method'}
                </Button>
              </div>
            </section>
          </div>

          <section className="border-t border-white/10 pt-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]">
              <div className="space-y-3">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Billing settings</div>
                <p className="text-sm font-sans leading-6 text-white/50">
                  Invoice recipient and tax-detail preferences are still saved locally on this machine.
                </p>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Invoice recipients</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email address"
                      value={newRecipient}
                      onChange={(event) => setNewRecipient(event.target.value)}
                      className="h-10 rounded-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-sans"
                    />
                    <Button
                      variant="outline"
                      className="h-10 rounded-none border-white/10 bg-white text-black hover:bg-white/90 font-sans font-bold text-[10px] uppercase tracking-tight"
                      onClick={() => {
                        if (!newRecipient.trim()) return;
                        setInvoiceRecipients((current) => [...current, newRecipient.trim()]);
                        setNewRecipient('');
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {invoiceRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {invoiceRecipients.map((recipient, index) => (
                        <Badge
                          key={`${recipient}-${index}`}
                          variant="outline"
                          className="border-white/10 bg-white/5 px-3 py-1 text-[11px] font-sans font-bold text-white/75 tracking-tight rounded-none"
                        >
                          {recipient}
                          <button
                            type="button"
                            className="ml-2 text-white/50 hover:text-white"
                            onClick={() => setInvoiceRecipients((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                          >
                            Remove
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Tax details</label>
                  <Input
                    placeholder="Tax ID"
                    value={taxId}
                    onChange={(event) => setTaxId(event.target.value)}
                    className="h-10 rounded-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-sans"
                  />
                </div>

                <Button
                  onClick={saveBillingSettings}
                  className="h-10 rounded-none border border-white/10 bg-white text-black hover:bg-white/90 font-sans font-bold text-[10px] uppercase tracking-tight"
                >
                  Save billing settings
                </Button>
              </div>
            </div>
          </section>

          <section className="border-t border-white/10 pt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-sans font-bold tracking-tight text-white">Billing history</h2>
                <p className="text-[13px] font-sans leading-6 text-white/50">
                  One verified recovery event reconciled in Margin creates one billing record. Each row shows confirmed recovered amount, platform fee, credit applied,
                  amount due, remaining credit balance, and proof-of-payment identifiers from canonical financial events.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Search by invoice ID, status, or PayPal invoice ID"
                  value={invoiceSearch}
                  onChange={(event) => setInvoiceSearch(event.target.value)}
                  className="h-10 min-w-[280px] rounded-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 font-sans"
                />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | BillingRowStatus)}>
                  <SelectTrigger className="h-10 min-w-[180px] rounded-none border-white/10 bg-white/5 text-white font-sans">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10 text-white">
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10">
              {loading && (
                <div className="py-16 text-sm font-sans text-white/50">
                  Loading billing history and credit balance...
                </div>
              )}

              {error && !loading && (
                <div className="space-y-3 py-16">
                  <div className="text-sm font-sans text-rose-300">{error}</div>
                  <Button
                    variant="outline"
                    className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                    onClick={() => window.location.reload()}
                  >
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
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Verified recovered</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Platform fee</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Credit applied</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Amount due</TableHead>
                        <TableHead className="text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Credit balance</TableHead>
                        <TableHead className="pr-0 text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id} className="border-white/10">
                            <TableCell className="px-0 py-5 text-[13px] font-sans text-white/85">
                              <div className="font-bold tracking-tight">{invoice.id}</div>
                              {invoice.paypalInvoiceId && (
                                <div className="mt-1 text-[11px] text-white/45">PayPal invoice {invoice.paypalInvoiceId}</div>
                              )}
                              <div className="mt-2 space-y-1 text-[11px] text-white/50">
                                <div>
                                  {invoice.settlementId
                                    ? `Recovered via Settlement ${invoice.settlementId}`
                                    : 'No settlement proof attached yet'}
                                </div>
                                {invoice.payoutBatchId ? (
                                  <div>Batch {invoice.payoutBatchId}</div>
                                ) : null}
                                {invoice.referenceIds && invoice.referenceIds.length > 0 ? (
                                  <div>Reference IDs: {invoice.referenceIds.slice(0, 3).join(', ')}</div>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-[13px] font-sans text-white/65">
                              {new Date(invoice.dateIssued).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn('px-3 py-1 text-[11px] font-sans font-bold tracking-tight rounded-none', statusStyles[invoice.status])}
                              >
                                {statusLabels[invoice.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-sans text-white/85">
                              {formatMoney(invoice.totalRecovered)}
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-sans text-white/70">
                              {formatMoney(invoice.commission)}
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-sans text-white/70">
                              {formatMoney(invoice.creditApplied)}
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-sans font-bold text-white">
                              {formatMoney(invoice.amountDue)}
                            </TableCell>
                            <TableCell className="text-right text-[13px] font-sans text-white/70">
                              {formatMoney(invoice.remainingCreditBalance)}
                            </TableCell>
                            <TableCell className="pr-0 text-right">
                              <Button
                                variant="outline"
                                className="rounded-none border-white/10 bg-transparent text-white hover:bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                                onClick={async () => {
                                  try {
                                    await api.downloadInvoicePdf(invoice.id, activeSlug);
                                    toast({
                                      title: 'Invoice download started',
                                      description: `Invoice ${invoice.id} is being downloaded.`,
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
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
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
              <Badge variant="outline" className="border-white/10 bg-white/5 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 rounded-none">
                Billing FAQ
              </Badge>
              <h2 className="text-[28px] font-sans font-light tracking-tight text-white">Billing model</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-0 border-t border-white/10">
              {[
                {
                  q: 'What is the $99 payment?',
                  a: 'The $99 payment is a one-time Priority Audit Pass for a recovery cycle. It is stored as prepaid credit and linked to the recovery cycle in the billing system.',
                },
                {
                  q: 'When is the platform fee billed?',
                  a: 'The 20% platform fee is billed only after a payout has been verified and reconciled in Margin. Approved or expected money does not create a billing record by itself.',
                },
                {
                  q: 'How is credit applied?',
                  a: 'When a verified recovery creates a billing record, available prepaid credit is applied first. The remaining amount, if any, becomes the amount due.',
                },
                {
                  q: 'Can I pay more than 20% total?',
                  a: 'No. The $99 prepaid pass is platform credit applied toward the standard 20% platform fee, not an additional charge on top of it.',
                },
                {
                  q: 'What happens if my available credit is larger than the fee?',
                  a: 'The billing record is marked as credited, no extra charge is issued, and the unused balance carries forward to future platform fees.',
                },
                {
                  q: 'How does PayPal fit into billing?',
                  a: 'PayPal can be used for prepaid platform credit and later software invoices. Amazon reimbursement funds are paid directly to your seller account and do not flow through Margin.',
                },
              ].map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-white/10">
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
