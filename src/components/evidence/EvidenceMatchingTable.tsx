import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MatchingResult {
  id: string;
  claim_id: string;
  document_id: string;
  confidence_score: number;
  match_type: string;
  action_taken: 'auto_submit' | 'smart_prompt' | 'no_action';
  created_at?: string;
}

export function EvidenceMatchingTable() {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    fetchMatchingResults();
  }, []);

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.85) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">High ({Math.round(score * 100)}%)</Badge>;
    } else if (score >= 0.5) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Medium ({Math.round(score * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Low ({Math.round(score * 100)}%)</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'auto_submit':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" />Auto-Submitted</Badge>;
      case 'smart_prompt':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Clock className="w-3 h-3 mr-1" />Smart Prompt</Badge>;
      case 'no_action':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Held for Review</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{action}</Badge>;
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
    };
    return labels[matchType] || matchType;
  };

  if (loading && matchingResults.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 text-center">
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Evidence Matching Results</h3>
          <p className="text-sm text-gray-600">
            {matchingResults.length} {matchingResults.length === 1 ? 'match' : 'matches'} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRunMatching}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            {refreshing ? 'Running...' : 'Run Matching'}
          </Button>
          <Button
            onClick={fetchMatchingResults}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Matching Results Table */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-0">
          {matchingResults.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">No matching results found</p>
              <p className="text-xs text-gray-500 mb-4">
                Run evidence matching to match evidence documents to claims
              </p>
              <Button onClick={handleRunMatching} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Matching
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-900 font-semibold">Claim ID</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Document ID</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Match Type</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Confidence</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Action Taken</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Matched At</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchingResults.map((result) => (
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
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/recoveries/${result.claim_id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/documents/${result.document_id}`}>
                              <FileText className="w-4 h-4" />
                            </Link>
                          </Button>
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

