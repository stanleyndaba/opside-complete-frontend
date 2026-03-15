import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';import {
  RefreshCw, XCircle, Clock, ExternalLink, Loader2,
  Lock, AlertCircle, DollarSign, Download, MoreHorizontal, Eye, CheckCircle2, FileText,
  ShieldAlert
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

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

interface DisputeCasesTableProps {
  isPaidUser?: boolean;
  isTenantThrottled?: boolean;
}

export function DisputeCasesTable({ isPaidUser: isPaidUserProp, isTenantThrottled: isTenantThrottledProp }: DisputeCasesTableProps) {
  const { isPaidUser } = useSession();
  const { isThrottled: isTenantThrottledFromContext } = useTenant();
  
  const isPaid = isPaidUserProp ?? isPaidUser;
  const isThrottled = isTenantThrottledProp ?? isTenantThrottledFromContext;

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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalCaseId, setUpgradeModalCaseId] = useState<string | undefined>(undefined);
  
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
    if (!isPaid) {
      setUpgradeModalCaseId(caseItem.case_number || caseItem.id);
      setUpgradeModalOpen(true);
      return;
    }
    
    if (isThrottled) {
      toast({ variant: "destructive", title: "SYSTEM COOLDOWN", description: "Filing is temporarily disabled due to Amazon rate limits. Gate reopens in < 30m." });
      return;
    }

    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "SUBMISSION_INITIATED", description: `Dispatched Agent 7 for Case ${caseItem.case_number || caseId.substring(0, 8)}.` });
      const response = await api.post('/api/disputes/file-now', { dispute_id: caseId, claim_id: caseItem.claim_id });
      if (response.ok) {
        toast({ title: "SUBMISSION_SUCCESS", description: `Case ${response.data?.amazon_case_id || 'locked'} successfully filed.` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Filing failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "HANDSHAKE_ERROR", description: err.message || 'The fortress rejected the submission.' });
    } finally {
      setFilingInProgress(prev => { const next = new Set(prev); next.delete(caseId); return next; });
    }
  };

  const handleRetryFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "RECOVERY_INITIATED", description: `Re-calibrating evidence for case ${caseItem.case_number || caseId.substring(0, 8)}...` });
      const response = await api.post('/api/disputes/retry-filing', { dispute_id: caseId, claim_id: caseItem.claim_id, collect_stronger_evidence: true });
      if (response.ok) {
        toast({ title: "RETRY_QUEUED", description: `Enhanced evidence payload scheduled for resubmission.` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Retry failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "RETRY_FAILED", description: err.message || 'Protocol failure during retry.' });
    } finally {
      setFilingInProgress(prev => { const next = new Set(prev); next.delete(caseId); return next; });
    }
  };

  const handleApproveFiling = async (caseItem: DisputeCase) => {
    const caseId = caseItem.id;
    setFilingInProgress(prev => new Set(prev).add(caseId));
    try {
      toast({ title: "APPROVAL_PROCESSING", description: `Bypassing safety locks for claim ${caseItem.case_number || caseId.substring(0, 8)}...` });
      const response = await api.post('/api/disputes/approve-filing', { dispute_id: caseId, claim_id: caseItem.claim_id });
      if (response.ok) {
        toast({ title: "CLAIM_RELEASED", description: `Case approved. Transmitting to Amazon...` });
        await fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
      } else {
        throw new Error(response.error || 'Approval failed');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "APPROVAL_FAILED", description: err.message || 'Manual override failed.' });
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
      toast({ title: "BRIEF_DOWNLOADED", description: "Forensic dispute brief exported." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "EXPORT_FAILED", description: err.message || "Brief generation failed." });
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

  // Status mapping for badges
  const getStatusLabel = (status: string, filingStatus?: string) => {
    const s = (filingStatus || status).toLowerCase();
    
    // Atomic States
    if (s === 'submitting') return { label: '[LOCKING...]', color: 'bg-white/5 text-white/60 ring-white/20 animate-pulse' };
    if (s === 'recovering') return { label: '[RECONCILING...]', color: 'bg-white/5 text-white/40 ring-white/10 italic' };
    if (s === 'payment_required') return { label: '[PAYMENT_REQUIRED]', color: 'bg-red-500/10 text-red-400 ring-red-500/20' };
    
    // Regular States
    if (s === 'filed' || s === 'submitted') return { label: 'FILED', color: 'bg-white/5 text-white/20 ring-white/10' };
    if (s === 'filing') return { label: 'FILING...', color: 'bg-white/5 text-white/40 ring-white/10' };
    if (s === 'retrying') return { label: 'RETRYING', color: 'bg-white/5 text-white/30 ring-white/10' };
    if (s === 'quarantined') return { label: 'QUARANTINED', color: 'bg-white/5 text-white/15 ring-white/10 border-dashed border-red-500/20' };
    if (s === 'pending_approval') return { label: 'PEER_REVIEW', color: 'bg-white/5 text-white/50 ring-white/10 font-mono' };
    if (s === 'failed') return { label: 'FAILED', color: 'bg-white/5 text-white/40 ring-white/10 line-through' };
    
    return { label: s.toUpperCase().replace(/_/g, ' '), color: 'bg-white/5 text-white/30 ring-white/10' };
  };

  // Action buttons per row
  const renderFilingActions = (caseItem: DisputeCase) => {
    const filingStatus = (caseItem.filing_status || caseItem.status).toLowerCase();
    const isProcessing = filingInProgress.has(caseItem.id);
    
    // Atomic Lock Check
    const isLocked = filingStatus === 'submitting' || filingStatus === 'recovering' || filingStatus === 'filing';

    if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'approved') return null;
    
    if (isThrottled) {
      return (
        <Badge variant="outline" className="h-7 px-3 bg-white/5 text-white/20 border-white/5 rounded-lg flex items-center gap-1.5 grayscale">
          <Lock className="w-2.5 h-2.5" />
          GATE_CLOSED
        </Badge>
      );
    }

    if (isLocked) {
      return (
        <div className="flex items-center gap-2 opacity-30 select-none">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-[9px] font-sans font-bold text-white uppercase tracking-tight">ATOMIC_LOCK</span>
        </div>
      );
    }

    if (filingStatus === 'pending_approval') {
      return (
        <Button onClick={() => handleApproveFiling(caseItem)} disabled={isProcessing}
          className="h-7 px-4 text-[9px] font-sans font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all uppercase tracking-tight rounded-lg">
          {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
          APPROVE_OVERRIDE
        </Button>
      );
    }

    // Default File/Retry Action
    const isRetry = filingStatus === 'failed';
    const actionLabel = isPaid ? (isRetry ? 'RETRY' : 'FILE') : 'UPGRADE REQUIRED ($99)';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={() => isRetry ? handleRetryFiling(caseItem) : handleFileNow(caseItem)} 
              disabled={isProcessing}
              className={cn(
                "h-7 px-4 text-[9px] font-sans font-bold transition-all uppercase tracking-tight rounded-lg",
                !isPaid && !isRetry 
                  ? "bg-white/5 text-white/20 border border-white/10 cursor-pointer italic grayscale"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
              )}>
              {isProcessing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
              {!isPaid && !isRetry && <Lock className="w-2.5 h-2.5 mr-1.5 opacity-50" />}
              {actionLabel}
            </Button>
          </TooltipTrigger>
          {!isPaid && !isRetry && (
            <TooltipContent className="bg-black border border-white/10 p-2 text-[9px] font-sans font-bold text-white/80 uppercase">
              $99 Beta Activation Required
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // ---------- Render ----------

  if (loading && cases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
        <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tighter animate-pulse">Scanning Fortress State...</span>
      </div>
    );
  }

  if (error && cases.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-white/40" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-sans font-bold text-white/80 uppercase tracking-tight">COMM_LINK_DOWN</span>
          <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight max-w-xs text-center">{error}</span>
        </div>
        <Button onClick={() => fetchCases()}
          className="h-8 px-5 text-[9px] font-sans font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-tight">
          RETRY_SYNC
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
            <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <h2 className="text-[10px] font-sans font-bold text-white/60 uppercase tracking-widest">DISPUTE LEDGER</h2>
          </div>
          <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight mt-1">
            ACTIVE CASES: {cases.length} {isThrottled && "• [THROTTLED]"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-[9px] font-sans font-bold bg-white/5 text-white/40 border-white/10 hover:bg-white/10 rounded-lg transition-all uppercase tracking-tight">
              <SelectValue placeholder="ALL_RECORDS" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-white/10 text-white font-sans font-bold text-[10px] rounded-lg shadow-2xl p-1">
              <SelectItem value="all" className="rounded-md hover:bg-white/5 py-2 uppercase">ALL_RECORDS</SelectItem>
              <SelectItem value="pending" className="rounded-md hover:bg-white/5 py-2 uppercase">PENDING</SelectItem>
              <SelectItem value="submitted" className="rounded-md hover:bg-white/5 py-2 uppercase">FILED</SelectItem>
              <SelectItem value="in_progress" className="rounded-md hover:bg-white/5 py-2 uppercase">PROCESSING</SelectItem>
              <SelectItem value="rejected" className="rounded-md hover:bg-white/5 py-2 uppercase">REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            className="h-9 px-4 font-sans font-bold text-[9px] bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white-60 transition-all rounded-lg uppercase tracking-tight">
            <RefreshCw className="w-3 h-3 mr-2" />
            RE_SYNC
          </Button>
        </div>
      </div>

      {/* Case List */}
      {cases.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-white/5 rounded-2xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4 opacity-20">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-[9px] font-sans font-bold text-white/40 uppercase tracking-widest">LEDGER_EMPTY</h3>
          <p className="text-[9px] font-sans font-bold text-white/10 mt-1 uppercase">No active disputes requiring intervention.</p>
        </div>
      ) : (
        <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
          {cases.map((caseItem) => {
            const statusBadge = getStatusLabel(caseItem.status, caseItem.filing_status);

            return (
              <div key={caseItem.id} className="group relative hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between px-8 py-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-sans font-bold text-white/80 tabular-nums">
                          {caseItem.case_number || 'ID_PENDING'}
                        </span>
                        
                        <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-tight ring-1 ring-inset", statusBadge.color)}>
                          {statusBadge.label}
                        </span>

                        {(caseItem.retry_count ?? 0) > 0 && (
                          <span className="text-[8px] font-bold text-white/20 border border-white/10 px-1.5 py-0.5 rounded">
                            V{caseItem.retry_count! + 1}
                          </span>
                        )}
                        
                        <div className="ml-auto flex items-center gap-1.5">
                          {caseItem.status === 'payment_required' && <DollarSign className="w-3 h-3 text-red-400" />}
                          <span className="text-[11px] font-sans font-bold text-white/80 tracking-tight tabular-nums">
                            {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[9px] font-sans font-bold text-white/15 uppercase tracking-tighter">
                        {caseItem.amazon_case_id && (
                          <div className="flex items-center gap-1 group/link cursor-pointer">
                            <span className="opacity-50">AMZ_ID:</span>
                            <span className="group-hover/link:text-white/40 transition-colors">{caseItem.amazon_case_id}</span>
                            <ExternalLink className="w-2 h-2 opacity-50" />
                          </div>
                        )}
                        {caseItem.claim_id && (
                          <div className="flex items-center gap-1">
                            <span className="opacity-50">CLAIM_REF:</span>
                            <span>{caseItem.id.substring(0, 12).toUpperCase()}</span>
                          </div>
                        )}
                        <span>•</span>
                        {caseItem.created_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-2 w-2 opacity-50" />
                            <span>{format(new Date(caseItem.created_at), 'yyyy/MM/dd HH:mm').toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-center flex-shrink-0 pl-6">
                    {renderFilingActions(caseItem)}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/10 hover:text-white/40 hover:bg-white/5 rounded-lg transition-all">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-black border border-white/10 shadow-2xl rounded-lg p-1">
                        <div className="text-[8px] font-sans font-bold text-white/20 px-3 py-2 border-b border-white/5 mb-1 uppercase tracking-widest">METR_PROTOCOL</div>
                        
                        <DropdownMenuItem asChild className="text-[9px] font-sans font-bold text-white/40 hover:text-white rounded-md px-3 py-2 cursor-pointer uppercase">
                          <Link to={`/recoveries/${caseItem.claim_id}`} className="flex items-center gap-2">
                            <Eye className="w-2.5 h-2.5 opacity-50" />
                            VIEW_RAW_DATA
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-[9px] font-sans font-bold text-white/40 hover:text-white rounded-md px-3 py-2 cursor-pointer uppercase"
                          onClick={async () => {
                            try {
                              const res = await api.getRecoveryDetail(caseItem.claim_id, activeTenantSlug);
                              if (res.ok && res.data) {
                                const docs = Array.isArray(res.data.documents) ? res.data.documents : [];
                                setProofDocs(docs);
                                setProofDocsClaim({ ...caseItem, id: caseItem.claim_id });
                                setProofDocsModalOpen(true);
                              }
                            } catch (e: any) {
                              toast({ title: 'ERROR', description: 'Evidence retrieval failed.' });
                            }
                          }}>
                          <FileText className="w-2.5 h-2.5 mr-2 opacity-50" />
                          AUDIT_HISTORY
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-[9px] font-sans font-bold text-white/40 hover:text-white rounded-md px-3 py-2 cursor-pointer uppercase"
                          onClick={async () => {
                            try {
                              const res = await api.getRecoveryDetail(caseItem.claim_id, activeTenantSlug);
                              if (res.ok && res.data) {
                                setEvidencePackClaim({ ...caseItem, id: caseItem.claim_id, ...res.data });
                                setEvidencePackOpen(true);
                              }
                            } catch (e: any) {
                              toast({ title: 'ERROR', description: 'Package collation failed.' });
                            }
                          }}>
                          <ShieldAlert className="w-2.5 h-2.5 mr-2 opacity-50" />
                          DANGER_FINDINGS
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-[9px] font-sans font-bold text-white/40 hover:text-white rounded-md px-3 py-2 cursor-pointer uppercase"
                          onClick={() => handleDownloadBrief(caseItem.id)}>
                          <Download className="w-3 h-3 mr-2 opacity-50" />
                          EXPORT_BRIEF_PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        claimNumber={proofDocsClaim?.case_number}
        documents={proofDocs}
      />

      <UpgradeModal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        caseId={upgradeModalCaseId} 
      />
    </div>
  );
}
