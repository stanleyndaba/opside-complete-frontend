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
    XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

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
        <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            <CardContent className="p-0">
                {/* Header - Why Parked */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em]">
                                Parked Claim
                            </span>
                            <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] font-medium">
                                {confidencePercent}% confidence
                            </Badge>
                        </div>
                        {claim.created_at && (
                            <span className="text-[10px] text-gray-400">
                                {format(new Date(claim.created_at), 'MMM dd, HH:mm')}
                            </span>
                        )}
                    </div>

                    {/* Reason for parking */}
                    <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                        <span className="text-gray-400">⚠</span>
                        {getParkedReason()}
                    </p>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-6">
                        {/* Left: Claim Info */}
                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                            {/* Claim Column */}
                            <div>
                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mb-1">
                                    Claim
                                </div>
                                <Link
                                    to={`/recoveries/${claim.claim_id}`}
                                    className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 font-mono group"
                                >
                                    <Link2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                                    <span className="truncate">
                                        {claim.claim_id.substring(0, 12)}...
                                    </span>
                                </Link>
                                {claim.claim_details?.amount && (
                                    <div className="text-xs text-gray-500 mt-0.5 ml-5">
                                        ${claim.claim_details.amount.toFixed(2)}
                                        {claim.claim_details.type && (
                                            <span className="ml-1 capitalize">• {claim.claim_details.type.replace(/_/g, ' ')}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Document Column (if matched) */}
                            <div>
                                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.1em] mb-1">
                                    Document
                                </div>
                                {claim.document_id ? (
                                    <Link
                                        to={`/documents/${claim.document_id}`}
                                        className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 font-mono group"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                                        <span className="truncate">
                                            {claim.document_details?.filename || claim.document_id.substring(0, 12) + '...'}
                                        </span>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-sm text-gray-400 italic">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>No document matched</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Primary Action - Request Evidence */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestEvidence}
                                disabled={isLoading}
                                className="border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-xs"
                            >
                                {isRequestingEvidence ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                    <FileSearch className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Find Evidence
                            </Button>

                            {/* Force Approve (with caution) */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleForceApprove}
                                disabled={isLoading}
                                className="border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-xs"
                                title="Force approve despite low confidence"
                            >
                                {isForceApproving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                            </Button>

                            {/* Dismiss */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                disabled={isLoading}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                                title="Dismiss this claim"
                            >
                                {isDismissing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Matched Fields - if any */}
                    {claim.matched_fields && claim.matched_fields.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">
                                    Partial match on:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {claim.matched_fields.map((field, idx) => (
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

                    {/* Guidance */}
                    <div className="mt-3 p-2 bg-gray-50 rounded text-[10px] text-gray-500">
                        <strong>💡 Tip:</strong> Click "Find Evidence" to search for more matching documents.
                        We'll re-check after new documents are uploaded.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default ParkedClaimCard;
