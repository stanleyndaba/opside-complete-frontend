import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import {
  RefreshCw, XCircle, Clock, ExternalLink, Loader2, ArrowRight,
  Search, ShieldAlert, Ban, DollarSign, FileWarning, Download, MoreHorizontal, Eye, CheckCircle2
} from 'lucide-react';
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
      const response = await api.getDisputeCases({
        status: status && status !== 'all' ? status : undefined,
        limit: 100
      }, activeTenantSlug);

      if (response.ok && response.data?.cases) {
        setCases(response.data.cases);
      } else if (response.ok && Array.isArray(response.data)) {
        setCases(response.data);
      } else {
        setError(response.error || 'Failed to fetch dispute cases');
        setCases([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dispute cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileNow = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "FILING INITIATED", description: `Case ${caseItem.case_number || caseId.substring(0, 8)} queued for immediate submission.` });
      const response = await api.post('/api/disputes/file-now', { dispute_id: caseId, claim_id: caseItem.claim_id });
      if (response.ok) {
        toast({ title: "SUBMISSION SUCCESSFUL", description: `Case filed with Amazon. Case ID: ${response.data?.amazon_case_id || 'Pending'}` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Filing failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "FILING FAILED", description: err.message || 'Unable to submit dispute to Amazon' });
    } finally {
      setFilingInProgress(prev => { const next = new Set(prev); next.delete(caseId); return next; });
    }
  };

  const handleRetryFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "RETRY INITIATED", description: `Collecting stronger evidence for case ${caseItem.case_number || caseId.substring(0, 8)}...` });
      const response = await api.post('/api/disputes/retry-filing', { dispute_id: caseId, claim_id: caseItem.claim_id, collect_stronger_evidence: true });
      if (response.ok) {
        toast({ title: "RETRY QUEUED", description: `Case will be resubmitted with enhanced evidence package.` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Retry failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "RETRY FAILED", description: err.message || 'Unable to queue retry' });
    } finally {
      setFilingInProgress(prev => { const next = new Set(prev); next.delete(caseId); return next; });
    }
  };

  const handleApproveFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "APPROVAL PROCESSING", description: `Approving high-value claim ${caseItem.case_number || caseId.substring(0, 8)} for filing...` });
      const response = await api.post('/api/disputes/approve-filing', { dispute_id: caseId, claim_id: caseItem.claim_id });
      if (response.ok) {
        toast({ title: "CLAIM APPROVED", description: `Case approved and queued for filing.` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Approval failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "APPROVAL FAILED", description: err.message || 'Unable to approve claim' });
    } finally {
      setFilingInProgress(prev => { const next = new Set(prev); next.delete(caseId); return next; });
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
      toast({ title: "BRIEF DOWNLOADED", description: "The forensic dispute brief has been saved." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "DOWNLOAD FAILED", description: err.message || "Unable to download brief" });
    } finally {
      setDownloadingBrief(prev => { const next = new Set(prev); next.delete(caseId); return next; });
    }
  };

  useEffect(() => {
    fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
  }, [statusFilter]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  // Derive status color
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'paid' || s === 'won') return 'text-emerald-500';
    if (s === 'rejected' || s === 'denied' || s === 'failed') return 'text-red-500';
    if (s === 'pending' || s === 'submitted') return 'text-amber-500';
    if (s === 'in_progress' || s === 'filing') return 'text-blue-400';
    return 'text-white/30';
  };

  const getStatusDotColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'paid' || s === 'won') return 'bg-emerald-500';
    if (s === 'rejected' || s === 'denied' || s === 'failed') return 'bg-red-500';
    if (s === 'pending' || s === 'submitted') return 'bg-amber-500';
    if (s === 'in_progress' || s === 'filing') return 'bg-blue-400';
    return 'bg-white/20';
  };

  // Filing status badge (inline)
  const getFilingLabel = (filingStatus?: string, metadata?: DisputeCase['metadata']) => {
    if (!filingStatus) return null;
    const s = filingStatus.toLowerCase();
    if (s === 'filed' || s === 'submitted') return { label: 'FILED', color: 'text-white/40' };
    if (s === 'filing') return { label: 'FILING...', color: 'text-blue-400' };
    if (s === 'retrying') return { label: 'RETRYING', color: 'text-amber-500' };
    if (s === 'quarantined_dangerous_doc') return { label: 'QUARANTINED', color: 'text-red-500' };
    if (s === 'pending_approval') return { label: 'NEEDS_APPROVAL', color: 'text-amber-600' };
    if (s === 'duplicate_blocked') return { label: 'DUPLICATE', color: 'text-white/20' };
    if (s === 'already_reimbursed') return { label: 'ALREADY_PAID', color: 'text-emerald-600' };
    if (s === 'failed') return { label: 'FAILED', color: 'text-red-500' };
    return null;
  };

  // Action buttons per row
  const renderFilingActions = (caseItem: DisputeCase) => {
    const filingStatus = caseItem.filing_status?.toLowerCase();
    const isProcessing = filingInProgress.has(caseItem.id);

    if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'approved') return null;
    if (filingStatus === 'duplicate_blocked' || filingStatus === 'already_reimbursed') {
      return <span className="text-[9px] font-mono font-bold text-white/15 uppercase tracking-widest">BLOCKED</span>;
    }
    if (filingStatus === 'quarantined_dangerous_doc') {
      return <span className="text-[9px] font-mono font-bold text-red-500/50 uppercase tracking-widest">REVIEW_REQUIRED</span>;
    }
    if (filingStatus === 'pending_approval') {
      return (
        <Button onClick={() => handleApproveFiling(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-mono font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all uppercase tracking-widest rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          APPROVE
        </Button>
      );
    }
    if (filingStatus === 'failed') {
      return (
        <Button onClick={() => handleRetryFiling(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-mono font-bold text-red-500 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all uppercase tracking-widest rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          RETRY
        </Button>
      );
    }
    if (filingStatus === 'pending' || !filingStatus) {
      return (
        <Button onClick={() => handleFileNow(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-mono font-bold text-white/60 bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20 transition-all uppercase tracking-widest rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          FILE
        </Button>
      );
    }
    if (filingStatus === 'filing' || filingStatus === 'retrying') {
      return <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest animate-pulse">PROCESSING...</span>;
    }
    return null;
  };

  // ---------- Render ----------

  if (loading && cases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence...</span>
      </div>
    );
  }

  if (error && cases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 rounded-full bg-red-500/5 border border-red-500/20 flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-500/50" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">CONNECTION_ERROR</span>
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest max-w-sm text-center">{error}</span>
        </div>
        <Button onClick={() => fetchCases()}
          className="h-8 px-5 text-[9px] font-mono font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-widest">
          RETRY_CONNECTION
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h2 className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">Dispute_Filing_Queue</h2>
          </div>
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-tight mt-1">
            ACTIVE_CASES: {cases.length} • AGENT_7_FILING_PROTOCOL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 text-[9px] font-mono font-bold bg-white/5 text-white/40 border-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-widest">
              <SelectValue placeholder="ALL_CASES" />
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border border-white/10 text-white font-mono text-[10px] rounded-xl shadow-2xl backdrop-blur-3xl p-1">
              <SelectItem value="all" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">ALL_CASES</SelectItem>
              <SelectItem value="pending" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">PENDING</SelectItem>
              <SelectItem value="submitted" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">SUBMITTED</SelectItem>
              <SelectItem value="in_progress" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">IN_PROGRESS</SelectItem>
              <SelectItem value="approved" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">APPROVED</SelectItem>
              <SelectItem value="rejected" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-widest">REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            className={cn(
              "h-10 px-5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl border border-white/5",
              "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            )}>
            <RefreshCw className="w-3 h-3 mr-2" />
            RE_SYNC
          </Button>
        </div>
      </div>

      {/* Case List */}
      {cases.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/5 border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">QUEUE_CLEAR</h3>
          <p className="text-[9px] font-mono text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-widest">
            No dispute cases require immediate filing. All active sessions have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl divide-y divide-white/5">
          {cases.map((caseItem) => {
            const statusColor = getStatusColor(caseItem.status || 'unknown');
            const dotColor = getStatusDotColor(caseItem.status || 'unknown');
            const filingLabel = getFilingLabel(caseItem.filing_status, caseItem.metadata);

            return (
              <div key={caseItem.id} className="group relative hover:bg-white/[0.02] transition-colors duration-300">
                {/* Left emerald accent on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />

                <div className="flex items-start justify-between px-8 py-5">
                  {/* Left: Info block */}
                  <div className="flex items-start gap-5 min-w-0 flex-1">
                    {/* Status dot */}
                    <div className="mt-2 flex-shrink-0">
                      <div className={cn("w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-emerald-500/30 transition-all duration-300")}>
                        <div className={cn("h-2 w-2 rounded-full", dotColor)} />
                      </div>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      {/* Row 1: Case number | Status | Amount */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-white/80 uppercase tracking-wide">
                          {caseItem.case_number || 'CASE_ID_PENDING'}
                        </span>
                        <span className="text-white/10">|</span>
                        <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", statusColor)}>
                          {(caseItem.status || 'UNKNOWN').replace(/ /g, '_')}
                        </span>
                        {filingLabel && (
                          <>
                            <span className="text-white/10">|</span>
                            <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", filingLabel.color)}>
                              {filingLabel.label}
                            </span>
                          </>
                        )}
                        {caseItem.retry_count && caseItem.retry_count > 0 && (
                          <>
                            <span className="text-white/10">|</span>
                            <span className="text-[9px] font-mono font-bold text-amber-500/50 uppercase tracking-wider">
                              RETRY_{caseItem.retry_count}
                            </span>
                          </>
                        )}
                        <span className="text-white/10">|</span>
                        <span className="text-[11px] font-mono font-bold text-white tracking-wide tabular-nums">
                          {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                        </span>
                      </div>

                      {/* Row 2: Metadata line */}
                      <div className="flex items-center gap-3 text-[9px] font-mono text-white/25 uppercase tracking-wide">
                        {caseItem.amazon_case_id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/15">AMZ:</span>
                            <span className="text-white/40">{caseItem.amazon_case_id}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-white/15" />
                          </div>
                        )}
                        {caseItem.amazon_case_id && caseItem.claim_id && <span className="text-white/10">/</span>}
                        {caseItem.claim_id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/15">REF:</span>
                            <span className="text-white/40">{caseItem.claim_id.substring(0, 12).toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Timestamp */}
                      {caseItem.created_at && (
                        <div className="text-[9px] font-mono text-white/15 flex items-center gap-1.5 uppercase tracking-wide">
                          <Clock className="h-2.5 w-2.5" />
                          CREATED {format(new Date(caseItem.created_at), 'MMM_dd,_yyyy • HH:mm').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-center flex-shrink-0 pl-4">
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
                                className="h-7 w-7 text-white/15 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                              >
                                {downloadingBrief.has(caseItem.id) ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-[#0c0c0c] border border-white/10 shadow-2xl rounded-xl">
                              <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">Download Brief</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/15 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all focus-visible:ring-0">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-[#0c0c0c] border border-white/10 shadow-2xl rounded-xl font-mono text-[11px] p-1">
                            <DropdownMenuItem asChild className="hover:bg-white/5 focus:bg-white/5 text-white/50 cursor-pointer rounded-lg px-3 py-2.5">
                              <Link to={`/recoveries/${caseItem.claim_id}`} className="flex items-center gap-2">
                                <Eye className="w-3 h-3 text-white/30" />
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
            );
          })}
        </div>
      )}
    </div>
  );
}
