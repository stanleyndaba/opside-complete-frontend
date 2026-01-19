import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CheckCircle2,
    XCircle,
    Hexagon,
    ArrowRight,
    Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SmartPromptMatch {
    id: string;
    claim_id: string;
    document_id: string;
    confidence_score: number;
    match_type: string;
    matched_fields?: string[];
    reasoning?: string;
    created_at?: string;
    // Optional enriched data
    claim_details?: {
        type?: string;
        amount?: number;
        currency?: string;
        sku?: string;
        asin?: string;
    };
    document_details?: {
        filename?: string;
        supplier?: string;
        invoice_number?: string;
        amount?: number;
    };
}

interface SmartPromptCardProps {
    match: SmartPromptMatch;
    onApprove: (matchId: string) => Promise<void>;
    onReject: (matchId: string, reason?: string) => Promise<void>;
    onRequestMoreEvidence: (matchId: string) => Promise<void>;
}

export function SmartPromptCard({
    match,
    onApprove,
    onReject,
    onRequestMoreEvidence
}: SmartPromptCardProps) {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isRequestingMore, setIsRequestingMore] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const confidencePercent = Math.round(match.confidence_score * 100);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await onApprove(match.id);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await onReject(match.id, rejectReason);
            setShowRejectDialog(false);
            setRejectReason('');
        } finally {
            setIsRejecting(false);
        }
    };

    const handleRequestMore = async () => {
        setIsRequestingMore(true);
        try {
            await onRequestMoreEvidence(match.id);
        } finally {
            setIsRequestingMore(false);
        }
    };

    const getMatchTypeLabel = (matchType: string) => {
        const labels: Record<string, string> = {
            'exact_invoice': 'Invoice',
            'sku_match': 'SKU',
            'asin_match': 'ASIN',
            'supplier_match': 'Supplier',
            'date_match': 'Date',
            'amount_match': 'Amount',
            'fuzzy_match': 'Fuzzy',
            'order_id': 'Order ID',
        };
        return labels[matchType] || matchType.replace(/_/g, ' ');
    };

    return (
        <>
            {/* Pentagon Institutional Design - Clean, Minimal, List View */}
            <div className="group relative pl-6 py-6 hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                {/* Institutional Accent Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-900 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />

                <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Visual Indicator */}
                        <div className="mt-1 flex items-center justify-center w-8 h-8 border border-gray-200 bg-white">
                            <Hexagon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>

                        <div className="space-y-3 flex-1">
                            {/* Header Metadata */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">
                                        Manual Confirmation Required
                                    </span>
                                    <span className="text-[10px] text-gray-300">|</span>
                                    <span className={cn(
                                        "text-[10px] font-semibold uppercase tracking-widest",
                                        confidencePercent >= 85 ? "text-emerald-600" :
                                            confidencePercent >= 50 ? "text-amber-600" : "text-gray-400"
                                    )}>
                                        {confidencePercent}% CONFIDENCE
                                    </span>
                                    <span className="text-[10px] text-gray-300">|</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {getMatchTypeLabel(match.match_type)}
                                    </span>
                                </div>
                                {match.created_at && (
                                    <div className="text-[9px] text-gray-400 uppercase tracking-[0.15em]">
                                        {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm')}
                                    </div>
                                )}
                            </div>

                            {/* ID & Source Group */}
                            <div className="flex items-center gap-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.12em]">Claim Reference</span>
                                    <div className="flex items-center gap-1.5">
                                        <Link2 className="h-3 w-3 text-gray-400" />
                                        <Link to={`/recoveries/${match.claim_id}`} className="text-xs font-mono text-gray-700 hover:text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition-colors">
                                            {match.claim_id.substring(0, 16).toUpperCase()}
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.12em]">Linked Document</span>
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="h-3 w-3 text-gray-400" />
                                        <Link to={`/documents/${match.document_id}`} className="text-xs font-mono text-gray-700 hover:text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition-colors">
                                            {match.document_details?.filename?.substring(0, 24) || match.document_id.substring(0, 16).toUpperCase()}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Reasoning / System Insight */}
                            {match.reasoning && (
                                <div className="flex items-start gap-2 pt-1">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">System Reasoning</span>
                                        <p className="text-[11px] text-gray-500 leading-relaxed max-w-xl">
                                            {match.reasoning}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Matched Fields */}
                            {match.matched_fields && match.matched_fields.length > 0 && (
                                <div className="flex items-center gap-2 py-1 px-2 bg-gray-50 border border-gray-100 inline-flex">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Correlation:</span>
                                    <div className="flex gap-2">
                                        {match.matched_fields.map((field, idx) => (
                                            <span key={idx} className="text-[9px] text-gray-600 font-semibold uppercase tracking-widest decoration-gray-300">
                                                {field.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vertical Actions Column */}
                    <div className="flex flex-col gap-2 shrink-0 pr-6">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={handleApprove}
                            disabled={isApproving || isRejecting || isRequestingMore}
                            className="bg-gray-900 hover:bg-gray-800 text-white h-8 text-[10px] font-bold uppercase tracking-[0.15em] px-4 rounded-none">
                            {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : null}
                            CONFIRM MATCH
                        </Button>

                        <div className="flex items-center gap-4 mt-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="h-8 text-[10px] font-bold text-gray-400 hover:text-red-700 uppercase tracking-[0.15em] hover:bg-transparent p-0">
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    REJECT
                                </span>
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleRequestMore}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="h-8 text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-[0.15em] hover:bg-transparent p-0">
                                <span className="flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5" />
                                    FIND MORE
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Dialog - Pentagon Style */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-white border-gray-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-medium text-gray-900 uppercase tracking-[0.1em]">
                            Reject Match
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            This match will not be submitted. Provide an optional reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reject-reason" className="text-[10px] uppercase tracking-[0.1em] text-gray-500">
                            Reason (optional)
                        </Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Wrong order, date mismatch..."
                            className="mt-2 text-sm border-gray-200 focus:border-gray-400"
                            rows={2}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectReason('');
                            }}
                            className="text-xs border-gray-200">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="bg-gray-900 hover:bg-gray-800 text-white text-xs">
                            {isRejecting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default SmartPromptCard;
