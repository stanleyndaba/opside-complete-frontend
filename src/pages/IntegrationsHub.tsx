import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Shield, RefreshCw, Search as SearchIcon, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

// ... (keep all the existing interfaces and constants)

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [status, setStatus] = useState<{ amazon_connected: boolean; docs_connected: boolean; providers?: Record<string, boolean>; lastIngest?: string; lastSync?: string; providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }> } | null>(null);
  
  // Check if we're in sandbox mode
  const env: any = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || (typeof process !== 'undefined' ? (process as any).env : undefined) || {};
  const isSandbox = String(env.VITE_SANDBOX || '') === 'true' || String(env.MODE || env.NODE_ENV || '') !== 'production';
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
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [ingestingGmail, setIngestingGmail] = useState(false);
  const [ingestingAll, setIngestingAll] = useState(false);
  const [savingFilters, setSavingFilters] = useState(false);
  const [updatingAutoCollect, setUpdatingAutoCollect] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistIntegration, setWaitlistIntegration] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');

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
            if (evt.status === 'completed') {
              toast({ 
                title: 'Ingestion Complete', 
                description: evt.message || 'Evidence ingestion has completed. Documents are available in Evidence Locker.' 
              });
              // Refresh status to update lastIngest and provider status
              api.getIntegrationsStatus().then(res => {
                if (res.ok && res.data) {
                  setStatus(res.data);
                }
              });
            } else {
              toast({ 
                title: 'Ingestion Update', 
                description: evt.message || 'Evidence ingestion is in progress...' 
              });
            }
          }
          if (evt?.type === 'claim' && evt?.status === 'completed' && evt?.matchedCount) {
            toast({ 
              title: 'New Matches Found', 
              description: `${evt.matchedCount} documents matched to claims.` 
            });
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

  // Handle OAuth callback query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const gmailConnected = searchParams.get('gmail_connected');
    const outlookConnected = searchParams.get('outlook_connected');
    const gdriveConnected = searchParams.get('gdrive_connected');
    const dropboxConnected = searchParams.get('dropbox_connected');
    const email = searchParams.get('email');
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    // Show success notification if provider was just connected
    if (gmailConnected === 'true' || outlookConnected === 'true' || gdriveConnected === 'true' || dropboxConnected === 'true') {
      const providerName = gmailConnected === 'true' ? 'Gmail' 
        : outlookConnected === 'true' ? 'Outlook'
        : gdriveConnected === 'true' ? 'Google Drive'
        : dropboxConnected === 'true' ? 'Dropbox'
        : 'provider';
      
      toast({
        title: `${providerName} Connected Successfully`,
        description: email ? `${providerName} connected for ${email}. Evidence ingestion will begin automatically.` : `${providerName} has been connected successfully.`,
      });

      // Refresh integration status to update UI
      api.getIntegrationsStatus().then(res => {
        if (res.ok && res.data) {
          setStatus(res.data);
        }
      });

      // Clean up URL by removing query parameters after processing (optional)
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }

    // Show error notification if OAuth failed
    if (error) {
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });

      // Clean up URL
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }

    // Show generic success message if success parameter is present
    if (success && !gmailConnected && !outlookConnected && !gdriveConnected && !dropboxConnected) {
      toast({
        title: 'Connection Successful',
        description: 'Your account has been connected successfully.',
      });

      // Refresh integration status
      api.getIntegrationsStatus().then(res => {
        if (res.ok && res.data) {
          setStatus(res.data);
        }
      });

      // Clean up URL
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }
  }, [location.search, navigate, toast]);

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

  return (
    <PageLayout title="Platform Integrations">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-12 text-gray-300 space-y-8">
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
                <Badge variant="outline" className={cn('text-xs', (isSandbox || status?.amazon_connected) ? 'border-emerald-500 text-emerald-500 font-semibold' : 'border-gray-400/50 text-gray-400')}>
                  {(isSandbox || status?.amazon_connected) ? 'Connected' : 'Not connected'}
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
                {(['gmail','outlook','gdrive','dropbox'] as const).map((p) => {
                  // Helper function to check if provider is connected - only return true if explicitly connected
                  const isConnected = () => {
                    // Check providerIngest first (preferred format) - must be explicitly true
                    if (status?.providerIngest?.[p]?.connected === true) return true;
                    // Check with capitalized key (in case API returns 'Gmail' instead of 'gmail')
                    const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
                    if (status?.providerIngest?.[capitalized]?.connected === true) return true;
                    // Check providers field (alternative format) - must be explicitly true
                    if (status?.providers?.[p] === true) return true;
                    if (status?.providers?.[capitalized] === true) return true;
                    // Check top-level provider_connected fields (e.g., gmail_connected, outlook_connected) - must be explicitly true
                    const providerConnectedKey = `${p}_connected` as keyof typeof status;
                    if (status && (status as any)[providerConnectedKey] === true) return true;
                    // Only return true if explicitly connected - no assumptions
                    return false;
                  };
                  
                  const hasError = () => {
                    return status?.providerIngest?.[p]?.error || status?.providerIngest?.[p.charAt(0).toUpperCase() + p.slice(1)]?.error;
                  };
                  
                  const getLastIngest = () => {
                    return status?.providerIngest?.[p]?.lastIngest || status?.providerIngest?.[p.charAt(0).toUpperCase() + p.slice(1)]?.lastIngest || '—';
                  };
                  
                  const connected = isConnected();
                  
                  return (
                    <div key={p} className="flex flex-col gap-2 rounded border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {p === 'gmail' && <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 object-contain" />}
                          {p === 'outlook' && <img src="/outlookicon.webp" alt="Outlook" className="h-4 w-4 object-contain" />}
                          {p === 'gdrive' && <img src="/gd.png" alt="Google Drive" className="h-4 w-4 object-contain" />}
                          {p === 'dropbox' && <img src="/db.png" alt="Dropbox" className="h-4 w-4 object-contain" />}
                          <span className="capitalize">{p === 'gdrive' ? 'Google Drive' : p}</span>
                        </div>
                        <Badge variant="outline" className={cn('text-xs', connected ? 'border-emerald-500 text-emerald-500 font-semibold' : hasError() ? 'border-red-300 text-red-300' : 'border-gray-400/50 text-gray-400')}>
                          {connected ? 'Connected' : hasError() ? 'Error' : 'Not connected'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">Last ingest: {getLastIngest()}</div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className={cn(p==='gmail'?'bg-red-600 hover:bg-red-700': p==='outlook'?'bg-blue-600 hover:bg-blue-700': p==='gdrive'?'bg-emerald-600 hover:bg-emerald-700':'bg-sky-600 hover:bg-sky-700')} 
                        onClick={async () => {
                          try {
                            setProviderLoading(p);
                            const r = await api.connectDocs(p);
                            if (r.ok && r.data?.auth_url) {
                              toast({
                                title: 'Connecting...',
                                description: `Redirecting to ${p} authentication...`,
                              });
                              window.location.href = r.data.auth_url;
                            } else {
                              toast({
                                title: 'Connection Failed',
                                description: r.error || `Failed to initiate ${p} connection. Please try again.`,
                                variant: 'destructive',
                              });
                            }
                          } catch (error) {
                            console.error(`Failed to connect ${p}:`, error);
                            toast({
                              title: 'Connection Failed',
                              description: `An error occurred while connecting ${p}. Please try again.`,
                              variant: 'destructive',
                            });
                          } finally {
                            setProviderLoading(null);
                          }
                        }}
                        disabled={providerLoading !== null || disconnectingProvider === p}
                      >
                        {providerLoading === p ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Connecting…
                          </>
                        ) : (
                          'Reconnect'
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to disconnect ${p}? This will stop automatic evidence collection from this source.`)) {
                            return;
                          }
                          try {
                            setDisconnectingProvider(p);
                            const r = await api.disconnectIntegration(p, true);
                            if (r.ok) {
                              toast({
                                title: 'Disconnected',
                                description: `${p === 'gdrive' ? 'Google Drive' : p} integration has been disconnected successfully.`,
                              });
                              // Refresh status
                              const s = await api.getIntegrationsStatus();
                              if (s.ok && s.data) {
                                setStatus(s.data);
                              }
                            } else {
                              toast({
                                title: 'Disconnect Failed',
                                description: r.error || 'Failed to disconnect. Please try again.',
                                variant: 'destructive',
                              });
                            }
                          } catch (error) {
                            console.error(`Failed to disconnect ${p}:`, error);
                            toast({
                              title: 'Disconnect Failed',
                              description: 'An error occurred while disconnecting. Please try again.',
                              variant: 'destructive',
                            });
                          } finally {
                            setDisconnectingProvider(null);
                          }
                        }}
                        disabled={providerLoading === p || disconnectingProvider === p}
                      >
                        {disconnectingProvider === p ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Disconnecting…
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    </div>
                    {(() => {
                      const providerData = status?.providerIngest?.[p] || status?.providerIngest?.[p.charAt(0).toUpperCase() + p.slice(1)];
                      return Array.isArray(providerData?.scopes) && providerData.scopes.length > 0 ? (
                        <div className="text-[11px] text-gray-400">Scopes: {providerData.scopes.join(', ')}</div>
                      ) : null;
                    })()}
                  </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span>Auto‑collect</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                  onClick={async () => {
                    try {
                      setUpdatingAutoCollect(true);
                      const next = !autoCollect;
                      const r = await api.setEvidenceAutoCollect(next);
                      if (r.ok) {
                        setAutoCollect(next);
                        toast({
                          title: 'Auto‑collect Updated',
                          description: next ? 'Auto-collection is now enabled.' : 'Auto-collection is now disabled.',
                        });
                      } else {
                        toast({
                          title: 'Update Failed',
                          description: r.error || 'Failed to update auto-collect setting. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to update auto-collect:', error);
                      toast({
                        title: 'Update Failed',
                        description: 'An error occurred. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setUpdatingAutoCollect(false);
                    }
                  }}
                  disabled={updatingAutoCollect}
                >
                  {updatingAutoCollect ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    autoCollect ? 'Enabled' : 'Disabled'
                  )}
                </Button>
                <span className="ml-2">Schedule</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                  onClick={async () => {
                    try {
                      setUpdatingSchedule(true);
                      const next = schedule === 'daily_0200' ? 'hourly' : 'daily_0200';
                      const r = await api.setEvidenceSchedule(next);
                      if (r.ok) {
                        setSchedule(next);
                        toast({
                          title: 'Schedule Saved',
                          description: next === 'hourly' ? 'Evidence will be ingested hourly.' : 'Evidence will be ingested daily at 02:00 UTC.',
                        });
                      } else {
                        toast({
                          title: 'Save Failed',
                          description: r.error || 'Failed to update schedule. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to update schedule:', error);
                      toast({
                        title: 'Save Failed',
                        description: 'An error occurred. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setUpdatingSchedule(false);
                    }
                  }}
                  disabled={updatingSchedule}
                >
                  {updatingSchedule ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    schedule === 'daily_0200' ? 'Daily 02:00 UTC' : 'Hourly'
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-400">Filters: include {filters.includeSenders.join(', ') || '—'}; file types: {filters.fileTypes.join(', ') || '—'}; folders: {filters.folders.join(', ') || '—'}</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Input 
                  placeholder="Include senders (comma‑separated)" 
                  value={filters.includeSenders.join(', ')} 
                  onChange={(e) => setFilters(f => ({ ...f, includeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                  className="w-full md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" 
                />
                <Input 
                  placeholder="File types (comma‑separated, e.g. pdf, png, jpg)" 
                  value={filters.fileTypes.join(', ')} 
                  onChange={(e) => setFilters(f => ({ ...f, fileTypes: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) }))} 
                  className="w-full md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" 
                />
                <Input 
                  placeholder="Folders (comma‑separated)" 
                  value={filters.folders.join(', ')} 
                  onChange={(e) => setFilters(f => ({ ...f, folders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                  className="w-full md:w-64 border-white/10 bg-white/5 text-gray-100 placeholder:text-gray-500" 
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                  onClick={async () => {
                    try {
                      setSavingFilters(true);
                      const r = await api.setEvidenceFilters(filters);
                      if (r.ok) {
                        toast({
                          title: 'Filters Saved',
                          description: 'Your ingestion filters have been saved and are now active.',
                        });
                      } else {
                        toast({
                          title: 'Save Failed',
                          description: r.error || 'Failed to save filters. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to save filters:', error);
                      toast({
                        title: 'Save Failed',
                        description: 'An error occurred while saving filters. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setSavingFilters(false);
                    }
                  }}
                  disabled={savingFilters}
                >
                  {savingFilters ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save Filters'
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Last ingest: {status?.lastIngest || 'Just now'}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                  onClick={async () => {
                    try {
                      setIngestingGmail(true);
                      const r = await api.ingestGmailEvidence({ autoParse: true });
                      if (r.ok && r.data) {
                        toast({
                          title: 'Ingestion Started',
                          description: `Processing ${r.data.emailsProcessed} emails. Documents will appear in Evidence Locker when ready.`,
                        });
                        // Refresh status after a delay to show updated lastIngest
                        setTimeout(async () => {
                          const s = await api.getIntegrationsStatus();
                          if (s.ok && s.data) {
                            setStatus(s.data);
                          }
                        }, 2000);
                      } else {
                        toast({
                          title: 'Ingestion Failed',
                          description: r.error || 'Gmail may not be connected. Please connect Gmail first and try again.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to ingest Gmail evidence:', error);
                      toast({
                        title: 'Ingestion Failed',
                        description: 'An error occurred while ingesting evidence. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIngestingGmail(false);
                    }
                  }}
                  disabled={ingestingGmail || ingestingAll}
                >
                  {ingestingGmail ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Ingesting…
                    </>
                  ) : (
                    'Ingest Gmail Now'
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" 
                  onClick={async () => {
                    try {
                      setIngestingAll(true);
                      const r = await api.startEvidenceIngest();
                      if (r.ok) {
                        toast({
                          title: 'Ingestion Started',
                          description: 'Ingesting evidence from all connected sources. We will notify you when new documents arrive.',
                        });
                        // Refresh status after a delay
                        setTimeout(async () => {
                          const s = await api.getIntegrationsStatus();
                          if (s.ok && s.data) {
                            setStatus(s.data);
                          }
                        }, 2000);
                      } else {
                        toast({
                          title: 'Ingestion Failed',
                          description: r.error || 'Failed to start ingestion. Please try again.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Failed to ingest evidence:', error);
                      toast({
                        title: 'Ingestion Failed',
                        description: 'An error occurred while ingesting evidence. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIngestingAll(false);
                    }
                  }}
                  disabled={ingestingGmail || ingestingAll}
                >
                  {ingestingAll ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Ingesting…
                    </>
                  ) : (
                    'Ingest All Sources'
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/evidence-locker')}>Open Evidence Locker</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platforms Coming to Clario */}
        <Card className="bg-white/5 border-white/10 text-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200">
              Platforms Coming to Clario
              <Badge variant="outline" className="border-amber-400/30 text-amber-300 bg-amber-500/10 text-xs">
                Pre-Beta
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">These platforms are coming soon. Stay tuned for updates!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Shopify', 'Walmart', 'Quickbooks', 'Xero', 'Ebay', 'ShipBob'].map((platform) => (
                <div key={platform} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-4">
                  <span className="text-sm font-medium text-gray-200">{platform}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    disabled
                    className="bg-white/5 text-gray-400 border-gray-400/30 cursor-not-allowed opacity-50"
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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


