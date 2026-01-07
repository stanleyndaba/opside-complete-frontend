import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, BarChart3, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud, ArrowRight, Plus, CheckCircle, RefreshCw, RotateCcw, Download, Bell, Shield, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
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
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { SyncLogModal } from '@/components/modals/SyncLogModal';
import { formatDistanceToNow } from 'date-fns';

// Icon imports for document sources
const GmailIcon = '/G.png';
const OutlookIcon = '/outlookicon.webp';
const GoogleDriveIcon = '/gd.png';
const DropboxIcon = '/Dropbox_Icon.svg.png';

// Helper to render bold text from "**text**" markdown
const renderNotificationMessage = (message: string) => {
  if (!message) return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-700">{part.slice(2, -2)}</strong>; // Darker and bold
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper to strip emojis from text
const stripEmojis = (text: string) => {
  if (!text) return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '').trim();
};

export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

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
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [approvedClaimsThisMonth, setApprovedClaimsThisMonth] = useState<number | null>(null);
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

  const { formatCurrency: formatCurrencyWithSelection } = useCurrency();
  // Phase 3: Detection statistics
  const [detectionStats, setDetectionStats] = useState<{
    totalDetections: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    estimatedRecovery: number;
    averageConfidence: number;
  } | null>(null);
  const [selectedQuickActions, setSelectedQuickActions] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clario.quickActions') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['ingest_now', 'invite_teammate'];
    } catch { return ['ingest_now', 'invite_teammate']; }
  });
  const QUICK_ACTIONS: Array<{ id: string; label: string }> = [
    { id: 'connect_evidence', label: 'Connect evidence sources' },
    { id: 'review_high_conf', label: 'Review high‑confidence cases' },
    { id: 'resolve_new', label: 'Resolve new opportunities' },
    { id: 'run_detector', label: 'Run detector' },
    { id: 'ingest_now', label: 'Ingest documents now' },
    { id: 'smart_sync', label: 'Smart Inventory Sync' },
    { id: 'upcoming_payments', label: 'Payment recoveries' },
    { id: 'export_history', label: 'Export recovery & payout history' },
    { id: 'evidence_locker', label: 'Doc Locker' },
    { id: 'invite_teammate', label: 'Invite a teammate' },
    { id: 'configure_alerts', label: 'Configure alerts' },
    { id: 'security_setup', label: 'Security quick setup' },
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
        navigate('/integrations-hub?amazon_connected=true', { replace: true });
      }, 2000);
    }
  }, [searchParams, navigate, toast]);

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
            await fetchUpcomingPayments();
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
            await fetchUpcomingPayments();
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
            await fetchUpcomingPayments();

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
        if (pending !== null && !upcomingPaymentsLoadedRef.current) setPendingRecoveryAmount(pending);
        if (rate !== null) setSuccessRate(rate);
        if (approved !== null) setApprovedRecoveryAmount(approved);
        if (nextPay !== null && !upcomingPaymentsLoadedRef.current) {
          setNextPaymentAmount(nextPay);
          setNextPaymentDate(null);
        }
        if (approvedClaimsMonth !== null) setApprovedClaimsThisMonth(approvedClaimsMonth);
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

          console.log('[Dashboard] Dispute metrics:', {
            approved: { count: approvedCases.length, total: approvedTotal },
            pending: { count: pendingCases.length, total: pendingTotal }
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
  }, [toast, navigate, updateUpcomingMetrics]);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-60';

  const computedApproved = approvedRecoveryAmount != null
    ? approvedRecoveryAmount
    : Math.max((recoveredTotal ?? 0) - (pendingRecoveryAmount ?? 0), 0);
  const effectivePendingClaims = pendingClaimsCount ?? submittedClaimsCount ?? 0;
  const hasPendingClaimsData = pendingClaimsCount != null || submittedClaimsCount != null;

  return (
    <div
      className="relative min-h-screen flex flex-col h-screen overflow-hidden bg-gray-50"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
      <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={'flex-1 transition-all duration-300 overflow-y-auto ' + mainClass}>
          <div className="relative pt-12">
            <div className="relative w-full max-w-full mx-auto px-8 py-8 text-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-medium text-gray-900 tracking-tight">Recovery Overview</h1>
                    <span className="text-gray-300 text-lg font-light">|</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-2 text-xs font-medium text-gray-900 tracking-tight outline-none hover:text-gray-600 transition-colors focus:outline-none">
                        Financial Data
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 bg-white border-gray-100 shadow-lg">
                        <DropdownMenuLabel className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">(Review)</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer">Agentic Matching</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Agentic Submission</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Agentic Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">Dashboard</p>
                </div>

                <div className="flex items-end gap-8">
                  {/* Month Banner Stats */}
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xl font-light text-gray-900 tracking-tight">$9,337.50</span>
                      <div className="flex items-center text-emerald-600 px-1.5 py-0.5">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        <span className="text-[10px] font-bold">12%</span>
                        <span className="text-[9px] text-emerald-600/70 ml-1 font-medium">vs last month</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1 font-medium">{new Date().toLocaleString('default', { month: 'long' })} Recoveries</p>
                  </div>

                  <div className="flex flex-col items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSyncModal(true)}
                      className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" />
                      Scan
                    </Button>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <p className="text-[9px] text-gray-500 font-medium">
                        Last scan {formatDistanceToNow(lastSyncTime || new Date(), { addSuffix: true })} • All systems healthy
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content - 3 columns */}
                <div className="lg:col-span-3 space-y-6">

                  {/* Primary Metric - Recovered Value */}
                  <div className="bg-white border border-gray-200 rounded-sm">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Total Recovered</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label="About recovered value"
                              className="w-3.5 h-3.5 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors"
                            >
                              <span className="text-white text-[8px] font-serif italic leading-none">i</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-900 text-white text-xs">
                            Total recovered profits from approved/completed claims. {recoverySource && `Source: ${recoverySource}`}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {submittedClaimsCount != null && submittedClaimsCount > 0 && (
                        <span className="text-[10px] text-gray-500">{submittedClaimsCount} claims submitted</span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="text-3xl font-light text-gray-900 tracking-tight">
                        {formatCurrencyWithSelection(recoveredTotal ?? 0, recoveredCurrency)}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Since connecting Margin</p>

                      {/* Sync status */}
                      {(syncMessage || needsSync || syncTriggered) && (
                        <div className={`mt-4 px-4 py-2.5 text-xs flex items-center justify-between ${syncTriggered ? 'bg-gray-50 text-gray-600 border border-gray-200'
                          : needsSync ? 'bg-gray-50 text-gray-600 border border-gray-200'
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                          <div className="flex items-center gap-2">
                            {syncTriggered && <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />}
                            <span>{syncMessage || (needsSync ? 'Syncing...' : '')}</span>
                          </div>
                          {activeSyncId && (
                            <button
                              onClick={() => navigate(`/sync?id=${activeSyncId}`)}
                              className="text-gray-600 hover:text-gray-900 underline text-xs"
                            >
                              View progress
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Next Payment</div>
                      <div className="text-xl font-light text-gray-900 tracking-tight">
                        {formatCurrencyWithSelection((nextPaymentAmount ?? 0), recoveredCurrency)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {nextPaymentDate
                          ? new Date(nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'No payout scheduled'}
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Pending</div>
                      <div className="text-xl font-light text-gray-900 tracking-tight">
                        {formatCurrencyWithSelection((pendingRecoveryAmount ?? 0), recoveredCurrency)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {effectivePendingClaims} claims
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Approved</div>
                      <div className="text-xl font-light text-gray-900 tracking-tight">
                        {formatCurrencyWithSelection(computedApproved ?? 0, recoveredCurrency)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <span className="text-emerald-600">92%</span>
                        <span>approval rate</span>
                      </div>
                    </div>
                  </div>

                  {/* Detection Summary - Minimal */}
                  {detectionStats && detectionStats.totalDetections > 0 && (
                    <div className="bg-white border border-gray-200 rounded-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Detected Claims</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-600 hover:text-gray-900"
                          onClick={() => navigate('/recoveries', { state: { filter: 'detected' } })}
                        >
                          View All
                        </Button>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Total</div>
                            <div className="text-xl font-light text-gray-900">{detectionStats.totalDetections}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Potential</div>
                            <div className="text-xl font-light text-gray-900">{formatCurrency(detectionStats.estimatedRecovery)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">High Conf.</div>
                            <div className="text-xl font-light text-gray-900">{detectionStats.highConfidence}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">Medium</div>
                            <div className="text-xl font-light text-gray-900">{detectionStats.mediumConfidence}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white border border-gray-200 rounded-sm">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Actions</h2>
                      <button
                        aria-label="Customize quick actions"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setQuickActionsEditOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedQuickActions.includes('connect_evidence') && (
                          <button
                            onClick={() => setShowSourcesModal(true)}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            Connect sources
                          </button>
                        )}
                        {selectedQuickActions.includes('review_high_conf') && (
                          <button
                            onClick={() => navigate('/recoveries', { state: { filter: 'high_confidence' } })}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-gray-400" />
                            High confidence
                          </button>
                        )}
                        {selectedQuickActions.includes('resolve_new') && (
                          <button
                            onClick={() => navigate('/recoveries', { state: { filter: 'new_pending' } })}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-gray-400" />
                            New opportunities
                          </button>
                        )}
                        {selectedQuickActions.includes('run_detector') && (
                          <button
                            onClick={async () => {
                              try { await api.post('/api/detections/run'); toast({ title: 'Detector started', description: 'Scanning...' }); }
                              catch (e: any) { toast({ title: 'Failed', description: e?.message || 'Try again.', variant: 'destructive' }); }
                            }}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                            Run detector
                          </button>
                        )}
                        {selectedQuickActions.includes('ingest_now') && (
                          <button
                            onClick={async () => {
                              const r = await api.startEvidenceIngest();
                              if ((r as any)?.ok) toast({ title: 'Started', description: 'Ingesting documents...' });
                              else toast({ title: 'Failed', description: (r as any)?.error || 'Try again.', variant: 'destructive' });
                            }}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Cloud className="h-3.5 w-3.5 text-gray-400" />
                            Ingest docs
                          </button>
                        )}
                        {selectedQuickActions.includes('smart_sync') && (
                          <button
                            onClick={() => navigate('/smart-inventory-sync')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
                            Inventory sync
                          </button>
                        )}
                        {selectedQuickActions.includes('upcoming_payments') && (
                          <button
                            onClick={() => navigate('/upcoming-payments')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <CircleDollarSign className="h-3.5 w-3.5 text-gray-400" />
                            Payments
                          </button>
                        )}
                        {selectedQuickActions.includes('export_history') && (
                          <button
                            onClick={() => navigate('/export-center')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5 text-gray-400" />
                            Export
                          </button>
                        )}
                        {selectedQuickActions.includes('evidence_locker') && (
                          <button
                            onClick={() => navigate('/evidence-locker')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                            Doc Locker
                          </button>
                        )}
                        {selectedQuickActions.includes('invite_teammate') && (
                          <button
                            onClick={() => setInviteOpen(true)}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Link2 className="h-3.5 w-3.5 text-gray-400" />
                            Invite teammate
                          </button>
                        )}
                        {selectedQuickActions.includes('configure_alerts') && (
                          <button
                            onClick={() => navigate('/notifications')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Bell className="h-3.5 w-3.5 text-gray-400" />
                            Alerts
                          </button>
                        )}
                        {selectedQuickActions.includes('security_setup') && (
                          <button
                            onClick={() => navigate('/settings')}
                            className="flex items-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                          >
                            <Shield className="h-3.5 w-3.5 text-gray-400" />
                            Security
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Logs - Right Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white border border-gray-200 rounded-sm h-full">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <h3 className="text-[10px] font-medium text-gray-900 uppercase tracking-[0.15em]">Recent Logs</h3>
                      {unreadCount > 0 && (
                        <span className="text-[9px] rounded px-1.5 py-0.5 bg-gray-900 text-white">
                          {unreadCount > 50 ? '50+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-5 w-5 mx-auto mb-2 text-gray-300" />
                          <p className="text-[10px] text-gray-400">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.slice(0, 10).map((notification) => {
                            const isUnread = notification.status !== 'read';
                            const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

                            return (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isUnread ? 'bg-gray-50' : ''}`}
                                onClick={() => navigate('/recoveries')}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs truncate ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                    {stripEmojis(notification.title)}
                                  </p>
                                  <span className="text-[10px] text-gray-400 shrink-0">
                                    {timeAgo.replace(' ago', '')}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                  {renderNotificationMessage(notification.message)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 p-3">
                      <button
                        onClick={() => navigate('/notifications')}
                        className="w-full text-center text-[10px] text-gray-500 hover:text-gray-700 py-1"
                      >
                        View all logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div >
      {/* Document Sources Modal */}
      <Dialog open={showSourcesModal} onOpenChange={setShowSourcesModal}>
        <DialogContent className="sm:max-w-xl bg-white border border-gray-200 rounded-sm p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <DialogTitle className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Connect Document Sources</DialogTitle>
            <DialogDescription className="text-[10px] text-gray-500 mt-0.5">
              Read-only access for document ingestion
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={async () => {
                  try {
                    setProviderLoading('gmail');
                    const r = await api.connectDocs('gmail');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Gmail connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'gmail'}
                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {providerLoading === 'gmail' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <img src={GmailIcon} alt="Gmail" className="h-8 w-8 object-contain" />
                )}
                <span className="text-xs font-medium text-gray-700">Gmail</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('outlook');
                    const r = await api.connectDocs('outlook');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Outlook connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'outlook'}
                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {providerLoading === 'outlook' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <img src={OutlookIcon} alt="Outlook" className="h-8 w-8 object-contain" />
                )}
                <span className="text-xs font-medium text-gray-700">Outlook</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('gdrive');
                    const r = await api.connectDocs('gdrive');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Google Drive connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'gdrive'}
                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {providerLoading === 'gdrive' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <img src={GoogleDriveIcon} alt="Google Drive" className="h-8 w-8 object-contain" />
                )}
                <span className="text-xs font-medium text-gray-700">Drive</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setProviderLoading('dropbox');
                    const r = await api.connectDocs('dropbox');
                    if (r.ok && r.data?.auth_url) {
                      window.location.href = r.data.auth_url;
                    } else {
                      toast({
                        title: 'Connection Failed',
                        description: r.error || 'Failed to initiate Dropbox connection.',
                        variant: 'destructive',
                      });
                      setProviderLoading(null);
                    }
                  } catch (error) {
                    toast({
                      title: 'Connection Failed',
                      description: 'An error occurred. Please try again.',
                      variant: 'destructive',
                    });
                    setProviderLoading(null);
                  }
                }}
                disabled={providerLoading === 'dropbox'}
                className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {providerLoading === 'dropbox' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  <img src={DropboxIcon} alt="Dropbox" className="h-8 w-8 object-contain" />
                )}
                <span className="text-xs font-medium text-gray-700">Dropbox</span>
              </button>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSourcesModal(false)}
              className="text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Quick Actions Editor */}
      <Dialog open={quickActionsEditOpen} onOpenChange={setQuickActionsEditOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-sm p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <DialogTitle className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Customize Quick Actions</DialogTitle>
            <DialogDescription className="text-[10px] text-gray-500 mt-0.5">Select which actions to show.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-3">
            {QUICK_ACTIONS.map(a => (
              <label key={a.id} className="flex items-center gap-2 text-xs text-gray-700">
                <Checkbox checked={selectedQuickActions.includes(a.id)} onCheckedChange={(c) => {
                  setSelectedQuickActions(prev => {
                    const next = new Set(prev);
                    if (c) next.add(a.id); else next.delete(a.id);
                    return Array.from(next);
                  });
                }} />
                {a.label}
              </label>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <button onClick={() => setQuickActionsEditOpen(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">Cancel</button>
            <button className="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors" onClick={() => { try { localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions)); toast({ title: 'Saved', description: 'Quick actions updated.' }); } catch { } setQuickActionsEditOpen(false); }}>Save</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm bg-white border border-gray-200 rounded-sm p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <DialogTitle className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Invite a Teammate</DialogTitle>
            <DialogDescription className="text-[10px] text-gray-500 mt-0.5">Send a read-only invite to finance/ops.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Input type="email" placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-9 text-xs border-gray-200 rounded-sm" />
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <button onClick={() => setInviteOpen(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">Cancel</button>
            <button className="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors" onClick={async () => { if (!inviteEmail) return; try { await api.post('/api/team/invite', { email: inviteEmail }); toast({ title: 'Invite sent', description: inviteEmail }); } catch (e: any) { toast({ title: 'Invite failed', description: e?.message || 'Please try again.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}>Send Invite</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sync Log Modal */}
      <SyncLogModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div >
  );
}
