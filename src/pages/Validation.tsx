import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

interface ValidationDto { id: string; type: string; status: string; details?: string; createdAt: string; }
interface Validation { id: string; type: string; status: string; details?: string; createdAt: Date; }
const transform = (v: ValidationDto): Validation => ({ ...v, createdAt: new Date(v.createdAt) });

export default function Validation() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['validations'],
    queryFn: async () => (await apiRequest<ValidationDto[]>('/validations')).map(transform),
  });
  return (
    <PageLayout title="Validation (EV / ACG)">
      {isLoading && <div className="text-sm text-muted-foreground">Loading validations...</div>}
      {!isLoading && isError && <ErrorState message="Failed to load validations" onRetry={() => refetch()} />}
      {!isLoading && !isError && (data?.length ? (
        <div className="space-y-3">
          {data!.map(v => (
            <div key={v.id} className="border rounded-lg p-4 bg-card">
              <div className="font-medium">{v.type}</div>
              <div className="text-xs text-muted-foreground">{v.status} • {v.createdAt.toLocaleString()}</div>
              {v.details && <div className="text-sm mt-2">{v.details}</div>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No validations yet" description="EV/ACG results will appear here." />
      ))}
    </PageLayout>
  );
}

