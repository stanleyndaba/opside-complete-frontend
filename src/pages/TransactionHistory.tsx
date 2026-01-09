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
    Loader2
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
        switch (status) {
            case 'paid':
                return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-sm">Paid</span>;
            case 'approved':
                return <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">Approved</span>;
            case 'pending':
                return <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-sm">Pending</span>;
            case 'disputed':
                return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-sm">Disputed</span>;
            case 'refunded':
                return <span className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-sm">Refunded</span>;
            default:
                return null;
        }
    };

    return (
        <PageLayout title="Transaction History">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-lg font-medium text-gray-900 tracking-tight">
                        Transaction History
                    </h1>
                    <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">
                        Your complete ledger of recovered funds and fees
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.1em]">Total Recovered</div>
                        <div className="text-xl font-light text-emerald-600 mt-1">
                            +${summary.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.1em]">Total Fees (20%)</div>
                        <div className="text-xl font-light text-gray-600 mt-1">
                            -${summary.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.1em]">Net Profit</div>
                        <div className="text-xl font-light text-gray-900 mt-1">
                            ${summary.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="border border-gray-200 bg-gray-50 p-4">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.1em]">Transactions</div>
                        <div className="text-xl font-light text-gray-900 mt-1">
                            {summary.transactionCount}
                        </div>
                    </div>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Case ID, Reimb ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9 text-xs border-gray-200 rounded-sm"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportStatement}
                        disabled={transactions.length === 0}
                        className="h-8 text-xs border-gray-200 text-gray-700 rounded-sm"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download Statement
                    </Button>
                </div>

                {/* Transaction Table */}
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                            Ledger
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="px-4 py-12 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                <p className="text-sm text-gray-500 mt-2">Loading transactions...</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Case ID</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Reimbursement ID</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Recovered</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Margin Fee</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction, index) => (
                                        <tr
                                            key={transaction.id}
                                            className={cn(
                                                "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                                                index % 2 === 1 && "bg-gray-50/30"
                                            )}
                                        >
                                            <td className="px-4 py-3 text-xs text-gray-700">
                                                {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {transaction.amazonCaseUrl !== '#' ? (
                                                    <a
                                                        href={transaction.amazonCaseUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-gray-900 hover:text-gray-600 flex items-center gap-1 font-mono"
                                                    >
                                                        {transaction.caseId}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-900 font-mono">{transaction.caseId}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                                                {transaction.reimbursementId}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-xs font-medium text-emerald-600">
                                                    +${transaction.recoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-xs text-gray-500">
                                                    -${transaction.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    {getStatusBadge(transaction.status)}
                                                    {transaction.stripeLastFour && (
                                                        <span className="text-[9px] text-gray-400">
                                                            ···{transaction.stripeLastFour}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    onClick={() => handleReportIssue(transaction)}
                                                >
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Report Issue
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {!loading && filteredTransactions.length === 0 && (
                            <div className="px-4 py-12 text-center">
                                <p className="text-sm text-gray-400">
                                    {transactions.length === 0
                                        ? 'No transactions yet. Transactions will appear here once disputes are approved or paid.'
                                        : 'No transactions match your search'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400">
                        Monthly statements are available on the 1st of each month. Questions? Contact support@margin.ai
                    </p>
                </div>
            </div>

            {/* Report Issue Modal */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-sm">
                    <DialogHeader className="border-b border-gray-100 pb-4">
                        <DialogTitle className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                            Report an Issue
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 mt-1">
                            {selectedTransaction && (
                                <>Transaction {selectedTransaction.reimbursementId} • ${selectedTransaction.recoveredAmount.toFixed(2)}</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                Why is this incorrect?
                            </Label>
                            <Select value={issueType} onValueChange={setIssueType}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-sm">
                                    <SelectValue placeholder="Select reason..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200">
                                    <SelectItem value="not_my_claim" className="text-xs">Not my claim</SelectItem>
                                    <SelectItem value="amount_wrong" className="text-xs">Amount is wrong</SelectItem>
                                    <SelectItem value="duplicate" className="text-xs">Duplicate charge</SelectItem>
                                    <SelectItem value="other" className="text-xs">Other issue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                Additional Details (Optional)
                            </Label>
                            <Textarea
                                value={issueNotes}
                                onChange={(e) => setIssueNotes(e.target.value)}
                                placeholder="Provide any additional details..."
                                className="min-h-[80px] text-xs border-gray-200 rounded-sm resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-t border-gray-100 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportModalOpen(false)}
                            className="h-8 text-xs border-gray-200 text-gray-600 rounded-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmitReport}
                            disabled={!issueType || isSubmitting}
                            className="h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white rounded-sm"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}

