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
  Download, Bell, TrendingDown, TrendingUp, Loader2, X, AlertTriangle,
  ChevronDown, Clock, MoreVertical, Files
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
import { format, formatDistanceToNow } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DisputeCasesTable } from '@/components/disputes/DisputeCasesTable';
import { EvidenceMatchingTable } from '@/components/evidence/EvidenceMatchingTable';
import { useStatusStream } from '@/hooks/use-status-stream';

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

interface DashboardBlocker {
  key: string;
  label: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface DashboardSummary {
  detections_count: number;
  cases_count: number;
  filed_count: number;
  approved_count: number;
  recovered_count: number;
  billed_count: number;
  estimated_value_total: number;
  filed_value_total: number;
  approved_value_total: number;
  recovered_cash_total: number;
  billed_revenue_total: number;
  outstanding_amount?: number;
  last_payout_date?: string | null;
  payout_count?: number;
  last_updated_at: string;
  integrations_summary: {
    connected_count: number;
    stale_count: number;
    last_ingest_at: string | null;
  };
  evidence_summary: {
    total_documents: number;
    parsed_documents: number;
    matched_documents: number;
    failed_documents: number;
    needs_review_documents: number;
  };
  blockers: DashboardBlocker[];
}

interface LaunchMonitorMetrics {
  agent7_ready_count: number | null;
  agent7_duplicate_blocked_count: number | null;
  agent7_insufficient_data_count: number | null;
  agent7_thread_only_count: number | null;
  agent7_pending_safety_verification_count: number | null;
  agent7_filed_count: number | null;
  agent7_needs_evidence_count: number | null;
  agent7_approved_count: number | null;
  agent7_rejected_count: number | null;
  agent7_paid_count: number | null;
  unmatched_amazon_email_count: number | null;
  notification_failed_count: number | null;
  notification_partial_count: number | null;
}

interface LaunchMonitorAlert {
  key: 'duplicate_blocked_spike' | 'unmatched_amazon_email_spike' | 'notification_failure_present' | 'pending_safety_verification_backlog';
  label: string;
  severity: 'medium' | 'high';
  active: boolean | null;
  count: number | null;
  threshold: number | null;
  detail: string;
}

interface LaunchMonitorEvent {
  id: string;
  event_type: 'case_blocked' | 'case_filed' | 'amazon_thread_linked' | 'needs_evidence' | 'approved' | 'rejected' | 'paid' | 'notification_failed' | 'notification_partial' | 'unmatched_email_created';
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  dispute_case_id: string | null;
  amazon_case_id: string | null;
  notification_id: string | null;
  source_table: 'dispute_cases' | 'dispute_submissions' | 'unmatched_case_messages' | 'notifications';
  source_id: string;
  status: string | null;
}

interface LaunchMonitorPayload {
  metrics: LaunchMonitorMetrics;
  alerts: LaunchMonitorAlert[];
  recent_events: LaunchMonitorEvent[] | null;
  last_updated_at: string | null;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const formatLaunchEventTypeLabel = (value: LaunchMonitorEvent['event_type']) =>
  toTitleCase(value.replace(/_/g, ' '));

const formatLaunchSourceLabel = (value: LaunchMonitorEvent['source_table']) =>
  toTitleCase(value.replace(/_/g, ' '));

const formatLaunchStatusLabel = (value?: string | null) =>
  value ? toTitleCase(value.replace(/_/g, ' ')) : null;

const formatIssueTypeLabel = (value?: string | null) => {
  if (!value) return 'Unknown issue';
  return toTitleCase(value.replace(/_/g, ' ').trim());
};

const isProcessedFindingStatus = (status?: string | null) =>
  ['filed', 'resolved', 'converted'].includes((status || '').toLowerCase());

const formatIssueStatusLabel = (status?: string | null) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return 'Pending review';
    case 'detected':
      return 'Issue found';
    case 'filed':
    case 'converted':
      return 'Moved to claim';
    case 'resolved':
      return 'Closed';
    case 'ready_to_file':
      return 'Ready to file';
    default:
      return normalized ? toTitleCase(normalized.replace(/_/g, ' ')) : 'Needs review';
  }
};

const formatLaunchMetricValue = (value: number | null) =>
  typeof value === 'number' ? value.toLocaleString('en-US') : 'Not Available';

const launchAlertTone = (alert: LaunchMonitorAlert) => {
  if (alert.active === null) return 'border-white/10 bg-white/[0.03] text-white/55';
  if (!alert.active) return 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200';
  return alert.severity === 'high'
    ? 'border-red-500/25 bg-red-500/[0.08] text-red-200'
    : 'border-amber-500/25 bg-amber-500/[0.08] text-amber-200';
};

const launchEventTone = (severity: LaunchMonitorEvent['severity']) => {
  if (severity === 'high') return 'text-red-200 border-red-500/25 bg-red-500/[0.08]';
  if (severity === 'medium') return 'text-amber-200 border-amber-500/25 bg-amber-500/[0.08]';
  return 'text-sky-200 border-sky-500/25 bg-sky-500/[0.08]';
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'discrepancies' | 'disputes' | 'evidence'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || '';
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
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [launchMonitor, setLaunchMonitor] = useState<LaunchMonitorPayload | null>(null);

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
    if (!activeSlug) return;
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
    setDashboardSummary(null);
    setLaunchMonitor(null);
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

  const fetchDashboardSummary = useCallback(async () => {
    if (!isReady || !activeSlug) return;
    try {
      const response = await api.getDashboardSummary(activeSlug);
      if (!mountedRef.current) return;
      if (response.ok && response.data?.summary) {
      setDashboardSummary(response.data.summary as DashboardSummary);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
    }
  }, [activeSlug, isReady]);

  const fetchLaunchMonitor = useCallback(async () => {
    if (!isReady || !activeSlug) return;
    try {
      const response = await api.getLaunchMonitor(activeSlug, 20);
      if (!mountedRef.current) return;
      if (response.ok && response.data?.data) {
        setLaunchMonitor(response.data.data as LaunchMonitorPayload);
      }
    } catch (error) {
      console.error('Failed to fetch launch monitor:', error);
    }
  }, [activeSlug, isReady]);

  const executeQuickAction = useCallback(async (actionId: string) => {
    if (!activeSlug) return;

    if (actionId === 'connect_evidence') {
      navigate(tenantRoute(activeSlug, '/integrations-hub'));
      return;
    }

    if (actionId === 'invite_teammate') {
      setInviteOpen(true);
      return;
    }

    if (actionId === 'evidence_locker') {
      navigate(tenantRoute(activeSlug, '/evidence-locker'));
      return;
    }

    if (actionId === 'upcoming_payments') {
      navigate(tenantRoute(activeSlug, '/billing'));
      return;
    }

    if (actionId === 'ingest_now') {
      try {
        const response = await api.ingestAllEvidence({ maxResults: 50, autoParse: true }, activeSlug);
        if (!response.ok) {
          throw new Error(response.error || 'Evidence ingestion failed');
        }
        toast({
          title: 'INGESTION_STARTED',
          description: response.data?.message || 'Evidence ingestion was queued. Review the Evidence Locker for final FULL, DEGRADED, or REJECTED intake states.'
        });
        await fetchDashboardSummary();
      } catch (error: any) {
        toast({
          title: 'INGESTION_FAILED',
          description: error?.message || 'Evidence ingestion could not be started.',
          variant: 'destructive'
        });
      }
      return;
    }

    toast({
      title: 'ACTION_UNAVAILABLE',
      description: `${actionId.replace(/_/g, ' ')} is not available from the dashboard until a tenant-safe action is wired.`,
      variant: 'destructive'
    });
  }, [activeSlug, fetchDashboardSummary, navigate, toast]);

  // Fetch evidence status and detection statistics
  useEffect(() => {
    if (!isReady || !activeSlug) return;
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
    if (!isReady || !activeSlug || detectionResults.length !== 0) return;
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
  }, [activeSlug, detectionResults.length, toast, isReady]);

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
    if (!isReady || !activeSlug) return;
    void checkAndMonitorSync();
  }, [activeSlug, isReady]);

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
          await fetchDashboardSummary();
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
          setSyncMessage(syncStatus.lastSync.message || 'We hit a temporary issue while updating your Amazon records. Please try again.');

          // Show error toast with more details
          toast({
            title: 'Amazon Update Paused',
            description: syncStatus.lastSync.message || 'We hit a temporary issue while updating your Amazon records. Please try again.',
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
          await fetchDashboardSummary();
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
          setSyncMessage('We hit a temporary issue while updating your Amazon records. Please try again.');
          await fetchDashboardSummary();

          toast({
            title: 'Amazon Update Paused',
            description: status.message || status.error || 'We hit a temporary issue while updating your Amazon records. Please try again.',
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
    }
  }

  // Fetch real dispute case data for Next Payment and Pending tiles
  const fetchDisputeMetrics = useCallback(async () => {
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
  }, [activeSlug, isReady]);

  const refreshDashboardLive = useCallback(async () => {
    await Promise.all([
      fetchDashboardSummary(),
      fetchLaunchMonitor(),
      fetchDisputeMetrics()
    ]);
  }, [fetchDashboardSummary, fetchLaunchMonitor, fetchDisputeMetrics]);

  useStatusStream((event) => {
    if (!activeSlug) return;

    if (
      event.type === 'sync' ||
      event.type === 'detection' ||
      event.type === 'evidence' ||
      event.type === 'case' ||
      event.type === 'filing' ||
      event.type === 'payout' ||
      event.type === 'recovery' ||
      event.type === 'notification'
    ) {
      void refreshDashboardLive();
    }
  }, activeSlug);

  // Event-driven dashboard updates with slow polling fallback for recovery after disconnects.
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let pollTimer: number | null = null;

    const initFetch = async () => {
      await refreshDashboardLive();
    };

    initFetch();
    hasFetchedRef.current = true;

    pollTimer = window.setInterval(async () => {
      await refreshDashboardLive();
    }, 60000) as unknown as number;

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      if (syncCheckTimeoutRef.current) {
        clearTimeout(syncCheckTimeoutRef.current);
        syncCheckTimeoutRef.current = null;
      }
    };
  }, [activeSlug, isReady, refreshDashboardLive]);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const detectedOpportunitiesCount = dashboardSummary?.detections_count ?? detectionStats?.totalDetections ?? detectionTotal ?? detectionResults.length;
  const filedClaimsCount = dashboardSummary?.filed_count ?? 0;
  const approvedClaimsCount = dashboardSummary?.approved_count ?? 0;
  const recoveredClaimsCount = dashboardSummary?.recovered_count ?? 0;
  const recoveredCashTotal = dashboardSummary?.recovered_cash_total ?? 0;
  const estimatedValueTotal = dashboardSummary?.estimated_value_total ?? 0;
  const filedValueTotal = dashboardSummary?.filed_value_total ?? 0;
  const approvedValueTotal = dashboardSummary?.approved_value_total ?? 0;
  const activeBlockers = dashboardSummary?.blockers ?? [];
  const primaryBlocker = activeBlockers[0] || null;
  const hasLiveRecoveryValue = estimatedValueTotal > 0 || filedValueTotal > 0 || approvedValueTotal > 0 || recoveredCashTotal > 0;
  const launchMetrics = launchMonitor?.metrics ?? null;
  const formattedLastUpdated = useMemo(() => {
    if (!dashboardSummary?.last_updated_at) return 'Unavailable';
    const timestamp = new Date(dashboardSummary.last_updated_at);
    if (Number.isNaN(timestamp.getTime())) return 'Unavailable';
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }, [dashboardSummary?.last_updated_at]);
  const launchMonitorCards = useMemo(() => {
    return [
      { key: 'agent7_ready_count', label: 'Ready to file', value: launchMetrics?.agent7_ready_count ?? null, detail: 'Cases that fully passed the filing truth gate.' },
      { key: 'agent7_duplicate_blocked_count', label: 'Duplicate blocked', value: launchMetrics?.agent7_duplicate_blocked_count ?? null, detail: 'Cases blocked because the same issue is already active.' },
      { key: 'agent7_insufficient_data_count', label: 'Insufficient data', value: launchMetrics?.agent7_insufficient_data_count ?? null, detail: 'Cases missing verified identifiers or quantity truth.' },
      { key: 'agent7_thread_only_count', label: 'Thread only', value: launchMetrics?.agent7_thread_only_count ?? null, detail: 'Amazon thread cases that should never trigger a fresh filing.' },
      { key: 'agent7_pending_safety_verification_count', label: 'Safety backlog', value: launchMetrics?.agent7_pending_safety_verification_count ?? null, detail: 'Cases still waiting on verified identifiers or review.' },
      { key: 'agent7_filed_count', label: 'Filed', value: launchMetrics?.agent7_filed_count ?? null, detail: 'Cases currently in flight with Amazon.' },
      { key: 'agent7_needs_evidence_count', label: 'Needs evidence', value: launchMetrics?.agent7_needs_evidence_count ?? null, detail: 'Cases where Amazon requested more proof.' },
      { key: 'agent7_approved_count', label: 'Approved', value: launchMetrics?.agent7_approved_count ?? null, detail: 'Cases Amazon has approved.' },
      { key: 'agent7_rejected_count', label: 'Rejected', value: launchMetrics?.agent7_rejected_count ?? null, detail: 'Cases Amazon has rejected.' },
      { key: 'agent7_paid_count', label: 'Paid', value: launchMetrics?.agent7_paid_count ?? null, detail: 'Cases marked paid from Amazon thread truth.' },
      { key: 'unmatched_amazon_email_count', label: 'Unmatched emails', value: launchMetrics?.unmatched_amazon_email_count ?? null, detail: 'Amazon emails still waiting for a safe case link.' },
      { key: 'notification_failed_count', label: 'Notification failed', value: launchMetrics?.notification_failed_count ?? null, detail: 'Notifications with failed delivery.' },
      { key: 'notification_partial_count', label: 'Notification partial', value: launchMetrics?.notification_partial_count ?? null, detail: 'Notifications with mixed delivery outcomes.' }
    ];
  }, [launchMetrics]);
  const activeLaunchAlerts = useMemo(
    () => (launchMonitor?.alerts || []).filter((alert) => alert.active !== false),
    [launchMonitor?.alerts]
  );
  const formattedLaunchLastUpdated = useMemo(() => {
    if (!launchMonitor?.last_updated_at) return 'Not Available';
    const timestamp = new Date(launchMonitor.last_updated_at);
    if (Number.isNaN(timestamp.getTime())) return 'Not Available';
    return `${formatDistanceToNow(timestamp, { addSuffix: true })} (${format(timestamp, 'MMM dd, yyyy, HH:mm')})`;
  }, [launchMonitor?.last_updated_at]);
  const visibleDetectionResults = useMemo(
    () => detectionResults.filter(result => showProcessed ? true : !isProcessedFindingStatus(result.status)),
    [detectionResults, showProcessed]
  );
  const lastSyncResult = useMemo(() => {
    if (activeSyncId || syncTriggered) {
      return {
        value: 'Sync in progress',
        detail: syncMessage || 'We are pulling your latest account records now.'
      };
    }
    if (needsSync) {
      return {
        value: 'Needs attention',
        detail: syncMessage || 'A refresh is needed to bring in your latest account records.'
      };
    }
    if (lastSyncTime) {
      return {
        value: 'Completed',
        detail: `Last sync ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
      };
    }
    const lastIngestAt = dashboardSummary?.integrations_summary?.last_ingest_at;
    if (lastIngestAt) {
      const timestamp = new Date(lastIngestAt);
      if (!Number.isNaN(timestamp.getTime())) {
        return {
          value: 'Completed',
          detail: `Last ingest ${formatDistanceToNow(timestamp, { addSuffix: true })}`
        };
      }
    }
    return {
      value: 'Not run yet',
      detail: 'No sync result recorded yet.'
    };
  }, [activeSyncId, dashboardSummary?.integrations_summary?.last_ingest_at, lastSyncTime, needsSync, syncMessage, syncTriggered]);
  const latestOperationalEvent = useMemo(() => {
    const recentEvents = launchMonitor?.recent_events;
    if (!recentEvents || recentEvents.length === 0) return null;
    return recentEvents[0];
  }, [launchMonitor?.recent_events]);
  const overviewHeadline = useMemo(() => {
    const readyCount = launchMetrics?.agent7_ready_count ?? 0;
    const filedCount = launchMetrics?.agent7_filed_count ?? filedClaimsCount;
    const approvedCount = launchMetrics?.agent7_approved_count ?? approvedClaimsCount;
    const paidCount = launchMetrics?.agent7_paid_count ?? 0;
    const needsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;
    const safetyVerificationCount = launchMetrics?.agent7_pending_safety_verification_count ?? 0;
    const insufficientDataCount = launchMetrics?.agent7_insufficient_data_count ?? 0;

    if (!dashboardSummary && !launchMonitor) {
      return 'Margin is checking your latest recovery position.';
    }
    if (activeSyncId || syncTriggered) {
      return 'Margin is pulling your latest Amazon activity now.';
    }
    if (needsEvidenceCount > 0) {
      return `Amazon needs more proof before ${pluralize(needsEvidenceCount, 'case')} can keep moving.`;
    }
    if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
      return `Verified identifiers are still missing on ${pluralize(safetyVerificationCount + insufficientDataCount, 'case')}, so Margin is holding them safely.`;
    }
    if (approvedCount > 0 && paidCount === 0) {
      return `Amazon has approved ${pluralize(approvedCount, 'case')}; payout confirmation is the next checkpoint.`;
    }
    if (filedCount > 0) {
      return `Margin already has ${pluralize(filedCount, 'case')} moving with Amazon.`;
    }
    if (readyCount > 0) {
      return `Margin has ${pluralize(readyCount, 'case')} ready to file with full supporting truth.`;
    }
    if (detectedOpportunitiesCount > 0) {
      return `Margin has ${pluralize(detectedOpportunitiesCount, 'issue')} in view and is turning supportable ones into cases.`;
    }
    if (recoveredCashTotal > 0) {
      return `Margin has already confirmed ${formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)} back to this account.`;
    }
    return 'Margin is connected and watching this account for missed reimbursements.';
  }, [
    activeSyncId,
    approvedClaimsCount,
    dashboardSummary,
    detectedOpportunitiesCount,
    filedClaimsCount,
    formatCurrencyWithSelection,
    launchMetrics,
    launchMonitor,
    recoveredCashTotal,
    recoveredCurrency,
    syncTriggered
  ]);
  const overviewNarrative = useMemo(() => {
    const latestEventTimestamp = latestOperationalEvent?.timestamp
      ? new Date(latestOperationalEvent.timestamp)
      : null;
    const latestMovementSummary = latestEventTimestamp && !Number.isNaN(latestEventTimestamp.getTime())
      ? `Last movement ${formatDistanceToNow(latestEventTimestamp, { addSuffix: true })}: ${latestOperationalEvent?.title}.`
      : dashboardSummary
        ? `Recovery summary refreshed ${formattedLastUpdated}.`
        : 'Margin is assembling your latest filing, thread, and notification truth.';

    if (primaryBlocker) {
      return `${latestMovementSummary} ${primaryBlocker.label} is the main thing holding up ${pluralize(primaryBlocker.count, 'case')} right now.`;
    }
    if (needsSync) {
      return `${latestMovementSummary} A refresh is still needed to pull the latest Amazon records.`;
    }
    if (recoveredCashTotal > 0) {
      return `${latestMovementSummary} ${formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)} is already confirmed as paid back while Margin keeps watching what can move next.`;
    }
    return `${latestMovementSummary} The status cards beside this summary show whether Amazon is waiting, whether you need to step in, and what Margin is doing next.`;
  }, [
    dashboardSummary,
    formattedLastUpdated,
    formatCurrencyWithSelection,
    latestOperationalEvent,
    needsSync,
    primaryBlocker,
    recoveredCashTotal,
    recoveredCurrency
  ]);
  const overviewStatusRows = useMemo(() => {
    const readyCount = launchMetrics?.agent7_ready_count ?? 0;
    const duplicateBlockedCount = launchMetrics?.agent7_duplicate_blocked_count ?? 0;
    const insufficientDataCount = launchMetrics?.agent7_insufficient_data_count ?? 0;
    const safetyVerificationCount = launchMetrics?.agent7_pending_safety_verification_count ?? 0;
    const filedCount = launchMetrics?.agent7_filed_count ?? filedClaimsCount;
    const approvedCount = launchMetrics?.agent7_approved_count ?? approvedClaimsCount;
    const paidCount = launchMetrics?.agent7_paid_count ?? 0;
    const needsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;

    const currentStatus = (() => {
      if (!dashboardSummary && !launchMonitor) {
        return {
          label: 'Current status',
          value: 'Checking account status',
          detail: 'Margin is loading the latest filing, thread, and notification truth.'
        };
      }
      if (activeSyncId || syncTriggered) {
        return {
          label: 'Current status',
          value: 'Syncing Amazon data',
          detail: lastSyncResult.detail
        };
      }
      if (needsEvidenceCount > 0) {
        return {
          label: 'Current status',
          value: 'Needs your input',
          detail: `Amazon asked for more proof on ${pluralize(needsEvidenceCount, 'case')}.`
        };
      }
      if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
        return {
          label: 'Current status',
          value: 'Awaiting verified identifiers',
          detail: `${pluralize(safetyVerificationCount + insufficientDataCount, 'case')} are paused until shipment or product truth is confirmed.`
        };
      }
      if (approvedCount > 0 && paidCount === 0) {
        return {
          label: 'Current status',
          value: 'Approved, awaiting payout',
          detail: `${pluralize(approvedCount, 'case')} are approved and waiting for payout confirmation.`
        };
      }
      if (filedCount > 0) {
        return {
          label: 'Current status',
          value: 'Waiting on Amazon',
          detail: `${pluralize(filedCount, 'case')} are already filed and currently in Amazon review.`
        };
      }
      if (readyCount > 0) {
        return {
          label: 'Current status',
          value: 'Ready to file',
          detail: `${pluralize(readyCount, 'case')} fully passed the truth gate and can move forward safely.`
        };
      }
      if (detectedOpportunitiesCount > 0) {
        return {
          label: 'Current status',
          value: 'Reviewing new issues',
          detail: `${pluralize(detectedOpportunitiesCount, 'issue')} are in view and Margin is sorting what is supportable.`
        };
      }
      if (recoveredCashTotal > 0) {
        return {
          label: 'Current status',
          value: 'Watching for the next issue',
          detail: `${formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)} has already been confirmed back to this account.`
        };
      }
      return {
        label: 'Current status',
        value: 'Watching for issues',
        detail: 'Margin is connected and checking for missed reimbursements.'
      };
    })();

    const lastMovement = (() => {
      if (latestOperationalEvent) {
        const timestamp = new Date(latestOperationalEvent.timestamp);
        const relativeTime = Number.isNaN(timestamp.getTime())
          ? 'recently'
          : formatDistanceToNow(timestamp, { addSuffix: true });

        return {
          label: 'Last movement',
          value: formatLaunchEventTypeLabel(latestOperationalEvent.event_type),
          detail: `${latestOperationalEvent.title}. Recorded ${relativeTime}.${latestOperationalEvent.amazon_case_id ? ` Amazon case ${latestOperationalEvent.amazon_case_id}.` : ''}`
        };
      }
      if (dashboardSummary?.last_updated_at) {
        return {
          label: 'Last movement',
          value: 'Dashboard refreshed',
          detail: `Recovery summary updated ${formattedLastUpdated}.`
        };
      }
      return {
        label: 'Last movement',
        value: 'No movement yet',
        detail: 'Margin has not recorded a filing, Amazon thread change, or notification event for this workspace yet.'
      };
    })();

    const needsFromYou = (() => {
      const notificationFailureAlert = activeLaunchAlerts.find((alert) => alert.key === 'notification_failure_present');
      const unmatchedEmailAlert = activeLaunchAlerts.find((alert) => alert.key === 'unmatched_amazon_email_spike');

      if (needsEvidenceCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Send evidence',
          detail: `${pluralize(needsEvidenceCount, 'case')} are waiting on Amazon-requested proof.`
        };
      }
      if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Verify identifiers',
          detail: `${pluralize(safetyVerificationCount + insufficientDataCount, 'case')} still need shipment, order, or product truth before filing.`
        };
      }
      if (needsSync) {
        return {
          label: 'Needs from you',
          value: 'Refresh account',
          detail: syncMessage || 'Run a refresh so Margin can pull the latest Amazon records.'
        };
      }
      if (duplicateBlockedCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Review duplicate holds',
          detail: `${pluralize(duplicateBlockedCount, 'case')} were held to avoid redundant Amazon filings.`
        };
      }
      if (notificationFailureAlert?.active) {
        return {
          label: 'Needs from you',
          value: 'Check notifications',
          detail: notificationFailureAlert.detail
        };
      }
      if (unmatchedEmailAlert?.active) {
        return {
          label: 'Needs from you',
          value: 'Review unmatched emails',
          detail: unmatchedEmailAlert.detail
        };
      }
      if (readyCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Nothing urgent',
          detail: `${pluralize(readyCount, 'case')} already passed the truth gate and can move when you are ready.`
        };
      }
      return {
        label: 'Needs from you',
        value: 'Nothing needed',
        detail: 'Margin is watching for issues and you do not need to act right now.'
      };
    })();

    return [currentStatus, lastMovement, needsFromYou];
  }, [
    activeLaunchAlerts,
    activeSyncId,
    approvedClaimsCount,
    dashboardSummary,
    detectedOpportunitiesCount,
    filedClaimsCount,
    formattedLastUpdated,
    formatCurrencyWithSelection,
    lastSyncResult.detail,
    latestOperationalEvent,
    launchMetrics,
    launchMonitor,
    needsSync,
    recoveredCashTotal,
    recoveredCurrency,
    syncMessage,
    syncTriggered
  ]);
  const overviewMetricRows = useMemo(() => ([
    {
      label: 'Issues in view',
      value: pluralize(detectedOpportunitiesCount, 'issue'),
      detail: `${formatCurrencyWithSelection(estimatedValueTotal, recoveredCurrency)} currently traceable across live detections`
    },
    {
      label: 'Filed with Amazon',
      value: pluralize(filedClaimsCount, 'case'),
      detail: filedClaimsCount > 0
        ? `${formatCurrencyWithSelection(filedValueTotal, recoveredCurrency)} currently in Amazon review`
        : 'Nothing has entered filing yet'
    },
    {
      label: 'Approved',
      value: pluralize(approvedClaimsCount, 'case'),
      detail: approvedClaimsCount > 0
        ? `${formatCurrencyWithSelection(approvedValueTotal, recoveredCurrency)} waiting for payout confirmation`
        : 'No approved cases are currently waiting for payout'
    },
    {
      label: 'Paid back',
      value: formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency),
      detail: recoveredCashTotal > 0
        ? `${pluralize(recoveredClaimsCount, 'reconciled case')} now tied to confirmed payout events`
        : 'No confirmed reimbursement recorded yet'
    }
  ]), [
    approvedClaimsCount,
    approvedValueTotal,
    detectedOpportunitiesCount,
    estimatedValueTotal,
    filedClaimsCount,
    filedValueTotal,
    formatCurrencyWithSelection,
    recoveredClaimsCount,
    recoveredCashTotal,
    recoveredCurrency
  ]);
  if (!activeSlug) {
    return (
      <div className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-[#070707]">
        <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
        <div className="flex-1 flex h-full overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
            <div className="relative pt-8 px-8">
              <div className="rounded-2xl border border-white/10 bg-[#111111]/90 p-8 text-white">
                <h1 className="text-lg font-sans font-bold tracking-tight">Tenant context required</h1>
                <p className="mt-3 text-sm text-white/55 font-sans">
                  Dashboard metrics are blocked until a real tenant workspace is selected.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                          "px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 uppercase tracking-tight",
                          activeTab === 'discrepancies'
                            ? "text-white bg-white/[0.08]"
                            : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                        )}
                      >
                        Issues Found
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
                        Evidence
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setQuickNoticeOpen(true)}
                  className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/85 text-[10px] font-mono font-medium uppercase tracking-tight rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(255,255,255,0.06)] hover:shadow-[0_0_18px_rgba(255,255,255,0.10)]"
                >
                  Quick Notice
                </button>
              </div>

              {activeTab === 'overview' ? (
                <div className="relative overflow-hidden rounded-[28px] bg-[#070707] text-white">
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
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 shadow-2xl backdrop-blur-3xl">
                      <div className="border-b border-white/5 px-8 py-8">
                        <div className="grid gap-10 xl:grid-cols-[1.45fr_0.95fr]">
                          <div>
                            <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-white/28">
                              Recovery value in view
                            </div>
                            <h2 className="mt-4 max-w-4xl text-4xl font-sans font-medium tracking-tight text-white xl:text-5xl">
                              {overviewHeadline}
                            </h2>
                            <p className="mt-5 max-w-3xl text-sm font-sans leading-relaxed text-white/52">
                              {overviewNarrative}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                              <button
                                onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                                className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/78 transition-colors hover:bg-white/[0.06] hover:text-white"
                              >
                                Open Recoveries
                              </button>
                              <button
                                onClick={() => navigate(tenantRoute(activeSlug, '/dispute-cases'))}
                                className="rounded-full border border-white/12 bg-transparent px-4 py-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/50 transition-colors hover:border-white/20 hover:text-white/78"
                              >
                                Review cases in motion
                              </button>
                              {!hasLiveRecoveryValue ? (
                                <button
                                  onClick={() => navigate(tenantRoute(activeSlug, '/data-upload'))}
                                  className="rounded-full border border-white/12 bg-transparent px-4 py-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/50 transition-colors hover:border-white/20 hover:text-white/78"
                                >
                                  Load demo data
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid gap-3">
                            {overviewStatusRows.map((item) => (
                              <div key={item.label} className="rounded-2xl border border-white/8 bg-black/20 px-5 py-4">
                                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/26">
                                  {item.label}
                                </div>
                                <div className="mt-2 text-[20px] font-sans font-medium tracking-tight text-white">
                                  {item.value}
                                </div>
                                <p className="mt-2 text-[11px] font-sans leading-relaxed text-white/38">
                                  {item.detail}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-px bg-white/6 md:grid-cols-2 xl:grid-cols-4">
                        {overviewMetricRows.map((item) => (
                          <div key={item.label} className="bg-[#0d0d0d] px-8 py-7">
                            <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/24">
                              {item.label}
                            </div>
                            <div className="mt-4 text-3xl font-sans font-medium tracking-tight text-white">
                              {!dashboardSummary ? (
                                <Skeleton className="h-9 w-32 bg-white/10" />
                              ) : (
                                item.value
                              )}
                            </div>
                            <p className="mt-3 text-[11px] font-sans leading-relaxed text-white/34">
                              {item.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                    </div>

                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 shadow-2xl backdrop-blur-3xl">
                        <div className="border-b border-white/5 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/30">
                                Recent operator feed
                              </div>
                              <p className="mt-2 text-[10px] font-sans leading-5 text-white/42">
                                Latest blocked cases, filings, Amazon thread changes, unmatched emails, and notification delivery issues.
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/22">
                                Reading mode
                              </div>
                              <div className="mt-2 text-[10px] font-sans leading-5 text-white/40">
                                Most recent first
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-5">
                          {launchMonitor?.recent_events === null ? (
                            <div className="py-6 text-[11px] font-sans text-white/45">
                              Not Available
                            </div>
                          ) : (launchMonitor?.recent_events || []).length === 0 ? (
                            <div className="py-6 text-[11px] font-sans text-white/45">
                              No recent operational events recorded for this tenant.
                            </div>
                          ) : (
                            <ScrollArea className="w-full whitespace-nowrap">
                              <div className="flex min-w-max gap-4 pb-4 pr-2">
                                {launchMonitor?.recent_events?.map((event) => {
                                  const eventTimestamp = new Date(event.timestamp);
                                  const eventTimeLabel = Number.isNaN(eventTimestamp.getTime())
                                    ? 'Time unavailable'
                                    : formatDistanceToNow(eventTimestamp, { addSuffix: true });
                                  const formattedStatus = formatLaunchStatusLabel(event.status);

                                  return (
                                    <div
                                      key={event.id}
                                      className="flex min-h-[272px] w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-white/8 bg-black/20 p-5 sm:w-[340px] xl:w-[360px]"
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight', launchEventTone(event.severity))}>
                                              {formatLaunchEventTypeLabel(event.event_type)}
                                            </span>
                                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-tight text-white/34">
                                              {formatLaunchSourceLabel(event.source_table)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/22">
                                            Recorded
                                          </div>
                                          <div className="mt-1 text-[10px] font-sans text-white/42">
                                            {eventTimeLabel}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-5">
                                        <div className="text-[16px] font-sans font-medium leading-tight tracking-tight text-white">
                                          {event.title}
                                        </div>
                                        <p className="mt-3 text-[11px] font-sans leading-5 text-white/42 whitespace-normal">
                                          {event.detail}
                                        </p>
                                      </div>

                                      <div className="mt-5 space-y-2">
                                        {event.amazon_case_id ? (
                                          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2">
                                            <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/20">
                                              Amazon case
                                            </div>
                                            <div className="mt-1 text-[11px] font-sans text-white/64">
                                              {event.amazon_case_id}
                                            </div>
                                          </div>
                                        ) : null}
                                        {formattedStatus ? (
                                          <div className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2">
                                            <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/20">
                                              Status
                                            </div>
                                            <div className="mt-1 text-[11px] font-sans text-white/64">
                                              {formattedStatus}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>

                                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/6 pt-4">
                                        <div className="text-[10px] font-sans text-white/28 whitespace-normal">
                                          {event.dispute_case_id ? 'Linked to a dispute case record.' : 'Operator log only.'}
                                        </div>
                                        {event.dispute_case_id ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[10px] font-sans font-medium uppercase tracking-tight text-white/60 hover:bg-white/[0.07] hover:text-white"
                                            onClick={() => navigate(tenantRoute(activeSlug, `/recoveries/${event.dispute_case_id}`))}
                                          >
                                            Open Case
                                          </Button>
                                        ) : (
                                          <div className="text-[10px] font-sans text-white/25">
                                            Logged only
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/90 shadow-2xl backdrop-blur-3xl">
                        <div className="border-b border-white/5 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/30">
                                Launch monitor
                              </div>
                              <p className="mt-2 text-[10px] font-sans leading-5 text-white/42">
                                Tenant-scoped Agent 7, Amazon thread, and Agent 10 launch truth.
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/22">
                                Last updated
                              </div>
                              <div className="mt-2 text-[10px] font-sans leading-5 text-white/44">
                                {formattedLaunchLastUpdated}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {(launchMonitor?.alerts || []).length === 0 ? (
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-sans font-medium tracking-tight text-white/55">
                                Not Available
                              </span>
                            ) : activeLaunchAlerts.length === 0 ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-[10px] font-sans font-medium tracking-tight text-emerald-200">
                                No active launch alerts
                              </span>
                            ) : (
                              activeLaunchAlerts.map((alert) => (
                                <span
                                  key={alert.key}
                                  className={cn(
                                    'rounded-full border px-3 py-1.5 text-[10px] font-sans font-medium tracking-tight',
                                    launchAlertTone(alert)
                                  )}
                                >
                                  {alert.label}: {formatLaunchMetricValue(alert.count)}
                                  {typeof alert.threshold === 'number' ? ` / ${alert.threshold}` : ''}
                                </span>
                              ))
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                            {launchMonitorCards.map((item) => (
                              <div key={item.key} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                                <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-white/26">
                                  {item.label}
                                </div>
                                <div className="mt-2 text-[20px] font-sans font-medium tracking-tight text-white">
                                  {formatLaunchMetricValue(item.value)}
                                </div>
                                <p className="mt-2 text-[10px] font-sans leading-5 text-white/38">
                                  {item.detail}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            {(launchMonitor?.alerts || []).map((alert) => (
                              <div key={`${alert.key}-detail`} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                                <div className="flex items-center gap-2 text-[10px] font-sans font-medium uppercase tracking-tight text-white/55">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {alert.label}
                                </div>
                                <p className="mt-2 text-[11px] font-sans leading-5 text-white/42">
                                  {alert.detail}
                                  {alert.active === null
                                    ? ' Metric unavailable.'
                                    : alert.active
                                      ? ` Current count: ${formatLaunchMetricValue(alert.count)}.`
                                      : ' No current spike detected.'}
                                </p>
                              </div>
                            ))}
                          </div>
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
                          <div>
                            <h3 className="text-[12px] font-medium text-white tracking-wide">Your Notifications</h3>
                            <p className="text-[10px] font-sans font-bold text-white/25 uppercase tracking-tight mt-1">
                              User-scoped activity
                            </p>
                          </div>
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
                                <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">No recent notifications</p>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                {displayNotifications.slice(0, 15).map((notification) => {
                                  const isUnread = notification.status !== 'read';
                                  const notificationDate = new Date(notification.created_at);
                                  const isValidDate = notificationDate instanceof Date && !isNaN(notificationDate.getTime());
                                  const timeAgo = isValidDate
                                    ? formatDistanceToNow(notificationDate, { addSuffix: true })
                                    : 'time unavailable';
                                  const typeLabel = (notification.type || 'notification').replace(/_/g, ' ');
                                  const notificationLabel = stripEmojis(notification.title) || 'Notification';

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
                                                {notificationLabel}
                                              </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className={cn(
                                                  "text-[9px] font-mono font-bold",
                                                  isUnread ? "text-white/45" : "text-white/10"
                                                )}>
                                                  {typeLabel}
                                                </span>
                                                <span className="text-white/5 h-2 w-[1px] bg-white/10" />
                                                <span className="text-[9px] text-white/10 font-mono uppercase">
                                                  {notification.id.substring(0, 8).toUpperCase()}
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
                              All Notifications
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
                  {/* Issues Found View */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative p-8">
                    <div className="flex items-start justify-between gap-8 mb-8">
                      <div className="flex items-center gap-4">
                        <div>
                          <h2 className="text-[12px] font-sans font-semibold text-white/45 tracking-tight uppercase">Issues Found</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base font-sans font-semibold text-white tracking-tight">Recent findings</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-sans font-medium text-white/40 tracking-tight uppercase">Issues found</span>
                            <span className="text-xl font-sans font-semibold text-white leading-none mt-1.5">
                              {detectedOpportunitiesCount}
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="flex flex-col transition-colors text-left hover:text-white"
                          >
                            <span className="text-[10px] font-sans font-medium text-white/40 tracking-tight uppercase">Claims</span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xl font-sans font-semibold text-white leading-none">
                                {filedClaimsCount}
                              </span>
                              <ArrowRight className="h-3 w-3 text-white/25" />
                            </div>
                          </button>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-sans font-medium text-white/40 tracking-tight uppercase">Verified recovered</span>
                            <span className="text-xl font-sans font-semibold text-white leading-none mt-1.5">
                              {dashboardSummary
                                ? formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)
                                : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingDetections ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
                        <span className="text-[11px] font-sans font-medium text-white/35 tracking-tight animate-pulse">Loading findings...</span>
                      </div>
                    ) : visibleDetectionResults.length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                          <Files className="h-6 w-6 text-white/40" />
                        </div>
                        <h3 className="text-lg font-sans font-semibold text-white tracking-tight">No open issues right now</h3>
                        <p className="text-[13px] text-white/45 mt-3 font-sans max-w-sm mx-auto leading-relaxed">
                          Margin is not holding any unresolved findings in this view right now.
                        </p>
                        <button
                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                          className="mt-8 flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all rounded-lg group"
                        >
                          <span className="text-[11px] font-sans font-medium text-white/80 tracking-tight">
                            View {filedClaimsCount} filed {filedClaimsCount === 1 ? 'case' : 'cases'}
                          </span>
                          <ArrowRight className="h-3 w-3 text-white/35 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex items-center justify-end mb-4 gap-4">
                          <Button
                            onClick={handleBatchExport}
                            disabled={isExporting}
                            className={`h-9 px-4 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white border border-white/10 text-[11px] font-sans font-medium tracking-tight transition-all rounded-md ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isExporting ? (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-2" />
                            )}
                            Export findings
                          </Button>
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                            <span className="text-[11px] font-sans font-medium text-white/45 tracking-tight">Show processed</span>
                            <button
                              onClick={() => setShowProcessed(!showProcessed)}
                              className={cn(
                                "w-8 h-4 rounded-full relative transition-colors duration-300",
                                showProcessed ? "bg-white/35" : "bg-white/10"
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
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight">Issue</th>
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight">Found on</th>
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight text-right">Estimated value</th>
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight text-center">Confidence</th>
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight">Status</th>
                              <th className="pb-4 text-[10px] font-sans font-medium text-white/35 uppercase tracking-tight text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {visibleDetectionResults
                              .map((result) => {
                                const isProcessed = isProcessedFindingStatus(result.status);
                                return (
                                  <tr
                                    key={result.id}
                                    className={cn(
                                      "group transition-colors",
                                      isProcessed ? "opacity-40 grayscale" : "hover:bg-white/[0.02]"
                                    )}
                                  >
                                    <td className="py-5">
                                      <div className="flex flex-col">
                                        <span className="text-[13px] font-sans font-semibold text-white tracking-tight">
                                          {formatIssueTypeLabel(result.anomaly_type)}
                                        </span>
                                        <span className="text-[11px] font-sans font-medium text-white/30 tracking-tight mt-1">
                                          Ref {result.id?.substring(0, 8) || 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-5 text-[12px] font-sans font-medium text-white/55 tracking-tight">
                                      {result.discovery_date
                                        ? new Date(result.discovery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'N/A'
                                      }
                                    </td>
                                    <td className="py-5 text-[13px] font-sans font-semibold text-white text-right tracking-tight">
                                      {formatCurrencyWithSelection(result.estimated_value, result.currency || 'USD')}
                                    </td>
                                    <td className="py-5">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-12 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-white/55"
                                            style={{ width: `${(result.confidence_score || 0) * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-[11px] font-sans font-medium text-white/45 tracking-tight">
                                          {((result.confidence_score || 0) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-5">
                                      <div className="flex gap-2">
                                        <span className={cn(
                                          "px-2.5 py-1 rounded-full text-[10px] font-sans font-medium tracking-tight",
                                          isProcessed ? "bg-white/5 text-white/40 border border-white/10" :
                                            result.status === 'detected' || result.status === 'pending' ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" :
                                              "bg-white/5 text-white/65 border border-white/10"
                                        )}>
                                          {formatIssueStatusLabel(result.status)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-5 text-right">
                                      {isProcessed ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                                          className="h-8 px-3 text-[11px] font-sans font-medium text-white/45 hover:text-white hover:bg-white/[0.04] pointer-events-auto tracking-tight"
                                        >
                                          View case
                                        </Button>
                                      ) : (
                                        <div className="flex items-center justify-end gap-4">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-3 text-[11px] font-sans font-medium text-white/55 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all tracking-tight"
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
                                            Open recovery
                                          </Button>

                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-white/25 hover:text-white hover:bg-white/[0.04] transition-all rounded-md border border-transparent hover:border-white/10"
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
                                                className="text-[11px] font-sans font-medium tracking-tight text-white/65 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer py-2"
                                              >
                                                <Download className="h-3 w-3 mr-2" />
                                                Download evidence
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
                              <div className="h-1 w-1 rounded-full bg-white/40" />
                              <span className="text-[10px] font-sans font-medium text-white/35 tracking-tight">
                                Open issues loaded: <span className="text-white/55">{visibleDetectionResults.length}</span>
                              </span>
                            </div>
                            <span className="text-white/10">|</span>
                            <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-white/35 tracking-tight">
                              Last updated: <span className="text-white/55">{formattedLastUpdated}</span>
                            </div>
                            <span className="text-white/10">|</span>
                            <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-white/35 tracking-tight">
                              Scope: <span className="text-white/55">Account summary</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-white tracking-tight">
                            Showing current findings and review status
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
        <DialogContent className="w-[min(94vw,920px)] max-w-4xl bg-[#0c0c0c] border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-3xl rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/5 bg-white/[0.01]">
            <DialogTitle className="text-base font-serif text-white tracking-tight">
              Quick Notices
            </DialogTitle>
            <DialogDescription className="text-[10px] text-white/35 font-mono mt-0.5 uppercase tracking-tight">
              Platform Updates
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
            <p className="text-[12px] text-white/46 leading-relaxed font-serif">
              Here is what is live now and what is coming next across the platform.
            </p>
            <div className="mt-3 divide-y divide-white/6">
              <div className="grid grid-cols-1 gap-1 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
                <h3 className="text-[12px] font-mono font-bold uppercase tracking-tight text-white">
                  Auto-Filing
                </h3>
                <p className="text-[12px] text-white/58 leading-relaxed font-serif">
                  Auto-filing is live. Filing-ready claims are being submitted through Amazon Seller Central. Some cases may take a little longer while Amazon moves through each support step, but submissions are active.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
                <h3 className="text-[12px] font-mono font-bold uppercase tracking-tight text-white">
                  Recoveries
                </h3>
                <p className="text-[12px] text-white/58 leading-relaxed font-serif">
                  Recovery tracking is active on submitted cases. Payout verification is running, and accuracy is improving as more live recoveries move through the system.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1 py-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
                <h3 className="text-[12px] font-mono font-bold uppercase tracking-tight text-white">
                  Reopen Cases (Appeals)
                </h3>
                <p className="text-[12px] text-white/58 leading-relaxed font-serif">
                  Appeals will turn on automatically once enough case outcomes are collected. This lets Margin reopen cases with stronger evidence and more confidence.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-white/40 leading-relaxed font-serif">
              You do not need to do anything. We will keep improving filing speed, recovery tracking, and appeal quality as more live cases are processed.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <button
              onClick={() => setQuickNoticeOpen(false)}
              className="px-4 py-1.5 text-[10px] font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all uppercase tracking-tight rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]"
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
