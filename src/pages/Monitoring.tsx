import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricDto { id: string; name: string; value: number; updatedAt: string; }
interface Metric { id: string; name: string; value: number; updatedAt: Date; }
const transform = (m: MetricDto): Metric => ({ ...m, updatedAt: new Date(m.updatedAt) });

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
          {data!.map(m => (
            <div key={m.id} className="border rounded-lg p-4 bg-card">
              <div className="text-sm text-muted-foreground">{m.name}</div>
              <div className="text-2xl font-semibold">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">Updated {m.updatedAt.toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No metrics available" description="Monitoring metrics will appear here." />
      ))}
    </PageLayout>
  );
}

