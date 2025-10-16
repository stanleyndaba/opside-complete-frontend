import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkline } from '@/components/stocks/Sparkline';

interface MetricDto { id: string; name: string; value: number; updatedAt: string; history?: number[]; }
interface Metric { id: string; name: string; value: number; updatedAt: Date; history?: number[]; }
const transform = (m: MetricDto): Metric => ({ ...m, updatedAt: new Date(m.updatedAt), history: m.history });

export default function Monitoring() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['monitoring'],
    queryFn: async () => (await apiRequest<MetricDto[]>('/monitoring/metrics')).map(transform),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  return (
    <PageLayout title="Monitoring">
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {!isLoading && isError && <ErrorState message="Failed to load metrics" onRetry={() => refetch()} />}
      {!isLoading && !isError && (data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data!.map(m => {
            const history = (m.history && m.history.length > 0) ? m.history : [m.value - 2, m.value - 1, m.value, m.value + 1, m.value];
            const isAnomaly = history.length >= 2 && Math.abs(history[history.length - 1] - history[history.length - 2]) > (Math.max(...history) * 0.2);
            return (
              <div key={m.id} className={`border rounded-lg p-4 bg-card ${isAnomaly ? 'ring-2 ring-red-300' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{m.name}</div>
                  {isAnomaly && <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800">Anomaly</span>}
                </div>
                <div className="text-2xl font-semibold">{m.value}</div>
                <div className="h-16 mt-2">
                  <Sparkline data={history} color={isAnomaly ? 'rgb(220, 38, 38)' : 'rgb(16, 185, 129)'} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Updated {m.updatedAt.toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No metrics available" description="Monitoring metrics will appear here." />
      ))}
    </PageLayout>
  );
}

