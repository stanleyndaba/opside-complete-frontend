import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { EvidenceAuditTrail } from './EvidenceAuditTrail';
import { DocumentChecklist } from './DocumentChecklist';

interface MatchedDocument {
  id: string;
  name?: string;
  type?: string;
  uploadDate?: string;
  supplier?: string;
  invoice?: string;
  amount?: number;
  confidence?: number;
  matchedFields?: string[];
  extracted?: Record<string, unknown>;
}

interface LegacyClaim {
  id: string;
  claim_number?: string;
  type?: string;
  anomaly_type?: string;
  status: string;
  created?: string;
  created_at?: string;
  discovery_date?: string;
  sku?: string;
  asin?: string;
  fnsku?: string;
  details?: string;
  matchedDocs?: MatchedDocument[];
}

interface EvidencePackViewProps {
  open: boolean;
  onClose: () => void;
  claimId?: string | null;
  tenantSlug?: string | null;
  claim?: LegacyClaim | null;
}

interface PacketDocument {
  id: string;
  name: string;
  type: string;
  uploadDate?: string | null;
  ingestedFrom?: string | null;
  parserVersion?: string | null;
  confidence?: number | null;
  supplier?: string | null;
  invoice?: string | null;
  amount?: number | null;
  orderIds: string[];
  trackingNumbers: string[];
  matchedFields: string[];
  extracted: Record<string, unknown>;
}

interface PacketModel {
  caseId: string;
  claimReference: string;
  claimType?: string | null;
  status?: string | null;
  filingStatus?: string | null;
  recoveryStatus?: string | null;
  billingStatus?: string | null;
  requestedAmount?: number | null;
  approvedAmount?: number | null;
  actualPayoutAmount?: number | null;
  billedAmount?: number | null;
  detectedAt?: string | null;
  sellerId?: string | null;
  storeName?: string | null;
  orderId?: string | null;
  amazonCaseId?: string | null;
  sku?: string | null;
  asin?: string | null;
  documents: PacketDocument[];
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getField(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return null;
}

function formatCurrency(value?: number | null, currency = 'USD') {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return format(date, 'MMM dd, yyyy');
}

function formatLabel(value?: string | null) {
  if (!value) return 'Not available';
  return String(value)
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatConfidence(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Confidence unavailable';
  return `${Math.round(value * 100)}% match`;
}

function normalizeDocument(doc: any): PacketDocument {
  const extracted = (doc?.extracted && typeof doc.extracted === 'object' ? doc.extracted : {}) as Record<string, unknown>;
  const parsed = (doc?.parsed_metadata && typeof doc.parsed_metadata === 'object' ? doc.parsed_metadata : {}) as Record<string, unknown>;
  const metadata = (doc?.metadata && typeof doc.metadata === 'object' ? doc.metadata : {}) as Record<string, unknown>;
  const merged = { ...metadata, ...parsed, ...extracted };

  return {
    id: String(doc?.id || ''),
    name: String(doc?.name || doc?.filename || 'Document'),
    type: String(doc?.type || doc?.doc_type || 'document'),
    uploadDate: doc?.ingested_at || doc?.uploadDate || doc?.created_at || null,
    ingestedFrom: String(doc?.source_provider || doc?.provider || getField(merged, ['source_provider', 'source']) || '').trim() || null,
    parserVersion: String(doc?.parser_version || getField(merged, ['parser_version']) || '').trim() || null,
    confidence: toNumber(doc?.matchConfidence ?? doc?.match_confidence ?? doc?.confidence),
    supplier: String(getField(merged, ['supplier_name', 'supplier', 'vendor']) || '').trim() || null,
    invoice: String(getField(merged, ['invoice_number', 'invoice_no', 'invoice', 'inv_number']) || '').trim() || null,
    amount: toNumber(getField(merged, ['unit_price', 'total_amount', 'amount', 'invoice_total'])),
    orderIds: toArray(getField(merged, ['order_ids', 'order_id'])),
    trackingNumbers: toArray(getField(merged, ['tracking_numbers', 'tracking_number', 'tracking'])),
    matchedFields: toArray(doc?.matchedFields || doc?.matched_fields || getField(merged, ['matched_fields'])),
    extracted: merged,
  };
}

function normalizeRecoveryDetail(detail: any): PacketModel {
  const documents = Array.isArray(detail?.documents) ? detail.documents.map(normalizeDocument) : [];
  return {
    caseId: String(detail?.dispute_case_id || detail?.detection_result_id || detail?.id || ''),
    claimReference: String(detail?.case_number || detail?.claim_number || detail?.id || 'Unavailable'),
    claimType: detail?.anomaly_type || detail?.title || null,
    status: detail?.status || null,
    filingStatus: detail?.filing_status || null,
    recoveryStatus: detail?.recovery_status || null,
    billingStatus: detail?.billing_status || null,
    requestedAmount: toNumber(detail?.requested_amount),
    approvedAmount: toNumber(detail?.approved_amount),
    actualPayoutAmount: toNumber(detail?.actual_payout_amount),
    billedAmount: toNumber(detail?.billed_amount),
    detectedAt: detail?.createdDate || null,
    sellerId: detail?.seller_id || null,
    storeName: detail?.store_name || null,
    orderId: detail?.order_id || null,
    amazonCaseId: detail?.amazonCaseId || null,
    sku: detail?.sku || null,
    asin: detail?.asin || null,
    documents,
  };
}

function normalizeLegacyClaim(claim: LegacyClaim): PacketModel {
  const documents = Array.isArray(claim.matchedDocs)
    ? claim.matchedDocs.map((doc) => normalizeDocument(doc))
    : [];

  return {
    caseId: claim.id,
    claimReference: claim.claim_number || claim.id,
    claimType: claim.anomaly_type || claim.type || null,
    status: claim.status,
    detectedAt: claim.discovery_date || claim.created || claim.created_at || null,
    orderId: claim.details || null,
    sku: claim.sku || null,
    asin: claim.asin || null,
    documents,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="border-b border-white/10 bg-white/5 px-4 py-2">
        <h4 className="text-xs font-bold uppercase tracking-tight text-white/80">{title}</h4>
      </div>
      <div className="bg-transparent">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-xs font-bold uppercase tracking-tight text-white/40">{label}</span>
      <span className="text-right text-xs font-bold tracking-tight text-white">{value}</span>
    </div>
  );
}

function renderPacketHtml(packet: PacketModel) {
  const summaryRows: Array<[string, string]> = [
    ['Claim Reference', packet.claimReference],
    ['Claim Type', formatLabel(packet.claimType)],
    ['Case Status', formatLabel(packet.status)],
    ['Filing Status', formatLabel(packet.filingStatus)],
    ['Recovery Status', formatLabel(packet.recoveryStatus)],
    ['Billing Status', formatLabel(packet.billingStatus)],
    ['Requested Amount', formatCurrency(packet.requestedAmount)],
    ['Approved Amount', formatCurrency(packet.approvedAmount)],
    ['Actual Payout', formatCurrency(packet.actualPayoutAmount)],
    ['Billed Amount', formatCurrency(packet.billedAmount)],
    ['Detected / Created', formatDate(packet.detectedAt)],
    ['Amazon Case ID', packet.amazonCaseId || 'Not available'],
    ['Seller ID', packet.sellerId || 'Not available'],
    ['Store', packet.storeName || 'Not available'],
    ['Order ID', packet.orderId || 'Not available'],
    ['SKU', packet.sku || 'Not available'],
    ['ASIN', packet.asin || 'Not available'],
  ];

  const documentRows = packet.documents.map((doc) => `
    <tr>
      <td>${doc.name}</td>
      <td>${formatLabel(doc.type)}</td>
      <td>${doc.ingestedFrom || 'Not available'}</td>
      <td>${doc.invoice || 'Not available'}</td>
      <td>${doc.orderIds[0] || doc.trackingNumbers[0] || 'Not available'}</td>
      <td>${formatConfidence(doc.confidence)}</td>
    </tr>
  `).join('');

  return `
<!doctype html>
<html>
  <head>
    <title>Evidence Packet - ${packet.claimReference}</title>
    <style>
      body { font-family: Inter, Segoe UI, Arial, sans-serif; padding: 32px; color: #0f172a; }
      h1 { margin: 0 0 6px; font-size: 22px; }
      h2 { margin: 28px 0 10px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: left; }
      td:first-child { width: 180px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; }
      th { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
      .meta { color: #64748b; font-size: 12px; }
      .button { position: fixed; right: 24px; top: 24px; padding: 10px 18px; background: #0f172a; color: #fff; border: 0; cursor: pointer; }
      @media print { .button { display: none; } body { padding: 24px; } }
    </style>
  </head>
  <body>
    <button class="button" onclick="window.print()">SAVE AS PDF</button>
    <h1>Evidence Packet</h1>
    <div class="meta">Claim Reference: ${packet.claimReference}</div>
    <div class="meta">Generated ${format(new Date(), 'MMMM dd, yyyy')}</div>

    <h2>Claim Summary</h2>
    <table>
      ${summaryRows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}
    </table>

    <h2>Linked Documents</h2>
    ${packet.documents.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Source</th>
            <th>Invoice</th>
            <th>Linked Field</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>${documentRows}</tbody>
      </table>
    ` : '<div class="meta">No linked documents are currently available.</div>'}
  </body>
</html>`;
}

export function EvidencePackView({ open, onClose, claimId, tenantSlug, claim }: EvidencePackViewProps) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!open || !claimId || !tenantSlug) {
        setDetail(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await api.getRecoveryDetail(claimId, tenantSlug);
        if (!res.ok || !res.data) {
          throw new Error(res.error || 'Unable to load evidence packet.');
        }
        if (!cancelled) {
          setDetail(res.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setDetail(null);
          setError(err?.message || 'Unable to load evidence packet.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [claimId, open, tenantSlug]);

  const packet = useMemo(() => {
    if (detail) return normalizeRecoveryDetail(detail);
    if (claim) return normalizeLegacyClaim(claim);
    return null;
  }, [claim, detail]);

  const organizedDocs = useMemo(() => {
    const documents = packet?.documents || [];
    const orderDocs = documents.filter((doc) =>
      doc.type.toLowerCase().includes('invoice') ||
      doc.type.toLowerCase().includes('order') ||
      doc.type.toLowerCase().includes('purchase') ||
      doc.orderIds.length > 0 ||
      Boolean(doc.invoice)
    );
    const shipmentDocs = documents.filter((doc) =>
      doc.type.toLowerCase().includes('shipment') ||
      doc.type.toLowerCase().includes('tracking') ||
      doc.type.toLowerCase().includes('delivery') ||
      doc.type.toLowerCase().includes('pod') ||
      doc.trackingNumbers.length > 0
    );
    const otherDocs = documents.filter((doc) => !orderDocs.includes(doc) && !shipmentDocs.includes(doc));
    return { orderDocs, shipmentDocs, otherDocs };
  }, [packet]);

  const exportPacket = () => {
    if (!packet) return;

    const popup = window.open('', '_blank');
    if (!popup) {
      toast({
        title: 'Popup blocked',
        description: 'Please allow popups to export the evidence packet.',
        variant: 'destructive',
      });
      return;
    }

    popup.document.write(renderPacketHtml(packet));
    popup.document.close();
    toast({
      title: 'Evidence packet ready',
      description: 'Use print or save as PDF from the new tab.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-white/10 bg-[#0c0c0c] text-white">
        <DialogHeader className="border-b border-white/10 pb-3">
          <DialogTitle className="text-base font-bold uppercase tracking-tight text-white">
            Evidence Packet
          </DialogTitle>
          <DialogDescription className="text-xs text-white/60">
            Claim Reference: {packet?.claimReference || 'Unavailable'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
              Loading evidence packet...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-6 text-sm text-red-200">
              {error}
            </div>
          ) : packet ? (
            <>
              <Section title="Claim Summary">
                <div className="divide-y divide-white/10">
                  <SummaryRow label="Claim Reference" value={packet.claimReference} />
                  <SummaryRow label="Claim Type" value={formatLabel(packet.claimType)} />
                  <SummaryRow label="Case Status" value={formatLabel(packet.status)} />
                  {packet.filingStatus ? <SummaryRow label="Filing Status" value={formatLabel(packet.filingStatus)} /> : null}
                  {packet.recoveryStatus ? <SummaryRow label="Recovery Status" value={formatLabel(packet.recoveryStatus)} /> : null}
                  {packet.billingStatus ? <SummaryRow label="Billing Status" value={formatLabel(packet.billingStatus)} /> : null}
                  <SummaryRow label="Requested Amount" value={formatCurrency(packet.requestedAmount)} />
                  {packet.approvedAmount !== null && packet.approvedAmount !== undefined ? (
                    <SummaryRow label="Approved Amount" value={formatCurrency(packet.approvedAmount)} />
                  ) : null}
                  {packet.actualPayoutAmount !== null && packet.actualPayoutAmount !== undefined ? (
                    <SummaryRow label="Actual Payout" value={formatCurrency(packet.actualPayoutAmount)} />
                  ) : null}
                  {packet.billedAmount !== null && packet.billedAmount !== undefined ? (
                    <SummaryRow label="Billed Amount" value={formatCurrency(packet.billedAmount)} />
                  ) : null}
                  <SummaryRow label="Detected / Created" value={formatDate(packet.detectedAt)} />
                  {packet.amazonCaseId ? <SummaryRow label="Amazon Case ID" value={packet.amazonCaseId} /> : null}
                  {packet.sellerId ? <SummaryRow label="Seller ID" value={packet.sellerId} /> : null}
                  {packet.storeName ? <SummaryRow label="Store" value={packet.storeName} /> : null}
                  {packet.orderId ? <SummaryRow label="Order ID" value={packet.orderId} /> : null}
                  {packet.sku ? <SummaryRow label="SKU" value={packet.sku} /> : null}
                  {packet.asin ? <SummaryRow label="ASIN" value={packet.asin} /> : null}
                </div>
              </Section>

              <Section title="Order & Inventory Evidence">
                {organizedDocs.orderDocs.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {organizedDocs.orderDocs.map((doc) => (
                      <div key={doc.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold tracking-tight text-white">{doc.name}</div>
                            <div className="mt-1 text-xs font-medium tracking-tight text-white/50">
                              {formatLabel(doc.type)} • {doc.ingestedFrom || 'Source unavailable'}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                              {doc.supplier ? <span>Supplier: {doc.supplier}</span> : null}
                              {doc.invoice ? <span>Invoice: {doc.invoice}</span> : null}
                              {doc.amount !== null && doc.amount !== undefined ? <span>{formatCurrency(doc.amount)}</span> : null}
                              {doc.orderIds.length > 0 ? <span>Order: {doc.orderIds[0]}</span> : null}
                            </div>
                          </div>
                          <div className="text-right text-xs font-bold tracking-tight text-white/60">{formatConfidence(doc.confidence)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs font-medium tracking-tight text-white/40">
                    No linked order or invoice evidence is currently available.
                  </div>
                )}
              </Section>

              <Section title="Shipment & Delivery Evidence">
                {organizedDocs.shipmentDocs.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {organizedDocs.shipmentDocs.map((doc) => (
                      <div key={doc.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold tracking-tight text-white">{doc.name}</div>
                            <div className="mt-1 text-xs font-medium tracking-tight text-white/50">
                              {formatLabel(doc.type)} • {doc.ingestedFrom || 'Source unavailable'}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
                              {doc.trackingNumbers.length > 0 ? <span>Tracking: {doc.trackingNumbers[0]}</span> : null}
                              {doc.parserVersion ? <span>Parser: v{doc.parserVersion}</span> : null}
                            </div>
                          </div>
                          <div className="text-right text-xs font-bold tracking-tight text-white/60">{formatConfidence(doc.confidence)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs font-medium tracking-tight text-white/40">
                    No linked shipment or delivery evidence is currently available.
                  </div>
                )}
              </Section>

              {organizedDocs.otherDocs.length > 0 ? (
                <Section title="Additional Linked Documents">
                  <div className="divide-y divide-white/10">
                    {organizedDocs.otherDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold tracking-tight text-white">{doc.name}</div>
                          <div className="mt-1 text-xs font-medium tracking-tight text-white/50">
                            {formatLabel(doc.type)} • {doc.ingestedFrom || 'Source unavailable'}
                          </div>
                        </div>
                        <div className="text-right text-xs font-bold tracking-tight text-white/60">{formatConfidence(doc.confidence)}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              <DocumentChecklist claimId={packet.caseId} compact={false} />
              <EvidenceAuditTrail claimId={packet.caseId} compact={false} />
            </>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/50">
              Evidence packet data is unavailable for this case.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 rounded-sm border-white/10 text-xs text-white/60 hover:bg-white/5"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={exportPacket}
            disabled={!packet}
            className="h-8 rounded-sm border border-white/10 bg-white/10 text-xs text-white hover:bg-white/20"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EvidencePackView;
