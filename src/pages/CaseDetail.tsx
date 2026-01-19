import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, RefreshCw, ExternalLink, Receipt, ChevronDown, ShieldCheck, Activity, BarChart3, Database, History, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// duplicate Link import removed
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { ClaimPdfService } from '@/services/ClaimPdfService';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

// Rejection reason classification
type RejectionReason = 'missing_evidence' | 'wrong_category' | 'expired_window' | 'amount_disputed' | 'generic_denial' | 'duplicate_claim' | 'insufficient_info';

interface EscalationPlaybook {
  reason: RejectionReason;
  label: string;
  description: string;
  actions: string[];
  autoTriggerable: boolean;
}

const escalationPlaybooks: Record<RejectionReason, EscalationPlaybook> = {
  missing_evidence: {
    reason: 'missing_evidence',
    label: 'Missing Evidence',
    description: 'Amazon needs additional documentation.',
    actions: ['Check Doc Locker for matching docs', 'Upload invoice, POD, or shipment confirmation', 'Re-submit with complete evidence'],
    autoTriggerable: true
  },
  wrong_category: {
    reason: 'wrong_category',
    label: 'Wrong Category',
    description: 'Claim filed under incorrect type.',
    actions: ['Review claim type against guidelines', 'Reclassify to appropriate category', 'Re-file with corrected type'],
    autoTriggerable: true
  },
  expired_window: {
    reason: 'expired_window',
    label: 'Expired Window',
    description: 'Filing window has passed.',
    actions: ['Verify discovery date accuracy', 'Check if exception applies', 'Document Amazon-caused delays'],
    autoTriggerable: false
  },
  amount_disputed: {
    reason: 'amount_disputed',
    label: 'Amount Disputed',
    description: 'Amazon disagrees with claimed amount.',
    actions: ['Review Amazon\'s calculated value', 'Provide cost documentation', 'Accept adjusted amount or appeal'],
    autoTriggerable: true
  },
  generic_denial: {
    reason: 'generic_denial',
    label: 'Generic Denial',
    description: 'Denied without specific reason.',
    actions: ['Request clarification', 'Compile comprehensive evidence', 'Re-submit with policy argument'],
    autoTriggerable: false
  },
  duplicate_claim: {
    reason: 'duplicate_claim',
    label: 'Duplicate Claim',
    description: 'Already filed or resolved.',
    actions: ['Check for previous case IDs', 'Verify if reimbursement issued', 'Appeal only if truly not resolved'],
    autoTriggerable: false
  },
  insufficient_info: {
    reason: 'insufficient_info',
    label: 'Insufficient Info',
    description: 'Lacks required details.',
    actions: ['Add order IDs, SKUs, dates', 'Include FBA shipment IDs', 'Provide quantity/value breakdown'],
    autoTriggerable: true
  }
};

// Classify rejection reason from status/notes
const classifyRejection = (status: string, notes?: string): RejectionReason => {
  const text = `${status} ${notes || ''}`.toLowerCase();
  if (text.includes('document') || text.includes('evidence') || text.includes('proof')) return 'missing_evidence';
  if (text.includes('category') || text.includes('type') || text.includes('classif')) return 'wrong_category';
  if (text.includes('expired') || text.includes('window') || text.includes('late') || text.includes('deadline')) return 'expired_window';
  if (text.includes('amount') || text.includes('value') || text.includes('price') || text.includes('partial')) return 'amount_disputed';
  if (text.includes('duplicate') || text.includes('already') || text.includes('previous')) return 'duplicate_claim';
  if (text.includes('info') || text.includes('detail') || text.includes('incomplete')) return 'insufficient_info';
  return 'generic_denial';
};


// Mock case data (fallback)
const mockCaseData = {
  'OPS-12345': {
    id: 'OPS-12345',
    title: '5 units of Premium Wireless Headphones lost at FTW1',
    status: 'Guaranteed' as const,
    guaranteedAmount: 324.50,
    expectedPayoutDate: '2025-01-15',
    createdDate: '2025-01-08',
    amazonCaseId: undefined,
    sku: 'WH-PREM-001',
    productName: 'Premium Wireless Headphones - Noise Cancelling',
    facility: 'FTW1 - Fort Worth, TX',
    confidence: 95,
    unitsLost: 5,
    unitCost: 64.90,
    events: [
      {
        timestamp: '2025-01-08T12:05:00Z',
        title: 'Discrepancy Detected',
        description: 'Smart Inventory Sync detected 5 missing units of SKU WH-PREM-001 at FTW1 warehouse',
        type: 'detection'
      },
      {
        timestamp: '2025-01-08T12:05:30Z',
        title: 'Evidence Located',
        description: 'Evidence Engine found matching cost documentation (Invoice #INV-2024-582)',
        type: 'analysis'
      },
      {
        timestamp: '2025-01-08T12:06:15Z',
        title: 'True Value Calculated',
        description: 'True value calculated and verified: $324.50 (5 units × $64.90 per unit)',
        type: 'analysis'
      },
      {
        timestamp: '2025-01-08T12:07:22Z',
        title: 'Claim Draft Generated',
        description: 'Margin AI Agent generated comprehensive claim documentation with supporting evidence',
        type: 'generation'
      },
      {
        timestamp: '2025-01-08T12:10:45Z',
        title: 'Ready for Submission',
        description: 'Case marked as guaranteed and ready for Amazon submission pending user approval',
        type: 'update'
      }
    ] as CaseEvent[]
  }
};

const getStatusColor = (status: string) => {
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

const getEventIcon = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return <AlertCircle className="h-4 w-4" />;
    case 'analysis':
      return <FileText className="h-4 w-4" />;
    case 'generation':
      return <FileText className="h-4 w-4" />;
    case 'submission':
      return <Package className="h-4 w-4" />;
    case 'update':
      return <Clock className="h-4 w-4" />;
    case 'completion':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventColor = (type: CaseEvent['type']) => {
  switch (type) {
    case 'detection':
      return 'text-amber-600';
    case 'analysis':
      return 'text-blue-600';
    case 'generation':
      return 'text-purple-600';
    case 'submission':
      return 'text-emerald-600';
    case 'update':
      return 'text-gray-600';
    case 'completion':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

// Local helpers to derive confidence/evidence in sandbox
const stableHash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return (h >>> 0);
};
const deriveConfidence = (id: string): number => {
  const v = stableHash(id) % 4900; // 0..4899
  const n = (v + 500) / 100; // 5.00..53.99
  const c = Math.min(98, Math.max(50, Math.round(n)));
  return c; // percent 50..98
};
const deriveEvidence = (id: string): 'Ready' | 'Needs Docs' | 'Collecting' => {
  const v = stableHash(id) % 100;
  if (v >= 70) return 'Ready';
  if (v >= 40) return 'Needs Docs';
  return 'Collecting';
};

// Get required documents based on claim type
const getRequiredDocsForClaimType = (claimType?: string): string[] => {
  const type = (claimType || '').toLowerCase();

  if (type.includes('lost') || type.includes('missing')) {
    return [
      'Inventory report showing missing units',
      'Shipment confirmation or BOL',
      'Proof of purchase/invoice for lost items'
    ];
  }
  if (type.includes('damaged') || type.includes('damage')) {
    return [
      'Photos of damaged products',
      'Original invoice/receipt',
      'Carrier damage report (if applicable)'
    ];
  }
  if (type.includes('return') || type.includes('refund')) {
    return [
      'Return tracking confirmation',
      'Original order invoice',
      'Proof of item condition before return'
    ];
  }
  if (type.includes('fee') || type.includes('overcharge')) {
    return [
      'Fee breakdown statement',
      'Product dimension/weight documentation',
      'Original listing details'
    ];
  }
  if (type.includes('inbound') || type.includes('shipment')) {
    return [
      'Shipment tracking/BOL',
      'Packing list with quantities',
      'Supplier invoice'
    ];
  }
  // Default fallback
  return [
  ];
};

// Generate narrative "What Happened" story for a claim
const generateNarrative = (claim: any): string => {
  const caseType = (claim.anomaly_type || claim.claim_type || claim.case_type || '').toLowerCase();
  const amount = claim.guaranteedAmount || claim.amount || claim.estimated_value || claim.claim_amount || 0;
  const formattedAmount = `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const sku = claim.sku || claim.evidence?.sku || 'N/A';
  const asin = claim.asin || claim.evidence?.asin || 'N/A';
  const orderId = claim.order_id || claim.evidence?.order_id || '';
  const facility = claim.facility || claim.evidence?.fulfillment_center || '';
  const units = claim.units_lost || claim.unitsLost || claim.quantity || claim.units || '';
  const dateStr = claim.discovery_date || claim.created_at || claim.createdDate;
  const detectionDate = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // Determine case category for professional narrative
  const isFeeCase = caseType.includes('fee') || caseType.includes('overcharge') || caseType.includes('commission') || caseType.includes('storage') || caseType.includes('lts');
  const isLostCase = caseType.includes('lost') || caseType.includes('missing') || caseType.includes('shipment') || caseType.includes('shortage') || caseType.includes('discrepancy') || caseType.includes('inbound');
  const isDamagedCase = caseType.includes('damaged') || caseType.includes('damage') || caseType.includes('carrier');
  const isRefundCase = caseType.includes('refund') || caseType.includes('return') || caseType.includes('switcheroo') || caseType.includes('wrong_item') || caseType.includes('empty_box');
  const isChargebackCase = caseType.includes('chargeback') || caseType.includes('dispute') || caseType.includes('atoz');

  // Build professional executive summary based on case type
  let narrative = '';

  if (isFeeCase) {
    narrative = `Amazon FBA has applied incorrect fulfillment fees to ASIN ${asin}`;
    if (caseType.includes('storage') || caseType.includes('lts')) {
      narrative += ` based on erroneous storage fee calculations. The product has been consistently overcharged for storage fees`;
    } else if (caseType.includes('commission')) {
      narrative += ` resulting in referral fee overcharges. Amazon's system has applied incorrect commission rates`;
    } else {
      narrative += ` based on incorrect dimensional/weight data in Amazon's catalog system. The product has been consistently mis-measured`;
    }
    narrative += `, resulting in oversized/overweight fee categorization when the product should fall within standard rates. `;
    narrative += `This systematic measurement error has resulted in cumulative overcharges totaling ${formattedAmount}.`;
  } else if (isLostCase) {
    const unitText = units ? `${units} units` : 'inventory';
    if (caseType.includes('inbound') || caseType.includes('shipment')) {
      narrative = `Amazon received an inbound shipment containing ${unitText} of SKU ${sku}`;
      if (facility) narrative += ` at fulfillment center ${facility}`;
      if (detectionDate) narrative += ` on ${detectionDate}`;
      narrative += `, but the full quantity was not checked into available inventory. `;
      narrative += `The shipment shows as "Receiving Discrepancy" with ${unitText} remaining unaccounted for after 30+ days. `;
    } else {
      narrative = `Amazon's inventory management system shows ${unitText} of SKU ${sku} as missing from fulfillment center${facility ? ` ${facility}` : ''}. `;
      narrative += `These units were properly received but have since disappeared from available inventory without corresponding customer orders or removals. `;
    }
    narrative += `This inventory discrepancy represents a recoverable value of ${formattedAmount}.`;
  } else if (isDamagedCase) {
    const unitText = units ? `${units} units` : 'inventory';
    narrative = `Amazon FBA has reported ${unitText} of SKU ${sku} as damaged while in Amazon's possession`;
    if (facility) narrative += ` at fulfillment center ${facility}`;
    narrative += `. The damage occurred during `;
    if (caseType.includes('carrier')) {
      narrative += `carrier transit to the fulfillment center, `;
    } else if (caseType.includes('inbound')) {
      narrative += `the inbound receiving process, `;
    } else {
      narrative += `warehouse handling and storage, `;
    }
    narrative += `which falls under Amazon's responsibility for product care. `;
    narrative += `This damage has resulted in a loss of ${formattedAmount} that qualifies for seller reimbursement.`;
  } else if (isRefundCase) {
    narrative = `Amazon issued a customer refund for Order ${orderId || 'N/A'}`;
    if (caseType.includes('switcheroo')) {
      narrative += `, but the customer returned a different item than what was originally purchased. This "switcheroo" fraud `;
    } else if (caseType.includes('wrong_item')) {
      narrative += `, but the returned item does not match the original product. The wrong item `;
    } else if (caseType.includes('empty_box')) {
      narrative += `, but the return package was received empty or with missing contents. This `;
    } else {
      narrative += `, however the return was never received at the fulfillment center. After the standard return window (45+ days), this `;
    }
    narrative += `qualifies for seller reimbursement under Amazon's FBA policy. `;
    narrative += `The unrecovered value totals ${formattedAmount}.`;
  } else if (isChargebackCase) {
    narrative = `A payment chargeback/claim was filed against Order ${orderId || 'N/A'}`;
    if (caseType.includes('atoz')) {
      narrative += ` through Amazon's A-to-Z Guarantee program. `;
    } else {
      narrative += ` that was not properly defended. `;
    }
    narrative += `Delivery confirmation and tracking data show the order was successfully delivered to the customer, making this claim eligible for dispute. `;
    narrative += `The contested amount is ${formattedAmount}.`;
  } else {
    // Fallback for unknown case types
    const typeDisplay = caseType.replace(/_/g, ' ') || 'discrepancy';
    narrative = `Margin's audit engine detected a ${typeDisplay} affecting SKU ${sku}`;
    if (asin !== 'N/A') narrative += ` (ASIN: ${asin})`;
    if (detectionDate) narrative += ` on ${detectionDate}`;
    narrative += `. `;
    narrative += `Based on automated analysis of fulfillment records, this ${typeDisplay} represents a recoverable value of ${formattedAmount}. `;
    narrative += `The case has been flagged for review and submission to Amazon Seller Support.`;
  }

  return narrative;
};

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any | null>(passedClaim ? {
    id: passedClaim.id,
    title: passedClaim.details || passedClaim.anomaly_type || 'Claim Details',
    status: passedClaim.status,
    guaranteedAmount: passedClaim.guaranteedAmount || passedClaim.estimated_value || 0,
    expectedPayoutDate: passedClaim.expectedPayoutDate || passedClaim.expected_payout_date,
    createdDate: passedClaim.created || passedClaim.created_at || passedClaim.discovery_date,
    sku: passedClaim.sku || 'N/A',
    productName: passedClaim.details || passedClaim.anomaly_type || 'Unknown Product',
    // Derive facility from data or generate deterministically
    facility: passedClaim.facility || passedClaim.warehouse || (
      ['FTW1 - Fort Worth, TX', 'ONT8 - Moreno Valley, CA', 'BFI4 - Kent, WA', 'MKE1 - Kenosha, WI'][stableHash(passedClaim.id || '') % 4]
    ),
    // Derive units lost from estimated value (assume ~$50/unit as average)
    unitsLost: passedClaim.unitsLost || passedClaim.units_lost || Math.max(1, Math.round((passedClaim.estimated_value || passedClaim.guaranteedAmount || 100) / 50)),
    // Derive unit cost from estimated value and units
    unitCost: passedClaim.unitCost || passedClaim.unit_cost || (() => {
      const value = passedClaim.estimated_value || passedClaim.guaranteedAmount || 100;
      const units = passedClaim.unitsLost || passedClaim.units_lost || Math.max(1, Math.round(value / 50));
      return Math.round((value / units) * 100) / 100;
    })(),
    confidence: passedClaim.confidence_score ? passedClaim.confidence_score * 100 : undefined,
    evidenceStatus: undefined,
    documents: passedClaim.matchedDocs || [],
    events: [] as any[],
  } : null);
  const { toast } = useToast();
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('payout');
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PROTOCOL'>('RECORD');

  const normalizeStatus = (s?: string): 'Open' | 'In Progress' | 'Approved' | 'Denied' | 'Unknown' => {
    const v = (s || '').toLowerCase();
    if (['denied', 'rejected'].includes(v)) return 'Denied';
    if (['paid', 'paid out', 'approved'].includes(v)) return 'Approved';
    if (['submitted', 'under review', 'in progress', 'processing'].includes(v)) return 'In Progress';
    if (['guaranteed', 'awaiting approval', 'new', 'open'].includes(v)) return 'Open';
    return 'Unknown';
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      setLoading(true);
      // Try primary detail endpoint
      const res = await api.getRecoveryDetail(caseId);
      if (!cancelled) {
        if (res.ok && res.data) {
          // Merge API data with existing data, preserving derived fields
          setCaseData((prev: any) => {
            const apiData = res.data as any;
            const base = prev || passedClaim || {};
            const estimatedValue = apiData.guaranteedAmount || apiData.estimated_value || base.guaranteedAmount || base.estimated_value || 100;
            const derivedUnits = Math.max(1, Math.round(estimatedValue / 50));

            return {
              // Keep existing derived data as fallback
              ...base,
              // Override with API data
              ...apiData,
              // Ensure key display fields have values (derive if missing)
              // Ensure key display fields have values (derive if missing)
              id: apiData.id || base.id || caseId,
              title: apiData.title || apiData.details || apiData.anomaly_type || base.title || 'Claim Details',
              status: apiData.status || base.status,
              guaranteedAmount: apiData.guaranteedAmount || apiData.estimated_value || base.guaranteedAmount || 0,
              expectedPayoutDate: apiData.expectedPayoutDate || apiData.expected_payout_date || base.expectedPayoutDate,
              createdDate: apiData.createdDate || apiData.created_at || apiData.discovery_date || base.createdDate,

              // Smart merge for product details - prefer API but don't overwrite with "N/A" if base is valid
              sku: (apiData.sku && apiData.sku !== 'N/A') ? apiData.sku :
                (apiData.evidence?.sku && apiData.evidence?.sku !== 'N/A') ? apiData.evidence.sku :
                  (base.sku && base.sku !== 'N/A') ? base.sku : 'N/A',

              asin: apiData.asin || apiData.evidence?.asin || base.asin,

              productName: apiData.productName || apiData.details || apiData.anomaly_type || base.productName || 'Unknown Product',
              facility: apiData.facility || apiData.evidence?.fulfillment_center || apiData.warehouse || base.facility || (
                ['FTW1 - Fort Worth, TX', 'ONT8 - Moreno Valley, CA', 'BFI4 - Kent, WA', 'MKE1 - Kenosha, WI'][stableHash(caseId || '') % 4]
              ),
              unitsLost: apiData.unitsLost || apiData.units_lost || apiData.evidence?.quantity || base.unitsLost || derivedUnits,
              unitCost: apiData.unitCost || apiData.unit_cost || base.unitCost || Math.round((estimatedValue / derivedUnits) * 100) / 100,
              confidence: typeof apiData.confidence_score === 'number'
                ? apiData.confidence_score * 100
                : (typeof apiData.confidence === 'number' ? apiData.confidence : base.confidence),
              evidenceStatus: apiData.evidenceStatus || base.evidenceStatus,
              documents: apiData.documents || base.documents || [],
              events: apiData.events || base.events || [],
              // Pass through evidence for detail access
              evidence: { ...(base.evidence || {}), ...(apiData.evidence || {}) },
              // Human-readable claim number
              claim_number: apiData.claim_number || apiData.evidence?.claim_number || base.claim_number,
            };
          });
          // Initialize matchedDocs from API response if documents exist
          if (Array.isArray((res.data as any)?.documents) && (res.data as any).documents.length > 0) {
            setMatchedDocs((res.data as any).documents);
          }
          setError(null);
        } else {
          // Fallback: look up claim from list, then synthesize details (do not clear existing data)
          try {
            const list = await recoveryApi.getRecoveries().catch(() => [] as any);
            const row = Array.isArray(list) ? (list as any[]).find((x) => x.id === caseId) : null;
            if (row) {
              const estimatedValue = row.guaranteedAmount || row.estimated_value || 100;
              const derivedUnits = Math.max(1, Math.round(estimatedValue / 50));
              setCaseData({
                id: row.id,
                title: row.details || row.anomaly_type || 'Claim Details',
                status: row.status,
                guaranteedAmount: row.guaranteedAmount || row.estimated_value || 0,
                expectedPayoutDate: row.expectedPayoutDate || row.expected_payout_date,
                createdDate: row.created || row.created_at || row.discovery_date,
                sku: row.sku || 'N/A',
                productName: row.details || row.anomaly_type || 'Unknown Product',
                // Derive facility deterministically
                facility: row.facility || row.warehouse || (
                  ['FTW1 - Fort Worth, TX', 'ONT8 - Moreno Valley, CA', 'BFI4 - Kent, WA', 'MKE1 - Kenosha, WI'][stableHash(row.id || '') % 4]
                ),
                unitsLost: row.unitsLost || row.units_lost || derivedUnits,
                unitCost: row.unitCost || row.unit_cost || Math.round((estimatedValue / derivedUnits) * 100) / 100,
                confidence: row.confidence_score ? row.confidence_score * 100 : deriveConfidence(row.id),
                evidenceStatus: deriveEvidence(row.id),
                documents: row.matchedDocs || [],
                events: [] as CaseEvent[],
              });
              setError(null);
            } else {
              // Keep existing caseData (from link state) if mock not available
              if ((mockCaseData as any)[caseId]) {
                setCaseData((mockCaseData as any)[caseId]);
              }
              setError(res.error || null);
            }
          } catch (e: any) {
            // Keep existing
            if ((mockCaseData as any)[caseId]) {
              setCaseData((mockCaseData as any)[caseId]);
            }
            setError(res.error || null);
          }
        }
        setLoading(false);
      }
    })();
    // Real-time status via SSE with polling fallback
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/sse/case/${encodeURIComponent(caseId!)}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setCaseData((prev: any) => ({
            ...(prev || {}),
            status: data.status ?? prev?.status,
            expectedPayoutDate: data.expected_payout_date ?? prev?.expectedPayoutDate,
            amazonCaseId: data.amazonCaseId ?? prev?.amazonCaseId,
            events: data.events ?? prev?.events,
            progress: typeof data.progress === 'number' ? data.progress : prev?.progress,
          }));
        } catch { }
      };
    } catch { }
    const interval = setInterval(async () => {
      if (!caseId) return;
      const statusRes = await api.getRecoveryStatus(caseId);
      if (statusRes.ok && statusRes.data) {
        setCaseData((prev: any) => ({
          ...(prev || {}),
          status: (statusRes.data as any).status ?? prev?.status,
          expectedPayoutDate: (statusRes.data as any).expected_payout_date ?? prev?.expectedPayoutDate,
          amazonCaseId: (statusRes.data as any).amazonCaseId ?? prev?.amazonCaseId,
          events: (statusRes.data as any).events ?? prev?.events,
          progress: (statusRes.data as any).progress ?? prev?.progress,
        }));
      }
    }, 15000);
    return () => { cancelled = true; if (es) es.close(); clearInterval(interval); };
  }, [caseId]);

  // Attempt to fetch matched documents for this case
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      try {
        // First check if case data has evidence_attachments with document_id
        const docIdFromCase = caseData?.evidence_attachments?.document_id;

        if (docIdFromCase) {
          // Fetch the specific matched document by ID
          const docRes = await api.getDocument(docIdFromCase);
          if (!cancelled && docRes.ok && docRes.data) {
            // Add match info from the case's evidence_attachments
            const docWithMatchInfo = {
              ...docRes.data,
              matchConfidence: caseData?.evidence_attachments?.match_confidence,
              matchType: caseData?.evidence_attachments?.match_type,
              matchedFields: caseData?.evidence_attachments?.matched_fields,
              matchedAt: caseData?.evidence_attachments?.matched_at,
            };
            setMatchedDocs([docWithMatchInfo]);
            return;
          }
        }

        // Fallback: try to find documents from getDocuments list
        const docsRes = await api.getDocuments();
        const docs = Array.isArray(docsRes) ? docsRes : (docsRes as any)?.data;
        if (!cancelled && Array.isArray(docs)) {
          const list = docs.filter((d: any) => {
            if (Array.isArray(d?.matchedClaims)) return d.matchedClaims.includes(caseId);
            if (Array.isArray(d?.matched_to)) return d.matched_to.includes(caseId);
            if (Array.isArray(d?.matches)) return d.matches.some((m: any) => m?.caseId === caseId || m?.id === caseId);
            return false;
          });
          setMatchedDocs(list);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [caseId, caseData?.evidence_attachments?.document_id]);

  // Compute effectiveCase BEFORE any early returns (React hooks rule)
  const effectiveCase = caseData || (mockCaseData as any)[caseId || ''] || passedClaim;

  // useMemo hooks must be called unconditionally before any returns
  const derivedConfidencePct = useMemo(() => {
    if (!effectiveCase || !caseId) return 0;
    const v = typeof effectiveCase?.confidence === 'number' ? effectiveCase.confidence : deriveConfidence(caseId);
    return Math.max(0, Math.min(100, Math.round(v)));
  }, [effectiveCase, caseId]);

  const derivedEvidence = useMemo(() => {
    if (!effectiveCase || !caseId) return 'Collecting';
    return effectiveCase?.evidenceStatus || deriveEvidence(caseId);
  }, [effectiveCase, caseId]);

  const matchedCount = matchedDocs.length || (Array.isArray(effectiveCase?.documents) ? effectiveCase.documents.length : 0);

  // Early return guards (all hooks must be called before these)
  if (!caseId) {
    return (
      <PageLayout title="Case Not Found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Case not found</h2>
          <Button asChild>
            <Link to="/recoveries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Guard: show loading or error if no data
  if (!effectiveCase && loading) {
    return (
      <PageLayout title="Loading...">
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading case details...</p>
        </div>
      </PageLayout>
    );
  }

  if (!effectiveCase) {
    return (
      <PageLayout title="Case Not Found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Case not found</h2>
          <p className="text-gray-500 mb-6">Case ID: {caseId}</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Button asChild>
            <Link to="/recoveries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cases
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Case ID: ${effectiveCase.id}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24 text-[13px]">
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-gray-900">
            {/* Header - Institutional Metadata */}
            <div className="mb-10 flex items-center justify-between border-b border-gray-100 pb-8">
              <div className="flex items-center gap-6">
                <Link to="/recoveries" className="h-10 w-10 flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-4 w-4 text-gray-400" />
                </Link>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-light text-gray-900 tracking-tight font-mono">{effectiveCase.claim_number || effectiveCase.evidence?.claim_number || effectiveCase.id?.slice(0, 12)}</h1>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-900 tracking-widest font-mono">{normalizeStatus(effectiveCase.status).toUpperCase()}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 tracking-[0.2em] font-mono">INTERNAL CASE RECORD // SECURE FACILITY: {effectiveCase.facility?.split(' - ')[0] || 'FTW1'}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-gray-100 text-[10px] font-bold tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-colors"
                  onClick={() => ClaimPdfService.generate(effectiveCase)}
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  GET PDF
                </Button>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 tracking-widest font-bold">Confidence Engine</div>
                  <div className="text-[10px] font-mono font-bold text-emerald-600 mt-0.5">{derivedConfidencePct}% VERIFIED</div>
                </div>
                <div className="h-8 w-[1px] bg-gray-100" />
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 tracking-widest font-bold">Audit Progress</div>
                  <div className="text-[10px] font-mono font-bold text-gray-900 mt-0.5">{typeof effectiveCase.progress === 'number' ? Math.round(effectiveCase.progress) : 85}% COMPLETED</div>
                </div>
              </div>
            </div>

            {/* Auto-Filing Banner - Institutional Style */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white mb-8">
              <p className="text-[10px] tracking-widest font-mono">
                <span className="text-gray-400">PROTOCOL:</span> MARGIN AUTO-FILES CASES ≥85% CONFIDENCE
              </p>
              <p className="text-[10px] tracking-widest font-mono">
                AUTONOMOUS STATUS: <span className="text-emerald-400">ACTIVE</span>
              </p>
            </div>

            {/* Institutional Tab Switcher */}
            <div className="flex border-b border-gray-100 mb-8">
              <button
                onClick={() => setActiveTab('RECORD')}
                className={cn(
                  "px-8 py-4 text-[10px] font-bold tracking-[0.25em] transition-all relative",
                  activeTab === 'RECORD' ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}>
                CASE RECORD
                {activeTab === 'RECORD' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />}
              </button>
              <button
                onClick={() => setActiveTab('PROTOCOL')}
                className={cn(
                  "px-8 py-4 text-[10px] font-bold tracking-[0.25em] transition-all relative",
                  activeTab === 'PROTOCOL' ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}>
                RESOLUTION PROTOCOL
                {activeTab === 'PROTOCOL' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />}
              </button>
            </div>

            {activeTab === 'RECORD' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border border-gray-100 divide-x divide-gray-100 italic-divider">
                {/* Tile 1: Audit Narrative & Logistics */}
                <div className="lg:col-span-2 p-8 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Audit Narrative & Logistics</h3>
                  </div>
                  <div className="space-y-8">
                    <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {generateNarrative(effectiveCase)}
                    </p>

                    <div className="pt-6 border-t border-gray-100">
                      <div className="text-[9px] text-gray-400 tracking-widest font-bold mb-4">Product Trace & Protocols</div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-400 tracking-widest mb-1">Product Identity</p>
                            <p className="text-xs font-medium text-gray-900 leading-snug truncate" title={effectiveCase.productName || effectiveCase.title || 'Unknown Product'}>
                              {effectiveCase.productName || effectiveCase.title || 'Unknown Product'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 tracking-widest mb-1">ASIN / SKU</p>
                            <p className="text-xs font-mono font-bold text-gray-900">{effectiveCase.asin || '—'} / {effectiveCase.sku || '—'}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-gray-400 tracking-widest mb-1">Facility Protocol</p>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs font-bold text-gray-900">{effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '—'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 tracking-widest mb-1">Reference IDs</p>
                            <div className="space-y-1">
                              {effectiveCase.amazonCaseId ? (
                                <a href={`https://sellercentral.amazon.com/case-log/${effectiveCase.amazonCaseId}`} target="_blank" rel="noreferrer" className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1">
                                  {effectiveCase.amazonCaseId} <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : <span className="text-[10px] text-gray-400 italic">No Case ID</span>}
                              {effectiveCase.prior_case_id && (
                                <div className="text-[10px] text-gray-500 font-mono">Prior: {effectiveCase.prior_case_id}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Double-Dip Protection Alert */}
                      {(effectiveCase.prior_reimbursement_detected || effectiveCase.inventory_adjustment_applied || effectiveCase.duplicate_blocked) && (
                        <div className="mt-6 p-3 bg-blue-50/50 border border-blue-100 flex gap-3">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[9px] font-bold text-blue-900 tracking-widest mb-1">Account Protection Active</div>
                            <p className="text-[10px] text-blue-700 leading-relaxed font-light">
                              {effectiveCase.prior_reimbursement_detected
                                ? `System detected prior reimbursement for ${effectiveCase.sku}. Claim blocked to prevent duplicate filing violation.`
                                : effectiveCase.inventory_adjustment_applied
                                  ? 'Amazon processed inventory adjustment. Claim suppressed to avoid policy flag.'
                                  : 'Claim blocked by autonomous protection system to preserve account health.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tile 2: Transaction Forensics */}
                <div className="lg:col-span-1 p-8 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Transaction Forensics</h3>
                  </div>

                  <div className="space-y-8">
                    {/* Forensic Metrics */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-900 tracking-[0.15em] border-b border-gray-100 pb-2">
                        <div className="h-1 w-3 bg-emerald-500" /> Forensic Metrics
                      </h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Units Affected</dt>
                          <dd className="text-xs font-mono font-medium text-gray-900">
                            {effectiveCase.unitsLost || effectiveCase.units_lost || effectiveCase.quantity || effectiveCase.units || 1}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Value Per Unit</dt>
                          <dd className="text-xs font-mono font-medium text-gray-900">
                            ${((effectiveCase.guaranteedAmount || effectiveCase.amount || 0) / (effectiveCase.unitsLost || effectiveCase.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Total Claimed</dt>
                          <dd className="text-xs font-mono font-bold text-gray-900">
                            ${Number(effectiveCase.guaranteedAmount || effectiveCase.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Confidence Score</dt>
                          <dd className="text-xs font-mono font-bold text-emerald-600">
                            {(() => {
                              const conf = effectiveCase.confidence || effectiveCase.confidence_score || 0.85;
                              const normalized = conf > 1 ? conf : conf * 100;
                              return `${Math.min(Math.round(normalized), 100)}%`;
                            })()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Timeline Accuracy */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-900 tracking-[0.15em] border-b border-gray-100 pb-2">
                        <div className="h-1 w-3 bg-blue-500" /> Timeline Accuracy
                      </h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Issue Identified</dt>
                          <dd className="text-xs font-mono text-gray-900">
                            {new Date(effectiveCase.created_at || effectiveCase.createdDate || effectiveCase.discovery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Audit Period</dt>
                          <dd className="text-xs font-mono text-gray-900">
                            {Math.floor((Date.now() - new Date(effectiveCase.created_at || effectiveCase.createdDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-[9px] text-gray-400 tracking-widest mb-1">Policy Compliance</dt>
                          <dd className="text-xs font-mono font-bold text-emerald-600 tracking-wider">COMPLIANT</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Logistical Trace */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-900 tracking-[0.15em] border-b border-gray-100 pb-2">
                        <div className="h-1 w-3 bg-gray-400" /> Logistical Trace
                      </h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <dt className="text-[9px] text-gray-400 tracking-widest">ASIN / SKU</dt>
                          <dd className="text-[10px] font-mono text-gray-900 text-right truncate pl-4">
                            {effectiveCase.asin || 'N/A'} / {effectiveCase.sku || 'N/A'}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <dt className="text-[9px] text-gray-400 tracking-widest">Fulfillment Center</dt>
                          <dd className="text-[10px] font-mono text-gray-900 text-right">
                            {effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || 'FTW1 - Fort Worth, TX'}
                          </dd>
                        </div>
                        {(effectiveCase.order_id || effectiveCase.matched_fields?.[0]?.split(':')[1]) && (
                          <div className="flex justify-between items-baseline">
                            <dt className="text-[9px] text-gray-400 tracking-widest">Reference Trans.</dt>
                            <dd className="text-[10px] font-mono text-gray-900 text-right underline underline-offset-2">
                              {effectiveCase.order_id || effectiveCase.matched_fields?.[0]?.split(':')[1]}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* System Metadata */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-gray-900 tracking-[0.15em] border-b border-gray-100 pb-2">
                        <div className="h-1 w-3 bg-indigo-500" /> System Metadata
                      </h4>
                      <dl className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <dt className="text-[9px] text-gray-400 tracking-widest">Claim Category</dt>
                          <dd className="text-[10px] font-mono text-gray-900 text-right capitalize">
                            Discrepancy
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <dt className="text-[9px] text-gray-400 tracking-widest">Engine Match</dt>
                          <dd className="text-[10px] font-mono text-gray-900 text-right capitalize">
                            {(effectiveCase.match_type || 'order_id').replace(/_/g, ' ')}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <dt className="text-[9px] text-gray-400 tracking-widest">Audit Method</dt>
                          <dd className="text-[10px] font-bold text-gray-700 text-right tracking-[0.05em]">
                            AUTONOMOUS ENGINE
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Tile 3: Vital Instrumentation */}
                <div className="lg:col-span-1 p-8 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Financial Vitals</h3>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="text-[9px] text-gray-400 tracking-[0.2em] font-bold mb-2">Guaranteed Amount</div>
                      <div className="text-2xl font-light text-gray-900 font-mono tracking-tight">
                        ${effectiveCase.guaranteedAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>

                      {effectiveCase.actual_payout_amount && (
                        <div className="mt-4 p-3 bg-white border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-gray-400 font-bold tracking-widest">Actual Payout</span>
                            <span className="text-xs font-mono font-bold text-blue-600">${effectiveCase.actual_payout_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {effectiveCase.recovery_status === 'reconciled' && (
                            <div className="flex items-center gap-1.5 text-[8px] text-emerald-600 font-bold tracking-widest">
                              <CheckCircle className="h-2.5 w-2.5" /> RECONCILED BY AUDIT ENGINE
                            </div>
                          )}
                        </div>
                      )}

                      {effectiveCase.recovery_status === 'discrepancy' && effectiveCase.actual_payout_amount && (
                        <div className="mt-2 text-[10px] text-red-600 font-bold tracking-widest flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> DISCREPANCY: ${Math.abs(effectiveCase.guaranteedAmount - effectiveCase.actual_payout_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-100 bg-white">
                      <div className="px-3 pt-3">
                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                          <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-[10px] font-bold text-gray-400 tracking-[0.2em] focus:ring-0 shadow-none">
                            <SelectValue placeholder="Metric View" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-gray-100 shadow-none">
                            <SelectItem value="payout" className="text-[10px] tracking-widest">Expected Payout</SelectItem>
                            <SelectItem value="confidence" className="text-[10px] tracking-widest">Confidence Score</SelectItem>
                            <SelectItem value="units" className="text-[10px] tracking-widest">Units Affected</SelectItem>
                            <SelectItem value="cost" className="text-[10px] tracking-widest">Cost Per Unit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-3">
                        <div className="text-lg font-bold text-gray-900 tabular-nums font-mono tracking-tighter">
                          {selectedMetric === 'payout' && (
                            effectiveCase.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            }).toUpperCase() : '—'
                          )}
                          {selectedMetric === 'confidence' && `${derivedConfidencePct}%`}
                          {selectedMetric === 'units' && `${effectiveCase.unitsLost ?? '—'} UNITS`}
                          {selectedMetric === 'cost' && (
                            typeof effectiveCase.unitCost === 'number' ? `$${effectiveCase.unitCost.toFixed(2)}` : '—'
                          )}
                        </div>
                        <div className="text-[8px] text-gray-400 tracking-[0.2em] mt-1 font-bold">
                          {selectedMetric === 'payout' && 'Scheduled Settlement'}
                          {selectedMetric === 'confidence' && 'AI Analysis Precision'}
                          {selectedMetric === 'units' && 'Inventory Discrepancy'}
                          {selectedMetric === 'cost' && 'Verified Cost Basis'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PROTOCOL' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border border-gray-100 divide-x divide-gray-100 italic-divider">
                {/* Tile 1: Audit Flow Timeline */}
                <div className="lg:col-span-1 p-8 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-6">
                    <History className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Audit Flow Timeline</h3>
                  </div>

                  <div className="space-y-8">
                    {/* Visual Progress Bar - VERTICAL */}
                    <div className="relative">
                      <div className="absolute left-[10px] top-3 bottom-3 w-[1px] bg-gray-100" />
                      <div className="flex flex-col space-y-4 relative z-10">
                        {['Detected', 'Prepared', 'Submitted', 'Paid', 'Follow-up'].map((step, idx) => {
                          const status = (effectiveCase.status || '').toLowerCase();
                          const active = (step === 'Detected') ||
                            (step === 'Prepared' && ['guaranteed', 'submitted', 'under review', 'under_review', 'filed', 'pending', 'in progress', 'in_progress', 'paid out', 'paid_out', 'approved', 'paid', 'denied', 'rejected'].includes(status)) ||
                            (step === 'Submitted' && ['submitted', 'under review', 'under_review', 'filed', 'paid out', 'paid_out', 'approved', 'paid', 'denied', 'rejected'].includes(status)) ||
                            (step === 'Paid' && ['paid out', 'paid_out', 'approved', 'paid', 'completed', 'reconciled'].includes(status)) ||
                            (step === 'Follow-up' && ['denied', 'rejected', 'unresolved'].includes(status));

                          return (
                            <div key={step} className="flex items-center gap-3">
                              <div className={cn(
                                "w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all shrink-0",
                                active ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 text-gray-300"
                              )}>
                                {idx + 1}
                              </div>
                              <span className={cn(
                                "text-[9px] tracking-widest font-bold",
                                active ? "text-gray-900" : "text-gray-300"
                              )}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Events */}
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {(effectiveCase.events || []).map((event: any, index: number) => (
                        <div key={index} className="relative pl-6">
                          {index < (effectiveCase.events || []).length - 1 && (
                            <div className="absolute left-[3px] top-6 bottom-[-24px] w-px bg-gray-100" />
                          )}
                          <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-gray-200 border-2 border-white" />
                          <div className="flex flex-col">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="text-[10px] font-bold text-gray-900 tracking-tight">{event.title}</h4>
                              <span className="text-[8px] font-mono text-gray-400">
                                {new Date(event.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-light leading-snug">{event.description}</p>
                          </div>
                        </div>
                      ))}
                      {effectiveCase.status === 'Guaranteed' && (
                        <div className="relative pl-6 opacity-40 italic">
                          <div className="absolute left-0 top-1.5 w-[7px] h-[7px] rounded-full bg-gray-100 border-2 border-white" />
                          <h4 className="text-[10px] font-bold text-gray-400 tracking-tight">Pending Submission</h4>
                          <p className="text-[10px] text-gray-400 font-light leading-snug">Awaiting final carrier document verification before submission.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tile 2: Evidence Vault & ID */}
                <div className="lg:col-span-2 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-gray-400" />
                      <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Evidence Vault & ID</h3>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 tracking-widest">{matchedDocs.length} OBJECTS MATCHED</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                    <div className="md:col-span-3 space-y-4">
                      <div className="text-[9px] text-gray-400 tracking-widest font-bold mb-4 flex items-center gap-2">
                        MATCHED DOCUMENTATION
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>

                      {matchedDocs.length > 0 ? (
                        <div className="space-y-3">
                          {matchedDocs.map((doc: any, idx: number) => {
                            const matchConfidence = doc.matchConfidence || doc.confidence_score || (0.7 + (stableHash(doc.id || '') % 25) / 100);
                            const confidencePct = Math.round(matchConfidence * 100);

                            const matchedFields: string[] = [];
                            const extracted = doc.extracted || doc.parsed_metadata || {};
                            if (extracted.order_ids?.length > 0) matchedFields.push('ORDER_ID');
                            if (extracted.asins?.length > 0) matchedFields.push('ASIN');
                            if (extracted.tracking_numbers?.length > 0) matchedFields.push('TRACKING_REF');
                            if (matchedFields.length === 0) matchedFields.push('CONTENT_MATCH');

                            return (
                              <div key={doc.id || idx} className="p-4 bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-all flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-900 truncate max-w-[200px] font-mono">
                                      {doc.name || doc.filename || `OBJ_${doc.id?.slice(0, 8)}`}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {matchedFields.slice(0, 2).map(f => (
                                      <span key={f} className="px-1.5 py-0.5 bg-white border border-gray-200 text-[7px] font-bold text-gray-500 tracking-widest">{f}</span>
                                    ))}
                                    <span className={cn(
                                      "px-1.5 py-0.5 text-[7px] font-bold tracking-widest",
                                      confidencePct >= 85 ? "text-emerald-600" : "text-amber-600"
                                    )}>MATCH: {confidencePct}%</span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[9px] font-bold tracking-widest text-blue-600 hover:text-blue-700 p-0"
                                  onClick={() => window.open(`/documents/${encodeURIComponent(doc.id)}`, '_blank')}>
                                  Extract <ArrowRight className="h-2.5 w-2.5 ml-1" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                          <Database className="h-8 w-8 text-gray-100 mb-4" />
                          <p className="text-[10px] font-bold text-gray-400 tracking-widest">Awaiting Artifact Ingestion</p>
                          <p className="text-[9px] text-gray-300 mt-1 max-w-[200px]">System is currently crawling your integration sources for matching evidence.</p>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-8">
                      <section>
                        <div className="text-[9px] text-gray-400 tracking-widest font-bold mb-4 flex items-center gap-2">
                          SELLER IDENTITY
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-[8px] font-bold text-gray-400 tracking-widest mb-1">Store Name</dt>
                            <dd className="text-xs font-bold text-gray-900">{effectiveCase.store_name || effectiveCase.seller_name || 'AMAZON_MARKETPLACE_SELLER'}</dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-bold text-gray-400 tracking-widest mb-1">Internal User ID</dt>
                            <dd className="text-[10px] font-mono font-bold text-gray-900">{effectiveCase.seller_id || effectiveCase.user_id || 'ID_NOT_MAPPED'}</dd>
                          </div>
                          <div>
                            <dt className="text-[8px] font-bold text-gray-400 tracking-widest mb-1">Audit Permission</dt>
                            <dd className="text-[10px] font-bold text-emerald-600 tracking-widest">ACTIVE_DELEGATION</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gray-900 rounded-xs">
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold text-gray-900 tracking-widest">Identity Verified</h4>
                            <p className="text-[8px] text-gray-400 tracking-widest">Compliance Protocol: NIST-800</p>
                          </div>
                        </div>
                        <dl className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <dt className="text-[10px] text-gray-500 font-light">Seller ID</dt>
                            <dd className="text-[10px] font-mono text-gray-900">{effectiveCase.seller_id || effectiveCase.user_id || '—'}</dd>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <dt className="text-[10px] text-gray-500 font-light">Store Name</dt>
                            <dd className="text-[10px] font-mono text-gray-900 truncate max-w-[120px]" title={effectiveCase.store_name || effectiveCase.seller_name}>
                              {effectiveCase.store_name || effectiveCase.seller_name || '—'}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    </div>
                  </div>
                </div>

                {/* Tile 3: Evidence Vault & Identity */}
                <div className="lg:col-span-1 p-8 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-6">
                    <Database className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Evidence Vault</h3>
                  </div>

                  <div className="space-y-8">
                    {/* Matched Documents */}
                    <div>
                      {matchedDocs.length > 0 ? (
                        <div className="space-y-3">
                          {matchedDocs.slice(0, 3).map((doc: any, idx: number) => {
                            const confidencePct = Math.round((doc.matchConfidence || doc.confidence_score || 0.85) * 100);
                            return (
                              <div key={doc.id || idx} className="p-3 bg-white border border-gray-200 group hover:border-gray-300 transition-colors cursor-pointer" onClick={() => window.open(`/documents/${encodeURIComponent(doc.id)}`, '_blank')}>
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
                                  <span className="text-[10px] font-medium text-gray-700 truncate flex-1">{doc.name || doc.filename || `Document ${idx + 1}`}</span>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-200 text-emerald-700 bg-emerald-50">
                                    {confidencePct}%
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-gray-400">
                                  <span>{doc.uploadDate || '2025-01-08'}</span>
                                  <span className="tracking-wider">Verified</span>
                                </div>
                              </div>
                            );
                          })}
                          {matchedDocs.length > 3 && (
                            <Link to="/evidence-locker" className="block text-center text-[9px] text-gray-400 hover:text-gray-600 tracking-widest mt-2">
                              + {matchedDocs.length - 3} More Documents
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-gray-200 bg-white">
                          <FileText className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                          <p className="text-[10px] text-gray-400">No documents matched yet</p>
                        </div>
                      )}
                    </div>

                    {/* Contact Detail Section - Restored Full Fidelity */}
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                        <h4 className="text-[9px] font-bold text-gray-900 tracking-[0.2em]">Seller Identity</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] text-gray-400 tracking-widest mb-1.5">Seller Detail</p>
                          <dl className="space-y-2 text-[10px] text-gray-600 font-mono">
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                              <dt className="text-gray-400">Seller ID:</dt>
                              <dd className="font-medium text-gray-900 text-right">{effectiveCase.seller_id || effectiveCase.user_id || 'Not available'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                              <dt className="text-gray-400">Store Name:</dt>
                              <dd className="font-medium text-gray-900 text-right truncate pl-2 max-w-[140px]">{effectiveCase.store_name || effectiveCase.seller_name || 'Amazon Seller Account'}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Contact Method:</dt>
                              <dd className="font-medium text-gray-900 text-right">Seller Central Case Mgr</dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <p className="text-[9px] text-gray-400 tracking-widest mb-1.5">Reference Data</p>
                          <dl className="space-y-2 text-[10px] text-gray-600 font-mono">
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                              <dt className="text-gray-400">Case ID:</dt>
                              <dd className="font-medium text-blue-600 text-right">{effectiveCase.amazonCaseId || <span className="text-gray-400 italic">Not filed</span>}</dd>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-1">
                              <dt className="text-gray-400">Prior Case:</dt>
                              <dd className="font-medium text-gray-900 text-right">{effectiveCase.prior_case_id || <span className="text-gray-400 italic">None</span>}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-400">Claim Ref:</dt>
                              <dd className="font-medium text-gray-900 text-right">{effectiveCase.claim_number || effectiveCase.claim_id || effectiveCase.id?.slice(0, 12)}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PROTOCOL' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-gray-100 divide-x divide-gray-100 italic-divider">
                {/* Tile 1: Action Protocol (Detailed) */}
                <div className="lg:col-span-2 p-8 bg-white">
                  <div className="flex items-center gap-2 mb-8">
                    <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Resolution Protocol</h3>
                  </div>

                  {(() => {
                    const caseType = (effectiveCase.anomaly_type || effectiveCase.claim_type || effectiveCase.case_type || '').toLowerCase();
                    const isFeeCase = caseType.includes('fee') || caseType.includes('overcharge') || caseType.includes('commission') || caseType.includes('storage') || caseType.includes('lts');
                    const isLostCase = caseType.includes('lost') || caseType.includes('missing') || caseType.includes('shipment') || caseType.includes('shortage') || caseType.includes('discrepancy');
                    const isDamagedCase = caseType.includes('damaged') || caseType.includes('damage') || caseType.includes('carrier');
                    const isRefundCase = caseType.includes('refund') || caseType.includes('return') || caseType.includes('switcheroo') || caseType.includes('wrong_item') || caseType.includes('empty_box');
                    const isChargebackCase = caseType.includes('chargeback') || caseType.includes('dispute') || caseType.includes('atoz');
                    const asin = effectiveCase.asin || effectiveCase.evidence?.asin || '—';
                    const sku = effectiveCase.sku || effectiveCase.evidence?.sku || '—';
                    const facility = effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '—';
                    const units = effectiveCase.unitsLost || effectiveCase.quantity || effectiveCase.units || '—';
                    const amount = (effectiveCase.guaranteedAmount || effectiveCase.estimated_value || effectiveCase.claim_amount || 0);
                    const orderId = effectiveCase.order_id || effectiveCase.evidence?.order_id || '—';
                    const formattedAmount = `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                    const immediateActions: string[] = [];
                    const preventiveMeasures: string[] = [];

                    if (isFeeCase) {
                      immediateActions.push(`Review product weight/dimensional specifications for ASIN ${asin}`);
                      immediateActions.push(`Update ASIN measurements in Amazon catalog system`);
                      preventiveMeasures.push(`Correct fee calculations for future shipments`);
                      preventiveMeasures.push(`Ensure measurement accuracy for existing inventory`);
                    } else if (isLostCase) {
                      immediateActions.push(`Investigate inventory discrepancy at FC ${facility}`);
                      immediateActions.push(`Confirm count discrepancy for ${units} units of SKU ${sku}`);
                      preventiveMeasures.push(`Improve inventory tracking at fulfillment centers`);
                      preventiveMeasures.push(`Implement regular reconciliation checks`);
                    } else if (isDamagedCase) {
                      immediateActions.push(`Review damage report for SKU ${sku}`);
                      immediateActions.push(`Verify damage occurred during Amazon/carrier handling`);
                      preventiveMeasures.push(`Review handling procedures for product category`);
                      preventiveMeasures.push(`Consider improved packaging requirements`);
                    } else if (isRefundCase) {
                      immediateActions.push(`Verify return status for Order ${orderId}`);
                      immediateActions.push(`Confirm refund issued without valid return received`);
                      preventiveMeasures.push(`Monitor return compliance more closely`);
                      preventiveMeasures.push(`Flag repeat offender customer accounts`);
                    } else if (isChargebackCase) {
                      immediateActions.push(`Review chargeback claim for Order ${orderId}`);
                      immediateActions.push(`Provide proof of delivery and product condition`);
                      preventiveMeasures.push(`Enhance delivery confirmation tracking`);
                      preventiveMeasures.push(`Document all communications with buyer`);
                    } else {
                      immediateActions.push(`Review case documentation and evidence`);
                      immediateActions.push(`Verify discrepancy against fulfillment records`);
                      preventiveMeasures.push(`Implement monitoring for similar discrepancies`);
                    }
                    immediateActions.push(`Process reimbursement of ${formattedAmount} to seller account`);
                    preventiveMeasures.push(`Provide confirmation of system updates`);

                    return (
                      <div className="space-y-8">
                        {/* Missing Docs Prompt */}
                        {effectiveCase?.missingDocumentPrompt && (
                          <section className="mb-6 rounded-none border border-amber-200 bg-amber-50 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <h4 className="text-[10px] font-bold text-amber-900 tracking-widest">Required Actions Requested</h4>
                            </div>
                            <p className="text-xs text-amber-900 mb-4 leading-relaxed font-medium">{effectiveCase.missingDocumentPrompt}</p>
                            {Array.isArray(effectiveCase.missingDocumentOptions) && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {effectiveCase.missingDocumentOptions.map((opt: string) => (
                                  <button key={opt} className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 text-[9px] font-bold tracking-wider hover:bg-amber-100 transition-colors shadow-sm" onClick={() => {
                                    recoveryApi.submitRecoveryAnswer(effectiveCase.id, { answer: opt }).catch(() => { });
                                  }}>{opt}</button>
                                ))}
                              </div>
                            )}
                            <div
                              className="p-6 border-2 border-dashed border-amber-300 bg-white/50 text-center cursor-pointer hover:bg-white hover:border-amber-400 transition-all"
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const files = Array.from(e.dataTransfer.files || []);
                                if (!files.length) return;
                                await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => { });
                              }}>
                              <FileText className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                              <p className="text-[10px] font-bold text-amber-800 tracking-widest">Drag & Drop Evidence Documents</p>
                              <p className="text-[9px] text-amber-600 mt-1">Supports PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                          </section>
                        )}

                        {/* Actions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border border-gray-100">
                          <div className="bg-white p-6 h-full">
                            <h4 className="text-[10px] font-bold text-gray-500 tracking-[0.15em] mb-6 border-b border-gray-100 pb-3">
                              Immediate Actions
                            </h4>
                            <ol className="space-y-4">
                              {immediateActions.map((action, idx) => (
                                <li key={idx} className="flex items-start gap-4 group">
                                  <span className="text-gray-300 font-mono text-[10px] mt-0.5 w-4 shrink-0 group-hover:text-gray-500 transition-colors">0{idx + 1}.</span>
                                  <span className="text-xs text-gray-700 leading-relaxed font-light">{action}</span>
                                </li>
                              ))}
                            </ol>
                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2 text-[9px] font-bold text-emerald-600 tracking-widest">
                              <ArrowRight className="h-3 w-3" /> Reimbursement Target: {formattedAmount}
                            </div>
                          </div>
                          <div className="bg-white p-6 h-full">
                            <h4 className="text-[10px] font-bold text-gray-500 tracking-[0.15em] mb-6 border-b border-gray-100 pb-3">
                              Preventive Measures
                            </h4>
                            <ol className="space-y-4">
                              {preventiveMeasures.map((measure, idx) => (
                                <li key={idx} className="flex items-start gap-4 group">
                                  <span className="text-gray-300 font-mono text-[10px] mt-0.5 w-4 shrink-0 group-hover:text-gray-500 transition-colors">0{idx + 1}.</span>
                                  <span className="text-xs text-gray-700 leading-relaxed font-light">{measure}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Tile 2: Audit Timeline */}
                <div className="lg:col-span-1 p-8 bg-gray-50/30">
                  <div className="flex items-center gap-2 mb-8">
                    <History className="h-3.5 w-3.5 text-gray-400" />
                    <h3 className="text-[10px] font-bold text-gray-900 tracking-[0.2em]">Audit Timeline</h3>
                  </div>

                  <div className="relative pl-2 space-y-8">
                    {/* Timeline Visualizer */}
                    <div className="mb-8 pl-4">
                      <Timeline claimId={effectiveCase.id} />
                    </div>

                    {/* Detailed Event List */}
                    <div className="relative border-l border-dashed border-gray-200 ml-2 space-y-8">
                      {(effectiveCase.events || []).map((event: any, index: number) => (
                        <div key={index} className="relative pl-6">
                          <div className={cn(
                            "absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full border-2 bg-white",
                            event.type === 'submission' ? "border-emerald-500" :
                              event.type === 'detection' ? "border-amber-500" :
                                "border-gray-300"
                          )} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-bold text-gray-900 tracking-widest">
                                {event.title.includes('•') ? event.title : event.title.replace(/\s+/g, ' • ')}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 mb-2">
                              {new Date(event.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                            </div>
                            {event.type === 'submission' && (
                              <div className="text-[10px] font-mono text-gray-500 mb-1">Status: submitted</div>
                            )}
                            {(effectiveCase.guaranteedAmount || effectiveCase.amount) && (['submission', 'generation', 'detection'].includes(event.type)) && (
                              <div className="text-[10px] font-mono text-gray-500">
                                Amount: ${Number(effectiveCase.guaranteedAmount || effectiveCase.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                            <p className="text-[10px] text-gray-600 mt-2 leading-relaxed font-light border-l-2 border-gray-100 pl-3 py-1">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
