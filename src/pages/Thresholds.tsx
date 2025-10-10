import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/lib/automationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useStatusStream } from '@/hooks/use-status-stream';

const Thresholds: React.FC = () => {
  const queryClient = useQueryClient();
  const thresholdsQuery = useQuery({
    queryKey: ['thresholds'],
    queryFn: () => automationApi.getThresholds(),
  });

  const [local, setLocal] = React.useState<Record<string, any>>({});
  React.useEffect(() => {
    if (thresholdsQuery.data) setLocal(thresholdsQuery.data as any);
  }, [thresholdsQuery.data]);

  const save = useMutation({
    mutationFn: (body: any) => automationApi.setThresholds(body),
    onSuccess: () => {
      toast({ title: 'Thresholds updated' });
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update thresholds', description: String(err?.message || err) });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(local);
  };

  useStatusStream((evt) => {
    if (evt.type === 'detection' && evt.status === 'complete') {
      queryClient.invalidateQueries({ queryKey: ['thresholds'] });
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Detection Thresholds</h1>
        <p className="text-sm text-gray-600">Tune automation sensitivity and minimum amounts.</p>
      </div>

      {thresholdsQuery.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {thresholdsQuery.isError && <div className="text-sm text-red-600">Failed to load thresholds</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Detection Sensitivity</label>
          <Input type="number" step="0.01" min="0" max="1" value={local.detectionSensitivity ?? ''} onChange={(e) => setLocal({ ...local, detectionSensitivity: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Minimum Claim Amount ($)</label>
          <Input type="number" step="1" min="0" value={local.minClaimAmount ?? ''} onChange={(e) => setLocal({ ...local, minClaimAmount: parseInt(e.target.value || '0', 10) })} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={save.isPending}>Save Thresholds</Button>
        </div>
      </form>
    </div>
  );
};

export default Thresholds;

