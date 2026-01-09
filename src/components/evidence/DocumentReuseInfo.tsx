/**
 * DocumentReuseInfo Component
 * Displays "This invoice already supports X other claims" messaging
 * and allows linking documents to claims
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { FileText, Link2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface LinkedClaim {
    claimId: string;
    claimNumber?: string;
    claimType: string;
    amount: number;
    currency: string;
    linkDate: string;
    matchType: string;
    confidence: number;
}

interface DocumentReuseInfoProps {
    documentId: string;
    onLinkClaim?: (claimId: string) => void;
    compact?: boolean;
}

export function DocumentReuseInfo({ documentId, onLinkClaim, compact = false }: DocumentReuseInfoProps) {
    const [linkedClaims, setLinkedClaims] = useState<LinkedClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [reuseMessage, setReuseMessage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLinkedClaims() {
            try {
                const res = await api.get<{
                    success: boolean;
                    linkedClaimCount: number;
                    linkedClaims: LinkedClaim[];
                    reuseMessage: string | null;
                }>(`/api/evidence/documents/${documentId}/linked-claims`);

                if (res.ok && res.data) {
                    setLinkedClaims(res.data.linkedClaims || []);
                    setReuseMessage(res.data.reuseMessage);
                }
            } catch (error) {
                console.error('Failed to fetch linked claims:', error);
            } finally {
                setLoading(false);
            }
        }

        if (documentId) {
            fetchLinkedClaims();
        }
    }, [documentId]);

    if (loading) {
        return <span className="text-xs text-gray-400">Loading...</span>;
    }

    if (linkedClaims.length === 0) {
        return compact ? null : (
            <span className="text-xs text-gray-500">Not linked to any claims</span>
        );
    }

    // Compact mode: just show badge with count
    if (compact) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs cursor-pointer">
                        <Link2 className="h-3 w-3 mr-1" />
                        {linkedClaims.length} claim{linkedClaims.length> 1 ? 's' : ''}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="bg-white text-gray-900 border border-gray-200 p-3 max-w-xs">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-purple-700">
                            📎 {reuseMessage}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {linkedClaims.slice(0, 5).map((claim) => (
                                <Link
                                    key={claim.claimId}
                                    to={`/recoveries/${claim.claimId}`}
                                    className="text-xs text-blue-600 hover:underline">
                                    {claim.claimNumber || claim.claimId.slice(0, 8)}
                                </Link>
                            ))}
                            {linkedClaims.length> 5 && (
                                <span className="text-xs text-gray-500">
                                    +{linkedClaims.length - 5} more
                                </span>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        );
    }

    // Full mode: show complete info
    return (
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                    {reuseMessage}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {linkedClaims.map((claim) => (
                    <Link
                        key={claim.claimId}
                        to={`/recoveries/${claim.claimId}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 rounded-md text-xs text-purple-700 hover:bg-purple-50 transition-colors">
                        <FileText className="h-3 w-3" />
                        {claim.claimNumber || claim.claimId.slice(0, 8)}
                        <span className="text-purple-400">•</span>
                        <span className="text-emerald-600">
                            ${claim.amount.toLocaleString()}
                        </span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                ))}
            </div>

            {onLinkClaim && (
                <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                    onClick={() => onLinkClaim(documentId)}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Link to another claim
                </Button>
            )}
        </div>
    );
}

/**
 * Document Suggestions for a Claim
 * Shows documents that can be reused for this claim
 */
interface ReuseSuggestion {
    documentId: string;
    filename: string;
    matchReason: string;
    linkedClaimCount: number;
    matchScore: number;
    reuseMessage: string;
}

interface DocumentSuggestionsProps {
    claimId: string;
    onSelectDocument?: (documentId: string) => void;
}

export function DocumentSuggestions({ claimId, onSelectDocument }: DocumentSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<ReuseSuggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                const res = await api.get<{
                    success: boolean;
                    suggestions: ReuseSuggestion[];
                }>(`/api/evidence/claims/${claimId}/suggest-documents`);

                if (res.ok && res.data) {
                    setSuggestions(res.data.suggestions || []);
                }
            } catch (error) {
                console.error('Failed to fetch document suggestions:', error);
            } finally {
                setLoading(false);
            }
        }

        if (claimId) {
            fetchSuggestions();
        }
    }, [claimId]);

    if (loading) {
        return (
            <div className="text-sm text-gray-500 p-4">
                Loading document suggestions...
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                No matching documents found. Try uploading invoices with matching SKU/ASIN.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
                📎 Suggested Documents ({suggestions.length})
            </h4>

            {suggestions.map((suggestion) => (
                <div
                    key={suggestion.documentId}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                                {suggestion.filename}
                            </span>
                            {suggestion.linkedClaimCount> 0 && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                    {suggestion.linkedClaimCount} claims
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {suggestion.matchReason}
                        </p>
                        {suggestion.linkedClaimCount> 0 && (
                            <p className="text-xs text-purple-600 mt-1">
                                ♻️ {suggestion.reuseMessage}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <span className="text-xs font-medium text-emerald-600">
                                {Math.round(suggestion.matchScore * 100)}% match
                            </span>
                        </div>
                        {onSelectDocument && (
                            <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={() => onSelectDocument(suggestion.documentId)}>
                                Use
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default DocumentReuseInfo;
