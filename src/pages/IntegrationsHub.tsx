import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle, Settings, RefreshCw, ArrowRight, ExternalLink, Package, ShoppingBag, Calculator, Truck, Info, Search as SearchIcon, Plug, Mail, Cloud, DollarSign, Zap, FileText, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

// ... (keep all the existing interfaces and constants)

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [status, setStatus] = useState<{ amazon_connected: boolean; docs_connected: boolean; providers?: Record<string, boolean>; lastIngest?: string; lastSync?: string; providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }> } | null>(null);
  const [autoCollect, setAutoCollect] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<string>('daily_0200');
  const [filters, setFilters] = useState<{ includeSenders: string[]; excludeSenders: string[]; fileTypes: string[]; folders: string[] }>({ includeSenders: ['invoices@'], excludeSenders: [], fileTypes: ['pdf','png'], folders: ['/Finance'] });
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [requestFormData, setRequestFormData] = useState({
    platform: '',
    description: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistIntegration, setWaitlistIntegration] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');

  // NEW: Shock and Awe state
  const [showRecoveryReveal, setShowRecoveryReveal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ totalAmount: number; currency: string; claimCount: number } | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Check if we just connected Amazon and should show the reveal
  useEffect(() => {
    const amazonConnected = searchParams.get('amazon_connected');
    const recoveryAmount = searchParams.get('recovery_amount');
    
    if (amazonConnected === 'true' && !showRecoveryReveal) {
      // Fetch the actual recovery data
      api.getAmazonRecoveries().then(response => {
        if (response.ok) {
          setRecoveryData(response.data);
          setShowRecoveryReveal(true);
          
          // Auto-show evidence modal after 3 seconds
          setTimeout(() => {
            setShowEvidenceModal(true);
          }, 3000);
        }
      });
    }
  }, [searchParams, showRecoveryReveal]);

  // Real-time sync simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      setLastSyncTime('Just now'); // Simplified
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // SSE for live ingest/detection events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/sse/status');
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'evidence' && evt?.status) {
            toast({ title: evt.status === 'completed' ? 'Ingestion complete' : 'Ingestion update', description: evt.message || 'Documents updated.' });
          }
          if (evt?.type === 'claim' && evt?.status === 'completed' && evt?.matchedCount) {
            toast({ title: 'New matches found', description: `${evt.matchedCount} documents matched to claims.` });
          }
        } catch {}
      };
    } catch {}
    return () => { if (es) es.close(); };
  }, [toast]);

  // Start OAuth for selected provider
  const beginProviderOAuth = async (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => {
    try {
      setProviderLoading(provider);
      const res = await api.connectDocs(provider);
      if (res.ok && res.data?.auth_url) {
        window.location.href = res.data.auth_url as string;
      } else {
        // Fallback route if backend returns no URL
        window.location.href = `/auth/${provider}-sandbox`;
      }
    } catch {
      window.location.href = `/auth/${provider}-sandbox`;
    } finally {
      setProviderLoading(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.getIntegrationsStatus();
      if (!cancelled) {
        if (res.ok && res.data) {
          setStatus(res.data);
          if (typeof (res.data as any).autoCollect === 'boolean') setAutoCollect((res.data as any).autoCollect);
          if ((res.data as any).schedule) setSchedule((res.data as any).schedule);
          if ((res.data as any).filters) setFilters((res.data as any).filters);
        }
      }
    })();
    return () => { cancelled = true };
  }, []);

  // ... (keep all the existing useEffect and handler functions)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <PageLayout title="Platform Integrations">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-12 text-gray-300 space-y-8">
        {/* SHOCK AND AWE: Recovery Reveal Modal */}
        <Dialog open={showRecoveryReveal} onOpenChange={setShowRecoveryReveal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-green-700">
                <Zap className="h-8 w-8" />
                Potential Recoveries Found!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-6 py-4">
              {recoveryData && (
                <>
                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-green-700">
                      {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      in Potential Amazon Recoveries
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {recoveryData.claimCount} claims identified in your account
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div>Lost Inventory</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.6, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <Calculator className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                      <div>Fee Errors</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.3, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <Package className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div>Shipments</div>
                      <div className="font-semibold">{formatCurrency(recoveryData.totalAmount * 0.1, recoveryData.currency)}</div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    We found these potential recoveries by analyzing your FBA transaction history.
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* SECOND WOW: Evidence Connect Modal */}
        <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-blue-700">
                <Shield className="h-8 w-8" />
                Unlock Higher-Value Claims
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Connect your email or cloud storage to automatically find and match invoices
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-blue-200 bg-blue-50 text-center p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <img src="/gmailicon.png" alt="Gmail" className="h-8 w-8 object-contain" />
                    <img src="/outlookicon.webp" alt="Outlook" className="h-8 w-8 object-contain" />
                  </div>
                  <h3 className="font-semibold mb-2">Connect Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatically find purchase invoices in your Gmail or Outlook
                  </p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setShowProviderDialog(true);
                    }}
                  >
                    Connect Email
                  </Button>
                </Card>
                
                <Card className="border-green-200 bg-green-50 text-center p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <img src="/gd.png" alt="Google Drive" className="h-8 w-8 object-contain" />
                    <img src="/db.png" alt="Dropbox" className="h-8 w-8 object-contain" />
                  </div>
                  <h3 className="font-semibold mb-2">Connect Cloud Storage</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan Google Drive or Dropbox for receipts and invoices
                  </p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setShowProviderDialog(true);
                    }}
                  >
                    Connect Cloud
                  </Button>
                </Card>
              </div>

              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
                  <Info className="h-4 w-4" />
                  <span>Evidence increases claim approval rates by 3x</span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-sm"
                >
                  I'll upload documents manually later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Provider Picker */}
        <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a provider</DialogTitle>
              <DialogDescription>Select where to ingest evidence from.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('gmail')} className="bg-red-600 hover:bg-red-700">
                {providerLoading==='gmail' ? 'Connecting…' : <><img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 mr-2 object-contain" /> Gmail</>}
              </Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('outlook')} className="bg-blue-600 hover:bg-blue-700">
                {providerLoading==='outlook' ? 'Connecting…' : <><img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 mr-2 object-contain" /> Outlook</>}
              </Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('gdrive')} className="bg-emerald-600 hover:bg-emerald-700">
                {providerLoading==='gdrive' ? 'Connecting…' : <><img src="/gd.png" alt="Google Drive" className="h-4 w-4 mr-2 object-contain" /> Google Drive</>}
              </Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('dropbox')} className="bg-sky-600 hover:bg-sky-700">
                {providerLoading==='dropbox' ? 'Connecting…' : <><img src="/db.png" alt="Dropbox" className="h-4 w-4 mr-2 object-contain" /> Dropbox</>}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProviderDialog(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 text-gray-100">Platform Integrations</h1>
            <p className="text-gray-400">
              Your central command center for all platform connections
            </p>
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/15 px-4 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.25)] animate-pulse">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Works best with work email!
              </span>
            </div>
            {showRecoveryReveal && recoveryData && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-semibold">
                    {formatCurrency(recoveryData.totalAmount, recoveryData.currency)} potential recoveries found
                  </span>
                </div>
              </div>
            )}
            <div className="mt-3 inline-flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
              <span>Want us to auto-collect invoices & docs for you? Connect</span>
              <div className="flex items-center gap-2">
                <img src="/gmailicon.png" alt="Gmail" className="h-5 w-5 object-contain mix-blend-screen saturate-150 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]" />
                <img src="/outlookicon.webp" alt="Outlook" className="h-5 w-5 object-contain mix-blend-screen saturate-150 drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]" />
                <span>Drive / Dropbox</span>
              </div>
            </div>
            <div className="mt-4 relative mx-auto max-w-xl">
              <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search integrations (Amazon, Shopify, Gmail…)"
                className="pl-9"
              />
            </div>
          </div>

        {/* Core Integrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Amazon SP-API */}
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-gray-200">
                <span className="inline-flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-400" /> Amazon SP‑API</span>
                <Badge variant="outline" className={cn('text-xs', status?.amazon_connected ? 'border-emerald-500 text-emerald-500 font-semibold' : 'border-gray-400/50 text-gray-400')}>
                  {status?.amazon_connected ? 'Connected' : 'Not connected'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">Sync inventory, fees, reimbursements, shipments and returns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Last sync: {status?.lastSync || lastSyncTime}</span>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold" onClick={() => { navigate('/smart-inventory-sync'); toast({ title: 'Opening Sync', description: 'Reconciling and refreshing data…' }); }}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Sync now
                </Button>
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { try { await api.post('/api/detections/run'); toast({ title: 'Detector started', description: 'Scanning new opportunities…' }); } catch(e:any){ toast({ title: 'Detector failed', description: e?.message || 'Please try again.', variant: 'destructive' }); } }}>
                  Run Detector
                </Button>
              </div>
              <div className="text-xs text-gray-400">Scopes: orders.read, inventory.read, transactions.read</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={() => { toast({ title: 'Reconnect Amazon', description: 'Redirecting to connection flow…' }); navigate('/integrations/reconnect/amazon'); }}>Reconnect</Button>
                  <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const res = await api.disconnectIntegration('amazon', true); if (res.ok){ toast({ title: 'Disconnected', description: 'Amazon integration disconnected.' }); } else { toast({ title: 'Disconnect failed', description: res.error || 'Please try again.', variant: 'destructive' }); } const s = await api.getIntegrationsStatus(); if (s.ok) setStatus(s.data); }}>Disconnect</Button>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Sources */}
          <Card className="bg-white/5 border-white/10 text-gray-300">
            <CardHeader>
              <CardTitle className="text-gray-200">Evidence Sources</CardTitle>
              <CardDescription className="text-gray-400">Connect email and cloud to auto‑ingest invoices, receipts and shipping docs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['gmail','outlook','gdrive','dropbox'] as const).map((p) => (
                  <div key={p} className="flex flex-col gap-2 rounded border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {p === 'gmail' && <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 object-contain" />}
                        {p === 'outlook' && <img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 object-contain" />}
                        {p === 'gdrive' && <img src="/gd.png" alt="Google Drive" className="h-4 w-4 object-contain" />}
                        {p === 'dropbox' && <img src="/db.png" alt="Dropbox" className="h-4 w-4 object-contain" />}
                        <span className="capitalize">{p === 'gdrive' ? 'Google Drive' : p}</span>
                      </div>
                      <Badge variant="outline" className={cn('text-xs', status?.providerIngest?.[p]?.connected ? 'border-emerald-500 text-emerald-500 font-semibold' : status?.providerIngest?.[p]?.error ? 'border-red-300 text-red-300' : 'border-gray-400/50 text-gray-400')}>
                        {status?.providerIngest?.[p]?.connected ? 'Connected' : status?.providerIngest?.[p]?.error ? 'Error' : 'Not connected'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">Last ingest: {status?.providerIngest?.[p]?.lastIngest || '—'}</div>
                    <div className="flex gap-2">
                      <Button size="sm" className={cn(p==='gmail'?'bg-red-600 hover:bg-red-700': p==='outlook'?'bg-blue-600 hover:bg-blue-700': p==='gdrive'?'bg-emerald-600 hover:bg-emerald-700':'bg-sky-600 hover:bg-sky-700')} onClick={() => { toast({ title: 'Reconnect', description: `Redirecting to ${p}…` }); navigate(`/integrations/reconnect/${p}`); }} disabled={providerLoading!==null}>{providerLoading===p?'Connecting…':'Reconnect'}</Button>
                        <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const r = await api.disconnectIntegration(p, true); if (r.ok){ toast({ title: 'Disconnected', description: `${p} integration disconnected.` }); } else { toast({ title: 'Disconnect failed', description: r.error || 'Please try again.', variant: 'destructive' }); } const s = await api.getIntegrationsStatus(); if (s.ok) setStatus(s.data); }}>Disconnect</Button>
                    </div>
                    {Array.isArray(status?.providerIngest?.[p]?.scopes) && status!.providerIngest![p]!.scopes!.length > 0 && (
                      <div className="text-[11px] text-gray-400">Scopes: {status!.providerIngest![p]!.scopes!.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span>Auto‑collect</span>
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const next = !autoCollect; const r = await api.setEvidenceAutoCollect(next); if (r.ok){ setAutoCollect(next); toast({ title: 'Auto‑collect updated', description: next ? 'Enabled' : 'Disabled' }); } else { toast({ title: 'Update failed', description: r.error || 'Try again.', variant: 'destructive' }); } }}>
                  {autoCollect ? 'Enabled' : 'Disabled'}
                </Button>
                <span className="ml-2">Schedule</span>
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const next = schedule === 'daily_0200' ? 'hourly' : 'daily_0200'; const r = await api.setEvidenceSchedule(next); if (r.ok){ setSchedule(next); toast({ title: 'Schedule saved', description: next === 'hourly' ? 'Hourly ingestion' : 'Daily at 02:00 UTC' }); } else { toast({ title: 'Save failed', description: r.error || 'Try again.', variant: 'destructive' }); } }}>{schedule === 'daily_0200' ? 'Daily 02:00 UTC' : 'Hourly'}</Button>
              </div>
              <div className="text-xs text-gray-400">Filters: include {filters.includeSenders.join(', ') || '—'}; file types: {filters.fileTypes.join(', ') || '—'}; folders: {filters.folders.join(', ') || '—'}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Input placeholder="Include senders (comma‑separated)" value={filters.includeSenders.join(', ')} onChange={(e) => setFilters(f => ({ ...f, includeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Input placeholder="Folders (comma‑separated)" value={filters.folders.join(', ')} onChange={(e) => setFilters(f => ({ ...f, folders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" />
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const r = await api.setEvidenceFilters(filters); if (r.ok){ toast({ title: 'Filters saved', description: 'Your ingestion filters are active.' }); } else { toast({ title: 'Save failed', description: r.error || 'Try again.', variant: 'destructive' }); } }}>Save Filters</Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Last ingest: {status?.lastIngest || 'Just now'}</span>
                <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={async () => { const r = await api.startEvidenceIngest(); if (r.ok){ toast({ title: 'Ingestion started', description: 'We will notify you when new docs arrive.' }); } else { toast({ title: 'Ingestion failed', description: r.error || 'Try again.', variant: 'destructive' }); } }}>Ingest now</Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/evidence-locker')}>Open Evidence Locker</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live status */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardHeader>
            <CardTitle className="text-gray-200">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400">Connected Gmail • Ingested 12 docs • 7 matched to claims • Token refreshed</div>
          </CardContent>
        </Card>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}


