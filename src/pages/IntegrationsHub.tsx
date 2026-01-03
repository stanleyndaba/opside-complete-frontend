import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { RefreshCw, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
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
  const [filters, setFilters] = useState<{
    senderPatterns: string[];
    excludeSenders: string[];
    subjectKeywords: string[];
    excludeSubjects: string[];
    fileTypes: { pdf: boolean; images: boolean; spreadsheets: boolean; docs: boolean };
    fileNamePatterns: string[];
    folders: string[];
    dateRange: 'last_30' | 'last_90' | 'last_12_months' | 'since_last_sync' | 'all';
    skipDuplicates: boolean;
    skipExisting: boolean;
  }>({
    senderPatterns: ['*@amazon.com', '*invoice*'],
    excludeSenders: ['*newsletter*', '*marketing*', '*promo*'],
    subjectKeywords: ['invoice', 'receipt', 'reimbursement', 'case', 'shipment', 'order'],
    excludeSubjects: ['unsubscribe', 'promotional'],
    fileTypes: { pdf: true, images: true, spreadsheets: true, docs: false },
    fileNamePatterns: ['invoice', 'receipt', 'order', 'FBA', 'shipment', 'reimburse'],
    folders: ['/Finance', '/Invoices', '/Amazon'],
    dateRange: 'last_90',
    skipDuplicates: true,
    skipExisting: true
  });
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [requestFormData, setRequestFormData] = useState({
    platform: '',
    description: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [ingestingGmail, setIngestingGmail] = useState(false);
  const [ingestingAll, setIngestingAll] = useState(false);
  const [savingFilters, setSavingFilters] = useState(false);
  const [updatingAutoCollect, setUpdatingAutoCollect] = useState(false);
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistIntegration, setWaitlistIntegration] = useState<string | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [ingestionResult, setIngestionResult] = useState<{
    success: boolean;
    totalDocumentsIngested?: number;
    totalItemsProcessed?: number;
    documentsIngested?: number;
    emailsProcessed?: number;
    filesProcessed?: number;
    errors: string[];
    results?: {
      gmail?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      outlook?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      gdrive?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      dropbox?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
    };
    message?: string;
  } | null>(null);
  const [evidenceSources, setEvidenceSources] = useState<Array<{
    id: string;
    provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
    account_email: string;
    status: 'connected' | 'disconnected' | 'error';
    last_sync_at: string | null;
    created_at: string;
    metadata: Record<string, any>;
  }>>([]);
  const handleConnectDocSource = async (provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox') => {
    const providerName = provider === 'gdrive' ? 'Google Drive'
      : provider === 'gmail' ? 'Gmail'
        : provider === 'dropbox' ? 'Dropbox'
          : 'Outlook';
    try {
      setProviderLoading(provider);
      const r = await api.connectDocs(provider);
      if (r.ok && r.data?.auth_url) {
        toast({
          title: `Connecting ${providerName}`,
          description: `Redirecting to ${providerName} authentication...`,
        });
        window.location.href = r.data.auth_url;
      } else {
        toast({
          title: 'Connection Failed',
          description: r.error || `Failed to initiate ${providerName} connection. Please try again.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast({
        title: 'Connection Failed',
        description: `An error occurred while connecting ${providerName}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setProviderLoading(prev => (prev === provider ? null : prev));
    }
  };

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
        } catch { }
      };
    } catch { }
    return () => { if (es) es.close(); };
  }, [toast]);


  // Handle OAuth callback query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const amazonConnected = searchParams.get('amazon_connected');
    const gmailConnected = searchParams.get('gmail_connected');
    const outlookConnected = searchParams.get('outlook_connected');
    const gdriveConnected = searchParams.get('gdrive_connected');
    const dropboxConnected = searchParams.get('dropbox_connected');
    const email = searchParams.get('email');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const amazonError = searchParams.get('amazon_error');
    const success = searchParams.get('success');

    // Handle Amazon OAuth callback (per FRONTEND_AMAZON_OAUTH_SYNC_STATUS.md)
    if (amazonConnected === 'true') {
      toast({
        title: 'Amazon Account Connected Successfully',
        description: message || 'Amazon account connected successfully! Redirecting to sync status...',
      });

      // Refresh integration status to update UI
      api.getIntegrationsStatus().then(res => {
        if (res.ok && res.data) {
          setStatus(res.data);
        }
      });

      // Clean up URL by removing query parameters after processing
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });

      // Auto-redirect to sync page after 2-3 seconds to show the live dialogue logs
      setTimeout(() => {
        navigate('/sync');
      }, 2500);
      return; // Exit early to avoid processing other providers
    }

    // Handle Amazon OAuth error
    if (amazonError === 'true' || (error && amazonConnected === null && !gmailConnected && !outlookConnected && !gdriveConnected && !dropboxConnected)) {
      toast({
        title: 'Amazon Connection Failed',
        description: error ? decodeURIComponent(error) : (message || 'Failed to connect Amazon account. Please try again.'),
        variant: 'destructive',
      });

      // Clean up URL
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
      return; // Exit early
    }

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

      // Refresh evidence sources
      api.getEvidenceSources().then(res => {
        if (res.ok && res.data) {
          setEvidenceSources(res.data.sources || []);
        }
      });

      // Clean up URL by removing query parameters after processing (optional)
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }

    // Show error notification if OAuth failed (for non-Amazon providers)
    if (error && !amazonError && amazonConnected !== 'true') {
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
    if (success && !amazonConnected && !gmailConnected && !outlookConnected && !gdriveConnected && !dropboxConnected) {
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

  // Load evidence sources
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getEvidenceSources();
        if (!cancelled && res.ok && res.data) {
          setEvidenceSources(res.data.sources || []);
        }
      } catch (error) {
        console.error('Failed to load evidence sources:', error);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // ... (keep all the existing useEffect and handler functions)

  return (
    <PageLayout title="Integrations">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-12 text-gray-900">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">Integrations</h1>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">Platform Connections</p>
            </div>

            {/* Hardcopy Document Notice - Institutional Banking Style */}
            <div className="bg-gray-50 border border-gray-200 mb-8">
              <div className="px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-[0.15em]">Manual Upload</p>
                  <p className="text-xs text-gray-700 mt-0.5">
                    For hardcopy documents, scanned images, or files not available via connected sources.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/evidence-locker')}
                  className="text-xs font-medium text-gray-900 hover:text-gray-700 transition-colors uppercase tracking-[0.1em] border border-gray-300 px-4 py-2 bg-white hover:bg-gray-50"
                >
                  Open Evidence Locker
                </button>
              </div>
            </div>

            {/* Core Integrations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Amazon SP-API */}
              <div className="bg-white border border-gray-200 rounded-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-orange-500 flex items-center justify-center">
                      <img src="/Amazon-logo.png" alt="Amazon" className="h-5 w-5 object-contain brightness-0 invert" />
                    </div>
                    <div>
                      <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Amazon SP-API</h2>
                      <p className="text-[10px] text-gray-500 mt-0.5">Inventory, orders, fees & returns</p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-[9px] uppercase tracking-[0.1em] font-medium',
                    (isSandbox || status?.amazon_connected)
                      ? 'text-emerald-600'
                      : 'text-gray-500'
                  )}>
                    {(isSandbox || status?.amazon_connected) ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last sync</span>
                    <span className="text-gray-900">{status?.lastSync || lastSyncTime}</span>
                  </div>
                  <button
                    className="w-full py-2.5 text-xs text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      toast({
                        title: (isSandbox || status?.amazon_connected) ? 'Configure Amazon' : 'Connect Amazon',
                        description: 'Redirecting to Amazon SP-API...',
                      });
                      navigate('/integrations/reconnect/amazon');
                    }}
                  >
                    {(isSandbox || status?.amazon_connected) ? 'Manage Connection' : 'Connect Amazon'}
                  </button>
                </div>
              </div>

              {/* Document Sources */}
              <div className="bg-white border border-gray-200 rounded-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Document Sources</h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">Email and cloud for auto-ingestion</p>
                </div>
                <div className="p-6 space-y-4">
                  {evidenceSources.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-gray-500 font-medium mb-2">Connected Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {evidenceSources.filter(s => s.status === 'connected').map((source) => (
                          <span key={source.id} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 text-gray-700">
                            {source.provider === 'gdrive' ? 'Google Drive' : source.provider}: {source.account_email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border border-gray-200 divide-y divide-gray-100">
                    {(['gmail', 'outlook', 'gdrive', 'dropbox'] as const).map((p) => {
                      if (p === 'gmail') {
                        const isConnected = () => {
                          if (status?.providerIngest?.[p]?.connected === true) return true;
                          const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
                          if (status?.providerIngest?.[capitalized]?.connected === true) return true;
                          if (status?.providers?.[p] === true) return true;
                          if (status?.providers?.[capitalized] === true) return true;
                          const providerConnectedKey = `${p}_connected` as keyof typeof status;
                          if (status && (status as any)[providerConnectedKey] === true) return true;
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
                          <div key={p} className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <img src="/gmailicon.png" alt="Gmail" className="h-6 w-6 object-contain" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Gmail</p>
                                <p className="text-xs text-gray-600">
                                  {connected ? `Last ingest: ${getLastIngest()}` : 'Connect your Gmail inbox to automatically ingest invoices and receipts.'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                              <Badge variant="outline" className={cn('w-fit text-xs', connected ? 'border-emerald-500 text-emerald-700 font-semibold' : hasError() ? 'border-red-400 text-red-500' : 'border-gray-300 text-gray-600')}>
                                {connected ? 'Connected' : hasError() ? 'Error' : 'Not connected'}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className={cn(connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-emerald-500 hover:bg-emerald-400 text-white')}
                                  onClick={() => handleConnectDocSource(p)}
                                  disabled={providerLoading !== null || disconnectingProvider === p}
                                >
                                  {providerLoading === p ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                      Connecting…
                                    </>
                                  ) : (
                                    connected ? 'Sync Now' : 'Connect'
                                  )}
                                </Button>
                                {connected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to disconnect Gmail? This will stop automatic evidence collection from this source.')) {
                                        return;
                                      }
                                      try {
                                        setDisconnectingProvider(p);
                                        const r = await api.disconnectIntegration(p, true);
                                        if (r.ok) {
                                          toast({
                                            title: 'Disconnected',
                                            description: 'Gmail integration has been disconnected successfully.',
                                          });
                                          const s = await api.getIntegrationsStatus();
                                          if (s.ok && s.data) {
                                            setStatus(s.data);
                                          }
                                          const sources = await api.getEvidenceSources();
                                          if (sources.ok && sources.data) {
                                            setEvidenceSources(sources.data.sources || []);
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
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const providerMeta = {
                        outlook: { name: 'Outlook', icon: '/outlookicon.webp' },
                        gdrive: { name: 'Google Drive', icon: '/gd.png' },
                        dropbox: { name: 'Dropbox', icon: '/Dropbox_Icon.svg.png' },
                      } as const;
                      const providerName = providerMeta[p].name;
                      const providerIcon = providerMeta[p].icon;

                      // Check connection status for this provider
                      const isConnected = () => {
                        if (status?.providerIngest?.[p]?.connected === true) return true;
                        const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
                        if (status?.providerIngest?.[capitalized]?.connected === true) return true;
                        if (status?.providers?.[p] === true) return true;
                        if (status?.providers?.[capitalized] === true) return true;
                        const providerConnectedKey = `${p}_connected` as keyof typeof status;
                        if (status && (status as any)[providerConnectedKey] === true) return true;
                        // Also check evidenceSources
                        if (evidenceSources.some(s => s.provider === p && s.status === 'connected')) return true;
                        return false;
                      };
                      const hasError = () => {
                        return status?.providerIngest?.[p]?.error || status?.providerIngest?.[p.charAt(0).toUpperCase() + p.slice(1)]?.error;
                      };
                      const getLastIngest = () => {
                        const source = evidenceSources.find(s => s.provider === p && s.status === 'connected');
                        if (source?.last_sync_at) return new Date(source.last_sync_at).toLocaleString();
                        return status?.providerIngest?.[p]?.lastIngest || status?.providerIngest?.[p.charAt(0).toUpperCase() + p.slice(1)]?.lastIngest || '—';
                      };
                      const connected = isConnected();

                      return (
                        <div key={p} className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <img src={providerIcon} alt={providerName} className="h-6 w-6 object-contain" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{providerName}</p>
                              <p className="text-xs text-gray-600">
                                {connected ? `Last ingest: ${getLastIngest()}` : `Connect your ${providerName} to automatically ingest invoices and receipts.`}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <Badge variant="outline" className={cn('w-fit text-xs', connected ? 'border-emerald-500 text-emerald-700 font-semibold' : hasError() ? 'border-red-400 text-red-500' : 'border-gray-300 text-gray-600')}>
                              {connected ? 'Connected' : hasError() ? 'Error' : 'Not connected'}
                            </Badge>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className={cn(connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : 'bg-emerald-500 hover:bg-emerald-400 text-white')}
                                onClick={() => handleConnectDocSource(p)}
                                disabled={providerLoading !== null || disconnectingProvider === p}
                              >
                                {providerLoading === p ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Connecting…
                                  </>
                                ) : (
                                  connected ? 'Sync Now' : 'Connect'
                                )}
                              </Button>
                              {connected && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to disconnect ${providerName}? This will stop automatic evidence collection from this source.`)) {
                                      return;
                                    }
                                    try {
                                      setDisconnectingProvider(p);
                                      const r = await api.disconnectIntegration(p, true);
                                      if (r.ok) {
                                        toast({
                                          title: 'Disconnected',
                                          description: `${providerName} integration has been disconnected successfully.`,
                                        });
                                        const s = await api.getIntegrationsStatus();
                                        if (s.ok && s.data) {
                                          setStatus(s.data);
                                        }
                                        const sources = await api.getEvidenceSources();
                                        if (sources.ok && sources.data) {
                                          setEvidenceSources(sources.data.sources || []);
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
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white via-white to-gray-50 p-5 space-y-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Auto‑collect</p>
                        <p className="text-xs text-gray-500">Automatically sweep connected inboxes for invoices and receipts.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
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
                    </div>
                    <Separator className="bg-gray-100" />
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Schedule</p>
                        <p className="text-xs text-gray-500">Choose when evidence is ingested.</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'hourly', label: 'Hourly' },
                          { value: 'daily_0200', label: '02:00 UTC' },
                          { value: 'daily_0600', label: '06:00 UTC' },
                          { value: 'daily_1000', label: '10:00 UTC' },
                          { value: 'daily_1400', label: '14:00 UTC' },
                          { value: 'daily_1800', label: '18:00 UTC' },
                          { value: 'daily_2200', label: '22:00 UTC' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={cn(
                              "px-3 py-2 text-xs border transition-colors",
                              schedule === opt.value
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            )}
                            disabled={updatingSchedule}
                            onClick={async () => {
                              if (schedule === opt.value) return;
                              try {
                                setUpdatingSchedule(true);
                                const r = await api.setEvidenceSchedule(opt.value);
                                if (r.ok) {
                                  setSchedule(opt.value);
                                  toast({
                                    title: 'Schedule Updated',
                                    description: opt.value === 'hourly'
                                      ? 'Evidence will be ingested every hour.'
                                      : `Evidence will be ingested daily at ${opt.label}.`,
                                  });
                                } else {
                                  toast({
                                    title: 'Update Failed',
                                    description: r.error || 'Failed to update schedule.',
                                    variant: 'destructive',
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: 'Update Failed',
                                  description: 'An error occurred. Please try again.',
                                  variant: 'destructive',
                                });
                              } finally {
                                setUpdatingSchedule(false);
                              }
                            }}
                          >
                            {updatingSchedule && schedule === opt.value ? (
                              <RefreshCw className="h-3 w-3 animate-spin mx-auto" />
                            ) : (
                              opt.label
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator className="bg-gray-100" />
                    <div className="space-y-6">
                      {/* Section Header */}
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 uppercase tracking-[0.15em]">Ingestion Filters</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Configure rules for maximum document yield</p>
                        </div>
                      </div>

                      {/* Grid Layout for Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Sender Patterns */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">Sender Patterns (OR)</label>
                          <p className="text-[10px] text-gray-400 -mt-1">Match emails from these senders. Use * as wildcard.</p>
                          <Input
                            placeholder="*@amazon.com, *invoice*, *@alibaba.com"
                            value={filters.senderPatterns.join(', ')}
                            onChange={(e) => setFilters(f => ({ ...f, senderPatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                          />
                        </div>

                        {/* Subject Keywords */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">Subject Keywords (OR)</label>
                          <p className="text-[10px] text-gray-400 -mt-1">Match emails containing these subject terms.</p>
                          <Input
                            placeholder="invoice, receipt, reimbursement, case, shipment"
                            value={filters.subjectKeywords.join(', ')}
                            onChange={(e) => setFilters(f => ({ ...f, subjectKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                          />
                        </div>

                        {/* File Types */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">File Types</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={filters.fileTypes.pdf}
                                onChange={(e) => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, pdf: e.target.checked } }))}
                                className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                              />
                              <span className="text-xs text-gray-700">PDF</span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={filters.fileTypes.images}
                                onChange={(e) => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, images: e.target.checked } }))}
                                className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                              />
                              <span className="text-xs text-gray-700">PNG / JPG</span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={filters.fileTypes.spreadsheets}
                                onChange={(e) => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, spreadsheets: e.target.checked } }))}
                                className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                              />
                              <span className="text-xs text-gray-700">XLS / CSV</span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                              <input
                                type="checkbox"
                                checked={filters.fileTypes.docs}
                                onChange={(e) => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, docs: e.target.checked } }))}
                                className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                              />
                              <span className="text-xs text-gray-700">DOC / DOCX</span>
                            </label>
                          </div>
                        </div>

                        {/* File Name Patterns */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">File Name Contains</label>
                          <p className="text-[10px] text-gray-400 -mt-1">Match attachment names containing these terms.</p>
                          <Input
                            placeholder="invoice, receipt, order, FBA, shipment, reimburse"
                            value={filters.fileNamePatterns.join(', ')}
                            onChange={(e) => setFilters(f => ({ ...f, fileNamePatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                          />
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">Date Range</label>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { value: 'last_30', label: 'Last 30 days' },
                              { value: 'last_90', label: 'Last 90 days' },
                              { value: 'last_12_months', label: 'Last 12 months' },
                              { value: 'since_last_sync', label: 'Since last sync' },
                              { value: 'all', label: 'All time' }
                            ].map(opt => (
                              <label
                                key={opt.value}
                                className={cn(
                                  "flex items-center justify-center px-2 py-1.5 text-[10px] border cursor-pointer transition-colors",
                                  filters.dateRange === opt.value
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                )}
                              >
                                <input
                                  type="radio"
                                  name="dateRange"
                                  value={opt.value}
                                  checked={filters.dateRange === opt.value}
                                  onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
                                  className="sr-only"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Folders */}
                        <div className="space-y-2">
                          <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em]">Folders (Cloud Drives)</label>
                          <p className="text-[10px] text-gray-400 -mt-1">Comma-separated folder paths to scan.</p>
                          <Input
                            placeholder="/Finance, /Invoices, /Amazon, /Receipts"
                            value={filters.folders.join(', ')}
                            onChange={(e) => setFilters(f => ({ ...f, folders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                            className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                          />
                        </div>
                      </div>

                      {/* Exclusions Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-3">Exclusion Rules</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Exclude Senders</label>
                            <Input
                              placeholder="*newsletter*, *marketing*, *promo*"
                              value={filters.excludeSenders.join(', ')}
                              onChange={(e) => setFilters(f => ({ ...f, excludeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                              className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-500">Exclude Subjects</label>
                            <Input
                              placeholder="unsubscribe, promotional, marketing"
                              value={filters.excludeSubjects.join(', ')}
                              onChange={(e) => setFilters(f => ({ ...f, excludeSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                              className="border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-xs h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Deduplication Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-3">Deduplication</label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.skipDuplicates}
                              onChange={(e) => setFilters(f => ({ ...f, skipDuplicates: e.target.checked }))}
                              className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                            />
                            <span className="text-xs text-gray-700">Skip duplicate filenames</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.skipExisting}
                              onChange={(e) => setFilters(f => ({ ...f, skipExisting: e.target.checked }))}
                              className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-500"
                            />
                            <span className="text-xs text-gray-700">Skip already ingested</span>
                          </label>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t border-gray-200 flex gap-3">
                        <Button
                          size="sm"
                          className="bg-gray-900 text-white hover:bg-gray-800 text-xs px-6"
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 text-xs"
                          onClick={() => {
                            toast({
                              title: 'Test Run',
                              description: 'Preview functionality coming soon. Save filters and run ingestion to test.',
                            });
                          }}
                        >
                          Test Run
                        </Button>
                      </div>
                    </div>
                    <Separator className="bg-gray-100" />
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Last ingest</p>
                        <p className="text-xs text-gray-500">{status?.lastIngest || 'Just now'}</p>
                      </div>
                      <Button
                        size="lg"
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold w-full"
                        onClick={async () => {
                          try {
                            setIngestingAll(true);
                            setIngestionResult(null);
                            const r = await api.ingestAllEvidence({
                              maxResults: 50,
                              autoParse: true
                            });
                            if (r.ok && r.data) {
                              setIngestionResult(r.data);
                              toast({
                                title: r.data.success ? 'Ingestion Complete' : 'Ingestion Completed with Errors',
                                description: r.data.totalDocumentsIngested
                                  ? `Ingested ${r.data.totalDocumentsIngested} documents from ${r.data.totalItemsProcessed} items across all sources.`
                                  : r.data.message || 'Ingestion completed.',
                                variant: r.data.success ? 'default' : 'destructive',
                              });
                              setTimeout(async () => {
                                const s = await api.getIntegrationsStatus();
                                if (s.ok && s.data) {
                                  setStatus(s.data);
                                }
                                const sources = await api.getEvidenceSources();
                                if (sources.ok && sources.data) {
                                  setEvidenceSources(sources.data.sources || []);
                                }
                              }, 2000);
                            } else {
                              setIngestionResult({ success: false, errors: [r.error || 'Failed to start ingestion'] });
                              toast({
                                title: 'Ingestion Failed',
                                description: r.error || 'Failed to start ingestion. Please try again.',
                                variant: 'destructive',
                              });
                            }
                          } catch (error) {
                            console.error('Failed to ingest evidence:', error);
                            setIngestionResult({ success: false, errors: ['An error occurred while ingesting evidence. Please try again.'] });
                            toast({
                              title: 'Ingestion Failed',
                              description: 'An error occurred while ingesting evidence. Please try again.',
                              variant: 'destructive',
                            });
                          } finally {
                            setIngestingAll(false);
                          }
                        }}
                        disabled={ingestingGmail || ingestingAll || (() => {
                          const connectedSources = evidenceSources.filter(s => s.status === 'connected');
                          if (connectedSources.length > 0) return false;
                          if (status?.providerIngest) {
                            return !Object.values(status.providerIngest).some((p: any) => p?.connected === true);
                          }
                          return true;
                        })()}
                      >
                        {ingestingAll ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Ingesting from All Sources…
                          </>
                        ) : (
                          'Ingest from All Sources'
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        {evidenceSources.filter(s => s.status === 'connected').length > 0 ||
                          (status?.providerIngest && Object.values(status.providerIngest).some((p: any) => p?.connected === true))
                          ? 'Uses unified orchestrator – processes all connected sources simultaneously in parallel.'
                          : 'Connect at least one evidence source to begin ingestion.'}
                      </p>
                      {ingestionResult && (
                        <div className="border border-gray-200 bg-gray-50">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className={`text-[9px] font-semibold uppercase tracking-[0.15em] ${ingestionResult.success ? 'text-gray-700' : 'text-gray-600'}`}>
                              {ingestionResult.success ? 'Ingestion Complete' : 'Ingestion Completed with Errors'}
                            </p>
                          </div>
                          <div className="px-4 py-3">
                            {ingestionResult.totalDocumentsIngested !== undefined ? (
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-500 uppercase tracking-[0.05em]">Documents Ingested</span>
                                  <span className="text-gray-900 font-medium">{ingestionResult.totalDocumentsIngested}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 uppercase tracking-[0.05em]">Items Processed</span>
                                  <span className="text-gray-900 font-medium">{ingestionResult.totalItemsProcessed}</span>
                                </div>
                                {ingestionResult.results && (
                                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-[0.1em] mb-2">Breakdown</p>
                                    {Object.entries(ingestionResult.results).map(([provider, result]) => (
                                      <div key={provider} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">{provider === 'gdrive' ? 'Google Drive' : provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
                                        <span className="text-gray-800">{result.documentsIngested} / {result.emailsProcessed || result.filesProcessed}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-500 uppercase tracking-[0.05em]">Documents Ingested</span>
                                  <span className="text-gray-900 font-medium">{ingestionResult.documentsIngested || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500 uppercase tracking-[0.05em]">Items Processed</span>
                                  <span className="text-gray-900 font-medium">{ingestionResult.emailsProcessed || ingestionResult.filesProcessed || 0}</span>
                                </div>
                              </div>
                            )}
                            {ingestionResult.errors && ingestionResult.errors.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-[0.1em] mb-2">Errors</p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {ingestionResult.errors.map((error, i) => (
                                    <li key={i} className="text-gray-600">- {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          onClick={async () => {
                            try {
                              setIngestingGmail(true);
                              setIngestionResult(null);
                              const r = await api.ingestGmailEvidence({ autoParse: true });
                              if (r.ok && r.data) {
                                setIngestionResult(r.data);
                                toast({
                                  title: 'Gmail Ingestion Complete',
                                  description: `Ingested ${r.data.documentsIngested} documents from ${r.data.emailsProcessed} emails.`,
                                });
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
                            'Ingest Gmail Only'
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('/evidence-locker')} className="text-gray-500 hover:text-gray-900">
                          Open Evidence Locker
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Recent Activity</h2>
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-600">
                  {(() => {
                    const connectedProviders = evidenceSources.filter(s => s.status === 'connected').map(s => {
                      const name = s.provider === 'gdrive' ? 'Google Drive' : s.provider.charAt(0).toUpperCase() + s.provider.slice(1);
                      return name;
                    });
                    const totalDocs = ingestionResult?.totalDocumentsIngested || ingestionResult?.documentsIngested || 0;
                    const parts = [];

                    if (connectedProviders.length > 0) {
                      parts.push(`Connected: ${connectedProviders.join(', ')}`);
                    }

                    if (ingestionResult) {
                      parts.push(`Ingested ${totalDocs} docs`);
                    } else if (status?.lastIngest) {
                      parts.push(`Last ingest: ${status.lastIngest}`);
                    } else {
                      parts.push('No ingestion yet');
                    }

                    if (status?.amazon_connected) {
                      parts.push('Amazon SP-API synced');
                    }

                    return parts.length > 0 ? parts.join(' • ') : 'No activity yet';
                  })()}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}


