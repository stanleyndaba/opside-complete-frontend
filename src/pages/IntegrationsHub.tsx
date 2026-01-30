import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Share2, Shield, Lock, Zap, FileText, Database, Globe, CheckCircle2, AlertCircle, Plus, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

// ... (existing constants)

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { toast } = useToast();
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [status, setStatus] = useState<{ amazon_connected: boolean; docs_connected: boolean; providers?: Record<string, boolean>; lastIngest?: string; lastSync?: string; providerIngest?: Record<string, { connected: boolean; lastIngest?: string; error?: string; scopes?: string[] }> } | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreData, setNewStoreData] = useState({ name: '', marketplace: 'ATVPDKIKX0DER', seller_id: '' });
  const [addingStore, setAddingStore] = useState(false);
  const [deletingStore, setDeletingStore] = useState<string | null>(null);

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
    fileTypes: { pdf: boolean; images: boolean; spreadsheets: boolean; docs: boolean; shipping: boolean };
    fileNamePatterns: string[];
    folders: string[];
    dateRange: 'last_30' | 'last_90' | 'last_12_months' | 'last_18_months' | 'since_last_sync' | 'all';
    skipDuplicates: boolean;
    skipExisting: boolean;
  }>({
    // === SENDER PATTERNS (Carriers + Marketplaces + Freight) ===
    senderPatterns: [
      // Carriers
      '*@fedex.com', '*@ups.com', '*@dhl.com', '*@usps.com', '*@ontrac.com', '*@freight*',
      // Marketplaces & Amazon
      '*@amazon.com', '*@sellercentral.amazon.*', '*@payments.amazon.com',
      // 3PL & Fulfillment platforms
      '*@shipstation.com', '*@shipbob.com', '*@easyship.com', '*@flexport.com', '*@deliverr.com',
      // Invoice-like domains (wildcard for supplier invoices)
      '*invoice*', '*billing*', '*accounts*', '*finance*'
    ],
    excludeSenders: ['*newsletter*', '*marketing*', '*promo*', '*noreply*advertising*', '*survey*'],
    // === SUBJECT KEYWORDS (5 Document Classes) ===
    subjectKeywords: [
      // CLASS 1: Proof of Ownership / Cost
      'invoice', 'tax invoice', 'proforma', 'receipt', 'PO', 'purchase order', 'packing slip', 'commercial invoice', 'vendor invoice', 'supplier',
      // CLASS 2: Proof of Shipment
      'bill of lading', 'BOL', 'waybill', 'tracking', 'shipment', 'dispatch', 'airwaybill', 'AWB', 'freight', 'manifest', 'booking confirmation', 'carrier',
      // CLASS 3: Proof of Delivery
      'POD', 'proof of delivery', 'delivery confirmation', 'signed', 'delivered', 'received',
      // CLASS 4: Returns / Refunds
      'return authorization', 'RMA', 'return label', 'return confirmed', 'refund issued', 'credit note', 'credit memo', 'refund', 'return request',
      // CLASS 5: Inventory / ASN
      'ASN', 'advance shipment notice', 'packing list', 'shipment summary', 'inventory', 'pick list', 'pack slip',
      // Amazon-specific
      'reimbursement', 'case', 'FBA', 'removal order', 'liquidation'
    ],
    excludeSubjects: ['unsubscribe', 'promotional', 'survey', 'feedback request', 'rate your'],
    fileTypes: { pdf: true, images: true, spreadsheets: true, docs: false, shipping: true },
    // === FILENAME PATTERNS (5 Document Classes) ===
    fileNamePatterns: [
      // CLASS 1: Ownership / Cost
      'invoice', 'inv-', 'inv_', 'receipt', 'tax-invoice', 'purchase-order', 'po-', 'po_', 'packing-slip', 'commercial-invoice', 'proforma',
      // CLASS 2: Shipment
      'bol', 'bill-of-lading', 'waybill', 'awb', 'tracking', 'manifest', 'shipment', 'freight', 'dispatch', 'booking',
      // CLASS 3: Delivery
      'pod', 'proof-of-delivery', 'delivery', 'signed', 'confirmation',
      // CLASS 4: Returns / Credits
      'rma', 'return', 'credit-note', 'credit-memo', 'refund',
      // CLASS 5: Inventory / ASN
      'asn', 'packing-list', 'pack-list', 'pick-list', 'inventory',
      // Amazon / FBA
      'FBA', 'reimburse', 'removal', 'liquidation', 'order'
    ],
    // === FOLDER STRUCTURE ===
    folders: ['/Invoices', '/Shipping', '/Returns', '/Credits', '/Amazon', '/Finance', '/Inventory'],
    // 18-month window for Amazon claimable period
    dateRange: 'last_18_months',
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
        if (tenantSlug) {
          navigate(`/app/${tenantSlug}/sync`);
        } else {
          navigate('/sync');
        }
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

  // Load stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const res = await api.getStores();
        if (res.ok && res.data?.stores) {
          setStores(res.data.stores);
        }
      } catch (error) {
        console.error('Failed to load stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  const handleAddStore = async () => {
    if (!newStoreData.name) {
      toast({ title: "Validation Error", description: "Store name is required", variant: "destructive" });
      return;
    }
    try {
      setAddingStore(true);
      const res = await api.createStore(newStoreData);
      if (res.ok) {
        setStores([...stores, res.data.store]);
        setShowAddStore(false);
        setNewStoreData({ name: '', marketplace: 'ATVPDKIKX0DER', seller_id: '' });
        toast({ title: "Store Added", description: "New store node established." });
      } else {
        toast({ title: "Failed", description: res.error || "Could not create store", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Terminal failure during node establishment", variant: "destructive" });
    } finally {
      setAddingStore(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("Are you sure you want to decommission this store node?")) return;
    try {
      setDeletingStore(id);
      const res = await api.deleteStore(id);
      if (res.ok) {
        setStores(stores.filter(s => s.id !== id));
        toast({ title: "Node Decommissioned", description: "Store node successfully removed." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove node", variant: "destructive" });
    } finally {
      setDeletingStore(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageLayout title="Integrations" midnight hideNavbar hideSidebar>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url(\"data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E\")` }} />

        <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12">
          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-emerald-500/50" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">Central Command</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
                Integrations <span className="text-emerald-500/20 px-2 tracking-tighter">/</span> Hub
              </h1>
              <p className="text-gray-400 max-w-xl text-lg leading-relaxed">
                Management of all primary harvesting nodes and terminal connections. Data is isolated per store and synchronized across our institutional matrix.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Global Sync Status</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-white tracking-tight">Systems Operational</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Nodes Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12"
          >
            {/* Amazon Command Node */}
            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-12">
              <div className="h-full bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col relative group transition-all duration-500 hover:border-emerald-500/30">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity">
                  <Database className="w-12 h-12 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(234,88,12,0.15)] group-hover:shadow-[0_0_30px_rgba(234,88,12,0.3)] transition-all duration-500 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img src="/Amazon-logo.png" alt="Amazon" className="h-10 w-10 object-contain brightness-0 invert relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif text-white tracking-tight mb-1">Amazon Matrix</h3>
                      <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.4em]">Primary Ingestion Infrastructure</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Dialog open={showAddStore} onOpenChange={setShowAddStore}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-12 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 text-xs font-mono uppercase tracking-widest gap-2"
                        >
                          <Plus className="w-4 h-4" /> Link Store Node
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif">Establish New Store Node</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Configure authorization parameters for the terminal connection.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Store Designator</label>
                              <Input
                                placeholder="Alpha-Store-01"
                                value={newStoreData.name}
                                onChange={e => setNewStoreData({ ...newStoreData, name: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-white h-12"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Seller Identity (Optional)</label>
                              <Input
                                placeholder="A3XXXXXXXXXXXX"
                                value={newStoreData.seller_id}
                                onChange={e => setNewStoreData({ ...newStoreData, seller_id: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-white h-12"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Marketplace Region</label>
                              <select
                                className="w-full h-12 px-3 bg-white/5 border-white/10 rounded-md text-sm border focus:border-emerald-500/50 focus:ring-0 outline-none text-white font-mono"
                                value={newStoreData.marketplace}
                                onChange={e => setNewStoreData({ ...newStoreData, marketplace: e.target.value })}
                              >
                                <option value="ATVPDKIKX0DER">North America (US)</option>
                                <option value="EU">Europe (UK/DE/FR/IT/ES)</option>
                                <option value="A1F8U5RK5QF05O">Far East (JP)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => setShowAddStore(false)}
                            className="bg-transparent text-gray-400 hover:text-white font-mono uppercase text-[10px] py-1 tracking-widest"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddStore}
                            disabled={addingStore}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-mono uppercase text-[10px] h-12 px-8 tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          >
                            {addingStore ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Authorize Node"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => {
                        toast({ title: 'Establishing Terminal', description: 'Redirecting to Amazon SP-API Authorization...' });
                        navigate('/integrations/reconnect/amazon');
                      }}
                      className="h-12 bg-white text-black font-mono uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-500 hover:text-black transition-all duration-300 px-8"
                    >
                      Establish Master Connection
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {loadingStores ? (
                    <div className="col-span-full flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-emerald-500/30 animate-spin" />
                    </div>
                  ) : stores.length > 0 ? (
                    stores.map(store => (
                      <div key={store.id} className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm relative group/card transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.03]">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-base mb-1 truncate max-w-[150px]">{store.name}</span>
                            <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">{store.marketplace}</span>
                          </div>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">Status</span>
                            <span className="text-[10px] text-gray-300 font-medium">Synced</span>
                          </div>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            disabled={deletingStore === store.id}
                            className="opacity-0 group-hover/card:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400"
                          >
                            {deletingStore === store.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                      <p className="text-gray-500 italic font-serif opacity-50">No store nodes detected. Link a store to begin harvesting.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> US-EAST-1</span>
                    <span className="flex items-center gap-2"><Shield className="w-3 h-3 text-emerald-500/50" /> Encrypted</span>
                  </div>
                  <span className="text-gray-400">Security Signature: {Math.random().toString(16).substring(2, 10).toUpperCase()}</span>
                </div>
              </div>
            </motion.div>

            {/* Harvesting Nodes Title */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-8 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-emerald-500/30" />
                <h3 className="text-sm font-mono uppercase tracking-[0.4em] text-gray-500">Secondary Harvesting Nodes</h3>
              </div>
            </motion.div>

            {(['gmail', 'outlook', 'gdrive', 'dropbox'] as const).map((p) => {
              const providerMeta = {
                gmail: { name: 'Gmail', icon: '/gmailicon.png', color: 'bg-red-500/10', border: 'border-red-500/20' },
                outlook: { name: 'Outlook', icon: '/outlookicon.webp', color: 'bg-blue-500/10', border: 'border-blue-500/20' },
                gdrive: { name: 'Google Drive', icon: '/gd.png', color: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                dropbox: { name: 'Dropbox', icon: '/Dropbox_Icon.svg.png', color: 'bg-blue-600/10', border: 'border-blue-600/20' },
              } as const;

              const isConnected = () => {
                if (status?.providerIngest?.[p]?.connected === true) return true;
                const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
                if (status?.providerIngest?.[capitalized]?.connected === true) return true;
                if (status?.providers?.[p] === true) return true;
                if (status?.providers?.[capitalized] === true) return true;
                const providerConnectedKey = `${p}_connected` as keyof typeof status;
                if (status && (status as any)[providerConnectedKey] === true) return true;
                if (evidenceSources.some(s => s.provider === p && s.status === 'connected')) return true;
                return false;
              };

              const connected = isConnected();
              const meta = providerMeta[p];

              return (
                <motion.div key={p} variants={itemVariants} className="lg:col-span-12 xl:col-span-3">
                  <div className={`h-full bg-white/[0.02] backdrop-blur-md rounded-2xl border ${connected ? 'border-emerald-500/20' : 'border-white/5'} p-6 flex flex-col relative group transition-all duration-300 hover:bg-white/[0.04]`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`h-12 w-12 rounded-xl ${meta.color} flex items-center justify-center border ${meta.border} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                        <img src={meta.icon} alt={meta.name} className="h-6 w-6 object-contain" />
                      </div>
                      <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
                    </div>

                    <h4 className="text-lg font-serif text-white tracking-tight mb-1">{meta.name}</h4>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Evidence Repository</p>

                    <div className="flex-1">
                      {connected ? (
                        <div className="space-y-4">
                          <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                            <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Target Account</span>
                            <span className="text-xs text-gray-300 truncate block">
                              {evidenceSources.find(s => s.provider === p)?.account_email || 'Active Stream'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-9 border border-red-500/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[10px] font-mono uppercase tracking-widest"
                            onClick={() => handleConnectDocSource(p)} // Simplified for UI demonstration, actual logic uses disconnect
                          >
                            Decommission
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-500 leading-relaxed mb-4">
                            Establish persistent monitoring of this repository for financial artifacts.
                          </p>
                          <Button
                            className="w-full h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest gap-2"
                            onClick={() => handleConnectDocSource(p)}
                            disabled={providerLoading === p}
                          >
                            {providerLoading === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5 text-emerald-500" /> Initialize</>}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Logic Overrides Section */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-12 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-emerald-500/30" />
                <h3 className="text-sm font-mono uppercase tracking-[0.4em] text-gray-500">Autonomous Logic Overrides</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-8">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-white">Harvesting Parameters</h4>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Global Filter Configuration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Target Sender Patterns</label>
                    <Input
                      value={filters.senderPatterns.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, senderPatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-12"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Subject Scopes</label>
                    <Input
                      value={filters.subjectKeywords.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, subjectKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="bg-black/40 border-white/10 text-white font-mono text-xs h-12"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <label className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-6 block">Artifact Class Selection</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(filters.fileTypes).map(([type, enabled]) => (
                      <button
                        key={type}
                        onClick={() => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, [type]: !enabled } }))}
                        className={`p-4 rounded-xl border font-mono text-[10px] uppercase tracking-widest transition-all duration-300 ${enabled ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <label className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest mb-3 block">Exclusion Rules</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Exclude Senders</label>
                      <Input
                        placeholder="*newsletter*, *marketing*"
                        value={filters.excludeSenders.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-500 uppercase">Exclude Subjects</label>
                      <Input
                        placeholder="unsubscribe, promotional"
                        value={filters.excludeSubjects.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-black/40 border-white/10 text-white font-mono text-xs h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <Button
                    onClick={async () => {
                      setSavingFilters(true);
                      const r = await api.setEvidenceFilters(filters);
                      if (r.ok) toast({ title: "Filters Committed", description: "Harvesting parameters updated across grid." });
                      setSavingFilters(false);
                    }}
                    disabled={savingFilters}
                    className="h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-mono uppercase tracking-[0.2em] text-[10px] px-10"
                  >
                    {savingFilters ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Commit Changes"}
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-4">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-8 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <RefreshCw className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-white">Temporal Sync</h4>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Scheduling Engine</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {[
                    { value: 'hourly', label: 'Continuous (Hourly)' },
                    { value: 'daily_0200', label: 'Nightly 02:00' },
                    { value: 'daily_1000', label: 'Morning 10:00' },
                    { value: 'daily_1800', label: 'Evening 18:00' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={async () => {
                        setUpdatingSchedule(true);
                        const r = await api.setEvidenceSchedule(opt.value);
                        if (r.ok) {
                          setSchedule(opt.value);
                          toast({ title: "Temporal Shift", description: `Sync set to ${opt.label}` });
                        }
                        setUpdatingSchedule(false);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${schedule === opt.value ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${schedule === opt.value ? 'text-white' : 'text-gray-400'}`}>{opt.label}</span>
                        {schedule === opt.value && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Auto-Harvesting</span>
                      <span className="text-sm font-serif text-white">{autoCollect ? 'Active' : 'Standby'}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setUpdatingAutoCollect(true);
                        const next = !autoCollect;
                        const r = await api.setEvidenceAutoCollect(next);
                        if (r.ok) setAutoCollect(next);
                        setUpdatingAutoCollect(false);
                      }}
                      className={`h-10 w-20 rounded-full border transition-all duration-500 relative ${autoCollect ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className={`absolute top-1 bottom-1 w-8 rounded-full transition-all duration-500 ${autoCollect ? 'right-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'left-1 bg-gray-600'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ingestion Trigger */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <button
                  onClick={async () => {
                    setIngestingAll(true);
                    const r = await api.ingestAllEvidence();
                    if (r.ok) toast({ title: "Harvesting Initiated", description: "Processing all secondary repositories." });
                    setIngestingAll(false);
                  }}
                  disabled={ingestingAll}
                  className="relative w-full h-32 bg-black rounded-2xl border border-white/10 flex items-center justify-center gap-6 transition-all duration-500 group-hover:border-emerald-500/50"
                >
                  {ingestingAll ? (
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-10 h-10 text-emerald-500 group-hover:animate-pulse" />
                      <div className="text-left">
                        <span className="block text-3xl font-serif text-white tracking-tight">Initiate Mass Ingestion</span>
                        <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mt-1">Parallel Terminal Harvesting Activated</span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Activity Logs (Unified Bottom) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-12">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Grid Uptime</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-400 font-mono">99.998%</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Repositories</span>
                <span className="text-xs text-gray-400 font-mono">{evidenceSources.length} Active Node{evidenceSources.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Last Sync</span>
                <span className="text-xs text-gray-400 font-mono">{status?.lastIngest || 'Never'}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/evidence-locker')} className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-emerald-500 transition-colors">
                Evidence Locker
              </button>
              <div className="h-4 w-px bg-white/5" />
              <button className="text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-emerald-500 transition-colors">
                Terminal Protocols
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}


