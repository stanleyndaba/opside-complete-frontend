import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

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
  const [autoClaimOpen, setAutoClaimOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle'|'pending'|'submitted'|'failed'|'paid'>('idle');
  const queryClient = useQueryClient();
  

  const { data: caseData, error } = useQuery<any>({
    queryKey: ['recovery', caseId],
    queryFn: () => apiFetch(`/api/recoveries/${caseId}`),
    enabled: !!caseId,
    staleTime: 5_000,
  });

  const [statusPollCount, setStatusPollCount] = useState(0);
  useEffect(() => {
    let timer: any;
    if (caseId) {
      timer = setInterval(() => {
        setStatusPollCount((n) => n + 1);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [caseId]);

  useQuery({
    queryKey: ['recovery-status', caseId, statusPollCount],
    queryFn: () => apiFetch(`/api/recoveries/${caseId}/status`),
    enabled: !!caseId,
  });

  if (error) return (
    <PageLayout title="Error loading case">
      <div className="p-6 text-sm text-red-600">{(error as any)?.message || 'Failed to load case.'}</div>
      <div className="px-6 pb-6"><Button asChild><Link to="/recoveries">Return to Recoveries</Link></Button></div>
    </PageLayout>
  );

  if (!caseData) return (
    <PageLayout title="Loading case">
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    </PageLayout>
  );

  const expectedPayoutAmount = caseData.guaranteedAmount;
  const expectedPayoutDate = caseData.expected_payout_date || caseData.payoutDate;
  const isEvidenceValidated = Boolean((caseData as any)?.evidence_validated ?? (caseData as any)?.ev_validated ?? (caseData as any)?.evidence?.validated);

  const submitClaim = useMutation({
    mutationFn: async () => {
      if (!caseId) throw new Error('Missing case ID');
      return apiFetch(`/api/claims/${caseId}/submit`, { method: 'POST', body: JSON.stringify({}) });
    },
    onMutate: () => {
      setSubmissionStatus('pending');
    },
    onSuccess: () => {
      setSubmissionStatus('submitted');
      toast.success('Claim submitted to Amazon');
      queryClient.invalidateQueries({ queryKey: ['recovery', caseId] });
      queryClient.invalidateQueries({ queryKey: ['metrics','recoveries'] });
    },
    onError: (e: any) => {
      setSubmissionStatus('failed');
      toast.error(e?.message || 'Submission failed');
    }
  });

  return (
    <PageLayout title={`Case ${caseData.id}`}>
      <div className="space-y-6">
        {/* Submission Status Banner */}
        {submissionStatus !== 'idle' && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {submissionStatus === 'submitted' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                  {submissionStatus === 'pending' && <Clock className="h-5 w-5 text-primary" />}
                  {submissionStatus === 'failed' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  {submissionStatus === 'paid' && <DollarSign className="h-5 w-5 text-emerald-700" />}
                  <div className="text-sm">
                    {submissionStatus === 'pending' && 'Auto-claim queued. Submitting to Amazon...'}
                    {submissionStatus === 'submitted' && 'Claim submitted to Amazon. Tracking status automatically.'}
                    {submissionStatus === 'failed' && 'Submission failed. Please retry or contact support.'}
                    {submissionStatus === 'paid' && 'Paid. Funds confirmed by Amazon transactions.'}
                  </div>
                </div>
                {submissionStatus === 'pending' && (
                  <div className="w-full h-2 bg-muted rounded">
                    <div className="h-2 bg-primary rounded animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Case ID</label>
                  <p className="font-mono text-sm mt-1">{caseData.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div className="mt-1">
                    <Badge className={cn("font-medium", getStatusColor(caseData.status))}>
                      {caseData.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Payout</label>
                  <p className="text-lg font-semibold text-emerald-600 mt-1">
                    ${expectedPayoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Payout Date</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(expectedPayoutDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {caseData.confidence}% Confidence
                  </p>
                </div>

                {caseData.amazonCaseId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amazon Case ID</label>
                    <p className="font-mono text-sm mt-1">{caseData.amazonCaseId}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affected Product</label>
                  <p className="font-medium mt-1">{caseData.productName}</p>
                  <p className="text-sm text-muted-foreground">SKU: {caseData.sku}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warehouse Location</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {caseData.facility}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Units Lost</label>
                    <p className="font-semibold mt-1">{caseData.unitsLost}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                    <p className="font-semibold mt-1">
                      ${caseData.unitCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <Separator />

                {caseData.status === 'Guaranteed' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Dialog open={autoClaimOpen} onOpenChange={setAutoClaimOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                              <Shield className="h-4 w-4 mr-2" />
                              Auto-Claim with Amazon
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit claim automatically</DialogTitle>
                              <DialogDescription>
                                We will file this claim on your behalf via Amazon. You will see real-time status updates here. No recovery, no fee (20% cap).
                              </DialogDescription>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground">
                              Submitting will move this to Expected Payouts. You can download proof once available.
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setAutoClaimOpen(false)}>Cancel</Button>
                              <Button disabled={!isEvidenceValidated || submitClaim.isPending} onClick={() => { submitClaim.mutate(); setAutoClaimOpen(false); }}>
                                {submitClaim.isPending ? 'Submitting...' : 'Confirm & Submit'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        Files claim automatically and tracks status
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chronological Ledger */
          }
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Chronological Ledger
                  <Badge variant="outline" className="ml-auto">
                    Real-time transparency
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* High-level steps */}
                  <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Detected
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Evidence Prepared
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> Submitted
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-600" /> Paid
                    </div>
                  </div>
                  {caseData.events.map((event, index) => (
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
                        {index < caseData.events.length - 1 && (
                          <div className="border-l border-muted ml-2 h-6 mt-3" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Future events placeholder */}
                  {caseData.status === 'Guaranteed' && (
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

            {/* Evidence & Decisions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidence & Decisions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">Linked Documents</div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">July_Supplier_Invoice.pdf</div>
                    <div className="text-xs text-muted-foreground">Verified • Jan 15, 2025</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <div className="font-medium mb-1">Approval / Rejection Reason</div>
                  <div className="text-muted-foreground">Matched shipment discrepancy logs and verified unit costs. Ready for submission.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}