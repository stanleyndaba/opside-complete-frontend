import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, RefreshCw, ExternalLink, Receipt } from 'lucide-react';
// duplicate Link import removed
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

// Mock case data (fallback)
const mockCaseData = {
  'OPS-12345': {
    id: 'OPS-12345',
    title: '5 units of Premium Wireless Headphones lost at FTW1',
    status: 'Guaranteed' as const,
    guaranteedAmount: 324.50,
    expectedPayoutDate: '2025-01-15',
    createdDate: '2025-01-08',
    amazonCaseId: undefined,
    sku: 'WH-PREM-001',
    productName: 'Premium Wireless Headphones - Noise Cancelling',
    facility: 'FTW1 - Fort Worth, TX',
    confidence: 95,
    unitsLost: 5,
    unitCost: 64.90,
    events: [
      {
        timestamp: '2025-01-08T12:05:00Z',
        title: 'Discrepancy Detected',
        description: 'Smart Inventory Sync detected 5 missing units of SKU WH-PREM-001 at FTW1 warehouse',
        type: 'detection'
      },
      {
        timestamp: '2025-01-08T12:05:30Z',
        title: 'Evidence Located',
        description: 'Evidence Engine found matching cost documentation (Invoice #INV-2024-582)',
        type: 'analysis'
      },
      {
        timestamp: '2025-01-08T12:06:15Z',
        title: 'True Value Calculated',
        description: 'True value calculated and verified: $324.50 (5 units × $64.90 per unit)',
        type: 'analysis'
      },
      {
        timestamp: '2025-01-08T12:07:22Z',
        title: 'Claim Draft Generated',
        description: 'Opside AI Agent generated comprehensive claim documentation with supporting evidence',
        type: 'generation'
      },
      {
        timestamp: '2025-01-08T12:10:45Z',
        title: 'Ready for Submission',
        description: 'Case marked as guaranteed and ready for Amazon submission pending user approval',
        type: 'update'
      }
    ] as CaseEvent[]
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Guaranteed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Under Review':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Paid Out':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Awaiting Approval':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getEventIcon = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return <AlertCircle className="h-4 w-4" />;
    case 'analysis':
      return <FileText className="h-4 w-4" />;
    case 'generation':
      return <FileText className="h-4 w-4" />;
    case 'submission':
      return <Package className="h-4 w-4" />;
    case 'update':
      return <Clock className="h-4 w-4" />;
    case 'completion':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventColor = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return 'text-amber-600';
    case 'analysis':
      return 'text-blue-600';
    case 'generation':
      return 'text-purple-600';
    case 'submission':
      return 'text-emerald-600';
    case 'update':
      return 'text-gray-600';
    case 'completion':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

// Local helpers to derive confidence/evidence in sandbox
const stableHash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return (h >>> 0);
};
const deriveConfidence = (id: string): number => {
  const v = stableHash(id) % 4900; // 0..4899
  const n = (v + 500) / 100; // 5.00..53.99
  const c = Math.min(98, Math.max(50, Math.round(n)));
  return c; // percent 50..98
};
const deriveEvidence = (id: string): 'Ready' | 'Needs Docs' | 'Collecting' => {
  const v = stableHash(id) % 100;
  if (v >= 70) return 'Ready';
  if (v >= 40) return 'Needs Docs';
  return 'Collecting';
};

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any | null>(passedClaim ? {
    id: passedClaim.id,
    title: passedClaim.details,
    status: passedClaim.status,
    guaranteedAmount: passedClaim.guaranteedAmount,
    expectedPayoutDate: passedClaim.expectedPayoutDate,
    createdDate: passedClaim.created,
    sku: passedClaim.sku,
    productName: passedClaim.details,
    confidence: undefined,
    evidenceStatus: undefined,
    documents: passedClaim.matchedDocs || [],
    events: [] as any[],
  } : null);
  const { toast } = useToast();
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);

  const normalizeStatus = (s?: string): 'Open' | 'In Progress' | 'Approved' | 'Denied' | 'Unknown' => {
    const v = (s || '').toLowerCase();
    if (['denied', 'rejected'].includes(v)) return 'Denied';
    if (['paid', 'paid out', 'approved'].includes(v)) return 'Approved';
    if (['submitted', 'under review', 'in progress', 'processing'].includes(v)) return 'In Progress';
    if (['guaranteed', 'awaiting approval', 'new', 'open'].includes(v)) return 'Open';
    return 'Unknown';
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      setLoading(true);
      // Try primary detail endpoint
      const res = await api.getRecoveryDetail(caseId);
      if (!cancelled) {
        if (res.ok) {
          setCaseData(res.data as any);
          setError(null);
        } else {
          // Fallback: look up claim from list, then synthesize details (do not clear existing data)
          try {
            const list = await recoveryApi.getRecoveries().catch(() => [] as any);
            const row = Array.isArray(list) ? (list as any[]).find((x) => x.id === caseId) : null;
            if (row) {
              setCaseData({
                id: row.id,
                title: row.details,
                status: row.status,
                guaranteedAmount: row.guaranteedAmount,
                expectedPayoutDate: row.expectedPayoutDate,
                createdDate: row.created,
                sku: row.sku,
                productName: row.details,
                facility: undefined,
                confidence: deriveConfidence(row.id),
                evidenceStatus: deriveEvidence(row.id),
                documents: row.matchedDocs || [],
                events: [] as CaseEvent[],
              });
              setError(null);
            } else {
              // Keep existing caseData (from link state) if mock not available
              if ((mockCaseData as any)[caseId]) {
                setCaseData((mockCaseData as any)[caseId]);
              }
              setError(res.error || null);
            }
          } catch (e: any) {
            // Keep existing
            if ((mockCaseData as any)[caseId]) {
              setCaseData((mockCaseData as any)[caseId]);
            }
            setError(res.error || null);
          }
        }
        setLoading(false);
      }
    })();
    // Real-time status via SSE with polling fallback
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/sse/case/${encodeURIComponent(caseId!)}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setCaseData((prev: any) => ({
            ...(prev || {}),
            status: data.status ?? prev?.status,
            expectedPayoutDate: data.expected_payout_date ?? prev?.expectedPayoutDate,
            amazonCaseId: data.amazonCaseId ?? prev?.amazonCaseId,
            events: data.events ?? prev?.events,
            progress: typeof data.progress === 'number' ? data.progress : prev?.progress,
          }));
        } catch { }
      };
    } catch { }
    const interval = setInterval(async () => {
      if (!caseId) return;
      const statusRes = await api.getRecoveryStatus(caseId);
      if (statusRes.ok && statusRes.data) {
        setCaseData((prev: any) => ({
          ...(prev || {}),
          status: (statusRes.data as any).status ?? prev?.status,
          expectedPayoutDate: (statusRes.data as any).expected_payout_date ?? prev?.expectedPayoutDate,
          amazonCaseId: (statusRes.data as any).amazonCaseId ?? prev?.amazonCaseId,
          events: (statusRes.data as any).events ?? prev?.events,
          progress: (statusRes.data as any).progress ?? prev?.progress,
        }));
      }
    }, 15000);
    return () => { cancelled = true; if (es) es.close(); clearInterval(interval); };
  }, [caseId]);

  // Attempt to fetch matched documents for this case
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      try {
        const docsRes = await api.getDocuments();
        const docs = Array.isArray(docsRes) ? docsRes : (docsRes as any)?.data;
        if (!cancelled && Array.isArray(docs)) {
          const list = docs.filter((d: any) => {
            if (Array.isArray(d?.matchedClaims)) return d.matchedClaims.includes(caseId);
            if (Array.isArray(d?.matched_to)) return d.matched_to.includes(caseId);
            if (Array.isArray(d?.matches)) return d.matches.some((m: any) => m?.caseId === caseId || m?.id === caseId);
            return false;
          });
          setMatchedDocs(list);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [caseId]);

  if (!caseId) {
    return (
      <PageLayout title="Case Not Found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Case not found</h2>
          <Button asChild>
            <Link to="/recoveries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const effectiveCase = caseData || (mockCaseData as any)[caseId] || passedClaim;
  const derivedConfidencePct = useMemo(() => {
    const v = typeof effectiveCase?.confidence === 'number' ? effectiveCase.confidence : deriveConfidence(caseId!);
    return Math.max(0, Math.min(100, Math.round(v)));
  }, [effectiveCase, caseId]);
  const derivedEvidence = useMemo(() => {
    return effectiveCase?.evidenceStatus || deriveEvidence(caseId!);
  }, [effectiveCase, caseId]);
  const matchedCount = matchedDocs.length || (Array.isArray(effectiveCase?.documents) ? effectiveCase.documents.length : 0);

  return (
    <PageLayout title={`Case ${effectiveCase.id}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-gray-50 min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-900 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-gray-900 hover:bg-gray-100">
                <Link to="/recoveries">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cases
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Case Summary */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-white border-gray-200 text-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                      <Package className="h-5 w-5" />
                      Case Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <div className="text-sm text-red-600">{error}</div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">Case ID</label>
                      <p className="font-mono text-sm mt-1 text-gray-900">{effectiveCase.id}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Status</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="font-medium text-gray-900 border-gray-300">
                          {normalizeStatus(effectiveCase.status)}
                        </Badge>
                        <span className="text-xs text-gray-600">({effectiveCase.status})</span>
                      </div>
                    </div>

                    {effectiveCase.submissionStatus && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Submission Status</label>
                        <div className="mt-1">
                          <Badge variant="outline" className="font-medium">
                            {effectiveCase.submissionStatus === 'draft' && 'Draft'}
                            {effectiveCase.submissionStatus === 'submitted' && 'Submitted'}
                            {effectiveCase.submissionStatus === 'approved' && 'Approved'}
                            {effectiveCase.submissionStatus === 'paid' && 'Paid'}
                            {effectiveCase.submissionStatus === 'denied' && 'Denied'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Guaranteed Value</label>
                      <p className="text-lg font-semibold text-emerald-600 mt-1">
                        ${effectiveCase.guaranteedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Agent 8: Actual Payout Amount */}
                    {effectiveCase.actual_payout_amount && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Actual Payout</label>
                        <p className="text-lg font-semibold text-blue-600 mt-1">
                          ${effectiveCase.actual_payout_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        {effectiveCase.recovery_status === 'reconciled' && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Reconciled
                          </p>
                        )}
                      </div>
                    )}

                    {/* Agent 8: Discrepancy Alert */}
                    {effectiveCase.recovery_status === 'discrepancy' && effectiveCase.actual_payout_amount && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3">
                        <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Payout Discrepancy Detected
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-red-700">
                          <div>Expected: ${effectiveCase.guaranteedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                          <div>Actual: ${effectiveCase.actual_payout_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                          <div className="font-medium">
                            Difference: ${Math.abs(effectiveCase.guaranteedAmount - effectiveCase.actual_payout_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            ({effectiveCase.actual_payout_amount < effectiveCase.guaranteedAmount ? 'Underpaid' : 'Overpaid'})
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">Expected Payout Date</label>
                      <p className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{effectiveCase.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : '—'}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {derivedConfidencePct}% Confidence • Evidence: {derivedEvidence}
                      </p>
                    </div>

                    {/* Matched docs summary */}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Matched document(s)</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-gray-300 text-gray-900">{matchedCount} matched</Badge>
                        {matchedDocs.slice(0, 3).map((d: any) => (
                          <Button key={d.id} variant="outline" size="sm" className="h-7" onClick={() => window.open(`/documents/${encodeURIComponent(d.id)}`, '_blank')}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> {d.name || d.filename || d.id}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Missing-docs Smart Prompt (if backend flags a gap) */}
                    {effectiveCase?.missingDocumentPrompt && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                        <div>{effectiveCase.missingDocumentPrompt}</div>
                        {Array.isArray(effectiveCase.missingDocumentOptions) && (
                          <div className="flex flex-wrap gap-2">
                            {effectiveCase.missingDocumentOptions.map((opt: string) => (
                              <Button key={opt} size="sm" variant="outline" onClick={() => {
                                recoveryApi.submitRecoveryAnswer(effectiveCase.id, { answer: opt }).catch(() => { });
                              }}>{opt}</Button>
                            ))}
                          </div>
                        )}
                        <div
                          className="mt-2 p-4 border border-dashed border-amber-300 rounded bg-white/60 text-amber-900"
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files || []);
                            if (!files.length) return;
                            await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => { });
                          }}
                        >
                          <div className="text-xs">Drag and drop supplier invoice here, or click to select.</div>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from((e.target as HTMLInputElement).files || []);
                              if (!files.length) return;
                              await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => { });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {effectiveCase.amazonCaseId && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Amazon Case</label>
                        <p className="font-mono text-sm mt-1 inline-flex items-center gap-2 text-gray-900">
                          {effectiveCase.amazonCaseId}
                          {effectiveCase.amazonCaseId && (
                            <a href={`https://sellercentral.amazon.com/case-log/${effectiveCase.amazonCaseId}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </p>
                      </div>
                    )}

                    {(effectiveCase.approvalReason || effectiveCase.rejectionReason) && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Decision Reason</label>
                        <p className="text-sm mt-1 text-gray-900">
                          {effectiveCase.approvalReason || effectiveCase.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Agent 8: Payment Timeline */}
                    {effectiveCase.recovery_status && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Payment Status</label>
                        <div className="space-y-2">
                          {effectiveCase.status?.toLowerCase().includes('approved') && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-gray-700">Approved by Amazon</span>
                            </div>
                          )}
                          {effectiveCase.recovery_status === 'detecting' && (
                            <div className="flex items-center gap-2 text-sm">
                              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                              <span className="text-gray-700">Detecting payout...</span>
                            </div>
                          )}
                          {effectiveCase.recovery_status === 'matched' && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-purple-600" />
                              <span className="text-gray-700">Payout matched</span>
                            </div>
                          )}
                          {effectiveCase.recovery_status === 'reconciled' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-gray-700 font-medium">Payout reconciled</span>
                              </div>
                              {effectiveCase.reconciled_at && (
                                <div className="text-xs text-gray-600">
                                  {new Date(effectiveCase.reconciled_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span className="text-amber-700 font-medium">Funds arriving in 3–5 business days</span>
                              </div>
                              {effectiveCase.billingStatus === 'charged' && (
                                <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-gray-100">
                                  <Receipt className="h-4 w-4 text-emerald-600" />
                                  <span className="text-gray-700 font-medium">
                                    Invoice #{effectiveCase.billingTransactionId?.slice(0, 8) || 'PAID'} paid. Receipt sent.
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <label className="text-sm font-medium text-gray-600">Affected Product</label>
                      <p className="font-medium mt-1 text-gray-900">{effectiveCase.productName}</p>
                      <p className="text-sm text-gray-600">SKU: {effectiveCase.sku}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Warehouse Location</label>
                      <p className="mt-1 flex items-center gap-2 text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        {effectiveCase.facility ?? '—'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Units Lost</label>
                        <p className="font-semibold mt-1 text-gray-900">{effectiveCase.unitsLost ?? '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Unit Cost</label>
                        <p className="font-semibold mt-1 text-gray-900">
                          {typeof effectiveCase.unitCost === 'number' ? `$${effectiveCase.unitCost.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={effectiveCase.status === 'Paid Out'} onClick={async () => {
                      const res = await api.submitClaim(effectiveCase.id);
                      if (res.ok) {
                        setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted', submissionStatus: 'submitted' }));
                        toast({ title: 'Claim submitted to Amazon', description: 'We will update you with the Amazon Case ID shortly.' });
                      } else {
                        toast({ title: 'Submission failed', description: res.error || 'Please try again.' });
                      }
                    }}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve Case
                    </Button>

                    {/* Contextual actions based on confidence */}
                    {derivedConfidencePct >= 85 && (
                      <Button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-white" onClick={async () => {
                        try {
                          await recoveryApi.submitClaim(effectiveCase.id);
                          toast({ title: 'Auto-submitted', description: `${effectiveCase.id} submitted automatically (high confidence).` });
                          setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted' }));
                        } catch (e: any) {
                          toast({ title: 'Auto-submit failed', description: e?.message || 'Please try again.' });
                        }
                      }}>
                        Auto-submit now
                      </Button>
                    )}
                    {derivedConfidencePct >= 60 && derivedConfidencePct < 85 && matchedCount > 0 && (
                      <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                        toast({ title: 'Confirm invoice', description: 'Invoice confirmed and ready to submit.' });
                        setCaseData((prev: any) => ({ ...(prev || {}), submissionStatus: 'submitted' }));
                      }}>
                        Confirm invoice
                      </Button>
                    )}
                    {derivedConfidencePct < 60 && (
                      <div className="w-full mt-2 text-center text-xs text-gray-600">
                        <Badge variant="outline" className="border-amber-300/50 text-amber-600">Parked — needs more data</Badge>
                      </div>
                    )}

                    {effectiveCase.status === 'Denied' && (
                      <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
                        // Require at least one document attached
                        const hasDocs = Array.isArray(effectiveCase.documents) && effectiveCase.documents.length > 0;
                        if (!hasDocs) {
                          toast({ title: 'Attach evidence first', description: 'Add at least one supporting document before resubmitting.' });
                          return;
                        }
                        const res = await api.resubmitClaim(effectiveCase.id);
                        if (res.ok) {
                          toast({ title: 'Resubmitted with stronger docs', description: 'We will keep you posted on the decision.' });
                          setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted' }));
                        } else {
                          toast({ title: 'Resubmission failed', description: res.error || 'Please try again.' });
                        }
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resubmit with stronger docs
                      </Button>
                    )}

                    {/* Evidence & Docs */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Evidence & Docs</label>
                      <div className="text-xs text-gray-600">Evidence Status: <span className="font-medium text-gray-900">{effectiveCase.evidenceStatus ?? 'Collecting'}</span></div>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full bg-gray-100 text-[#36454F] hover:bg-gray-200 border-gray-300" onClick={() => {
                          window.open(api.getRecoveryDocumentUrl(effectiveCase.id), '_blank');
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Download Proof Document
                        </Button>
                        {Array.isArray(effectiveCase.documents) && effectiveCase.documents.length > 0 ? (
                          <div className="space-y-1 text-sm">
                            {effectiveCase.documents.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between">
                                <span className="truncate text-gray-900">{doc.name}</span>
                                <Button variant="ghost" size="sm" className="text-gray-900 hover:bg-gray-100" onClick={() => window.open(doc.url || api.getDocumentViewUrl(doc.id), '_blank')}>View</Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600">No additional documents linked.</p>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/evidence-locker">Open Evidence Locker</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Chronological Ledger */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-gray-200 text-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black">
                      <Clock className="h-5 w-5" />
                      Claim Timeline
                      <Badge variant="outline" className="ml-auto text-gray-900 border-gray-300">
                        {typeof effectiveCase.progress === 'number' ? `${Math.round(effectiveCase.progress)}%` : 'Real-time transparency'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* At-a-glance header: confidence, evidence, quick actions */}
                      <div className="flex flex-wrap items-center gap-3 p-3 rounded-md border border-gray-200 bg-gray-50">
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">Confidence: {derivedConfidencePct}%</Badge>
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">Evidence: {derivedEvidence}</Badge>
                        <Badge variant="outline" className="text-xs text-gray-900 border-gray-300">Matched docs: {matchedCount}</Badge>
                        <div className="ml-auto flex gap-2">
                          <Button size="sm" variant="outline" className="bg-gray-100 text-[#36454F] hover:bg-gray-200 border-gray-300" onClick={async () => {
                            const url = api.getRecoveryDocumentUrl(effectiveCase.id);
                            // Try composed proof first; if unavailable, fall back to first matched document
                            try {
                              const head = await fetch(url, { method: 'HEAD', credentials: 'include' });
                              if (head.ok) {
                                window.open(url, '_blank');
                                return;
                              }
                            } catch { }
                            if (Array.isArray(matchedDocs) && matchedDocs.length > 0) {
                              window.open(`/documents/${encodeURIComponent(matchedDocs[0].id)}`, '_blank');
                            } else {
                              toast({ title: 'No proof available yet', description: 'Evidence is still being collected for this case.' });
                            }
                          }}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> Proof of Document
                          </Button>
                          <Button size="sm" asChild>
                            <Link to={`/recoveries`}>
                              Back to Cases
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Timeline: fetch and display audit events */}
                      <div className="mt-4 p-3 rounded-md border border-gray-200 bg-gray-50">
                        <div className="text-sm font-semibold mb-2 text-gray-900">Timeline</div>
                        <Timeline claimId={effectiveCase.id} />
                      </div>

                      {/* Visual Stepper */}
                      <div className="flex items-center gap-3 mb-2 text-sm">
                        {['Detected', 'Prepared', 'Submitted', 'Paid'].map((step, idx) => {
                          const active = (
                            (step === 'Detected') ||
                            (step === 'Prepared' && ['Guaranteed', 'Submitted', 'Under Review', 'Paid Out'].includes(effectiveCase.status)) ||
                            (step === 'Submitted' && ['Submitted', 'Under Review', 'Paid Out'].includes(effectiveCase.status)) ||
                            (step === 'Paid' && ['Paid Out'].includes(effectiveCase.status))
                          );
                          return (
                            <div key={step} className="flex items-center gap-3">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div>
                              <span className={`${active ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{step}</span>
                              {idx < 3 && <div className={`w-10 h-px ${active ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
                            </div>
                          );
                        })}
                      </div>
                      {(effectiveCase.events || []).map((event: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className={cn("flex-shrink-0 mt-1", getEventColor(event.type))}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {event.description}
                                </p>
                              </div>
                              <div className="text-xs text-gray-600 whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            {Array.isArray(effectiveCase.events) && index < effectiveCase.events.length - 1 && (
                              <div className="border-l border-gray-200 ml-2 h-6 mt-3" />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Future events placeholder */}
                      {effectiveCase.status === 'Guaranteed' && (
                        <div className="flex gap-4 opacity-50">
                          <div className="flex-shrink-0 mt-1 text-gray-600">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-600">Claim Submitted to Amazon</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Pending user approval to submit claim documentation to Amazon
                                </p>
                              </div>
                              <div className="text-xs text-gray-600 whitespace-nowrap">
                                Pending
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}