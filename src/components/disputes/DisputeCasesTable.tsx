import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Send, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    fetchCases(statusFilter !== 'all' ? statusFilter : undefined);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved' || statusLower === 'paid') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded"><CheckCircle2 className="w-3 h-3 mr-1 inline" />{status}</span>;
    } else if (statusLower === 'rejected' || statusLower === 'denied' || statusLower === 'failed') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded"><XCircle className="w-3 h-3 mr-1 inline" />{status}</span>;
    } else if (statusLower === 'pending' || statusLower === 'submitted') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded"><Clock className="w-3 h-3 mr-1 inline" />{status}</span>;
    } else if (statusLower === 'in_progress' || statusLower === 'filing') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded"><Clock className="w-3 h-3 mr-1 inline" />{status}</span>;
    } else {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">{status}</span>;
    }
  };

  const getFilingStatusBadge = (filingStatus?: string, filingError?: string) => {
    if (!filingStatus) return null;

    const statusLower = filingStatus.toLowerCase();
    if (statusLower === 'filed' || statusLower === 'submitted') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-white border border-slate-700 rounded-none font-mono uppercase tracking-wide">FILED</span>;
    } else if (statusLower === 'filing') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-slate-600 text-white border border-slate-500 rounded-none font-mono uppercase tracking-wide">FILING...</span>;
    } else if (statusLower === 'retrying') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-amber-800 text-white border border-amber-700 rounded-none font-mono uppercase tracking-wide">RETRYING</span>;
    } else if (statusLower === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-900 text-white border border-red-800 rounded-none font-mono uppercase tracking-wide cursor-help flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                FAILED
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[300px] bg-slate-900 text-white border-slate-700 rounded-none">
              <p className="text-xs font-mono">{filingError || 'Unknown error - check logs'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return <span className="text-[10px] px-1.5 py-0.5 bg-slate-500 text-white border border-slate-400 rounded-none font-mono uppercase tracking-wide">PENDING</span>;
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

    // Case already filed or approved - no action needed
    if (filingStatus === 'filed' || filingStatus === 'submitted' || filingStatus === 'approved') {
      return null;
    }

    // Failed case - show Retry button
    if (filingStatus === 'failed') {
      return (
        <Button
          onClick={() => handleRetryFiling(caseItem)}
          disabled={isProcessing}
          size="sm"
          className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-none text-[10px] font-mono uppercase tracking-wide">
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RotateCcw className="w-3 h-3 mr-1" />
          )}
          RETRY
        </Button>
      );
    }

    // Pending case - show File Now button
    if (filingStatus === 'pending' || !filingStatus) {
      return (
        <Button
          onClick={() => handleFileNow(caseItem)}
          disabled={isProcessing}
          size="sm"
          className="h-7 px-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-none text-[10px] font-mono uppercase tracking-wide">
          {isProcessing ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Send className="w-3 h-3 mr-1" />
          )}
          FILE NOW
        </Button>
      );
    }

    // Filing in progress
    if (filingStatus === 'filing' || filingStatus === 'retrying') {
      return (
        <span className="text-[10px] text-slate-500 font-mono uppercase">PROCESSING...</span>
      );
    }

    return null;
  };

  if (loading && cases.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-gray-600">Loading dispute cases...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && cases.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchCases()} variant="outline" size="sm">
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
      {/* Header with Filters */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-sm px-4 py-3">
        <div>
          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">DISPUTE CASES</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'} • Agent 7 Filing System
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white text-gray-700 border-gray-200 hover:bg-gray-50 rounded-sm">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
              <SelectItem value="approved" className="text-xs">Approved</SelectItem>
              <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            variant="outline"
            size="sm"
            className="h-8 bg-white text-gray-700 border-gray-200 hover:bg-gray-50 rounded-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cases Table */}
      <Card className="bg-white border-white rounded-sm">
        <CardContent className="p-0">
          {cases.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">No dispute cases found</p>
              <p className="text-xs text-gray-500">
                Cases will appear here after evidence matching
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Case #</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Claim ID</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Status</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Filing Status</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Amount</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Amazon Case</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3">Retries</TableHead>
                    <TableHead className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] py-3"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id || Math.random()} className="hover:bg-gray-50/50">
                      <TableCell className="py-3">
                        <span className="font-mono text-sm text-gray-900">{caseItem.case_number || '—'}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        {caseItem.claim_id ? (
                          <Button asChild variant="link" className="p-0 h-auto text-xs text-gray-600 hover:text-gray-900 font-mono">
                            <Link to={`/recoveries/${caseItem.claim_id}`}>
                              {caseItem.claim_id.substring(0, 12)}...
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(caseItem.status || 'unknown')}
                      </TableCell>
                      <TableCell className="py-3">
                        {getFilingStatusBadge(caseItem.filing_status, caseItem.filing_error)}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm font-mono tabular-nums text-gray-900">
                          {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {caseItem.amazon_case_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-600">{caseItem.amazon_case_id}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {caseItem.retry_count && caseItem.retry_count> 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-none font-mono">
                            {caseItem.retry_count}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          {renderFilingActions(caseItem)}
                          {caseItem.claim_id && (
                            <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Link to={`/recoveries/${caseItem.claim_id}`}>
                                <Eye className="w-4 h-4 text-gray-500" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

