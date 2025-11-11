import React, { useState, useMemo, Suspense, lazy } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Download, ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, TrendingUp } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

// Chart skeleton loader
const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
);

// Lazy-loaded chart component for better code splitting
const RecoveryChart = lazy(() => 
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ date: string; value: number }> }) => {
      const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = recharts;
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="value" fill="#60A5FA" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Mock data for claims
const mockClaims = [{
  id: 'CLM-001',
  dateCreated: '2024-01-15',
  claimType: 'Lost Inventory',
  status: 'Paid',
  amountRecovered: 450.00,
  payoutDate: '2024-02-18',
  evidenceId: 'EVD-001'
}, {
  id: 'CLM-002',
  dateCreated: '2024-01-22',
  claimType: 'Fee Dispute',
  status: 'Pending',
  amountRecovered: 125.50,
  payoutDate: null,
  evidenceId: 'EVD-002'
}, {
  id: 'CLM-003',
  dateCreated: '2024-02-01',
  claimType: 'Damaged Goods',
  status: 'Paid',
  amountRecovered: 850.75,
  payoutDate: '2024-03-05',
  evidenceId: 'EVD-003'
}, {
  id: 'CLM-004',
  dateCreated: '2024-02-10',
  claimType: 'Lost Inventory',
  status: 'Submitted',
  amountRecovered: 320.00,
  payoutDate: null,
  evidenceId: 'EVD-004'
}, {
  id: 'CLM-005',
  dateCreated: '2024-02-15',
  claimType: 'Fee Dispute',
  status: 'Denied',
  amountRecovered: 0,
  payoutDate: null,
  evidenceId: 'EVD-005'
}, {
  id: 'CLM-006',
  dateCreated: '2024-03-01',
  claimType: 'Damaged Goods',
  status: 'Paid',
  amountRecovered: 1200.25,
  payoutDate: '2024-03-25',
  evidenceId: 'EVD-006'
}];
const claimTypes = ['Lost Inventory', 'Fee Dispute', 'Damaged Goods', 'Overcharge'];
const statusOptions = ['Pending', 'Submitted', 'Paid', 'Denied'];
type SortField = 'dateCreated' | 'claimType' | 'status' | 'amountRecovered' | 'payoutDate';
type SortDirection = 'asc' | 'desc';
export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('dateCreated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [reportType, setReportType] = useState<'' | 'recovery_payout' | 'fee_dispute' | 'evidence_log'>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter and sort data
  const filteredClaims = useMemo(() => {
    let filtered = mockClaims.filter(claim => {
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || claim.id.toLowerCase().includes(term) || claim.claimType.toLowerCase().includes(term) || claim.status.toLowerCase().includes(term);
      // Date filter
      const claimDate = new Date(claim.dateCreated);
      const dateInRange = (!dateRange.from || claimDate >= dateRange.from) && (!dateRange.to || claimDate <= dateRange.to);

      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.claimType);

      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      return dateInRange && typeMatch && statusMatch && matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (sortField === 'dateCreated' || sortField === 'payoutDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      if (sortField === 'amountRecovered') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return filtered;
  }, [dateRange, selectedClaimTypes, selectedStatuses, sortField, sortDirection, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, page, pageSize]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalRecovered = filteredClaims.reduce((sum, claim) => sum + claim.amountRecovered, 0);
    const claimsSubmitted = filteredClaims.length;
    const paidClaims = filteredClaims.filter(claim => claim.status === 'Paid').length;
    const successRate = claimsSubmitted > 0 ? paidClaims / claimsSubmitted * 100 : 0;

    // Calculate average recovery time (for paid claims only)
    const paidClaimsWithDates = filteredClaims.filter(claim => claim.status === 'Paid' && claim.payoutDate);
    const avgRecoveryTime = paidClaimsWithDates.length > 0 ? paidClaimsWithDates.reduce((sum, claim) => {
      const created = new Date(claim.dateCreated);
      const paid = new Date(claim.payoutDate!);
      return sum + Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0) / paidClaimsWithDates.length : 0;
    return {
      totalRecovered,
      claimsSubmitted,
      successRate,
      avgRecoveryTime: Math.round(avgRecoveryTime)
    };
  }, [filteredClaims]);
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        setDateRange({
          from: subDays(now, 30),
          to: now
        });
        break;
      case 'quarter':
        setDateRange({
          from: startOfQuarter(now),
          to: now
        });
        break;
      case 'year':
        setDateRange({
          from: startOfYear(now),
          to: now
        });
        break;
      case 'all':
        setDateRange({
          from: undefined,
          to: undefined
        });
        break;
    }
  };
  const exportToCSV = () => {
    const headers = ['Claim ID', 'Date Created', 'Claim Type', 'Status', 'Amount Recovered', 'Payout Date'];
    const csvContent = [headers.join(','), ...filteredClaims.map(claim => [claim.id, claim.dateCreated, claim.claimType, claim.status, claim.amountRecovered, claim.payoutDate || ''].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const filename = reportType === 'fee_dispute' ? 'fee-dispute-history.csv' : reportType === 'evidence_log' ? 'evidence-locker-log.csv' : 'recovery-payout-history.csv';
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const exportAction = () => {
    if (exportFormat === 'csv') exportToCSV();
    if (exportFormat === 'pdf') window.print();
    setExportOpen(false);
  };
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return filteredClaims.map(c => ({ 
      date: format(new Date(c.dateCreated), 'MMM dd'), 
      value: c.amountRecovered 
    }));
  }, [filteredClaims]);

  const SortIcon = React.memo(({
    field
  }: {
    field: SortField;
  }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  });
  return <PageLayout title="Reports">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-300 space-y-8">
        {/* Page Header & Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">Reports</h1>
            <p className="text-gray-400">Historical clarity and financial reconciliation</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Input placeholder="Search claims (ID, type, status)" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} className="pl-8 md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
              <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('quarter')}>This Quarter</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('year')}>Year to Date</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left font-medium bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100", !dateRange && "text-blue-700") }>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? dateRange.to ? <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </> : format(dateRange.from, "LLL dd, y") : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Button onClick={() => setExportOpen(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white">
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative inline-flex items-start">
                    <p className="text-sm font-medium text-gray-400">Total Recovered</p>
                    <div className="absolute -top-0.5 left-full ml-1.5 flex items-center gap-0.5 leading-none">
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                      <span className="text-[8px] text-red-500 font-medium">8%</span>
                      <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                      <span className="text-[8px] text-green-600 font-medium">92%</span>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-400 text-lg mt-1">{formatCurrency(keyMetrics.totalRecovered)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Claims Submitted</p>
                  <p className="font-bold text-gray-100 text-lg">{keyMetrics.claimsSubmitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative inline-flex items-start">
                    <p className="text-sm font-medium text-gray-400">Success Rate</p>
                    <div className="absolute -top-0.5 left-full ml-1.5 flex items-center gap-0.5 leading-none">
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                      <span className="text-[8px] text-red-500 font-medium">8%</span>
                      <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                      <span className="text-[8px] text-green-600 font-medium">92%</span>
                    </div>
                  </div>
                  <p className="font-bold text-blue-400 text-lg mt-1">{keyMetrics.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg. Recovery Time</p>
                  <p className="font-bold text-gray-100 text-lg">{keyMetrics.avgRecoveryTime} Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Summary already shown above */}

        {/* Visual Breakdown: Recoveries Over Time */}
        <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Recoveries Over Time</h3>
            <div className="w-full h-64 gpu-accelerated">
              <Suspense fallback={<ChartSkeleton />}>
                <RecoveryChart data={chartData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown: Recoveries by Claim Type */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Recoveries by Claim Type</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Claims Filed</TableHead>
                  <TableHead>Amount Recovered</TableHead>
                  <TableHead>% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const totalsByType: Record<string, { count: number; amount: number }> = {};
                  filteredClaims.forEach(c => {
                    totalsByType[c.claimType] = totalsByType[c.claimType] || { count: 0, amount: 0 };
                    totalsByType[c.claimType].count += 1;
                    totalsByType[c.claimType].amount += c.amountRecovered;
                  });
                  const grandTotal = Object.values(totalsByType).reduce((s, t) => s + t.amount, 0);
                  return Object.entries(totalsByType).map(([type, t]) => (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell>{t.count}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>
                      <TableCell>{grandTotal > 0 ? ((t.amount / grandTotal) * 100).toFixed(1) : '0.0'}%</TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-gray-400">Page {page} of {totalPages} • {filteredClaims.length} claims</div>
              <div className="flex items-center gap-3">
                <select className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>Select what format you want to export.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Select Report Type</p>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a report to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recovery_payout">Recovery and Payout History — Master report for all financial reconciliation</SelectItem>
                  <SelectItem value="fee_dispute">Fee Dispute History — Value recovered from fee overcharges</SelectItem>
                  <SelectItem value="evidence_log">Evidence Locker Log — Inventory of all uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Detailed CSV</SelectItem>
                <SelectItem value="pdf">PDF Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={exportAction} disabled={!reportType}>Generate & Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>;
}