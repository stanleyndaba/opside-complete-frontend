import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Database, Globe, Shield, Plus, Trash2, RefreshCw, 
  Search as SearchIcon, Info, Mail, Cloud, Settings, 
  ArrowRight, Link2, Box, CheckCircle2, AlertCircle,
  Lock, Zap, FileText, DollarSign, Package, Calculator,
  Truck, LayoutGrid, Layers, FileCode, Clock
} from 'lucide-react';
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

import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { createAuthenticatedEventStream } from '@/lib/authenticatedSSE';
import { tenantRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

type ProviderKey = 'amazon' | 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'slack' | 'adobe_sign' | 'onedrive' | 'quickbooks' | 'xero';
type SecondaryProviderKey = Exclude<ProviderKey, 'amazon'>;

type IntegrationProviderStatus = {
  provider: ProviderKey;
  source_id?: string;
  connected: boolean;
  auth_valid: boolean;
  needs_reconnect: boolean;
  last_ingest_at?: string;
  last_success_at?: string;
  error_state?: string;
  error_message?: string;
  ingestion_state: 'disconnected' | 'unverified' | 'no_data' | 'stale' | 'current' | 'failed';
  has_data: boolean;
  account_email?: string;
  scopes?: string[];
};

type IntegrationStatusDTO = {
  amazon_connected: boolean;
  docs_connected: boolean;
  lastIngest?: string | null;
  lastSync?: string | null;
  tenantName?: string;
  amazon_account?: {
    seller_id?: string;
    display_name?: string;
    email?: string;
    marketplaces?: string[];
  } | null;
  evidenceSettings?: {
    autoCollect: boolean;
    schedule: string;
    filters: {
      senderPatterns: string[];
      excludeSenders: string[];
      subjectKeywords: string[];
      excludeSubjects: string[];
      fileTypes: { pdf: boolean; images: boolean; spreadsheets: boolean; docs: boolean; shipping: boolean };
      fileNamePatterns: string[];
      dateRange: 'last_30' | 'last_90' | 'last_12_months' | 'last_18_months' | 'since_last_sync' | 'all';
    };
  };
  providers?: Record<string, IntegrationProviderStatus>;
};

type SkippedProvider = {
  provider: string;
  reason: string;
};

type EvidenceStatusDTO = {
  hasConnectedSource: boolean;
  hasIngestableSource: boolean;
  lastIngestion?: string;
  documentsCount: number;
  processingCount: number;
  parsedCount: number;
  matchReadyCount: number;
  sourcesResolved: number;
  skippedProviders: SkippedProvider[];
};

type EvidenceSourceDTO = {
  id: string;
  provider: SecondaryProviderKey;
  account_email: string;
  status: 'connected' | 'disconnected' | 'error';
  connected: boolean;
  ingestable: boolean;
  ingestable_reason: string | null;
  last_ingested_at: string | null;
  created_at: string | null;
  documents_count: number;
  parsed_count: number;
  match_ready_count: number;
  metadata: Record<string, any>;
};

type EvidenceSourcesDTO = {
  sources: EvidenceSourceDTO[];
  count: number;
  connectedCount: number;
  ingestableCount: number;
  skippedProviders: SkippedProvider[];
};

const ACTIVE_SECONDARY_PROVIDERS: SecondaryProviderKey[] = ['gmail', 'slack', 'dropbox', 'gdrive', 'quickbooks', 'xero'];
const PARKED_SECONDARY_PROVIDERS: SecondaryProviderKey[] = ['outlook', 'adobe_sign', 'onedrive'];
const SECONDARY_PROVIDERS: SecondaryProviderKey[] = [...ACTIVE_SECONDARY_PROVIDERS, ...PARKED_SECONDARY_PROVIDERS];
const PARKED_PROVIDER_AVAILABLE_DATE = 'May 20th, 2026';
const DEMO_WORKSPACE_SLUGS = new Set(['demo-workspace', 'demo-worspace']);
const DEMO_PROVIDER_ACCOUNTS: Record<SecondaryProviderKey, string> = {
  gmail: 'claims@acme-operations.test',
  slack: 'ops-alerts@acme-operations.test',
  dropbox: 'warehouse@acme-operations.test',
  gdrive: 'evidence@acme-operations.test',
  outlook: 'finance@acme-operations.test',
  adobe_sign: 'contracts@acme-operations.test',
  onedrive: 'records@acme-operations.test',
  quickbooks: 'books@acme-operations.test',
  xero: 'ledger@acme-operations.test',
};
const DEMO_PROVIDER_LAST_INGEST = '2026-04-21T08:54:21.000Z';

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady, tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || null;
  const isDemoWorkspace = activeSlug ? DEMO_WORKSPACE_SLUGS.has(activeSlug.toLowerCase()) : false;
  const { toast } = useToast();
  const { isFull, capacity } = useOnboardingCapacity();
  const [status, setStatus] = useState<IntegrationStatusDTO | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreData, setNewStoreData] = useState({ name: '', marketplace: 'ATVPDKIKX0DER', seller_id: '' });
  const [addingStore, setAddingStore] = useState(false);
  const [deletingStore, setDeletingStore] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [showRecoveryReveal, setShowRecoveryReveal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ totalAmount: number; currency: string; claimCount: number } | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const [activeCategory, setActiveCategory] = useState<'all' | 'marketplace' | 'evidence' | 'finance' | 'files'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [autoCollect, setAutoCollect] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<string>('daily_0200');
  const [filters, setFilters] = useState({
    senderPatterns: [],
    excludeSenders: [],
    subjectKeywords: [],
    excludeSubjects: [],
    fileTypes: { pdf: true, images: true, spreadsheets: true, docs: false, shipping: true },
    fileNamePatterns: [],
    dateRange: 'last_18_months'
  });

  const [providerLoading, setProviderLoading] = useState<string | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null);
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatusDTO | null>(null);
  const [evidenceSourcesState, setEvidenceSourcesState] = useState<EvidenceSourcesDTO>({
    sources: [],
    count: 0,
    connectedCount: 0,
    ingestableCount: 0,
    skippedProviders: []
  });

  const refreshIntegrationTruth = async () => {
    if (!activeSlug) return;
    try {
      const [statusRes, storesRes, evidenceStatusRes, evidenceSourcesRes] = await Promise.all([
        api.getIntegrationsStatus(activeSlug),
        api.getStores(activeSlug),
        api.getEvidenceStatus(activeSlug),
        api.getEvidenceSources(activeSlug)
      ]);

      if (statusRes.ok && statusRes.data) {
        setStatus(statusRes.data as IntegrationStatusDTO);
      }
      if (storesRes.ok && storesRes.data?.stores) {
        setStores(storesRes.data.stores);
      }
      if (evidenceStatusRes.ok && evidenceStatusRes.data) {
        setEvidenceStatus(evidenceStatusRes.data as EvidenceStatusDTO);
      }
      if (evidenceSourcesRes.ok && evidenceSourcesRes.data) {
        setEvidenceSourcesState(evidenceSourcesRes.data as EvidenceSourcesDTO);
      }
    } catch (e) {
      console.error('Failed to refresh integration truth:', e);
    }
  };

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    refreshIntegrationTruth();
  }, [isReady, activeSlug]);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    const amazonConnected = searchParams.get('amazon_connected');
    if (amazonConnected === 'true' && !showRecoveryReveal) {
      api.getAmazonRecoveries(activeSlug).then(response => {
        if (response.ok && response.data) {
          setRecoveryData(response.data);
          setShowRecoveryReveal(true);
          setTimeout(() => setShowEvidenceModal(true), 3000);
        }
      });
    }
  }, [searchParams, showRecoveryReveal, activeSlug, isReady]);

  const handleConnectAmazon = async () => {
    toast({ title: 'Establishing Terminal', description: 'Redirecting to Amazon Seller Central Authorization...' });
    try {
      if (!activeSlug) {
        toast({ title: 'Workspace Required', description: 'Select a workspace before connecting Amazon.', variant: 'destructive' });
        return;
      }
      const res = await api.connectAmazon(undefined, false, activeSlug);
      const url = res.data?.auth_url || res.data?.authUrl;
      if (res.ok && url) {
        window.location.assign(url);
      } else {
        toast({ title: 'Connection Error', description: 'Could not retrieve Amazon authorization URL. Please try again.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Connection Error', description: 'Failed to connect to Amazon SP-API.', variant: 'destructive' });
    }
  };

  const handleConnectDocSource = async (provider: SecondaryProviderKey) => {
    if (isDemoWorkspace) {
      toast({ title: 'Demo Mode', description: 'Source connection is simulated in the demo workspace.' });
      return;
    }
    setProviderLoading(provider);
    try {
      const res = await api.connectEvidenceSource(provider, activeSlug || 'default');
      const url = res.data?.auth_url || res.data?.authUrl;
      if (res.ok && url) {
        window.location.assign(url);
      } else {
        toast({ title: 'Connection Error', description: `Could not initialize ${provider} connection.`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: `Failed to connect ${provider}.`, variant: 'destructive' });
    } finally {
      setProviderLoading(null);
    }
  };

  const handleDisconnectProvider = async (provider: ProviderKey, sourceId?: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    setDisconnectingProvider(provider);
    try {
      const res = provider === 'amazon' 
        ? await api.disconnectAmazon(activeSlug || 'default')
        : await api.disconnectEvidenceSource(sourceId!, activeSlug || 'default');
      
      if (res.ok) {
        toast({ title: 'Disconnected', description: `${provider} has been removed.` });
        refreshIntegrationTruth();
      } else {
        toast({ title: 'Failed', description: `Could not disconnect ${provider}.`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setDisconnectingProvider(null);
    }
  };

  const handleAddStore = async () => {
    if (!newStoreData.name) {
      toast({ title: "Validation Error", description: "Store name is required", variant: "destructive" });
      return;
    }
    try {
      setAddingStore(true);
      const res = await api.createStore(newStoreData, activeSlug!);
      if (res.ok) {
        setStores([...stores, res.data.store]);
        setShowAddStore(false);
        setNewStoreData({ name: '', marketplace: 'ATVPDKIKX0DER', seller_id: '' });
        toast({ title: "Store Added", description: "Store added successfully." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to add store", variant: "destructive" });
    } finally {
      setAddingStore(false);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm("Are you sure you want to remove this store?")) return;
    try {
      setDeletingStore(id);
      const res = await api.deleteStore(id, activeSlug!);
      if (res.ok) {
        setStores(stores.filter(s => s.id !== id));
        toast({ title: "Store Removed", description: "Store removed successfully." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to remove node", variant: "destructive" });
    } finally {
      setDeletingStore(null);
    }
  };

  const getProviderState = (provider: ProviderKey): IntegrationProviderStatus => {
    return status?.providers?.[provider] || {
      provider,
      connected: false,
      auth_valid: false,
      needs_reconnect: false,
      ingestion_state: 'disconnected',
      has_data: false
    };
  };

  const getEvidenceSourceTruth = (provider: SecondaryProviderKey): EvidenceSourceDTO | null => {
    return evidenceSourcesState.sources.find((source) => source.provider === provider) || null;
  };

  const getProviderDisplayState = (provider: ProviderKey): IntegrationProviderStatus => {
    const providerStatus = getProviderState(provider);
    if (provider === 'amazon') return providerStatus;
    const evidenceSource = getEvidenceSourceTruth(provider as SecondaryProviderKey);
    if (isDemoWorkspace && SECONDARY_PROVIDERS.includes(provider as SecondaryProviderKey)) {
      return {
        ...providerStatus,
        connected: true,
        auth_valid: true,
        ingestion_state: 'current',
        account_email: DEMO_PROVIDER_ACCOUNTS[provider as SecondaryProviderKey]
      };
    }
    if (evidenceSource) {
      return {
        ...providerStatus,
        source_id: evidenceSource.id,
        connected: evidenceSource.connected,
        auth_valid: evidenceSource.status !== 'error',
        ingestion_state: evidenceSource.status === 'connected' ? 'current' : 'disconnected',
        account_email: evidenceSource.account_email
      };
    }
    return providerStatus;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  };

  const categories = [
    { id: 'all', label: 'All Sources', icon: LayoutGrid },
    { id: 'marketplace', label: 'Marketplace', icon: Globe },
    { id: 'evidence', label: 'Evidence', icon: Shield },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'files', label: 'Files', icon: Cloud },
  ];

  const providers = [
    { id: 'amazon', name: 'Amazon Seller Central', category: 'marketplace', icon: Box, description: 'Operational records, shipments, and financial events.' },
    { id: 'gmail', name: 'Gmail', category: 'evidence', icon: Mail, description: 'Automated invoice and BOL extraction from email threads.' },
    { id: 'slack', name: 'Slack', category: 'evidence', icon: Box, description: 'Real-time evidence ingestion from operational channels.' },
    { id: 'gdrive', name: 'Google Drive', category: 'files', icon: Cloud, description: 'Sync proof of ownership and shipment documentation.' },
    { id: 'dropbox', name: 'Dropbox', category: 'files', icon: Cloud, description: 'Centralized evidence repository for high-volume sellers.' },
    { id: 'quickbooks', name: 'QuickBooks', category: 'finance', icon: Calculator, description: 'Sync cost basis and accounting records for valuation.' },
    { id: 'xero', name: 'Xero', category: 'finance', icon: Calculator, description: 'Financial reconciliation for enterprise portfolios.' },
    { id: 'outlook', name: 'Outlook', category: 'evidence', icon: Mail, description: 'Enterprise email evidence ingestion.', parked: true },
    { id: 'onedrive', name: 'OneDrive', category: 'files', icon: Cloud, description: 'Microsoft 365 document synchronization.', parked: true },
  ];

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = providers.filter(p => getProviderDisplayState(p.id as ProviderKey).connected).length;
  const lastSync = status?.lastSync ? new Date(status.lastSync).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';
  const evidenceCount = evidenceStatus?.documentsCount || 0;

  if (isReady && !activeSlug) {
    return (
      <PageLayout title="Integrations" noPadding>
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7] px-6">
          <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <h1 className="mb-3 font-sans text-xl font-semibold tracking-tight text-[#111827]">Workspace context required</h1>
            <p className="font-sans text-sm leading-relaxed text-[#6B7280]">
              Integration status is tenant-scoped. Select a workspace before viewing or changing connection state.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Integrations" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Forensic Identity Header */}
        <div className="border-b border-[#E5E7EB] bg-white px-8 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-6 bg-[#0B74DE]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B74DE]">Source Control</span>
            </div>
            <h1 className="mb-4 font-lora text-[32px] font-normal leading-tight tracking-tight text-[#111827]">
              Does what Amazon says match what happened?
            </h1>
            <p className="max-w-2xl text-[15px] font-normal leading-relaxed tracking-tight text-[#6B7280]">
              Margin reconciles marketplace records with evidence from your business systems. Connect the sources required to prove reimbursement gaps and unresolved discrepancies.
            </p>
          </div>
        </div>

        {/* Readiness Strip */}
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-8 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Connected:</span>
                <span className="text-[11px] font-bold text-[#111827]">{connectedCount} Sources</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Last Sync:</span>
                <span className="text-[11px] font-bold text-[#111827]">{lastSync}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#9CA3AF]" />
                <span className="text-[11px] font-semibold uppercase tracking-tight text-[#6B7280]">Evidence:</span>
                <span className="text-[11px] font-bold text-[#111827]">{evidenceCount} Items</span>
              </div>
            </div>
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Search sources..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded-md border border-[#E5E7EB] bg-white pl-8 pr-3 text-[11px] font-medium tracking-tight outline-none focus:border-[#0B74DE] focus:ring-0"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-12 px-8 py-12">
          {/* Category Rail */}
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    activeCategory === cat.id 
                      ? "bg-[#F3F5F4] text-[#111827]" 
                      : "text-[#6B7280] hover:bg-[#F3F5F4]/50 hover:text-[#111827]"
                  )}
                >
                  <cat.icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-[#0B74DE]" : "text-[#9CA3AF]")} />
                  <span className="text-[12px] font-semibold tracking-tight">{cat.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Source List */}
          <div className="flex-1">
            <div className="space-y-8">
              {/* Connected Sources */}
              <div>
                <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Connected Sources</h3>
                <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                  {filteredProviders.filter(p => getProviderDisplayState(p.id as ProviderKey).connected).length > 0 ? (
                    filteredProviders.filter(p => getProviderDisplayState(p.id as ProviderKey).connected).map((p) => (
                      <SourceRow 
                        key={p.id} 
                        provider={p} 
                        state={getProviderDisplayState(p.id as ProviderKey)}
                        onConnect={() => p.id === 'amazon' ? handleConnectAmazon() : handleConnectDocSource(p.id as SecondaryProviderKey)}
                        onDisconnect={() => handleDisconnectProvider(p.id as ProviderKey, getProviderDisplayState(p.id as ProviderKey).source_id)}
                        loading={providerLoading === p.id || disconnectingProvider === p.id}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-[12px] font-medium text-[#9CA3AF]">No sources connected in this category.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Sources */}
              <div>
                <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Available for Connection</h3>
                <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
                  {filteredProviders.filter(p => !getProviderDisplayState(p.id as ProviderKey).connected).map((p) => (
                    <SourceRow 
                      key={p.id} 
                      provider={p} 
                      state={getProviderDisplayState(p.id as ProviderKey)}
                      onConnect={() => p.id === 'amazon' ? handleConnectAmazon() : handleConnectDocSource(p.id as SecondaryProviderKey)}
                      onDisconnect={() => handleDisconnectProvider(p.id as ProviderKey, getProviderDisplayState(p.id as ProviderKey).source_id)}
                      loading={providerLoading === p.id || disconnectingProvider === p.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Reveal Modal */}
      <Dialog open={showRecoveryReveal} onOpenChange={setShowRecoveryReveal}>
        <DialogContent className="max-w-2xl border-[#E5E7EB] bg-white p-0 shadow-2xl">
          <div className="bg-[#0B74DE] p-8 text-center text-white">
            <Zap className="mx-auto h-12 w-12 mb-4 animate-pulse" />
            <h2 className="font-lora text-3xl font-normal tracking-tight">Recovery opportunities detected</h2>
          </div>
          <div className="p-10 text-center">
            {recoveryData && (
              <div className="mb-8">
                <div className="text-6xl font-sans font-bold tracking-tighter text-[#111827]">
                  {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                </div>
                <p className="mt-2 text-[12px] font-bold uppercase tracking-widest text-[#6B7280]">Estimated claimable value</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="rounded-lg bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                <FileText className="mx-auto h-5 w-5 mb-2 text-[#0B74DE]" />
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Inventory</div>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                <Calculator className="mx-auto h-5 w-5 mb-2 text-[#0B74DE]" />
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Fee Errors</div>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                <Truck className="mx-auto h-5 w-5 mb-2 text-[#0B74DE]" />
                <div className="text-[10px] font-bold uppercase text-[#6B7280]">Shipments</div>
              </div>
            </div>
            <Button onClick={() => setShowRecoveryReveal(false)} className="h-12 w-full bg-[#0B74DE] font-bold uppercase tracking-widest text-white hover:bg-[#005FBA]">
              Continue to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

function SourceRow({ provider, state, onConnect, onDisconnect, loading }: { 
  provider: any, 
  state: IntegrationProviderStatus, 
  onConnect: () => void, 
  onDisconnect: () => void,
  loading: boolean
}) {
  return (
    <div className={cn(
      "group flex items-center justify-between py-4 transition-colors",
      provider.parked ? "opacity-50" : "hover:bg-[#F3F5F4]/30"
    )}>
      <div className="flex items-center gap-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E5E7EB] shadow-sm">
          {provider.id === 'amazon' ? (
            <img src="/amazon-logo-transparent-circle.png" alt="" className="h-6 w-6 object-contain" />
          ) : (
            <provider.icon className="h-5 w-5 text-[#4B5563]" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold tracking-tight text-[#111827]">{provider.name}</span>
            {state.connected && (
              <Badge variant="outline" className="h-5 border-[#D1FAE5] bg-[#ECFDF5] px-2 text-[9px] font-bold uppercase tracking-tight text-[#065F46]">
                Connected
              </Badge>
            )}
            {provider.parked && (
              <Badge variant="outline" className="h-5 border-[#E5E7EB] bg-[#F9FAFB] px-2 text-[9px] font-bold uppercase tracking-tight text-[#6B7280]">
                Coming Soon
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px] tracking-tight text-[#6B7280]">
            <span className="truncate max-w-[300px]">{provider.description}</span>
            {state.account_email && (
              <>
                <div className="h-1 w-1 rounded-full bg-[#E5E7EB]" />
                <span className="font-medium text-[#111827]">{state.account_email}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {state.connected ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDisconnect}
              disabled={loading}
              className="h-8 px-3 text-[11px] font-bold uppercase tracking-tight text-[#6B7280] hover:bg-red-50 hover:text-red-600"
            >
              {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Disconnect"}
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-[#E5E7EB] px-3 text-[11px] font-bold uppercase tracking-tight text-[#111827] hover:bg-[#F3F5F4]">
              Manage
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            disabled={provider.parked || loading}
            onClick={onConnect}
            className={cn(
              "h-8 border-[#E5E7EB] px-4 text-[11px] font-bold uppercase tracking-tight transition-all",
              provider.parked ? "cursor-not-allowed" : "text-[#0B74DE] hover:border-[#0B74DE] hover:bg-[#F3F7FF]"
            )}
          >
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : provider.parked ? "Unavailable" : "Connect Source"}
          </Button>
        )}
      </div>
    </div>
  );
}
