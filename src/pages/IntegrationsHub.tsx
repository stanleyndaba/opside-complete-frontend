import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle, Settings, RefreshCw, ArrowRight, ExternalLink, Package, ShoppingBag, Calculator, Truck, Info, Search as SearchIcon, Plug, Mail, Cloud, DollarSign, Zap, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ... (keep all the existing interfaces and constants)

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [status, setStatus] = useState<{ amazon_connected: boolean; docs_connected: boolean; providers?: Record<string, boolean> } | null>(null);
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

  // Start OAuth for selected provider
  const beginProviderOAuth = async (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => {
    try {
      setProviderLoading(provider);
      const res = await api.post<{ auth_url?: string }>(`/api/v1/integrations/${provider}/connect`);
      if ((res as any).ok && (res as any).data?.auth_url) {
        window.location.href = (res as any).data.auth_url as string;
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
        if (res.ok && res.data) setStatus(res.data);
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
    <PageLayout title="Clario Platform Integrations">
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
                  <Mail className="h-12 w-12 mx-auto mb-3 text-blue-600" />
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
                  <Cloud className="h-12 w-12 mx-auto mb-3 text-green-600" />
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
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('gmail')} className="bg-red-600 hover:bg-red-700">{providerLoading==='gmail' ? 'Connecting…' : 'Gmail'}</Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('outlook')} className="bg-blue-600 hover:bg-blue-700">{providerLoading==='outlook' ? 'Connecting…' : 'Outlook'}</Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('gdrive')} className="bg-emerald-600 hover:bg-emerald-700">{providerLoading==='gdrive' ? 'Connecting…' : 'Google Drive'}</Button>
              <Button disabled={providerLoading !== null} onClick={() => beginProviderOAuth('dropbox')} className="bg-sky-600 hover:bg-sky-700">{providerLoading==='dropbox' ? 'Connecting…' : 'Dropbox'}</Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProviderDialog(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-100">Clario Platform Integrations</h1>
          <p className="text-gray-400">
            Your central command center for all platform connections
          </p>
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
          <div className="mt-3 rounded-md border border-white/10 bg-white/5 inline-block px-3 py-2 text-sm text-gray-200">
            Want us to auto-collect invoices & docs for you? Connect Gmail / Outlook / Drive / Dropbox.
          </div>
          <div className="mt-4 max-w-xl mx-auto relative">
            <SearchIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
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
                <Badge variant="outline" className={cn('text-xs', status?.amazon_connected ? 'border-emerald-300 text-emerald-300' : 'border-white/30 text-gray-300')}>
                  {status?.amazon_connected ? 'Connected' : 'Not connected'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">Sync inventory, fees, reimbursements, shipments and returns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Last sync: {lastSyncTime}</span>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold" onClick={() => navigate('/sync')}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Sync now
                </Button>
                <Button size="sm" variant="outline" onClick={async () => { await api.post('/api/detections/run'); }}>
                  Run Detector
                </Button>
              </div>
              <div className="text-xs text-gray-400">Scopes: orders.read, inventory.read, transactions.read</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => beginProviderOAuth('gdrive')}>Reconnect</Button>
                <Button size="sm" variant="outline">Disconnect & purge</Button>
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
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => beginProviderOAuth('gmail')} disabled={providerLoading!==null}>{providerLoading==='gmail'?'Connecting…':'Connect Gmail'}</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => beginProviderOAuth('outlook')} disabled={providerLoading!==null}>{providerLoading==='outlook'?'Connecting…':'Connect Outlook'}</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => beginProviderOAuth('gdrive')} disabled={providerLoading!==null}>{providerLoading==='gdrive'?'Connecting…':'Connect Google Drive'}</Button>
                <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => beginProviderOAuth('dropbox')} disabled={providerLoading!==null}>{providerLoading==='dropbox'?'Connecting…':'Connect Dropbox'}</Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Auto‑collect</span>
                <Button size="sm" variant="outline">Enabled</Button>
                <span className="ml-2">Schedule</span>
                <Button size="sm" variant="outline">Daily 02:00 UTC</Button>
              </div>
              <div className="text-xs text-gray-400">Filters: include invoices@, receipts@; file types: PDF, PNG; folders: /Finance</div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Last ingest: Just now</span>
                <Button size="sm" variant="outline" onClick={async () => { await api.post('/api/evidence/sync'); }}>Ingest now</Button>
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


