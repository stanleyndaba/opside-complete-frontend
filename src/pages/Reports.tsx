import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Download, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

// Mock data for claims
const mockClaims = [
  {
    id: 'CLM-001',
    dateCreated: '2024-01-15',
    claimType: 'Lost Inventory',
    status: 'Paid',
    amountRecovered: 450.00,
    payoutDate: '2024-02-18',
    evidenceId: 'EVD-001'
  },
  {
    id: 'CLM-002',
    dateCreated: '2024-01-22',
    claimType: 'Fee Dispute',
    status: 'Pending',
    amountRecovered: 125.50,
    payoutDate: null,
    evidenceId: 'EVD-002'
  },
  {
    id: 'CLM-003',
    dateCreated: '2024-02-01',
    claimType: 'Damaged Goods',
    status: 'Paid',
    amountRecovered: 850.75,
    payoutDate: '2024-03-05',
    evidenceId: 'EVD-003'
  },
  {
    id: 'CLM-004',
    dateCreated: '2024-02-10',
    claimType: 'Lost Inventory',
    status: 'Submitted',
    amountRecovered: 320.00,
    payoutDate: null,
    evidenceId: 'EVD-004'
  },
  {
    id: 'CLM-005',
    dateCreated: '2024-02-15',
    claimType: 'Fee Dispute',
    status: 'Denied',
    amountRecovered: 0,
    payoutDate: null,
    evidenceId: 'EVD-005'
  },
  {
    id: 'CLM-006',
    dateCreated: '2024-03-01',
    claimType: 'Damaged Goods',
    status: 'Paid',
    amountRecovered: 1200.25,
    payoutDate: '2024-03-25',
    evidenceId: 'EVD-006'
  }
];

const claimTypes = ['Lost Inventory', 'Fee Dispute', 'Damaged Goods', 'Overcharge'];
const statusOptions = ['Pending', 'Submitted', 'Paid', 'Denied'];

type SortField = 'dateCreated' | 'claimType' | 'status' | 'amountRecovered' | 'payoutDate';
type SortDirection = 'asc' | 'desc';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('dateCreated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort data
  const filteredClaims = useMemo(() => {
    let filtered = mockClaims.filter(claim => {
      // Date filter
      const claimDate = new Date(claim.dateCreated);
      const dateInRange = (!dateRange.from || claimDate >= dateRange.from) && 
                         (!dateRange.to || claimDate <= dateRange.to);
      
      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.claimType);
      
      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      
      return dateInRange && typeMatch && statusMatch;
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
  }, [dateRange, selectedClaimTypes, selectedStatuses, sortField, sortDirection]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalRecovered = filteredClaims.reduce((sum, claim) => sum + claim.amountRecovered, 0);
    const claimsSubmitted = filteredClaims.length;
    const paidClaims = filteredClaims.filter(claim => claim.status === 'Paid').length;
    const successRate = claimsSubmitted > 0 ? (paidClaims / claimsSubmitted) * 100 : 0;
    
    // Calculate average recovery time (for paid claims only)
    const paidClaimsWithDates = filteredClaims.filter(claim => 
      claim.status === 'Paid' && claim.payoutDate
    );
    const avgRecoveryTime = paidClaimsWithDates.length > 0 
      ? paidClaimsWithDates.reduce((sum, claim) => {
          const created = new Date(claim.dateCreated);
          const paid = new Date(claim.payoutDate!);
          return sum + Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / paidClaimsWithDates.length
      : 0;

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
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
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

  const exportToCSV = () => {
    const headers = ['Claim ID', 'Date Created', 'Claim Type', 'Status', 'Amount Recovered', 'Payout Date'];
    const csvContent = [
      headers.join(','),
      ...filteredClaims.map(claim => [
        claim.id,
        claim.dateCreated,
        claim.claimType,
        claim.status,
        claim.amountRecovered,
        claim.payoutDate || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'recovery-reports.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <PageLayout title="Recovery Reports">
      <div className="container max-w-full p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Recovery Reports</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your recovery claims and performance metrics</p>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Recovered</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(keyMetrics.totalRecovered)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Claims Submitted</p>
                  <p className="text-2xl font-bold text-foreground">{keyMetrics.claimsSubmitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{keyMetrics.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Recovery Time</p>
                  <p className="text-2xl font-bold text-foreground">{keyMetrics.avgRecoveryTime} Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
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

              {/* Export Button */}
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('dateCreated')}>
                    <div className="flex items-center gap-2">
                      Claim ID
                      <SortIcon field="dateCreated" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('dateCreated')}>
                    <div className="flex items-center gap-2">
                      Date Created
                      <SortIcon field="dateCreated" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('claimType')}>
                    <div className="flex items-center gap-2">
                      Claim Type
                      <SortIcon field="claimType" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('amountRecovered')}>
                    <div className="flex items-center gap-2">
                      Amount Recovered
                      <SortIcon field="amountRecovered" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('payoutDate')}>
                    <div className="flex items-center gap-2">
                      Payout Date
                      <SortIcon field="payoutDate" />
                    </div>
                  </TableHead>
                  <TableHead>Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                        {claim.id}
                      </Button>
                    </TableCell>
                    <TableCell>{format(new Date(claim.dateCreated), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{claim.claimType}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(claim.amountRecovered)}</TableCell>
                    <TableCell>
                      {claim.payoutDate ? format(new Date(claim.payoutDate), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/evidence-locker/document/${claim.evidenceId}`}>
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
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