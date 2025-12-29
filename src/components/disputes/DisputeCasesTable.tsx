import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
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
}

export function DisputeCasesTable() {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
        // Handle case where data is an array directly
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

  const getFilingStatusBadge = (filingStatus?: string) => {
    if (!filingStatus) return null;

    const statusLower = filingStatus.toLowerCase();
    if (statusLower === 'filed') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 border border-gray-200 rounded">Filed</span>;
    } else if (statusLower === 'filing') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Filing...</span>;
    } else if (statusLower === 'retrying') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Retrying</span>;
    } else if (statusLower === 'failed') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Failed</span>;
    } else {
      return <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">Pending</span>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
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
      {/* Header with Filters - Pentagon Style */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-sm px-4 py-3">
        <div>
          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Dispute Cases</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'} found
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
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
          className="h-8 bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>

      {/* Cases Table */ }
  <Card className="bg-white border-gray-200">
    <CardContent className="p-0">
      {cases.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">No dispute cases found</p>
          <p className="text-xs text-gray-500">
            Cases will appear here after evidence matching and filing
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Case Number</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Claim ID</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Amazon Case ID</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Retries</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Created</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Exp Payout</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wide py-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((caseItem) => (
                <TableRow key={caseItem.id || Math.random()} className="border-gray-200 hover:bg-gray-50">
                  <TableCell className="py-2">
                    <span className="font-mono text-xs text-gray-900">{caseItem.case_number || '—'}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    {caseItem.claim_id ? (
                      <Button asChild variant="link" className="p-0 h-auto text-xs text-gray-900 hover:text-gray-900 font-mono">
                        <Link to={`/recoveries/${caseItem.claim_id}`}>
                          {caseItem.claim_id.substring(0, 12)}...
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {getStatusBadge(caseItem.status || 'unknown')}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-xs font-semibold text-gray-900">
                      {formatCurrency(caseItem.amount || 0, caseItem.currency || 'USD')}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    {caseItem.amazon_case_id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-gray-700">{caseItem.amazon_case_id}</span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {caseItem.retry_count && caseItem.retry_count > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">
                        {caseItem.retry_count}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-xs text-gray-600">
                      {caseItem.created_at ? format(new Date(caseItem.created_at), 'MMM dd, yyyy') : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-xs text-gray-600">
                      {(caseItem as any).expected_payout_date ? format(new Date((caseItem as any).expected_payout_date), 'MMM dd, yyyy') : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    {caseItem.claim_id ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/recoveries/${caseItem.claim_id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
    </div >
  );
}

