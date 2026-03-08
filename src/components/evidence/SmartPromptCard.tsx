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
import { Link2, FileText, Loader2 } from 'lucide-react';

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
            {/* Matrix Institutional Design - Clean, Minimal, List View */}
            <div className="group relative px-8 py-6 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                {/* Status Accent Bar */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-px transition-all duration-500 origin-top scale-y-0 group-hover:scale-y-100",
                    confidencePercent >= 85 ? "bg-emerald-500" :
                        confidencePercent >= 50 ? "bg-amber-500" : "bg-white/20"
                )} />

                <div className="flex items-start justify-between gap-8">
                    <div className="flex items-start gap-6 flex-1">
                        {/* Visual Indicator */}
                        <div className={cn(
                            "mt-1 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5 transition-all duration-300",
                            confidencePercent >= 85 ? "group-hover:border-emerald-500/30 group-hover:text-emerald-500" :
                                confidencePercent >= 50 ? "group-hover:border-amber-500/30 group-hover:text-amber-500" : "group-hover:border-white/20 group-hover:text-white/40"
                        )}>
                            <Hexagon className="h-5 w-5" />
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Header Metadata */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">
                                        CORRELATION_VECT_REQUIRED
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-white/10" />
                                    <span className={cn(
                                        "text-[10px] font-sans font-bold uppercase tracking-tight",
                                        confidencePercent >= 85 ? "text-emerald-500" :
                                            confidencePercent >= 50 ? "text-amber-500" : "text-white/20"
                                    )}>
                                        {confidencePercent}%_CONFIDENCE
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-white/10" />
                                    <span className="text-[10px] font-sans font-bold text-white/10 uppercase tracking-tight">
                                        TYPE_{getMatchTypeLabel(match.match_type).toUpperCase().replace(/ /g, '_')}
                                    </span>
                                </div>
                                {match.created_at && (
                                    <div className="text-[9px] font-sans font-bold text-white/10 uppercase tracking-tight">
                                        INDEXED_{format(new Date(match.created_at), 'yyyy_MM_dd__HH:mm').toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* ID & Source Group */}
                            <div className="flex items-center gap-8">
                                <div className="space-y-1.5">
                                    <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">CLAIM_UUID</span>
                                    <div className="flex items-center gap-2">
                                        <Link2 className="h-3 w-3 text-white/10" />
                                        <Link to={`/recoveries/${match.claim_id}`} className="text-[10px] font-sans font-bold text-white/60 hover:text-emerald-500 transition-colors uppercase tracking-tight">
                                            {match.claim_id.substring(0, 16).toUpperCase()}
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">DOC_REFS</span>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3 w-3 text-white/10" />
                                        <Link to={`/documents/${match.document_id}`} className="text-[10px] font-sans font-bold text-white/60 hover:text-emerald-500 transition-colors uppercase tracking-tight">
                                            {match.document_details?.filename?.substring(0, 24) || match.document_id.substring(0, 16).toUpperCase()}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Reasoning / System Insight */}
                            {match.reasoning && (
                                <div className="flex items-start gap-2 pt-1">
                                    <div className="space-y-1.5">
                                        <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight leading-none">NEURAL_REASONING_ENGINE</span>
                                        <p className="text-[11px] font-sans font-bold text-white/40 leading-relaxed max-w-2xl lowercase italic tracking-tight">
                                            {match.reasoning}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Matched Fields */}
                            {match.matched_fields && match.matched_fields.length > 0 && (
                                <div className="flex items-center gap-3 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg inline-flex">
                                    <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">MATCH_VECTORS:</span>
                                    <div className="flex gap-3">
                                        {match.matched_fields.map((field, idx) => (
                                            <span key={idx} className="text-[9px] font-sans font-bold text-emerald-500/50 uppercase tracking-tight">
                                                {field.replace(/_/g, '_')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vertical Actions Column */}
                    <div className="flex flex-col gap-3 shrink-0">
                         <Button
                            onClick={handleApprove}
                            disabled={isApproving || isRejecting || isRequestingMore}
                            className={cn(
                                "h-11 px-6 font-sans text-[10px] font-bold uppercase tracking-tight transition-all rounded-xl border",
                                confidencePercent >= 85
                                    ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                    : "bg-white/5 text-white/40 border-white/5 hover:text-white hover:bg-white/10"
                            )}>
                            {isApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : null}
                            {confidencePercent >= 85 ? 'EXECUTE_LINK' : 'CONFIRM_VECT'}
                        </Button>

                        <div className="flex items-center justify-between gap-4 px-1">
                            <Button
                                variant="ghost"
                                onClick={() => setShowRejectDialog(true)}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="h-8 text-[9px] font-sans font-bold text-white/20 hover:text-red-400 hover:bg-transparent p-0 uppercase tracking-tight transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    REJECT
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={handleRequestMore}
                                disabled={isApproving || isRejecting || isRequestingMore}
                                className="h-8 text-[9px] font-sans font-bold text-white/20 hover:text-white hover:bg-transparent p-0 uppercase tracking-tight transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5" />
                                    SCAN_MORE
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Dialog - Matrix Style */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-2xl max-w-sm">
                    <DialogHeader className="border-b border-white/5 pb-4">
                        <DialogTitle className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">
                            TERMINATE_CORRELATION
                        </DialogTitle>
                        <DialogDescription className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mt-1">
                            This match will be purged from the active ledger. Provide rationale for node termination.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Label htmlFor="reject-reason" className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">
                            TERMINATION_LOG
                        </Label>
                        <Textarea
                            id="reject-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., WRONG_ID, TEMPORAL_MISMATCH..."
                            className="mt-3 text-[10px] font-sans font-bold bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:border-red-500/30 focus:ring-red-500/10 rounded-xl transition-all"
                            rows={3}
                        />
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectReason('');
                            }}
                            className="flex-1 text-[9px] font-sans font-bold text-white/20 hover:text-white hover:bg-white/5 uppercase tracking-tight rounded-xl">
                            ABORT_ACTION
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isRejecting}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-[9px] font-sans font-bold uppercase tracking-tight rounded-xl transition-all">
                            {isRejecting ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5 mr-2" />
                            )}
                            CONFIRM_PURGE
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default SmartPromptCard;
