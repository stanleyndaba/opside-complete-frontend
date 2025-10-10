import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/lib/automationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useStatusStream } from '@/hooks/use-status-stream';

type RuleDraft = {
  name: string;
  condition: string;
  action: string;
};

const AutomationRules: React.FC = () => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = React.useState<RuleDraft>({ name: '', condition: '', action: '' });

  const rulesQuery = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => automationApi.listRules(),
  });

  const createRule = useMutation({
    mutationFn: (body: any) => automationApi.createRule(body),
    onSuccess: () => {
      toast({ title: 'Rule created' });
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setDraft({ name: '', condition: '', action: '' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create rule', description: String(err?.message || err) });
    },
  });

  useStatusStream((evt) => {
    if (evt.type === 'detection' && evt.status === 'complete') {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      toast({ title: 'Name is required' });
      return;
    }
    createRule.mutate({ ...draft });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Automation Rules</h1>
        <p className="text-sm text-gray-600">Create and manage rules that automate actions.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">Name</label>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="High value claim auto-submit" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <label className="text-sm font-medium text-gray-900">Condition</label>
          <Input value={draft.condition} onChange={(e) => setDraft({ ...draft, condition: e.target.value })} placeholder="amount >= 100" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <label className="text-sm font-medium text-gray-900">Action</label>
          <Input value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} placeholder="submit_claim" />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm font-medium text-gray-900">Notes (optional)</label>
          <Textarea placeholder="Optional notes" className="mt-2" />
        </div>
        <div className="md:col-span-3">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={createRule.isPending}>Create Rule</Button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-black">Existing Rules</h2>
        {rulesQuery.isLoading && <div className="text-sm text-gray-600">Loading rules…</div>}
        {rulesQuery.isError && <div className="text-sm text-red-600">Failed to load rules</div>}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left font-medium px-4 py-2">Name</th>
                <th className="text-left font-medium px-4 py-2">Condition</th>
                <th className="text-left font-medium px-4 py-2">Action</th>
                <th className="text-left font-medium px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(rulesQuery.data) ? rulesQuery.data : []).map((r: any) => (
                <tr key={r.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.condition}</td>
                  <td className="px-4 py-2">{r.action}</td>
                  <td className="px-4 py-2 text-gray-600">{r.createdAt || '-'}</td>
                </tr>
              ))}
              {Array.isArray(rulesQuery.data) && rulesQuery.data.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-600" colSpan={4}>No rules yet. Create your first rule above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutomationRules;

