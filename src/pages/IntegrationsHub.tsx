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
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

// ... (existing constants)

type ProviderKey = 'amazon' | 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'slack' | 'adobe_sign' | 'onedrive' | 'quickbooks' | 'xero';
type SecondaryProviderKey = Exclude<ProviderKey, 'amazon'>;
type AccountingProviderKey = Extract<ProviderKey, 'quickbooks' | 'xero'>;

const isAccountingProvider = (provider: ProviderKey): provider is AccountingProviderKey =>
  provider === 'quickbooks' || provider === 'xero';

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
  accounting_read_status?: 'pending' | 'verified' | 'no_data' | 'failed' | 'reconnect_required';
  accounting_last_read_at?: string;
  accounting_record_count?: number;
  accounting_record_types?: Array<'bill' | 'purchase' | 'accpay'>;
  accounting_organisation_id?: string;
  accounting_organisation_name?: string;
  accounting_organisation_selected_at?: string;
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

  // Connection-result modal state
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
  const [accountingVerificationProvider, setAccountingVerificationProvider] = useState<AccountingProviderKey | null>(null);
  const [accountingCoverage, setAccountingCoverage] = useState<{ records: number; evidence: number; confirmedMappings: number; authoritativeCosts: number; sources: Array<Record<string, any>> } | null>(null);
  const [accountingCandidates, setAccountingCandidates] = useState<Array<Record<string, any>>>([]);
  const [showAccountingIntelligence, setShowAccountingIntelligence] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [mappingSku, setMappingSku] = useState('');
  const [savingAccountingMapping, setSavingAccountingMapping] = useState(false);
  const [xeroOrganisationSelection, setXeroOrganisationSelection] = useState<{ organisations: Array<{ tenantId: string; tenantName: string | null }>; selectedOrganisationId: string | null; selectedOrganisationName: string | null } | null>(null);
  const [selectingXeroOrganisation, setSelectingXeroOrganisation] = useState(false);
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

    const [statusRes, storesRes, evidenceStatusRes, evidenceSourcesRes, accountingCoverageRes] = await Promise.all([
      api.getIntegrationsStatus(activeSlug),
      api.getStores(activeSlug),
      api.getEvidenceStatus(activeSlug),
      api.getEvidenceSources(activeSlug),
      api.getAccountingCoverage(activeSlug)
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

    if (accountingCoverageRes.ok && accountingCoverageRes.data) {
      setAccountingCoverage(accountingCoverageRes.data);
    }
  };

  const handleConnectDocSource = async (provider: SecondaryProviderKey) => {
    const providerName = provider === 'gdrive' ? 'Google Drive'
      : provider === 'gmail' ? 'Gmail'
        : provider === 'dropbox' ? 'Dropbox'
        : provider === 'slack' ? 'Slack'
        : provider === 'adobe_sign' ? 'Adobe Sign'
        : provider === 'onedrive' ? 'OneDrive'
        : provider === 'quickbooks' ? 'QuickBooks'
        : provider === 'xero' ? 'Xero'
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
        : provider === 'quickbooks' ? 'QuickBooks'
        : provider === 'xero' ? 'Xero'
          : 'Outlook';
          
    try {
      setDisconnectingProvider(provider);
      const providerState = status?.providers?.[provider];
      const evidenceSource = evidenceSourcesState.sources.find((source) => source.provider === provider);
      const sourceId = providerState?.source_id || evidenceSource?.id;
      if (isDemoWorkspace && !sourceId) {
        toast({
          title: `${providerName} Disconnected`,
          description: `Demo ${providerName} connection state is display-only and remains ready for walkthroughs.`,
        });
        return;
      }

      const supportsDirectProviderDisconnect = provider === 'gmail' || provider === 'outlook' || provider === 'gdrive' || provider === 'dropbox';
      const res = isAccountingProvider(provider)
        ? await api.disconnectAccountingProvider(provider, activeSlug || undefined)
        : sourceId
          ? await api.disconnectEvidenceSource(sourceId)
          : supportsDirectProviderDisconnect
            ? await api.disconnectDocsProvider(provider)
            : { ok: false, error: 'No tenant-scoped connection record found for this provider' };
      
      if (res.ok) {
        toast({
          title: `${providerName} Disconnected`,
          description: isAccountingProvider(provider)
            ? `Your ${providerName} credential has been revoked for this workspace. Historical financial evidence remains inactive.`
            : `Your ${providerName} account has been disconnected.`,
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

  const handleRequestAccountingVerification = async (provider: AccountingProviderKey) => {
    if (!activeSlug) {
      toast({ title: 'Workspace context required', description: 'Select a workspace before requesting financial evidence verification.', variant: 'destructive' });
      return;
    }

    try {
      setAccountingVerificationProvider(provider);
      const result = await api.requestAccountingVerification(provider, activeSlug);
      if (!result.ok) {
        toast({
          title: 'Verification could not start',
          description: result.error || 'Margin could not schedule the provider read.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Financial evidence verification scheduled',
        description: 'Margin will update this connection after the server-side provider read completes.'
      });
      await refreshIntegrationTruth();
    } catch (error) {
      console.error(`Failed to request ${provider} verification:`, error);
      toast({
        title: 'Verification could not start',
        description: 'Margin could not schedule the provider read. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAccountingVerificationProvider(null);
    }
  };

  const openAccountingIntelligence = async () => {
    if (!activeSlug) return;
    try {
      const result = await api.getAccountingMappingCandidates(activeSlug);
      if (!result.ok) throw new Error((result as any).error || 'Unable to load accounting mapping candidates.');
      setAccountingCandidates(result.data || []);
      setShowAccountingIntelligence(true);
    } catch (error) {
      toast({ title: 'Accounting intelligence unavailable', description: 'Margin could not load safe accounting mapping candidates.', variant: 'destructive' });
    }
  };

  const saveAccountingMapping = async () => {
    if (!activeSlug || !selectedEvidenceId || !mappingSku.trim()) return;
    try {
      setSavingAccountingMapping(true);
      const result = await api.createAccountingSellerMapping({ evidenceId: selectedEvidenceId, sku: mappingSku.trim() }, activeSlug);
      if (!result.ok) throw new Error((result as any).error || 'Unable to save mapping.');
      toast({ title: 'Product mapping saved', description: 'Margin preserved your review and recalculated eligible accounting-derived cost evidence.' });
      setSelectedEvidenceId(null);
      setMappingSku('');
      await openAccountingIntelligence();
      await refreshIntegrationTruth();
    } catch (error) {
      toast({ title: 'Mapping not saved', description: 'Margin could not confirm that mapping. No cost truth was changed.', variant: 'destructive' });
    } finally {
      setSavingAccountingMapping(false);
    }
  };

  const loadXeroOrganisationSelection = async () => {
    if (!activeSlug) return;
    try {
      const result = await api.getXeroOrganisations(activeSlug);
      if (!result.ok) throw new Error((result as any).error || 'Unable to load Xero organisations.');
      setXeroOrganisationSelection(result.data);
    } catch (error) {
      toast({ title: 'Organisation selection unavailable', description: 'Margin could not load the organisations authorised by Xero.', variant: 'destructive' });
    }
  };

  const selectConnectedXeroOrganisation = async (organisationId: string) => {
    if (!activeSlug) return;
    try {
      setSelectingXeroOrganisation(true);
      const result = await api.selectXeroOrganisation(organisationId, activeSlug);
      if (!result.ok) throw new Error(result.error || 'Unable to select organisation.');
      toast({ title: 'Xero organisation selected', description: 'Margin will now verify read-only financial evidence for this organisation.' });
      setXeroOrganisationSelection(null);
      await refreshIntegrationTruth();
    } catch (error) {
      toast({ title: 'Organisation not selected', description: 'Margin did not start an accounting read. Please try again.', variant: 'destructive' });
    } finally {
      setSelectingXeroOrganisation(false);
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
      const handleAccountingSync = (event: Event) => {
        try {
          const evt = JSON.parse((event as MessageEvent).data);
          const providerName = evt?.provider === 'quickbooks' ? 'QuickBooks' : evt?.provider === 'xero' ? 'Xero' : 'Accounting provider';
          if (evt?.status === 'in_progress') {
            toast({ title: 'Financial evidence verification', description: `${providerName} is being verified through a read-only provider check.` });
          } else if (evt?.status === 'completed') {
            toast({
              title: 'Financial evidence verified',
              description: evt?.readStatus === 'no_data'
                ? `${providerName} access was verified; no eligible Phase-0 records were returned.`
                : `${providerName} financial evidence is now available.`
            });
            refreshIntegrationTruth().catch(() => undefined);
          } else if (evt?.status === 'failed') {
            toast({
              title: 'Financial evidence needs attention',
              description: evt?.error || `${providerName} could not complete the verification read.`,
              variant: 'destructive'
            });
            refreshIntegrationTruth().catch(() => undefined);
          }
        } catch { }
      };
      es.addEventListener('evidence_ingestion_started', handleEvidenceStarted as EventListener);
      es.addEventListener('evidence_ingestion_completed', handleEvidenceCompleted as EventListener);
      es.addEventListener('evidence_ingestion_failed', handleEvidenceFailed as EventListener);
      es.addEventListener('accounting_sync', handleAccountingSync as EventListener);
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
        es.removeEventListener('accounting_sync', handleAccountingSync as EventListener);
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
    const quickbooksConnected = searchParams.get('quickbooks_connected');
    const xeroConnected = searchParams.get('xero_connected');
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
    if (gmailConnected === 'true' || outlookConnected === 'true' || gdriveConnected === 'true' || dropboxConnected === 'true' || quickbooksConnected === 'true' || xeroConnected === 'true') {
      const providerName = gmailConnected === 'true' ? 'Gmail'
        : outlookConnected === 'true' ? 'Outlook'
          : gdriveConnected === 'true' ? 'Google Drive'
            : dropboxConnected === 'true' ? 'Dropbox'
            : quickbooksConnected === 'true' ? 'QuickBooks'
            : xeroConnected === 'true' ? 'Xero'
              : 'provider';

      const accountingProvider = providerName === 'QuickBooks' || providerName === 'Xero';
      toast({
        title: `${providerName} Connected Successfully`,
        description: accountingProvider
          ? `${providerName} OAuth is connected. Margin is now verifying read-only financial evidence access.`
          : email ? `${providerName} connected for ${email}. Evidence ingestion will begin automatically.` : `${providerName} has been connected successfully.`,
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
    if (success && !amazonConnected && !gmailConnected && !outlookConnected && !gdriveConnected && !dropboxConnected && !quickbooksConnected && !xeroConnected) {
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

  const getDemoEvidenceSource = (provider: SecondaryProviderKey, source?: EvidenceSourceDTO | null): EvidenceSourceDTO => ({
    id: source?.id || `demo-${provider}`,
    provider,
    account_email: source?.account_email || DEMO_PROVIDER_ACCOUNTS[provider],
    status: 'connected',
    connected: true,
    ingestable: true,
    ingestable_reason: null,
    last_ingested_at: source?.last_ingested_at || DEMO_PROVIDER_LAST_INGEST,
    created_at: source?.created_at || null,
    documents_count: source?.documents_count || 3,
    parsed_count: source?.parsed_count || 2,
    match_ready_count: source?.match_ready_count || 3,
    metadata: source?.metadata || {},
  });

  const getProviderDisplayState = (provider: ProviderKey): IntegrationProviderStatus => {
    const providerStatus = getProviderState(provider);
    if (provider === 'amazon' || isAccountingProvider(provider)) {
      return providerStatus;
    }

    const evidenceSource = getEvidenceSourceTruth(provider as SecondaryProviderKey);
    if (isDemoWorkspace && SECONDARY_PROVIDERS.includes(provider as SecondaryProviderKey) && !isAccountingProvider(provider)) {
      const demoSource = getDemoEvidenceSource(provider as SecondaryProviderKey, evidenceSource);
      return {
        ...providerStatus,
        source_id: demoSource.id,
        connected: true,
        auth_valid: true,
        needs_reconnect: false,
        ingestion_state: 'current',
        has_data: true,
        last_ingest_at: demoSource.last_ingested_at || undefined,
        account_email: demoSource.account_email,
        error_state: undefined,
        error_message: undefined,
      };
    }

    if (providerStatus.connected) {
      return providerStatus;
    }

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

  const describeFinancialEvidenceState = (providerStatus: IntegrationProviderStatus) => {
    if (!providerStatus.connected) return 'Not connected';
    switch (providerStatus.accounting_read_status) {
      case 'verified':
        return 'Financial evidence available';
      case 'no_data':
        return 'Read verified — no eligible records';
      case 'reconnect_required':
        return 'Reconnect required';
      case 'failed':
        return 'Verification needs attention';
      case 'pending':
      default:
        return 'OAuth connected — verification pending';
    }
  };

  const describeFinancialEvidenceDetail = (providerStatus: IntegrationProviderStatus) => {
    if (!providerStatus.connected) {
      return 'Connect read-only accounting records so Margin can use supplier, purchase and cost context when recovery evidence requires it.';
    }
    if (providerStatus.accounting_read_status === 'verified') {
      const count = providerStatus.accounting_record_count ?? 0;
      return `${count} ${count === 1 ? 'eligible record is' : 'eligible records are'} available as financial evidence.`;
    }
    if (providerStatus.accounting_read_status === 'no_data') {
      return 'Margin completed a read-only provider check. No eligible Phase-0 records were returned.';
    }
    if (providerStatus.accounting_read_status === 'reconnect_required') {
      return providerStatus.error_message || 'The provider authorization needs to be refreshed before Margin can read financial evidence.';
    }
    if (providerStatus.accounting_read_status === 'failed') {
      return providerStatus.error_message || 'Margin could not verify this provider read. Try verification again or reconnect the source.';
    }
    return 'Margin is verifying read-only access to the approved accounting records.';
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
      <PageLayout title="Integrations" noPadding>
        <div className="min-h-screen bg-[#FAFAF7] px-4 py-10 text-[#111827] sm:px-6">
          <div className="mx-auto max-w-xl rounded-[10px] border border-[#DCE8EE] bg-white p-6 text-center shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
            <h1 className="font-lora text-[28px] font-normal tracking-tight text-[#182026]">Workspace context required</h1>
            <p className="mt-2 text-[14px] leading-6 text-[#66737F]">
              Select a workspace before viewing or changing connection state.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Integrations" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        {/* Aesthetic Background Elements */}
        
        

        {/* Recovery result modal */}
        <Dialog open={showRecoveryReveal} onOpenChange={setShowRecoveryReveal}>
          <DialogContent className="max-w-2xl rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#111827] shadow-[0_18px_45px_rgba(24,32,38,0.12)]">
            <DialogHeader className="border-b border-[#DCE8EE] px-6 py-5 text-left">
              <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Recovery review</p>
              <DialogTitle className="mt-1.5 font-lora text-[26px] font-normal tracking-tight text-[#182026]">
                Estimated recovery opportunities detected
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 px-6 py-5 text-left">
              {recoveryData && (
                <>
                  <div className="space-y-2">
                    <div className="text-6xl font-sans font-bold text-[#182026] tracking-tighter">
                      {formatCurrency(recoveryData.totalAmount, recoveryData.currency)}
                    </div>
                    <div className="text-sm font-sans font-bold text-[#182026]/35 tracking-tight">
                      estimated value from detected opportunities
                    </div>
                    <div className="mt-4">
                      <Badge variant="outline" className="bg-[#F3F5F4] border-[#E5E7EB] text-[#182026]/70 font-sans font-bold text-[12px] tracking-tight px-3 py-1">
                        {recoveryData.claimCount} Detected opportunities
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-[#E7EEF2] bg-[#FAFAF7] p-3.5">
                      <div className="text-[12px] font-medium tracking-tight text-[#66737F]">Lost inventory</div>
                      <div className="text-sm font-bold text-[#182026] tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.6, recoveryData.currency)}</div>
                    </div>
                    <div className="rounded-md border border-[#E7EEF2] bg-[#FAFAF7] p-3.5">
                      <div className="text-[12px] font-medium tracking-tight text-[#66737F]">Fee errors</div>
                      <div className="text-sm font-bold text-[#182026] tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.3, recoveryData.currency)}</div>
                    </div>
                    <div className="rounded-md border border-[#E7EEF2] bg-[#FAFAF7] p-3.5">
                      <div className="text-[12px] font-medium tracking-tight text-[#66737F]">Shipments</div>
                      <div className="text-sm font-bold text-[#182026] tracking-tight">{formatCurrency(recoveryData.totalAmount * 0.1, recoveryData.currency)}</div>
                    </div>
                  </div>

                  <p className="text-[13px] leading-5 text-[#66737F]">
                    Margin compared the connected marketplace records to identify opportunities that still need evidence review.
                  </p>
                </>
              )}
            </div>
            <DialogFooter className="border-t border-[#DCE8EE] px-6 py-4">
              <Button onClick={() => setShowRecoveryReveal(false)} className="h-9 w-full rounded-md bg-[#0B74DE] text-[13px] font-medium tracking-tight text-white hover:bg-[#005FBA]">
                Continue to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Evidence source modal */}
        <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
          <DialogContent className="max-w-2xl rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#111827] shadow-[0_18px_45px_rgba(24,32,38,0.12)]">
            <DialogHeader className="border-b border-[#DCE8EE] px-6 py-5 text-left">
              <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Evidence sources</p>
              <DialogTitle className="mt-1.5 font-lora text-[26px] font-normal tracking-tight text-[#182026]">
                Connect a source
              </DialogTitle>
              <DialogDescription className="mt-2 text-[13px] leading-5 text-[#66737F]">
                Connect an eligible source to collect documents for evidence review.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[#E7EEF2] p-4">
                  <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Connect Gmail</h3>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#66737F]">
                    Review Gmail for invoices, purchase orders, and shipment confirmations.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-[#D8E7FF] text-[#0B74DE] bg-[#F3F7FF] hover:bg-[#EAF2FF] font-sans font-bold text-[12px] tracking-tight"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      handleConnectDocSource('gmail');
                    }}
                  >
                    Link Account
                  </Button>
                </div>

                <div className="rounded-md border border-[#E7EEF2] p-4">
                  <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Connect Google Drive</h3>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#66737F]">
                    Review Google Drive for the business documents that may support a case.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-[#D8E7FF] text-[#0B74DE] bg-[#F3F7FF] hover:bg-[#EAF2FF] font-sans font-bold text-[12px] tracking-tight"
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
                <div className="flex items-center justify-center gap-2 text-[12px] font-sans font-bold text-[#182026]/35 tracking-tight">
                  <Info className="h-3 w-3" />
                  <span>Evidence is reviewed in the case workflow before it can support filing.</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-[12px] font-sans font-bold tracking-tight text-[#66737F] hover:text-[#182026]"
                >
                  I'll upload manual artifacts later
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          {/* Header section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col"
          >
            <div className="flex flex-col gap-4 border-b border-[#DCE8EE] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Integration control</p>
                <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">
                  Connected sources
                </h1>
                <p className="mt-2.5 text-[14px] leading-6 text-[#66737F]">
                  Connect marketplace records and evidence repositories. Margin keeps connection state, ingestion state, and downstream evidence state separate.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-[#4D5B66]">
                <span className={`h-1.5 w-1.5 rounded-full ${pageOperationalState === 'Attention required' || pageOperationalState === 'Amazon connection required' ? 'bg-rose-500' : 'bg-[#0B74DE]'}`} />
                <span>{pageOperationalState}</span>
              </div>
            </div>

            {/* Restored Unified Search */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex w-full max-w-xl items-center rounded-md border border-[#DCE8EE] bg-white transition-colors focus-within:border-[#0B74DE] focus-within:ring-2 focus-within:ring-[#0B74DE]/15">
                <SearchIcon className="ml-3 h-4 w-4 shrink-0 text-[#66737F]" aria-hidden="true" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sources, stores, and repositories"
                  className="h-10 border-none bg-transparent text-[13px] tracking-tight text-[#182026] placeholder:text-[#8A97A2] focus-visible:ring-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Main Nodes Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >
            {/* Amazon Command Node */}
            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-12">
              <div className="flex h-full flex-col rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">

                <div className="flex flex-col gap-4 border-b border-[#DCE8EE] pb-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
                      <img
                        src="/amazon-logo-transparent-circle.png"
                        alt="Amazon"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Marketplace records</p>
                      <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Amazon Seller Central</h3>
                      <p className="mt-1 text-[13px] leading-5 text-[#66737F]">Account connection and reconciliation source.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Dialog open={showAddStore} onOpenChange={setShowAddStore}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026] gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Store Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#111827] shadow-[0_18px_45px_rgba(24,32,38,0.12)]">
                        <DialogHeader className="border-b border-[#DCE8EE] px-6 py-5 text-left">
                          <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Store mapping</p>
                          <DialogTitle className="mt-1.5 font-lora text-[26px] font-normal tracking-tight text-[#182026]">Add a store record</DialogTitle>
                          <DialogDescription className="mt-2 text-[13px] leading-5 text-[#66737F]">
                            This record helps map your workspace. It does not authenticate Amazon by itself.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 px-6 py-5">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Store name</label>
                              <Input
                                placeholder="Alpha-Store-01"
                                value={newStoreData.name}
                                onChange={e => setNewStoreData({ ...newStoreData, name: e.target.value })}
                                className="h-10 border-[#DCE8EE] bg-[#FAFAF7] text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/15"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Seller ID</label>
                              <Input
                                placeholder="A3XXXXXXXXXXXX"
                                value={newStoreData.seller_id}
                                onChange={e => setNewStoreData({ ...newStoreData, seller_id: e.target.value })}
                                className="h-10 border-[#DCE8EE] bg-[#FAFAF7] text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/15"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Marketplace region</label>
                              <select
                                className="h-10 w-full rounded-md border border-[#DCE8EE] bg-[#FAFAF7] px-3 text-[13px] tracking-tight text-[#182026] outline-none focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15"
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
                        <DialogFooter className="border-t border-[#DCE8EE] px-6 py-4">
                          <Button
                            variant="ghost"
                            onClick={() => setShowAddStore(false)}
                            className="h-9 text-[13px] font-medium tracking-tight text-[#66737F] hover:text-[#182026]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddStore}
                            disabled={addingStore}
                            className="h-9 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white hover:bg-[#005FBA]"
                          >
                            {addingStore ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Store Record"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {isFull ? (
                      <div className="flex flex-col items-start gap-3">
                        <p className="text-[13px] font-medium tracking-tight text-[#4D5B66]">
                          We’re onboarding a small batch of sellers right now.
                        </p>
                        <p className="text-[13px] text-[#66737F]">
                          Next batch opens in {capacity?.nextBatchHours ?? 24} hours.
                        </p>
                        <Button
                          onClick={() => navigate('/waitlist?reason=capacity')}
                          className="h-9 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white transition-colors hover:bg-[#005FBA]"
                        >
                          Join Waitlist
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={async () => {
                          toast({ title: 'Connect Amazon', description: 'Redirecting to Amazon Seller Central authorization...' });
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
                        className="h-9 rounded-md bg-[#0B74DE] px-5 text-[#FFFFFF] font-sans font-semibold tracking-tight text-[11px] transition-colors hover:bg-[#005FBA]"
                      >
                        Connect Amazon
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 border-b border-[#E7EEF2] md:grid-cols-2 xl:grid-cols-4">
                  <div className="border-b border-[#D8E3EA] px-0 py-4 md:border-r xl:border-b-0 xl:pr-5">
                    <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Auth status</span>
                    <span className="text-[13px] font-medium tracking-tight text-[#182026]">{describeProviderState(amazonProviderState)}</span>
                  </div>
                  <div className="border-b border-[#D8E3EA] px-0 py-4 md:border-b-0 xl:border-r xl:px-5">
                    <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Seller ID</span>
                    <span className="break-all text-[13px] font-medium tracking-tight text-[#182026]">{connectedSellerId || 'Not resolved'}</span>
                  </div>
                  <div className="border-b border-[#D8E3EA] px-0 py-4 md:border-r md:pr-5 xl:border-b-0 xl:px-5">
                    <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Amazon account</span>
                    <span className="text-[13px] font-medium tracking-tight text-[#182026]">{connectedAmazonName || 'Not available'}</span>
                  </div>
                  <div className="px-0 py-4 md:pl-5">
                    <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Marketplaces</span>
                    <span className="text-[13px] font-medium tracking-tight text-[#182026]">
                      {connectedAmazonMarketplaces.length > 0 ? connectedAmazonMarketplaces.join(', ') : 'Not available'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {loadingStores ? (
                    <div className="col-span-full flex justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-[#182026]/25 animate-spin" />
                    </div>
                  ) : stores.length > 0 ? (
                    stores.map(store => (
                        <div key={store.id} className="group/card relative rounded-md border border-[#E7EEF2] bg-[#FCFDFC] p-4 transition-colors hover:bg-[#F7FAFC]">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col">
                            <span className="text-[#182026] font-sans font-medium text-[13px] mb-1 truncate max-w-[150px] tracking-tight">{store.name}</span>
                            <span className="text-[12px] font-medium tracking-tight text-[#66737F]">{store.marketplace}</span>
                          </div>
                          <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                        </div>

                        <div className="space-y-3 pt-4 border-t border-[#D8E3EA]">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Seller ID</span>
                            <span className="break-all text-[12px] font-medium tracking-tight text-[#182026]">{store.seller_id || 'Not bound'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                            <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Status</span>
                            <span className="text-[12px] font-medium tracking-tight text-[#182026]">{getStoreOperationalState(store)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteStore(store.id)}
                              disabled={deletingStore === store.id}
                              className="opacity-0 group-hover/card:opacity-100 transition-opacity p-2 hover:bg-red-500/10 text-[#66737F] hover:text-red-400"
                            >
                              {deletingStore === store.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full border border-dashed border-[#D8E3EA] px-5 py-10 text-center font-sans font-light tracking-tight">
                      <p className="text-[#66737F]">No tenant store records are bound yet. Connect Amazon to resolve seller identity, or add a store record for workspace mapping.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-[#E7EEF2] pt-4 text-[12px] leading-5 text-[#66737F] md:flex-row md:items-center md:justify-between">
                  <span>Marketplace access is handled through your approved Amazon connection.</span>
                  <span>Last Amazon ingest: {formatDateTime(status?.lastIngest)}</span>
                </div>
              </div>
            </motion.div>

            {/* INTEGRATION REQUEST: Can't find what you need? */}
            <motion.div variants={itemVariants} className="mt-1">
              <div className="flex flex-col gap-4 rounded-[10px] border border-dashed border-[#DCE8EE] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Need another integration?</h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#66737F]">Tell us which provider would make your evidence review more complete.</p>
                </div>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  variant="outline"
                  className="h-9 shrink-0 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                >
                  Request integration
                </Button>
              </div>
            </motion.div>

            {/* Waitlist / Request Dialog */}
            <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
              <DialogContent className="rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#111827] shadow-[0_18px_45px_rgba(24,32,38,0.12)]">
                <DialogHeader className="border-b border-[#DCE8EE] px-6 py-5 text-left">
                  <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Integration request</p>
                  <DialogTitle className="mt-1.5 font-lora text-[26px] font-normal tracking-tight text-[#182026]">Request an integration</DialogTitle>
                  <DialogDescription className="mt-2 text-[13px] leading-5 text-[#66737F]">
                    Tell us which platform or repository you need to connect.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 px-6 py-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Platform name</label>
                      <Input
                        placeholder="e.g., Shopify, Walmart, NetSuite..."
                        value={requestFormData.platform}
                        onChange={e => setRequestFormData({ ...requestFormData, platform: e.target.value })}
                        className="h-10 border-[#DCE8EE] bg-[#FAFAF7] text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/15"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-medium tracking-tight text-[#66737F]">What you need to connect</label>
                      <textarea
                        placeholder="What records would you want Margin to review?"
                        value={requestFormData.description}
                        onChange={e => setRequestFormData({ ...requestFormData, description: e.target.value })}
                        className="h-28 w-full resize-none rounded-md border border-[#DCE8EE] bg-[#FAFAF7] px-3 py-2.5 text-[13px] tracking-tight text-[#182026] outline-none focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#66737F]" />
                    <p className="text-[12px] leading-5 text-[#66737F]">
                      Integration request submission is not available in this build. Contact support if you need a provider added.
                    </p>
                  </div>
                </div>
                <DialogFooter className="border-t border-[#DCE8EE] px-6 py-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowRequestForm(false)}
                    className="h-9 text-[13px] font-medium tracking-tight text-[#66737F] hover:text-[#182026]"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled
                    className="h-9 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] px-4 text-[13px] font-medium tracking-tight text-[#66737F]"
                  >
                    Unavailable
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAccountingIntelligence} onOpenChange={setShowAccountingIntelligence}>
              <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026]">
                <DialogHeader>
                  <DialogTitle className="font-lora text-[24px] font-normal">Accounting intelligence</DialogTitle>
                  <DialogDescription>
                    Margin shows only safe accounting evidence projections here. It never changes your books, and uncertain records remain unresolved until you review them.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    ['Records', accountingCoverage?.records || 0],
                    ['Evidence items', accountingCoverage?.evidence || 0],
                    ['Confirmed mappings', accountingCoverage?.confirmedMappings || 0],
                    ['Authoritative costs', accountingCoverage?.authoritativeCosts || 0]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3">
                      <p className="text-[11px] font-medium text-[#66737F]">{label}</p>
                      <p className="mt-1 text-[20px] font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[14px] font-semibold">Line items needing product resolution</p>
                    <p className="mt-1 text-[12px] text-[#66737F]">Confirm a Margin SKU only when the supplier line genuinely identifies that product. No ambiguous mapping is applied automatically.</p>
                  </div>
                  {accountingCandidates.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[#DCE8EE] p-4 text-[13px] text-[#66737F]">No safe accounting evidence is ready for mapping yet.</div>
                  ) : accountingCandidates.slice(0, 50).map((candidate) => {
                    const evidenceId = String(candidate.evidenceId || '');
                    const mapping = candidate.mapping as Record<string, any> | null;
                    const isSelected = selectedEvidenceId === evidenceId;
                    return (
                      <div key={evidenceId} className="rounded-md border border-[#DCE8EE] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-medium">{candidate.lineItemCode || candidate.lineItemName || 'Unlabelled accounting line'}</p>
                            <p className="mt-1 text-[12px] text-[#66737F]">{candidate.provider} · {candidate.supplierName || 'Supplier unavailable'} · {candidate.referenceNumber || 'No reference'} · {candidate.quantity ?? 'Quantity unknown'}</p>
                          </div>
                          {mapping ? <Badge variant="outline">{String(mapping.status || 'mapped')}</Badge> : <Badge variant="outline" className="border-amber-200 text-amber-700">Review required</Badge>}
                        </div>
                        {mapping ? (
                          <p className="mt-2 text-[12px] text-[#66737F]">Mapped to <strong>{String(mapping.sku || '')}</strong> by {String(mapping.mappingMethod || 'recorded mapping')}.</p>
                        ) : isSelected ? (
                          <div className="mt-3 flex gap-2">
                            <Input value={mappingSku} onChange={(event) => setMappingSku(event.target.value)} placeholder="Margin SKU" className="h-9 text-[12px]" />
                            <Button size="sm" disabled={!mappingSku.trim() || savingAccountingMapping} onClick={saveAccountingMapping}>
                              {savingAccountingMapping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedEvidenceId(null); setMappingSku(''); }}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-3 h-8 text-[12px]" onClick={() => { setSelectedEvidenceId(evidenceId); setMappingSku(''); }}>Map product</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={Boolean(xeroOrganisationSelection)} onOpenChange={(open) => !open && setXeroOrganisationSelection(null)}>
              <DialogContent className="rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026]">
                <DialogHeader>
                  <DialogTitle className="font-lora text-[24px] font-normal">Select your Xero organisation</DialogTitle>
                  <DialogDescription>Margin will read only the organisation you select. It never silently switches organisations.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {xeroOrganisationSelection?.organisations.map((organisation) => (
                    <Button key={organisation.tenantId} variant="outline" disabled={selectingXeroOrganisation} className="h-auto w-full justify-start px-3 py-3 text-left" onClick={() => selectConnectedXeroOrganisation(organisation.tenantId)}>
                      <span className="flex flex-col items-start"><strong>{organisation.tenantName || 'Unnamed Xero organisation'}</strong><span className="mt-1 text-[11px] text-[#66737F]">{organisation.tenantId}</span></span>
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Harvesting Nodes Title */}
            <motion.div variants={itemVariants} className="mt-3">
              <div>
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Evidence and financial sources</p>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[#182026]">Connect the records that can support recovery review</h2>
              </div>
            </motion.div>

            <div className="grid overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white md:grid-cols-2 xl:grid-cols-3">

              {SECONDARY_PROVIDERS.map((p) => {
                const providerMeta = {
                  gmail: { name: 'Gmail', icon: '/gmailicon.png' },
                  outlook: { name: 'Outlook', icon: '/outlookicon.webp' },
                  gdrive: { name: 'Google Drive', icon: '/gd.png' },
                  dropbox: { name: 'Dropbox', icon: '/Dropbox_Icon.svg.png' },
                  slack: { name: 'Slack', icon: '/slack-icon-2019.png' },
                  adobe_sign: { name: 'Adobe Sign', icon: '/dobe.png' },
                  onedrive: { name: 'OneDrive', icon: '/onedriive.png' },
                  quickbooks: { name: 'QuickBooks', icon: '/quickbooks.png' },
                  xero: { name: 'Xero', icon: '/xero.png' },
                } as const;

                const providerState = getProviderDisplayState(p);
                const sourceTruth = getEvidenceSourceTruth(p);
                const evidenceSource = isDemoWorkspace && !isAccountingProvider(p) ? getDemoEvidenceSource(p, sourceTruth) : sourceTruth;
                const isParked = !isDemoWorkspace && PARKED_SECONDARY_PROVIDERS.includes(p);
                const connected = !isParked && (providerState.connected || evidenceSource?.connected === true);
                const isAccounting = isAccountingProvider(p);
                const meta = providerMeta[p];

                return (
                  <motion.div key={p} variants={itemVariants} className="w-full">
                    <div className={`flex h-full flex-col border-b border-r border-[#E7EEF2] p-5 transition-colors ${isParked ? 'bg-[#FAFAF7] opacity-70' : 'bg-white hover:bg-[#F7FAFC]'}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center">
                          <img src={meta.icon} alt={meta.name} className="h-7 w-7 object-contain" />
                        </div>
                      </div>

                      <h3 className="text-[15px] font-semibold tracking-tight text-[#182026]">{meta.name}</h3>
                      <p className="mt-1 text-[12px] text-[#66737F]">{isAccounting ? 'Financial evidence' : 'Evidence repository'}</p>

                      <div className="flex-1">
                        {isParked ? (
                          <div className="space-y-4">
                            <div className="border-t border-[#E7EEF2] pt-3">
                              <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Availability</span>
                              <span className="block text-[13px] font-medium tracking-tight text-[#4D5B66]">
                                Available {PARKED_PROVIDER_AVAILABLE_DATE}
                              </span>
                              <span className="mt-2 block text-[12px] leading-5 text-[#66737F]">
                                This repository is parked for launch and will be enabled once provider access is production-ready.
                              </span>
                            </div>
                            <Button
                              className="h-9 w-full rounded-md border-[#DCE8EE] bg-[#F7FAFC] text-[13px] font-medium tracking-tight text-[#66737F] cursor-not-allowed"
                              disabled
                            >
                              Available {PARKED_PROVIDER_AVAILABLE_DATE}
                            </Button>
                          </div>
                        ) : connected ? (
                          <div className="space-y-4">
                            {isAccounting ? (
                              <>
                                <div className="border-t border-[#E7EEF2] pt-3">
                                  <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Financial evidence state</span>
                                  <span className="block text-[13px] font-medium tracking-tight text-[#4D5B66]">
                                    {describeFinancialEvidenceState(providerState)}
                                  </span>
                                  {providerState.account_email && (
                                    <span className="mt-2 block truncate text-[12px] tracking-tight text-[#66737F]">
                                      {providerState.account_email}
                                    </span>
                                  )}
                                  {p === 'xero' && (
                                    <span className="mt-2 block text-[12px] tracking-tight text-[#66737F]">
                                      Organisation: {providerState.accounting_organisation_name || 'Selection required'}
                                      {providerState.accounting_organisation_selected_at ? ` · selected ${formatDateTime(providerState.accounting_organisation_selected_at)}` : ''}
                                    </span>
                                  )}
                                  <p className="mt-2 text-[12px] leading-5 text-[#66737F]">
                                    {describeFinancialEvidenceDetail(providerState)}
                                  </p>
                                  <span className="mt-2 block text-[12px] tracking-tight text-[#66737F]">
                                    Last verified: {formatDateTime(providerState.accounting_last_read_at)}
                                  </span>
                                  <span className="mt-2 block border-l-2 border-[#0B74DE] bg-[#F6FAFE] px-2.5 py-2 text-[12px] leading-5 text-[#4D5B66]">
                                    Read-only · Bills and purchases only
                                  </span>
                                </div>
                                {(providerState.accounting_read_status === 'failed' || providerState.accounting_read_status === 'reconnect_required') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={accountingVerificationProvider === p}
                                    className="h-8 w-full rounded-md border-[#DCE8EE] bg-white text-[12px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]"
                                    onClick={() => handleRequestAccountingVerification(p)}
                                  >
                                    {accountingVerificationProvider === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : 'Retry verification'}
                                  </Button>
                                )}
                                {p === 'xero' && (
                                  <Button variant="outline" size="sm" className="h-8 w-full rounded-md border-[#DCE8EE] bg-white text-[12px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]" onClick={loadXeroOrganisationSelection}>
                                    Select Xero organisation
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" className="h-8 w-full rounded-md border-[#DCE8EE] bg-white text-[12px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]" onClick={openAccountingIntelligence}>
                                  Review accounting coverage
                                </Button>
                              </>
                            ) : (
                              <div className="border-t border-[#E7EEF2] pt-3">
                                <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Operational state</span>
                                <span className="block truncate text-[13px] font-medium tracking-tight text-[#4D5B66]">
                                  {describeProviderState(providerState)}
                                </span>
                                <span className="text-[12px] text-[#66737F] block mt-2 font-sans tracking-tight">
                                  {providerState.account_email || providerState.error_message || 'Account not available'}
                                </span>
                                <span className="text-[12px] text-[#66737F] block mt-1 font-sans tracking-tight">
                                  Last ingest: {formatDateTime(providerState.last_ingest_at)}
                                </span>
                                {evidenceSource ? (
                                  <>
                                    <span className="text-[12px] text-[#66737F] block mt-2 font-sans tracking-tight">
                                      {evidenceSource.ingestable ? 'Ingestable source confirmed.' : `Connected, not ingestable: ${humanizeSkippedReason(evidenceSource.ingestable_reason)}`}
                                    </span>
                                    <span className="text-[12px] text-[#66737F] block mt-1 font-sans tracking-tight">
                                      Stored {evidenceSource.documents_count} • Parsed {evidenceSource.parsed_count} • Ready to match {evidenceSource.match_ready_count}
                                    </span>
                                    <span className="text-[12px] text-gray-600 block mt-1 font-sans tracking-tight">
                                      Case-linked and filing-usable evidence is confirmed later in dispute workflows.
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[12px] text-[#66737F] block mt-2 font-sans tracking-tight">
                                    Ingestion truth unavailable for this provider.
                                  </span>
                                )}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={disconnectingProvider === p}
                              className="integrations-disconnect-button h-8 w-full rounded-md border border-rose-200 bg-white text-[12px] font-medium tracking-tight text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDisconnectDocSource(p)}
                            >
                              {disconnectingProvider === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Disconnect"}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="mb-4 text-[12px] leading-5 text-[#66737F]">
                              {isAccounting
                                ? providerState.needs_reconnect
                                  ? 'Reconnect this financial evidence source so Margin can verify read-only accounting access again.'
                                  : 'Connect your accounting records so Margin can use supplier, purchase and cost context when recovery evidence requires it.'
                                : providerState.needs_reconnect
                                  ? 'Reconnect this repository to restore evidence ingestion.'
                                  : 'Establish persistent monitoring of this repository for financial artifacts.'}
                            </p>
                            <Button
                              className="h-9 w-full rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC] gap-2"
                              onClick={() => handleConnectDocSource(p)}
                              disabled={providerLoading === p}
                            >
                              {providerLoading === p ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><Link2 className="w-3.5 h-3.5 text-[#182026]/70" /> {isAccounting ? 'Connect financial evidence' : 'Connect'}</>}
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
              <div className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                  <div className="flex flex-col gap-3 border-b border-[#DCE8EE] pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Evidence intake</p>
                      <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-[#182026]">Ingestion and evidence state</h3>
                      <p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">
                        Connection state stays separate from stored, parsed, ready-to-match, and case-linked evidence.
                      </p>
                    </div>
                    <p className="text-[12px] leading-5 text-[#66737F]">
                      Last intake refresh: {formatDateTime(evidenceStatus?.lastIngestion || status?.lastIngest)}
                    </p>
                  </div>

                <div className="mt-4 grid grid-cols-2 border-y border-[#E7EEF2] md:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: 'Ingestable Sources', value: evidenceSourcesState.ingestableCount, note: `${evidenceSourcesState.connectedCount} connected` },
                    { label: 'Sources Resolved', value: ingestionResult?.sourcesResolved ?? evidenceStatus?.sourcesResolved ?? 0, note: 'Resolved for ingest' },
                    { label: 'Docs Stored', value: evidenceStatus?.documentsCount ?? 0, note: 'Stored with file bytes available' },
                    { label: 'Parsing', value: isDemoWorkspace ? 9 : evidenceStatus?.processingCount ?? 0, note: 'Parser still running' },
                    { label: 'Parsed', value: evidenceStatus?.parsedCount ?? 0, note: 'Parser completed successfully' },
                    { label: 'Ready to Match', value: evidenceStatus?.matchReadyCount ?? 0, note: 'Parsed, not case-linked' }
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={cn(
                        "px-3 py-3.5 md:px-4",
                        index % 2 === 0 ? "border-r border-[#D8E3EA] pr-4" : "pl-4",
                        index < 4 ? "border-b border-[#D8E3EA] md:border-b-0" : "",
                        index < 3 ? "md:border-r md:border-[#D8E3EA]" : "",
                        index === 2 ? "md:border-r-0 xl:border-r" : "",
                        index < 5 ? "xl:border-r xl:border-[#D8E3EA]" : ""
                      )}
                    >
                      <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">{item.label}</span>
                      <span className="text-[22px] font-semibold tracking-tight text-[#182026]">{item.value}</span>
                      <span className="mt-1 block text-[12px] leading-5 text-[#66737F]">{item.note}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 border-l-2 border-[#0B74DE] bg-[#F6FAFE] px-3 py-2.5 text-[12px] leading-5 text-[#4D5B66]">
                  Filing-usable evidence is not inferred here. It is confirmed later when dispute evidence links exist in case workflows.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="border-t border-[#E7EEF2] pt-4">
                    <span className="mb-3 block text-[12px] font-medium tracking-tight text-[#66737F]">Skipped providers</span>
                    {activeSkippedProviders.length > 0 ? (
                      <div className="divide-y divide-[#D8E3EA]">
                        {activeSkippedProviders.map((item, index) => (
                          <div key={`${item.provider}-${item.reason}-${index}`} className="flex items-start justify-between gap-4 py-2 text-[12px] tracking-tight">
                            <span className="font-medium text-[#182026]">{item.provider}</span>
                            <span className="text-[#66737F] text-right">{humanizeSkippedReason(item.reason)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#66737F] font-sans tracking-tight">
                        No provider skip reasons are currently active for this workspace.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-[#E7EEF2] pt-4">
                    <span className="mb-3 block text-[12px] font-medium tracking-tight text-[#66737F]">Last ingest outcome</span>
                    {ingestionResult ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] font-sans font-medium text-[#182026] tracking-tight">
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
                              <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">
                                {ingestionResult.providerLabel}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">
                              {ingestionResult.totalDocumentsIngested ?? ingestionResult.documentsIngested ?? 0} stored
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-[#66737F] font-sans tracking-tight">
                          {ingestionResult.message || 'The latest ingestion result is now visible instead of being discarded.'}
                        </p>
                        {!!ingestionResult.providersAttempted?.length && (
                          <p className="text-[12px] font-sans font-medium tracking-tight text-[#66737F]">
                            Attempted: {ingestionResult.providersAttempted.join(', ')}
                          </p>
                        )}
                        {!!ingestionResult.errors?.length && (
                          <div className="space-y-1">
                            {ingestionResult.errors.slice(0, 3).map((error, index) => (
                              <p key={`${error}-${index}`} className="text-xs text-[#66737F] font-sans tracking-tight">{error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#66737F] font-sans tracking-tight">
                        No all-sources ingestion run has been recorded in this page state yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Logic Overrides Section */}
            <motion.div variants={itemVariants} className="mt-3">
              <div>
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Automated intake</p>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[#182026]">Control what Margin collects</h2>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-8">
              <div className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-tight text-[#182026]">Collection filters</h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#66737F]">Saved rules used when a supported provider can collect evidence.</p>
                  </div>
                </div>

                <div className="mb-6 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3.5">
                  <p className="text-[12px] leading-5 text-[#66737F]">
                    This panel actively controls sender, subject, exclusion, date, and file-type filtering. Duplicate suppression stays enforced automatically in the ingestion services, and provider folder scope is only honored when a provider route explicitly supports it.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Target sender patterns</label>
                    <Input
                      value={filters.senderPatterns.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, senderPatterns: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="h-10 border-[#DCE8EE] bg-[#FAFAF7] text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/15"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Subject scopes</label>
                    <Input
                      value={filters.subjectKeywords.join(', ')}
                      onChange={(e) => setFilters(f => ({ ...f, subjectKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                      className="h-10 border-[#DCE8EE] bg-[#FAFAF7] text-[13px] tracking-tight text-[#182026] focus-visible:ring-[#0B74DE]/15"
                    />
                  </div>
                </div>

                <div className="mt-6 border-t border-[#E7EEF2] pt-5">
                  <label className="mb-3 block text-[12px] font-medium tracking-tight text-[#66737F]">Artifact classes</label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {Object.entries(filters.fileTypes).map(([type, enabled]) => (
                      <button
                        key={type}
                        onClick={() => setFilters(f => ({ ...f, fileTypes: { ...f.fileTypes, [type]: !enabled } }))}
                        className={`rounded-md border px-3 py-2.5 text-[12px] font-medium tracking-tight transition-colors ${enabled ? 'border-[#0B74DE] bg-[#F6FAFE] text-[#0B74DE]' : 'border-[#DCE8EE] bg-white text-[#66737F] hover:bg-[#F7FAFC]'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-[#E7EEF2] pt-5">
                  <label className="mb-3 block text-[12px] font-medium tracking-tight text-[#66737F]">Exclusion rules</label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Exclude senders</label>
                      <Input
                        placeholder="newsletter, marketing"
                        value={filters.excludeSenders.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSenders: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-[#F9FBFC] border-[#D8E3EA] text-[#182026] font-sans text-xs h-10 tracking-tight"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium tracking-tight text-[#66737F]">Exclude subjects</label>
                      <Input
                        placeholder="unsubscribe, promotional"
                        value={filters.excludeSubjects.join(', ')}
                        onChange={(e) => setFilters(f => ({ ...f, excludeSubjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        className="bg-[#F9FBFC] border-[#D8E3EA] text-[#182026] font-sans text-xs h-10 tracking-tight"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
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
                      className="h-9 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white hover:bg-[#005FBA]"
                  >
                    {savingFilters ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-12 xl:col-span-4">
              <div className="flex h-full flex-col rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                <div className="flex items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-tight text-[#182026]">Schedule</h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#66737F]">Choose when eligible sources are checked.</p>
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
                      disabled={updatingSchedule}
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
                      className={`w-full rounded-md border p-3 text-left transition-colors ${schedule === opt.value ? 'border-[#0B74DE] bg-[#F6FAFE]' : 'border-[#DCE8EE] bg-white hover:bg-[#F7FAFC]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[13px] font-medium tracking-tight ${schedule === opt.value ? 'text-[#182026]' : 'text-[#66737F]'}`}>{opt.label}</span>
                        {schedule === opt.value && <CheckCircle2 className="h-4 w-4 text-[#0B74DE]" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#E7EEF2] pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[12px] font-medium tracking-tight text-[#66737F]">Automatic collection</span>
                      <span className="mt-1 block text-[13px] font-medium tracking-tight text-[#182026]">{autoCollect ? 'Active' : 'Standby'}</span>
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
                      aria-label="Toggle automatic collection"
                      disabled={updatingAutoCollect}
                      className={`relative h-8 w-14 rounded-full border transition-colors ${autoCollect ? 'border-[#0B74DE] bg-[#0B74DE]' : 'border-[#DCE8EE] bg-[#F7FAFC]'}`}
                    >
                      <div className={`absolute bottom-1 top-1 w-6 rounded-full bg-white transition-transform ${autoCollect ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ingestion Trigger */}
            <motion.div variants={itemVariants} className="mt-1">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
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
                    className="flex h-28 w-full items-center justify-between gap-5 rounded-[10px] border border-[#0B74DE] bg-[#0B74DE] px-5 text-left transition-colors hover:bg-[#005FBA]"
                  >
                    {ingestingAll ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <div className="text-left">
                          <span className="block text-[18px] font-semibold tracking-tight text-white">Check all connected sources</span>
                          <span className="mt-1 block text-[13px] leading-5 text-white/85">Run evidence collection for every eligible account.</span>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                  <div>
                    <span className="mb-1 block text-[12px] font-medium tracking-tight text-[#66737F]">Provider-specific action</span>
                    <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Check Gmail only</h3>
                    <p className="mt-2 text-[12px] leading-5 text-[#66737F]">
                      Run the real Gmail ingestion route by itself so zero-result runs and provider-specific errors are isolated clearly.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[12px] font-sans font-bold tracking-tight text-[#66737F]">
                      {gmailProviderState.connected
                        ? gmailEvidenceSource?.ingestable === false
                          ? `Connected, not ingestable: ${humanizeSkippedReason(gmailEvidenceSource.ingestable_reason)}`
                          : 'Connected and ready for Gmail-only ingest'
                        : 'Connect Gmail before running provider-specific ingestion'}
                    </p>
                    <Button
                      onClick={handleIngestGmailOnly}
                      disabled={ingestingGmail || !gmailProviderState.connected}
                      className="h-9 w-full rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]"
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
            className="mt-8 flex flex-col gap-5 border-t border-[#DCE8EE] pt-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4 md:flex md:w-auto md:items-center md:gap-8">
              <div className="flex flex-col">
                <span className="text-[12px] font-sans font-bold text-gray-600 tracking-tight mb-1">Amazon</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">{describeProviderState(getProviderState('amazon'))}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-sans font-bold text-gray-600 tracking-tight mb-1">Repositories</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {evidenceSourcesState.ingestableCount} ingestable / {connectedSecondaryProviders.length} connected
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-sans font-bold text-gray-600 tracking-tight mb-1">Documents</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {evidenceStatus?.documentsCount ?? 0} stored / {evidenceStatus?.processingCount ?? 0} processing
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-sans font-bold text-gray-600 tracking-tight mb-1">Last Ingest</span>
                <span className="text-xs text-gray-400 font-sans font-bold tracking-tight">
                  {formatDateTime(evidenceStatus?.lastIngestion || status?.lastIngest)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button onClick={() => navigate(tenantRoute(activeSlug || 'default', '/evidence-locker'))} className="text-[13px] font-medium tracking-tight text-[#0B74DE] hover:text-[#005FBA] transition-colors">
                Evidence Records
              </button>
              <span className="text-[12px] leading-5 text-[#66737F]">
                Evidence state is confirmed in the workflows where it is used.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}


