import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { notify } from '@/lib/notify';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

interface ValidationDto { id: string; type: string; status: string; details?: string; createdAt: string; }
interface Validation { id: string; type: string; status: string; details?: string; createdAt: Date; }
const transform = (v: ValidationDto): Validation => ({ ...v, createdAt: new Date(v.createdAt) });

export default function Validation() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<Validation[]>({
    queryKey: ['validations'],
    queryFn: async () => (await apiRequest<ValidationDto[]>('/validations')).map(transform),
    retry: 2,
  });
  
  const evMutation = useMutation<ValidationDto, unknown, { id: string }, { previous?: Validation[] }>({
    mutationFn: async (payload: { id: string }) => apiRequest<ValidationDto>(`/validations/${payload.id}/ev`, { method: 'POST' }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['validations'] });
      const previous = queryClient.getQueryData<Validation[]>(['validations']);
      if (previous) {
        queryClient.setQueryData<Validation[]>(['validations'], previous.map(v => v.id === id ? { ...v, status: 'running' } : v));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['validations'], ctx.previous);
      notify.error('EV failed to start');
    },
    onSuccess: (dto) => {
      const updated = transform(dto);
      queryClient.setQueryData<Validation[]>(['validations'], (prev) => (prev || []).map(v => v.id === updated.id ? updated : v));
      notify.success('EV started');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['validations'] });
    }
  });

  const acgMutation = useMutation<ValidationDto, unknown, { id: string }, { previous?: Validation[] }>({
    mutationFn: async (payload: { id: string }) => apiRequest<ValidationDto>(`/validations/${payload.id}/acg`, { method: 'POST' }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['validations'] });
      const previous = queryClient.getQueryData<Validation[]>(['validations']);
      if (previous) {
        queryClient.setQueryData<Validation[]>(['validations'], previous.map(v => v.id === id ? { ...v, status: 'running' } : v));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['validations'], ctx.previous);
      notify.error('ACG failed to start');
    },
    onSuccess: (dto) => {
      const updated = transform(dto);
      queryClient.setQueryData<Validation[]>(['validations'], (prev) => (prev || []).map(v => v.id === updated.id ? updated : v));
      notify.success('ACG started');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['validations'] });
    }
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
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 text-xs border rounded" onClick={() => evMutation.mutate({ id: v.id })} disabled={evMutation.isPending}>Run EV</button>
                <button className="px-3 py-1 text-xs border rounded" onClick={() => acgMutation.mutate({ id: v.id })} disabled={acgMutation.isPending}>Run ACG</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No validations yet" description="EV/ACG results will appear here." />
      ))}
    </PageLayout>
  );
}

