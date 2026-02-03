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
  // Users - fetched from backend
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Integrations summary
  const [status, setStatus] = useState<{
    providerIngest?: Record<string, { connected?: boolean; lastSync?: string; last_synced_at?: string; tokenAgeDays?: number }>;
  } | null>(null);
  const [autoCollect, setAutoCollect] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<string>('daily 02:00 UTC');

  useEffect(() => {
    // Fetch users from backend
    (async () => {
      setUsersLoading(true);
      try {
        const usersRes = await api.getAdminUsers();
        if (usersRes.ok && usersRes.data?.users) {
          setUsers(usersRes.data.users);
        } else {
          // Fallback to demo data if backend not available
          setUsers([
            { id: 'u1', email: 'founder@margin.io', role: 'admin', status: 'active' },
            { id: 'u2', email: 'ops@margin.io', role: 'user', status: 'active' },
            { id: 'u3', email: 'analyst@margin.io', role: 'user', status: 'locked' },
          ]);
        }
      } catch {
        // Fallback to demo data
        setUsers([
          { id: 'u1', email: 'founder@margin.io', role: 'admin', status: 'active' },
          { id: 'u2', email: 'ops@margin.io', role: 'user', status: 'active' },
          { id: 'u3', email: 'analyst@margin.io', role: 'user', status: 'locked' },
        ]);
      } finally {
        setUsersLoading(false);
      }
    })();

    (async () => {
      const s = await api.getIntegrationsStatus();
      if (s.ok) setStatus(s.data);
      const es = await api.getEvidenceSummary();
      if (es.ok && es.data) {
        const data = es.data as { autoCollect?: boolean; schedule?: string };
        if (typeof data.autoCollect === 'boolean') setAutoCollect(data.autoCollect);
        if (typeof data.schedule === 'string') setSchedule(data.schedule);
      }
    })();
  }, []);

  const filtered = useMemo(() => users.filter(u => u.email.toLowerCase().includes(filter.toLowerCase())), [users, filter]);

  const updateUser = async (id: string, updates: Partial<UserRow>) => {
    // Optimistically update UI
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    // Call backend
    await api.updateAdminUser(id, updates);
  };

  const toggleUserStatus = async (user: UserRow) => {
    const newStatus = user.status === 'active' ? 'locked' : 'active';
    await updateUser(user.id, { status: newStatus });
  };

  const handleImpersonate = async (userId: string) => {
    const res = await api.impersonateUser(userId);
    if (res.ok && res.data?.message) {
      alert(res.data.message);
    }
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
      <PageLayout title="Admin · Users & Integrations">
        <div className="relative -m-4 lg:-m-6 min-h-screen bg-gray-50">
          <div className="container mx-auto px-6 md:px-10 lg:px-12 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-normal text-gray-700">Users and Access</CardTitle>
                  <CardDescription className="text-gray-500">Manage roles and lock or impersonate users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="userFilter" className="text-gray-600">Search users</Label>
                    <Input id="userFilter" placeholder="email@company.com" value={filter} onChange={e => setFilter(e.target.value)} className="bg-white border-gray-200 text-gray-700" />
                  </div>
                  {usersLoading ? (
                    <div className="py-8 text-center text-gray-500">Loading users...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="py-2 pr-4 font-normal">Email</th>
                            <th className="py-2 pr-4 font-normal">Role</th>
                            <th className="py-2 pr-4 font-normal">Status</th>
                            <th className="py-2 font-normal">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(u => (
                            <tr key={u.id} className="border-b border-gray-100">
                              <td className="py-2 pr-4 text-gray-600">{u.email}</td>
                              <td className="py-2 pr-4">
                                <select className="bg-white border-gray-200 text-gray-700 rounded px-2 py-1 text-sm" value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as UserRow['role'] })}>
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="py-2 pr-4">
                                <span className={`px-2 py-0.5 rounded text-xs ${u.status === 'active' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>{u.status}</span>
                              </td>
                              <td className="py-2 flex gap-2">
                                <Button size="sm" variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={() => handleImpersonate(u.id)}>Impersonate</Button>
                                <Button size="sm" className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200" onClick={() => toggleUserStatus(u)}>{u.status === 'active' ? 'Lock' : 'Unlock'}</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-normal text-gray-700">Document Ingestion</CardTitle>
                  <CardDescription className="text-gray-500">Connection status and ingestion settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3 text-sm">
                    {['gmail', 'outlook', 'gdrive', 'dropbox'].map(p => {
                      const ps = provider(p);
                      return (
                        <div key={p} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-gray-700 font-normal capitalize">{p}</div>
                            <span className={`text-xs px-2 py-0.5 rounded ${ps.connected ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'}`}>{ps.connected ? 'connected' : 'disconnected'}</span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1">Last sync: {ps.lastSync || '—'}</div>
                          <div className="text-gray-500 text-xs">Token age: {ps.tokenAgeDays ?? '—'} days</div>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200" onClick={() => reconnect(p)}>Reconnect</Button>
                            <Button size="sm" variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={async () => { await api.disconnectIntegration(p, true); window.location.reload(); }}>Disconnect & purge</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-700 font-normal">Auto-collect evidence</div>
                        <div className="text-gray-500 text-xs">Read-only ingestion from email and drives.</div>
                      </div>
                      <Switch checked={autoCollect} onCheckedChange={async (v) => { setAutoCollect(v); await api.setEvidenceAutoCollect(v); }} />
                    </div>
                    <div>
                      <Label htmlFor="sched" className="text-gray-600">Schedule</Label>
                      <Input id="sched" value={schedule} onChange={e => setSchedule(e.target.value)} onBlur={async () => { await api.setEvidenceSchedule(schedule); }} className="bg-white border-gray-200 text-gray-700" />
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
