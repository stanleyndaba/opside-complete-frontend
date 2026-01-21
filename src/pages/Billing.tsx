import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select as UiSelect } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Download,
  CreditCard,
  Shield,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface InvoiceRecord {
  id: string;
  dateIssued: string;
  status: 'Paid' | 'Due' | 'Overdue';
  totalRecovered: number;
  commission: number;
  amountCharged: number;
  recoveryClaimIds?: string[];
}

const getStatusColor = (status: InvoiceRecord['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Due':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const handleStripePaymentUpdate = () => {
  // This would integrate with Stripe to update payment method
  alert('Stripe payment method update would open here');
};

export default function Billing() {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Billing settings
  const [invoiceRecipients, setInvoiceRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [taxId, setTaxId] = useState('');

  // Load billing settings from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('clario.billing') || 'null');
      if (saved) {
        setInvoiceRecipients(Array.isArray(saved.recipients) ? saved.recipients : []);
        setTaxId(saved.taxId || '');
      }
    } catch { }
  }, []);

  // Load billing invoices from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getBillingInvoices({ limit: 100 });
        if (!cancelled) {
          if (response.ok && response.data?.invoices) {
            // Map API response to frontend format
            const mappedInvoices: InvoiceRecord[] = response.data.invoices.map((inv: any) => {
              // Determine status based on API response
              let status: 'Paid' | 'Due' | 'Overdue' = 'Paid';
              if (inv.status) {
                const statusLower = inv.status.toLowerCase();
                if (statusLower === 'due' || statusLower === 'pending') status = 'Due';
                else if (statusLower === 'overdue') status = 'Overdue';
                else if (statusLower === 'paid' || statusLower === 'completed') status = 'Paid';
              }

              // Use period_end as dateIssued (invoice date)
              const dateIssued = inv.period_end || inv.created_at || inv.date_issued || new Date().toISOString();

              return {
                id: inv.id || inv.invoice_id || `INV-${Date.now()}`,
                dateIssued: dateIssued.split('T')[0], // Extract date part
                status,
                totalRecovered: inv.total_amount || inv.total_recovered || 0,
                commission: inv.platform_fee || inv.commission || 0,
                amountCharged: inv.platform_fee || inv.amount_charged || 0,
                recoveryClaimIds: inv.recovery_claim_ids || inv.recovery_ids || []
              };
            });
            setInvoices(mappedInvoices);
            setError(null);
          } else {
            setInvoices([]);
            setError(response.error || 'Failed to load billing invoices');
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load billing invoices:', err);
          setInvoices([]);
          // Show friendly error message instead of raw error
          setError("We couldn't load your billing history. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveBillingSettings = () => {
    localStorage.setItem('clario.billing', JSON.stringify({ recipients: invoiceRecipients, taxId }));
    toast({ title: 'Billing settings saved', description: 'Recipients and tax details updated.' });
  };

  const exportBillingCSV = () => {
    const headers = [
      'Invoice ID',
      'Date Issued',
      'Status',
      'Total Recovered',
      'Commission (20%)',
      'Amount Charged',
      'Recovery Claim IDs'
    ];
    const rows = invoices.map(inv => [
      inv.id,
      inv.dateIssued,
      inv.status,
      inv.totalRecovered,
      inv.commission,
      inv.amountCharged,
      (inv.recoveryClaimIds || []).join('|')
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'billing-history.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: 'Export Complete', description: 'Billing history exported to CSV' });
  };

  const exportAction = () => {
    if (exportFormat === 'csv') {
      exportBillingCSV();
    }
    if (exportFormat === 'pdf') {
      toast({
        title: 'Download Individual Invoices',
        description: 'Click the download icon on any invoice row to get a PDF for that specific invoice.',
      });
    }
    setExportOpen(false);
  };

  // Invoices table UX: search, filter, pagination
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceRecord['status']>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return invoices
      .filter(inv => {
        const matchesSearch = !term || inv.id.toLowerCase().includes(term) || inv.status.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  }, [invoices, invoiceSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  const periodTotals = useMemo(() => {
    const totalRecovered = filteredInvoices.reduce((s, i) => s + i.totalRecovered, 0);
    const commission = filteredInvoices.reduce((s, i) => s + i.commission, 0);
    const netToSeller = totalRecovered - commission;
    return { totalRecovered, commission, netToSeller };
  }, [filteredInvoices]);

  return (
    <PageLayout title="Billing & Invoices">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-12 text-gray-900">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">Billing & Invoices</h1>
              <p className="text-xs text-gray-500 mt-0.5">Payment Management</p>
            </div>

            {/* Current Plan & Payment Method */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Your Plan Card */}
              <div className="bg-white border border-gray-200 rounded-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xs font-medium text-gray-900">Current Plan</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Performance-Based Billing</h3>
                    <div className="mt-3 p-4 bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-medium text-gray-900">20% commission</span> on successfully recovered funds only.
                        <span className="text-emerald-600 font-medium"> No recovery, no fee.</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Active and monitoring 24/7</span>
                  </div>
                </div>
              </div>

              {/* Payment & Billing Settings Card */}
              <div className="bg-white border border-gray-200 rounded-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xs font-medium text-gray-900">Payment Method</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white border border-gray-200">
                        <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Visa ending in 4242</p>
                        <p className="text-xs text-gray-500">Expires 12/2027</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Invoice Recipients</label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="Add recipient email"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          className="h-8 text-xs bg-gray-50 border-gray-200 rounded-sm"
                        />
                        <button
                          onClick={() => {
                            const email = newRecipient.trim();
                            if (!email) return;
                            setInvoiceRecipients(prev => prev.includes(email) ? prev : [...prev, email]);
                            setNewRecipient('');
                          }}
                          className="px-3 h-8 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                          Add
                        </button>
                      </div>
                      {invoiceRecipients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {invoiceRecipients.map((em) => (
                            <span key={em} className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 text-xs text-gray-700">
                              {em}
                              <button className="text-gray-400 hover:text-gray-600" onClick={() => setInvoiceRecipients(prev => prev.filter(x => x !== em))}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Tax / VAT Number</label>
                      <Input
                        placeholder="Optional — shown on invoices"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="h-8 text-xs bg-gray-50 border-gray-200 rounded-sm mt-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveBillingSettings}
                        className="px-4 py-2 text-xs text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                        Save Settings
                      </button>
                      <button
                        onClick={() => { window.location.href = '/stripe/callback'; }}
                        className="px-4 py-2 text-xs text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                        Stripe Portal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white border border-gray-200 rounded-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-medium text-gray-900">Billing History</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete transparency into every charge</p>
                </div>
                <button
                  onClick={() => setExportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <Download className="h-3 w-3" />
                  Export
                </button>
              </div>
              <div className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search invoices..."
                      value={invoiceSearch}
                      onChange={(e) => { setInvoiceSearch(e.target.value); setPage(1); }}
                      className="h-8 text-xs bg-gray-50 border-gray-200 rounded-sm w-48"
                    />
                    <Select value={statusFilter === 'All' ? 'All' : statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                      <SelectTrigger className="h-8 w-28 text-xs bg-gray-50 border-gray-200 rounded-sm">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm">
                        <SelectItem value="All" className="text-xs">All</SelectItem>
                        <SelectItem value="Paid" className="text-xs">Paid</SelectItem>
                        <SelectItem value="Due" className="text-xs">Due</SelectItem>
                        <SelectItem value="Overdue" className="text-xs">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{filteredInvoices.length} invoices</span>
                    <select
                      className="h-7 bg-gray-50 border border-gray-200 rounded-sm px-2 text-gray-600"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-2 py-1 text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                      Prev
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-2 py-1 text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                      Next
                    </button>
                  </div>
                </div>

                {loading && (
                  <div className="text-center py-12 text-gray-500 text-xs">Loading billing invoices...</div>
                )}
                {error && !loading && (
                  <div className="text-center py-12">
                    <p className="text-amber-600 text-xs mb-2">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-xs text-gray-600 underline hover:text-gray-900">
                      Try Again
                    </button>
                  </div>
                )}
                {!loading && !error && pageData.length === 0 && (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    <p className="mb-1">No billing invoices found.</p>
                    <p className="text-xs">Invoices will appear here once recoveries are processed.</p>
                  </div>
                )}
                {!loading && !error && pageData.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-xs text-gray-500 font-medium">Invoice</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium">Date</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium">Status</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium text-right">Recovered</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium text-right">Commission</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium text-right">Charged</TableHead>
                          <TableHead className="text-xs text-gray-500 font-medium"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageData.map((invoice) => (
                          <TableRow key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="py-3">
                              <Link
                                to={`/billing/invoice/${invoice.id}`}
                                className="text-xs font-mono text-gray-900 hover:text-gray-600">
                                {invoice.id}
                              </Link>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600">
                              {new Date(invoice.dateIssued).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "text-xs px-2 py-0.5",
                                invoice.status === 'Paid' && "bg-gray-100 text-gray-700",
                                invoice.status === 'Due' && "bg-amber-50 text-amber-700",
                                invoice.status === 'Overdue' && "bg-red-50 text-red-700"
                              )}>
                                {invoice.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-900">
                              ${invoice.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-500">
                              ${invoice.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium text-gray-900">
                              ${invoice.amountCharged.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.downloadInvoicePdf(invoice.id);
                                    toast({ title: 'Invoice Downloaded', description: `Downloaded invoice ${invoice.id}` });
                                  } catch (err) {
                                    toast({ title: 'Download Failed', description: 'Could not download invoice PDF', variant: 'destructive' });
                                  }
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700">
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white border border-gray-200 rounded-sm mb-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-medium text-gray-900">Frequently Asked Questions</h2>
              </div>
              <div className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="when-charged" className="border-b border-gray-100">
                    <AccordionTrigger className="text-xs text-gray-900 py-3 hover:no-underline">
                      When will I be charged?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed pb-3">
                      You are only charged when we successfully recover money for you. Invoices are generated monthly, with payment processed within 7 days.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reversed-recovery" className="border-b border-gray-100">
                    <AccordionTrigger className="text-xs text-gray-900 py-3 hover:no-underline">
                      What if a recovery is reversed by Amazon?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed pb-3">
                      We automatically issue a full credit on your next invoice. If no future invoice exists, we process a direct refund within 5-7 business days.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="vat-number" className="border-b border-gray-100">
                    <AccordionTrigger className="text-xs text-gray-900 py-3 hover:no-underline">
                      How do I update my VAT number?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed pb-3">
                      Update your VAT number in the Payment Method section above. Changes will be reflected on your next invoice.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="payment-security" className="border-b border-gray-100">
                    <AccordionTrigger className="text-xs text-gray-900 py-3 hover:no-underline">
                      How secure is my payment information?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed pb-3">
                      All payments are processed by Stripe, a PCI DSS Level 1 certified processor. We never store your full card details.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            {/* Support Link */}
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                Have a billing question?{' '}
                <Link to="/help" className="text-gray-700 underline hover:text-gray-900">Contact support</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-sm bg-white border border-gray-200 rounded-sm p-0">
            <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <DialogTitle className="text-xs font-medium text-gray-900">Export Data</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Download your billing history
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
                <SelectTrigger className="h-9 text-xs bg-gray-50 border-gray-200 rounded-sm">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="rounded-sm">
                  <SelectItem value="csv" className="text-xs">Detailed CSV</SelectItem>
                  <SelectItem value="pdf" className="text-xs">PDF Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setExportOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">
                Cancel
              </button>
              <button
                onClick={exportAction}
                className="px-4 py-1.5 text-xs text-white bg-gray-900 hover:bg-gray-800">
                Download
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
