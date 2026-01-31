import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Download,
  CreditCard,
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
  Scale
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
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
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getBillingInvoices({ limit: 100 });
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
            console.warn('API returned non-ok or no invoices:', response);
            setInvoices([]);
            setError(response.error || 'Failed to sync ledger data from remote stream.');
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch billing data:', err);
        if (!cancelled) {
          setInvoices([]);
          setError("Ledger synchronization interrupted. Please re-establish connection to financial nodes.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveBillingSettings = () => {
    localStorage.setItem('clario.billing', JSON.stringify({ recipients: invoiceRecipients, taxId }));
    toast({ title: 'Protocol Updated', description: 'Financial transmission parameters saved.' });
  };

  const exportBillingCSV = () => {
    const headers = ['Transmission ID', 'Timestamp', 'Status', 'Yield Recovered', 'Institutional Fee', 'Charged Amount'];
    const rows = invoices.map(inv => [inv.id, inv.dateIssued, inv.status, inv.totalRecovered, inv.commission, inv.amountCharged].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-ledger-${Date.now()}.csv`;
    a.click();
    toast({ title: 'Data Exported', description: 'Financial ledger archived to local storage.' });
  };

  const exportAction = () => {
    if (exportFormat === 'csv') {
      exportBillingCSV();
    } else {
      toast({ title: 'Protocol Notice', description: 'Institutional PDF generation requires secondary tunnel access.' });
    }
    setExportOpen(false);
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
    <PageLayout title="Financial Ledger" midnight>
      <div className="relative min-h-screen font-serif bg-[#050505]">
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
                <Badge variant="outline" className="px-3 py-0.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 font-mono text-[9px] tracking-[0.2em] uppercase">
                  FINANCIAL_CORE // v2.4.0
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tighter">Financial <span className="text-emerald-500">Ledger</span>.</h1>
              <p className="text-white/40 mt-3 font-serif italic text-lg max-w-2xl">Complete yield transparency and capital recovery logs.</p>
            </div>
          </motion.div>

          {/* Core Protocol Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
          >
            {/* Yield Protocol Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl backdrop-blur-3xl overflow-hidden h-full group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                  <Scale className="h-32 w-32 text-emerald-500 rotate-12" />
                </div>
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Zap className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.3em]">Yield Protocol</p>
                  </div>
                  <CardTitle className="text-2xl font-serif tracking-tight">Scale-Adjusted Recovery</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="p-5 border border-emerald-500/10 bg-emerald-500/[0.02] rounded-2xl relative overflow-hidden group/box">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity" />
                    <p className="text-sm text-white/70 leading-relaxed font-serif relative z-10 italic">
                      "Utilizing a <span className="text-emerald-400 font-bold">20% yield-share model</span>. Capital is only allocated upon successful recovery of lost assets. No retention fees required."
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-white/40">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Active Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Global Audit Enabled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Transit Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl backdrop-blur-3xl overflow-hidden h-full group">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <CreditCard className="h-4 w-4 text-white/60" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em]">Transmission Port</p>
                  </div>
                  <CardTitle className="text-2xl font-serif tracking-tight">Settlement Parameters</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
                        <Receipt className="h-5 w-5 text-white/60" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold uppercase tracking-widest">Visa .... 4242</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-tighter">Exp 12 // 2027</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-3 font-mono">ACTIVE_PORT</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Transmission Nodes</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Node URL / Email"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          className="h-10 bg-white/5 border-white/10 text-xs font-serif text-white rounded-xl placeholder:text-white/20 focus:ring-emerald-500/20"
                        />
                        <Button
                          onClick={() => {
                            if (!newRecipient.trim()) return;
                            setInvoiceRecipients(prev => [...prev, newRecipient.trim()]);
                            setNewRecipient('');
                          }}
                          variant="outline"
                          className="h-10 px-4 border-white/10 hover:border-emerald-500/50 text-white font-mono text-[10px]"
                        >
                          REGISTER
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Tax Identifier</label>
                      <Input
                        placeholder="Institutional ID"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="h-10 bg-white/5 border-white/10 text-xs font-serif text-white rounded-xl placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                    <Button
                      onClick={saveBillingSettings}
                      className="bg-white text-black hover:bg-emerald-500 rounded-xl font-serif font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                    >
                      Lock Governance
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/stripe/callback'}
                      variant="outline"
                      className="border-white/10 hover:border-emerald-500/50 text-white rounded-xl font-mono uppercase text-[9px] tracking-[0.2em] h-12"
                    >
                      Connect Gateway
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
                <h2 className="text-2xl font-serif text-white tracking-tight">Transaction Registry</h2>
                <p className="text-white/30 text-sm font-serif italic">History of capital synchronization and yield settlement.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <History className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Filter by ID..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="pl-10 h-11 w-64 bg-white/5 border-white/10 text-xs font-serif text-white rounded-xl placeholder:text-white/20 focus:ring-emerald-500/20"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-11 border-white/10 hover:border-emerald-500/50 text-white font-mono uppercase text-[10px] tracking-widest rounded-xl px-6"
                  onClick={() => setExportOpen(true)}
                >
                  <Download className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  Archive Logs
                </Button>
              </div>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl rounded-2xl overflow-hidden backdrop-blur-3xl min-h-[400px]">
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Synchronizing Ledger...</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 px-6 text-center">
                  <AlertCircle className="h-8 w-8 text-rose-500 opacity-50 mb-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-white/40 italic font-serif">"{error}"</p>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Error Code: SYNC_NODE_INTERRUPT</p>
                  </div>
                  <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 h-10 border-white/10 hover:border-white/20 text-white font-mono text-[9px] px-6">RE-ATTEMPT SYNC</Button>
                </div>
              )}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-6 px-8 text-white/20 font-mono text-[9px] uppercase tracking-widest">Registry ID</TableHead>
                        <TableHead className="text-white/20 font-mono text-[9px] uppercase tracking-widest">Timestamp</TableHead>
                        <TableHead className="text-white/20 font-mono text-[9px] uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-white/20 font-mono text-[9px] uppercase tracking-widest text-right">Yield recovered</TableHead>
                        <TableHead className="text-white/20 font-mono text-[9px] uppercase tracking-widest text-right">Fee</TableHead>
                        <TableHead className="text-white/20 font-mono text-[9px] uppercase tracking-widest text-right">Charged</TableHead>
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
                                <Link to={`/app/${tenantSlug || 'default'}/billing/invoice/${invoice.id}`} className="text-[11px] font-mono text-white/60 group-hover:text-emerald-500 transition-colors">
                                  {invoice.id}
                                </Link>
                              </TableCell>
                              <TableCell className="text-[10px] font-mono text-white/40 uppercase tracking-tight">
                                {new Date(invoice.dateIssued).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[9px] font-mono px-3 py-0.5 tracking-widest", getStatusStyles(invoice.status))}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-[11px] font-mono text-white/80">
                                ${invoice.totalRecovered.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-[11px] font-mono text-white/30">
                                ${invoice.commission.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-[12px] font-mono font-bold text-white">
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
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Transaction registry empty.</p>
                                <p className="text-xs italic font-serif">"No capital synchronization events detected on this node."</p>
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
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Showing {pageData.length} records</p>
                <div className="h-4 w-[1px] bg-white/5" />
                <div className="flex gap-4">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    variant="ghost"
                    className="text-[10px] font-mono text-white/40 uppercase hover:text-white"
                  >
                    Previous //
                  </Button>
                  <Button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    variant="ghost"
                    className="text-[10px] font-mono text-white/40 uppercase hover:text-white"
                  >
                        // Next
                  </Button>
                </div>
              </div>
              <div className="text-[10px] font-mono text-white/10 uppercase tracking-[0.5em]">
                Financial Access: GRANTED
              </div>
            </div>
          </motion.div>

          {/* Institutional FAQ */}
          <div className="mt-32 max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="text-white/20 border-white/5 font-mono text-[9px] tracking-[0.3em] uppercase">
                Governance Docs
              </Badge>
              <h3 className="text-3xl font-serif text-white italic tracking-tight">Financial Protocol Inquiries</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                { q: "Execution Timelines", a: "Yield settlements are generated upon cycle completion and processed within seven standard verification intervals." },
                { q: "Recovery Reversals", a: "In the rare event of asset reclamation by platform entities, counter-credits are autonomously applied to the subsequent ledger cycle." },
                { q: "Sovereignty & Security", a: "All transactions route through Level 1 PCI-compliant corridors. Opside does not store core decryption keys for financial instruments." }
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/5 bg-white/[0.01] rounded-2xl px-6 md:px-8 overflow-hidden">
                  <AccordionTrigger className="text-sm font-serif text-white/80 hover:text-white transition-colors py-6 uppercase tracking-widest hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/40 font-serif italic text-base pb-6 leading-relaxed">
                    "{item.a}"
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Support Link */}
          <div className="text-center pt-32 pb-16">
            <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
              Need direct protocol assistance?{' '}
              <Link to={`/app/${tenantSlug || 'default'}/help`} className="text-emerald-500 hover:text-emerald-400 font-bold ml-2">Open Transmission</Link>
            </p>
          </div>
        </div>

        {/* Export Modal Redesign */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-md bg-[#0c0c0c] border border-white/10 text-white rounded-3xl p-0 overflow-hidden backdrop-blur-3xl shadow-[0_0_100px_rgba(16,185,129,0.05)]">
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.4em]">Data Export</p>
                <h3 className="text-2xl font-serif tracking-tight">Archive Ledger</h3>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Transmission Format</label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
                  <SelectTrigger className="h-14 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c0c0c] border-white/10 text-white rounded-xl">
                    <SelectItem value="csv" className="text-xs font-serif uppercase tracking-widest">Raw CSV Stream</SelectItem>
                    <SelectItem value="pdf" className="text-xs font-serif uppercase tracking-widest">Institutional PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={exportAction}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-serif font-bold uppercase tracking-widest h-14 rounded-2xl"
                >
                  Confirm Transmission
                </Button>
                <Button
                  onClick={() => setExportOpen(false)}
                  variant="ghost"
                  className="text-white/40 hover:text-white uppercase font-mono text-[10px] tracking-widest"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
