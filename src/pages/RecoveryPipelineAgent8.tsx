import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertTriangle, CircleDollarSign, ShieldCheck, Clock3, Activity } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';

type Agent8RecoveriesPayload = {
  totalAmount: number;
  currency: string;
  claimCount: number;
  source?: string;
  dataSource?: string;
  message?: string;
  needsSync?: boolean;
  syncTriggered?: boolean;
};

type Agent8MetricsPayload = {
  success: boolean;
  totalClaimsFound: number;
  valueInProgress: number;
  currentlyInProgress: number;
  successRate30d: number;
  avgDaysToRecovery?: number;
  pendingCount?: number;
  approvedCount?: number;
};

const isRecoveriesShape = (value: any): value is Agent8RecoveriesPayload =>
  value &&
  typeof value.totalAmount === 'number' &&
  typeof value.currency === 'string' &&
  typeof value.claimCount === 'number';

const isMetricsShape = (value: any): value is Agent8MetricsPayload =>
  value &&
  typeof value.totalClaimsFound === 'number' &&
  typeof value.valueInProgress === 'number' &&
  typeof value.currentlyInProgress === 'number' &&
  typeof value.successRate30d === 'number';

export default function RecoveryPipelineAgent8() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug;

  if (!activeSlug && isReady) {
    throw new Error('tenantSlug required for Recovery Pipeline');
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveries, setRecoveries] = useState<Agent8RecoveriesPayload | null>(null);
  const [metrics, setMetrics] = useState<Agent8MetricsPayload | null>(null);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const [recoveriesRes, metricsRes] = await Promise.all([
        api.getAmazonRecoveries(activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 8 recoveries' })),
        api.getRecoveriesMetrics(activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 8 metrics' })),
      ]);

      if (cancelled) return;

      if (!recoveriesRes.ok) {
        setError(recoveriesRes.error || 'Failed to fetch Agent 8 recoveries');
        setRecoveries(null);
        setMetrics(null);
        setLoading(false);
        return;
      }

      if (!isRecoveriesShape(recoveriesRes.data)) {
        setError('Agent 8 recoveries response shape is invalid.');
        setRecoveries(null);
        setMetrics(null);
        setLoading(false);
        return;
      }

      if (!metricsRes.ok) {
        setError(metricsRes.error || 'Failed to fetch Agent 8 metrics');
        setRecoveries(null);
        setMetrics(null);
        setLoading(false);
        return;
      }

      if (!isMetricsShape(metricsRes.data)) {
        setError('Agent 8 metrics response shape is invalid.');
        setRecoveries(null);
        setMetrics(null);
        setLoading(false);
        return;
      }

      setRecoveries(recoveriesRes.data);
      setMetrics(metricsRes.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, activeSlug]);

  const cards = useMemo(() => {
    if (!recoveries || !metrics) return [];

    return [
      {
        label: 'Recovered Total',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: recoveries.currency }).format(recoveries.totalAmount),
        icon: CircleDollarSign,
      },
      {
        label: 'Recovery Claims',
        value: String(recoveries.claimCount),
        icon: ShieldCheck,
      },
      {
        label: 'Pending Count',
        value: String(metrics.pendingCount ?? metrics.currentlyInProgress),
        icon: Clock3,
      },
      {
        label: 'Success Rate 30d',
        value: `${metrics.successRate30d.toFixed(1)}%`,
        icon: Activity,
      },
    ];
  }, [recoveries, metrics]);

  return (
    <PageLayout title="Recovery Pipeline" midnight>
      <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

      <div className="relative w-full flex-1 overflow-x-hidden bg-[#050505]">
        <div className="relative w-full max-w-full px-8 pt-8 pb-24">
          <div className="border-b border-white/10 pb-8 mb-8">
            <div className="text-[10px] font-sans font-bold text-emerald-500/50 tracking-tight uppercase">Agent 8</div>
            <h1 className="text-4xl font-light font-sans text-white mt-2 tracking-tight">Recovery Pipeline</h1>
            <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight max-w-2xl leading-relaxed mt-3">
              Live recoveries only. This surface is bound to Agent 8 totals and payout tracking without detections, disputes, or evidence merging.
            </p>
          </div>

          <div className="mb-8 flex justify-end">
            <Button
              variant="outline"
              className="h-10 bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white font-sans font-bold text-[9px] uppercase tracking-tight rounded-lg px-4 gap-3"
              onClick={() => {
                setLoading(true);
                setError(null);
                setRecoveries(null);
                setMetrics(null);
              }}
            >
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh Agent 8
            </Button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="bg-[#0c0c0c] border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <Skeleton className="h-8 w-32 bg-white/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && error && (
            <Card className="bg-[#0c0c0c] border-red-500/20">
              <CardContent className="p-8 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <div className="text-[10px] font-sans font-bold text-red-400 uppercase tracking-tight">Agent 8 Error</div>
                  <div className="text-sm font-sans font-bold text-white mt-2">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && recoveries && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label} className="bg-[#0c0c0c] border-white/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">{card.label}</span>
                          <Icon className="h-4 w-4 text-emerald-500/50" />
                        </div>
                        <div className="text-2xl font-sans font-bold text-white tracking-tight">{card.value}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-8 space-y-4">
                  <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Agent 8 Feed Status</div>
                  <div className="text-sm font-sans font-bold text-white">
                    {recoveries.message || 'Agent 8 recoveries are available.'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
                    <div>
                      <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Data Source</div>
                      <div className="text-sm font-sans font-bold text-white mt-2">{recoveries.dataSource || recoveries.source || 'unknown'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">In Progress Value</div>
                      <div className="text-sm font-sans font-bold text-white mt-2">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: recoveries.currency }).format(metrics.valueInProgress)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Approved Count</div>
                      <div className="text-sm font-sans font-bold text-white mt-2">{metrics.approvedCount ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Sync Flags</div>
                      <div className="text-sm font-sans font-bold text-white mt-2">
                        {recoveries.syncTriggered ? 'sync_triggered' : recoveries.needsSync ? 'needs_sync' : 'healthy'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
