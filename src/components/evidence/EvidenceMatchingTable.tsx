import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
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

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

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
      const response = await api.runEvidenceMatching(undefined, activeTenantSlug);

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
      const response = await api.approveSmartPrompt(matchId, activeTenantSlug);
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
      const response = await api.rejectSmartPrompt(matchId, reason, activeTenantSlug);
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
      const response = await api.requestMoreEvidence(matchId, activeTenantSlug);
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
      const response = await api.approveSmartPrompt(claimId, activeTenantSlug);
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
      const response = await api.rejectSmartPrompt(claimId, 'Dismissed by user', activeTenantSlug);
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

  const heldForReview = useMemo(() =>
    matchingResults.filter(r => r.action_taken === 'no_action' || r.action_taken === 'rejected'),
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

  const getActionLabel = (actionTaken: MatchingResult['action_taken']) => {
    const labels: Record<MatchingResult['action_taken'], string> = {
      auto_submit: 'Auto-submitted',
      smart_prompt: 'Pending review',
      no_action: 'Held',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[actionTaken] || actionTaken.replace(/_/g, ' ');
  };

  const renderEmptyState = (
    eyebrow: string,
    title: string,
    description: string,
    action?: React.ReactNode
  ) => (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/90 px-8 py-16 text-center backdrop-blur-xl">
      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/24">
        {eyebrow}
      </div>
      <h3 className="mt-4 text-lg font-sans font-medium tracking-tight text-white">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-[11px] font-sans leading-relaxed text-white/38">
        {description}
      </p>
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );

  const renderMatchRows = (
    matches: MatchingResult[],
    actionLabel: string
  ) => (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 backdrop-blur-xl">
      <div className="hidden border-b border-white/5 px-6 py-4 lg:grid lg:grid-cols-[1.15fr_0.8fr_1fr_0.55fr_0.7fr] lg:gap-6">
        {['Match', 'Claim', 'Document', 'Confidence', 'Action'].map((label) => (
          <div key={label} className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/22">
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-white/5">
        {matches.map((match) => (
          <div key={match.id} className="px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.8fr_1fr_0.55fr_0.7fr] lg:gap-6 lg:items-start">
              <div>
                <div className="text-[12px] font-sans font-medium tracking-tight text-white">
                  {getMatchTypeLabel(match.match_type)}
                </div>
                <div className="mt-2 text-[10px] font-sans uppercase tracking-tight text-white/26">
                  {getActionLabel(match.action_taken)}
                </div>
                {match.created_at ? (
                  <div className="mt-2 text-[10px] font-sans text-white/32">
                    Reviewed {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm')}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/18 lg:hidden">
                  Claim
                </div>
                <Link to={`/recoveries/${match.claim_id}`} className="mt-1 inline-flex text-[11px] font-sans font-medium tracking-tight text-white/72 transition-colors hover:text-white">
                  {match.claim_id.substring(0, 12).toUpperCase()}
                </Link>
              </div>

              <div>
                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/18 lg:hidden">
                  Document
                </div>
                <Link to={`/documents/${match.document_id}`} className="mt-1 inline-flex text-[11px] font-sans font-medium tracking-tight text-white/72 transition-colors hover:text-white">
                  {match.document_details?.filename?.substring(0, 28) || match.document_id.substring(0, 12).toUpperCase()}
                </Link>
              </div>

              <div>
                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/18 lg:hidden">
                  Confidence
                </div>
                <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-white">
                  {Math.round(match.confidence_score * 100)}%
                </div>
              </div>

              <div className="lg:text-right">
                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/18 lg:hidden">
                  Action
                </div>
                <Link
                  to={`/recoveries/${match.claim_id}`}
                  className="mt-1 inline-flex text-[10px] font-sans font-medium uppercase tracking-tight text-white/56 transition-colors hover:text-white"
                >
                  {actionLabel}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  if (loading && matchingResults.length === 0) {
    return (
      <div className="bg-[#111111]/90 border border-white/10 p-12 text-center rounded-2xl backdrop-blur-xl">
        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/24">Evidence queue</div>
        <p className="mt-4 text-lg font-sans font-medium tracking-tight text-white">Loading current evidence matches.</p>
        <p className="mt-3 text-[11px] font-sans leading-relaxed text-white/34">Please wait while Margin refreshes the current review queue.</p>
      </div>
    );
  }

  if (error && matchingResults.length === 0) {
    return (
      <div className="bg-[#111111]/90 border border-red-500/20 p-8 text-center rounded-2xl backdrop-blur-xl">
        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-red-400/80">Evidence queue</div>
        <p className="mt-4 text-lg font-sans font-medium tracking-tight text-white">Evidence review could not be loaded.</p>
        <p className="mx-auto mt-3 max-w-md text-[11px] font-sans leading-relaxed text-white/40">{error}</p>
        <Button onClick={fetchMatchingResults} className="mt-8 h-10 px-6 text-[10px] font-sans font-medium uppercase tracking-tight bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-xl">
          Retry
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 backdrop-blur-xl">
        <div className="flex flex-col gap-6 border-b border-white/5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/24">Evidence queue</div>
            <h2 className="mt-3 text-2xl font-sans font-medium tracking-tight text-white">
              Review the document matches that will support filing.
            </h2>
            <p className="mt-3 text-[11px] font-sans leading-relaxed text-white/38">
              {refreshing
                ? 'Refreshing the current evidence queue.'
                : matchingResults.length > 0
                  ? `${pluralize(matchingResults.length, 'match')} are currently available across review, submitted, and held states.`
                  : 'No evidence matches are currently waiting in the queue.'}
            </p>
          </div>
          <Button
            onClick={handleRunMatching}
            disabled={refreshing}
            className={cn(
              "h-11 px-5 font-sans text-[10px] font-medium uppercase tracking-tight transition-colors rounded-xl border border-white/10",
              refreshing
                ? "bg-white/5 text-white/25"
                : "bg-white/[0.03] text-white/78 hover:bg-white/[0.06] hover:border-white/20"
            )}
          >
            {refreshing ? 'Refreshing...' : 'Refresh matching'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/6 lg:grid-cols-4">
          {[
            { label: 'Pending review', value: smartPrompts.length, detail: 'Needs a filing decision' },
            { label: 'Submitted', value: autoSubmitted.length, detail: 'Already moved forward' },
            { label: 'Held', value: heldForReview.length, detail: 'Waiting for evidence or review' },
            { label: 'All matches', value: matchingResults.length, detail: 'Current queue total' }
          ].map((item) => (
            <div key={item.label} className="bg-[#0d0d0d] px-6 py-5">
              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/24">{item.label}</div>
              <div className="mt-3 text-[22px] font-sans font-medium tracking-tight text-white">{item.value}</div>
              <div className="mt-2 text-[10px] font-sans leading-relaxed text-white/34">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs for different match categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid h-auto grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl mb-6 lg:grid-cols-4">
          <TabsTrigger
            value="smart-prompts"
            className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-left text-[10px] font-sans font-medium uppercase tracking-tight text-white/40 shadow-none transition-colors hover:text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span>Pending review</span>
              <span className="text-[9px] text-white/45">{smartPrompts.length}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="auto-submitted"
            className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-left text-[10px] font-sans font-medium uppercase tracking-tight text-white/40 shadow-none transition-colors hover:text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span>Submitted</span>
              <span className="text-[9px] text-white/45">{autoSubmitted.length}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="held"
            className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-left text-[10px] font-sans font-medium uppercase tracking-tight text-white/40 shadow-none transition-colors hover:text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span>Held</span>
              <span className="text-[9px] text-white/45">{heldForReview.length}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-xl border border-transparent bg-transparent px-4 py-3 text-left text-[10px] font-sans font-medium uppercase tracking-tight text-white/40 shadow-none transition-colors hover:text-white/70 data-[state=active]:border-white/10 data-[state=active]:bg-white/[0.06] data-[state=active]:text-white"
          >
            <div className="flex w-full items-center justify-between gap-3">
              <span>All matches</span>
              <span className="text-[9px] text-white/45">{matchingResults.length}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart-prompts" className="mt-0 outline-none">
          {smartPrompts.length === 0 ? (
            renderEmptyState(
              'Pending review',
              'No matches are waiting for a manual decision.',
              'When Margin finds supportable claim-to-document matches that still need human confirmation, they will appear here.'
            )
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 backdrop-blur-xl divide-y divide-white/5">
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
            renderEmptyState(
              'Submitted',
              'No matches have been moved forward yet.',
              'Approved and auto-submitted evidence matches will appear here after they leave review.'
            )
          ) : (
            renderMatchRows(autoSubmitted, 'Open recovery')
          )}
        </TabsContent>


        {/* Held / Rejected Tab */}
        <TabsContent value="held" className="mt-0 border-t border-white/5">
          {heldForReview.length === 0 ? (
            renderEmptyState(
              'Held',
              'No matches are currently being held.',
              'Items that need more evidence, seller review, or a manual follow-up will appear here.'
            )
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 backdrop-blur-xl divide-y divide-white/5">
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
            renderEmptyState(
              'All matches',
              'No claim-to-document matches are available yet.',
              'Refresh matching after more evidence arrives to rebuild the queue.',
              <Button
                onClick={handleRunMatching}
                className="h-10 px-6 font-sans text-[9px] font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors uppercase tracking-tight"
              >
                Refresh matching
              </Button>
            )
          ) : (
            renderMatchRows(matchingResults, 'Open record')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvidenceMatchingTable;
