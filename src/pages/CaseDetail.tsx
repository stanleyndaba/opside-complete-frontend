import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle,
  Calendar, RefreshCw, ExternalLink, Receipt, ChevronDown, ShieldCheck, Activity,
  BarChart3, Database, History, ArrowRight, Upload, ChevronRight, Scale, Info,
  Zap, ShieldAlert
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { ClaimPdfService } from '@/services/ClaimPdfService';
import { parseDefaultSSEMessage, registerNamedSSEListeners } from '@/lib/sse';

interface CaseEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'detection' | 'analysis' | 'generation' | 'submission' | 'update' | 'completion';
}

// Rejection reason classification
type RejectionReason = 'missing_evidence' | 'wrong_category' | 'expired_window' | 'amount_disputed' | 'generic_denial' | 'duplicate_claim' | 'insufficient_info' | 'inbound_damage';

const REJECTION_CATEGORY_TO_PLAYBOOK: Record<string, RejectionReason> = {
  MISSING_DOCUMENT: 'missing_evidence',
  OUT_OF_WINDOW: 'expired_window',
  ALREADY_REIMBURSED: 'duplicate_claim',
  INSUFFICIENT_EVIDENCE: 'insufficient_info',
  INVALID_CLAIM: 'generic_denial',
};

const POLICY_MAP: Record<string, { code: string; title: string; link: string; clause?: string }> = {
  lost_warehouse: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound/Warehouse',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.1: Lost in Warehouse'
  },
  damaged_warehouse: {
    code: 'FBA 9.2',
    title: 'Inventory Reimbursement - Warehouse Handling',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.2: Damaged in Warehouse'
  },
  lost_inbound: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound Shipments',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.3: Lost Inbound'
  },
  damaged_inbound: {
    code: 'FBA 9.1',
    title: 'Inventory Reimbursement - Inbound Shipments',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200213130',
    clause: 'Section 1.4: Damaged Inbound'
  },
  refund_without_return: {
    code: 'FBA §4.2(b)',
    title: 'Customer Returns Reimbursement Policy',
    link: 'https://sellercentral.amazon.com/help/hub/reference/G200379860',
    clause: 'Clause 4.2.b: Refund Without Return'
  }
};

const AGENT_NAMES: Record<string, string> = {
  'data_sync': 'Agent 2: Sync Signal',
  'detection': 'Agent 3: Inbound Inspector',
  'evidence_ingestion': 'Agent 4: Evidence Harvester',
  'document_parsing': 'Agent 5: Optical Reader',
  'evidence_matching': 'Agent 6: Pattern Matcher',
  'refund_filing': 'Agent 7',
  'recoveries': 'Agent 8: Recovery Engine',
  'billing': 'Agent 9: Ledger Bot',
  'notifications': 'Agent 10: Comms Relay',
  'learning': 'Agent 11: Logic Optimizer'
};

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
  },
  inbound_damage: {
    reason: 'inbound_damage',
    label: 'Inbound Damage Dispute',
    description: 'Amazon claims damage occurred prior to arrival at FC.',
    actions: ['Retrieve carrier damage insurance records', 'Provide "Condition upon Loading" timestamped photos', 'Link FBA check-in logs showing delayed offloading'],
    autoTriggerable: false
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

type ObjectType = 'Detection' | 'Case' | 'Recovery';

const resolveObjectType = (value: any): ObjectType => {
  if (!value) return 'Case';
  if (value.actual_payout_amount || value.resolution_amount || value.reconciled_at || value.recovery_status === 'reconciled') {
    return 'Recovery';
  }
  if (value.filing_status || value.case_number || value.provider_case_id || value.amazonCaseId || value.amazon_case_id || value.provider) {
    return 'Case';
  }
  return 'Detection';
};

const toStatusLabel = (value?: string | null) => {
  if (!value) return '-';
  return String(value).replace(/_/g, ' ');
};

const normalizeCaseDetailData = (apiData: any, fallbackId?: string) => ({
  ...apiData,
  id: apiData.id || fallbackId || null,
  dispute_case_id: apiData.dispute_case_id || (apiData.object_type === 'case' ? apiData.id : null),
  detection_result_id: apiData.detection_result_id || (apiData.object_type === 'detection' ? apiData.id : null),
  title: apiData.title || apiData.details || apiData.anomaly_type || 'Claim Details',
  status: apiData.status || null,
  filing_status: apiData.filing_status || null,
  recovery_status: apiData.recovery_status || null,
  billing_status: apiData.billing_status || null,
  updated_at: apiData.updated_at || apiData.created_at || apiData.createdDate || null,
  guaranteedAmount: apiData.guaranteedAmount ?? apiData.requested_amount ?? apiData.claim_amount ?? apiData.estimated_claim_value ?? apiData.estimated_value ?? null,
  estimated_claim_value: apiData.estimated_claim_value ?? apiData.estimated_value ?? apiData.guaranteedAmount ?? null,
  requested_amount: apiData.requested_amount ?? apiData.claim_amount ?? apiData.guaranteedAmount ?? null,
  approved_amount: apiData.approved_amount ?? apiData.recovery_amount ?? null,
  actual_payout_amount: apiData.actual_payout_amount ?? null,
  billed_amount: apiData.billed_amount ?? null,
  expectedPayoutDate: apiData.expectedPayoutDate || apiData.expected_payout_date || null,
  createdDate: apiData.createdDate || apiData.created_at || apiData.discovery_date || null,
  sku: (apiData.sku && apiData.sku !== 'N/A') ? apiData.sku :
    (apiData.evidence?.sku && apiData.evidence?.sku !== 'N/A') ? apiData.evidence.sku : '-',
  asin: apiData.asin || apiData.evidence?.asin || null,
  productName: apiData.productName || apiData.details || apiData.anomaly_type || 'Unknown Product',
  facility: apiData.facility || apiData.evidence?.fulfillment_center || apiData.warehouse || null,
  unitsLost: apiData.unitsLost ?? apiData.units_lost ?? apiData.evidence?.quantity ?? null,
  units_is_verified: apiData.units_is_verified === true,
  unitCost: apiData.unitCost ?? apiData.unit_cost ?? null,
  confidence: typeof apiData.confidence_score === 'number'
    ? apiData.confidence_score * 100
    : (typeof apiData.confidence === 'number' ? apiData.confidence : null),
  evidenceStatus: apiData.evidenceStatus || null,
  documents: Array.isArray(apiData.documents) ? apiData.documents : [],
  events: Array.isArray(apiData.events) ? apiData.events : [],
  evidence: apiData.evidence || {},
  evidence_summary: apiData.evidence_summary || {},
  evidence_attachments: apiData.evidence_attachments || null,
  claim_number: apiData.claim_number || apiData.evidence?.claim_number || null,
  generated_context: apiData.generated_context || null,
  next_step_context: apiData.next_step_context || null,
  rejection_category: apiData.rejection_category || apiData.evidence_attachments?.rejection_category || null,
  rejection_reason: apiData.rejection_reason || apiData.evidence_attachments?.raw_reason_text || null,
});

const isEvidenceRelatedEvent = (event: any) => {
  const type = String(event?.type || '').toLowerCase();
  const status = String(event?.status || '').toLowerCase();
  const eventType = String(event?.eventType || '').toLowerCase();
  return Boolean(
    (Array.isArray(event?.docIds) && event.docIds.length > 0) ||
    type === 'evidence' ||
    status === 'verified' ||
    status === 'matched' ||
    eventType.includes('evidence') ||
    eventType.includes('matching') ||
    eventType.includes('parsing') ||
    eventType.includes('ingestion')
  );
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
  const { caseId, tenantSlug } = useParams<{ caseId: string; tenantSlug: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug;

  if (!activeSlug && isReady) {
    throw new Error("tenantSlug required for CaseDetail");
  }

  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any | null>(passedClaim ? {
    id: passedClaim.id,
    dispute_case_id: passedClaim.dispute_case_id || null,
    detection_result_id: passedClaim.detection_result_id || null,
    title: passedClaim.details || passedClaim.anomaly_type || 'Claim Details',
    status: passedClaim.status || '-',
    filing_status: passedClaim.filing_status || null,
    recovery_status: passedClaim.recovery_status || null,
    billing_status: passedClaim.billing_status || null,
    guaranteedAmount: passedClaim.guaranteedAmount ?? passedClaim.estimated_value ?? null,
    estimated_claim_value: passedClaim.estimated_claim_value ?? passedClaim.estimated_value ?? passedClaim.guaranteedAmount ?? null,
    requested_amount: passedClaim.requested_amount ?? passedClaim.claim_amount ?? passedClaim.guaranteedAmount ?? passedClaim.estimated_value ?? null,
    approved_amount: passedClaim.approved_amount ?? passedClaim.recovery_amount ?? null,
    actual_payout_amount: passedClaim.actual_payout_amount ?? null,
    billed_amount: passedClaim.billed_amount ?? null,
    expectedPayoutDate: passedClaim.expectedPayoutDate || passedClaim.expected_payout_date || null,
    createdDate: passedClaim.created || passedClaim.created_at || passedClaim.discovery_date || null,
    updated_at: passedClaim.updated_at || passedClaim.created_at || passedClaim.created || null,
    sku: passedClaim.sku || passedClaim.evidence?.sku || '-',
    asin: passedClaim.asin || passedClaim.evidence?.asin || null,
    productName: passedClaim.details || passedClaim.anomaly_type || 'Unknown Product',
    facility: passedClaim.facility || passedClaim.warehouse || passedClaim.evidence?.fulfillment_center || null,
    unitsLost: passedClaim.unitsLost ?? passedClaim.units_lost ?? passedClaim.quantity ?? passedClaim.units ?? null,
    units_is_verified: passedClaim.units_is_verified === true,
    unitCost: passedClaim.unitCost ?? passedClaim.unit_cost ?? null,
    confidence: typeof passedClaim.confidence_score === 'number'
      ? passedClaim.confidence_score * 100
      : (typeof passedClaim.confidence === 'number' ? passedClaim.confidence : null),
    evidenceStatus: passedClaim.evidenceStatus || null,
    documents: passedClaim.documents || passedClaim.matchedDocs || [],
    events: passedClaim.events || [],
    evidence: passedClaim.evidence || {},
    evidence_summary: passedClaim.evidence_summary || {},
    evidence_attachments: passedClaim.evidence_attachments || null,
    claim_number: passedClaim.claim_number || passedClaim.evidence?.claim_number || null,
    next_step_context: passedClaim.next_step_context || null,
    generated_context: passedClaim.generated_context || null,
    rejection_category: passedClaim.rejection_category || passedClaim.evidence_attachments?.rejection_category || null,
    rejection_reason: passedClaim.rejection_reason || passedClaim.evidence_attachments?.raw_reason_text || null,
  } : null);
  const { toast } = useToast();
  const [matchedDocs, setMatchedDocs] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('payout');
  const [activeTab, setActiveTab] = useState<'RECORD' | 'PROTOCOL'>('RECORD');
  const [statusFeedUnavailable, setStatusFeedUnavailable] = useState(false);

  const formatDateOrDash = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrencyOrDash = (value?: number | null, currency: string = 'USD') => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '-';
    return value.toLocaleString('en-US', { style: 'currency', currency });
  };

  const normalizeStatus = (s?: string): 'Open' | 'In Progress' | 'Approved' | 'Denied' | 'Unknown' => {
    const v = (s || '').toLowerCase();
    if (['denied', 'rejected'].includes(v)) return 'Denied';
    if (['paid', 'paid out', 'approved'].includes(v)) return 'Approved';
    if (['submitted', 'under review', 'in progress', 'processing'].includes(v)) return 'In Progress';
    if (['guaranteed', 'awaiting approval', 'new', 'open'].includes(v)) return 'Open';
    return 'Unknown';
  };

  const refreshCaseDetail = useCallback(async (currentCaseId: string, { showLoading = false }: { showLoading?: boolean } = {}) => {
    if (!currentCaseId) return;
    if (showLoading) setLoading(true);

    const res = await api.getRecoveryDetail(currentCaseId, activeSlug);
    if (res.ok && res.data) {
      const apiData = res.data as any;
      const normalized = normalizeCaseDetailData(apiData, currentCaseId);
      setCaseData(normalized);
      if (Array.isArray((res.data as any)?.documents)) {
        setMatchedDocs((res.data as any).documents);
      }
      setStatusFeedUnavailable(false);
      setError(null);
    } else {
      setCaseData(null);
      setMatchedDocs([]);
      setError(res.error || 'Case details unavailable');
    }

    if (showLoading) setLoading(false);
  }, [activeSlug, passedClaim]);

  const resolvedIdentityIds = useMemo(() => {
    return Array.from(new Set([
      caseId,
      caseData?.id,
      caseData?.dispute_case_id,
      caseData?.detection_result_id,
      passedClaim?.id,
      passedClaim?.dispute_case_id,
      passedClaim?.detection_result_id,
    ].filter(Boolean)));
  }, [caseId, caseData?.id, caseData?.dispute_case_id, caseData?.detection_result_id, passedClaim?.id, passedClaim?.dispute_case_id, passedClaim?.detection_result_id]);

  const matchesRealtimeEvent = useCallback((payload: any) => {
    const ids = new Set([
      payload?.entity_id,
      payload?.dispute_case_id,
      payload?.case_id,
      payload?.disputeId,
      payload?.dispute_id,
      payload?.detection_id,
      payload?.claim_id,
      payload?.claimId,
      payload?.data?.entity_id,
      payload?.data?.dispute_case_id,
      payload?.data?.case_id,
      payload?.data?.disputeId,
      payload?.data?.dispute_id,
      payload?.data?.detection_id,
      payload?.data?.claim_id,
      payload?.data?.claimId
    ].filter(Boolean));

    return resolvedIdentityIds.some((id) => ids.has(id));
  }, [resolvedIdentityIds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      await refreshCaseDetail(caseId, { showLoading: true });
    })();

    let es: EventSource | null = null;
    try {
      es = new EventSource(api.buildApiUrl(`/api/sse/status?tenantSlug=${activeSlug}`), { withCredentials: true } as any);
      es.onopen = () => setStatusFeedUnavailable(false);
      const handleRealtimePayload = (payload: any) => {
        if (!caseId || !matchesRealtimeEvent(payload)) {
          return;
        }
        refreshCaseDetail(caseId);
      };

      const removeNamedListeners = registerNamedSSEListeners(
        es,
        ['notification', 'message', 'matching_completed', 'parsing_completed', 'evidence_upload_completed', 'evidence_ingestion_completed', 'payment_approved', 'payment_reconciled'],
        (_eventName, payload) => handleRealtimePayload(payload)
      );

      es.onmessage = (event) => {
        handleRealtimePayload(parseDefaultSSEMessage(event));
      };

      es.onerror = () => {
        setStatusFeedUnavailable(true);
      };

      const originalClose = es.close.bind(es);
      es.close = () => {
        removeNamedListeners();
        originalClose();
      };
    } catch { }
    return () => { cancelled = true; if (es) es.close(); };
  }, [caseId, activeSlug, matchesRealtimeEvent, refreshCaseDetail]);

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
          const docRes = await api.getDocument(docIdFromCase, activeSlug);
          if (!cancelled && docRes.ok && docRes.data) {
            // Add match info from the case's evidence_attachments
            const docWithMatchInfo = {
              ...docRes.data,
              matchConfidence: caseData?.evidence_attachments?.match_confidence,
              matchType: caseData?.evidence_attachments?.match_type,
              matchedFields: caseData?.evidence_attachments?.matched_fields,
              matchedAt: caseData?.evidence_attachments?.matched_at,
            };
            const existingDocs = Array.isArray(caseData?.documents) ? caseData.documents : [];
            const mergedDocs = existingDocs.some((doc: any) => doc.id === docWithMatchInfo.id)
              ? existingDocs.map((doc: any) => doc.id === docWithMatchInfo.id ? { ...doc, ...docWithMatchInfo } : doc)
              : [...existingDocs, docWithMatchInfo];
            setMatchedDocs(mergedDocs);
            return;
          }
        }

        if (!cancelled) {
          setMatchedDocs(Array.isArray(caseData?.documents) ? caseData.documents : []);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [caseId, caseData?.evidence_attachments?.document_id, caseData?.documents, activeSlug]);

  const effectiveCase = caseData || passedClaim;
  const objectType = useMemo<ObjectType>(() => resolveObjectType(effectiveCase), [effectiveCase]);

  const derivedConfidencePct = useMemo<number | null>(() => {
    if (!effectiveCase) return null;
    const value = typeof effectiveCase?.confidence === 'number'
      ? effectiveCase.confidence
      : (typeof effectiveCase?.confidence_score === 'number' ? effectiveCase.confidence_score * 100 : null);
    if (value === null) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, [effectiveCase, caseId]);

  const derivedEvidence = useMemo(() => {
    if (effectiveCase?.evidenceStatus) return effectiveCase.evidenceStatus;
    if (effectiveCase?.evidence_attachments?.document_id || matchedDocs.length > 0) return 'Available';
    return 'Awaiting data';
  }, [effectiveCase, matchedDocs.length]);

  const matchedCount = matchedDocs.length || (Array.isArray(effectiveCase?.documents) ? effectiveCase.documents.length : 0);
  const resolvedUnitsAffected = effectiveCase?.unitsLost ?? effectiveCase?.units_lost ?? effectiveCase?.quantity ?? effectiveCase?.units ?? null;
  const estimatedClaimValue = effectiveCase?.estimated_claim_value ?? effectiveCase?.estimated_value ?? null;
  const requestedAmount = effectiveCase?.requested_amount ?? effectiveCase?.guaranteedAmount ?? effectiveCase?.claim_amount ?? effectiveCase?.amount ?? null;
  const approvedAmount = effectiveCase?.approved_amount ?? effectiveCase?.recovery_amount ?? null;
  const recoveredAmount = effectiveCase?.actual_payout_amount ?? null;
  const billedAmount = effectiveCase?.billed_amount ?? null;
  const resolvedClaimAmount = requestedAmount ?? estimatedClaimValue ?? null;
  const resolvedValuePerUnit = typeof resolvedClaimAmount === 'number' &&
    typeof resolvedUnitsAffected === 'number' &&
    resolvedUnitsAffected > 0
    ? resolvedClaimAmount / resolvedUnitsAffected
    : null;
  const resolvedClaimType = effectiveCase?.anomaly_type ? String(effectiveCase.anomaly_type).replace(/_/g, ' ') : '-';
  const resolvedMatchMethod = effectiveCase?.evidence_summary?.match_type || effectiveCase?.evidence_attachments?.match_type || effectiveCase?.match_type
    ? String(effectiveCase?.evidence_summary?.match_type || effectiveCase?.evidence_attachments?.match_type || effectiveCase?.match_type).replace(/_/g, ' ')
    : '-';
  const resolvedFacility = effectiveCase?.facility || effectiveCase?.evidence?.fulfillment_center || effectiveCase?.warehouse || null;
  const resolvedStoreName = effectiveCase?.store_name || effectiveCase?.seller_name || null;
  const nextStep = effectiveCase?.next_step_context || null;
  const generatedContext = effectiveCase?.generated_context || null;
  const evidenceEvents = useMemo(() => (Array.isArray(caseData?.events) ? caseData.events.filter(isEvidenceRelatedEvent) : []), [caseData?.events]);
  const rejectionPlaybookReason = useMemo<RejectionReason | null>(() => {
    const category = effectiveCase?.rejection_category;
    if (category && REJECTION_CATEGORY_TO_PLAYBOOK[category]) {
      return REJECTION_CATEGORY_TO_PLAYBOOK[category];
    }
    const legacy = effectiveCase?.rejection_code;
    return legacy && escalationPlaybooks[legacy as RejectionReason] ? legacy as RejectionReason : null;
  }, [effectiveCase?.rejection_category, effectiveCase?.rejection_code]);
  const lifecycleSteps = useMemo(() => {
    const currentStatus = String(effectiveCase?.status || '').toLowerCase();
    const filingStatus = String(effectiveCase?.filing_status || '').toLowerCase();
    const recoveryStatus = String(effectiveCase?.recovery_status || '').toLowerCase();
    const billingStatus = String(effectiveCase?.billing_status || '').toLowerCase();
    const hasEvidence = matchedCount > 0;
    return [
      { label: 'Detected', active: Boolean(effectiveCase?.id) },
      { label: 'Evidence', active: hasEvidence },
      { label: 'Filed', active: ['filed', 'submitted', 'resubmitted', 'filing'].includes(filingStatus) || ['submitted', 'under review', 'under_review', 'in_progress', 'processing', 'approved', 'rejected', 'denied'].includes(currentStatus) },
      { label: 'Approved', active: ['approved'].includes(currentStatus) || ['reconciled', 'discrepancy'].includes(recoveryStatus) },
      { label: 'Recovered', active: ['reconciled', 'discrepancy'].includes(recoveryStatus) || typeof recoveredAmount === 'number' },
      { label: 'Billed', active: ['pending', 'completed'].includes(billingStatus) }
    ];
  }, [effectiveCase?.id, effectiveCase?.status, effectiveCase?.filing_status, effectiveCase?.recovery_status, effectiveCase?.billing_status, matchedCount, recoveredAmount]);

  // Early return guards (all hooks must be called before these)
  if (!caseId) {
    return (
      <PageLayout title="Case Not Found">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Case not found</h2>
          <Button asChild>
            <Link to={`/app/${activeSlug}/recoveries`}>
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
      <PageLayout title="Loading..." midnight>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-500/50" />
            <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Loading case details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!effectiveCase) {
    return (
      <PageLayout title="Case Not Found" midnight>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-white">Case not found</h2>
            <p className="text-white/40 mb-6 font-mono">Case ID: {caseId}</p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <Button asChild className="bg-white/10 border border-white/10 hover:bg-white/20 text-white">
              <Link to={`/app/${activeSlug}/recoveries`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cases
              </Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Case ID: ${effectiveCase.id}`} midnight>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-background min-h-[calc(100vh+96px)] -mt-24 pt-24 text-[13px]">
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-white/80">
            {/* Header - Case Information */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link to={`/app/${activeSlug}/recoveries`} className="h-10 w-10 flex items-center justify-center border border-white/10 hover:bg-white/5 transition-colors rounded-lg">
                  <ArrowLeft className="h-4 w-4 text-white/40" />
                </Link>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-white tracking-tight font-sans">{effectiveCase.case_number || effectiveCase.claim_number || effectiveCase.evidence?.claim_number || effectiveCase.id?.slice(0, 12)}</h1>
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70 text-[9px] uppercase tracking-tight">
                      {objectType}
                    </Badge>
                    {statusFeedUnavailable && (
                      <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400 text-[9px] uppercase tracking-tight">
                        Status Unavailable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors border-none px-4"
                    >
                      Review Discrepancy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-sans font-bold text-white flex items-center gap-2">
                          {AGENT_NAMES['refund_filing'] || 'AI'}: Generated Filing Draft
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-xs font-sans font-bold tracking-tight">
                          Generated guidance from backend case state • Case {effectiveCase.id?.slice(0, 12)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 p-6 bg-white/[0.03] border border-white/10 rounded-xl">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] uppercase font-bold text-white/30 tracking-tight">Generated Claim Logic</span>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] font-bold">{nextStep?.title || 'Generated Context'}</Badge>
                        </div>
                        <p className="text-sm leading-relaxed text-white/80 font-bold tracking-tight italic">
                          "{generateNarrative(effectiveCase)}"
                        </p>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="text-[10px] text-white/20 font-sans font-bold tracking-tight">
                            {nextStep?.description || generatedContext?.summaryLabel || 'Generated from the latest backend case fields.'}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-bold text-emerald-500 p-0 h-auto hover:bg-transparent"
                            onClick={async () => await ClaimPdfService.generate(effectiveCase)}
                          >
                            Export as PDF <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-white/10 text-xs font-bold text-white/40 hover:text-white hover:border-white/30 transition-colors bg-transparent"
                  onClick={async () => await ClaimPdfService.generate(effectiveCase)}
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Get PDF
                </Button>
              </div>
            </div>

            {/* Trust Banner - Policy & Confidence */}
            {(POLICY_MAP[effectiveCase.anomaly_type] || effectiveCase.safety_audit || matchedCount > 0 || nextStep) && (
              <div className="flex flex-wrap items-center gap-6 py-2 mb-4">
                {POLICY_MAP[effectiveCase.anomaly_type] && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                        Generated Policy Reference
                      </span>
                      <a
                        href={POLICY_MAP[effectiveCase.anomaly_type].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                      >
                        <Scale className="h-3 w-3" />
                        {POLICY_MAP[effectiveCase.anomaly_type].code}
                        {POLICY_MAP[effectiveCase.anomaly_type].clause && (
                          <span className="ml-1 opacity-60 font-medium">({POLICY_MAP[effectiveCase.anomaly_type].clause})</span>
                        )}
                      </a>
                    </div>
                  </div>
                )}

                {effectiveCase.safety_audit && (
                  <>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded group cursor-help transition-all hover:bg-emerald-500/20" title={`Safety Score: ${effectiveCase.safety_audit.score}%\nRisk of Warning: ${effectiveCase.safety_audit.risk_of_warning}\nVerified by: ${effectiveCase.safety_audit.verified_by}`}>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-1.5">
                        Submission Safety Audit Passed
                      </span>
                    </div>
                  </>
                )}

                {!effectiveCase.safety_audit && (
                  <>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded">
                      <Info className="h-3.5 w-3.5 text-white/40" />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
                        {generatedContext?.trustLabel || 'Generated risk guidance'}
                      </span>
                    </div>
                  </>
                )}

                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded">
                  <FileText className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-tight">
                    {matchedCount} matched docs
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('RECORD')}
                className={cn(
                  "px-8 py-4 text-[12px] font-bold transition-all duration-300 relative uppercase",
                  activeTab === 'RECORD' ? "text-white" : "text-white/40 hover:text-white/60"
                )}>
                CLAIM RECORD
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] bg-white transition-all duration-300 transform origin-left",
                  activeTab === 'RECORD' ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                )} />
              </button>
              <button
                onClick={() => setActiveTab('PROTOCOL')}
                className={cn(
                  "px-8 py-4 text-[12px] font-bold transition-all duration-300 relative uppercase",
                  activeTab === 'PROTOCOL' ? "text-white" : "text-white/40 hover:text-white/60"
                )}>
                RESOLUTION STEPS
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2px] bg-white transition-all duration-300 transform origin-left",
                  activeTab === 'PROTOCOL' ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                )} />
              </button>
            </div>

            {activeTab === 'RECORD' && (
              <div className="flex flex-col gap-0 border border-white/10 divide-y divide-white/10 rounded-2xl overflow-hidden">
                {/* Tile 1: Audit Narrative & Logistics */}
                <div className="p-8 bg-white/[0.02]">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white">Generated Case Summary</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-tight font-bold mt-1">
                      {generatedContext?.summaryLabel || 'Generated context from backend case fields'}
                    </p>
                  </div>
                  <div className="space-y-8">
                    <p className="text-[15px] text-white/70 leading-relaxed font-normal tracking-tight">
                      {generateNarrative(effectiveCase)}
                    </p>

                    <div className="pt-6 border-t border-white/10">
                      <div className="text-xs text-white/30 font-bold mb-6 flex items-center gap-2">
                        Product & Facility Details
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Product</p>
                          <p className="text-sm font-semibold text-white leading-tight" title={effectiveCase.productName || effectiveCase.title || 'Unknown Product'}>
                            {effectiveCase.productName || effectiveCase.title || 'Unknown Product'}
                          </p>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">ASIN / SKU</p>
                          <p className="text-sm font-sans font-bold text-white">
                            {effectiveCase.asin && effectiveCase.asin !== 'N/A' ? effectiveCase.asin : <span className="text-white/20">-</span>}
                            <span className="mx-2 text-white/10">/</span>
                            {effectiveCase.sku && effectiveCase.sku !== 'N/A' ? effectiveCase.sku : <span className="text-white/20">-</span>}
                          </p>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Warehouse</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-white/30" />
                            <p className="text-sm font-bold text-white">
                              {resolvedFacility && !String(resolvedFacility).includes('UNKNOWN')
                                ? resolvedFacility
                                : <span className="text-white/20">-</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-[10px] font-bold text-white/30 w-32 shrink-0 pt-0.5 tracking-tight">Amazon Case ID</p>
                          <div className="flex flex-col gap-1">
                            {effectiveCase.amazonCaseId ? (
                              <a href={`https://sellercentral.amazon.com/case-log/${effectiveCase.amazonCaseId}`} target="_blank" rel="noreferrer" className="text-xs font-sans font-bold text-emerald-500 hover:underline flex items-center gap-1">
                                {effectiveCase.amazonCaseId} <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : <span className="text-xs text-white/20">-</span>}
                            {effectiveCase.prior_case_id && (
                              <div className="text-xs text-white/40 font-sans font-bold">Prior: {effectiveCase.prior_case_id}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Double-Dip Protection Alert */}
                      {(effectiveCase.prior_reimbursement_detected || effectiveCase.inventory_adjustment_applied || effectiveCase.duplicate_blocked) && (
                        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-blue-400 mb-1">Account Protection Active</div>
                            <p className="text-xs text-blue-300/70 leading-relaxed font-bold">
                              {effectiveCase.prior_reimbursement_detected
                                ? `We detected a prior reimbursement for ${effectiveCase.sku}. This claim was blocked to prevent a duplicate filing.`
                                : effectiveCase.inventory_adjustment_applied
                                  ? 'Amazon already processed an inventory adjustment. Claim was suppressed to protect your account.'
                                  : 'This claim was blocked by our protection system to keep your account safe.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tile 2: Transaction Details */}
                <div className="p-8 bg-[#0a0a0a]">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white">Transaction Details</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Case Details */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-emerald-500 rounded-full" /> Case Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Units Affected</dt>
                          <dd className="flex items-center gap-2 text-xs font-sans font-bold text-white">
                            {typeof resolvedUnitsAffected === 'number' ? resolvedUnitsAffected : <span className="text-white/20">-</span>}
                            {typeof resolvedUnitsAffected === 'number' && effectiveCase.units_is_verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] h-3.5 font-bold uppercase tracking-tight px-1.5">Verified</Badge>
                            ) : typeof resolvedUnitsAffected === 'number' ? (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-3.5 font-bold uppercase tracking-tight px-1.5">Estimated</Badge>
                            ) : null}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Value Per Unit</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {resolvedValuePerUnit === null
                              ? '-'
                              : `$${resolvedValuePerUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Confidence Score</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {derivedConfidencePct !== null ? `${derivedConfidencePct}%` : '-'}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Lifecycle */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-blue-500 rounded-full" /> Lifecycle State
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Current Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {toStatusLabel(effectiveCase.status || (statusFeedUnavailable ? 'unavailable' : '-'))}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Filing Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {toStatusLabel(effectiveCase.filing_status)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Recovery Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">{toStatusLabel(effectiveCase.recovery_status)}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Billing Status</dt>
                          <dd className="text-xs font-sans font-bold text-white">{toStatusLabel(effectiveCase.billing_status)}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Issue Identified</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatDateOrDash(effectiveCase.created_at || effectiveCase.createdDate || effectiveCase.discovery_date)}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Last Updated</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {formatDateOrDash(effectiveCase.updated_at || effectiveCase.created_at || effectiveCase.createdDate)}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Shipment */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight">
                        <div className="h-1 w-2 bg-white/40 rounded-full" /> Shipment Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Warehouse</dt>
                          <dd className="text-xs font-sans font-bold text-white">
                            {effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '-'}
                          </dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Product Match</dt>
                          <dd className="text-xs font-sans font-bold text-white">{derivedEvidence}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Order Reference</dt>
                          <dd className="text-xs font-sans font-bold text-white underline underline-offset-2 decoration-white/20">
                            {effectiveCase.order_id || '-'}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Recovery Info */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight uppercase">
                        <div className="h-1 w-2 bg-indigo-500 rounded-full" /> Recovery Info
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Claim Type</dt>
                          <dd className="text-xs font-sans font-bold text-white capitalize">{resolvedClaimType}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Match Method</dt>
                          <dd className="text-xs font-sans font-bold text-white capitalize">{resolvedMatchMethod}</dd>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                          <dt className="text-[11px] text-white/40 font-medium">Detection</dt>
                          <dd className="text-xs font-bold text-white/70">{AGENT_NAMES['detection'] || 'Automatic'}</dd>
                        </div>
                      </div>
                    </div>

                    {/* Historical Context / Platform Insights */}
                    <div className="space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold text-white/30 border-b border-white/10 pb-2.5 tracking-tight uppercase">
                        <History className="h-3 w-3 text-amber-500" /> Platform Insights
                      </h4>
                      <div className="space-y-3">
                        {effectiveCase.warehouse_history ? (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-3 w-3 text-amber-500" />
                              <span className="text-[11px] font-bold text-amber-500">Recurring Pattern Detected</span>
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                              Warehouse <span className="text-white font-semibold">{resolvedFacility ? String(resolvedFacility).split(' ')[0] : '-'}</span> has recorded <span className="text-white font-semibold">{effectiveCase.warehouse_history.occurrence_count} similar discrepancies</span> for you, totaling <span className="text-white font-semibold">${effectiveCase.warehouse_history.total_value_lost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> in at-risk value.
                            </p>
                            <div className="mt-2 text-[9px] text-white/30 font-sans font-bold">
                              {effectiveCase.warehouse_history.source || '-'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center py-4">
                            <span className="text-[10px] text-white/20 font-medium">-</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Audit Calculation Breakdown */}
                    {effectiveCase.evidence && (effectiveCase.evidence.total_input || effectiveCase.evidence.total_output) && (
                      <div className="col-span-1 md:col-span-2 mt-4">
                        <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-tight flex items-center gap-2">
                              <BarChart3 className="h-3.5 w-3.5" />
                              Audit Calculation Breakdown
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-white/30 font-sans">
                              <Database className="h-3 w-3" />
                              Real-time FBA Logs
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="space-y-3">
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-2">Inventory In (Input)</div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Total Receipts</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_receipts || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Customer Returns</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_returns || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Adjustments (In)</span>
                                <span className="text-white font-sans font-bold">+{effectiveCase.evidence.total_adjustments || 0}</span>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold">
                                <span className="text-white/60 uppercase tracking-tight">Total Verified In</span>
                                <span className="text-emerald-400 font-sans font-bold">{effectiveCase.evidence.total_input || 0}</span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-2">Inventory Out (Output)</div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Customer Shipments</span>
                                <span className="text-white font-sans font-bold">-{effectiveCase.evidence.total_shipments || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Removals & Disposals</span>
                                <span className="text-white font-sans font-bold">-{effectiveCase.evidence.total_removals || 0}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white/40">Adjustments (Out)</span>
                                <span className="text-white font-sans font-bold">-0</span>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-bold">
                                <span className="text-white/60 uppercase tracking-tight">Total Verified Out</span>
                                <span className="text-amber-400 font-sans font-bold">{effectiveCase.evidence.total_output || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-x-16 gap-y-6">
                            <div>
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1.5">Expected Stock</div>
                              <div className="text-lg font-sans font-bold text-white">{effectiveCase.evidence.calculated_stock || (effectiveCase.evidence.total_input - effectiveCase.evidence.total_output) || 0}</div>
                            </div>
                            <div className="text-white/10 text-xl font-bold pt-2">vs</div>
                            <div>
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-tight mb-1.5">Warehouse Balance</div>
                              <div className="text-lg font-sans font-bold text-white">{effectiveCase.evidence.ending_warehouse_balance || 0}</div>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                            <div>
                              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight mb-1.5">Detected Gap</div>
                              <div className="text-lg font-sans font-bold text-emerald-500">
                                {effectiveCase.evidence.discrepancy || (Math.max(0, (effectiveCase.evidence.calculated_stock || (effectiveCase.evidence.total_input - effectiveCase.evidence.total_output) || 0) - (effectiveCase.evidence.ending_warehouse_balance || 0)))} Units
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tile 3: Recovery Value */}
                <div className="p-8 bg-white/[0.02]">
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-white">Recovery Value</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="min-w-[240px]">
                      <div className="text-[10px] text-white/30 font-bold mb-3 tracking-tight">Requested Claim Amount</div>
                      <div className="text-2xl font-bold text-emerald-500 font-sans tracking-tight">
                        {formatCurrencyOrDash(requestedAmount, effectiveCase?.currency || 'USD')}
                      </div>

                      <div className="mt-4 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-white/60">
                          <span>Estimated Claim Value</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(estimatedClaimValue, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Approved Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(approvedAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Recovered Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(recoveredAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/60">
                          <span>Billed Amount</span>
                          <span className="font-sans font-bold text-white">{formatCurrencyOrDash(billedAmount, effectiveCase?.currency || 'USD')}</span>
                        </div>
                      </div>

                      {typeof recoveredAmount === 'number' && (
                        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg inline-block min-w-[200px]">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] text-white/40 font-bold uppercase">Actual Payout</span>
                            <span className="text-xs font-sans font-bold text-blue-400">{formatCurrencyOrDash(recoveredAmount, effectiveCase?.currency || 'USD')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold tracking-tight">
                            <CheckCircle className="h-3 w-3" /> {toStatusLabel(effectiveCase.recovery_status || 'reconciled')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 max-w-sm">
                      <div className="border border-white/10 bg-white/5 rounded-lg hover:bg-white/[0.06] transition-all duration-300">
                        <div className="px-4 pt-4 border-b border-white/5">
                          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                            <SelectTrigger className="h-7 w-full border-0 bg-transparent p-0 text-[10px] font-bold text-white/40 focus:ring-0 shadow-none tracking-tight">
                              <SelectValue placeholder="Metric View" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-white/10 bg-[#1a1a1a] shadow-xl">
                              <SelectItem value="payout" className="text-xs text-white/70">Expected Payout</SelectItem>
                              <SelectItem value="confidence" className="text-xs text-white/70">Confidence Score</SelectItem>
                              <SelectItem value="units" className="text-xs text-white/70">Units Affected</SelectItem>
                              <SelectItem value="cost" className="text-xs text-white/70">Cost Per Unit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-6">
                          <div className="text-lg font-bold text-white tabular-nums font-sans tracking-tight">
                            {selectedMetric === 'payout' && (
                              effectiveCase.expectedPayoutDate ? (
                                (() => {
                                  const d = new Date(effectiveCase.expectedPayoutDate);
                                  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  });
                                })()
                              ) : '-'
                            )}
                            {selectedMetric === 'confidence' && (derivedConfidencePct === null ? '-' : `${derivedConfidencePct}%`)}
                            {selectedMetric === 'units' && `${effectiveCase.unitsLost ?? '-'} units`}
                            {selectedMetric === 'cost' && (
                              typeof effectiveCase.unitCost === 'number' ? `$${effectiveCase.unitCost.toFixed(2)}` : '-'
                            )}
                          </div>
                          <div className="text-[10px] text-white/30 mt-2 font-bold tracking-tight">
                            {selectedMetric === 'payout' && 'Expected Payout Date'}
                            {selectedMetric === 'confidence' && 'Analysis Precision'}
                            {selectedMetric === 'units' && 'Inventory Units'}
                            {selectedMetric === 'cost' && 'Verified Cost Basis'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PROTOCOL' && (
              <div className="flex flex-col gap-0 border border-white/10 divide-y divide-white/10 rounded-2xl overflow-hidden">
                {/* Row 1: Case Progress */}
                <div className="py-5 px-8 bg-white/[0.02]">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white">Case Progress</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Horizontal Progress bar */}
                    <div className="relative pt-2 pb-2 px-4">
                      <div className="absolute top-[18px] left-0 right-0 h-[1px] bg-white/10" />
                      <div className="flex justify-between relative z-10">
                        {lifecycleSteps.map((step, idx) => {
                          return (
                            <div key={step.label} className="flex flex-col items-center gap-2">
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all shrink-0",
                                step.active ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-[#0a0a0a] border-white/10 text-white/30"
                              )}>
                                {idx + 1}
                              </div>
                              <span className={cn(
                                "text-[11px] font-bold tracking-tight uppercase",
                                step.active ? "text-blue-500" : "text-white/20"
                              )}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                      <div className="text-[10px] text-white/30 font-bold uppercase tracking-tight mb-2">Next System Step</div>
                      <div className="text-sm font-bold text-white">{nextStep?.title || 'Unknown next step'}</div>
                      <div className="text-[11px] text-white/60 mt-1 leading-relaxed">
                        {nextStep?.description || 'The backend did not return next-step context for this case.'}
                      </div>
                    </div>

                    {/* Timeline View */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
                      <Timeline claimId={effectiveCase.id} tenantSlug={activeSlug} />
                    </div>

                  </div>
                </div>

                {/* Row 2: Evidence & Verification */}
                <div className="p-8 bg-[#0a0a0a]">
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-white">Evidence & Verification</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="text-xs text-white/30 font-bold flex items-center gap-2">
                        Matched Documents ({matchedCount})
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      {matchedDocs.length > 0 ? (
                        <div className="space-y-3">
                          {matchedDocs.map((doc: any, idx: number) => {
                            const confidencePct = typeof doc.matchConfidence === 'number'
                              ? Math.round(doc.matchConfidence * 100)
                              : (typeof doc.confidence_score === 'number'
                                ? Math.round((doc.confidence_score > 1 ? doc.confidence_score : doc.confidence_score * 100))
                                : null);
                            return (
                              <div key={doc.id || idx} className="p-4 bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group flex items-center justify-between rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-3.5 w-3.5 text-white/30 group-hover:text-emerald-500" />
                                  <div>
                                    <p className="text-xs font-bold text-white truncate font-sans">
                                      {doc.name || doc.filename || `Document ${idx + 1}`}
                                    </p>
                                    <p className="text-[10px] text-white/30">{doc.matchType || 'Attached'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-[10px] h-4.5 px-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                                    {confidencePct !== null ? `${confidencePct}%` : '-'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 p-0"
                                    onClick={() => window.open(`/app/${activeSlug}/documents/${encodeURIComponent(doc.id)}`, '_blank')}>
                                    View <ArrowRight className="h-2.5 w-2.5 ml-1" />
                                  </Button>
                                </div>
                                {effectiveCase.evidence?.snippets?.length > 0 && (
                                  <div className="mt-3 ml-6 pr-4 py-2 bg-emerald-500/[0.03] rounded border border-emerald-500/10 space-y-1.5">
                                    {effectiveCase.evidence.snippets.map((snippet: any, sIdx: number) => (
                                      <div key={sIdx} className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1 h-1 bg-emerald-500/40 rounded-full" />
                                          <span className="text-white/40 font-bold uppercase tracking-tight">{snippet.label}</span>
                                        </div>
                                        <span className="text-white/80 font-sans font-bold truncate max-w-[280px] italic bg-white/5 px-1.5 rounded">"{snippet.text}"</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-lg">
                          <Database className="h-8 w-8 text-white/10 mb-4" />
                          <p className="text-[10px] font-bold text-white/30 tracking-tight">No documents matched yet</p>
                        </div>
                      )}
                    </div>

                    {/* EVIDENCE LOG */}
                    <div className="space-y-4 pt-4">
                      <div className="text-xs text-white/30 font-bold flex items-center gap-2">
                        Evidence Log
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      <div className="overflow-hidden border border-white/5 rounded-lg bg-white/[0.02]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Timestamp</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Event Type</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Reference</th>
                              <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-tight font-sans">Confirmation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {evidenceEvents.map((event: any, idx: number) => {
                              const statusLabel = toStatusLabel(event.status || event.eventType || event.type);
                              const confirmation = event.source === 'agent_event' ? 'SYSTEM_EVENT' : 'NOTIFICATION_EVENT';

                              return (
                                <tr key={event.id || idx} className="hover:bg-white/[0.04] transition-colors group">
                                  <td className="px-4 py-3 text-[10px] font-sans font-bold text-white/60">
                                    {new Date(event.at).toLocaleString('en-US', {
                                      month: '2-digit', day: '2-digit', year: '2-digit',
                                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                                      hour12: false
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                      <span className="text-[10px] font-bold text-white/80 font-sans uppercase tracking-tight">
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-[10px] font-sans font-bold text-white/40">
                                    {event.claimId || event.id || '--'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] h-4.5 px-2 border-white/10 font-sans font-bold uppercase tracking-tight",
                                      confirmation === 'AMAZON_CONFIRMED' ? "bg-emerald-500/10 text-emerald-500/80 border-emerald-500/20" :
                                        confirmation === 'SELLER_CONFIRMED' ? "bg-blue-500/10 text-blue-500/80 border-blue-500/20" :
                                          "bg-white/5 text-white/40"
                                    )}>
                                      {confirmation}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                            {evidenceEvents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-sans font-bold text-white/20">
                                  -
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Seller Identity
                          <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 border border-white/10 rounded-lg">
                          <div className="p-2 bg-emerald-500 rounded-lg">
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold text-white tracking-tight">Seller Identity</h4>
                            <p className="text-[10px] text-white/30 font-sans font-bold uppercase tracking-tight">{objectType}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Seller ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">{effectiveCase.seller_id || effectiveCase.user_id || 'Not available'}</dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Store Name</dt>
                            <dd className="text-xs font-bold text-white truncate" title={resolvedStoreName || '-'}>
                              {resolvedStoreName || '-'}
                            </dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">User ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">{effectiveCase.user_id || effectiveCase.seller_id || 'Not mapped'}</dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Permission Status</dt>
                            <dd className="text-xs font-bold text-white uppercase tracking-tight">-</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Contact Method</dt>
                            <dd className="text-xs font-bold text-white uppercase tracking-tight">-</dd>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Reference Data
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="space-y-3">
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Amazon Case ID</dt>
                            <dd className="text-xs font-sans font-bold text-white">
                              {effectiveCase.amazonCaseId || <span className="text-white/20 font-normal">-</span>}
                            </dd>
                          </div>
                          <div className="border-b border-white/5 pb-2">
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Prior Case</dt>
                            <dd className="text-xs font-bold text-white font-sans font-bold uppercase tracking-tight">{effectiveCase.prior_case_id || 'None'}</dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-white/40 font-medium mb-1">Claim Reference</dt>
                            <dd className="text-xs font-sans font-bold text-white uppercase tracking-tight">
                              {effectiveCase.claim_number || effectiveCase.claim_id || effectiveCase.id?.slice(0, 12)}
                            </dd>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-[10px] text-white/30 font-bold mb-4 flex items-center gap-2 tracking-tight uppercase">
                          Generated System Guidance
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 tracking-tight uppercase mb-2">
                            {generatedContext?.strategyLabel || 'Generated guidance'}
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-bold">
                            {effectiveCase.autonomous_logic_summary || nextStep?.description || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Autonomous Strategy & Recovery Path */}
                <div className="p-8 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Autonomous Strategy & Recovery Path</h3>
                      <p className="text-[10px] text-white/30 font-sans font-bold uppercase tracking-tight">Patient Zero → Settlement Ledger v4.2</p>
                    </div>

                    {/* Active Council Icons */}
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                      <div className="px-2 border-r border-white/10 mr-1">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-tight">Active Council</span>
                      </div>
                      {(caseData?.playbook?.council || []).map((agent: any) => (
                        <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-all cursor-crosshair">
                          <div className={cn(
                            "w-1 h-1 rounded-full animate-pulse",
                            agent.status === 'SETTLED' ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className="text-[10px] font-bold text-white/60 font-sans font-bold">{agent.agent}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Rejection Master / Escalation Playbook */}
                    {['rejected', 'denied'].includes((effectiveCase.status || '').toLowerCase()) && rejectionPlaybookReason && escalationPlaybooks[rejectionPlaybookReason] && (
                      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShieldAlert className="h-24 w-24 text-red-500" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                              <Zap className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white tracking-tight">Escalation Playbook: {escalationPlaybooks[rejectionPlaybookReason].label}</h4>
                              <p className="text-[10px] text-red-400 font-sans font-bold uppercase tracking-tight mt-0.5">Generated guidance from stored rejection memory</p>
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mb-6 leading-relaxed max-w-lg font-bold tracking-tight">
                            {effectiveCase.rejection_reason || escalationPlaybooks[rejectionPlaybookReason].description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h5 className="text-[10px] font-bold text-white/30 uppercase tracking-tight">Required Maneuver</h5>
                              <ul className="space-y-2.5">
                                {escalationPlaybooks[rejectionPlaybookReason].actions.map((action, aIdx) => (
                                  <li key={aIdx} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-[9px] font-bold text-red-500 shrink-0 mt-0.5">{aIdx + 1}</div>
                                    <span className="text-[11px] text-white/80 font-medium">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex flex-col justify-end gap-3">
                              <button
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs h-9 transition-all rounded-lg"
                                onClick={() => {
                                  recoveryApi.resubmitClaim(effectiveCase.id, activeSlug).catch(() => { });
                                }}
                              >
                                {escalationPlaybooks[rejectionPlaybookReason].autoTriggerable ? 'Auto-Trigger Escalation' : 'Confirm Manual Escalation'}
                              </button>
                              <p className="text-[9px] text-white/30 text-center">
                                Escalation managed by {AGENT_NAMES['refund_filing']}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TWO-COLUMN STRATEGY GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      {/* Left: Tactical Playbook */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Tactical Playbook</h4>
                            <p className="text-[9px] text-white/30 font-sans font-bold">{generatedContext?.strategyLabel || 'Generated strategy from backend state'}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(caseData?.playbook?.steps || []).map((action: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 group">
                              <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-sans font-bold text-white/40 group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-all shrink-0 mt-0.5 italic">
                                0{idx + 1}
                              </div>
                              <span className="text-xs text-white/70 leading-relaxed font-bold tracking-tight">{action}</span>
                            </div>
                          ))}
                          {(!caseData?.playbook?.steps || caseData.playbook.steps.length === 0) && (
                            <div className="py-4 text-[11px] text-white/20 font-sans font-bold">-</div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <div className="flex items-center justify-between p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white/60">Requested Claim Amount</span>
                            </div>
                            <span className="text-sm font-sans font-bold text-emerald-500">
                              {formatCurrencyOrDash(requestedAmount, effectiveCase?.currency || 'USD')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Protection Protocols */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight uppercase">Continuous Protection</h4>
                            <p className="text-[9px] text-white/30 font-sans font-bold">{generatedContext?.trustLabel || 'Generated risk guidance from backend signals'}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {(caseData?.protection_protocol || []).map((measure: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-4 group">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30 mt-1.5 ring-4 ring-blue-500/5" />
                              <span className="text-xs text-white/70 leading-relaxed font-bold tracking-tight">{measure}</span>
                            </div>
                          ))}
                          {(!caseData?.protection_protocol || caseData.protection_protocol.length === 0) && (
                            <div className="py-4 text-[11px] text-white/20 font-sans font-bold">-</div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/5">
                          <div className="flex items-center gap-3 p-4 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl">
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/60 uppercase tracking-tight">Current Next Step</span>
                              <span className="text-[9px] text-white/30 font-sans font-bold uppercase">{nextStep?.title || 'Generated context unavailable'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
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
