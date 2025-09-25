import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
// duplicate Link import removed
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api, buildApiUrl } from '@/lib/api';
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

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      setLoading(true);
      const res = await api.getRecoveryDetail(caseId);
      if (!cancelled) {
        if (res.ok) {
          setCaseData(res.data as any);
          setError(null);
        } else {
          setCaseData((mockCaseData as any)[caseId]);
          setError(res.error || null);
        }
        setLoading(false);
      }
    })();
    // Poll for status updates
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
        }));
      }
    }, 10000);
    return () => { cancelled = true; };
  }, [caseId]);
  
  if (!caseId || (!caseData && !(mockCaseData as any)[caseId])) {
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

  const effectiveCase = caseData || (mockCaseData as any)[caseId];

  return (
    <PageLayout title={`Case ${effectiveCase.id}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/recoveries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Case Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Case Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600">{error}</div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Case ID</label>
                  <p className="font-mono text-sm mt-1">{effectiveCase.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div className="mt-1">
                    <Badge className={cn("font-medium", getStatusColor(effectiveCase.status))}>
                      {effectiveCase.status}
                    </Badge>
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

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Payout Date</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {effectiveCase.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {effectiveCase.confidence ?? 95}% Confidence
                  </p>
                </div>

                {/* Missing-docs Smart Prompt (if backend flags a gap) */}
                {effectiveCase?.missingDocumentPrompt && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                    <div>{effectiveCase.missingDocumentPrompt}</div>
                    {Array.isArray(effectiveCase.missingDocumentOptions) && (
                      <div className="flex flex-wrap gap-2">
                        {effectiveCase.missingDocumentOptions.map((opt: string) => (
                          <Button key={opt} size="sm" variant="outline" onClick={() => {
                            recoveryApi.submitRecoveryAnswer(effectiveCase.id, { answer: opt }).catch(() => {});
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
                        await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => {});
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
                          await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => {});
                        }}
                      />
                    </div>
                  </div>
                )}

                {effectiveCase.amazonCaseId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amazon Case ID</label>
                    <p className="font-mono text-sm mt-1">{effectiveCase.amazonCaseId}</p>
                  </div>
                )}

                {(effectiveCase.approvalReason || effectiveCase.rejectionReason) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Decision Reason</label>
                    <p className="text-sm mt-1">
                      {effectiveCase.approvalReason || effectiveCase.rejectionReason}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affected Product</label>
                  <p className="font-medium mt-1">{effectiveCase.productName}</p>
                  <p className="text-sm text-muted-foreground">SKU: {effectiveCase.sku}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warehouse Location</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {effectiveCase.facility ?? '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Units Lost</label>
                    <p className="font-semibold mt-1">{effectiveCase.unitsLost ?? '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                    <p className="font-semibold mt-1">
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

                {/* Evidence & Docs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Evidence & Docs</label>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => {
                      window.open(api.getRecoveryDocumentUrl(effectiveCase.id), '_blank');
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Proof Document
                    </Button>
                    {Array.isArray(effectiveCase.documents) && effectiveCase.documents.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {effectiveCase.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between">
                            <span className="truncate">{doc.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => window.open(doc.url || api.getDocumentViewUrl(doc.id), '_blank')}>View</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No additional documents linked.</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Claim Timeline
                  <Badge variant="outline" className="ml-auto">
                    Real-time transparency
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Visual Stepper */}
                  <div className="flex items-center gap-3 mb-2 text-sm">
                    {['Detected','Prepared','Submitted','Paid'].map((step, idx) => {
                      const active = (
                        (step === 'Detected') ||
                        (step === 'Prepared' && ['Guaranteed','Submitted','Under Review','Paid Out'].includes(effectiveCase.status)) ||
                        (step === 'Submitted' && ['Submitted','Under Review','Paid Out'].includes(effectiveCase.status)) ||
                        (step === 'Paid' && ['Paid Out'].includes(effectiveCase.status))
                      );
                      return (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-muted-foreground'}`}>{idx+1}</div>
                          <span className={`${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
                          {idx < 3 && <div className={`w-10 h-px ${active ? 'bg-emerald-600' : 'bg-muted'}`} />}
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
                            <h4 className="font-medium text-sm">{event.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(event.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {Array.isArray(effectiveCase.events) && index < effectiveCase.events.length - 1 && (
                          <div className="border-l border-muted ml-2 h-6 mt-3" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Future events placeholder */}
                  {effectiveCase.status === 'Guaranteed' && (
                    <div className="flex gap-4 opacity-50">
                      <div className="flex-shrink-0 mt-1 text-gray-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-400">Claim Submitted to Amazon</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Pending user approval to submit claim documentation to Amazon
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">
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
    </PageLayout>
  );
}