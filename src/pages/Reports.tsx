import React, { useState, useMemo, Suspense, lazy, useEffect } from 'react';
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
import { CalendarIcon, Download, ArrowUpDown, ArrowUp, ArrowDown, TrendingDown, TrendingUp } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';

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
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <Tooltip 
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#172B4D'
              }}
              labelStyle={{ color: '#172B4D' }}
            />
            <Bar dataKey="value" fill="#60A5FA" radius={[4,4,0,0]} />
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
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'value') return formatCurrency(value);
                return value;
              }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#172B4D'
              }}
              labelStyle={{ color: '#172B4D' }}
            />
            <Legend 
              wrapperStyle={{ color: '#172B4D' }}
              iconType="line"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#60A5FA" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} name="Value" />
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
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="severity" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'value') return formatCurrency(value);
                return value;
              }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#172B4D'
              }}
              labelStyle={{ color: '#172B4D' }}
            />
            <Legend 
              wrapperStyle={{ color: '#172B4D' }}
              iconType="line"
            />
            <Area yAxisId="left" type="monotone" dataKey="count" stroke="#60A5FA" fill="url(#countGradient)" strokeWidth={2} name="Count" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} name="Value" />
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
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#172B4D'
                }}
                labelStyle={{ color: '#172B4D' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#60A5FA" 
                fill="url(#confidenceGradient)"
                strokeWidth={3}
                dot={{ fill: '#60A5FA', r: 5 }}
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
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="level" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <YAxis 
              tick={{ fontSize: 12, fill: '#9CA3AF' }} 
              stroke="#374151"
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip 
              formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#172B4D'
              }}
              labelStyle={{ color: '#172B4D' }}
            />
            <Legend 
              wrapperStyle={{ color: '#172B4D' }}
              iconType="line"
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
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#374151" />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#8B5CF6" 
              fill="url(#histogramGradient)"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', r: 5 }}
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
    if (exportFormat === 'csv') exportToCSV();
    if (exportFormat === 'pdf') window.print();
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
    
    // Only return if at least one rate is > 0
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
  return <PageLayout title="Reports">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-gray-50 min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-900 space-y-8">
        {/* Page Header & Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-1">Reports</h1>
            <p className="text-gray-600">Historical clarity and financial reconciliation</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Input placeholder="Search claims (ID, type, status)" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} className="pl-8 md:w-64 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500" />
              <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('quarter')}>This Quarter</Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100" onClick={() => setQuickDateRange('year')}>Year to Date</Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[280px] justify-start text-left font-medium bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100", !dateRange && "text-blue-700") }>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? dateRange.to ? <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </> : format(dateRange.from, "LLL dd, y") : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Button onClick={() => setExportOpen(true)} className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white">
              <Download className="h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        {/* Key Metrics Bar - Enhanced with Phase 3 Detection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative inline-flex items-start">
                    <p className="text-sm font-medium text-gray-600">Total Recovered</p>
                    <div className="absolute -top-0.5 left-full ml-1.5 flex items-center gap-0.5 leading-none">
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                      <span className="text-[8px] text-red-500 font-medium">8%</span>
                      <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                      <span className="text-[8px] text-green-600 font-medium">92%</span>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-400 text-lg mt-1">
                    {detectionStats?.total_value 
                      ? formatCurrency(detectionStats.total_value)
                      : keyMetrics.totalRecovered > 0 
                        ? formatCurrency(keyMetrics.totalRecovered)
                        : null
                    }
                  </p>
                  {detectionStats?.total_value && keyMetrics.totalRecovered > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(keyMetrics.totalRecovered)} from approved claims
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Claims Submitted</p>
                  <p className="font-bold text-black text-lg">
                    {detectionStats?.total_anomalies 
                      ? detectionStats.total_anomalies
                      : keyMetrics.claimsSubmitted > 0 
                        ? keyMetrics.claimsSubmitted
                        : null
                    }
                  </p>
                  {detectionStats?.total_anomalies && keyMetrics.claimsSubmitted > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      {keyMetrics.claimsSubmitted} claims filed
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="relative inline-flex items-start">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <div className="absolute -top-0.5 left-full ml-1.5 flex items-center gap-0.5 leading-none">
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                      <span className="text-[8px] text-red-500 font-medium">8%</span>
                      <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                      <span className="text-[8px] text-green-600 font-medium">92%</span>
                    </div>
                  </div>
                  <p className="font-bold text-blue-400 text-lg mt-1">
                    {keyMetrics.successRate > 0 
                      ? `${keyMetrics.successRate.toFixed(1)}%`
                      : confidenceDistribution?.average_confidence
                        ? `${(confidenceDistribution.average_confidence * 100).toFixed(1)}%`
                        : null
                    }
                  </p>
                  {confidenceDistribution?.average_confidence && keyMetrics.successRate === 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Avg confidence
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Recovery Time</p>
                  <p className="font-bold text-black text-lg">
                    {keyMetrics.avgRecoveryTime > 0 
                      ? `${keyMetrics.avgRecoveryTime} Days`
                      : null
                    }
                  </p>
                  {detectionStats?.expiring_soon !== undefined && detectionStats.expiring_soon > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      {detectionStats.expiring_soon} expiring soon
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Summary already shown above */}

        {/* Visual Breakdown: Recoveries Over Time */}
        <Card className="mb-8 bg-white border-gray-200 text-gray-900">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-black mb-4">Recoveries Over Time</h3>
            <div className="w-full h-64 gpu-accelerated">
              {claimsLoading ? (
                <ChartSkeleton />
              ) : chartData.length > 0 ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <RecoveryChart data={chartData} />
                </Suspense>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 text-sm text-center px-4">
                  {claims.length === 0
                    ? 'No recoveries recorded yet. Sync your account or file claims to populate this view.'
                    : 'No recoveries within the selected date range.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phase 3: Detection Statistics Charts */}
            {/* Anomaly Type Distribution */}
              <Card className="mb-8 bg-white border-gray-200 text-gray-900">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-black mb-4">Anomaly Type Distribution</h3>
                  <p className="text-xs text-gray-600 mb-4">Breakdown of detected anomalies by type, showing count and total value</p>
                  <div className="w-full h-80 gpu-accelerated">
              {anomalyTypeChartData.length > 0 ? (
                    <Suspense fallback={<ChartSkeleton />}>
                      <AnomalyTypeChart data={anomalyTypeChartData} />
                    </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <p>No anomaly type data available</p>
                </div>
              )}
                  </div>
                </CardContent>
              </Card>

            {/* Severity Distribution */}
        {detectionStats && severityChartData.length > 0 && (
              <Card className="mb-8 bg-white border-gray-200 text-gray-900">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-200 mb-4">Severity Distribution</h3>
                  <p className="text-xs text-gray-400 mb-4">Distribution of anomalies by severity level (high, medium, low)</p>
                  <div className="w-full h-64 gpu-accelerated">
                    <Suspense fallback={<ChartSkeleton />}>
                      <SeverityChart data={severityChartData} />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confidence Distribution */}
        {(detectionStats || confidenceDistribution) && confidenceChartData.length > 0 && (
              <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-200 mb-4">Confidence Distribution</h3>
                  <p className="text-xs text-gray-400 mb-4">Number of detections by confidence level</p>
                  <div className="w-full h-64 gpu-accelerated">
                    <Suspense fallback={<ChartSkeleton />}>
                      <ConfidenceChart data={confidenceChartData} />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recovery Rates by Confidence */}
              <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-200 mb-4">Recovery Rates by Confidence Level</h3>
                  <p className="text-xs text-gray-400 mb-4">Success rate of recovery claims based on detection confidence</p>
                  <div className="w-full h-64 gpu-accelerated">
              {recoveryRatesChartData.length > 0 ? (
                    <Suspense fallback={<ChartSkeleton />}>
                      <RecoveryRatesChart data={recoveryRatesChartData} />
                    </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <p>No recovery rate data available</p>
                </div>
              )}
                  </div>
                </CardContent>
              </Card>

            {/* Confidence Range Histogram */}
        {confidenceDistribution && confidenceHistogramData.length > 0 && (
              <Card className="mb-8 bg-white/5 border-white/10 text-gray-300">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-gray-200 mb-4">Confidence Score Distribution</h3>
                  <p className="text-xs text-gray-400 mb-4">Histogram showing distribution of confidence scores across all detections</p>
                  <div className="w-full h-64 gpu-accelerated">
                    <Suspense fallback={<ChartSkeleton />}>
                      <ConfidenceHistogram data={confidenceHistogramData} />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>
        )}

        {/* Detailed Breakdown: Recoveries by Claim Type */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Recoveries by Claim Type</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Claims Filed</TableHead>
                  <TableHead>Amount Recovered</TableHead>
                  <TableHead>% of Total</TableHead>
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
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                          No claims data available
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return entries.map(([type, t]) => (
                    <TableRow key={type}>
                      <TableCell>{type}</TableCell>
                      <TableCell>{t.count}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>
                      <TableCell>{grandTotal > 0 ? ((t.amount / grandTotal) * 100).toFixed(1) : '0.0'}%</TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-gray-400">Page {page} of {totalPages} • {filteredClaims.length} claims</div>
              <div className="flex items-center gap-3">
                <select className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
                <Button variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
      {/* Export Modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>Select what format you want to export.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Select Report Type</p>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a report to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recovery_payout">Recovery and Payout History — Master report for all financial reconciliation</SelectItem>
                  <SelectItem value="fee_dispute">Fee Dispute History — Value recovered from fee overcharges</SelectItem>
                  <SelectItem value="evidence_log">Evidence Locker Log — Inventory of all uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Detailed CSV</SelectItem>
                <SelectItem value="pdf">PDF Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={exportAction} disabled={!reportType}>Generate & Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>;
}