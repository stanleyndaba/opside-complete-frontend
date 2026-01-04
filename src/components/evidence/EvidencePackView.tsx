import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Package, Truck, Scale, CheckCircle2, AlertTriangle, Clock, Download, X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EvidenceAuditTrail } from './EvidenceAuditTrail';
import { DocumentChecklist } from './DocumentChecklist';

// Types for Evidence Pack
interface MatchedDocument {
  id: string;
  name: string;
  type?: string;
  uploadDate?: string;
  supplier?: string;
  invoice?: string;
  amount?: number;
  confidence?: number;
  matchedFields?: string[];
  extracted?: {
    order_ids?: string[];
    asins?: string[];
    skus?: string[];
    fnskus?: string[];
    tracking_numbers?: string[];
    amounts?: string[];
    invoice_numbers?: string[];
    dates?: string[];
  };
}

interface EvidencePackProps {
  open: boolean;
  onClose: () => void;
  claim: {
    id: string;
    claim_number?: string;
    type?: string;
    anomaly_type?: string;
    status: string;
    guaranteedAmount?: number;
    amount?: number;
    created?: string;
    created_at?: string;
    discovery_date?: string;
    sku?: string;
    asin?: string;
    fnsku?: string;
    details?: string;
    matchedDocs?: MatchedDocument[];
    matchedCount?: number;
    confidence_score?: number;
  };
}

// Policy references with argument templates for different claim types
interface PolicyTemplate {
  name: string;
  excerpt: string;
  deadline: string;
  windowDays: number;
  argumentTemplate: (daysOld: number, amount: number, sku?: string) => string;
}

const policyTemplates: Record<string, PolicyTemplate> = {
  'lost_warehouse': {
    name: 'FBA Lost Inventory Policy',
    excerpt: 'Amazon will reimburse sellers for inventory that is lost or damaged while in Amazon fulfillment centers.',
    deadline: '60 days from discovery',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `Per Amazon's FBA Lost Inventory reimbursement policy, sellers are entitled to compensation when inventory is lost while under Amazon's custody. This claim was filed ${daysOld} days after discovery, which is within the ${60}-day filing window. ${sku ? `SKU ${sku}` : 'The item'} went missing from Amazon's warehouse with no disposition record, constituting an eligible loss. We respectfully request reimbursement of $${amount.toFixed(2)} in accordance with FBA Terms of Service Section 4.2.`
  },
  'damaged_warehouse': {
    name: 'FBA Damaged Inventory Policy',
    excerpt: 'Sellers are entitled to reimbursement for items damaged by Amazon during fulfillment operations.',
    deadline: '60 days from discovery',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `According to Amazon's Damaged Inventory Policy, when products are damaged in Amazon fulfillment centers due to handling, storage, or processing, sellers are entitled to fair market value reimbursement. ${sku ? `Item ${sku}` : 'This unit'} was damaged while in Amazon's possession, ${daysOld} days ago. As this claim is filed within the ${60}-day window and damage occurred under Amazon's control, we request reimbursement of $${amount.toFixed(2)}.`
  },
  'customer_return_unreturned': {
    name: 'Customer Return Policy',
    excerpt: 'When a customer receives a refund but fails to return the item within 45 days, sellers may file for reimbursement.',
    deadline: '60-90 days after refund',
    windowDays: 90,
    argumentTemplate: (daysOld, amount, sku) =>
      `Per Amazon's Customer Return Policy, when a customer is refunded but fails to return the merchandise within 45 days, the seller is entitled to reimbursement. This refund was issued ${daysOld} days ago with no corresponding return received. ${sku ? `Product ${sku}` : 'The product'} was never returned to inventory despite the customer receiving a full refund. We request reimbursement of $${amount.toFixed(2)} per policy guidelines.`
  },
  'inbound_shipment_lost': {
    name: 'FBA Inbound Shipment Policy',
    excerpt: 'Amazon reimburses sellers for units confirmed shipped to fulfillment centers but not received or checked in.',
    deadline: '60 days from shipment',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `According to Amazon's Inbound Shipment Policy, when units are confirmed shipped via carrier but not checked in to the fulfillment center within 30 days, sellers may claim reimbursement. This shipment was sent ${daysOld} days ago with verified tracking showing delivery, but ${sku ? `SKU ${sku}` : 'these units'} were never received into inventory. We have attached proof of delivery and request reimbursement of $${amount.toFixed(2)}.`
  },
  'fba_fee_error': {
    name: 'FBA Fee Correction Policy',
    excerpt: 'Sellers can dispute incorrect fulfillment fees, including weight-based and dimension-based charges.',
    deadline: '90 days from charge',
    windowDays: 90,
    argumentTemplate: (daysOld, amount, sku) =>
      `Per Amazon's Fee Correction Policy, sellers may request refunds for incorrect FBA fees when product dimensions or weight are miscategorized. ${sku ? `For SKU ${sku}` : 'For this item'}, the actual measurements differ from Amazon's recorded dimensions, resulting in overcharges. This discrepancy was identified ${daysOld} days ago. We request a fee adjustment of $${amount.toFixed(2)} to reflect accurate product specifications.`
  },
  'removal_order_lost': {
    name: 'Removal Order Policy',
    excerpt: 'Amazon reimburses sellers when removal orders are lost in transit or not delivered.',
    deadline: '60 days from order',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `According to Amazon's Removal Order Policy, when inventory removed from FBA is lost during the removal process, sellers are entitled to reimbursement. ${sku ? `SKU ${sku}` : 'The removed inventory'} was never received at the designated return address despite ${daysOld} days passing since the removal order. We request reimbursement of $${amount.toFixed(2)} for the lost units.`
  },
  'quantity_discrepancy': {
    name: 'Inventory Discrepancy Policy',
    excerpt: 'Sellers may claim for units showing inventory count discrepancies not attributed to sales or removals.',
    deadline: '60 days from discovery',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `Per Amazon's Inventory Reconciliation Policy, sellers are entitled to reimbursement when inventory counts show unexplained discrepancies not attributed to sales, returns, or removals. ${sku ? `For SKU ${sku}` : 'For this product'}, our records show a discrepancy identified ${daysOld} days ago. After reconciliation, ${amount > 0 ? `$${amount.toFixed(2)}` : 'units'} remain unaccounted for. We request investigation and appropriate reimbursement.`
  },
  'default': {
    name: 'Amazon Seller Reimbursement Policy',
    excerpt: 'Amazon provides reimbursement for inventory issues that are Amazon responsibility under FBA terms of service.',
    deadline: '60-90 days from discovery',
    windowDays: 60,
    argumentTemplate: (daysOld, amount, sku) =>
      `According to Amazon's FBA Terms of Service, sellers are entitled to reimbursement when inventory losses or discrepancies occur under Amazon's control. This claim was identified ${daysOld} days ago and is being filed within the allowable window. ${sku ? `SKU ${sku}` : 'The affected inventory'} qualifies for reimbursement of $${amount.toFixed(2)} based on the documented evidence provided.`
  }
};

// Generate policy argument based on claim data
const generatePolicyArgument = (claimType: string, discoveryDate: string | undefined, amount: number, sku?: string): { argument: string; daysOld: number; withinWindow: boolean; windowDays: number } => {
  const typeKey = claimType.toLowerCase().replace(/[:\-\s]/g, '_');
  const template = policyTemplates[typeKey] || policyTemplates.default;

  const daysOld = discoveryDate
    ? Math.floor((Date.now() - new Date(discoveryDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const withinWindow = daysOld <= template.windowDays;
  const argument = template.argumentTemplate(daysOld, amount, sku);

  return { argument, daysOld, withinWindow, windowDays: template.windowDays };
};

// Legacy policy references for backward compatibility
const policyReferences: Record<string, { name: string; excerpt: string; deadline: string }> = Object.fromEntries(
  Object.entries(policyTemplates).map(([key, val]) => [key, { name: val.name, excerpt: val.excerpt, deadline: val.deadline }])
);

// Get status badge color
const getStatusColor = (status: string) => {
  const lower = status.toLowerCase();
  if (['paid', 'approved', 'resolved'].includes(lower)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['submitted', 'under review', 'pending'].includes(lower)) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (['denied', 'rejected'].includes(lower)) return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function EvidencePackView({ open, onClose, claim }: EvidencePackProps) {
  const { toast } = useToast();

  // Get policy reference based on claim type
  const policy = useMemo(() => {
    const typeKey = (claim.anomaly_type || claim.type || '').toLowerCase().replace(/[:\-]/g, '_');
    return policyReferences[typeKey] || policyReferences.default;
  }, [claim.type, claim.anomaly_type]);

  // Generate policy argument
  const policyArgument = useMemo(() => {
    const claimType = claim.anomaly_type || claim.type || '';
    const discoveryDate = claim.created || claim.created_at || claim.discovery_date;
    const amount = claim.guaranteedAmount || claim.amount || 0;
    return generatePolicyArgument(claimType, discoveryDate, amount, claim.sku);
  }, [claim.anomaly_type, claim.type, claim.created, claim.created_at, claim.discovery_date, claim.guaranteedAmount, claim.amount, claim.sku]);


  // Organize documents by category
  const organizedDocs = useMemo(() => {
    const docs = claim.matchedDocs || [];

    const orderDocs = docs.filter(d =>
      d.type?.toLowerCase().includes('invoice') ||
      d.type?.toLowerCase().includes('order') ||
      d.type?.toLowerCase().includes('purchase') ||
      d.extracted?.order_ids?.length
    );

    const shipmentDocs = docs.filter(d =>
      d.type?.toLowerCase().includes('shipment') ||
      d.type?.toLowerCase().includes('tracking') ||
      d.type?.toLowerCase().includes('delivery') ||
      d.type?.toLowerCase().includes('pod') ||
      d.extracted?.tracking_numbers?.length
    );

    const otherDocs = docs.filter(d =>
      !orderDocs.includes(d) && !shipmentDocs.includes(d)
    );

    return { orderDocs, shipmentDocs, otherDocs };
  }, [claim.matchedDocs]);

  // Collect all highlighted fields from documents
  const highlights = useMemo(() => {
    const allDocs = claim.matchedDocs || [];
    const highlights: string[] = [];

    allDocs.forEach(doc => {
      if (doc.extracted?.order_ids) highlights.push(...doc.extracted.order_ids.map(id => `Order #${id}`));
      if (doc.extracted?.amounts) highlights.push(...doc.extracted.amounts.map(a => `$${a}`));
      if (doc.extracted?.tracking_numbers) highlights.push(...doc.extracted.tracking_numbers.map(t => `Tracking: ${t}`));
      if (doc.extracted?.invoice_numbers) highlights.push(...doc.extracted.invoice_numbers.map(i => `Invoice #${i}`));
      if (doc.matchedFields) highlights.push(...doc.matchedFields);
    });

    return [...new Set(highlights)].slice(0, 10); // Dedupe and limit
  }, [claim.matchedDocs]);

  // Export as PDF (opens print-ready HTML in new tab) - Institutional Banking Style
  const exportAsPdf = () => {
    const claimDate = claim.created || claim.created_at || claim.discovery_date || new Date().toISOString();
    const claimType = (claim.anomaly_type || claim.type || 'Recovery Claim').replace(/_/g, ' ').toUpperCase();
    const amount = claim.guaranteedAmount || claim.amount || 0;
    const totalDocs = (claim.matchedDocs?.length || claim.matchedCount || 0);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Evidence Documentation Package - ${claim.claim_number || claim.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif; 
      font-size: 10pt; 
      color: #1e293b; 
      line-height: 1.5; 
      padding: 48px;
      background: #fff;
    }
    @media print {
      body { padding: 24px; }
      .no-print { display: none !important; }
      .section { page-break-inside: avoid; }
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-left {}
    .logo {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #0f172a;
      text-transform: uppercase;
    }
    .logo-sub {
      font-size: 8pt;
      color: #64748b;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .header-right {
      text-align: right;
    }
    .doc-id {
      font-size: 9pt;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .doc-date {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Sections */
    .section {
      margin-bottom: 28px;
    }
    .section-header {
      font-size: 9pt;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding-bottom: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    /* Summary Table */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary-table td {
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10pt;
    }
    .summary-table td:first-child {
      color: #64748b;
      width: 140px;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-table td:last-child {
      color: #1e293b;
      font-weight: 500;
    }
    .amount-value {
      font-size: 14pt;
      font-weight: 600;
      color: #0f172a;
    }
    .mono {
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 9pt;
    }

    /* Documents Table */
    .docs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .docs-table th {
      text-align: left;
      padding: 8px 12px;
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 8pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .docs-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .docs-table tr:last-child td {
      border-bottom: none;
    }
    .doc-filename {
      font-weight: 500;
      color: #1e293b;
    }
    .doc-meta {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* Policy Box */
    .policy-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      margin-top: 8px;
    }
    .policy-title {
      font-size: 10pt;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .policy-text {
      font-size: 9pt;
      color: #475569;
      line-height: 1.6;
    }
    .policy-meta {
      display: flex;
      gap: 32px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .policy-meta-item {
      font-size: 8pt;
    }
    .policy-meta-label {
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .policy-meta-value {
      color: #334155;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Argument Quote */
    .argument-box {
      background: #f8fafc;
      border-left: 3px solid #cbd5e1;
      padding: 16px 20px;
      margin-top: 16px;
    }
    .argument-label {
      font-size: 8pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .argument-text {
      font-size: 9pt;
      color: #334155;
      line-height: 1.7;
      font-style: italic;
    }

    /* Empty State */
    .empty-state {
      color: #94a3b8;
      font-size: 9pt;
      text-align: center;
      padding: 16px;
      font-style: italic;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
    }

    /* Print Button */
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1e293b;
      color: white;
      border: none;
      padding: 12px 24px;
      cursor: pointer;
      font-size: 10pt;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .print-btn:hover { background: #0f172a; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">SAVE AS PDF</button>
  
  <div class="header">
    <div class="header-left">
      <div class="logo">OPSIDE</div>
      <div class="logo-sub">Evidence Documentation Package</div>
    </div>
    <div class="header-right">
      <div class="doc-id">REF: ${claim.claim_number || claim.id.slice(0, 12).toUpperCase()}</div>
      <div class="doc-date">Generated ${format(new Date(), 'MMMM dd, yyyy')}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Claim Summary</div>
    <table class="summary-table">
      <tr>
        <td>Claim Type</td>
        <td>${claimType}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>${(claim.status || 'PENDING').toUpperCase()}</td>
      </tr>
      <tr>
        <td>Claim Amount</td>
        <td class="amount-value">${formatCurrency(amount)}</td>
      </tr>
      <tr>
        <td>Discovery Date</td>
        <td>${format(new Date(claimDate), 'MMMM dd, yyyy')}</td>
      </tr>
      ${claim.sku ? `<tr><td>SKU</td><td class="mono">${claim.sku}</td></tr>` : ''}
      ${claim.asin ? `<tr><td>ASIN</td><td class="mono">${claim.asin}</td></tr>` : ''}
      <tr>
        <td>Documents</td>
        <td>${totalDocs} matched document${totalDocs !== 1 ? 's' : ''}</td>
      </tr>
    </table>
    ${claim.details ? `
    <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
      <div style="font-size: 8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Details</div>
      <div style="font-size: 9pt; color: #334155;">${claim.details}</div>
    </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-header">Matched Evidence Documents</div>
    ${totalDocs > 0 ? `
    <table class="docs-table">
      <thead>
        <tr>
          <th>Document</th>
          <th>Type</th>
          <th>Extracted Data</th>
          <th style="text-align: right;">Confidence</th>
        </tr>
      </thead>
      <tbody>
        ${(claim.matchedDocs || []).map((doc: MatchedDocument) => `
        <tr>
          <td>
            <div class="doc-filename">${doc.name || 'Document'}</div>
            ${doc.uploadDate ? `<div class="doc-meta">Uploaded: ${format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</div>` : ''}
          </td>
          <td>${(doc.type || 'Document').replace(/_/g, ' ')}</td>
          <td>
            ${doc.extracted?.invoice_numbers?.length ? `Invoice: ${doc.extracted.invoice_numbers[0]}<br/>` : ''}
            ${doc.extracted?.order_ids?.length ? `Order: ${doc.extracted.order_ids[0]}<br/>` : ''}
            ${doc.extracted?.tracking_numbers?.length ? `Tracking: ${doc.extracted.tracking_numbers[0]}<br/>` : ''}
            ${doc.extracted?.amounts?.length ? `Amount: $${doc.extracted.amounts[0]}` : ''}
            ${!doc.extracted?.invoice_numbers?.length && !doc.extracted?.order_ids?.length && !doc.extracted?.tracking_numbers?.length && !doc.extracted?.amounts?.length ? '<span style="color:#94a3b8;">—</span>' : ''}
          </td>
          <td style="text-align: right;">${Math.round((doc.confidence || 0) * 100)}%</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="empty-state">No matched documents available</div>'}
  </div>

  <div class="section">
    <div class="section-header">Policy Reference</div>
    <div class="policy-box">
      <div class="policy-title">${policy.name}</div>
      <div class="policy-text">${policy.excerpt}</div>
      <div class="policy-meta">
        <div class="policy-meta-item">
          <div class="policy-meta-label">Filing Deadline</div>
          <div class="policy-meta-value">${policy.deadline}</div>
        </div>
        <div class="policy-meta-item">
          <div class="policy-meta-label">Claim Age</div>
          <div class="policy-meta-value">${policyArgument.daysOld} days</div>
        </div>
        <div class="policy-meta-item">
          <div class="policy-meta-label">Window Status</div>
          <div class="policy-meta-value">${policyArgument.withinWindow ? 'Within Window' : 'Outside Window'}</div>
        </div>
      </div>
    </div>
    <div class="argument-box">
      <div class="argument-label">Reimbursement Argument</div>
      <div class="argument-text">"${policyArgument.argument}"</div>
    </div>
  </div>

  <div class="footer">
    <div>Opside Recovery Platform — Confidential</div>
    <div style="margin-top: 4px;">For audit and accounting purposes only</div>
  </div>
</body>
</html>`;

    // Open in new tab
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(html);
      newTab.document.close();
      toast({
        title: 'Evidence Pack Ready',
        description: 'Press Ctrl+P to save as PDF.',
      });
    } else {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to export the evidence pack.',
        variant: 'destructive'
      });
    }
  };

  const claimDate = claim.created || claim.created_at || claim.discovery_date;
  const claimType = (claim.anomaly_type || claim.type || 'Recovery Claim').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const amount = claim.guaranteedAmount || claim.amount || 0;
  const totalDocs = claim.matchedDocs?.length || claim.matchedCount || 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-base font-semibold text-gray-900">
            Evidence Documentation Package
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600 mt-1">
            Claim Reference: {claim.claim_number || claim.id.slice(0, 12)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Information */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Claim Summary</h4>
            </div>
            <div className="bg-white">
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Claim Type</span>
                  <span className="text-xs font-medium text-gray-900">{claimType}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className="text-xs font-medium text-gray-900">{claim.status}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-600">Amount</span>
                  <span className="text-xs font-semibold text-gray-900">{formatCurrency(amount)}</span>
                </div>
                {claimDate && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-600">Discovery Date</span>
                    <span className="text-xs font-medium text-gray-900">{format(new Date(claimDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {claim.sku && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-600">SKU</span>
                    <span className="text-xs font-mono text-gray-900">{claim.sku}</span>
                  </div>
                )}
                {claim.asin && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-gray-600">ASIN</span>
                    <span className="text-xs font-mono text-gray-900">{claim.asin}</span>
                  </div>
                )}
              </div>

              {claim.details && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <div className="text-xs text-gray-600 font-medium mb-1">Details</div>
                  <p className="text-xs text-gray-700">{claim.details}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order & Inventory Evidence */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Order & Inventory Evidence</h4>
            </div>
            <div className="bg-white">
              {organizedDocs.orderDocs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {organizedDocs.orderDocs.map((doc, i) => (
                    <div key={doc.id || i} className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">{doc.name}</div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {doc.supplier && <span>Supplier: {doc.supplier} • </span>}
                            {doc.invoice && <span>Invoice: {doc.invoice} • </span>}
                            {doc.amount && <span>{formatCurrency(doc.amount)}</span>}
                          </div>
                          {doc.extracted?.order_ids && doc.extracted.order_ids.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.extracted.order_ids.map((id, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                                  Order #{id}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-600 ml-3">
                          {Math.round((doc.confidence || 0) * 100)}% match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No order documents matched yet</p>
              )}
            </div>
          </div>

          {/* Shipment & Delivery Evidence */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shipment & Delivery Evidence</h4>
            </div>
            <div className="bg-white">
              {organizedDocs.shipmentDocs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {organizedDocs.shipmentDocs.map((doc, i) => (
                    <div key={doc.id || i} className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">{doc.name}</div>
                          {doc.extracted?.tracking_numbers && doc.extracted.tracking_numbers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.extracted.tracking_numbers.map((t, j) => (
                                <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-600 ml-3">
                          {Math.round((doc.confidence || 0) * 100)}% match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No shipment documents matched yet</p>
              )}
            </div>
          </div>

          {/* Policy Reference & Legal Argument */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Policy Reference & Argument</h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${policyArgument.withinWindow ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'}`}>
                {policyArgument.withinWindow ? 'Within Window' : 'Outside Window'}
              </span>
            </div>
            <div className="bg-white">
              {/* Policy Details */}
              <div className="divide-y divide-gray-100">
                <div className="px-4 py-3">
                  <div className="text-xs font-semibold text-gray-900 mb-1">{policy.name}</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{policy.excerpt}</p>
                </div>
                <div className="flex px-4 py-2.5">
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Filing Deadline</span>
                    <div className="text-xs font-medium text-gray-900">{policy.deadline}</div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Claim Age</span>
                    <div className="text-xs font-medium text-gray-900">{policyArgument.daysOld} days</div>
                  </div>
                </div>
              </div>

              {/* Legal Argument */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-2">Reimbursement Argument</div>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    "{policyArgument.argument}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Other Documents */}
          {organizedDocs.otherDocs.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Additional Supporting Documents</h4>
              </div>
              <div className="bg-white">
                <div className="divide-y divide-gray-100">
                  {organizedDocs.otherDocs.map((doc, i) => (
                    <div key={doc.id || i} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">{doc.name}</span>
                      <span className="text-[10px] text-gray-600">
                        {Math.round((doc.confidence || 0) * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Amazon Proof Requirements Checklist */}
          <DocumentChecklist claimId={claim.id} compact={false} />

          {/* Evidence Audit Trail */}
          <EvidenceAuditTrail claimId={claim.id} compact={false} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs text-gray-600 border-gray-200 hover:bg-gray-100 rounded-sm"
          >
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                toast({ title: 'Generating PDF...', description: 'Creating your evidence pack.' });

                // Initialize jsPDF
                const doc = new jsPDF('p', 'pt', 'letter');
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 50;
                let yPos = margin;

                // Colors - Institutional Banking Style
                const slateBlack = '#0f172a';
                const slateDark = '#1e293b';
                const slateMed = '#64748b';
                const slateLight = '#94a3b8';
                const border = '#e2e8f0';

                // Helper
                const addText = (text: string, x: number, y: number, fontSize: number, color: string, fontStyle: 'normal' | 'bold' = 'normal') => {
                  doc.setFontSize(fontSize);
                  doc.setTextColor(color);
                  doc.setFont('helvetica', fontStyle);
                  doc.text(text, x, y);
                };

                // === HEADER ===
                addText('OPSIDE', margin, yPos, 14, slateBlack, 'bold');
                yPos += 14;
                addText('EVIDENCE DOCUMENTATION PACKAGE', margin, yPos, 8, slateMed, 'normal');

                // Right-aligned reference
                doc.setFontSize(9);
                doc.setTextColor(slateMed);
                doc.text(`REF: ${(claim.claim_number || claim.id.slice(0, 12)).toUpperCase()}`, pageWidth - margin, margin, { align: 'right' });
                doc.setFontSize(8);
                doc.setTextColor(slateLight);
                doc.text(`Generated ${format(new Date(), 'MMMM dd, yyyy')}`, pageWidth - margin, margin + 12, { align: 'right' });

                yPos += 24;
                doc.setDrawColor(border);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 24;

                // === CLAIM SUMMARY ===
                const claimDate = claim.created || claim.created_at || claim.discovery_date || new Date().toISOString();
                const claimType = (claim.anomaly_type || claim.type || 'Recovery Claim').replace(/_/g, ' ').toUpperCase();
                const amount = claim.guaranteedAmount || claim.amount || 0;
                const totalDocs = claim.matchedDocs?.length || claim.matchedCount || 0;

                addText('CLAIM SUMMARY', margin, yPos, 9, slateMed, 'bold');
                yPos += 16;

                const summaryData = [
                  ['Claim Type', claimType],
                  ['Status', (claim.status || 'Pending').toUpperCase()],
                  ['Claim Amount', formatCurrency(amount)],
                  ['Discovery Date', format(new Date(claimDate), 'MMMM dd, yyyy')],
                ];
                if (claim.sku) summaryData.push(['SKU', claim.sku]);
                if (claim.asin) summaryData.push(['ASIN', claim.asin]);
                summaryData.push(['Documents Matched', `${totalDocs}`]);

                autoTable(doc, {
                  startY: yPos,
                  body: summaryData,
                  theme: 'plain',
                  margin: { left: margin, right: margin },
                  styles: { fontSize: 9, cellPadding: 6, textColor: slateDark },
                  columnStyles: {
                    0: { cellWidth: 120, fontStyle: 'bold', textColor: slateMed },
                    1: { fontStyle: 'normal' }
                  }
                });
                yPos = (doc as any).lastAutoTable.finalY + 24;

                // === MATCHED DOCUMENTS ===
                addText('MATCHED EVIDENCE DOCUMENTS', margin, yPos, 9, slateMed, 'bold');
                yPos += 16;

                if (totalDocs > 0 && claim.matchedDocs && claim.matchedDocs.length > 0) {
                  const docsData = claim.matchedDocs.map((d: MatchedDocument) => [
                    d.name || 'Document',
                    (d.type || 'Document').replace(/_/g, ' '),
                    [
                      d.extracted?.invoice_numbers?.[0] ? `Inv: ${d.extracted.invoice_numbers[0]}` : '',
                      d.extracted?.order_ids?.[0] ? `Order: ${d.extracted.order_ids[0]}` : '',
                    ].filter(Boolean).join(', ') || '—',
                    `${Math.round((d.confidence || 0) * 100)}%`
                  ]);

                  autoTable(doc, {
                    startY: yPos,
                    head: [['Document', 'Type', 'Extracted Data', 'Match']],
                    body: docsData,
                    theme: 'grid',
                    margin: { left: margin, right: margin },
                    headStyles: { fillColor: '#f8fafc', textColor: slateMed, fontStyle: 'bold', fontSize: 8 },
                    styles: { fontSize: 8, cellPadding: 6, textColor: slateDark }
                  });
                  yPos = (doc as any).lastAutoTable.finalY + 24;
                } else {
                  doc.setFontSize(9);
                  doc.setTextColor(slateLight);
                  doc.text('No matched documents available', margin, yPos);
                  yPos += 24;
                }

                // === POLICY REFERENCE ===
                addText('POLICY REFERENCE', margin, yPos, 9, slateMed, 'bold');
                yPos += 16;

                doc.setFillColor('#f8fafc');
                doc.setDrawColor(border);
                doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 70, 'FD');

                addText(policy.name, margin + 12, yPos + 10, 10, slateDark, 'bold');
                doc.setFontSize(9);
                doc.setTextColor(slateMed);
                const splitExcerpt = doc.splitTextToSize(policy.excerpt, pageWidth - 2 * margin - 24);
                doc.text(splitExcerpt.slice(0, 2), margin + 12, yPos + 26);
                addText(`Deadline: ${policy.deadline}  |  Claim Age: ${policyArgument.daysOld} days  |  ${policyArgument.withinWindow ? 'Within Window' : 'Outside Window'}`, margin + 12, yPos + 56, 8, slateLight, 'normal');

                yPos += 90;

                // === FOOTER ===
                doc.setDrawColor(border);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 16;
                doc.setFontSize(8);
                doc.setTextColor(slateLight);
                doc.text('Opside Recovery Platform — Confidential', pageWidth / 2, yPos, { align: 'center' });

                // Save
                doc.save(`Evidence_Pack_${claim.claim_number || claim.id.slice(0, 8)}.pdf`);
                toast({ title: 'PDF Downloaded', description: 'Evidence pack saved successfully.' });
              } catch (error: any) {
                console.error('PDF error:', error);
                toast({ title: 'PDF Failed', description: error?.message || 'Try Export as PDF instead.', variant: 'destructive' });
              }
            }}
            className="h-8 text-xs text-gray-700 border-gray-200 hover:bg-gray-100 rounded-sm"
          >
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </Button>
          <Button
            size="sm"
            onClick={exportAsPdf}
            className="h-8 text-xs bg-gray-900 hover:bg-gray-800 text-white rounded-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EvidencePackView;
