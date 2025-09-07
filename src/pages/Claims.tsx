import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/notify';

interface ClaimDto { id: string; title: string; status: string; createdAt: string; }
interface Claim { id: string; title: string; status: string; createdAt: Date; }
interface ClaimForm { title: string; }

function transform(c: ClaimDto): Claim {
  return { ...c, createdAt: new Date(c.createdAt) };
}

export default function Claims() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<ClaimForm>({ title: '' });
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => (await apiRequest<ClaimDto[]>('/claims', {}, { retries: 2 })).map(transform),
  });

  const submitClaim = useMutation<ClaimDto, any, ClaimForm, { previous?: Claim[] }>({
    mutationFn: async (payload) => apiRequest<ClaimDto>('/claims', { method: 'POST', body: JSON.stringify(payload) }),
    onMutate: async (payload) => {
      setFieldError(null);
      await queryClient.cancelQueries({ queryKey: ['claims'] });
      const previous = queryClient.getQueryData<Claim[]>(['claims']);
      if (previous) {
        const optimistic: Claim = { id: `tmp-${Date.now()}`, title: payload.title, status: 'pending', createdAt: new Date() };
        queryClient.setQueryData<Claim[]>(['claims'], [optimistic, ...previous]);
      }
      return { previous };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['claims'], ctx.previous);
      // inline field-level error if provided
      const msg = err?.details?.errors?.title || err?.message || 'Failed to submit claim';
      setFieldError(typeof msg === 'string' ? msg : 'Invalid input');
    },
    onSuccess: (dto) => {
      const created = transform(dto);
      queryClient.setQueryData<Claim[]>(['claims'], (prev) => [created, ...(prev || []).filter(c => !String(c.id).startsWith('tmp-'))]);
      setForm({ title: '' });
      notify.success('Claim submitted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });

  const resolveClaim = useMutation<ClaimDto, any, { id: string }, { previous?: Claim[] }>({
    mutationFn: async ({ id }) => apiRequest<ClaimDto>(`/claims/${id}/resolve`, { method: 'POST' }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['claims'] });
      const previous = queryClient.getQueryData<Claim[]>(['claims']);
      if (previous) {
        queryClient.setQueryData<Claim[]>(['claims'], previous.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['claims'], ctx.previous);
      notify.error('Failed to resolve');
    },
    onSuccess: (dto) => {
      const updated = transform(dto);
      queryClient.setQueryData<Claim[]>(['claims'], (prev) => (prev || []).map(c => c.id === updated.id ? updated : c));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });

  return (
    <PageLayout title="Claims">
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {!isLoading && isError && <ErrorState message="Failed to load claims" onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <div className="space-y-4">
          <form className="border rounded-lg p-4 bg-card" onSubmit={(e) => { e.preventDefault(); submitClaim.mutate(form); }}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Input placeholder="New claim title" value={form.title} onChange={(e) => setForm({ title: e.target.value })} />
                {fieldError && <div className="text-xs text-red-600 mt-1">{fieldError}</div>}
              </div>
              <Button type="submit" disabled={!form.title || submitClaim.isPending}>Submit</Button>
            </div>
          </form>
          {data?.length ? (
        <div className="grid grid-cols-1 gap-3">
          {data!.map((c) => (
            <div key={c.id} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.status} • {c.createdAt.toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Open</Button>
                  {c.status !== 'resolved' && (
                    <Button variant="secondary" size="sm" onClick={() => resolveClaim.mutate({ id: c.id })} disabled={resolveClaim.isPending}>Resolve</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          ) : (
            <EmptyState title="No claims yet" description="Create a claim to get started." />
          )}
        </div>
      )}
    </PageLayout>
  );
}

