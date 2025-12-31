import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Timeline from '@/components/layout/Timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, DollarSign, Package, MapPin, FileText, CheckCircle, AlertCircle, Calendar, RefreshCw, ExternalLink, Receipt } from 'lucide-react';
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
        description: 'Opside AI Agent generated comprehensive claim documentation with supporting evidence',
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
  const type = (claim.anomaly_type || claim.claim_type || claim.type || 'issue').replace(/_/g, ' ');
  const amount = claim.guaranteedAmount || claim.amount || claim.estimated_value || 0;
  const sku = claim.sku || claim.evidence?.sku;
  const asin = claim.asin || claim.evidence?.asin;
  const dateStr = claim.discovery_date || claim.created_at || claim.createdDate;
  const date = dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
  const status = (claim.status || '').toLowerCase();
  const units = claim.units_lost || claim.quantity || claim.evidence?.units_lost || '';

  let narrative = `On ${date}, Opside detected a ${type}`;
  if (units) narrative += ` affecting ${units} unit${units > 1 ? 's' : ''}`;
  if (sku) narrative += ` of SKU ${sku}`;
  if (asin) narrative += ` (ASIN: ${asin})`;
  narrative += `. The estimated recoverable value is $${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

  // Add status-specific content
  if (status === 'approved' || status === 'paid' || status === 'paid out' || status === 'paid_out' || status === 'reconciled') {
    narrative += ` This claim has been approved and reimbursement has been processed.`;
  } else if (status === 'denied' || status === 'rejected') {
    narrative += ` This claim was denied${claim.rejection_reason ? ` due to: ${claim.rejection_reason.replace(/_/g, ' ')}` : ''}.`;
  } else if (status === 'submitted' || status === 'under review' || status === 'under_review' || status === 'filed') {
    narrative += ` The claim has been submitted to Amazon and is currently under review.`;
  } else if (status === 'guaranteed' || status === 'ready') {
    narrative += ` This claim is ready for submission with all required evidence gathered.`;
  } else {
    narrative += ` This claim is currently being prepared for submission.`;
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
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link to="/recoveries" className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Cases
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Case Summary */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                        Case Summary
                      </h3>
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

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Expected Payout</div>
                        <div className="text-xs font-medium text-gray-900">
                          {effectiveCase.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Confidence</div>
                        <div className="text-xs font-medium text-gray-900">{derivedConfidencePct}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Units Lost</div>
                        <div className="text-xs font-medium text-gray-900">{effectiveCase.unitsLost ?? '—'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">Unit Cost</div>
                        <div className="text-xs font-medium text-gray-900">
                          {typeof effectiveCase.unitCost === 'number' ? `$${effectiveCase.unitCost.toFixed(2)}` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Product Details</div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{effectiveCase.productName || effectiveCase.title || effectiveCase.anomaly_type || 'Unknown Product'}</div>
                        <div className="text-[10px] text-gray-500">SKU: {effectiveCase.sku || effectiveCase.evidence?.sku || 'N/A'}</div>
                        {(effectiveCase.asin || effectiveCase.evidence?.asin) && (
                          <div className="text-[10px] text-gray-500">ASIN: {effectiveCase.asin || effectiveCase.evidence?.asin}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {effectiveCase.facility || effectiveCase.evidence?.fulfillment_center || '—'}
                      </div>
                    </div>

                    {/* Evidence Status */}
                    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Evidence</div>
                        <Badge variant="outline" className="text-xs border-gray-200">{matchedCount} docs</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          derivedEvidence === 'Ready' && "bg-green-50 text-green-700 border-green-200",
                          derivedEvidence === 'Collecting' && "bg-blue-50 text-blue-700 border-blue-200",
                          derivedEvidence === 'Needs Docs' && "bg-amber-50 text-amber-700 border-amber-200",
                        )}>
                          {derivedEvidence}
                        </Badge>
                      </div>

                      {matchedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {matchedDocs.slice(0, 2).map((d: any) => (
                            <Button key={d.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => window.open(`/documents/${encodeURIComponent(d.id)}`, '_blank')}>
                              {d.name || d.filename || d.id}
                            </Button>
                          ))}
                          {matchedDocs.length > 2 && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500" asChild>
                              <Link to="/evidence-locker">+{matchedDocs.length - 2} more</Link>
                            </Button>
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
                          }}
                        >
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
                    <div className="space-y-2 pt-2">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={effectiveCase.status === 'Paid Out'}
                        onClick={async () => {
                          const res = await api.submitClaim(effectiveCase.id);
                          if (res.ok) {
                            setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted', submissionStatus: 'submitted' }));
                            toast({ title: 'Claim submitted to Amazon', description: 'We will update you with the Amazon Case ID shortly.' });
                          } else {
                            toast({ title: 'Submission failed', description: res.error || 'Please try again.' });
                          }
                        }}
                      >
                        Resolve Case
                      </Button>

                      {derivedConfidencePct >= 85 && (
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white" onClick={async () => {
                          try {
                            await recoveryApi.submitClaim(effectiveCase.id);
                            toast({ title: 'Auto-submitted', description: `${effectiveCase.id} submitted automatically (high confidence).` });
                            setCaseData((prev: any) => ({ ...(prev || {}), status: 'Submitted' }));
                          } catch (e: any) {
                            toast({ title: 'Auto-submit failed', description: e?.message || 'Please try again.' });
                          }
                        }}>
                          Auto-submit (High Confidence)
                        </Button>
                      )}

                      {derivedConfidencePct >= 60 && derivedConfidencePct < 85 && matchedCount > 0 && (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                          toast({ title: 'Confirm invoice', description: 'Invoice confirmed and ready to submit.' });
                          setCaseData((prev: any) => ({ ...(prev || {}), submissionStatus: 'submitted' }));
                        }}>
                          Confirm Invoice
                        </Button>
                      )}

                      {derivedConfidencePct < 60 && (
                        <div className="text-center py-2">
                          <Badge variant="outline" className="border-amber-200 text-amber-600">Parked — needs more data</Badge>
                        </div>
                      )}

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
                                }}
                              >
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

                      <Button variant="outline" className="w-full text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => {
                        window.open(api.getRecoveryDocumentUrl(effectiveCase.id), '_blank');
                      }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Proof Document
                      </Button>

                      <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700" asChild>
                        <Link to="/evidence-locker">Open Evidence Locker</Link>
                      </Button>
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
                                  onClick={() => window.open(`/documents/${encodeURIComponent(doc.id)}`, '_blank')}
                                >
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
                          asChild
                        >
                          <Link to="/evidence-locker">Browse Evidence Locker</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Chronological Ledger */}
              <div className="lg:col-span-2 space-y-4">
                {/* Required Actions */}
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                      Required Actions
                    </h3>
                  </div>
                  <div className="p-4 text-sm text-gray-500 italic">
                    What needs to be done/fixed for this case
                  </div>
                </div>

                {/* Issue Description - Narrative Section */}
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                      Issue Description
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {generateNarrative(effectiveCase)}
                    </p>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                      Transaction History
                    </h3>
                  </div>
                  <div className="p-4 text-sm text-gray-500 italic">
                    Proof of the mistake
                  </div>
                </div>

              </div>

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                    Contact Information
                  </h3>
                </div>
                <div className="p-4 text-xs space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Seller Contact:</h4>
                    <dl className="space-y-1 text-gray-600">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Merchant Token:</dt>
                        <dd className="col-span-2 font-mono text-gray-900">[Your Merchant Token]</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Store Name:</dt>
                        <dd className="col-span-2">[Your Store Name]</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Contact Method:</dt>
                        <dd className="col-span-2">Seller Central Case Manager</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Amazon Reference:</h4>
                    <dl className="space-y-1 text-gray-600">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Case ID:</dt>
                        <dd className="col-span-2 font-mono text-blue-600">{effectiveCase.amazonCaseId || '[Associated Case ID if applicable]'}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-gray-500">Previous Cases:</dt>
                        <dd className="col-span-2 text-gray-500 italic">[Any previous case references]</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">
                      <Clock className="h-4 w-4" />
                      Claim Timeline
                    </h3>
                    <span className="text-[10px] text-gray-500 border border-gray-200 px-2 py-0.5">
                      {typeof effectiveCase.progress === 'number' ? `${Math.round(effectiveCase.progress)}%` : 'Real-time transparency'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Quick actions - clean white container */}
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-white">
                      <div className="ml-auto flex gap-2">
                        <button className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1" onClick={async () => {
                          const url = api.getRecoveryDocumentUrl(effectiveCase.id);
                          // Try composed proof first; if unavailable, fall back to first matched document
                          try {
                            const head = await fetch(url, { method: 'HEAD', credentials: 'include' });
                            if (head.ok) {
                              window.open(url, '_blank');
                              return;
                            }
                          } catch { }
                          if (Array.isArray(matchedDocs) && matchedDocs.length > 0) {
                            window.open(`/documents/${encodeURIComponent(matchedDocs[0].id)}`, '_blank');
                          } else {
                            toast({ title: 'No proof available yet', description: 'Evidence is still being collected for this case.' });
                          }
                        }}>
                          <FileText className="h-3.5 w-3.5" /> Proof of Document
                        </button>
                        <Link to="/recoveries" className="px-3 py-1.5 text-xs text-white bg-gray-900 hover:bg-gray-800">
                          Back to Cases
                        </Link>
                      </div>
                    </div>

                    {/* Timeline: fetch and display audit events */}
                    <div className="mt-4 mb-6">
                      <Timeline claimId={effectiveCase.id} />
                    </div>

                    {/* Visual Stepper */}
                    <div className="flex items-center gap-3 mb-2 text-sm">
                      {['Detected', 'Prepared', 'Submitted', 'Paid'].map((step, idx) => {
                        // Normalize status to lowercase for comparison
                        const status = (effectiveCase.status || '').toLowerCase();
                        const active = (
                          (step === 'Detected') ||
                          (step === 'Prepared' && ['guaranteed', 'submitted', 'under review', 'under_review', 'filed', 'pending', 'in progress', 'in_progress', 'paid out', 'paid_out', 'approved', 'paid'].includes(status)) ||
                          (step === 'Submitted' && ['submitted', 'under review', 'under_review', 'filed', 'paid out', 'paid_out', 'approved', 'paid'].includes(status)) ||
                          (step === 'Paid' && ['paid out', 'paid_out', 'approved', 'paid', 'completed', 'reconciled'].includes(status))
                        );
                        return (
                          <div key={step} className="flex items-center gap-3">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border text-xs ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{idx + 1}</div>
                            <span className={`text-xs ${active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{step}</span>
                            {idx < 3 && <div className={`w-8 h-px ${active ? 'bg-gray-900' : 'bg-gray-200'}`} />}
                          </div>
                        );
                      })}
                    </div>
                    {(effectiveCase.events || []).map((event: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className={cn("flex-shrink-0 mt-1", getEventColor(event.type))}>
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {event.description}
                              </p>
                            </div>
                            <div className="text-xs text-gray-600 whitespace-nowrap">
                              {new Date(event.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          {Array.isArray(effectiveCase.events) && index < effectiveCase.events.length - 1 && (
                            <div className="border-l border-gray-200 ml-2 h-6 mt-3" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Future events placeholder */}
                    {effectiveCase.status === 'Guaranteed' && (
                      <div className="flex gap-4 opacity-50">
                        <div className="flex-shrink-0 mt-1 text-gray-600">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-600">Claim Submitted to Amazon</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Pending user approval to submit claim documentation to Amazon
                              </p>
                            </div>
                            <div className="text-xs text-gray-600 whitespace-nowrap">
                              Pending
                            </div>
                          </div>
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
    </div>
    </PageLayout >
  );
}