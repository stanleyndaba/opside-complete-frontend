import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { normalizeTenantSlug } from '@/lib/routes';
import {
  formatDisputeReason,
  formatPayoutProofStatus,
  formatProofStatus,
  formatRequirementList,
  getManualReviewReason,
  getMissingRequirements,
  getPayoutProofStatus,
  getProofStatus,
  getQuarantineReason,
  payoutProofTone,
  proofStatusTone
} from '@/lib/disputeProof';
import { cn } from '@/lib/utils';

interface DisputeCasesTableProps {
  isPaidUser?: boolean;
  isTenantThrottled?: boolean;
}

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type LegacyCase = NonNullable<Awaited<ReturnType<typeof api.getDisputeCases>>['data']>['cases'][number];

function toPreviewRowFromLegacy(item: LegacyCase): QueueRow {
  return {
    dispute_case_id: item.id,
    detection_result_id: item.claim_id || null,
    row_type: 'dispute_case',
    entity_type: 'dispute_case',
    has_real_dispute_case: true,
    linked_dispute_case_id: item.id,
    brief_available: true,
    case_number: item.case_number || item.id,
    claim_number: item.claim_id || null,
    case_type: null,
    anomaly_type: null,
    status: item.status || null,
    filing_status: null,
    recovery_status: null,
    billing_status: null,
    requested_amount: item.amount ?? null,
    approved_amount: null,
    actual_payout_amount: null,
    billed_amount: null,
    currency: item.currency || 'USD',
    evidence_state: 'Not Available',
    proof_status: null,
    missing_requirements: [],
    manual_review_reason: null,
    payout_proof_status: null,
    quarantine_reason: null,
    matched_document_count: 0,
    rejection_category: null,
    rejection_reason: null,
    created_at: item.created_at || null,
    updated_at: item.created_at || null,
    amazon_case_id: null,
    store_name: null,
    order_id: null,
    sku: null,
    asin: null,
    expected_payout_amount: null,
    expected_payout_date: item.expected_payout_date || item.expectedPayoutDate || null,
    can_file: false,
    can_retry: false,
    can_approve: false,
    can_open_brief: false,
    can_open_case_detail: true,
    next_action: 'Not Available',
  };
}

function badgeClass(value: string | null | undefined) {
  const key = String(value || '').toLowerCase();
  if (['approved', 'reconciled', 'completed', 'credited', 'charged'].includes(key)) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (['rejected', 'denied', 'failed'].includes(key)) return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (['filed', 'submitted', 'filing', 'submitting'].includes(key)) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (['pending', 'retrying', 'pending_approval'].includes(key)) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-white/5 text-white/50 border-white/10';
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return 'Not Available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function DisputeCasesTable(_props: DisputeCasesTableProps) {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredResults, setFilteredResults] = useState(0);
  const [source, setSource] = useState<'authoritative' | 'legacy'>('authoritative');

  useEffect(() => {
    if (!activeTenantSlug) {
      setLoading(false);
      setRows([]);
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getDisputeCaseQueue({
          sort_by: 'updated_at',
          sort_order: 'desc',
          page: 1,
          page_size: 10
        }, activeTenantSlug);

        if (response.ok && response.data && (response.data.rows?.length || 0) > 0) {
          if (cancelled) return;
          setRows(response.data.rows || []);
          setFilteredResults(response.data.filtered_results || 0);
          setSource('authoritative');
          return;
        }

        const legacyResponse = await api.getDisputeCases({ limit: 10 }, activeTenantSlug);
        if (legacyResponse.ok && legacyResponse.data?.cases?.length) {
          if (cancelled) return;
          setRows((legacyResponse.data.cases || []).map(toPreviewRowFromLegacy));
          setFilteredResults(legacyResponse.data.total || legacyResponse.data.cases.length || 0);
          setSource('legacy');
          setError(null);
          return;
        }

        if (!response.ok || !response.data) {
          throw new Error(response.error || 'Failed to load dispute case preview');
        }

        if (cancelled) return;
        setRows(response.data.rows || []);
        setFilteredResults(response.data.filtered_results || 0);
        setSource('authoritative');
      } catch (err: any) {
        if (!cancelled) {
          try {
            const legacyResponse = await api.getDisputeCases({ limit: 10 }, activeTenantSlug);
            if (legacyResponse.ok && legacyResponse.data?.cases?.length) {
              if (cancelled) return;
              setRows((legacyResponse.data.cases || []).map(toPreviewRowFromLegacy));
              setFilteredResults(legacyResponse.data.total || legacyResponse.data.cases.length || 0);
              setSource('legacy');
              setError(null);
              return;
            }
          } catch {
            // Keep original error below if both sources fail.
          }

          setError(err.message || 'Failed to load dispute case preview');
          setRows([]);
          setSource('authoritative');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPreview();
    return () => { cancelled = true; };
  }, [activeTenantSlug]);

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 text-white/40">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[10px] font-sans font-bold uppercase tracking-tight">Loading dispute queue preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-5 h-5 text-white/40" />
        <div className="space-y-1">
          <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">Dispute queue unavailable</p>
          <p className="text-[10px] font-sans text-white/35">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-[10px] font-sans font-bold text-white/60 uppercase tracking-widest">Dispute Queue Preview</h2>
          <p className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">
            Showing {rows.length} of {filteredResults} {source === 'legacy' ? 'legacy dispute cases' : 'backend-filtered cases'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {source === 'legacy' ? (
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-300">
              Legacy fallback
            </Badge>
          ) : null}
          {activeTenantSlug && (
            <Button asChild className="h-8 px-4 text-[9px] font-sans font-bold uppercase tracking-tight bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 rounded-lg">
              <Link to="/dispute-cases">
                Open Full Queue
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
          <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/40">No dispute queue records available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.dispute_case_id} className="bg-white/[0.01] border-white/5 text-white rounded-2xl">
              <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {(() => {
                  const isLegacyRow = source === 'legacy';
                  const proofStatus = getProofStatus(row);
                  const missingRequirements = getMissingRequirements(row);
                  const manualReviewReason = getManualReviewReason(row);
                  const payoutProofStatus = getPayoutProofStatus(row);
                  const quarantineReason = getQuarantineReason(row);
                  const recordId = row.linked_dispute_case_id || row.dispute_case_id;
                  const filingStatusLabel = isLegacyRow ? 'Not Available' : (row.filing_status || 'Not Available');
                  const evidenceStateLabel = isLegacyRow ? 'Not Available' : (row.evidence_state || 'Not Available');
                  const proofStatusLabel = isLegacyRow ? 'Not Available' : (proofStatus ? formatProofStatus(proofStatus) : null);
                  const payoutProofLabel = isLegacyRow ? 'Not Available' : (payoutProofStatus && payoutProofStatus !== 'not_applicable' ? formatPayoutProofStatus(payoutProofStatus) : null);
                  const nextActionLabel = isLegacyRow ? 'Not Available' : (row.next_action || 'Not Available');
                  const approvedLabel = isLegacyRow ? 'Not Available' : formatMoney(row.approved_amount, row.currency);
                  const recoveredLabel = isLegacyRow ? 'Not Available' : formatMoney(row.actual_payout_amount, row.currency);
                  const matchedDocsLabel = isLegacyRow ? 'Not Available' : String(row.matched_document_count);

                  return (
                    <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/recoveries/${recordId}`} className="text-sm font-sans font-bold text-white hover:text-emerald-300">
                      {row.case_number || row.dispute_case_id}
                    </Link>
                    <Badge variant="outline" className={cn('border', badgeClass(row.status))}>{row.status || 'Not Available'}</Badge>
                    <Badge variant="outline" className={cn('border', badgeClass(filingStatusLabel))}>{filingStatusLabel}</Badge>
                    <Badge variant="outline" className={cn('border', badgeClass(evidenceStateLabel))}>{evidenceStateLabel}</Badge>
                    {proofStatusLabel ? (
                      <Badge variant="outline" className={cn('border', isLegacyRow ? badgeClass('Not Available') : proofStatusTone(proofStatus))}>
                        Proof: {proofStatusLabel}
                      </Badge>
                    ) : null}
                    {payoutProofLabel ? (
                      <Badge variant="outline" className={cn('border', isLegacyRow ? badgeClass('Not Available') : payoutProofTone(payoutProofStatus))}>
                        Payout: {payoutProofLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-[11px] font-sans text-white/45 space-y-1">
                    <div>Next Action: {nextActionLabel}</div>
                    <div>Requested: {formatMoney(row.requested_amount, row.currency)} | Approved: {approvedLabel} | Recovered: {recoveredLabel}</div>
                    {!isLegacyRow && missingRequirements.length ? (
                      <div>Missing: {formatRequirementList(missingRequirements, 2)}</div>
                    ) : null}
                    {!isLegacyRow && manualReviewReason ? (
                      <div>Review: {formatDisputeReason(manualReviewReason)}</div>
                    ) : null}
                    {!isLegacyRow && quarantineReason ? (
                      <div>Quarantine: {quarantineReason}</div>
                    ) : null}
                  </div>
                </div>
                <div className="text-[11px] font-sans text-white/40">
                  Matched Docs: {matchedDocsLabel}
                </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
