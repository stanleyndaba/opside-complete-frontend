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
    ? 'border-white/15 bg-white/[0.08] text-white'
    : tone === 'strengthen'
      ? 'border-white/12 bg-white/[0.04] text-white/82'
      : 'border-white/10 bg-white/[0.03] text-white/62';

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

  useEffect(() => {
    setPage(1);
  }, [search, mode, rejectionCategory]);

  useEffect(() => {
    if (!isReady) return;
    if (!activeTenantSlug) {
      setRows([]);
      setLoading(false);
      setError('A tenant workspace is required before the Reopen Claims page can load.');
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

  const hasAppealData = candidates.length > 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Reopen Claims" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pb-20 pt-10">
            <Card className="rounded-2xl border-white/5 bg-[#0c0c0c] text-white">
              <CardContent className="space-y-3 p-8">
                <h1 className="text-xl font-sans font-bold tracking-tight text-white">Reopen Claims unavailable</h1>
                <p className="text-sm font-sans text-white/50">Open this page from a tenant workspace before loading denied or underpaid reimbursements.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Reopen Claims" midnight>
      <div className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="relative z-10 container mx-auto space-y-6 px-8 pb-20 pt-10">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <Card className="rounded-2xl border-white/8 bg-[#0c0c0c] text-white">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Denied reimbursement recovery</div>
                    <h1 className="max-w-3xl text-3xl font-sans font-bold tracking-tight text-white">Reopen denied reimbursements</h1>
                    <p className="max-w-3xl text-[14px] font-sans leading-6 text-white/56">
                      When Amazon says no or pays short, Margin rebuilds the case with stronger proof and a tighter reimbursement argument.
                    </p>
                    <p className="text-[11px] font-sans font-medium tracking-tight text-white/32">
                      Only denied or underpaid claims appear here.
                    </p>
                  </div>

                  <Button
                    onClick={() => setRefreshKey((current) => current + 1)}
                    className="h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/56 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                  </Button>
                </div>

                {summary.lastUpdatedAt ? (
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">
                    Updated {formatDistanceToNow(new Date(summary.lastUpdatedAt), { addSuffix: true })}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-white/8 bg-[#0c0c0c] text-white">
              <CardContent className="h-full p-6">
                {hasAppealData ? (
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Money Amazon pushed back on</div>
                      <div className="text-[40px] font-sans font-bold leading-none tracking-tight text-[#8b8b8b]">
                        {money(summary.appealValue)}
                      </div>
                      <p className="max-w-sm text-[12px] font-sans leading-5 text-white/42">
                        This is the value still worth challenging across denied and underpaid reimbursements.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Ready now', String(summary.readyCount)],
                        ['Denied', String(summary.deniedCount)],
                        ['Underpaid', String(summary.underpaidCount)]
                      ].map(([title, value]) => (
                        <div key={title} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                          <div className="text-[9px] font-sans font-bold uppercase tracking-tight text-white/28">{title}</div>
                          <div className="mt-2 text-xl font-sans font-bold tracking-tight text-white/78">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Nothing to reopen yet</div>
                      <div className="text-[28px] font-sans font-bold leading-tight tracking-tight text-[#8b8b8b]">
                        No denied or underpaid reimbursements found
                      </div>
                      <p className="max-w-sm text-[12px] font-sans leading-5 text-white/42">
                        This page will light up when Amazon denies a case or approves less than the claim value.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <div className="text-[9px] font-sans font-bold uppercase tracking-tight text-white/28">What happens next</div>
                      <div className="mt-2 text-[12px] font-sans leading-5 text-white/56">
                        Margin will bring those cases here for a stronger second pass once Amazon pushes back.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-2xl border-white/8 bg-[#0c0c0c] text-white">
            <CardContent className="p-0">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Reopen queue</div>
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
                  <p className="text-sm font-sans font-bold text-white/70">Failed to load Reopen Claims</p>
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
                    <table className="w-full min-w-[1280px]">
                      <thead className="border-b border-white/8 bg-white/[0.02]">
                        <tr className="text-left">
                          {['Case', 'Amazon response', 'Recoverable upside', 'Evidence rebuild', 'Appeal brief', 'Next move'].map((header) => (
                            <th key={header} className="px-6 py-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((row) => (
                          <tr key={row.dispute_case_id} className="border-b border-white/[0.06] align-top transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-5">
                              <div className="space-y-2">
                                <div className="text-[15px] font-sans font-bold tracking-tight text-white">
                                  {row.case_number || row.claim_number || row.amazon_case_id || 'Appeal case'}
                                </div>
                                <div className="text-[11px] font-sans text-white/42">{row.store_name || 'Store unavailable'}</div>
                                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/30">
                                  {[row.order_id, row.sku, row.asin].filter(Boolean).join(' / ') || 'Identifiers unavailable'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <Badge className={cn('w-fit rounded-full border bg-white/[0.06] px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', row.appealState === 'underpaid' ? 'border-white/12 text-white/78' : 'border-white/12 text-white/92')}>
                                  {row.appealState === 'underpaid' ? 'Underpaid' : 'Denied'}
                                </Badge>
                                <div className="text-[12px] font-sans font-semibold leading-5 tracking-tight text-white/84">{row.appealReasonText}</div>
                                {row.rejection_category ? <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/34">Reason bucket: {label(row.rejection_category)}</div> : null}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-2">
                                <div className="text-[24px] font-sans font-bold tracking-tight text-[#8b8b8b]">{money(row.appealGap, row.currency)}</div>
                                <div className="space-y-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/34">
                                  {amount(row.requested_amount) != null ? <div>Claimed {money(row.requested_amount, row.currency)}</div> : null}
                                  {amount(row.approved_amount) != null ? <div>Amazon approved {money(row.approved_amount, row.currency)}</div> : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <Badge className={cn('w-fit rounded-full border px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-tight', toneClass(row.strengthTone))}>
                                  {row.strengthLabel}
                                </Badge>
                                <div className="text-[12px] font-sans font-semibold leading-5 tracking-tight text-white/82">
                                  {row.strengthTone === 'ready'
                                    ? 'Enough proof is already linked to rebuild a stronger appeal now.'
                                    : row.strengthTone === 'strengthen'
                                      ? 'There is a starting evidence trail, but the packet still needs reinforcement.'
                                      : 'Amazon pushed this case back before a strong document trail was locked in.'}
                                </div>
                                <div className="space-y-1 text-[10px] font-sans font-medium uppercase tracking-tight text-white/34">
                                  <div>{Math.max(Number(row.matched_document_count || 0), 0)} linked document{Number(row.matched_document_count || 0) === 1 ? '' : 's'}</div>
                                  <div>Appeal strength {row.strengthScore}/100</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-3">
                                <div className="text-[12px] font-sans font-semibold leading-5 tracking-tight text-white/84">{row.policyAngle}</div>
                                <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/34">
                                  {row.updated_at ? `Updated ${formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}` : 'Update time unavailable'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex min-w-[210px] flex-col items-start gap-3">
                                <div className="text-[12px] font-sans font-semibold leading-5 tracking-tight text-white/82">{row.nextStep}</div>
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                    to={`/app/${activeTenantSlug}/recoveries/${encodeURIComponent(row.dispute_case_id)}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/76 transition-colors hover:bg-white/[0.08] hover:text-white"
                                  >
                                    Open case
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                  <Link
                                    to={`/app/${activeTenantSlug}/dispute-cases`}
                                    className="inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight text-white/44 transition-colors hover:border-white/15 hover:text-white/76"
                                  >
                                    Open filing queue
                                  </Link>
                                </div>
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
        </div>
      </div>
    </PageLayout>
  );
}
