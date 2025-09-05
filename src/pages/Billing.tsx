import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Download, 
  CreditCard, 
  Shield, 
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface InvoiceRecord {
  id: string;
  dateIssued: string;
  status: 'Paid' | 'Due' | 'Overdue';
  totalRecovered: number;
  commission: number;
  amountCharged: number;
  recoveryClaimIds: string[];
}

// Mock data for billing history
const mockInvoices: InvoiceRecord[] = [
  {
    id: 'INV-2025-003',
    dateIssued: '2025-01-15',
    status: 'Paid',
    totalRecovered: 2450.89,
    commission: 490.18,
    amountCharged: 490.18,
    recoveryClaimIds: ['REC-2025-0087', 'REC-2025-0088', 'REC-2025-0089']
  },
  {
    id: 'INV-2025-002', 
    dateIssued: '2024-12-30',
    status: 'Paid',
    totalRecovered: 1876.32,
    commission: 375.26,
    amountCharged: 375.26,
    recoveryClaimIds: ['REC-2024-0156', 'REC-2024-0157']
  },
  {
    id: 'INV-2025-001',
    dateIssued: '2024-12-15', 
    status: 'Paid',
    totalRecovered: 3421.67,
    commission: 684.33,
    amountCharged: 684.33,
    recoveryClaimIds: ['REC-2024-0142', 'REC-2024-0143', 'REC-2024-0144', 'REC-2024-0145']
  },
  {
    id: 'INV-2024-012',
    dateIssued: '2024-11-28',
    status: 'Paid', 
    totalRecovered: 5632.45,
    commission: 1126.49,
    amountCharged: 1126.49,
    recoveryClaimIds: ['REC-2024-0123', 'REC-2024-0124', 'REC-2024-0125']
  },
  {
    id: 'INV-2024-011',
    dateIssued: '2024-11-15',
    status: 'Paid',
    totalRecovered: 987.23,
    commission: 197.45,
    amountCharged: 197.45,
    recoveryClaimIds: ['REC-2024-0098']
  }
];

const getStatusColor = (status: InvoiceRecord['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Due':
      return 'bg-blue-100 text-blue-800 border-blue-200'; 
    case 'Overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const handleStripePaymentUpdate = () => {
  // This would integrate with Stripe to update payment method
  alert('Stripe payment method update would open here');
};

export default function Billing() {
  return (
    <PageLayout title="Billing & Invoices">
      <div className="space-y-8">
        {/* Current Plan & Payment Method */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Opside Performance Plan
                </h3>
                <div className="mt-3 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We charge a <span className="font-semibold text-foreground">20% commission only</span> on the funds we successfully recover for you. 
                    <span className="font-medium text-primary"> No recovery, no fee.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                <span>Active and monitoring your account 24/7</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Primary Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded border">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  Active
                </Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleStripePaymentUpdate}
              >
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold">Billing History</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete transparency into every charge and recovery
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
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Recovered (Period)</TableHead>
                    <TableHead className="text-right">Our Commission (20%)</TableHead>
                    <TableHead className="text-right">Amount Charged</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link 
                          to={`/billing/invoice/${invoice.id}`}
                          className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {invoice.id}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dateIssued).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getStatusColor(invoice.status))}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${invoice.totalRecovered.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.commission.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${invoice.amountCharged.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Frequently Asked Billing Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Frequently Asked Billing Questions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quick answers to common billing and payment questions
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="when-charged">
                <AccordionTrigger className="text-left">
                  When will I be charged?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  You are only charged when we successfully recover money for you. We generate invoices monthly for all recoveries completed in that period, with payment automatically processed from your saved payment method within 7 days of invoice generation.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reversed-recovery">
                <AccordionTrigger className="text-left">
                  What happens if a recovery is later reversed by Amazon?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  In the rare event that Amazon reverses a recovery, we automatically issue you a full credit on your next invoice. If no future invoice exists, we process a direct refund to your payment method within 5-7 business days.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="vat-number">
                <AccordionTrigger className="text-left">
                  How do I update my company's VAT number?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  You can update your VAT number and other billing details by clicking "Update Payment Method" above, or by contacting our support team. Changes will be reflected on your next invoice.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="automatic-invoices">
                <AccordionTrigger className="text-left">
                  Can I get invoices automatically sent to my accountant?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes! Contact our support team to set up automatic invoice forwarding to additional email addresses. You can add multiple recipients and they'll receive a copy of every invoice automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-security">
                <AccordionTrigger className="text-left">
                  How secure is my payment information?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  All payment processing is handled by Stripe, a PCI DSS Level 1 certified payment processor. We never store your full credit card details on our servers - only encrypted tokens that allow us to process payments securely.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Need More Help */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Have a specific billing question?</span>
          </div>
          <div className="mt-2">
            <Link 
              to="/help" 
              className="text-primary hover:underline font-medium"
            >
              Contact our support team
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}