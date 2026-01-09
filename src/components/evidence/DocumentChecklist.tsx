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
            <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-xs">
                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Checking proof requirements...
            </div>
        );
    }

    if (error || !checklist) {
        return (
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs">
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
                    <button className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                        <span className="text-xs font-medium text-gray-700">Amazon Proof Requirements</span>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-500">{completeCount}/4</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                {/* Header */}
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 w-full px-4 py-2 bg-gray-50 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Amazon Proof Requirements
                        </h4>
                        <span className="text-[10px] text-gray-500 ml-auto mr-2">
                            {checklist.overallScore}% Complete
                        </span>
                        {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="bg-white">
                        {/* Progress Summary */}
                        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-600 rounded-full transition-all"
                                    style={{ width: `${checklist.overallScore}%` }}
                                />
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {completeCount} of 4 complete
                            </div>
                        </div>

                        {/* Proof Categories */}
                        <div className="divide-y divide-gray-100">
                            {proofCategories.map(({ key, proof }) => (
                                <div key={key} className="px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Status Icon */}
                                        <div className="mt-0.5 text-gray-400">
                                            {proof.status === 'complete' ? (
                                                <Check className="h-3.5 w-3.5 text-gray-700" />
                                            ) : proof.status === 'partial' ? (
                                                <Minus className="h-3.5 w-3.5 text-gray-500" />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{categoryIcons[key]}</span>
                                                <h5 className="text-xs font-medium text-gray-900">
                                                    {categoryLabels[key]}
                                                </h5>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${proof.status === 'complete'
                                                        ? 'bg-gray-100 text-gray-700'
                                                        : 'bg-gray-50 text-gray-500'
                                                    }`}>
                                                    {proof.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-1">{proof.message}</p>

                                            {/* Found fields */}
                                            {proof.fields.filter(f => f.found).length> 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {proof.fields.filter(f => f.found).map((field, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded"
                                                            title={field.source ? `From: ${field.source}` : undefined}>
                                                            {field.name.replace(/_/g, ' ')}: {field.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action required */}
                                            {proof.actionRequired && (
                                                <div className="mt-2 text-[10px] text-gray-500 italic">
                                                    {proof.actionRequired}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recommendations */}
                        {checklist.recommendations.length> 0 && (
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <h5 className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-2">
                                    Recommendations
                                </h5>
                                <ul className="space-y-1.5">
                                    {checklist.recommendations.map((rec, i) => (
                                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                            <span className="text-gray-400 mt-0.5">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product identifier */}
                        {(checklist.sku || checklist.asin) && (
                            <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
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
