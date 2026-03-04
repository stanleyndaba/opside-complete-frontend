import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import AdminOnly from '@/components/routes/AdminOnly';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { Users, Mail, Clock, Star, DollarSign, Plug, Briefcase, RefreshCw, Loader2, TrendingUp } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'locked';
  created_at?: string;
  last_login?: string;
  integrations_count?: number;
  cases_count?: number;
  total_recovered?: number;
}
interface ProviderStatus { connected: boolean; lastSync?: string; tokenAgeDays?: number; }
interface WaitlistEntry {
  id: string;
  email: string;
  user_type?: string;
  annual_revenue?: string;
  primary_goal?: string;
  contact_handle?: string;
  status: string;
  created_at: string;
  metadata?: { is_whale?: boolean; priority?: string };
}

export default function AdminUsersAndIntegrations() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  // Users - fetched from backend
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // Waitlist
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [waitlistFilter, setWaitlistFilter] = useState('');
  const [waitlistTotal, setWaitlistTotal] = useState(0);

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

    // Fetch waitlist
    (async () => {
      setWaitlistLoading(true);
      try {
        const waitlistRes = await api.getWaitlist(100, 0);
        if (waitlistRes.ok && waitlistRes.data?.entries) {
          setWaitlist(waitlistRes.data.entries);
          setWaitlistTotal(waitlistRes.data.total);
        }
      } catch (err) {
        console.error('Failed to load waitlist:', err);
      } finally {
        setWaitlistLoading(false);
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
  const filteredWaitlist = useMemo(() => waitlist.filter(w =>
    w.email.toLowerCase().includes(waitlistFilter.toLowerCase()) ||
    (w.user_type || '').toLowerCase().includes(waitlistFilter.toLowerCase())
  ), [waitlist, waitlistFilter]);

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminOnly>
      <PageLayout title="Admin Command Center // Terminals" midnight>
        <div className="min-h-screen bg-[#050505] relative overflow-hidden -m-4 lg:-m-6">
          {/* Aesthetic Background Elements */}
          <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
          <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

          <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12 space-y-8">
            {/* Header section */}
            <div className="flex flex-col mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-emerald-500/50" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">CORE_SYSTEM // TERMINAL_ACCESS</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                    Terminal Directory
                  </h1>
                  <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
                    Manage terminal access protocols and connected system integrations.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-500 h-9 px-4 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all"
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${(usersLoading || waitlistLoading) ? 'animate-spin' : ''}`} />
                  Sync Directory
                </Button>
              </div>
            </div>
            {/* Waitlist Section */}
            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden mt-8">
              <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Access Requests Directory</CardTitle>
                    <CardDescription className="text-xs text-white/40 pt-1 font-serif italic">
                      {waitlistTotal} signups • Priority leads authenticated
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[9px] uppercase tracking-widest">
                    <Mail className="h-3 w-3 mr-2" />
                    INCOMING PINGS
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 border-b border-white/5">
                  <Label htmlFor="waitlistFilter" className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2 block">Search Directory</Label>
                  <Input
                    id="waitlistFilter"
                    placeholder="Search by email or signature..."
                    value={waitlistFilter}
                    onChange={e => setWaitlistFilter(e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white font-mono text-xs w-full max-w-md h-10 rounded-lg focus:border-emerald-500/50"
                  />
                </div>
                {waitlistLoading ? (
                  <div className="py-16 text-center text-white/30">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-emerald-500/50" />
                    <p className="font-mono text-xs uppercase tracking-widest">Compiling Directory...</p>
                  </div>
                ) : filteredWaitlist.length === 0 ? (
                  <div className="py-16 text-center text-white/30">
                    <p className="font-mono text-xs uppercase tracking-widest">No access requests detected.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto select-none">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/5 hover:bg-transparent bg-transparent">
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Email</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Type</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Revenue</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Contact</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Ident</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWaitlist.map(entry => (
                          <TableRow key={entry.id} className="border-b border-white/5 border-dashed hover:bg-white/[0.02] transition-colors">
                            <TableCell className="px-8 py-4 font-sans text-sm text-white/90">
                              {entry.email}
                            </TableCell>
                            <TableCell className="px-8 py-4 font-mono text-[10px] uppercase text-white/60">
                              {entry.user_type || '—'}
                            </TableCell>
                            <TableCell className="px-8 py-4 font-serif text-sm text-emerald-500/80">
                              {entry.annual_revenue || '—'}
                            </TableCell>
                            <TableCell className="px-8 py-4 font-sans text-sm text-white/70">
                              {entry.contact_handle || '—'}
                            </TableCell>
                            <TableCell className="px-8 py-4 text-[10px] font-mono text-white/30 tracking-widest">
                              <div className="flex flex-col gap-1">
                                <span>{formatDate(entry.created_at)}</span>
                                <span>{entry.id.substring(0, 8)}...</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-4">
                              {entry.metadata?.is_whale ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-[9px] uppercase tracking-widest">
                                  <Star className="h-3 w-3 mr-1" />
                                  WHALE_PRIORITY
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-white/5 text-white/40 border-white/10 font-mono text-[9px] uppercase tracking-widest">
                                  STANDARD
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Users Section - Full Width */}
            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden mt-8">
              <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Active Terminals & Roles</CardTitle>
                    <CardDescription className="text-xs text-white/40 pt-1 font-serif italic">
                      {filtered.length} active nodes • Manage authorization and telemetry access
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[9px] uppercase tracking-widest">
                    <Users className="h-3 w-3 mr-2" />
                    ROSTER
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 border-b border-white/5">
                  <Label htmlFor="userFilter" className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2 block">Trace Identity</Label>
                  <Input
                    id="userFilter"
                    placeholder="target@company.com"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="bg-white/[0.03] border-white/10 text-white font-mono text-xs w-full max-w-md h-10 rounded-lg focus:border-emerald-500/50"
                  />
                </div>
                {usersLoading ? (
                  <div className="py-16 text-center text-white/30">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-emerald-500/50" />
                    <p className="font-mono text-xs uppercase tracking-widest">Establishing Handshake...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center text-white/30">
                    <p className="font-mono text-xs uppercase tracking-widest">No matching identities found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto select-none">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/5 hover:bg-transparent bg-transparent">
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Terminal/Email</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Connections</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Active Cases</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Net Recovered</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Access Level</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8">Protocol State</TableHead>
                          <TableHead className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/40 h-10 px-8 text-right">Root Commands</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(u => (
                          <TableRow key={u.id} className="border-b border-white/5 border-dashed hover:bg-white/[0.02] transition-colors">
                            <TableCell className="px-8 py-5">
                              <div className="font-sans font-medium text-white/90">{u.email}</div>
                              <div className="text-[10px] font-mono text-white/40 mt-1 uppercase tracking-wider">
                                {u.last_login ? `LAST_SYNC: ${formatDate(u.last_login)}` : 'NOD_SYNC'} | IDENT: {u.id.substring(0, 8)}...
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5 text-center">
                              <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 font-mono text-[10px]">
                                <Plug className="h-3 w-3 mr-2 text-emerald-500/50" />
                                {u.integrations_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 py-5 text-center">
                              <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 font-mono text-[10px]">
                                <Briefcase className="h-3 w-3 mr-2 text-emerald-500/50" />
                                {u.cases_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 py-5 font-serif text-emerald-400 text-sm">
                              <div className="flex flex-col">
                                <span>${(u.total_recovered || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <select
                                className="bg-[#0c0c0c] border border-white/10 text-white/80 rounded-lg px-3 py-1 text-xs font-mono tracking-widest uppercase outline-none focus:border-emerald-500/50 transition-colors"
                                value={u.role}
                                onChange={e => updateUser(u.id, { role: e.target.value as UserRow['role'] })}
                              >
                                <option value="user">USER</option>
                                <option value="admin">ROOT</option>
                              </select>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <Badge
                                variant="outline"
                                className={
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[9px] uppercase tracking-widest'
                                    : 'bg-red-500/10 text-red-500 border-red-500/20 font-mono text-[9px] uppercase tracking-widest'
                                }
                              >
                                {u.status === 'active' ? 'NOMINAL' : 'LOCKED'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-8 py-5 text-right flex gap-3 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400 h-8 px-3 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all"
                                onClick={() => handleImpersonate(u.id)}
                              >
                                Infiltrate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={
                                  u.status === 'active'
                                    ? 'border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 h-8 px-3 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all'
                                    : 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-500 h-8 px-3 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all'
                                }
                                onClick={() => toggleUserStatus(u)}
                              >
                                {u.status === 'active' ? 'Revoke' : 'Restore'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-8">
              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                  <CardTitle className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.3em]">Document Ingestion Protocols</CardTitle>
                  <CardDescription className="text-xs text-white/40 pt-1 font-serif italic">Global connection telemetrics and autonomous pipeline settings.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4 text-sm max-w-2xl">
                    {['gmail', 'outlook', 'gdrive', 'dropbox'].map(p => {
                      const ps = provider(p);
                      return (
                        <div key={p} className="rounded-xl border border-white/5 bg-white/[0.01] p-5 hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-white/80 font-mono tracking-widest uppercase text-xs">{p}</div>
                            <Badge variant="outline" className={ps.connected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]' : 'bg-white/5 text-white/30 border-white/10 text-[9px]'}>
                              {ps.connected ? 'ESTABLISHED' : 'SEVERED'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Last Sync Ping</div>
                              <div className="text-xs text-white/60 font-serif mt-1">{ps.lastSync || 'NO_DATA'}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-white/30 tracking-widest uppercase">Key Age (Days)</div>
                              <div className="text-xs text-white/60 font-serif mt-1">{ps.tokenAgeDays ?? 'UNKNOWN'}</div>
                            </div>
                          </div>
                          <div className="mt-5 flex gap-3">
                            <Button size="sm" variant="outline" className="border-white/10 hover:border-white/30 hover:bg-white/5 text-white h-8 px-4 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all" onClick={() => reconnect(p)}>
                              Re-Establish
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-500/20 hover:border-red-500/50 hover:bg-red-500/5 text-red-500 h-8 px-4 font-mono uppercase tracking-widest text-[9px] rounded-lg transition-all" onClick={async () => { await api.disconnectIntegration(p, true); window.location.reload(); }}>
                              Terminate Trace
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border border-white/5 p-6 rounded-xl bg-white/[0.01] max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm font-serif text-white/90">Autonomous Extraction Engine</div>
                        <div className="text-xs text-white/40 mt-1">Engage read-only evidence scraping across active pipes.</div>
                      </div>
                      <Switch checked={autoCollect} onCheckedChange={async (v) => { setAutoCollect(v); await api.setEvidenceAutoCollect(v); }} className="data-[state=checked]:bg-emerald-500" />
                    </div>
                    <div>
                      <Label htmlFor="sched" className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2 block">Cron Schedule</Label>
                      <Input
                        id="sched"
                        value={schedule}
                        onChange={e => setSchedule(e.target.value)}
                        onBlur={async () => { await api.setEvidenceSchedule(schedule); }}
                        className="bg-white/[0.03] border-white/10 text-emerald-400 font-mono text-xs w-full h-10 rounded-lg focus:border-emerald-500/50 placeholder:text-white/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Links */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-white/5">
                <Button
                  onClick={() => navigate(`/app/${tenantSlug}/admin/revenue`)}
                  variant="outline"
                  className="flex-1 bg-white/[0.01] border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-white/80 hover:text-emerald-400 h-12 font-mono uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)_inset]"
                >
                  <DollarSign className="w-4 h-4 mr-3 text-emerald-500/70" />
                  Revenue Analytics Terminal
                </Button>
                <Button
                  onClick={() => navigate(`/app/${tenantSlug}/admin/revenue-model`)}
                  variant="outline"
                  className="flex-1 bg-white/[0.01] border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-white/80 hover:text-emerald-400 h-12 font-mono uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.05)_inset]"
                >
                  <TrendingUp className="w-4 h-4 mr-3 text-emerald-500/70" />
                  Revenue Model Projection Builder
                </Button>
              </div>

            </div>
          </div>
        </div>
      </PageLayout>
    </AdminOnly>
  );
}

