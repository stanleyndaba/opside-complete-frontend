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
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import type { DateRange } from 'react-day-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, buildQuery } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useEffect, useMemo as useReactMemo } from 'react';
import { subscribeRealtime, type RealtimeEvent } from '@/lib/realtime';

type Recovery = {
  id: string;
  created: string;
  type: string;
  details: string;
  status: string;
  guaranteedAmount: number;
  expected_payout_date?: string | null;
  sku?: string;
  asin?: string;
};

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
  const [claims, setClaims] = useState<typeof mockClaims>(mockClaims);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resData, metricsRes] = await Promise.all([
        recoveryApi.getRecoveries().catch(() => null),
        api.getRecoveriesMetrics(),
      ]);
      if (!cancelled) {
        if (resData && Array.isArray(resData)) {
          setClaims(resData as any);
          setError(null);
        } else {
          setError(null);
        }
        if (metricsRes.ok && metricsRes.data) {
          setMetrics(metricsRes.data);
          setMetricsError(null);
          setMetricsLoaded(true);
        } else {
          setMetricsError(metricsRes.error || null);
          setMetricsLoaded(true);
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Real-time recovery status updates; update table rows on the fly
  useStatusStream((evt) => {
    if (evt.type === 'recovery') {
      setClaims(prev => prev.map(c => c.id === evt.id ? { ...c, status: evt.status } as any : c));
    }
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

  const { data: recoveries = [] } = useQuery<Recovery[]>({
    queryKey: ['recoveries', { searchTerm, selectedClaimTypes, selectedStatuses, dateRange }],
    queryFn: async () => {
      const qs = buildQuery({
        q: searchTerm,
        type: selectedClaimTypes.join(','),
        status: selectedStatuses.join(','),
        from: dateRange?.from ? dateRange.from.toISOString() : undefined,
        to: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });
      return apiFetch<Recovery[]>(`/api/recoveries${qs}`);
    },
    refetchInterval: false,
  });

  // Realtime updates: listen for recovery status changes and refresh list
  useEffect(() => {
    const unsub = subscribeRealtime((evt: RealtimeEvent) => {
      if (evt.type === 'recovery') {
        setLiveEventsTs(prev => ({ ...prev, [evt.id]: Date.now() }));
        queryClient.invalidateQueries({ queryKey: ['recoveries'] });
      }
    });
    return () => unsub();
  }, [queryClient]);

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allSelected = filteredClaims.length > 0 && filteredClaims.every(c => selectedIds.has(c.id));
  const toggleAll = (checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) return new Set(filteredClaims.map(c => c.id));
      return new Set();
    });
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const queryClient = useQueryClient();
  const [liveOnly, setLiveOnly] = useState(true);
  const [liveEventsTs, setLiveEventsTs] = useState<Record<string, number>>({});
  const submitClaim = async (id: string) => {
    try {
      await apiFetch(`/api/claims/${id}/submit`, { method: 'POST', body: JSON.stringify({}) });
      toast.success(`Submitted claim ${id}`);
      // refresh recoveries list to reflect latest status
      queryClient.invalidateQueries({ queryKey: ['recoveries'] });
    } catch (e: any) {
      toast.error(`Failed to submit ${id}: ${e?.message || 'Error'}`);
    }
  };
  const [bulkLoading, setBulkLoading] = useState(false);
  const onBulkSubmit = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    // Process sequentially to reduce backend spikes; show toast per result
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await submitClaim(id);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setBulkLoading(false);
  };

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
  }, [claims, searchTerm, dateRange, selectedClaimTypes, selectedStatuses]);

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
  }, [filteredClaims, claims]);

  // Live filter projection of table rows
  const nowTs = Date.now();
  const liveFilteredClaims = useReactMemo(() => {
    if (!liveOnly) return filteredClaims;
    const windowMs = 5 * 60 * 1000;
    return filteredClaims.filter(c => {
      const ts = liveEventsTs[c.id];
      return ts && (nowTs - ts) <= windowMs;
    });
  }, [filteredClaims, liveOnly, liveEventsTs, nowTs]);

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
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" disabled={selectedIds.size === 0 || submittingBulk} onClick={async () => {
              setSubmittingBulk(true);
              const ids = Array.from(selectedIds);
              for (const id of ids) {
                try {
                  await recoveryApi.submitClaim(id);
                  toast({ title: `Submitted ${id}`, description: 'Claim submitted successfully.' });
                  setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'Submitted' } : c));
                } catch (e: any) {
                  toast({ title: `Failed to submit ${id}`, description: e?.message || 'Please try again.' });
                }
              }
              setSubmittingBulk(false);
            }}>Auto-Submit Selected</Button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            )}
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Claims Found</p>
                  <p className="text-2xl font-bold text-foreground">{metrics ? metrics.totalClaimsFound : keyMetrics.totalClaimsFound}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currently in Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics ? metrics.inProgress : keyMetrics.currentlyInProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value in Progress</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics ? metrics.valueInProgress : keyMetrics.valueInProgress)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">30-Day Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{metrics ? Math.round(metrics.successRate30d) : keyMetrics.successRate.toFixed(0)}%</p>
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

              {/* Live Only Toggle */}
              <div className="flex items-center gap-2 ml-2">
                <Switch checked={liveOnly} onCheckedChange={(v) => setLiveOnly(Boolean(v))} />
                <span className="text-sm text-muted-foreground">Live updates only (last 5 min)</span>
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

              {/* Bulk Actions */}
              <div className="ml-auto flex gap-2">
                <Button onClick={onBulkSubmit} disabled={selectedIds.size === 0 || bulkLoading} title="Submit selected claims automatically">
                  {bulkLoading ? 'Submitting…' : `Auto-Claim Selected (${selectedIds.size})`}
                </Button>
              </div>
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
                  <TableHead className="w-8">
                    <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} aria-label="Select all" />
                  </TableHead>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guaranteed Amount</TableHead>
                  <TableHead>Expected Payout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(liveOnly ? liveFilteredClaims : filteredClaims).map((claim) => (
                  <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="w-8" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(claim.id)} onCheckedChange={(v) => toggleOne(claim.id, Boolean(v))} aria-label={`Select ${claim.id}`} />
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(claim.id)} onCheckedChange={(checked) => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(claim.id); else next.delete(claim.id);
                          return next;
                        });
                      }} />
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 font-mono">
                        <Link to={`/recoveries/${claim.id}`}>{claim.id}</Link>
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
                      {claim.expected_payout_date ? format(new Date(claim.expected_payout_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={submittingIds.has(claim.id)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => submitClaim(claim.id)}>
                            Auto-Claim
                          </DropdownMenuItem>
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
                          {/* Evidence Locker link hidden for now */}
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