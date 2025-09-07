import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, Send } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

interface CaseDetailResponse {
  id: string;
  title: string;
  status: string;
  guaranteedAmount: number;
  approvedAmount?: number;
  payoutDate?: string | null;
  expected_payout_date?: string | null;
  createdDate: string;
  amazonCaseId?: string | null;
  sku: string;
  productName: string;
  facility: string;
  confidence: number;
  unitsLost: number;
  unitCost: number;
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
  const [autoSubmitOpen, setAutoSubmitOpen] = React.useState(false);
  const [statusEvents, setStatusEvents] = React.useState<CaseEvent[] | null>(null);
  const [polling, setPolling] = React.useState<boolean>(true);
  const [detail, setDetail] = React.useState<CaseDetailResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const fetchDetail = async () => {
      if (!caseId) return;
      try {
        setLoading(true);
        const data = await apiClient.get<CaseDetailResponse>(`/api/recoveries/${caseId}`);
        setDetail(data);
        setError(null);
      } catch (e) {
        setError('not_found');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [caseId]);

  React.useEffect(() => {
    let timer: number | undefined;
    const poll = async () => {
      try {
        if (!caseId) return;
        const data = await apiClient.get<{ events: CaseEvent[] }>(`/api/recoveries/${caseId}/status`);
        setStatusEvents(data.events);
      } catch {
        // ignore
      } finally {
        timer = window.setTimeout(poll, 8000);
      }
    };
    if (polling) poll();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [caseId, polling]);

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

  if (error === 'not_found') {
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

  return (
    <PageLayout title={`Case ${detail?.id ?? caseId}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/recoveries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">Detected</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">Prepared</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-gray-100">Submitted</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-gray-100">Paid</span>
            </div>
            <Dialog open={autoSubmitOpen} onOpenChange={setAutoSubmitOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Auto-Submit Claim</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Auto-Submit Claim</DialogTitle>
                  <DialogDescription>
                    Files automatically on your behalf via Amazon SP-API. We will track submission and updates.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground">
                  You only pay from recovered funds (20% cap).
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAutoSubmitOpen(false)}>Cancel</Button>
                  <Button onClick={() => setAutoSubmitOpen(false)}>Submit Now</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
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
                  <p className="font-mono text-sm mt-1">{detail?.id ?? '—'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <div className="mt-1">
                    <Badge className={cn("font-medium", getStatusColor(detail?.status ?? ''))}>
                      {detail?.status ?? '—'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Guaranteed Value</label>
                  <p className="text-lg font-semibold text-emerald-600 mt-1">
                    ${(detail?.approvedAmount ?? detail?.guaranteedAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Predicted Payout Date</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {detail?.expected_payout_date ? new Date(detail.expected_payout_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {detail?.confidence ?? 0}% Confidence
                  </p>
                </div>

                {detail?.amazonCaseId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amazon Case ID</label>
                    <p className="font-mono text-sm mt-1">{detail.amazonCaseId}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affected Product</label>
                  <p className="font-medium mt-1">{detail?.productName ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">SKU: {detail?.sku ?? '—'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Warehouse Location</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {detail?.facility ?? '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Units Lost</label>
                    <p className="font-semibold mt-1">{detail?.unitsLost ?? 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                    <p className="font-semibold mt-1">
                      ${((detail?.unitCost ?? 0).toFixed(2))}
                    </p>
                  </div>
                </div>

                <Separator />

                {detail?.status === 'Guaranteed' && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={async () => {
                      try {
                        // Example EV gating: require confidence >= 80
                        if ((detail?.confidence ?? 0) < 80) {
                          return;
                        }
                        await apiClient.post(`/api/claims/${detail?.id}/submit`);
                      } catch {}
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Auto-Submit Claim
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Chronological Ledger */}
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
                  {(statusEvents ?? []).map((event, index) => (
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
                        {index < ((statusEvents ?? []).length - 1) && (
                          <div className="border-l border-muted ml-2 h-6 mt-3" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Future events placeholder */}
                  {detail?.status === 'Guaranteed' && (
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
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Evidence & Docs</h3>
                  <div className="text-sm text-muted-foreground">Linked documents, reasoning, and timestamps will appear here. Provide transparency for approvals or rejections.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}