import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Circle, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

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
    eligible_to_file: false,
    block_reasons: [],
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
  if (['approved', 'reconciled', 'completed', 'credited', 'charged'].includes(key)) return 'border-[#BFE0CF] bg-[#F4FAF7] text-[#2F6C54]';
  if (['rejected', 'denied', 'failed'].includes(key)) return 'border-[#F1C9C5] bg-[#FFF8F7] text-[#B42318]';
  if (['filed', 'submitted', 'filing', 'submitting'].includes(key)) return 'border-[#BFD8F6] bg-[#F3F7FF] text-[#0B74DE]';
  if (['pending', 'retrying', 'pending_approval'].includes(key)) return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]';
  return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#66737F]';
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function lightProofStatusTone(value: string | null | undefined) {
  switch (String(value || '').toLowerCase()) {
    case 'filing_ready':
      return 'border-[#BFE0CF] bg-[#F4FAF7] text-[#2F6C54]';
    case 'manual_review':
    case 'supportable_but_not_case_eligible':
      return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]';
    case 'ineligible':
      return 'border-[#F1C9C5] bg-[#FFF8F7] text-[#B42318]';
    default:
      return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#66737F]';
  }
}

function lightPayoutProofTone(value: string | null | undefined) {
  switch (String(value || '').toLowerCase()) {
    case 'verified':
      return 'border-[#BFE0CF] bg-[#F4FAF7] text-[#2F6C54]';
    case 'awaiting_payout':
      return 'border-[#BFD8F6] bg-[#F3F7FF] text-[#0B74DE]';
    case 'quarantined':
      return 'border-[#F1C9C5] bg-[#FFF8F7] text-[#B42318]';
    default:
      return 'border-[#DCE8EE] bg-[#F7FAFC] text-[#66737F]';
  }
}

function ActiveCaseOverview() {
  const steps = [
    { label: 'Investigated', complete: true },
    { label: 'Evidence prepared', complete: true },
    { label: 'Approved', complete: true },
    { label: 'Submitted', complete: false },
  ];

  return (
    <div className="border border-[#CFE0EA] bg-[#F8FBFD] px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Active recovery case</div>
          <h3 className="mt-1 text-[19px] font-normal tracking-tight text-[#182026]">Margin is handling the next step.</h3>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#66737F]">The case is moving through Amazon review while Margin keeps the evidence, response, and follow-up together.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#BFD8F6] bg-[#F3F7FF] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-[#0B74DE]">In progress</Badge>
          <Badge variant="outline" className="border-[#BFE0CF] bg-[#F4FAF7] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-[#2F6C54]">Seller action: none required</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-y border-[#DCE8EE] py-3 md:grid-cols-3 md:gap-5">
        <div>
          <div className="text-[9px] font-medium uppercase tracking-tight text-[#8A99A5]">Amazon response</div>
          <div className="mt-1 text-[12px] font-medium tracking-tight text-[#182026]">Awaiting response</div>
          <p className="mt-1 text-[10px] leading-4 text-[#66737F]">Amazon has not returned a decision yet.</p>
        </div>
        <div>
          <div className="text-[9px] font-medium uppercase tracking-tight text-[#8A99A5]">Next action</div>
          <div className="mt-1 text-[12px] font-medium tracking-tight text-[#182026]">Margin will monitor and follow up.</div>
          <p className="mt-1 text-[10px] leading-4 text-[#66737F]">No seller follow-up is needed at this stage.</p>
        </div>
        <div>
          <div className="text-[9px] font-medium uppercase tracking-tight text-[#8A99A5]">Current owner</div>
          <div className="mt-1 text-[12px] font-medium tracking-tight text-[#182026]">Margin operations</div>
          <p className="mt-1 text-[10px] leading-4 text-[#66737F]">Evidence and communication remain under review.</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[9px] font-medium uppercase tracking-tight text-[#8A99A5]">Recovery progress</div>
          <div className="text-[10px] font-medium tracking-tight text-[#4D5B66]">3 of 4 stages complete</div>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          {steps.map((step) => (
            <div key={step.label} className={cn('flex items-center gap-2 border px-2.5 py-2 text-[10px] font-medium tracking-tight', step.complete ? 'border-[#BFE0CF] bg-[#F4FAF7] text-[#2F6C54]' : 'border-[#BFD8F6] bg-[#F3F7FF] text-[#0B74DE]')}>
              {step.complete ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0 fill-[#0B74DE]/15" />}
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DisputeCasesTable(_props: DisputeCasesTableProps) {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);
  const isDemoWorkspace = activeTenantSlug === 'demo-workspace';

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
      <div className="border border-[#DCE8EE] bg-[#FAFAF7] px-6 py-12 text-center">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-[#0B74DE]" />
        <p className="mt-3 font-lora text-[20px] font-normal tracking-tight text-[#182026]">Loading filed cases.</p>
        <p className="mt-2 text-[12px] leading-5 text-[#66737F]">Margin is refreshing the current Amazon filing record.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#F1C9C5] bg-[#FFF8F7] px-6 py-10 text-center">
        <AlertCircle className="mx-auto h-4 w-4 text-[#B42318]" />
        <p className="mt-3 font-lora text-[20px] font-normal tracking-tight text-[#182026]">Filed cases could not be loaded.</p>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#66737F]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border border-[#DCE8EE] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(24,32,38,0.03)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Filed case record</div>
          <h2 className="mt-2 font-lora text-[24px] font-normal tracking-tight text-[#182026]">Track what Amazon has received.</h2>
          <p className="mt-2 text-[12px] leading-5 text-[#66737F]">
            Each submitted case keeps filing status, evidence posture, payment verification, and the next controlled action together.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {source === 'legacy' ? (
            <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] text-[10px] font-medium tracking-tight text-[#66737F]">
              Limited case details
            </Badge>
          ) : null}
          {activeTenantSlug && (
            <Button asChild className="h-9 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-3 text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
              <Link to="/dispute-cases">
                Open full filing queue
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-[#DCE8EE] bg-[#FAFAF7] px-6 py-12 text-center">
          <p className="font-lora text-[20px] font-normal tracking-tight text-[#182026]">No filed cases are in this view.</p>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-5 text-[#66737F]">Submitted recovery cases will appear here as Margin receives and reconciles Amazon updates.</p>
        </div>
      ) : (
        <>
        {isDemoWorkspace ? <ActiveCaseOverview /> : null}
        <div className="overflow-hidden border border-[#DCE8EE] bg-white">
          <div className="hidden border-b border-[#E7EEF2] bg-[#F7FAFC] px-5 py-3 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.9fr)_minmax(0,0.8fr)] lg:gap-6">
            <span className="text-[10px] font-medium tracking-tight text-[#66737F]">Filed recovery</span>
            <span className="text-[10px] font-medium tracking-tight text-[#66737F]">Financial record</span>
            <span className="text-[10px] font-medium tracking-tight text-[#66737F]">Evidence and next action</span>
          </div>
          <div className="divide-y divide-[#E7EEF2]">
            {rows.map((row, index) => {
              const isLegacyRow = source === 'legacy';
              const demoActiveRow = isDemoWorkspace && index === 0;
              const proofStatus = getProofStatus(row);
              const missingRequirements = getMissingRequirements(row);
              const manualReviewReason = getManualReviewReason(row);
              const payoutProofStatus = getPayoutProofStatus(row);
              const quarantineReason = getQuarantineReason(row);
              const recordId = row.linked_dispute_case_id || row.dispute_case_id;
              const filingStatusLabel = demoActiveRow ? 'Awaiting Amazon response' : isLegacyRow ? 'Not available' : (row.filing_status || 'Not available');
              const evidenceStateLabel = isLegacyRow ? 'Not available' : (row.evidence_state || 'Not available');
              const proofStatusLabel = isLegacyRow ? 'Not available' : (proofStatus ? formatProofStatus(proofStatus) : null);
              const payoutProofLabel = isLegacyRow ? 'Not available' : (payoutProofStatus && payoutProofStatus !== 'not_applicable' ? formatPayoutProofStatus(payoutProofStatus) : null);
              const nextActionLabel = demoActiveRow ? 'Margin will monitor and follow up' : isLegacyRow ? 'Not available' : (row.next_action || 'Not available');
              const approvedLabel = isLegacyRow ? 'Not available' : formatMoney(row.approved_amount, row.currency);
              const recoveredLabel = isLegacyRow ? 'Not available' : formatMoney(row.actual_payout_amount, row.currency);
              const matchedDocsLabel = isLegacyRow
                ? 'Not available'
                : row.matched_document_count > 0
                  ? `${row.matched_document_count} linked document${row.matched_document_count === 1 ? '' : 's'}`
                  : 'No linked documents';

              return (
                <div key={row.dispute_case_id} className="px-5 py-5 transition-colors hover:bg-[#F7FAFC]">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.9fr)_minmax(0,0.8fr)] lg:gap-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/recoveries/${recordId}`} className="text-[13px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#0968C8]">
                          {row.case_number || row.dispute_case_id}
                        </Link>
                        <Badge variant="outline" className={cn('border px-2 py-0.5 text-[10px] font-medium tracking-tight', badgeClass(demoActiveRow ? 'pending' : row.status))}>{demoActiveRow ? 'In progress' : row.status || 'Not available'}</Badge>
                        <Badge variant="outline" className={cn('border px-2 py-0.5 text-[10px] font-medium tracking-tight', badgeClass(filingStatusLabel))}>{filingStatusLabel}</Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-[11px] leading-5 text-[#66737F]">
                        <p><span className="font-medium text-[#4D5B66]">Next action:</span> {nextActionLabel}</p>
                        {!isLegacyRow && missingRequirements.length ? <p><span className="font-medium text-[#4D5B66]">Still needed:</span> {formatRequirementList(missingRequirements, 2)}</p> : null}
                        {!isLegacyRow && manualReviewReason ? <p><span className="font-medium text-[#4D5B66]">Review note:</span> {formatDisputeReason(manualReviewReason)}</p> : null}
                        {!isLegacyRow && quarantineReason ? <p><span className="font-medium text-[#4D5B66]">Filing note:</span> {quarantineReason}</p> : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-y border-[#E7EEF2] py-4 lg:border-y-0 lg:py-0">
                      <div>
                        <div className="text-[10px] font-medium tracking-tight text-[#8A99A5]">Requested</div>
                        <div className="mt-1 text-[12px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(row.requested_amount, row.currency)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium tracking-tight text-[#8A99A5]">Approved</div>
                        <div className="mt-1 text-[12px] font-semibold tabular-nums tracking-tight text-[#182026]">{approvedLabel}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-medium tracking-tight text-[#8A99A5]">Recovered</div>
                        <div className="mt-1 text-[12px] font-semibold tabular-nums tracking-tight text-[#182026]">{recoveredLabel}</div>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col items-start gap-3 lg:items-end">
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Badge variant="outline" className={cn('border px-2 py-0.5 text-[10px] font-medium tracking-tight', badgeClass(evidenceStateLabel))}>{evidenceStateLabel}</Badge>
                        {proofStatusLabel ? <Badge variant="outline" className={cn('border px-2 py-0.5 text-[10px] font-medium tracking-tight', isLegacyRow ? badgeClass('Not available') : lightProofStatusTone(proofStatus))}>Proof: {proofStatusLabel}</Badge> : null}
                        {payoutProofLabel ? <Badge variant="outline" className={cn('border px-2 py-0.5 text-[10px] font-medium tracking-tight', isLegacyRow ? badgeClass('Not available') : lightPayoutProofTone(payoutProofStatus))}>Payout: {payoutProofLabel}</Badge> : null}
                      </div>
                      <p className="text-[11px] text-[#66737F] lg:text-right">{matchedDocsLabel}</p>
                      <Link to={`/recoveries/${recordId}`} className="inline-flex h-8 items-center rounded-md border border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] transition-colors hover:border-[#BFD8F6] hover:bg-[#F3F7FF] hover:text-[#0B74DE]">
                        Open recovery record
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default DisputeCasesTable;
