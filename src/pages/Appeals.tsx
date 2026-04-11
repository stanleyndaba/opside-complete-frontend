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

const PAGE_SIZE = 10;

const money = (value: number | null | undefined, currency = 'USD') =>
  value == null || Number.isNaN(value)
    ? 'Not available'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const label = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Not available';

const amount = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const isDenied = (status: string | null | undefined) =>
  ['rejected', 'denied', 'lost'].includes(String(status || '').trim().toLowerCase());

const lowballGap = (row: QueueRow) => {
  const requested = amount(row.requested_amount);
  const approved = amount(row.approved_amount);
  if (requested == null || approved == null || approved >= requested) return 0;
  return requested - approved;
};

const appealGap = (row: QueueRow) =>
  lowballGap(row) ||
  amount(row.requested_amount) ||
  amount(row.approved_amount) ||
  amount(row.expected_payout_amount) ||
  0;

const appealState = (row: QueueRow): AppealCandidate['appealState'] | null => {
  if (lowballGap(row) > 0) return 'underpaid';
  if (isDenied(row.status)) return 'denied';
  return null;
};

const appealReason = (row: QueueRow, state: AppealCandidate['appealState']) => {
  if (row.rejection_reason) return row.rejection_reason;
  if (row.rejection_category) return label(row.rejection_category);
  return state === 'underpaid'
    ? 'Amazon approved less than the documented claim value.'
    : 'Amazon pushed this claim back before payout.';
};

const policyAngle = (row: QueueRow, state: AppealCandidate['appealState']) => {
  const reason = `${row.rejection_category || ''} ${row.rejection_reason || ''}`.toLowerCase();
  if (state === 'underpaid') {
    return 'Challenge Amazon’s valuation with invoice-backed unit cost and a tighter reimbursement-value timeline.';
  }
  if (reason.includes('proof') || reason.includes('insufficient')) {
    return 'Re-match invoices, receiving records, and linked files so the next appeal lands with stronger proof.';
  }
  if (reason.includes('value') || reason.includes('valuation')) {
    return 'Anchor the appeal on documented cost and ask Amazon to correct the valuation basis it used.';
  }
  if (reason.includes('duplicate') || reason.includes('already reimbursed')) {
    return 'Show case history and payout truth to overturn the duplicate or already-paid response.';
  }
  return 'Rebuild the case with clearer chronology, stronger supporting files, and a tighter reimbursement-policy argument.';
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
    return { score, tone: 'ready' as AppealTone, label: 'Ready to re-open', nextStep: 'Generate the appeal brief and resubmit.' };
  }
  if (docs > 0) {
    return { score, tone: 'strengthen' as AppealTone, label: 'Needs one stronger proof', nextStep: 'Pull a stronger invoice, shipment, or payout reference first.' };
  }
  return { score, tone: 'blocked' as AppealTone, label: 'Evidence rebuild needed', nextStep: 'Reconnect the source records and rebuild the support packet.' };
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

const missingProofItems = (row: AppealCandidate) =>
  Array.isArray(row.missing_requirements)
    ? row.missing_requirements.filter((value): value is string => Boolean(value)).map((value) => label(value))
    : [];

const responsePreview = (row: AppealCandidate) => {
  const cleaned = cleanAmazonResponse(row.rejection_reason);
  const source = cleaned || row.appealReasonText;
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
  return truncate((sentences.slice(0, 2).join(' ') || source).trim(), 220);
};

const reopenStateSummary = (row: AppealCandidate) =>
  row.strengthTone === 'ready'
    ? 'Enough support is linked to move this case back into the filing queue.'
    : row.strengthTone === 'strengthen'
      ? 'The case has a starting proof trail, but one stronger document should be added first.'
      : 'The support packet needs to be rebuilt before this case should be reopened.';

const missingProofSummary = (row: AppealCandidate) => {
  const missing = missingProofItems(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return truncate(missing.slice(0, 2).join(' + ') + (missing.length > 2 ? ` +${missing.length - 2} more` : ''), 90);
  }

  if (documentCount === 0) return 'No linked documents yet';
  if (documentCount === 1) return '1 linked document';
  return `${documentCount} linked documents`;
};

const evidenceRebuildSummary = (row: AppealCandidate) => {
  const missing = missingProofItems(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return `Still missing ${missing.length === 1 ? missing[0].toLowerCase() : `${missing.length} proof items`}.`;
  }

  if (row.strengthTone === 'ready') return 'Support packet can be rebuilt now.';
  if (documentCount === 0) return 'Source records need to be reconnected first.';
  return 'One stronger proof source should be added before resubmission.';
};

const twoLineClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

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
      setError('A tenant workspace is required before the Retry Filing page can load.');
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
      <PageLayout title="Retry Filing" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pb-20 pt-10">
            <Card className="rounded-2xl border-white/5 bg-[#0c0c0c] text-white">
              <CardContent className="space-y-3 p-8">
                <h1 className="text-xl font-sans font-bold tracking-tight text-white">Retry Filing unavailable</h1>
                <p className="text-sm font-sans text-white/50">Open this page from a tenant workspace before loading denied or underpaid reimbursements.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Retry Filing" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="relative z-10 container mx-auto space-y-6 px-8 pb-20 pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Denied reimbursement recovery</div>
              <h1 className="max-w-3xl text-3xl font-sans font-bold tracking-tight text-white">Retry filing denied reimbursements</h1>
              <p className="max-w-3xl text-[14px] font-sans leading-6 text-white/56">
                When Amazon says no or pays short, Margin rebuilds the case with stronger proof and a tighter reimbursement argument.
              </p>
              <p className="text-[11px] font-sans font-medium tracking-tight text-white/32">
                Only denied or underpaid claims appear here.
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
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Retry queue</div>
                    <h2 className="mt-2 text-xl font-sans font-bold tracking-tight text-white">What Amazon pushed back on</h2>
                    <p className="mt-2 max-w-3xl text-[12px] font-sans leading-5 text-white/42">
                      Margin re-checks the denial reason, rebuilds the evidence, and prepares a stronger resubmission path from here.
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
                          <SelectValue placeholder="Appeal state" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-black text-white">
                          <SelectItem value="all">All appeal cases</SelectItem>
                          <SelectItem value="denied">Denied only</SelectItem>
                          <SelectItem value="underpaid">Underpaid only</SelectItem>
                          <SelectItem value="ready">Ready to re-open</SelectItem>
                          <SelectItem value="needs_rebuild">Needs rebuild</SelectItem>
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
                  <p className="text-sm font-sans font-bold text-white/60">Loading appeal candidates...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <AlertCircle className="h-5 w-5 text-white/35" />
                  <p className="text-sm font-sans font-bold text-white/70">Failed to load Retry Filing</p>
                  <p className="max-w-xl text-xs font-sans text-white/40">{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                  <p className="text-sm font-sans font-bold text-white/70">
                    {candidates.length === 0 ? 'No denied or underpaid reimbursements found yet.' : 'No reopen cases match the current filters.'}
                  </p>
                  <p className="max-w-xl text-xs font-sans text-white/40">
                    {candidates.length === 0
                      ? 'When Amazon denies a claim or pays below the documented value, Margin will bring it here for a stronger second pass.'
                      : 'Try widening the filters to bring back denied or underpaid cases that still need a second pass.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px]">
                      <thead className="border-b border-white/8 bg-white/[0.02]">
                        <tr className="text-left">
                          {['Case', 'Amazon pushback', 'Retry state', 'Missing proof', 'Appeal direction', 'Next move'].map((header) => (
                            <th key={header} className="px-6 py-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((row) => (
                          <tr key={row.dispute_case_id} className="border-b border-white/[0.06] align-top transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-5">
                              <div className="min-w-[190px] space-y-2.5">
                                <div className="text-[15px] font-sans font-bold tracking-tight text-white">
                                  {row.case_number || row.claim_number || row.amazon_case_id || 'Appeal case'}
                                </div>
                                <div className="text-[11px] font-sans text-white/56">{row.store_name || 'Store unavailable'}</div>
                                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/36">
                                  {[row.order_id, row.sku, row.asin].filter(Boolean).join(' / ') || 'Identifiers unavailable'}
                                </div>
                                <div className="space-y-1.5 border-t border-white/[0.06] pt-2">
                                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Recoverable upside</div>
                                  <div className="text-[22px] font-sans font-bold tracking-tight text-white">{money(row.appealGap, row.currency)}</div>
                                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/46">
                                    {[
                                      amount(row.requested_amount) != null ? `Claimed ${money(row.requested_amount, row.currency)}` : null,
                                      amount(row.approved_amount) != null ? `Approved ${money(row.approved_amount, row.currency)}` : null,
                                    ].filter(Boolean).join(' / ') || 'Awaiting payout comparison'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="min-w-[280px] space-y-3">
                                <Badge className={cn('w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', pushbackToneClass(row.appealState))}>
                                  {row.appealState === 'underpaid' ? 'Underpaid' : 'Denied'}
                                </Badge>
                                <div className="text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/74" style={twoLineClampStyle}>
                                  {responsePreview(row)}
                                </div>
                                <div className="flex items-center gap-3">
                                  {row.rejection_category ? <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/42">Reason bucket: {label(row.rejection_category)}</div> : null}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCaseId(row.dispute_case_id)}
                                    className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/70 transition-colors hover:text-white"
                                  >
                                    View full response
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <Badge className={cn('w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', toneClass(row.strengthTone))}>
                                  {row.strengthLabel}
                                </Badge>
                                <div className="max-w-[210px] text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/74">{reopenStateSummary(row)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <div className="text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/78">{missingProofSummary(row)}</div>
                                <div className="max-w-[210px] text-[11px] font-sans leading-6 text-white/58">
                                  {evidenceRebuildSummary(row)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <div className="max-w-[220px] text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/76" style={twoLineClampStyle}>
                                  {row.policyAngle}
                                </div>
                                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/42">
                                  {row.updated_at ? `Updated ${formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}` : 'Update time unavailable'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex min-w-[190px] flex-col items-start gap-3">
                                <div className="max-w-[220px] text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/78">{row.nextStep}</div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCaseId(row.dispute_case_id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/76 transition-colors hover:bg-white/[0.08] hover:text-white"
                                >
                                  Review appeal
                                  <ArrowUpRight className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Appeal detail</div>
                    <SheetTitle className="mt-2 text-2xl font-sans font-bold tracking-tight text-white">
                      {selectedRow.case_number || selectedRow.claim_number || selectedRow.amazon_case_id || 'Appeal case'}
                    </SheetTitle>
                    <SheetDescription className="text-[12px] font-sans leading-6 text-white/58">
                      {selectedRow.store_name || 'Store unavailable'}
                      {selectedRow.updated_at ? ` - Updated ${formatDistanceToNow(new Date(selectedRow.updated_at), { addSuffix: true })}` : ''}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.015]">
                      <div className="grid gap-3 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Recoverable upside</div>
                        <div>
                          <div className="text-[28px] font-sans font-bold tracking-tight text-white">{money(selectedRow.appealGap, selectedRow.currency)}</div>
                          <div className="mt-2 space-y-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/46">
                            {amount(selectedRow.requested_amount) != null ? <div>Claimed {money(selectedRow.requested_amount, selectedRow.currency)}</div> : null}
                            {amount(selectedRow.approved_amount) != null ? <div>Approved {money(selectedRow.approved_amount, selectedRow.currency)}</div> : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Retry state</div>
                        <div>
                          <Badge className={cn('w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', toneClass(selectedRow.strengthTone))}>
                            {selectedRow.strengthLabel}
                          </Badge>
                          <div className="mt-3 text-[12px] font-sans font-semibold leading-6 tracking-tight text-white/76">
                            {reopenStateSummary(selectedRow)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Missing proof</div>
                        <div>
                          <div className="text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/78">
                            {missingProofSummary(selectedRow)}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-6 text-white/58">
                            {evidenceRebuildSummary(selectedRow)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-white/[0.06] px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                        <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">What happens next</div>
                        <div>
                          <div className="text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/78">
                            {selectedRow.nextStep}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-6 text-white/58">
                            {selectedRow.policyAngle}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Amazon pushback</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={cn('w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', pushbackToneClass(selectedRow.appealState))}>
                          {selectedRow.appealState === 'underpaid' ? 'Underpaid' : 'Denied'}
                        </Badge>
                        {selectedRow.rejection_category ? (
                          <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/42">
                            Reason bucket: {label(selectedRow.rejection_category)}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/30 p-4 text-[12px] font-sans leading-7 text-white/78">
                        {cleanAmazonResponse(selectedRow.rejection_reason) || selectedRow.appealReasonText}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Rebuild plan</div>
                      <div className="mt-3 text-[13px] font-sans font-semibold leading-6 tracking-tight text-white/78">
                        {selectedRow.policyAngle}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Source records</div>
                          <div className="mt-2 text-[12px] font-sans leading-6 text-white/74">
                            {Math.max(Number(selectedRow.matched_document_count || 0), 0)} linked document{Number(selectedRow.matched_document_count || 0) === 1 ? '' : 's'}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Missing requirements</div>
                          <div className="mt-2 text-[12px] font-sans leading-6 text-white/74">
                            {missingProofItems(selectedRow).length > 0
                              ? missingProofItems(selectedRow).join(' / ')
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
