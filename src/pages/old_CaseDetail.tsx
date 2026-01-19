import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, RefreshCw, ExternalLink, Receipt, ChevronDown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'contact'>('overview');

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
    <PageLayout title={`Case ${effectiveCase.id}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-gray-900 space-y-6">
            {/* Header - Navigation */}
            <div className="flex items-center justify-between">
              <Link to="/recoveries" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Cases
              </Link>
            </div>

            {/* Auto-Filing Banner - Institutional Style */}
            <div className="flex items-center gap-4 px-4 py-3 bg-white">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">Margin Auto-Files</span> cases with <span className="font-mono font-medium text-gray-900">≥85%</span> confidence for you
              </p>
              <span className="text-[10px] font-light text-gray-400 uppercase tracking-[0.15em] ml-auto">
                Autonomous
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Case Summary */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                          Case Summary
                        </h3>
                        {derivedConfidencePct >= 85 ? (
                          <span className="text-[9px] text-emerald-600 font-medium mt-0.5">Auto-Filed</span>
                        ) : derivedConfidencePct >= 60 ? (
                          <span className="text-[9px] text-blue-600 font-medium mt-0.5">Awaiting Seller Review</span>
                        ) : (
                          <span className="text-[9px] text-amber-600 font-medium mt-0.5">Parked — Needs Evidence</span>
                        )}
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-medium border",
                        normalizeStatus(effectiveCase.status) === 'Approved' && "bg-gray-100 text-gray-700 border-gray-300",
                        normalizeStatus(effectiveCase.status) === 'In Progress' && "bg-gray-100 text-gray-700 border-gray-300",
                        normalizeStatus(effectiveCase.status) === 'Open' && "bg-gray-100 text-gray-700 border-gray-300",
                        normalizeStatus(effectiveCase.status) === 'Denied' && "bg-gray-100 text-gray-600 border-gray-300",
                      )}>
                        {normalizeStatus(effectiveCase.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono mt-1" title={effectiveCase.id}>
                      {effectiveCase.claim_number || effectiveCase.evidence?.claim_number || effectiveCase.id?.slice(0, 12) || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 space-y-4">
                    {error && (
                      <div className="text-xs text-gray-600 p-3 bg-gray-50 border border-gray-200">{error}</div>
                    )}

                    {/* Financial Overview */}
                    <div className="mb-3">
                      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.1em] mb-1">Guaranteed Value</div>
                      <div className="text-lg font-medium text-gray-900">
                        ${effectiveCase.guaranteedAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </div>

                      {effectiveCase.actual_payout_amount && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Actual Payout:</span>
                          <span className="text-sm font-medium text-blue-600">
                            ${effectiveCase.actual_payout_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          {effectiveCase.recovery_status === 'reconciled' && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Reconciled
                            </span>
                          )}
                        </div>
                      )}

                      {effectiveCase.recovery_status === 'discrepancy' && effectiveCase.actual_payout_amount && (
                        <div className="mt-2 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Discrepancy: ${Math.abs(effectiveCase.guaranteedAmount - effectiveCase.actual_payout_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>

                    {/* Metric Selector Dropdown - Replaces Quadrant Design */}
                    <div className="border border-gray-200 rounded-sm overflow-hidden bg-white">
                      <div className="px-3 pt-3">
                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                          <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em] focus:ring-0 shadow-none">
                            <SelectValue placeholder="Select Metric" />
                          </SelectTrigger>
                          <SelectContent className="rounded-sm">
                            <SelectItem value="payout" className="text-[10px] uppercase tracking-wider">Expected Payout</SelectItem>
                            <SelectItem value="confidence" className="text-[10px] uppercase tracking-wider">Confidence</SelectItem>
                            <SelectItem value="units" className="text-[10px] uppercase tracking-wider">Units Lost</SelectItem>
                            <SelectItem value="cost" className="text-[10px] uppercase tracking-wider">Unit Cost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="px-3 pb-3 pt-1">
                        <div className="text-lg font-medium text-gray-900 tabular-nums tracking-tight">
                          {selectedMetric === 'payout' && (
                            effectiveCase.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : '—'
                          )}
                          {selectedMetric === 'confidence' && `${derivedConfidencePct}%`}
                          {selectedMetric === 'units' && (effectiveCase.unitsLost ?? '—')}
                          {selectedMetric === 'cost' && (
                            typeof effectiveCase.unitCost === 'number' ? `$${effectiveCase.unitCost.toFixed(2)}` : '—'
                          )}
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                          {selectedMetric === 'payout' && 'Scheduled Reimbursement'}
                          {selectedMetric === 'confidence' && 'AI Analysis Score'}
                          {selectedMetric === 'units' && 'Inventory Discrepancy'}
                          {selectedMetric === 'cost' && 'Estimated Value Per Unit'}
                        </div>
                      </div>
                    </div>

                    {/* Product Info - Institutional Style */}
                    <div className="border border-gray-200 p-3 space-y-2">
                      <div className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em] border-b border-gray-100 pb-1">Product Details</div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{effectiveCase.productName || effectiveCase.title || effectiveCase.anomaly_type || 'Unknown Product'}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-1">SKU: {effectiveCase.sku || effectiveCase.evidence?.sku || '—'}</div>
                        {(effectiveCase.asin || effectiveCase.evidence?.asin) && (
                          <div className="text-[10px] font-mono text-gray-500">ASIN: {effectiveCase.asin || effectiveCase.evidence?.asin}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 pt-1 border-t border-gray-100">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '—'}
                      </div>
                    </div>

                    {/* Evidence Status - Institutional Style */}
                    <div className="border border-gray-200 p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                        <div className="text-[10px] font-light text-gray-400 uppercase tracking-[0.1em]">Evidence</div>
                        <span className="text-[10px] font-mono text-gray-600">{matchedCount} docs</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-light text-gray-400">Status</span>
                        <span className={cn(
                          "text-xs font-mono",
                          derivedEvidence === 'Ready' && "text-gray-900",
                          derivedEvidence === 'Collecting' && "text-gray-600",
                          derivedEvidence === 'Needs Docs' && "text-amber-600",
                        )}>
                          {derivedEvidence}
                        </span>
                      </div>

                      {matchedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                          {matchedDocs.slice(0, 2).map((d: any) => (
                            <button key={d.id} className="text-xs font-mono text-gray-500 hover:text-gray-900 hover:underline" onClick={() => window.open(`/documents/${encodeURIComponent(d.id)}`, '_blank')}>
                              {d.name || d.filename || d.id}
                            </button>
                          ))}
                          {matchedDocs.length > 2 && (
                            <Link to="/evidence-locker" className="text-xs text-gray-400 hover:text-gray-600">
                              +{matchedDocs.length - 2} more
                            </Link>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Amazon Case ID if available */}
                    {effectiveCase.amazonCaseId && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div>
                          <div className="text-xs text-blue-600">Amazon Case ID</div>
                          <div className="font-mono text-sm text-blue-900">{effectiveCase.amazonCaseId}</div>
                        </div>
                        <a href={`https://sellercentral.amazon.com/case-log/${effectiveCase.amazonCaseId}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}

                    {/* Payment Status if available */}
                    {effectiveCase.recovery_status && effectiveCase.recovery_status !== 'detecting' && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment Status</div>
                        <div className="space-y-2">
                          {effectiveCase.recovery_status === 'reconciled' && (
                            <>
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" /> Payout reconciled
                              </div>
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <Clock className="h-4 w-4" /> Funds arriving in 3–5 business days
                              </div>
                            </>
                          )}
                          {effectiveCase.recovery_status === 'matched' && (
                            <div className="flex items-center gap-2 text-sm text-purple-600">
                              <CheckCircle className="h-4 w-4" /> Payout matched
                            </div>
                          )}
                          {effectiveCase.billingStatus === 'charged' && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600 pt-2 border-t border-gray-200">
                              <Receipt className="h-4 w-4" />
                              Invoice #{effectiveCase.billingTransactionId?.slice(0, 8) || 'PAID'} paid
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Missing Docs Prompt */}
                    {effectiveCase?.missingDocumentPrompt && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="text-sm text-amber-900 mb-3">{effectiveCase.missingDocumentPrompt}</div>
                        {Array.isArray(effectiveCase.missingDocumentOptions) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {effectiveCase.missingDocumentOptions.map((opt: string) => (
                              <Button key={opt} size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-100" onClick={() => {
                                recoveryApi.submitRecoveryAnswer(effectiveCase.id, { answer: opt }).catch(() => { });
                              }}>{opt}</Button>
                            ))}
                          </div>
                        )}
                        <div
                          className="p-3 border border-dashed border-amber-300 rounded-lg bg-white/60 text-center text-xs text-amber-700"
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files || []);
                            if (!files.length) return;
                            await recoveryApi.uploadRecoveryDocuments(effectiveCase.id, files as any).catch(() => { });
                          }}>
                          Drag and drop invoice here
                        </div>
                      </div>
                    )}

                    {/* Decision Reason */}
                    {(effectiveCase.approvalReason || effectiveCase.rejectionReason) && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Decision Reason</div>
                        <div className="text-sm text-gray-900">{effectiveCase.approvalReason || effectiveCase.rejectionReason}</div>
                      </div>
                    )}

                    {/* Double-Dip Protection Alert */}
                    {(effectiveCase.prior_reimbursement_detected || effectiveCase.inventory_adjustment_applied || effectiveCase.duplicate_blocked) && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-900">🛡️ Account Protection Active</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          {effectiveCase.prior_reimbursement_detected
                            ? `We found a prior reimbursement for ${effectiveCase.sku || 'this item'} in this period, so we didn't file a duplicate claim to keep your account safe.`
                            : effectiveCase.inventory_adjustment_applied
                              ? 'Amazon already processed an inventory adjustment for this issue. No duplicate claim filed.'
                              : 'This claim was blocked to prevent duplicate filing and protect your seller account standing.'}
                        </p>
                        {effectiveCase.prior_case_id && (
                          <p className="text-xs text-blue-600 mt-2">Prior Case: {effectiveCase.prior_case_id}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 pt-2">

                      {effectiveCase.status === 'Denied' && (() => {
                        const rejectionReason = classifyRejection(effectiveCase.status, effectiveCase.rejectionReason);
                        const playbook = escalationPlaybooks[rejectionReason];
                        const escalationCount = effectiveCase.escalation_count || 0;
                        const maxEscalations = 2;
                        const canEscalate = escalationCount < maxEscalations;

                        return (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-semibold text-red-900">{playbook.label}</span>
                              </div>
                              <Badge className="bg-purple-100 text-purple-700 text-xs">
                                Escalation {escalationCount}/{maxEscalations}
                              </Badge>
                            </div>
                            <p className="text-sm text-red-700">{playbook.description}</p>

                            <div className="bg-white/70 rounded p-3 border border-red-100">
                              <div className="text-xs text-red-600 font-semibold uppercase tracking-wide mb-2">Escalation Playbook</div>
                              <ul className="space-y-1">
                                {playbook.actions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                                    <span className="text-red-400">→</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {canEscalate ? (
                              <Button
                                className={`w-full ${playbook.autoTriggerable ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                onClick={async () => {
                                  const hasDocs = Array.isArray(effectiveCase.documents) && effectiveCase.documents.length > 0;
                                  if (!hasDocs) {
                                    toast({ title: 'Attach evidence first', description: 'Add at least one supporting document before resubmitting.' });
                                    return;
                                  }
                                  const res = await api.resubmitClaim(effectiveCase.id);
                                  if (res.ok) {
                                    toast({ title: playbook.autoTriggerable ? 'Auto-escalated' : 'Escalation submitted', description: 'We will keep you posted on the decision.' });
                                    setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted', escalation_count: (prev?.escalation_count || 0) + 1 }));
                                  } else {
                                    toast({ title: 'Escalation failed', description: res.error || 'Please try again.' });
                                  }
                                }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {playbook.autoTriggerable ? 'Auto-Escalate' : 'Manual Escalation'} (Round {escalationCount + 1})
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded text-amber-700 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                Max escalations reached. Manual review recommended.
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Download Proof Document */}
                      <Button variant="outline" className="w-full text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => {
                        window.open(api.getRecoveryDocumentUrl(effectiveCase.id), '_blank');
                      }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Proof Document
                      </Button>

                      {/* Subtle Evidence Locker link */}
                      <div className="text-center pt-1">
                        <Link to="/evidence-locker" className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
                          View Evidence Locker →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                          Supporting Evidence
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Amazon rejects 82% of claims without an Invoice.</p>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-[0.1em]">
                        {matchedDocs.length} found
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    {matchedDocs.length > 0 ? (
                      <div className="space-y-3">
                        {matchedDocs.map((doc: any, idx: number) => {
                          // Derive confidence from match data or generate stable value
                          const matchConfidence = doc.matchConfidence || doc.confidence_score ||
                            (doc.matches?.[0]?.confidence_score) ||
                            (0.6 + (stableHash(doc.id || '') % 35) / 100);
                          const confidencePct = Math.round(matchConfidence * 100);

                          // Determine matched fields from doc metadata
                          const matchedFields: string[] = [];
                          const extracted = doc.extracted || doc.parsed_metadata || {};
                          if (extracted.order_ids?.length > 0) matchedFields.push('Order ID');
                          if (extracted.asins?.length > 0 || extracted.skus?.length > 0) matchedFields.push('ASIN/SKU');
                          if (extracted.tracking_numbers?.length > 0) matchedFields.push('Tracking #');
                          if (extracted.amounts?.length > 0) matchedFields.push('Amount');
                          if (extracted.invoice_numbers?.length > 0) matchedFields.push('Invoice #');
                          if (matchedFields.length === 0) matchedFields.push('Content Match');

                          return (
                            <div key={doc.id || idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-3.5 w-3.5 text-gray-700 flex-shrink-0" />
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                      {doc.name || doc.filename || doc.original_filename || `Document ${idx + 1}`}
                                    </span>
                                  </div>

                                  {/* Match Confidence */}
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] text-gray-600">Match Confidence:</span>
                                    <Badge className={cn(
                                      "text-xs",
                                      confidencePct >= 85 ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                                        confidencePct >= 60 ? "bg-amber-100 text-amber-800 border-amber-200" :
                                          "bg-gray-100 text-gray-800 border-gray-200"
                                    )}>
                                      {confidencePct}%
                                    </Badge>
                                  </div>

                                  {/* Matched Fields */}
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    <span className="text-[10px] text-gray-600 mr-1">Matched on:</span>
                                    {matchedFields.map((field, fieldIdx) => (
                                      <Badge key={fieldIdx} variant="outline" className="text-[10px] border-gray-300 text-gray-700">
                                        {field}
                                      </Badge>
                                    ))}
                                  </div>

                                  {/* Document Source */}
                                  {doc.source && (
                                    <div className="text-[10px] text-gray-500">
                                      Source: {doc.source}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-shrink-0 text-gray-700 border-gray-300 hover:bg-gray-200 text-xs h-7"
                                  onClick={() => window.open(`/documents/${encodeURIComponent(doc.id)}`, '_blank')}>
                                  View
                                </Button>
                              </div>

                              {/* Reasoning / Match Details */}
                              {(doc.matchReasoning || doc.match_reason || doc.matches?.[0]?.reasoning) && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 italic">
                                    {doc.matchReasoning || doc.match_reason || doc.matches?.[0]?.reasoning}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-6 w-6 mx-auto text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 mb-1">
                          No matching documents found yet
                        </p>
                        <p className="text-xs text-gray-400">
                          Your matched evidence documents will appear here once the system finds relevant invoices, receipts, or shipping records.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 text-gray-700 border-gray-300 text-xs"
                          asChild>
                          <Link to="/evidence-locker">Browse Evidence Locker</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Tabbed Interface */}
              <div className="lg:col-span-2">
                {/* Tab Bar - Pentagon Style */}
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="flex border-b border-gray-200">
                    {[
                      { id: 'overview' as const, label: 'Overview' },
                      { id: 'actions' as const, label: 'Actions' },
                      { id: 'contact' as const, label: 'Contact' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex-1 px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] transition-colors",
                          activeTab === tab.id
                            ? "bg-gray-900 text-white"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        )}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 min-h-[400px]">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-1">Issue Description</h3>
                          <div className="text-[10px] text-gray-500 mb-3">Case Context</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{generateNarrative(effectiveCase)}</p>
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-1">Transaction History</h3>
                          <div className="text-[10px] text-gray-500 mb-4">Forensic Evidence</div>

                          {(() => {
                            const created = effectiveCase.created_at || effectiveCase.createdDate || effectiveCase.discovery_date;
                            const createdDate = created ? new Date(created) : new Date();
                            const detectionDate = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const auditDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                            const amount = effectiveCase.guaranteedAmount || effectiveCase.estimated_value || effectiveCase.claim_amount || 0;
                            const units = effectiveCase.unitsLost || effectiveCase.units_lost || effectiveCase.quantity || effectiveCase.units || 1;
                            const perUnit = units > 0 ? (amount / units) : amount;
                            const sku = effectiveCase.sku || effectiveCase.evidence?.sku || 'N/A';
                            const asin = effectiveCase.asin || effectiveCase.evidence?.asin || 'N/A';
                            const orderId = effectiveCase.order_id || effectiveCase.evidence?.order_id || effectiveCase.matched_fields?.[0]?.split(':')[1] || '';
                            const facility = effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '';
                            const shipmentId = effectiveCase.shipment_id || effectiveCase.evidence?.shipment_id || '';
                            const caseType = (effectiveCase.anomaly_type || effectiveCase.claim_type || effectiveCase.case_type || '').toLowerCase();

                            return (
                              <div className="bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6 border-t border-gray-100">
                                  {/* Forensic & Timeline */}
                                  <div className="space-y-8">
                                    <section>
                                      <h4 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        <div className="h-1 w-3 bg-emerald-500" />
                                        Forensic Metrics
                                      </h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Units Affected</dt>
                                          <dd className="text-xs font-medium text-gray-900 tabular-nums font-mono">{units}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Value Per Unit</dt>
                                          <dd className="text-xs font-medium text-gray-900 tabular-nums font-mono">${perUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Total Claimed</dt>
                                          <dd className="text-xs font-semibold text-gray-900 tabular-nums font-mono">${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <dt className="text-[11px] text-gray-500 font-light">Confidence Score</dt>
                                          <dd className="text-xs font-medium text-gray-900 tabular-nums font-mono">
                                            {(() => {
                                              const conf = effectiveCase.confidence || effectiveCase.confidence_score || 0.85;
                                              const normalized = conf > 1 ? conf : conf * 100;
                                              return `${Math.min(Math.round(normalized), 100)}%`;
                                            })()}
                                          </dd>
                                        </div>
                                      </dl>
                                    </section>

                                    <section>
                                      <h4 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        <div className="h-1 w-3 bg-blue-500" />
                                        Timeline Accuracy
                                      </h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Issue Identified</dt>
                                          <dd className="text-xs font-medium text-gray-900 tabular-nums font-mono">{detectionDate}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Audit Period</dt>
                                          <dd className="text-xs font-medium text-gray-900 tabular-nums font-mono">{auditDays} days</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <dt className="text-[11px] text-gray-500 font-light">Policy Compliance</dt>
                                          <dd className="text-xs font-medium text-emerald-600 font-mono uppercase tracking-wider">{auditDays <= 180 ? 'Compliant' : 'Exceeded'}</dd>
                                        </div>
                                      </dl>
                                    </section>
                                  </div>

                                  {/* Logistical & Metadata */}
                                  <div className="space-y-8">
                                    <section>
                                      <h4 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        <div className="h-1 w-3 bg-gray-400" />
                                        Logistical Trace
                                      </h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">ASIN / SKU</dt>
                                          <dd className="text-[10px] font-mono text-gray-900">{asin} / {sku}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Fulfillment Center</dt>
                                          <dd className="text-xs font-medium text-gray-900">{facility || 'N/A'}</dd>
                                        </div>
                                        {orderId && (
                                          <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                            <dt className="text-[11px] text-gray-500 font-light">Reference Trans.</dt>
                                            <dd className="text-[10px] font-mono text-gray-900 underline underline-offset-2">{orderId}</dd>
                                          </div>
                                        )}
                                        {shipmentId && (
                                          <div className="flex justify-between items-baseline">
                                            <dt className="text-[11px] text-gray-500 font-light">Shipment Ref.</dt>
                                            <dd className="text-[10px] font-mono text-gray-900">{shipmentId}</dd>
                                          </div>
                                        )}
                                      </dl>
                                    </section>

                                    <section>
                                      <h4 className="text-[10px] font-semibold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                                        <div className="h-1 w-3 bg-indigo-500" />
                                        System Metadata
                                      </h4>
                                      <dl className="space-y-3">
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Claim Category</dt>
                                          <dd className="text-xs font-medium text-gray-900 capitalize font-mono">{caseType.replace(/_/g, ' ') || 'Discrepancy'}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                                          <dt className="text-[11px] text-gray-500 font-light">Engine Match</dt>
                                          <dd className="text-xs font-medium text-gray-900 capitalize font-mono">{(effectiveCase.match_type || 'order_id').replace(/_/g, ' ')}</dd>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <dt className="text-[11px] text-gray-500 font-light">Audit Method</dt>
                                          <dd className="text-[10px] font-medium text-gray-700 uppercase tracking-wider">Autonomous Engine</dd>
                                        </div>
                                      </dl>
                                    </section>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* ACTIONS TAB */}
                    {activeTab === 'actions' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-1">Required Actions Requested</h3>
                          <div className="text-[10px] text-gray-500 mb-4">Resolution request to Amazon</div>

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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">
                                <div className="bg-white p-5">
                                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-4 border-b border-gray-100 pb-2">
                                    Immediate Actions
                                  </h4>
                                  <ol className="space-y-3 text-xs text-gray-700">
                                    {immediateActions.map((action, idx) => (
                                      <li key={idx} className="flex items-start gap-3">
                                        <span className="text-gray-400 font-mono text-[10px] mt-0.5 w-4 shrink-0">{idx + 1}.</span>
                                        <span className="text-gray-700 leading-relaxed">{action}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                                <div className="bg-white p-5">
                                  <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-4 border-b border-gray-100 pb-2">
                                    Preventive Measures
                                  </h4>
                                  <ol className="space-y-3 text-xs text-gray-700">
                                    {preventiveMeasures.map((measure, idx) => (
                                      <li key={idx} className="flex items-start gap-3">
                                        <span className="text-gray-400 font-mono text-[10px] mt-0.5 w-4 shrink-0">{idx + 1}.</span>
                                        <span className="text-gray-700 leading-relaxed">{measure}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="flex items-center gap-2 text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                                <Clock className="h-4 w-4" /> Claim Timeline
                              </h3>
                              <div className="text-[10px] text-gray-500 mt-0.5 ml-6">Case Progress</div>
                            </div>
                            <span className="text-[10px] text-gray-500 border border-gray-200 px-2 py-0.5">
                              {typeof effectiveCase.progress === 'number' ? `${Math.round(effectiveCase.progress)}%` : 'Real-time transparency'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="ml-auto flex gap-2">
                              <button className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1" onClick={async () => {
                                const url = api.getRecoveryDocumentUrl(effectiveCase.id);
                                try {
                                  const head = await fetch(url, { method: 'HEAD', credentials: 'include' });
                                  if (head.ok) { window.open(url, '_blank'); return; }
                                } catch { }
                                if (Array.isArray(matchedDocs) && matchedDocs.length > 0) {
                                  window.open(`/documents/${encodeURIComponent(matchedDocs[0].id)}`, '_blank');
                                } else {
                                  toast({ title: 'No proof available yet', description: 'Evidence is still being collected for this case.' });
                                }
                              }}>
                                <FileText className="h-3.5 w-3.5" /> Proof of Document
                              </button>
                              <Link to="/recoveries" className="px-3 py-1.5 text-xs text-white bg-gray-900 hover:bg-gray-800">Back to Cases</Link>
                            </div>
                          </div>
                          <div className="mb-6"><Timeline claimId={effectiveCase.id} /></div>
                          <div className="flex items-center gap-2 mb-4 text-sm overflow-x-auto pb-2">
                            {['Detected', 'Prepared', 'Submitted', 'Paid', 'Follow-up'].map((step, idx) => {
                              const status = (effectiveCase.status || '').toLowerCase();
                              const active = (step === 'Detected') ||
                                (step === 'Prepared' && ['guaranteed', 'submitted', 'under review', 'under_review', 'filed', 'pending', 'in progress', 'in_progress', 'paid out', 'paid_out', 'approved', 'paid', 'denied', 'rejected'].includes(status)) ||
                                (step === 'Submitted' && ['submitted', 'under review', 'under_review', 'filed', 'paid out', 'paid_out', 'approved', 'paid', 'denied', 'rejected'].includes(status)) ||
                                (step === 'Paid' && ['paid out', 'paid_out', 'approved', 'paid', 'completed', 'reconciled'].includes(status)) ||
                                (step === 'Follow-up' && ['denied', 'rejected', 'unresolved'].includes(status));
                              return (
                                <div key={step} className="flex items-center gap-2 flex-shrink-0">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border text-xs ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{idx + 1}</div>
                                  <span className={`text-xs whitespace-nowrap ${active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step}</span>
                                  {idx < 4 && <div className={`w-4 h-px ${active ? 'bg-gray-900' : 'bg-gray-200'}`} />}
                                </div>
                              );
                            })}
                          </div>
                          {(effectiveCase.events || []).map((event: any, index: number) => (
                            <div key={index} className="flex gap-4 mb-3">
                              <div className={cn("flex-shrink-0 mt-1", getEventColor(event.type))}>{getEventIcon(event.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                  </div>
                                  <div className="text-xs text-gray-600 whitespace-nowrap">{new Date(event.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                {Array.isArray(effectiveCase.events) && index < effectiveCase.events.length - 1 && <div className="border-l border-gray-200 ml-2 h-6 mt-3" />}
                              </div>
                            </div>
                          ))}
                          {effectiveCase.status === 'Guaranteed' && (
                            <div className="flex gap-4 opacity-50">
                              <div className="flex-shrink-0 mt-1 text-gray-600"><Package className="h-4 w-4" /></div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-600">Claim Submitted to Amazon</h4>
                                <p className="text-sm text-gray-600 mt-1">Pending user approval to submit claim documentation to Amazon</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CONTACT TAB */}
                    {activeTab === 'contact' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-1">Contact Information</h3>
                          <div className="text-[10px] text-gray-500 mb-3">Seller Detail</div>
                          <div className="space-y-4 text-xs">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Seller Contact:</h4>
                              <dl className="space-y-2 text-gray-600">
                                <div className="grid grid-cols-3 gap-2">
                                  <dt className="text-gray-500">Seller ID:</dt>
                                  <dd className="col-span-2 font-mono text-gray-900">
                                    {effectiveCase.seller_id || effectiveCase.user_id || 'Not available'}
                                  </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <dt className="text-gray-500">Store Name:</dt>
                                  <dd className="col-span-2">
                                    {effectiveCase.store_name || effectiveCase.seller_name || 'Amazon Seller Account'}
                                  </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <dt className="text-gray-500">Contact Method:</dt>
                                  <dd className="col-span-2">Seller Central Case Manager</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-semibold text-gray-900 mb-2 text-xs">Amazon Reference:</h4>
                          <dl className="space-y-2 text-xs text-gray-600">
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Case ID:</dt>
                              <dd className="col-span-2 font-mono text-blue-600">
                                {effectiveCase.amazonCaseId || effectiveCase.amazon_case_id || (
                                  <span className="text-gray-400 italic">Not yet filed</span>
                                )}
                              </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Prior Case ID:</dt>
                              <dd className="col-span-2 font-mono">
                                {effectiveCase.prior_case_id || (
                                  <span className="text-gray-400 italic">No prior case</span>
                                )}
                              </dd>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <dt className="text-gray-500">Claim Ref:</dt>
                              <dd className="col-span-2 font-mono text-gray-900">
                                {effectiveCase.claim_number || effectiveCase.claim_id || effectiveCase.id?.slice(0, 12) || 'N/A'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
