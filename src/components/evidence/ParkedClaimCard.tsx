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
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { claimReferenceLabel, documentReferenceLabel } from '@/lib/displayReferences';

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
                                <span className="text-[10px] font-sans font-medium text-white uppercase tracking-tight">
                                    Needs Review
                                </span>
                                <div className="h-1 w-1 rounded-full bg-white/10" />
                                <span className={cn(
                                    "text-[10px] font-sans font-medium uppercase tracking-tight",
                                    confidencePercent >= 85 ? "text-emerald-500" :
                                        confidencePercent >= 50 ? "text-amber-500" : "text-white/20"
                                )}>
                                    {confidencePercent}% confidence
                                </span>
                            </div>
                            {claim.created_at && (
                                <div className="text-[9px] font-sans font-medium text-white/20 tracking-tight">
                                    Added {format(new Date(claim.created_at), 'MMM dd, yyyy • HH:mm')}
                                </div>
                            )}
                        </div>

                        {/* ID & Source Group */}
                        <div className="flex items-center gap-8">
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-sans font-medium text-white/20 uppercase tracking-tight">Claim</span>
                                <div className="flex items-center gap-2">
                                    <Link2 className="h-3 w-3 text-white/10" />
                                    <Link to={`/recoveries/${claim.claim_id}`} className="text-[10px] font-sans font-medium text-white/65 hover:text-white transition-colors tracking-tight">
                                        {claimReferenceLabel(claim.claim_details, claim.claim_id)}
                                    </Link>
                                </div>
                            </div>

                             <div className="space-y-1.5">
                                <span className="text-[8px] font-sans font-medium text-white/20 uppercase tracking-tight">Document</span>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-white/10" />
                                    {claim.document_id ? (
                                        <Link to={`/documents/${claim.document_id}`} className="text-[10px] font-sans font-medium text-white/65 hover:text-white transition-colors tracking-tight">
                                            {documentReferenceLabel(claim.document_details, claim.document_id)}
                                        </Link>
                                    ) : (
                                        <span className="text-[10px] font-sans font-medium text-white/20 italic tracking-tight">No linked document</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Partial Matches */}
                        {claim.matched_fields && claim.matched_fields.length > 0 && (
                            <div className="flex items-center gap-3 py-1.5 px-3 bg-white/5 border border-white/5 rounded-lg inline-flex">
                                <span className="text-[8px] font-sans font-medium text-white/20 uppercase tracking-tight">Matched fields</span>
                                <div className="flex gap-3">
                                    {claim.matched_fields.map((field, idx) => (
                                        <span key={idx} className="text-[9px] font-sans font-medium text-white/55 uppercase tracking-tight">
                                            {field.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* System Advisory */}
                        <div className="flex items-start gap-3 pt-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500/50 shrink-0 mt-1" />
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-sans font-medium text-white/25 uppercase tracking-tight leading-none">Why it is held</span>
                                <p className="text-[11px] font-sans font-normal text-white/45 leading-relaxed max-w-2xl tracking-tight italic">
                                    {getParkedReason()}. Manual verification or more evidence is required before filing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Actions Column */}
                <div className="flex flex-col gap-3 shrink-0">
                    <Button
                        onClick={handleRequestEvidence}
                        disabled={isLoading}
                        className="h-11 px-6 font-sans text-[10px] font-medium uppercase tracking-tight bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10 transition-all rounded-xl">
                        {isRequestingEvidence ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                        ) : (
                            <Search className="w-3.5 h-3.5 mr-2" />
                        )}
                        Request Evidence
                    </Button>

                    <div className="flex items-center justify-between gap-4 px-1">
                        <Button
                            variant="ghost"
                            onClick={handleForceApprove}
                            disabled={isLoading}
                            className="h-8 text-[9px] font-sans font-medium text-white/25 hover:text-white hover:bg-transparent p-0 uppercase tracking-tight transition-colors">
                            {isForceApproving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Approve Anyway
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleDismiss}
                            disabled={isLoading}
                            className="h-8 text-[9px] font-sans font-medium text-white/25 hover:text-red-400 hover:bg-transparent p-0 uppercase tracking-tight transition-colors">
                            {isDismissing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Dismiss
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
