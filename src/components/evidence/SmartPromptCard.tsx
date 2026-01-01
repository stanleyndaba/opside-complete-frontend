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
    FileSearch,
    FileText,
    Link2,
    Loader2,
    Eye
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
            {/* Pentagon Institutional Design - Clean, Minimal, Gray Tones */}
            <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                                    Confirm Invoice
                                </span>
                                <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] font-medium">
                                    {confidencePercent}%
                                </Badge>
                                <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-200">
                                    {getMatchTypeLabel(match.match_type)}
                                </Badge>
                            </div>
                            {match.created_at && (
                                <span className="text-[10px] text-gray-400">
                                    {format(new Date(match.created_at), 'MMM dd, HH:mm')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Row - Minimal Two-Column Layout */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-6">
                            {/* Left: Document & Claim Info */}
                            <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                                {/* Document Column */}
                                <div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mb-1">
                                        Document
                                    </div>
                                    <Link
                                        to={`/documents/${match.document_id}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 font-mono group"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                                        <span className="truncate">
                                            {match.document_details?.filename || match.document_id.substring(0, 12) + '...'}
                                        </span>
                                    </Link>
                                    {match.document_details?.amount && (
                                        <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                            ${match.document_details.amount.toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* Claim Column */}
                                <div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mb-1">
                                        Claim
                                    </div>
                                    <Link
                                        to={`/recoveries/${match.claim_id}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 font-mono group"
                                    >
                                        <Link2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                                        <span className="truncate">
                                            {match.claim_id.substring(0, 12)}...
                                        </span>
                                    </Link>
                                    {match.claim_details?.amount && (
                                        <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                            ${match.claim_details.amount.toFixed(2)}
                                            {match.claim_details.type && (
                                                <span className="ml-1 capitalize">• {match.claim_details.type.replace(/_/g, ' ')}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: One-Tap Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Primary Action - Confirm */}
                                <Button
                                    size="sm"
                                    onClick={handleApprove}
                                    disabled={isApproving || isRejecting || isRequestingMore}
                                    className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4"
                                >
                                    {isApproving ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    Confirm
                                </Button>

                                {/* Secondary Actions */}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={isApproving || isRejecting || isRequestingMore}
                                    className="border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-xs"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    <Link to={`/recoveries/${match.claim_id}`}>
                                        <Eye className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Matched Fields - Minimal Pills */}
                        {match.matched_fields && match.matched_fields.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">
                                        Matched on:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {match.matched_fields.map((field, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize"
                                            >
                                                {field.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

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
                            className="text-xs border-gray-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="bg-gray-900 hover:bg-gray-800 text-white text-xs"
                        >
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
