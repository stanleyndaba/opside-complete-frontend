import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
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

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMatchingResults({ limit: 100 });

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
  }, []);

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
      <div className="bg-white border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto text-gray-200 mb-4 animate-spin" />
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Synchronizing Intelligence...</p>
      </div>
    );
  }

  if (error && matchingResults.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center">
        <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-4">{error}</p>
        <Button onClick={fetchMatchingResults} variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          RETRY
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Run Matching Button */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-sm px-4 py-3">
        <div>
          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Evidence Matching</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {matchingResults.length} {matchingResults.length === 1 ? 'match' : 'matches'} found
            {smartPrompts.length > 0 && (
              <span className="ml-2">
                • {smartPrompts.length} need{smartPrompts.length === 1 ? 's' : ''} review
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={handleRunMatching}
          disabled={refreshing}
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium uppercase tracking-[0.1em] px-4">
          {refreshing && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
          {refreshing ? 'Running...' : 'Run Matching'}
        </Button>
      </div>

      {/* Tabs for different match categories - Pentagon Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-auto items-center justify-start gap-6 bg-transparent border-b border-gray-200 rounded-none p-0 w-full text-left">
          <TabsTrigger
            value="smart-prompts"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
            Needs Review
            {smartPrompts.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{smartPrompts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="auto-submitted"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
            Auto-Submitted
            {autoSubmitted.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{autoSubmitted.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="held"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
            Held / Rejected
            {heldForReview.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{heldForReview.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900">
            All Matches
            <span className="ml-2 text-[10px] text-gray-400">{matchingResults.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Needs Review Tab */}
        <TabsContent value="smart-prompts" className="mt-0 border-t border-gray-100">
          {smartPrompts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-gray-200 mb-4 bg-gray-50/50">
                <CheckCircle2 className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.2em]">Queue Fully Audited</h3>
              <p className="text-[10px] text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                No matches currently require manual confirmation. Autonomous engine has finalized all active correlations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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
        <TabsContent value="auto-submitted" className="mt-0 border-t border-gray-100">
          {autoSubmitted.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-gray-200 mb-4 bg-gray-50/50">
                <Hexagon className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.2em]">No Auto-Submitted Matches</h3>
              <p className="text-[10px] text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                System initiates automatic filing for matches exceeding the 85% confidence threshold. No high-confidence pairings detected.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {autoSubmitted.map((match) => (
                <div key={match.id} className="group relative pl-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-900 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex items-center justify-center w-8 h-8 border border-gray-200 bg-white">
                        <Hexagon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">
                            {getMatchTypeLabel(match.match_type)}
                          </span>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">
                            {Math.round(match.confidence_score * 100)}% CONFIDENCE
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-[0.12em] font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">CLAIM:</span>
                            <Link to={`/recoveries/${match.claim_id}`} className="font-mono text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-200 hover:decoration-gray-400">
                              {match.claim_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                          <span className="text-gray-300">/</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">DOC:</span>
                            <Link to={`/documents/${match.document_id}`} className="font-mono text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-200 hover:decoration-gray-400">
                              {match.document_details?.filename?.substring(0, 20) || match.document_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                        </div>
                        {match.created_at && (
                          <div className="text-[9px] text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5" />
                            SUBMITTED {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pr-6">
                      <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] hover:text-gray-900 hover:bg-transparent group/btn p-0">
                        <Link to={`/recoveries/${match.claim_id}`} className="flex items-center gap-2">
                          VIEW RECOVERY
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
        <TabsContent value="held" className="mt-0 border-t border-gray-100">
          {heldForReview.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-gray-200 mb-4 bg-gray-50/50">
                <CheckCircle2 className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.2em]">No Parked Claims</h3>
              <p className="text-[10px] text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                All identified overlaps have been either actioned or dismissed. Systematic queue is clear.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
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
        <TabsContent value="all" className="mt-0 border-t border-gray-100">
          {matchingResults.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-dashed border-gray-200 mb-4 bg-gray-50/50">
                <FileText className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.2em]">No Evidence Matches</h3>
              <p className="text-[10px] text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                No claim-to-document correlations established. Run matching to process backlog.
              </p>
              <Button
                onClick={handleRunMatching}
                variant="outline"
                size="sm"
                className="mt-6 h-8 text-[10px] font-bold uppercase tracking-wider border-gray-200">
                <RefreshCw className="w-3 h-3 mr-2" />
                Index Backlog
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {matchingResults.map((match) => (
                <div key={match.id} className="group relative pl-6 py-5 hover:bg-gray-50/50 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-900 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex items-center justify-center w-8 h-8 border border-gray-200 bg-white">
                        <Hexagon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wide">
                            {getMatchTypeLabel(match.match_type)}
                          </span>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-widest",
                            match.confidence_score >= 0.85 ? "text-emerald-600" :
                              match.confidence_score >= 0.5 ? "text-amber-600" : "text-gray-400"
                          )}>
                            {Math.round(match.confidence_score * 100)}% CONFIDENCE
                          </span>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {match.action_taken.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 uppercase tracking-[0.12em] font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">CLAIM:</span>
                            <Link to={`/recoveries/${match.claim_id}`} className="font-mono text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-200 hover:decoration-gray-400">
                              {match.claim_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                          <span className="text-gray-300">/</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">DOC:</span>
                            <Link to={`/documents/${match.document_id}`} className="font-mono text-gray-700 hover:text-gray-900 underline underline-offset-2 decoration-gray-200 hover:decoration-gray-400">
                              {match.document_details?.filename?.substring(0, 20) || match.document_id.substring(0, 12).toUpperCase()}
                            </Link>
                          </div>
                        </div>
                        {match.created_at && (
                          <div className="text-[9px] text-gray-400 uppercase tracking-[0.15em] flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5" />
                            MATCHED {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pr-6">
                      <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] hover:text-gray-900 hover:bg-transparent group/btn p-0">
                        <Link to={`/recoveries/${match.claim_id}`} className="flex items-center gap-2">
                          VIEW
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
      </Tabs>
    </div>
  );
}

export default EvidenceMatchingTable;
