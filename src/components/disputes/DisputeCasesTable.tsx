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
import { cn } from '@/lib/utils';

interface DisputeCasesTableProps {
  isPaidUser?: boolean;
  isTenantThrottled?: boolean;
}

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];

function badgeClass(value: string | null | undefined) {
  const key = String(value || '').toLowerCase();
  if (['approved', 'reconciled', 'completed', 'credited', 'charged'].includes(key)) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (['rejected', 'denied', 'failed'].includes(key)) return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (['filed', 'submitted', 'filing', 'submitting'].includes(key)) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (['pending', 'retrying', 'pending_approval'].includes(key)) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  return 'bg-white/5 text-white/50 border-white/10';
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount == null) return 'Not available';
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

        if (!response.ok || !response.data) {
          throw new Error(response.error || 'Failed to load dispute case preview');
        }

        if (cancelled) return;
        setRows(response.data.rows || []);
        setFilteredResults(response.data.filtered_results || 0);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dispute case preview');
          setRows([]);
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
            Showing {rows.length} of {filteredResults} backend-filtered cases
          </p>
        </div>
        {activeTenantSlug && (
          <Button asChild className="h-8 px-4 text-[9px] font-sans font-bold uppercase tracking-tight bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 rounded-lg">
            <Link to="/dispute-cases">
              Open Full Queue
              <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
          <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/40">No dispute cases available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.dispute_case_id} className="bg-white/[0.01] border-white/5 text-white rounded-2xl">
              <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/recoveries/${row.dispute_case_id}`} className="text-sm font-sans font-bold text-white hover:text-emerald-300">
                      {row.case_number || row.dispute_case_id}
                    </Link>
                    <Badge variant="outline" className={cn('border', badgeClass(row.status))}>{row.status || 'Not available'}</Badge>
                    <Badge variant="outline" className={cn('border', badgeClass(row.filing_status))}>{row.filing_status || 'Not available'}</Badge>
                    <Badge variant="outline" className={cn('border', badgeClass(row.evidence_state))}>{row.evidence_state}</Badge>
                  </div>
                  <div className="text-[11px] font-sans text-white/45 space-y-1">
                    <div>Next Action: {row.next_action}</div>
                    <div>Requested: {formatMoney(row.requested_amount, row.currency)} | Approved: {formatMoney(row.approved_amount, row.currency)} | Recovered: {formatMoney(row.actual_payout_amount, row.currency)}</div>
                  </div>
                </div>
                <div className="text-[11px] font-sans text-white/40">
                  Matched Docs: {row.matched_document_count}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
