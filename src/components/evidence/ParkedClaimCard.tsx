import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileSearch,
    FileText,
    Link2,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Hexagon,
    ArrowRight,
    Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ParkedClaim {
    id: string;
    claim_id: string;
    document_id?: string;
    confidence_score: number;
    match_type: string;
    matched_fields?: string[];
    reasoning?: string;
    created_at?: string;
    claim_details?: {
        type?: string;
        amount?: number;
        currency?: string;
    };
    document_details?: {
        filename?: string;
    };
}

interface ParkedClaimCardProps {
    claim: ParkedClaim;
    onRequestEvidence: (claimId: string) => Promise<void>;
    onForceApprove: (claimId: string) => Promise<void>;
    onDismiss: (claimId: string) => Promise<void>;
}

export function ParkedClaimCard({
    claim,
    onRequestEvidence,
    onForceApprove,
    onDismiss
}: ParkedClaimCardProps) {
    const [isRequestingEvidence, setIsRequestingEvidence] = useState(false);
    const [isForceApproving, setIsForceApproving] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    const confidencePercent = Math.round(claim.confidence_score * 100);

    const handleRequestEvidence = async () => {
        setIsRequestingEvidence(true);
        try {
            await onRequestEvidence(claim.id);
        } finally {
            setIsRequestingEvidence(false);
        }
    };

    const handleForceApprove = async () => {
        setIsForceApproving(true);
        try {
            await onForceApprove(claim.id);
        } finally {
            setIsForceApproving(false);
        }
    };

    const handleDismiss = async () => {
        setIsDismissing(true);
        try {
            await onDismiss(claim.id);
        } finally {
            setIsDismissing(false);
        }
    };

    // Determine why the claim is parked
    const getParkedReason = (): string => {
        if (confidencePercent < 30) {
            return 'Very low confidence - likely incorrect match or missing key data';
        } else if (confidencePercent < 50) {
            return 'Low confidence - some fields match but not enough to confirm';
        } else if (!claim.document_id) {
            return 'No matching document found for this claim';
        }
        return 'Confidence below auto-submit threshold';
    };

    const isLoading = isRequestingEvidence || isForceApproving || isDismissing;

    return (
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
                                <span className="text-[11px] font-bold text-gray-900 tracking-wide">
                                    Parked Claim
                                </span>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className={cn(
                                    "text-[10px] font-semibold tracking-widest",
                                    confidencePercent >= 85 ? "text-emerald-600" :
                                        confidencePercent >= 50 ? "text-amber-600" : "text-gray-400"
                                )}>
                                    {confidencePercent}% CONFIDENCE
                                </span>
                            </div>
                            {claim.created_at && (
                                <div className="text-[9px] text-gray-400 tracking-[0.15em] flex items-center gap-1.5">
                                    {format(new Date(claim.created_at), 'MMM dd, yyyy • HH:mm')}
                                </div>
                            )}
                        </div>

                        {/* ID & Source Group */}
                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-400 font-medium tracking-[0.12em]">Claim Reference</span>
                                <div className="flex items-center gap-1.5">
                                    <Link2 className="h-3 w-3 text-gray-400" />
                                    <Link to={`/recoveries/${claim.claim_id}`} className="text-xs font-mono text-gray-700 hover:text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition-colors">
                                        {claim.claim_id.substring(0, 16).toUpperCase()}
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-400 font-medium tracking-[0.12em]">Linked Document</span>
                                <div className="flex items-center gap-1.5">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    {claim.document_id ? (
                                        <Link to={`/documents/${claim.document_id}`} className="text-xs font-mono text-gray-700 hover:text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition-colors">
                                            {claim.document_details?.filename?.substring(0, 24) || claim.document_id.substring(0, 16).toUpperCase()}
                                        </Link>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Unlinked</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Partial Matches */}
                        {claim.matched_fields && claim.matched_fields.length > 0 && (
                            <div className="flex items-center gap-2 py-1 px-2 bg-gray-50 border border-gray-100 inline-flex">
                                <span className="text-[9px] text-gray-400 font-bold tracking-wider">Partial:</span>
                                <div className="flex gap-2">
                                    {claim.matched_fields.map((field, idx) => (
                                        <span key={idx} className="text-[9px] text-gray-600 font-semibold tracking-widest decoration-gray-300">
                                            {field.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Advisory */}
                        <div className="flex items-start gap-2 pt-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-gray-900 tracking-widest">System Advisory</span>
                                <p className="text-[11px] text-gray-500 leading-relaxed max-w-xl">
                                    {getParkedReason()}. Manual verification or supplemental evidence required to proceed with recovery filing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Actions Column */}
                <div className="flex flex-col gap-2 shrink-0 pr-6">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRequestEvidence}
                        disabled={isLoading}
                        className="h-8 justify-start text-[10px] font-bold text-gray-400 tracking-[0.15em] hover:text-gray-900 hover:bg-transparent group/btn p-0">
                        <span className="flex items-center gap-2">
                            {isRequestingEvidence ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Search className="w-3.5 h-3.5" />
                            )}
                            FIND EVIDENCE
                        </span>
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleForceApprove}
                            disabled={isLoading}
                            className="h-8 text-[10px] font-bold text-gray-400 hover:text-emerald-700 tracking-[0.15em] hover:bg-transparent p-0"
                            title="Force approve despite low confidence">
                            {isForceApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    APPROVE
                                </span>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDismiss}
                            disabled={isLoading}
                            className="h-8 text-[10px] font-bold text-gray-400 hover:text-red-700 tracking-[0.15em] hover:bg-transparent p-0"
                            title="Dismiss this claim">
                            {isDismissing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    DISMISS
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParkedClaimCard;
