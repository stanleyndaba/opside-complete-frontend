import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Clock, DollarSign, TrendingUp, CheckCircle, AlertTriangle, Target, Shield, Scale } from 'lucide-react';
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

interface FeeDispute {
  id: string;
  productAsin: string;
  sku: string;
  disputeType: string;
  dateOfOvercharge: string;
  chargedAmount: number;
  correctAmount: number;
  potentialRecovery: number;
  status: 'Detected' | 'Awaiting Verification' | 'Dispute Filed' | 'Won' | 'Lost';
  productTitle: string;
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

// Mock data for fee disputes
const mockFeeDisputes: FeeDispute[] = [
  {
    id: 'FD-001',
    productAsin: 'B08K2XR456',
    sku: 'WH-PREM-001',
    productTitle: 'Premium Wireless Headphones',
    disputeType: 'FBA Fulfillment Fee - Incorrect Weight Tier',
    dateOfOvercharge: '2025-01-06',
    chargedAmount: 5.75,
    correctAmount: 4.25,
    potentialRecovery: 1.50,
    status: 'Detected'
  },
  {
    id: 'FD-002',
    productAsin: 'B07G3XN789',
    sku: 'COF-ORG-500',
    productTitle: 'Organic Coffee Beans 500g',
    disputeType: 'FBA Storage Fee - Incorrect Dimensions',
    dateOfOvercharge: '2025-01-05',
    chargedAmount: 2.35,
    correctAmount: 1.85,
    potentialRecovery: 0.50,
    status: 'Dispute Filed'
  },
  {
    id: 'FD-003',
    productAsin: 'B09M1ST234',
    sku: 'SH-SEC-PRO',
    productTitle: 'Smart Home Security System',
    disputeType: 'FBA Fulfillment Fee - Incorrect Size Category',
    dateOfOvercharge: '2025-01-04',
    chargedAmount: 8.95,
    correctAmount: 6.45,
    potentialRecovery: 2.50,
    status: 'Won'
  },
  {
    id: 'FD-004',
    productAsin: 'B06H4RT567',
    sku: 'FIT-TRK-001',
    productTitle: 'Fitness Tracker Band',
    disputeType: 'FBA Fulfillment Fee - Incorrect Weight Tier',
    dateOfOvercharge: '2025-01-03',
    chargedAmount: 3.25,
    correctAmount: 2.75,
    potentialRecovery: 0.50,
    status: 'Awaiting Verification'
  },
  {
    id: 'FD-005',
    productAsin: 'B05K7YU890',
    sku: 'KIT-BAM-SET',
    productTitle: 'Bamboo Kitchen Utensils Set',
    disputeType: 'FBA Storage Fee - Incorrect Volume',
    dateOfOvercharge: '2025-01-02',
    chargedAmount: 1.95,
    correctAmount: 1.45,
    potentialRecovery: 0.50,
    status: 'Dispute Filed'
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

const getFeeDisputeStatusColor = (status: FeeDispute['status']) => {
  switch (status) {
    case 'Detected':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Awaiting Verification':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Dispute Filed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Won':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Lost':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function Recoveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [feeSearchTerm, setFeeSearchTerm] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('recovery-center');

  // Calculate KPIs
  const totalCapitalGuaranteed = mockCases
    .filter(c => c.status !== 'Paid Out')
    .reduce((sum, c) => sum + c.guaranteedAmount, 0);

  const totalPaidOut = mockCases
    .filter(c => c.status === 'Paid Out')
    .reduce((sum, c) => sum + c.guaranteedAmount, 0);

  const averageRecoveryTime = '14.2 days';
  const successRate = 94.8;

  // Calculate Fee Dispute KPIs
  const totalFeesRecovered = mockFeeDisputes
    .filter(d => d.status === 'Won')
    .reduce((sum, d) => sum + d.potentialRecovery, 0);

  const activeDisputes = mockFeeDisputes.filter(d => 
    d.status === 'Dispute Filed' || d.status === 'Awaiting Verification'
  );

  const disputeSuccessRate = mockFeeDisputes.length > 0 
    ? (mockFeeDisputes.filter(d => d.status === 'Won').length / 
       mockFeeDisputes.filter(d => d.status === 'Won' || d.status === 'Lost').length) * 100 
    : 0;

  const mostCommonDisputeType = 'Weight Overcharge';

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

  // Filter fee disputes
  const filteredFeeDisputes = useMemo(() => {
    return mockFeeDisputes.filter(dispute => {
      const matchesSearch = dispute.productTitle.toLowerCase().includes(feeSearchTerm.toLowerCase()) ||
        dispute.sku.toLowerCase().includes(feeSearchTerm.toLowerCase()) ||
        dispute.id.toLowerCase().includes(feeSearchTerm.toLowerCase());
      
      const matchesStatus = feeStatusFilter === 'all' || dispute.status === feeStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [feeSearchTerm, feeStatusFilter]);

  const RecoveryCenterContent = () => (
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
  );

  const FeeAuditContent = () => (
    <div className="space-y-6">
      {/* Fee Audit KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Fees Recovered"
          value={`$${(totalFeesRecovered + 2847.32).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          description="Successfully recovered from disputes"
          icon={<Target className="h-4 w-4" />}
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
        />
        
        <StatsCard
          title="Active Disputes"
          value={`${activeDisputes.length} ($${activeDisputes.reduce((sum, d) => sum + d.potentialRecovery, 0).toFixed(2)})`}
          description="Currently in progress"
          icon={<Scale className="h-4 w-4" />}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
        />
        
        <StatsCard
          title="Most Common Dispute Type"
          value={mostCommonDisputeType}
          description="Top overcharge category"
          icon={<AlertTriangle className="h-4 w-4" />}
          className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
        />
        
        <StatsCard
          title="Dispute Success Rate"
          value={`${disputeSuccessRate.toFixed(1)}%`}
          description="Disputes won vs total resolved"
          icon={<Shield className="h-4 w-4" />}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
        />
      </div>

      {/* Discrepancy Ledger */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Discrepancy Ledger</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Every fee overcharge our system has detected
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, SKU, or Dispute ID..."
                  value={feeSearchTerm}
                  onChange={(e) => setFeeSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Detected">Detected</SelectItem>
                  <SelectItem value="Awaiting Verification">Awaiting Verification</SelectItem>
                  <SelectItem value="Dispute Filed">Dispute Filed</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
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
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Product (ASIN/SKU)</TableHead>
                  <TableHead>Dispute Type</TableHead>
                  <TableHead>Date of Overcharge</TableHead>
                  <TableHead>What You Were Charged</TableHead>
                  <TableHead>Correct Fee</TableHead>
                  <TableHead>Potential Recovery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeDisputes.map((dispute) => (
                  <TableRow key={dispute.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{dispute.id}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={dispute.productTitle}>
                        {dispute.productTitle}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {dispute.productAsin} • {dispute.sku}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm">{dispute.disputeType}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(dispute.dateOfOvercharge).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      ${dispute.chargedAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${dispute.correctAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${dispute.potentialRecovery.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", getFeeDisputeStatusColor(dispute.status))}>
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {dispute.status === 'Awaiting Verification' && (
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                            Verify Data
                          </Button>
                        )}
                        {dispute.status === 'Detected' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                            File Dispute
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredFeeDisputes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fee disputes found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PageLayout title="Recovery Command Center">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recovery-center">Recovery Center</TabsTrigger>
          <TabsTrigger value="fee-audit">Fee Audit Center</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recovery-center">
          <RecoveryCenterContent />
        </TabsContent>
        
        <TabsContent value="fee-audit">
          <FeeAuditContent />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}