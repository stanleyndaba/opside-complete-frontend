import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import type { DateRange } from 'react-day-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { useStatusStream } from '@/hooks/useStatusStream';
import { toast } from 'sonner';

interface RecoveryRow {
  id: string;
  created: string;
  type: string;
  details: string;
  status: string;
  guaranteedAmount: number;
  approvedAmount?: number;
  predictedPayout?: string | null;
  expected_payout_date?: string | null;
  sku: string;
  asin: string;
}

const claimTypes = ['Lost Inventory', 'Fee Dispute', 'Damaged Goods', 'Overcharge'];
const statusOptions = ['New', 'Pending', 'Submitted', 'Paid', 'Denied'];

export default function Recoveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [recoveries, setRecoveries] = useState<RecoveryRow[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchRecoveries = useCallback(async () => {
    try {
      setLoadingList(true);
      const data = await apiClient.get<RecoveryRow[]>('/api/recoveries');
      setRecoveries(data);
    } catch (e) {
      toast.error('Failed to load recoveries');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchRecoveries();
  }, [fetchRecoveries]);

  // Filter data based on search and filters
  const filteredClaims = useMemo(() => {
    let filtered = recoveries.filter(claim => {
      // Search filter
      const searchMatch = !searchTerm || 
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filter
      const claimDate = new Date(claim.created);
      const dateMatch = (!dateRange?.from || claimDate >= dateRange.from) && 
                       (!dateRange?.to || claimDate <= dateRange.to);
      
      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.type);
      
      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      
      return searchMatch && dateMatch && typeMatch && statusMatch;
    });

    return filtered;
  }, [searchTerm, dateRange, selectedClaimTypes, selectedStatuses]);

  // Real-time recovery updates via WS/SSE; updates row statuses instantly
  useStatusStream({
    onRecovery: (e) => {
      setRecoveries(prev => prev.map(r => r.id === e.id ? { ...r, status: e.status } : r));
      const s = e.status.toLowerCase();
      if (s === 'submitted') toast.success(`Claim ${e.id} submitted`);
      else if (s === 'paid' || s === 'paid_out') toast.success(`Claim ${e.id} paid`);
      else if (s === 'denied' || s === 'failed') toast.error(`Claim ${e.id} ${s}`);
    }
  });

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalClaimsFound = filteredClaims.length;
    const currentlyInProgress = filteredClaims.filter(claim => 
      ['New', 'Pending', 'Submitted'].includes(claim.status)
    ).length;
    const valueInProgress = filteredClaims
      .filter(claim => ['New', 'Pending', 'Submitted'].includes(claim.status))
      .reduce((sum, claim) => sum + claim.guaranteedAmount, 0);
    
    // Calculate 30-day success rate from all claims
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentClaims = recoveries.filter(claim => 
      new Date(claim.created) >= thirtyDaysAgo
    );
    const successfulClaims = recentClaims.filter(claim => claim.status === 'Paid');
    const successRate = recentClaims.length > 0 
      ? (successfulClaims.length / recentClaims.length) * 100 
      : 0;

    return {
      totalClaimsFound,
      currentlyInProgress,
      valueInProgress,
      successRate
    };
  }, [filteredClaims]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Submitted': return 'bg-purple-100 text-purple-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const setQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'quarter':
        setDateRange({ from: startOfQuarter(now), to: now });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: now });
        break;
      case 'all':
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  // Selection logic
  const toggleSelect = (id: string, checked: boolean | string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };
  const toggleSelectAll = (checked: boolean | string) => {
    setSelectedIds(prev => {
      if (checked) return new Set(filteredClaims.map(c => c.id));
      return new Set();
    });
  };
  const allSelected = filteredClaims.length > 0 && filteredClaims.every(c => selectedIds.has(c.id));

  const updateRowStatus = (id: string, status: string) => {
    setRecoveries(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };
  const submitSingleClaim = async (id: string) => {
    try {
      setSubmittingIds(prev => new Set(prev).add(id));
      await apiClient.post(`/api/claims/${id}/submit`);
      updateRowStatus(id, 'Submitted');
      toast.success(`Claim ${id} submitted`);
    } catch {
      toast.error(`Failed to submit ${id}`);
    } finally {
      setSubmittingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };
  const bulkSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.message('Please select at least one claim');
      return;
    }
    toast.info(`Submitting ${selectedIds.size} claim(s)…`);
    for (const id of Array.from(selectedIds)) {
      // eslint-disable-next-line no-await-in-loop
      await submitSingleClaim(id);
    }
    toast.success('Bulk submit completed');
  };

  return (
    <PageLayout title="All Recoveries">
      <div className="container max-w-full p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">All Recoveries</h1>
          <p className="text-muted-foreground">Comprehensive view of all recovery claims and their current status</p>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Claims Found</p>
                  <p className="text-2xl font-bold text-foreground">{keyMetrics.totalClaimsFound}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currently in Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{keyMetrics.currentlyInProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value in Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(keyMetrics.valueInProgress)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">30-Day Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{keyMetrics.successRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Claim ID, ASIN, or Keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick Date Range Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('quarter')}>Last Quarter</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>This Year</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickDateRange('all')}>All Time</Button>
              </div>

              {/* Custom Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Claim Type Filter */}
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Claim Type" />
                </SelectTrigger>
                <SelectContent>
                  {claimTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="p-3 flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={bulkSubmit}>
                <Send className="h-4 w-4" />
                Auto-Submit Selected
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guaranteed Amount</TableHead>
                  <TableHead>Approved Amount</TableHead>
                  <TableHead>Expected Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="w-[40px]">
                      <Checkbox checked={selectedIds.has(claim.id)} onCheckedChange={(c) => toggleSelect(claim.id, c)} aria-label={`Select ${claim.id}`} />
                    </TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 font-mono">
                        {claim.id}
                      </Button>
                    </TableCell>
                    <TableCell>{format(new Date(claim.created), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={claim.details}>
                        {claim.details}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SKU: {claim.sku} • ASIN: {claim.asin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(claim.guaranteedAmount)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(claim.approvedAmount ?? claim.guaranteedAmount)}</TableCell>
                    <TableCell>
                      {claim.expected_payout_date ? format(new Date(claim.expected_payout_date), 'MMM dd, yyyy') : (claim.predictedPayout ? format(new Date(claim.predictedPayout), 'MMM dd, yyyy') : '-')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={submittingIds.has(claim.id)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/recoveries/${claim.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => submitSingleClaim(claim.id)} disabled={submittingIds.has(claim.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            {submittingIds.has(claim.id) ? 'Submitting…' : 'Submit Claim'}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/evidence-locker`} className="flex items-center gap-2">
                              <FileText className="h-4 w-4" /> Evidence Locker
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}