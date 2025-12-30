import React, { useState, useMemo } from 'react';
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
    FileText,
    Receipt,
    TrendingUp,
    CreditCard,
    Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock transaction data - will be replaced with API calls
const mockTransactions = [
    {
        id: 'txn_001',
        date: '2025-12-30',
        caseId: '123-456-789',
        amazonCaseUrl: 'https://sellercentral.amazon.com/case/123-456-789',
        reimbursementId: 'REIMB-999',
        recoveredAmount: 1000.00,
        feePercent: 20,
        feeAmount: 200.00,
        status: 'paid',
        stripeLastFour: '4242',
        description: 'Lost inventory claim - SKU-1234'
    },
    {
        id: 'txn_002',
        date: '2025-12-28',
        caseId: '987-654-321',
        amazonCaseUrl: 'https://sellercentral.amazon.com/case/987-654-321',
        reimbursementId: 'REIMB-888',
        recoveredAmount: 750.50,
        feePercent: 20,
        feeAmount: 150.10,
        status: 'paid',
        stripeLastFour: '4242',
        description: 'FBA fee overcharge - ASIN B009876'
    },
    {
        id: 'txn_003',
        date: '2025-12-25',
        caseId: '111-222-333',
        amazonCaseUrl: 'https://sellercentral.amazon.com/case/111-222-333',
        reimbursementId: 'REIMB-777',
        recoveredAmount: 2500.00,
        feePercent: 20,
        feeAmount: 500.00,
        status: 'pending',
        stripeLastFour: null,
        description: 'Damaged inventory - Multiple SKUs'
    },
    {
        id: 'txn_004',
        date: '2025-12-20',
        caseId: '444-555-666',
        amazonCaseUrl: 'https://sellercentral.amazon.com/case/444-555-666',
        reimbursementId: 'REIMB-666',
        recoveredAmount: 325.75,
        feePercent: 20,
        feeAmount: 65.15,
        status: 'paid',
        stripeLastFour: '4242',
        description: 'Weight/dimension fee error'
    }
];

interface Transaction {
    id: string;
    date: string;
    caseId: string;
    amazonCaseUrl: string;
    reimbursementId: string;
    recoveredAmount: number;
    feePercent: number;
    feeAmount: number;
    status: 'paid' | 'pending' | 'disputed' | 'refunded';
    stripeLastFour: string | null;
    description: string;
}

export default function TransactionHistory() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [issueType, setIssueType] = useState<string>('');
    const [issueNotes, setIssueNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate summary statistics
    const summary = useMemo(() => {
        const totalRecovered = mockTransactions.reduce((sum, t) => sum + t.recoveredAmount, 0);
        const totalFees = mockTransactions.reduce((sum, t) => sum + t.feeAmount, 0);
        const netProfit = totalRecovered - totalFees;
        const transactionCount = mockTransactions.length;
        return { totalRecovered, totalFees, netProfit, transactionCount };
    }, []);

    // Filter transactions by search
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return mockTransactions;
        const query = searchQuery.toLowerCase();
        return mockTransactions.filter(t =>
            t.caseId.toLowerCase().includes(query) ||
            t.reimbursementId.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query)
        );
    }, [searchQuery]);

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
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API

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

    // Export statement as CSV
    const exportStatement = () => {
        const header = ['Date', 'Case ID', 'Reimbursement ID', 'Recovered Amount', 'Opside Fee', 'Net Amount', 'Status'];
        const rows = filteredTransactions.map(t => [
            format(new Date(t.date), 'yyyy-MM-dd'),
            t.caseId,
            t.reimbursementId,
            t.recoveredAmount.toFixed(2),
            t.feeAmount.toFixed(2),
            (t.recoveredAmount - t.feeAmount).toFixed(2),
            t.status
        ]);

        // Add summary row
        rows.push([]);
        rows.push(['', '', 'TOTAL', summary.totalRecovered.toFixed(2), summary.totalFees.toFixed(2), summary.netProfit.toFixed(2), '']);

        const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opside-statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: 'Statement Downloaded', description: 'Your transaction statement has been exported.' });
    };

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'paid':
                return <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-sm">Paid</span>;
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
        <PageLayout>
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
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Case ID</th>
                                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Reimbursement ID</th>
                                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Recovered</th>
                                    <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Opside Fee</th>
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
                                            <a
                                                href={transaction.amazonCaseUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-gray-900 hover:text-gray-600 flex items-center gap-1 font-mono"
                                            >
                                                {transaction.caseId}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
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

                        {filteredTransactions.length === 0 && (
                            <div className="px-4 py-12 text-center">
                                <p className="text-sm text-gray-400">No transactions found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Note */}
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-gray-400">
                        Monthly statements are available on the 1st of each month. Questions? Contact support@opside.ai
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
