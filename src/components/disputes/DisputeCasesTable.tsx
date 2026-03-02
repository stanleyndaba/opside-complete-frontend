import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Eye, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Send, RotateCcw, AlertTriangle, Loader2, Hexagon, ArrowRight, Search, ShieldAlert, Ban, DollarSign, FileWarning, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [downloadingBrief, setDownloadingBrief] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || 'default';

  const fetchCases = async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[DisputeCasesTable] Fetching dispute cases...', { status });
      const response = await api.getDisputeCases({
        status: status && status !== 'all' ? status : undefined,
        limit: 100
      }, activeTenantSlug);

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

  const handleDownloadBrief = async (caseId: string) => {
    setDownloadingBrief(prev => new Set(prev).add(caseId));
    try {
      const downloadUrl = api.getDisputeBrief(caseId);

      const response = await fetch(downloadUrl, {
        headers: {
          'x-user-id': localStorage.getItem('user_id') || 'demo-user',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download brief');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forensic-brief-${caseId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "BRIEF DOWNLOADED",
        description: "The forensic dispute brief has been saved.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "DOWNLOAD FAILED",
        description: err.message || "Unable to download brief",
      });
    } finally {
      setDownloadingBrief(prev => {
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
    const baseClass = "flex items-center gap-2 font-mono text-[10px] uppercase tracking-tighter font-bold";

    if (statusLower === 'approved' || statusLower === 'paid') {
      return (
        <span className={cn(baseClass, "text-emerald-500")}>
          <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          {status.replace(/ /g, '_')}
        </span>
      );
    } else if (statusLower === 'rejected' || statusLower === 'denied' || statusLower === 'failed') {
      return (
        <span className={cn(baseClass, "text-red-500")}>
          <XCircle className="w-3 h-3" />
          {status.replace(/ /g, '_')}
        </span>
      );
    } else if (statusLower === 'pending' || statusLower === 'submitted') {
      return (
        <span className={cn(baseClass, "text-amber-500")}>
          {status.replace(/ /g, '_')}
        </span>
      );
    } else if (statusLower === 'in_progress' || statusLower === 'filing') {
      return (
        <span className={cn(baseClass, "text-blue-500")}>
          <Loader2 className="w-3 h-3 animate-spin" />
          {status.replace(/ /g, '_')}
        </span>
      );
    } else {
      return <span className={cn(baseClass, "text-white/20")}>{status.replace(/ /g, '_')}</span>;
    }
  };

  const getFilingStatusBadge = (filingStatus?: string, filingError?: string, metadata?: DisputeCase['metadata']) => {
    if (!filingStatus) return null;

    const statusLower = filingStatus.toLowerCase();
    const baseClass = "text-[10px] font-mono font-bold uppercase tracking-tighter";

    if (statusLower === 'filed' || statusLower === 'submitted') {
      return <span className={cn(baseClass, "text-white/60")}>FILED</span>;
    } else if (statusLower === 'filing') {
      return <span className={cn(baseClass, "text-blue-500 animate-pulse")}>FILING...</span>;
    } else if (statusLower === 'retrying') {
      return <span className={cn(baseClass, "text-amber-500")}>RETRYING</span>;
    } else if (statusLower === 'quarantined_dangerous_doc') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 text-red-500 cursor-help">
                <FileWarning className="w-3.5 h-3.5" />
                <span className={baseClass}>QUARANTINED</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-[#0c0c0c] text-white border-white/10 shadow-2xl rounded-xl">
              <p className="text-[10px] font-mono leading-relaxed uppercase tracking-tight">DANGEROUS_DOCUMENT_DETECTED (CREDIT_NOTE, RETURN, REFUND)_NODE_ISOLATED</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (statusLower === 'pending_approval') {
      // Determine reason for approval
      const approvalReason = metadata?.approval_reason;
      let tooltipText = 'HIGH_VALUE_CLAIM_OVER_THRESHOLD_NODE_LOCKED';

      if (approvalReason === 'amount_mismatch') {
        const claimAmt = metadata?.claim_amount;
        const invoiceAmt = metadata?.invoice_amount;
        const variance = metadata?.variance;
        tooltipText = `AMOUNT_MISMATCH: CLAIM_${claimAmt?.toFixed(2)} != INVOICE_${invoiceAmt?.toFixed(2)} [VAR_${((variance || 0) * 100).toFixed(0)}%]`;
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-amber-600 cursor-help">
                <ShieldAlert className="w-3 h-3" />
                <span className="text-xs font-mono font-medium">NEEDS APPROVAL</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-[#0c0c0c] text-white border-white/10 shadow-2xl rounded-xl">
              <p className="text-[10px] font-mono leading-relaxed uppercase tracking-tight">{tooltipText}</p>
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
                <span className="text-xs font-mono font-medium">DUPLICATE</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-xs font-mono leading-relaxed">Active claim already exists for this order. Blocked to prevent abuse flag.</p>
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
                <span className="text-xs font-mono font-medium">ALREADY PAID</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-xs font-mono leading-relaxed">Amazon already reimbursed this item. Filing blocked to prevent fraud flag.</p>
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
                <span className={baseClass}>FAILED</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-white text-gray-900 border-gray-200 shadow-xl rounded-none">
              <p className="text-xs font-mono leading-relaxed">{filingError || 'Unknown error - check logs'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return <span className="text-xs font-mono text-gray-500 font-medium">PENDING</span>;
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
        <span className="text-xs text-gray-400 font-medium px-3">BLOCKED</span>
      );
    }

    // Quarantined - needs document review (no auto-action)
    if (filingStatus === 'quarantined_dangerous_doc') {
      return (
        <span className="text-xs text-red-400 font-medium px-3">REVIEW REQUIRED</span>
      );
    }

    // Pending approval - show approve button
    if (filingStatus === 'pending_approval') {
      return (
        <Button
          onClick={() => handleApproveFiling(caseItem)}
          disabled={isProcessing}
          className="border border-amber-600/30 hover:bg-amber-600/10 text-amber-500 px-3 py-1 rounded text-[10px] tracking-widest font-mono uppercase bg-transparent transition-all h-8">
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : null}
          APPROVE
        </Button>
      );
    }

    if (filingStatus === 'failed') {
      return (
        <Button
          onClick={() => handleRetryFiling(caseItem)}
          disabled={isProcessing}
          className="border border-red-500/30 hover:bg-red-500/10 text-red-500 px-3 py-1 rounded text-[10px] tracking-widest font-mono uppercase bg-transparent transition-all h-8">
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : null}
          RETRY
        </Button>
      );
    }

    if (filingStatus === 'pending' || !filingStatus) {
      return (
        <Button
          onClick={() => handleFileNow(caseItem)}
          disabled={isProcessing}
          className="border border-zinc-700 hover:bg-zinc-800 text-white px-3 py-1 rounded text-[10px] tracking-widest font-mono uppercase bg-transparent transition-all h-8">
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : null}
          FILE
        </Button>
      );
    }

    if (filingStatus === 'filing' || filingStatus === 'retrying') {
      return (
        <span className="text-xs text-gray-400 font-medium px-3">PROCESSING...</span>
      );
    }

    return null;
  };

  if (loading && cases.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        <span className="text-sm text-gray-400">Synchronizing Intelligence</span>
      </div>
    );
  }

  if (error && cases.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-6 h-6 text-red-200" />
        <span className="text-sm text-gray-500">Interface Error: {error}</span>
        <Button variant="outline" size="sm" onClick={() => fetchCases()} className="h-8 rounded-none border-gray-200">
          RETRY CONNECTION
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with Filters */}
      <div className="flex items-center justify-between px-8 py-6 bg-white/5 border-b border-white/5 backdrop-blur-3xl rounded-t-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">Dispute_Operational_Nodes</h3>
          </div>
          <p className="text-[9px] font-mono text-white/20 mt-2 uppercase tracking-tight">
            ACTIVE_SESSIONS: {cases.length} • AGENT_7_FILING_PROTOCOL
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-10 text-[10px] font-mono font-bold bg-white/5 text-white/60 border-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-widest">
              <SelectValue placeholder="FILTER: ALL_UNITS" />
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border border-white/10 text-white font-mono text-[10px] rounded-xl shadow-2xl backdrop-blur-3xl p-1">
              <SelectItem value="all" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNITS_ALL</SelectItem>
              <SelectItem value="pending" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNIT_PENDING</SelectItem>
              <SelectItem value="submitted" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNIT_SUBMITTED</SelectItem>
              <SelectItem value="in_progress" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNIT_IN_PROGRESS</SelectItem>
              <SelectItem value="approved" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNIT_APPROVED</SelectItem>
              <SelectItem value="rejected" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase">UNIT_REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            className="h-10 px-6 font-mono text-[10px] font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-widest">
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            RE_SYNC
          </Button>
        </div>
      </div>

      {/* Institutional List */}
      <div className="mt-0 divide-y divide-white/5 bg-white/5 border border-white/5 rounded-b-2xl overflow-hidden backdrop-blur-xl">
        {cases.length > 0 && (
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 px-8 py-3 bg-white/[0.02] border-b border-white/5">
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Case ID</div>
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Status</div>
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest text-right">Estimated Value</div>
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">Node Reference</div>
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest text-right">Actions</div>
          </div>
        )}

        {cases.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-white/20" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">QUEUE_CLEAN</span>
              <span className="text-[9px] font-mono text-white/20 mt-2 uppercase tracking-widest">No cases require immediate filing</span>
            </div>
          </div>
        ) : (
          cases.map((caseItem) => (
            <div key={caseItem.id || Math.random()} className="group relative hover:bg-zinc-800/50 border-b border-zinc-800 transition-colors duration-300">
              {/* Vertical Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />

              <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] gap-4 items-center px-8 py-4">
                {/* 1. CASE ID Column */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/60 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all duration-300">
                    <Hexagon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-mono font-medium text-zinc-200 uppercase tracking-widest truncate">
                      {caseItem.case_number || 'CASE_ID_PENDING'}
                    </span>
                    {caseItem.amazon_case_id && (
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        AMZ: {caseItem.amazon_case_id}
                        <ExternalLink className="w-3 h-3 text-zinc-600" />
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. STATUS Column */}
                <div className="flex flex-col gap-1 items-start">
                  {getStatusBadge(caseItem.status || 'unknown')}
                  {getFilingStatusBadge(caseItem.filing_status, caseItem.filing_error, caseItem.metadata)}
                  {caseItem.retry_count && caseItem.retry_count > 0 && (
                    <span className="text-[9px] font-mono text-amber-500/60 tracking-widest uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">Retry: {caseItem.retry_count}</span>
                  )}
                </div>

                {/* 3. ESTIMATED VALUE Column */}
                <div className="text-right">
                  <span className="text-base font-mono font-semibold text-white tracking-widest tabular-nums font-bold">
                    {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                  </span>
                </div>

                {/* 4. NODE REFERENCE Column */}
                <div className="flex items-center text-sm font-mono text-zinc-500 truncate italic">
                  ref: {caseItem.claim_id?.substring(0, 12)}...
                </div>

                {/* 5. ACTIONS Column */}
                <div className="flex items-center justify-end gap-3 ml-auto">
                  {renderFilingActions(caseItem)}

                  {caseItem.claim_id && (
                    <>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleDownloadBrief(caseItem.id)}
                              disabled={downloadingBrief.has(caseItem.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                            >
                              {downloadingBrief.has(caseItem.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-[#0c0c0c] border border-white/10 shadow-2xl rounded-xl">
                            <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest">Download Forensic Brief</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all focus-visible:ring-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#0c0c0c] border border-white/10 shadow-2xl rounded-xl font-mono text-[10px] uppercase tracking-widest p-1">
                          <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 text-white/70 cursor-pointer rounded-lg px-3 py-2">
                            <Link to={`/recoveries/${caseItem.claim_id}`} className="flex items-center gap-2">
                              <Eye className="w-3.5 h-3.5 text-white/50" />
                              View Core Claim
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
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

