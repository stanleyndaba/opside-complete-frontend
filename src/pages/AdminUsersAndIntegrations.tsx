import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import AdminOnly from '@/components/routes/AdminOnly';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';

interface UserRow { id: string; email: string; role: 'user' | 'admin'; status: 'active' | 'locked'; }
interface ProviderStatus { connected: boolean; lastSync?: string; tokenAgeDays?: number; }

export default function AdminUsersAndIntegrations() {
  // Users - demo data until backend endpoint exists
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState('');

  // Integrations summary
  const [status, setStatus] = useState<any>(null);
  const [autoCollect, setAutoCollect] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<string>('daily 02:00 UTC');

  useEffect(() => {
    // Seed demo users if none
    setUsers([
      { id: 'u1', email: 'founder@getclario.com', role: 'admin', status: 'active' },
      { id: 'u2', email: 'ops@getclario.com', role: 'user', status: 'active' },
      { id: 'u3', email: 'analyst@getclario.com', role: 'user', status: 'locked' },
    ]);

    (async () => {
      const s = await api.getIntegrationsStatus();
      if (s.ok) setStatus(s.data);
      const es = await api.getEvidenceSummary();
      if (es.ok && es.data) {
        if (typeof (es.data as any).autoCollect === 'boolean') setAutoCollect((es.data as any).autoCollect);
        if (typeof (es.data as any).schedule === 'string') setSchedule((es.data as any).schedule);
      }
    })();
  }, []);

  const filtered = useMemo(() => users.filter(u => u.email.toLowerCase().includes(filter.toLowerCase())), [users, filter]);

  const updateUser = (id: string, updater: Partial<UserRow>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updater } : u));
  };

  const reconnect = async (provider: string) => {
    window.location.href = `/integrations/reconnect/${provider}`;
  };

  const provider = (name: string): ProviderStatus => {
    const p = status?.providerIngest?.[name];
    return {
      connected: !!p?.connected,
      lastSync: p?.lastSync || p?.last_synced_at || undefined,
      tokenAgeDays: p?.tokenAgeDays || undefined,
    };
  };

  return (
    <AdminOnly>
      <PageLayout title="Admin · Users & Integrations" forceTransparent midnight>
        <div className="relative -m-4 lg:-m-6 min-h-screen">
          <div className="container mx-auto px-6 md:px-10 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl text-gray-300">
                <CardHeader>
                  <CardTitle className="text-gray-100">Users & Access</CardTitle>
                  <CardDescription>Manage roles and lock or impersonate users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userFilter">Search users</Label>
                    <Input id="userFilter" variant="dark" placeholder="email@company.com" value={filter} onChange={e => setFilter(e.target.value)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-gray-400 border-b border-white/10">
                        <tr>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Role</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(u => (
                          <tr key={u.id} className="border-b border-white/5">
                            <td className="py-2 pr-4 text-gray-200">{u.email}</td>
                            <td className="py-2 pr-4">
                              <select className="bg-white/5 border-white/10 text-gray-100 rounded px-2 py-1" value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as any })}>
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{u.status}</span>
                            </td>
                            <td className="py-2 flex gap-2">
                              <Button size="sm" variant="outline" className="bg-white/5 text-gray-100 border-white/10">Impersonate</Button>
                              <Button size="sm" className="bg-white/10 text-gray-100 border border-white/10">{u.status === 'active' ? 'Lock' : 'Unlock'}</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-xl border-white/10 rounded-2xl text-gray-300">
                <CardHeader>
                  <CardTitle className="text-gray-100">Evidence & Integrations</CardTitle>
                  <CardDescription>Connection status and ingestion settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {['gmail','outlook','gdrive','dropbox'].map(p => {
                      const ps = provider(p);
                      return (
                        <div key={p} className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-100 font-medium">{p}</div>
                            <span className={`text-xs px-2 py-0.5 rounded ${ps.connected ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{ps.connected ? 'connected' : 'disconnected'}</span>
                          </div>
                          <div className="text-gray-400 text-xs mt-1">Last sync: {ps.lastSync || '—'}</div>
                          <div className="text-gray-400 text-xs">Token age: {ps.tokenAgeDays ?? '—'} days</div>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" className="bg-white/10 text-gray-100 border border-white/10" onClick={() => reconnect(p)}>Reconnect</Button>
                            <Button size="sm" variant="outline" className="bg-white/5 text-gray-100 border-white/10" onClick={async () => { await api.disconnectIntegration(p, true); window.location.reload(); }}>Disconnect & purge</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-100">Auto-collect evidence</div>
                        <div className="text-gray-400 text-xs">Read-only ingestion from email and drives.</div>
                      </div>
                      <Switch checked={autoCollect} onCheckedChange={async (v) => { setAutoCollect(v); await api.setEvidenceAutoCollect(v); }} />
                    </div>
                    <div>
                      <Label htmlFor="sched">Schedule</Label>
                      <Input id="sched" variant="dark" value={schedule} onChange={e => setSchedule(e.target.value)} onBlur={async () => { await api.setEvidenceSchedule(schedule); }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}
