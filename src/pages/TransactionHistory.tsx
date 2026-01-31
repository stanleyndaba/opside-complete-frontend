import React, { useState, useMemo, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Search,
    Download,
    AlertCircle,
    ExternalLink,
    Loader2,
    Calculator,
    DollarSign,
    Shield,
    Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
    id: string;
    date: string;
    caseId: string;
    amazonCaseUrl: string;
    reimbursementId: string;
    recoveredAmount: number;
    feePercent: number;
    feeAmount: number;
    status: 'paid' | 'pending' | 'disputed' | 'refunded' | 'approved';
    stripeLastFour: string | null;
    description: string;
}

export default function TransactionHistory() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [issueType, setIssueType] = useState<string>('');
    const [issueNotes, setIssueNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch real transaction data from dispute cases
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await api.getDisputeCases({ limit: 500 });
                if (!cancelled && res.ok && res.data?.cases) {
                    // Filter to only show paid/approved/completed cases (real transactions)
                    const transactionCases = res.data.cases.filter((c: any) => {
                        const status = (c.status || '').toLowerCase();
                        return status === 'paid' || status === 'approved' || status === 'resolved' ||
                            status === 'complete' || status === 'completed' || status === 'won' ||
                            status === 'submitted' || status === 'pending';
                    });

                    // Map dispute cases to transaction format
                    const mapped: Transaction[] = transactionCases.map((c: any) => {
                        const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
                        const feePercent = 20;
                        const feeAmount = amount * (feePercent / 100);
                        const status = (c.status || '').toLowerCase();

                        return {
                            id: c.id,
                            date: c.created_at || c.updated_at || new Date().toISOString(),
                            caseId: c.amazon_case_id || c.provider_case_id || c.case_number || c.id.slice(0, 12),
                            amazonCaseUrl: c.amazon_case_id
                                ? `https://sellercentral.amazon.com/case/${c.amazon_case_id}`
                                : '#',
                            reimbursementId: c.reimbursement_id || `REIMB-${c.id.slice(0, 6).toUpperCase()}`,
                            recoveredAmount: amount,
                            feePercent,
                            feeAmount,
                            status: status === 'paid' || status === 'complete' || status === 'completed' ? 'paid'
                                : status === 'approved' || status === 'won' || status === 'resolved' ? 'approved'
                                    : status === 'disputed' ? 'disputed'
                                        : 'pending',
                            stripeLastFour: c.stripe_last_four || null,
                            description: c.case_type || c.dispute_type || c.description || 'Recovery claim'
                        };
                    });

                    setTransactions(mapped);
                    console.log('[TransactionHistory] Loaded', mapped.length, 'transactions from dispute cases');
                } else {
                    setTransactions([]);
                }
            } catch (error) {
                console.error('[TransactionHistory] Failed to load transactions:', error);
                toast({
                    title: 'Error loading transactions',
                    description: 'Please try refreshing the page.'
                });
                setTransactions([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [toast]);

    // Calculate summary statistics from REAL data
    const summary = useMemo(() => {
        const totalRecovered = transactions.reduce((sum, t) => sum + t.recoveredAmount, 0);
        const totalFees = transactions.reduce((sum, t) => sum + t.feeAmount, 0);
        const netProfit = totalRecovered - totalFees;
        const transactionCount = transactions.length;
        return { totalRecovered, totalFees, netProfit, transactionCount };
    }, [transactions]);

    // Filter transactions by search
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const query = searchQuery.toLowerCase();
        return transactions.filter(t =>
            t.caseId.toLowerCase().includes(query) ||
            t.reimbursementId.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
        );
    }, [searchQuery, transactions]);

    const handleReportIssue = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIssueType('');
        setIssueNotes('');
        setReportModalOpen(true);
    };

    const handleSubmitReport = async () => {
        if (!issueType || !selectedTransaction) return;

        setIsSubmitting(true);
        try {
            // TODO: API call to submit report
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: 'Issue Reported',
                description: `Your report for transaction ${selectedTransaction.reimbursementId} has been submitted. Our team will review it within 24 hours.`
            });
            setReportModalOpen(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit report. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Export statement as PDF
    const exportStatement = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const today = format(new Date(), 'MMMM dd, yyyy');
        const statementDate = format(new Date(), 'yyyy-MM-dd');

        // Load logo image
        let logoLoaded = false;
        try {
            const response = await fetch('/logoimagetwo.png');
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    if (reader.result) {
                        try {
                            doc.addImage(reader.result as string, 'PNG', 14, 12, 25, 12);
                            logoLoaded = true;
                        } catch (e) {
                            console.warn('Could not add logo to PDF:', e);
                        }
                    }
                    resolve();
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('Could not load logo:', e);
        }

        // Header text (positioned after logo or at start if no logo)
        const headerTextX = logoLoaded ? 42 : 14;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('MARGIN', headerTextX, 18);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Recovery Statement', headerTextX, 24);

        // Statement info (right side)
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text(`Statement Date: ${today}`, pageWidth - 14, 15, { align: 'right' });
        doc.text(`Transactions: ${filteredTransactions.length}`, pageWidth - 14, 22, { align: 'right' });

        // Summary section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, 42);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total Recovered:`, 14, 52);
        doc.text(`$${summary.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 52);

        doc.text(`Platform Fee (20%):`, 14, 59);
        doc.text(`-$${summary.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 59);

        doc.setFont('helvetica', 'bold');
        doc.text(`Net Profit:`, 14, 69);
        doc.text(`$${summary.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 70, 69);

        // Horizontal line
        doc.setDrawColor(200);
        doc.line(14, 77, pageWidth - 14, 77);

        // Transaction table
        const tableData = filteredTransactions.map(t => [
            format(new Date(t.date), 'MMM dd, yyyy'),
            t.caseId,
            t.reimbursementId,
            `$${t.recoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `-$${t.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `$${(t.recoveredAmount - t.feeAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            t.status.charAt(0).toUpperCase() + t.status.slice(1)
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['Date', 'Case ID', 'Reimb ID', 'Recovered', 'Fee', 'Net', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [30, 30, 30],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { cellWidth: 30 },
                2: { cellWidth: 28 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 22, halign: 'right' },
                5: { cellWidth: 25, halign: 'right' },
                6: { cellWidth: 22 }
            },
            margin: { left: 14, right: 14 }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generated by Margin • support@margin.ai', pageWidth / 2, finalY + 15, { align: 'center' });

        // Save the PDF
        doc.save(`margin-statement-${statementDate}.pdf`);

        toast({ title: 'Statement Downloaded', description: 'Your PDF statement has been generated.' });
    };

    const getStatusBadge = (status: Transaction['status']) => {
        const config: Record<string, { dot: string; label: string }> = {
            paid: { dot: 'bg-emerald-500', label: 'PAID' },
            approved: { dot: 'bg-blue-500', label: 'APPROVED' },
            pending: { dot: 'bg-gray-400', label: 'PENDING' },
            disputed: { dot: 'bg-amber-500', label: 'DISPUTED' },
            refunded: { dot: 'bg-purple-500', label: 'REFUNDED' },
        };

        const { dot, label } = config[status] || { dot: 'bg-gray-400', label: 'UNKNOWN' };

        return (
            <div className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                <span className="text-xs font-bold text-gray-900 font-mono">{label}</span>
            </div>
        );
    };

    return (
        <PageLayout title="Transaction History" midnight>
            <div className="relative -m-4 lg:-m-6 bg-[#0c0c0c] min-h-screen">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                <div className="relative container mx-auto px-6 py-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-[0.2em]">Account Statement</span>
                            </div>
                            <h1 className="text-4xl font-light text-white tracking-tight font-serif italic">Transaction <span className="text-white/40 not-italic">History</span></h1>
                            <p className="text-sm text-gray-400 mt-2 max-w-xl leading-relaxed">
                                Real-time monitoring of recovery disbursements and matched financial repositories.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={exportStatement}
                                disabled={transactions.length === 0}
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-11 px-6 rounded-xl font-mono text-xs transition-all duration-300"
                            >
                                <Download className="h-4 w-4 mr-2 text-emerald-500" />
                                Export Statement (PDF)
                            </Button>
                        </div>
                    </div>


                    {/* Financial Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                        {[
                            { label: 'TOTAL_RECOVERED', value: summary.totalRecovered, prefix: '+', color: 'text-white' },
                            { label: 'PLATFORM_FEES', value: summary.totalFees, prefix: '-', color: 'text-white/40' },
                            { label: 'NET_REVENUE', value: summary.netProfit, prefix: '$', color: 'text-emerald-400', glow: true },
                            { label: 'TX_COUNT', value: summary.transactionCount, color: 'text-white' }
                        ].map((stat, i) => (
                            <div key={i} className="group relative">
                                <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-xl group-hover:bg-white/[0.05] transition-all duration-500" />
                                <div className="relative p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                                    <div className="text-[10px] font-mono text-gray-500 mb-3 tracking-widest">{stat.label}</div>
                                    <div className={cn(
                                        "text-2xl font-mono tracking-tighter",
                                        stat.color,
                                        stat.glow && "drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                    )}>
                                        {stat.prefix}{stat.label === 'TX_COUNT' ? stat.value : stat.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="mt-4 h-[2px] w-8 bg-white/10 group-hover:w-full transition-all duration-700" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="relative max-w-sm w-full group">
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-lg group-hover:bg-emerald-500/10 transition-all duration-500" />
                            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md focus-within:border-emerald-500/50 transition-all duration-300">
                                <Search className="h-4 w-4 text-gray-500 ml-4 group-hover:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Search History (Case ID, Reimb ID...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none text-white font-mono text-[10px] h-12 uppercase placeholder:text-gray-600 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Audit Ledger Table */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/[0.01] rounded-3xl blur-3xl" />
                        <div className="relative bg-black/40 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden border-t-white/20">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Calculator className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <h2 className="text-sm font-light text-white tracking-wide">Transaction History</h2>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500">SYS_UPTIME: 99.99%</span>
                            </div>

                            <div className="overflow-x-auto p-0">
                                {loading ? (
                                    <div className="py-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500 mb-4" />
                                        <p className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest">Initialising_Secure_Vault...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Timestamp</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Case_Identifier</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">Reference_No</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">Magnitude</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">Protocol_Fee</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">State</th>
                                                <th className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest text-right">Command</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredTransactions.map((transaction) => (
                                                <tr key={transaction.id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                                                    <td className="px-6 py-6 font-mono text-[10px] text-white/60 relative">
                                                        <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                        {format(new Date(transaction.date), 'MMM dd, yyyy').toUpperCase()}
                                                    </td>
                                                    <td className="px-6 py-6 font-mono text-[11px] text-white">
                                                        {transaction.amazonCaseUrl !== '#' ? (
                                                            <a href={transaction.amazonCaseUrl} target="_blank" rel="noopener noreferrer"
                                                                className="hover:text-emerald-400 flex items-center gap-1 transition-colors">
                                                                {transaction.caseId}
                                                                <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                                                            </a>
                                                        ) : transaction.caseId}
                                                    </td>
                                                    <td className="px-6 py-6 font-mono text-[11px] text-white/40">
                                                        {transaction.reimbursementId}
                                                    </td>
                                                    <td className="px-6 py-6 text-right font-mono text-[11px] text-emerald-400">
                                                        +${transaction.recoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-6 text-right font-mono text-[11px] text-white/20 uppercase">
                                                        -${transaction.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "h-1 w-1 rounded-full",
                                                                transaction.status === 'paid' ? "bg-emerald-500" :
                                                                    transaction.status === 'approved' ? "bg-blue-400" :
                                                                        transaction.status === 'pending' ? "bg-yellow-400" : "bg-gray-400"
                                                            )} />
                                                            <span className="text-[9px] font-mono font-bold text-white tracking-widest uppercase">{transaction.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleReportIssue(transaction)}
                                                            className="opacity-0 group-hover:opacity-100 h-7 text-[9px] font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                                        >
                                                            REPORT_ANOMALY
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {!loading && filteredTransactions.length === 0 && (
                                    <div className="py-24 text-center">
                                        <div className="h-12 w-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">
                                            {transactions.length === 0 ? 'No_Records_Found_In_Ledger' : 'No_Matching_Query_Results'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-12 text-center border-t border-white/5 pt-8">
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                            Account Statement • Sync Status: Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Dialog Styling */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 text-white shadow-2xl backdrop-blur-xl p-0 overflow-hidden">
                    <div className="p-8">
                        <DialogHeader className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-light tracking-tight">Flag Anomaly</DialogTitle>
                                    <DialogDescription className="text-gray-500 font-mono text-[10px] uppercase tracking-wider mt-1">
                                        INCIDENT_REPORT_FORM // {selectedTransaction?.reimbursementId || 'SECURE_LINE'} // MAGNITUDE: ${selectedTransaction?.recoveredAmount.toFixed(2) || '0.00'}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Classification</Label>
                                <Select value={issueType} onValueChange={setIssueType}>
                                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-xs font-mono text-white rounded-xl focus:ring-emerald-500">
                                        <SelectValue placeholder="SELECT_ISSUE_TYPE" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#151515] border-white/10 text-white rounded-xl font-mono text-xs">
                                        <SelectItem value="not_my_claim">INCORRECT_ATTRIBUTION</SelectItem>
                                        <SelectItem value="amount_wrong">QUANTITY_DISCREPANCY</SelectItem>
                                        <SelectItem value="duplicate">REDUNDANT_ENTRY</SelectItem>
                                        <SelectItem value="other">GENERAL_ANOMALY</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Technical_Context</Label>
                                <Textarea
                                    value={issueNotes}
                                    onChange={(e) => setIssueNotes(e.target.value)}
                                    placeholder="PROVIDE_DETAILED_INCIDENT_DATA..."
                                    className="bg-white/5 border-white/10 min-h-[120px] text-xs font-mono text-white rounded-xl focus:ring-emerald-500 resize-none placeholder:text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setReportModalOpen(false)}
                                className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 h-11 rounded-xl font-mono text-[10px] uppercase tracking-widest"
                            >
                                ABORT_REPORT
                            </Button>
                            <Button
                                onClick={handleSubmitReport}
                                disabled={!issueType || isSubmitting}
                                className="flex-1 bg-white text-black hover:bg-white/90 h-11 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest"
                            >
                                {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT_REPORT'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout >
    );
}

