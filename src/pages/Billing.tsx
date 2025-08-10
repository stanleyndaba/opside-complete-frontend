import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, DollarSign, TrendingUp, Calendar, CheckCircle, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface Invoice {
  id: string;
  dateIssued: string;
  status: 'Paid' | 'Due' | 'Pending';
  feeAmount: number;
  basedOnRecoveries: string[];
  description: string;
}

// Mock data for invoices
const mockInvoices: Invoice[] = [{
  id: 'INV-2025-001',
  dateIssued: '2025-01-15',
  status: 'Paid',
  feeAmount: 119.78,
  basedOnRecoveries: ['OPS-12347'],
  description: 'Success fee for Smart Home Security System recovery'
}, {
  id: 'INV-2024-012',
  dateIssued: '2024-12-30',
  status: 'Paid',
  feeAmount: 97.60,
  basedOnRecoveries: ['OPS-12301', 'OPS-12302'],
  description: 'Success fees for Coffee Beans & Fitness Equipment recoveries'
}, {
  id: 'INV-2024-011',
  dateIssued: '2024-12-15',
  status: 'Paid',
  feeAmount: 156.32,
  basedOnRecoveries: ['OPS-12289', 'OPS-12290', 'OPS-12291'],
  description: 'Success fees for Kitchen Appliances recoveries'
}, {
  id: 'INV-2024-010',
  dateIssued: '2024-11-28',
  status: 'Paid',
  feeAmount: 203.45,
  basedOnRecoveries: ['OPS-12276', 'OPS-12277'],
  description: 'Success fees for Electronics & Home Goods recoveries'
}, {
  id: 'INV-2024-009',
  dateIssued: '2024-11-15',
  status: 'Paid',
  feeAmount: 89.67,
  basedOnRecoveries: ['OPS-12265'],
  description: 'Success fee for Outdoor Equipment recovery'
}];
const getInvoiceStatusColor = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Due':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
export default function Billing() {
  // Calculate KPIs
  const totalValueDelivered = 46789.42; // Total recovered amount
  const totalOpsideFees = mockInvoices.reduce((sum, inv) => sum + inv.feeAmount, 0);
  const roiMultiplier = totalValueDelivered / totalOpsideFees;
  const nextInvoiceDate = '2025-02-15';
  return <PageLayout title="Billing & Value Report">
      <div className="space-y-8">
        {/* ROI Hero Section */}
        

        {/* Supporting KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Value Delivered (All-Time)" value={`$${totalValueDelivered.toLocaleString('en-US', {
          minimumFractionDigits: 2
        })}`} description="Successfully recovered for your business" icon={<TrendingUp className="h-4 w-4" />} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200" />
          
          <StatsCard title="Total Opside Fees (All-Time)" value={`$${totalOpsideFees.toLocaleString('en-US', {
          minimumFractionDigits: 2
        })}`} description="Success-based fees paid" icon={<DollarSign className="h-4 w-4" />} className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200" />
          
          <StatsCard title="Next Invoice Date" value={new Date(nextInvoiceDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })} description="Estimated based on active cases" icon={<Calendar className="h-4 w-4" />} className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200" />
        </div>

        {/* Invoice History Ledger */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-semibold">Invoice History Ledger</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete transparency into every fee charged
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fee Amount</TableHead>
                    <TableHead>Based on Recoveries</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map(invoice => <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                      <TableCell>
                        {new Date(invoice.dateIssued).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getInvoiceStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${invoice.feeAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            {invoice.description}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {invoice.basedOnRecoveries.map(caseId => <Button key={caseId} variant="ghost" size="sm" className="h-6 px-2 text-xs font-mono text-blue-600 hover:text-blue-800" asChild>
                                <Link to={`/recoveries/${caseId}`}>
                                  {caseId}
                                </Link>
                              </Button>)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Manage Your Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Manage Your Plan</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your current subscription and available services
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current Plan */}
            <div className="border rounded-lg p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-900">
                        Your Current Plan: Opside Performance
                      </h3>
                      <p className="text-emerald-700 font-medium">
                        Model: 20% Success-Based Fee
                      </p>
                    </div>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    You only pay a fee on the funds we successfully recover for you. 
                    There are no monthly subscriptions, retainers, or hidden charges.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <Shield className="h-4 w-4" />
                    <span>Active and protected</span>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                  Active
                </Badge>
              </div>
            </div>

            {/* Future Services Preview */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-muted-foreground">
                Coming Soon: Enhanced Services
              </h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Intelligence Engine */}
                <div className="border rounded-lg p-4 bg-muted/20 border-muted-foreground/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-muted-foreground">
                        Intelligence Engine
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Advanced analytics and predictive insights for your FBA business. 
                        Real-time alerts and automated optimization recommendations.
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Coming Q2 2025
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* FBA Loss Insurance */}
                <div className="border rounded-lg p-4 bg-muted/20 border-muted-foreground/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold text-muted-foreground">
                        FBA Loss Insurance
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Comprehensive insurance coverage for your FBA inventory. 
                        Instant payouts for lost or damaged goods.
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Coming Q3 2025
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>;
}