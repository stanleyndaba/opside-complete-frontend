import React, { useMemo } from 'react';
import { format } from 'date-fns';
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

    // Export as PDF (opens print-ready HTML in new tab)
    const exportAsPdf = () => {
        const claimDate = claim.created || claim.created_at || claim.discovery_date || new Date().toISOString();
        const claimType = (claim.anomaly_type || claim.type || 'Recovery Claim').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const amount = claim.guaranteedAmount || claim.amount || 0;

        const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Evidence Pack - ${claim.claim_number || claim.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; padding: 40px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
      .section { page-break-inside: avoid; }
    }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 24pt; color: #111827; margin-bottom: 5px; }
    .header .subtitle { color: #6b7280; font-size: 10pt; }
    .cover { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .cover-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .cover-item { }
    .cover-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .cover-value { font-size: 12pt; font-weight: 600; color: #111827; }
    .cover-value.amount { font-size: 18pt; color: #059669; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14pt; font-weight: 600; color: #111827; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px; }
    .section-icon { width: 20px; height: 20px; }
    .doc-list { }
    .doc-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
    .doc-name { font-weight: 600; color: #111827; }
    .doc-meta { font-size: 9pt; color: #6b7280; margin-top: 4px; }
    .doc-confidence { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 9pt; font-weight: 500; }
    .confidence-high { background: #d1fae5; color: #065f46; }
    .confidence-medium { background: #fef3c7; color: #92400e; }
    .confidence-low { background: #fee2e2; color: #991b1b; }
    .highlight { background: #fef9c3; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
    .highlights-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .policy-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; }
    .policy-name { font-weight: 600; color: #1e40af; margin-bottom: 8px; }
    .policy-excerpt { font-size: 10pt; color: #1e3a8a; margin-bottom: 8px; }
    .policy-deadline { font-size: 9pt; color: #3b82f6; font-weight: 500; }
    .timeline { margin-top: 16px; }
    .timeline-item { display: flex; gap: 12px; margin-bottom: 8px; }
    .timeline-date { font-size: 9pt; color: #6b7280; width: 80px; flex-shrink: 0; }
    .timeline-event { font-size: 10pt; color: #374151; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9pt; color: #9ca3af; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; }
    .print-btn:hover { background: #2563eb; }
    .empty-state { color: #9ca3af; font-style: italic; padding: 12px; text-align: center; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Save as PDF (Ctrl+P)</button>
  
  <div class="header">
    <h1>Evidence Pack</h1>
    <div class="subtitle">Claim ${claim.claim_number || claim.id.slice(0, 8)} • Generated ${format(new Date(), 'MMM dd, yyyy')}</div>
  </div>
  
  <div class="cover section">
    <div class="cover-grid">
      <div class="cover-item">
        <div class="cover-label">Claim Type</div>
        <div class="cover-value">${claimType}</div>
      </div>
      <div class="cover-item">
        <div class="cover-label">Status</div>
        <div class="cover-value">${claim.status}</div>
      </div>
      <div class="cover-item">
        <div class="cover-label">Discovery Date</div>
        <div class="cover-value">${format(new Date(claimDate), 'MMMM dd, yyyy')}</div>
      </div>
      <div class="cover-item">
        <div class="cover-label">Claim Amount</div>
        <div class="cover-value amount">${formatCurrency(amount)}</div>
      </div>
      ${claim.sku ? `<div class="cover-item"><div class="cover-label">SKU</div><div class="cover-value">${claim.sku}</div></div>` : ''}
      ${claim.asin ? `<div class="cover-item"><div class="cover-label">ASIN</div><div class="cover-value">${claim.asin}</div></div>` : ''}
    </div>
    ${claim.details ? `<div style="margin-top: 16px;"><div class="cover-label">Details</div><div style="margin-top: 4px; color: #374151;">${claim.details}</div></div>` : ''}
    ${highlights.length > 0 ? `
      <div style="margin-top: 16px;">
        <div class="cover-label">Key Evidence Highlights</div>
        <div class="highlights-list">
          ${highlights.map(h => `<span class="highlight">${h}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  </div>
  
  <div class="section">
    <div class="section-title">📦 Order & Inventory Evidence</div>
    <div class="doc-list">
      ${organizedDocs.orderDocs.length > 0 ? organizedDocs.orderDocs.map(doc => `
        <div class="doc-item">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta">
            ${doc.supplier ? `Supplier: ${doc.supplier} • ` : ''}
            ${doc.invoice ? `Invoice: ${doc.invoice} • ` : ''}
            ${doc.amount ? `Amount: ${formatCurrency(doc.amount)} • ` : ''}
            <span class="doc-confidence ${(doc.confidence || 0) >= 0.85 ? 'confidence-high' : (doc.confidence || 0) >= 0.5 ? 'confidence-medium' : 'confidence-low'}">
              ${Math.round((doc.confidence || 0) * 100)}% match
            </span>
          </div>
          ${doc.extracted?.order_ids?.length ? `<div class="doc-meta">Order IDs: ${doc.extracted.order_ids.map(id => `<span class="highlight">${id}</span>`).join(', ')}</div>` : ''}
        </div>
      `).join('') : '<div class="empty-state">No order documents matched</div>'}
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">🚚 Shipment & Delivery Evidence</div>
    <div class="doc-list">
      ${organizedDocs.shipmentDocs.length > 0 ? organizedDocs.shipmentDocs.map(doc => `
        <div class="doc-item">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta">
            ${doc.uploadDate ? `Uploaded: ${format(new Date(doc.uploadDate), 'MMM dd, yyyy')} • ` : ''}
            <span class="doc-confidence ${(doc.confidence || 0) >= 0.85 ? 'confidence-high' : (doc.confidence || 0) >= 0.5 ? 'confidence-medium' : 'confidence-low'}">
              ${Math.round((doc.confidence || 0) * 100)}% match
            </span>
          </div>
          ${doc.extracted?.tracking_numbers?.length ? `<div class="doc-meta">Tracking: ${doc.extracted.tracking_numbers.map(t => `<span class="highlight">${t}</span>`).join(', ')}</div>` : ''}
        </div>
      `).join('') : '<div class="empty-state">No shipment documents matched</div>'}
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">⚖️ Policy Reference & Argument 
      <span style="margin-left: auto; padding: 2px 8px; border-radius: 9999px; font-size: 9pt; ${policyArgument.withinWindow ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #991b1b;'}">
        ${policyArgument.withinWindow ? '✓ Within Window' : '⚠ Outside Window'}
      </span>
    </div>
    <div class="policy-box">
      <div class="policy-name">${policy.name}</div>
      <div class="policy-excerpt">${policy.excerpt}</div>
      <div class="policy-deadline" style="margin-bottom: 12px;">Filing Deadline: ${policy.deadline} • Claim Age: ${policyArgument.daysOld} days</div>
      <div style="border-top: 1px solid #bfdbfe; padding-top: 12px; margin-top: 8px;">
        <div style="font-size: 9pt; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Reimbursement Argument</div>
        <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;">
          <p style="font-size: 10pt; color: #1e3a8a; font-style: italic; line-height: 1.6; margin: 0;">"${policyArgument.argument}"</p>
        </div>
      </div>
    </div>
  </div>
  
  ${organizedDocs.otherDocs.length > 0 ? `
  <div class="section">
    <div class="section-title">📎 Additional Supporting Documents</div>
    <div class="doc-list">
      ${organizedDocs.otherDocs.map(doc => `
        <div class="doc-item">
          <div class="doc-name">${doc.name}</div>
          <div class="doc-meta">
            ${doc.type ? `Type: ${doc.type} • ` : ''}
            <span class="doc-confidence ${(doc.confidence || 0) >= 0.85 ? 'confidence-high' : (doc.confidence || 0) >= 0.5 ? 'confidence-medium' : 'confidence-low'}">
              ${Math.round((doc.confidence || 0) * 100)}% match
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    Generated by Opside • ${format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}
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
                description: 'Press Ctrl+P (or Cmd+P) to save as PDF.',
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                toast({ title: 'Generating PDF...', description: 'Please wait while we create your composite document.' });
                                const response = await fetch(`/api/recoveries/${claim.id}/packet`, {
                                    method: 'GET',
                                    headers: { 'Content-Type': 'application/pdf' }
                                });
                                if (!response.ok) {
                                    throw new Error('Failed to generate PDF');
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Claim_Packet_${claim.claim_number || claim.id.slice(0, 8)}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                                toast({ title: 'PDF Downloaded', description: 'Composite claim packet ready.' });
                            } catch (error) {
                                toast({
                                    title: 'PDF Generation Failed',
                                    description: 'Unable to generate composite PDF. Try Export as PDF instead.',
                                    variant: 'destructive'
                                });
                            }
                        }}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Download Composite PDF
                    </Button>
                    <Button onClick={exportAsPdf} className="bg-gray-100 hover:bg-gray-200 text-gray-800">
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default EvidencePackView;
