import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/lib/automationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useStatusStream } from '@/hooks/use-status-stream';

const Whitelist: React.FC = () => {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: ['whitelist'],
    queryFn: () => automationApi.getWhitelist(),
  });

  const [items, setItems] = React.useState<string[]>([]);
  const [newItem, setNewItem] = React.useState<string>('');
  React.useEffect(() => {
    if (Array.isArray(listQuery.data)) setItems(listQuery.data as any);
  }, [listQuery.data]);

  const save = useMutation({
    mutationFn: (body: any) => automationApi.updateWhitelist(body),
    onSuccess: () => {
      toast({ title: 'Whitelist updated' });
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to update whitelist', description: String(err?.message || err) });
    },
  });

  const handleAdd = () => {
    const v = newItem.trim();
    if (!v) return;
    if (items.includes(v)) {
      toast({ title: 'Already added' });
      return;
    }
    const next = [v, ...items];
    setItems(next);
    setNewItem('');
    save.mutate(next);
  };

  const handleRemove = (value: string) => {
    const next = items.filter((x) => x !== value);
    setItems(next);
    save.mutate(next);
  };

  useStatusStream((evt) => {
    if (evt.type === 'detection' && evt.status === 'complete') {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Whitelist</h1>
        <p className="text-sm text-gray-600">Manage SKUs, ASINs, or terms to exclude from automation.</p>
      </div>

      <div className="flex gap-2 max-w-xl">
        <Input placeholder="Enter SKU/ASIN/value" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">Add</Button>
      </div>

      {listQuery.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {listQuery.isError && <div className="text-sm text-red-600">Failed to load whitelist</div>}

      <div className="border border-gray-200 rounded-lg overflow-hidden max-w-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left font-medium px-4 py-2">Value</th>
              <th className="text-left font-medium px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v} className="border-t border-gray-200">
                <td className="px-4 py-2">{v}</td>
                <td className="px-4 py-2">
                  <Button variant="outline" className="bg-gray-100 border-0" onClick={() => handleRemove(v)}>Remove</Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-600" colSpan={2}>No items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Whitelist;

