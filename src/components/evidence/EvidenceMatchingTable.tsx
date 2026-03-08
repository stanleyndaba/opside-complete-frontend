import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import {
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  AlertTriangle,
  Sparkles,
  Loader2,
  XCircle,
  FileSearch,
  Hexagon,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SmartPromptCard } from './SmartPromptCard';
import { ParkedClaimCard } from './ParkedClaimCard';

interface MatchingResult {
  id: string;
  claim_id: string;
  document_id: string;
  confidence_score: number;
  match_type: string;
  action_taken: 'auto_submit' | 'smart_prompt' | 'no_action' | 'approved' | 'rejected';
  matched_fields?: string[];
  reasoning?: string;
  created_at?: string;
  claim_details?: {
    type?: string;
    amount?: number;
    currency?: string;
    sku?: string;
    asin?: string;
  };
  document_details?: {
    filename?: string;
    supplier?: string;
    invoice_number?: string;
    amount?: number;
  };
}

export function EvidenceMatchingTable() {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('smart-prompts');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || 'default';

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMatchingResults({ limit: 100 }, activeTenantSlug);

      if (response.ok && response.data?.results) {
        setMatchingResults(response.data.results as any);
      } else {
        setError(response.error || 'Failed to fetch matching results');
        setMatchingResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch matching results');
      setMatchingResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    try {
      setRefreshing(true);
      const response = await api.runEvidenceMatching();

      if (response.ok) {
        toast({
          title: 'Evidence Matching Started',
          description: response.data?.message || 'Matching process has been initiated',
        });
        // Refresh results after a delay
        setTimeout(() => {
          fetchMatchingResults();
        }, 3000);
      } else {
        toast({
          title: 'Failed to Start Matching',
          description: response.error || 'Could not start evidence matching',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to start evidence matching',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Smart Prompt actions
  const handleApproveSmartPrompt = async (matchId: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.approveSmartPrompt(matchId);
      if (response.ok) {
        toast({
          title: 'Match Approved',
          description: 'Claim has been submitted for filing.',
        });
        // Update local state - move to approved
        setMatchingResults(prev => prev.map(r =>
          r.id === matchId ? { ...r, action_taken: 'approved' as const } : r
        ));
      } else {
        toast({
          title: 'Approval Failed',
          description: response.error || 'Could not approve match',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve match',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const handleRejectSmartPrompt = async (matchId: string, reason?: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.rejectSmartPrompt(matchId, reason);
      if (response.ok) {
        toast({
          title: 'Match Rejected',
          description: 'This match has been marked as rejected.',
        });
        // Update local state - move to rejected
        setMatchingResults(prev => prev.map(r =>
          r.id === matchId ? { ...r, action_taken: 'rejected' as const } : r
        ));
      } else {
        toast({
          title: 'Rejection Failed',
          description: response.error || 'Could not reject match',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject match',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const handleRequestMoreEvidence = async (matchId: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.requestMoreEvidence(matchId);
      if (response.ok) {
        toast({
          title: 'More Evidence Requested',
          description: 'This match has been flagged for additional evidence collection.',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: response.error || 'Could not request more evidence',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to request more evidence',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  // Force approve a parked claim (despite low confidence)
  const handleForceApproveParked = async (claimId: string) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    try {
      const response = await api.approveSmartPrompt(claimId);
      if (response.ok) {
        toast({
          title: 'Claim Force Approved',
          description: 'Claim has been approved and queued for filing.',
        });
        setMatchingResults(prev => prev.filter(r => r.id !== claimId));
      } else {
        toast({
          title: 'Approval Failed',
          description: response.error || 'Could not approve claim',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve claim',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  // Dismiss a parked claim
  const handleDismissParked = async (claimId: string) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    try {
      const response = await api.rejectSmartPrompt(claimId, 'Dismissed by user');
      if (response.ok) {
        toast({
          title: 'Claim Dismissed',
          description: 'Claim has been removed from the queue.',
        });
        setMatchingResults(prev => prev.filter(r => r.id !== claimId));
      } else {
        toast({
          title: 'Dismissal Failed',
          description: response.error || 'Could not dismiss claim',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to dismiss claim',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchMatchingResults();
  }, [activeTenantSlug]);

  // Filter results by action type
  const smartPrompts = useMemo(() =>
    matchingResults.filter(r => r.action_taken === 'smart_prompt'),
    [matchingResults]
  );

  const autoSubmitted = useMemo(() =>
    matchingResults.filter(r => r.action_taken === 'auto_submit' || r.action_taken === 'approved'),
    [matchingResults]
  );

  // TEMPORARY: Show ALL matches in Parked Claims tab for testing UI
  const heldForReview = useMemo(() =>
    matchingResults.filter(r => r.action_taken === 'no_action' || r.action_taken === 'rejected' || r.action_taken === 'auto_submit' || r.action_taken === 'approved'),
    [matchingResults]
  );

  const getMatchTypeLabel = (matchType: string) => {
    const labels: Record<string, string> = {
      'exact_invoice': 'Exact Invoice Match',
      'sku_match': 'SKU Match',
      'asin_match': 'ASIN Match',
      'supplier_match': 'Supplier Match',
      'date_match': 'Date Match',
      'amount_match': 'Amount Match',
      'fuzzy_match': 'Fuzzy Match',
    };
    return labels[matchType] || matchType.replace(/_/g, ' ');
  };


  if (loading && matchingResults.length === 0) {
    return (
      <div className="bg-[#0c0c0c] border border-white/10 p-12 text-center rounded-2xl backdrop-blur-xl">
        <Loader2 className="w-8 h-8 mx-auto text-emerald-500/50 mb-4 animate-spin" />
        <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">SYNCHRONIZING_INTELLIGENCE...</p>
      </div>
    );
  }

  if (error && matchingResults.length === 0) {
    return (
      <div className="bg-[#0c0c0c] border border-red-500/20 p-8 text-center rounded-2xl backdrop-blur-xl">
        <p className="text-[10px] font-sans font-bold text-red-500/80 uppercase tracking-tight mb-4">{error}</p>
        <Button onClick={fetchMatchingResults} className="h-10 px-6 text-[10px] font-sans font-bold uppercase tracking-tight bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-xl">
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          RETRY_CONNECTION
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Header with Run Matching Button */}
      <div className="flex items-center justify-between gap-6 mb-8 px-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">Evidence_Correlation_Matrix</h2>
          </div>
          <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">
            {refreshing ? (
              <span className="animate-pulse">SYNCHRONIZING_NEURAL_VECTORS...</span>
            ) : (
              `ACTIVE_CORRELATIONS: ${matchingResults.length} NODES_IDENTIFIED`
            )}
          </p>
        </div>
        <Button
          onClick={handleRunMatching}
          disabled={refreshing}
          className={cn(
            "h-12 px-6 font-sans text-[10px] font-bold uppercase tracking-tight transition-all rounded-xl border border-white/5",
            refreshing
              ? "bg-white/5 text-white/20"
              : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          )}>
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
          )}
          {refreshing ? 'EXECUTING...' : 'RUN_CORRELATION'}
        </Button>
      </div>

      {/* Tabs for different match categories - Pentagon Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex h-12 items-stretch justify-start gap-1 bg-white/5 border border-white/5 rounded-xl p-1 backdrop-blur-xl mb-6">
          <TabsTrigger
            value="smart-prompts"
            className="flex-1 relative px-6 text-[10px] font-sans font-bold text-white/40 bg-transparent rounded-lg border-0 shadow-none transition-all hover:text-white/60 data-[state=active]:text-emerald-500 data-[state=active]:bg-white/5 data-[state=active]:shadow-[0_0_20px_rgba(0,0,0,0.4)] uppercase tracking-tight group">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-current group-data-[state=active]:animate-pulse" />
              PENDING_REVIEW
              {smartPrompts.length > 0 && (
                <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/20 group-data-[state=active]:text-emerald-500/50">{smartPrompts.length}</span>
              )}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 opacity-0 data-[state=active]:opacity-100 transition-opacity" />
          </TabsTrigger>
          <TabsTrigger
            value="auto-submitted"
            className="flex-1 relative px-6 text-[10px] font-sans font-bold text-white/40 bg-transparent rounded-lg border-0 shadow-none transition-all hover:text-white/60 data-[state=active]:text-emerald-500 data-[state=active]:bg-white/5 data-[state=active]:shadow-[0_0_20px_rgba(0,0,0,0.4)] uppercase tracking-tight group">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-current group-data-[state=active]:animate-pulse" />
              AUTO_SUBMITTED
              {autoSubmitted.length > 0 && (
                <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/20 group-data-[state=active]:text-emerald-500/50">{autoSubmitted.length}</span>
              )}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 opacity-0 data-[state=active]:opacity-100 transition-opacity" />
          </TabsTrigger>
          <TabsTrigger
            value="held"
            className="flex-1 relative px-6 text-[10px] font-sans font-bold text-white/40 bg-transparent rounded-lg border-0 shadow-none transition-all hover:text-white/60 data-[state=active]:text-emerald-500 data-[state=active]:bg-white/5 data-[state=active]:shadow-[0_0_20px_rgba(0,0,0,0.4)] uppercase tracking-tight group">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-3 h-3 text-current group-data-[state=active]:animate-pulse" />
              HELD_REJECTED
              {heldForReview.length > 0 && (
                <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/20 group-data-[state=active]:text-emerald-500/50">{heldForReview.length}</span>
              )}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 opacity-0 data-[state=active]:opacity-100 transition-opacity" />
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex-1 relative px-6 text-[10px] font-sans font-bold text-white/40 bg-transparent rounded-lg border-0 shadow-none transition-all hover:text-white/60 data-[state=active]:text-emerald-500 data-[state=active]:bg-white/5 data-[state=active]:shadow-[0_0_20px_rgba(0,0,0,0.4)] uppercase tracking-tight group">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-3 h-3 text-current group-data-[state=active]:animate-pulse" />
              ALL_VECTORS
              <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-white/20 group-data-[state=active]:text-emerald-500/50">{matchingResults.length}</span>
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 opacity-0 data-[state=active]:opacity-100 transition-opacity" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart-prompts" className="mt-0 outline-none">
          {smartPrompts.length === 0 ? (
            <div className="py-24 text-center bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/5 border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">QUEUE_FULLY_AUDITED</h3>
              <p className="text-[9px] font-sans font-bold text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-tight">
                No matches currently require manual confirmation. Autonomous engine has finalized all active correlations.
              </p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl divide-y divide-white/5">
              {smartPrompts.map(match => (
                <SmartPromptCard
                  key={match.id}
                  match={match}
                  onApprove={handleApproveSmartPrompt}
                  onReject={handleRejectSmartPrompt}
                  onRequestMoreEvidence={handleRequestMoreEvidence}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Auto-Submitted Tab */}
        <TabsContent value="auto-submitted" className="mt-0 border-t border-white/5">
          {autoSubmitted.length === 0 ? (
            <div className="py-20 text-center bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-white/10 mb-4 bg-white/5 rounded-xl">
                <Hexagon className="h-5 w-5 text-white/20" />
              </div>
              <h3 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">NO_AUTO_SUBMITTED_VECTORS</h3>
              <p className="text-[9px] font-sans font-bold text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-tight">
                System initiates automatic filing for matches exceeding the 85% confidence threshold. No high-confidence pairings detected.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {autoSubmitted.map((match) => (
                <div key={match.id} className="group relative pl-6 py-5 hover:bg-white/[0.02] transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex items-center justify-center w-8 h-8 border border-white/10 bg-white/5 rounded-lg">
                        <Hexagon className="h-4 w-4 text-white/20 group-hover:text-emerald-500/60 transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-sans font-bold text-white/80 uppercase tracking-tight">
                            {getMatchTypeLabel(match.match_type)}
                          </span>
                          <span className="text-[10px] text-white/10">|</span>
                          <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-tight">
                            {Math.round(match.confidence_score * 100)}%_CONFIDENCE
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/20">CLAIM:</span>
                            <Link to={`/recoveries/${match.claim_id}`} className="text-emerald-500/60 hover:text-emerald-500 transition-colors">
                              {match.claim_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                          <span className="text-white/10">/</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/20">DOC:</span>
                            <Link to={`/documents/${match.document_id}`} className="text-emerald-500/60 hover:text-emerald-500 transition-colors">
                              {match.document_details?.filename?.substring(0, 20) || match.document_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                        </div>
                        {match.created_at && (
                          <div className="text-[9px] font-sans font-bold text-white/20 flex items-center gap-1.5 uppercase tracking-tight">
                            <Clock className="h-2.5 w-2.5" />
                            SUBMITTED {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm').replace(/ /g, '_')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pr-6">
                      <Button asChild variant="ghost" size="sm" className="h-8 text-[9px] font-sans font-bold text-white/30 hover:text-emerald-500 hover:bg-transparent group/btn uppercase tracking-tight p-0">
                        <Link to={`/recoveries/${match.claim_id}`} className="flex items-center gap-2">
                          VIEW_RECOVERY
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>


        {/* Held / Rejected Tab */}
        <TabsContent value="held" className="mt-0 border-t border-white/5">
          {heldForReview.length === 0 ? (
            <div className="py-20 text-center bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-white/10 mb-4 bg-white/5 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-white/20" />
              </div>
              <h3 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">NO_PARKED_CLAIMS</h3>
              <p className="text-[9px] font-sans font-bold text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-tight">
                All identified overlaps have been either actioned or dismissed. Systematic queue is clear.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {heldForReview.map(claim => (
                <ParkedClaimCard
                  key={claim.id}
                  claim={claim}
                  onRequestEvidence={handleRequestMoreEvidence}
                  onForceApprove={handleForceApproveParked}
                  onDismiss={handleDismissParked}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Matches Tab */}
        <TabsContent value="all" className="mt-0 outline-none">
          {matchingResults.length === 0 ? (
            <div className="py-24 text-center bg-white/5 border border-white/5 rounded-2xl backdrop-blur-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/10 mb-6">
                <FileText className="h-6 w-6 text-white/20" />
              </div>
              <h3 className="text-[10px] font-sans font-bold text-white uppercase tracking-tight">NO_EVIDENCE_MATCHES</h3>
              <p className="text-[9px] font-sans font-bold text-white/20 mt-2 max-w-[320px] mx-auto leading-relaxed uppercase tracking-tight">
                No claim-to-document correlations established. Run matching to process backlog.
              </p>
              <Button
                onClick={handleRunMatching}
                className="mt-8 h-10 px-6 font-sans text-[9px] font-bold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all uppercase tracking-tight">
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                INDEX_BACKLOG
              </Button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl divide-y divide-white/5">
              {matchingResults.map((match) => (
                <div key={match.id} className="group relative px-8 py-6 hover:bg-white/[0.02] transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                      <div className="mt-1 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5 text-white/20 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                        <Hexagon className="h-5 w-5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-sans font-bold text-white uppercase tracking-tight">
                            {getMatchTypeLabel(match.match_type)}
                          </span>                           <div className="h-1 w-1 rounded-full bg-white/10" />
                          <span className={cn(
                            "text-[10px] font-sans font-bold uppercase tracking-tight",
                            match.confidence_score >= 0.85 ? "text-emerald-500" :
                              match.confidence_score >= 0.5 ? "text-amber-500" : "text-white/20"
                          )}>
                            {Math.round(match.confidence_score * 100)}%_CONFIDENCE
                          </span>
                          <div className="h-1 w-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-sans font-bold text-white/10 uppercase tracking-tight">
                            {match.action_taken.replace(/_/g, '_')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">

                          <div className="flex items-center gap-2">
                            <span className="text-white/10">CLAIM:</span>
                            <Link to={`/recoveries/${match.claim_id}`} className="text-white/60 font-sans font-bold hover:text-emerald-500 transition-colors">
                              {match.claim_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                          <span className="text-white/10">/</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/10">DOC:</span>
                            <Link to={`/documents/${match.document_id}`} className="text-white/60 font-sans font-bold hover:text-emerald-500 transition-colors">
                              {match.document_details?.filename?.substring(0, 20) || match.document_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                        </div>
                        {match.created_at && (
                          <div className="text-[9px] font-sans font-bold text-white/10 flex items-center gap-2 uppercase tracking-tight">
                            <Clock className="h-3 w-3" />
                            INDEXED_{format(new Date(match.created_at), 'yyyy_MM_dd__HH:mm').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-center">
                      <Link
                        to={`/recoveries/${match.claim_id}`}
                        className="flex items-center gap-2 text-[9px] font-sans font-bold text-white/20 hover:text-emerald-500 transition-all duration-300 group/link uppercase tracking-tight"
                      >
                        DATA_NODE
                        <ArrowRight className="h-3.5 w-3.5 translate-x-0 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvidenceMatchingTable;
