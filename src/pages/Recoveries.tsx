import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Clock, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RecoveryCase {
  id: string;
  title: string;
  guaranteedAmount: number;
  payoutDate: string;
  status: 'Guaranteed' | 'Submitted' | 'Under Review' | 'Paid Out' | 'Awaiting Approval';
  createdDate: string;
  amazonCaseId?: string;
  sku: string;
  facility: string;
}

// Mock data for demonstration
const mockCases: RecoveryCase[] = [
  {
    id: 'OPS-12345',
    title: '5 units of Premium Wireless Headphones lost at FTW1',
    guaranteedAmount: 324.50,
    payoutDate: '2025-01-15',
    status: 'Guaranteed',
    createdDate: '2025-01-08',
    sku: 'WH-PREM-001',
    facility: 'FTW1'
  },
  {
    id: 'OPS-12346',
    title: '12 units of Organic Coffee Beans damaged at LAX7',
    guaranteedAmount: 168.00,
    payoutDate: '2025-01-12',
    status: 'Submitted',
    createdDate: '2025-01-05',
    amazonCaseId: '1234567890',
    sku: 'COF-ORG-500',
    facility: 'LAX7'
  },
  {
    id: 'OPS-12347',
    title: '3 units of Smart Home Security System lost at ATL2',
    guaranteedAmount: 597.99,
    payoutDate: '2025-01-10',
    status: 'Paid Out',
    createdDate: '2024-12-28',
    amazonCaseId: '1234567891',
    sku: 'SH-SEC-PRO',
    facility: 'ATL2'
  },
  {
    id: 'OPS-12348',
    title: '8 units of Fitness Tracker Band lost at PHX3',
    guaranteedAmount: 239.92,
    payoutDate: '2025-01-18',
    status: 'Awaiting Approval',
    createdDate: '2025-01-08',
    sku: 'FIT-TRK-001',
    facility: 'PHX3'
  },
  {
    id: 'OPS-12349',
    title: '15 units of Bamboo Kitchen Utensils damaged at DFW7',
    guaranteedAmount: 134.85,
    payoutDate: '2025-01-14',
    status: 'Under Review',
    createdDate: '2025-01-06',
    amazonCaseId: '1234567892',
    sku: 'KIT-BAM-SET',
    facility: 'DFW7'
  }
];

const getStatusColor = (status: RecoveryCase['status']) => {
  switch (status) {
    case 'Guaranteed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Under Review':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Paid Out':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Awaiting Approval':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function Recoveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Calculate KPIs
  const totalCapitalGuaranteed = mockCases
    .filter(c => c.status !== 'Paid Out')
    .reduce((sum, c) => sum + c.guaranteedAmount, 0);

  const totalPaidOut = mockCases
    .filter(c => c.status === 'Paid Out')
    .reduce((sum, c) => sum + c.guaranteedAmount, 0);

  const averageRecoveryTime = '14.2 days';
  const successRate = 94.8;

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    let filtered = mockCases.filter(case_ => {
      const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort cases
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    } else if (sortBy === 'amount') {
      filtered.sort((a, b) => b.guaranteedAmount - a.guaranteedAmount);
    } else if (sortBy === 'payout') {
      filtered.sort((a, b) => new Date(a.payoutDate).getTime() - new Date(b.payoutDate).getTime());
    }

    return filtered;
  }, [searchTerm, statusFilter, sortBy]);

  return (
    <PageLayout title="Recovery Command Center">
      <div className="space-y-6">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Capital Guaranteed"
            value={`$${totalCapitalGuaranteed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description="Active pipeline value"
            icon={<DollarSign className="h-4 w-4" />}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
          />
          
          <StatsCard
            title="Total Paid Out (Last 12 Months)"
            value={`$${(totalPaidOut + 45678.90).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description="Successfully recovered"
            icon={<CheckCircle className="h-4 w-4" />}
            trend={12.5}
            trendLabel="vs prev 12mo"
            className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
          />
          
          <StatsCard
            title="Average Recovery Time"
            value={averageRecoveryTime}
            description="From guarantee to payout"
            icon={<Clock className="h-4 w-4" />}
            trend={-8.2}
            trendLabel="improvement"
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
          />
          
          <StatsCard
            title="Overall Success Rate"
            value={`${successRate}%`}
            description="Guaranteed funds recovered"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={2.1}
            trendLabel="this quarter"
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
          />
        </div>

        {/* Case File Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl font-semibold">Case Files</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases, SKU, or Case ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Guaranteed">Guaranteed</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Paid Out">Paid Out</SelectItem>
                    <SelectItem value="Awaiting Approval">Awaiting Approval</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="payout">Payout Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Guaranteed Amount</TableHead>
                    <TableHead>Payout Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((case_) => (
                    <TableRow key={case_.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{case_.id}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={case_.title}>
                          {case_.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          SKU: {case_.sku} • {case_.facility}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${case_.guaranteedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(case_.payoutDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        {case_.status !== 'Paid Out' && (
                          <div className="text-xs text-muted-foreground">
                            ~{Math.ceil((new Date(case_.payoutDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getStatusColor(case_.status))}>
                          {case_.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/recoveries/${case_.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {case_.status === 'Awaiting Approval' && (
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              Approve & File
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredCases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No cases found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}