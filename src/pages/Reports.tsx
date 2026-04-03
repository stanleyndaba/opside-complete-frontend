import React, { useState, useMemo, Suspense, lazy, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Download, ArrowUpDown, ArrowUp, ArrowDown, Search as SearchIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';

// Chart skeleton loader
const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="w-full h-full" />
  </div>
);

// Lazy-loaded chart components for better code splitting
const RecoveryChart = lazy(() =>
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ date: string; value: number }> }) => {
      const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } = recharts;
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                backgroundColor: 'rgba(12, 12, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
            />
            <Bar dataKey="value" fill="#7DD3FC" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Anomaly Type Distribution Line Chart
const AnomalyTypeChart = lazy(() =>
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ type: string; count: number; value: number }> }) => {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart } = recharts;
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="type" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'value') return formatCurrency(value);
                return value;
              }}
              contentStyle={{
                backgroundColor: 'rgba(12, 12, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#7DD3FC" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#FBBF24" strokeWidth={3} dot={{ fill: '#FBBF24', r: 4 }} name="Value" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Severity Distribution Line Chart
const SeverityChart = lazy(() =>
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ severity: string; count: number; value: number }> }) => {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart } = recharts;
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };

      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="severity" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'value') return formatCurrency(value);
                return value;
              }}
              contentStyle={{
                backgroundColor: 'rgba(12, 12, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#7DD3FC" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#FBBF24" strokeWidth={3} dot={{ fill: '#FBBF24', r: 4 }} name="Value" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Confidence Distribution Line Chart
const ConfidenceChart = lazy(() =>
  import('recharts').then(recharts => {
    const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } = recharts;

    return {
      default: ({ data }: { data: Array<{ level: string; count: number }> }) => {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="level" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(12, 12, 12, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  backdropFilter: 'blur(12px)'
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#7DD3FC"
                fill="url(#confidenceGradient)"
                strokeWidth={3}
                dot={{ fill: '#7DD3FC', r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    };
  })
);

// Recovery Rates Line Chart with Gradient
const RecoveryRatesChart = lazy(() =>
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ level: string; rate: number }> }) => {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart } = recharts;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="level" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <YAxis
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
              stroke="transparent"
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip
              formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              contentStyle={{
                backgroundColor: 'rgba(12, 12, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#7DD3FC"
              fill="url(#recoveryGradient)"
              strokeWidth={3}
              dot={{ fill: '#7DD3FC', r: 5 }}
              name="Recovery Rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Confidence Range Histogram Line Chart
const ConfidenceHistogram = lazy(() =>
  import('recharts').then(recharts => ({
    default: ({ data }: { data: Array<{ range: string; count: number }> }) => {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } = recharts;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="histogramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7DD3FC" stopOpacity={0.75} />
                <stop offset="95%" stopColor="#7DD3FC" stopOpacity={0.08} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} stroke="transparent" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(12, 12, 12, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                backdropFilter: 'blur(12px)'
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#7DD3FC"
              fill="url(#histogramGradient)"
              strokeWidth={3}
              dot={{ fill: '#7DD3FC', r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  }))
);

type ClaimRecord = {
  id: string;
  dateCreated: string;
  claimType: string;
  status: string;
  amountRecovered: number;
  payoutDate: string | null;
};

const parseNumericAmount = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const sanitized = value.replace(/[$,]/g, '').trim();
    if (!sanitized) return null;
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const prettifyLabel = (value: any, fallback: string) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeClaimRecord = (raw: any, index: number): ClaimRecord => {
  const amount =
    parseNumericAmount(raw.actual_payout_amount) ??
    parseNumericAmount(raw.actual_amount) ??
    parseNumericAmount(raw.amount_recovered) ??
    parseNumericAmount(raw.amount) ??
    (typeof raw.amount_cents === 'number' ? raw.amount_cents / 100 : null) ??
    parseNumericAmount(raw.claim_amount) ??
    parseNumericAmount(raw.guaranteedAmount) ??
    parseNumericAmount(raw.expectedAmount) ??
    (typeof raw.expected_amount_cents === 'number' ? raw.expected_amount_cents / 100 : null) ??
    0;

  const createdAt =
    raw.created_at ||
    raw.createdAt ||
    raw.created ||
    raw.date_created ||
    raw.submitted_at ||
    raw.inserted_at ||
    raw.detected_at ||
    new Date().toISOString();

  const payoutDate =
    raw.payout_date ||
    raw.payoutDate ||
    raw.paid_at ||
    raw.completed_at ||
    raw.reconciled_at ||
    raw.expected_payout_date ||
    raw.expectedPayoutDate ||
    null;

  return {
    id: String(raw.claim_id || raw.id || raw.reference_id || raw.reference || `claim-${index}`),
    dateCreated: new Date(createdAt).toISOString(),
    claimType: prettifyLabel(raw.dispute_type || raw.type || raw.claim_type || raw.category || 'Unknown', 'Unknown'),
    status: prettifyLabel(raw.status || raw.state || raw.claim_status || raw.recovery_status || 'Pending', 'Pending'),
    amountRecovered: Number.isFinite(amount) ? amount : 0,
    payoutDate: payoutDate ? new Date(payoutDate).toISOString() : null
  };
};
type SortField = 'dateCreated' | 'claimType' | 'status' | 'amountRecovered' | 'payoutDate';
type SortDirection = 'asc' | 'desc';
export default function Reports() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { toast } = useToast();
  const activeTenantSlug = (tenantSlug || '').trim();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('dateCreated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [reportType, setReportType] = useState<'' | 'recovery_payout' | 'fee_dispute' | 'evidence_log'>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Phase 3: Detection statistics state
  const [detectionStats, setDetectionStats] = useState<any>(null);
  const [confidenceDistribution, setConfidenceDistribution] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const applyClaimEvent = useCallback((event: StatusEvent) => {
    const eventId = String(
      event.data?.dispute_case_id ||
      event.data?.claimId ||
      event.data?.caseId ||
      event.entityId ||
      ''
    ).trim();

    if (!eventId) {
      return;
    }

    setClaims((prev) => {
      const existing = prev.find((claim) => claim.id === eventId);
      const timestamp =
        event.timestamp ||
        event.data?.timestamp ||
        new Date().toISOString();

      if (event.eventType === 'case.status_updated') {
        const nextStatus = prettifyLabel(event.data?.status || 'Updated', 'Updated');
        if (!existing) return prev;
        return prev.map((claim) => (
          claim.id === eventId
            ? {
              ...claim,
              status: nextStatus,
              payoutDate: nextStatus === 'Approved' ? (claim.payoutDate || timestamp) : claim.payoutDate
            }
            : claim
        ));
      }

      if (event.eventType === 'payout.detected') {
        const payoutAmount =
          parseNumericAmount(event.data?.actual_amount) ??
          parseNumericAmount(event.data?.amount) ??
          0;

        if (existing) {
          return prev.map((claim) => (
            claim.id === eventId
              ? {
                ...claim,
                status: prettifyLabel(event.data?.status || 'Reconciled', 'Reconciled'),
                amountRecovered: payoutAmount || claim.amountRecovered,
                payoutDate: timestamp
              }
              : claim
          ));
        }

        return [{
          id: eventId,
          dateCreated: timestamp,
          claimType: prettifyLabel(event.data?.case_type || event.data?.anomaly_type || 'Recovery', 'Recovery'),
          status: prettifyLabel(event.data?.status || 'Reconciled', 'Reconciled'),
          amountRecovered: payoutAmount,
          payoutDate: timestamp
        }, ...prev];
      }

      if (event.eventType === 'filing.submitted') {
        if (existing) {
          return prev.map((claim) => (
            claim.id === eventId
              ? { ...claim, status: 'Filed' }
              : claim
          ));
        }

        return [{
          id: eventId,
          dateCreated: timestamp,
          claimType: prettifyLabel(event.data?.case_type || 'Claim', 'Claim'),
          status: 'Filed',
          amountRecovered: parseNumericAmount(event.data?.amount) ?? 0,
          payoutDate: null
        }, ...prev];
      }

      return prev;
    });
  }, []);

  useStatusStream((event: StatusEvent) => {
    if (!activeTenantSlug) return;

    if (event.eventType === 'detection.created') {
      setClaimsLoading(true);
      recoveryApi.getRecoveries(activeTenantSlug)
        .then((recoveries) => {
          if (!Array.isArray(recoveries)) return;
          const normalized = recoveries
            .map((record, index) => normalizeClaimRecord(record, index))
            .filter((claim) => Boolean(claim.dateCreated));
          setClaims(normalized);
        })
        .finally(() => setClaimsLoading(false));
      return;
    }

    if (event.eventType === 'payout.detected') {
      detectionApi.getDetectionStatistics(undefined, activeTenantSlug).then((res) => {
        if (res.ok && res.data?.statistics) {
          setDetectionStats(res.data.statistics);
        }
      });
    }

    if (
      event.eventType === 'case.status_updated' ||
      event.eventType === 'filing.submitted' ||
      event.eventType === 'payout.detected'
    ) {
      applyClaimEvent(event);
    }
  }, activeTenantSlug);

  // Fetch Phase 3 detection statistics
  useEffect(() => {
    if (!activeTenantSlug) {
      setDetectionStats(null);
      setConfidenceDistribution(null);
      setLoadingStats(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      try {
        const [statsRes, distRes] = await Promise.all([
          detectionApi.getDetectionStatistics(undefined, activeTenantSlug).catch(() => ({ ok: false, data: null })),
          detectionApi.getConfidenceDistribution(undefined, activeTenantSlug).catch(() => ({ ok: false, data: null })),
        ]);
        if (!cancelled) {
          if (statsRes.ok && statsRes.data?.statistics) {
            setDetectionStats(statsRes.data.statistics);
          }
          if (distRes.ok && distRes.data?.distribution) {
            setConfidenceDistribution(distRes.data.distribution);
          }
        }
      } catch (error) {
        console.error('Failed to load detection statistics:', error);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTenantSlug]);

  useEffect(() => {
    if (!activeTenantSlug) {
      setClaims([]);
      setClaimsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setClaimsLoading(true);
      try {
        const recoveries = await recoveryApi.getRecoveries(activeTenantSlug);
        if (cancelled) return;
        if (Array.isArray(recoveries) && recoveries.length > 0) {
          const normalized = recoveries
            .map((record, index) => normalizeClaimRecord(record, index))
            .filter((claim) => Boolean(claim.dateCreated));
          setClaims(normalized);
        } else {
          setClaims([]);
        }
      } catch (error) {
        console.error('[Reports] Failed to load recovery records:', error);
        if (!cancelled) setClaims([]);
      } finally {
        if (!cancelled) setClaimsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTenantSlug]);

  // Filter and sort data
  const filteredClaims = useMemo(() => {
    let filtered = claims.filter(claim => {
      const term = search.trim().toLowerCase();
      const matchesSearch = !term || claim.id.toLowerCase().includes(term) || claim.claimType.toLowerCase().includes(term) || claim.status.toLowerCase().includes(term);
      // Date filter
      const claimDate = new Date(claim.dateCreated);
      const dateInRange = (!dateRange?.from || claimDate >= dateRange.from) && (!dateRange?.to || claimDate <= dateRange.to);

      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.claimType);

      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);
      return dateInRange && typeMatch && statusMatch && matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (sortField === 'dateCreated' || sortField === 'payoutDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      if (sortField === 'amountRecovered') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return filtered;
  }, [claims, dateRange, selectedClaimTypes, selectedStatuses, sortField, sortDirection, search]);

  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [filteredClaims, page, pageSize]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalValueInView = filteredClaims.reduce((sum, claim) => sum + claim.amountRecovered, 0);
    const casesInView = filteredClaims.length;
    const paidClaimsWithStatus = filteredClaims.filter((claim) => ['Paid', 'Reconciled'].includes(claim.status));
    const paidClaims = paidClaimsWithStatus.length;
    const confirmedRecovered = paidClaimsWithStatus.reduce((sum, claim) => sum + claim.amountRecovered, 0);

    // Calculate average recovery time (for paid claims only)
    const paidClaimsWithDates = filteredClaims.filter(claim => ['Paid', 'Reconciled'].includes(claim.status) && claim.payoutDate);
    const avgRecoveryTime = paidClaimsWithDates.length > 0 ? paidClaimsWithDates.reduce((sum, claim) => {
      const created = new Date(claim.dateCreated);
      const paid = new Date(claim.payoutDate!);
      return sum + Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0) / paidClaimsWithDates.length : 0;
    return {
      totalValueInView,
      casesInView,
      paidClaims,
      confirmedRecovered,
      avgRecoveryTime: Math.round(avgRecoveryTime),
      paidCasesWithDates: paidClaimsWithDates.length
    };
  }, [filteredClaims]);
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      case 'Denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  const setQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '30days':
        setDateRange({
          from: subDays(now, 30),
          to: now
        });
        break;
      case 'quarter':
        setDateRange({
          from: startOfQuarter(now),
          to: now
        });
        break;
      case 'year':
        setDateRange({
          from: startOfYear(now),
          to: now
        });
        break;
      case 'all':
        setDateRange(undefined);
        break;
    }
  };
  const exportToCSV = () => {
    const headers = ['Claim ID', 'Date Created', 'Claim Type', 'Status', 'Case Value', 'Payout Date'];
    const csvContent = [headers.join(','), ...filteredClaims.map(claim => [claim.id, claim.dateCreated, claim.claimType, claim.status, claim.amountRecovered, claim.payoutDate || ''].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const filename =
      reportType === 'fee_dispute'
        ? 'claim-value-by-type.csv'
        : reportType === 'evidence_log'
          ? 'case-status-ledger.csv'
          : 'claims-ledger.csv';
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const exportAction = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
      toast({
        title: "Export Complete",
        description: "Current filtered claims ledger exported as CSV",
      });
    }
    if (exportFormat === 'pdf') {
      toast({
        title: "PDF Export",
        description: "CSV export recommended for detailed reports. PDF summary feature coming soon.",
      });
    }
    setExportOpen(false);
  };
  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    if (filteredClaims.length === 0) return [];
    const buckets = new Map<string, number>();
    filteredClaims.forEach((claim) => {
      const rawDate = claim.dateCreated;
      if (!rawDate) return;
      const isoKey = format(new Date(rawDate), 'yyyy-MM-dd');
      const current = buckets.get(isoKey) ?? 0;
      buckets.set(isoKey, current + (claim.amountRecovered || 0));
    });
    return Array.from(buckets.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([iso, value]) => ({
        date: format(new Date(iso), 'MMM dd'),
        value
      }));
  }, [filteredClaims]);

  // Phase 3: Detection statistics chart data
  const anomalyTypeChartData = useMemo(() => {
    if (!detectionStats) return [];
    // Try different possible data structures
    const byType = detectionStats.by_type || detectionStats.byType || detectionStats.anomaly_types || {};
    if (Object.keys(byType).length === 0) return [];
    return Object.entries(byType).map(([type, data]: [string, any]) => {
      const dataObj = typeof data === 'object' ? data : { count: 0, value: 0 };
      return {
        type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: dataObj.count || dataObj.total || 0,
        value: dataObj.value || dataObj.amount || dataObj.total_value || 0
      };
    }).filter(item => item.count > 0 || item.value > 0).sort((a, b) => b.value - a.value);
  }, [detectionStats]);

  const severityChartData = useMemo(() => {
    if (!detectionStats?.by_severity) return [];
    return Object.entries(detectionStats.by_severity).map(([severity, data]: [string, any]) => ({
      severity: severity.charAt(0).toUpperCase() + severity.slice(1),
      count: data.count || 0,
      value: data.value || 0
    }));
  }, [detectionStats]);

  const confidenceChartData = useMemo(() => {
    if (!detectionStats?.by_confidence && !confidenceDistribution?.by_confidence) return [];
    const source = confidenceDistribution?.by_confidence || detectionStats.by_confidence;
    return [
      { level: 'High', count: source.high || 0 },
      { level: 'Medium', count: source.medium || 0 },
      { level: 'Low', count: source.low || 0 }
    ];
  }, [detectionStats, confidenceDistribution]);

  const recoveryRatesChartData = useMemo(() => {
    if (!confidenceDistribution) return [];
    // Try different possible data structures
    const recoveryRates = confidenceDistribution.recovery_rates ||
      confidenceDistribution.recoveryRates ||
      confidenceDistribution.rates || {};

    const data = [
      { level: 'High', rate: recoveryRates.high || recoveryRates.high_confidence || 0 },
      { level: 'Medium', rate: recoveryRates.medium || recoveryRates.medium_confidence || 0 },
      { level: 'Low', rate: recoveryRates.low || recoveryRates.low_confidence || 0 }
    ];

    // Only return if at least one rate is> 0
    return data.some(d => d.rate > 0) ? data : [];
  }, [confidenceDistribution]);

  const confidenceHistogramData = useMemo(() => {
    if (!confidenceDistribution?.confidence_ranges) return [];
    return Object.entries(confidenceDistribution.confidence_ranges).map(([range, count]: [string, any]) => ({
      range,
      count: count || 0
    })).sort((a, b) => {
      // Sort by range start value
      const aStart = parseFloat(a.range.split('-')[0]);
      const bStart = parseFloat(b.range.split('-')[0]);
      return aStart - bStart;
    });
  }, [confidenceDistribution]);

  const SortIcon = React.memo(({
    field
  }: {
    field: SortField;
  }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  });
  const reportMetrics = [{
    label: 'Value in view',
    value: detectionStats?.total_value ? formatCurrency(detectionStats.total_value) : formatCurrency(keyMetrics.totalValueInView),
    note: `${filteredClaims.length} cases in the current view`,
    tone: 'text-white'
  }, {
    label: 'Cases in view',
    value: `${keyMetrics.casesInView}`,
    note: 'Tenant-scoped cases matching the active filters',
    tone: 'text-sky-200'
  }, {
    label: 'Paid back',
    value: formatCurrency(keyMetrics.confirmedRecovered),
    note: keyMetrics.paidClaims > 0 ? `${keyMetrics.paidClaims} paid cases confirmed` : 'No paid cases confirmed yet',
    tone: 'text-amber-200'
  }, {
    label: 'Detection value',
    value: detectionStats?.estimatedRecovery ? formatCurrency(detectionStats.estimatedRecovery) : '$0.00',
    note: 'Current estimated value from live detections',
    tone: 'text-white'
  }];
  const panelClass = 'rounded-2xl border border-white/10 bg-[#111111] text-white shadow-none';
  const mutedLabelClass = 'text-xs font-medium text-white/45';
  return <PageLayout title="Reports" midnight>
    <div className="relative mx-auto w-full max-w-full space-y-6 px-6 pb-10 pt-6 text-white md:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Reports</h1>
            <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-200">Live data</span>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-white/55">
            Tenant-scoped reporting for claim value, detection volume, paid recoveries, and case movement already visible in Margin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[220px] flex-1 sm:w-auto sm:flex-none">
            <Input
              placeholder="Search claims"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border-white/10 bg-white/[0.03] pl-10 text-sm text-white placeholder:text-white/30 focus:border-sky-400/35"
            />
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-xs text-white/65 hover:bg-white/5 hover:text-white" onClick={() => setQuickDateRange('30days')}>30 days</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-xs text-white/65 hover:bg-white/5 hover:text-white" onClick={() => setQuickDateRange('quarter')}>Quarter</Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-xs text-white/65 hover:bg-white/5 hover:text-white" onClick={() => setQuickDateRange('year')}>YTD</Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-10 min-w-[220px] justify-start rounded-xl border-white/10 bg-white/[0.03] text-left text-sm font-normal text-white/70 hover:bg-white/5 hover:text-white", !dateRange && "text-white/35")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-sky-200/80" />
                {dateRange?.from ? dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y") : <span>Select date range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl border border-white/10 bg-[#0f0f10] p-0 shadow-2xl" align="start">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="text-white" />
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={() => setExportOpen(true)} className="h-10 rounded-xl bg-sky-100 px-4 text-sm font-medium text-black hover:bg-sky-200">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportMetrics.map(metric => <Card key={metric.label} className={panelClass}>
            <CardContent className="space-y-3 p-5">
              <p className={mutedLabelClass}>{metric.label}</p>
              <p className={cn("text-2xl font-semibold", metric.tone)}>{metric.value}</p>
              <p className="text-sm leading-6 text-white/45">{metric.note}</p>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className={panelClass}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Claim value over time</h3>
              <p className="text-sm leading-6 text-white/50">How much case value entered the current workspace view over time.</p>
            </div>
            <div className="h-80 w-full">
              {claimsLoading ? <ChartSkeleton /> : chartData.length > 0 ? <Suspense fallback={<ChartSkeleton />}>
                  <RecoveryChart data={chartData} />
                </Suspense> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
                  No claim value is available for the current filters.
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className={panelClass}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Discrepancy type distribution</h3>
              <p className="text-sm leading-6 text-white/50">Category mix and value concentration across the currently visible claims.</p>
            </div>
            <div className="h-80 w-full">
              {anomalyTypeChartData.length > 0 ? <Suspense fallback={<ChartSkeleton />}>
                  <AnomalyTypeChart data={anomalyTypeChartData} />
                </Suspense> : <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/35">
                  We could not map category data for this view.
                </div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={panelClass}>
        <CardContent className="p-0">
          <div className="border-b border-white/8 px-6 py-5">
            <h3 className="text-base font-semibold text-white">Claim value by type</h3>
            <p className="mt-1 text-sm leading-6 text-white/50">A tenant-scoped breakdown of case volume and value for the current filters.</p>
          </div>

          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/8 hover:bg-transparent">
                <TableHead className="h-12 text-sm font-medium text-white/45">Claim type</TableHead>
                <TableHead className="h-12 text-sm font-medium text-white/45">Cases in view</TableHead>
                <TableHead className="h-12 text-sm font-medium text-white/45">Case value</TableHead>
                <TableHead className="h-12 text-sm font-medium text-white/45">% of total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const totalsByType: Record<string, {
                  count: number;
                  amount: number;
                }> = {};
                filteredClaims.forEach(c => {
                  totalsByType[c.claimType] = totalsByType[c.claimType] || {
                    count: 0,
                    amount: 0
                  };
                  totalsByType[c.claimType].count += 1;
                  totalsByType[c.claimType].amount += c.amountRecovered;
                });
                const grandTotal = Object.values(totalsByType).reduce((s, t) => s + t.amount, 0);
                const entries = Object.entries(totalsByType);
                if (entries.length === 0) {
                  return <TableRow className="border-white/8">
                      <TableCell colSpan={4} className="py-16 text-center text-sm text-white/35">
                        No claims are available for the current filters.
                      </TableCell>
                    </TableRow>;
                }
                return entries.map(([type, t]) => <TableRow key={type} className="border-white/8 hover:bg-white/[0.02]">
                    <TableCell className="text-sm text-white/80">{type}</TableCell>
                    <TableCell className="text-sm text-white/60">{t.count}</TableCell>
                    <TableCell className="text-sm font-medium text-sky-200">{formatCurrency(t.amount)}</TableCell>
                    <TableCell className="text-sm text-white/45">{grandTotal > 0 ? ((t.amount / grandTotal) * 100).toFixed(1) : '0.0'}%</TableCell>
                  </TableRow>);
              })()}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-4 border-t border-white/8 bg-white/[0.02] px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/40">Page {page} of {totalPages} • {filteredClaims.length} records in view</div>
            <div className="flex flex-wrap items-center gap-3">
              <select className="rounded-lg border border-white/10 bg-[#0f0f10] px-3 py-2 text-sm text-white/65 outline-none focus:border-sky-400/35" value={pageSize} onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}>
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
              <div className="flex gap-2">
                <Button variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.02] px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-25" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" className="h-9 rounded-lg border-white/10 bg-white/[0.02] px-3 text-sm text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-25" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Export Modal */}
    <Dialog open={exportOpen} onOpenChange={setExportOpen}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl">
        <DialogHeader>
          <div className="mb-3 flex flex-col gap-1">
            <DialogTitle className="text-xl font-semibold text-white">Export reports</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-6 text-white/50">Choose which report to export from the current tenant-scoped view.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/55">Report type</p>
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
              <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-sm text-white focus:border-sky-400/35">
                <SelectValue placeholder="Choose a report" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#111111] text-white shadow-2xl">
                <SelectItem value="recovery_payout" className="py-3 text-sm focus:bg-white/5 focus:text-sky-200">Claims Ledger CSV — Tenant-scoped case buffer</SelectItem>
                <SelectItem value="fee_dispute" className="py-3 text-sm focus:bg-white/5 focus:text-sky-200">Claim Value by Type — Current filtered buffer</SelectItem>
                <SelectItem value="evidence_log" className="py-3 text-sm focus:bg-white/5 focus:text-sky-200">Case Status Ledger — Current filtered buffer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/55">Format</p>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-sm text-white focus:border-sky-400/35">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#111111] text-white shadow-2xl">
                <SelectItem value="csv" className="py-3 text-sm focus:bg-white/5 focus:text-sky-200">Detailed CSV</SelectItem>
                <SelectItem value="pdf" className="py-3 text-sm focus:bg-white/5 focus:text-sky-200">PDF Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-8 border-t border-white/5 pt-6">
          <Button variant="ghost" onClick={() => setExportOpen(false)} className="h-11 rounded-xl px-8 text-sm text-white/55 hover:bg-white/5 hover:text-white">Cancel</Button>
          <Button onClick={exportAction} disabled={!reportType} className="h-11 rounded-xl bg-sky-100 px-8 text-sm font-medium text-black hover:bg-sky-200">Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageLayout>;
}
