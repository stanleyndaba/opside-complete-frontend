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
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-[#4B5563]">
                <div className="h-3 w-3 animate-spin rounded-full border border-[#D7E2F2] border-t-[#0052FF]" />
                Checking current proof checklist...
            </div>
        );
    }

    if (error || !checklist) {
        return (
            <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-xs text-[#4B5563]">
                Unable to load proof checklist
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
                    <button className="flex w-full items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F8FAFC]">
                        <span className="text-xs font-bold tracking-tight text-[#111827]">Current Proof Checklist</span>
                        <div className="flex-1" />
                        <span className="text-xs text-[#4B5563]">{completeCount}/4</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#6B7280]" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                {/* Header */}
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2 text-left transition-colors hover:bg-[#F3F7FF]">
                        <h4 className="text-xs font-bold uppercase tracking-tight text-[#111827]">
                            Current Proof Checklist
                        </h4>
                        <span className="ml-auto mr-2 text-xs text-[#4B5563]">
                            {checklist.overallScore}% Coverage
                        </span>
                        {expanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-[#6B7280]" />
                        )}
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="bg-transparent">
                        {/* Progress Summary */}
                        <div className="flex items-center gap-4 border-b border-[#E5E7EB] px-4 py-2.5">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                                <div
                                    className="h-full rounded-full bg-[#0052FF] transition-all"
                                    style={{ width: `${checklist.overallScore}%` }}
                                />
                            </div>
                            <div className="text-xs font-bold uppercase tracking-tight text-[#4B5563]">
                                {completeCount} of 4 complete
                            </div>
                        </div>

                        {/* Proof Categories */}
                        <div className="divide-y divide-[#E5E7EB]">
                            {proofCategories.map(({ key, proof }) => (
                                <div key={key} className="px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Status Icon */}
                                        <div className="mt-0.5 text-[#6B7280]">
                                            {proof.status === 'complete' ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : proof.status === 'partial' ? (
                                                <Minus className="h-3.5 w-3.5 text-amber-600" />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#0052FF]">{categoryIcons[key]}</span>
                                                <h5 className="text-xs font-bold uppercase tracking-tight text-[#111827]">
                                                    {categoryLabels[key]}
                                                </h5>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${proof.status === 'complete'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-[#F3F7FF] text-[#4B5563]'
                                                    }`}>
                                                    {proof.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-bold tracking-tight text-[#4B5563]">{proof.message}</p>

                                            {/* Found fields */}
                                            {proof.fields.filter(f => f.found).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {proof.fields.filter(f => f.found).map((field, i) => (
                                                        <span
                                                            key={i}
                                                            className="rounded border border-[#D7E2F2] bg-[#F3F7FF] px-1.5 py-0.5 text-xs text-[#1F2937]"
                                                            title={field.source ? `From: ${field.source}` : undefined}>
                                                            {field.name.replace(/_/g, ' ')}: {field.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action required */}
                                            {proof.actionRequired && (
                                                <div className="mt-2 text-xs italic text-[#6B7280]">
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
                            <div className="border-t border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
                                <h5 className="mb-2 text-xs font-bold uppercase tracking-tight text-[#4B5563]">
                                    Recommendations
                                </h5>
                                <ul className="space-y-1.5">
                                    {checklist.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-[#4B5563]">
                                            <span className="mt-0.5 text-[#0052FF]">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product identifier */}
                        {(checklist.sku || checklist.asin) && (
                            <div className="border-t border-[#E5E7EB] px-4 py-2 text-center text-xs text-[#6B7280]">
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
