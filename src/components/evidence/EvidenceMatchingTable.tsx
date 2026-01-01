import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  FileSearch
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SmartPromptCard } from './SmartPromptCard';

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
        setMatchingResults(response.data.results);
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

  useEffect(() => {
    fetchMatchingResults();
  }, []);

  // TEMPORARY: Show ALL matches in Needs Review for testing the UI
  const smartPrompts = useMemo(() =>
    matchingResults.filter(r => r.action_taken === 'smart_prompt' || r.action_taken === 'auto_submit' || r.action_taken === 'approved'),
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

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.85) {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded">High ({Math.round(score * 100)}%)</span>;
    } else if (score >= 0.5) {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded">Medium ({Math.round(score * 100)}%)</span>;
    } else {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Low ({Math.round(score * 100)}%)</span>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'auto_submit':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded">Auto-Submitted</span>;
      case 'approved':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded">Approved</span>;
      case 'smart_prompt':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded">Needs Review</span>;
      case 'rejected':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Rejected</span>;
      case 'no_action':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Held</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">{action}</span>;
    }
  };

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

  const renderResultsTable = (results: MatchingResult[], showActions: boolean = false) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow className="border-gray-200">
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Claim ID</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Document ID</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Match Type</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Confidence</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Status</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Matched At</TableHead>
            <TableHead className="text-[10px] font-medium text-gray-600 uppercase tracking-[0.1em]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id} className="border-gray-200 hover:bg-gray-50">
              <TableCell>
                <Button asChild variant="link" className="p-0 h-auto text-gray-900 hover:text-gray-900 font-mono">
                  <Link to={`/recoveries/${result.claim_id}`}>
                    {result.claim_id.substring(0, 12)}...
                  </Link>
                </Button>
              </TableCell>
              <TableCell>
                <Button asChild variant="link" className="p-0 h-auto text-gray-900 hover:text-gray-900 font-mono">
                  <Link to={`/documents/${result.document_id}`}>
                    {result.document_id.substring(0, 12)}...
                  </Link>
                </Button>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-700">{getMatchTypeLabel(result.match_type)}</span>
              </TableCell>
              <TableCell>
                {getConfidenceBadge(result.confidence_score)}
              </TableCell>
              <TableCell>
                {getActionBadge(result.action_taken)}
              </TableCell>
              <TableCell>
                {result.created_at ? (
                  <span className="text-sm text-gray-600">
                    {format(new Date(result.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showActions && result.action_taken === 'smart_prompt' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApproveSmartPrompt(result.id)}
                        disabled={processingIds.has(result.id)}
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      >
                        {processingIds.has(result.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectSmartPrompt(result.id)}
                        disabled={processingIds.has(result.id)}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button asChild variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                    <Link to={`/recoveries/${result.claim_id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading && matchingResults.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-sm text-gray-600">Loading matching results...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && matchingResults.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMatchingResults} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
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
        <div className="flex gap-2">
          <Button
            onClick={handleRunMatching}
            disabled={refreshing}
            className="bg-gray-700 hover:bg-gray-800 text-white"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {refreshing ? 'Running...' : 'Run Matching'}
          </Button>
          <Button
            onClick={fetchMatchingResults}
            variant="outline"
            size="sm"
            className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs for different match categories - Pentagon Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-auto items-center justify-start gap-6 bg-transparent border-b border-gray-200 rounded-none p-0">
          <TabsTrigger
            value="smart-prompts"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900"
          >
            Needs Review
            {smartPrompts.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{smartPrompts.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="auto-submitted"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900"
          >
            Auto-Submitted
            {autoSubmitted.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{autoSubmitted.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="held"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900"
          >
            Held / Rejected
            {heldForReview.length > 0 && (
              <span className="ml-2 text-[10px] text-gray-400">{heldForReview.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="relative px-1 pb-3 pt-1 text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-gray-900 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-px data-[state=active]:after:bg-gray-900"
          >
            All Matches
            <span className="ml-2 text-[10px] text-gray-400">{matchingResults.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Smart Prompts Tab - Card View */}
        <TabsContent value="smart-prompts" className="mt-4">
          {smartPrompts.length === 0 ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-800 mb-1">All caught up</p>
                <p className="text-sm text-gray-600 mb-4">
                  No matches need your review. High-confidence matches are auto-submitted.
                </p>
                <Button onClick={handleRunMatching} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Matching
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.1em]">
                    Pending Review
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {smartPrompts.length} invoice{smartPrompts.length !== 1 ? 's' : ''} need confirmation (50-85% confidence)
                  </p>
                </div>
              </div>

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
        <TabsContent value="auto-submitted" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-0">
              {autoSubmitted.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">No auto-submitted matches yet</p>
                  <p className="text-xs text-gray-500">
                    High-confidence matches (≥85%) will appear here
                  </p>
                </div>
              ) : (
                renderResultsTable(autoSubmitted)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Held / Rejected Tab */}
        <TabsContent value="held" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-0">
              {heldForReview.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">No held or rejected matches</p>
                  <p className="text-xs text-gray-500">
                    Low-confidence matches (&lt;50%) and rejections will appear here
                  </p>
                </div>
              ) : (
                renderResultsTable(heldForReview)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Matches Tab */}
        <TabsContent value="all" className="mt-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-0">
              {matchingResults.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">No matching results found</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Run evidence matching to match documents to claims
                  </p>
                  <Button onClick={handleRunMatching} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Matching
                  </Button>
                </div>
              ) : (
                renderResultsTable(matchingResults, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvidenceMatchingTable;
