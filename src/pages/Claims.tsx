import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';

interface ClaimDto { id: string; title: string; status: string; createdAt: string; }
interface Claim { id: string; title: string; status: string; createdAt: Date; }

function transform(c: ClaimDto): Claim {
  return { ...c, createdAt: new Date(c.createdAt) };
}

export default function Claims() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => (await apiRequest<ClaimDto[]>('/claims')).map(transform),
  });

  return (
    <PageLayout title="Claims">
      {isLoading && <div className="text-sm text-muted-foreground">Loading claims...</div>}
      {!isLoading && isError && <ErrorState message="Failed to load claims" onRetry={() => refetch()} />}
      {!isLoading && !isError && (data?.length ? (
        <div className="grid grid-cols-1 gap-3">
          {data!.map((c) => (
            <div key={c.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.status} • {c.createdAt.toLocaleString()}</div>
                </div>
                <Button variant="outline" size="sm">Open</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No claims yet" description="Create a claim to get started." actionLabel="New Claim" onAction={() => {}} />
      ))}
    </PageLayout>
  );
}

