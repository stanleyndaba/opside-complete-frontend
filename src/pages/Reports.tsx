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
            <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.8} />
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
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
              wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#10B981" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Value" />
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
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
              wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#10B981" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} name="Value" />
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
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
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
                stroke="#10B981"
                fill="url(#confidenceGradient)"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
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
              wrapperStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#10B981"
              fill="url(#recoveryGradient)"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 5 }}
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
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
              stroke="#10B981"
              fill="url(#histogramGradient)"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 5 }}
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
    if (event.eventType === 'detection.created') {
      setClaimsLoading(true);
      recoveryApi.getRecoveries()
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
      detectionApi.getDetectionStatistics().then((res) => {
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
  }, tenantSlug);

  // Fetch Phase 3 detection statistics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      try {
        const [statsRes, distRes] = await Promise.all([
          detectionApi.getDetectionStatistics().catch(() => ({ ok: false, data: null })),
          detectionApi.getConfidenceDistribution().catch(() => ({ ok: false, data: null })),
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setClaimsLoading(true);
      try {
        const recoveries = await recoveryApi.getRecoveries();
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
  }, []);

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
    const totalRecovered = filteredClaims.reduce((sum, claim) => sum + claim.amountRecovered, 0);
    const claimsSubmitted = filteredClaims.length;
    const paidClaims = filteredClaims.filter(claim => claim.status === 'Paid').length;
    const successRate = claimsSubmitted > 0 ? paidClaims / claimsSubmitted * 100 : 0;

    // Calculate average recovery time (for paid claims only)
    const paidClaimsWithDates = filteredClaims.filter(claim => claim.status === 'Paid' && claim.payoutDate);
    const avgRecoveryTime = paidClaimsWithDates.length > 0 ? paidClaimsWithDates.reduce((sum, claim) => {
      const created = new Date(claim.dateCreated);
      const paid = new Date(claim.payoutDate!);
      return sum + Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    }, 0) / paidClaimsWithDates.length : 0;
    return {
      totalRecovered,
      claimsSubmitted,
      successRate,
      avgRecoveryTime: Math.round(avgRecoveryTime)
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
    const headers = ['Claim ID', 'Date Created', 'Claim Type', 'Status', 'Amount Recovered', 'Payout Date'];
    const csvContent = [headers.join(','), ...filteredClaims.map(claim => [claim.id, claim.dateCreated, claim.claimType, claim.status, claim.amountRecovered, claim.payoutDate || ''].join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const filename = reportType === 'fee_dispute' ? 'fee-dispute-history.csv' : reportType === 'evidence_log' ? 'evidence-locker-log.csv' : 'recovery-payout-history.csv';
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
        description: "Report exported as CSV",
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
      const rawDate = claim.payoutDate || claim.dateCreated;
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
  return <PageLayout title="Reports" midnight>
    {/* Background Matrix Pattern / Noise */}
    <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

    {/* Beta Blur Overlay */}
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-emerald-500 uppercase tracking-[0.3em]">Coming Soon</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-white tracking-tighter">Beta Roll Out Soon</h2>
        <p className="text-white/40 font-serif italic text-lg max-w-md mx-auto">Advanced analytics and reporting features are currently in development.</p>
      </div>
    </div>

    <div className="relative w-full max-w-full mx-auto px-8 pb-10 text-white space-y-8 pt-8 blur-[6px] select-none">
      {/* Page Header & Controls */}
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[10px] font-mono font-bold text-emerald-500/50 tracking-[0.3em] uppercase">PERFORMANCE_ANALYTICS</span>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-serif font-medium text-white tracking-tight uppercase italic">Reports</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-tighter">BETA</span>
              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] font-mono text-white/30 uppercase tracking-widest leading-relaxed">Financial analytics and recovery performance insights</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative group">
            <Input
              placeholder="SEARCH_CLAIMS..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 md:w-56 border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 text-[10px] font-mono h-9 uppercase tracking-widest rounded-xl focus:border-emerald-500/30 transition-all font-bold"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl">
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest h-7 px-3" onClick={() => setQuickDateRange('30days')}>30D</Button>
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest h-7 px-3" onClick={() => setQuickDateRange('quarter')}>QTR</Button>
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest h-7 px-3" onClick={() => setQuickDateRange('year')}>YTD</Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("min-w-[240px] justify-start text-left font-mono text-[10px] bg-white/[0.03] text-white/60 border-white/10 hover:bg-white/5 hover:text-white rounded-xl h-9 uppercase tracking-widest font-bold", !dateRange && "text-white/20")}>
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500/50" />
                {dateRange?.from ? dateRange.to ? <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </> : format(dateRange.from, "LLL dd, y") : <span>PICK_DATE_RANGE</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-2xl" align="start">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="text-white" />
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={() => setExportOpen(true)} className="gap-2 bg-white text-black hover:bg-emerald-500 hover:text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold h-9 px-5 rounded-xl transition-all shadow-lg">
            <Download className="h-4 w-4" /> EXPORT_MATRIX
          </Button>
        </div>
      </div>

      {/* Key Metrics Bar - Matrix Instrumentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'TOTAL_RECOVERED',
            value: detectionStats?.total_value ? formatCurrency(detectionStats.total_value) : formatCurrency(keyMetrics.totalRecovered),
            subtitle: `FROM_${filteredClaims.length}_CLAIMS`,
            trend: '+12.4%',
            color: 'text-emerald-500'
          },
          {
            label: 'SUCCESS_RATE',
            value: `${keyMetrics.successRate.toFixed(1)}%`,
            subtitle: 'AUDIT_EFFICIENCY',
            trend: 'STABLE',
            color: 'text-blue-500'
          },
          {
            label: 'EST_RECOVERY',
            value: detectionStats?.estimatedRecovery ? formatCurrency(detectionStats.estimatedRecovery) : '$0.00',
            subtitle: 'PREDICTED_REVENUE',
            trend: 'ACTIVE',
            color: 'text-emerald-500'
          },
          {
            label: 'AVG_REC_TIME',
            value: `${keyMetrics.avgRecoveryTime}D`,
            subtitle: 'CYCLE_VELOCITY',
            trend: '-2.1D',
            color: 'text-white'
          }
        ].map((metric, idx) => (
          <Card key={idx} className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all hover:border-emerald-500/30">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-emerald-500/30 rounded-tl-lg" />
            <CardContent className="p-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-500/50" />
                    <span className="text-[10px] font-mono font-bold text-white/30 tracking-widest uppercase">{metric.label}</span>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-emerald-500/40 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase tracking-tighter">{metric.trend}</span>
                </div>
                <p className={cn("text-2xl font-mono font-bold tracking-tighter", metric.color)}>{metric.value}</p>
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{metric.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-emerald-500/30 rounded-tl-xl" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-serif italic text-white mb-1 uppercase tracking-tight">Recoveries Over Time</h3>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Time-series financial reconciliation analysis</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500/40 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="w-full h-80 gpu-accelerated">
              {claimsLoading ? (
                <ChartSkeleton />
              ) : chartData.length > 0 ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <RecoveryChart data={chartData} />
                </Suspense>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] border border-white/10 px-4 py-2 rounded-full">NO_RECOVERY_DATA_AVAILABLE</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-emerald-500/30 rounded-tl-xl" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-serif italic text-white mb-1 uppercase tracking-tight">Confidence Score</h3>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Score distribution histogram</p>
              </div>
            </div>
            <div className="w-full h-80 gpu-accelerated">
              {confidenceHistogramData.length > 0 ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <ConfidenceHistogram data={confidenceHistogramData} />
                </Suspense>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">EMPTY_DATA_SET</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-emerald-500/30 rounded-tl-lg" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-serif italic text-white mb-1 uppercase tracking-tight">Discrepancy Type Distribution</h3>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Breakdown by category and total value</p>
              </div>
            </div>
            <div className="w-full h-80 gpu-accelerated">
              {anomalyTypeChartData.length > 0 ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <AnomalyTypeChart data={anomalyTypeChartData} />
                </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <p className="text-[10px] font-mono uppercase tracking-widest">UNABLE_TO_MAP_CATEGORY_DATA</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-emerald-500/30 rounded-tl-lg" />
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-serif italic text-white mb-1 uppercase tracking-tight">Recovery Rates by Confidence</h3>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Success probability analysis</p>
              </div>
            </div>
            <div className="w-full h-80 gpu-accelerated">
              {recoveryRatesChartData.length > 0 ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <RecoveryRatesChart data={recoveryRatesChartData} />
                </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <p className="text-[10px] font-mono uppercase tracking-widest">PROBABILITY_MATRIX_EMPTY</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table Section */}
      <Card className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl relative group overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-emerald-500/30 rounded-tl-lg" />
        <CardContent className="p-0">
          <div className="p-8 border-b border-white/5">
            <h3 className="text-sm font-serif italic text-white mb-1 uppercase tracking-tight">Detailed Breakdown: Recoveries by Claim Type</h3>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Full audit ledger of financial discrepancies</p>
          </div>
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40 font-mono text-[10px] uppercase tracking-widest h-12">Claim Type</TableHead>
                <TableHead className="text-white/40 font-mono text-[10px] uppercase tracking-widest h-12">Claims Filed</TableHead>
                <TableHead className="text-white/40 font-mono text-[10px] uppercase tracking-widest h-12">Amount Recovered</TableHead>
                <TableHead className="text-white/40 font-mono text-[10px] uppercase tracking-widest h-12">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const totalsByType: Record<string, { count: number; amount: number }> = {};
                filteredClaims.forEach(c => {
                  totalsByType[c.claimType] = totalsByType[c.claimType] || { count: 0, amount: 0 };
                  totalsByType[c.claimType].count += 1;
                  totalsByType[c.claimType].amount += c.amountRecovered;
                });
                const grandTotal = Object.values(totalsByType).reduce((s, t) => s + t.amount, 0);
                const entries = Object.entries(totalsByType);

                if (entries.length === 0) {
                  return (
                    <TableRow className="border-white/5">
                      <TableCell colSpan={4} className="text-center text-white/10 py-16 font-mono text-[10px] uppercase tracking-widest">
                        NO_CLAIMS_DATA_IN_CURRENT_BUFFER
                      </TableCell>
                    </TableRow>
                  );
                }

                return entries.map(([type, t]) => (
                  <TableRow key={type} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-mono text-[11px] uppercase tracking-wider text-white/80">{type}</TableCell>
                    <TableCell className="font-mono text-[11px] text-white/60">{t.count}</TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-emerald-500">{formatCurrency(t.amount)}</TableCell>
                    <TableCell className="font-mono text-[10px] text-white/40 bg-white/[0.01]">{grandTotal > 0 ? ((t.amount / grandTotal) * 100).toFixed(1) : '0.0'}%</TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
          <div className="p-6 flex items-center justify-between border-t border-white/5 bg-white/[0.01]">
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Page {page} of {totalPages} • {filteredClaims.length} records in buffer</div>
            <div className="flex items-center gap-4">
              <select className="bg-[#0c0c0c] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white/60 focus:border-emerald-500/30 outline-none" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>BUFFER_SZ: 10</option>
                <option value={25}>BUFFER_SZ: 25</option>
                <option value={50}>BUFFER_SZ: 50</option>
              </select>
              <div className="flex gap-2">
                <Button variant="outline" className="h-8 border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-20 rounded-lg text-[9px] font-mono uppercase tracking-widest" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>PREV_NODE</Button>
                <Button variant="outline" className="h-8 border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-20 rounded-lg text-[9px] font-mono uppercase tracking-widest" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>NEXT_NODE</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Export Modal */}
    <Dialog open={exportOpen} onOpenChange={setExportOpen}>
      <DialogContent className="bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-2xl text-white max-w-lg">
        <DialogHeader>
          <div className="flex flex-col gap-1 mb-4">
            <span className="text-[10px] font-mono font-bold text-emerald-500/50 tracking-[0.3em] uppercase">SYSTEM_EXPORT</span>
            <DialogTitle className="text-xl font-serif italic text-white uppercase tracking-tight">EXPORT_PERFORMANCE_DATA</DialogTitle>
          </div>
          <DialogDescription className="text-white/40 font-mono text-[10px] uppercase tracking-widest leading-relaxed">Select output format and report type for financial compilation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <p className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">Report Type</p>
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
              <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-white font-mono text-[11px] h-11 uppercase tracking-wider rounded-xl focus:border-emerald-500/30">
                <SelectValue placeholder="CHOOSE_AUDIT_REPORT" />
              </SelectTrigger>
              <SelectContent className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl rounded-xl">
                <SelectItem value="recovery_payout" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 py-3">Recovery and Payout History — Master report</SelectItem>
                <SelectItem value="fee_dispute" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 py-3">Fee Dispute History — Value recovered</SelectItem>
                <SelectItem value="evidence_log" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 py-3">Evidence Locker Log — Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">Format</p>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-white font-mono text-[11px] h-11 uppercase tracking-wider rounded-xl focus:border-emerald-500/30">
                <SelectValue placeholder="SELECT_OUTPUT_FORMAT" />
              </SelectTrigger>
              <SelectContent className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-3xl rounded-xl">
                <SelectItem value="csv" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 py-3">Detailed CSV</SelectItem>
                <SelectItem value="pdf" className="font-mono text-[10px] uppercase tracking-widest focus:bg-white/5 focus:text-emerald-500 py-3">PDF Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="mt-8 border-t border-white/5 pt-6">
          <Button variant="ghost" onClick={() => setExportOpen(false)} className="text-white/40 hover:text-white hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all h-11 px-8">ABORT</Button>
          <Button onClick={exportAction} disabled={!reportType} className="bg-white text-black hover:bg-emerald-500 hover:text-black font-mono text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all h-11 px-10 shadow-lg">COMPILE & DOWNLOAD</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageLayout>;
}
