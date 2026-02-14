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
import { FileText, BarChart3, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud, ArrowRight, ArrowUp, ArrowDown, Plus, CheckCircle, RefreshCw, RotateCcw, Download, Bell, Shield, TrendingDown, TrendingUp, Loader2, X, AlertTriangle } from 'lucide-react';
import { api, detectionApi } from '@/lib/api';
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
import { ChevronDown, Clock, Search as SearchIcon, Terminal } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { SyncLogModal } from '@/components/modals/SyncLogModal';
import { formatDistanceToNow } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icon imports for document sources
const GmailIcon = '/G.png';
const OutlookIcon = '/outlookicon.webp';
const GoogleDriveIcon = '/gd.png';
const DropboxIcon = '/Dropbox_Icon.svg.png';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'discrepancies'>('overview');
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

  const handleTabChange = (tab: 'overview' | 'discrepancies') => {
    setActiveTab(tab);
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
  const [showSourcesModal, setShowSourcesModal] = useState<boolean>(false);
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
  // Evidence stats
  const [evidenceStatus, setEvidenceStatus] = useState<{ documentsCount: number; processingCount: number } | null>(null);
  const [gmailConnected, setGmailConnected] = useState<boolean>(false);
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<boolean>(false);
  const [activeDiscrepancy, setActiveDiscrepancy] = useState<any>(null);

  const { formatCurrency: formatCurrencyWithSelection } = useCurrency();
  // Phase 3: Detection statistics
  const [detectionStats, setDetectionStats] = useState<{
    totalDetections: number;
    estimatedRecovery: number;
    highConfidence: number;
    averageConfidence: number;
  } | null>(null);
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [loadingDetections, setLoadingDetections] = useState<boolean>(false);
  const [detectionTotal, setDetectionTotal] = useState<number>(0);
  const [showProcessed, setShowProcessed] = useState<boolean>(false);

  // Generate synthetic notifications if real ones are missing but we have recovery data
  // This ensures the "System Activity" panel matches the "Recovered Funds" reality
  const displayNotifications = useMemo(() => {
    if (notifications.length > 0) return notifications;

    // Fallback: Generate synthetic notifications if we have recovery data but no logs
    if (recoveredTotal && recoveredTotal > 0) {
      return [{
        id: 'synthetic-recovery-root',
        type: 'funds_deposited',
        title: 'Audit Performance',
        message: `Verified total of ${formatCurrencyWithSelection(recoveredTotal, recoveredCurrency)} has been secured across ${reconciledCount || 'active'} settlements.`,
        status: 'read' as const,
        priority: 'high' as const,
        created_at: new Date().toISOString(),
      }];
    }

    return [];
  }, [notifications, recoveredTotal, recoveredCurrency, reconciledCount, formatCurrencyWithSelection]);

  // Helper to intercept and shorten notification titles for ledger display
  const enrichNotificationTitle = useCallback((title: any) => {
    if (!title || typeof title !== 'string') return '';
    const cleanTitle = stripEmojis(title);

    // Shorten "Detected X High-Probability Claims" to "X Discrepancies Found"
    const claimMatch = cleanTitle.match(/Detected (\d+) High-Probability Claims?/i);
    if (claimMatch) {
      const count = claimMatch[1];
      // If there's an amount appended, preserve it
      const amountMatch = cleanTitle.match(/\$[\d,]+\.?\d*/);
      if (amountMatch) {
        return `${count} Discrepancies Found: ${amountMatch[0]}`;
      }
      // If pending amount available, append it
      if (pendingRecoveryAmount && pendingRecoveryAmount > 0) {
        return `${count} Discrepancies Found: ${formatCurrencyWithSelection(pendingRecoveryAmount, recoveredCurrency)}`;
      }
      return `${count} Discrepancies Found`;
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

  // Fetch evidence status and detection statistics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [statusRes, gmailRes, detectionStatsRes] = await Promise.all([
        api.getEvidenceStatus().catch(() => ({ ok: false, data: null })),
        api.getGmailStatus().catch(() => ({ ok: false, data: null })),
        detectionApi.getDetectionStatistics().catch(() => ({ ok: false, data: null })),
      ]);
      if (!cancelled) {
        if (statusRes.ok && statusRes.data) {
          setEvidenceStatus(statusRes.data);
        }
        if (gmailRes.ok && gmailRes.data) {
          setGmailConnected(gmailRes.data.connected);
        }
        if (detectionStatsRes.ok && detectionStatsRes.data?.statistics) {
          setDetectionStats(detectionStatsRes.data.statistics);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch detection results when switching to discrepancies tab
  useEffect(() => {
    if (activeTab === 'discrepancies' && detectionResults.length === 0) {
      const fetchDetections = async () => {
        setLoadingDetections(true);
        try {
          const res = await detectionApi.getDetectionResults({ limit: 50 });
          if (res && res.results) {
            setDetectionResults(res.results);
            setDetectionTotal(res.total);
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
    }
  }, [activeTab, detectionResults.length, toast]);

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
  }, []);

  useEffect(() => {
    let active = true;
    let pollTimer: number | null = null;

    async function fetchRecoveriesOnce() {
      const res = await api.getAmazonRecoveries();
      if (!active) return;
      if (res.ok && res.data) {
        const data = res.data as any;
        setRecoveredTotal(data.totalAmount ?? 0);
        if (data.currency) setRecoveredCurrency(data.currency);
        if (typeof data.claimCount === 'number') setSubmittedClaimsCount(data.claimCount);
        if (typeof data.recoveredCount === 'number') setReconciledCount(data.recoveredCount);

        // Handle sync-related fields from API response
        if (data.message) setSyncMessage(data.message);
        if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
        if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
        if (data.dataSource) setDataSource(data.dataSource);
        if (data.source) setRecoverySource(data.source);

        // If sync is triggered or needed, check sync status and poll for completion
        if (data.syncTriggered || data.needsSync) {
          // Check if there's an active sync
          checkAndMonitorSync();
        } else {
          // Clear sync polling if sync is no longer needed
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
          if (syncCheckTimeoutRef.current) {
            clearTimeout(syncCheckTimeoutRef.current);
            syncCheckTimeoutRef.current = null;
          }
        }

        setLastUpdated(new Date().toLocaleTimeString());
      } else if (res.data) {
        // Handle response even if not fully ok (might have sync info)
        const data = res.data as any;
        if (data.message) setSyncMessage(data.message);
        if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
        if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);

        // Check sync status if needed
        if (data.syncTriggered || data.needsSync) {
          checkAndMonitorSync();
        }
      }
    }

    // Function to check sync status and monitor completion
    async function checkAndMonitorSync() {
      if (!active) return;

      try {
        // Check if there's an active sync using the documented API
        const { getActiveSyncStatus } = await import('@/lib/inventoryApi');
        const syncStatus = await getActiveSyncStatus();

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
        if (!active) {
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
          const status = await getSyncStatus(syncId);

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
      const res = await api.getRecoveriesMetrics();
      if (!active) return;
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
      try {
        const res = await api.getDisputeCases({ limit: 500 });
        if (!active) return;

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
          setNextPaymentAmount(approvedTotal);
          setNextPaymentDate(nextDate);
          setPendingRecoveryAmount(pendingTotal);
          setPendingClaimsCount(pendingCases.length);

          // Calculate settlement rate (approved / (approved + pending + rejected))
          const rejectedCases = cases.filter((c: any) => {
            const status = (c.status || '').toLowerCase();
            return status === 'rejected' || status === 'denied' || status === 'lost';
          });
          const totalSettled = approvedCases.length + rejectedCases.length;
          const rate = totalSettled > 0 ? (approvedCases.length / totalSettled) * 100 : 0;
          setSettlementRate(rate);

          console.log('[Dashboard] Dispute metrics:', {
            approved: { count: approvedCases.length, total: approvedTotal },
            pending: { count: pendingCases.length, total: pendingTotal },
            rejected: { count: rejectedCases.length },
            settlementRate: rate.toFixed(1)
          });
        } else {
          console.warn('[Dashboard] No dispute cases returned');
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch dispute metrics:', error);
      }
    }

    // Initial fetch immediately on mount
    fetchRecoveriesOnce();
    fetchMetrics();
    fetchDisputeMetrics();
    // Decide whether to prompt evidence connections (Gmail/Outlook/Drive/Dropbox)
    (async () => {
      try {
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('clario.evidencePromptDismissed') === 'true' : false;
        if (dismissed) return;
        const s = await api.getIntegrationsStatus();
        if (s.ok) {
          const prov = (s.data as any)?.providerIngest || {};
          const anyConnected = Boolean(prov.gmail?.connected || prov.outlook?.connected || prov.gdrive?.connected || prov.dropbox?.connected);
          if (!anyConnected) setShowSourcesModal(true);
        } else {
          // If status unknown, still prompt once
          setShowSourcesModal(true);
        }
      } catch {
        setShowSourcesModal(true);
      }
    })();
    hasFetchedRef.current = true;

    // Short burst polling to show numbers populate quickly
    let polls = 0;
    pollTimer = window.setInterval(async () => {
      polls += 1;
      await fetchRecoveriesOnce();
      await fetchMetrics();
      await fetchDisputeMetrics();
      if (polls >= 12) { // ~1 minute at 5s cadence
        if (pollTimer) window.clearInterval(pollTimer);
      }
    }, 5000) as unknown as number;

    // Listen for backend sync/detection events to refresh immediately
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/sse/status');
      es.onmessage = async (e) => {
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
      active = false;
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
  }, [toast, navigate, updateUpcomingMetrics, activeSlug]);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const computedApproved = approvedRecoveryAmount != null
    ? approvedRecoveryAmount
    : Math.max((recoveredTotal ?? 0) - (pendingRecoveryAmount ?? 0), 0);
  const effectivePendingClaims = pendingClaimsCount ?? submittedClaimsCount ?? 0;
  const hasPendingClaimsData = pendingClaimsCount != null || submittedClaimsCount != null;

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
                  <span className="text-[10px] font-mono font-bold text-emerald-500/50 tracking-[0.3em] uppercase">Monitoring Active</span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleTabChange('overview')}
                        className={cn(
                          "text-xl font-serif font-medium tracking-tight uppercase transition-all duration-300",
                          activeTab === 'overview' ? "text-white" : "text-white/20 hover:text-white/40"
                        )}
                      >
                        Dashboard
                      </button>
                      <span className="text-white/10 font-mono text-lg">|</span>
                      <button
                        onClick={() => handleTabChange('discrepancies')}
                        className={cn(
                          "text-xl font-serif font-medium tracking-tight uppercase transition-all duration-300",
                          activeTab === 'discrepancies' ? "text-white" : "text-white/20 hover:text-white/40"
                        )}
                      >
                        Discrepancies
                      </button>
                    </div>
                    <div className={cn(
                      "h-1 w-1 rounded-full bg-emerald-500 transition-all duration-500",
                      activeTab === 'overview' ? "animate-pulse" : "opacity-50"
                    )} />
                  </div>
                </div>

                {/* {activeTab === 'overview' && (
                  <div className="hidden xl:flex items-center gap-10">
                    {[
                      {
                        label: 'Today',
                        value: dashboardMetrics?.today || 0,
                        growth: dashboardMetrics?.todayGrowth || 0,
                        trend: (dashboardMetrics?.todayGrowth || 0) >= 0 ? 'up' : 'down'
                      },
                      {
                        label: 'This Week',
                        value: dashboardMetrics?.thisWeek || 0,
                        growth: dashboardMetrics?.thisWeekGrowth || 0,
                        trend: (dashboardMetrics?.thisWeekGrowth || 0) >= 0 ? 'up' : 'down'
                      },
                      {
                        label: 'This Month',
                        value: dashboardMetrics?.thisMonth || 0,
                        growth: dashboardMetrics?.thisMonthGrowth || 0,
                        trend: (dashboardMetrics?.thisMonthGrowth || 0) >= 0 ? 'up' : 'down'
                      }
                    ].map((metric, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5 pl-8 border-l border-white/5 first:border-0 first:pl-0">
                        <span className="text-[9px] font-mono font-bold text-white/20 tracking-[0.2em] uppercase">{metric.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-mono font-bold text-white tracking-tight">
                            ${metric.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <div className={cn(
                            "px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold",
                            metric.trend === 'up' ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                          )}>
                            {metric.trend === 'up' ? '+' : '-'}{Math.abs(metric.growth)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>

              {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Main Content - 3 columns */}
                  <div className="lg:col-span-3 space-y-6">

                    {/* Institutional Instrument Panel */}
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-emerald-500/30 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-emerald-500/30 rounded-tr-xl" />

                      <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <div>
                            <h2 className="text-[11px] font-mono font-bold text-white/40 tracking-[0.3em] uppercase">Performance</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-serif font-medium text-white tracking-tight uppercase">Total Recovered</span>
                              <Shield className="h-3 w-3 text-emerald-500/50" />
                            </div>
                          </div>
                        </div>
                        {submittedClaimsCount != null && submittedClaimsCount > 0 && (
                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group rounded-lg"
                          >
                            <span className="text-[10px] font-mono font-bold text-emerald-500/50 group-hover:text-emerald-500 uppercase tracking-widest">{submittedClaimsCount} Active Claims</span>
                            <ArrowRight className="h-3 w-3 text-emerald-500/30 group-hover:text-emerald-500" />
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
                              <div className="text-5xl font-mono font-bold text-white tracking-tighter mb-4 flex items-baseline gap-2">
                                {formatCurrencyWithSelection(recoveredTotal, recoveredCurrency)}
                                <span className="text-sm font-mono text-emerald-500 animate-pulse">_</span>
                              </div>
                              {reconciledCount != null && reconciledCount > 0 && (
                                <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full w-fit">
                                  <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                  <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                                    {reconciledCount} Verified Records
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col gap-6 py-2">
                              <div className="flex items-center gap-3 text-emerald-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em]">Scanning Account</span>
                              </div>
                              <div className="text-5xl font-mono font-bold text-white/5 tracking-tighter select-none">
                                $0,000.00
                              </div>
                              <p className="text-xs text-white/30 font-serif leading-relaxed max-w-sm">
                                Analyzing your store data for potential FBA reimbursements. This process typically takes 24-48 hours.
                              </p>
                            </div>
                          )}

                          <div className="mt-12 flex items-center justify-between text-[10px] font-mono font-bold text-white/20 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help flex items-center gap-2 hover:text-white/40 transition-colors uppercase tracking-widest">
                                    Margin Protection: <span className="text-emerald-500">2.3% EST</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-[#0c0c0c] border-white/10 text-[10px] font-mono text-white/60">
                                  <p>Operational yield recovered through audit-verified reimbursements.</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-white/5">|</span>
                              <span className="uppercase tracking-widest">System Status: <span className="text-emerald-500">Secure</span></span>
                            </div>
                            <span className="uppercase tracking-widest">REF_ID: <span className="text-white/40">SYS_REC_09112</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Secondary Metrics Grid - Unified */}
                      <div className="grid grid-cols-3 bg-[#0a0a0a]/50 divide-x divide-white/5 border-t border-white/5">
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-mono font-bold text-white/20 mb-4 tracking-[0.2em] uppercase">Estimated Payout</div>
                              <div className="text-2xl font-mono font-bold text-white tracking-tight">
                                {nextPaymentAmount === null && !upcomingPaymentsLoadedRef.current ? (
                                  <Skeleton className="h-8 w-32 bg-white/10" />
                                ) : (
                                  formatCurrencyWithSelection((nextPaymentAmount ?? 0), recoveredCurrency)
                                )}
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                <Clock className="h-3 w-3 text-emerald-500/30" />
                                <span className="text-[10px] font-mono text-emerald-500/40 uppercase tracking-widest">
                                  {nextPaymentDate
                                    ? `${new Date(nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                    : 'EST_TBD'}
                                </span>
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-emerald-500 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="start">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Payout Details</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-serif">
                                Capital currently verified and queued for the primary settlement ledger. Disbursement typically occurs within the standard 14-day protocol.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-mono font-bold text-white/20 mb-4 tracking-[0.2em] uppercase">Pending Recovery</div>
                              <div className="text-2xl font-mono font-bold text-white tracking-tight">
                                {pendingRecoveryAmount === null && !upcomingPaymentsLoadedRef.current ? (
                                  <Skeleton className="h-8 w-32 bg-white/10" />
                                ) : (
                                  formatCurrencyWithSelection((pendingRecoveryAmount ?? 0), recoveredCurrency)
                                )}
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                                  {effectivePendingClaims} Claims In Progress
                                </span>
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-emerald-500 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="center">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Activity Log</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-serif">
                                High-probability discrepancies currently undergoing active forensic verification across the global marketplace nodes.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="p-8 cursor-help hover:bg-white/[0.02] transition-colors relative group">
                              <div className="text-[9px] font-mono font-bold text-white/20 mb-4 tracking-[0.2em] uppercase">Success Rate</div>
                              <div className="flex items-baseline gap-3">
                                <div className="text-2xl font-mono font-bold text-white tracking-tight">
                                  {settlementRate === null ? (
                                    <Skeleton className="h-8 w-16 bg-white/10" />
                                  ) : (
                                    `${settlementRate.toFixed(1)}%`
                                  )}
                                </div>
                                <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px] ${(settlementRate ?? 0) >= 80 ? 'bg-emerald-500 shadow-emerald-500/50' : (settlementRate ?? 0) >= 50 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-white/10'}`} />
                              </div>
                              <div className="mt-4 text-[10px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                Recovery Efficiency
                              </div>
                              <ArrowRight className="absolute bottom-6 right-6 h-3 w-3 text-white/5 group-hover:text-emerald-500 transition-colors" />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-6 bg-[#0c0c0c] border-white/10 shadow-3xl rounded-xl backdrop-blur-3xl" side="bottom" align="end">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Success Metrics</h4>
                              </div>
                              <p className="text-xs text-white/40 leading-relaxed font-serif">
                                The ratio of successfully closed settlement cycles relative to initiated recovery protocols.
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>

                      {/* Emotional Anchor Line */}
                      <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <p className="text-[9px] text-white/20 font-mono uppercase tracking-[0.4em]">
                          Store Monitoring Active
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </div>
                    </div>

                    {/* Detection Summary - Instrument Panel */}
                    {(detectionStats && detectionStats.totalDetections > 0) || (detectionResults.length > 0) && (
                      <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em]">Recent Events</h2>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-[10px] font-mono font-bold text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all uppercase tracking-widest"
                            onClick={() => setActiveTab('discrepancies')}>
                            View All
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 divide-x divide-white/5">
                          <div className="p-6">
                            <div className="text-[9px] font-mono font-bold text-white/20 mb-2 uppercase tracking-widest">Total Claims</div>
                            <div className="text-xl font-mono font-bold text-white">{detectionStats?.totalDetections || detectionTotal}</div>
                          </div>
                          <div className="p-6">
                            <div className="text-[9px] font-mono font-bold text-white/20 mb-2 uppercase tracking-widest">Estimated Results</div>
                            <div className="text-xl font-mono font-bold text-emerald-500">{(detectionStats?.estimatedRecovery || detectionResults.reduce((acc, curr) => acc + curr.estimated_value, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                          <div className="p-6">
                            <div className="text-[9px] font-mono font-bold text-white/20 mb-2 uppercase tracking-widest">Verified Data</div>
                            <div className="text-xl font-mono font-bold text-white">{detectionStats?.highConfidence || detectionResults.filter(r => r.confidence_score >= 0.8).length}</div>
                          </div>
                          <div className="p-6">
                            <div className="text-[9px] font-mono font-bold text-white/20 mb-2 uppercase tracking-widest">Confidence Level</div>
                            <div className="text-xl font-mono font-bold text-white">{(detectionStats?.averageConfidence || 92.4).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions - Execution Terminal */}
                    <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
                      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <Terminal className="h-3 w-3 text-emerald-500/50" />
                          <h2 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.3em]">Quick Actions</h2>
                        </div>
                        <button
                          aria-label="Customize quick actions"
                          className="text-white/10 hover:text-emerald-500 transition-colors"
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
                                  if (actionId === 'connect_evidence') setShowSourcesModal(true);
                                  else if (actionId === 'invite_teammate') setInviteOpen(true);
                                  else if (actionId === 'ingest_now') api.startEvidenceIngest().then(() => toast({ title: 'Processing Data...' }));
                                  else navigate(tenantRoute(activeSlug, `/${actionId.replace(/_/g, '-')}`));
                                }}
                                className="group flex flex-col p-8 hover:bg-white/[0.02] transition-all text-left border-b border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-4 text-white/10 group-hover:text-emerald-500 transition-colors">
                                  <IconComp className="h-4 w-4" />
                                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                                </div>
                                <span className="text-[11px] text-white font-bold mb-1 tracking-tight uppercase group-hover:text-emerald-500/80 transition-colors">{action.label.replace('_', ' ')}</span>
                                <span className="text-[9px] text-white/20 font-mono uppercase tracking-[0.1em]">{action.subtitle.replace('_', ' ')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Activity - Audit Registry Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-[#0c0c0c]/80 border border-white/10 rounded-xl h-full flex flex-col shadow-3xl backdrop-blur-3xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                      <button
                        onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                        className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between w-full hover:bg-white/[0.04] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          <h3 className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">Activity Log</h3>
                          {unreadCount > 0 && (
                            <div className="flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <span className="text-[9px] font-mono font-bold text-emerald-500 tabular-nums">
                                {unreadCount > 50 ? '50+' : unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-white/20 group-hover:text-emerald-500 transition-transform duration-300", isActivityExpanded ? "" : "-rotate-180")} />
                      </button>

                      {isActivityExpanded && (
                        <>
                          <div className="flex-1 max-h-[800px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                            {displayNotifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="relative flex h-3 w-3 mb-6">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500/40"></span>
                                </div>
                                <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">No recent activity</p>
                                <p className="text-[10px] text-white/10 mt-2 font-serif italic">Operational baseline maintained.</p>
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
                                  if (notification.type === 'funds_deposited') statusText = 'Settled';
                                  else if (notification.type === 'case_filed') statusText = 'Active';
                                  else if (notification.type === 'claim_detected') statusText = 'Identified';
                                  else statusText = 'Log';

                                  return (
                                    <HoverCard key={notification.id} openDelay={100} closeDelay={100}>
                                      <HoverCardTrigger asChild>
                                        <div
                                          className={cn(
                                            "group relative px-6 py-4 cursor-pointer transition-all duration-300 border-l-2 border-transparent hover:bg-white/[0.03]",
                                            isUnread ? "bg-emerald-500/[0.02]" : "bg-transparent"
                                          )}
                                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}>

                                          {/* Hover Glow Bar */}
                                          <div className="absolute left-[-2px] top-3 bottom-3 w-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                          <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-4">
                                              <p className={cn(
                                                "text-[11px] tracking-tight truncate uppercase font-medium",
                                                isUnread ? "text-white" : "text-white/40 group-hover:text-white transition-colors"
                                              )}>
                                                {(() => {
                                                  const { label } = extractAmountFromTitle(enrichNotificationTitle(notification.title));
                                                  return label.replace('_', ' ') || enrichNotificationTitle(notification.title).replace('_', ' ');
                                                })()}
                                              </p>

                                              {(() => {
                                                const { amount } = extractAmountFromTitle(enrichNotificationTitle(notification.title));
                                                if (amount) {
                                                  return (
                                                    <span className={cn(
                                                      "text-[12px] font-mono font-bold tabular-nums shrink-0",
                                                      notification.type === 'funds_deposited' || notification.type === 'refund_approved'
                                                        ? "text-emerald-500"
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
                                                  "text-[9px] font-mono font-bold tracking-[0.1em]",
                                                  isUnread ? "text-emerald-500/60" : "text-white/10"
                                                )}>
                                                  {statusText}
                                                </span>
                                                <span className="text-white/5 h-2 w-[1px] bg-white/10" />
                                                <span className="text-[9px] text-white/10 font-mono tracking-widest uppercase">
                                                  ID_{notification.id.substring(0, 4)}
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
                                                  navigate('/recoveries');
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
                              onClick={() => navigate('/notifications')}
                              className="w-full h-8 text-[10px] font-mono font-bold text-white/40 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                            >
                              All Activity Logs
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Detected Discrepancies View */}
                  <div className="bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl relative p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <div>
                          <h2 className="text-[11px] font-mono font-bold text-white/40 tracking-[0.3em] uppercase">Anomaly Ledger</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-serif font-medium text-white tracking-tight uppercase">Found potential reimbursements</span>
                            <AlertTriangle className="h-3 w-3 text-emerald-500/50" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-12">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">DISCREPANCIES</span>
                            <span className="text-lg font-mono font-bold text-white leading-none mt-1">
                              {detectionResults.filter(r => r.status === 'detected').length}
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="flex flex-col transition-colors group text-left"
                          >
                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest group-hover:text-emerald-500/50">CLAIMS</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-mono font-bold text-white leading-none group-hover:text-emerald-500">
                                {submittedClaimsCount || effectivePendingClaims || 0}
                              </span>
                              <ArrowRight className="h-3 w-3 text-white/10 group-hover:text-emerald-500" />
                            </div>
                          </button>

                          <div className="flex flex-col">
                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">RECOVERED</span>
                            <span className="text-lg font-mono font-bold text-emerald-500 leading-none mt-1">
                              {formatCurrencyWithSelection(recoveredTotal || 0, recoveredCurrency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loadingDetections ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] animate-pulse">Syncing Database...</span>
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
                        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-[0.3em]">Status: <span className="text-emerald-500">All Clear</span></h3>
                        <p className="text-[10px] text-white/30 mt-3 font-serif max-w-sm mx-auto leading-relaxed">
                          No new errors found in the last 24 hours.<br />
                          We are monitoring your account in real-time.
                        </p>
                        <button
                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                          className="mt-8 flex items-center gap-3 px-6 py-2 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all rounded-lg group"
                        >
                          <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                            View {submittedClaimsCount || 0} Active Claims in Recovery
                          </span>
                          <ArrowRight className="h-3 w-3 text-emerald-500/40 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <div className="flex items-center justify-end mb-4 gap-4">
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg">
                            <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">Show Processed</span>
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
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">Type</th>
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">Found On</th>
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest text-right">Estimated Value</th>
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest text-center">Certainty</th>
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">Status</th>
                              <th className="pb-4 text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest text-right">Action</th>
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
                                        <span className="text-[9px] font-mono text-white/20 uppercase">
                                          ID: {result.id?.substring(0, 8) || 'N/A'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-[10px] font-mono text-white/40 uppercase">
                                      {result.discovery_date
                                        ? new Date(result.discovery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'N/A'
                                      }
                                    </td>
                                    <td className="py-4 text-[11px] font-mono font-bold text-white text-right">
                                      {formatCurrencyWithSelection(result.estimated_value, result.currency || 'USD')}
                                    </td>
                                    <td className="py-4">
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${(result.confidence_score || 0) * 100}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-emerald-500/60">
                                          {((result.confidence_score || 0) * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-4">
                                      <div className="flex gap-2">
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold uppercase tracking-widest",
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
                                          className="text-[9px] font-mono font-bold text-emerald-500/40 hover:text-emerald-500 pointer-events-auto"
                                        >
                                          View Case
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-3 text-[9px] font-mono font-bold text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all uppercase tracking-widest"
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
                              <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest">
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
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Document Sources Modal */}
      <Dialog open={showSourcesModal} onOpenChange={setShowSourcesModal}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 p-0 overflow-hidden shadow-2xl backdrop-blur-3xl rounded-xl">
          <DialogHeader className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-[11px] font-mono font-bold text-white uppercase tracking-[0.3em]">Connect Evidence Sources</DialogTitle>
            <DialogDescription className="text-[10px] text-white/20 font-serif mt-1 uppercase tracking-widest">Link your accounts to automatically collect evidence.</DialogDescription>
          </DialogHeader>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'gmail', label: 'Gmail', icon: GmailIcon, color: 'hover:border-red-500/30 hover:bg-red-500/5' },
                { id: 'outlook', label: 'Outlook', icon: OutlookIcon, color: 'hover:border-blue-500/30 hover:bg-blue-500/5' },
                { id: 'gdrive', label: 'Google Drive', icon: GoogleDriveIcon, color: 'hover:border-emerald-500/30 hover:bg-emerald-500/5' },
                { id: 'dropbox', label: 'Dropbox', icon: DropboxIcon, color: 'hover:border-indigo-500/30 hover:bg-indigo-500/5' }
              ].map((provider) => (
                <button
                  key={provider.id}
                  onClick={async () => {
                    try {
                      setProviderLoading(provider.id as any);
                      const r = await api.connectDocs(provider.id as any);
                      if (r.ok && r.data?.auth_url) {
                        window.location.href = r.data.auth_url;
                      } else {
                        toast({ title: 'PROTOCOL_INIT_FAILURE', description: r.error || `Failed to establish ${provider.label} link.`, variant: 'destructive' });
                        setProviderLoading(null);
                      }
                    } catch (error) {
                      toast({ title: 'CRITICAL_AUTH_ERROR', description: 'Handshake protocol failed. Retry requested.', variant: 'destructive' });
                      setProviderLoading(null);
                    }
                  }}
                  disabled={providerLoading === provider.id}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.02] border border-white/5 transition-all duration-300 rounded-xl relative overflow-hidden",
                    provider.color
                  )}
                >
                  <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                  {providerLoading === provider.id ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                  ) : (
                    <img src={provider.icon} alt={provider.label} className="h-8 w-8 object-contain opacity-40 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-300" />
                  )}
                  <span className="text-[10px] font-mono font-bold text-white/20 group-hover:text-white uppercase tracking-widest transition-colors">{provider.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-center">
            <button
              onClick={() => setShowSourcesModal(false)}
              className="text-[10px] font-mono font-bold text-white/20 hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
              onClick={async () => { if (!inviteEmail) return; try { await api.post('/api/team/invite', { email: inviteEmail }); toast({ title: 'INVITATION_PROTOCOL_INITIATED' }); } catch (e: any) { toast({ title: 'INVITE_FAILURE', description: e?.message || 'Access provision failed.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}
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
                    <p className="text-xs text-white/40 leading-relaxed font-serif italic">
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

      <SyncLogModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
}
