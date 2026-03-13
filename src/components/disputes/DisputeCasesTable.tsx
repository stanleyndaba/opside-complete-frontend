import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import {
  RefreshCw, XCircle, Clock, ExternalLink, Loader2, ArrowRight,
  Search, ShieldAlert, Ban, DollarSign, FileWarning, Download, MoreHorizontal, Eye, CheckCircle2, FileText
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';

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

  // Action Vector Modals State
  const [evidencePackOpen, setEvidencePackOpen] = useState(false);
  const [evidencePackClaim, setEvidencePackClaim] = useState<any>(null);
  const [proofDocsModalOpen, setProofDocsModalOpen] = useState(false);
  const [proofDocsClaim, setProofDocsClaim] = useState<any>(null);
  const [proofDocs, setProofDocs] = useState<any[]>([]);
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
    return 'bg-white/5 text-white/40 ring-white/10';
  };

  const getStatusDotColor = (status: string) => {
    return 'hidden';
  };

  // Filing status badge (inline)
  const getFilingLabel = (filingStatus?: string, metadata?: DisputeCase['metadata']) => {
    if (!filingStatus) return null;
    const s = filingStatus.toLowerCase();
    if (s === 'filed' || s === 'submitted') return { label: 'FILED', color: 'bg-white/5 text-white/20 ring-white/10' };
    if (s === 'filing') return { label: 'FILING...', color: 'bg-white/5 text-white/30 ring-white/10' };
    if (s === 'retrying') return { label: 'RETRYING', color: 'bg-white/5 text-white/30 ring-white/10' };
    if (s === 'quarantined_dangerous_doc') return { label: 'QUARANTINED', color: 'bg-white/5 text-white/20 ring-white/10' };
    if (s === 'pending_approval') return { label: 'NEEDS_APPROVAL', color: 'bg-white/5 text-white/30 ring-white/10' };
    if (s === 'duplicate_blocked') return { label: 'DUPLICATE', color: 'bg-white/5 text-white/15 ring-white/10' };
    if (s === 'already_reimbursed') return { label: 'ALREADY_PAID', color: 'bg-white/5 text-white/40 ring-white/10' };
    if (s === 'failed') return { label: 'FAILED', color: 'bg-white/5 text-white/40 ring-white/10' };
    return null;
  };

  // Action buttons per row
  const renderFilingActions = (caseItem: DisputeCase) => {
    const filingStatus = caseItem.filing_status?.toLowerCase();
    const isProcessing = filingInProgress.has(caseItem.id);

    if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'approved') return null;
    if (filingStatus === 'duplicate_blocked' || filingStatus === 'already_reimbursed') {
      return <span className="text-[9px] font-sans font-bold text-white/15 uppercase tracking-tight">BLOCKED</span>;
    }
    if (filingStatus === 'quarantined_dangerous_doc') {
      return <span className="text-[9px] font-sans font-bold text-red-500/50 uppercase tracking-tight">REVIEW_REQUIRED</span>;
    }
    if (filingStatus === 'pending_approval') {
      return (
        <Button onClick={() => handleApproveFiling(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-sans font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all uppercase tracking-tight rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          APPROVE
        </Button>
      );
    }
    if (filingStatus === 'failed') {
      return (
        <Button onClick={() => handleRetryFiling(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-sans font-bold text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all uppercase tracking-tight rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          RETRY
        </Button>
      );
    }
    if (filingStatus === 'pending' || !filingStatus) {
      return (
        <Button onClick={() => handleFileNow(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-sans font-bold text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all uppercase tracking-tight rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          FILE
        </Button>
      );
    }
    if (filingStatus === 'filing' || filingStatus === 'retrying') {
      return <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight animate-pulse">PROCESSING...</span>;
    }
    return null;
  };

  // ---------- Render ----------

  if (loading && cases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
        <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight animate-pulse">Synchronizing Intelligence...</span>
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
          <span className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">CONNECTION_ERROR</span>
          <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight max-w-sm text-center">{error}</span>
        </div>
        <Button onClick={() => fetchCases()}
          className="h-8 px-5 text-[9px] font-sans font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-tight">
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
            <h2 className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">DISPUTE_FILING_QUEUE_V3_MONO</h2>
          </div>
          <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mt-1">
            ACTIVE_CASES: {cases.length} • AGENT_7_FILING_PROTOCOL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 text-[9px] font-sans font-bold bg-white/5 text-white/40 border-white/5 hover:bg-white/10 rounded-xl transition-all uppercase tracking-tight">
              <SelectValue placeholder="ALL_CASES" />
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border border-white/10 text-white font-sans font-bold text-[10px] rounded-xl shadow-2xl backdrop-blur-3xl p-1">
              <SelectItem value="all" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">ALL_CASES</SelectItem>
              <SelectItem value="pending" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">PENDING</SelectItem>
              <SelectItem value="submitted" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">SUBMITTED</SelectItem>
              <SelectItem value="in_progress" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">IN_PROGRESS</SelectItem>
              <SelectItem value="approved" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">APPROVED</SelectItem>
              <SelectItem value="rejected" className="rounded-lg hover:bg-white/5 focus:bg-white/5 py-2.5 uppercase tracking-tight">REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            className={cn(
              "h-10 px-5 font-sans font-bold text-[9px] uppercase tracking-tight transition-all rounded-xl border border-white/5",
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
          <h3 className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">QUEUE_CLEAR</h3>
          <p className="text-[9px] font-sans font-bold text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-tight">
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
              <div key={caseItem.id} className="group relative hover:bg-white/[0.01] transition-colors duration-300">
                <div className="flex items-start justify-between px-8 py-6">
                  {/* Left: Info block */}
                  <div className="flex items-start gap-5 min-w-0 flex-1">
                    <div className="space-y-2 min-w-0">
                      {/* Row 1: Case number | Status | Amount */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[12px] font-sans font-bold text-white uppercase tracking-tight">
                          {caseItem.case_number || 'CASE_ID_PENDING'}
                        </span>
                        
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-tight ring-1 ring-inset", statusColor)}>
                          {(caseItem.status || 'UNKNOWN').replace(/ /g, '_')}
                        </span>

                        {filingLabel && (
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-tight ring-1 ring-inset", filingLabel.color)}>
                            {filingLabel.label}
                          </span>
                        )}

                        {caseItem.retry_count && caseItem.retry_count > 0 && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/5 px-2.5 py-0.5 text-[9px] font-bold text-amber-500/40 ring-1 ring-inset ring-amber-500/10 uppercase tracking-tight">
                            RETRY_{caseItem.retry_count}
                          </span>
                        )}
                        
                        <div className="ml-auto">
                          <span className="text-[12px] font-sans font-bold text-white tracking-tight tabular-nums">
                            {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Metadata line */}
                      <div className="flex items-center gap-3 text-[10px] font-sans font-medium text-white/30 uppercase tracking-tight">
                        {caseItem.amazon_case_id && (
                          <div className="flex items-center gap-1.5 group/link cursor-pointer">
                            <span className="text-white/20">AMZ:</span>
                            <span className="text-white/40 group-hover/link:text-white transition-colors">{caseItem.amazon_case_id}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-white/20 group-hover/link:text-white" />
                          </div>
                        )}
                        {caseItem.amazon_case_id && caseItem.claim_id && <span className="text-white/10">/</span>}
                        {caseItem.claim_id && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/20">REF:</span>
                            <span className="text-white/40">{caseItem.claim_id.substring(0, 12).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-white/10">•</span>
                        {caseItem.created_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5 text-white/20" />
                            <span className="text-white/30">{format(new Date(caseItem.created_at), 'MMM dd, yyyy HH:mm').toUpperCase()}</span>
                          </div>
                        )}
                      </div>
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
                              <span className="text-[9px] font-sans font-bold text-white/50 uppercase tracking-tight">Download Brief</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/15 hover:text-white/50 hover:bg-white/5 rounded-lg transition-all focus-visible:ring-0 group">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-xl p-1">
                            <div className="text-[9px] font-sans font-bold text-white/20 px-3 py-2 border-b border-white/5 mb-1 uppercase tracking-tight">ACTION_VECTOR</div>
                            
                            <DropdownMenuItem asChild className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2.5 cursor-pointer uppercase tracking-tight">
                              <Link to={`/recoveries/${caseItem.claim_id}`} className="flex items-center gap-2">
                                <Eye className="w-3 h-3 text-white/30" />
                                VIEW_PARAMETERS
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2.5 cursor-pointer uppercase tracking-tight"
                              onClick={async () => {
                                try {
                                  const res = await api.getRecoveryDetail(caseItem.claim_id, activeTenantSlug);
                                  if (res.ok && res.data) {
                                    const claimData = res.data;
                                    const docs = Array.isArray(claimData.documents) ? claimData.documents : 
                                                 Array.isArray(claimData.matchedDocs) ? claimData.matchedDocs : [];
                                    setProofDocs(docs);
                                    setProofDocsClaim({ 
                                      ...caseItem, 
                                      id: caseItem.claim_id, 
                                      claim_number: caseItem.case_number,
                                      ...claimData 
                                    });
                                    setProofDocsModalOpen(true);
                                  } else {
                                    throw new Error(res.error || 'Failed to fetch claim details');
                                  }
                                } catch (e: any) {
                                  toast({ title: 'Error loading documents', description: e?.message });
                                }
                              }}>
                              <FileText className="w-3 h-3 mr-2 text-white/30" />
                              PROOF_DOCUMENTS_RETRIEVAL
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2.5 cursor-pointer uppercase tracking-tight"
                              onClick={async () => {
                                try {
                                  const res = await api.getRecoveryDetail(caseItem.claim_id, activeTenantSlug);
                                  if (res.ok && res.data) {
                                    setEvidencePackClaim({ 
                                      ...caseItem, 
                                      id: caseItem.claim_id, 
                                      claim_number: caseItem.case_number,
                                      ...res.data 
                                    });
                                    setEvidencePackOpen(true);
                                  } else {
                                    throw new Error(res.error || 'Failed to fetch claim details');
                                  }
                                } catch (e: any) {
                                  toast({ title: 'Error loading evidence pack', description: e?.message });
                                }
                              }}>
                              <ShieldAlert className="w-3 h-3 mr-2 text-white/30" />
                              AUDIT_PACKAGE_VIEW
                            </DropdownMenuItem>

                            {caseItem.status?.toLowerCase() === 'denied' && (
                              <DropdownMenuItem
                                className="text-[10px] font-sans font-bold text-red-400 hover:text-red-300 rounded-lg px-3 py-2.5 cursor-pointer uppercase tracking-tight"
                                onClick={async () => {
                                  try {
                                    await recoveryApi.resubmitClaim(caseItem.claim_id, activeTenantSlug);
                                    toast({ title: 'Resubmitted', description: 'Claim resubmitted with enhanced evidence.' });
                                    fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
                                  } catch (e: any) {
                                    toast({ title: 'Resubmission failed', description: e?.message });
                                  }
                                }}>
                                <RefreshCw className="w-3 h-3 mr-2" />
                                RESUBMIT_ENHANCED_AUDIT
                              </DropdownMenuItem>
                            )}
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

      {/* Evidence Pack Dossier View */}
      {evidencePackClaim && (
        <EvidencePackView
          open={evidencePackOpen}
          onClose={() => {
            setEvidencePackOpen(false);
            setEvidencePackClaim(null);
          }}
          claim={evidencePackClaim}
        />
      )}

      {/* Proof Documents Modal */}
      <ProofDocumentsModal
        open={proofDocsModalOpen}
        onClose={() => {
          setProofDocsModalOpen(false);
          setProofDocsClaim(null);
          setProofDocs([]);
        }}
        claimId={proofDocsClaim?.id || ''}
        claimNumber={proofDocsClaim?.claim_number}
        documents={proofDocs}
      />
    </div>
  );
}
