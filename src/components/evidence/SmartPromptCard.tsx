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
    AlertTriangle,
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
            'exact_invoice': 'Exact Invoice Match',
            'sku_match': 'SKU Match',
            'asin_match': 'ASIN Match',
            'supplier_match': 'Supplier Match',
            'date_match': 'Date Match',
            'amount_match': 'Amount Match',
            'fuzzy_match': 'Fuzzy Match',
        };
        return labels[matchType] || matchType.replace(/_/g, ' ');
    };

    return (
        <>
            <Card className="bg-amber-50 border-amber-200 hover:border-amber-300 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                        {/* Left: Match Info */}
                        <div className="flex-1 min-w-0 space-y-3">
                            {/* Header with confidence */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Needs Review
                                </Badge>
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                    {confidencePercent}% Confidence
                                </Badge>
                                <span className="text-xs text-gray-500">
                                    {getMatchTypeLabel(match.match_type)}
                                </span>
                            </div>

                            {/* Document & Claim Links */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Document</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <Link
                                            to={`/documents/${match.document_id}`}
                                            className="text-sm text-blue-600 hover:underline font-mono truncate"
                                        >
                                            {match.document_details?.filename || match.document_id.substring(0, 12) + '...'}
                                        </Link>
                                    </div>
                                    {match.document_details && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {match.document_details.supplier && (
                                                <span>Supplier: {match.document_details.supplier}</span>
                                            )}
                                            {match.document_details.invoice_number && (
                                                <span className="ml-2">Invoice: {match.document_details.invoice_number}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Claim</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Link2 className="w-4 h-4 text-gray-400" />
                                        <Link
                                            to={`/recoveries/${match.claim_id}`}
                                            className="text-sm text-blue-600 hover:underline font-mono truncate"
                                        >
                                            {match.claim_id.substring(0, 12)}...
                                        </Link>
                                    </div>
                                    {match.claim_details && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {match.claim_details.type && (
                                                <span className="capitalize">{match.claim_details.type.replace(/_/g, ' ')}</span>
                                            )}
                                            {match.claim_details.amount && (
                                                <span className="ml-2 font-medium text-gray-700">
                                                    ${match.claim_details.amount.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Matched Fields */}
                            {match.matched_fields && match.matched_fields.length > 0 && (
                                <div>
                                    <Label className="text-xs text-gray-500">Matched Fields</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {match.matched_fields.map((field, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs capitalize">
                                                {field.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reasoning */}
                            {match.reasoning && (
                                <div className="text-xs text-gray-600 bg-white/50 rounded p-2 border border-gray-100">
                                    <span className="font-medium">AI Reasoning:</span> {match.reasoning}
                                </div>
                            )}

                            {/* Timestamp */}
                            {match.created_at && (
                                <div className="text-xs text-gray-400">
                                    Matched: {format(new Date(match.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            >
                                {isApproving ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                )}
                                Approve & Submit
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestMore}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                {isRequestingMore ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <FileSearch className="w-4 h-4 mr-1" />
                                )}
                                Need More Evidence
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="text-gray-500"
                            >
                                <Link to={`/recoveries/${match.claim_id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-white border-gray-200">
                    <DialogHeader>
                        <DialogTitle>Reject Match</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            This match will be marked as rejected and won't be auto-submitted.
                            You can optionally provide a reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="reject-reason">Rejection Reason (optional)</Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Document is for a different order, Invoice date doesn't match..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {isRejecting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                            Reject Match
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default SmartPromptCard;
