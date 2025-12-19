import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { FileText, Package, Truck, Scale, CheckCircle2, AlertTriangle, Clock, Download, X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

// Policy references for different claim types
const policyReferences: Record<string, { name: string; excerpt: string; deadline: string }> = {
    'lost_warehouse': {
        name: 'FBA Lost Inventory Policy',
        excerpt: 'Amazon will reimburse sellers for inventory that is lost or damaged while in Amazon fulfillment centers. Claims must include proof of shipment and inventory records.',
        deadline: '60 days from discovery'
    },
    'damaged_warehouse': {
        name: 'FBA Damaged Inventory Policy',
        excerpt: 'Sellers are entitled to reimbursement for items damaged by Amazon during fulfillment operations. Documentation must include product details and damage evidence.',
        deadline: '60 days from discovery'
    },
    'customer_return_unreturned': {
        name: 'Customer Return Policy',
        excerpt: 'When a customer receives a refund but fails to return the item within 45 days, sellers may file for reimbursement of the item value.',
        deadline: '60-90 days after refund'
    },
    'inbound_shipment_lost': {
        name: 'FBA Inbound Shipment Policy',
        excerpt: 'Amazon reimburses sellers for units confirmed shipped to fulfillment centers but not received or checked in within 30 days.',
        deadline: '60 days from shipment'
    },
    'fba_fee_error': {
        name: 'FBA Fee Correction Policy',
        excerpt: 'Sellers can dispute incorrect fulfillment fees, including weight-based and dimension-based charges, with supporting measurement documentation.',
        deadline: '90 days from charge'
    },
    'default': {
        name: 'Amazon Seller Reimbursement Policy',
        excerpt: 'Amazon provides reimbursement for inventory issues that are Amazon responsibility under FBA terms of service.',
        deadline: '60-90 days from discovery'
    }
};

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
    <div class="section-title">⚖️ Policy Reference</div>
    <div class="policy-box">
      <div class="policy-name">${policy.name}</div>
      <div class="policy-excerpt">${policy.excerpt}</div>
      <div class="policy-deadline">Filing Deadline: ${policy.deadline}</div>
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
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Evidence Pack
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Structured dossier for claim {claim.claim_number || claim.id.slice(0, 8)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Cover Section */}
                    <Card className="border-gray-200 bg-gray-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-gray-900">Claim Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Claim Type</div>
                                    <div className="text-sm font-semibold text-gray-900 mt-1">{claimType}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
                                    <Badge className={`mt-1 ${getStatusColor(claim.status)}`}>{claim.status}</Badge>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Amount</div>
                                    <div className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(amount)}</div>
                                </div>
                                {claimDate && (
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Discovery Date</div>
                                        <div className="text-sm font-medium text-gray-900 mt-1">{format(new Date(claimDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                )}
                                {claim.sku && (
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">SKU</div>
                                        <div className="text-sm font-mono text-gray-900 mt-1">{claim.sku}</div>
                                    </div>
                                )}
                                {claim.asin && (
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">ASIN</div>
                                        <div className="text-sm font-mono text-gray-900 mt-1">{claim.asin}</div>
                                    </div>
                                )}
                            </div>

                            {claim.details && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Details</div>
                                    <p className="text-sm text-gray-700 mt-1">{claim.details}</p>
                                </div>
                            )}

                            {highlights.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Key Evidence Highlights</div>
                                    <div className="flex flex-wrap gap-2">
                                        {highlights.map((h, i) => (
                                            <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order & Inventory Evidence */}
                    <Card className="border-gray-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-500" />
                                Order & Inventory Evidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {organizedDocs.orderDocs.length > 0 ? (
                                <div className="space-y-2">
                                    {organizedDocs.orderDocs.map((doc, i) => (
                                        <div key={doc.id || i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 text-sm">{doc.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {doc.supplier && <span>Supplier: {doc.supplier} • </span>}
                                                        {doc.invoice && <span>Invoice: {doc.invoice} • </span>}
                                                        {doc.amount && <span>{formatCurrency(doc.amount)}</span>}
                                                    </div>
                                                    {doc.extracted?.order_ids && doc.extracted.order_ids.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {doc.extracted.order_ids.map((id, j) => (
                                                                <span key={j} className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-medium">
                                                                    Order #{id}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge className={doc.confidence && doc.confidence >= 0.85 ? 'bg-emerald-100 text-emerald-700' : doc.confidence && doc.confidence >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}>
                                                    {Math.round((doc.confidence || 0) * 100)}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No order documents matched yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipment & Delivery Evidence */}
                    <Card className="border-gray-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-green-500" />
                                Shipment & Delivery Evidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {organizedDocs.shipmentDocs.length > 0 ? (
                                <div className="space-y-2">
                                    {organizedDocs.shipmentDocs.map((doc, i) => (
                                        <div key={doc.id || i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 text-sm">{doc.name}</div>
                                                    {doc.extracted?.tracking_numbers && doc.extracted.tracking_numbers.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {doc.extracted.tracking_numbers.map((t, j) => (
                                                                <span key={j} className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px] font-medium">
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge className={doc.confidence && doc.confidence >= 0.85 ? 'bg-emerald-100 text-emerald-700' : doc.confidence && doc.confidence >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}>
                                                    {Math.round((doc.confidence || 0) * 100)}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic text-center py-4">No shipment documents matched yet</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Policy Reference */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                                <Scale className="h-4 w-4 text-blue-600" />
                                Policy Reference
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-semibold text-blue-800">{policy.name}</div>
                            <p className="text-sm text-blue-700 mt-2">{policy.excerpt}</p>
                            <p className="text-xs text-blue-600 font-medium mt-3">Filing Deadline: {policy.deadline}</p>
                        </CardContent>
                    </Card>

                    {/* Other Documents */}
                    {organizedDocs.otherDocs.length > 0 && (
                        <Card className="border-gray-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    Additional Supporting Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {organizedDocs.otherDocs.map((doc, i) => (
                                        <div key={doc.id || i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                                            <span className="font-medium text-gray-900 text-sm">{doc.name}</span>
                                            <Badge className="bg-gray-100 text-gray-700">
                                                {Math.round((doc.confidence || 0) * 100)}%
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button onClick={exportAsPdf} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default EvidencePackView;
