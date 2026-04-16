import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Share2, Shield, Lock, Zap, FileText, Database, Globe, CheckCircle2, AlertCircle, Plus, Trash2, ExternalLink, RefreshCw, Sparkles, Search as SearchIcon, Info, DollarSign, Package, Calculator, Truck, Mail, Cloud, Settings, ArrowRight, Link2 } from 'lucide-react';
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
import { useTenant } from '@/contexts/TenantContext';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

// ... (existing constants)

type ProviderKey = 'amazon' | 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'slack' | 'adobe_sign' | 'onedrive';
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

const ACTIVE_SECONDARY_PROVIDERS: SecondaryProviderKey[] = ['gmail', 'slack', 'dropbox', 'gdrive'];
const PARKED_SECONDARY_PROVIDERS: SecondaryProviderKey[] = ['outlook', 'adobe_sign', 'onedrive'];
const SECONDARY_PROVIDERS: SecondaryProviderKey[] = [...ACTIVE_SECONDARY_PROVIDERS, ...PARKED_SECONDARY_PROVIDERS];
const PARKED_PROVIDER_AVAILABLE_DATE = 'May 20th, 2026';

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady, tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || null;
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

  // NEW: Shock and Awe state
  const [showRecoveryReveal, setShowRecoveryReveal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{ totalAmount: number; currency: string; claimCount: number } | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

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
    dateRange: 'last_30' | 'last_90' | 'last_12_months' | 'last_18_months' | 'since_last_sync' | 'all';
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
    // 18-month window for Amazon claimable period
    dateRange: 'last_18_months'
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
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatusDTO | null>(null);
  const [evidenceSourcesState, setEvidenceSourcesState] = useState<EvidenceSourcesDTO>({
    sources: [],
    count: 0,
    connectedCount: 0,
    ingestableCount: 0,
    skippedProviders: []
  });
  const [ingestionResult, setIngestionResult] = useState<{
    success: boolean;
    phase?: 'started' | 'completed' | 'failed';
    scope?: 'all' | 'gmail';
    providerLabel?: string;
    totalDocumentsIngested?: number;
    totalItemsProcessed?: number;
    documentsIngested?: number;
    emailsProcessed?: number;
    filesProcessed?: number;
    sourcesResolved?: number;
    providersAttempted?: string[];
    skippedProviders?: SkippedProvider[];
    errors: string[];
    results?: {
      gmail?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      outlook?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      gdrive?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
      dropbox?: { success: boolean; documentsIngested: number; emailsProcessed?: number; filesProcessed?: number; errors: string[] };
    };
    message?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if we just connected Amazon and should show the reveal
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    const amazonConnected = searchParams.get('amazon_connected');

    if (amazonConnected === 'true' && !showRecoveryReveal) {
      // Fetch the actual recovery data
      api.getAmazonRecoveries(activeSlug).then(response => {
        if (response.ok && response.data) {
          setRecoveryData(response.data);
          setShowRecoveryReveal(true);

          // Auto-show evidence modal after 3 seconds
          setTimeout(() => {
            setShowEvidenceModal(true);
          }, 3000);
        }
      });
    }
  }, [searchParams, showRecoveryReveal, activeSlug, isReady]);

  // Show toast when redirected from OAuthSuccess page with ?connected=provider
  useEffect(() => {
    const connectedProvider = searchParams.get('connected');
    if (connectedProvider) {
      const labels: Record<string, string> = {
        amazon: 'Amazon Store',
        gmail: 'Gmail',
        outlook: 'Outlook',
        gdrive: 'Google Drive',
        dropbox: 'Dropbox',
        stripe: 'Stripe'
      };
      const label = labels[connectedProvider] || connectedProvider;
      toast({
        title: `${label} Connected`,
        description: `Your ${label} account has been securely linked and is ready to use.`,
      });
      // Clean up the URL param to prevent re-triggering
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('connected');
      const cleanUrl = newParams.toString()
        ? `${location.pathname}?${newParams.toString()}`
        : location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [searchParams, toast, location.pathname]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const humanizeSkippedReason = (reason?: string | null) => {
    if (!reason) return 'Reason not available';
    return reason.replace(/_/g, ' ');
  };

  const refreshIntegrationTruth = async () => {
    if (!activeSlug) return;

    const [statusRes, storesRes, evidenceStatusRes, evidenceSourcesRes] = await Promise.all([
      api.getIntegrationsStatus(activeSlug),
      api.getStores(activeSlug),
      api.getEvidenceStatus(activeSlug),
      api.getEvidenceSources(activeSlug)
    ]);

    if (statusRes.ok && statusRes.data) {
      const nextStatus = statusRes.data as IntegrationStatusDTO;
      setStatus(nextStatus);
      if (nextStatus.evidenceSettings) {
        setAutoCollect(nextStatus.evidenceSettings.autoCollect);
        setSchedule(nextStatus.evidenceSettings.schedule);
        setFilters(nextStatus.evidenceSettings.filters);
      }
    }

    if (storesRes.ok && storesRes.data?.stores) {
      setStores(storesRes.data.stores);
    }

    if (evidenceStatusRes.ok && evidenceStatusRes.data) {
      setEvidenceStatus(evidenceStatusRes.data as EvidenceStatusDTO);
    }

    if (evidenceSourcesRes.ok && evidenceSourcesRes.data) {
      const nextSourceTruth = evidenceSourcesRes.data as EvidenceSourcesDTO;
      setEvidenceSourcesState({
        sources: nextSourceTruth.sources || [],
        count: nextSourceTruth.count || 0,
        connectedCount: nextSourceTruth.connectedCount || 0,
        ingestableCount: nextSourceTruth.ingestableCount || 0,
        skippedProviders: nextSourceTruth.skippedProviders || []
      });
    }
  };

  const handleConnectDocSource = async (provider: SecondaryProviderKey) => {
    const providerName = provider === 'gdrive' ? 'Google Drive'
      : provider === 'gmail' ? 'Gmail'
        : provider === 'dropbox' ? 'Dropbox'
        : provider === 'slack' ? 'Slack'
        : provider === 'adobe_sign' ? 'Adobe Sign'
        : provider === 'onedrive' ? 'OneDrive'
          : 'Outlook';
    try {
      setProviderLoading(provider);
      if (!activeSlug) throw new Error('Tenant context is required');
      const r = await api.connectDocs(provider, activeSlug);
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

  const handleDisconnectDocSource = async (provider: SecondaryProviderKey) => {
    const providerName = provider === 'gdrive' ? 'Google Drive'
      : provider === 'gmail' ? 'Gmail'
        : provider === 'dropbox' ? 'Dropbox'
        : provider === 'slack' ? 'Slack'
        : provider === 'adobe_sign' ? 'Adobe Sign'
        : provider === 'onedrive' ? 'OneDrive'
          : 'Outlook';
          
    try {
      setDisconnectingProvider(provider);
      const providerState = status?.providers?.[provider];
      const evidenceSource = evidenceSourcesState.sources.find((source) => source.provider === provider);
      const sourceId = providerState?.source_id || evidenceSource?.id;
      const supportsDirectProviderDisconnect = provider === 'gmail' || provider === 'outlook' || provider === 'gdrive' || provider === 'dropbox';
      const res = sourceId
        ? await api.disconnectEvidenceSource(sourceId)
        : supportsDirectProviderDisconnect
          ? await api.disconnectDocsProvider(provider)
          : { ok: false, error: 'No tenant-scoped connection record found for this provider' };
      
      if (res.ok) {
        toast({
          title: `${providerName} Disconnected`,
          description: `Your ${providerName} account has been disconnected.`,
        });

        await refreshIntegrationTruth();
      } else {
        toast({
          title: 'Disconnection Failed',
          description: res.error || `Failed to disconnect ${providerName}.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast({
        title: 'Error',
        description: `An error occurred while disconnecting ${providerName}.`,
        variant: 'destructive',
      });
    } finally {
      setDisconnectingProvider(null);
    }
  };

  // SSE for live ingest/detection events
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let es: ReturnType<typeof createAuthenticatedEventStream> | null = null;
    try {
      es = createAuthenticatedEventStream(
        api.buildApiUrl(`/api/sse/status?tenantSlug=${activeSlug}`),
        { autoReconnect: true, reconnectDelayMs: 3000 }
      );
      const resolveLiveIngestContext = (evt: any, previous: typeof ingestionResult) => {
        const explicitProvider = typeof evt?.provider === 'string' ? evt.provider : null;
        if (explicitProvider === 'all') {
          return {
            scope: 'all' as const,
            providerLabel: 'All Sources',
            providersAttempted: Array.isArray(evt?.providers) && evt.providers.length ? evt.providers : previous?.providersAttempted
          };
        }
        if (explicitProvider === 'gmail' || previous?.scope === 'gmail' || previous?.providerLabel === 'Gmail') {
          return {
            scope: 'gmail' as const,
            providerLabel: 'Gmail',
            providersAttempted: ['gmail']
          };
        }
        if (explicitProvider) {
          return {
            scope: previous?.scope,
            providerLabel: explicitProvider,
            providersAttempted: [explicitProvider]
          };
        }
        return {
          scope: previous?.scope,
          providerLabel: previous?.providerLabel || 'Connected Repository',
          providersAttempted: previous?.providersAttempted
        };
      };
      const handleEvidenceStarted = (event: Event) => {
        try {
          const evt = JSON.parse((event as MessageEvent).data);
          setIngestionResult((previous) => {
            const resolved = resolveLiveIngestContext(evt, previous);
            return {
              success: false,
              phase: 'started',
              scope: resolved.scope,
              providerLabel: resolved.providerLabel,
              providersAttempted: resolved.providersAttempted,
              skippedProviders: previous?.skippedProviders || [],
              errors: [],
              message: resolved.scope === 'all'
                ? 'Checking connected repositories and ingestion eligibility.'
                : `Checking ${resolved.providerLabel || 'repository'} for evidence documents.`
            };
          });
          toast({
            title: 'Ingestion Update',
            description: evt?.provider === 'all'
              ? 'Checking connected repositories and ingestion eligibility.'
              : `Checking ${evt?.provider || 'repository'} for evidence documents.`
          });
        } catch { }
      };
      const handleEvidenceCompleted = (event: Event) => {
        try {
          const evt = JSON.parse((event as MessageEvent).data);
          setIngestionResult((previous) => {
            const resolved = resolveLiveIngestContext(evt, previous);
            const storedCount = typeof evt?.totalDocumentsIngested === 'number'
              ? evt.totalDocumentsIngested
              : typeof evt?.documentsIngested === 'number'
                ? evt.documentsIngested
                : undefined;
            const processedCount = typeof evt?.totalItemsProcessed === 'number'
              ? evt.totalItemsProcessed
              : typeof evt?.emailsProcessed === 'number'
                ? evt.emailsProcessed
                : previous?.totalItemsProcessed;
            return {
              success: true,
              phase: 'completed',
              scope: resolved.scope,
              providerLabel: resolved.providerLabel,
              totalDocumentsIngested: storedCount,
              totalItemsProcessed: processedCount,
              documentsIngested: typeof evt?.documentsIngested === 'number' ? evt.documentsIngested : previous?.documentsIngested,
              emailsProcessed: typeof evt?.emailsProcessed === 'number' ? evt.emailsProcessed : previous?.emailsProcessed,
              filesProcessed: typeof evt?.filesProcessed === 'number' ? evt.filesProcessed : previous?.filesProcessed,
              sourcesResolved: typeof evt?.sourcesResolved === 'number' ? evt.sourcesResolved : previous?.sourcesResolved,
              providersAttempted: resolved.providersAttempted,
              skippedProviders: previous?.skippedProviders || [],
              errors: [],
              results: previous?.results,
              message: resolved.scope === 'gmail'
                ? (storedCount ?? 0) > 0
                  ? `${storedCount} Gmail documents were stored from this live ingestion run.`
                  : 'Gmail returned zero documents for this live ingestion run.'
                : typeof storedCount === 'number'
                  ? `${storedCount} documents were stored from this ingestion run.`
                  : 'Evidence ingestion has completed.'
            };
          });
          toast({
            title: 'Ingestion Complete',
            description: typeof evt?.totalDocumentsIngested === 'number'
              ? `${evt.totalDocumentsIngested} documents were stored from this ingestion run.`
              : typeof evt?.documentsIngested === 'number'
                ? `${evt.documentsIngested} documents were stored from this repository run.`
              : 'Evidence ingestion has completed.'
          });
          refreshIntegrationTruth().catch(() => undefined);
        } catch { }
      };
      const handleEvidenceFailed = (event: Event) => {
        try {
          const evt = JSON.parse((event as MessageEvent).data);
          setIngestionResult((previous) => {
            const resolved = resolveLiveIngestContext(evt, previous);
            return {
              success: false,
              phase: 'failed',
              scope: resolved.scope,
              providerLabel: resolved.providerLabel,
              totalDocumentsIngested: previous?.totalDocumentsIngested,
              totalItemsProcessed: previous?.totalItemsProcessed,
              documentsIngested: previous?.documentsIngested,
              emailsProcessed: previous?.emailsProcessed,
              filesProcessed: previous?.filesProcessed,
              sourcesResolved: previous?.sourcesResolved,
              providersAttempted: resolved.providersAttempted,
              skippedProviders: previous?.skippedProviders || [],
              errors: evt?.error ? [evt.error] : previous?.errors || [],
              results: previous?.results,
              message: evt?.error || 'Evidence ingestion failed for this run.'
            };
          });
          toast({
            title: 'Ingestion Failed',
            description: evt?.error || 'Evidence ingestion failed for this run.',
            variant: 'destructive'
          });
          refreshIntegrationTruth().catch(() => undefined);
        } catch { }
      };
      es.addEventListener('evidence_ingestion_started', handleEvidenceStarted as EventListener);
      es.addEventListener('evidence_ingestion_completed', handleEvidenceCompleted as EventListener);
      es.addEventListener('evidence_ingestion_failed', handleEvidenceFailed as EventListener);
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'claim' && evt?.status === 'completed' && evt?.matchedCount) {
            toast({
              title: 'New Matches Found',
              description: `${evt.matchedCount} documents matched to claims.`
            });
          }
        } catch { }
      };
      return () => {
        es.removeEventListener('evidence_ingestion_started', handleEvidenceStarted as EventListener);
        es.removeEventListener('evidence_ingestion_completed', handleEvidenceCompleted as EventListener);
        es.removeEventListener('evidence_ingestion_failed', handleEvidenceFailed as EventListener);
        es.close();
      };
    } catch { }
    return () => { if (es) es.close(); };
  }, [toast, isReady, activeSlug]);


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

      // Refresh integration status and evidence sources in parallel to update UI
      refreshIntegrationTruth().catch(() => undefined);

      // Clean up URL by removing query parameters after processing
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });

      // Auto-redirect to sync page after 2-3 seconds to show the live dialogue logs
      setTimeout(() => {
        navigate(tenantRoute(activeSlug || 'default', '/sync'));
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
      // Refresh integration status and evidence sources in parallel to update UI
      refreshIntegrationTruth().catch(() => undefined);

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

      // Refresh integration status and evidence sources in parallel to update UI
      refreshIntegrationTruth().catch(() => undefined);

      // Clean up URL
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }
  }, [location.search, navigate, toast, activeSlug]);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    (async () => {
      await refreshIntegrationTruth();
    })();
  }, [isReady, activeSlug]);

  // Load stores
  useEffect(() => {
    if (!isReady) return;
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const res = await api.getStores(activeSlug);
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
  }, [isReady, activeSlug]);

  const handleAddStore = async () => {
    if (!newStoreData.name) {
      toast({ title: "Validation Error", description: "Store name is required", variant: "destructive" });
      return;
    }
    try {
      setAddingStore(true);
      const res = await api.createStore(newStoreData, activeSlug);
      if (res.ok) {
        setStores([...stores, res.data.store]);
        setShowAddStore(false);
        setNewStoreData({ name: '', marketplace: 'ATVPDKIKX0DER', seller_id: '' });
        toast({ title: "Store Added", description: "Store added successfully." });
      } else {
        toast({ title: "Failed", description: res.error || "Could not create store", variant: "destructive" });
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
      const res = await api.deleteStore(id, activeSlug);
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
    if (provider === 'amazon' || providerStatus.connected) {
      return providerStatus;
    }

    const evidenceSource = getEvidenceSourceTruth(provider as SecondaryProviderKey);
    if (!evidenceSource?.connected) {
      return providerStatus;
    }

    const hasData = (evidenceSource.documents_count || 0) > 0;
    return {
      ...providerStatus,
      source_id: evidenceSource.id,
      connected: true,
      auth_valid: evidenceSource.ingestable,
      needs_reconnect: false,
      ingestion_state: evidenceSource.ingestable
        ? hasData
          ? 'current'
          : 'no_data'
        : 'unverified',
      has_data: hasData,
      last_ingest_at: evidenceSource.last_ingested_at || undefined,
      account_email: evidenceSource.account_email || undefined,
      error_message: evidenceSource.ingestable ? undefined : evidenceSource.ingestable_reason || providerStatus.error_message
    };
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Not available' : parsed.toLocaleString();
  };

  const describeProviderState = (providerStatus: IntegrationProviderStatus) => {
    if (!providerStatus.connected) return 'Disconnected';
    if (providerStatus.needs_reconnect || !providerStatus.auth_valid) return 'Needs reconnect';
    if (providerStatus.error_state || providerStatus.ingestion_state === 'failed') return 'Ingest failed';
    if (providerStatus.ingestion_state === 'stale') return 'Connected, stale';
    if (!providerStatus.has_data) return providerStatus.last_ingest_at ? 'Connected, no data' : 'Connected, unverified';
    return 'Connected';
  };

  const getStoreOperationalState = (store: any) => {
    const amazonStatus = getProviderState('amazon');
    const connectedSellerId = status?.amazon_account?.seller_id;
    if (!amazonStatus.connected) return 'Auth not connected';
    if (!store?.seller_id) return 'Store record only';
    if (connectedSellerId && store.seller_id === connectedSellerId) {
      return amazonStatus.auth_valid ? 'Bound to active auth' : 'Seller bound, auth needs attention';
    }
    if (connectedSellerId && store.seller_id !== connectedSellerId) return 'Seller mismatch';
    return 'Seller bound';
  };

  const connectedSecondaryProviders = ACTIVE_SECONDARY_PROVIDERS.filter(provider => getProviderDisplayState(provider).connected);
  const gmailProviderState = getProviderDisplayState('gmail');
  const gmailEvidenceSource = getEvidenceSourceTruth('gmail');
  const activeSkippedProviders = ingestionResult?.skippedProviders?.length
    ? ingestionResult.skippedProviders
    : evidenceStatus?.skippedProviders?.length
      ? evidenceStatus.skippedProviders
      : evidenceSourcesState.skippedProviders;
  const blockingProviders = ACTIVE_SECONDARY_PROVIDERS.filter(provider => {
    const providerState = getProviderDisplayState(provider);
    return providerState.needs_reconnect || providerState.ingestion_state === 'failed' || providerState.ingestion_state === 'stale';
  });
  const pageOperationalState = !getProviderState('amazon').connected
    ? 'Amazon connection required'
    : blockingProviders.length > 0
      ? 'Attention required'
      : connectedSecondaryProviders.length > 0
        ? 'Operational with active repositories'
        : 'Operational, no evidence repositories connected';
  const amazonProviderState = getProviderState('amazon');
  const connectedSellerId = status?.amazon_account?.seller_id || null;
  const connectedAmazonName = status?.amazon_account?.display_name || null;
  const connectedAmazonMarketplaces = Array.isArray(status?.amazon_account?.marketplaces) ? status?.amazon_account?.marketplaces : [];

  const handleIngestGmailOnly = async () => {
    setIngestingGmail(true);
    try {
      const r = await api.ingestGmailEvidence();
      const documentsIngested = r.data?.documentsIngested ?? 0;
      const emailsProcessed = r.data?.emailsProcessed ?? 0;

      setIngestionResult({
        success: !!(r.ok && r.data?.success),
        scope: 'gmail',
        providerLabel: 'Gmail',
        totalDocumentsIngested: documentsIngested,
        totalItemsProcessed: emailsProcessed,
        documentsIngested,
        emailsProcessed,
        providersAttempted: ['gmail'],
        skippedProviders: [],
        errors: r.data?.errors || (r.error ? [r.error] : []),
        results: r.data ? {
          gmail: {
            success: !!r.data?.success,
            documentsIngested,
            emailsProcessed,
            errors: r.data?.errors || []
          }
        } : undefined,
        message: r.ok
          ? documentsIngested > 0
            ? `Gmail stored ${documentsIngested} documents from ${emailsProcessed} emails in this run.`
            : 'Gmail returned zero documents for the current saved query and filters.'
          : r.error || r.data?.message || 'Failed to ingest evidence from Gmail.'
      });

      if (r.ok) {
        if (documentsIngested > 0) {
          toast({
            title: 'Gmail Ingestion Complete',
            description: `${documentsIngested} documents were stored from ${emailsProcessed} Gmail messages.`
          });
        } else {
          toast({
            title: 'Gmail Returned Zero Documents',
            description: 'No Gmail documents matched the current saved query and filters for this run.'
          });
        }
      } else {
        toast({
          title: 'Gmail Ingestion Failed',
          description: r.error || 'Failed to ingest evidence from Gmail.',
          variant: 'destructive'
        });
      }

      await refreshIntegrationTruth();
    } finally {
      setIngestingGmail(false);
    }
  };

  if (isReady && !activeSlug) {
    return (
      <PageLayout title="Integrations" midnight>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
          <div className="max-w-xl w-full bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-sans font-bold text-white tracking-tight mb-3">Workspace context required</h1>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Integration status is tenant-scoped. Select a real workspace before viewing or changing connection state.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Integrations" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.035),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        {/* SHOCK AND AWE: Recovery Reveal Modal */}
        <Dialog open={showRecoveryReveal} onOpenChange={setShowRecoveryReveal}>
          <DialogContent className="max-w-2xl bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-white font-sans font-bold tracking-tight">
                <Zap className="h-8 w-8 animate-pulse" />
                Potential Recoveries Found!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-6 py-4">
              {recoveryData && (
                <>
                  <div className="space-y-2">
                    <div className="text-6xl font-sans font-bold text-white tracking-tighter">
                      {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                    </div>
                    <div className="text-sm font-sans font-bold text-white/35 uppercase tracking-tight">
                      in Potential Amazon Recoveries Identified
                    </div>
                    <div className="mt-4">
                      <Badge variant="outline" className="bg-white/10 border-white/20 text-white/70 font-sans font-bold text-[10px] uppercase tracking-tight px-3 py-1">
                        {recoveryData.claimCount} Distinct Recovery Opportunities
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-8">
                    <div className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/5 backdrop-blur-sm">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                      <div className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-1">Lost Inventory</div>
                      <div className="text-sm font-bold text-white tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.6, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/5 backdrop-blur-sm">
                      <Calculator className="h-6 w-6 mx-auto mb-2 text-orange-400" />
                      <div className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-1">Fee Errors</div>
                      <div className="text-sm font-bold text-white tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.3, recoveryData.currency)}</div>
                    </div>
                    <div className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/5 backdrop-blur-sm">
                      <Package className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                      <div className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-1">Shipments</div>
                      <div className="text-sm font-bold text-white tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.1, recoveryData.currency)}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 font-sans font-light tracking-tight italic">
                    "Our discovery agents identified these anomalies by triangulating your FBA structural data."
                  </p>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowRecoveryReveal(false)} className="w-full h-12 bg-white text-black font-sans font-bold uppercase tracking-tight text-xs hover:bg-white/90 transition-colors">
                Continue to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SECOND WOW: Evidence Connect Modal */}
        <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
          <DialogContent className="max-w-2xl bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-white font-sans font-bold tracking-tight">
                <Shield className="h-8 w-8 text-white/70" />
                Protect Your Revenue
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400 font-sans font-light tracking-tight">
                Connect your data sources to automate document matching.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center hover:border-white/20 transition-all group">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-white/35 group-hover:text-white/70 transition-colors" />
                  <h3 className="font-sans font-bold text-lg mb-2 tracking-tight">Connect Email</h3>
                  <p className="text-xs text-gray-500 mb-6 font-sans font-bold leading-relaxed tracking-tight uppercase">
                    AUTOMATICALLY SCAN REPOSITORIES FOR INVOICES, POs, AND SHIPMENT CONFIRMATIONS.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-white/10 hover:border-white/20 text-white bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      handleConnectDocSource('gmail');
                    }}
                  >
                    Link Account
                  </Button>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-center hover:border-white/20 transition-all group">
                  <Cloud className="h-12 w-12 mx-auto mb-4 text-white/35 group-hover:text-white/70 transition-colors" />
                  <h3 className="font-sans font-bold text-lg mb-2 tracking-tight">Cloud Storage</h3>
                  <p className="text-xs text-gray-500 mb-6 font-sans font-bold leading-relaxed tracking-tight uppercase">
                    INTEGRATE GOOGLE DRIVE AND DROPBOX TO POOL YOUR BUSINESS DOCUMENTS.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-white/10 hover:border-white/20 text-white bg-white/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      handleConnectDocSource('gdrive');
                    }}
                  >
                    Link Storage
                  </Button>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-[10px] font-sans font-bold text-white/35 uppercase tracking-tight">
                  <Info className="h-3 w-3" />
                  <span>Evidence increases claim approval rates by 300%</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500 hover:text-white"
                >
                  I'll upload manual artifacts later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12">
          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col mb-12"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-white/20" />
                  <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Connections</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-sans font-light text-white mb-4 leading-tight tracking-tight">
                  Integrations
                </h1>
                <p className="text-gray-400 max-w-xl text-lg font-sans font-light leading-relaxed tracking-tight">
                  Management of tenant-scoped connection truth, store records, and evidence repositories.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-1">Operational State</span>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${pageOperationalState === 'Attention required' || pageOperationalState === 'Amazon connection required' ? 'bg-orange-400' : 'bg-white/70'}`} />
                    <span className="text-sm font-medium text-white tracking-tight">{pageOperationalState}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restored Unified Search */}
            <div className="max-w-2xl mt-4 relative group">
              <div className="absolute inset-0 bg-white/[0.03] rounded-xl blur-lg group-hover:bg-white/[0.05] transition-all duration-500" />
              <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md focus-within:border-white/20 transition-all duration-300">
                <SearchIcon className="h-4 w-4 text-gray-500 ml-4 group-hover:text-white/70 transition-colors" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Query Infrastructure (Amazon, Gmail, Financial Repositories...)"
                  className="bg-transparent border-none text-white font-sans font-bold text-xs h-12 placeholder:text-gray-600 focus-visible:ring-0 tracking-tight"
                />
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
              <div className="h-full border-y border-white/10 bg-transparent px-5 py-5 flex flex-col relative group transition-colors duration-300 hover:border-white/20">
                <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:opacity-50 transition-opacity">
                  <Database className="w-12 h-12 text-white/10 group-hover:text-white/20 transition-colors" />
                </div>

                <div className="flex flex-col gap-5 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-sky-900/20 flex items-center justify-center border border-sky-700/30 shadow-[0_0_20px_rgba(14,116,144,0.22)] group-hover:shadow-[0_0_32px_rgba(30,64,175,0.34)] transition-all duration-500 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-sky-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img src="/Amazon-logo.png" alt="Amazon" className="h-10 w-10 object-contain brightness-0 invert relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-[22px] font-sans font-medium text-white tracking-tight">Amazon Connection</h3>
                      <p className="mt-1 text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-tight">Tenant-scoped auth and store records</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Dialog open={showAddStore} onOpenChange={setShowAddStore}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 rounded-none border border-white/10 bg-transparent px-4 text-[10px] font-sans font-medium uppercase tracking-tight text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/[0.04] hover:text-white gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Store Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-sans font-bold tracking-tight">Add Store Record</DialogTitle>
                          <DialogDescription className="text-gray-400 font-sans font-light tracking-tight">
                            Create a tenant store record. This does not authenticate Amazon by itself.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">Store Designator</label>
                              <Input
                                placeholder="Alpha-Store-01"
                                value={newStoreData.name}
                                onChange={e => setNewStoreData({ ...newStoreData, name: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-white/20 text-white h-12 font-sans font-bold tracking-tight"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">Seller ID (Business Identity)</label>
                              <Input
                                placeholder="A3XXXXXXXXXXXX"
                                value={newStoreData.seller_id}
                                onChange={e => setNewStoreData({ ...newStoreData, seller_id: e.target.value })}
                                className="bg-white/5 border-white/10 focus:border-white/20 text-white h-12 font-sans font-bold tracking-tight"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">Marketplace Region</label>
                              <select
                                className="w-full h-12 px-3 bg-white/5 border-white/10 rounded-md text-sm border focus:border-white/20 focus:ring-0 outline-none text-white font-sans font-bold tracking-tight"
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
                            className="bg-transparent text-gray-400 hover:text-white font-sans font-bold uppercase text-[10px] py-1 tracking-tight"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddStore}
                            disabled={addingStore}
                            className="bg-white hover:bg-white/90 text-black font-sans font-bold uppercase text-[10px] h-12 px-8 tracking-tight"
                          >
                            {addingStore ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Store Record"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {isFull ? (
                      <div className="flex flex-col items-start gap-3">
                        <div className="text-[11px] font-sans font-bold uppercase tracking-tight text-gray-500">
                          We’re onboarding a small batch of sellers right now.
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Next batch opens in {capacity?.nextBatchHours ?? 24} hours.
                          </div>
                        <Button
                          onClick={() => navigate('/waitlist?reason=capacity')}
                          className="h-9 rounded-none bg-white px-6 text-black font-sans font-medium uppercase tracking-tight text-[10px] transition-colors hover:bg-white/90 hover:text-black"
                        >
                          Join Waitlist
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={async () => {
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
                            console.error('connectAmazon error:', err);
                            toast({ title: 'Connection Error', description: 'Failed to connect to Amazon SP-API. Please try again.', variant: 'destructive' });
                          }
                        }}
                        className="h-9 rounded-none bg-white px-6 text-black font-sans font-medium uppercase tracking-tight text-[10px] transition-colors hover:bg-white/90 hover:text-black"
                      >
                        Connect Amazon
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-white/10 md:grid-cols-2 xl:grid-cols-4">
                  <div className="border-b border-white/8 px-0 py-4 md:border-r xl:border-b-0 xl:pr-5">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-2 tracking-tight">Auth Status</span>
                    <span className="text-[13px] text-white font-sans font-medium tracking-tight">{describeProviderState(amazonProviderState)}</span>
                  </div>
                  <div className="border-b border-white/8 px-0 py-4 md:border-b-0 xl:border-r xl:px-5">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-2 tracking-tight">Seller ID</span>
                    <span className="text-[13px] text-white font-sans font-medium tracking-tight break-all">{connectedSellerId || 'Not resolved'}</span>
                  </div>
                  <div className="border-b border-white/8 px-0 py-4 md:border-r md:pr-5 xl:border-b-0 xl:px-5">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-2 tracking-tight">Amazon Account</span>
                    <span className="text-[13px] text-white font-sans font-medium tracking-tight">{connectedAmazonName || 'Not available'}</span>
                  </div>
                  <div className="px-0 py-4 md:pl-5">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-2 tracking-tight">Marketplaces</span>
                    <span className="text-[13px] text-white font-sans font-medium tracking-tight">
                      {connectedAmazonMarketplaces.length > 0 ? connectedAmazonMarketplaces.join(', ') : 'Not available'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loadingStores ? (
                    <div className="col-span-full flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-white/25 animate-spin" />
                    </div>
                  ) : stores.length > 0 ? (
                    stores.map(store => (
                      <div key={store.id} className="border-y border-white/10 px-0 py-4 relative group/card transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.025]">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-white font-sans font-medium text-[13px] mb-1 truncate max-w-[150px] tracking-tight">{store.name}</span>
                            <span className="text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-tight">{store.marketplace}</span>
                          </div>
                          <div className="h-2 w-2 rounded-full bg-white/70" />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/8">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase tracking-tight">Seller ID</span>
                            <span className="text-[10px] text-zinc-300 font-medium tracking-tight break-all">{store.seller_id || 'Not bound'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                            <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase tracking-tight">Status</span>
                            <span className="text-[10px] text-zinc-300 font-medium tracking-tight">{getStoreOperationalState(store)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteStore(store.id)}
                              disabled={deletingStore === store.id}
                              className="opacity-0 group-hover/card:opacity-100 transition-opacity p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400"
                            >
                              {deletingStore === store.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full border border-dashed border-white/10 px-5 py-10 text-center font-sans font-light tracking-tight">
                      <p className="text-zinc-500">No tenant store records are bound yet. Connect Amazon to resolve seller identity, or add a store record for workspace mapping.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-3 text-[10px] font-sans font-medium uppercase tracking-tight text-zinc-500 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> US-EAST-1</span>
                    <span className="flex items-center gap-2"><Shield className="w-3 h-3 text-white/35" /> Encrypted</span>
                  </div>
                  <span className="text-zinc-400">Last Amazon ingest: {formatDateTime(status?.lastIngest)}</span>
                </div>
              </div>
            </motion.div>

            {/* INTEGRATION REQUEST: Can't find what you need? */}
            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-12 mt-6">
              <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-white/20 transition-all duration-500">
                <div className="flex items-center gap-6 text-center md:text-left">
                  <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-sans font-bold text-white tracking-tight mb-1">Can't find a specific integration?</h3>
                    <p className="text-sm text-gray-500 font-sans font-bold uppercase tracking-tight">Our Engineering Team can build custom harvesting protocols.</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  variant="ghost"
                  className="h-12 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 hover:text-white font-sans font-bold uppercase tracking-tight text-[10px] px-10 transition-all duration-300"
                >
                  Request Integration Node
                </Button>
              </div>
            </motion.div>

            {/* Waitlist / Request Dialog */}
            <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
              <DialogContent className="bg-[#0c0c0c] border-white/10 text-white shadow-2xl backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-sans font-bold tracking-tight">Request Integration Protocol</DialogTitle>
                  <DialogDescription className="text-gray-400 font-sans font-light tracking-tight">
                    Specify the platform or repository you wish to integrate into the matrix.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">Platform Name</label>
                      <Input
                        placeholder="e.g., Shopify, Walmart, NetSuite..."
                        value={requestFormData.platform}
                        onChange={e => setRequestFormData({ ...requestFormData, platform: e.target.value })}
                        className="bg-white/5 border-white/10 focus:border-white/20 text-white h-12 font-sans font-bold tracking-tight"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">Harvesting Context</label>
                      <textarea
                        placeholder="What data nodes should we extract?"
                        value={requestFormData.description}
                        onChange={e => setRequestFormData({ ...requestFormData, description: e.target.value })}
                        className="w-full h-32 px-3 py-2 bg-white/5 border-white/10 rounded-md text-sm border focus:border-white/20 focus:ring-0 outline-none text-white font-sans font-bold tracking-tight resize-none"
                      />
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-white/60 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-white/55 font-sans font-bold leading-relaxed uppercase tracking-tight">
                      Custom integration request capture is not wired in this build. Contact support if you need a new provider added.
                    </p>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRequestForm(false)}
                    className="bg-transparent text-gray-400 hover:text-white font-sans font-bold uppercase text-[10px] py-1 tracking-tight"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled
                    className="bg-white hover:bg-white/90 text-black font-sans font-bold uppercase text-[10px] h-12 px-8 tracking-tight"
                  >
                    Unavailable
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Harvesting Nodes Title */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-8 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-white/20" />
                <h3 className="text-sm font-sans font-bold uppercase tracking-tight text-gray-500">Secondary Platforms</h3>
              </div>
            </motion.div>

            <div className="lg:col-span-12 flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar scroll-smooth">

              {SECONDARY_PROVIDERS.map((p) => {
                const providerMeta = {
                  gmail: { name: 'Gmail', icon: '/gmailicon.png', color: 'bg-red-500/10', border: 'border-red-500/20' },
                  outlook: { name: 'Outlook', icon: '/outlookicon.webp', color: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  gdrive: { name: 'Google Drive', icon: '/gd.png', color: 'bg-white/5', border: 'border-white/10' },
                  dropbox: { name: 'Dropbox', icon: '/Dropbox_Icon.svg.png', color: 'bg-blue-600/10', border: 'border-blue-600/20' },
                  slack: { name: 'Slack', icon: '/slack-icon-2019.png', color: 'bg-purple-500/10', border: 'border-purple-500/20' },
                  adobe_sign: { name: 'Adobe Sign', icon: '/dobe.png', color: 'bg-red-600/10', border: 'border-red-600/20' },
                  onedrive: { name: 'OneDrive', icon: '/onedriive.png', color: 'bg-sky-500/10', border: 'border-sky-500/20' },
                } as const;

                const providerState = getProviderDisplayState(p);
                const evidenceSource = getEvidenceSourceTruth(p);
                const isParked = PARKED_SECONDARY_PROVIDERS.includes(p);
                const connected = !isParked && (providerState.connected || evidenceSource?.connected === true);
                const meta = providerMeta[p];

                return (
                  <motion.div key={p} variants={itemVariants} className="flex-shrink-0 w-[300px]">
                    <div className={`h-full bg-white/[0.02] backdrop-blur-md rounded-2xl border ${connected ? 'border-white/15' : 'border-white/5'} p-6 flex flex-col relative group transition-all duration-300 ${isParked ? 'grayscale opacity-55' : 'hover:bg-white/[0.04]'}`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className={`h-12 w-12 rounded-xl ${meta.color} flex items-center justify-center border ${meta.border} shadow-sm ${isParked ? '' : 'group-hover:scale-110'} transition-transform duration-500`}>
                          <img src={meta.icon} alt={meta.name} className="h-6 w-6 object-contain" />
                        </div>
                        <div className={`h-2 w-2 rounded-full ${connected ? 'bg-white/70 animate-pulse' : 'bg-gray-700'}`} />
                      </div>

                      <h4 className="text-lg font-sans font-bold text-white tracking-tight mb-1">{meta.name}</h4>
                      <p className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-6">Evidence Repository</p>

                      <div className="flex-1">
                        {isParked ? (
                          <div className="space-y-4">
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                              <span className="text-[9px] font-sans font-bold text-gray-500 uppercase block mb-1 tracking-tight">Availability</span>
                              <span className="text-xs text-gray-300 block font-sans font-bold tracking-tight">
                                Available {PARKED_PROVIDER_AVAILABLE_DATE}
                              </span>
                              <span className="text-[10px] text-gray-500 block mt-2 font-sans tracking-tight">
                                This repository is parked for launch and will be enabled once provider access is production-ready.
                              </span>
                            </div>
                            <Button
                              className="w-full h-10 bg-white/5 border border-white/10 text-white/45 text-[10px] font-sans font-bold uppercase tracking-tight gap-2 cursor-not-allowed"
                              disabled
                            >
                              Available {PARKED_PROVIDER_AVAILABLE_DATE}
                            </Button>
                          </div>
                        ) : connected ? (
                          <div className="space-y-4">
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                              <span className="text-[9px] font-sans font-bold text-gray-500 uppercase block mb-1 tracking-tight">Operational State</span>
                              <span className="text-xs text-gray-300 truncate block font-sans font-bold tracking-tight">
                                {describeProviderState(providerState)}
                              </span>
                              <span className="text-[10px] text-gray-500 block mt-2 font-sans tracking-tight">
                                {providerState.account_email || providerState.error_message || 'Account not available'}
                              </span>
                              <span className="text-[10px] text-gray-500 block mt-1 font-sans tracking-tight">
                                Last ingest: {formatDateTime(providerState.last_ingest_at)}
                              </span>
                              {evidenceSource ? (
                                <>
                              <span className="text-[10px] text-gray-500 block mt-2 font-sans tracking-tight">
                                {evidenceSource.ingestable ? 'Ingestable source confirmed.' : `Connected, not ingestable: ${humanizeSkippedReason(evidenceSource.ingestable_reason)}`}
                              </span>
                              <span className="text-[10px] text-gray-500 block mt-1 font-sans tracking-tight">
                                    Stored {evidenceSource.documents_count} • Parsed {evidenceSource.parsed_count} • Ready to match {evidenceSource.match_ready_count}
                              </span>
                              <span className="text-[10px] text-gray-600 block mt-1 font-sans tracking-tight">
                                    Case-linked and filing-usable evidence is confirmed later in dispute workflows.
                              </span>
                            </>
                          ) : (
                                <span className="text-[10px] text-gray-500 block mt-2 font-sans tracking-tight">
                                  Ingestion truth unavailable for this provider.
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disconnectingProvider === p}
                              className="w-full h-9 border border-red-500/10 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[10px] font-sans font-bold uppercase tracking-tight"
                              onClick={() => handleDisconnectDocSource(p)}
                            >
                              {disconnectingProvider === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Disconnect Account"}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-xs text-gray-500 leading-relaxed mb-4">
                              {providerState.needs_reconnect ? 'Reconnect this repository to restore evidence ingestion.' : 'Establish persistent monitoring of this repository for financial artifacts.'}
                            </p>
                            <Button
                              className="w-full h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-sans font-bold uppercase tracking-tight gap-2"
                              onClick={() => handleConnectDocSource(p)}
                              disabled={providerLoading === p}
                            >
                              {providerLoading === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><Link2 className="w-3.5 h-3.5 text-white/70" /> Connect</>}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div variants={itemVariants} className="lg:col-span-12 mt-8">
              <div className="border-y border-white/10 bg-transparent px-5 py-5">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="text-[20px] font-sans font-medium text-white tracking-tight">Evidence Intake Status</h3>
                    <p className="text-[10px] font-sans font-medium text-zinc-500 uppercase tracking-tight mt-1">
                      Connection truth stays separate from stored, parsed, ready-to-match, and case-linked evidence truth.
                    </p>
                  </div>
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-zinc-500">
                    Last intake refresh: {formatDateTime(evidenceStatus?.lastIngestion || status?.lastIngest)}
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: 'Ingestable Sources', value: evidenceSourcesState.ingestableCount, note: `${evidenceSourcesState.connectedCount} connected` },
                    { label: 'Sources Resolved', value: ingestionResult?.sourcesResolved ?? evidenceStatus?.sourcesResolved ?? 0, note: 'Resolved for ingest' },
                    { label: 'Docs Stored', value: evidenceStatus?.documentsCount ?? 0, note: 'Stored with file bytes available' },
                    { label: 'Parsing', value: evidenceStatus?.processingCount ?? 0, note: 'Parser still running' },
                    { label: 'Parsed', value: evidenceStatus?.parsedCount ?? 0, note: 'Parser completed successfully' },
                    { label: 'Ready to Match', value: evidenceStatus?.matchReadyCount ?? 0, note: 'Parsed, not case-linked' }
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={cn(
                        "px-0 py-4 md:px-4 xl:px-4",
                        index % 2 === 0 ? "border-r border-white/8 pr-4" : "pl-4",
                        index < 4 ? "border-b border-white/8 md:border-b-0" : "",
                        index < 3 ? "md:border-r md:border-white/8" : "",
                        index === 2 ? "md:border-r-0 xl:border-r" : "",
                        index < 5 ? "xl:border-r xl:border-white/8" : ""
                      )}
                    >
                      <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-2 tracking-tight">{item.label}</span>
                      <span className="text-[22px] font-sans font-medium text-white tracking-tight">{item.value}</span>
                      <span className="block mt-2 text-[10px] text-zinc-500 font-sans font-medium uppercase tracking-tight">{item.note}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[10px] font-sans font-medium uppercase tracking-tight text-zinc-600">
                  Filing-usable evidence is not inferred here. It is confirmed later when dispute evidence links exist in case workflows.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="border-y border-white/10 py-4">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-3 tracking-tight">Skipped Providers</span>
                    {activeSkippedProviders.length > 0 ? (
                      <div className="divide-y divide-white/8">
                        {activeSkippedProviders.map((item, index) => (
                          <div key={`${item.provider}-${item.reason}-${index}`} className="flex items-start justify-between gap-4 py-2 text-xs font-sans tracking-tight">
                            <span className="text-white font-medium uppercase">{item.provider}</span>
                            <span className="text-zinc-400 text-right">{humanizeSkippedReason(item.reason)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 font-sans tracking-tight">
                        No provider skip reasons are currently active for this workspace.
                      </p>
                    )}
                  </div>

                  <div className="border-y border-white/10 py-4">
                    <span className="text-[9px] font-sans font-medium text-zinc-500 uppercase block mb-3 tracking-tight">Last Ingest Outcome</span>
                    {ingestionResult ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] font-sans font-medium text-white tracking-tight">
                            {ingestionResult.phase === 'started'
                              ? ingestionResult.scope === 'gmail'
                                ? 'Gmail-only run started'
                                : 'Ingestion run started'
                              : ingestionResult.phase === 'failed'
                                ? ingestionResult.scope === 'gmail'
                                  ? 'Gmail-only run failed'
                                  : 'Ingestion run failed'
                                : ingestionResult.scope === 'gmail'
                                  ? (ingestionResult.totalDocumentsIngested ?? ingestionResult.documentsIngested ?? 0) > 0
                                    ? 'Gmail-only run stored documents'
                                    : 'Gmail returned zero documents'
                                  : ingestionResult.success
                                    ? 'Completed with stored documents'
                                    : 'Completed without stored documents'}
                          </span>
                          <div className="flex items-center gap-2">
                            {ingestionResult.providerLabel && (
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70 text-[10px] font-sans font-bold uppercase tracking-tight">
                                {ingestionResult.providerLabel}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70 text-[10px] font-sans font-bold uppercase tracking-tight">
                              {ingestionResult.totalDocumentsIngested ?? ingestionResult.documentsIngested ?? 0} stored
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 font-sans tracking-tight">
                          {ingestionResult.message || 'The latest ingestion result is now visible instead of being discarded.'}
                        </p>
                        {!!ingestionResult.providersAttempted?.length && (
                          <p className="text-[10px] font-sans font-medium uppercase tracking-tight text-zinc-500">
                            Attempted: {ingestionResult.providersAttempted.join(', ')}
                          </p>
                        )}
                        {!!ingestionResult.errors?.length && (
                          <div className="space-y-1">
                            {ingestionResult.errors.slice(0, 3).map((error, index) => (
                              <p key={`${error}-${index}`} className="text-xs text-zinc-400 font-sans tracking-tight">{error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 font-sans tracking-tight">
                        No all-sources ingestion run has been recorded in this page state yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Logic Overrides Section */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-12 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-white/20" />
                <h3 className="text-sm font-sans font-bold uppercase tracking-tight text-gray-500">Auto-Ingest from Sources</h3>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-8">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h4 className="text-lg font-sans font-bold text-white tracking-tight">Harvesting Parameters</h4>
                    <p className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mt-0.5">Global Filter Configuration</p>
                  </div>
                </div>

                <div className="mb-8 rounded-xl border border-white/5 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 font-sans tracking-tight leading-relaxed">
                    This panel actively controls sender, subject, exclusion, date, and file-type filtering. Duplicate suppression stays enforced automatically in the ingestion services, and provider folder scope is only honored when a provider route explicitly supports it.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-sans text-white/35 uppercase tracking-tight">Target Sender Patterns</label>
                    <Input
                      value={filters.senderPatterns.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, senderPatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="bg-black/40 border-white/10 text-white font-sans text-xs h-12 tracking-tight"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-sans text-white/35 uppercase tracking-tight">Subject Scopes</label>
                    <Input
                      value={filters.subjectKeywords.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, subjectKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="bg-black/40 border-white/10 text-white font-sans text-xs h-12 tracking-tight"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <label className="text-[10px] font-sans font-bold text-white/35 uppercase tracking-tight mb-6 block">Artifact Class Selection</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(filters.fileTypes).map(([type, enabled]) => (
                      <button
                        key={type}
                        onClick={() => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, [type]: !enabled } }))}
                        className={`p-4 rounded-xl border font-sans font-bold text-[10px] uppercase tracking-tight transition-all duration-300 ${enabled ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <label className="text-[10px] font-sans text-white/35 uppercase tracking-tight mb-3 block">Exclusion Rules</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans text-gray-500 uppercase tracking-tight">Exclude Senders</label>
                      <Input
                        placeholder="newsletter, marketing"
                        value={filters.excludeSenders.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-black/40 border-white/10 text-white font-sans text-xs h-10 tracking-tight"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans text-gray-500 uppercase tracking-tight">Exclude Subjects</label>
                      <Input
                        placeholder="unsubscribe, promotional"
                        value={filters.excludeSubjects.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-black/40 border-white/10 text-white font-sans text-xs h-10 tracking-tight"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <Button
                    onClick={async () => {
                      setSavingFilters(true);
                      const r = activeSlug ? await api.setEvidenceFilters(filters, activeSlug) : { ok: false, error: 'Tenant context is required' } as any;
                      if (r.ok) {
                        toast({ title: "Filters Committed", description: "Harvesting parameters updated across this workspace." });
                        await refreshIntegrationTruth();
                      } else {
                        toast({ title: "Save Failed", description: r.error || 'Failed to save harvesting parameters.', variant: 'destructive' });
                      }
                      setSavingFilters(false);
                    }}
                    disabled={savingFilters}
                    className="h-12 bg-white hover:bg-white/90 text-black font-sans font-bold uppercase tracking-tight text-[10px] px-10"
                  >
                    {savingFilters ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-4">
              <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 p-8 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h4 className="text-lg font-sans font-bold text-white tracking-tight">Schedules</h4>
                    <p className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mt-0.5">Scheduling Engine</p>
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
                        const r = activeSlug ? await api.setEvidenceSchedule(opt.value, activeSlug) : { ok: false, error: 'Tenant context is required' } as any;
                        if (r.ok) {
                          setSchedule(opt.value);
                          toast({ title: "Temporal Shift", description: `Sync set to ${opt.label}` });
                          await refreshIntegrationTruth();
                        } else {
                          toast({ title: "Save Failed", description: r.error || 'Failed to update schedule.', variant: 'destructive' });
                        }
                        setUpdatingSchedule(false);
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${schedule === opt.value ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold tracking-tight ${schedule === opt.value ? 'text-white' : 'text-gray-400'}`}>{opt.label}</span>
                        {schedule === opt.value && <CheckCircle2 className="w-4 h-4 text-white/70" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight block">Auto-Harvesting</span>
                      <span className="text-sm font-sans font-bold text-white tracking-tight">{autoCollect ? 'Active' : 'Standby'}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setUpdatingAutoCollect(true);
                        const next = !autoCollect;
                        const r = activeSlug ? await api.setEvidenceAutoCollect(next, activeSlug) : { ok: false, error: 'Tenant context is required' } as any;
                        if (r.ok) {
                          setAutoCollect(next);
                          await refreshIntegrationTruth();
                        } else {
                          toast({ title: "Save Failed", description: r.error || 'Failed to update auto-harvesting.', variant: 'destructive' });
                        }
                        setUpdatingAutoCollect(false);
                      }}
                      className={`h-10 w-20 rounded-full border transition-all duration-500 relative ${autoCollect ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className={`absolute top-1 bottom-1 w-8 rounded-full transition-all duration-500 ${autoCollect ? 'right-1 bg-white' : 'left-1 bg-gray-600'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ingestion Trigger */}
            <motion.div variants={itemVariants} className="lg:col-span-12 mt-12">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/15 to-white/5 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                  <button
                    onClick={async () => {
                      setIngestingAll(true);
                      const r = activeSlug ? await api.ingestAllEvidence(undefined, activeSlug) : { ok: false, error: 'Tenant context is required' } as any;
                      setIngestionResult({
                        success: !!(r.ok && r.data?.success),
                        scope: 'all',
                        providerLabel: 'All Sources',
                        totalDocumentsIngested: r.data?.totalDocumentsIngested,
                        totalItemsProcessed: r.data?.totalItemsProcessed,
                        documentsIngested: r.data?.documentsIngested,
                        emailsProcessed: r.data?.emailsProcessed,
                        filesProcessed: r.data?.filesProcessed,
                        sourcesResolved: r.data?.sourcesResolved,
                        providersAttempted: r.data?.providersAttempted,
                        skippedProviders: r.data?.skippedProviders || [],
                        errors: r.data?.errors || (r.error ? [r.error] : []),
                        results: r.data?.results,
                        message: r.data?.message || r.error
                      });
                      if (r.ok) {
                        toast({ title: "Harvesting Initiated", description: "Processing all connected repositories for this workspace." });
                      } else {
                        toast({ title: "Ingestion Failed", description: r.error || 'Failed to start ingestion.', variant: 'destructive' });
                      }
                      await refreshIntegrationTruth();
                      setIngestingAll(false);
                    }}
                    disabled={ingestingAll}
                    className="relative w-full h-32 bg-black rounded-2xl border border-white/10 flex items-center justify-center gap-6 transition-all duration-500 group-hover:border-white/20"
                  >
                    {ingestingAll ? (
                      <RefreshCw className="w-10 h-10 text-white/70 animate-spin" />
                    ) : (
                      <>
                        <div className="text-left">
                          <span className="block text-3xl font-sans font-bold text-white tracking-tight">Retrieve from all Sources</span>
                          <span className="block text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight mt-1">Sync data from all connected accounts</span>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white/[0.02] rounded-2xl border border-white/10 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <span className="block text-[9px] font-sans font-bold text-gray-500 uppercase tracking-tight mb-2">Provider-Specific Control</span>
                    <h4 className="text-base font-sans font-bold text-white tracking-tight">Ingest Gmail Only</h4>
                    <p className="text-xs text-gray-400 font-sans tracking-tight mt-2">
                      Run the real Gmail ingestion route by itself so zero-result runs and provider-specific errors are isolated clearly.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">
                      {gmailProviderState.connected
                        ? gmailEvidenceSource?.ingestable === false
                          ? `Connected, not ingestable: ${humanizeSkippedReason(gmailEvidenceSource.ingestable_reason)}`
                          : 'Connected and ready for Gmail-only ingest'
                        : 'Connect Gmail before running provider-specific ingestion'}
                    </p>
                    <Button
                      onClick={handleIngestGmailOnly}
                      disabled={ingestingGmail || !gmailProviderState.connected}
                      className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-sans font-bold uppercase tracking-tight"
                    >
                      {ingestingGmail ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Ingest Gmail Only'}
                    </Button>
                  </div>
                </div>
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
                <span className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-tight mb-1">Amazon</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">{describeProviderState(getProviderState('amazon'))}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-tight mb-1">Repositories</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {evidenceSourcesState.ingestableCount} ingestable / {connectedSecondaryProviders.length} connected
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-tight mb-1">Documents</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {evidenceStatus?.documentsCount ?? 0} stored / {evidenceStatus?.processingCount ?? 0} processing
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-sans font-bold text-gray-600 uppercase tracking-tight mb-1">Last Ingest</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {formatDateTime(evidenceStatus?.lastIngestion || status?.lastIngest)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => navigate(tenantRoute(activeSlug || 'default', '/evidence-locker'))} className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500 hover:text-white transition-colors">
                Evidence Locker
              </button>
              <div className="h-4 w-px bg-white/5" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-gray-500">
                Protocols unavailable
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}


