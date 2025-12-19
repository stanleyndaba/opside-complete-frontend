/**
 * DocumentChecklist Component
 * Shows Amazon's proof requirements with ✅/❌ status
 * 
 * Categories:
 * - Proof of Ownership (invoice, fapiao)
 * - Proof of Value (unit cost, currency)
 * - Proof of Delivery (POD, BOL, tracking)
 * - Inventory Trail (shipment ID, ledger)
 */

import React, { useState, useEffect } from 'react';
import {
    FileCheck,
    FileX,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    DollarSign,
    Truck,
    Package,
    ChevronDown,
    ChevronRight,
    Lightbulb
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
    ownership: <FileText className="h-4 w-4" />,
    value: <DollarSign className="h-4 w-4" />,
    delivery: <Truck className="h-4 w-4" />,
    inventory: <Package className="h-4 w-4" />
};

const categoryLabels: Record<string, string> = {
    ownership: 'Proof of Ownership',
    value: 'Proof of Value',
    delivery: 'Proof of Delivery',
    inventory: 'Inventory Trail'
};

const statusColors: Record<string, string> = {
    complete: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-100 text-amber-700 border-amber-200',
    missing: 'bg-red-100 text-red-700 border-red-200'
};

const statusIcons: Record<string, React.ReactNode> = {
    complete: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    partial: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    missing: <XCircle className="h-4 w-4 text-red-500" />
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
            <div className="flex items-center gap-2 p-4 text-gray-500">
                <Clock className="h-4 w-4 animate-pulse" />
                Checking proof requirements...
            </div>
        );
    }

    if (error || !checklist) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
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
    const partialCount = proofCategories.filter(p => p.proof.status === 'partial').length;

    // Compact mode: just show summary bar
    if (compact && !expanded) {
        return (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-3 bg-white border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors">
                        <FileCheck className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">Amazon Proof Requirements</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Progress value={checklist.overallScore} className="h-2 w-24" />
                                <span className="text-xs text-gray-500">{checklist.overallScore}%</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {proofCategories.map(({ key, proof }) => (
                                <div
                                    key={key}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${statusColors[proof.status]}`}
                                    title={`${categoryLabels[key]}: ${proof.status}`}
                                >
                                    {proof.status === 'complete' ? '✓' : proof.status === 'partial' ? '~' : '✗'}
                                </div>
                            ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                </CollapsibleTrigger>
            </Collapsible>
        );
    }

    return (
        <Card className="border-gray-200">
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CardHeader className="pb-3">
                    <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 w-full text-left">
                            <FileCheck className="h-5 w-5 text-gray-600" />
                            <CardTitle className="text-base font-semibold text-gray-900">
                                Amazon Proof Requirements
                            </CardTitle>
                            <Badge className={`ml-2 ${statusColors[checklist.overallStatus]}`}>
                                {checklist.overallScore}% Complete
                            </Badge>
                            {expanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 ml-auto" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                            )}
                        </button>
                    </CollapsibleTrigger>

                    {/* Progress bar */}
                    <div className="mt-3">
                        <Progress value={checklist.overallScore} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{completeCount} complete</span>
                            {partialCount > 0 && <span>{partialCount} partial</span>}
                            <span>{4 - completeCount - partialCount} missing</span>
                        </div>
                    </div>
                </CardHeader>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                        {/* Proof Categories */}
                        {proofCategories.map(({ key, proof }) => (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border ${proof.status === 'complete' ? 'bg-emerald-50 border-emerald-200' :
                                        proof.status === 'partial' ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${proof.status === 'complete' ? 'bg-emerald-100' :
                                                proof.status === 'partial' ? 'bg-amber-100' :
                                                    'bg-red-100'
                                            }`}>
                                            {categoryIcons[key]}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                {categoryLabels[key]}
                                            </h4>
                                            <p className="text-xs text-gray-600">{proof.message}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {statusIcons[proof.status]}
                                        <span className={`text-sm font-medium ${proof.status === 'complete' ? 'text-emerald-700' :
                                                proof.status === 'partial' ? 'text-amber-700' :
                                                    'text-red-600'
                                            }`}>
                                            {proof.status === 'complete' ? '✓' : proof.status === 'partial' ? '~' : '✗'}
                                        </span>
                                    </div>
                                </div>

                                {/* Found fields */}
                                {proof.fields.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {proof.fields.filter(f => f.found).map((field, i) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="text-xs bg-white"
                                                title={field.source ? `From: ${field.source}` : undefined}
                                            >
                                                {field.name.replace(/_/g, ' ')}: {field.value}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Action required */}
                                {proof.actionRequired && (
                                    <div className="mt-3 p-2 bg-white rounded border border-dashed border-gray-300">
                                        <p className="text-xs text-gray-700 flex items-start gap-2">
                                            <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                            {proof.actionRequired}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Recommendations */}
                        {checklist.recommendations.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                    Recommendations
                                </h4>
                                <ul className="space-y-2">
                                    {checklist.recommendations.map((rec, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-gray-400">•</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product identifier */}
                        {(checklist.sku || checklist.asin) && (
                            <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
                                {checklist.asin && <span>ASIN: {checklist.asin}</span>}
                                {checklist.sku && checklist.asin && <span> • </span>}
                                {checklist.sku && <span>SKU: {checklist.sku}</span>}
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

export default DocumentChecklist;
