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
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />{status}</Badge>;
    } else if (statusLower === 'rejected' || statusLower === 'denied' || statusLower === 'failed') {
      return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    } else if (statusLower === 'pending' || statusLower === 'submitted') {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    } else if (statusLower === 'in_progress' || statusLower === 'filing') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  const getFilingStatusBadge = (filingStatus?: string) => {
    if (!filingStatus) return null;

    const statusLower = filingStatus.toLowerCase();
    if (statusLower === 'filed') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Filed</Badge>;
    } else if (statusLower === 'filing') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Filing...</Badge>;
    } else if (statusLower === 'retrying') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Retrying</Badge>;
    } else if (statusLower === 'failed') {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pending</Badge>;
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
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dispute Cases</h3>
          <p className="text-sm text-gray-600">
            {cases.length} {cases.length === 1 ? 'case' : 'cases'} found
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fetchCases(statusFilter !== 'all' ? statusFilter : undefined)}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Cases Table */}
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
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-900 font-semibold">Case Number</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Claim ID</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Filing Status</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Amount</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Amazon Case ID</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Retries</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Created</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        <span className="font-mono text-sm text-gray-900">{caseItem.case_number}</span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="link" className="p-0 h-auto text-gray-900 hover:text-gray-900 font-mono">
                          <Link to={`/recoveries/${caseItem.claim_id}`}>
                            {caseItem.claim_id.substring(0, 12)}...
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(caseItem.status)}
                      </TableCell>
                      <TableCell>
                        {getFilingStatusBadge(caseItem.filing_status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(caseItem.amount, caseItem.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {caseItem.amazon_case_id ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-700">{caseItem.amazon_case_id}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {caseItem.retry_count && caseItem.retry_count > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {caseItem.retry_count}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(new Date(caseItem.created_at), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/recoveries/${caseItem.claim_id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
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

