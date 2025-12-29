import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, RefreshCw, ArrowRight, Shield, FileSearch, DollarSign, Tag, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { detectionApi } from '@/lib/api';

// Rejection reason classification
type RejectionReason =
    | 'missing_evidence'
    | 'wrong_category'
    | 'expired_window'
    | 'amount_disputed'
    | 'generic_denial'
    | 'duplicate_claim'
    | 'insufficient_info';

interface TimelineEvent {
    id: string;
    date: string;
    action: 'filed' | 'approved' | 'partially_approved' | 'denied' | 'escalated' | 'adjusted' | 'resolved' | 'auto_submitted';
    description: string;
    amount?: number;
    rejectionReason?: RejectionReason;
    escalationRound?: number;
}

interface EscalationPlaybook {
    reason: RejectionReason;
    label: string;
    icon: React.ReactNode;
    description: string;
    actions: string[];
    autoTriggerable: boolean;
}

interface ClaimNegotiationTimelineProps {
    claim: {
        id: string;
        status: string;
        amount?: number;
        guaranteedAmount?: number;
        created?: string;
        created_at?: string;
        discovery_date?: string;
        escalation_count?: number;
        rejection_reason?: string;
        timeline?: TimelineEvent[];
    };
    onEscalate?: (playbook: EscalationPlaybook) => void;
    maxEscalations?: number;
}

// Escalation playbooks for each rejection type
const escalationPlaybooks: Record<RejectionReason, EscalationPlaybook> = {
    missing_evidence: {
        reason: 'missing_evidence',
        label: 'Missing Evidence',
        icon: <FileSearch className="h-4 w-4" />,
        description: 'Amazon needs additional documentation to process this claim.',
        actions: [
            'Check Doc Locker for matching documents',
            'Upload invoice, POD, or shipment confirmation',
            'Re-submit with complete evidence package'
        ],
        autoTriggerable: true
    },
    wrong_category: {
        reason: 'wrong_category',
        label: 'Wrong Category',
        icon: <Tag className="h-4 w-4" />,
        description: 'The claim was filed under an incorrect reimbursement type.',
        actions: [
            'Review claim type against Amazon guidelines',
            'Reclassify to appropriate category',
            'Re-file with corrected claim type'
        ],
        autoTriggerable: true
    },
    expired_window: {
        reason: 'expired_window',
        label: 'Expired Window',
        icon: <Clock className="h-4 w-4" />,
        description: 'The filing window has passed for this claim type.',
        actions: [
            'Verify discovery date accuracy',
            'Check if exception applies',
            'Document any Amazon-caused delays'
        ],
        autoTriggerable: false
    },
    amount_disputed: {
        reason: 'amount_disputed',
        label: 'Amount Disputed',
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Amazon disagrees with the claimed reimbursement amount.',
        actions: [
            'Review Amazon\'s calculated value',
            'Provide cost documentation if higher value justified',
            'Accept adjusted amount or appeal with evidence'
        ],
        autoTriggerable: true
    },
    generic_denial: {
        reason: 'generic_denial',
        label: 'Generic Denial',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Amazon denied without specific reason.',
        actions: [
            'Request clarification on denial reason',
            'Compile comprehensive evidence package',
            'Re-submit with detailed policy argument'
        ],
        autoTriggerable: false
    },
    duplicate_claim: {
        reason: 'duplicate_claim',
        label: 'Duplicate Claim',
        icon: <RefreshCw className="h-4 w-4" />,
        description: 'Amazon indicates this was already filed or resolved.',
        actions: [
            'Check for previous case IDs',
            'Verify if reimbursement was issued',
            'Appeal only if truly not resolved'
        ],
        autoTriggerable: false
    },
    insufficient_info: {
        reason: 'insufficient_info',
        label: 'Insufficient Info',
        icon: <AlertTriangle className="h-4 w-4" />,
        description: 'The claim lacks required details for processing.',
        actions: [
            'Add order IDs, SKUs, and transaction dates',
            'Include FBA shipment IDs if applicable',
            'Provide clear quantity and value breakdown'
        ],
        autoTriggerable: true
    }
};

// Classify rejection reason from status/notes
const classifyRejection = (status: string, notes?: string): RejectionReason => {
    const text = `${status} ${notes || ''}`.toLowerCase();

    if (text.includes('document') || text.includes('evidence') || text.includes('proof')) {
        return 'missing_evidence';
    }
    if (text.includes('category') || text.includes('type') || text.includes('classif')) {
        return 'wrong_category';
    }
    if (text.includes('expired') || text.includes('window') || text.includes('late') || text.includes('deadline')) {
        return 'expired_window';
    }
    if (text.includes('amount') || text.includes('value') || text.includes('price') || text.includes('partial')) {
        return 'amount_disputed';
    }
    if (text.includes('duplicate') || text.includes('already') || text.includes('previous')) {
        return 'duplicate_claim';
    }
    if (text.includes('info') || text.includes('detail') || text.includes('incomplete')) {
        return 'insufficient_info';
    }
    return 'generic_denial';
};

// Get icon for timeline event
const getEventIcon = (action: TimelineEvent['action']) => {
    switch (action) {
        case 'filed':
        case 'auto_submitted':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'approved':
        case 'resolved':
            return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'partially_approved':
            return <CheckCircle2 className="h-4 w-4 text-amber-500" />;
        case 'denied':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'escalated':
        case 'adjusted':
            return <RefreshCw className="h-4 w-4 text-purple-500" />;
        default:
            return <Clock className="h-4 w-4 text-gray-400" />;
    }
};

// Get color for timeline event
const getEventColor = (action: TimelineEvent['action']) => {
    switch (action) {
        case 'filed':
        case 'auto_submitted':
            return 'border-blue-500 bg-blue-50';
        case 'approved':
        case 'resolved':
            return 'border-emerald-500 bg-emerald-50';
        case 'partially_approved':
            return 'border-amber-500 bg-amber-50';
        case 'denied':
            return 'border-red-500 bg-red-50';
        case 'escalated':
        case 'adjusted':
            return 'border-purple-500 bg-purple-50';
        default:
            return 'border-gray-300 bg-gray-50';
    }
};

// Generate mock timeline if not provided
const generateMockTimeline = (claim: ClaimNegotiationTimelineProps['claim']): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [];
    const baseDate = claim.created || claim.created_at || claim.discovery_date || new Date().toISOString();

    // Initial filing
    timeline.push({
        id: '1',
        date: baseDate,
        action: 'filed',
        description: 'Claim filed automatically by detection agent',
        amount: claim.guaranteedAmount || claim.amount
    });

    const status = claim.status?.toLowerCase() || '';

    if (status === 'submitted' || status === 'pending') {
        timeline.push({
            id: '2',
            date: new Date(new Date(baseDate).getTime() + 86400000).toISOString(),
            action: 'auto_submitted',
            description: 'Evidence package submitted to Amazon'
        });
    }

    if (status === 'denied' || status === 'rejected') {
        timeline.push({
            id: '2',
            date: new Date(new Date(baseDate).getTime() + 86400000 * 3).toISOString(),
            action: 'denied',
            description: 'Claim denied by Amazon',
            rejectionReason: classifyRejection(claim.rejection_reason || status)
        });

        if ((claim.escalation_count || 0) > 0) {
            timeline.push({
                id: '3',
                date: new Date(new Date(baseDate).getTime() + 86400000 * 5).toISOString(),
                action: 'escalated',
                description: 'Escalation initiated with additional evidence',
                escalationRound: 1
            });
        }
    }

    if (status === 'approved' || status === 'paid' || status === 'resolved') {
        timeline.push({
            id: '2',
            date: new Date(new Date(baseDate).getTime() + 86400000 * 7).toISOString(),
            action: 'approved',
            description: 'Claim approved by Amazon',
            amount: claim.guaranteedAmount || claim.amount
        });
    }

    if (status.includes('partial')) {
        timeline.push({
            id: '2',
            date: new Date(new Date(baseDate).getTime() + 86400000 * 5).toISOString(),
            action: 'partially_approved',
            description: 'Partial reimbursement approved',
            amount: (claim.guaranteedAmount || claim.amount || 0) * 0.7
        });
    }

    return timeline;
};

export function ClaimNegotiationTimeline({ claim, onEscalate, maxEscalations = 2 }: ClaimNegotiationTimelineProps) {
    // State for fetched timeline
    const [fetchedTimeline, setFetchedTimeline] = useState<TimelineEvent[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch timeline from API
    useEffect(() => {
        const fetchTimeline = async () => {
            if (!claim.id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const res = await detectionApi.getClaimTimeline(claim.id);
                if (res.ok && res.data?.timeline && res.data.timeline.length > 0) {
                    // Map API response to TimelineEvent format
                    const mappedTimeline: TimelineEvent[] = res.data.timeline.map((e: any) => ({
                        id: e.id,
                        date: e.date || e.created_at,
                        action: e.action as TimelineEvent['action'],
                        description: e.description,
                        amount: e.amount,
                        rejectionReason: e.rejectionReason || e.rejection_reason,
                        escalationRound: e.escalationRound || e.escalation_round
                    }));
                    setFetchedTimeline(mappedTimeline);
                } else {
                    // No timeline from API, will use generated mock
                    setFetchedTimeline(null);
                }
            } catch (err: any) {
                console.error('[ClaimTimeline] Error fetching timeline:', err);
                setError(err?.message || 'Failed to load timeline');
                setFetchedTimeline(null);
            } finally {
                setLoading(false);
            }
        };
        fetchTimeline();
    }, [claim.id]);

    // Get or generate timeline - prefer prop, then fetched, then mock
    const timeline = useMemo(() => {
        if (claim.timeline && claim.timeline.length > 0) return claim.timeline;
        if (fetchedTimeline && fetchedTimeline.length > 0) return fetchedTimeline;
        return generateMockTimeline(claim);
    }, [claim, fetchedTimeline]);

    // Get current rejection reason if denied
    const currentRejection = useMemo(() => {
        const denialEvent = timeline.find(e => e.action === 'denied');
        if (denialEvent?.rejectionReason) {
            return escalationPlaybooks[denialEvent.rejectionReason];
        }
        if (claim.status?.toLowerCase() === 'denied' || claim.status?.toLowerCase() === 'rejected') {
            const reason = classifyRejection(claim.status, claim.rejection_reason);
            return escalationPlaybooks[reason];
        }
        return null;
    }, [timeline, claim.status, claim.rejection_reason]);

    // Check if escalation is available
    const escalationCount = claim.escalation_count || 0;
    const canEscalate = escalationCount < maxEscalations &&
        (claim.status?.toLowerCase() === 'denied' || claim.status?.toLowerCase() === 'rejected');

    return (
        <div className="space-y-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Claim Timeline</h4>
                <Badge className={escalationCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                    Escalation {escalationCount}/{maxEscalations}
                </Badge>
            </div>

            {/* Visual Timeline */}
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                    {timeline.map((event, index) => (
                        <div key={event.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className={cn(
                                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                                getEventColor(event.action)
                            )}>
                                {getEventIcon(event.action)}
                            </div>

                            {/* Event content */}
                            <div className="flex-1 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    {event.amount && (
                                        <Badge variant="outline" className="text-xs">
                                            ${event.amount.toFixed(2)}
                                        </Badge>
                                    )}
                                    {event.escalationRound && (
                                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                                            Round {event.escalationRound}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {format(new Date(event.date), 'MMM dd, yyyy \'at\' h:mm a')}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Pending indicator */}
                    {claim.status?.toLowerCase() !== 'approved' &&
                        claim.status?.toLowerCase() !== 'paid' &&
                        claim.status?.toLowerCase() !== 'resolved' && (
                            <div className="relative flex gap-4">
                                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm text-gray-500 italic">Awaiting resolution...</span>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {/* Rejection Analysis & Escalation Playbook */}
            {currentRejection && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-red-900 flex items-center gap-2">
                            {currentRejection.icon}
                            Rejection Analysis: {currentRejection.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-red-700">{currentRejection.description}</p>

                        <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                            <div className="text-xs text-red-600 uppercase tracking-wide font-semibold mb-2">
                                Escalation Playbook
                            </div>
                            <ul className="space-y-2">
                                {currentRejection.actions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                                        <ArrowRight className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {canEscalate && (
                            <div className="flex items-center gap-3 pt-2">
                                {currentRejection.autoTriggerable ? (
                                    <Button
                                        onClick={() => onEscalate?.(currentRejection)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        size="sm"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Auto-Escalate
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => onEscalate?.(currentRejection)}
                                        variant="outline"
                                        className="border-purple-300 text-purple-700"
                                        size="sm"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        Manual Review Required
                                    </Button>
                                )}
                                <span className="text-xs text-gray-500">
                                    {maxEscalations - escalationCount} escalation(s) remaining
                                </span>
                            </div>
                        )}

                        {!canEscalate && escalationCount >= maxEscalations && (
                            <div className="flex items-center gap-2 pt-2 text-amber-700 bg-amber-50 p-2 rounded">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">Max escalations reached. Manual review recommended.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Success summary for resolved claims */}
            {(claim.status?.toLowerCase() === 'approved' ||
                claim.status?.toLowerCase() === 'paid' ||
                claim.status?.toLowerCase() === 'resolved') && (
                    <Card className="border-emerald-200 bg-emerald-50">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                <div>
                                    <div className="font-semibold text-emerald-900">Claim Resolved</div>
                                    <p className="text-sm text-emerald-700">
                                        Reimbursement of ${(claim.guaranteedAmount || claim.amount || 0).toFixed(2)} has been processed.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
}

export default ClaimNegotiationTimeline;
