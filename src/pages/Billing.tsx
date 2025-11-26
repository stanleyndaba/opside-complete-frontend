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

interface InvoiceRecord {
  id: string;
  dateIssued: string;
  status: 'Paid' | 'Due' | 'Overdue';
  totalRecovered: number;
  commission: number;
  amountCharged: number;
  recoveryClaimIds: string[];
}

// Mock data for billing history
const mockInvoices: InvoiceRecord[] = [
  {
    id: 'INV-2025-003',
    dateIssued: '2025-01-15',
    status: 'Paid',
    totalRecovered: 2450.89,
    commission: 490.18,
    amountCharged: 490.18,
    recoveryClaimIds: ['REC-2025-0087', 'REC-2025-0088', 'REC-2025-0089']
  },
  {
    id: 'INV-2025-002', 
    dateIssued: '2024-12-30',
    status: 'Paid',
    totalRecovered: 1876.32,
    commission: 375.26,
    amountCharged: 375.26,
    recoveryClaimIds: ['REC-2024-0156', 'REC-2024-0157']
  },
  {
    id: 'INV-2025-001',
    dateIssued: '2024-12-15', 
    status: 'Paid',
    totalRecovered: 3421.67,
    commission: 684.33,
    amountCharged: 684.33,
    recoveryClaimIds: ['REC-2024-0142', 'REC-2024-0143', 'REC-2024-0144', 'REC-2024-0145']
  },
  {
    id: 'INV-2024-012',
    dateIssued: '2024-11-28',
    status: 'Paid', 
    totalRecovered: 5632.45,
    commission: 1126.49,
    amountCharged: 1126.49,
    recoveryClaimIds: ['REC-2024-0123', 'REC-2024-0124', 'REC-2024-0125']
  },
  {
    id: 'INV-2024-011',
    dateIssued: '2024-11-15',
    status: 'Paid',
    totalRecovered: 987.23,
    commission: 197.45,
    amountCharged: 197.45,
    recoveryClaimIds: ['REC-2024-0098']
  }
];

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

  // Billing settings
  const [invoiceRecipients, setInvoiceRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [taxId, setTaxId] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('clario.billing') || 'null');
      if (saved) {
        setInvoiceRecipients(Array.isArray(saved.recipients) ? saved.recipients : []);
        setTaxId(saved.taxId || '');
      }
    } catch {}
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
    const rows = mockInvoices.map(inv => [
      inv.id,
      inv.dateIssued,
      inv.status,
      inv.totalRecovered,
      inv.commission,
      inv.amountCharged,
      inv.recoveryClaimIds.join('|')
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
  };

  const exportAction = () => {
    if (exportFormat === 'csv') exportBillingCSV();
    if (exportFormat === 'pdf') window.print();
    setExportOpen(false);
  };

  // Invoices table UX: search, filter, pagination
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | InvoiceRecord['status']>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return mockInvoices
      .filter(inv => {
        const matchesSearch = !term || inv.id.toLowerCase().includes(term) || inv.status.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  }, [invoiceSearch, statusFilter]);

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
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-700 space-y-8">
        {/* Current Plan & Payment Method */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Plan Card */}
          <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5 text-emerald-600" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Clario Billing
                </h3>
                <div className="mt-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We charge a <span className="font-semibold text-gray-900">20% commission only</span> on the funds we successfully recover for you. 
                    <span className="font-medium text-emerald-600"> No recovery, no fee.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                <span className="text-gray-700">Active and monitoring your account 24/7</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment & Billing Settings Card */}
          <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded border border-gray-200">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Visa ending in 4242</p>
                    <p className="text-sm text-gray-600">Expires 12/2027</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
                  Active
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Invoice Recipients</div>
                  <div className="flex gap-2">
                    <Input placeholder="Add recipient email" value={newRecipient} onChange={(e)=>setNewRecipient(e.target.value)} className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500" />
                    <Button className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50" variant="outline" onClick={() => {
                      const email = newRecipient.trim(); if (!email) return; setInvoiceRecipients(prev => prev.includes(email) ? prev : [...prev, email]); setNewRecipient('');
                    }}>Add</Button>
                  </div>
                  {invoiceRecipients.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {invoiceRecipients.map((em) => (
                        <span key={em} className="inline-flex items-center gap-2 px-2 py-1 rounded border border-gray-200 bg-gray-50 text-xs text-gray-700">
                          {em}
                          <button className="text-gray-500 hover:text-gray-900" onClick={() => setInvoiceRecipients(prev => prev.filter(x => x !== em))}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Tax / VAT Number</div>
                  <Input placeholder="Optional — shown on invoices" value={taxId} onChange={(e)=>setTaxId(e.target.value)} className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500" />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold" onClick={saveBillingSettings}>Save Billing Settings</Button>
                  <Button className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50" variant="outline" onClick={() => { window.location.href = '/stripe/callback'; }}>Open Stripe Billing Portal</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Billing History</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Complete transparency into every charge and recovery
                </p>
              </div>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold" onClick={() => setExportOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Input placeholder="Search invoices (ID/status)" value={invoiceSearch} onChange={(e)=>{ setInvoiceSearch(e.target.value); setPage(1); }} className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 md:w-72" />
                <UiSelect value={statusFilter === 'All' ? 'All' : statusFilter} onValueChange={(v)=>{ setStatusFilter(v as any); setPage(1); }}>
                  <SelectTrigger className="w-[160px] text-white"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Due">Due</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </UiSelect>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>{filteredInvoices.length} invoices</span>
                <select className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-700" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button variant="outline" className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
                <Button variant="outline" className="bg-white text-blue-700 border-blue-300 hover:bg-blue-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[#36454F]">Invoice #</TableHead>
                    <TableHead className="text-[#36454F]">Date Issued</TableHead>
                    <TableHead className="text-[#36454F]">Status</TableHead>
                    <TableHead className="text-right text-[#36454F]">Total Recovered (Period)</TableHead>
                    <TableHead className="text-right text-[#36454F]">Our Commission (20%)</TableHead>
                    <TableHead className="text-right text-[#36454F]">Amount Charged</TableHead>
                    <TableHead className="text-[#36454F]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <TableCell>
                        <Link 
                          to={`/billing/invoice/${invoice.id}`}
                          className="font-mono text-sm text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          {invoice.id}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dateIssued).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${invoice.totalRecovered.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.commission.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${invoice.amountCharged.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => window.print()}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Frequently Asked Billing Questions */}
        <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Frequently Asked Billing Questions</CardTitle>
            <p className="text-sm text-gray-600">
              Quick answers to common billing and payment questions
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="when-charged" className="border-b border-gray-200">
                <AccordionTrigger className="text-left">
                  When will I be charged?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  You are only charged when we successfully recover money for you. We generate invoices monthly for all recoveries completed in that period, with payment automatically processed from your saved payment method within 7 days of invoice generation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reversed-recovery" className="border-b border-gray-200">
                <AccordionTrigger className="text-left">
                  What happens if a recovery is later reversed by Amazon?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  In the rare event that Amazon reverses a recovery, we automatically issue you a full credit on your next invoice. If no future invoice exists, we process a direct refund to your payment method within 5-7 business days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="vat-number" className="border-b border-gray-200">
                <AccordionTrigger className="text-left">
                  How do I update my company's VAT number?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  You can update your VAT number and other billing details by clicking "Update Payment Method" above, or by contacting our support team. Changes will be reflected on your next invoice.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="automatic-invoices" className="border-b border-gray-200">
                <AccordionTrigger className="text-left">
                  Can I get invoices automatically sent to my accountant?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  Yes! Contact our support team to set up automatic invoice forwarding to additional email addresses. You can add multiple recipients and they'll receive a copy of every invoice automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-security" className="border-b border-gray-200">
                <AccordionTrigger className="text-left">
                  How secure is my payment information?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  All payment processing is handled by Stripe, a PCI DSS Level 1 certified payment processor. We never store your full credit card details on our servers - only encrypted tokens that allow us to process payments securely.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Need More Help */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Have a specific billing question?</span>
          </div>
          <div className="mt-2">
            <Link 
              to="/help" 
              className="text-emerald-600 hover:underline font-medium"
            >
              Contact our support team
            </Link>
          </div>
        </div>
          </div>
        </div>
        {/* Export Modal */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription>Export your billing history.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Detailed CSV</SelectItem>
                  <SelectItem value="pdf">PDF Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button onClick={exportAction}>Generate & Download</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}