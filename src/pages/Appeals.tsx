import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, ArrowUpRight, RefreshCw, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { normalizeTenantSlug } from '@/lib/routes';
import { cn } from '@/lib/utils';

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type AppealMode = 'all' | 'denied' | 'underpaid' | 'ready' | 'needs_rebuild';
type AppealTone = 'ready' | 'strengthen' | 'blocked';

type AppealCandidate = QueueRow & {
  appealGap: number;
  appealState: 'denied' | 'underpaid';
  appealReasonText: string;
  policyAngle: string;
  strengthScore: number;
  strengthTone: AppealTone;
  strengthLabel: string;
  nextStep: string;
};

type AppealProgressSnapshot = {
  label: 'Detected' | 'Evidence' | 'Filed' | 'Amazon response';
  toneClass: string;
};

const PAGE_SIZE = 10;

const money = (value: number | null | undefined, currency = 'USD') =>
  value == null || Number.isNaN(value)
    ? 'Not available'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const label = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Not available';

const amount = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

const hasFiledTruth = (row: QueueRow) =>
  row.has_filing_truth === true ||
  row.submission_proof?.proof_present === true ||
  Boolean(row.amazon_case_id || row.submission_proof?.amazon_case_id || row.submission_proof?.external_reference || row.submission_proof?.proof_reference);

const hasApprovalTruth = (row: QueueRow) =>
  row.has_approval_truth === true && hasFiledTruth(row);

const hasRejectionTruth = (row: QueueRow) =>
  row.has_rejection_truth === true && hasFiledTruth(row);

const hasAmazonResponseTruth = (row: QueueRow) =>
  (row.has_amazon_response_truth === true && hasFiledTruth(row)) ||
  hasApprovalTruth(row) ||
  hasRejectionTruth(row);

const isDenied = (status: string | null | undefined) =>
  ['rejected', 'denied', 'lost'].includes(String(status || '').trim().toLowerCase());

const lowballGap = (row: QueueRow) => {
  if (!hasApprovalTruth(row)) return 0;
  const requested = amount(row.requested_amount);
  const approved = amount(row.approved_amount);
  if (requested == null || approved == null || approved >= requested) return 0;
  return requested - approved;
};

const appealGap = (row: QueueRow) =>
  lowballGap(row) ||
  amount(row.requested_amount) ||
  (hasApprovalTruth(row) ? amount(row.approved_amount) : null) ||
  amount(row.expected_payout_amount) ||
  0;

const appealState = (row: QueueRow): AppealCandidate['appealState'] | null => {
  if (lowballGap(row) > 0) return 'underpaid';
  if (hasRejectionTruth(row) && isDenied(row.status)) return 'denied';
  if (hasRejectionTruth(row) && (row.rejection_reason || row.rejection_category)) return 'denied';
  return null;
};

const appealReason = (row: QueueRow, state: AppealCandidate['appealState']) => {
  if (state === 'underpaid') {
    return 'Amazon approval is recorded below the requested claim value.';
  }
  if (row.rejection_reason) return row.rejection_reason;
  if (row.rejection_category) return label(row.rejection_category);
  return 'Amazon rejection is recorded for this submitted case, but no detailed response text is stored yet.';
};

const policyAngle = (row: QueueRow, state: AppealCandidate['appealState']) => {
  const reason = `${row.rejection_category || ''} ${row.rejection_reason || ''}`.toLowerCase();
  if (state === 'underpaid') {
    return 'Compare the recorded Amazon approval against the requested value, then verify invoice-backed unit cost before asking for correction.';
  }
  if (reason.includes('proof') || reason.includes('insufficient')) {
    return 'Add the exact missing proof Amazon asked for before any retry is treated as safe.';
  }
  if (reason.includes('value') || reason.includes('valuation')) {
    return 'Verify the documented cost basis and only challenge the valuation if the invoice trail supports it.';
  }
  if (reason.includes('duplicate') || reason.includes('already reimbursed')) {
    return 'Check case history and payout truth before challenging a duplicate or already-paid response.';
  }
  return 'Review the recorded Amazon response against the evidence trail before deciding whether retry is supportable.';
};

const assess = (row: QueueRow) => {
  let score = 35;
  const docs = Number(row.matched_document_count || 0);
  const proof = String(row.proof_status || '').toLowerCase();
  const missing = Array.isArray(row.missing_requirements) ? row.missing_requirements.length : 0;

  if (docs >= 3) score += 30;
  else if (docs >= 1) score += 18;
  if (proof === 'filing_ready') score += 20;
  else if (proof === 'manual_review') score += 10;
  if (row.rejection_reason || row.rejection_category) score += 10;
  if (!missing) score += 10;
  if (lowballGap(row) > 0) score += 8;
  score = Math.min(score, 96);

  if (score >= 80) {
    return { score, tone: 'ready' as AppealTone, label: 'Ready to review', nextStep: 'Review the Amazon response and confirm the support packet before retry.' };
  }
  if (docs > 0) {
    return { score, tone: 'strengthen' as AppealTone, label: 'Needs stronger proof', nextStep: 'Add the missing proof source before moving this back to filing.' };
  }
  return { score, tone: 'blocked' as AppealTone, label: 'Not retry-ready', nextStep: 'Do not retry yet. Link the required source records first.' };
};

const toneClass = (tone: AppealTone) =>
  tone === 'ready'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
    : tone === 'strengthen'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
      : 'border-rose-500/25 bg-rose-500/10 text-rose-200';

const pushbackToneClass = (state: AppealCandidate['appealState']) =>
  state === 'underpaid'
    ? 'border-blue-500/25 bg-blue-500/10 text-blue-100'
    : 'border-rose-500/25 bg-rose-500/10 text-rose-200';

const truncate = (value: string, limit: number) =>
  value.length <= limit ? value : `${value.slice(0, limit).trimEnd()}...`;

const cleanAmazonResponse = (value: string | null | undefined) => {
  if (!value) return '';

  let text = String(value)
    .replace(/\r?\n+/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cutMarkers = [
    'MORE WAYS TO GET HELP',
    'Visit our Seller Forums',
    'Browse all Seller Help topics',
    'Please note: this e-mail was sent from',
    'Click here for yes:',
    'Click here for no:',
  ];

  const cutoff = cutMarkers.reduce((earliest, marker) => {
    const index = text.toLowerCase().indexOf(marker.toLowerCase());
    return index >= 0 && index < earliest ? index : earliest;
  }, text.length);

  text = text.slice(0, cutoff).trim();
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
};

const proofNeedFor = (rawValue: string, row: AppealCandidate) => {
  const normalized = normalize(rawValue);
  const caseContext = normalize(`${row.case_type || ''} ${row.anomaly_type || ''} ${row.rejection_category || ''}`);
  const sourceRecord =
    caseContext.includes('inbound') || caseContext.includes('shipment') || caseContext.includes('warehouse') || caseContext.includes('transfer')
      ? 'shipment or receiving record tied to the units'
      : caseContext.includes('return') || caseContext.includes('refund')
        ? 'return, refund, or customer-order trail tied to the unit'
        : caseContext.includes('fee')
          ? 'fee event or settlement ledger entry tied to the charge'
          : 'invoice, inventory, shipment, return, or settlement record tied to this case';

  if (normalized === 'proof_snapshot') {
    return {
      title: 'Evidence decision snapshot',
      detail: 'Missing policy lane, quantity/value math, deadline check, and matched source links for this case.'
    };
  }

  if (normalized === 'supporting_document' || normalized === 'missing_evidence_links') {
    return {
      title: 'Linked source document',
      detail: `Link a ${sourceRecord}.`
    };
  }

  if (normalized === 'unit_cost_proof' || normalized === 'missing_unit_cost_proof') {
    return {
      title: 'Invoice unit-cost proof',
      detail: 'Link an invoice or supplier document showing unit cost for the SKU/FNSKU/ASIN.'
    };
  }

  if (normalized.startsWith('document_type:')) {
    const documentType = label(normalized.split(':')[1]);
    return {
      title: `Required document: ${documentType}`,
      detail: `Amazon response review needs a linked ${documentType.toLowerCase()} document before retry.`
    };
  }

  if (normalized.startsWith('document_family:')) {
    const family = normalized
      .split(':')[1]
      ?.split('|')
      .map(label)
      .join(' or ');
    return {
      title: family ? `Required document family: ${family}` : 'Required document family',
      detail: family ? `Link one of these document types: ${family}.` : 'Link the required document family before retry.'
    };
  }

  if (normalized.includes('quantity')) {
    return {
      title: 'Quantity movement proof',
      detail: 'Link records showing units sent, received, refunded, adjusted, or reimbursed.'
    };
  }

  if (normalized.includes('identifier')) {
    return {
      title: 'Verified case identifiers',
      detail: 'Add the SKU/FNSKU/ASIN, order ID, shipment ID, or Amazon case reference needed to support this case.'
    };
  }

  return {
    title: label(rawValue),
    detail: `Resolve this recorded blocker before retry: ${label(rawValue)}.`
  };
};

const proofNeeds = (row: AppealCandidate) =>
  (Array.isArray(row.missing_requirements) ? row.missing_requirements : [])
    .filter((value): value is string => Boolean(value))
    .map((value) => proofNeedFor(value, row));

const responsePreview = (row: AppealCandidate) => {
  const cleaned = cleanAmazonResponse(row.rejection_reason);
  const source = cleaned || row.appealReasonText;
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
  return truncate((sentences.slice(0, 2).join(' ') || source).trim(), 220);
};

const appealProgressTone = (label: AppealProgressSnapshot['label']) => {
  switch (label) {
    case 'Amazon response':
      return 'text-blue-300';
    case 'Filed':
      return 'text-blue-100';
    case 'Evidence':
      return 'text-amber-200';
    default:
      return 'text-white/68';
  }
};

const getAppealProgressSnapshot = (row: AppealCandidate): AppealProgressSnapshot => {
  if (hasAmazonResponseTruth(row)) {
    return { label: 'Amazon response', toneClass: appealProgressTone('Amazon response') };
  }
  if (hasFiledTruth(row)) {
    return { label: 'Filed', toneClass: appealProgressTone('Filed') };
  }
  if (Number(row.matched_document_count || 0) > 0) {
    return { label: 'Evidence', toneClass: appealProgressTone('Evidence') };
  }
  return { label: 'Detected', toneClass: appealProgressTone('Detected') };
};

const reopenStateSummary = (row: AppealCandidate) =>
  row.strengthTone === 'ready'
    ? 'Enough support is linked to review this response without another evidence pass.'
    : row.strengthTone === 'strengthen'
      ? 'The case has a starting proof trail, but a stronger source should be added first.'
      : 'Required source records are missing, so retry should stay blocked.';

const missingProofSummary = (row: AppealCandidate) => {
  const missing = proofNeeds(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return truncate(missing.slice(0, 2).map((item) => item.title).join(' + ') + (missing.length > 2 ? ` +${missing.length - 2} more` : ''), 90);
  }

  if (documentCount === 0) return 'No linked documents yet';
  if (documentCount === 1) return 'No missing proof recorded';
  return 'No missing proof recorded';
};

const evidenceRebuildSummary = (row: AppealCandidate) => {
  const missing = proofNeeds(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return truncate(missing.slice(0, 2).map((item) => item.detail).join(' '), 160);
  }

  if (row.strengthTone === 'ready') return `${documentCount} linked source document${documentCount === 1 ? '' : 's'}; verify they match the Amazon response before retry.`;
  if (documentCount === 0) return 'Source records need to be reconnected first.';
  return 'One stronger proof source should be added before retry.';
};

const twoLineClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

const tableHeaderClass = 'px-6 py-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28';
const tableMetaClass = 'text-[11px] font-sans leading-5 text-white/46';
const tableSupportClass = 'text-[10px] font-sans font-medium uppercase tracking-tight text-white/36';
const tablePrimaryValueClass = 'text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/84';
const tableSecondaryValueClass = 'text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/72';
const detailCardClass = 'rounded-2xl border border-white/8 bg-[#101010]';
const detailInsetCardClass = 'rounded-xl border border-white/[0.06] bg-black/30';

export default function Appeals() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady } = useTenant();
  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<AppealMode>('all');
  const [rejectionCategory, setRejectionCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, mode, rejectionCategory]);

  useEffect(() => {
    if (!isReady) return;
    if (!activeTenantSlug) {
      setRows([]);
      setLoading(false);
      setError('A tenant workspace is required before the Appeals page can load.');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const response = await api.getDisputeCaseQueue({ sort_by: 'updated_at', sort_order: 'desc', page: 1, page_size: 200 }, activeTenantSlug);
      if (cancelled) return;
      if (response.ok && response.data) {
        setRows(response.data.rows || []);
        setError(null);
      } else {
        setRows([]);
        setError(response.error || 'Failed to load appeal candidates.');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTenantSlug, isReady, refreshKey]);

  const candidates = useMemo(() => {
    return rows.flatMap((row) => {
      const state = appealState(row);
      if (!state) return [];
      const appeal = assess(row);
      return [{
        ...row,
        appealGap: appealGap(row),
        appealState: state,
        appealReasonText: appealReason(row, state),
        policyAngle: policyAngle(row, state),
        strengthScore: appeal.score,
        strengthTone: appeal.tone,
        strengthLabel: appeal.label,
        nextStep: appeal.nextStep
      }];
    });
  }, [rows]);

  const rejectionCategories = useMemo(() => {
    return Array.from(new Set(candidates.map((row) => row.rejection_category).filter((value): value is string => Boolean(value)))).sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return candidates.filter((row) => {
      if (mode === 'denied' && row.appealState !== 'denied') return false;
      if (mode === 'underpaid' && row.appealState !== 'underpaid') return false;
      if (mode === 'ready' && row.strengthTone !== 'ready') return false;
      if (mode === 'needs_rebuild' && row.strengthTone === 'ready') return false;
      if (rejectionCategory !== 'all' && row.rejection_category !== rejectionCategory) return false;
      if (!term) return true;

      const haystack = [
        row.case_number,
        row.claim_number,
        row.amazon_case_id,
        row.store_name,
        row.sku,
        row.asin,
        row.order_id,
        row.rejection_reason,
        row.rejection_category,
        row.appealReasonText
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(term);
    });
  }, [candidates, mode, rejectionCategory, search]);

  const summary = useMemo(() => {
    const appealValue = candidates.reduce((sum, row) => sum + row.appealGap, 0);
    const deniedCount = candidates.filter((row) => row.appealState === 'denied').length;
    const underpaidCount = candidates.filter((row) => row.appealState === 'underpaid').length;
    const readyCount = candidates.filter((row) => row.strengthTone === 'ready').length;
    const lastUpdatedAt = candidates.map((row) => row.updated_at || row.created_at).filter((value): value is string => Boolean(value)).sort().reverse()[0] || null;
    return { appealValue, deniedCount, underpaidCount, readyCount, lastUpdatedAt };
  }, [candidates]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRow = useMemo(
    () => candidates.find((row) => row.dispute_case_id === selectedCaseId) || null,
    [candidates, selectedCaseId]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (selectedCaseId && !selectedRow) {
      setSelectedCaseId(null);
    }
  }, [selectedCaseId, selectedRow]);

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Appeals" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pb-20 pt-10">
            <Card className="rounded-2xl border-white/5 bg-[#0c0c0c] text-white">
              <CardContent className="space-y-3 p-8">
                <h1 className="text-xl font-sans font-bold tracking-tight text-white">Appeals unavailable</h1>
                <p className="text-sm font-sans text-white/50">Open this page from a tenant workspace before loading verified Amazon response reviews.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Appeals" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="relative z-10 container mx-auto space-y-6 px-8 pb-20 pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Appeals workspace</div>
              <h1 className="max-w-3xl text-3xl font-sans font-bold tracking-tight text-white">Reimbursement appeals and Amazon responses</h1>
              <p className="max-w-3xl text-[14px] font-sans leading-6 text-white/56">
                When a filed case has a recorded Amazon response, Margin shows the response, the support gaps, and whether a retry is safe.
              </p>
              <p className="text-[11px] font-sans font-medium tracking-tight text-white/32">
                Internal estimates do not appear here as Amazon approvals or denials.
              </p>
            </div>

            <div className="flex items-center gap-3 lg:pt-1">
              {summary.lastUpdatedAt ? (
                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">
                  Updated {formatDistanceToNow(new Date(summary.lastUpdatedAt), { addSuffix: true })}
                </div>
              ) : null}
              <Button
                onClick={() => setRefreshKey((current) => current + 1)}
                className="h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/56 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border-white/8 bg-[#0c0c0c] text-white">
            <CardContent className="p-0">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Verified response queue</div>
                    <h2 className="mt-2 text-xl font-sans font-bold tracking-tight text-white">Responses that need review</h2>
                    <p className="mt-2 max-w-3xl text-[12px] font-sans leading-5 text-white/42">
                      Margin only shows filed cases here when a recorded Amazon response creates a denial or approved-value gap.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search case, SKU, order, or rejection reason"
                          className="h-10 min-w-[280px] rounded-lg border-white/10 bg-white/5 pl-9 text-sm text-white placeholder:text-white/15"
                        />
                      </div>

                      <Select value={mode} onValueChange={(value) => setMode(value as AppealMode)}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-white/10 bg-white/5 text-white md:w-[180px]">
                          <SelectValue placeholder="Response state" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black text-white">
                          <SelectItem value="all">All response cases</SelectItem>
                          <SelectItem value="denied">Denied responses</SelectItem>
                          <SelectItem value="underpaid">Approved-value gaps</SelectItem>
                          <SelectItem value="ready">Ready to review</SelectItem>
                          <SelectItem value="needs_rebuild">Needs proof first</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={rejectionCategory} onValueChange={setRejectionCategory}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-white/10 bg-white/5 text-white md:w-[190px]">
                          <SelectValue placeholder="Reason bucket" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black text-white">
                          <SelectItem value="all">All reason buckets</SelectItem>
                          {rejectionCategories.map((category) => (
                            <SelectItem key={category} value={category}>{label(category)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">
                      {filtered.length} case{filtered.length === 1 ? '' : 's'} visible
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-white/25" />
                  <p className="text-sm font-sans font-bold text-white/60">Loading verified response reviews...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <AlertCircle className="h-5 w-5 text-white/35" />
                  <p className="text-sm font-sans font-bold text-white/70">Failed to load Appeals</p>
                  <p className="max-w-xl text-xs font-sans text-white/40">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <p className="text-sm font-sans font-bold text-white/70">
                    {candidates.length === 0 ? 'No verified Amazon responses need review yet.' : 'No response cases match the current filters.'}
                  </p>
                  <p className="max-w-xl text-xs font-sans text-white/40">
                    {candidates.length === 0
                      ? 'A case only appears here after Margin has filing truth and a recorded Amazon denial or approved-value gap.'
                      : 'Try widening the filters to bring back verified responses that still need review.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1420px]">
                      <colgroup>
                        <col style={{ width: '23%' }} />
                        <col style={{ width: '19%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '13%' }} />
                      </colgroup>
                      <thead className="border-b border-white/8 bg-white/[0.02]">
                        <tr className="text-left">
                          {['Case', 'Verified response', 'Review state', 'Required proof', 'Review basis', 'Next step'].map((header) => (
                            <th key={header} className={tableHeaderClass}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((row) => {
                          const progress = getAppealProgressSnapshot(row);
                          const approvedAmount = hasApprovalTruth(row) ? amount(row.approved_amount) : null;
                          return (
                          <tr key={row.dispute_case_id} className="border-b border-white/[0.06] align-top transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-5">
                              <div className="min-w-[250px] space-y-3">
                                <div className="space-y-1.5">
                                  <div className="text-[15px] font-sans font-bold tracking-tight text-white">
                                    {row.case_number || row.claim_number || row.amazon_case_id || 'Response case'}
                                  </div>
                                  <div className={tableMetaClass}>{row.store_name || 'Store unavailable'}</div>
                                  <div className={tableSupportClass}>
                                    {[row.order_id, row.sku, row.asin].filter(Boolean).join(' / ') || 'Identifiers unavailable'}
                                  </div>
                                  <div className="text-[10px] font-sans tracking-tight text-white/42">
                                    <span className="uppercase text-white/26">Case progress:</span>{' '}
                                    <span className={cn('font-semibold', progress.toneClass)}>{progress.label}</span>
                                  </div>
                                </div>

                                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Amount at stake</div>
                                  <div className="min-w-0 space-y-1 text-[12px] font-sans text-white/72">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/34">Requested</span>
                                      <span className="text-right text-white/84">{money(row.requested_amount, row.currency)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/34">Amazon approval</span>
                                      <span className="text-right text-white/84">{money(approvedAmount, row.currency)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-white/34">Review gap</span>
                                      <span className={cn('text-right', row.appealGap > 0 ? 'text-white' : 'text-white/58')}>
                                        {money(row.appealGap, row.currency)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-sans leading-5 text-white/40">
                                    {hasApprovalTruth(row)
                                      ? 'Approval value is shown only because filing and approval truth are recorded.'
                                      : 'No Amazon approval value is recorded for this response.'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="min-w-[270px] space-y-3">
                                <Badge className={cn('w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', pushbackToneClass(row.appealState))}>
                                  {row.appealState === 'underpaid' ? 'Approved-value gap' : 'Denied response'}
                                </Badge>
                                <div className={tablePrimaryValueClass} style={twoLineClampStyle}>
                                  {responsePreview(row)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  {row.rejection_category ? <div className={tableSupportClass}>Reason bucket: {label(row.rejection_category)}</div> : null}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCaseId(row.dispute_case_id)}
                                    className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/72 transition-colors hover:text-white"
                                  >
                                    View source detail
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="min-w-[210px] space-y-3">
                                <Badge className={cn('w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', toneClass(row.strengthTone))}>
                                  {row.strengthLabel}
                                </Badge>
                                <div className={tableSecondaryValueClass}>{reopenStateSummary(row)}</div>
                                <div className={tableMetaClass}>
                                  {row.strengthTone === 'ready'
                                    ? 'Support is strong enough to review without another evidence pass.'
                                    : row.strengthTone === 'strengthen'
                                      ? 'The support pack is close, but one stronger source should be added first.'
                                      : 'This case should not be retried until the required proof is linked.'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="min-w-[200px] space-y-2.5">
                                <div className={tablePrimaryValueClass}>{missingProofSummary(row)}</div>
                                <div className={tableMetaClass}>{evidenceRebuildSummary(row)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="min-w-[220px] space-y-2.5">
                                <div className={tablePrimaryValueClass} style={twoLineClampStyle}>
                                  {row.policyAngle}
                                </div>
                                <div className={tableSupportClass}>
                                  {row.updated_at ? `Updated ${formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}` : 'Update time unavailable'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex min-w-[190px] flex-col items-start gap-3">
                                <div className={tablePrimaryValueClass}>{row.nextStep}</div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCaseId(row.dispute_case_id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white"
                                >
                                  Review response
                                  <ArrowUpRight className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">Page {page} of {totalPages}</div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="h-9 rounded-lg border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="h-9 rounded-lg border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Sheet open={Boolean(selectedRow)} onOpenChange={(open) => { if (!open) setSelectedCaseId(null); }}>
            <SheetContent side="right" className="w-full border-white/10 bg-[#0c0c0c] p-0 text-white sm:max-w-2xl">
              {selectedRow ? (
                <div className="flex h-full flex-col">
                  <SheetHeader className="border-b border-white/8 px-6 py-6 pr-14">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">Response detail</div>
                    <SheetTitle className="mt-2 text-2xl font-sans font-bold tracking-tight text-white">
                      {selectedRow.case_number || selectedRow.claim_number || selectedRow.amazon_case_id || 'Response case'}
                    </SheetTitle>
                    <SheetDescription className="text-[12px] font-sans leading-6 text-white/46">
                      {selectedRow.store_name || 'Store unavailable'}
                      {selectedRow.updated_at ? ` - Updated ${formatDistanceToNow(new Date(selectedRow.updated_at), { addSuffix: true })}` : ''}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    <div className={cn('overflow-hidden', detailCardClass)}>
                      <div className="grid gap-3 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Review value</div>
                        <div>
                          <div
                            className={cn(
                              'text-[28px] font-sans font-bold tracking-tight',
                              selectedRow.appealGap > 0 ? 'text-white' : 'text-white/58'
                            )}
                          >
                            {money(selectedRow.appealGap, selectedRow.currency)}
                          </div>
                          <div className="mt-2 space-y-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/38">
                            {amount(selectedRow.requested_amount) != null ? <div>Claimed {money(selectedRow.requested_amount, selectedRow.currency)}</div> : null}
                            {hasApprovalTruth(selectedRow) && amount(selectedRow.approved_amount) != null ? <div>Amazon approval {money(selectedRow.approved_amount, selectedRow.currency)}</div> : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Review state</div>
                        <div>
                          <Badge className={cn('w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', toneClass(selectedRow.strengthTone))}>
                            {selectedRow.strengthLabel}
                          </Badge>
                          <div className="mt-3 text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/84">
                            {reopenStateSummary(selectedRow)}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-6 text-white/46">
                            {selectedRow.strengthTone === 'ready'
                              ? 'This response can be reviewed from a stronger proof position now.'
                              : selectedRow.strengthTone === 'strengthen'
                                ? 'This response is close, but one stronger proof source should be added first.'
                                : 'This response still needs required proof before it should move forward.'}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Required proof</div>
                        <div>
                          <div className="text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/84">
                            {missingProofSummary(selectedRow)}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-6 text-white/46">
                            {evidenceRebuildSummary(selectedRow)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">What happens next</div>
                        <div>
                          <div className="text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/84">
                            {selectedRow.nextStep}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-6 text-white/46">
                            {selectedRow.policyAngle}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={cn('p-4', detailCardClass)}>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Verified Amazon response</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={cn('w-fit whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', pushbackToneClass(selectedRow.appealState))}>
                          {selectedRow.appealState === 'underpaid' ? 'Approved-value gap' : 'Denied response'}
                        </Badge>
                        {selectedRow.rejection_category ? (
                          <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/36">
                            Reason bucket: {label(selectedRow.rejection_category)}
                          </div>
                        ) : null}
                      </div>
                      <div className={cn('mt-4 p-4 text-[12px] font-sans leading-7 text-white/76', detailInsetCardClass)}>
                        {cleanAmazonResponse(selectedRow.rejection_reason) || selectedRow.appealReasonText}
                      </div>
                    </div>

                    <div className={cn('p-4', detailCardClass)}>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Review plan</div>
                      <div className="mt-3 text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/84">
                        {selectedRow.policyAngle}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className={cn('p-4', detailInsetCardClass)}>
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Source records</div>
                          <div className="mt-2 text-[12px] font-sans leading-6 text-white/72">
                            {Math.max(Number(selectedRow.matched_document_count || 0), 0)} linked document{Number(selectedRow.matched_document_count || 0) === 1 ? '' : 's'}
                          </div>
                        </div>
                        <div className={cn('p-4', detailInsetCardClass)}>
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/24">Missing requirements</div>
                          <div className="mt-2 text-[12px] font-sans leading-6 text-white/72">
                            {proofNeeds(selectedRow).length > 0
                              ? proofNeeds(selectedRow).map((item) => `${item.title}: ${item.detail}`).join(' / ')
                              : 'No explicit missing requirements were returned for this case.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/8 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/app/${activeTenantSlug}/recoveries/${encodeURIComponent(selectedRow.dispute_case_id)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/76 transition-colors hover:bg-white/[0.08] hover:text-white"
                      >
                        Open case
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                      <Link
                        to={`/app/${activeTenantSlug}/dispute-cases`}
                        className="inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/52 transition-colors hover:border-white/15 hover:text-white/76"
                      >
                        Open filing queue
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </PageLayout>
  );
}
