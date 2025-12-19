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
            <div className="flex items-center gap-2 p-4 text-gray-500">
                <Clock className="h-4 w-4 animate-pulse" />
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
            <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                No audit events recorded for this evidence.
            </div>
        );
    }

    // Compact mode: just show narrative summary
    if (compact && !expanded) {
        return (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-slate-100 transition-colors">
                        <Shield className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Evidence Audit Trail</span>
                        <Badge className="bg-slate-200 text-slate-600 border-slate-300 text-xs ml-2">
                            {timeline.length} events
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <Card className="border-slate-200">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full text-left">
                            <Shield className="h-5 w-5 text-slate-600" />
                            <CardTitle className="text-base font-semibold text-gray-900">
                                Evidence Audit Trail
                            </CardTitle>
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs ml-2">
                                {timeline.length} events • {documents.length} document{documents.length !== 1 ? 's' : ''}
                            </Badge>
                            {expanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 ml-auto" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                            )}
                        </button>
                    </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        {/* Narrative Summary */}
                        {narrativeSummary && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-sm text-blue-800 font-mono leading-relaxed">
                                    {narrativeSummary}
                                </p>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

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
                                                        <span className="text-xs font-medium text-gray-500 block mb-1">
                                                            {event.documentFilename}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-gray-900">{event.narrative}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                    {format(new Date(event.timestamp), 'MMM dd, yyyy h:mm a')}
                                                </span>
                                            </div>

                                            {/* Additional details */}
                                            {(event.details.parserVersion || event.details.extractedFields || event.details.confidence) && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {event.details.parserVersion && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Parser v{event.details.parserVersion}
                                                        </Badge>
                                                    )}
                                                    {event.details.confidence && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {Math.round(event.details.confidence * 100)}% confidence
                                                        </Badge>
                                                    )}
                                                    {event.details.extractedFields && event.details.extractedFields.length > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {event.details.extractedFields.join(', ')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Edit details */}
                                            {event.eventType === 'edited' && event.details.fieldName && (
                                                <div className="mt-2 text-xs bg-amber-50 p-2 rounded border border-amber-100">
                                                    <span className="font-medium text-amber-700">{event.details.fieldName}:</span>
                                                    {event.details.oldValue && (
                                                        <span className="text-red-600 line-through mx-1">{event.details.oldValue}</span>
                                                    )}
                                                    <span className="text-green-600">→ {event.details.newValue}</span>
                                                    {event.actor && event.actor !== 'system' && (
                                                        <span className="text-gray-500 ml-2">by {event.actor}</span>
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
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Document Summaries</h4>
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.documentId} className="p-3 bg-gray-50 rounded-lg text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-gray-900">{doc.filename}</span>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                                    {doc.summary.linkedClaims} claim{doc.summary.linkedClaims !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
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
                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Legal-grade audit trail • All events are immutable and timestamped
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default EvidenceAuditTrail;
