import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';

import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Download,
  Shield,
  Check,
  ChevronRight,
  AlertCircle,
  Zap,
  Globe,
  Lock,
  History,
  Mail,
  Receipt,
  ArrowUpRight,
  Scale,
  X
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { api, detectionApi } from '@/lib/api';
import { tenantRoute } from '@/lib/routes';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceRecord {
  id: string;
  dateIssued: string;
  status: 'SETTLED' | 'PENDING' | 'BREACH';
  totalRecovered: number;
  commission: number;
  amountCharged: number;
  recoveryClaimIds?: string[];
}

const getStatusStyles = (status: InvoiceRecord['status']) => {
  switch (status) {
    case 'SETTLED':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'BREACH':
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default:
      return 'bg-white/5 text-white/40 border-white/10';
  }
};

export default function Billing() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug || 'beta';

  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vault Status (Phase 2 Auto-Charge)
  const [vaultedEmail, setVaultedEmail] = useState<string | null>(null);
  const [isVaulting, setIsVaulting] = useState(false);

  // Fetch vaulted status
  useEffect(() => {
    if (!isReady) return;
    (async () => {
      try {
        const res = await api.getUserProfile();
        if (res.ok && (res.data as any)?.user?.paypal_payment_token) {
          setVaultedEmail((res.data as any)?.user?.paypal_email || 'Linked Account');
        }
      } catch (err) {
        console.error('Failed to fetch vault status:', err);
      }
    })();
  }, [isReady]);

  const handleLinkPaymentMethod = async () => {
    setIsVaulting(true);
    try {
      // 1. Get Setup Token from Backend
      const setupRes = await detectionApi.getVaultSetupToken();
      if (!setupRes.ok) throw new Error(setupRes.error || 'Failed to get setup token');
      
      const setupTokenId = setupRes.data?.setupToken?.id;

      // 2. Finalize Vaulting
      // In production, this would be triggered by a PayPal SDK callback (onApprove/onSuccess)
      const sellerId = localStorage.getItem('user_id') || 'demo-user';
      
      const finalizeRes = await detectionApi.finalizeVaulting(setupTokenId, sellerId);
      if (finalizeRes.ok) {
        setVaultedEmail(finalizeRes.data?.paypalEmail || 'Linked Account');
        toast({ 
          title: 'Payment Method Linked', 
          description: `Auto-charge protocol enabled for ${finalizeRes.data?.paypalEmail || 'your account'}.`
        });
      } else {
        throw new Error(finalizeRes.error || 'Failed to finalize vaulting');
      }
    } catch (err: any) {
      toast({ title: 'Vaulting Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsVaulting(false);
    }
  };

  // Financial Registration
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
    } catch { }
  }, []);


  // Fetch invoices
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Try new revenue invoices first
        const revenueRes = await detectionApi.getRevenueInvoices({ limit: 100 });
        if (!cancelled && revenueRes.ok && revenueRes.data?.data?.invoices?.length > 0) {
          const mapped: InvoiceRecord[] = revenueRes.data.data.invoices.map((inv: any) => {
            let status: 'SETTLED' | 'PENDING' | 'BREACH' = 'PENDING';
            const s = (inv.status || '').toLowerCase();
            if (s === 'paid') status = 'SETTLED';
            else if (s === 'void' || s === 'disputed') status = 'BREACH';

            return {
              id: inv.invoice_number || inv.id,
              dateIssued: (inv.period_end || inv.created_at || '').split('T')[0],
              status,
              totalRecovered: Number(inv.total_reimbursements || 0),
              commission: Number(inv.commission_amount || 0),
              amountCharged: Number(inv.commission_amount || 0),
            };
          });
          setInvoices(mapped);
          return;
        }

        // Fallback to old billing API
        const response = await api.getBillingInvoices({ limit: 100 }, activeSlug);
        if (!cancelled) {
          if (response.ok && response.data?.invoices) {
            const mappedInvoices: InvoiceRecord[] = response.data.invoices.map((inv: any) => {
              let status: 'SETTLED' | 'PENDING' | 'BREACH' = 'SETTLED';
              if (inv.status) {
                const s = inv.status.toLowerCase();
                if (s === 'due' || s === 'pending') status = 'PENDING';
                else if (s === 'overdue') status = 'BREACH';
                else status = 'SETTLED';
              }

              const dateIssued = inv.period_end || inv.created_at || inv.date_issued || new Date().toISOString();

              return {
                id: (inv.id || inv.invoice_id || `TRN-${Date.now()}`).toString(),
                dateIssued: dateIssued.split('T')[0],
                status,
                totalRecovered: Number(inv.total_amount || inv.total_recovered || 0),
                commission: Number(inv.platform_fee || inv.commission || 0),
                amountCharged: Number(inv.platform_fee || inv.amount_charged || 0),
                recoveryClaimIds: inv.recovery_claim_ids || inv.recovery_ids || []
              };
            });
            setInvoices(mappedInvoices);
          } else {
            setError(response.error || 'Failed to sync billing data.');
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch billing data:', err);
        if (!cancelled) {
          setInvoices([]);
          setError("Billing information temporary unavailable. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isReady, activeSlug]);

  const saveBillingSettings = () => {
    localStorage.setItem('clario.billing', JSON.stringify({ recipients: invoiceRecipients, taxId }));
    toast({ title: 'Settings Updated', description: 'Your billing preferences have been saved.' });
  };


  const exportBillingPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Background
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 297, 210, 'F');

    // Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Billing History', 20, 25);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(10);
    doc.text('Complete log of all recoveries and payments.', 20, 33);

    // Meta line
    doc.setDrawColor(40, 40, 40);
    doc.line(20, 38, 277, 38);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 43);
    doc.text(`Records: ${invoices.length}`, 250, 43);

    // Table
    const tableRows = invoices.map(inv => [
      inv.id,
      new Date(inv.dateIssued).toLocaleDateString(),
      inv.status,
      `$${inv.totalRecovered.toLocaleString()}`,
      `$${inv.commission.toLocaleString()}`,
      `$${inv.amountCharged.toLocaleString()}`
    ]);

    if (tableRows.length === 0) {
      tableRows.push(['', '', '', 'No billing records found.', '', '']);
    }

    autoTable(doc, {
      startY: 48,
      head: [['Invoice ID', 'Date', 'Status', 'Recovered', 'Fee', 'Charged']],
      body: tableRows,
      theme: 'plain',
      styles: {
        fillColor: [15, 15, 15],
        textColor: [180, 180, 180],
        fontSize: 9,
        cellPadding: 5,
        lineColor: [30, 30, 30],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [20, 20, 20],
        textColor: [100, 100, 100],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 4,
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', textColor: [255, 255, 255], fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [12, 12, 12],
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);
    doc.text('MARGIN — BILLING SYSTEM', 148.5, pageHeight - 10, { align: 'center' });

    doc.save(`margin-billing-history-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ title: 'PDF Downloaded', description: 'Your billing history has been saved.' });
  };

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceRecord['status']>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredInvoices = useMemo(() => {
    const term = invoiceSearch.trim().toLowerCase();
    return (invoices || [])
      .filter(inv => {
        if (!inv) return false;
        const matchesSearch = !term ||
          (inv.id && inv.id.toLowerCase().includes(term)) ||
          (inv.status && inv.status.toLowerCase().includes(term));
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  }, [invoices, invoiceSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const pageData = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };


  return (
    <PageLayout title="Billing" midnight>
      <div className="relative min-h-screen font-sans bg-[#050505]">
        {/* Matrix Background Aesthetic */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative container mx-auto px-4 md:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="px-3 py-0.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-sans font-bold text-[9px] tracking-tight uppercase">
                  Billing System // Active
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-sans font-bold text-white tracking-tight">Billing.</h1>
              <p className="text-white/40 mt-3 font-sans font-bold italic text-lg max-w-2xl tracking-tight">View your billing history and manage payment settings.</p>
            </div>
          </motion.div>

          {/* Core Protocol Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-16 space-y-6"
          >
            {/* PayPal Protocol Status */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#0c0c0c] border-emerald-500/10 text-white shadow-2xl rounded-2xl backdrop-blur-3xl overflow-hidden h-full group">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <Shield className="h-4 w-4 text-emerald-500" />
                      </div>
                      <CardTitle className="text-2xl font-sans font-bold tracking-tight">Billing Protocol: PayPal</CardTitle>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-sans font-bold text-[9px] tracking-tight uppercase px-3 py-1">
                      EXCLUSIVE MODE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                    <div className="h-24 w-24 flex items-center justify-center rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                      <svg viewBox="0 0 24 24" className="w-full h-full fill-white/60" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.067 8.178c-.652 4.1-3.6 5.867-7.444 5.867h-.822c-.445 0-.777.334-.845.778l-1.044 6.555a.311.311 0 0 1-.31.278H6.555c-.244 0-.4-.2-.334-.4l2.422-15.356c.067-.4.4-.711.823-.711h6.066c1.867 0 3.378.489 4.156 1.489.266.356.444.8.444 1.289 0 .889-.289 1.622-.067 2.211z" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <p className="text-lg font-sans font-bold text-white/90 tracking-tight leading-snug">
                        Margin now operates exclusively via PayPal Invoicing.
                      </p>
                      <p className="text-sm font-sans font-bold text-white/40 italic tracking-tight">
                        "Commission settlements are processed through standardized PayPal invoice corridors. No card storage required."
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
                          Payment Infrastructure via PayPal
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
                          AES-256 Encrypted
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
                          Automated Ledger Reconciliation
                        </div>
                      </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans font-bold text-white/90 tracking-tight">Payment Profile Configuration</span>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-sans font-bold px-2 py-0.5 tracking-tight uppercase",
                        vaultedEmail ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-white/10 text-white/20"
                      )}>
                        {vaultedEmail ? "ENABLED" : "INACTIVE"}
                      </Badge>
                    </div>
                    
                    {vaultedEmail ? (
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/5">
                             <Mail className="h-3 w-3 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Linked Account</p>
                            <p className="text-sm font-sans font-bold text-white/80 tracking-tight">{vaultedEmail}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleLinkPaymentMethod}
                          disabled={isVaulting}
                          className="text-[9px] font-sans font-bold text-white/20 hover:text-white uppercase tracking-tight"
                        >
                          {isVaulting ? "Wait..." : "Update"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs font-sans font-bold text-white/40 italic tracking-tight">
                          Grant Clario permission to automatically process commission fees for successful recoveries.
                        </p>
                        <Button 
                          onClick={handleLinkPaymentMethod}
                          disabled={isVaulting}
                          className="w-full bg-[#0c0c0c] hover:bg-white/5 text-white border border-white/10 font-sans font-bold text-[10px] uppercase tracking-tight h-10 rounded-xl"
                        >
                          {isVaulting ? "Authenticating..." : "Authorize Payment Method"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Billing Settings Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl backdrop-blur-3xl overflow-hidden h-full">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <Receipt className="h-4 w-4 text-white/60" />
                    </div>
                  </div>
                    <CardTitle className="text-2xl font-sans font-bold tracking-tight">Invoice Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Invoice recipients</label>
                      <div className="flex gap-2">
                            <Input
                              placeholder="Email address"
                              value={newRecipient}
                              onChange={(e) => setNewRecipient(e.target.value)}
                              className="h-10 bg-white/5 border-white/10 text-xs font-sans font-bold text-white rounded-xl placeholder:text-white/20 focus:ring-emerald-500/20 tracking-tight"
                            />
                            <Button
                              onClick={() => {
                                if (!newRecipient.trim()) return;
                                setInvoiceRecipients(prev => [...prev, newRecipient.trim()]);
                                setNewRecipient('');
                              }}
                              variant="outline"
                              className="h-10 px-4 border-white/10 hover:border-emerald-500/50 text-black bg-white hover:bg-emerald-500 font-sans font-bold text-[10px] tracking-tight"
                            >
                              Add
                            </Button>
                      </div>
                      {invoiceRecipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {invoiceRecipients.map((r, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] font-sans font-bold text-white/40 border-white/10 px-3 py-1 gap-2 tracking-tight">
                              {r}
                              <button onClick={() => setInvoiceRecipients(prev => prev.filter((_, idx) => idx !== i))} className="text-white/20 hover:text-rose-500">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Tax details</label>
                        <Input
                          placeholder="Tax ID"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          className="h-10 bg-white/5 border-white/10 text-xs font-sans font-bold text-white rounded-xl placeholder:text-white/20 tracking-tight"
                        />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                      <Button
                        onClick={saveBillingSettings}
                        className="bg-white text-black hover:bg-emerald-500 rounded-xl font-sans font-bold uppercase text-[10px] tracking-tight h-12 px-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                      >
                        Save changes
                      </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Transaction Registry */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-sans font-bold text-white tracking-tight">Billing History</h2>
                <p className="text-white/30 text-sm font-sans font-bold italic tracking-tight">Complete log of all recoveries and payments.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Search by ID..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-10 h-11 w-64 bg-white/5 border-white/10 text-xs font-sans font-bold text-white rounded-xl placeholder:text-white/20 focus:ring-emerald-500/20 tracking-tight"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 border-white/10 bg-white text-black hover:bg-emerald-500/10 hover:border-emerald-500 transition-all font-sans font-bold uppercase text-[10px] tracking-tight rounded-xl px-6"
                  onClick={exportBillingPDF}
                >
                  <Download className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  Download history
                </Button>
              </div>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden backdrop-blur-3xl min-h-[400px]">
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Synchronizing Ledger...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 px-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500 opacity-50 mb-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-white/40 italic font-sans font-bold tracking-tight">"{error}"</p>
                    <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Error Code: SYNC_NODE_INTERRUPT</p>
                  </div>
                  <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 h-10 border-white/10 hover:border-white/20 text-white font-sans font-bold text-[9px] px-6 tracking-tight">RE-ATTEMPT SYNC</Button>
                </div>
              )}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-6 px-8 text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight">Invoice ID</TableHead>
                        <TableHead className="text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight">Date</TableHead>
                        <TableHead className="text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight">Status</TableHead>
                        <TableHead className="text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight text-right">Recovered</TableHead>
                        <TableHead className="text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight text-right">Fee</TableHead>
                        <TableHead className="text-white/20 font-sans font-bold text-[9px] uppercase tracking-tight text-right">Charged</TableHead>
                        <TableHead className="pr-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {pageData.length > 0 ? (
                          pageData.map((invoice, idx) => (
                            <motion.tr
                              key={invoice.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group"
                            >
                              <TableCell className="py-6 px-8">
                                <span className="text-[11px] font-sans font-bold text-white/60 group-hover:text-emerald-500 transition-colors tracking-tight">
                                  {invoice.id}
                                </span>
                              </TableCell>
                              <TableCell className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                                {new Date(invoice.dateIssued).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[9px] font-sans font-bold px-3 py-0.5 tracking-tight", getStatusStyles(invoice.status))}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-[11px] font-sans font-bold text-white/80 tracking-tight">
                                ${invoice.totalRecovered.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-[11px] font-sans font-bold text-white/30 tracking-tight">
                                ${invoice.commission.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-[12px] font-sans font-bold text-white tracking-tight">
                                ${invoice.amountCharged.toLocaleString()}
                              </TableCell>
                              <TableCell className="pr-8">
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-white/20 hover:text-emerald-500"
                                    onClick={async () => {
                                      try {
                                        await api.downloadInvoicePdf(invoice.id);
                                        toast({ title: 'Download Initialized', description: `Record ${invoice.id} archived.` });
                                      } catch {
                                        toast({ title: 'Transmission Error', description: 'Could not fetch record PDF.', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="py-32 text-center border-none">
                              <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                                <Receipt className="h-8 w-8 mb-2" />
                                <p className="text-[10px] font-sans font-bold uppercase tracking-tight">Transaction registry empty.</p>
                                <p className="text-xs italic font-sans font-bold tracking-tight">"No capital synchronization events detected on this node."</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-10 gap-6">
              <div className="flex items-center gap-6">
                <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Showing {pageData.length} records</p>
                <div className="h-4 w-[1px] bg-white/5" />
                <div className="flex gap-4">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    variant="ghost"
                    className="text-[10px] font-sans font-bold text-white/40 uppercase hover:text-white tracking-tight"
                  >
                    Previous //
                  </Button>
                  <Button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    variant="ghost"
                    className="text-[10px] font-sans font-bold text-white/40 uppercase hover:text-white tracking-tight"
                  >
                        // Next
                  </Button>
                </div>
              </div>
              <div className="text-[10px] font-sans font-bold text-white/10 uppercase tracking-tight">
                Financial Access: GRANTED
              </div>
            </div>
          </motion.div>

          {/* Institutional FAQ */}
          <div className="mt-32 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="text-white/20 border-white/5 font-sans font-bold text-[9px] tracking-tight uppercase">
                Governance Docs
              </Badge>
              <h3 className="text-3xl font-sans font-bold text-white italic tracking-tight">Financial Protocol Inquiries</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                { q: "Execution Timelines", a: "Yield settlements are generated upon cycle completion and processed within seven standard verification intervals." },
                { q: "Recovery Reversals", a: "In the rare event of asset reclamation by platform entities, counter-credits are autonomously applied to the subsequent ledger cycle." },
                { q: "Sovereignty & Security", a: "Margin utilizes PayPal Invoicing for all financial transfers. We never store or transmit sensitive credit card data on our servers." },
                { q: "Commission Rate", a: "Margin takes a 20% commission on Amazon reimbursements recovered through Margin-filed claims. You only pay when Amazon pays you." }
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/5 bg-white/[0.01] rounded-2xl px-6 md:px-8 overflow-hidden">
                  <AccordionTrigger className="text-sm font-sans font-bold text-white/80 hover:text-white transition-colors py-6 uppercase tracking-tight hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/40 font-sans font-bold italic text-base pb-6 leading-relaxed tracking-tight">
                    "{item.a}"
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Support Link */}
          <div className="text-center pt-32 pb-16">
            <p className="text-white/20 font-sans font-bold text-[10px] uppercase tracking-tight">
              Need direct protocol assistance?{' '}
              <a href="mailto:billing@margin-finance.com" className="text-emerald-500 hover:text-emerald-400 font-bold ml-2">billing@margin-finance.com</a>
            </p>
          </div>
        </div>


      </div>
    </PageLayout>
  );
}
