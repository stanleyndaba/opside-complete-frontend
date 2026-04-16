import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, RefreshCw } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { selectApprovedReimbursementRows, type ApprovedReimbursementViewRow } from '@/lib/approvedReimbursementTruth';

const NOT_AVAILABLE = 'Not Available';

const formatMoney = (value: number | null | undefined, currency = 'USD') =>
  typeof value === 'number' && !Number.isNaN(value)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    : NOT_AVAILABLE;

const formatStamp = (value?: string | null) => {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ApprovedReimbursements() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = (tenantSlug || '').trim();
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<ApprovedReimbursementViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedReimbursements = useCallback(async (mode: 'load' | 'refresh' = 'load') => {
    if (!activeSlug) return;
    if (mode === 'load') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);

    try {
      const response = await api.getRecoveriesLedger({
        date_range: 'all',
        sort_by: 'approved_amount',
        sort_dir: 'desc',
        page: 1,
        page_size: 100,
      }, activeSlug);

      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Failed to load approved reimbursements.');
      }

      const ledgerRows = Array.isArray(response.data?.rows) ? response.data.rows : [];
      const nextRows = selectApprovedReimbursementRows(ledgerRows);

      setRows(nextRows);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || 'Failed to load approved reimbursements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    fetchApprovedReimbursements('load');
  }, [activeSlug, fetchApprovedReimbursements, isReady]);

  const headingCount = useMemo(() => rows.length.toLocaleString('en-US'), [rows.length]);

  const forcePageTop = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    topAnchorRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, []);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const previousScrollRestoration = 'scrollRestoration' in window.history ? window.history.scrollRestoration : null;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    forcePageTop();
    const restoreTopFrame = window.requestAnimationFrame(() => {
      forcePageTop();
    });
    const restoreTopTimeout = window.setTimeout(() => {
      forcePageTop();
    }, 180);

    return () => {
      window.cancelAnimationFrame(restoreTopFrame);
      window.clearTimeout(restoreTopTimeout);
      if (previousScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [activeSlug, forcePageTop]);

  useEffect(() => {
    if (loading) return;
    const settledTopTimeout = window.setTimeout(() => {
      forcePageTop();
    }, 40);

    return () => window.clearTimeout(settledTopTimeout);
  }, [forcePageTop, loading, rows.length]);

  return (
    <PageLayout title="Approved Reimbursements" midnight>
      <div className="min-h-screen bg-[#070707] text-white">
        <div className="container mx-auto px-6 pb-20 pt-6 lg:px-8 lg:pt-8">
          <div ref={topAnchorRef} />
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead colSpan={4} className="px-6 py-5 align-top">
                    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                            <CircleCheck className="h-5 w-5 text-white/70" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/38">Approved reimbursements</div>
                            <div className="text-[11px] font-sans font-medium tracking-tight text-white/50">
                              {headingCount} production-truth record{rows.length === 1 ? '' : 's'}
                            </div>
                          </div>
                        </div>
                        <h1 className="max-w-3xl text-[29px] font-sans font-bold tracking-tight text-white lg:text-[32px]">
                          Approved Reimbursements
                        </h1>
                        <p className="max-w-3xl text-[14px] font-sans leading-6 text-white/62">
                          Only real dispute-case rows with Amazon approval or verified reimbursement truth. Detection estimates and claim-amount fallbacks are not counted as approved value.
                        </p>
                      </div>

                      <Button
                        onClick={() => fetchApprovedReimbursements('refresh')}
                        disabled={refreshing}
                        className="h-10 shrink-0 rounded-lg border border-white/12 bg-white/[0.04] px-4 text-[10px] font-sans font-bold uppercase tracking-tight text-white/72 hover:bg-white/10 hover:text-white"
                      >
                        <RefreshCw className={`mr-2 h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </TableHead>
                </TableRow>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="h-11 px-6 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Case</TableHead>
                  <TableHead className="h-11 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Amount</TableHead>
                  <TableHead className="h-11 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Verification</TableHead>
                  <TableHead className="h-11 pr-6 text-right text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="px-6 py-8 text-center text-[11px] font-sans font-bold text-white/45">
                      Loading approved reimbursements...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="px-6 py-8 text-center text-[11px] font-sans font-bold text-white/45">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={4} className="px-6 py-8 text-center text-[11px] font-sans font-bold text-white/45">
                      No production-verified approved reimbursement records yet.
                    </TableCell>
                  </TableRow>
                ) : rows.map((row) => (
                  <TableRow key={`${row.routeId}-${row.caseReference}`} className="border-white/5 text-white/70 hover:bg-white/[0.02]">
                    <TableCell className="px-6 py-3 text-[11px] font-sans font-bold tracking-tight text-white/78">
                      {row.caseReference}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-[11px] font-sans font-bold text-white/70">{formatMoney(row.amount, row.currency)}</div>
                      <div className="mt-1 text-[9px] font-sans font-bold uppercase tracking-tight text-white/28">{row.amountNote}</div>
                    </TableCell>
                    <TableCell className="py-3 text-[11px] font-sans font-bold text-white/50">
                      {row.payoutTruth}
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right text-[11px] font-sans font-bold text-white/40">
                      {formatStamp(row.lastUpdatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
