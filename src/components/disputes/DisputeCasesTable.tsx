import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Send, RotateCcw, AlertTriangle, Loader2, Hexagon, ArrowRight, Search, ShieldAlert, Ban, DollarSign, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DisputeCase {
  id: string;
  case_number: string;
  claim_id: string;
  status: string;
  filing_status?: string;
  amount: number;
  currency: string;
  created_at: string;
  amazon_case_id?: string;
  retry_count?: number;
  filing_error?: string;
  last_filing_attempt?: string;
  metadata?: {
    approval_reason?: string;
    claim_amount?: number;
    invoice_amount?: number;
    variance?: number;
    quarantine_reason?: string;
    dangerous_findings?: Array<{ filename: string; pattern: string }>;
  };
}

export function DisputeCasesTable() {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filingInProgress, setFilingInProgress] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchCases = async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[DisputeCasesTable] Fetching dispute cases...', { status });
      const response = await api.getDisputeCases({
        status: status && status !== 'all' ? status : undefined,
        limit: 100
      });

      console.log('[DisputeCasesTable] API response:', response);

      if (response.ok && response.data?.cases) {
        setCases(response.data.cases);
        console.log('[DisputeCasesTable] Loaded', response.data.cases.length, 'cases');
      } else if (response.ok && Array.isArray(response.data)) {
        setCases(response.data);
        console.log('[DisputeCasesTable] Loaded', response.data.length, 'cases (array format)');
      } else {
        console.warn('[DisputeCasesTable] Failed to fetch:', response.error);
        setError(response.error || 'Failed to fetch dispute cases');
        setCases([]);
      }
    } catch (err: any) {
      console.error('[DisputeCasesTable] Error:', err);
      setError(err.message || 'Failed to fetch dispute cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Agent 7: File Now - Trigger immediate filing
  const handleFileNow = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));

    try {
      toast({
        title: "FILING INITIATED",
        description: `Case ${caseItem.case_number || caseId.substring(0, 8)} queued for immediate submission.`,
      });

      const response = await api.post('/api/disputes/file-now', {
        dispute_id: caseId,
        claim_id: caseItem.claim_id
      });

      if (response.ok) {
        toast({
          title: "SUBMISSION SUCCESSFUL",
          description: `Case filed with Amazon. Case ID: ${response.data?.amazon_case_id || 'Pending'}`,
        });
        // Refresh to show updated status
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Filing failed');
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "FILING FAILED",
        description: err.message || 'Unable to submit dispute to Amazon',
      });
    } finally {
      setFilingInProgress(prev => {
        const next = new Set(prev);
        next.delete(caseId);
        return next;
      });
    }
  };

  // Agent 7: Retry Filing - Retry failed cases with stronger evidence
  const handleRetryFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));

    try {
      toast({
        title: "RETRY INITIATED",
        description: `Collecting stronger evidence for case ${caseItem.case_number || caseId.substring(0, 8)}...`,
      });

      const response = await api.post('/api/disputes/retry-filing', {
        dispute_id: caseId,
        claim_id: caseItem.claim_id,
        collect_stronger_evidence: true
      });

      if (response.ok) {
        toast({
          title: "RETRY QUEUED",
          description: `Case will be resubmitted with enhanced evidence package.`,
        });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Retry failed');
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "RETRY FAILED",
        description: err.message || 'Unable to queue retry',
      });
    } finally {
      setFilingInProgress(prev => {
        const next = new Set(prev);
        next.delete(caseId);
        return next;
      });
    }
  };

  // Agent 7: Approve Filing - Approve high-value claims pending manual review
  const handleApproveFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));

    try {
      toast({
        title: "APPROVAL PROCESSING",
        description: `Approving high-value claim ${caseItem.case_number || caseId.substring(0, 8)} for filing...`,
      });

      const response = await api.post('/api/disputes/approve-filing', {
        dispute_id: caseId,
        claim_id: caseItem.claim_id
      });

      if (response.ok) {
        toast({
          title: "CLAIM APPROVED",
          description: `Case approved and queued for filing.`,
        });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Approval failed');
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "APPROVAL FAILED",
        description: err.message || 'Unable to approve claim',
      });
    } finally {
      setFilingInProgress(prev => {
        const next = new Set(prev);
        next.delete(caseId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'paid') {
      return (
        <span className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[10px] font-medium tracking-wider">{status}</span>
        </span>
      );
    } else if (statusLower === 'rejected' || statusLower === 'denied' || statusLower === 'failed') {
      return (
        <span className="flex items-center gap-1.5 text-red-600">
          <XCircle className="w-3 h-3" />
          <span className="text-[10px] font-medium tracking-wider">{status}</span>
        </span>
      );
    } else if (statusLower === 'pending' || statusLower === 'submitted') {
      return (
        <span className="flex items-center gap-1.5 text-amber-600">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-medium tracking-wider">{status}</span>
        </span>
      );
    } else if (statusLower === 'in_progress' || statusLower === 'filing') {
      return (
        <span className="flex items-center gap-1.5 text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-[10px] font-medium tracking-wider">{status}</span>
        </span>
      );
    } else {
      return <span className="text-[10px] text-gray-500 font-medium tracking-wider">{status}</span>;
    }
  };

  const getFilingStatusBadge = (filingStatus?: string, filingError?: string, metadata?: DisputeCase['metadata']) => {
    if (!filingStatus) return null;

    const statusLower = filingStatus.toLowerCase();
    if (statusLower === 'filed' || statusLower === 'submitted') {
      return <span className="text-[10px] font-mono text-gray-900 font-medium">FILED</span>;
    } else if (statusLower === 'filing') {
      return <span className="text-[10px] font-mono text-blue-600 animate-pulse font-medium">FILING...</span>;
    } else if (statusLower === 'retrying') {
      return <span className="text-[10px] font-mono text-amber-600 font-medium">RETRYING</span>;
    } else if (statusLower === 'quarantined_dangerous_doc') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-red-600 cursor-help">
                <FileWarning className="w-3 h-3" />
                <span className="text-[10px] font-mono font-medium">QUARANTINED</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-[10px] font-mono leading-relaxed">Dangerous document detected (credit note, return, refund). Review documents before filing.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (statusLower === 'pending_approval') {
      // Determine reason for approval
      const approvalReason = metadata?.approval_reason;
      let tooltipText = 'High-value claim ($500+). Manual approval required before filing.';

      if (approvalReason === 'amount_mismatch') {
        const claimAmt = metadata?.claim_amount;
        const invoiceAmt = metadata?.invoice_amount;
        const variance = metadata?.variance;
        tooltipText = `Amount mismatch: Claim $${claimAmt?.toFixed(2)} differs from invoice $${invoiceAmt?.toFixed(2)} (${((variance || 0) * 100).toFixed(0)}% variance)`;
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-amber-600 cursor-help">
                <ShieldAlert className="w-3 h-3" />
                <span className="text-[10px] font-mono font-medium">NEEDS APPROVAL</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-[10px] font-mono leading-relaxed">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (statusLower === 'duplicate_blocked') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-gray-500 cursor-help">
                <Ban className="w-3 h-3" />
                <span className="text-[10px] font-mono font-medium">DUPLICATE</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-[10px] font-mono leading-relaxed">Active claim already exists for this order. Blocked to prevent abuse flag.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (statusLower === 'already_reimbursed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-emerald-600 cursor-help">
                <DollarSign className="w-3 h-3" />
                <span className="text-[10px] font-mono font-medium">ALREADY PAID</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-[10px] font-mono leading-relaxed">Amazon already reimbursed this item. Filing blocked to prevent fraud flag.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (statusLower === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-red-600 cursor-help">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-[10px] font-mono font-medium">FAILED</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-[10px] font-mono leading-relaxed">{filingError || 'Unknown error - check logs'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return <span className="text-[10px] font-mono text-gray-500 font-medium">PENDING</span>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Render filing action buttons based on status
  const renderFilingActions = (caseItem: DisputeCase) => {
    const filingStatus = caseItem.filing_status?.toLowerCase();
    const isProcessing = filingInProgress.has(caseItem.id);

    if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'approved') {
      return null;
    }

    // Blocked statuses - no action available
    if (filingStatus === 'duplicate_blocked' || filingStatus === 'already_reimbursed') {
      return (
        <span className="text-[10px] text-gray-400 font-medium tracking-[0.1em] px-3">BLOCKED</span>
      );
    }

    // Quarantined - needs document review (no auto-action)
    if (filingStatus === 'quarantined_dangerous_doc') {
      return (
        <span className="text-[10px] text-red-400 font-medium tracking-[0.1em] px-3">REVIEW REQUIRED</span>
      );
    }

    // Pending approval - show approve button
    if (filingStatus === 'pending_approval') {
      return (
        <Button
          onClick={() => handleApproveFiling(caseItem)}
          disabled={isProcessing}
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-none text-[10px] font-medium tracking-[0.1em]">
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
          )}
          APPROVE FILING
        </Button>
      );
    }

    if (filingStatus === 'failed') {
      return (
        <Button
          onClick={() => handleRetryFiling(caseItem)}
          disabled={isProcessing}
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none text-[10px] font-medium tracking-[0.1em]">
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3 h-3 mr-1.5" />
          )}
          RETRY FILING
        </Button>
      );
    }

    if (filingStatus === 'pending' || !filingStatus) {
      return (
        <Button
          onClick={() => handleFileNow(caseItem)}
          disabled={isProcessing}
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-gray-900 hover:bg-gray-100 rounded-none text-[10px] font-medium tracking-[0.1em]">
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
          ) : (
            <Send className="w-3 h-3 mr-1.5" />
          )}
          FILE NOW
        </Button>
      );
    }

    if (filingStatus === 'filing' || filingStatus === 'retrying') {
      return (
        <span className="text-[10px] text-gray-400 font-medium tracking-[0.1em] px-3">PROCESSING...</span>
      );
    }

    return null;
  };

  if (loading && cases.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        <span className="text-[11px] text-gray-400 tracking-[0.2em]">Synchronizing Intelligence</span>
      </div>
    );
  }

  if (error && cases.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-6 h-6 text-red-200" />
        <span className="text-[11px] text-gray-500 tracking-[0.2em]">Interface Error: {error}</span>
        <Button variant="outline" size="sm" onClick={() => fetchCases()} className="h-8 rounded-none border-gray-200">
          RETRY CONNECTION
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with Filters */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 tracking-[0.15em]">Dispute Cases</h3>
          <p className="text-[10px] text-gray-400 mt-1 tracking-wider font-medium">
            {cases.length} cases • Agent 7 Filing System
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-[11px] bg-white text-gray-600 border-gray-200 hover:bg-gray-50 rounded-none focus:ring-0">
              <SelectValue placeholder="STATUS: ALL" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-gray-100 shadow-2xl">
              <SelectItem value="all" className="text-[11px] tracking-wider">ALL STATUSES</SelectItem>
              <SelectItem value="pending" className="text-[11px] tracking-wider">PENDING</SelectItem>
              <SelectItem value="submitted" className="text-[11px] tracking-wider">SUBMITTED</SelectItem>
              <SelectItem value="in_progress" className="text-[11px] tracking-wider">IN PROGRESS</SelectItem>
              <SelectItem value="approved" className="text-[11px] tracking-wider">APPROVED</SelectItem>
              <SelectItem value="rejected" className="text-[11px] tracking-wider">REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            variant="ghost"
            size="sm"
            className="h-9 px-4 text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-200 rounded-none text-[11px] font-medium tracking-wider">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            SYNCHRONIZE
          </Button>
        </div>
      </div>

      {/* Institutional List */}
      <div className="mt-0 border-t border-gray-100 divide-y divide-gray-100 bg-white">
        {cases.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Search className="w-8 h-8 text-gray-100" />
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-gray-900 font-semibold tracking-[0.2em]">Queue Clean</span>
              <span className="text-[10px] text-gray-400 mt-1 tracking-wider">No cases require immediate filing</span>
            </div>
          </div>
        ) : (
          cases.map((caseItem) => (
            <div key={caseItem.id || Math.random()} className="group relative bg-white hover:bg-gray-50/40 transition-all duration-200">
              {/* Signature Left Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-900 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />

              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-5 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <Hexagon className="w-5 h-5 text-gray-200 group-hover:text-gray-900 transition-colors duration-300" strokeWidth={1.5} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-mono font-medium text-gray-900 truncate">
                        {caseItem.case_number || 'CASE-ID-PENDING'}
                      </span>
                      {caseItem.amazon_case_id && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-[10px] font-mono text-gray-600">
                          AMZ: {caseItem.amazon_case_id}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-2 text-[10px] font-medium tracking-wider text-gray-400">
                        <span>{getStatusBadge(caseItem.status || 'unknown')}</span>
                        <span className="text-gray-200">|</span>
                        <span>{getFilingStatusBadge(caseItem.filing_status, caseItem.filing_error, caseItem.metadata)}</span>
                        <span className="text-gray-200">|</span>
                        <span className="text-gray-900 font-mono tabular-nums">{formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}</span>
                        <span className="text-gray-200">|</span>
                        <span className="font-mono text-[9px] lowercase tracking-normal">id: {caseItem.claim_id?.substring(0, 8)}...</span>
                        {caseItem.retry_count && caseItem.retry_count > 0 && (
                          <>
                            <span className="text-gray-200">|</span>
                            <span className="text-amber-600">{caseItem.retry_count} RETRIES</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-6">
                  {renderFilingActions(caseItem)}

                  {caseItem.claim_id && (
                    <Link
                      to={`/recoveries/${caseItem.claim_id}`}
                      className="flex items-center gap-2.5 text-[10px] font-bold text-gray-400 hover:text-gray-900 tracking-[0.15em] transition-all duration-200 group/link"
                    >
                      VIEW RECOVERY
                      <ArrowRight className="w-3 h-3 translate-x-0 group-hover/link:translate-x-1 transition-transform duration-200" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

