/**
 * EvidenceAuditTrail Component
 * Displays legal-grade audit trail for evidence documents
 * Shows narrative-style events: "Invoice → ingested → parsed → linked"
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    FileText,
    Download,
    Check,
    Link2,
    Edit3,
    Send,
    AlertCircle,
    Clock,
    ChevronDown,
    ChevronRight,
    Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { api } from '@/lib/api';

interface AuditEvent {
    id: string;
    documentId: string;
    eventType: 'ingested' | 'parsed' | 'linked' | 'unlinked' | 'edited' | 'filed' | 'verified' | 'error';
    timestamp: string;
    actor?: string;
    details: {
        source?: string;
        parserVersion?: string;
        claimId?: string;
        claimNumber?: string;
        fieldName?: string;
        oldValue?: string;
        newValue?: string;
        reason?: string;
        extractedFields?: string[];
        confidence?: number;
    };
    narrative: string;
    documentFilename?: string;
}

interface DocumentSummary {
    documentId: string;
    filename: string;
    summary: {
        ingestedAt?: string;
        ingestedFrom?: string;
        parsedAt?: string;
        parserVersion?: string;
        linkedClaims: number;
        lastActivity: string;
    };
}

interface EvidenceAuditTrailProps {
    claimId?: string;
    documentId?: string;
    compact?: boolean;
}

const eventIcons: Record<string, React.ReactNode> = {
    ingested: <Download className="h-4 w-4" />,
    parsed: <FileText className="h-4 w-4" />,
    linked: <Link2 className="h-4 w-4" />,
    unlinked: <Link2 className="h-4 w-4" />,
    edited: <Edit3 className="h-4 w-4" />,
    filed: <Send className="h-4 w-4" />,
    verified: <Check className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />
};

const eventColors: Record<string, string> = {
    ingested: 'bg-blue-100 text-blue-700 border-blue-200',
    parsed: 'bg-purple-100 text-purple-700 border-purple-200',
    linked: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    unlinked: 'bg-orange-100 text-orange-700 border-orange-200',
    edited: 'bg-amber-100 text-amber-700 border-amber-200',
    filed: 'bg-green-100 text-green-700 border-green-200',
    verified: 'bg-teal-100 text-teal-700 border-teal-200',
    error: 'bg-red-100 text-red-700 border-red-200'
};

export function EvidenceAuditTrail({ claimId, documentId, compact = false }: EvidenceAuditTrailProps) {
    const [timeline, setTimeline] = useState<AuditEvent[]>([]);
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [narrativeSummary, setNarrativeSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(!compact);

    useEffect(() => {
        async function fetchAuditTrail() {
            try {
                setLoading(true);

                let endpoint = '';
                if (claimId) {
                    endpoint = `/api/evidence/claims/${claimId}/audit`;
                } else if (documentId) {
                    endpoint = `/api/evidence/documents/${documentId}/audit`;
                } else {
                    setError('No claim or document ID provided');
                    return;
                }

                const res = await api.get<{
                    success: boolean;
                    timeline?: AuditEvent[];
                    events?: AuditEvent[];
                    documents?: DocumentSummary[];
                    narrativeSummary?: string;
                }>(endpoint);

                if (res.ok && res.data) {
                    setTimeline(res.data.timeline || res.data.events || []);
                    setDocuments(res.data.documents || []);
                    setNarrativeSummary(res.data.narrativeSummary || '');
                } else {
                    setError('Failed to load audit trail');
                }
            } catch (err) {
                console.error('Failed to fetch audit trail:', err);
                setError('Failed to load audit trail');
            } finally {
                setLoading(false);
            }
        }

        fetchAuditTrail();
    }, [claimId, documentId]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-4 text-[#4B5563]">
                <Clock className="h-4 w-4 animate-pulse text-[#0052FF]" />
                Loading audit trail...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 p-4 text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#4B5563]">
                No linked evidence events are currently available.
            </div>
        );
    }

    // Compact mode: just show narrative summary
    if (compact && !expanded) {
        return (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white p-3 text-left transition-colors hover:bg-[#F8FAFC]">
                        <Shield className="h-4 w-4 text-[#0052FF]" />
                        <span className="text-sm font-bold tracking-tight text-[#111827]">Evidence Audit Trail</span>
                        <Badge className="ml-2 border-[#D7E2F2] bg-[#F3F7FF] text-xs text-[#0052FF]">
                            {timeline.length} events
                        </Badge>
                        <ChevronRight className="ml-auto h-4 w-4 text-[#6B7280]" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <Card className="border-[#E5E7EB] bg-white">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full text-left">
                            <Shield className="h-5 w-5 text-[#0052FF]" />
                            <CardTitle className="text-base font-bold tracking-tight text-[#111827]">
                                Evidence Audit Trail
                            </CardTitle>
                            <Badge className="ml-2 border-[#D7E2F2] bg-[#F3F7FF] text-xs text-[#0052FF]">
                                {timeline.length} events • {documents.length} document{documents.length !== 1 ? 's' : ''}
                            </Badge>
                            {expanded ? (
                                <ChevronDown className="ml-auto h-4 w-4 text-[#6B7280]" />
                            ) : (
                                <ChevronRight className="ml-auto h-4 w-4 text-[#6B7280]" />
                            )}
                        </button>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        {/* Narrative Summary */}
                        {narrativeSummary && (
                            <div className="mb-4 rounded-lg border border-[#D7E2F2] bg-[#F3F7FF] p-3">
                                <p className="font-sans text-sm font-bold leading-relaxed tracking-tight text-[#0052FF]">
                                    {narrativeSummary}
                                </p>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-[#BFD7FF]" />

                            <div className="space-y-4">
                                {timeline.map((event, index) => (
                                    <div key={event.id} className="relative flex gap-4">
                                        {/* Event icon */}
                                        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border ${eventColors[event.eventType]}`}>
                                            {eventIcons[event.eventType]}
                                        </div>

                                        {/* Event content */}
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    {event.documentFilename && (
                                                        <span className="mb-1 block text-xs font-bold tracking-tight text-[#6B7280]">
                                                            {event.documentFilename}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-[#1F2937]">{event.narrative}</p>
                                                </div>
                                                <span className="ml-4 whitespace-nowrap text-xs text-[#6B7280]">
                                                    {format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}
                                                </span>
                                            </div>

                                            {/* Additional details */}
                                            {(event.details.parserVersion || event.details.extractedFields || event.details.confidence) && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {event.details.parserVersion && (
                                                        <Badge variant="outline" className="border-[#D7E2F2] bg-white text-xs text-[#374151]">
                                                            Parser v{event.details.parserVersion}
                                                        </Badge>
                                                    )}
                                                    {event.details.confidence && (
                                                        <Badge variant="outline" className="border-[#D7E2F2] bg-white text-xs text-[#374151]">
                                                            {Math.round(event.details.confidence * 100)}% confidence
                                                        </Badge>
                                                    )}
                                                    {event.details.extractedFields && event.details.extractedFields.length > 0 && (
                                                        <Badge variant="outline" className="border-[#D7E2F2] bg-white text-xs text-[#374151]">
                                                            {event.details.extractedFields.join(', ')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Edit details */}
                                            {event.eventType === 'edited' && event.details.fieldName && (
                                                <div className="mt-2 text-xs bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                                    <span className="font-bold text-amber-500/80 tracking-tight">{event.details.fieldName}:</span>
                                                    {event.details.oldValue && (
                                                        <span className="text-red-400/60 line-through mx-1">{event.details.oldValue}</span>
                                                    )}
                                                    <span className="text-green-400/80">→ {event.details.newValue}</span>
                                                    {event.actor && event.actor !== 'system' && (
                                                        <span className="ml-2 text-[#6B7280]">by {event.actor}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Document summaries */}
                        {documents.length > 0 && (
                            <div className="mt-6 border-t border-[#E5E7EB] pt-4">
                                <h4 className="mb-3 text-sm font-bold tracking-tight text-[#374151]">Document Summaries</h4>
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.documentId} className="rounded-lg bg-[#F8FAFC] p-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold tracking-tight text-[#111827]">{doc.filename}</span>
                                                <Badge className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                                    {doc.summary.linkedClaims} claim{doc.summary.linkedClaims !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[#4B5563]">
                                                {doc.summary.ingestedFrom && (
                                                    <span>Source: {doc.summary.ingestedFrom.replace(/_/g, ' ')}</span>
                                                )}
                                                {doc.summary.parserVersion && (
                                                    <span>Parser: v{doc.summary.parserVersion}</span>
                                                )}
                                                {doc.summary.ingestedAt && (
                                                    <span>Ingested: {format(new Date(doc.summary.ingestedAt), 'MMM dd, yyyy')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-4 border-t border-[#E5E7EB] pt-3 text-center text-xs text-[#6B7280]">
                            Recorded linked evidence events currently available
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default EvidenceAuditTrail;
