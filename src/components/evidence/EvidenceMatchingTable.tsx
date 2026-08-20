import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { claimReferenceLabel, documentReferenceLabel } from '@/lib/displayReferences';

interface MatchingResult {
  id: string;
  claim_id: string;
  document_id: string;
  confidence_score: number;
  match_type: string;
  action_taken: 'auto_submit' | 'smart_prompt' | 'no_action' | 'approved' | 'rejected';
  matched_fields?: string[];
  reasoning?: string;
  created_at?: string;
  claim_details?: {
    type?: string;
    amount?: number;
    currency?: string;
    sku?: string;
    asin?: string;
    case_number?: string;
    reference?: string;
    title?: string;
    subtitle?: string;
  };
  document_details?: {
    filename?: string;
    supplier?: string;
    invoice_number?: string;
    amount?: number;
    original_filename?: string;
    title?: string;
    subtitle?: string;
    linked_document_count?: number;
    linked_document_names?: string[];
  };
  match_details?: {
    title?: string;
    subtitle?: string;
  };
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const DEMO_SUBMITTED_DOCUMENT_TITLES = [
  'Amazon Inbound Shipment Summary – March 2026.xlsx',
  'Supplier Invoice – Shenzhen Optics Co. – INV-2841.pdf',
  'Warehouse Dispatch Confirmation – Batch 22.pdf',
  'Refund Without Return Audit – April 2026.csv',
  'Bill of Lading – FBA Shipment FBA15KD82.pdf',
  'Amazon Case Log Export – Reimbursement Claims.csv',
  'Inventory Reconciliation Statement – US Marketplace.xlsx',
  'Carrier Delivery Exception Notice – DHL Freight.pdf',
  'Proof of Delivery – UPS Freight – Tracking 1Z84X.pdf',
  'Settlement Transaction Report – Q2 2026.xlsx',
  'Supplier Packing List – SKU Group A.pdf',
  'Commercial Invoice – Inventory Batch 14.pdf',
  'FBA Inventory Adjustment Detail – May 2026.csv',
  'Receiving Discrepancy Report – FBA Shipment 4821.csv',
  'Shipment Manifest – Carton IDs + SKU Counts.pdf',
  'Amazon Reimbursement Notification – Case 16894380251.pdf',
  'Financial Ledger – Reimbursement Verification.xlsx',
  'Removal Order Damage Photos – Batch 19.pdf',
  'Lost Inventory Reconciliation Export – FNSKU Review.xlsx',
  'Carrier Weight Audit – Pallet Transfer 07.csv',
];

const DEMO_SUBMITTED_MATCH_TYPES = [
  { type: 'Inbound shipment shortage', matchType: 'sku_asin_invoice', supplier: 'Amazon FBA', amount: 184.72 },
  { type: 'FBA fee overcharge', matchType: 'exact_invoice', supplier: 'Amazon Settlement', amount: 128.36 },
  { type: 'Lost inventory reimbursement', matchType: 'amazon_fba', supplier: 'Warehouse Ops', amount: 312.18 },
  { type: 'Damaged inventory reimbursement', matchType: 'supplier_match', supplier: 'Shenzhen Optics Co.', amount: 96.44 },
  { type: 'Refund without return', matchType: 'amount_match', supplier: 'Amazon Settlement', amount: 57.9 },
  { type: 'Carrier delivery exception', matchType: 'date_match', supplier: 'DHL Freight', amount: 267.11 },
  { type: 'Warehouse transfer loss', matchType: 'amazon_fba', supplier: 'Warehouse Ops', amount: 219.47 },
  { type: 'Settlement reimbursement gap', matchType: 'exact_invoice', supplier: 'Amazon Marketplace', amount: 128.36 },
  { type: 'Removal order damage', matchType: 'sku_match', supplier: 'Amazon FBA', amount: 173.62 },
  { type: 'Inventory reconciliation gap', matchType: 'asin_match', supplier: 'Amazon Marketplace', amount: 421.65 },
];

const DEMO_SUBMITTED_MATCHES: MatchingResult[] = DEMO_SUBMITTED_DOCUMENT_TITLES.map((documentTitle, index) => {
  const profile = DEMO_SUBMITTED_MATCH_TYPES[index % DEMO_SUBMITTED_MATCH_TYPES.length];
  const createdAt = new Date(new Date('2026-05-12T16:30:00.000Z').getTime() - index * 2_700_000).toISOString();
  const caseNumber = `RFD-${17240 + index}-${String(profile.type).slice(0, 3).toUpperCase()}`;
  const sku = ['NS-HOME-ORGANIZER-2PK', 'BRS-KITCHEN-MAT-GR', 'ATL-PET-BOWL-XL', 'CPB-TRAVEL-BAG-BLK', 'SWL-CREAM-SET-03'][index % 5];
  const asin = `B0${['C7N2Q9KM', '9V4N6R2T', 'B2K8MTQ1', '8YQ3M6JH', 'C2JWV7P4'][index % 5]}`;
  const amount = Number((profile.amount + index * 19.35).toFixed(2));

  return {
    id: `demo-submitted-match-${index + 1}`,
    claim_id: `demo-submitted-claim-${index + 1}`,
    document_id: `demo-evidence-document-${index + 1}`,
    confidence_score: 0.9 + ((index % 5) * 0.017),
    match_type: profile.matchType,
    action_taken: index % 3 === 0 ? 'approved' : 'auto_submit',
    matched_fields: ['SKU', 'ASIN', 'Amount', 'Shipment ID', 'Case reference'],
    reasoning: `${documentTitle} matched the submitted claim packet with SKU, ASIN, amount, and Amazon reference fields aligned.`,
    created_at: createdAt,
    claim_details: {
      type: profile.type,
      amount,
      currency: 'USD',
      sku,
      asin,
      case_number: caseNumber,
      reference: caseNumber,
      title: profile.type,
      subtitle: `Matched case evidence · SKU ${sku} · ASIN ${asin}`,
    },
    document_details: {
      filename: documentTitle,
      supplier: profile.supplier,
      invoice_number: `DEMO-${2841 + index}`,
      amount,
      original_filename: documentTitle,
      title: documentTitle,
      subtitle: `Matched document · ${profile.supplier} · $${amount.toFixed(2)}`,
      linked_document_count: 1,
      linked_document_names: [documentTitle],
    },
    match_details: {
      title: profile.type,
      subtitle: `Matched with ${caseNumber}; Amazon review is tracking the evidence packet.`,
    },
  };
});

export function EvidenceMatchingTable() {
  const [matchingResults, setMatchingResults] = useState<MatchingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('smart-prompts');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || 'default';

  const fetchMatchingResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMatchingResults({ limit: 100 }, activeTenantSlug);

      if (response.ok && response.data?.results) {
        setMatchingResults(response.data.results as any);
      } else {
        setError(response.error || 'Failed to fetch matching results');
        setMatchingResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch matching results');
      setMatchingResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    try {
      setRefreshing(true);
      const response = await api.runEvidenceMatching(undefined, activeTenantSlug);

      if (response.ok) {
        toast({
          title: 'Evidence Matching Started',
          description: response.data?.message || 'Matching process has been initiated',
        });
        // Refresh results after a delay
        setTimeout(() => {
          fetchMatchingResults();
        }, 3000);
      } else {
        toast({
          title: 'Failed to Start Matching',
          description: response.error || 'Could not start evidence matching',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to start evidence matching',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Smart Prompt actions
  const handleApproveSmartPrompt = async (matchId: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.approveSmartPrompt(matchId, activeTenantSlug);
      if (response.ok) {
        toast({
          title: 'Match Approved',
          description: 'Claim has been submitted for filing.',
        });
        // Update local state - move to approved
        setMatchingResults(prev => prev.map(r =>
          r.id === matchId ? { ...r, action_taken: 'approved' as const } : r
        ));
      } else {
        toast({
          title: 'Approval Failed',
          description: response.error || 'Could not approve match',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve match',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const handleRejectSmartPrompt = async (matchId: string, reason?: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.rejectSmartPrompt(matchId, reason, activeTenantSlug);
      if (response.ok) {
        toast({
          title: 'Match Rejected',
          description: 'This match has been marked as rejected.',
        });
        // Update local state - move to rejected
        setMatchingResults(prev => prev.map(r =>
          r.id === matchId ? { ...r, action_taken: 'rejected' as const } : r
        ));
      } else {
        toast({
          title: 'Rejection Failed',
          description: response.error || 'Could not reject match',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject match',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  const handleRequestMoreEvidence = async (matchId: string) => {
    setProcessingIds(prev => new Set(prev).add(matchId));
    try {
      const response = await api.requestMoreEvidence(matchId, activeTenantSlug);
      if (response.ok) {
        toast({
          title: 'More Evidence Requested',
          description: 'This match has been flagged for additional evidence collection.',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: response.error || 'Could not request more evidence',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to request more evidence',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    }
  };

  // Force approve a parked claim (despite low confidence)
  const handleForceApproveParked = async (claimId: string) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    try {
      const response = await api.approveSmartPrompt(claimId, activeTenantSlug);
      if (response.ok) {
        toast({
          title: 'Claim Force Approved',
          description: 'Claim has been approved and queued for filing.',
        });
        setMatchingResults(prev => prev.filter(r => r.id !== claimId));
      } else {
        toast({
          title: 'Approval Failed',
          description: response.error || 'Could not approve claim',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve claim',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  // Dismiss a parked claim
  const handleDismissParked = async (claimId: string) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    try {
      const response = await api.rejectSmartPrompt(claimId, 'Dismissed by user', activeTenantSlug);
      if (response.ok) {
        toast({
          title: 'Claim Dismissed',
          description: 'Claim has been removed from the queue.',
        });
        setMatchingResults(prev => prev.filter(r => r.id !== claimId));
      } else {
        toast({
          title: 'Dismissal Failed',
          description: response.error || 'Could not dismiss claim',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to dismiss claim',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchMatchingResults();
  }, [activeTenantSlug]);

  const displayMatchingResults = useMemo(
    () => activeTenantSlug === 'demo-workspace'
      ? [...DEMO_SUBMITTED_MATCHES, ...matchingResults]
      : matchingResults,
    [activeTenantSlug, matchingResults]
  );

  // Filter results by action type
  const smartPrompts = useMemo(() =>
    displayMatchingResults.filter(r => r.action_taken === 'smart_prompt'),
    [displayMatchingResults]
  );

  const autoSubmitted = useMemo(() =>
    displayMatchingResults.filter(r => r.action_taken === 'auto_submit' || r.action_taken === 'approved'),
    [displayMatchingResults]
  );

  const heldForReview = useMemo(() =>
    displayMatchingResults.filter(r => r.action_taken === 'no_action' || r.action_taken === 'rejected'),
    [displayMatchingResults]
  );

  const getMatchTypeLabel = (matchType: string) => {
    const labels: Record<string, string> = {
      'amazon_fba': 'Evidence linked',
      'exact_invoice': 'Exact Invoice Match',
      'sku_asin_invoice': 'SKU, ASIN, invoice match',
      'sku_match': 'SKU Match',
      'asin_match': 'ASIN Match',
      'supplier_match': 'Supplier Match',
      'date_match': 'Date Match',
      'amount_match': 'Amount Match',
      'fuzzy_match': 'Fuzzy Match',
    };
    return labels[matchType] || matchType.replace(/_/g, ' ');
  };

  const getActionLabel = (match: MatchingResult) => {
    if (match.id.startsWith('demo-submitted-match-')) return 'Matched';

    const labels: Record<MatchingResult['action_taken'], string> = {
      auto_submit: 'Auto-submitted',
      smart_prompt: 'Pending review',
      no_action: 'Held',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return labels[match.action_taken] || match.action_taken.replace(/_/g, ' ');
  };

  const getClaimReference = (match: MatchingResult) =>
    claimReferenceLabel(match.claim_details, match.claim_id);

  const getClaimTitle = (match: MatchingResult) =>
    match.claim_details?.title
    || (match.match_type === 'amazon_fba' ? 'Evidence-backed recovery case' : null);

  const getClaimSubtitle = (match: MatchingResult) => {
    if (match.claim_details?.subtitle) return match.claim_details.subtitle;

    const parts = [
      match.claim_details?.sku ? `SKU ${match.claim_details.sku}` : null,
      match.claim_details?.asin ? `ASIN ${match.claim_details.asin}` : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : null;
  };

  const getDocumentTitle = (match: MatchingResult) =>
    documentReferenceLabel(match.document_details, match.document_id);

  const getDocumentSubtitle = (match: MatchingResult) => {
    if (match.document_details?.subtitle) return match.document_details.subtitle;

    const parts = [
      match.document_details?.supplier || null,
      typeof match.document_details?.linked_document_count === 'number' && match.document_details.linked_document_count > 1
        ? `${match.document_details.linked_document_count} linked documents`
        : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : null;
  };

  const renderEmptyState = (
    eyebrow: string,
    title: string,
    description: string,
    action?: React.ReactNode
  ) => (
    <div className="border border-[#DCE8EE] bg-[#FAFAF7] px-6 py-12 text-center">
      <div className="text-[11px] font-medium tracking-tight text-[#66737F]">
        {eyebrow}
      </div>
      <h3 className="mt-3 font-lora text-[20px] font-normal tracking-tight text-[#182026]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#66737F]">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );

  const actionButtonClass =
    "h-8 rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] shadow-none transition-colors hover:border-[#BFD8F6] hover:bg-[#F3F7FF] hover:text-[#0B74DE] disabled:cursor-not-allowed disabled:opacity-40";

  const quietActionButtonClass =
    "h-8 rounded-md px-2 text-[11px] font-medium tracking-tight text-[#66737F] shadow-none transition-colors hover:bg-[#F7FAFC] hover:text-[#182026] disabled:cursor-not-allowed disabled:opacity-40";

  const renderRowActions = (match: MatchingResult, fallbackLabel: string) => {
    const isProcessing = processingIds.has(match.id);

    if (match.action_taken === 'smart_prompt') {
      return (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            onClick={() => handleApproveSmartPrompt(match.id)}
            disabled={isProcessing}
            className={actionButtonClass}
          >
            Confirm
          </Button>
          <Button
            onClick={() => handleRequestMoreEvidence(match.id)}
            disabled={isProcessing}
            variant="ghost"
            className={quietActionButtonClass}
          >
            More proof
          </Button>
          <Button
            onClick={() => handleRejectSmartPrompt(match.id)}
            disabled={isProcessing}
            variant="ghost"
            className={cn(quietActionButtonClass, "hover:text-[#B42318]")}
          >
            Reject
          </Button>
        </div>
      );
    }

    if (match.action_taken === 'no_action' || match.action_taken === 'rejected') {
      return (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button
            onClick={() => handleRequestMoreEvidence(match.id)}
            disabled={isProcessing}
            className={actionButtonClass}
          >
            More proof
          </Button>
          <Button
            onClick={() => handleForceApproveParked(match.id)}
            disabled={isProcessing}
            variant="ghost"
            className={quietActionButtonClass}
          >
            Approve
          </Button>
          <Button
            onClick={() => handleDismissParked(match.id)}
            disabled={isProcessing}
            variant="ghost"
            className={cn(quietActionButtonClass, "hover:text-[#B42318]")}
          >
            Dismiss
          </Button>
        </div>
      );
    }

    return (
      <Link
        to={`/recoveries/${match.claim_id}`}
        className="inline-flex h-8 items-center rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] transition-colors hover:border-[#BFD8F6] hover:bg-[#F3F7FF] hover:text-[#0B74DE] lg:justify-self-end"
      >
        {fallbackLabel}
      </Link>
    );
  };

  const renderMatchRows = (
    matches: MatchingResult[],
    actionLabel: string
  ) => (
    <div className="overflow-hidden border border-[#DCE8EE] bg-white">
      <div className="hidden border-b border-[#E7EEF2] bg-[#F7FAFC] px-5 py-3 lg:grid lg:grid-cols-[1.2fr_0.85fr_1.05fr_0.5fr_0.95fr] lg:gap-5">
        {['Match', 'Claim', 'Document', 'Score', 'Action'].map((label) => (
          <div key={label} className="text-[10px] font-medium tracking-tight text-[#66737F]">
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#E7EEF2]">
        {matches.map((match) => (
          <div key={match.id} className="px-5 py-4 transition-colors hover:bg-[#F7FAFC]">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.85fr_1.05fr_0.5fr_0.95fr] lg:gap-5 lg:items-start">
              <div>
                <div className="text-[13px] font-medium tracking-tight text-[#182026]">
                  {match.match_details?.title || getMatchTypeLabel(match.match_type)}
                </div>
                <div className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">
                  {getActionLabel(match)}
                </div>
                {match.match_details?.subtitle ? (
                  <div className="mt-1 max-w-xl text-[11px] leading-5 text-[#66737F]">
                    {match.match_details.subtitle}
                  </div>
                ) : null}
                {match.created_at ? (
                  <div className="mt-1 text-[10px] text-[#8A99A5]">
                    Reviewed {format(new Date(match.created_at), 'MMM dd, yyyy • HH:mm')}
                  </div>
                ) : null}
                {match.reasoning ? (
                  <div className="mt-2 max-w-xl text-[10px] leading-5 text-[#66737F] lg:hidden">
                    {match.reasoning}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-[10px] font-medium tracking-tight text-[#66737F] lg:hidden">
                  Claim
                </div>
                <Link to={`/recoveries/${match.claim_id}`} className="mt-1 inline-flex text-[11px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#0968C8]">
                  {getClaimReference(match)}
                </Link>
                {getClaimTitle(match) ? (
                  <div className="mt-1 text-[11px] font-medium tracking-tight text-[#182026]">
                    {getClaimTitle(match)}
                  </div>
                ) : null}
                {getClaimSubtitle(match) ? (
                  <div className="mt-1 text-[10px] leading-4 text-[#66737F]">
                    {getClaimSubtitle(match)}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-[10px] font-medium tracking-tight text-[#66737F] lg:hidden">
                  Document
                </div>
                <Link to={`/documents/${match.document_id}`} className="mt-1 inline-flex text-[11px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#0968C8]">
                  {getDocumentTitle(match)}
                </Link>
                {getDocumentSubtitle(match) ? (
                  <div className="mt-1 text-[10px] leading-4 text-[#66737F]">
                    {getDocumentSubtitle(match)}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-[10px] font-medium tracking-tight text-[#66737F] lg:hidden">
                  Confidence
                </div>
                <div className="mt-1 text-[12px] font-semibold tabular-nums tracking-tight text-[#182026] lg:text-right">
                  {Math.round(match.confidence_score * 100)}%
                </div>
              </div>

              <div>
                <div className="text-[10px] font-medium tracking-tight text-[#66737F] lg:hidden">
                  Action
                </div>
                <div className="mt-1 lg:mt-0">{renderRowActions(match, actionLabel)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  if (loading && matchingResults.length === 0) {
    return (
      <div className="border border-[#DCE8EE] bg-[#FAFAF7] px-6 py-12 text-center">
        <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Evidence queue</div>
        <p className="mt-3 font-lora text-[20px] font-normal tracking-tight text-[#182026]">Loading current evidence matches.</p>
        <p className="mt-2 text-[12px] leading-5 text-[#66737F]">Please wait while Margin refreshes the current review queue.</p>
      </div>
    );
  }

  if (error && displayMatchingResults.length === 0) {
    return (
      <div className="border border-[#F1C9C5] bg-[#FFF8F7] px-6 py-10 text-center">
        <div className="text-[11px] font-medium tracking-tight text-[#B42318]">Evidence queue</div>
        <p className="mt-3 font-lora text-[20px] font-normal tracking-tight text-[#182026]">Evidence review could not be loaded.</p>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#66737F]">{error}</p>
        <Button onClick={fetchMatchingResults} className="mt-6 h-8 rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
          Retry
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-5">
      <div className="border border-[#DCE8EE] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Evidence readiness</div>
            <h2 className="mt-2 font-lora text-[24px] font-normal tracking-tight text-[#182026]">
              Review the proof behind each recovery.
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-[#66737F]">
              {refreshing
                ? 'Refreshing the current evidence queue.'
                : displayMatchingResults.length > 0
                  ? `${pluralize(displayMatchingResults.length, 'match')} available · ${smartPrompts.length} pending · ${autoSubmitted.length} submitted · ${heldForReview.length} held`
                  : 'No evidence matches are currently waiting in the queue.'}
            </p>
          </div>
          <Button
            onClick={handleRunMatching}
            disabled={refreshing}
            className={cn(
              "h-9 rounded-md border px-3 text-[11px] font-medium tracking-tight transition-colors",
              refreshing
                ? "border-[#DCE8EE] bg-[#F7FAFC] text-[#8A99A5]"
                : "border-[#DCE8EE] bg-white text-[#4D5B66] hover:border-[#BFD8F6] hover:bg-[#F3F7FF] hover:text-[#0B74DE]"
            )}
          >
            {refreshing ? 'Refreshing...' : 'Refresh matching'}
          </Button>
        </div>
      </div>

      {/* Tabs for different match categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-0 grid h-auto w-full grid-cols-2 justify-start gap-1 rounded-md border border-[#DCE8EE] bg-white p-1 lg:grid-cols-4">
          <TabsTrigger
            value="smart-prompts"
            className="justify-start rounded px-3 py-2.5 text-left text-[11px] font-medium tracking-tight text-[#66737F] shadow-none transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] data-[state=active]:shadow-none"
          >
            <span>Pending review</span>
          </TabsTrigger>
          <TabsTrigger
            value="auto-submitted"
            className="justify-start rounded px-3 py-2.5 text-left text-[11px] font-medium tracking-tight text-[#66737F] shadow-none transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] data-[state=active]:shadow-none"
          >
            <span>Submitted</span>
          </TabsTrigger>
          <TabsTrigger
            value="held"
            className="justify-start rounded px-3 py-2.5 text-left text-[11px] font-medium tracking-tight text-[#66737F] shadow-none transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] data-[state=active]:shadow-none"
          >
            <span>Held</span>
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="justify-start rounded px-3 py-2.5 text-left text-[11px] font-medium tracking-tight text-[#66737F] shadow-none transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] data-[state=active]:shadow-none"
          >
            <span>All matches</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart-prompts" className="mt-0 outline-none">
          {smartPrompts.length === 0 ? (
            renderEmptyState(
              'Pending review',
              'No matches are waiting for a manual decision.',
              'When Margin finds supportable claim-to-document matches that still need human confirmation, they will appear here.'
            )
          ) : (
            renderMatchRows(smartPrompts, 'Review')
          )}
        </TabsContent>

        {/* Auto-Submitted Tab */}
        <TabsContent value="auto-submitted" className="mt-0">
          {autoSubmitted.length === 0 ? (
            renderEmptyState(
              'Submitted',
              'No matches have been moved forward yet.',
              'Approved and auto-submitted evidence matches will appear here after they leave review.'
            )
          ) : (
            renderMatchRows(autoSubmitted, 'Open recovery')
          )}
        </TabsContent>


        {/* Held / Rejected Tab */}
        <TabsContent value="held" className="mt-0">
          {heldForReview.length === 0 ? (
            renderEmptyState(
              'Held',
              'No matches are currently being held.',
              'Items that need more evidence, seller review, or a manual follow-up will appear here.'
            )
          ) : (
            renderMatchRows(heldForReview, 'Review')
          )}
        </TabsContent>

        {/* All Matches Tab */}
        <TabsContent value="all" className="mt-0 outline-none">
          {displayMatchingResults.length === 0 ? (
            renderEmptyState(
              'All matches',
              'No claim-to-document matches are available yet.',
              'Refresh matching after more evidence arrives to rebuild the queue.',
              <Button
                onClick={handleRunMatching}
                className="h-8 rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] transition-colors hover:bg-[#F7FAFC] hover:text-[#182026]"
              >
                Refresh matching
              </Button>
            )
          ) : (
            renderMatchRows(displayMatchingResults, 'Open recovery')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvidenceMatchingTable;
