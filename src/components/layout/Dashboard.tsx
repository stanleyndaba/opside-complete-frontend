import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { tenantRoute } from '@/lib/routes';
import { useTenant } from '@/contexts/TenantContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, BarChart3, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud,
  ArrowRight, ArrowUp, ArrowDown, Plus, CheckCircle, RefreshCw, RotateCcw,
  Download, Bell, Shield, TrendingDown, TrendingUp, Loader2, X, AlertTriangle,
  ChevronDown, Clock, Terminal, MoreVertical, Files
} from 'lucide-react';
import { api, detectionApi, buildApiUrl } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { SyncLogModal } from '@/components/modals/SyncLogModal';
import { formatDistanceToNow } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DisputeCasesTable } from '@/components/disputes/DisputeCasesTable';
import { EvidenceMatchingTable } from '@/components/evidence/EvidenceMatchingTable';

// Icon imports for document sources

// Helper to render bold text from "**text**" markdown
const renderNotificationMessage = (message: any) => {
  if (!message || typeof message !== 'string') return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-700">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper to strip emojis from text
const stripEmojis = (text: any) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '').trim();
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'discrepancies' | 'disputes' | 'evidence'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || 'default';
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleTabChange = (tab: 'overview' | 'discrepancies' | 'disputes' | 'evidence') => {
    setActiveTab(tab);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleBatchExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    toast({
      title: "EXPORT_INITIATED",
      description: "Preparing batch export of all pending claims...",
    });

    try {
      const tenantArg = activeSlug;
      const response = await fetch(buildApiUrl('/api/export-claims'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
          'x-user-id': localStorage.getItem('user_id') || '',
          'x-tenant-id': localStorage.getItem('active_tenant_id') || '',
        },
        body: JSON.stringify({ tenantSlug: tenantArg }),
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      // Convert the response to a Blob
      const blob = await response.blob();

      // Programmatically trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Get filename from Content-Disposition header if available
      const disposition = response.headers.get('content-disposition');
      let filename = `Margin_Claim_Batch_${new Date().toISOString().split('T')[0]}.csv`;

      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "EXPORT_COMPLETE",
        description: "Batch export downloaded successfully.",
      });
    } catch (err: any) {
      console.error("[Download Error]", err);
      toast({
        title: "EXPORT_FAILED",
        description: err.message || "An error occurred while exporting the claims.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRowExport = async (id: string) => {
    toast({
      title: "DOCUMENT_EXPORT",
      description: `Exporting evidence for claim ID: ${id.substring(0, 8)}...`,
    });

    try {
      const response = await api.getRecoveryDetail(id, activeSlug);
      if (!response.ok || !response.data) {
        throw new Error(response.error || 'Claim not found');
      }
      const claim = response.data as any;

      // Build a single-row CSV
      const evidence = claim.evidence || {};
      const headers = 'Amazon Order ID,FNSKU,Discrepancy Type,Estimated Owed (USD),Date of Event,Status,Confidence Score';
      const row = [
        evidence.order_id || claim.order_id || claim.sync_id || '',
        evidence.fnsku || claim.fnsku || claim.sku || '',
        (claim.anomaly_type || claim.type || '').replace(/_/g, ' ').toUpperCase(),
        typeof (claim.estimated_value ?? claim.guaranteedAmount) === 'number' ? Number(claim.estimated_value ?? claim.guaranteedAmount).toFixed(2) : '',
        (claim.discovery_date || claim.createdDate) ? new Date(claim.discovery_date || claim.createdDate).toISOString().split('T')[0] : '',
        (claim.status || '').toUpperCase(),
        claim.confidence_score ? (claim.confidence_score * 100).toFixed(0) + '%' : ''
      ].join(',');

      const csvContent = headers + '\n' + row;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Margin_Claim_${id.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "EXPORT_COMPLETE",
        description: `Evidence for claim ${id.substring(0, 8)} downloaded.`,
      });
    } catch (err: any) {
      console.error('[Row Export Error]', err);
      toast({
        title: "EXPORT_FAILED",
        description: err.message || 'Failed to export claim evidence.',
        variant: "destructive"
      });
    }
  };

  const openCaseIdModal = (id: string) => {
    setActiveClaimIdForCase(id);
    setCaseIdInput("");
    setCaseIdModalOpen(true);
  };

  const handleCaseIdUpdate = async () => {
    if (!caseIdInput.trim() || !activeClaimIdForCase) return;

    setIsLinkingCase(true);
    try {
      toast({
        title: "MANUAL_LINK_UNAVAILABLE",
        description: "Manual Amazon case linking is hidden until a tenant-safe backend endpoint is available.",
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "LINK_FAILED",
        description: err.message || "Failed to link Amazon Case ID",
        variant: "destructive"
      });
    } finally {
      setIsLinkingCase(false);
    }
  };

  const handleMarkFalsePositive = async (id: string) => {
    try {
      toast({
        title: "FALSE_POSITIVE_ACTION_UNAVAILABLE",
        description: `False positive dismissal for ${id.substring(0, 8)} is hidden until a tenant-safe backend endpoint exists.`,
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "UPDATE_FAILED",
        description: err.message || "Failed to update claim status",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }, []);

  // Live dashboard recoveries metrics (Continuous Sync UX)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const [submittedClaimsCount, setSubmittedClaimsCount] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);
  const [pendingRecoveryAmount, setPendingRecoveryAmount] = useState<number | null>(null);
  const [pendingClaimsCount, setPendingClaimsCount] = useState<number | null>(null);
  const [approvedRecoveryAmount, setApprovedRecoveryAmount] = useState<number | null>(null);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number | null>(null);
  const [nextPaymentDate, setNextPaymentDate] = useState<string | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [reconciledCount, setReconciledCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [approvedClaimsThisMonth, setApprovedClaimsThisMonth] = useState<number | null>(null);
  const [settlementRate, setSettlementRate] = useState<number | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    today: number;
    todayGrowth: number;
    thisWeek: number;
    thisWeekGrowth: number;
    thisMonth: number;
    thisMonthGrowth: number;
  } | null>(null);
  const [isActivityExpanded, setIsActivityExpanded] = useState<boolean>(true);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [providerLoading, setProviderLoading] = useState<'gmail' | 'outlook' | 'gdrive' | 'dropbox' | null>(null);
  // Sync status fields from API response
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [recoverySource, setRecoverySource] = useState<string | null>(null);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncPollingRef = useRef<number | null>(null);
  const syncCheckTimeoutRef = useRef<number | null>(null);
  const upcomingPaymentsLoadedRef = useRef(false);
  const [quickActionsEditOpen, setQuickActionsEditOpen] = useState<boolean>(false);
  const [quickNoticeOpen, setQuickNoticeOpen] = useState<boolean>(false);
  // Evidence stats
  const [evidenceStatus, setEvidenceStatus] = useState<{ documentsCount: number; processingCount: number } | null>(null);
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();
  const { isReady } = useTenant();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<boolean>(false);
  const [activeDiscrepancy, setActiveDiscrepancy] = useState<any>(null);

  const { formatCurrency: formatCurrencyWithSelection } = useCurrency();
  // Phase 3: Detection statistics
  const [detectionStats, setDetectionStats] = useState<{
    totalDetections: number;
    estimatedRecovery: number;
    highConfidence: number;
    averageConfidence: number | null;
  } | null>(null);
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [loadingDetections, setLoadingDetections] = useState<boolean>(false);
  const [detectionTotal, setDetectionTotal] = useState<number>(0);
  const [showProcessed, setShowProcessed] = useState<boolean>(false);

  // Case ID Linking State
  const [caseIdModalOpen, setCaseIdModalOpen] = useState(false);
  const [activeClaimIdForCase, setActiveClaimIdForCase] = useState<string | null>(null);
  const [caseIdInput, setCaseIdInput] = useState("");
  const [isLinkingCase, setIsLinkingCase] = useState(false);

  const displayNotifications = useMemo(() => {
    return notifications;
  }, [notifications]);

  // Helper to intercept and transform notification titles for high-fidelity Amazon lingo
  const enrichNotificationTitle = useCallback((title: any) => {
    if (!title || typeof title !== 'string') return '';
    let cleanTitle = stripEmojis(title);

    // Weaponize "Deposit Confirmed" -> "Reimbursement Approved"
    cleanTitle = cleanTitle.replace(/Deposit Confirmed/gi, 'Reimbursement Approved');
    cleanTitle = cleanTitle.replace(/Funds Deposited/gi, 'Reimbursement Approved');

    // Weaponize "Discrepancies Found" -> "Audit Complete: $[Amount] At Risk"
    const claimMatch = cleanTitle.match(/Detected (\d+) High-Probability Claims?/i);
    const discMatch = cleanTitle.match(/(\d+) Discrepancies Found/i);
    const count = claimMatch ? claimMatch[1] : (discMatch ? discMatch[1] : null);

    if (count) {
      const amountMatch = cleanTitle.match(/\$[\d,]+\.?\d*/);
      const amount = amountMatch ? amountMatch[0] : (pendingRecoveryAmount && pendingRecoveryAmount > 0 ? formatCurrencyWithSelection(pendingRecoveryAmount, recoveredCurrency) : '$0.00');
      return `Audit Complete: ${amount} At Risk`;
    }

    return cleanTitle;
  }, [pendingRecoveryAmount, recoveredCurrency, formatCurrencyWithSelection]);

  // Helper to extract dollar amount from notification title for ledger-style display
  const extractAmountFromTitle = useCallback((title: string): { label: string; amount: string | null } => {
    if (!title || typeof title !== 'string') return { label: '', amount: null };

    // Match patterns like "Deposit Confirmed: $843.53" or "$1,234.56"
    const amountMatch = title.match(/\$[\d,]+\.?\d*/);
    if (amountMatch) {
      // Remove the amount from the label
      const label = title.replace(/:?\s*\$[\d,]+\.?\d*/, '').trim();
      return { label, amount: amountMatch[0] };
    }

    return { label: title, amount: null };
  }, []);

  // Format date for ledger display (Jan 12 format)
  const formatLedgerDate = useCallback((dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }, []);

  const [selectedQuickActions, setSelectedQuickActions] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clario.quickActions') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['ingest_now', 'invite_teammate'];
    } catch { return ['ingest_now', 'invite_teammate']; }
  });

  // Auto-persist quick actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions));
    } catch { }
  }, [selectedQuickActions]);
  const QUICK_ActionS: Array<{ id: string; label: string; subtitle: string }> = [
    { id: 'connect_evidence', label: 'Connect sources', subtitle: 'Sync evidence sources' },
    { id: 'review_high_conf', label: 'High confidence', subtitle: 'Audit verified claims' },
    { id: 'resolve_new', label: 'New opportunities', subtitle: 'Start new recoveries' },
    { id: 'run_detector', label: 'Run detector', subtitle: 'Scan for FBA errors' },
    { id: 'ingest_now', label: 'Ingest docs', subtitle: 'Process backlog' },
    { id: 'smart_sync', label: 'Inventory sync', subtitle: 'Optimize stock' },
    { id: 'upcoming_payments', label: 'Payments', subtitle: 'Track payouts' },
    { id: 'export_history', label: 'Export', subtitle: 'Audit reports' },
    { id: 'evidence_locker', label: 'Doc Locker', subtitle: 'Manage files' },
    { id: 'invite_teammate', label: 'Invite teammate', subtitle: 'Add team members' },
    { id: 'configure_alerts', label: 'Alerts', subtitle: 'System webhooks' },
    { id: 'security_setup', label: 'Security', subtitle: 'Lock access' },
  ];

  // Handle OAuth redirect from backend (e.g., /dashboard?amazon_connected=true)
  useEffect(() => {
    const amazonConnected = searchParams.get('amazon_connected');
    if (amazonConnected === 'true') {
      toast({
        title: 'Amazon Connected Successfully',
        description: 'Your Amazon account has been connected. We\'re analyzing your FBA data for recovery opportunities...',
      });
      // Redirect to integrations hub after a short delay to show the success message
      setTimeout(() => {
        navigate(tenantRoute(activeSlug, '/integrations-hub?amazon_connected=true'), { replace: true });
      }, 2000);
    }
  }, [searchParams, navigate, toast, activeSlug]);

  // Reset metrics when activeSlug changes to prevent "old data flash"
  useEffect(() => {
    setRecoveredTotal(null);
    setSubmittedClaimsCount(null);
    setPendingRecoveryAmount(null);
    setPendingClaimsCount(null);
    setApprovedRecoveryAmount(null);
    setNextPaymentAmount(null);
    setNextPaymentDate(null);
    setSuccessRate(null);
    setReconciledCount(null);
    setApprovedClaimsThisMonth(null);
    setSettlementRate(null);
    setDashboardMetrics(null);
    setDetectionStats(null);
    setEvidenceStatus(null);
    setDetectionResults([]);
  }, [activeSlug]);

  // Fetch evidence status and detection statistics
  useEffect(() => {
    if (!isReady) return;
    (async () => {
      const [statusRes, detectionStatsRes] = await Promise.all([
        api.getEvidenceStatus(activeSlug).catch(() => ({ ok: false, data: null })),
        detectionApi.getDetectionStatistics(undefined, activeSlug).catch(() => ({ ok: false, data: null })),
      ]);
      if (mountedRef.current) {
        if (statusRes.ok && statusRes.data) {
          setEvidenceStatus(statusRes.data);
        }
        if (detectionStatsRes.ok && detectionStatsRes.data?.statistics) {
          const stats = detectionStatsRes.data.statistics as any;
          const explicitAverage =
            typeof stats.average_confidence === 'number' ? stats.average_confidence * 100 :
              typeof stats.averageConfidence === 'number' ? stats.averageConfidence :
                null;
          setDetectionStats({
            totalDetections: stats.total_anomalies ?? stats.totalDetections ?? 0,
            estimatedRecovery: stats.total_value ?? stats.estimatedRecovery ?? 0,
            highConfidence: stats.by_confidence?.high ?? stats.highConfidence ?? 0,
            averageConfidence: explicitAverage
          });
        }
      }
    })();
  }, [isReady, activeSlug]);

  // Fetch detection results for anomaly ledger counter
  useEffect(() => {
    if (!isReady || detectionResults.length !== 0) return;
    const fetchDetections = async () => {
      setLoadingDetections(true);
      try {
        const res = await detectionApi.getDetectionResults({ limit: 50 }, activeSlug);
        if (res.ok && res.data?.results) {
          setDetectionResults(res.data.results);
          setDetectionTotal(res.data.total);
        }
      } catch (error) {
        console.error('Failed to fetch detections:', error);
        toast({
          title: 'FETCH_PROTOCOL_ERROR',
          description: 'Failed to retrieve forensic discrepancy data.',
          variant: 'destructive'
        });
      } finally {
        setLoadingDetections(false);
      }
    };
    fetchDetections();
  }, [detectionResults.length, toast, isReady]);

  const updateUpcomingMetrics = useCallback((payments: any[]) => {
    upcomingPaymentsLoadedRef.current = true;

    const normalizeNumber = (value: any): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const sanitized = value.replace(/[$,]/g, '').trim();
        if (!sanitized) return undefined;
        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const normalizedPayments = Array.isArray(payments)
      ? payments.map((payment) => {
        const amount =
          normalizeNumber(payment?.guaranteedAmount) ??
          normalizeNumber(payment?.amount) ??
          normalizeNumber(payment?.claim_amount) ??
          normalizeNumber(payment?.claimAmount) ??
          normalizeNumber(payment?.expectedAmount) ??
          (typeof payment?.amount_cents === 'number' ? payment.amount_cents / 100 : undefined) ??
          0;

        const date =
          payment?.expectedPayoutDate ||
          payment?.expected_payout_date ||
          payment?.payoutDate ||
          payment?.payout_date ||
          payment?.expectedDate ||
          payment?.expected_date ||
          payment?.estimatedPayoutDate ||
          payment?.estimated_payout_date ||
          null;

        return {
          amount: Number.isFinite(amount) ? amount : 0,
          date: date ? String(date) : null
        };
      })
      : [];

    if (normalizedPayments.length === 0) {
      setPendingRecoveryAmount(0);
      setPendingClaimsCount(0);
      setNextPaymentAmount(0);
      setNextPaymentDate(null);
      return;
    }

    setPendingClaimsCount(normalizedPayments.length);
    const totalPending = normalizedPayments.reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);
    setPendingRecoveryAmount(totalPending);

    const datedPayments = normalizedPayments.filter(entry => entry.date);
    if (datedPayments.length > 0) {
      const sortedByDate = [...datedPayments].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      const nextDate = sortedByDate[0]?.date as string;
      const amountForNextDate = normalizedPayments
        .filter(entry => entry.date === nextDate)
        .reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);

      setNextPaymentAmount(amountForNextDate);
      setNextPaymentDate(nextDate);
    } else {
      setNextPaymentAmount(totalPending);
      setNextPaymentDate(null);
    }
  }, []); // Removed activeSlug, toast from dependencies as they are not used in this callback

  const fetchRecoveriesOnce = useCallback(async () => {
    try {
      const res = await api.getAmazonRecoveries(activeSlug);
      if (!mountedRef.current) return;
      if (res.ok && res.data) {
        const data = res.data as any;
        setRecoveredTotal(data.total_recovered ?? data.totalAmount ?? 0);
        if (data.currency) setRecoveredCurrency(data.currency);
        if (typeof data.submitted_claims_count === 'number') setSubmittedClaimsCount(data.submitted_claims_count);
        if (typeof data.reconciled_count === 'number') setReconciledCount(data.reconciled_count);

        setPendingRecoveryAmount(data.pending_recovery_amount ?? 0);
        setPendingClaimsCount(data.pending_claims_count ?? 0);
        setApprovedRecoveryAmount(data.approved_recovery_amount ?? 0);
        setNextPaymentAmount(data.next_payment_amount ?? 0);
        setNextPaymentDate(data.next_payment_date ?? null);
        setSuccessRate(data.success_rate ?? null);
        setApprovedClaimsThisMonth(data.approved_claims_this_month ?? null);
        if (typeof data.settlement_rate === 'number') setSettlementRate(data.settlement_rate);
        setLastUpdated(new Date().toISOString());

        if (data.syncTriggered || data.needsSync) {
          checkAndMonitorSync();
        }
      }
    } catch (err) {
      console.error('Failed to fetch recoveries:', err);
    }
  }, [activeSlug]);

  // Fetch recoveries
  useEffect(() => {
    if (!isReady) return;
    let pollTimer: number | null = null;

    fetchRecoveriesOnce();
    pollTimer = window.setInterval(fetchRecoveriesOnce, 30000);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isReady, fetchRecoveriesOnce]);

  // Function to check sync status and monitor completion
  async function checkAndMonitorSync() {
    if (!mountedRef.current) return;

    try {
      // Check if there's an active sync using the documented API
      const { getActiveSyncStatus } = await import('@/lib/inventoryApi');
      const syncStatus = await getActiveSyncStatus(activeSlug);

      // If there's an active sync, get the syncId
      if (syncStatus.hasActiveSync && syncStatus.lastSync?.syncId) {
        const syncId = syncStatus.lastSync.syncId;
        setActiveSyncId(syncId);

        // Update sync message from lastSync data
        if (syncStatus.lastSync.message) {
          setSyncMessage(syncStatus.lastSync.message);
        }

        // Start polling for sync completion
        startSyncPolling(syncId);
      } else if (syncStatus.lastSync) {
        // Handle completed/failed syncs
        const lastSyncStatus = syncStatus.lastSync.status;

        // Check for completed status (including legacy 'complete' value)
        if (lastSyncStatus === 'completed' || lastSyncStatus === 'complete') {
          // Sync completed, refresh data
          await fetchRecoveriesOnce();
          await fetchMetrics();
          await fetchDisputeMetrics();
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage(null);
          setLastSyncTime(new Date());

          // Toast removed per user request

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (lastSyncStatus === 'failed') {
          // Sync failed
          setSyncTriggered(false);
          setNeedsSync(true); // Still needs sync
          setSyncMessage(syncStatus.lastSync.message || 'Sync failed. Please try again.');

          // Show error toast with more details
          toast({
            title: 'Sync Failed',
            description: syncStatus.lastSync.message || 'The sync encountered an error. Please try again.',
            variant: 'destructive',
            duration: 6000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (lastSyncStatus === 'cancelled') {
          // Sync cancelled
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage('Sync was cancelled.');

          toast({
            title: 'Sync Cancelled',
            description: 'The sync was cancelled.',
            duration: 4000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  }

  // Function to poll for sync completion
  function startSyncPolling(syncId: string) {
    // Clear any existing polling
    if (syncPollingRef.current) {
      clearInterval(syncPollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 120; // Poll for up to 10 minutes (120 * 5 seconds)

    syncPollingRef.current = window.setInterval(async () => {
      if (!mountedRef.current) {
        if (syncPollingRef.current) {
          clearInterval(syncPollingRef.current);
          syncPollingRef.current = null;
        }
        return;
      }

      pollCount++;

      try {
        // Import getSyncStatus from inventoryApi
        const { getSyncStatus } = await import('@/lib/inventoryApi');
        const status = await getSyncStatus(syncId, activeSlug);

        // Check for completed status (including legacy 'complete' value)
        if (status.status === 'completed' || status.status === 'complete') {
          // Sync completed, refresh data
          await fetchRecoveriesOnce();
          await fetchMetrics();
          await fetchDisputeMetrics();
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage('Sync completed successfully!');

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (status.status === 'failed') {
          // Sync failed
          setSyncTriggered(false);
          setNeedsSync(true);
          setSyncMessage('Sync failed. Please try again.');
          await fetchDisputeMetrics();

          toast({
            title: 'Sync Failed',
            description: status.error || status.message || 'The sync encountered an error. Please try again.',
            variant: 'destructive',
            duration: 6000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        }
        // If still in progress, continue polling
      } catch (error) {
        console.error('Error polling sync status:', error);

        // Stop polling after max attempts or if there's an error
        if (pollCount >= maxPolls) {
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
          setSyncMessage('Sync is taking longer than expected. Please check back later.');
        }
      }
    }, 5000); // Poll every 5 seconds

    // Set timeout to stop polling after 10 minutes
    syncCheckTimeoutRef.current = window.setTimeout(() => {
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      setSyncMessage('Sync is taking longer than expected. Please check the sync page for details.');
    }, 600000); // 10 minutes
  }

  async function fetchMetrics() {
    if (!isReady) return;
    const res = await api.getRecoveriesMetrics(activeSlug);
    if (!mountedRef.current) return;
    if (res.ok && res.data) {
      const d: any = res.data;
      // Prefer backend fields if present; otherwise fallback to existing placeholders
      const pending = typeof d.valueInProgress === 'number' ? d.valueInProgress : (typeof d.pendingAmount === 'number' ? d.pendingAmount : null);
      const rate = typeof d.successRate === 'number' ? d.successRate : (typeof d.successRate30d === 'number' ? d.successRate30d : null);
      const approved = (
        typeof d.approvedValue === 'number' ? d.approvedValue :
          typeof d.valueApproved === 'number' ? d.valueApproved :
            typeof d.paidValue === 'number' ? d.paidValue :
              typeof d.valuePaid === 'number' ? d.valuePaid :
                typeof d.approvedAmount === 'number' ? d.approvedAmount :
                  typeof d.amountApproved === 'number' ? d.amountApproved :
                    null
      );
      const nextPay = (
        typeof d.nextPaymentAmount === 'number' ? d.nextPaymentAmount :
          typeof d.nextPayoutAmount === 'number' ? d.nextPayoutAmount :
            typeof d.nextPayout === 'number' ? d.nextPayout :
              typeof d.expectedPayoutAmount === 'number' ? d.expectedPayoutAmount :
                typeof d.payoutDue === 'number' ? d.payoutDue :
                  null
      );
      const approvedClaimsMonth = (
        typeof d.approvedClaimsThisMonth === 'number' ? d.approvedClaimsThisMonth :
          typeof d.claimsApprovedThisMonth === 'number' ? d.claimsApprovedThisMonth :
            typeof d.approvedCountThisMonth === 'number' ? d.approvedCountThisMonth :
              typeof d.claimsApproved === 'number' ? d.claimsApproved :
                null
      );
      // Note: pendingRecoveryAmount is now sourced from fetchDisputeMetrics (dispute_cases) to avoid race conditions
      // if (pending !== null && !upcomingPaymentsLoadedRef.current) setPendingRecoveryAmount(pending);
      if (rate !== null) setSuccessRate(rate);
      if (approved !== null) setApprovedRecoveryAmount(approved);
      // Note: nextPaymentAmount is now sourced from fetchDisputeMetrics (dispute_cases) to avoid race conditions
      // if (nextPay !== null && !upcomingPaymentsLoadedRef.current) {
      //   setNextPaymentAmount(nextPay);
      //   setNextPaymentDate(null);
      // }
      if (approvedClaimsMonth !== null) setApprovedClaimsThisMonth(approvedClaimsMonth);
      if (d.dashboard) setDashboardMetrics(d.dashboard);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }

  // Fetch real dispute case data for Next Payment and Pending tiles
  async function fetchDisputeMetrics() {
    if (!isReady) return;
    try {
      const res = await api.getDisputeCases({ limit: 500 }, activeSlug);
      if (!mountedRef.current) return;

      if (res.ok && res.data?.cases) {
        const cases = res.data.cases;

        // Next Payment = Approved disputes (awaiting payout)
        const approvedCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'approved' || status === 'resolved' || status === 'won';
        });
        const approvedTotal = approvedCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Paid/Complete = Already settled disputes
        const paidCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'paid' || status === 'complete' || status === 'completed';
        });
        const paidTotal = paidCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Pending = Submitted disputes (waiting for Amazon approval)
        const pendingCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'submitted' || status === 'pending' || status === 'under review' || status === 'in review';
        });
        const pendingTotal = pendingCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Find next expected payout date from approved cases
        const datedApproved = approvedCases.filter((c: any) => c.expected_payout_date || c.expectedPayoutDate);
        let nextDate: string | null = null;
        if (datedApproved.length > 0) {
          const sorted = [...datedApproved].sort((a: any, b: any) => {
            const dateA = new Date(a.expected_payout_date || a.expectedPayoutDate);
            const dateB = new Date(b.expected_payout_date || b.expectedPayoutDate);
            return dateA.getTime() - dateB.getTime();
          });
          nextDate = sorted[0]?.expected_payout_date || sorted[0]?.expectedPayoutDate || null;
        }

        // Update state with real values
        // If there are approved cases awaiting payout, show that as estimated payout
        // Otherwise, if all cases are already paid, show the paid total as "estimated payout" (next settlement cycle)
        const estimatedPayout = approvedTotal > 0 ? approvedTotal : paidTotal;
        setNextPaymentAmount(estimatedPayout);
        setNextPaymentDate(nextDate);
        setPendingRecoveryAmount(pendingTotal);
        setPendingClaimsCount(pendingCases.length);

        // Calculate settlement rate: (approved + paid) / (approved + paid + pending + rejected)
        const rejectedCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'rejected' || status === 'denied' || status === 'lost';
        });
        const successfulCount = approvedCases.length + paidCases.length;
        const totalDecided = successfulCount + rejectedCases.length;
        const rate = totalDecided > 0 ? (successfulCount / totalDecided) * 100 : (cases.length > 0 ? 100 : 0);
        setSettlementRate(rate);

        console.log('[Dashboard] Dispute metrics:', {
          approved: { count: approvedCases.length, total: approvedTotal },
          paid: { count: paidCases.length, total: paidTotal },
          pending: { count: pendingCases.length, total: pendingTotal },
          rejected: { count: rejectedCases.length },
          settlementRate: rate.toFixed(1)
        });
      } else {
        console.warn('[Dashboard] No dispute cases returned');
        setSettlementRate(0);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch dispute metrics:', error);
    }
  }

  // Effect to manage polling and SSE logic
  useEffect(() => {
    if (!isReady) return;
    let pollTimer: number | null = null;
    let es: EventSource | null = null;

    // Initial fetch immediately on mount
    const initFetch = async () => {
      await fetchRecoveriesOnce();
      await fetchMetrics();
      await fetchDisputeMetrics();
    };

    initFetch();
    hasFetchedRef.current = true;

    // Short burst polling to show numbers populate quickly
    pollTimer = window.setInterval(async () => {
      await fetchRecoveriesOnce();
      await fetchMetrics();
      await fetchDisputeMetrics();
      // The original code had a `polls` counter and `if (polls >= 12)` condition.
      // This logic was removed to simplify, assuming the interval will run indefinitely
      // until the component unmounts or `isReady` becomes false.
      // If the original `polls` logic is critical, it should be re-added.
    }, 5000) as unknown as number;

    // Listen for backend sync/detection events
    try {
      es = new EventSource(`/api/sse/status?tenantSlug=${activeSlug}`);
      es.onmessage = async (e) => {
        if (!mountedRef.current) return;
        try {
          const evt = JSON.parse(e.data);
          if (evt?.type === 'sync' || evt?.type === 'detection') {
            await fetchRecoveriesOnce();
            await fetchMetrics();
            await fetchDisputeMetrics();
          }
        } catch { }
      };
    } catch { }

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      if (es) es.close();
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      if (syncCheckTimeoutRef.current) {
        clearTimeout(syncCheckTimeoutRef.current);
        syncCheckTimeoutRef.current = null;
      }
    };
  }, [toast, navigate, activeSlug, isReady]);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const computedApproved = approvedRecoveryAmount != null
    ? approvedRecoveryAmount
    : Math.max((recoveredTotal ?? 0) - (pendingRecoveryAmount ?? 0), 0);
  const effectivePendingClaims = pendingClaimsCount ?? submittedClaimsCount ?? 0;
  const hasPendingClaimsData = pendingClaimsCount != null || submittedClaimsCount != null;
  const detectedOpportunitiesCount = detectionStats?.totalDetections ?? detectionTotal ?? detectionResults.length;
  const filedClaimsCount = submittedClaimsCount ?? effectivePendingClaims ?? detectionResults.filter((r: any) => r.status === 'filed' || r.status === 'resolved' || r.status === 'converted').length;
  const approvedClaimsCount = approvedClaimsThisMonth ?? 0;
  const upcomingPayoutCopy = (() => {
    if (nextPaymentDate) {
      const payoutDate = new Date(nextPaymentDate);
      if (!Number.isNaN(payoutDate.getTime())) {
        const diffDays = Math.max(1, Math.ceil((payoutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const rangeStart = Math.max(1, diffDays - 1);
        const rangeEnd = Math.max(rangeStart, diffDays + 1);
        return `Expected in ${rangeStart}-${rangeEnd} days`;
      }
    }
    if ((nextPaymentAmount ?? 0) > 0) return 'Expected in 3-5 days';
    return 'Processing reimbursements...';
  })();

  return (
    <div
      className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
      {/* Background Matrix Pattern / Noise */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

      <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
          <div className="relative pt-8">
            <div className="relative w-full max-w-full mx-auto px-8 pb-8 text-slate-900">
              {/* Command Center Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTabChange('overview')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 uppercase tracking-tight",
                          activeTab === 'overview'
                            ? "text-white bg-white/[0.08]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => handleTabChange('discrepancies')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 uppercase tracking-tight flex items-center gap-2",
                          activeTab === 'discrepancies'
                            ? "text-white bg-white/[0.08]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        Audits
                        {(() => {
                          const count = detectionResults.filter(r => showProcessed ? true : r.status !== 'resolved' && r.status !== 'filed').length;
                          return (
                            <span className="flex items-center justify-center min-w-[16px] h-4 px-1.5 bg-[#1a1a1a] text-white text-[9px] font-bold rounded-full border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                              {count}
                            </span>
                          );
                        })()}
                      </button>
                      <button
                        onClick={() => handleTabChange('disputes')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 uppercase tracking-tight flex items-center gap-2",
                          activeTab === 'disputes'
                            ? "text-white bg-white/[0.08]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        Dispute Claims
                        {effectivePendingClaims > 0 && (
                          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-[#1a1a1a] text-emerald-500 text-[9px] font-bold rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            {effectivePendingClaims > 99 ? '99+' : effectivePendingClaims}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleTabChange('evidence')}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 uppercase tracking-tight flex items-center gap-2",
                          activeTab === 'evidence'
                            ? "text-white bg-white/[0.08]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        Cases with Evidence
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setQuickNoticeOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold uppercase tracking-tight rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                >
                  Quick Notice
                </button>
              </div>

              {activeTab === 'overview' ? (
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070707] text-white">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                  {/* Main Content - 3 columns */}
                  <div className="lg:col-span-4 space-y-6">

                    {/* Institutional Instrument Panel */}
                    <div className="bg-[#111111]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">

                      <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h2 className="text-[11px] font-sans font-bold text-white/40 uppercase tracking-tight">REIMBURSEMENT OVERVIEW</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-sans font-bold text-white tracking-tight">Recovered Margins</span>
                            </div>
                          </div>
                        </div>
                        {submittedClaimsCount != null && submittedClaimsCount > 0 && (
                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="flex items-center gap-3 transition-all group"
                          >
                            <span className="text-[10px] font-sans font-bold text-white/40 group-hover:text-white/75 uppercase tracking-tight">{submittedClaimsCount} Active Claims</span>
                            <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/65" />
                          </button>
                        )}
                      </div>

                      <div className="p-10">
                        <div className="flex flex-col">
                          {recoveredTotal === null ? (
                            <div className="space-y-4 py-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded-full bg-white/10" />
                                <Skeleton className="h-4 w-32 bg-white/10" />
                              </div>
                              <Skeleton className="h-14 w-48 bg-white/10" />
                              <Skeleton className="h-4 w-64 bg-white/10" />
                            </div>
                          ) : recoveredTotal > 0 ? (
                            <>
                              <div className="text-5xl font-sans font-bold text-white tracking-tight mb-4 flex items-baseline gap-2">
                                {formatCurrencyWithSelection(recoveredTotal, recoveredCurrency)}
                                <span className="text-sm font-sans font-bold text-white/40 animate-pulse">_</span>
                              </div>
                              {reconciledCount != null && reconciledCount > 0 && (
                                <div className="flex items-center gap-3 w-fit">
                                  <div className="h-1 w-1 rounded-full bg-white/55 shadow-[0_0_8px_rgba(255,255,255,0.18)]" />
                                  <span className="text-[10px] font-sans font-bold text-white/65 uppercase tracking-tight">
                                    {reconciledCount} Verified Records
                                  </span>
                                </div>
                              )}
                            </>
                          ) : recoveredTotal !== null ? (
                            <div className="flex flex-col gap-6 py-2">
                              <div className="text-5xl font-sans font-bold text-white/20 tracking-tight">
                                $0.00
                              </div>
                              <p className="text-xs text-white/30 font-sans font-bold leading-relaxed max-w-sm">
                                No recoveries found yet. Upload your Amazon CSV data to start the detection pipeline.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-6 py-2">
                              <div className="flex items-center gap-3 text-white/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-[11px] font-sans font-bold uppercase tracking-tight">Scanning Account</span>
                              </div>
                              <div className="text-5xl font-sans font-bold text-white/5 tracking-tight select-none">
                                $0,000.00
                              </div>
                              <p className="text-xs text-white/30 font-sans font-bold leading-relaxed max-w-sm">
                                Loading your account data...
                              </p>
                            </div>
                          )}


                        </div>
                      </div>

                      {/* Secondary Metrics Grid - Unified */}
                      <div className="grid grid-cols-3 bg-[#0a0a0a]/50 divide-x divide-white/5 border-t border-white/5">
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-sans font-bold text-white/20 mb-4 tracking-tight uppercase">Estimated Payout</div>
                              <div className="text-2xl font-sans font-bold text-white tracking-tight">
                                {nextPaymentAmount === null && !upcomingPaymentsLoadedRef.current ? (
                                  <Skeleton className="h-8 w-32 bg-white/10" />
                                ) : (
                                  formatCurrencyWithSelection((nextPaymentAmount ?? 0), recoveredCurrency)
                                )}
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                <Clock className="h-3 w-3 text-white/25" />
                                <span className="text-[10px] font-sans font-bold text-white/35 tracking-tight">
                                  {upcomingPayoutCopy}
                                </span>
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-white/50 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="start">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                <h4 className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">Payout Details</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-sans font-bold">
                                Capital currently verified and queued for the primary settlement ledger. Disbursement typically occurs within the standard 14-day protocol.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-sans font-bold text-white/20 mb-4 tracking-tight uppercase">Pending Recovery</div>
                              <div className="text-2xl font-sans font-bold text-white tracking-tight">
                                {pendingRecoveryAmount === null && !upcomingPaymentsLoadedRef.current ? (
                                  <Skeleton className="h-8 w-32 bg-white/10" />
                                ) : (
                                  formatCurrencyWithSelection((pendingRecoveryAmount ?? 0), recoveredCurrency)
                                )}
                              </div>
                              <div className="mt-4 space-y-1.5">
                                <div className="text-[10px] font-sans font-bold text-white/35 tracking-tight">
                                  {(pendingRecoveryAmount ?? 0) > 0 ? 'Currently Being Recovered' : 'In Progress'}
                                </div>
                                <div className="text-[10px] font-sans font-bold text-white/25 tracking-tight">
                                  {effectivePendingClaims > 0 ? `Across ${effectivePendingClaims} Active Claims` : 'Monitoring active claims...'}
                                </div>
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-white/50 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="center">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                <h4 className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">Activity Log</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-sans font-bold">
                                High-probability discrepancies currently undergoing active forensic verification across the global marketplace nodes.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-sans font-bold text-white/20 mb-4 tracking-tight uppercase">Brief</div>
                              <div className="space-y-2.5">
                                <div className="text-[10px] font-sans font-bold text-white/40 tracking-tight">
                                  Opportunities Found (Detected): <span className="text-white">{detectedOpportunitiesCount}</span>
                                </div>
                                <div className="text-[10px] font-sans font-bold text-white/40 tracking-tight">
                                  Filed: <span className="text-white">{filedClaimsCount}</span>
                                </div>
                                <div className="text-[10px] font-sans font-bold text-white/40 tracking-tight">
                                  Approved: <span className="text-white">{approvedClaimsCount}</span>
                                </div>
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-white/50 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="end">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                <h4 className="text-[11px] font-sans font-bold text-white uppercase tracking-tight">Success Metrics</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-sans font-bold">
                                The ratio of successfully closed settlement cycles relative to initiated recovery protocols.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>

                      {/* Emotional Anchor Line */}
                      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <p className="text-[9px] text-white/20 font-sans font-bold uppercase tracking-tight">
                          Store Monitoring Active
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </div>
                    </div>

                    {/* Quick Actions - Execution Terminal */}
                    <div className="bg-[#111111]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <Terminal className="h-3 w-3 text-white/45" />
                          <h2 className="text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">Quick Actions</h2>
                        </div>
                        <button
                          aria-label="Customize quick actions"
                          className="text-white/10 hover:text-white/70 transition-colors"
                          onClick={() => setQuickActionsEditOpen(true)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="divide-y divide-white/5">
                        <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-white/5">
                          {selectedQuickActions.slice(0, 6).map((actionId) => {
                            const action = QUICK_ActionS.find(a => a.id === actionId);
                            if (!action) return null;

                            let IconComp = FileText;
                            if (actionId === 'ingest_now') IconComp = Cloud;
                            if (actionId === 'run_detector') IconComp = RefreshCw;
                            if (actionId === 'connect_evidence') IconComp = Mail;
                            if (actionId === 'invite_teammate') IconComp = Link2;

                            return (
                              <button
                                key={actionId}
                                onClick={() => {
                                  if (actionId === 'connect_evidence') navigate(tenantRoute(activeSlug, '/integrations-hub'));
                                  else if (actionId === 'invite_teammate') setInviteOpen(true);
                                  else if (actionId === 'ingest_now') api.startEvidenceIngest().then(() => toast({ title: 'Processing Data...' }));
                                  else navigate(tenantRoute(activeSlug, `/${actionId.replace(/_/g, '-')}`));
                                }}
                                className="group flex flex-col p-8 hover:bg-white/[0.02] transition-all text-left border-b border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-4 text-white/10 group-hover:text-white/70 transition-colors">
                                  <IconComp className="h-4 w-4" />
                                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <span className="text-[11px] text-white font-sans font-bold mb-1 tracking-tight uppercase group-hover:text-white transition-colors">{action.label.replace('_', ' ')}</span>
                                <span className="text-[9px] text-white/20 font-sans font-bold uppercase tracking-tight">{action.subtitle.replace('_', ' ')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Activity - Audit Registry Sidebar */}
                  <div className="hidden lg:col-span-1">
                    <div className="bg-[#111111]/90 border border-white/10 rounded-2xl h-full flex flex-col shadow-3xl backdrop-blur-3xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                      <div className="px-5 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between w-full transition-all group">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[12px] font-medium text-white tracking-wide">Margin Updates</h3>
                        </div>
                      </div>

                      {true && (
                        <>
                          <div className="flex-1 max-h-[800px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                            {displayNotifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="relative flex h-3 w-3 mb-6">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/25 opacity-20"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white/35"></span>
                                </div>
                                <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">No recent activity</p>
                                <p className="text-[10px] text-white/10 mt-2 font-serif">Operational baseline maintained.</p>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                {displayNotifications.slice(0, 15).map((notification) => {
                                  const isUnread = notification.status !== 'read';
                                  const notificationDate = new Date(notification.created_at);
                                  const isValidDate = notificationDate instanceof Date && !isNaN(notificationDate.getTime());
                                  const timeAgo = isValidDate
                                    ? formatDistanceToNow(notificationDate, { addSuffix: true })
                                    : 'just_now';

                                  let statusText = '';
                                  if (notification.type === 'funds_deposited') statusText = 'SETTLED';
                                  else if (notification.type === 'case_filed') statusText = 'ACTIVE';
                                  else if (notification.type === 'claim_detected') statusText = 'IDENTIFIED';
                                  else statusText = 'LOG';

                                  return (
                                    <HoverCard key={notification.id} openDelay={100} closeDelay={100}>
                                      <HoverCardTrigger asChild>
                                        <div
                                          className={cn(
                                            "group relative px-5 py-4 cursor-pointer transition-all duration-300 border-l-2 border-transparent hover:bg-white/[0.03]",
                                            isUnread ? "bg-white/[0.02]" : "bg-transparent"
                                          )}
                                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}>

                                          {/* Hover Glow Bar */}
                                          <div className="absolute left-[-2px] top-3 bottom-3 w-[2px] bg-white/60 shadow-[0_0_15px_rgba(255,255,255,0.2)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                          <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-4">
                                              <p className={cn(
                                                "text-[11px] tracking-tight truncate font-semibold",
                                                isUnread ? "text-white" : "text-white/40 group-hover:text-white transition-colors"
                                              )}>
                                                {(() => {
                                                  const enriched = enrichNotificationTitle(notification.title);
                                                  const { label } = extractAmountFromTitle(enriched);
                                                  const toTitleCase = (str: string) => str.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                                                  return toTitleCase(label) || toTitleCase(enriched);
                                                })()}
                                              </p>

                                              {(() => {
                                                const { amount } = extractAmountFromTitle(enrichNotificationTitle(notification.title));
                                                if (amount) {
                                                  return (
                                                    <span className={cn(
                                                      "text-[12px] font-mono font-bold tabular-nums shrink-0",
                                                      notification.type === 'funds_deposited' || notification.type === 'refund_approved'
                                                        ? "text-white"
                                                        : "text-white"
                                                    )}>
                                                      +{amount}
                                                    </span>
                                                  );
                                                }
                                                return null;
                                              })()}
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className={cn(
                                                  "text-[9px] font-mono font-bold",
                                                  isUnread ? "text-white/45" : "text-white/10"
                                                )}>
                                                  {statusText}
                                                </span>
                                                <span className="text-white/5 h-2 w-[1px] bg-white/10" />
                                                <span className="text-[9px] text-white/10 font-mono uppercase">
                                                  {(() => {
                                                    const idStr = notification.id.substring(0, 4).toUpperCase();
                                                    if (notification.type === 'funds_deposited' || notification.type === 'reimbursement_payout') {
                                                      return `CASE 149${Array.from(notification.id.substring(0, 7)).map(c => c.charCodeAt(0) % 10).join('')}`;
                                                    }
                                                    if (notification.type === 'claim_detected' || notification.type === 'anomaly_detected') {
                                                      return `FBA17B${idStr}Q`;
                                                    }
                                                    return `ACT_${idStr}`;
                                                  })()}
                                                </span>
                                              </div>
                                              <span className="text-[9px] text-white/20 font-mono tabular-nums">
                                                {formatLedgerDate(notification.created_at)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </HoverCardTrigger>

                                      <HoverCardContent side="left" align="start" className="w-80 p-0 overflow-hidden border-gray-100 rounded-none shadow-2xl animate-in fade-in slide-in-from-right-1">
                                        {/* ... Tooltip content remains same ... */}
                                        <div className="p-5">
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className={cn(
                                              "px-2 py-0.5 text-xs font-bold border",
                                              notification.type === 'funds_deposited' || notification.type === 'refund_approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                notification.type === 'amazon_challenge' || notification.type === 'user_action_required' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                  "bg-blue-50 text-blue-700 border-blue-100"
                                            )}>
                                              {notification.type.replace(/_/g, ' ')}
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                              <Clock className="h-3 w-3" />
                                              {timeAgo}
                                            </span>
                                          </div>

                                          <h4 className="text-[13px] font-semibold text-gray-900 leading-snug mb-3">
                                            {notification.title}
                                          </h4>

                                          <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 border border-gray-100 font-mono">
                                            {renderNotificationMessage(notification.message)}
                                          </div>

                                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className="text-xs text-gray-400 font-mono">
                                              LOG.{notification.id.substring(0, 8).toUpperCase()}
                                            </span>
                                            <button
                                              onClick={() => {
                                                if (notification.type === 'claim_detected') {
                                                  setActiveDiscrepancy(notification);
                                                  setShowDiscrepancyModal(true);
                                                } else {
                                                  navigate(tenantRoute(activeSlug, '/recoveries'));
                                                }
                                              }}
                                              className="text-xs font-bold text-gray-900 flex items-center gap-1.5 hover:underline">
                                              {notification.type === 'claim_detected' ? 'Open' : 'Open Record'} <ArrowRight className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </HoverCardContent>
                                    </HoverCard>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/5 p-4 bg-white/[0.02]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(tenantRoute(activeSlug, '/notifications'))}
                              className="w-full h-8 text-[10px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                            >
                              All Activity Logs
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              ) : activeTab === 'discrepancies' ? (
                <div className="space-y-6">
                  {/* Detected Discrepancies View */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div>
                          <h2 className="text-[11px] font-sans font-bold text-white/40 tracking-tight uppercase">Anomaly Ledger</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-sans font-bold text-white tracking-tight uppercase">Discrepancies</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-12">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">DISCREPANCIES</span>
                            <span className="text-lg font-sans font-bold text-white leading-none mt-1">
                              {detectionResults.filter(r => showProcessed ? true : r.status !== 'resolved' && r.status !== 'filed').length}
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="flex flex-col transition-colors group text-left"
                          >
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight group-hover:text-emerald-500/50">CLAIMS</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-sans font-bold text-white leading-none group-hover:text-emerald-500">
                                {submittedClaimsCount || effectivePendingClaims || detectionResults.filter(r => r.status === 'filed' || r.status === 'resolved' || r.status === 'converted').length}
                              </span>
                              <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-emerald-500" />
                            </div>
                          </button>

                          <div className="flex flex-col">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">RECOVERED</span>
                            <span className="text-lg font-sans font-bold text-white leading-none mt-1">
                              {formatCurrencyWithSelection(
                                recoveredTotal || detectionResults
                                  .filter(r => r.status === 'resolved' || r.status === 'converted')
                                  .reduce((sum, r) => sum + (r.estimated_value || 0), 0),
                                recoveredCurrency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingDetections ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                        <span className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight animate-pulse">Syncing Database...</span>
                      </div>
                    ) : detectionResults.filter(r => showProcessed ? true : r.status !== 'resolved').length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                          {/* Pulsing Radar Effect */}
                          <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping scale-150 opacity-20" />
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-pulse scale-125 opacity-30" />
                          <div className="relative h-16 w-16 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 backdrop-blur-sm">
                            <Shield className="h-8 w-8 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                          </div>
                        </div>
                        <h3 className="text-sm font-sans font-bold text-white uppercase tracking-tight">Status: <span className="text-emerald-500">All Clear</span></h3>
                        <p className="text-[10px] text-white/30 mt-3 font-sans font-bold max-w-sm mx-auto leading-relaxed">
                          No new errors found in the last 24 hours.<br />
                          We are monitoring your account in real-time.
                        </p>
                        <button
                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                          className="mt-8 flex items-center gap-3 px-6 py-2 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all rounded-lg group"
                        >
                          <span className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-tight">
                            View {submittedClaimsCount || 0} Active Claims in Recovery
                          </span>
                          <ArrowRight className="h-3 w-3 text-emerald-500/40 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex items-center justify-end mb-4 gap-4">
                          <Button
                            onClick={handleBatchExport}
                            disabled={isExporting}
                            className={`h-8 px-4 bg-white/5 hover:bg-emerald-500/10 text-white/60 hover:text-emerald-500 border border-white/10 hover:border-emerald-500/20 text-[9px] font-sans font-bold uppercase tracking-tight transition-all rounded-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isExporting ? (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-2" />
                            )}
                            EXPORT CLAIM BATCH
                          </Button>
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Show Processed</span>
                            <button
                              onClick={() => setShowProcessed(!showProcessed)}
                              className={cn(
                                "w-8 h-4 rounded-full relative transition-colors duration-300",
                                showProcessed ? "bg-emerald-500" : "bg-white/10"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300",
                                showProcessed ? "translate-x-4" : "translate-x-0"
                              )} />
                            </button>
                          </div>
                        </div>
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Type</th>
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Found On</th>
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight text-right">Estimated Value</th>
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight text-center">Certainty</th>
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Status</th>
                              <th className="pb-4 text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {detectionResults
                              .filter(r => showProcessed ? true : r.status !== 'resolved' && r.status !== 'filed')
                              .map((result) => {
                                const isProcessed = result.status === 'filed' || result.status === 'resolved' || result.status === 'converted';
                                return (
                                  <tr
                                    key={result.id}
                                    className={cn(
                                      "group transition-colors",
                                      isProcessed ? "opacity-30 grayscale pointer-events-none" : "hover:bg-white/[0.01]"
                                    )}
                                  >
                                    <td className="py-4">
                                      <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">
                                          {result.anomaly_type?.replace(/_/g, ' ') || 'UNKNOWN_ANOMALY'}
                                        </span>
                                        <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">
                                          ID: {result.id?.substring(0, 8) || 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-[10px] font-sans font-bold text-white/40 uppercase tracking-tight">
                                      {result.discovery_date
                                        ? new Date(result.discovery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'N/A'
                                      }
                                    </td>
                                    <td className="py-4 text-[11px] font-sans font-bold text-white text-right tracking-tight">
                                      {formatCurrencyWithSelection(result.estimated_value, result.currency || 'USD')}
                                    </td>
                                    <td className="py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                                            style={{ width: `${(result.confidence_score || 0) * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-sans font-bold text-blue-600/60 tracking-tight">
                                          {((result.confidence_score || 0) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4">
                                      <div className="flex gap-2">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-sm text-[8px] font-sans font-bold uppercase tracking-tight",
                                          isProcessed ? "bg-white/5 text-white/40 border border-white/10" :
                                            result.status === 'detected' || result.status === 'pending' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                              "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                        )}>
                                          {isProcessed ? "Converted To Claim" : result.status}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-right">
                                      {isProcessed ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                                          className="text-[9px] font-sans font-bold text-emerald-500/40 hover:text-emerald-500 pointer-events-auto tracking-tight"
                                        >
                                          View Case
                                        </Button>
                                      ) : (
                                        <div className="flex items-center justify-end gap-4">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-3 text-[9px] font-sans font-bold text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all uppercase tracking-tight"
                                            onClick={() => {
                                              setActiveDiscrepancy({
                                                id: result.id,
                                                reason: result.anomaly_type,
                                                estimatedRecovery: result.estimated_value,
                                                occurrenceDate: result.discovery_date
                                              });
                                              setShowDiscrepancyModal(true);
                                            }}
                                          >
                                            Start Recovering
                                          </Button>

                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-white/10 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all rounded-sm border border-transparent hover:border-emerald-500/20"
                                              >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                              align="end"
                                              className="bg-[#0c0c0c] border border-white/10 text-white shadow-2xl backdrop-blur-3xl p-1 min-w-[180px]"
                                            >
                                              <DropdownMenuItem
                                                onClick={() => handleRowExport(result.id)}
                                                className="text-[9px] font-sans font-bold uppercase tracking-tight text-white/40 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer py-2"
                                              >
                                                <Download className="h-3 w-3 mr-2" />
                                                Download Claim Evidence
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>

                        {/* Heartbeat / Audit Log Footer */}
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">
                                ENGINE_Status: <span className="text-emerald-500">MONITORING</span>
                              </span>
                            </div>
                            <span className="text-white/5 font-mono">|</span>
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">
                              Last Updated: <span className="text-white/40">{lastUpdated || 'Just Now'}</span>
                            </div>
                            <span className="text-white/5 font-mono">|</span>
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">
                              Account Shielded: <span className="text-white/40">Global FBA</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-white/10 uppercase tracking-[0.2em]">
                            Audit Engine v4.2
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'evidence' ? (
                <div className="space-y-6">
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                    <EvidenceMatchingTable />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                    <DisputeCasesTable />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Quick Actions Editor */}
      <Dialog open={quickActionsEditOpen} onOpenChange={setQuickActionsEditOpen}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-3xl rounded-xl">
          <DialogHeader className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-[11px] font-mono font-bold text-white uppercase tracking-[0.3em]">CONFIGURE_TERMINAL_OVERRIDE</DialogTitle>
            <DialogDescription className="text-[10px] text-white/20 font-serif mt-1 uppercase tracking-widest">Select active operational modules for the command grid.</DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
            {QUICK_ActionS.map((a) => (
              <label key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors cursor-pointer group rounded-lg border border-transparent hover:border-white/5">
                <Checkbox
                  className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                  checked={selectedQuickActions.includes(a.id)}
                  onCheckedChange={(c) => {
                    setSelectedQuickActions(prev => {
                      const next = new Set(prev);
                      if (c) next.add(a.id); else next.delete(a.id);
                      return Array.from(next);
                    });
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{a.label.replace('_', ' ')}</span>
                  <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">{a.subtitle.replace('_', ' ')}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
            <button
              onClick={() => setQuickActionsEditOpen(false)}
              className="px-4 py-2 text-[10px] font-mono font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              ABORT_CHANGES
            </button>
            <button
              className="px-5 py-2 text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all uppercase tracking-widest rounded-lg"
              onClick={() => { try { localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions)); toast({ title: 'PROTOCOL_UPDATED_SECURELY' }); } catch { } setQuickActionsEditOpen(false); }}
            >
              SAVE_CONFIGURATION
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Notice Modal */}
      <Dialog open={quickNoticeOpen} onOpenChange={setQuickNoticeOpen}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-3xl rounded-2xl">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Files className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-serif text-white tracking-tight">
                  Data uploads will be gone soon
                </DialogTitle>
                <DialogDescription className="text-[10px] text-blue-400/50 font-mono mt-0.5 uppercase tracking-[0.2em]">
                  PLATFORM UPDATE
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-8 py-6">
            <p className="text-[13px] text-white/50 leading-relaxed font-serif">
              We're transitioning the platform to <span className="text-white font-medium">full API-based control</span>, which means you'll be able to connect your accounts once and let the system handle everything automatically — a true <span className="text-white font-medium">set-it-and-forget-it</span> experience.
            </p>
            <p className="text-[13px] text-white/50 leading-relaxed font-serif mt-4">
              Manual data uploads will become a <span className="text-white font-medium">secondary backup option</span>, available only if the API connection is temporarily unavailable on any given day. This change ensures faster, more reliable, and fully end-to-end processing of your recoveries.
            </p>
            <p className="text-[13px] text-white/40 leading-relaxed font-serif mt-4 italic">
              We appreciate your patience as we roll this out. Your experience matters to us, and this upgrade is designed to make things easier for you.
            </p>
          </div>
          <div className="px-8 py-5 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <button
              onClick={() => setQuickNoticeOpen(false)}
              className="px-6 py-2.5 text-[10px] font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all uppercase tracking-widest rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              Got It
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm bg-[#0c0c0c] border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-3xl rounded-xl">
          <DialogHeader className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-[11px] font-mono font-bold text-white uppercase tracking-[0.3em]">PROVISION_ACCESS_INVITE</DialogTitle>
            <DialogDescription className="text-[10px] text-white/20 font-serif mt-1 uppercase tracking-widest">Authorize read-only access for internal personnel.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Input
              type="email"
              placeholder="IDENTITY@CORPORATION.SYS"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-10 bg-white/5 border-white/10 text-[11px] font-mono text-white placeholder:text-white/10 focus:border-emerald-500/30 rounded-lg"
            />
          </div>
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
            <button
              onClick={() => setInviteOpen(false)}
              className="px-4 py-2 text-[10px] font-mono font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors"
            >
              CANCEL_AUTHORIZATION
            </button>
            <button
              className="px-5 py-2 text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all uppercase tracking-widest rounded-lg"
              onClick={async () => { if (!inviteEmail) return; try { await api.post(`/api/team/invite?tenantSlug=${activeSlug}`, { email: inviteEmail }); toast({ title: 'INVITATION_PROTOCOL_INITIATED' }); } catch (e: any) { toast({ title: 'INVITE_FAILURE', description: e?.message || 'Access provision failed.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}
            >
              SEND_CREDENTIALS
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discrepancy Detail Modal - Institutional Registry View */}
      <Dialog open={showDiscrepancyModal} onOpenChange={setShowDiscrepancyModal}>
        <DialogContent className="max-w-lg bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-xl p-0 overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 right-0 p-6">
            <button onClick={() => setShowDiscrepancyModal(false)} className="text-white/10 hover:text-white transition-colors">
              <Plus className="h-4 w-4 rotate-45" />
            </button>
          </div>
          <div className="p-10 pt-12">
            {activeDiscrepancy ? (
              <div className="space-y-10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-emerald-500/50 tracking-[0.3em] uppercase">FORENSIC_DISCREPANCY_LOG</span>
                  </div>
                  <h2 className="text-xl font-serif font-medium text-white uppercase tracking-tight">{activeDiscrepancy.reason?.replace('_', ' ') || 'DISCREPANCY_RECORD'}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                      ID: {activeDiscrepancy.id?.substring(0, 12) || 'N/A'}
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                      PROBABILITY: 94.2%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">RECOVERY_POTENTIAL</span>
                    <span className="text-2xl font-mono font-bold text-white">{formatCurrency(activeDiscrepancy.estimatedRecovery)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.2em]">INCIDENT_TIMESTAMP</span>
                    <span className="text-[13px] font-mono text-white/60 uppercase">{activeDiscrepancy.occurrenceDate ? new Date(activeDiscrepancy.occurrenceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">INCIDENT_ANALYSIS_SUMMARY</h3>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-lg">
                    <p className="text-xs text-white/40 leading-relaxed font-serif">
                      Automated audit engines identified a discrepancy in the {activeDiscrepancy.reason} ledger. High-fidelity evidence has been indexed and is queued for dispute protocol initiation.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDiscrepancyModal(false)}
                    className="flex-1 bg-white/5 border-white/10 text-[10px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest h-12"
                  >
                    CLOSE_REGISTRY
                  </Button>
                  <Button
                    onClick={() => {
                      toast({ title: 'INITIATION_PROTOCOL_SECURED', description: 'Dispute cycle engaged for REF_ID: ' + activeDiscrepancy.id.substring(0, 8) });
                      setShowDiscrepancyModal(false);
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-mono font-bold uppercase tracking-widest h-12"
                  >
                    INITIATE_RECOVERY
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enter Amazon Case ID Modal */}
      <Dialog open={caseIdModalOpen} onOpenChange={setCaseIdModalOpen}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 shadow-3xl rounded-xl p-6 backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-medium text-white uppercase tracking-tight">
              Link Amazon Case ID
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50 font-serif mt-2">
              Enter the Case ID provided by Amazon Seller Support to track this claim.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6">
            <Input
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              placeholder="e.g. CASE-123456789"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono h-12"
              disabled={isLinkingCase}
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setCaseIdModalOpen(false)}
              className="px-4 py-2 bg-white/5 border-white/10 text-[10px] font-mono font-bold text-white/40 hover:text-white uppercase tracking-widest h-10"
              disabled={isLinkingCase}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCaseIdUpdate}
              disabled={!caseIdInput.trim() || isLinkingCase}
              className="px-5 py-2 text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all uppercase tracking-widest rounded-lg flex items-center h-10"
            >
              {isLinkingCase ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Case ID"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SyncLogModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
}
