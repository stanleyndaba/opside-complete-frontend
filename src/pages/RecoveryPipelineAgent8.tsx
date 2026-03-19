import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertTriangle, CircleDollarSign, ShieldCheck, Clock3, Activity, MoreHorizontal, Search } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { api, detectionApi } from '@/lib/api';

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

type Agent3Detection = {
  id: string;
  anomaly_type: string;
  severity: string;
  estimated_value: number;
  currency: string;
  confidence_score: number;
  status: string;
  discovery_date: string;
  deadline_date: string;
  days_remaining: number;
  claim_number?: string;
  sku?: string;
  asin?: string;
  details?: string;
};

type Agent3ResultsPayload = {
  success: boolean;
  results: Agent3Detection[];
  total: number;
};

type Agent3StatsPayload = {
  success: boolean;
  statistics: {
    total_anomalies?: number;
    total_value?: number;
    by_confidence?: {
      high: number;
      medium: number;
      low: number;
    };
    expiring_soon?: number;
  };
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

const isDetectionResultsShape = (value: any): value is Agent3ResultsPayload =>
  value &&
  Array.isArray(value.results) &&
  typeof value.total === 'number';

const isDetectionStatsShape = (value: any): value is Agent3StatsPayload =>
  value &&
  value.statistics &&
  typeof value.statistics === 'object';

const formatAnomalyLabel = (value: string) =>
  value
    .replace(/[_:]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

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
  const [detectionResults, setDetectionResults] = useState<Agent3Detection[]>([]);
  const [detectionStats, setDetectionStats] = useState<Agent3StatsPayload['statistics'] | null>(null);
  const [activeTab, setActiveTab] = useState<'opportunity-queue' | 'recoveries'>('opportunity-queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'30' | '90' | '365' | 'all'>('30');
  const [severityFilter, setSeverityFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [evidencePackOpen, setEvidencePackOpen] = useState(false);
  const [evidencePackClaim, setEvidencePackClaim] = useState<any | null>(null);
  const [proofDocsModalOpen, setProofDocsModalOpen] = useState(false);
  const [proofDocsClaim, setProofDocsClaim] = useState<any | null>(null);
  const [proofDocs, setProofDocs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const [recoveriesRes, metricsRes, detectionResultsRes, detectionStatsRes] = await Promise.all([
        api.getAmazonRecoveries(activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 8 recoveries' })),
        api.getRecoveriesMetrics(activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 8 metrics' })),
        detectionApi.getDetectionResults({ limit: 25 }, activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 3 detections' })),
        detectionApi.getDetectionStatistics(undefined, activeSlug).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : 'Failed to fetch Agent 3 statistics' })),
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

      if (!detectionResultsRes.ok) {
        setError(detectionResultsRes.error || 'Failed to fetch Agent 3 detections');
        setRecoveries(null);
        setMetrics(null);
        setDetectionResults([]);
        setDetectionStats(null);
        setLoading(false);
        return;
      }

      if (!isDetectionResultsShape(detectionResultsRes.data)) {
        setError('Agent 3 detections response shape is invalid.');
        setRecoveries(null);
        setMetrics(null);
        setDetectionResults([]);
        setDetectionStats(null);
        setLoading(false);
        return;
      }

      if (!detectionStatsRes.ok) {
        setError(detectionStatsRes.error || 'Failed to fetch Agent 3 statistics');
        setRecoveries(null);
        setMetrics(null);
        setDetectionResults([]);
        setDetectionStats(null);
        setLoading(false);
        return;
      }

      if (!isDetectionStatsShape(detectionStatsRes.data)) {
        setError('Agent 3 statistics response shape is invalid.');
        setRecoveries(null);
        setMetrics(null);
        setDetectionResults([]);
        setDetectionStats(null);
        setLoading(false);
        return;
      }

      setRecoveries(recoveriesRes.data);
      setMetrics(metricsRes.data);
      setDetectionResults(detectionResultsRes.data.results);
      setDetectionStats(detectionStatsRes.data.statistics);
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

  const detectionCards = useMemo(() => {
    if (!detectionStats) return [];

    return [
      {
        label: 'Open Opportunities',
        value: String(detectionStats.total_anomalies ?? detectionResults.length),
      },
      {
        label: 'Estimated Value',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(detectionStats.total_value ?? 0),
      },
      {
        label: 'High Confidence',
        value: String(detectionStats.by_confidence?.high ?? 0),
      },
      {
        label: 'Expiring Soon',
        value: String(detectionStats.expiring_soon ?? 0),
      },
    ];
  }, [detectionResults.length, detectionStats]);

  const buildDetectionClaim = (result: Agent3Detection) => ({
    ...result,
    guaranteedAmount: result.estimated_value,
    claim_number: result.claim_number || result.id,
    details: result.details || formatAnomalyLabel(result.anomaly_type),
  });

  const filteredDetectionResults = useMemo(() => {
    const now = Date.now();
    const maxAgeDays = datePreset === 'all' ? null : Number(datePreset);

    return detectionResults.filter((result) => {
      const haystack = [
        result.id,
        result.claim_number,
        result.sku,
        result.asin,
        result.anomaly_type,
        result.details,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchMatch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase());
      const severityMatch = severityFilter === 'all' || String(result.severity || '').toLowerCase() === severityFilter.toLowerCase();
      const statusMatch = statusFilter === 'all' || String(result.status || '').toLowerCase() === statusFilter.toLowerCase();

      let dateMatch = true;
      if (maxAgeDays !== null) {
        const candidateDate = result.discovery_date ? new Date(result.discovery_date).getTime() : Number.NaN;
        if (Number.isNaN(candidateDate)) {
          dateMatch = false;
        } else {
          const ageInDays = (now - candidateDate) / (1000 * 60 * 60 * 24);
          dateMatch = ageInDays <= maxAgeDays;
        }
      }

      return searchMatch && severityMatch && statusMatch && dateMatch;
    });
  }, [datePreset, detectionResults, searchTerm, severityFilter, statusFilter]);

  const availableSeverities = useMemo(() => {
    return Array.from(new Set(detectionResults.map((result) => String(result.severity || '').trim()).filter(Boolean)));
  }, [detectionResults]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(detectionResults.map((result) => String(result.status || '').trim()).filter(Boolean)));
  }, [detectionResults]);

  return (
    <PageLayout title="Recovery Pipeline" midnight>
      <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

      <div className="relative w-full flex-1 overflow-x-hidden bg-[#050505]">
        <div className="relative w-full max-w-full px-8 pt-8 pb-24">
          <div className="border-b border-white/10 pb-8 mb-8">
            <div className="text-[10px] font-sans font-bold text-white/30 tracking-tight uppercase">Agents 3 + 8</div>
            <h1 className="text-4xl font-light font-sans text-white mt-2 tracking-tight">Recovery Pipeline</h1>
            <p className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight max-w-2xl leading-relaxed mt-3">
              Opportunity Queue is bound to Agent 3 detections. Recoveries is bound to Agent 8 payout truth. No cross-agent merging.
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
                setDetectionResults([]);
                setDetectionStats(null);
              }}
            >
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh Pipeline
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
                  <div className="text-[10px] font-sans font-bold text-red-400 uppercase tracking-tight">Pipeline Error</div>
                  <div className="text-sm font-sans font-bold text-white mt-2">{error}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && recoveries && metrics && detectionStats && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'opportunity-queue' | 'recoveries')} className="space-y-6">
              <TabsList className="h-auto rounded-2xl border border-white/10 bg-[#0c0c0c] p-1">
                <TabsTrigger value="opportunity-queue" className="rounded-xl px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-black">
                  Opportunity Queue
                </TabsTrigger>
                <TabsTrigger value="recoveries" className="rounded-xl px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:text-black">
                  Recoveries
                </TabsTrigger>
              </TabsList>

              <TabsContent value="opportunity-queue" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {detectionCards.map((card) => (
                    <Card key={card.label} className="bg-[#0c0c0c] border-white/10">
                      <CardContent className="p-6">
                        <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight mb-4">{card.label}</div>
                        <div className="text-2xl font-sans font-bold text-white tracking-tight">{card.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-[#0c0c0c] border-white/10">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
                      <div>
                        <div className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Agent 3 Opportunity Queue</div>
                        <div className="text-sm font-sans font-bold text-white mt-2">Live discrepancy opportunities waiting for review.</div>
                      </div>
                      <Button
                        variant="outline"
                        className="h-10 bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white font-sans font-bold text-[9px] uppercase tracking-tight rounded-lg px-4"
                        onClick={() => {
                          window.location.href = `/app/${activeSlug}/dashboard?tab=discrepancies`;
                        }}
                      >
                        Open Audits
                      </Button>
                    </div>

                    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="relative w-full xl:max-w-xl">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                            <Input
                              value={searchTerm}
                              onChange={(event) => setSearchTerm(event.target.value)}
                              placeholder="Search by claim ID, SKU, ASIN, or anomaly type"
                              className="h-12 rounded-xl border-white/10 bg-white/[0.03] pl-11 text-sm font-sans font-bold text-white placeholder:text-white/20"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Last 30 Days', value: '30' as const },
                              { label: 'Last 90 Days', value: '90' as const },
                              { label: 'This Year', value: '365' as const },
                              { label: 'Max Historical', value: 'all' as const },
                            ].map((preset) => (
                              <Button
                                key={preset.value}
                                type="button"
                                variant="outline"
                                className={`h-9 rounded-full px-4 text-[10px] font-sans font-bold uppercase tracking-tight ${
                                  datePreset === preset.value
                                    ? 'border-white/30 bg-white text-black hover:bg-white/90'
                                    : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white'
                                }`}
                                onClick={() => setDatePreset(preset.value)}
                              >
                                {preset.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                              <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c0c0c] border border-white/10 text-white rounded-xl">
                              <SelectItem value="all" className="text-[10px] font-sans font-bold uppercase tracking-tight">Spectrum All</SelectItem>
                              {availableSeverities.map((severity) => (
                                <SelectItem key={severity} value={severity} className="text-[10px] font-sans font-bold uppercase tracking-tight">
                                  {severity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c0c0c] border border-white/10 text-white rounded-xl">
                              <SelectItem value="all" className="text-[10px] font-sans font-bold uppercase tracking-tight">Status All</SelectItem>
                              {availableStatuses.map((status) => (
                                <SelectItem key={status} value={status} className="text-[10px] font-sans font-bold uppercase tracking-tight">
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/20">
                            {filteredDetectionResults.length} visible nodes
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-0 text-[10px] font-sans font-bold uppercase tracking-tight text-white/30 hover:text-white"
                            onClick={() => {
                              setSearchTerm('');
                              setDatePreset('30');
                              setSeverityFilter('all');
                              setStatusFilter('all');
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                    </div>

                    {filteredDetectionResults.length === 0 ? (
                      <div className="text-sm font-sans font-bold text-white/50">No open detection opportunities for this tenant right now.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="py-3 pr-4 text-left text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-white/18">Node</th>
                              <th className="py-3 px-4 text-left text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-white/18">Signal</th>
                              <th className="py-3 px-4 text-right text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-white/18">Value</th>
                              <th className="py-3 pl-4 text-right text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-white/18">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDetectionResults.slice(0, 10).map((result) => (
                              <tr key={result.id} className="border-b border-white/[0.06] align-top">
                                <td className="py-5 pr-4">
                                  <div className="flex items-start gap-4">
                                    <div className="mt-1 h-4 w-4 rounded border border-white/15 bg-transparent" />
                                    <div className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-white/[0.02] px-1.5 text-[9px] font-sans font-medium text-white/35">
                                      {Math.round((result.confidence_score || 0) * 10)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[11px] font-sans font-semibold tracking-tight text-white/92">
                                          {result.claim_number || result.id}
                                        </span>
                                        <span className="text-[10px] font-sans font-medium text-white/22">
                                          {result.discovery_date ? new Date(result.discovery_date).toLocaleString('en-US', {
                                            month: 'short',
                                            day: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false,
                                          }) : '-'}
                                        </span>
                                      </div>
                                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-sans font-medium tracking-tight text-white/45">
                                        <span className="uppercase">{formatAnomalyLabel(result.anomaly_type)} detected with {Math.round((result.confidence_score || 0) * 100)}% confidence</span>
                                        <span className="text-white/12">|</span>
                                        <span className="uppercase">SKU FX: {result.sku || '-'}</span>
                                      </div>
                                      <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/48">
                                          {String(result.status || '-').replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/28">
                                          Expiry in {typeof result.days_remaining === 'number' ? `${result.days_remaining}d` : '-'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-5 px-4">
                                  <div className="space-y-2 text-left">
                                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/52">
                                      {String(result.severity || '-')}
                                    </div>
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/28">
                                      Agent 3 discrepancy
                                    </div>
                                  </div>
                                </td>
                                <td className="py-5 px-4 text-right">
                                  <div className="space-y-2">
                                    <div className="text-[12px] font-sans font-semibold tracking-tight text-white">
                                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: result.currency || 'USD' }).format(result.estimated_value || 0)}
                                    </div>
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/18">
                                      Recovery Value
                                    </div>
                                  </div>
                                </td>
                                <td className="py-5 pl-4 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white/26 hover:text-white hover:bg-white/5 rounded-lg"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-xl p-1">
                                      <div className="text-[9px] font-sans font-bold text-white/20 px-3 py-2 border-b border-white/5 mb-1 uppercase tracking-tight">ACTION_VECTOR</div>
                                      <DropdownMenuItem asChild className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2 cursor-pointer uppercase tracking-tight">
                                        <Link to={`/app/${activeSlug}/recoveries/${result.id}`} state={{ claim: buildDetectionClaim(result) }}>
                                          VIEW_PARAMETERS
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2 cursor-pointer uppercase tracking-tight"
                                        onClick={async () => {
                                          try {
                                            const res = await api.getRecoveryDetail(result.id, activeSlug);
                                            const docs = (res && res.ok && Array.isArray((res as any).data?.documents)) ? (res as any).data!.documents : [];
                                            setProofDocs(docs);
                                            setProofDocsClaim(buildDetectionClaim(result));
                                            setProofDocsModalOpen(true);
                                          } catch (e: any) {
                                            toast({ title: 'Error loading documents', description: e?.message || 'Unable to load proof documents.' });
                                          }
                                        }}
                                      >
                                        PROOF_OF_DOCUMENT_RETRIEVAL
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-[10px] font-sans font-bold text-white/60 hover:text-white rounded-lg px-3 py-2 cursor-pointer uppercase tracking-tight"
                                        onClick={() => {
                                          setEvidencePackClaim(buildDetectionClaim(result));
                                          setEvidencePackOpen(true);
                                        }}
                                      >
                                        AUDIT_PACKAGE_VIEW
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <div className="mt-3 text-[9px] font-sans font-medium uppercase tracking-tight text-white/28">
                                    Node Spec
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recoveries" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <Card key={card.label} className="bg-[#0c0c0c] border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">{card.label}</span>
                            <Icon className="h-4 w-4 text-white/40" />
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
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {evidencePackClaim && (
        <EvidencePackView
          open={evidencePackOpen}
          onOpenChange={setEvidencePackOpen}
          claim={evidencePackClaim}
          tenantSlug={activeSlug}
        />
      )}

      <ProofDocumentsModal
        open={proofDocsModalOpen}
        onOpenChange={setProofDocsModalOpen}
        claimId={proofDocsClaim?.id || ''}
        claimNumber={proofDocsClaim?.claim_number}
        documents={proofDocs}
      />
    </PageLayout>
  );
}
