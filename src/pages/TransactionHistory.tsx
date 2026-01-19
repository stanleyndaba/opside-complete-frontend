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
                <span className="text-[9px] font-bold text-gray-900 tracking-widest font-mono">{label}</span>
            </div>
        );
    };

    return (
        <PageLayout title="Transaction History">
            <div className="relative -m-4 lg:-m-6">
                <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
                    <div className="relative container mx-auto px-8 pt-8 pb-10 text-gray-700">

                        {/* Header */}
                        <div className="mb-10 flex items-end justify-between border-b border-gray-100 pb-8">
                            <div>
                                <h1 className="text-xl font-light text-gray-900 tracking-tight">Transaction Ledger</h1>
                                <p className="text-[10px] text-gray-400 mt-1 tracking-[0.2em] font-mono">INTERNAL AUDIT // COMPLETED TRANSACTIONS</p>
                            </div>
                        </div>


                        {/* Summary Cards */}
                        <div className="bg-white border border-gray-200 rounded-sm mb-8">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-xs font-medium text-gray-900 tracking-[0.15em]">Financial Overview</h2>
                                <p className="text-[10px] text-gray-500 mt-0.5">Aggregated metrics for realized recoveries</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-gray-100 italic-divider">
                                    <div className="p-6 bg-gray-50/50">
                                        <div className="text-[9px] text-gray-400 tracking-[0.2em] font-bold mb-2">Total Recovered</div>
                                        <div className="text-2xl font-light text-gray-900 font-mono tracking-tight">
                                            +${summary.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="p-6 border-l border-gray-100 bg-gray-50/50">
                                        <div className="text-[9px] text-gray-400 tracking-[0.2em] font-bold mb-2">Total Fees (20%)</div>
                                        <div className="text-2xl font-light text-gray-600 font-mono tracking-tight">
                                            -${summary.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="p-6 border-l border-gray-100 bg-gray-50/50">
                                        <div className="text-[9px] text-gray-400 tracking-[0.2em] font-bold mb-2">Net Profit</div>
                                        <div className="text-2xl font-light text-emerald-600 font-mono tracking-tight">
                                            ${summary.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="p-6 border-l border-gray-100 bg-gray-50/50">
                                        <div className="text-[9px] text-gray-400 tracking-[0.2em] font-bold mb-2">Transactions</div>
                                        <div className="text-2xl font-light text-gray-900 font-mono tracking-tight">
                                            {summary.transactionCount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and Actions */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="SEARCH REFERENCE ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-9 text-[10px] border-gray-200 rounded-none bg-white font-mono placeholder:text-gray-400"
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportStatement}
                                disabled={transactions.length === 0}
                                className="h-9 text-[10px] border-gray-200 text-gray-700 rounded-none hover:bg-gray-50 tracking-widest font-bold">
                                <Download className="h-3.5 w-3.5 mr-2" />
                                Download Statement
                            </Button>
                        </div>

                        {/* Transaction Table */}
                        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-xs font-medium text-gray-900 tracking-[0.15em]">
                                    Detailed Ledger
                                </h2>
                            </div>

                            <div className="overflow-x-auto p-0">
                                {loading ? (
                                    <div className="px-4 py-12 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                        <p className="text-[10px] font-mono text-gray-500 mt-2 tracking-widest">Initialising Secure Ledger...</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-900 border-none">
                                                <th className="text-left px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Date</th>
                                                <th className="text-left px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Case ID</th>
                                                <th className="text-left px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Reimbursement ID</th>
                                                <th className="text-right px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Recovered</th>
                                                <th className="text-right px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Margin Fee</th>
                                                <th className="text-left px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Status</th>
                                                <th className="text-right px-6 py-4 text-[9px] font-bold text-gray-400 tracking-[0.2em]">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTransactions.map((transaction, index) => (
                                                <tr
                                                    key={transaction.id}
                                                    className="hover:bg-gray-50/50 border-b border-gray-100 group relative transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-[11px] font-mono text-gray-700 font-bold tracking-tighter relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        {format(new Date(transaction.date), 'MMM dd, yyyy').toUpperCase()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {transaction.amazonCaseUrl !== '#' ? (
                                                            <a
                                                                href={transaction.amazonCaseUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[11px] text-gray-900 hover:text-gray-600 flex items-center gap-1 font-mono tracking-tighter font-bold">
                                                                {transaction.caseId}
                                                                <ExternalLink className="h-2.5 w-2.5 text-gray-400" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-[11px] text-gray-900 font-mono tracking-tighter font-bold">{transaction.caseId}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] text-gray-600 font-mono tracking-tighter">
                                                        {transaction.reimbursementId}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-[11px] font-bold text-gray-900 font-mono tracking-tight">
                                                            +${transaction.recoveredAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-[11px] text-gray-500 font-mono tracking-tight">
                                                            -${transaction.feeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {getStatusBadge(transaction.status)}
                                                            {transaction.stripeLastFour && (
                                                                <span className="text-[9px] text-gray-400 font-mono tracking-widest pl-3.5">
                                                                    CARD ···{transaction.stripeLastFour}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-[9px] font-bold text-gray-500 hover:text-gray-900 hover:bg-transparent tracking-widest"
                                                            onClick={() => handleReportIssue(transaction)}>
                                                            REPORT
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}

                                {!loading && filteredTransactions.length === 0 && (
                                    <div className="px-4 py-16 text-center">
                                        <p className="text-[11px] font-mono text-gray-400 tracking-widest">
                                            {transactions.length === 0
                                                ? 'No Records Found in Ledger'
                                                : 'No Matches for Query'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="mt-6 text-center border-t border-gray-100 pt-6">
                            <p className="text-[9px] text-gray-400 font-mono tracking-[0.1em]">
                                Official Ledger • Generated by Margin Audit Engine • support@margin.ai
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Issue Modal */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-none p-0 gap-0 overflow-hidden">
                    <DialogHeader className="border-b border-gray-100 px-6 py-4 bg-gray-50">
                        <DialogTitle className="text-xs font-bold text-gray-900 tracking-[0.15em]">
                            Flag Transaction
                        </DialogTitle>
                        <DialogDescription className="text-[10px] text-gray-500 mt-1 tracking-wide font-mono">
                            {selectedTransaction && (
                                <>REF: {selectedTransaction.reimbursementId} • ${selectedTransaction.recoveredAmount.toFixed(2)}</>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 tracking-[0.1em]">
                                Issue Classification
                            </Label>
                            <Select value={issueType} onValueChange={setIssueType}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 rounded-none bg-white">
                                    <SelectValue placeholder="Select classification..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 rounded-none">
                                    <SelectItem value="not_my_claim" className="text-xs">Incorrect Entity Attribution</SelectItem>
                                    <SelectItem value="amount_wrong" className="text-xs">Discrepancy in Amount</SelectItem>
                                    <SelectItem value="duplicate" className="text-xs">Duplicate Ledger Entry</SelectItem>
                                    <SelectItem value="other" className="text-xs">Other Anomaly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 tracking-[0.1em]">
                                Technical Notes
                            </Label>
                            <Textarea
                                value={issueNotes}
                                onChange={(e) => setIssueNotes(e.target.value)}
                                placeholder="Provide detailed context..."
                                className="min-h-[80px] text-xs border-gray-200 rounded-none resize-none bg-white placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <DialogFooter className="border-t border-gray-100 p-4 bg-gray-50/50 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportModalOpen(false)}
                            className="h-8 text-[10px] border-gray-200 text-gray-600 rounded-none font-bold tracking-wider hover:bg-white">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmitReport}
                            disabled={!issueType || isSubmitting}
                            className="h-8 text-[10px] bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white rounded-none font-bold tracking-wider shadow-sm">
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout >
    );
}

