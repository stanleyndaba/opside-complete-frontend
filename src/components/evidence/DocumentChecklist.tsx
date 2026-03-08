/**
 * DocumentChecklist Component
 * Shows Amazon's proof requirements with institutional styling
 * 
 * Categories:
 * - Proof of Ownership (invoice, fapiao)
 * - Proof of Value (unit cost, currency)
 * - Proof of Delivery (POD, BOL, tracking)
 * - Inventory Trail (shipment ID, ledger)
 */

import React, { useState, useEffect } from 'react';
import {
    FileText,
    DollarSign,
    Truck,
    Package,
    ChevronDown,
    ChevronRight,
    Check,
    Minus,
    X
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { api } from '@/lib/api';

interface ProofStatus {
    category: 'ownership' | 'value' | 'delivery' | 'inventory';
    status: 'complete' | 'partial' | 'missing';
    documentIds: string[];
    fields: Array<{
        name: string;
        found: boolean;
        value?: string;
        source?: string;
    }>;
    message: string;
    actionRequired?: string;
}

interface ProofChecklist {
    claimId: string;
    sku?: string;
    asin?: string;
    ownership: ProofStatus;
    value: ProofStatus;
    delivery: ProofStatus;
    inventory: ProofStatus;
    overallScore: number;
    overallStatus: 'complete' | 'partial' | 'missing';
    recommendations: string[];
}

interface DocumentChecklistProps {
    claimId: string;
    compact?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
    ownership: <FileText className="h-3.5 w-3.5" />,
    value: <DollarSign className="h-3.5 w-3.5" />,
    delivery: <Truck className="h-3.5 w-3.5" />,
    inventory: <Package className="h-3.5 w-3.5" />
};

const categoryLabels: Record<string, string> = {
    ownership: 'Proof of Ownership',
    value: 'Proof of Value',
    delivery: 'Proof of Delivery',
    inventory: 'Inventory Trail'
};

export function DocumentChecklist({ claimId, compact = false }: DocumentChecklistProps) {
    const [checklist, setChecklist] = useState<ProofChecklist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(!compact);

    useEffect(() => {
        async function fetchChecklist() {
            try {
                setLoading(true);
                const res = await api.get<ProofChecklist & { success: boolean }>(
                    `/api/evidence/claims/${claimId}/proof-checklist`
                );

                if (res.ok && res.data) {
                    setChecklist(res.data);
                } else {
                    setError('Failed to load checklist');
                }
            } catch (err) {
                console.error('Failed to fetch proof checklist:', err);
                setError('Failed to load checklist');
            } finally {
                setLoading(false);
            }
        }

        if (claimId) {
            fetchChecklist();
        }
    }, [claimId]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 text-white/40 text-xs">
                <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                Checking proof requirements...
            </div>
        );
    }

    if (error || !checklist) {
        return (
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/40 text-xs">
                Unable to check proof requirements
            </div>
        );
    }

    const proofCategories = [
        { key: 'ownership', proof: checklist.ownership },
        { key: 'value', proof: checklist.value },
        { key: 'delivery', proof: checklist.delivery },
        { key: 'inventory', proof: checklist.inventory }
    ];

    const completeCount = proofCategories.filter(p => p.proof.status === 'complete').length;

    // Compact mode: just show summary bar
    if (compact && !expanded) {
        return (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border border-white/10 rounded-lg text-left hover:bg-white/5 transition-colors">
                        <span className="text-xs font-bold text-white/80 tracking-tight">Amazon Proof Requirements</span>
                        <div className="flex-1" />
                        <span className="text-xs text-white/40">{completeCount}/4</span>
                        <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <div className="border border-white/10 rounded-lg overflow-hidden">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                {/* Header */}
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 w-full px-4 py-2 bg-white/5 border-b border-white/10 text-left hover:bg-white/10 transition-colors">
                        <h4 className="text-xs font-bold text-white/80 tracking-tight uppercase">
                            Amazon Proof Requirements
                        </h4>
                        <span className="text-xs text-white/40 ml-auto mr-2">
                            {checklist.overallScore}% Complete
                        </span>
                        {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-white/20" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="bg-transparent">
                        {/* Progress Summary */}
                        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/60 rounded-full transition-all"
                                    style={{ width: `${checklist.overallScore}%` }}
                                />
                            </div>
                            <div className="text-xs text-white/40 font-bold tracking-tight uppercase">
                                {completeCount} of 4 complete
                            </div>
                        </div>

                        {/* Proof Categories */}
                        <div className="divide-y divide-white/5">
                            {proofCategories.map(({ key, proof }) => (
                                <div key={key} className="px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Status Icon */}
                                        <div className="mt-0.5 text-white/20">
                                            {proof.status === 'complete' ? (
                                                <Check className="h-3.5 w-3.5 text-white/80" />
                                            ) : proof.status === 'partial' ? (
                                                <Minus className="h-3.5 w-3.5 text-white/40" />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-white/20" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/40">{categoryIcons[key]}</span>
                                                <h5 className="text-xs font-bold text-white tracking-tight uppercase">
                                                    {categoryLabels[key]}
                                                </h5>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${proof.status === 'complete'
                                                    ? 'bg-white/10 text-white/80'
                                                    : 'bg-white/5 text-white/40'
                                                    }`}>
                                                    {proof.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-white/40 mt-1 font-bold tracking-tight">{proof.message}</p>

                                            {/* Found fields */}
                                            {proof.fields.filter(f => f.found).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {proof.fields.filter(f => f.found).map((field, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded"
                                                            title={field.source ? `From: ${field.source}` : undefined}>
                                                            {field.name.replace(/_/g, ' ')}: {field.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action required */}
                                            {proof.actionRequired && (
                                                <div className="mt-2 text-xs text-white/40 italic">
                                                    {proof.actionRequired}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recommendations */}
                        {checklist.recommendations.length > 0 && (
                            <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                                <h5 className="text-xs text-white/40 font-bold mb-2 uppercase tracking-tight">
                                    Recommendations
                                </h5>
                                <ul className="space-y-1.5">
                                    {checklist.recommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                                            <span className="text-white/20 mt-0.5">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product identifier */}
                        {(checklist.sku || checklist.asin) && (
                            <div className="px-4 py-2 border-t border-white/5 text-xs text-white/20 text-center">
                                {checklist.asin && <span>ASIN: {checklist.asin}</span>}
                                {checklist.sku && checklist.asin && <span> • </span>}
                                {checklist.sku && <span>SKU: {checklist.sku}</span>}
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

export default DocumentChecklist;
